import apiClient from './apiClient'

/**
 * Fetch all system configurations (AI tokens, Prompts, etc.)
 */
export const fetchConfigsAPI = async () => {
    return apiClient.get('/admin/configs')
}

/**
 * Bulk update system configurations
 * @param {Record<string, string>} configMap Map of key -> value configurations
 */
export const updateConfigsAPI = async (configMap: Record<string, string>) => {
    return apiClient.put('/admin/configs', configMap)
}
