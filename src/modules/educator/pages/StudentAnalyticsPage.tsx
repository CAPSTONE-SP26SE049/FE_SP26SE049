import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Spin, Empty, Button, Tag, Modal, Form, Input, Select, message } from 'antd'
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts'
import { BookOutlined, UserOutlined, ArrowLeftOutlined, MessageOutlined } from '@ant-design/icons'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { educatorService } from '../services/educatorService'

const StudentAnalyticsPage: React.FC = () => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const studentId = searchParams.get('studentId')
    const [loading, setLoading] = useState(false)
    const [analyticsData, setAnalyticsData] = useState<any>(null)
    const [feedbackModalVisible, setFeedbackModalVisible] = useState(false)
    const [submittingFeedback, setSubmittingFeedback] = useState(false)
    const [form] = Form.useForm()

    const fetchStudentAnalytics = async () => {
        if (!studentId) return
        try {
            setLoading(true)
            const res: any = await educatorService.getStudentAnalytics(studentId)
            if (res.status === 'success' || res.data) {
                setAnalyticsData(res.data || res)
            }
        } catch (error) {
            console.error('Failed to fetch student analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStudentAnalytics()
    }, [studentId])

    const handleFeedbackSubmit = async (values: any) => {
        if (!studentId) return;
        try {
            setSubmittingFeedback(true)
            await educatorService.submitFeedback(studentId, {
                attemptId: "general_analysis", // Placeholder as this is general analytics, not a specific attempt
                comment: values.comment,
                priority: values.priority
            })
            message.success('Gửi nhận xét thành công')
            setFeedbackModalVisible(false)
            form.resetFields()
            fetchStudentAnalytics()
        } catch (error: any) {
            console.error('Failed to submit feedback:', error)
            message.error(error?.response?.data?.message || 'Lỗi khi gửi nhận xét')
        } finally {
            setSubmittingFeedback(false)
        }
    }

    if (!studentId) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <Empty description="Vui lòng chọn học sinh để xem phân tích chi tiết" />
                <Button
                    type="primary"
                    onClick={() => navigate('/educator/classrooms')}
                    style={{ marginTop: '24px', height: '40px', borderRadius: '8px', background: '#1890ff', border: 'none' }}
                >
                    Quay lại Quản lý Lớp học
                </Button>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spin size="large" tip="Đang tải dữ liệu phân tích..." />
            </div>
        )
    }

    if (!analyticsData) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <Empty description="Chưa có dữ liệu phân tích cho học sinh này" />
                <Button
                    onClick={() => navigate(-1)}
                    style={{ marginTop: '16px', borderRadius: '8px' }}
                >
                    Quay lại
                </Button>
            </div>
        )
    }

    // Mapping API data to Recharts format
    // Expected API output for topErrors: [{ phoneme: "l", accuracy: 0.4, count: 25 }, ...]
    const chartData = (analyticsData.topErrors || []).map((err: any) => ({
        name: `Âm ${err.phoneme.toUpperCase()}`,
        accuracy: (err.accuracy * 100).toFixed(1),
        errorRate: ((1 - err.accuracy) * 100).toFixed(1),
        count: err.count
    }))

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
                <h2 className="text-2xl font-bold text-gray-800 m-0">Phân Tích Chi Tiết: {analyticsData.fullName}</h2>
                <Button
                    type="primary"
                    icon={<MessageOutlined />}
                    onClick={() => setFeedbackModalVisible(true)}
                    className="ml-auto bg-green-600 hover:bg-green-500 border-none"
                    style={{ borderRadius: '8px' }}
                >
                    Gửi Nhận Xét
                </Button>
            </div>

            <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                    <Card variant="borderless" className="shadow-sm rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                        <Statistic
                            title={<span className="text-blue-800 font-medium">Số Lượt Luyện Tập</span>}
                            value={chartData.reduce((acc: number, cur: any) => acc + cur.count, 0)}
                            prefix={<BookOutlined className="text-blue-500" />}
                            valueStyle={{ color: '#1e40af', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card variant="borderless" className="shadow-sm rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-100">
                        <Statistic
                            title={<span className="text-red-800 font-medium">Âm Cần Cải Thiện</span>}
                            value={chartData.length}
                            prefix={<UserOutlined className="text-red-500" />}
                            suffix={<span className="text-sm text-red-600">Âm vị</span>}
                            valueStyle={{ color: '#991b1b', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card title="Tần Suất Lỗi Theo Âm Vị" variant="borderless" className="shadow-sm rounded-xl">
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis unit="%" />
                            <Tooltip
                                formatter={(value, name) => [
                                    `${value}%`,
                                    name === 'accuracy' ? 'Độ chính xác' : 'Tỷ lệ lỗi'
                                ]}
                            />
                            <Legend />
                            <Bar dataKey="accuracy" name="Độ chính xác" fill="#52c41a" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="errorRate" name="Tỷ lệ lỗi" fill="#f5222d" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <Row gutter={[16, 16]}>
                {chartData.map((item: any, index: number) => (
                    <Col xs={24} sm={12} lg={8} key={index}>
                        <Card variant="borderless" className="shadow-sm rounded-xl border-l-4 border-l-red-500">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-gray-500 text-sm">Âm vị</div>
                                    <div className="text-xl font-bold">{item.name}</div>
                                </div>
                                <Tag color="error" className="m-0">Lỗi: {item.errorRate}%</Tag>
                            </div>
                            <div className="mt-4">
                                <div className="text-xs text-gray-500 mb-1">Số lần gặp lỗi: {item.count}</div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div
                                        className="bg-red-500 h-1.5 rounded-full"
                                        style={{ width: `${item.errorRate}%` }}
                                    ></div>
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Modal
                title={<span style={{ fontWeight: 600 }}>Gửi Nhận Xét Đánh Giá</span>}
                open={feedbackModalVisible}
                onOk={() => form.submit()}
                onCancel={() => setFeedbackModalVisible(false)}
                confirmLoading={submittingFeedback}
                okText="Gửi Nhận Xét"
                cancelText="Hủy Bỏ"
                okButtonProps={{ className: 'bg-green-600 hover:bg-green-500 border-none text-white' }}
                centered
            >
                <div className="text-gray-500 mb-4">Gửi phản hồi chung cho tiến trình học tập của <b>{analyticsData.fullName}</b>.</div>
                <Form form={form} layout="vertical" onFinish={handleFeedbackSubmit}>
                    <Form.Item
                        name="priority"
                        label="Mức Độ Ưu Tiên"
                        initialValue="MEDIUM"
                        rules={[{ required: true, message: 'Chọn mức độ ưu tiên' }]}
                    >
                        <Select>
                            <Select.Option value="HIGH">Cao (Cần khắc phục ngay)</Select.Option>
                            <Select.Option value="MEDIUM">Trung bình</Select.Option>
                            <Select.Option value="LOW">Thấp (Gợi ý cải thiện)</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="comment"
                        label="Nội Dung Nhận Xét"
                        rules={[{ required: true, message: 'Vui lòng nhập nội dung nhận xét' }]}
                    >
                        <Input.TextArea rows={4} placeholder="Nhập lời khuyên, hướng dẫn luyện tập hoặc khích lệ..." showCount maxLength={500} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default StudentAnalyticsPage
