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

export interface LevelFormPayload {
    dialectId: string;
    levelOrder: number;
    name: string;
    description?: string;
    minStarsRequired: number;
    errorTagId?: string;
    aiThreshold?: number;
    status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason?: string | null;
    audioUrl?: string | null;
    comment?: string;
}

export interface CreateLevelRequest {
    name: string;
    type: 'LEVEL';
    parent_id: string;
    metadata_json: {
        status: string;
        audio_url: string | null;
        level_order: number;
        ai_threshold?: number | null;
        error_tag_id?: string | null;
        rejection_reason?: string | null;
        min_stars_required: number;
        description?: string;
    };
}

export interface UpdateLevelRequest {
    name: string;
    type: 'LEVEL';
    parent_id: string;
    metadata_json: {
        status: string;
        audio_url: string | null;
        level_order: number;
        ai_threshold?: number | null;
        error_tag_id?: string | null;
        rejection_reason?: string | null;
        min_stars_required: number;
        description?: string;
    };
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

export interface QuizQuestionRequest {
    skillType: string;
    difficulty?: string;
    questionOrder: number;
    points: number;
    challengeId?: string;
}

export interface QuizCreateRequest {
    levelId: string;
    title: string;
    description?: string;
    instructions?: string;
    passingScore: number;
    timeLimitMinutes?: number;
    questionCount?: number;
    comment?: string;
    questions: QuizQuestionRequest[];
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

export interface Quiz {
    id: string;
    levelId: string;
    title: string;
    description: string;
    instructions: string;
    passingScore: number;
    timeLimitMinutes?: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    questions: QuizQuestion[];
    createdAt: string;
    updatedAt: string;
}

export interface QuizQuestion {
    id: string;
    skillType: string;
    difficulty: string;
    questionOrder: number;
    points: number;
    contentData: any;
}

export interface QuizCreateRequest {
    levelId: string;
    title: string;
    description: string;
    instructions: string;
    passingScore: number;
    timeLimitMinutes?: number;
    questions: QuizQuestionRequest[];
}

export interface QuizQuestionRequest {
    skillType: string;
    difficulty: string;
    questionOrder: number;
    points: number;
    contentData: any;
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

export interface ChallengeBank {
    id: string;
    contentText: string;
    skillType: string;
    difficultyTag: string;
    isGlobal: boolean;
    metadataJson: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface ChallengeBankRequest {
    contentText: string;
    skillType: string;
    difficultyTag: string;
    isGlobal?: boolean;
    metadataJson: Record<string, any>;
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
    createLevel: async (data: LevelFormPayload) => {
        const payload: CreateLevelRequest = {
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
        return apiClient.post(`/educator/curriculum/levels`, payload);
    },
    updateLevel: async (levelId: string, data: LevelFormPayload) => {
        const payload: UpdateLevelRequest = {
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
        return apiClient.patch(`/educator/curriculum/levels/${levelId}`, payload);
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
    // --- Educator Quiz Management ---
    getQuizzes: async () => {
        return apiClient.get('/educator/quizzes');
    },
    getQuizDetails: async (id: string) => {
        return apiClient.get(`/educator/quizzes/${id}`);
    },
    createQuiz: async (data: QuizCreateRequest) => {
        return apiClient.post('/educator/quizzes', data);
    },
    updateQuiz: async (id: string, data: QuizCreateRequest) => {
        return apiClient.put(`/educator/quizzes/${id}`, data);
    },

    getContentHistory: async (id: string) => {
        return apiClient.get(`/educator/content/${id}/history`);
    },
    getLevelsForSelection: async () => {
        return apiClient.get('/educator/levels');
    },
    createQuiz: async (data: QuizCreateRequest) => {
        return apiClient.post('/educator/quizzes', data);
    },
    getQuizzesByLevel: async (levelId: string) => {
        return apiClient.get('/educator/quizzes', { params: { levelId } });
    },
    updateQuiz: async (id: string, data: QuizCreateRequest) => {
        return apiClient.put(`/educator/quizzes/${id}`, data);
    },

    // --- Challenge Bank ---
    getChallengeBank: async () => {
        return apiClient.get('/educator/challenge-bank');
    },
    createChallengeBankItem: async (data: ChallengeBankRequest) => {
        return apiClient.post('/educator/challenge-bank', data);
    },
    assignChallengesToQuiz: async (quizId: string, challengeIds: string[]) => {
        return apiClient.post(`/educator/quiz/${quizId}/challenges`, { challengeIds });
    },
    getQuizChallenges: async (quizId: string) => {
        return apiClient.get(`/educator/quiz/${quizId}/challenges`);
    },
};

