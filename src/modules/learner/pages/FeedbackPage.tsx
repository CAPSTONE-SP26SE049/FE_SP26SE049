import React, { useState, useEffect } from 'react'
import { Form, Input, Select, message, Modal } from 'antd'
import { motion } from 'framer-motion'
import { MessageSquarePlus, Send, Clock, CheckCircle2, AlertCircle, XCircle, Image, ChevronRight, Inbox, ExternalLink } from 'lucide-react'
import { userFeedbackService, UserFeedbackResponse } from '../services/userFeedbackService'
import { uploadToCloudinary } from '../../../services/cloudinaryService'
import clsx from 'clsx'

const { TextArea } = Input

const CATEGORIES = [
    { value: 'BUG',     label: 'Lỗi hệ thống (Bug)' },
    { value: 'UI',      label: 'Giao diện (UI/UX)' },
    { value: 'FEATURE', label: 'Đề xuất tính năng' },
    { value: 'CONTENT', label: 'Nội dung học tập' },
    { value: 'OTHER',   label: 'Khác' },
]

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
    PENDING:     { label: 'Chờ xử lý',     color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   icon: Clock },
    IN_PROGRESS: { label: 'Đang xử lý',    color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',    icon: AlertCircle },
    RESOLVED:    { label: 'Đã giải quyết', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
    CLOSED:      { label: 'Đã đóng',       color: 'text-slate-500',   bg: 'bg-slate-50',   border: 'border-slate-200',   icon: XCircle },
}

const FeedbackPage: React.FC = () => {
    const [form] = Form.useForm()
    const [submitting, setSubmitting] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [screenshotUrl, setScreenshotUrl] = useState<string>('')
    const [myFeedbacks, setMyFeedbacks] = useState<UserFeedbackResponse[]>([])
    const [loadingList, setLoadingList] = useState(true)
    const [detailItem, setDetailItem] = useState<UserFeedbackResponse | null>(null)

    const fetchMyFeedbacks = async () => {
        try {
            setLoadingList(true)
            const data = await userFeedbackService.getMyFeedbacks()
            setMyFeedbacks(data)
        } catch { /* noop */ }
        finally { setLoadingList(false) }
    }

    useEffect(() => { fetchMyFeedbacks() }, [])

    const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) { message.error('Chỉ chấp nhận file ảnh'); return }
        if (file.size > 5 * 1024 * 1024) { message.error('Ảnh tối đa 5MB'); return }
        try {
            setUploading(true)
            const url = await uploadToCloudinary(file, 'image')
            setScreenshotUrl(url)
            message.success('Tải ảnh lên thành công')
        } catch { message.error('Không thể tải ảnh lên') }
        finally { setUploading(false) }
    }

    const handleSubmit = async (values: any) => {
        try {
            setSubmitting(true)
            await userFeedbackService.createFeedback({
                category: values.category,
                title: values.title,
                content: values.content,
                screenshotUrl: screenshotUrl || undefined,
            })
            message.success('Gửi phản hồi thành công!')
            form.resetFields()
            setScreenshotUrl('')
            fetchMyFeedbacks()
        } catch (err: any) {
            message.error(err?.response?.data?.message || 'Không thể gửi phản hồi')
        } finally { setSubmitting(false) }
    }

    return (
        <div className="h-full bg-[#fbf6ef] font-nunito flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 px-6 pt-6 pb-4 flex items-center gap-4">
                <div className="w-2 h-8 bg-[#49B6E5] rounded-full" />
                <div>
                    <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Phản hồi hệ thống</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Báo lỗi, góp ý hoặc đề xuất tính năng mới</p>
                </div>
            </div>

            {/* 2-column layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-5 px-6 pb-6 min-h-0">

                {/* LEFT: Form */}
                <div className="bg-white border-[3px] border-slate-900 rounded-[2rem] shadow-[6px_6px_0_#1f2937] flex flex-col overflow-hidden">
                    <div className="flex-shrink-0 flex items-center gap-3 px-6 py-4 border-b-[2px] border-slate-900/10">
                        <div className="w-9 h-9 rounded-xl bg-[#49B6E5]/10 border-[2px] border-slate-900 flex items-center justify-center shadow-[2px_2px_0_#1f2937]">
                            <MessageSquarePlus size={18} className="text-[#49B6E5]" strokeWidth={2.5} />
                        </div>
                        <div>
                            <div className="font-black text-slate-900 text-sm uppercase tracking-tight">Gửi phản hồi mới</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Mô tả chi tiết để được hỗ trợ tốt hơn</div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <Form form={form} layout="vertical" onFinish={handleSubmit} className="space-y-3">
                            <Form.Item
                                name="category"
                                label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em]">Loại phản hồi</span>}
                                rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
                                className="!mb-0"
                            >
                                <Select
                                    placeholder="Chọn loại phản hồi"
                                    className="doodle-select-fb"
                                    suffixIcon={<ChevronRight className="rotate-90 text-slate-400" size={12} strokeWidth={4} />}
                                >
                                    {CATEGORIES.map(c => (
                                        <Select.Option key={c.value} value={c.value}>{c.label}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item
                                name="title"
                                label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em]">Tiêu đề</span>}
                                rules={[{ required: true, message: 'Nhập tiêu đề' }, { max: 255 }]}
                                className="!mb-0"
                            >
                                <Input
                                    placeholder="Mô tả ngắn gọn vấn đề..."
                                    className="h-10 border-[2px] border-slate-900/20 rounded-xl font-bold text-sm focus:border-[#49B6E5]"
                                />
                            </Form.Item>

                            <Form.Item
                                name="content"
                                label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em]">Nội dung chi tiết</span>}
                                rules={[{ required: true, message: 'Nhập nội dung' }, { min: 10 }]}
                                className="!mb-0"
                            >
                                <TextArea
                                    rows={4}
                                    placeholder="Mô tả chi tiết vấn đề..."
                                    className="border-[2px] border-slate-900/20 rounded-xl font-bold text-sm focus:border-[#49B6E5] resize-none"
                                />
                            </Form.Item>

                            {/* Screenshot */}
                            <div>
                                <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] mb-1.5">Ảnh đính kèm (tuỳ chọn)</div>
                                <label className={clsx(
                                    'relative flex items-center gap-3 p-3 rounded-xl border-[2px] border-dashed cursor-pointer transition-all',
                                    screenshotUrl ? 'border-emerald-400 bg-emerald-50' : 'border-slate-900/15 bg-slate-50 hover:border-[#49B6E5]'
                                )}>
                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleScreenshotUpload} disabled={uploading} />
                                    <div className={clsx('w-8 h-8 rounded-lg border-[2px] border-slate-900 flex items-center justify-center flex-shrink-0', screenshotUrl ? 'bg-emerald-400' : 'bg-white')}>
                                        {uploading
                                            ? <div className="w-3 h-3 border-2 border-slate-400 border-t-[#49B6E5] rounded-full animate-spin" />
                                            : <Image size={14} className={screenshotUrl ? 'text-white' : 'text-slate-400'} strokeWidth={2.5} />
                                        }
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {uploading ? 'Đang tải...' : screenshotUrl ? 'Đã tải ảnh thành công' : 'Nhấn để chọn ảnh (max 5MB)'}
                                    </span>
                                    {screenshotUrl && (
                                        <button type="button" onClick={e => { e.preventDefault(); setScreenshotUrl('') }} className="ml-auto text-slate-400 hover:text-rose-500">
                                            <XCircle size={14} strokeWidth={2.5} />
                                        </button>
                                    )}
                                </label>
                                {screenshotUrl && (
                                    <img src={screenshotUrl} alt="preview" className="mt-2 w-full max-h-24 object-cover rounded-xl border-[2px] border-slate-900" />
                                )}
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02, y: -1 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={submitting || uploading}
                                className="w-full h-12 flex items-center justify-center gap-2 bg-[#49B6E5] border-[3px] border-slate-900 rounded-xl shadow-[4px_4px_0_#1f2937] text-white font-black uppercase tracking-widest text-xs disabled:opacity-50 transition-all"
                            >
                                <Send size={16} strokeWidth={3} />
                                {submitting ? 'Đang gửi...' : 'Gửi phản hồi'}
                            </motion.button>
                        </Form>
                    </div>
                </div>

                {/* RIGHT: History */}
                <div className="bg-white border-[3px] border-slate-900 rounded-[2rem] shadow-[6px_6px_0_#1f2937] flex flex-col overflow-hidden">
                    <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b-[2px] border-slate-900/10">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-50 border-[2px] border-slate-900 flex items-center justify-center shadow-[2px_2px_0_#1f2937]">
                                <Inbox size={16} className="text-slate-500" strokeWidth={2.5} />
                            </div>
                            <div>
                                <div className="font-black text-slate-900 text-sm uppercase tracking-tight">Lịch sử phản hồi</div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{myFeedbacks.length} phản hồi đã gửi</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 custom-scrollbar-fb">
                        {loadingList ? (
                            <div className="flex justify-center py-12">
                                <div className="w-8 h-8 border-[3px] border-slate-200 border-t-[#49B6E5] rounded-full animate-spin" />
                            </div>
                        ) : myFeedbacks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                                <div className="w-14 h-14 bg-slate-50 border-[3px] border-slate-900 rounded-2xl flex items-center justify-center mb-3 shadow-[3px_3px_0_#1f2937]">
                                    <Inbox size={26} className="text-slate-300" strokeWidth={2} />
                                </div>
                                <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Chưa có phản hồi nào</p>
                            </div>
                        ) : (
                            myFeedbacks.map(fb => {
                                const cfg = STATUS_CONFIG[fb.status] || STATUS_CONFIG.PENDING
                                const Icon = cfg.icon
                                return (
                                    <motion.div
                                        key={fb.id}
                                        whileHover={{ x: 3 }}
                                        onClick={() => setDetailItem(fb)}
                                        className="p-4 bg-slate-50/60 border-[2px] border-slate-900/10 hover:border-slate-900/30 rounded-2xl cursor-pointer transition-all"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md">
                                                        {CATEGORIES.find(c => c.value === fb.category)?.label || fb.category}
                                                    </span>
                                                </div>
                                                <div className="font-black text-slate-900 text-xs uppercase tracking-tight truncate">{fb.title}</div>
                                                <div className="text-[10px] text-slate-400 font-bold mt-0.5 line-clamp-1">{fb.content}</div>
                                                <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">
                                                    {new Date(fb.createdAt).toLocaleDateString('vi-VN')}
                                                </div>
                                            </div>
                                            <div className={clsx('flex items-center gap-1 px-2 py-1 rounded-lg border-[1.5px] font-black text-[8px] uppercase tracking-widest flex-shrink-0', cfg.bg, cfg.color, cfg.border)}>
                                                <Icon size={8} strokeWidth={3} />
                                                {cfg.label}
                                            </div>
                                        </div>
                                        {fb.adminNote && (
                                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                                <div className="text-[8px] font-black uppercase tracking-widest text-blue-400 mb-0.5">Phản hồi Admin</div>
                                                <div className="text-[10px] font-bold text-blue-700 line-clamp-2">{fb.adminNote}</div>
                                            </div>
                                        )}
                                    </motion.div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            <Modal
                open={!!detailItem}
                onCancel={() => setDetailItem(null)}
                footer={null}
                centered
                width={520}
                className="doodle-modal-fb"
            >
                {detailItem && (() => {
                    const cfg = STATUS_CONFIG[detailItem.status] || STATUS_CONFIG.PENDING
                    const Icon = cfg.icon
                    return (
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                                    {CATEGORIES.find(c => c.value === detailItem.category)?.label || detailItem.category}
                                </span>
                                <div className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[2px] font-black text-[9px] uppercase tracking-widest', cfg.bg, cfg.color, cfg.border)}>
                                    <Icon size={10} strokeWidth={3} />
                                    {cfg.label}
                                </div>
                            </div>
                            <div className="font-black text-slate-900 text-base uppercase tracking-tight">{detailItem.title}</div>
                            <div className="p-4 bg-slate-50 rounded-2xl border-[2px] border-slate-200 text-sm font-bold text-slate-600 leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">{detailItem.content}</div>
                            {detailItem.screenshotUrl && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Image size={13} className="text-slate-400" strokeWidth={2.5} />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Ảnh đính kèm</span>
                                        <a href={detailItem.screenshotUrl} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-[9px] font-black text-[#49B6E5] hover:underline uppercase tracking-widest">
                                            <ExternalLink size={10} strokeWidth={3} /> Mở ảnh
                                        </a>
                                    </div>
                                    <a href={detailItem.screenshotUrl} target="_blank" rel="noopener noreferrer">
                                        <img
                                            src={detailItem.screenshotUrl}
                                            alt="screenshot"
                                            className="w-full rounded-2xl border-[2px] border-slate-900 object-contain max-h-48 bg-slate-50 cursor-zoom-in hover:opacity-90 transition-opacity"
                                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                                        />
                                    </a>
                                </div>
                            )}
                            {detailItem.adminNote && (
                                <div className="p-3 bg-blue-50 border-[2px] border-blue-300 rounded-2xl">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-1">Phản hồi từ Admin</div>
                                    <div className="text-sm font-bold text-blue-700">{detailItem.adminNote}</div>
                                </div>
                            )}
                            <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                Gửi lúc: {new Date(detailItem.createdAt).toLocaleString('vi-VN')}
                            </div>
                        </div>
                    )
                })()}
            </Modal>

            <style dangerouslySetInnerHTML={{ __html: `
                .doodle-select-fb .ant-select-selector {
                    height: 40px !important;
                    border: 2px solid rgba(15,23,42,0.2) !important;
                    border-radius: 0.75rem !important;
                    display: flex !important;
                    align-items: center !important;
                    font-weight: 700 !important;
                    font-size: 0.875rem !important;
                }
                .doodle-select-fb.ant-select-focused .ant-select-selector {
                    border-color: #49B6E5 !important;
                    box-shadow: none !important;
                }
                .doodle-modal-fb .ant-modal-content {
                    border: 4px solid #1f2937 !important;
                    border-radius: 2.5rem !important;
                    box-shadow: 12px 12px 0 #1f2937 !important;
                    background: #fbf6ef !important;
                    padding: 2rem !important;
                }
                .doodle-modal-fb .ant-modal-header { background: transparent !important; border: none !important; }
                .custom-scrollbar-fb::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar-fb::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar-fb::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}} />
        </div>
    )
}

export default FeedbackPage
