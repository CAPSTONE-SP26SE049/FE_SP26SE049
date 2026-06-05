import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Table, Modal, Form, Input, Select, message, Empty } from 'antd'
import { motion } from 'framer-motion'
import {
    MessageSquare, Search, CheckCircle2, Clock, AlertCircle,
    XCircle, ChevronRight, Eye, RefreshCw, Zap, Image
} from 'lucide-react'
import clsx from 'clsx'
import { userFeedbackService, UserFeedbackResponse } from '../../learner/services/userFeedbackService'
import { ADMIN_TABLE_LOCALE } from '../constants/tableLocale'

const { TextArea } = Input

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
    PENDING:     { label: 'Chờ xử lý',     color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   icon: Clock },
    IN_PROGRESS: { label: 'Đang xử lý',    color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',    icon: AlertCircle },
    RESOLVED:    { label: 'Đã giải quyết', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
    CLOSED:      { label: 'Đã đóng',       color: 'text-slate-500',   bg: 'bg-slate-50',   border: 'border-slate-200',   icon: XCircle },
}

const CATEGORIES = [
    { value: 'BUG',     label: 'Lỗi hệ thống' },
    { value: 'UI',      label: 'Giao diện' },
    { value: 'FEATURE', label: 'Đề xuất tính năng' },
    { value: 'CONTENT', label: 'Nội dung học tập' },
    { value: 'OTHER',   label: 'Khác' },
]

const STATUSES = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

const UserFeedbackManagementPage: React.FC = () => {
    const [feedbacks, setFeedbacks] = useState<UserFeedbackResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [totalElements, setTotalElements] = useState(0)
    const [page, setPage] = useState(0)
    const [pageSize] = useState(10)

    const [searchText, setSearchText] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')

    const [detailItem, setDetailItem] = useState<UserFeedbackResponse | null>(null)
    const [isUpdateOpen, setIsUpdateOpen] = useState(false)
    const [updating, setUpdating] = useState(false)
    const [updateForm] = Form.useForm()
    const [loadFailed, setLoadFailed] = useState(false)
    const fetchInFlight = useRef(false)

    const fetchFeedbacks = useCallback(async (p: number) => {
        if (fetchInFlight.current) return
        fetchInFlight.current = true
        try {
            setLoading(true)
            setLoadFailed(false)
            const res = await userFeedbackService.getAllFeedbacks({
                status: statusFilter || undefined,
                category: categoryFilter || undefined,
                page: p,
                size: pageSize,
            })
            setFeedbacks(res?.content ?? [])
            setTotalElements(res?.totalElements ?? 0)
        } catch {
            setFeedbacks([])
            setTotalElements(0)
            setLoadFailed(true)
        } finally {
            setLoading(false)
            fetchInFlight.current = false
        }
    }, [statusFilter, categoryFilter, pageSize])

    useEffect(() => {
        fetchFeedbacks(page)
    }, [page, fetchFeedbacks])

    const handleStatusFilterChange = (value: string) => {
        setStatusFilter(value)
        setPage(0)
    }

    const handleCategoryFilterChange = (value: string) => {
        setCategoryFilter(value)
        setPage(0)
    }

    const filtered = useMemo(() => {
        if (!searchText) return feedbacks
        const q = searchText.toLowerCase()
        return feedbacks.filter(f =>
            f.title?.toLowerCase().includes(q) ||
            f.senderName?.toLowerCase().includes(q) ||
            f.senderEmail?.toLowerCase().includes(q)
        )
    }, [feedbacks, searchText])

    const handleOpenUpdate = (item: UserFeedbackResponse) => {
        setDetailItem(item)
        updateForm.setFieldsValue({ status: item.status, adminNote: item.adminNote || '' })
        setIsUpdateOpen(true)
    }

    const handleUpdate = async (values: any) => {
        if (!detailItem) return
        try {
            setUpdating(true)
            await userFeedbackService.updateStatus(detailItem.id, values.status, values.adminNote)
            message.success('Cập nhật thành công')
            setIsUpdateOpen(false)
            setDetailItem(null)
            fetchFeedbacks(page)
        } catch (err: any) {
            message.error(err?.response?.data?.message || 'Cập nhật thất bại')
        } finally {
            setUpdating(false)
        }
    }

    const stats = useMemo(() => ({
        pending:    feedbacks.filter(f => f.status === 'PENDING').length,
        inProgress: feedbacks.filter(f => f.status === 'IN_PROGRESS').length,
        resolved:   feedbacks.filter(f => f.status === 'RESOLVED').length,
    }), [feedbacks])

    const columns = [
        {
            title: <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">#</span>,
            key: 'stt',
            width: 60,
            align: 'center' as const,
            render: (_: any, __: any, idx: number) => (
                <div className="w-8 h-8 rounded-lg bg-slate-50 border-[2px] border-slate-900 flex items-center justify-center font-black text-slate-400 text-xs italic">
                    {page * pageSize + idx + 1}
                </div>
            ),
        },
        {
            title: <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Người gửi</span>,
            key: 'sender',
            render: (_: any, record: UserFeedbackResponse) => (
                <div className="py-1">
                    <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{record.senderName}</div>
                    <div className="text-[10px] font-bold text-slate-400 italic">{record.senderEmail}</div>
                </div>
            ),
        },
        {
            title: <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loại</span>,
            dataIndex: 'category',
            key: 'category',
            render: (cat: string) => (
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                    {CATEGORIES.find(c => c.value === cat)?.label || cat}
                </span>
            ),
        },
        {
            title: <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tiêu đề</span>,
            dataIndex: 'title',
            key: 'title',
            render: (title: string) => (
                <div className="text-sm font-bold text-slate-700 max-w-[220px] truncate">{title}</div>
            ),
        },
        {
            title: <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Trạng thái</span>,
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING
                const Icon = cfg.icon
                return (
                    <div className={clsx('inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border-[2px] font-black text-[9px] uppercase tracking-widest', cfg.bg, cfg.color, cfg.border)}>
                        <Icon size={10} strokeWidth={3} />
                        {cfg.label}
                    </div>
                )
            },
        },
        {
            title: <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ngày gửi</span>,
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => (
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                    {date ? new Date(date).toLocaleDateString('vi-VN') : '—'}
                </div>
            ),
        },
        {
            title: <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 pr-4">Thao tác</span>,
            key: 'action',
            align: 'right' as const,
            render: (_: any, record: UserFeedbackResponse) => (
                <div className="flex items-center justify-end gap-2 pr-4">
                    <button
                        onClick={() => setDetailItem(record)}
                        className="p-2.5 rounded-xl border-[2px] border-transparent hover:border-slate-900/10 hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all"
                        title="Xem chi tiết"
                    >
                        <Eye size={16} strokeWidth={3} />
                    </button>
                    <button
                        onClick={() => handleOpenUpdate(record)}
                        className="p-2.5 rounded-xl border-[2px] border-transparent hover:border-[#49B6E5]/20 hover:bg-blue-50 text-slate-400 hover:text-[#49B6E5] transition-all"
                        title="Cập nhật trạng thái"
                    >
                        <RefreshCw size={16} strokeWidth={3} />
                    </button>
                </div>
            ),
        },
    ]

    return (
        <div className="min-h-screen bg-[#fbf6ef] font-nunito p-8 space-y-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-10 bg-[#49B6E5] rounded-full" />
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Quản lý Phản hồi</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Xem xét và xử lý phản hồi từ người dùng</p>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fetchFeedbacks(page)}
                    className="flex items-center gap-2 h-12 px-6 bg-white border-[3px] border-slate-900 rounded-2xl shadow-[4px_4px_0_#1f2937] text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
                >
                    <RefreshCw size={16} strokeWidth={3} />
                    Làm mới
                </motion.button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Tổng phản hồi', value: totalElements,   icon: MessageSquare, color: '#8b5cf6', bg: 'bg-violet-50' },
                    { label: 'Chờ xử lý',     value: stats.pending,    icon: Clock,         color: '#f59e0b', bg: 'bg-amber-50' },
                    { label: 'Đang xử lý',    value: stats.inProgress, icon: AlertCircle,   color: '#49B6E5', bg: 'bg-blue-50' },
                    { label: 'Đã giải quyết', value: stats.resolved,   icon: CheckCircle2,  color: '#10b981', bg: 'bg-emerald-50' },
                ].map(card => {
                    const Icon = card.icon
                    return (
                        <motion.article key={card.label} whileHover={{ y: -5 }} className="relative group">
                            <div className="rounded-2xl border-[3px] border-slate-900 bg-white p-6 shadow-[6px_6px_0_#1f2937] hover:shadow-[10px_10px_0_#1f2937] transition-all flex flex-col justify-between overflow-hidden">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{card.label}</p>
                                    <p className="text-3xl font-black text-slate-900">{card.value}</p>
                                </div>
                                <div className={clsx('mt-6 w-12 h-12 rounded-2xl border-[2.5px] border-slate-900 shadow-[3px_3px_0_#1f2937] flex items-center justify-center group-hover:rotate-6 transition-transform', card.bg)}>
                                    <Icon size={24} style={{ color: card.color }} strokeWidth={2.5} />
                                </div>
                            </div>
                        </motion.article>
                    )
                })}
            </div>

            {/* Filters + Table */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-[2rem] border-[3px] border-slate-900 shadow-[4px_4px_0_#1f293705]">
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} strokeWidth={3} />
                        <input
                            type="text"
                            placeholder="Tên, email, tiêu đề..."
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 bg-white border-[2.5px] border-slate-900/10 rounded-2xl focus:border-[#49B6E5] focus:outline-none text-xs font-black uppercase tracking-wider transition-all placeholder:text-slate-300"
                        />
                    </div>
                    <div className="relative w-48">
                        <select
                            value={statusFilter}
                            onChange={e => handleStatusFilterChange(e.target.value)}
                            className="w-full h-12 pl-4 pr-8 bg-white border-[2.5px] border-slate-900/10 rounded-2xl focus:border-[#49B6E5] appearance-none focus:outline-none text-[10px] font-black uppercase tracking-widest cursor-pointer"
                        >
                            <option value="">Tất cả trạng thái</option>
                            {STATUSES.map(s => (
                                <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>
                            ))}
                        </select>
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none text-slate-400" size={12} strokeWidth={4} />
                    </div>
                    <div className="relative w-48">
                        <select
                            value={categoryFilter}
                            onChange={e => handleCategoryFilterChange(e.target.value)}
                            className="w-full h-12 pl-4 pr-8 bg-white border-[2.5px] border-slate-900/10 rounded-2xl focus:border-[#49B6E5] appearance-none focus:outline-none text-[10px] font-black uppercase tracking-widest cursor-pointer"
                        >
                            <option value="">Tất cả loại</option>
                            {CATEGORIES.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none text-slate-400" size={12} strokeWidth={4} />
                    </div>
                    <div className="ml-auto hidden lg:flex items-center gap-3 px-6 py-2 bg-slate-50 border-[2px] border-slate-900/10 rounded-2xl italic">
                        <div className="w-2 h-2 rounded-full bg-[#49B6E5] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{filtered.length} kết quả</span>
                    </div>
                </div>

                <article className="rounded-[2.5rem] border-[3px] border-slate-900 bg-white shadow-[8px_8px_0_#1f2937] overflow-hidden">
                    <div className="flex items-center gap-3 px-8 py-6 border-b-[3px] border-slate-900 bg-slate-50/10">
                        <MessageSquare size={20} className="text-[#49B6E5]" strokeWidth={3} />
                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Danh sách phản hồi</h2>
                    </div>
                    <div className="overflow-x-auto min-h-[400px]">
                        <Table
                            columns={columns}
                            dataSource={filtered}
                            rowKey="id"
                            locale={{
                                ...ADMIN_TABLE_LOCALE,
                                emptyText: (
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description={
                                            loadFailed
                                                ? 'Chưa có phản hồi nào (không thể kết nối máy chủ)'
                                                : 'Chưa có phản hồi nào'
                                        }
                                    />
                                ),
                            }}
                            loading={{
                                spinning: loading,
                                indicator: (
                                    <div className="flex flex-col items-center justify-center">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                            className="w-12 h-12 rounded-2xl bg-white border-[3px] border-slate-900 shadow-[4px_4px_0_#49B6E5] flex items-center justify-center mb-4"
                                        >
                                            <Zap className="text-[#49B6E5]" size={24} fill="#49B6E5" fillOpacity={0.2} />
                                        </motion.div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Đang tải...</p>
                                    </div>
                                ),
                            }}
                            pagination={{
                                current: page + 1,
                                pageSize,
                                total: totalElements,
                                onChange: p => setPage(p - 1),
                                className: 'px-8 py-6 !m-0 border-t-[2px] border-slate-50',
                            }}
                            className="doodle-table-fb"
                            rowClassName="group"
                        />
                    </div>
                </article>
            </div>

            {/* Detail Modal */}
            <Modal
                open={!!detailItem && !isUpdateOpen}
                onCancel={() => setDetailItem(null)}
                footer={null}
                centered
                width={600}
                className="doodle-modal-fb"
                title={<div className="text-xl font-black text-slate-900 uppercase tracking-tight">Chi tiết phản hồi</div>}
            >
                {detailItem && (() => {
                    const cfg = STATUS_CONFIG[detailItem.status] || STATUS_CONFIG.PENDING
                    const Icon = cfg.icon
                    return (
                        <div className="mt-6 space-y-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-black text-slate-900 uppercase">{detailItem.senderName}</div>
                                    <div className="text-xs font-bold text-slate-400">{detailItem.senderEmail}</div>
                                </div>
                                <div className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[2px] font-black text-[9px] uppercase tracking-widest', cfg.bg, cfg.color, cfg.border)}>
                                    <Icon size={10} strokeWidth={3} />
                                    {cfg.label}
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border-[2px] border-slate-200 space-y-2">
                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    {CATEGORIES.find(c => c.value === detailItem.category)?.label || detailItem.category}
                                </div>
                                <div className="font-black text-slate-900 text-base uppercase">{detailItem.title}</div>
                                <div className="text-sm font-bold text-slate-600 leading-relaxed whitespace-pre-wrap">{detailItem.content}</div>
                            </div>
                            {detailItem.screenshotUrl && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Image size={14} className="text-slate-400" strokeWidth={2.5} />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ảnh đính kèm</span>
                                    </div>
                                    <a href={detailItem.screenshotUrl} target="_blank" rel="noopener noreferrer">
                                        <img
                                            src={detailItem.screenshotUrl}
                                            alt="screenshot"
                                            className="w-full rounded-2xl border-[2px] border-slate-900 object-contain max-h-64 bg-slate-50 cursor-zoom-in hover:opacity-90 transition-opacity"
                                            onError={(e) => {
                                                const t = e.target as HTMLImageElement
                                                t.style.display = 'none'
                                                t.nextElementSibling?.classList.remove('hidden')
                                            }}
                                        />
                                        <div className="hidden p-4 bg-slate-50 border-[2px] border-dashed border-slate-300 rounded-2xl text-center text-xs font-bold text-slate-400">
                                            Không thể tải ảnh — <span className="text-[#49B6E5] underline">nhấn để mở link gốc</span>
                                        </div>
                                    </a>
                                </div>
                            )}
                            {detailItem.adminNote && (
                                <div className="p-4 bg-blue-50 border-[2px] border-blue-300 rounded-2xl">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-2">Ghi chú quản trị viên</div>
                                    <div className="text-sm font-bold text-blue-700">{detailItem.adminNote}</div>
                                </div>
                            )}
                            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                Gửi lúc: {new Date(detailItem.createdAt).toLocaleString('vi-VN')}
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleOpenUpdate(detailItem)}
                                className="w-full h-12 flex items-center justify-center gap-2 bg-[#49B6E5] border-[3px] border-slate-900 rounded-2xl shadow-[4px_4px_0_#1f2937] text-white font-black uppercase tracking-widest text-xs"
                            >
                                <RefreshCw size={16} strokeWidth={3} />
                                Cập nhật trạng thái
                            </motion.button>
                        </div>
                    )
                })()}
            </Modal>

            {/* Update Status Modal */}
            <Modal
                open={isUpdateOpen}
                onCancel={() => setIsUpdateOpen(false)}
                footer={null}
                centered
                width={480}
                className="doodle-modal-fb"
                title={<div className="text-xl font-black text-slate-900 uppercase tracking-tight">Cập nhật trạng thái</div>}
            >
                <Form form={updateForm} layout="vertical" onFinish={handleUpdate} className="mt-6 space-y-5">
                    <Form.Item
                        name="status"
                        label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Trạng thái</span>}
                        rules={[{ required: true }]}
                    >
                        <Select className="doodle-select-fb">
                            {STATUSES.map(s => (
                                <Select.Option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="adminNote"
                        label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Ghi chú phản hồi (tuỳ chọn)</span>}
                    >
                        <TextArea
                            rows={4}
                            placeholder="Nhập ghi chú hoặc phản hồi cho người dùng..."
                            className="border-[2.5px] border-slate-900/20 rounded-2xl font-bold resize-none"
                        />
                    </Form.Item>
                    <div className="flex gap-4 pt-2">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => setIsUpdateOpen(false)}
                            className="flex-1 h-12 rounded-2xl border-[3px] border-slate-900 bg-white text-slate-400 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0_#1f293705]"
                        >
                            Hủy
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={updating}
                            className="flex-1 h-12 rounded-2xl border-[3px] border-slate-900 bg-[#49B6E5] text-white font-black uppercase tracking-widest text-xs shadow-[4px_4px_0_#1f2937] disabled:opacity-50"
                        >
                            {updating ? 'Đang lưu...' : 'Xác nhận'}
                        </motion.button>
                    </div>
                </Form>
            </Modal>

            <style dangerouslySetInnerHTML={{ __html: `
                .doodle-table-fb .ant-table-thead > tr > th {
                    background: transparent !important;
                    border-bottom: 3px solid #1f2937 !important;
                    padding: 1.5rem !important;
                }
                .doodle-table-fb .ant-table-tbody > tr > td {
                    padding: 1.25rem 1.5rem !important;
                    border-bottom: 2px solid #1f293708 !important;
                }
                .doodle-modal-fb .ant-modal-content {
                    border: 4px solid #1f2937 !important;
                    border-radius: 3rem !important;
                    box-shadow: 12px 12px 0 #1f2937 !important;
                    background: #fbf6ef !important;
                    padding: 2.5rem !important;
                }
                .doodle-modal-fb .ant-modal-header { background: transparent !important; border: none !important; margin-bottom: 1rem !important; }
                .doodle-select-fb .ant-select-selector {
                    height: 48px !important;
                    border: 2.5px solid rgba(15,23,42,0.2) !important;
                    border-radius: 1rem !important;
                    display: flex !important;
                    align-items: center !important;
                    font-weight: 700 !important;
                }
            `}} />
        </div>
    )
}

export default UserFeedbackManagementPage
