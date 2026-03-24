import type React from 'react'
import { createContext, useContext, useMemo, useState } from 'react'
import { loginAPI, logoutAPI, socialLoginAPI } from '../../services/authService'

export type Role = 'USER' | 'ADMIN' | 'EDUCATOR'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: Role
  region: string
  avatar: string
  phone?: string
  phoneNumber?: string
  streak?: number
  totalXp?: number
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
  updateSession: (updatedUser: Partial<AuthUser>) => void
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
            avatar: data.user.avatar,
            phone: data.user.phone,
            phoneNumber: data.user.phoneNumber || data.user.phone,
            streak: data.user.currentStreakDays ?? 0,
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
            avatar: data.user.avatar,
            streak: data.user.currentStreakDays ?? 0,
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
      updateSession: (updatedUser: Partial<AuthUser>) => {
        if (!session) return
        const newSession: AuthSession = {
          ...session,
          user: { ...session.user, ...updatedUser },
        }
        setSession(newSession)
        // Persist to the correct storage
        const isLocal = window.localStorage.getItem(SESSION_KEY) !== null
        writeSessionToStorage(newSession, isLocal)
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

