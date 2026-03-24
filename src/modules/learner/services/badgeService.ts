import apiClient from '../../../services/apiClient'

// ── Types ──────────────────────────────────────────────────────────────────
export interface BadgeCatalogItem {
    id: string
    code: string
    name: string
    description: string
    iconUrl: string
    criteria: Record<string, unknown>
}

export interface MyBadge {
    id: string
    badgeCode: string
    badgeName: string
    badgeDescription: string
    badgeIconUrl: string
    earnedAt: string
}

// ── Service ────────────────────────────────────────────────────────────────
const badgeService = {
    /**
     * GET /api/v1/badges/catalog
     * Public — All active badges (for learner view/catalog)
     */
    getCatalog: async (): Promise<BadgeCatalogItem[]> => {
        const res: any = await apiClient.get('/badges/catalog')
        return res?.data ?? res ?? []
    },

    /**
     * GET /api/v1/badges/my-badges
     * Authenticated — Badges unlocked by the current user
     */
    getMyBadges: async (): Promise<MyBadge[]> => {
        const res: any = await apiClient.get('/badges/my-badges')
        return res?.data ?? res ?? []
    },
}

export default badgeService
