import React from 'react'
import { Card, Row, Col, Statistic, Tag, Avatar } from 'antd'
import {
  UserOutlined,
  BookOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { adminService } from '../services/adminService'

const AdminDashboardPage = () => {
  const [loading, setLoading] = React.useState(true)
  const [overview, setOverview] = React.useState<any>({})
  const [engagement, setEngagement] = React.useState<any>({})
  const [heatmaps, setHeatmaps] = React.useState<any>({})
  const [health, setHealth] = React.useState<any>({})
  const [aiPerformance, setAiPerformance] = React.useState<any>({})
  const [feedbacks, setFeedbacks] = React.useState<any[]>([])
  const [recentApprovals, setRecentApprovals] = React.useState<any[]>([])

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [overviewRes, engagementRes, heatmapsRes, healthRes, aiRes, feedbackRes, pendingLevelsRes, pendingChallengesRes]: any[] = await Promise.all([
          adminService.getAnalyticsOverview().catch(() => ({ status: 'error' })),
          adminService.getAnalyticsEngagement().catch(() => ({ status: 'error' })),
          adminService.getAnalyticsErrorHeatmaps().catch(() => ({ status: 'error' })),
          adminService.getSystemHealth().catch(() => ({ status: 'error' })),
          adminService.getAiPerformance().catch(() => ({ status: 'error' })),
          adminService.getSystemFeedback().catch(() => ({ status: 'error', data: [] })),
          adminService.getPendingLevels().catch(() => ({ status: 'error', data: [] })),
          adminService.getPendingChallenges().catch(() => ({ status: 'error', data: [] }))
        ])
        if (overviewRes.status === 'success') setOverview(overviewRes.data)
        if (engagementRes.status === 'success') setEngagement(engagementRes.data)
        if (heatmapsRes.status === 'success') setHeatmaps(heatmapsRes.data)
        if (healthRes.status === 'success') setHealth(healthRes.data)
        if (aiRes.status === 'success') setAiPerformance(aiRes.data)
        if (feedbackRes.status === 'success') setFeedbacks(feedbackRes.data || [])

        let pendingContent: any[] = []
        if (pendingLevelsRes.status === 'success' && pendingLevelsRes.data) {
          pendingContent = [...pendingContent, ...pendingLevelsRes.data.map((i: any) => ({ ...i, type: 'level', displayTitle: `Bài học: ${i.title || i.name}`, submittedBy: i.createdBy || 'Educator', date: new Date().toLocaleDateString() }))]
        }
        if (pendingChallengesRes.status === 'success' && pendingChallengesRes.data) {
          pendingContent = [...pendingContent, ...pendingChallengesRes.data.map((i: any) => ({ ...i, type: 'challenge', displayTitle: `Bài tập: ${i.contentText}`, submittedBy: i.createdBy || 'Educator', date: new Date().toLocaleDateString() }))]
        }
        setRecentApprovals(pendingContent)
      } catch (error) {
        console.error('Failed to fetch admin dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Tổng Quan Hệ Thống</h2>

      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" className="shadow-sm rounded-xl hover:shadow-md transition-shadow">
            <Statistic
              title="Tổng Người Dùng"
              value={overview.totalUsers || 0}
              prefix={<UserOutlined />}
              styles={{ content: { color: '#3f8600' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" className="shadow-sm rounded-xl hover:shadow-md transition-shadow" loading={loading}>
            <Statistic
              title="Lượt Tập Phát Âm"
              value={overview.totalAttempts || 0}
              prefix={<BookOutlined />}
              styles={{ content: { color: '#1890ff' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" className="shadow-sm rounded-xl hover:shadow-md transition-shadow" loading={loading}>
            <Statistic
              title="Điểm Số Trung Bình"
              value={overview.averageScore || 0}
              precision={1}
              prefix={<CheckCircleOutlined />}
              styles={{ content: { color: '#faad14' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" className="shadow-sm rounded-xl hover:shadow-md transition-shadow" loading={loading}>
            <Statistic
              title="Người Dùng Active (7 ngày)"
              value={overview.activeUsers7Days || 0}
              prefix={<UserOutlined />}
              styles={{ content: { color: '#cf1322' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Analytics Expansion */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="Chỉ Số Tương Tác (Engagement)" variant="borderless" className="shadow-sm rounded-xl h-full" loading={loading}>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-600">Daily Active Users (DAU)</span>
                <span className="font-bold text-lg text-blue-600">{engagement?.dailyActiveUsers || 0}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-600">Thời gian TB / Phiên</span>
                <span className="font-bold text-lg text-green-600">{engagement?.averageSessionTimeMinutes || 0} phút</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-600">Tỷ lệ hoàn thành bài học</span>
                <span className="font-bold text-lg text-orange-600">{engagement?.lessonCompletionRate ? (engagement.lessonCompletionRate * 100).toFixed(1) : 0}%</span>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Error Heatmaps (Tỷ lệ phát âm sai phổ biến)" variant="borderless" className="shadow-sm rounded-xl h-full" loading={loading}>
            <div className="space-y-4">
              {Object.keys(heatmaps || {}).length > 0 ? (
                Object.entries(heatmaps).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="font-semibold text-red-500">{(value * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: `${value * 100}%` }}></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 italic text-center py-4">Chưa đủ dữ liệu thống kê lỗi</div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Recent Approvals */}
        <Col xs={24} lg={12}>
          <Card
            title="Nội Dung Chờ Phê Duyệt Gần Đây"
            variant="borderless"
            className="shadow-sm rounded-xl"
            extra={<a href="/admin/approvals" className="text-blue-600 hover:text-blue-500 font-medium bg-blue-50 px-3 py-1 rounded-md transition-colors text-sm border border-blue-100">Xem tất cả</a>}
          >
            <div className="space-y-4">
              {recentApprovals.slice(0, 3).map((item: any, index: number) => (
                <div key={index} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                  <Avatar icon={<BookOutlined />} style={{ backgroundColor: item.type === 'level' ? '#1890ff' : '#faad14' }} />
                  <div className="flex-1">
                    <span className="font-medium">{item.displayTitle}</span>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span>Bởi: {item.submittedBy}</span>
                      <span>•</span>
                      <span>{item.date}</span>
                    </div>
                  </div>
                  <Tag color="orange">Chờ duyệt</Tag>
                </div>
              ))}
              {recentApprovals.length === 0 && !loading && (
                <div className="text-gray-400 italic text-center py-4">Không có nội dung chờ duyệt</div>
              )}
            </div>
          </Card>
        </Col>

        {/* System Monitoring */}
        <Col xs={24} lg={12}>
          <Card title="Trạng Thái Hệ Thống" variant="borderless" className="shadow-sm rounded-xl" loading={loading}>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Server Status</span>
                <Tag color={health.status === 'UP' ? 'green' : 'red'}>{health.status || 'UNKNOWN'}</Tag>
              </div>
              <div className="flex justify-between items-center">
                <span>Database</span>
                <Tag color={health.databaseStatus === 'CONNECTED' ? 'green' : 'orange'}>{health.databaseStatus || 'UNKNOWN'}</Tag>
              </div>
              <div className="flex justify-between items-center">
                <span>AI Services</span>
                <Tag color={health.aiModelStatus === 'ONLINE' ? 'green' : 'red'}>{health.aiModelStatus || 'UNKNOWN'}</Tag>
              </div>
              <div className="flex justify-between items-center">
                <span>AI Model Latency</span>
                <span className="text-gray-700 font-medium">{aiPerformance.averageLatencyMs ? `${aiPerformance.averageLatencyMs} ms` : 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>AI Accuracy Rate</span>
                <Tag color={aiPerformance.accuracyRate > 0.8 ? 'green' : 'orange'}>{aiPerformance.accuracyRate ? `${(aiPerformance.accuracyRate * 100).toFixed(1)}%` : 'N/A'}</Tag>
              </div>
              <div className="flex justify-between items-center">
                <span>Uptime</span>
                <span className="text-gray-500 text-sm">{health.uptimeSeconds ? `${Math.floor(health.uptimeSeconds / 3600)}h ${Math.floor((health.uptimeSeconds % 3600) / 60)}m` : 'N/A'}</span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* User Feedback */}
      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <Card title="Phản Hồi & Báo Lỗi Gần Đây" variant="borderless" className="shadow-sm rounded-xl" loading={loading}>
            <div className="space-y-2">
              {feedbacks.slice(0, 5).map((item: any, index: number) => (
                <div key={index} className="flex justify-between w-full py-2 border-b border-gray-100 last:border-0 text-sm">
                  <span className="text-gray-700">{typeof item === 'string' ? item : item.message || JSON.stringify(item)}</span>
                </div>
              ))}
              {feedbacks.length === 0 && !loading && (
                <div className="text-gray-400 italic text-center py-4">Chưa có phản hồi nào</div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default AdminDashboardPage
