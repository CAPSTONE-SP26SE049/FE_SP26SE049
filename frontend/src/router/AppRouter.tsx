import type React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from '../modules/public/pages/HomePage'
import Login from '../apps/auth/Login'
import Register from '../apps/auth/Register'
import EducatorLayout from '../modules/educator/components/EducatorLayout'
import DashboardPage from '../modules/educator/pages/DashboardPage'
import RoadmapManager from '../modules/educator/pages/RoadmapManager'
import AssessmentMatrix from '../modules/educator/pages/AssessmentMatrix'
import StudentAnalyticsPage from '../modules/educator/pages/StudentAnalyticsPage'
import SettingsPage from '../modules/educator/pages/SettingsPage'
import AdminDashboardPage from '../modules/admin/pages/AdminDashboardPage'
import RoadmapPage from '../modules/learner/pages/RoadmapPage'
import { ProtectedRoute } from '../core/auth/ProtectedRoute'

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin protected area */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Route>

        {/* Educator protected area */}
        <Route element={<ProtectedRoute allowedRoles={['educator']} />}>
          <Route path="/educator" element={<EducatorLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="roadmap" element={<RoadmapManager />} />
            <Route path="matrix" element={<AssessmentMatrix />} />
            <Route path="analytics" element={<StudentAnalyticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* User/Learner protected area (nếu cần pages riêng) */}
        <Route element={<ProtectedRoute allowedRoles={['user']} />}>
          <Route path="/learner">
            <Route path="roadmap" element={<RoadmapPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

