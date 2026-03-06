import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Spin } from 'antd'
import {
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  StarOutlined
} from '@ant-design/icons'
import { educatorService } from '../services/educatorService'

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<any>({
    totalStudents: 0,
    activeClassrooms: 0,
    totalAttempts: 0,
    averageClassScore: 0
  })

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true)
        const res: any = await educatorService.getDashboardSummary()
        if (res.status === 'success' || res.data) {
          setSummary(res.data || res)
        }
      } catch (error) {
        console.error('Failed to fetch educator dashboard summary:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [])

  return (
    <div className="space-y-6" style={{ background: '#f0f2f5', padding: '12px', borderRadius: '12px' }}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800" style={{ letterSpacing: '-0.5px' }}>Tổng quan hệ thống</h2>
      </div>

      <p className="text-gray-600">
        Chào mừng bạn quay lại! Dưới đây là thống kê tổng quan về các lớp học và học sinh của bạn.
      </p>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={12} lg={6}>
            <Card
              variant="borderless"
              className="shadow-sm rounded-2xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', border: '1px solid #7dd3fc' }}
            >
              <Statistic
                title={<span style={{ color: '#0369a1', fontWeight: 600 }}>Tổng Học Sinh</span>}
                value={summary.totalStudents}
                styles={{ content: { color: '#0369a1', fontWeight: 700 } }}
                prefix={<UserOutlined style={{ color: '#0ea5e9' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              variant="borderless"
              className="shadow-sm rounded-2xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', border: '1px solid #86efac' }}
            >
              <Statistic
                title={<span style={{ color: '#15803d', fontWeight: 600 }}>Lớp Học Đang Mở</span>}
                value={summary.activeClassrooms}
                styles={{ content: { color: '#15803d', fontWeight: 700 } }}
                prefix={<TeamOutlined style={{ color: '#22c55e' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              variant="borderless"
              className="shadow-sm rounded-2xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)', border: '1px solid #fdba74' }}
            >
              <Statistic
                title={<span style={{ color: '#9a3412', fontWeight: 600 }}>Tổng Lượt Luyện Tập</span>}
                value={summary.totalAttempts}
                styles={{ content: { color: '#9a3412', fontWeight: 700 } }}
                prefix={<BookOutlined style={{ color: '#f97316' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              variant="borderless"
              className="shadow-sm rounded-2xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #fefce8 0%, #fef08a 100%)', border: '1px solid #fde047' }}
            >
              <Statistic
                title={<span style={{ color: '#854d0e', fontWeight: 600 }}>Điểm TB Toàn Lớp</span>}
                value={summary.averageClassScore}
                precision={2}
                styles={{ content: { color: '#854d0e', fontWeight: 700 } }}
                prefix={<StarOutlined style={{ color: '#eab308' }} />}
              />
            </Card>
          </Col>
        </Row>
      )}
    </div>
  )
}

export default DashboardPage

