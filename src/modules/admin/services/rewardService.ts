import apiClient from '../../../services/apiClient'

const BASE = '/admin/rewards'

export interface RewardPayload {
    code: string
    name: string
    description?: string
    iconUrl?: string
    isActive?: boolean
}

const rewardService = {
    /** GET /badges — All badges (admin, including hidden) */
    getAll: () => apiClient.get(BASE),

    /** GET /badges/{id} */
    getById: (id: string) => apiClient.get(`${BASE}/${id}`),

    /** POST /badges */
    create: (data: RewardPayload) => apiClient.post(BASE, data),

    /** PUT /badges/{id} */
    update: (id: string, data: RewardPayload) => apiClient.put(`${BASE}/${id}`, data),

    /** PATCH /badges/{id}/toggle */
    toggleActive: (id: string) => apiClient.patch(`${BASE}/${id}/toggle`),

    /** DELETE /badges/{id} */
    delete: (id: string) => apiClient.delete(`${BASE}/${id}`),
}

export default rewardService
