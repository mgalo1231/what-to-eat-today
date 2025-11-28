import { supabase, isSupabaseConfigured, supabaseSchema } from '@/lib/supabase'
import type { Household, HouseholdMember } from '@/types/entities'

const ensure = () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured')
  }
  return supabase.schema(supabaseSchema)
}

/**
 * 获取当前用户所属的所有家庭
 */
export const getMyHouseholds = async (userId: string): Promise<Household[]> => {
  const sb = ensure()
  const { data: members } = await sb
    .from('members')
    .select('household_id')
    .eq('user_id', userId)

  if (!members || members.length === 0) return []

  const householdIds = members.map((m) => m.household_id)
  const { data: households } = await sb
    .from('households')
    .select('*')
    .in('id', householdIds)

  return (households || []).map((h) => ({
    id: h.id,
    name: h.name,
    inviteCode: h.invite_code,
    createdAt: h.created_at,
  }))
}

/**
 * 创建新家庭并将当前用户设为 owner
 */
export const createHousehold = async (
  userId: string,
  name: string,
  _displayName?: string, // 暂时未使用，保留以保持 API 兼容性
): Promise<Household> => {
  const sb = ensure()

  // 1. 创建家庭
  const { data: household, error: hError } = await sb
    .from('households')
    .insert({ name })
    .select()
    .single()

  if (hError || !household) {
    throw new Error(hError?.message || 'Failed to create household')
  }

  // 2. 将用户加入为 owner
  // 注意：如果 members 表没有 display_name 字段，请确保执行了正确的 SQL 建表脚本
  const { error: mError } = await sb.from('members').insert({
    user_id: userId,
    household_id: household.id,
    role: 'owner',
    // display_name 字段是可选的，如果表中有该字段可以添加：
    // display_name: displayName || null,
  })

  if (mError) {
    // 回滚：删除刚创建的家庭
    await sb.from('households').delete().eq('id', household.id)
    throw new Error(mError.message)
  }

  return {
    id: household.id,
    name: household.name,
    inviteCode: household.invite_code,
    createdAt: household.created_at,
  }
}

/**
 * 通过邀请码加入家庭
 */
export const joinHouseholdByCode = async (
  userId: string,
  inviteCode: string,
  _displayName?: string, // 暂时未使用，保留以保持 API 兼容性
): Promise<Household> => {
  const sb = ensure()

  // 1. 查找家庭（邀请码不区分大小写）
  const normalizedCode = inviteCode.trim().toLowerCase()
  const { data: household, error: hError } = await sb
    .from('households')
    .select('*')
    .eq('invite_code', normalizedCode)
    .single()

  if (hError) {
    console.error('Find household error:', hError)
    if (hError.code === 'PGRST116') {
      throw new Error('邀请码无效或家庭不存在')
    }
    throw new Error(`查找家庭失败：${hError.message}`)
  }

  if (!household) {
    throw new Error('邀请码无效或家庭不存在')
  }

  // 2. 检查是否已加入
  const { data: existing, error: checkError } = await sb
    .from('members')
    .select('id')
    .eq('user_id', userId)
    .eq('household_id', household.id)
    .maybeSingle() // 使用 maybeSingle 避免找不到记录时报错

  if (checkError && checkError.code !== 'PGRST116') {
    // PGRST116 表示没找到记录，这是正常的
    console.error('Check existing member error:', checkError)
  }

  if (existing) {
    // 已经是成员，直接返回
    return {
      id: household.id,
      name: household.name,
      inviteCode: household.invite_code,
      createdAt: household.created_at,
    }
  }

  // 3. 加入家庭
  // 注意：如果 members 表没有 display_name 字段，请确保执行了正确的 SQL 建表脚本
  const { error: mError } = await sb.from('members').insert({
    user_id: userId,
    household_id: household.id,
    role: 'member',
    // display_name 字段是可选的，如果表中有该字段可以添加：
    // display_name: displayName || null,
  })

  if (mError) {
    console.error('Insert member error:', mError)
    if (mError.code === '23505') {
      // 唯一约束违反，说明已经是成员了
      throw new Error('你已经是该家庭的成员')
    } else if (mError.message.includes('policy') || mError.message.includes('permission') || mError.message.includes('RLS')) {
      throw new Error('权限不足，无法加入家庭。请检查数据库 RLS 策略设置')
    }
    throw new Error(`加入失败：${mError.message}`)
  }

  return {
    id: household.id,
    name: household.name,
    inviteCode: household.invite_code,
    createdAt: household.created_at,
  }
}

/**
 * 获取家庭成员列表
 */
export const getHouseholdMembers = async (
  householdId: string,
): Promise<HouseholdMember[]> => {
  const sb = ensure()
  const { data } = await sb
    .from('members')
    .select('*')
    .eq('household_id', householdId)

  return (data || []).map((m) => ({
    id: m.id,
    userId: m.user_id,
    householdId: m.household_id,
    displayName: m.display_name,
    role: m.role,
    createdAt: m.created_at,
  }))
}

/**
 * 退出家庭
 */
export const leaveHousehold = async (
  userId: string,
  householdId: string,
): Promise<void> => {
  const sb = ensure()
  await sb
    .from('members')
    .delete()
    .eq('user_id', userId)
    .eq('household_id', householdId)
}

/**
 * 删除家庭（只有 owner 可以删除）
 */
export const deleteHousehold = async (
  userId: string,
  householdId: string,
): Promise<void> => {
  const sb = ensure()

  // 1. 检查用户是否是 owner
  const { data: member, error: memberError } = await sb
    .from('members')
    .select('role')
    .eq('user_id', userId)
    .eq('household_id', householdId)
    .single()

  if (memberError || !member) {
    throw new Error('你不是该家庭的成员')
  }

  if (member.role !== 'owner') {
    throw new Error('只有创建者可以删除家庭')
  }

  // 2. 删除家庭（会级联删除所有成员和相关数据）
  const { error: deleteError } = await sb
    .from('households')
    .delete()
    .eq('id', householdId)

  if (deleteError) {
    throw new Error(deleteError.message || '删除家庭失败')
  }
}

