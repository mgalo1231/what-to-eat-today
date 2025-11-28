import { useState, useEffect } from 'react'
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
  Share2,
  X,
  Trash2,
  Edit2,
  Save,
} from 'lucide-react'
import type { FormEvent } from 'react'

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import { getHouseholdMembers } from '@/remote/householdApi'
import type { HouseholdMember } from '@/types/entities'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmDialog'

export const ProfilePage = () => {
  const navigate = useNavigate()
  const {
    userId,
    username,
    household,
    households,
    switchHousehold,
    createHousehold,
    updateHousehold,
    joinHousehold,
    deleteHousehold,
  } = useAuth()

  const [copied, setCopied] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [newHouseholdName, setNewHouseholdName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [showMembers, setShowMembers] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [editingHouseholdName, setEditingHouseholdName] = useState(false)
  const [householdNameInput, setHouseholdNameInput] = useState('')
  const { showToast } = useToast()
  const { confirm } = useConfirm()

  // 获取家庭成员列表
  useEffect(() => {
    if (household?.id && isSupabaseConfigured) {
      setLoadingMembers(true)
      getHouseholdMembers(household.id)
        .then(setMembers)
        .catch((err) => {
          console.error('Failed to load members', err)
        })
        .finally(() => setLoadingMembers(false))
    } else {
      setMembers([])
    }
  }, [household?.id, isSupabaseConfigured])

  const copyInviteCode = () => {
    if (household?.inviteCode) {
      navigator.clipboard.writeText(household.inviteCode)
      setCopied(true)
      showToast('邀请码已复制', 'success')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareInviteCode = async () => {
    if (!household?.inviteCode) return

    const shareText = `加入我的家庭"${household.name}"！\n邀请码：${household.inviteCode}\n\n在"今天吃什么"应用中输入邀请码即可加入。`

    if (navigator.share) {
      try {
        await navigator.share({
          title: '邀请加入家庭',
          text: shareText,
        })
        showToast('分享成功', 'success')
      } catch (err) {
        // 用户取消分享，不显示错误
        if ((err as Error).name !== 'AbortError') {
          copyInviteCode() // 降级到复制
        }
      }
    } else {
      copyInviteCode() // 不支持分享，降级到复制
    }
  }

  const handleSignOut = async () => {
    // 确认对话框
    const confirmed = await confirm({
      title: '退出登录',
      message: '确定要退出登录吗？退出后需要重新登录才能使用云端同步功能。',
      confirmText: '退出',
      danger: true,
    })

    if (!confirmed) return

    setLoading(true)
    try {
      // 1. 退出 Supabase 认证（如果已配置）
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.error('Sign out error:', error)
          // 即使 signOut 失败，也继续清理本地数据
        }
      }

      // 2. 清理本地存储
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch (e) {
        console.error('Clear storage error:', e)
      }

      // 3. 直接跳转到登录页（使用 window.location 确保完全重置）
      // 不等待，直接跳转，让页面完全重新加载
      window.location.href = window.location.origin + '/login'
    } catch (err) {
      console.error('Sign out error:', err)
      // 即使出错也尝试跳转
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch {}
      window.location.href = window.location.origin + '/login'
    }
  }

  const handleCreateHousehold = async (e: FormEvent) => {
    e.preventDefault()
    const name = newHouseholdName.trim()
    if (!name) {
      showToast('请输入家庭名称', 'error')
      return
    }
    setLoading(true)
    setStatus('')
    try {
      await createHousehold(name)
      setNewHouseholdName('')
      setShowCreateForm(false)
      showToast('家庭创建成功！', 'success')
      setStatus('')
    } catch (err) {
      const error = err as Error
      let message = '创建失败'
      if (error.message.includes('network') || error.message.includes('fetch')) {
        message = '网络错误，请检查网络连接后重试'
      } else if (error.message.includes('permission') || error.message.includes('policy')) {
        message = '权限不足，请确保已正确登录'
      } else {
        message = `创建失败：${error.message}`
      }
      showToast(message, 'error')
      setStatus(message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinHousehold = async (e: FormEvent) => {
    e.preventDefault()
    const code = inviteCode.trim().toLowerCase().replace(/\s/g, '')
    if (!code) {
      showToast('请输入邀请码', 'error')
      return
    }
    if (code.length !== 6) {
      showToast('邀请码应为 6 位字符', 'error')
      return
    }
    setLoading(true)
    setStatus('')
    try {
      await joinHousehold(code)
      setInviteCode('')
      setShowJoinForm(false)
      showToast('加入家庭成功！', 'success')
      setStatus('')
    } catch (err) {
      const error = err as Error
      console.error('Join household error:', error) // 输出完整错误到控制台
      let message = '加入失败'
      if (error.message.includes('无效') || error.message.includes('不存在') || error.message.includes('PGRST116')) {
        message = '邀请码无效，请检查后重试'
      } else if (error.message.includes('已经是') || error.message.includes('duplicate')) {
        message = '你已经是该家庭的成员'
      } else if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        message = '网络错误，请检查网络连接后重试'
      } else if (error.message.includes('policy') || error.message.includes('permission') || error.message.includes('RLS')) {
        message = '权限不足，请检查数据库 RLS 策略设置'
      } else {
        message = `加入失败：${error.message}`
      }
      showToast(message, 'error')
      setStatus(message)
    } finally {
      setLoading(false)
    }
  }

  const handleInviteCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toLowerCase().replace(/\s/g, '')
    // 限制为 6 位
    if (value.length > 6) {
      value = value.slice(0, 6)
    }
    setInviteCode(value)
  }

  // 检查用户是否是某个家庭的 owner
  // 注意：只对当前家庭准确，其他家庭会在删除时由 API 验证
  const isOwner = (householdId: string): boolean => {
    if (!userId || !householdId) return false
    // 如果是当前家庭，使用 members 列表判断
    if (householdId === household?.id) {
      if (members.length === 0) return false // 成员列表还没加载，不显示删除按钮
      const member = members.find((m) => m.householdId === householdId && m.userId === userId)
      return member?.role === 'owner'
    }
    // 对于其他家庭，暂时不显示删除按钮（需要加载该家庭的成员信息才能判断）
    // 用户可以在切换到该家庭后再删除
    return false
  }

  const handleEditHouseholdName = () => {
    if (household) {
      setHouseholdNameInput(household.name)
      setEditingHouseholdName(true)
    }
  }

  const handleSaveHouseholdName = async (e: FormEvent) => {
    e.preventDefault()
    if (!household) return

    const trimmedName = householdNameInput.trim()
    if (!trimmedName) {
      showToast('家庭名称不能为空', 'error')
      return
    }

    if (trimmedName === household.name) {
      setEditingHouseholdName(false)
      return
    }

    setLoading(true)
    try {
      await updateHousehold(household.id, trimmedName)
      showToast('家庭名称已更新', 'success')
      setEditingHouseholdName(false)
    } catch (err) {
      const error = err as Error
      let message = '更新失败'
      if (error.message.includes('只有创建者')) {
        message = '只有创建者可以修改家庭名称'
      } else {
        message = `更新失败：${error.message}`
      }
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEditHouseholdName = () => {
    setEditingHouseholdName(false)
    setHouseholdNameInput('')
  }

  const handleDeleteHousehold = async (householdId: string, householdName: string) => {
    const confirmed = await confirm({
      title: '删除家庭',
      message: `确定要删除家庭"${householdName}"吗？此操作不可恢复，所有家庭数据（菜谱、库存、购物清单等）将被永久删除。`,
      confirmText: '删除',
      danger: true,
    })

    if (!confirmed) return

    setLoading(true)
    try {
      await deleteHousehold(householdId)
      showToast('家庭已删除', 'success')
      // 刷新成员列表（如果当前家庭被删除，members 会清空）
      if (household?.id === householdId) {
        setMembers([])
      }
    } catch (err) {
      const error = err as Error
      let message = '删除失败'
      if (error.message.includes('只有创建者')) {
        message = '只有创建者可以删除家庭'
      } else if (error.message.includes('不是该家庭的成员')) {
        message = '你不是该家庭的成员'
      } else {
        message = `删除失败：${error.message}`
      }
      showToast(message, 'error')
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
            {userId ? (username || '已登录') : '未登录'}
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
        <section className="space-y-4 rounded-[24px] bg-gradient-to-br from-ios-primary to-ios-secondary p-4 text-white shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <h2 className="font-semibold">当前家庭</h2>
            </div>
            <div className="flex items-center gap-2">
              {isOwner(household.id) && !editingHouseholdName && (
                <button
                  onClick={handleEditHouseholdName}
                  className="rounded-full bg-white/20 p-2 transition-all hover:bg-white/30"
                  title="编辑家庭名称"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              )}
              {members.length > 0 && (
                <button
                  onClick={() => setShowMembers(!showMembers)}
                  className="text-sm text-white/80 underline"
                >
                  {showMembers ? '收起' : `${members.length} 位成员`}
                </button>
              )}
            </div>
          </div>
          {editingHouseholdName && isOwner(household.id) ? (
            <form onSubmit={handleSaveHouseholdName} className="space-y-2">
              <input
                type="text"
                value={householdNameInput}
                onChange={(e) => setHouseholdNameInput(e.target.value)}
                className="w-full rounded-xl border border-white/30 bg-white/20 px-4 py-2 text-2xl font-bold text-white placeholder-white/50 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                placeholder="输入家庭名称"
                autoFocus
                disabled={loading}
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={loading || !householdNameInput.trim()}
                  className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/30 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {loading ? '保存中...' : '保存'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEditHouseholdName}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/30 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  取消
                </button>
              </div>
            </form>
          ) : (
            <p className="text-2xl font-bold">{household.name}</p>
          )}

          {/* 邀请码区域 - 更醒目 */}
          <div className="space-y-2 rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white/90">邀请码</span>
              <div className="flex gap-2">
                <button
                  onClick={shareInviteCode}
                  className="rounded-full bg-white/20 p-2 transition-all hover:bg-white/30"
                  title="分享邀请码"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <button
                  onClick={copyInviteCode}
                  className="rounded-full bg-white/20 p-2 transition-all hover:bg-white/30"
                  title="复制邀请码"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <code className="block text-center text-3xl font-bold tracking-wider text-white">
              {household.inviteCode}
            </code>
          </div>

          {/* 成员列表 */}
          {showMembers && (
            <div className="space-y-2 rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
              {loadingMembers ? (
                <div className="py-2 text-center text-sm text-white/70">
                  加载中...
                </div>
              ) : members.length > 0 ? (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {member.displayName || '成员'}
                        </p>
                        <p className="text-xs text-white/60">
                          {member.role === 'owner' ? '创建者' : '成员'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-2 text-center text-sm text-white/70">
                  暂无成员
                </div>
              )}
            </div>
          )}

          <p className="text-sm text-white/70">
            分享邀请码给家人，一起管理菜谱和购物清单
          </p>

          {/* 删除家庭按钮（只有 owner 可见） */}
          {isOwner(household.id) && (
            <button
              onClick={() => handleDeleteHousehold(household.id, household.name)}
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/20 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {loading ? '删除中...' : '删除家庭'}
            </button>
          )}
        </section>
      )}

      {/* 切换家庭 */}
      {households.length > 1 && (
        <section className="space-y-3 rounded-[24px] bg-white p-4 shadow-card">
          <h2 className="flex items-center gap-2 font-semibold">
            <Settings className="h-5 w-5 text-ios-primary" />
            切换家庭
          </h2>
          <div className="space-y-2">
            {households.map((h) => (
              <div
                key={h.id}
                className="flex items-center gap-2 rounded-xl border border-ios-border p-2"
              >
                <button
                  onClick={() => switchHousehold(h.id)}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    h.id === household?.id
                      ? 'bg-ios-primary text-white'
                      : 'bg-ios-bg text-ios-text'
                  }`}
                >
                  {h.name}
                </button>
                {/* 只有 owner 可以删除 */}
                {isOwner(h.id) && (
                  <button
                    onClick={() => handleDeleteHousehold(h.id, h.name)}
                    disabled={loading}
                    className="rounded-full p-2 text-ios-danger transition-all hover:bg-ios-danger/10 disabled:opacity-50"
                    title="删除家庭"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
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
            <div className="space-y-1">
              <input
                type="text"
                placeholder="请输入 6 位邀请码"
                value={inviteCode}
                onChange={handleInviteCodeChange}
                maxLength={6}
                className="w-full rounded-2xl border border-ios-border px-4 py-3 font-mono text-center text-lg tracking-wider focus:border-ios-primary focus:outline-none focus:ring-2 focus:ring-ios-primary/20"
                autoFocus
              />
              <p className="text-xs text-ios-muted">
                {inviteCode.length}/6 位
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowJoinForm(false)
                  setInviteCode('')
                  setStatus('')
                }}
                className="flex-1 rounded-full border border-ios-border py-2 font-medium"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading || inviteCode.length !== 6}
                className="flex-1 rounded-full bg-ios-primary py-2 font-medium text-white disabled:opacity-50"
              >
                {loading ? '加入中...' : '加入'}
              </button>
            </div>
          </form>
        )}

        {status && (
          <div className="flex items-center justify-between rounded-xl bg-ios-danger/10 px-3 py-2 text-sm text-ios-danger">
            <span>{status}</span>
            <button
              onClick={() => setStatus('')}
              className="text-ios-danger/60 hover:text-ios-danger"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </section>

      {/* 没有家庭时的提示 */}
      {userId && households.length === 0 && (
        <div className="space-y-2 rounded-[20px] border border-dashed border-ios-border p-4 text-center text-sm text-ios-muted">
          <p className="font-medium">当前使用个人模式</p>
          <p>数据保存在本地。创建或加入家庭后，可与家人共享菜谱和购物清单。</p>
        </div>
      )}

      {/* 退出登录 */}
      {userId && (
        <button
          onClick={handleSignOut}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-[20px] border border-ios-danger/30 bg-ios-danger/5 py-4 font-semibold text-ios-danger disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-ios-danger border-t-transparent" />
              退出中...
            </>
          ) : (
            <>
              <LogOut className="h-5 w-5" />
              退出登录
            </>
          )}
        </button>
      )}
    </div>
  )
}

