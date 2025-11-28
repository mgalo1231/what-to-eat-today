import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { setHouseholdId as setDbHouseholdId } from '@/db/client'
import { pullAllToDexie } from '@/remote/initialSync'
import {
  getMyHouseholds,
  createHousehold as apiCreateHousehold,
  joinHouseholdByCode as apiJoinByCode,
} from '@/remote/householdApi'
import type { Household } from '@/types/entities'

export type AuthState = {
  userId?: string
  householdId?: string
  household?: Household
  households: Household[]
  loading: boolean
  // actions
  switchHousehold: (id: string) => void
  createHousehold: (name: string, displayName?: string) => Promise<Household>
  joinHousehold: (inviteCode: string, displayName?: string) => Promise<Household>
  refreshHouseholds: () => Promise<void>
}

const LOCAL_HOUSEHOLD_ID = 'local-family'

const AuthContext = createContext<AuthState>({
  userId: undefined,
  householdId: undefined,
  household: undefined,
  households: [],
  loading: false,
  switchHousehold: () => {},
  createHousehold: async () => {
    throw new Error('Not implemented')
  },
  joinHousehold: async () => {
    throw new Error('Not implemented')
  },
  refreshHouseholds: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const [households, setHouseholds] = useState<Household[]>([])
  const [currentHouseholdId, setCurrentHouseholdId] = useState<string | undefined>(
    undefined,
  )
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured)

  const currentHousehold = useMemo(
    () => households.find((h) => h.id === currentHouseholdId),
    [households, currentHouseholdId],
  )

  // 刷新用户所属家庭列表
  const refreshHouseholds = useCallback(async () => {
    if (!userId || !isSupabaseConfigured) return
    try {
      const list = await getMyHouseholds(userId)
      setHouseholds(list)
      // 如果当前没有选中家庭或选中的家庭不在列表中，自动选第一个
      if (list.length > 0) {
        const stillValid = list.some((h) => h.id === currentHouseholdId)
        if (!stillValid) {
          setCurrentHouseholdId(list[0].id)
          setDbHouseholdId(list[0].id)
          pullAllToDexie(list[0].id)
        }
      }
    } catch (e) {
      console.error('Failed to fetch households', e)
    }
  }, [userId, currentHouseholdId])

  // 切换家庭
  const switchHousehold = useCallback(
    (id: string) => {
      const target = households.find((h) => h.id === id)
      if (target) {
        setCurrentHouseholdId(id)
        setDbHouseholdId(id)
        pullAllToDexie(id)
      }
    },
    [households],
  )

  // 创建家庭
  const createHousehold = useCallback(
    async (name: string, displayName?: string) => {
      if (!userId) throw new Error('Not logged in')
      const household = await apiCreateHousehold(userId, name, displayName)
      setHouseholds((prev) => [...prev, household])
      setCurrentHouseholdId(household.id)
      setDbHouseholdId(household.id)
      return household
    },
    [userId],
  )

  // 加入家庭
  const joinHousehold = useCallback(
    async (inviteCode: string, displayName?: string) => {
      if (!userId) throw new Error('Not logged in')
      const household = await apiJoinByCode(userId, inviteCode, displayName)
      // 如果已在列表中就不重复添加
      setHouseholds((prev) => {
        if (prev.some((h) => h.id === household.id)) return prev
        return [...prev, household]
      })
      setCurrentHouseholdId(household.id)
      setDbHouseholdId(household.id)
      pullAllToDexie(household.id)
      return household
    },
    [userId],
  )

  const getOrCreateHouseholds = useCallback(
    async (uid: string) => {
      let list = await getMyHouseholds(uid)
      if (list.length === 0) {
        const defaultName = '我的家庭'
        const created = await apiCreateHousehold(uid, defaultName)
        list = [created]
      }
      return list
    },
    [],
  )

  // 初始化：获取 session 和家庭列表
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      // 离线模式
      setCurrentHouseholdId(LOCAL_HOUSEHOLD_ID)
      setDbHouseholdId(LOCAL_HOUSEHOLD_ID)
      setLoading(false)
      return
    }

    let mounted = true
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      const uid = data.session?.user?.id
      if (!mounted) return
      setUserId(uid)

      if (uid) {
        const list = await getOrCreateHouseholds(uid)
        if (!mounted) return
        setHouseholds(list)
        if (list.length > 0) {
          setCurrentHouseholdId(list[0].id)
          setDbHouseholdId(list[0].id)
          pullAllToDexie(list[0].id)
        } else {
          // 已登录但没有家庭，使用个人模式（本地存储）
          setCurrentHouseholdId(LOCAL_HOUSEHOLD_ID)
          setDbHouseholdId(LOCAL_HOUSEHOLD_ID)
        }
      } else {
        // 未登录，使用本地家庭
        setCurrentHouseholdId(LOCAL_HOUSEHOLD_ID)
        setDbHouseholdId(LOCAL_HOUSEHOLD_ID)
      }
      setLoading(false)
    })()

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const uid = session?.user?.id
      setUserId(uid)
      if (uid) {
        const list = await getOrCreateHouseholds(uid)
        setHouseholds(list)
        if (list.length > 0) {
          setCurrentHouseholdId(list[0].id)
          setDbHouseholdId(list[0].id)
          pullAllToDexie(list[0].id)
        } else {
          // 已登录但没有家庭，使用个人模式
          setCurrentHouseholdId(LOCAL_HOUSEHOLD_ID)
          setDbHouseholdId(LOCAL_HOUSEHOLD_ID)
        }
      } else {
        setHouseholds([])
        setCurrentHouseholdId(LOCAL_HOUSEHOLD_ID)
        setDbHouseholdId(LOCAL_HOUSEHOLD_ID)
      }
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [getOrCreateHouseholds])

  const value = useMemo<AuthState>(
    () => ({
      userId,
      householdId: currentHouseholdId,
      household: currentHousehold,
      households,
      loading,
      switchHousehold,
      createHousehold,
      joinHousehold,
      refreshHouseholds,
    }),
    [
      userId,
      currentHouseholdId,
      currentHousehold,
      households,
      loading,
      switchHousehold,
      createHousehold,
      joinHousehold,
      refreshHouseholds,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
