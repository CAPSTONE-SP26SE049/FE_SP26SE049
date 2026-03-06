import { useState, useEffect } from 'react'
import {
    Table,
    Button,
    Tag,
    Input,
    Space,
    Avatar,
    Progress,
    Modal,
    Form,
    message,
    Tooltip,
    Popconfirm,
    Empty,
    Card
} from 'antd'
import {
    SearchOutlined,
    UserAddOutlined,
    MessageOutlined,
    EyeOutlined,
    DeleteOutlined,
    ArrowLeftOutlined
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { educatorService } from '../services/educatorService'

const StudentManagementPage = () => {
    const { classId } = useParams<{ classId: string }>()
    const navigate = useNavigate()
    const [students, setStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [isAddModalVisible, setIsAddModalVisible] = useState(false)
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState<any>(null)
    const [submitting, setSubmitting] = useState(false)
    const [form] = Form.useForm()
    const [addForm] = Form.useForm()

    const fetchStudents = async () => {
        if (!classId) return
        try {
            setLoading(true)
            const res: any = await educatorService.getClassroomStudents(classId)
            if (res.status === 'success' || res.data) {
                setStudents(res.data || res)
            }
        } catch (error) {
            console.error('Failed to fetch students:', error)
            message.error('Không thể tải danh sách học sinh')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStudents()
    }, [classId])

    const handleAddStudent = async (values: { email: string }) => {
        if (!classId) return
        try {
            setSubmitting(true)
            await educatorService.addStudentToClassroom(classId, values)
            message.success('Đã thêm học sinh vào lớp thành công')
            setIsAddModalVisible(false)
            addForm.resetFields()
            fetchStudents()
        } catch (error: any) {
            console.error('Failed to add student:', error)
            message.error(error.response?.data?.message || 'Lỗi khi thêm học sinh')
        } finally {
            setSubmitting(false)
        }
    }

    const handleRemoveStudent = async (studentId: string) => {
        if (!classId) return
        try {
            await educatorService.removeStudentFromClassroom(classId, studentId)
            message.success('Đã xóa học sinh khỏi lớp')
            fetchStudents()
        } catch (error) {
            console.error('Failed to remove student:', error)
            message.error('Lỗi khi xóa học sinh')
        }
    }

    const handleGiveFeedback = (student: any) => {
        setSelectedStudent(student)
        setFeedbackModalOpen(true)
    }

    const handleFeedbackSubmit = () => {
        form.validateFields().then(() => {
            message.success(`Nhận xét đã được gửi tới ${selectedStudent.fullName || selectedStudent.name}!`)
            setFeedbackModalOpen(false)
            form.resetFields()
        })
    }

    const filteredData = students.filter(
        (student) =>
            (student.fullName || student.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
            (student.email || '').toLowerCase().includes(searchText.toLowerCase())
    )

    const columns = [
        {
            title: 'STT',
            key: 'stt',
            width: 60,
            align: 'center' as const,
            render: (_: any, __: any, index: number) => index + 1,
        },
        {
            title: 'Học Sinh',
            key: 'name',
            render: (_: any, record: any) => (
                <Space>
                    <Avatar style={{ backgroundColor: '#87d068' }}>
                        {(record.fullName || record.name || '?').charAt(0)}
                    </Avatar>
                    <div>
                        <div style={{ fontWeight: 600, color: '#1a1a1a' }}>{record.fullName || record.name}</div>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.email}</div>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Tiến Độ',
            key: 'progress',
            width: 200,
            render: (_: any, record: any) => <Progress percent={record.progress || 0} size="small" />,
        },
        {
            title: 'Sao tích lũy',
            dataIndex: 'totalStars',
            key: 'totalStars',
            render: (stars: number) => (
                <Tag color="gold" style={{ borderRadius: '12px', border: 'none', paddingInline: '10px' }}>
                    {stars || 0} ⭐
                </Tag>
            ),
        },
        {
            title: 'Hành Động',
            key: 'action',
            render: (_: any, record: any) => (
                <Space size="middle">
                    <Tooltip title="Xem chi tiết">
                        <Button
                            icon={<EyeOutlined />}
                            shape="circle"
                            style={{ color: '#1890ff' }}
                            onClick={() => navigate(`/educator/analytics?studentId=${record.id}`)}
                        />
                    </Tooltip>
                    <Tooltip title="Gửi phản hồi">
                        <Button
                            type="primary"
                            icon={<MessageOutlined />}
                            shape="circle"
                            style={{ background: '#52c41a', border: 'none' }}
                            onClick={() => handleGiveFeedback(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Xóa học sinh?"
                        description="Học sinh này sẽ bị loại khỏi lớp học này."
                        onConfirm={() => handleRemoveStudent(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Xóa khỏi lớp">
                            <Button icon={<DeleteOutlined />} shape="circle" danger />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ]

    if (!classId) {
        return (
            <Card variant="borderless" className="shadow-sm rounded-xl">
                <Empty
                    description="Vui lòng chọn một lớp học để quản lý học sinh"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                    <Button
                        type="primary"
                        onClick={() => navigate('/educator/classrooms')}
                        className="!bg-blue-600 !border-none hover:!bg-blue-500 !text-white shadow-none"
                    >
                        Đến Quản Lý Lớp Học
                    </Button>
                </Empty>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
                <Space size="large">
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/educator/classrooms')}
                        style={{ border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                    />
                    <h2 className="text-2xl font-bold text-gray-800 m-0">Danh Sách Học Sinh</h2>
                </Space>
                <Button
                    type="primary"
                    icon={<UserAddOutlined />}
                    onClick={() => setIsAddModalVisible(true)}
                    style={{
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(16,185,129,0.2)'
                    }}
                >
                    Thêm Học Sinh
                </Button>
            </div>

            <Card
                variant="borderless"
                style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
            >
                <div className="mb-6 max-w-md">
                    <Input
                        placeholder="Tìm kiếm theo tên hoặc email..."
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        size="large"
                        style={{ borderRadius: '10px' }}
                        onChange={(e) => setSearchText(e.target.value)}
                        value={searchText}
                    />
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredData}
                    rowKey="id"
                    loading={loading}
                />
            </Card>

            {/* Modal Thêm Học Sinh */}
            <Modal
                title="Thêm Học Sinh Vào Lớp"
                open={isAddModalVisible}
                onOk={() => addForm.submit()}
                onCancel={() => setIsAddModalVisible(false)}
                confirmLoading={submitting}
                okText="Thêm"
                okButtonProps={{ className: '!bg-blue-600 hover:!bg-blue-500 !border-none !text-white' }}
                cancelText="Hủy"
            >
                <Form form={addForm} layout="vertical" onFinish={handleAddStudent}>
                    <Form.Item
                        name="email"
                        label="Email Học Sinh"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email học sinh' },
                            { type: 'email', message: 'Vui lòng nhập đúng định dạng email' },
                            { max: 100, message: 'Email không quá 100 ký tự' }
                        ]}
                    >
                        <Input placeholder="student.example@gmail.com" />
                    </Form.Item>
                    <p className="text-gray-500 text-xs italic">
                        * Lưu ý: Học sinh phải có tài khoản trên hệ thống mới có thể thêm vào lớp.
                    </p>
                </Form>
            </Modal>

            {/* Modal Phản Hồi */}
            <Modal
                title={`Gửi phản hồi cho ${selectedStudent?.fullName || selectedStudent?.name}`}
                open={feedbackModalOpen}
                onOk={handleFeedbackSubmit}
                onCancel={() => setFeedbackModalOpen(false)}
                okText="Gửi"
                okButtonProps={{ className: '!bg-blue-600 hover:!bg-blue-500 !border-none !text-white' }}
                cancelText="Hủy"
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="content"
                        label="Nội dung nhận xét"
                        rules={[
                            { required: true, message: 'Vui lòng nhập nội dung nhận xét!' },
                            { min: 10, message: 'Nhận xét phải ít nhất 10 ký tự' },
                            { max: 500, message: 'Nhận xét không quá 500 ký tự' }
                        ]}
                    >
                        <Input.TextArea rows={4} placeholder="Nhập nhận xét của bạn về tiến độ học tập của học sinh..." showCount maxLength={500} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default StudentManagementPage
