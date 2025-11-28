import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Users,
  LogOut,
  Copy,
  Check,
  ChevronRight,
  Plus,
  Settings,
} from 'lucide-react'
import type { FormEvent } from 'react'

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'

export const ProfilePage = () => {
  const navigate = useNavigate()
  const {
    userId,
    household,
    households,
    switchHousehold,
    createHousehold,
    joinHousehold,
  } = useAuth()

  const [copied, setCopied] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [newHouseholdName, setNewHouseholdName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const copyInviteCode = () => {
    if (household?.inviteCode) {
      navigator.clipboard.writeText(household.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSignOut = async () => {
    if (!isSupabaseConfigured || !supabase) return
    await supabase.auth.signOut()
    navigate('/login')
  }

  const handleCreateHousehold = async (e: FormEvent) => {
    e.preventDefault()
    if (!newHouseholdName.trim()) return
    setLoading(true)
    try {
      await createHousehold(newHouseholdName.trim())
      setNewHouseholdName('')
      setShowCreateForm(false)
      setStatus('家庭创建成功！')
    } catch (err) {
      setStatus(`创建失败：${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinHousehold = async (e: FormEvent) => {
    e.preventDefault()
    if (!inviteCode.trim()) return
    setLoading(true)
    try {
      await joinHousehold(inviteCode.trim())
      setInviteCode('')
      setShowJoinForm(false)
      setStatus('加入家庭成功！')
    } catch (err) {
      setStatus(`加入失败：${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  // 生成头像背景色（基于 userId）
  const avatarColor = userId
    ? `hsl(${parseInt(userId.slice(0, 8), 16) % 360}, 70%, 60%)`
    : '#ccc'

  // 点击头部跳转登录
  const handleHeaderClick = () => {
    if (!userId) {
      navigate('/login')
    }
  }

  return (
    <div className="space-y-6">
      {/* 头部：头像和用户信息 */}
      <section
        onClick={handleHeaderClick}
        className={`flex items-center gap-4 rounded-[24px] bg-white p-4 shadow-card ${
          !userId ? 'cursor-pointer active:bg-gray-50' : ''
        }`}
      >
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white"
          style={{ backgroundColor: avatarColor }}
        >
          {userId ? <User className="h-8 w-8" /> : '?'}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">
            {userId ? '已登录' : '未登录'}
          </h1>
          {userId ? (
            household && (
              <p className="text-sm text-ios-muted">
                当前家庭：{household.name}
              </p>
            )
          ) : (
            <p className="text-sm text-ios-primary">点击登录账号</p>
          )}
        </div>
        <ChevronRight className="h-5 w-5 text-ios-muted" />
      </section>

      {/* 当前家庭 */}
      {household && (
        <section className="space-y-3 rounded-[24px] bg-gradient-to-br from-ios-primary to-ios-secondary p-4 text-white shadow-card">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <h2 className="font-semibold">当前家庭</h2>
          </div>
          <p className="text-2xl font-bold">{household.name}</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/80">邀请码：</span>
            <code className="rounded bg-white/20 px-2 py-1 font-mono text-sm">
              {household.inviteCode}
            </code>
            <button
              onClick={copyInviteCode}
              className="rounded-full bg-white/20 p-2"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-sm text-white/70">
            分享邀请码给家人，一起管理菜谱和购物清单
          </p>
        </section>
      )}

      {/* 切换家庭 */}
      {households.length > 1 && (
        <section className="space-y-3 rounded-[24px] bg-white p-4 shadow-card">
          <h2 className="flex items-center gap-2 font-semibold">
            <Settings className="h-5 w-5 text-ios-primary" />
            切换家庭
          </h2>
          <div className="flex flex-wrap gap-2">
            {households.map((h) => (
              <button
                key={h.id}
                onClick={() => switchHousehold(h.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  h.id === household?.id
                    ? 'bg-ios-primary text-white'
                    : 'bg-ios-bg text-ios-text'
                }`}
              >
                {h.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 家庭管理操作 */}
      <section className="space-y-3 rounded-[24px] bg-white p-4 shadow-card">
        <h2 className="flex items-center gap-2 font-semibold">
          <Users className="h-5 w-5 text-ios-primary" />
          家庭管理
        </h2>

        {/* 创建家庭 */}
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex w-full items-center gap-3 rounded-2xl bg-ios-bg px-4 py-3 text-left"
          >
            <Plus className="h-5 w-5 text-ios-primary" />
            <span>创建新家庭</span>
            <ChevronRight className="ml-auto h-5 w-5 text-ios-muted" />
          </button>
        ) : (
          <form onSubmit={handleCreateHousehold} className="space-y-2">
            <input
              type="text"
              placeholder="输入家庭名称"
              value={newHouseholdName}
              onChange={(e) => setNewHouseholdName(e.target.value)}
              className="w-full rounded-2xl border border-ios-border px-4 py-3"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex-1 rounded-full border border-ios-border py-2 font-medium"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-full bg-ios-primary py-2 font-medium text-white disabled:opacity-50"
              >
                {loading ? '创建中...' : '创建'}
              </button>
            </div>
          </form>
        )}

        {/* 加入家庭 */}
        {!showJoinForm ? (
          <button
            onClick={() => setShowJoinForm(true)}
            className="flex w-full items-center gap-3 rounded-2xl bg-ios-bg px-4 py-3 text-left"
          >
            <Users className="h-5 w-5 text-ios-primary" />
            <span>通过邀请码加入</span>
            <ChevronRight className="ml-auto h-5 w-5 text-ios-muted" />
          </button>
        ) : (
          <form onSubmit={handleJoinHousehold} className="space-y-2">
            <input
              type="text"
              placeholder="输入邀请码"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="w-full rounded-2xl border border-ios-border px-4 py-3"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowJoinForm(false)}
                className="flex-1 rounded-full border border-ios-border py-2 font-medium"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-full bg-ios-primary py-2 font-medium text-white disabled:opacity-50"
              >
                {loading ? '加入中...' : '加入'}
              </button>
            </div>
          </form>
        )}

        {status && (
          <p className="text-center text-sm text-ios-muted">{status}</p>
        )}
      </section>

      {/* 没有家庭时的提示 */}
      {userId && households.length === 0 && (
        <div className="rounded-[20px] border border-dashed border-ios-border p-4 text-center text-sm text-ios-muted">
          你还没有加入任何家庭，请先创建或加入一个家庭
        </div>
      )}

      {/* 退出登录 */}
      {userId && (
        <button
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-[20px] border border-ios-danger/30 bg-ios-danger/5 py-4 font-semibold text-ios-danger"
        >
          <LogOut className="h-5 w-5" />
          退出登录
        </button>
      )}
    </div>
  )
}

