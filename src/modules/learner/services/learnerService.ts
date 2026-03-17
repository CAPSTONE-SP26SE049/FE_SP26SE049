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
};
