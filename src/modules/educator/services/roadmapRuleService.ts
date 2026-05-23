import apiClient from '../../../services/apiClient';

export interface RoadmapRule {
    id?: string;
    minPercent: number;
    maxPercent: number;
    difficulties: string; // Comma separated
    isActive: boolean;
}

export const roadmapRuleService = {
    getAllRules: async () => apiClient.get('/educator/roadmap-rules'),
    saveRule: async (rule: RoadmapRule) => apiClient.post('/educator/roadmap-rules', rule),
    deleteRule: async (id: string) => apiClient.delete(`/educator/roadmap-rules/${id}`),
    resetToDefault: async () => apiClient.post('/educator/roadmap-rules/reset'),
};
