import type React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from '../modules/public/pages/HomePage'
import Login from '../apps/auth/Login'
import Register from '../apps/auth/Register'
import VerifyEmail from '../apps/auth/VerifyEmail'
import ForgotPassword from '../apps/auth/ForgotPassword'
import ResetPassword from '../apps/auth/ResetPassword'
import FacebookCallback from '../apps/auth/FacebookCallback'
import EducatorLayout from '../modules/educator/components/EducatorLayout'
import DashboardPage from '../modules/educator/pages/DashboardPage'
import RoadmapManager from '../modules/educator/pages/RoadmapManager'
import AssessmentMatrix from '../modules/educator/pages/AssessmentMatrix'
import StudentAnalyticsPage from '../modules/educator/pages/StudentAnalyticsPage'
import SettingsPage from '../modules/educator/pages/SettingsPage'
import ClassroomManagementPage from '../modules/educator/pages/ClassroomManagementPage'
import StudentManagementPage from '../modules/educator/pages/StudentManagementPage'
import ChallengeBankPage from '../modules/educator/pages/ChallengeBankPage'
import ChapterManagementPage from '../modules/educator/pages/ChapterManagementPage'
import QuizManagementPage from '../modules/educator/pages/QuizManagementPage'
import AdminDashboardPage from '../modules/admin/pages/AdminDashboardPage'
import AdminLayout from '../modules/admin/components/AdminLayout'
import UserManagementPage from '../modules/admin/pages/UserManagementPage'
import ContentApprovalPage from '../modules/admin/pages/ContentApprovalPage'
import AdminSettingsPage from '../modules/admin/pages/SettingsPage'
import RewardManagementPage from '../modules/admin/pages/RewardManagementPage'
import RoadmapPage from '../modules/learner/pages/RoadmapPage'
import LearnerLayout from '../modules/learner/components/LearnerLayout'
import LearnerDashboardPage from '../modules/learner/pages/LearnerDashboardPage'
import ProfilePage from '../modules/learner/pages/ProfilePage'
import { ProtectedRoute } from '../core/auth/ProtectedRoute'

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/auth/facebook/callback" element={<FacebookCallback />} />

      {/* Admin protected area */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="approvals" element={<ContentApprovalPage />} />
          <Route path="rewards" element={<RewardManagementPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
      </Route>

      {/* Educator protected area */}
      <Route element={<ProtectedRoute allowedRoles={['EDUCATOR']} />}>
        <Route path="/educator" element={<EducatorLayout />}>
          {/* <Route path="/educator" element={<div>Educator Layout Placeholder</div>}> */}
          <Route index element={<DashboardPage />} />
          <Route path="classrooms" element={<ClassroomManagementPage />} />
          <Route path="classrooms/:classId/students" element={<StudentManagementPage />} />
          <Route path="students" element={<StudentManagementPage />} />
          <Route path="roadmap" element={<RoadmapManager />} />
          <Route path="challenges" element={<ChallengeBankPage />} />
          <Route path="chapters" element={<ChapterManagementPage />} />
          <Route path="quizzes" element={<QuizManagementPage />} />
          <Route path="matrix" element={<AssessmentMatrix />} />
          <Route path="analytics" element={<StudentAnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* User/Learner protected area */}
      <Route element={<ProtectedRoute allowedRoles={['USER']} />}>
        <Route path="/learner" element={<LearnerLayout />}>
          {/* Default redirect to dashboard or first child */}
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<LearnerDashboardPage />} />
          <Route path="roadmap" element={<RoadmapPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

