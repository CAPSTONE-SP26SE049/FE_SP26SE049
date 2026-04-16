import React, { useMemo, useState, useRef } from 'react'
import {
    Table, Input, Tag, Space, Button, Tooltip, Avatar,
    Modal, Form, message, Select, Upload, Alert, Badge, Segmented
} from 'antd'
import {
    SearchOutlined, UserOutlined, PlusOutlined,
    UploadOutlined, DownloadOutlined, CheckCircleOutlined,
    StopOutlined, EditOutlined, LockOutlined, UnlockOutlined,
    UserAddOutlined, TeamOutlined
} from '@ant-design/icons'
import { motion } from 'framer-motion'
import { adminService } from '../services/adminService'
import { adminExcelService } from '../services/adminExcelService'
import { downloadBlob } from '../../educator/services/excelService'

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    EDUCATOR: { label: 'Giáo viên', color: '#7c3aed', bg: '#f5f3ff' },
    USER: { label: 'Học viên', color: '#0ea5e9', bg: '#f0f9ff' },
    ADMIN: { label: 'Quản trị', color: '#dc2626', bg: '#fef2f2' },
}

const UserManagementPage = () => {
    const [searchText, setSearchText] = useState('')
    const [roleFilter, setRoleFilter] = useState<string>('ALL')
    const [statusFilter, setStatusFilter] = useState<string>('ALL')
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState<any[]>([])

    // Create user modal
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [createForm] = Form.useForm()

    // Edit user modal
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<any>(null)
    const [editForm] = Form.useForm()
    const [dialects, setDialects] = useState<any[]>([])

    // Excel import/export
    const [isImportOpen, setIsImportOpen] = useState(false)
    const [importFile, setImportFile] = useState<File | null>(null)
    const [importing, setImporting] = useState(false)
    const [importResult, setImportResult] = useState<any>(null)
    const [templateDownloading, setTemplateDownloading] = useState(false)
    const templateInFlight = useRef(false)

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const res: any = await adminService.getUsers().catch(() => null)
            if (!res) { setUsers([]); return }
            let list: any[] = []
            if (Array.isArray(res)) list = res
            else if (Array.isArray(res.data)) list = res.data
            else if (Array.isArray(res.data?.content)) list = res.data.content
            else if (Array.isArray(res.content)) list = res.content
            setUsers(list)
        } catch { /* noop */ } finally { setLoading(false) }
    }

    const fetchDialects = async () => {
        try {
            const res = await adminService.getDialects()
            const data = res?.data || (Array.isArray(res) ? res : [])
            setDialects(data)
        } catch { /* noop */ }
    }

    React.useEffect(() => {
        fetchUsers()
        fetchDialects()
    }, [])

    /* ── Actions ── */
    const handleCreateUser = async (values: any) => {
        try {
            setSubmitting(true)
            const res: any = await adminService.createUser({
                email: values.email,
                fullName: values.fullName,
                role: values.role,
            })
            const roleName = ROLE_CONFIG[values.role]?.label || values.role
            message.success(`Tạo tài khoản ${roleName} thành công! Mật khẩu đã gửi qua email.`)
            setIsCreateOpen(false)
            createForm.resetFields()
            fetchUsers()
        } catch (err: any) {
            message.error(err?.response?.data?.message || 'Không thể tạo tài khoản')
        } finally { setSubmitting(false) }
    }

    const handleOpenEdit = (user: any) => {
        setEditingUser(user)
        editForm.setFieldsValue({ fullName: user.fullName, phone: user.phone || '', region: user.region || '' })
        setIsEditOpen(true)
    }

    const handleUpdateUser = async (values: any) => {
        if (!editingUser) return
        try {
            setSubmitting(true)
            await adminService.updateUser(editingUser.id, values)
            message.success('Cập nhật thông tin thành công')
            setIsEditOpen(false)
            fetchUsers()
        } catch (err: any) {
            message.error(err?.response?.data?.message || 'Cập nhật thất bại')
        } finally { setSubmitting(false) }
    }

    const handleToggleStatus = async (record: any) => {
        const newStatus = !record.isActive
        try {
            await adminService.updateUserStatus(record.id, newStatus)
            message.success(`Đã ${newStatus ? 'mở khóa' : 'khóa'} tài khoản`)
            fetchUsers()
        } catch (err: any) {
            message.error(err?.response?.data?.message || 'Thao tác thất bại')
        }
    }

    const downloadTemplate = async () => {
        if (templateInFlight.current) return
        templateInFlight.current = true
        setTemplateDownloading(true)
        try {
            message.loading({ content: 'Đang tải template...', key: 'tpl' })
            const blob = await adminExcelService.downloadTeacherTemplate()
            downloadBlob(blob, 'template_teachers.xlsx')
            message.success({ content: 'Tải template thành công!', key: 'tpl' })
        } catch { message.error({ content: 'Không thể tải template', key: 'tpl' }) }
        finally { templateInFlight.current = false; setTemplateDownloading(false) }
    }

    const handleExport = async () => {
        try {
            message.loading({ content: 'Đang export...', key: 'exp' })
            const blob = await adminExcelService.exportTeachers()
            downloadBlob(blob, `users_export_${new Date().toISOString().slice(0, 10)}.xlsx`)
            message.success({ content: 'Export thành công!', key: 'exp' })
        } catch { message.error({ content: 'Không thể export', key: 'exp' }) }
    }

    const handleImport = async () => {
        if (!importFile) { message.warning('Vui lòng chọn file Excel'); return }
        setImporting(true); setImportResult(null)
        try {
            const res: any = await adminExcelService.importTeachers(importFile)
            setImportResult(res?.data || res)
            message.success('Import hoàn tất!')
            fetchUsers()
        } catch (e: any) {
            message.error(e?.response?.data?.message || 'Lỗi khi import')
        } finally { setImporting(false) }
    }

    /* ── Stats ── */
    const totalEducator = users.filter(u => (u.roleCode || '').toUpperCase() === 'EDUCATOR').length
    const totalUser = users.filter(u => (u.roleCode || '').toUpperCase() === 'USER').length
    const totalActive = users.filter(u => u.isActive).length
    const totalBanned = users.filter(u => !u.isActive).length
    const totalUsers = users.length

    /* ── Filter ── */
    const filtered = useMemo(() => users.filter(u => {
        const matchSearch = !searchText ||
            u.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchText.toLowerCase())
        const matchRole = roleFilter === 'ALL' || (u.roleCode || '').toUpperCase() === roleFilter
        const matchStatus = statusFilter === 'ALL'
            || (statusFilter === 'ACTIVE' && u.isActive)
            || (statusFilter === 'LOCKED' && !u.isActive)
        return matchSearch && matchRole && matchStatus
    }), [users, searchText, roleFilter, statusFilter])

    /* ── Columns ── */
    const columns = [
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">STT</span>,
            key: 'stt',
            width: 60,
            align: 'center' as const,
            render: (_: any, __: any, idx: number) => (
                <span className="font-bold text-gray-400 text-sm">{idx + 1}</span>
            ),
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Người dùng</span>,
            dataIndex: 'fullName',
            key: 'fullName',
            render: (name: string, record: any) => (
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Avatar
                            src={record.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${record.id}`}
                            icon={<UserOutlined />}
                            className="w-10 h-10 rounded-xl"
                            style={{ borderRadius: 10 }}
                        />
                        {record.isActive
                            ? <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white" />
                            : <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-red-400 rounded-full border-2 border-white" />
                        }
                    </div>
                    <div>
                        <div className="font-bold text-gray-800 text-sm leading-tight">{name}</div>
                        <div className="text-xs text-gray-400">{record.email}</div>
                    </div>
                </div>
            ),
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Vai trò</span>,
            dataIndex: 'roleCode',
            key: 'roleCode',
            render: (role: string) => {
                const key = (role || '').toUpperCase()
                const cfg = ROLE_CONFIG[key] || { label: key, color: '#64748b', bg: '#f1f5f9' }
                return (
                    <span
                        className="text-xs font-black px-2.5 py-1 rounded-lg"
                        style={{ color: cfg.color, backgroundColor: cfg.bg }}
                    >
                        {cfg.label}
                    </span>
                )
            },
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Trạng thái</span>,
            dataIndex: 'isActive',
            key: 'isActive',
            render: (_: any, record: any) => record.isActive ? (
                <Tag icon={<CheckCircleOutlined />} color="success" className="font-bold rounded-lg">Hoạt động</Tag>
            ) : (
                <Tag icon={<StopOutlined />} color="error" className="font-bold rounded-lg">Đã khóa</Tag>
            ),
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Tham gia</span>,
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => (
                <span className="text-sm text-gray-500 font-medium">
                    {date ? new Date(date).toLocaleDateString('vi-VN') : 'N/A'}
                </span>
            ),
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Thao tác</span>,
            key: 'action',
            align: 'center' as const,
            render: (_: any, record: any) => (
                <Space size={4}>
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            type="text" shape="circle"
                            icon={<EditOutlined style={{ color: '#f59e0b' }} />}
                            onClick={() => handleOpenEdit(record)}
                        />
                    </Tooltip>
                    {record.isActive ? (
                        <Tooltip title="Khóa tài khoản">
                            <Button
                                type="text" shape="circle" danger
                                icon={<LockOutlined />}
                                onClick={() => handleToggleStatus(record)}
                            />
                        </Tooltip>
                    ) : (
                        <Tooltip title="Mở khóa tài khoản">
                            <Button
                                type="text" shape="circle"
                                icon={<UnlockOutlined style={{ color: '#16a34a' }} />}
                                onClick={() => handleToggleStatus(record)}
                            />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ]

    return (
        <div className="p-6 min-h-screen bg-gray-50">

            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                    <p className="text-sm text-gray-400 font-medium mt-0.5">Thống kê và quản lý tài khoản học viên, giáo viên</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button icon={<DownloadOutlined />} loading={templateDownloading} onClick={downloadTemplate}
                        className="rounded-xl h-10 font-semibold border-gray-200">
                        Template
                    </Button>
                    <Button icon={<UploadOutlined />}
                        onClick={() => { setImportResult(null); setImportFile(null); setIsImportOpen(true) }}
                        className="rounded-xl h-10 font-semibold border-gray-200">
                        Import
                    </Button>
                    <Button icon={<DownloadOutlined />} onClick={handleExport}
                        className="rounded-xl h-10 font-semibold border-gray-200">
                        Export
                    </Button>
                    <Button
                        type="primary" icon={<UserAddOutlined />}
                        onClick={() => setIsCreateOpen(true)}
                        className="rounded-xl h-10 font-bold border-none"
                        style={{ background: 'linear-gradient(135deg, #9333ea, #7e22ce)', boxShadow: '0 4px 12px rgba(147,51,234,0.35)' }}
                    >
                        Thêm người dùng
                    </Button>
                </div>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Tổng người dùng', val: totalUsers, icon: <TeamOutlined />, color: '#9333ea', bg: '#faf5ff' },
                    { label: 'Đang hoạt động', val: totalActive, icon: <CheckCircleOutlined />, color: '#0ea5e9', bg: '#f0f9ff' },
                    { label: 'Giáo viên', val: totalEducator, icon: <UserAddOutlined />, color: '#10b981', bg: '#f0fdf4' },
                    { label: 'Đã khóa', val: totalBanned, icon: <LockOutlined />, color: '#ef4444', bg: '#fef2f2' },
                ].map(({ label, val, icon, color, bg }, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                            style={{ backgroundColor: bg, color }}>
                            {icon}
                        </div>
                        <div>
                            <div className="text-2xl font-black" style={{ color }}>{val}</div>
                            <div className="text-xs text-gray-400 font-bold mt-0.5">{label}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ── Filters ── */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <Input
                    prefix={<SearchOutlined className="text-gray-300" />}
                    placeholder="Tìm theo tên hoặc email..."
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    allowClear
                    className="rounded-xl h-10 w-72 border-gray-200"
                />
                <Select
                    value={roleFilter}
                    onChange={setRoleFilter}
                    className="h-10 w-44 rounded-xl"
                    options={[
                        { value: 'ALL', label: 'Tất cả vai trò' },
                        { value: 'USER', label: 'Học viên' },
                        { value: 'EDUCATOR', label: 'Giáo viên' },
                    ]}
                />
                <span className="text-sm text-gray-400 font-medium ml-auto">
                    {filtered.length} / {users.length} kết quả
                </span>
            </div>

            {/* ── Table ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <Table
                    columns={columns}
                    dataSource={filtered}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['5', '10', '20', '50'], showTotal: t => `Tổng ${t} người dùng`, style: { padding: '16px 24px' } }}
                    locale={{ emptyText: 'Chưa có người dùng' }}
                    rowClassName="hover:bg-purple-50/30 transition-colors"
                    size="middle"
                    scroll={{ x: 'max-content' }}
                />
            </div>

            {/* ── Modal: Thêm người dùng ── */}
            <Modal
                open={isCreateOpen}
                onCancel={() => { setIsCreateOpen(false); createForm.resetFields() }}
                footer={null}
                centered
                width={500}
                title={
                    <div className="flex items-center gap-3 pb-2">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                            <UserAddOutlined className="text-purple-600 text-lg" />
                        </div>
                        <div>
                            <div className="font-extrabold text-gray-800 text-lg">Thêm người dùng</div>
                            <div className="text-xs text-gray-400">Tạo tài khoản mới và gửi mật khẩu qua email</div>
                        </div>
                    </div>
                }
            >
                <Form form={createForm} layout="vertical" onFinish={handleCreateUser} className="mt-4">
                    <Form.Item name="role" label={<span className="font-bold text-gray-600">Vai trò</span>}
                        rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
                        initialValue="USER">
                        <Select className="h-12 rounded-xl">
                            <Select.Option value="USER">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
                                    Học viên (USER)
                                </div>
                            </Select.Option>
                            <Select.Option value="EDUCATOR">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                                    Giáo viên (EDUCATOR)
                                </div>
                            </Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item name="fullName" label={<span className="font-bold text-gray-600">Họ và tên</span>}
                        rules={[{ required: true, message: 'Vui lòng nhập họ tên' }, { min: 3 }, { max: 50 }]}>
                        <Input prefix={<UserOutlined className="text-gray-300" />} placeholder="Nguyễn Văn A" className="h-12 rounded-xl" />
                    </Form.Item>

                    <Form.Item name="email" label={<span className="font-bold text-gray-600">Email</span>}
                        rules={[{ required: true, message: 'Vui lòng nhập email' }, { type: 'email', message: 'Email không hợp lệ' }, { max: 100 }]}>
                        <Input placeholder="example@email.com" className="h-12 rounded-xl" />
                    </Form.Item>

                    <div className="flex gap-3 justify-end mt-6">
                        <Button onClick={() => { setIsCreateOpen(false); createForm.resetFields() }} className="h-11 px-6 rounded-xl font-bold">Hủy</Button>
                        <Button type="primary" htmlType="submit" loading={submitting}
                            className="h-11 px-8 rounded-xl font-bold border-none"
                            style={{ background: 'linear-gradient(135deg, #9333ea, #7e22ce)' }}>
                            Tạo tài khoản
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* ── Modal: Import Excel ── */}
            <Modal
                title="Import người dùng từ Excel"
                open={isImportOpen}
                onCancel={() => { setIsImportOpen(false); setImportFile(null); setImportResult(null) }}
                onOk={handleImport}
                confirmLoading={importing}
                okText="Import"
                cancelText="Hủy"
                okButtonProps={{ disabled: !importFile }}
                centered
                width={560}
            >
                <div className="mt-3 flex flex-col gap-4">
                    <Button icon={<DownloadOutlined />} loading={templateDownloading} onClick={downloadTemplate} className="rounded-xl w-fit">
                        Tải template mẫu
                    </Button>
                    <Alert type="info" showIcon
                        message="File Excel cần có 2 cột: Email, Họ và tên"
                        description="Mỗi dòng sẽ tạo một tài khoản giáo viên." />
                    <Upload.Dragger accept=".xlsx,.xls" maxCount={1}
                        beforeUpload={f => { setImportFile(f); return false }}
                        onRemove={() => setImportFile(null)}
                        fileList={importFile ? [{ uid: '-1', name: importFile.name, status: 'done' } as any] : []}
                        className="rounded-xl">
                        <p className="font-bold">Kéo thả file hoặc click để chọn</p>
                        <p className="text-gray-400 text-xs mt-1">Chỉ hỗ trợ .xlsx/.xls</p>
                    </Upload.Dragger>
                    {importResult && (
                        <Alert
                            type={importResult?.errorCount > 0 ? 'warning' : 'success'} showIcon
                            message={`Thành công: ${importResult.successCount} | Bỏ qua: ${importResult.skipCount} | Lỗi: ${importResult.errorCount}`}
                        />
                    )}
                </div>
            </Modal>

            {/* ── Modal: Chỉnh sửa ── */}
            <Modal
                title="Chỉnh sửa người dùng"
                open={isEditOpen}
                onCancel={() => { setIsEditOpen(false); setEditingUser(null); editForm.resetFields() }}
                footer={null}
                centered
                width={460}
            >
                <Form form={editForm} layout="vertical" onFinish={handleUpdateUser} className="mt-4">
                    <Form.Item name="fullName" label={<span className="font-bold text-gray-600">Họ và tên</span>}
                        rules={[{ required: true }, { min: 3 }, { max: 50 }]}>
                        <Input className="h-12 rounded-xl" />
                    </Form.Item>
                    <Form.Item name="phone" label={<span className="font-bold text-gray-600">Số điện thoại</span>}
                        rules={[{ pattern: /^(0[3|5|7|8|9])[0-9]{8}$/, message: 'Số điện thoại không hợp lệ' }]}>
                        <Input placeholder="0901234567" className="h-12 rounded-xl" />
                    </Form.Item>
                    <Form.Item name="region" label={<span className="font-bold text-gray-600">Vùng miền</span>}>
                        <Select placeholder="Chọn vùng miền" className="h-12">
                            {dialects.map(d => (
                                <Select.Option key={d.id} value={d.name}>{d.description || d.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <div className="flex gap-3 justify-end mt-4">
                        <Button onClick={() => { setIsEditOpen(false); editForm.resetFields() }} className="h-11 px-6 rounded-xl font-bold">Hủy</Button>
                        <Button type="primary" htmlType="submit" loading={submitting}
                            className="h-11 px-8 rounded-xl font-bold border-none"
                            style={{ background: 'linear-gradient(135deg, #9333ea, #7e22ce)' }}>
                            Lưu thay đổi
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    )
}

export default UserManagementPage
