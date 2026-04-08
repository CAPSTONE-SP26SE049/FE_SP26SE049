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

import SettingsPage from '../modules/educator/pages/SettingsPage'

import ChallengeBankPage from '../modules/educator/pages/ChallengeBankPage'
import ChapterManagementPage from '../modules/educator/pages/ChapterManagementPage'
import QuizManagementPage from '../modules/educator/pages/QuizManagementPage'
import AdminDashboardPage from '../modules/admin/pages/AdminDashboardPage'
import AdminLayout from '../modules/admin/components/AdminLayout'
import UserManagementPage from '../modules/admin/pages/UserManagementPage'
import AdminSettingsPage from '../modules/admin/pages/SettingsPage'
import RewardManagementPage from '../modules/admin/pages/RewardManagementPage'
import AchievementManagementPage from '../modules/admin/pages/AchievementManagementPage'
import AdminChapterManagementPage from '../modules/admin/pages/ChapterManagementPage'
import AdminQuizManagementPage from '../modules/admin/pages/QuizManagementPage'
import RoadmapPage from '../modules/learner/pages/RoadmapPage'
import LearnerLayout from '../modules/learner/components/LearnerLayout'
import LearnerDashboardPage from '../modules/learner/pages/LearnerDashboardPage'
import ProfilePage from '../modules/learner/pages/ProfilePage'
import LearnerFriendsPage from '../modules/learner/pages/LearnerFriendsPage'
import PronunciationModelPage from '../modules/learner/pages/PronunciationModelPage'
import QuizPage from '../modules/learner/pages/QuizPage'
import LearnerLeaderboardPage from '../modules/learner/pages/LearnerLeaderboardPage'

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
          <Route path="chapters" element={<AdminChapterManagementPage />} />
          <Route path="quizzes" element={<AdminQuizManagementPage />} />
          <Route path="quizzes/:levelId" element={<AdminQuizManagementPage />} />
          <Route path="rewards" element={<RewardManagementPage />} />
          <Route path="achievements" element={<AchievementManagementPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
      </Route>

      {/* Educator protected area */}
      <Route element={<ProtectedRoute allowedRoles={['EDUCATOR']} />}>
        <Route path="/educator" element={<EducatorLayout />}>
          <Route index element={<Navigate to="challenges" replace />} />

          <Route path="challenges" element={<ChallengeBankPage />} />
          <Route path="chapters" element={<ChapterManagementPage />} />
          <Route path="quizzes" element={<QuizManagementPage />} />

          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* User/Learner protected area */}
      <Route element={<ProtectedRoute allowedRoles={['USER']} />}>
        {/* Standalone quiz page without LearnerLayout */}
        <Route path="/learner/quiz/:quizId" element={<QuizPage />} />
        <Route path="/learner" element={<LearnerLayout />}>
          {/* Default redirect to dashboard or first child */}
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<LearnerDashboardPage />} />
          <Route path="roadmap" element={<RoadmapPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="friends" element={<LearnerFriendsPage />} />
          <Route path="pronunciation" element={<PronunciationModelPage />} />
          <Route path="leaderboard" element={<LearnerLeaderboardPage />} />
        </Route>

      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

