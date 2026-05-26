import apiClient from './apiClient'

export interface PlacementQuestion {
  id: string
  targetText: string
  regionCategory?: string
}

export const entryTestService = {
  getPlacementSet: () => apiClient.get('/test/placement-set'),

  analyzeStep: (questionId: string, audioFile: File) => {
    const formData = new FormData()
    formData.append('questionId', questionId)
    formData.append('file', audioFile, 'recording.webm')
    return apiClient.post('/test/analyze-step', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    })
  },

  finishTest: (stepResults: Record<string, unknown>[]) =>
    apiClient.post('/test/finish', stepResults, { timeout: 60000 }),
}

export default entryTestService
