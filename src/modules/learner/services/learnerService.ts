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
    }
};
