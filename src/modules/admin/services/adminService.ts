import apiClient from '../../../services/apiClient';

// --- Interfaces for Request/Response ---

export interface CreateEducatorRequest {
    email: string;
    fullName: string;
}

export interface CreateUserRequest {
    email: string;
    fullName: string;
    role: 'USER' | 'EDUCATOR';
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


export interface ChallengeBank {
    id: string;
    contentText: string;
    skillType: string;
    difficultyTag: string;
    region?: string; // BAC, TRUNG, NAM
    metadataJson: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface ChallengeBankRequest {
    contentText: string;
    skillType: string;
    difficultyTag: string;
    region?: string; // BAC, TRUNG, NAM
    metadataJson: Record<string, any>;
}

export const adminService = {
    // --- Account Management ---
    createEducator: async (data: CreateEducatorRequest) => {
        return apiClient.post('/admin/educators', data);
    },

    createUser: async (data: CreateUserRequest) => {
        return apiClient.post('/admin/users', data);
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
        return apiClient.get('/admin/content/levels');
    },
    getLevelsForSelection: async () => {
        return apiClient.get('/admin/content/levels');
    },
    createLevel: async (data: any) => {
        const payload = {
            name: data.name,
            type: 'LEVEL',
            parent_id: data.dialectId,
            metadata_json: {
                status: data.status || 'APPROVED',
                audio_url: data.audioUrl ?? null,
                level_order: data.levelOrder,
                ai_threshold: data.aiThreshold ?? null,
                error_tag_id: data.errorTagId ?? null,
                rejection_reason: data.rejectionReason ?? null,
                min_stars_required: data.minStarsRequired,
                description: data.description || '',
            },
        };
        return apiClient.post('/admin/content/levels', payload);
    },
    updateLevel: async (levelId: string, data: any) => {
        const payload = {
            name: data.name,
            type: 'LEVEL',
            parent_id: data.dialectId,
            metadata_json: {
                status: data.status || 'APPROVED',
                audio_url: data.audioUrl ?? null,
                level_order: data.levelOrder,
                ai_threshold: data.aiThreshold ?? null,
                error_tag_id: data.errorTagId ?? null,
                rejection_reason: data.rejectionReason ?? null,
                min_stars_required: data.minStarsRequired,
                description: data.description || '',
            },
            comment: data.comment,
        };
        return apiClient.put(`/admin/content/levels/${levelId}`, payload);
    },
    deleteLevel: async (levelId: string) => {
        return apiClient.delete(`/admin/content/levels/${levelId}`);
    },

    // --- Content Management (Challenges) ---
    getChallenges: async () => {
        return apiClient.get('/admin/content/challenges');
    },
    getChallengesByLevel: async (levelId: string) => {
        return apiClient.get(`/admin/content/challenges/level/${levelId}`);
    },
    createChallenge: async (data: any) => {
        return apiClient.post('/admin/content/challenges', data);
    },
    updateChallenge: async (id: string, data: any) => {
        return apiClient.put(`/admin/content/challenges/${id}`, data);
    },
    deleteChallenge: async (id: string) => {
        return apiClient.delete(`/admin/content/challenges/${id}`);
    },

    // --- Challenge Bank ---
    getChallengeBank: async () => {
        return apiClient.get('/admin/content/challenge-bank');
    },
    createChallengeBankItem: async (data: ChallengeBankRequest) => {
        return apiClient.post('/admin/content/challenge-bank', data);
    },
    updateChallengeBankItem: async (id: string, data: ChallengeBankRequest) => {
        return apiClient.put(`/admin/content/challenge-bank/${id}`, data);
    },
    deleteChallengeBankItem: async (id: string) => {
        return apiClient.delete(`/admin/content/challenge-bank/${id}`);
    },

    // --- Quiz Management ---
    getQuizzes: async () => {
        return apiClient.get('/admin/content/quizzes');
    },
    getQuizzesByLevel: async (levelId: string) => {
        return apiClient.get('/admin/content/quizzes', { params: { levelId } });
    },
    getQuizDetails: async (id: string) => {
        return apiClient.get(`/admin/content/quizzes/${id}`);
    },
    createQuiz: async (data: any) => {
        return apiClient.post('/admin/content/quizzes', data);
    },
    updateQuiz: async (id: string, data: any) => {
        return apiClient.put(`/admin/content/quizzes/${id}`, data);
    },
    deleteQuiz: async (id: string) => {
        return apiClient.delete(`/admin/content/quizzes/${id}`);
    },
    reorderQuizzes: async (quizIds: string[]) => {
        return apiClient.put('/admin/content/quizzes/reorder', quizIds);
    },
    getQuizChallenges: async (quizId: string) => {
        return apiClient.get(`/admin/content/quizzes/${quizId}/challenges`);
    },
    assignChallengesToQuiz: async (quizId: string, challengeIds: string[]) => {
        return apiClient.post(`/admin/content/quizzes/${quizId}/challenges`, { challengeIds });
    },
    removeChallengeFromQuiz: async (quizId: string, challengeId: string) => {
        return apiClient.delete(`/admin/content/quizzes/${quizId}/challenges/${challengeId}`);
    },
    createAssignment: async (data: any) => {
        return apiClient.post('/admin/content/assignments', data);
    },
    deleteAssignment: async (assignmentId: string) => {
        return apiClient.delete(`/admin/content/assignments/${assignmentId}`);
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
    getAnalyticsUsersProgress: async () => {
        return apiClient.get('/admin/analytics/users-progress');
    },
    getAiMonitorLogs: async (limit = 50) => {
        return apiClient.get(`/admin/ai-monitor/logs?limit=${limit}`);
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
    getErrorTags: async (dialectId?: string) => {
        const params: any = {};
        if (dialectId) params.dialectId = dialectId;
        // The backend exposes this via EducatorController for curriculum context
        return apiClient.get('/educator/curriculum/error-tags', { params });
    },
    createErrorTag: async (tagCode: string, name: string, description: string, regions: string[]) => {
        // Backend ErrorTagController uses @RequestParam, but we can try sending as JSON if the backend is updated, 
        // or change to params if needed. For now, correcting the 404 path.
        return apiClient.post('/admin/error-tags', { tagCode, name, description, regions });
    },
    updateErrorTag: async (id: string, data: { tagCode?: string; name?: string; description?: string; regions?: string[] }) => {
        return apiClient.put(`/admin/error-tags/${id}`, data);
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
    getContentHistory: async (id: string) => {
        return apiClient.get(`/admin/content/${id}/history`);
    },

    // --- Badge/Reward Management ---
    getBadgesForAdmin: async () => {
        return apiClient.get('/admin/rewards');
    },
    createReward: async (data: any) => {
        return apiClient.post('/admin/rewards', data);
    },
    updateReward: async (id: string, data: any) => {
        return apiClient.put(`/admin/rewards/${id}`, data);
    },
    deleteReward: async (id: string) => {
        return apiClient.delete(`/admin/rewards/${id}`);
    },
    attachRewardToQuiz: async (quizId: string, rewardId: string) => {
        return apiClient.post(`/admin/rewards/${rewardId}/attach/${quizId}`);
    }
};
