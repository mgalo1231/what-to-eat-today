import { supabase, isSupabaseConfigured, supabaseSchema } from '@/lib/supabase'

const ensure = () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured')
  }
  return supabase.schema(supabaseSchema)
}

export type UserProfile = {
  id: string
  username: string
  createdAt: string
  updatedAt: string
}

/**
 * 获取用户资料
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const sb = ensure()
  const { data, error } = await sb
    .from('menuapp_user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('Get user profile error:', error)
    return null
  }

  if (!data) return null

  return {
    id: data.id,
    username: data.username,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * 创建或更新用户资料
 * 优先使用 RPC 函数（如果可用），否则使用直接插入
 */
export const upsertUserProfile = async (
  userId: string,
  username: string,
): Promise<UserProfile> => {
  const sb = ensure()

  // 先尝试使用 RPC 函数（如果已创建）
  try {
    const { data, error } = await sb.rpc('insert_user_profile', {
      user_id: userId,
      user_username: username.trim(),
    })

    if (error) {
      // 如果 RPC 函数不存在，继续使用直接插入
      if (error.message.includes('function') || error.message.includes('does not exist')) {
        console.log('RPC function not available, using direct insert')
      } else {
        throw error
      }
    } else if (data) {
      return {
        id: data.id,
        username: data.username,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }
    }
  } catch (rpcError) {
    // RPC 调用失败，继续使用直接插入
    console.log('RPC call failed, using direct insert', rpcError)
  }

  // 回退到直接插入（需要 session 已建立）
  // 检查用户名是否已被使用（排除当前用户）
  const { data: existing, error: checkError } = await sb
    .from('menuapp_user_profiles')
    .select('id')
    .eq('username', username)
    .neq('id', userId)
    .maybeSingle()

  if (checkError && checkError.code !== 'PGRST116') {
    throw new Error(`检查用户名失败：${checkError.message}`)
  }

  if (existing) {
    throw new Error('该用户名已被使用，请选择其他用户名')
  }

  // 创建或更新用户资料
  const { data, error } = await sb
    .from('menuapp_user_profiles')
    .upsert(
      {
        id: userId,
        username: username.trim(),
      },
      {
        onConflict: 'id',
      },
    )
    .select()
    .single()

  if (error) {
    console.error('Upsert user profile error:', error)
    if (error.code === '23505') {
      throw new Error('该用户名已被使用，请选择其他用户名')
    }
    throw new Error(`保存用户名失败：${error.message}`)
  }

  return {
    id: data.id,
    username: data.username,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

