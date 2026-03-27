import apiClient from '../../../services/apiClient';

export interface Classroom {
    id: string;
    name: string;
    code: string;
    description?: string;
    dialectId?: string;
    startDate?: string;
    endDate?: string;
    isActive: boolean;
    currentStudents?: number;
    createdAt: string;
    updatedAt?: string;
}

export interface Dialect {
    id: string;
    name: string;
    description?: string;
}

export interface Level {
    id: string;
    name: string;
    description?: string;
    levelOrder: number;
    starsEarned: number;
    isCompleted: boolean;
    isLocked: boolean;
    minStarsRequired?: number;
    aiThreshold?: number;
    audioUrl?: string;
    status?: string;
}

// Chapter is just a Level without the lock/unlock concept
export type Chapter = Level;

export interface QuizQuestion {
    question: string;
    options?: string[];
    correctAnswer?: string;
    audioUrl?: string;
}

export interface Quiz {
    id: string;
    levelId?: string;
    title?: string;        // QuizResponse.title (ContentItem system)
    name?: string;         // legacy fallback
    description?: string;
    timeLimitMinutes?: number;
    passingScore?: number;
    pointsPerQuestion?: number;
    difficulty?: string;
    skillType?: string;
    questionCount?: number;
    questions?: QuizQuestion[];
    status?: string;
}

export const learnerService = {
    /**
     * GET /api/v1/classrooms
     */
    getMyClassrooms: async (): Promise<Classroom[]> => {
        const res: any = await apiClient.get('/classrooms');
        return res?.data ?? res ?? [];
    },

    /**
     * GET /api/v1/dialects
     */
    getDialects: async (): Promise<Dialect[]> => {
        const res: any = await apiClient.get('/dialects');
        return res?.data ?? [];
    },

    /**
     * GET /api/v1/levels?dialectId=
     * Lấy danh sách các Chapter (Level) theo vùng miền — không có lock mechanic
     */
    getLevels: async (dialectId: string): Promise<Level[]> => {
        const res: any = await apiClient.get(`/levels?dialectId=${dialectId}`);
        return res?.data ?? [];
    },

    /**
     * GET /api/v1/users/levels/{levelId}/quizzes
     * Lấy danh sách Quiz của một Chapter (Level) — có lock/unlock
     */
    getQuizzesByLevel: async (levelId: string): Promise<Quiz[]> => {
        const res: any = await apiClient.get(`/users/levels/${levelId}/quizzes`);
        return res?.data ?? [];
    },

    /**
     * @deprecated Still here for backward compat; use getQuizzesByLevel instead
     */
    getQuizzesByLevelOld: async (levelId: string): Promise<Quiz[]> => {
        const res: any = await apiClient.get(`/quizzes/by-level?levelId=${levelId}`);
        return res?.data ?? [];
    },
};
