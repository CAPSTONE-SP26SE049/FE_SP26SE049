import apiClient from '../../../services/apiClient';

export interface ErrorTagResponse {
    id: string;
    tagCode: string;
    name: string;
    description: string;
    regions: string[];
    createdAt: string;
    updatedAt: string;
}

export interface ErrorTagCreateRequest {
    tagCode: string;
    name: string;
    description: string;
    regions: string[];
}

export const errorTagService = {
    getAll: async (dialectId?: string) => {
        const params = dialectId ? { dialectId } : {};
        const response = await apiClient.get<{ data: ErrorTagResponse[] }>('/public/error-tags', { params });
        return response.data;
    },
    
    create: async (data: ErrorTagCreateRequest) => {
        const response = await apiClient.post<{ data: ErrorTagResponse }>('/admin/error-tags', data);
        return response.data;
    },
    
    update: async (id: string, data: ErrorTagCreateRequest) => {
        const response = await apiClient.put<{ data: ErrorTagResponse }>(`/admin/error-tags/${id}`, data);
        return response.data;
    },
    
    delete: async (id: string) => {
        const response = await apiClient.delete<{ data: null }>(`/admin/error-tags/${id}`);
        return response.data;
    }
};
