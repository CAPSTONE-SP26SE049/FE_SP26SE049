import type React from 'react'
import { createContext, useContext, useMemo, useState } from 'react'
import { jwtDecode } from 'jwt-decode'
import { loginAPI } from '../../services/mockAuthService'

export type Role = 'admin' | 'educator' | 'user'

export interface AuthUser {
  username: string
  email: string
  role: Role
  name: string
  userId: string
}

export interface AuthSession {
  token: string
  user: AuthUser
}

interface AuthContextValue {
  session: AuthSession | null
  isAuthenticated: boolean
  login: (identifier: string, password: string) => Promise<AuthSession>
  logout: () => void
}

interface JwtPayload {
  sub?: string
  email?: string
  role?: Role
  name?: string
  userId?: string
}

const SESSION_KEY = 'speakvn_session'
const ACCESS_TOKEN_KEY = 'ACCESS_TOKEN'
const USER_INFO_KEY = 'USER_INFO'

function readSessionFromStorage(): AuthSession | null {
  const raw = window.sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

function writeSessionToStorage(session: AuthSession | null) {
  if (!session) {
    window.sessionStorage.removeItem(SESSION_KEY)
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    window.sessionStorage.removeItem(USER_INFO_KEY)
    return
  }
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, session.token)
  window.sessionStorage.setItem(USER_INFO_KEY, JSON.stringify(session.user))
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
      isAuthenticated: Boolean(session?.token),
      login: async (identifier: string, password: string) => {
        const result = await loginAPI(identifier, password)

        const decoded = jwtDecode<JwtPayload>(result.token)
        const role: Role =
          decoded.role ?? (result.user.role as Role) ?? 'user'
        const userId = decoded.userId ?? decoded.sub ?? result.user.username

        const fullSession: AuthSession = {
          token: result.token,
          user: {
            username: result.user.username,
            email: result.user.email,
            name: result.user.name,
            role,
            userId,
          },
        }

        setSession(fullSession)
        writeSessionToStorage(fullSession)
        return fullSession
      },
      logout: () => {
        setSession(null)
        writeSessionToStorage(null)
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

