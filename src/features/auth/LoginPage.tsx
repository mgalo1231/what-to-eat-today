import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from './AuthContext'
import { Mail, ArrowRight } from 'lucide-react'

export const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { userId, loading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [status, setStatus] = useState<string>('')
  const [sending, setSending] = useState(false)

  // 如果已登录，跳转到之前的页面或首页
  useEffect(() => {
    if (!loading && userId) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/today'
      navigate(from, { replace: true })
    }
  }, [userId, loading, navigate, location])

  // 邮箱 + 密码 登录 / 注册
  const handleEmailPassword = async (event: FormEvent) => {
    event.preventDefault()
    if (!isSupabaseConfigured || !supabase) {
      setStatus('未配置 Supabase，无法登录。请设置环境变量后重试。')
      return
    }
    setSending(true)
    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        setStatus('登录成功，正在进入...')
        navigate('/today', { replace: true })
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) throw error
        setStatus('注册成功，如需邮箱验证请前往邮箱完成验证。')
      }
    } catch (err) {
      setStatus(`失败：${(err as Error).message}`)
    } finally {
      setSending(false)
    }
  }

  // 离线模式直接进入
  const enterOfflineMode = () => {
    try {
      localStorage.setItem('offline', '1')
      localStorage.setItem('offlineMode', '1')
    } catch {}
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
          <img 
            src="/icon.png" 
            alt="今天吃什么" 
            className="mb-8 h-28 w-28 rounded-[28px] shadow-lg"
          />

<h1 className="mb-2 text-3xl font-bold text-ios-text">今天吃什么</h1>
        <p className="mb-8 text-center text-ios-muted">
          和家人一起规划每日美食
        </p>

          {/* 登录表单 */}
          <div className="w-full max-w-sm space-y-4">
            {/* 切换登录/注册 */}
            <div className="flex justify-center gap-4 text-sm">
              <button
                type="button"
                className={`btn-press rounded-full px-4 py-1 ${authMode === 'login' ? 'bg-ios-primary text-white' : 'bg-white text-ios-text border border-ios-border'}`}
                onClick={() => setAuthMode('login')}
              >
                账号登录
              </button>
              <button
                type="button"
                className={`btn-press rounded-full px-4 py-1 ${authMode === 'signup' ? 'bg-ios-primary text-white' : 'bg-white text-ios-text border border-ios-border'}`}
                onClick={() => setAuthMode('signup')}
              >
                注册新账号
              </button>
            </div>

            <form onSubmit={handleEmailPassword} className="space-y-3">
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
              <div>
                <input
                  required
                  type="password"
                  placeholder="输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-ios-border bg-white px-4 py-4 text-lg focus:border-ios-primary focus:outline-none focus:ring-2 focus:ring-ios-primary/20"
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
                    处理中...
                  </>
                ) : (
                  <>
                    {authMode === 'login' ? '登录' : '注册'}
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
              {authMode === 'login'
                ? '还没有账号？点击上方“注册新账号”'
                : '已有账号？点击上方“账号登录”'}
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
