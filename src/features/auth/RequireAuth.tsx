import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { isSupabaseConfigured } from '@/lib/supabase'

type Props = {
  children: React.ReactNode
}

export const RequireAuth = ({ children }: Props) => {
  const { userId, loading, householdId } = useAuth()
  const location = useLocation()

  // 如果没配置 Supabase，直接放行（离线模式）
  if (!isSupabaseConfigured) {
    return <>{children}</>
  }

  // 加载中显示 loading
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ios-bg">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-ios-primary border-t-transparent" />
          <p className="mt-4 text-ios-muted">加载中...</p>
        </div>
      </div>
    )
  }

  // 未登录，跳转到登录页
  if (!userId) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 已登录但没有家庭，跳转到个人页面创建/加入家庭
  if (!householdId && location.pathname !== '/profile') {
    return <Navigate to="/profile" replace />
  }

  return <>{children}</>
}

