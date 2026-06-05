import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import { ProtectedRoute, AnonymousRoute } from '../core/auth/ProtectedRoute'

// Layouts - Keep eagerly loaded to avoid layouts flashing during routing transitions
import EducatorLayout from '../modules/educator/components/EducatorLayout'
import AdminLayout from '../modules/admin/components/AdminLayout'
import LearnerLayout from '../modules/learner/components/LearnerLayout'

// Public Pages
const HomePage = lazy(() => import('../modules/public/pages/HomePage'))

// Auth Pages
const Login = lazy(() => import('../apps/auth/Login'))
const Register = lazy(() => import('../apps/auth/Register'))
const VerifyEmail = lazy(() => import('../apps/auth/VerifyEmail'))
const ForgotPassword = lazy(() => import('../apps/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('../apps/auth/ResetPassword'))
const FacebookCallback = lazy(() => import('../apps/auth/FacebookCallback'))

// Educator Pages
const SettingsPage = lazy(() => import('../modules/educator/pages/SettingsPage'))
const EducatorOverviewPage = lazy(() => import('../modules/educator/pages/EducatorOverviewPage'))
const StudentsPage = lazy(() => import('../modules/educator/pages/StudentsPage'))
const CustomPathSelectionPage = lazy(() => import('../modules/educator/pages/CustomPathSelectionPage'))
const CustomPathDesignerPage = lazy(() => import('../modules/educator/pages/CustomPathDesignerPage'))
const InteractionsPage = lazy(() => import('../modules/educator/pages/InteractionsPage'))
const ChallengeBankPage = lazy(() => import('../modules/educator/pages/ChallengeBankPage'))
const ChapterManagementPage = lazy(() => import('../modules/educator/pages/ChapterManagementPage'))
const QuizManagementPage = lazy(() => import('../modules/educator/pages/QuizManagementPage'))
const RoadmapRuleManagementPage = lazy(() => import('../modules/educator/pages/RoadmapRuleManagementPage'))

// Admin Pages
const AdminDashboardPage = lazy(() => import('../modules/admin/pages/AdminDashboardPage'))
const UserManagementPage = lazy(() => import('../modules/admin/pages/UserManagementPage'))
const ChallengeBankManagementPage = lazy(() => import('../modules/admin/pages/ChallengeBankManagementPage'))
const AdminSettingsPage = lazy(() => import('../modules/admin/pages/SettingsPage'))
const AchievementManagementPage = lazy(() => import('../modules/admin/pages/AchievementManagementPage'))
const AdminChapterManagementPage = lazy(() => import('../modules/admin/pages/ChapterManagementPage'))
const AdminQuizManagementPage = lazy(() => import('../modules/admin/pages/QuizManagementPage'))
const AiMonitorPage = lazy(() => import('../modules/admin/pages/AiMonitorPage'))
const EntryTestManagementPage = lazy(() => import('../modules/admin/pages/EntryTestManagementPage'))
const ErrorTagManagementPage = lazy(() => import('../modules/admin/pages/ErrorTagManagementPage'))
const UserFeedbackManagementPage = lazy(() => import('../modules/admin/pages/UserFeedbackManagementPage'))
const AiConfigManagementPage = lazy(() => import('../modules/admin/pages/AiConfigManagementPage'))
const MinigameManagementPage = lazy(() => import('../modules/admin/pages/MinigameManagementPage'))

// Learner Pages
const LearnerDashboardPage = lazy(() => import('../modules/learner/pages/LearnerDashboardPage'))
const CustomJourneyPage = lazy(() => import('../modules/learner/pages/CustomJourneyPage'))
const MailboxPage = lazy(() => import('../modules/learner/pages/MailboxPage'))
const RoadmapPage = lazy(() => import('../modules/learner/pages/RoadmapPage'))
const LearningRoadmapPage = lazy(() => import('../modules/learner/pages/LearningRoadmapPage'))
const ProfilePage = lazy(() => import('../modules/learner/pages/ProfilePage'))
const LearnerFriendsPage = lazy(() => import('../modules/learner/pages/LearnerFriendsPage'))
const PronunciationModelPage = lazy(() => import('../modules/learner/pages/PronunciationModelPage'))
const QuizPage = lazy(() => import('../modules/learner/pages/QuizPage'))
const EntryTestPage = lazy(() => import('../modules/learner/pages/EntryTestPage'))
const LearnerLeaderboardPage = lazy(() => import('../modules/learner/pages/LearnerLeaderboardPage'))
const AchievementsPage = lazy(() => import('../modules/learner/pages/AchievementsPage'))
const TournamentPage = lazy(() => import('../modules/learner/pages/TournamentPage'))
const FeedbackPage = lazy(() => import('../modules/learner/pages/FeedbackPage'))

// Minigames
const MinigamesPage = lazy(() => import('../modules/learner/pages/MinigamesPage'))
const WordChallengePage = lazy(() => import('../modules/learner/pages/minigames/WordChallengePage'))
const SentenceCompletionPage = lazy(() => import('../modules/learner/pages/minigames/SentenceCompletionPage'))
const ConversationSimPage = lazy(() => import('../modules/learner/pages/minigames/ConversationSimPage'))
const MatchingPairsPage = lazy(() => import('../modules/learner/pages/minigames/MatchingPairsPage'))
const WordGuessPage = lazy(() => import('../modules/learner/pages/minigames/WordGuessPage'))

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
          <span className="text-sm font-semibold text-slate-500 animate-pulse">SpeakVN đang tải...</span>
        </div>
      </div>
    }>
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
    </Suspense>
  )
}
