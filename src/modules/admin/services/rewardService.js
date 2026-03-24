import { apiClient } from '../../../services/apiClient'

const BASE = '/badges'

export const rewardService = {
    /** Lấy tất cả huy hiệu */
    getAll: () => apiClient.get(BASE),

    getById: (id) => apiClient.get(`${BASE}/${id}`),

    create: (data) => apiClient.post(BASE, data),

    update: (id, data) => apiClient.put(`${BASE}/${id}`, data),

    /** Toggle isActive */
    toggleActive: (id) => apiClient.patch(`${BASE}/${id}/toggle`),

    delete: (id) => apiClient.delete(`${BASE}/${id}`),
}

export default rewardService
