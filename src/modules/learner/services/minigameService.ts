import apiClient from '../../../services/apiClient'

export const minigameService = {
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

    conversationReply: async (pairType: string, message: string, history: any[]) => {
        try {
            const res = await apiClient.post(`/minigames/conversation`, { pairType, message, history })
            return res.data
        } catch {
            return { reply: 'Xin lỗi, tôi không thể trả lời lúc này.' }
        }
    },
}
