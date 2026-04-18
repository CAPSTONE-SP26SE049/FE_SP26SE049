import type React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth, type Role } from './AuthContext'

interface ProtectedRouteProps {
  allowedRoles?: Role[]
  redirectTo?: string
}

/** Map mỗi role về trang home mặc định */
const ROLE_HOME: Record<Role, string> = {
  ADMIN: '/admin',
  EDUCATOR: '/educator',
  USER: '/learner/dashboard',
}

/**
 * ProtectedRoute – chặn truy cập dựa trên:
 * 1. Chưa xác thực  → redirect về /login (kèm state.from để sau login quay lại)
 * 2. Đã xác thực nhưng role không được phép → redirect về trang home của role đó
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  redirectTo,
}) => {
  const { isAuthenticated, session } = useAuth()
  const location = useLocation()

  // Chưa đăng nhập
  if (!isAuthenticated || !session) {
    return (
      <Navigate
        to={redirectTo ?? '/login'}
        replace
        state={{ from: location }}
      />
    )
  }

  // Đã đăng nhập nhưng không đúng role
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    const home = ROLE_HOME[session.user.role] ?? '/'
    return <Navigate to={redirectTo ?? home} replace />
  }

  return <Outlet />
}

/**
 * GuestRoute – dành cho các trang chỉ dành cho khách (login, register…).
 * Nếu đã đăng nhập → redirect về trang home của role.
 */
export const GuestRoute: React.FC = () => {
  const { isAuthenticated, session } = useAuth()

  if (isAuthenticated && session) {
    const home = ROLE_HOME[session.user.role] ?? '/'
    return <Navigate to={home} replace />
  }

  return <Outlet />
}
