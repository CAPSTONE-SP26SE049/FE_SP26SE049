import React, { useState } from 'react'
import { Table, Card, Input, Tag, Space, Button, Tooltip, Avatar, Modal, Form, message } from 'antd'
import { SearchOutlined, EditOutlined, StopOutlined, CheckCircleOutlined, UserOutlined, PlusOutlined } from '@ant-design/icons'
import { adminService } from '../services/adminService'

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

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const res = await adminService.getUsers().catch(() => ({ status: 'success', data: [] }))
            if (res.status === 'success') {
                setUsers(res.data || [])
            }
        } catch (error) {
            console.error('Failed to fetch users:', error)
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => {
        fetchUsers()
    }, [])

    const handleCreateEducator = async (values: { email: string; fullName: string }) => {
        try {
            setSubmitting(true)
            const res: any = await adminService.createEducator(values)
            if (res.status === 'success') {
                message.success('Tạo tài khoản Giáo viên thành công. Mật khẩu đã được gửi qua email.')
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
        if (!editingUser) return;
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
        const newStatus = record.isActive ? false : true;
        try {
            const res: any = await adminService.updateUserStatus(record.id, newStatus);
            if (res.status === 'success') {
                message.success(`Đã ${newStatus ? 'mở khóa' : 'khóa'} tài khoản thành công.`);
                fetchUsers()
            } else {
                message.error('Có lỗi xảy ra.');
            }
        } catch (error: any) {
            message.error(error.message || 'Cập nhật trạng thái thất bại.');
        }
    }

    const columns = [
        {
            title: 'Người Dùng',
            dataIndex: 'fullName',
            key: 'fullName',
            render: (text: string, record: any) => (
                <div className="flex items-center gap-3">
                    <Avatar icon={<UserOutlined />} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${record.id}`} />
                    <div className="flex flex-col">
                        <span className="font-medium">{text}</span>
                        <span className="text-xs text-gray-500">{record.email}</span>
                    </div>
                </div>
            ),
        },
        {
            title: 'Vai Trò',
            dataIndex: 'roleCode',
            key: 'roleCode',
            render: (role: any) => {
                let color = 'blue'
                if (role === 'admin') color = 'red'
                if (role === 'educator') color = 'green'
                return <Tag color={color}>{role.toUpperCase()}</Tag>
            },
        },
        {
            title: 'Trạng Thái',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (status: string, record: any) => {
                let color = 'default'
                let icon = null
                // Chú ý: Backend có thể trả về isActive = true/false, mock thì dùng status 'active'/'banned'. Ta handle cả 2.
                const isUserActive = record.isActive !== undefined ? record.isActive : (status === 'active');

                if (isUserActive) {
                    color = 'success'
                    icon = <CheckCircleOutlined />
                } else if (!isUserActive) {
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
            title: 'Ngày Tham Gia',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => date ? new Date(date).toLocaleDateString('vi-VN') : 'N/A'
        },
        {
            title: 'Hành Động',
            key: 'action',
            render: (_: any, record: any) => (
                <Space size="middle">
                    <Tooltip title="Chỉnh sửa">
                        <Button type="text" icon={<EditOutlined />} className="text-blue-600" onClick={() => handleOpenEditModal(record)} />
                    </Tooltip>
                    {(record.isActive !== undefined ? record.isActive : record.status === 'active') ? (
                        <Tooltip title="Khóa tài khoản">
                            <Button type="text" danger icon={<StopOutlined />} onClick={() => handleToggleStatus(record)} />
                        </Tooltip>
                    ) : (
                        <Tooltip title="Mở khóa">
                            <Button type="text" className="text-green-600" icon={<CheckCircleOutlined />} onClick={() => handleToggleStatus(record)} />
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Quản Lý Người Dùng</h2>
                <Button type="primary" className="!bg-blue-600 !border-none hover:!bg-blue-500 !text-white" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>Thêm Giáo Viên</Button>
            </div>

            <Card variant="borderless" className="shadow-sm rounded-xl">
                <div className="mb-4 max-w-md">
                    <Input
                        placeholder="Tìm kiếm theo tên hoặc email..."
                        prefix={<SearchOutlined />}
                        size="large"
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>
                <Table
                    columns={columns}
                    dataSource={filteredData}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    loading={loading}
                />
            </Card>

            <Modal
                title="Tạo Tài Khoản Giáo Viên"
                open={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false)
                    form.resetFields()
                }}
                footer={null}
            >
                <Form layout="vertical" form={form} onFinish={handleCreateEducator}>
                    <Form.Item
                        name="fullName"
                        label="Họ và Tên"
                        rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                    >
                        <Input placeholder="Nguyễn Văn A" />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email' },
                            { type: 'email', message: 'Email không hợp lệ' },
                        ]}
                    >
                        <Input placeholder="teacher.nguyen@example.com" />
                    </Form.Item>
                    <div className="flex justify-end gap-2 mt-6">
                        <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
                        <Button type="primary" htmlType="submit" className="!bg-blue-600 !border-none hover:!bg-blue-500 !text-white" loading={submitting}>
                            Tạo Tài Khoản
                        </Button>
                    </div>
                </Form>
            </Modal>

            <Modal
                title="Chỉnh Sửa Người Dùng"
                open={isEditModalVisible}
                onCancel={() => {
                    setIsEditModalVisible(false)
                    setEditingUser(null)
                    editForm.resetFields()
                }}
                footer={null}
            >
                <Form layout="vertical" form={editForm} onFinish={handleUpdateUser}>
                    <Form.Item
                        name="fullName"
                        label="Họ và Tên"
                        rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                    >
                        <Input placeholder="Nguyễn Văn A" />
                    </Form.Item>
                    <Form.Item
                        name="phone"
                        label="Số Điện Thoại"
                    >
                        <Input placeholder="0901234567" />
                    </Form.Item>
                    <Form.Item
                        name="region"
                        label="Vùng Miền"
                    >
                        <Input placeholder="NORTH" />
                    </Form.Item>
                    <div className="flex justify-end gap-2 mt-6">
                        <Button onClick={() => setIsEditModalVisible(false)}>Hủy</Button>
                        <Button type="primary" htmlType="submit" className="!bg-blue-600 !border-none hover:!bg-blue-500 !text-white" loading={submitting}>
                            Lưu Thay Đổi
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    )
}

export default UserManagementPage
