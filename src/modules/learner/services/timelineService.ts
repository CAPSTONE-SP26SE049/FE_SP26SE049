import apiClient from '../../../services/apiClient.js'

export interface TimelineItem {
  date: string
  status: 'completed' | 'in_progress' | 'upcoming'
  title: string
  tooltipDetails: string
  locked: boolean
}

export interface CurrentProgress {
  mienDangHoc: string
  chuongHienTai: string
  phanTramHoanThanh: number
}

export interface TimelineResponseData {
  accountId: string
  todayDate: string
  currentProgress: CurrentProgress
  timelineItems: TimelineItem[]
}

export const timelineService = {
  async getLearningTimeline(accountId: string): Promise<TimelineResponseData> {
    const res: any = await apiClient.get(`/accounts/${accountId}/learning-timeline`)
    return res?.data ?? res
  },
}

export default timelineService
