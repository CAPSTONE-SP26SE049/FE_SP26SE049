import apiClient from '../../../services/apiClient';

export interface CreateFeedbackRequest {
    category: string;
    title: string;
    content: string;
    screenshotUrl?: string;
}

export interface UserFeedbackResponse {
    id: string;
    senderId: string;
    senderName: string;
    senderEmail: string;
    category: string;
    title: string;
    content: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    screenshotUrl?: string;
    adminNote?: string;
    createdAt: string;
    updatedAt: string;
}

export interface PagedFeedbackResponse {
    content: UserFeedbackResponse[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

export const userFeedbackService = {
    createFeedback: async (data: CreateFeedbackRequest): Promise<UserFeedbackResponse> => {
        const res: any = await apiClient.post('/user-feedback', data);
        return res?.data?.data ?? res?.data ?? res;
    },

    getMyFeedbacks: async (): Promise<UserFeedbackResponse[]> => {
        const res: any = await apiClient.get('/user-feedback/my');
        return res?.data?.data ?? res?.data ?? [];
    },

    // Admin
    getAllFeedbacks: async (params: {
        status?: string;
        category?: string;
        page?: number;
        size?: number;
    }): Promise<PagedFeedbackResponse> => {
        const res: any = await apiClient.get('/admin/user-feedbacks', { params });
        return res?.data?.data ?? res?.data ?? { content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 };
    },

    updateStatus: async (id: string, status: string, adminNote?: string): Promise<UserFeedbackResponse> => {
        const res: any = await apiClient.patch(`/admin/user-feedbacks/${id}/status`, { status, adminNote });
        return res?.data?.data ?? res?.data ?? res;
    },
};
