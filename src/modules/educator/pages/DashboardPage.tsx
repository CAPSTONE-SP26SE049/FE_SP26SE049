import { useEffect, useState } from 'react'
import { Card, Row, Col, Spin } from 'antd'
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
    <div className="space-y-6" style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px' }}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800" style={{ letterSpacing: '-0.5px' }}>Tổng quan hệ thống</h2>
      </div>

      <p className="text-gray-500">
        Chào mừng bạn quay lại! Dưới đây là thống kê tổng quan về các lớp học và học sinh của bạn.
      </p>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {[
            {
              title: 'Tổng Học Sinh',
              value: summary.totalStudents,
              icon: <UserOutlined />,
              color: '#3b82f6',
              bg: '#eff6ff',
            },
            {
              title: 'Lớp Học',
              value: summary.activeClassrooms,
              icon: <TeamOutlined />,
              color: '#10b981',
              bg: '#ecfdf5',
            },
            {
              title: 'Lượt Luyện Tập',
              value: summary.totalAttempts,
              icon: <BookOutlined />,
              color: '#f59e0b',
              bg: '#fffbeb',
            },
            {
              title: 'Điểm Trung Bình',
              value: summary.averageClassScore,
              icon: <StarOutlined />,
              color: '#8b5cf6',
              bg: '#f5f3ff',
              precision: 2,
            },
          ].map((item) => (
            <Col xs={24} sm={12} lg={6} key={item.title}>
              <Card
                variant="borderless"
                className="shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl border border-gray-100"
                styles={{ body: { padding: '24px' } }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">{item.title}</p>
                    <h3 className="text-2xl font-bold m-0 text-slate-800">
                      {item.precision ? (item.value || 0).toFixed(item.precision) : (item.value || 0)}
                    </h3>
                  </div>
                  <div
                    className="flex items-center justify-center rounded-2xl"
                    style={{
                      width: '44px',
                      height: '44px',
                      backgroundColor: item.bg,
                      color: item.color,
                      fontSize: '18px',
                      boxShadow: `0 8px 16px -4px ${item.color}20`
                    }}
                  >
                    {item.icon}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  )
}

export default DashboardPage
