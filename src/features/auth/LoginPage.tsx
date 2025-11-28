import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from './AuthContext'
import { ChefHat, Mail, ArrowRight } from 'lucide-react'

export const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { userId, loading } = useAuth()

  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<string>('')
  const [sending, setSending] = useState(false)

  // 如果已登录，跳转到之前的页面或首页
  useEffect(() => {
    if (!loading && userId) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/today'
      navigate(from, { replace: true })
    }
  }, [userId, loading, navigate, location])

  const sendMagicLink = async (event: FormEvent) => {
    event.preventDefault()
    if (!isSupabaseConfigured || !supabase) {
      setStatus('未配置 Supabase，无法登录。请设置环境变量后重试。')
      return
    }
    setSending(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    setSending(false)
    setStatus(error ? `发送失败：${error.message}` : '已发送登录链接，请查收邮箱 📬')
  }

  // 离线模式直接进入
  const enterOfflineMode = () => {
    navigate('/today')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ios-bg">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-ios-primary border-t-transparent" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ios-bg">
      {/* 手机容器 */}
      <div className="flex min-h-screen w-full max-w-md flex-col bg-gradient-to-b from-ios-primary/10 to-ios-bg shadow-2xl md:my-8 md:min-h-0 md:rounded-[40px]">
        {/* 顶部装饰 */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          {/* Logo */}
          <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-ios-primary to-ios-secondary shadow-lg">
            <ChefHat className="h-12 w-12 text-white" />
          </div>

          <h1 className="mb-2 text-3xl font-bold text-ios-text">菜单家</h1>
          <p className="mb-8 text-center text-ios-muted">
            和家人一起管理菜谱、库存和购物清单
          </p>

          {/* 登录表单 */}
          <div className="w-full max-w-sm space-y-4">
            <form onSubmit={sendMagicLink} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ios-muted" />
                <input
                  required
                  type="email"
                  placeholder="输入邮箱地址"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-ios-border bg-white py-4 pl-12 pr-4 text-lg focus:border-ios-primary focus:outline-none focus:ring-2 focus:ring-ios-primary/20"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ios-primary py-4 text-lg font-semibold text-white shadow-lg shadow-ios-primary/30 transition-all hover:shadow-xl disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    发送中...
                  </>
                ) : (
                  <>
                    发送登录链接
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            {status && (
              <div className="rounded-2xl bg-white p-4 text-center text-sm text-ios-muted shadow-card">
                {status}
              </div>
            )}

            <p className="text-center text-sm text-ios-muted">
              无需密码，我们会发送一封包含登录链接的邮件
            </p>
          </div>
        </div>

        {/* 底部：离线模式入口 */}
        {!isSupabaseConfigured && (
          <div className="px-6 pb-8">
            <button
              onClick={enterOfflineMode}
              className="w-full rounded-2xl border border-ios-border bg-white py-4 font-medium text-ios-text"
            >
              离线模式体验
            </button>
            <p className="mt-2 text-center text-xs text-ios-muted">
              未配置云端，数据仅保存在本地
            </p>
          </div>
        )}

        {isSupabaseConfigured && (
          <div className="px-6 pb-8">
            <button
              onClick={enterOfflineMode}
              className="w-full rounded-2xl border border-ios-border bg-white py-3 text-sm font-medium text-ios-muted"
            >
              暂不登录，先体验一下
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
