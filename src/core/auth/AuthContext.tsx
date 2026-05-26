import type React from 'react'
import { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { loginAPI, logoutAPI, socialLoginAPI } from '../../services/authService'
import apiClient from '../../services/apiClient'

export type Role = 'USER' | 'ADMIN' | 'EDUCATOR'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: Role
  region: string
  hasDoneEntryTest?: boolean
  avatar: string
  phone?: string
  phoneNumber?: string
  streak?: number
  totalXp?: number
  totalStars?: number
  totalExperience?: number
  completedLessons?: number
  createdAt?: string
}


export interface AuthSession {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

interface AuthContextValue {
  session: AuthSession | null
  isAuthenticated: boolean
  login: (email: string, password: string, remember?: boolean) => Promise<AuthSession>
  socialLogin: (provider: string, token: string) => Promise<AuthSession>
  logout: () => Promise<void>
  updateSessionItem: (data: Partial<AuthUser>) => void
  refreshUserProfile: () => Promise<void>
}

const SESSION_KEY = 'speakvn_session'
const ACCESS_TOKEN_KEY = 'ACCESS_TOKEN'
const REFRESH_TOKEN_KEY = 'REFRESH_TOKEN'
const USER_INFO_KEY = 'USER_INFO'

function readSessionFromStorage(): AuthSession | null {
  const raw = window.sessionStorage.getItem(SESSION_KEY) || window.localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

function writeSessionToStorage(session: AuthSession | null, remember: boolean = false) {
  const storage = remember ? window.localStorage : window.sessionStorage;
  const otherStorage = remember ? window.sessionStorage : window.localStorage;

  if (!session) {
    storage.removeItem(SESSION_KEY)
    storage.removeItem(ACCESS_TOKEN_KEY)
    storage.removeItem(REFRESH_TOKEN_KEY)
    storage.removeItem(USER_INFO_KEY)
    otherStorage.removeItem(SESSION_KEY)
    otherStorage.removeItem(ACCESS_TOKEN_KEY)
    otherStorage.removeItem(REFRESH_TOKEN_KEY)
    otherStorage.removeItem(USER_INFO_KEY)
    return
  }

  storage.setItem(SESSION_KEY, JSON.stringify(session))
  storage.setItem(ACCESS_TOKEN_KEY, session.accessToken)
  storage.setItem(REFRESH_TOKEN_KEY, session.refreshToken)
  storage.setItem(USER_INFO_KEY, JSON.stringify(session.user))

  otherStorage.removeItem(SESSION_KEY)
  otherStorage.removeItem(ACCESS_TOKEN_KEY)
  otherStorage.removeItem(REFRESH_TOKEN_KEY)
  otherStorage.removeItem(USER_INFO_KEY)
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<AuthSession | null>(() =>
    readSessionFromStorage(),
  )

  useEffect(() => {
    const handleSessionRefreshed = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { accessToken, refreshToken } = customEvent.detail;
      setSession((prevSession) => {
        if (!prevSession) return null;
        return {
          ...prevSession,
          accessToken,
          refreshToken: refreshToken || prevSession.refreshToken,
        };
      });
    };

    window.addEventListener('session-refreshed', handleSessionRefreshed);
    return () => {
      window.removeEventListener('session-refreshed', handleSessionRefreshed);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session?.accessToken),
      login: async (email: string, password: string, remember: boolean = false) => {
        // Gọi API login thật từ authService
        const result: any = await loginAPI(email, password)
        const data = result.data ?? result

        const fullSession: AuthSession = {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: {
            id: data.user.id,
            email: data.user.email,
            fullName: data.user.fullName,
            role: data.user.role as Role,
            region: data.user.region,
            hasDoneEntryTest: Boolean(data.user.hasDoneEntryTest),
            avatar: data.user.avatar_url || data.user.avatar,
            phone: data.user.phone,
            phoneNumber: data.user.phoneNumber || data.user.phone,
            streak: data.user.currentStreakDays ?? 0,
            totalStars: data.user.totalStars ?? 0,
            totalExperience: data.user.totalExperience ?? 0,
            totalXp: data.user.totalExperience ?? 0,
          },

        }

        setSession(fullSession)
        writeSessionToStorage(fullSession, remember)
        return fullSession
      },
      socialLogin: async (provider: string, token: string) => {
        const result: any = await socialLoginAPI(provider, token)
        const data = result.data ?? result

        const fullSession: AuthSession = {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: {
            id: data.user.id,
            email: data.user.email,
            fullName: data.user.fullName,
            role: data.user.role as Role,
            region: data.user.region,
            hasDoneEntryTest: Boolean(data.user.hasDoneEntryTest),
            avatar: data.user.avatar_url || data.user.avatar,
            streak: data.user.currentStreakDays ?? 0,
            totalStars: data.user.totalStars ?? 0,
            totalExperience: data.user.totalExperience ?? 0,
            totalXp: data.user.totalExperience ?? 0,
          },

        }

        setSession(fullSession)
        writeSessionToStorage(fullSession, true) // Always remember for social login
        return fullSession
      },
      logout: async () => {
        try {
          const raw = window.sessionStorage.getItem(SESSION_KEY) || window.localStorage.getItem(SESSION_KEY)
          if (raw) {
            const sessionData = JSON.parse(raw) as AuthSession
            const token = sessionData.refreshToken || window.sessionStorage.getItem(REFRESH_TOKEN_KEY)
            if (token) {
              await logoutAPI(token)
            }
          }
        } catch (error) {
          console.error('Logout API error:', error)
        } finally {
          setSession(null)
          writeSessionToStorage(null, false)
          window.location.href = '/login'
        }
      },
      updateSessionItem: (data: Partial<AuthUser>) => {
        if (session) {
          const newSession = {
            ...session,
            user: { ...session.user, ...data }
          }
          setSession(newSession)
          const isRemembered = window.localStorage.getItem(SESSION_KEY) !== null
          writeSessionToStorage(newSession, isRemembered)
        }
      },
      refreshUserProfile: async () => {
        const result: Record<string, unknown> | { data?: Record<string, unknown> } =
          await apiClient.get('/users/me')
        const profile = result.data ?? result
        if (!profile) return
        setSession((prev) => {
          if (!prev) return prev
          const newSession: AuthSession = {
            ...prev,
            user: {
              ...prev.user,
              region: (profile.region as string) ?? prev.user.region,
              hasDoneEntryTest: Boolean(profile.hasDoneEntryTest ?? prev.user.hasDoneEntryTest),
              fullName: (profile.fullName as string) ?? prev.user.fullName,
              avatar: (profile.avatar_url as string) ?? (profile.avatarUrl as string) ?? prev.user.avatar,
            },
          }
          const isRemembered = window.localStorage.getItem(SESSION_KEY) !== null
          writeSessionToStorage(newSession, isRemembered)
          return newSession
        })
      },
    }),
    [session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
