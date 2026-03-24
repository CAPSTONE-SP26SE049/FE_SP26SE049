import { apiClient } from './apiClient'

export const entrytestService = {
  /**
   * Submit audio for accent classification.
   * @param {string} audioUrl 
   * @returns {Promise<ApiResponse<EntrytestResponse>>}
   */
  submitEntrytest: async (audioUrl) => {
    return apiClient.post('/entrytest/submit', { audioUrl })
  },

  /**
   * Confirm/select region.
   * @param {string} selectedRegion 
   * @returns {Promise<ApiResponse<void>>}
   */
  selectRegion: async (selectedRegion) => {
    return apiClient.put(`/entrytest/select-region?selectedRegion=${selectedRegion}`)
  }
}

export default entrytestService
