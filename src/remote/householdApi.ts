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
    .insert({ 
      name,
      owner_id: userId 
    })
    .select()
    .single()

  if (hError || !household) {
    console.error('Create household error:', hError)
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
  
  // 优先尝试使用 RPC 函数（如果已创建）
  let household: any = null
  try {
    const { data: rpcData, error: rpcError } = await sb.rpc('find_household_by_invite_code', {
      invite_code_input: normalizedCode,
    })

    if (!rpcError && rpcData) {
      household = rpcData
    } else if (rpcError && !rpcError.message.includes('function') && !rpcError.message.includes('does not exist')) {
      // RPC 函数存在但执行失败
      throw rpcError
    }
  } catch (rpcError: any) {
    // RPC 函数不存在或执行失败，回退到直接查询
    console.log('RPC function not available or failed, using direct query', rpcError)
  }

  // 如果 RPC 函数不可用，使用直接查询
  if (!household) {
    // 先尝试精确匹配（如果数据库中的邀请码已经是小写）
    let { data, error: hError } = await sb
      .from('households')
      .select('*')
      .eq('invite_code', normalizedCode)
      .maybeSingle()

    household = data

    // 如果精确匹配失败，尝试不区分大小写查询
    if (hError || !household) {
      console.log('Exact match failed, trying case-insensitive search')
      const { data: allHouseholds, error: allError } = await sb
        .from('households')
        .select('*')
      
      if (allError) {
        console.error('Find household error:', allError)
        throw new Error(`查找家庭失败：${allError.message}`)
      }

      // 不区分大小写匹配
      household = allHouseholds?.find(
        (h) => h.invite_code?.toLowerCase() === normalizedCode
      )
    }
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
 * 更新家庭名称（只有 owner 可以更新）
 */
export const updateHousehold = async (
  userId: string,
  householdId: string,
  name: string,
): Promise<Household> => {
  const sb = ensure()

  // 1. 检查用户是否是 owner
  const { data: household, error: householdError } = await sb
    .from('households')
    .select('owner_id')
    .eq('id', householdId)
    .single()

  if (householdError || !household) {
    throw new Error('家庭不存在')
  }

  if (household.owner_id !== userId) {
    throw new Error('只有创建者可以修改家庭名称')
  }

  // 2. 更新家庭名称
  const { data: updated, error: updateError } = await sb
    .from('households')
    .update({ name: name.trim() })
    .eq('id', householdId)
    .select()
    .single()

  if (updateError) {
    if (updateError.message.includes('policy') || updateError.message.includes('permission') || updateError.message.includes('RLS')) {
      throw new Error('权限不足，无法修改家庭名称。请确保已执行最新的 SQL 配置')
    }
    throw new Error(updateError.message || '更新家庭名称失败')
  }

  return {
    id: updated.id,
    name: updated.name,
    inviteCode: updated.invite_code,
    createdAt: updated.created_at,
  }
}

/**
 * 删除家庭（只有 owner 可以删除）
 */
export const deleteHousehold = async (
  userId: string,
  householdId: string,
): Promise<void> => {
  const sb = ensure()

  // 1. 检查用户是否是 owner（直接检查 households.owner_id）
  const { data: household, error: householdError } = await sb
    .from('households')
    .select('owner_id')
    .eq('id', householdId)
    .single()

  if (householdError || !household) {
    throw new Error('家庭不存在')
  }

  if (household.owner_id !== userId) {
    throw new Error('只有创建者可以删除家庭')
  }

  // 2. 删除家庭（会级联删除所有成员和相关数据）
  // RLS 策略会确保只有 owner 可以删除
  const { error: deleteError } = await sb
    .from('households')
    .delete()
    .eq('id', householdId)

  if (deleteError) {
    // 如果是权限错误，提供更友好的提示
    if (deleteError.message.includes('policy') || deleteError.message.includes('permission') || deleteError.message.includes('RLS')) {
      throw new Error('权限不足，无法删除家庭。请确保已执行最新的 SQL 配置（包含删除策略）')
    }
    throw new Error(deleteError.message || '删除家庭失败')
  }
}

