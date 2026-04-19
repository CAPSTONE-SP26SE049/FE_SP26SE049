import apiClient from '../../../services/apiClient';

export interface PathQuiz {
    quizId: string;
    title: string;
    score: number;
    isCompleted: boolean;
}

export interface PathLevel {
    levelId: string;
    levelName: string;
    regionIndex?: string;
    region: string;
    orderIndex: number;
    quizzes: PathQuiz[];
}

export interface CustomPath {
    id: string;
    title: string;
    description: string;
    levels: PathLevel[];
    isActive: boolean;
    createdAt: string;
}

export const customPathService = {
    // Educator endpoints
    getAllLevels: async () => apiClient.get('/educator/all-levels'),
    createCustomPath: async (studentId: string, data: { title: string; description: string; levelIds: string[] }) =>
        apiClient.post(`/educator/students/${studentId}/custom-path`, data),
    getStudentCustomPath: async (studentId: string) => apiClient.get(`/educator/students/${studentId}/custom-path`),

    // Learner endpoints
    getMyCustomPath: async () => apiClient.get('/learner/custom-path'),
    submitProgress: async (quizId: string, data: { score: number }) =>
        apiClient.post(`/learner/custom-path/quizzes/${quizId}/complete`, data),
};
