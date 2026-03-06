import React, { useEffect, useState } from 'react'
import {
    Table,
    Button,
    Card,
    Space,
    Modal,
    Form,
    Input,
    message,
    Tooltip,
    Popconfirm,
    Progress,
    List,
    Typography
} from 'antd'

const { Text } = Typography;
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    TeamOutlined,
    BarChartOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { educatorService } from '../services/educatorService'

const ClassroomManagementPage: React.FC = () => {
    const [classrooms, setClassrooms] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [editingClass, setEditingClass] = useState<any>(null)
    const [submitting, setSubmitting] = useState(false)
    const [performanceModalVisible, setPerformanceModalVisible] = useState(false)
    const [performanceData, setPerformanceData] = useState<any>(null)
    const [performanceLoading, setPerformanceLoading] = useState(false)
    const [form] = Form.useForm()
    const navigate = useNavigate()

    const fetchClassrooms = async () => {
        try {
            setLoading(true)
            const res: any = await educatorService.getClassrooms()
            if (res.status === 'success' || res.data) {
                setClassrooms(res.data || res)
            }
        } catch (error) {
            console.error('Failed to fetch classrooms:', error)
            message.error('Không thể tải danh sách lớp học')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchClassrooms()
    }, [])

    const handleOpenModal = (classroom: any = null) => {
        setEditingClass(classroom)
        if (classroom) {
            form.setFieldsValue({ name: classroom.name })
        } else {
            form.resetFields()
        }
        setIsModalVisible(true)
    }

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields()
            setSubmitting(true)
            if (editingClass) {
                await educatorService.updateClassroom(editingClass.id, values)
                message.success('Cập nhật tên lớp thành công')
            } else {
                await educatorService.createClassroom(values)
                message.success('Tạo lớp học mới thành công')
            }
            setIsModalVisible(false)
            fetchClassrooms()
        } catch (error) {
            console.error('Failed to save classroom:', error)
            message.error('Lỗi khi lưu thông tin lớp học')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteClass = async (id: string) => {
        try {
            await educatorService.deleteClassroom(id)
            message.success('Đã xóa lớp học')
            fetchClassrooms()
        } catch (error) {
            console.error('Failed to delete classroom:', error)
            message.error('Lỗi khi xóa lớp học')
        }
    }

    const handleViewPerformance = async (classId: string) => {
        try {
            setPerformanceModalVisible(true)
            setPerformanceLoading(true)
            setPerformanceData(null)
            const res: any = await educatorService.getClassroomPerformance(classId)
            if (res.status === 'success' || res.data) {
                setPerformanceData(res.data || res)
            }
        } catch (error) {
            console.error('Failed to fetch performance:', error)
            message.error('Không thể tải báo cáo hiệu suất')
            setPerformanceModalVisible(false)
        } finally {
            setPerformanceLoading(false)
        }
    }

    const columns = [
        {
            title: 'Tên Lớp Học',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <span className="font-semibold">{text}</span>
        },
        {
            title: 'Mã Lớp (Code)',
            dataIndex: 'code',
            key: 'code',
            render: (code: string) => <code className="bg-gray-100 px-2 py-1 rounded text-blue-600 font-mono">{code}</code>
        },
        {
            title: 'Ngày Tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleDateString('vi-VN')
        },
        {
            title: 'Hành Động',
            key: 'action',
            render: (_: any, record: any) => (
                <Space size="middle">
                    <Tooltip title="Xem báo cáo">
                        <Button
                            icon={<BarChartOutlined />}
                            onClick={() => handleViewPerformance(record.id)}
                            className="text-purple-600 border-purple-200 hover:bg-purple-50"
                        />
                    </Tooltip>
                    <Tooltip title="Xem học sinh">
                        <Button
                            icon={<TeamOutlined />}
                            onClick={() => navigate(`/educator/classrooms/${record.id}/students`)}
                        />
                    </Tooltip>
                    <Tooltip title="Sửa tên lớp">
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => handleOpenModal(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Xóa lớp học?"
                        description="Tất cả dữ liệu liên kết học sinh sẽ bị ảnh hưởng. Bạn chắc chắn chứ?"
                        onConfirm={() => handleDeleteClass(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Xóa lớp">
                            <Button icon={<DeleteOutlined />} danger />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ]

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
                <h2 className="text-2xl font-bold text-gray-800" style={{ margin: 0 }}>Quản Lý Lớp Học</h2>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleOpenModal()}
                    style={{
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(37,99,235,0.2)'
                    }}
                >
                    Thêm Lớp Mới
                </Button>
            </div>

            <Card
                variant="borderless"
                style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
            >
                <Table
                    columns={columns}
                    dataSource={classrooms}
                    rowKey="id"
                    loading={loading}
                    locale={{ emptyText: 'Chưa có dữ liệu lớp học' }}
                />
            </Card>

            <Modal
                title={<span style={{ fontWeight: 600 }}>{editingClass ? 'Cập Nhật Lớp Học' : 'Tạo Lớp Mới'}</span>}
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={() => setIsModalVisible(false)}
                confirmLoading={submitting}
                okText={editingClass ? 'Cập Nhật' : 'Xác Nhận'}
                okButtonProps={{
                    style: { background: '#2563eb', border: 'none', borderRadius: '6px' }
                }}
                cancelText="Hủy bỏ"
                centered
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="name"
                        label="Tên Lớp"
                        rules={[{ required: true, message: 'Vui lòng nhập tên lớp học' }]}
                    >
                        <Input placeholder="Ví dụ: Lớp Phát âm Miền Bắc - Sáng T2" />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={<span style={{ fontWeight: 600 }}>Báo Cáo Hiệu Suất Lớp Học</span>}
                open={performanceModalVisible}
                onCancel={() => setPerformanceModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setPerformanceModalVisible(false)}>
                        Đóng
                    </Button>
                ]}
                width={600}
                centered
            >
                {performanceLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <Progress type="circle" percent={100} status="active" showInfo={false} />
                    </div>
                ) : performanceData ? (
                    <div className="space-y-6">
                        <div className="bg-gray-50 rounded-xl p-4 flex gap-8">
                            <div className="flex-1 text-center">
                                <div className="text-gray-500 mb-1">Điểm Trung Bình</div>
                                <div className="text-3xl font-bold text-blue-600">{performanceData.averageScore}</div>
                            </div>
                            <div className="flex-1 text-center border-l border-gray-200">
                                <div className="text-gray-500 mb-1">Tỷ Lệ Hoàn Thành</div>
                                <div className="text-3xl font-bold text-green-600">{performanceData.completionRate}%</div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Lỗi Phát Âm Phổ Biến</h3>
                            <List
                                itemLayout="horizontal"
                                dataSource={performanceData.commonErrors || []}
                                renderItem={(item: any) => (
                                    <List.Item>
                                        <List.Item.Meta
                                            title={<Text strong className="text-red-500">Âm vị: {item.phoneme}</Text>}
                                            description={`Xuất hiện: ${item.occurrenceCount} lần - Lỗi trung bình: ${item.averageErrorScore}`}
                                        />
                                    </List.Item>
                                )}
                                locale={{ emptyText: 'Chưa có dữ liệu lỗi phát âm' }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-8">Không có dữ liệu báo cáo.</div>
                )}
            </Modal>
        </div>
    )
}

export default ClassroomManagementPage
