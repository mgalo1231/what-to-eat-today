import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from './AuthContext'
import { upsertUserProfile } from '@/remote/userProfileApi'
import { Mail, ArrowRight, User } from 'lucide-react'

export const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { userId, loading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
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
        try {
          localStorage.removeItem('offline')
          localStorage.removeItem('offlineMode')
        } catch {}
        setStatus('登录成功，正在进入...')
        navigate('/today', { replace: true })
      } else {
        // 注册时验证用户名
        const trimmedUsername = username.trim()
        if (!trimmedUsername) {
          setStatus('请输入用户名')
          return
        }
        if (trimmedUsername.length < 2 || trimmedUsername.length > 20) {
          setStatus('用户名长度应在 2-20 个字符之间')
          return
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) throw error

        // 如果注册成功且有用户 ID，保存用户名
        if (data.user?.id) {
          try {
            // 等待一下，确保 session 建立
            await new Promise((resolve) => setTimeout(resolve, 500))
            
            // 再次检查 session
            const { data: sessionData } = await supabase.auth.getSession()
            if (sessionData.session) {
              // Session 已建立，可以保存用户名
              await upsertUserProfile(data.user.id, trimmedUsername)
              setStatus('注册成功！用户名已保存。如需邮箱验证请前往邮箱完成验证。')
            } else {
              // Session 未建立（可能需要邮箱验证），先保存用户名到 localStorage，等登录后再保存
              try {
                localStorage.setItem('pending_username', trimmedUsername)
                localStorage.setItem('pending_user_id', data.user.id)
                setStatus('注册成功！请在邮箱中完成验证后登录，用户名将在登录时自动保存。')
              } catch (e) {
                setStatus('注册成功，但无法保存用户名。请在登录后到个人资料页面设置用户名。')
              }
            }
          } catch (profileError) {
            console.error('Failed to save username', profileError)
            // 如果保存失败，先存到 localStorage，等登录后再保存
            try {
              localStorage.setItem('pending_username', trimmedUsername)
              localStorage.setItem('pending_user_id', data.user.id)
              setStatus('注册成功！用户名将在登录时自动保存。如需邮箱验证请前往邮箱完成验证。')
            } catch (e) {
              setStatus(`注册成功，但保存用户名失败：${(profileError as Error).message}。请在登录后到个人资料页面设置用户名。`)
            }
          }
        } else {
          setStatus('注册成功，如需邮箱验证请前往邮箱完成验证。')
        }
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
                onClick={() => {
                  setAuthMode('login')
                  setUsername('')
                }}
              >
                账号登录
              </button>
              <button
                type="button"
                className={`btn-press rounded-full px-4 py-1 ${authMode === 'signup' ? 'bg-ios-primary text-white' : 'bg-white text-ios-text border border-ios-border'}`}
                onClick={() => {
                  setAuthMode('signup')
                  setUsername('')
                }}
              >
                注册新账号
              </button>
            </div>

            <form onSubmit={handleEmailPassword} className="space-y-3">
              {authMode === 'signup' && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ios-muted" />
                  <input
                    required={authMode === 'signup'}
                    type="text"
                    placeholder="输入用户名（2-20个字符）"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    minLength={2}
                    maxLength={20}
                    className="w-full rounded-2xl border border-ios-border bg-white py-4 pl-12 pr-4 text-lg focus:border-ios-primary focus:outline-none focus:ring-2 focus:ring-ios-primary/20"
                  />
                </div>
              )}
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
