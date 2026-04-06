import React, { useState, useRef } from 'react'
import { Table, Card, Input, Tag, Space, Button, Tooltip, Avatar, Modal, Form, message, Select, Typography, Upload, Alert } from 'antd'
import { SearchOutlined, UserOutlined, PlusOutlined, UploadOutlined, DownloadOutlined, CheckCircleOutlined, StopOutlined, EditOutlined, TeamOutlined } from '@ant-design/icons'
import { Lock, Unlock } from 'lucide-react'
import { adminService } from '../services/adminService'
import { adminExcelService } from '../services/adminExcelService'
import { downloadBlob } from '../../educator/services/excelService'

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

    // Import/Export Excel states
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const [importFile, setImportFile] = useState<File | null>(null)
    const [importing, setImporting] = useState(false)
    const [importResult, setImportResult] = useState<any>(null)
    const [templateDownloading, setTemplateDownloading] = useState(false)
    const templateDownloadInFlight = useRef(false)

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

    /** GET /api/v1/admin/excel/users/template — dùng chung, không dùng link tĩnh */
    const downloadTeacherTemplateExcel = async () => {
        if (templateDownloadInFlight.current) return
        templateDownloadInFlight.current = true
        setTemplateDownloading(true)
        try {
            message.loading({ content: 'Đang tải template...', key: 'tpl' })
            const blob = await adminExcelService.downloadTeacherTemplate()
            downloadBlob(blob, 'template_teachers.xlsx')
            message.success({ content: 'Tải template thành công!', key: 'tpl' })
        } catch (e) {
            message.error({ content: 'Không thể tải template', key: 'tpl' })
        } finally {
            templateDownloadInFlight.current = false
            setTemplateDownloading(false)
        }
    }

    const handleExportExcel = async () => {
        try {
            message.loading({ content: 'Đang export...', key: 'exp' })
            const blob = await adminExcelService.exportTeachers()
            downloadBlob(blob, `teachers_export_${new Date().toISOString().slice(0, 10)}.xlsx`)
            message.success({ content: 'Export thành công!', key: 'exp' })
        } catch (e) {
            message.error({ content: 'Không thể export', key: 'exp' })
        }
    }

    const handleImportExcel = async () => {
        if (!importFile) {
            message.warning('Vui lòng chọn file Excel')
            return
        }
        setImporting(true)
        setImportResult(null)
        try {
            const res: any = await adminExcelService.importTeachers(importFile)
            setImportResult(res?.data || res)
            message.success('Import hoàn tất!')
            fetchUsers()
        } catch (e: any) {
            message.error(e?.response?.data?.message || e?.message || 'Lỗi khi import')
        } finally {
            setImporting(false)
        }
    }

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
                    <Button
                        htmlType="button"
                        icon={<DownloadOutlined />}
                        loading={templateDownloading}
                        style={{ borderRadius: 10, height: 44, fontWeight: 600, border: '1.5px solid #1890ff', color: '#1890ff', background: '#e6f7ff' }}
                        onClick={downloadTeacherTemplateExcel}
                    >
                        Template
                    </Button>
                    <Button
                        icon={<UploadOutlined />}
                        style={{ borderRadius: 10, height: 44, fontWeight: 600, border: '1.5px solid #52c41a', color: '#52c41a', background: '#f6ffed' }}
                        onClick={() => { setImportResult(null); setImportFile(null); setIsImportModalOpen(true) }}
                    >
                        Import
                    </Button>
                    <Button
                        icon={<DownloadOutlined />}
                        style={{ borderRadius: 10, height: 44, fontWeight: 600, border: '1.5px solid #fa8c16', color: '#fa8c16', background: '#fff7e6' }}
                        onClick={handleExportExcel}
                    >
                        Export
                    </Button>
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

            {/* Modal: Import Excel giáo viên */}
            <Modal
                title="Import giáo viên từ Excel"
                open={isImportModalOpen}
                onCancel={() => { setIsImportModalOpen(false); setImportFile(null); setImportResult(null) }}
                onOk={handleImportExcel}
                confirmLoading={importing}
                okText="Import"
                cancelText="Hủy"
                okButtonProps={{ disabled: !importFile }}
                centered
                width={560}
            >
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>1. Tải template mẫu (API)</Text>
                        <Button
                            htmlType="button"
                            icon={<DownloadOutlined />}
                            loading={templateDownloading}
                            onClick={downloadTeacherTemplateExcel}
                            style={{ borderRadius: 8, borderColor: '#1890ff', color: '#1890ff' }}
                        >
                            Tải template giáo viên
                        </Button>
                    </div>
                    <Alert
                        type="info"
                        showIcon
                        message="File Excel cần có 2 cột: Email, Họ và tên"
                        description="Mỗi dòng sẽ map thành { email, fullName } và gọi API tạo giáo viên."
                    />

                    <Upload.Dragger
                        accept=".xlsx,.xls"
                        maxCount={1}
                        beforeUpload={(file) => { setImportFile(file); return false }}
                        onRemove={() => setImportFile(null)}
                        fileList={importFile ? [{ uid: '-1', name: importFile.name, status: 'done' } as any] : []}
                        style={{ borderRadius: 12 }}
                    >
                        <p style={{ fontWeight: 600, marginBottom: 0 }}>Kéo thả file hoặc click để chọn</p>
                        <p style={{ color: '#999', fontSize: 12, marginTop: 6 }}>Chỉ hỗ trợ .xlsx/.xls</p>
                    </Upload.Dragger>

                    {importResult && (
                        <Alert
                            type={importResult?.errorCount > 0 ? 'warning' : 'success'}
                            showIcon
                            message={`Thành công: ${importResult.successCount} | Bỏ qua: ${importResult.skipCount} | Lỗi: ${importResult.errorCount}`}
                            description={
                                importResult?.messages?.length ? (
                                    <ul style={{ margin: '8px 0 0', paddingLeft: 18, maxHeight: 180, overflow: 'auto' }}>
                                        {importResult.messages.map((m: string, idx: number) => (
                                            <li key={idx} style={{ fontSize: 12 }}>{m}</li>
                                        ))}
                                    </ul>
                                ) : null
                            }
                            style={{ borderRadius: 10 }}
                        />
                    )}
                </div>
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
