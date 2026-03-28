import React, { useState } from 'react'
import { Table, Card, Input, Tag, Space, Button, Tooltip, Avatar, Modal, Form, message, Select, Typography } from 'antd'
import { SearchOutlined, UserOutlined, PlusOutlined, UploadOutlined, DownloadOutlined, CheckCircleOutlined, StopOutlined, EditOutlined, TeamOutlined } from '@ant-design/icons'
import { Lock, Unlock } from 'lucide-react'
import { adminService } from '../services/adminService'

const { Title, Text } = Typography

const UserManagementPage = () => {
    const [searchText, setSearchText] = useState('')
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState<any[]>([])
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [form] = Form.useForm()

    const [isEditModalVisible, setIsEditModalVisible] = useState(false)
    const [editingUser, setEditingUser] = useState<any>(null)
    const [editForm] = Form.useForm()
    const [dialects, setDialects] = useState<any[]>([])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const res: any = await adminService.getUsers().catch(() => null)

            if (!res) {
                setUsers([])
                return
            }

            let fetchedUsers: any[] = []
            if (Array.isArray(res)) {
                fetchedUsers = res
            } else if (res.data && Array.isArray(res.data)) {
                fetchedUsers = res.data
            } else if (res.data && res.data.content && Array.isArray(res.data.content)) {
                fetchedUsers = res.data.content
            } else if (res.content && Array.isArray(res.content)) {
                fetchedUsers = res.content
            }

            setUsers(fetchedUsers)
        } catch (error) {
            console.error('Failed to fetch users:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchDialects = async () => {
        try {
            const res = await adminService.getDialects()
            const data = res?.data || (Array.isArray(res) ? res : [])
            setDialects(data)
        } catch (error) {
            console.error('Failed to fetch dialects:', error)
        }
    }

    React.useEffect(() => {
        fetchUsers()
        fetchDialects()
    }, [])

    const handleCreateEducator = async (values: { email: string; fullName: string }) => {
        try {
            setSubmitting(true)
            const res: any = await adminService.createEducator(values)
            if (res.status === 'success') {
                message.success('Tạo tài khoản giáo viên thành công. Mật khẩu đã được gửi qua email.')
                setIsModalVisible(false)
                form.resetFields()
                fetchUsers()
            } else {
                message.error('Có lỗi xảy ra khi tạo tài khoản.')
            }
        } catch (error: any) {
            message.error(error.message || 'Tạo tài khoản thất bại.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleOpenEditModal = (user: any) => {
        setEditingUser(user)
        editForm.setFieldsValue({
            fullName: user.fullName,
            phone: user.phone || '',
            region: user.region || ''
        })
        setIsEditModalVisible(true)
    }

    const handleUpdateUser = async (values: any) => {
        if (!editingUser) return
        try {
            setSubmitting(true)
            const res: any = await adminService.updateUser(editingUser.id, values)
            if (res.status === 'success') {
                message.success('Cập nhật thông tin thành công.')
                setIsEditModalVisible(false)
                fetchUsers()
            } else {
                message.error('Có lỗi xảy ra khi cập nhật.')
            }
        } catch (error: any) {
            message.error(error.message || 'Cập nhật thất bại.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleToggleStatus = async (record: any) => {
        const newStatus = record.isActive ? false : true
        try {
            const res: any = await adminService.updateUserStatus(record.id, newStatus)
            if (res.status === 'success') {
                message.success(`Đã ${newStatus ? 'mở khóa' : 'khóa'} tài khoản thành công.`)
                fetchUsers()
            } else {
                message.error('Có lỗi xảy ra.')
            }
        } catch (error: any) {
            message.error(error.message || 'Cập nhật trạng thái thất bại.')
        }
    }

    const columns = [
        {
            title: 'STT',
            key: 'stt',
            width: 60,
            align: 'center' as const,
            render: (_: any, __: any, index: number) => (
                <span style={{ fontWeight: 600, color: '#64748b' }}>{index + 1}</span>
            ),
        },
        {
            title: 'Người dùng',
            dataIndex: 'fullName',
            key: 'fullName',
            render: (text: string, record: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar icon={<UserOutlined />} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${record.id}`} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{text}</span>
                        <span style={{ fontSize: 12, color: '#64748b' }}>{record.email}</span>
                    </div>
                </div>
            ),
        },
        {
            title: 'Vai trò',
            dataIndex: 'roleCode',
            key: 'roleCode',
            render: (role: any) => {
                let color = 'blue'
                if (role === 'admin') color = 'red'
                if (role === 'educator') color = 'green'
                return <Tag color={color}>{String(role || '').toUpperCase()}</Tag>
            },
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (status: string, record: any) => {
                let color = 'default'
                let icon = null
                const isUserActive = record.isActive !== undefined ? record.isActive : (status === 'active')

                if (isUserActive) {
                    color = 'success'
                    icon = <CheckCircleOutlined />
                } else {
                    color = 'error'
                    icon = <StopOutlined />
                }
                return (
                    <Tag icon={icon} color={color}>
                        {record.isActive !== undefined ? (record.isActive ? 'ACTIVE' : 'BANNED') : (status ? String(status).toUpperCase() : 'UNKNOWN')}
                    </Tag>
                )
            },
        },
        {
            title: 'Ngày tham gia',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => date ? new Date(date).toLocaleDateString('vi-VN') : 'N/A'
        },
        {
            title: 'Hành động',
            key: 'action',
            align: 'center' as const,
            render: (_: any, record: any) => (
                <Space size="middle">
                    <Tooltip title="Chỉnh sửa">
                        <Button type="text" icon={<EditOutlined style={{ color: '#f59e0b', fontSize: 17 }} />} onClick={() => handleOpenEditModal(record)} />
                    </Tooltip>
                    {(record.isActive !== undefined ? record.isActive : record.status === 'active') ? (
                        <Tooltip title="Khóa tài khoản">
                            <Button type="text" danger icon={<Lock size={17} />} onClick={() => handleToggleStatus(record)} />
                        </Tooltip>
                    ) : (
                        <Tooltip title="Mở khóa">
                            <Button type="text" icon={<Unlock size={17} color="#16a34a" />} onClick={() => handleToggleStatus(record)} />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ]

    const filteredData = users.filter(
        (user) =>
            user.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchText.toLowerCase())
    )

    return (
        <div style={{ padding: '24px' }}>
            {/* Header */}
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: '#e6f7ff', padding: 10, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TeamOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                    </div>
                    <div>
                        <Title level={2} style={{ margin: 0, fontSize: 24 }}>Quản lý người dùng</Title>
                        <Text type="secondary">Quản lý tài khoản admin và giáo viên trong hệ thống</Text>
                    </div>
                </div>
                <Space size={12}>
                    <Button icon={<DownloadOutlined />} style={{ borderRadius: 10, height: 44, fontWeight: 600, border: '1.5px solid #1890ff', color: '#1890ff', background: '#e6f7ff' }} onClick={() => message.info('Tính năng Export Excel đang phát triển')}>Export</Button>
                    <Button icon={<UploadOutlined />} style={{ borderRadius: 10, height: 44, fontWeight: 600, border: '1.5px solid #52c41a', color: '#52c41a', background: '#f6ffed' }} onClick={() => message.info('Tính năng Import Excel đang phát triển')}>Import</Button>
                    <Button icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)} style={{ borderRadius: 10, height: 44, fontWeight: 600, boxShadow: '0 4px 12px rgba(24,144,255,0.35)', border: 'none', background: 'linear-gradient(90deg, #1890ff, #0076e4)', color: 'white', paddingInline: 20 }}>
                        Thêm giáo viên
                    </Button>
                </Space>
            </div>

            {/* Filter */}
            <div style={{ marginBottom: 20, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Input
                    placeholder="Tìm kiếm theo tên hoặc email..."
                    prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                    size="large"
                    style={{ width: 360, borderRadius: 10, height: 42 }}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                />
            </div>

            {/* Table - scroll dọc bên trong, không scroll toàn trang */}
            <Card style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
                <Table
                    columns={columns}
                    dataSource={filteredData}
                    rowKey="id"
                    scroll={{ x: 'max-content', y: 400 }}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        pageSizeOptions: ['5', '10', '20', '50'],
                        showTotal: (total) => `Tổng ${total} người dùng`,
                        style: { padding: '16px 24px' }
                    }}
                    loading={loading}
                    locale={{ emptyText: 'Chưa có dữ liệu' }}
                    size="large"
                />
            </Card>

            {/* Modal: Tạo giáo viên */}
            <Modal
                title="Tạo tài khoản giáo viên"
                open={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false)
                    form.resetFields()
                }}
                footer={null}
            >
                <Form layout="vertical" form={form} onFinish={handleCreateEducator}>
                    <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }, { min: 3, message: 'Tên phải ít nhất 3 ký tự' }, { max: 50, message: 'Tên không quá 50 ký tự' }]}>
                        <Input placeholder="Nguyễn Văn A" />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Vui lòng nhập email' }, { type: 'email', message: 'Vui lòng nhập đúng định dạng email' }, { max: 100, message: 'Email không quá 100 ký tự' }]}>
                        <Input placeholder="teacher.nguyen@example.com" />
                    </Form.Item>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
                        <Button onClick={() => { setIsModalVisible(false); form.resetFields(); }} style={{ borderRadius: 8, height: 40, fontWeight: 500 }}>Hủy</Button>
                        <Button type="primary" htmlType="submit" loading={submitting} style={{ borderRadius: 8, height: 40, fontWeight: 600, border: 'none', background: 'linear-gradient(90deg, #1890ff, #0076e4)', color: 'white', boxShadow: '0 4px 12px rgba(24,144,255,0.25)' }}>Tạo tài khoản</Button>
                    </div>
                </Form>
            </Modal>

            {/* Modal: Chỉnh sửa user */}
            <Modal
                title="Chỉnh sửa người dùng"
                open={isEditModalVisible}
                onCancel={() => {
                    setIsEditModalVisible(false)
                    setEditingUser(null)
                    editForm.resetFields()
                }}
                footer={null}
            >
                <Form layout="vertical" form={editForm} onFinish={handleUpdateUser}>
                    <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }, { min: 3, message: 'Tên phải ít nhất 3 ký tự' }, { max: 50, message: 'Tên không quá 50 ký tự' }]}>
                        <Input placeholder="Nguyễn Văn A" />
                    </Form.Item>
                    <Form.Item name="phone" label="Số điện thoại" rules={[{ pattern: /^(0[3|5|7|8|9])[0-9]{8}$/, message: 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)' }]}>
                        <Input placeholder="0901234567" />
                    </Form.Item>
                    <Form.Item name="region" label="Vùng miền" rules={[{ required: true, message: 'Vui lòng chọn vùng miền' }]}>
                        <Select placeholder="Chọn vùng miền">
                            {dialects.map(d => (
                                <Select.Option key={d.id} value={d.name}>{d.description || d.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32 }}>
                        <Button onClick={() => { setIsEditModalVisible(false); editForm.resetFields(); }} style={{ borderRadius: 8, height: 40, paddingInline: 20 }}>Hủy</Button>
                        <Button type="primary" htmlType="submit" loading={submitting} style={{ borderRadius: 8, height: 40, fontWeight: 600, border: 'none', background: 'linear-gradient(90deg, #1890ff, #0076e4)', color: 'white', boxShadow: '0 4px 12px rgba(24,144,255,0.25)', paddingInline: 24 }}>
                            Lưu thay đổi
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    )
}

export default UserManagementPage
