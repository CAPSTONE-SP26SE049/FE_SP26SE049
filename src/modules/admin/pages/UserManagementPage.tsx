import React, { useMemo, useState, useRef } from 'react'
import {
    Table, Modal, Form, Input, Select, message, Upload, Spin
} from 'antd'
import {
    Search, UserPlus, Upload as UploadIcon, Download,
    CheckCircle2, ShieldAlert, Edit3, Lock, Unlock,
    Users, LayoutGrid, FileSpreadsheet, XCircle,
    User, Mail, Phone, MapPin, Zap, ChevronRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { adminService } from '../services/adminService'
import { adminExcelService, downloadBlob } from '../services/adminExcelService'
import clsx from 'clsx'

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    EDUCATOR: { label: 'Giáo viên', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
    USER: { label: 'Học viên', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    ADMIN: { label: 'Quản trị', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
}

/** Giá trị region khớp BE (UserProfileService.normalizeRegionForStorage). */
const REGION_OPTIONS = [
    { value: 'NORTH', label: 'Miền Bắc' },
    { value: 'CENTRAL', label: 'Miền Trung' },
    { value: 'SOUTH', label: 'Miền Nam' },
]

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
    const [exporting, setExporting] = useState(false)

    const isValidExcelFile = (file: File) => /\.(xlsx|xls|csv)$/i.test(file.name)
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
            await adminService.createUser({
                email: values.email,
                fullName: values.fullName,
                role: values.role,
            })
            message.success(`Tạo tài khoản thành công! Mật khẩu đã gửi qua email.`)
            setIsCreateOpen(false)
            createForm.resetFields()
            fetchUsers()
        } catch (err: any) {
            message.error(err?.response?.data?.message || 'Không thể tạo tài khoản')
        } finally { setSubmitting(false) }
    }

    const handleOpenEdit = (user: any) => {
        setEditingUser(user)
        setIsEditOpen(true)
        setTimeout(() => {
            editForm.setFieldsValue({
                fullName: user?.fullName || '',
                phone: user?.phone || user?.phoneNumber || '',
                region: undefined,
            })
        }, 0)
    }

    const handleCloseEditModal = () => {
        setIsEditOpen(false)
        setEditingUser(null)
        editForm.resetFields()
    }

    const handleUpdateUser = async (values: any) => {
        if (!editingUser) return

        const payload: Record<string, string> = {}
        const fullName = values.fullName?.trim()
        const phone = values.phone?.trim()
        const originalName = (editingUser.fullName || '').trim()
        const originalPhone = (editingUser.phone || editingUser.phoneNumber || '').trim()

        if (fullName !== undefined && fullName !== originalName) payload.fullName = fullName
        if (phone !== undefined && phone !== originalPhone) payload.phone = phone
        if (values.region !== undefined && values.region !== editingUser.region) payload.region = values.region

        if (Object.keys(payload).length === 0) {
            message.warning('Không có thay đổi nào để cập nhật')
            return
        }

        try {
            setSubmitting(true)
            await adminService.updateUser(editingUser.id, payload)
            message.success('Cập nhật thông tin thành công')
            handleCloseEditModal()
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
            message.success({ content: 'Tải file mẫu thành công!', key: 'tpl' })
        } catch { message.error({ content: 'Không thể tải file mẫu', key: 'tpl' }) }
        finally { templateInFlight.current = false; setTemplateDownloading(false) }
    }

    const handleExport = async () => {
        if (exporting) return
        setExporting(true)
        try {
            message.loading({ content: 'Đang xuất file...', key: 'exp' })
            const blob = await adminExcelService.exportTeachers()
            downloadBlob(blob, `users_export_${new Date().toISOString().slice(0, 10)}.xlsx`)
                        rules={[
                            { max: 100, message: 'Họ tên không quá 100 ký tự' },
                            {
                                validator: (_, value) => {
                                    if (value === undefined || value === null || value === '') return Promise.resolve()
                                    if (typeof value === 'string' && value.trim() === '') {
                                        return Promise.reject(new Error('Họ tên không được chỉ chứa khoảng trắng'))
                                    }
                                    return Promise.resolve()
                                },
                            },
                        ]}
                    >
                        <Input
                            size="large"
                            prefix={<User className="text-slate-300" size={18} strokeWidth={3} />}"
                            className="doodle-input"
                            maxLength={100}
                            placeholder="Để trống nếu không đổi tên"
                        />
    }

    const handleImport = async () => {
        if (!importFile) { message.warning('Vui lòng chọn file Excel'); return }
        if (!isValidExcelFile(importFile)) {
            message.error('Chỉ chấp nhận file .xlsx, .xls hoặc .csv')
            return
        }
        setImporting(true)
        setImportResult(null)
        try {
            const res: any = await adminExcelService.importTeachers(importFile)
                        rules={[
                            {
                                validator: (_, value) => {
                                    const v = (value ?? '').trim();
                                    if (!v) return Promise.resolve();
                                    if (/^(0|\+84)[3-9]\d{8}$/.test(v)) return Promise.resolve();
                                    return Promise.reject(new Error('Số điện thoại không hợp lệ'));
                                },
                            },
                        ]}
                    >
                        <Input
                            size="large"
                            prefix={<Phone className="text-slate-300" size={18} strokeWidth={3} />}"
                            className="doodle-input"
                            placeholder="0912345678"
                        />
            fetchUsers()
        } catch (e: any) {
            message.error(e?.response?.data?.message || 'Lỗi nhập file')
        } finally { setImporting(false) }
    }

    /* ── Stats ── */
    const totalEducator = users.filter(u => (u.roleCode || '').toUpperCase() === 'EDUCATOR').length
    const totalUser = users.filter(u => (u.roleCode || '').toUpperCase() === 'USER').length
    const totalActive = users.filter(u => u.isActive).length
    const totalBanned = users.filter(u => !u.isActive).length

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
            title: <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-4">ID</span>,
            key: 'stt',
            width: 80,
            align: 'center' as const,
            render: (_: any, __: any, idx: number) => (
                <div className="w-8 h-8 rounded-lg bg-slate-50 border-[2px] border-slate-900 shadow-[2px_2px_0_#1f293705] flex items-center justify-center font-black text-slate-400 text-xs italic">
                    {idx + 1}
                </div>
            ),
        },
        {
            title: <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Người dùng</span>,
            dataIndex: 'fullName',
            key: 'fullName',
            render: (name: string, record: any) => (
                <div className="flex items-center gap-3 py-2">
                    <div className="relative group/avatar">
                        <div className="w-11 h-11 rounded-2xl border-[2.5px] border-slate-900 bg-white shadow-[3px_3px_0_#1f2937] overflow-hidden group-hover/avatar:rotate-3 transition-transform">
                            <img
                                src={record.avatar_url || record.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${record.id}`}
                                alt={name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className={clsx(
                            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[2px] border-white shadow-sm",
                            record.isActive ? "bg-emerald-500" : "bg-rose-500"
                        )} />
                    </div>
                    <div>
                        <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{name}</div>
                        <div className="text-[10px] font-bold text-slate-400 italic leading-none mt-0.5">{record.email}</div>
                    </div>
                </div>
            ),
        },
        {
            title: <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vai trò</span>,
            dataIndex: 'roleCode',
            key: 'roleCode',
            render: (role: string) => {
                const key = (role || '').toUpperCase()
                const cfg = ROLE_CONFIG[key] || { label: key, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' }
                return (
                    <div className={clsx("inline-flex items-center px-3 py-1 rounded-full border-[2px] font-black text-[9px] uppercase tracking-widest", cfg.bg, cfg.color, cfg.border)}>
                        {cfg.label}
                    </div>
                )
            },
        },
        {
            title: <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Trạng thái</span>,
            dataIndex: 'isActive',
            key: 'isActive',
            render: (_: any, record: any) => record.isActive ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border-[2px] border-emerald-200 text-emerald-600 font-black text-[9px] uppercase tracking-widest">
                    <CheckCircle2 size={10} strokeWidth={4} />
                    Hoạt động
                </div>
            ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 border-[2px] border-rose-200 text-rose-600 font-black text-[9px] uppercase tracking-widest">
                    <ShieldAlert size={10} strokeWidth={4} />
                    Đã khóa
                </div>
            ),
        },
        {
            title: <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tham gia</span>,
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => (
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">
                    {date ? new Date(date).toLocaleDateString('vi-VN') : '—'}
                </div>
            ),
        },
        {
            title: <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 pr-4">Thao tác</span>,
            key: 'action',
            align: 'right' as const,
            render: (_: any, record: any) => (
                <div className="flex items-center justify-end gap-2 pr-4">
                    <button
                        onClick={() => handleOpenEdit(record)}
                        className="p-2.5 rounded-xl border-[2px] border-transparent hover:border-slate-900/10 hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all"
                    >
                        <Edit3 size={18} strokeWidth={3} />
                    </button>
                    {record.isActive ? (
                        <button
                            onClick={() => handleToggleStatus(record)}
                            className="p-2.5 rounded-xl border-[2px] border-transparent hover:border-rose-500/10 hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all"
                        >
                            <Lock size={18} strokeWidth={3} />
                        </button>
                    ) : (
                        <button
                            onClick={() => handleToggleStatus(record)}
                            className="p-2.5 rounded-xl border-[2px] border-transparent hover:border-emerald-500/10 hover:bg-emerald-50 text-slate-400 hover:text-emerald-500 transition-all"
                        >
                            <Unlock size={18} strokeWidth={3} />
                        </button>
                    )}
                </div>
            ),
        },
    ]

    return (
        <div className="min-h-screen bg-[#fbf6ef] font-nunito p-8 space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-10 bg-[#49B6E5] rounded-full shadow-[2px_2px_0_#1f293705]" />
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Quản lý Tài khoản</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Phân quyền và giám sát trạng thái học viên & cộng tác viên</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={downloadTemplate}
                        disabled={templateDownloading}
                        className="flex items-center gap-2 h-12 px-6 bg-white border-[3px] border-slate-900 rounded-2xl shadow-[4px_4px_0_#1f2937] text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
                    >
                        <FileSpreadsheet size={16} strokeWidth={3} />
                        Tải mẫu
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setImportResult(null); setImportFile(null); setIsImportOpen(true) }}
                        disabled={importing}
                        className="flex items-center gap-2 h-12 px-6 bg-white border-[3px] border-slate-900 rounded-2xl shadow-[4px_4px_0_#1f2937] text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all disabled:opacity-50"
                    >
                        <UploadIcon size={16} strokeWidth={3} />
                        Nhập file
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center gap-2 h-12 px-8 bg-[#49B6E5] border-[3px] border-slate-900 rounded-2xl shadow-[5px_5px_0_#1f2937] text-xs font-black uppercase tracking-widest text-white transition-all"
                    >
                        <UserPlus size={18} strokeWidth={4} />
                        Thêm người dùng
                    </motion.button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Tổng người dùng', value: users.length, icon: Users, color: '#8b5cf6', bg: 'bg-violet-50' },
                    { label: 'Đang hoạt động', value: totalActive, icon: CheckCircle2, color: '#10b981', bg: 'bg-emerald-50' },
                    { label: 'Giáo viên', value: totalEducator, icon: UserPlus, color: '#49B6E5', bg: 'bg-blue-50' },
                    { label: 'Tài khoản khóa', value: totalBanned, icon: Lock, color: '#ef4444', bg: 'bg-rose-50' },
                ].map((card) => {
                    const Icon = card.icon
                    return (
                        <motion.article
                            key={card.label}
                            whileHover={{ y: -5 }}
                            className="relative group h-full"
                        >
                            <div className="h-full rounded-2xl border-[3px] border-slate-900 bg-white p-6 shadow-[6px_6px_0_#1f2937] transition-all hover:shadow-[10px_10px_0_#1f2937] flex flex-col justify-between overflow-hidden">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{card.label}</p>
                                    <p className="text-3xl font-black text-slate-900">{card.value}</p>
                                </div>
                                <div className={clsx("mt-6 w-12 h-12 rounded-2xl border-[2.5px] border-slate-900 shadow-[3px_3px_0_#1f2937] flex items-center justify-center transition-transform group-hover:rotate-6", card.bg)}>
                                    <Icon size={24} style={{ color: card.color }} strokeWidth={2.5} />
                                </div>
                                <div className="absolute -bottom-6 -right-6 opacity-5 pointer-events-none group-hover:scale-125 transition-transform">
                                    <Icon size={120} strokeWidth={3} />
                                </div>
                            </div>
                        </motion.article>
                    )
                })}
            </div>

            {/* Filters Area */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-[2rem] border-[3px] border-slate-900 shadow-[4px_4px_0_#1f293705]">
                    <div className="relative flex-1 min-w-[280px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} strokeWidth={3} />
                        <input
                            type="text"
                            placeholder="Tên, email người dùng..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 bg-white border-[2.5px] border-slate-900/10 rounded-2xl focus:border-[#49B6E5] focus:outline-none text-xs font-black uppercase tracking-wider transition-all placeholder:text-slate-300"
                        />
                    </div>

                    <div className="relative w-56">
                        <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} strokeWidth={3} />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 bg-white border-[2.5px] border-slate-900/10 rounded-2xl focus:border-[#49B6E5] appearance-none focus:outline-none text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                        >
                            <option value="ALL">Tất cả vai trò</option>
                            <option value="USER">Học viên</option>
                            <option value="EDUCATOR">Giáo viên</option>
                            <option value="ADMIN">Quản trị viên</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronRight className="rotate-90" size={12} strokeWidth={4} />
                        </div>
                    </div>

                    <div className="ml-auto hidden lg:flex items-center gap-3 px-6 py-2 bg-slate-50 border-[2px] border-slate-900/10 rounded-2xl italic">
                        <div className="w-2 h-2 rounded-full bg-[#49B6E5] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bản ghi hiện có: {filtered.length}</span>
                    </div>
                </div>

                {/* Table Area */}
                <article className="rounded-[2.5rem] border-[3px] border-slate-900 bg-white shadow-[8px_8px_0_#1f2937] overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-8 py-6 border-b-[3px] border-slate-900 bg-slate-50/10">
                        <div className="flex items-center gap-3">
                            <Users size={20} className="text-[#49B6E5]" strokeWidth={3} />
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Danh sách người dùng</h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={handleExport} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">
                                <FileSpreadsheet size={14} /> Xuất CSV
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto min-h-[400px]">
                        <Table
                            columns={columns}
                            dataSource={filtered}
                            rowKey="id"
                            loading={{
                                spinning: loading,
                                indicator: (
                                    <div className="flex flex-col items-center justify-center">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                            className="w-12 h-12 rounded-2xl bg-white border-[3px] border-slate-900 shadow-[4px_4px_0_#49B6E5] flex items-center justify-center mb-4"
                                        >
                                            <Zap className="text-[#49B6E5]" size={24} fill="#49B6E5" fillOpacity={0.2} />
                                        </motion.div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Đang nạp người dùng...</p>
                                    </div>
                                )
                            }}
                            pagination={{
                                pageSize: 8,
                                className: "px-8 py-6 !m-0 border-t-[2px] border-slate-50"
                            }}
                            className="doodle-table"
                            rowClassName="group"
                        />
                    </div>
                </article>
            </div>

            {/* Modals */}
            <Modal
                title={<div className="text-xl font-black text-slate-900 uppercase tracking-tight">Thêm người dùng mới</div>}
                open={isCreateOpen}
                onCancel={() => { setIsCreateOpen(false); createForm.resetFields() }}
                footer={null}
                centered
                width={500}
                className="doodle-modal"
            >
                <Form form={createForm} layout="vertical" onFinish={handleCreateUser} className="mt-8 space-y-5">
                    <Form.Item
                        name="fullName"
                        label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Họ và tên</span>}
                        rules={[
                            { required: true, whitespace: true, message: 'Nhập họ tên' },
                            { max: 100, message: 'Họ tên không quá 100 ký tự' },
                        ]}
                    >
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#49B6E5] transition-colors" size={18} strokeWidth={3} />
                            <Input className="doodle-input pl-12" placeholder="Ví dụ: Nguyễn Văn A" />
                        </div>
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Email xác thực</span>}
                        rules={[{ required: true, message: 'Nhập email' }, { type: 'email' }]}
                    >
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#49B6E5] transition-colors" size={18} strokeWidth={3} />
                            <Input className="doodle-input pl-12" placeholder="name@domain.com" />
                        </div>
                    </Form.Item>

                    <Form.Item
                        name="role"
                        label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Vai trò hệ thống</span>}
                        initialValue="USER"
                    >
                        <Select className="doodle-select">
                            <Select.Option value="USER">Học viên</Select.Option>
                            <Select.Option value="EDUCATOR">Giáo viên</Select.Option>
                            <Select.Option value="ADMIN">Quản trị viên</Select.Option>
                        </Select>
                    </Form.Item>

                    <div className="flex gap-4 pt-6">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => { setIsCreateOpen(false); createForm.resetFields() }}
                            className="flex-1 h-14 rounded-2xl border-[3px] border-slate-900 bg-white text-slate-400 font-black uppercase tracking-widest shadow-[4px_4px_0_#1f293705]"
                        >
                            Hủy bỏ
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={submitting}
                            className="flex-1 h-14 rounded-2xl border-[3px] border-slate-900 bg-[#49B6E5] text-white font-black uppercase tracking-widest shadow-[4px_4px_0_#1f2937]"
                        >
                            {submitting ? 'Đang tạo...' : 'Xác nhận tạo'}
                        </motion.button>
                    </div>
                </Form>
            </Modal>

            {/* Edit User Modal */}
            <Modal
                title={<div className="text-xl font-black text-slate-900 uppercase tracking-tight">Cập nhật thông tin</div>}
                open={isEditOpen}
                onCancel={handleCloseEditModal}
                footer={null}
                centered
                width={500}
                destroyOnClose
                className="doodle-modal"
            >
                <Form form={editForm} layout="vertical" onFinish={handleUpdateUser} className="mt-8 space-y-5">
                    <Form.Item
                        name="fullName"
                        label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Họ và tên</span>}
                        rules={[
                            { max: 100, message: 'Họ tên không quá 100 ký tự' },
                            {
                                validator: (_, value) => {
                                    if (value === undefined || value === null || value === '') return Promise.resolve()
                                    if (typeof value === 'string' && value.trim() === '') {
                                        return Promise.reject(new Error('Họ tên không được chỉ chứa khoảng trắng'))
                                    }
                                    return Promise.resolve()
                                },
                            },
                        ]}
                    >
                        <Input
                            prefix={<User className="text-slate-300" size={18} strokeWidth={3} />}
                            className="doodle-input"
                            maxLength={100}
                            placeholder="Để trống nếu không đổi tên"
                        />
                    </Form.Item>

                    <Form.Item
                        name="phone"
                        label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Số điện thoại</span>}
                        rules={[
                            {
                                validator: (_, value) => {
                                    const v = (value ?? '').trim();
                                    if (!v) return Promise.resolve();
                                    if (/^(0|\+84)[3-9]\d{8}$/.test(v)) return Promise.resolve();
                                    return Promise.reject(new Error('Số điện thoại không hợp lệ'));
                                },
                            },
                        ]}
                    >
                        <Input
                            prefix={<Phone className="text-slate-300" size={18} strokeWidth={3} />}
                            className="doodle-input"
                            placeholder="0912345678"
                        />
                    </Form.Item>

                    <Form.Item
                        name="region"
                        label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Vùng miền</span>}
                    >
                        <Select
                            allowClear
                            placeholder="Chọn vùng miền..."
                            className="doodle-select"
                            suffixIcon={<MapPin className="text-slate-300" size={16} strokeWidth={3} />}
                            options={REGION_OPTIONS}
                        />
                    </Form.Item>

                    <div className="flex gap-4 pt-6">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={handleCloseEditModal}
                            className="flex-1 h-14 rounded-2xl border-[3px] border-slate-900 bg-white text-slate-400 font-black uppercase tracking-widest shadow-[4px_4px_0_#1f293705]"
                        >
                            Hủy
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={submitting}
                            className="flex-1 h-14 rounded-2xl border-[3px] border-slate-900 bg-[#49B6E5] text-white font-black uppercase tracking-widest shadow-[4px_4px_0_#1f2937]"
                        >
                            {submitting ? 'Đang lưu...' : 'Lưu cập nhật'}
                        </motion.button>
                    </div>
                </Form>
            </Modal>

            {/* Import Excel Modal */}
            <Modal
                title={<div className="text-xl font-black text-slate-900 uppercase tracking-tight">Nhập người dùng bằng Excel</div>}
                open={isImportOpen}
                onCancel={() => { setIsImportOpen(false); setImportFile(null); setImportResult(null) }}
                onOk={handleImport}
                footer={null}
                centered
                width={560}
                className="doodle-modal"
            >
                <div className="mt-8 space-y-6">
                    <div className="bg-blue-50 p-4 rounded-2xl border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f293705]">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-black uppercase tracking-widest text-[#49B6E5]">Cấu trúc tệp</span>
                            <button onClick={downloadTemplate} className="text-[10px] font-black uppercase underline text-slate-400 hover:text-slate-900">Tải tệp mẫu</button>
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 italic">File cần có cột Email và Họ và tên. Hệ thống sẽ tự động tạo tài khoản giáo viên.</p>
                    </div>

                    <div className="relative group p-10 border-[3px] border-dashed border-slate-900/10 rounded-[2.5rem] bg-slate-50 hover:bg-white hover:border-[#49B6E5] transition-all text-center">
                        <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex flex-col items-center gap-4">
                            <div className={clsx("w-16 h-16 rounded-2xl border-[3px] border-slate-900 shadow-[4px_4px_0_#1f2937] flex items-center justify-center transition-transform group-hover:rotate-6", importFile ? "bg-emerald-400 text-white" : "bg-white text-slate-300")}>
                                <FileSpreadsheet size={32} />
                            </div>
                            <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                                {importFile ? importFile.name : 'Nhấn để chọn hoặc kéo thả tệp Excel'}
                            </div>
                        </div>
                    </div>

                    {importResult && (
                        <div className={clsx("p-4 rounded-2xl border-[2.5px]", importResult.errorCount > 0 ? "bg-orange-50 border-orange-200 text-orange-600" : "bg-emerald-50 border-emerald-200 text-emerald-600")}>
                            <div className="text-[10px] font-black uppercase tracking-widest mb-1">Kết quả xử lý:</div>
                            <div className="text-xs font-bold italic">
                                Thành công: {importResult.successCount} | Bỏ qua: {importResult.skipCount} | Lỗi: {importResult.errorCount}
                            </div>
                        </div>
                    )}

                    <motion.button
                        whileHover={importFile ? { scale: 1.02, y: -2 } : {}}
                        whileTap={importFile ? { scale: 0.98 } : {}}
                        onClick={handleImport}
                        disabled={!importFile || importing}
                        className={clsx(
                            "w-full h-14 rounded-2xl border-[3px] border-slate-900 bg-[#49B6E5] text-white font-black uppercase tracking-widest shadow-[4px_4px_0_#1f2937] transition-all",
                            (!importFile || importing) && "opacity-50 grayscale"
                        )}
                    >
                        {importing ? "Đang xử lý..." : "Xác nhận nhập"}
                    </motion.button>
                </div>
            </Modal>

            {/* Custom Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .doodle-table .ant-table-thead > tr > th {
                    background: transparent !important;
                    border-bottom: 3px solid #1f2937 !important;
                    padding: 1.5rem !important;
                    font-family: 'Nunito' !important;
                }
                .doodle-table .ant-table-tbody > tr > td { padding: 1.25rem 1.5rem !important; border-bottom: 2px solid #1f293708 !important; }
                
                .doodle-modal .ant-modal-content {
                    border: 4px solid #1f2937 !important; border-radius: 3rem !important;
                    box-shadow: 12px 12px 0 #1f2937 !important; background: #fbf6ef !important;
                    padding: 2.5rem !important;
                }
                .doodle-modal .ant-modal-header { background: transparent !important; border: none !important; margin-bottom: 1rem !important; }
                
                .doodle-input {
                    height: 54px; border: 2.5px solid #1f293720 !important; border-radius: 1.25rem !important;
                    font-weight: 700 !important; font-family: 'Nunito' !important;
                    transition: all 0.2s ease !important;
                }
                .doodle-input:focus { border-color: #49B6E5 !important; box-shadow: none !important; }
                
                .doodle-select .ant-select-selector {
                    height: 54px !important; border: 2.5px solid #1f293720 !important; border-radius: 1.25rem !important;
                    display: flex !important; align-items: center !important;
                    font-weight: 700 !important;
                }
                .doodle-select:focus .ant-select-selector { border-color: #49B6E5 !important; }
            `}} />
        </div>
    )
}

export default UserManagementPage
