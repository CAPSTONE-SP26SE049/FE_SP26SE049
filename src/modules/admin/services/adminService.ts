import apiClient from '../../../services/apiClient';

// --- Interfaces for Request/Response ---

export interface CreateEducatorRequest {
    email: string;
    fullName: string;
}

export interface DialectRequest {
    name: string;
    description?: string;
}

export interface LevelRequest {
    dialectId: string;
    levelOrder: number;
    name: string;
    description: string;
    minStarsRequired: number;
    errorTagId?: string;
    comment?: string;
}

export interface ChallengeRequest {
    levelId: string;
    type: string;
    contentText: string;
    phoneticTranscriptionIpa?: string;
    referenceAudioUrl?: string;
    focusPhonemes?: string;
    comment?: string;
}

export interface ReviewContentRequest {
    status: 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
    comment?: string;
}

export const adminService = {
    // --- Account Management ---
    createEducator: async (data: CreateEducatorRequest) => {
        return apiClient.post('/admin/educators', data);
    },

    // --- Content Management (Dialects) ---
    getDialects: async () => {
        return apiClient.get('/dialects');
    },
    createDialect: async (data: DialectRequest) => {
        return apiClient.post('/admin/content/dialects', data);
    },
    updateDialect: async (id: string, data: DialectRequest) => {
        return apiClient.put(`/admin/content/dialects/${id}`, data);
    },
    deleteDialect: async (id: string) => {
        return apiClient.delete(`/admin/content/dialects/${id}`);
    },

    // --- Content Management (Levels) ---
    getLevels: async () => {
        return apiClient.get('/admin/content/levels'); // Assuming a GET exists
    },
    createLevel: async (data: LevelRequest) => {
        return apiClient.post('/admin/content/levels', data);
    },
    updateLevel: async (id: string, data: LevelRequest) => {
        return apiClient.put(`/admin/content/levels/${id}`, {
            ...data,
            name: data.name // Ensure 'name' is used if 'title' was previous backend expectation
        });
    },
    deleteLevel: async (id: string) => {
        return apiClient.delete(`/admin/content/levels/${id}`);
    },

    // --- Content Management (Challenges) ---
    getChallenges: async () => {
        return apiClient.get('/admin/content/challenges');
    },
    createChallenge: async (data: ChallengeRequest) => {
        return apiClient.post('/admin/content/challenges', data);
    },
    updateChallenge: async (id: string, data: ChallengeRequest) => {
        return apiClient.put(`/admin/content/challenges/${id}`, data);
    },
    deleteChallenge: async (id: string) => {
        return apiClient.delete(`/admin/content/challenges/${id}`);
    },

    // --- User Analytics ---
    getAnalyticsOverview: async () => {
        return apiClient.get('/admin/analytics/overview');
    },
    getAnalyticsEngagement: async () => {
        return apiClient.get('/admin/analytics/engagement');
    },
    getAnalyticsErrorHeatmaps: async () => {
        return apiClient.get('/admin/analytics/errors/heatmaps');
    },

    // --- System Monitoring ---
    getSystemHealth: async () => {
        return apiClient.get('/admin/system/health');
    },
    getAiPerformance: async () => {
        return apiClient.get('/admin/system/ai-performance');
    },
    getSystemFeedback: async () => {
        return apiClient.get('/admin/system/feedback');
    },

    // --- Error Tags Management ---
    getErrorTags: async () => {
        return apiClient.get('/public/error-tags');
    },
    createErrorTag: async (tagCode: string, name: string, description: string, regions: string[]) => {
        return apiClient.post('/admin/error-tags', { tagCode, name, description, regions });
    },
    updateErrorTag: async (id: string, data: { tagCode?: string; name?: string; description?: string; regions?: string[] }) => {
        return apiClient.put(`/admin/error-tags/${id}`, null, {
            params: data
        });
    },
    deleteErrorTag: async (id: string) => {
        return apiClient.delete(`/admin/error-tags/${id}`);
    },

    // --- Extended for UI ---
    getUsers: async () => {
        return apiClient.get('/admin/users');
    },
    getUserById: async (id: string) => {
        return apiClient.get(`/admin/users/${id}`);
    },
    updateUserStatus: async (id: string, isActive: boolean) => {
        return apiClient.put(`/admin/users/${id}/status`, { isActive });
    },
    updateUser: async (id: string, data: any) => {
        return apiClient.patch(`/admin/users/${id}`, data);
    },
    getPendingLevels: async () => {
        return apiClient.get('/admin/content/pending/levels');
    },
    getPendingChallenges: async () => {
        return apiClient.get('/admin/content/pending/challenges');
    },
    getPendingQuizzes: async () => {
        return apiClient.get('/admin/approvals/quizzes');
    },
    reviewLevel: async (id: string, data: ReviewContentRequest) => {
        return apiClient.put(`/admin/content/levels/${id}/review`, data);
    },
    reviewChallenge: async (id: string, data: ReviewContentRequest) => {
        return apiClient.put(`/admin/content/challenges/${id}/review`, data);
    },
    reviewQuiz: async (id: string, data: ReviewContentRequest) => {
        return apiClient.post(`/admin/approvals/quizzes/${id}/review`, {
            action: data.status,
            reason: data.comment || data.rejectionReason
        });
    },
    getQuizzes: async () => {
        return apiClient.get('/admin/content/quizzes');
    },
    getContentHistory: async (id: string) => {
        return apiClient.get(`/admin/content/${id}/history`);
    }
};
