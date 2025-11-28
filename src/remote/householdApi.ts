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

  // 1. 查找家庭
  const { data: household, error: hError } = await sb
    .from('households')
    .select('*')
    .eq('invite_code', inviteCode.trim().toLowerCase())
    .single()

  if (hError || !household) {
    throw new Error('邀请码无效或家庭不存在')
  }

  // 2. 检查是否已加入
  const { data: existing } = await sb
    .from('members')
    .select('id')
    .eq('user_id', userId)
    .eq('household_id', household.id)
    .single()

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

