import apiClient from "../../../services/apiClient";

interface ApiResponse<T> {
    status: string;
    message: string;
    data: T;
}

export interface SpeakingAttempt {
    id: string;
    targetText: string;
    asrTranscription: string;
    audioUrl: string;
    geminiScore: number;
    geminiFeedback: string;
    createdAt: string;
}

export interface Feedback {
    id: string;
    educatorId: string;
    educatorName: string;
    studentName: string;
    comment: string;
    priority: string;
    createdAt: string;
    attemptId: string;
    targetText: string;
    audioUrl?: string;
    geminiScore?: number;
    geminiFeedback?: string;
    asrTranscription?: string;
}

export const feedbackService = {
    getSpeakingAttempts: async (studentId: string): Promise<SpeakingAttempt[]> => {
        const res = await apiClient.get<ApiResponse<SpeakingAttempt[]>>(`/educator/interactions/attempts/${studentId}`);
        return (res as any).data || [];
    },
    sendFeedback: async (studentId: string, attemptId: string | undefined, comment: string) => {
        return apiClient.post('/educator/feedback', {
            studentId,
            attemptId,
            comment,
            priority: 'MEDIUM'
        });
    },
    getMailbox: async (): Promise<Feedback[]> => {
        const res = await apiClient.get<ApiResponse<Feedback[]>>('/users/mailbox');
        return (res as any).data || [];
    },
    getStudentFeedbacks: async (studentId: string): Promise<Feedback[]> => {
        const res = await apiClient.get<ApiResponse<Feedback[]>>(`/educator/feedback/student/${studentId}`);
        return (res as any).data || [];
    }
};
