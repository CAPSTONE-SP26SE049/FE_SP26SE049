import React from 'react'
import { Card, Row, Col, Statistic, Tag, Typography } from 'antd'
import {
  UserOutlined,
  BookOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
} from '@ant-design/icons'
import { adminService } from '../services/adminService'

const { Title, Text } = Typography

const AdminDashboardPage = () => {
  const [loading, setLoading] = React.useState(true)
  const [overview, setOverview] = React.useState<any>({})
  const [engagement, setEngagement] = React.useState<any>({})
  const [heatmaps, setHeatmaps] = React.useState<any>({})
  const [health, setHealth] = React.useState<any>({})
  const [aiPerformance, setAiPerformance] = React.useState<any>({})
  const [feedbacks, setFeedbacks] = React.useState<any[]>([])

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [overviewRes, engagementRes, heatmapsRes, healthRes, aiRes, feedbackRes]: any[] = await Promise.all([
          adminService.getAnalyticsOverview().catch(() => ({ status: 'error' })),
          adminService.getAnalyticsEngagement().catch(() => ({ status: 'error' })),
          adminService.getAnalyticsErrorHeatmaps().catch(() => ({ status: 'error' })),
          adminService.getSystemHealth().catch(() => ({ status: 'error' })),
          adminService.getAiPerformance().catch(() => ({ status: 'error' })),
          adminService.getSystemFeedback().catch(() => ({ status: 'error', data: [] })),
        ])
        if (overviewRes.status === 'success') setOverview(overviewRes.data)
        if (engagementRes.status === 'success') setEngagement(engagementRes.data)
        if (heatmapsRes.status === 'success') setHeatmaps(heatmapsRes.data)
        if (healthRes.status === 'success') setHealth(healthRes.data)
        if (aiRes.status === 'success') setAiPerformance(aiRes.data)
        if (feedbackRes.status === 'success') setFeedbacks(feedbackRes.data || [])
      } catch (error) {
        console.error('Failed to fetch admin dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ background: '#e6f7ff', padding: 10, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DashboardOutlined style={{ fontSize: 24, color: '#1890ff' }} />
        </div>
        <div>
          <Title level={2} style={{ margin: 0, fontSize: 24 }}>Tổng quan</Title>
          <Text type="secondary">Theo dõi sức khỏe hệ thống và chỉ số vận hành</Text>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }} loading={loading}>
            <Statistic title="Tổng người dùng" value={overview.totalUsers || 0} prefix={<UserOutlined />} styles={{ content: { color: '#3f8600' } }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }} loading={loading}>
            <Statistic title="Lượt tập phát âm" value={overview.totalAttempts || 0} prefix={<BookOutlined />} styles={{ content: { color: '#1890ff' } }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }} loading={loading}>
            <Statistic title="Điểm số trung bình" value={overview.averageScore || 0} precision={1} prefix={<CheckCircleOutlined />} styles={{ content: { color: '#faad14' } }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }} loading={loading}>
            <Statistic title="Người dùng hoạt động (7 ngày)" value={overview.activeUsers7Days || 0} prefix={<UserOutlined />} styles={{ content: { color: '#cf1322' } }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Chỉ số tương tác" style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }} loading={loading}>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg"><span>Daily Active Users (DAU)</span><span className="font-semibold text-blue-600">{engagement?.dailyActiveUsers || 0}</span></div>
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg"><span>Thời gian TB / phiên</span><span className="font-semibold text-green-600">{engagement?.averageSessionTimeMinutes || 0} phút</span></div>
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg"><span>Tỷ lệ hoàn thành bài học</span><span className="font-semibold text-orange-600">{engagement?.lessonCompletionRate ? (engagement.lessonCompletionRate * 100).toFixed(1) : 0}%</span></div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Tỷ lệ phát âm sai" style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }} loading={loading}>
            <div className="space-y-3">
              {Object.keys(heatmaps || {}).length > 0 ? (
                Object.entries(heatmaps).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm"><span className="capitalize">{key.replace(/_/g, ' ')}</span><span className="font-semibold text-red-500">{(value * 100).toFixed(1)}%</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-red-500 h-2 rounded-full" style={{ width: `${value * 100}%` }} /></div>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 italic text-center py-4">Chưa đủ dữ liệu thống kê lỗi</div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 2 }}>
        <Col xs={24} lg={12}>
          <Card title="Thống kê nội dung" style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }} loading={loading}>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100"><span>Tổng số chương học</span><span className="font-bold text-blue-600">{overview.totalLevels || 0}</span></div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100"><span>Tổng số thử thách</span><span className="font-bold text-green-600">{overview.totalChallenges || 0}</span></div>
              <div className="flex justify-between items-center py-2"><span>Tổng số bài kiểm tra</span><span className="font-bold text-orange-600">{overview.totalQuizzes || 0}</span></div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Trạng thái hệ thống" style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }} loading={loading}>
            <div className="space-y-3">
              <div className="flex justify-between items-center"><span>Server status</span><Tag color={health.status === 'UP' ? 'green' : 'red'}>{health.status || 'UNKNOWN'}</Tag></div>
              <div className="flex justify-between items-center"><span>Database</span><Tag color={health.databaseStatus === 'CONNECTED' ? 'green' : 'orange'}>{health.databaseStatus || 'UNKNOWN'}</Tag></div>
              <div className="flex justify-between items-center"><span>AI services</span><Tag color={health.aiModelStatus === 'ONLINE' ? 'green' : 'red'}>{health.aiModelStatus || 'UNKNOWN'}</Tag></div>
              <div className="flex justify-between items-center"><span>AI model latency</span><span>{aiPerformance.averageLatencyMs ? `${aiPerformance.averageLatencyMs} ms` : 'N/A'}</span></div>
              <div className="flex justify-between items-center"><span>AI accuracy rate</span><Tag color={aiPerformance.accuracyRate > 0.8 ? 'green' : 'orange'}>{aiPerformance.accuracyRate ? `${(aiPerformance.accuracyRate * 100).toFixed(1)}%` : 'N/A'}</Tag></div>
              <div className="flex justify-between items-center"><span>Uptime</span><span>{health.uptimeSeconds ? `${Math.floor(health.uptimeSeconds / 3600)}h ${Math.floor((health.uptimeSeconds % 3600) / 60)}m` : 'N/A'}</span></div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 2 }}>
        <Col xs={24}>
          <Card title="Phản hồi & báo lỗi gần đây" style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }} loading={loading}>
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
