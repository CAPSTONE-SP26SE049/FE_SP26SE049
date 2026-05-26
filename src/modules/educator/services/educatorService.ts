import apiClient from '../../../services/apiClient';

export interface StudentLearningPath {
  id: string;
  title: string;
  description?: string;
  focusArea: string;
  milestones: string[];
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  updatedAt: string;
}

export interface StudentAccount {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
  avatar_url?: string;
  level: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  isActive?: boolean;
  hasCustomPath?: boolean;
  customPathType: 'MANUAL' | 'AI' | 'NONE';
  progressPercent: number;
  pronunciationScore: number;
  weakPhonemes: string[];
  learningPath: {
    id: string;
    title: string;
  };
}

export interface PronunciationMetric {
  label: string;
  value: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface ProgressOverview {
  totalStudents: number;
  activeStudents: number;
  averagePronunciationScore: number;
  pendingFeedbackCount: number;
  weeklyProgressRate: number;
  pronunciationMetrics: PronunciationMetric[];
}

export interface LessonPlan {
  id: string;
  title: string;
  objective: string;
  targetStudents: string[];
  achievementGoals: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  updatedAt: string;
}

export interface FeedbackItem {
  id: string;
  studentId: string;
  studentName: string;
  content: string;
  channel: 'FEEDBACK' | 'MESSAGE';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: string;
}

export interface AnalyticsReport {
  studentId: string;
  studentName: string;
  pronunciationErrors: Array<{ phoneme: string; count: number; accuracy: number }>;
  learningEffectiveness: Array<{ label: string; value: number }>;
  recentSessions: Array<{ id: string; score: number; createdAt: string }>;
}

export interface CustomLearningPathPayload {
  studentId: string;
  title: string;
  focusArea: string;
  milestones: string[];
  description?: string;
}

export interface LessonPlanPayload {
  title: string;
  objective: string;
  targetStudents: string[];
  achievementGoals: string[];
}

export interface MessagePayload {
  studentId: string;
  content: string;
}

export interface FeedbackPayload {
  studentId: string;
  content: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export const educatorService = {
  getDashboardSummary: async () => apiClient.get('/educator/dashboard/summary'),
  getStudentAccounts: async () => apiClient.get('/educator/students'),
  getStudentAccountById: async (id: string) => apiClient.get(`/educator/students/${id}`),
  createCustomLearningPath: async (data: CustomLearningPathPayload) => apiClient.post('/educator/students/learning-paths', data),
  getProgressOverview: async () => apiClient.get('/educator/progress/overview'),
  getPronunciationAnalytics: async (studentId?: string) => apiClient.get('/educator/progress/pronunciation-analytics', { params: studentId ? { studentId } : undefined }),
  getLessonPlans: async () => apiClient.get('/educator/lessons'),
  createLessonPlan: async (data: LessonPlanPayload) => apiClient.post('/educator/lessons', data),
  updateLessonPlan: async (id: string, data: Partial<LessonPlanPayload>) => apiClient.patch(`/educator/lessons/${id}`, data),
  getConversationMessages: async (studentId: string) => apiClient.get(`/educator/messages/${studentId}`),
  sendMessage: async (data: MessagePayload) => apiClient.post('/educator/messages', data),
  markAsRead: async (studentId: string) => apiClient.post(`/educator/messages/read/${studentId}`),
  getFeedbackItems: async () => apiClient.get('/educator/feedback'),
  getMessages: async () => apiClient.get('/educator/feedback'), // Alias for historical compatibility in components
  sendFeedback: async (data: FeedbackPayload) => apiClient.post('/educator/feedback', data),
  getAnalyticsReports: async () => apiClient.get('/educator/analytics/reports'),
  getAnalyticsReportByStudent: async (studentId: string) => apiClient.get(`/educator/analytics/reports/${studentId}`),
};
