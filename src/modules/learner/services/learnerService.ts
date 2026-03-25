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
}

export interface QuizQuestion {
    question: string;
    options?: string[];
    correctAnswer?: string;
    audioUrl?: string;
}

export interface Quiz {
    id: string;
    levelId: string;
    name: string;
    description?: string;
    timeLimitMinutes?: number;
    passingScore?: number;
    pointsPerQuestion?: number;
    difficulty?: string;
    skillType?: string;
    questionCount?: number;
    questions?: QuizQuestion[];
}

export const learnerService = {
    /**
     * GET /api/v1/classrooms
     * Lấy danh sách các lớp học mà người dùng hiện tại đang tham gia
     */
    getMyClassrooms: async (): Promise<Classroom[]> => {
        const res: any = await apiClient.get('/classrooms');
        // Tuỳ cấu trúc response: { status, message, data: [...] }
        return res?.data ?? res ?? [];
    },

    /**
     * GET /api/v1/dialects
     * Lấy danh sách vùng miền (Bắc, Trung, Nam)
     */
    getDialects: async (): Promise<Dialect[]> => {
        const res: any = await apiClient.get('/dialects');
        return res?.data ?? [];
    },

    /**
     * GET /api/v1/levels
     * Lấy danh sách các cấp độ đi kèm tiến độ
     */
    getLevels: async (dialectId: string): Promise<Level[]> => {
        const res: any = await apiClient.get(`/levels?dialectId=${dialectId}`);
        return res?.data ?? [];
    },

    /**
     * GET /api/v1/quizzes/by-level?levelId=
     * Lấy danh sách Quiz của một Level để người dùng bắt đầu học
     */
    getQuizzesByLevel: async (levelId: string): Promise<Quiz[]> => {
        const res: any = await apiClient.get(`/quizzes/by-level?levelId=${levelId}`);
        return res?.data ?? [];
    },
};
