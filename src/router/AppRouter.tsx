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
import EducatorOverviewPage from '../modules/educator/pages/EducatorOverviewPage'
import StudentsPage from '../modules/educator/pages/StudentsPage'
import CustomPathSelectionPage from '../modules/educator/pages/CustomPathSelectionPage'
import InteractionsPage from '../modules/educator/pages/InteractionsPage'

import ChallengeBankPage from '../modules/educator/pages/ChallengeBankPage'
import ChapterManagementPage from '../modules/educator/pages/ChapterManagementPage'
import QuizManagementPage from '../modules/educator/pages/QuizManagementPage'
import RoadmapRuleManagementPage from '../modules/educator/pages/RoadmapRuleManagementPage'
import AdminDashboardPage from '../modules/admin/pages/AdminDashboardPage'
import AdminLayout from '../modules/admin/components/AdminLayout'
import UserManagementPage from '../modules/admin/pages/UserManagementPage'
import ChallengeBankManagementPage from '../modules/admin/pages/ChallengeBankManagementPage'
import AdminSettingsPage from '../modules/admin/pages/SettingsPage'
import AchievementManagementPage from '../modules/admin/pages/AchievementManagementPage'
import AdminChapterManagementPage from '../modules/admin/pages/ChapterManagementPage'
import AdminQuizManagementPage from '../modules/admin/pages/QuizManagementPage'
import AiMonitorPage from '../modules/admin/pages/AiMonitorPage'
import EntryTestManagementPage from '../modules/admin/pages/EntryTestManagementPage'
import ErrorTagManagementPage from '../modules/admin/pages/ErrorTagManagementPage'
import UserFeedbackManagementPage from '../modules/admin/pages/UserFeedbackManagementPage'
import AiConfigManagementPage from '../modules/admin/pages/AiConfigManagementPage'
import MinigameManagementPage from '../modules/admin/pages/MinigameManagementPage'
import MinigamesPage from '../modules/learner/pages/MinigamesPage'
import WordChallengePage from '../modules/learner/pages/minigames/WordChallengePage'
import SentenceCompletionPage from '../modules/learner/pages/minigames/SentenceCompletionPage'
import ConversationSimPage from '../modules/learner/pages/minigames/ConversationSimPage'
import MatchingPairsPage from '../modules/learner/pages/minigames/MatchingPairsPage'
import WordGuessPage from '../modules/learner/pages/minigames/WordGuessPage'
import RoadmapPage from '../modules/learner/pages/RoadmapPage'
import LearningRoadmapPage from '../modules/learner/pages/LearningRoadmapPage'
import LearnerLayout from '../modules/learner/components/LearnerLayout'
import LearnerDashboardPage from '../modules/learner/pages/LearnerDashboardPage'
import ProfilePage from '../modules/learner/pages/ProfilePage'
import LearnerFriendsPage from '../modules/learner/pages/LearnerFriendsPage'
import PronunciationModelPage from '../modules/learner/pages/PronunciationModelPage'
import QuizPage from '../modules/learner/pages/QuizPage'
import Entrytest from '../pages/Entrytest'
import SelectRegionPage from '../pages/SelectRegionPage'
import LearnerLeaderboardPage from '../modules/learner/pages/LearnerLeaderboardPage'
import AchievementsPage from '../modules/learner/pages/AchievementsPage'
import TournamentPage from '../modules/learner/pages/TournamentPage'

import { ProtectedRoute, AnonymousRoute } from '../core/auth/ProtectedRoute'

import CustomPathDesignerPage from '../modules/educator/pages/CustomPathDesignerPage'
import CustomJourneyPage from '../modules/learner/pages/CustomJourneyPage'
import MailboxPage from '../modules/learner/pages/MailboxPage'
import EntryTestPage from '../modules/learner/pages/EntryTestPage'
import FeedbackPage from '../modules/learner/pages/FeedbackPage'

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Trang công khai - ai cũng vào được */}
      <Route path="/" element={<HomePage />} />
      <Route path="/auth/facebook/callback" element={<FacebookCallback />} />

      {/* Routes dành cho người chưa đăng nhập: đã đăng nhập → redirect về home của role */}
      <Route element={<AnonymousRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Admin routes - chỉ ADMIN */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="chapters" element={<AdminChapterManagementPage />} />
          <Route path="quizzes" element={<AdminQuizManagementPage />} />
          <Route path="quizzes/:levelId" element={<AdminQuizManagementPage />} />
          <Route path="achievements" element={<AchievementManagementPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="ai-config" element={<AiConfigManagementPage />} />
          <Route path="ai-monitor" element={<AiMonitorPage />} />
          <Route path="entry-test" element={<EntryTestManagementPage />} />
          <Route path="error-tags" element={<ErrorTagManagementPage />} />
          <Route path="feedbacks" element={<UserFeedbackManagementPage />} />
          <Route path="challenge-bank" element={<ChallengeBankManagementPage />} />
          <Route path="minigames" element={<MinigameManagementPage />} />
        </Route>
      </Route>

      {/* Educator routes - chỉ EDUCATOR */}
      <Route element={<ProtectedRoute allowedRoles={['EDUCATOR']} />}>
        <Route path="/educator" element={<EducatorLayout />}>
          <Route index element={<Navigate to="students" replace />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="students/profile/:studentId" element={<ProfilePage />} />
          <Route path="design-path" element={<CustomPathSelectionPage />} />
          <Route path="design-path/:studentId" element={<CustomPathDesignerPage />} />
          <Route path="lessons" element={<ChallengeBankPage />} />
          <Route path="messages" element={<InteractionsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="challenges" element={<ChallengeBankPage />} />
          <Route path="chapters" element={<ChapterManagementPage />} />
          <Route path="quizzes" element={<QuizManagementPage />} />
          <Route path="roadmap-rules" element={<RoadmapRuleManagementPage />} />
        </Route>
      </Route>

      {/* Learner routes - chỉ USER */}
      <Route element={<ProtectedRoute allowedRoles={['USER']} />}>
        <Route path="/entry-test" element={<EntryTestPage />} />
        <Route path="/learner/quiz/:quizId" element={<QuizPage />} />
        <Route path="/learner/select-region" element={<SelectRegionPage />} />
        <Route path="/learner/entrytest" element={<Entrytest />} />
        <Route path="/learner" element={<LearnerLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<LearnerDashboardPage />} />
          <Route path="custom-journey" element={<CustomJourneyPage />} />
          <Route path="mailbox" element={<MailboxPage />} />
          <Route path="roadmap" element={<RoadmapPage />} />
          <Route path="roadmap-v2" element={<LearningRoadmapPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="friends" element={<LearnerFriendsPage />} />
           <Route path="pronunciation" element={<PronunciationModelPage />} />
          <Route path="tournament" element={<TournamentPage />} />
          <Route path="leaderboard" element={<LearnerLeaderboardPage />} />
          <Route path="achievements" element={<AchievementsPage />} />
          <Route path="minigames" element={<MinigamesPage />} />
          <Route path="minigames/word-challenge" element={<WordChallengePage />} />
          <Route path="minigames/matching-pairs" element={<MatchingPairsPage />} />
          <Route path="minigames/word-guess" element={<WordGuessPage />} />
          <Route path="minigames/sentence-completion" element={<SentenceCompletionPage />} />
          <Route path="minigames/conversation" element={<ConversationSimPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
