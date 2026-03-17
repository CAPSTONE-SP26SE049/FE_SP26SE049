import apiClient from '../../../services/apiClient';

export interface ClassroomRequest {
    name: string;
    description?: string;
    dialectId?: string;
    startDate?: string;   // ISO 8601, e.g. "2026-03-12T05:02:22.177Z"
    endDate?: string;     // ISO 8601, e.g. "2026-03-15T05:02:22.177Z"
    isActive?: boolean;
    currentStudents?: number;
}

export interface AddStudentRequest {
    email: string;
}

export interface Level {
    id: string;
    name: string;
    description: string;
    levelOrder: number;
    minStarsRequired: number;
    aiThreshold: number;
    errorTag: string;
    audioUrl: string;
    status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateLevelRequest {
    dialectId: string;
    levelOrder: number;
    name: string;
    description: string;
    minStarsRequired: number;
    errorTagId?: string;
    aiThreshold?: number;
}

export interface UpdateLevelRequest {
    name?: string;
    description?: string;
    levelOrder?: number;
    minStarsRequired?: number;
    errorTagId?: string;
    aiThreshold?: number;
    comment?: string;
}

export interface FeedbackRequest {
    attemptId: string;
    comment: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface PlacementRuleRequest {
    errorType: string;
    threshold: number;
    targetRegion: string;
    checkpoint: string;
    priority: number;
}

export interface Challenge {
    id: string;
    levelId: string;
    type: 'WORD' | 'SENTENCE' | 'PARAGRAPH';
    contentText: string;
    phoneticTranscriptionIpa: string;
    referenceAudioUrl?: string;
    focusPhonemes?: string;
    status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ChallengeRequest {
    levelId: string;
    type: string;
    contentText: string;
    phoneticTranscriptionIpa: string;
    referenceAudioUrl?: string;
    focusPhonemes?: string;
    comment?: string;
}

export const educatorService = {
    // --- Dashboard ---
    getDashboardSummary: async () => {
        return apiClient.get('/educator/dashboard/summary');
    },

    // --- Classroom Management ---
    getClassrooms: async () => {
        return apiClient.get('/educator/classrooms');
    },
    getClassroomById: async (id: string) => {
        return apiClient.get(`/educator/classrooms/${id}`);
    },
    createClassroom: async (data: ClassroomRequest) => {
        return apiClient.post('/educator/classrooms', data);
    },
    updateClassroom: async (id: string, data: Partial<ClassroomRequest>) => {
        return apiClient.patch(`/educator/classrooms/${id}`, data);
    },
    deleteClassroom: async (id: string) => {
        return apiClient.delete(`/educator/classrooms/${id}`);
    },

    // --- Student Management ---
    getClassroomStudents: async (classId: string) => {
        return apiClient.get(`/educator/classrooms/${classId}/students`);
    },
    addStudentToClassroom: async (classId: string, data: AddStudentRequest) => {
        return apiClient.post(`/educator/classrooms/${classId}/students`, data);
    },
    removeStudentFromClassroom: async (classId: string, studentId: string) => {
        return apiClient.delete(`/educator/classrooms/${classId}/students/${studentId}`);
    },

    // --- Analytics & Performance ---
    getStudentAnalytics: async (studentId: string) => {
        return apiClient.get(`/educator/students/${studentId}/analytics`);
    },
    getClassroomPerformance: async (classId: string) => {
        return apiClient.get(`/educator/classrooms/${classId}/performance`);
    },

    // --- Curriculum Management ---
    getCurriculumByRegion: async (region: string) => {
        return apiClient.get(`/educator/curriculum/${region.toUpperCase()}`);
    },
    createLevel: async (data: CreateLevelRequest) => {
        return apiClient.post(`/educator/curriculum/levels`, data);
    },
    updateLevel: async (levelId: string, data: UpdateLevelRequest) => {
        return apiClient.patch(`/educator/curriculum/levels/${levelId}`, data);
    },
    deleteLevel: async (levelId: string) => {
        return apiClient.delete(`/educator/curriculum/levels/${levelId}`);
    },
    getDialects: async () => {
        return apiClient.get('/dialects');
    },
    getErrorTags: async (dialectId?: string) => {
        const params: any = {};
        if (dialectId) params.dialectId = dialectId;
        return apiClient.get('/educator/curriculum/error-tags', { params });
    },
    uploadReferenceAudio: async (levelId: string, audioUrl: string) => {
        return apiClient.post(`/educator/curriculum/levels/${levelId}/audio`, null, {
            params: { audioUrl }
        });
    },

    // --- Feedback System ---
    submitFeedback: async (studentId: string, data: FeedbackRequest) => {
        return apiClient.post(`/educator/students/${studentId}/feedback`, data);
    },

    // --- Placement Test Rules ---
    getPlacementRules: async () => {
        return apiClient.get('/educator/placement/rules');
    },
    upsertPlacementRule: async (data: PlacementRuleRequest) => {
        return apiClient.post('/educator/placement/rules', data);
    },

    // --- Challenge (Lesson) Management ---
    getChallengesByLevel: async (levelId: string) => {
        return apiClient.get(`/challenges/level/${levelId}`);
    },
    createChallenge: async (data: ChallengeRequest) => {
        return apiClient.post('/educator/curriculum/challenges', data);
    },
    updateChallenge: async (id: string, data: Partial<ChallengeRequest>) => {
        return apiClient.put(`/educator/curriculum/challenges/${id}`, data);
    },
    deleteChallenge: async (id: string) => {
        return apiClient.delete(`/educator/curriculum/challenges/${id}`);
    },
    getContentHistory: async (id: string) => {
        return apiClient.get(`/educator/content/${id}/history`);
    },
    getLevelsForSelection: async () => {
        return apiClient.get('/educator/levels');
    }
};
