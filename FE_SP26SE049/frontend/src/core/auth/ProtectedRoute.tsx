import type React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth, type Role } from './AuthContext'

interface ProtectedRouteProps {
  allowedRoles?: Role[]
  redirectTo?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  redirectTo = '/login',
}) => {
  const { isAuthenticated, session } = useAuth()
  const location = useLocation()

  if (!isAuthenticated || !session) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}

