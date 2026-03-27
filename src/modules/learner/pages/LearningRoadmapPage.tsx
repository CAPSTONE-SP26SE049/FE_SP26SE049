import React, { useEffect, useMemo, useState } from 'react'
import { Empty, Progress, Spin, Typography } from 'antd'
import { useAuth } from '../../../core/auth/AuthContext'
import WeeklyCalendar from '../components/roadmap/WeeklyCalendar'
import timelineService, { type TimelineResponseData } from '../services/timelineService'

const { Title, Text } = Typography

const LearningRoadmapPage: React.FC = () => {
  const { session } = useAuth()
  const accountId = session?.user?.id

  if (!accountId) {
    return <Empty description="Không tìm thấy tài khoản. Vui lòng đăng nhập lại." />
  }

  const [loading, setLoading] = useState(true)
  const [timeline, setTimeline] = useState<TimelineResponseData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTimeline = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await timelineService.getLearningTimeline(accountId)
        setTimeline(data)
      } catch (err: any) {
        console.error('[LearningRoadmap] fetch error:', err)
        setError(err?.message || 'Khong the tai hanh trinh hoc tap')
      } finally {
        setLoading(false)
      }
    }

    fetchTimeline()
  }, [accountId])

  const progressPercent = useMemo(
    () => timeline?.currentProgress?.phanTramHoanThanh ?? 0,
    [timeline]
  )
  const timelineItems = timeline?.timelineItems ?? []

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50">
      <div className="w-full max-w-none px-8 py-8 xl:px-12">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-12">
            <div className="min-w-0 flex-shrink-0">
              <Title level={3} style={{ marginBottom: 4 }}>
                Lộ trình học tập
              </Title>
              <Text type="secondary" className="block">
                {timeline?.currentProgress?.mienDangHoc
                  ? `Miền đang học: ${timeline.currentProgress.mienDangHoc}`
                  : 'Đang tải thông tin miền học...'}
              </Text>
              <Text type="secondary" className="block">
                Chương hiện tại: {timeline?.currentProgress?.chuongHienTai || 'Chưa xác định'}
              </Text>
            </div>

            <div className="flex-1 w-full">
              <Progress
                percent={progressPercent}
                strokeColor="#f97316"
                trailColor="#e5e7eb"
                showInfo
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center">
            <Spin size="large" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-red-600">{error}</div>
        ) : !timelineItems.length ? (
          <Empty description="Chưa có dữ liệu lộ trình học tập" />
        ) : (
          <WeeklyCalendar timelineItems={timelineItems} />
        )}
      </div>
    </div>
  )
}

export default LearningRoadmapPage
