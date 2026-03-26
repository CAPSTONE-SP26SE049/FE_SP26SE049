import React, { useState } from 'react'
import { Table, Card, Input, Tag, Space, Button, Tooltip, Avatar, Modal, Form, message, Select } from 'antd'
import { SearchOutlined, UserOutlined, PlusOutlined, UploadOutlined, DownloadOutlined, CheckCircleOutlined, StopOutlined, EditOutlined } from '@ant-design/icons'
import { Lock, Unlock } from 'lucide-react'
import { adminService } from '../services/adminService'

const UserManagementPage = () => {
    const [searchText, setSearchText] = useState('')
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState<any[]>([])
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [form] = Form.useForm()

    // Pagination state for explicit client-side pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(5)

    const [isEditModalVisible, setIsEditModalVisible] = useState(false)
    const [editingUser, setEditingUser] = useState<any>(null)
    const [editForm] = Form.useForm()
    const [dialects, setDialects] = useState<any[]>([])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const res: any = await adminService.getUsers().catch(() => null)
            console.log("Admin Users API Response:", res)

            if (!res) {
                setUsers([])
                return;
            }

            // Extract the array robustly whether it is wrapped in `data` or returned directly
            let fetchedUsers = [];
            if (Array.isArray(res)) {
                fetchedUsers = res;
            } else if (res.data && Array.isArray(res.data)) {
                fetchedUsers = res.data;
            } else if (res.data && res.data.content && Array.isArray(res.data.content)) {
                fetchedUsers = res.data.content; // In case Spring wraps it in a Page object
            } else if (res.content && Array.isArray(res.content)) {
                fetchedUsers = res.content;
            }

            console.log("Extracted Users Array for Table:", fetchedUsers)
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
            title: 'STT',
            key: 'stt',
            width: 60,
            align: 'center' as const,
            render: (_: any, __: any, index: number) => index + 1,
        },
        {
            title: 'Người dùng',
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
            title: 'Vai trò',
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
            title: 'Trạng thái',
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
            title: 'Ngày tham gia',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => date ? new Date(date).toLocaleDateString('vi-VN') : 'N/A'
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_: any, record: any) => (
                <Space size="middle">
                    <Tooltip title="Chỉnh sửa">
                        <Button type="text" className="text-blue-600 flex items-center justify-center p-0 w-8 h-8" icon={<EditOutlined style={{ fontSize: 18 }} />} onClick={() => handleOpenEditModal(record)} />
                    </Tooltip>
                    {(record.isActive !== undefined ? record.isActive : record.status === 'active') ? (
                        <Tooltip title="Khóa tài khoản">
                            <Button type="text" danger className="flex items-center justify-center p-0 w-8 h-8" icon={<Lock size={18} />} onClick={() => handleToggleStatus(record)} />
                        </Tooltip>
                    ) : (
                        <Tooltip title="Mở khóa">
                            <Button type="text" className="text-green-600 flex items-center justify-center p-0 w-8 h-8" icon={<Unlock size={18} />} onClick={() => handleToggleStatus(record)} />
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

    // Reset pagination when searching
    React.useEffect(() => {
        setCurrentPage(1)
    }, [searchText])

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Người dùng</h2>
                <div className="flex gap-3">
                    <Button icon={<DownloadOutlined />} onClick={() => message.info('Tính năng Export Excel đang phát triển')}>Export Excel</Button>
                    <Button icon={<UploadOutlined />} onClick={() => message.info('Tính năng Import Excel đang phát triển')}>Import Excel</Button>
                    <Button type="primary" className="!bg-blue-600 !border-none hover:!bg-blue-500 !text-white" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>Thêm giáo viên</Button>
                </div>
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
                    scroll={{ x: 'max-content' }}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: filteredData.length,
                        showSizeChanger: true,
                        pageSizeOptions: ['5', '10', '20', '50'],
                        onChange: (page, size) => {
                            setCurrentPage(page);
                            setPageSize(size);
                        }
                    }}
                    loading={loading}
                    locale={{ emptyText: 'Chưa có dữ liệu' }}
                />
            </Card>

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
                    <Form.Item
                        name="fullName"
                        label="Họ và tên"
                        rules={[
                            { required: true, message: 'Vui lòng nhập họ và tên' },
                            { min: 3, message: 'Tên phải ít nhất 3 ký tự' },
                            { max: 50, message: 'Tên không quá 50 ký tự' }
                        ]}
                    >
                        <Input placeholder="Nguyễn Văn A" />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email' },
                            { type: 'email', message: 'Vui lòng nhập đúng định dạng email' },
                            { max: 100, message: 'Email không quá 100 ký tự' }
                        ]}
                    >
                        <Input placeholder="teacher.nguyen@example.com" />
                    </Form.Item>
                    <div className="flex justify-end gap-2 mt-6">
                        <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
                        <Button type="primary" htmlType="submit" className="!bg-blue-600 !border-none hover:!bg-blue-500 !text-white" loading={submitting}>
                            Tạo tài khoản
                        </Button>
                    </div>
                </Form>
            </Modal>

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
                    <Form.Item
                        name="fullName"
                        label="Họ và tên"
                        rules={[
                            { required: true, message: 'Vui lòng nhập họ và tên' },
                            { min: 3, message: 'Tên phải ít nhất 3 ký tự' },
                            { max: 50, message: 'Tên không quá 50 ký tự' }
                        ]}
                    >
                        <Input placeholder="Nguyễn Văn A" />
                    </Form.Item>
                    <Form.Item
                        name="phone"
                        label="Số điện thoại"
                        rules={[
                            { pattern: /^(0[3|5|7|8|9])[0-9]{8}$/, message: 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)' }
                        ]}
                    >
                        <Input placeholder="0901234567" />
                    </Form.Item>
                    <Form.Item
                        name="region"
                        label="Vùng miền"
                        rules={[
                            { required: true, message: 'Vui lòng chọn vùng miền' }
                        ]}
                    >
                        <Select placeholder="Chọn vùng miền">
                            {dialects.map(d => (
                                <Select.Option key={d.id} value={d.name}>
                                    {d.description || d.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <div className="flex justify-end gap-2 mt-6">
                        <Button onClick={() => setIsEditModalVisible(false)}>Hủy</Button>
                        <Button type="primary" htmlType="submit" className="!bg-blue-600 !border-none hover:!bg-blue-500 !text-white" loading={submitting}>
                            Lưu thay đổi
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    )
}

export default UserManagementPage
