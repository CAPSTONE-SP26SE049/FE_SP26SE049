import apiClient from '../../../services/apiClient'

export interface MinigameChallengeResponse {
    id: string
    gameType: string
    pairType: string
    questionData: Record<string, any>
    createdAt: string
}

export interface MinigameChallengeRequest {
    gameType: string
    pairType: string
    questionData: Record<string, any>
}

export const minigameService = {
    // ── Learner endpoints ──
    getWordChallenges: async (pairType: string) => {
        try {
            const res = await apiClient.get(`/minigames/word-challenges`, { params: { pairType } })
            return res.data
        } catch {
            return { data: [] }
        }
    },

    getSentenceCompletions: async (pairType: string) => {
        try {
            const res = await apiClient.get(`/minigames/sentence-completions`, { params: { pairType } })
            return res.data
        } catch {
            return { data: [] }
        }
    },

    getMatchingPairs: async (pairType: string): Promise<MinigameChallengeResponse[]> => {
        try {
            const res: any = await apiClient.get(`/minigames/matching-pairs`, { params: { pairType } })
            return res?.data?.data ?? res?.data ?? []
        } catch {
            return []
        }
    },

    getWordGuess: async (pairType: string): Promise<MinigameChallengeResponse[]> => {
        try {
            const res: any = await apiClient.get(`/minigames/word-guess`, { params: { pairType } })
            return res?.data?.data ?? res?.data ?? []
        } catch {
            return []
        }
    },

    getScenarios: async (pairType: string): Promise<MinigameChallengeResponse[]> => {
        try {
            const res: any = await apiClient.get(`/minigames/scenarios`, { params: { pairType } })
            return res?.data?.data ?? res?.data ?? []
        } catch {
            return []
        }
    },

    conversationReply: async (pairType: string, message: string, history: any[]) => {
        try {
            const res = await apiClient.post(`/minigames/conversation`, { pairType, message, history })
            return res.data
        } catch {
            return { reply: 'Xin lỗi, tôi không thể trả lời lúc này.' }
        }
    },

    // ── Admin endpoints ──
    adminGetAll: async (gameType?: string, pairType?: string): Promise<MinigameChallengeResponse[]> => {
        try {
            const params: any = {}
            if (gameType) params.gameType = gameType
            if (pairType) params.pairType = pairType
            const res: any = await apiClient.get('/admin/minigames', { params })
            return res?.data?.data ?? res?.data ?? []
        } catch {
            return []
        }
    },

    adminCreate: async (data: MinigameChallengeRequest): Promise<MinigameChallengeResponse> => {
        const res: any = await apiClient.post('/admin/minigames', data)
        return res?.data?.data ?? res?.data ?? res
    },

    adminUpdate: async (id: string, data: MinigameChallengeRequest): Promise<MinigameChallengeResponse> => {
        const res: any = await apiClient.put(`/admin/minigames/${id}`, data)
        return res?.data?.data ?? res?.data ?? res
    },

    adminDelete: async (id: string): Promise<void> => {
        await apiClient.delete(`/admin/minigames/${id}`)
    },
}
