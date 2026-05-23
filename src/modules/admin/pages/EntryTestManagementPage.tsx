import React, { useEffect, useState } from 'react'
import {
    Table, Modal, Form, Input, Select, Popconfirm,
    message, Empty
} from 'antd'
import {
    Plus, RefreshCw, Trash2, Edit3,
    Trophy, Users, Target,
    MapPin, Zap, ChevronRight, XCircle,
    Info, LayoutGrid
} from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import apiClient from '../../../services/apiClient'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import dayjs from 'dayjs'

const { Option } = Select

interface Question {
    id: string
    targetText: string
    regionCategory: string
}

interface TestResult {
    id: string
    overallScore: number
    detectedRegion: string
    createdAt: string
    userEmail: string
    userFullName: string
    details?: string
}

const REGION_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
    NORTH_NL: { label: 'Bắc (N/L)', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    CENTRAL_DGIR: { label: 'Trung (D/GI/R)', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    SOUTH_TRCH: { label: 'Nam (TR/CH)', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    NORTH: { label: 'Miền Bắc', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    CENTRAL: { label: 'Miền Trung', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    SOUTH: { label: 'Miền Nam', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
}

const EntryTestManagementPage: React.FC = () => {
    const [questions, setQuestions] = useState<Question[]>([])
    const [results, setResults] = useState<TestResult[]>([])
    const [loadingQ, setLoadingQ] = useState(false)
    const [loadingR, setLoadingR] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState<Question | null>(null)
    const [form] = Form.useForm()
    const [saving, setSaving] = useState(false)
    const [viewDetailModalOpen, setViewDetailModalOpen] = useState(false)
    const [selectedResult, setSelectedResult] = useState<TestResult | null>(null)
    const [activeTab, setActiveTab] = useState<'questions' | 'results'>('questions')

    const fetchQuestions = async () => {
        setLoadingQ(true)
        try {
            const res = await apiClient.get('/test/admin/questions')
            const list = Array.isArray(res) ? res : (res?.data ?? [])
            setQuestions(list)
        } catch {
            message.error('Không thể tải danh sách câu hỏi')
        } finally {
            setLoadingQ(false)
        }
    }

    const fetchResults = async () => {
        setLoadingR(true)
        try {
            const res = await apiClient.get('/test/admin/results')
            const list = Array.isArray(res) ? res : (res?.data ?? [])
            setResults(list)
        } catch {
            message.error('Không thể tải kết quả bài test')
        } finally {
            setLoadingR(false)
        }
    }

    useEffect(() => {
        fetchQuestions()
        fetchResults()
    }, [])

    const openCreate = () => {
        setEditing(null)
        form.resetFields()
        setModalOpen(true)
    }

    const openEdit = (q: Question) => {
        setEditing(q)
        form.setFieldsValue({ targetText: q.targetText, regionCategory: q.regionCategory })
        setModalOpen(true)
    }

    const handleSave = async () => {
        try {
            const values = await form.validateFields()
            setSaving(true)
            if (editing) {
                await apiClient.put(`/test/admin/questions/${editing.id}`, values)
                message.success('Cập nhật câu hỏi thành công')
            } else {
                await apiClient.post('/test/admin/questions', values)
                message.success('Tạo câu hỏi thành công')
            }
            setModalOpen(false)
            fetchQuestions()
        } catch (err: any) {
            if (!err?.errorFields) message.error('Lưu thất bại')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await apiClient.delete(`/test/admin/questions/${id}`)
            message.success('Xoá câu hỏi thành công')
            fetchQuestions()
        } catch {
            message.error('Xoá thất bại')
        }
    }

    const questionColumns: ColumnsType<Question> = [
        {
            title: 'Nội dung câu hỏi',
            dataIndex: 'targetText',
            key: 'targetText',
            render: (text) => (
                <div className="flex items-center gap-3 py-2">
                    <div className="w-10 h-10 rounded-xl bg-white border-[2px] border-slate-900 shadow-[2px_2px_0_#1f293705] flex items-center justify-center text-slate-400 group-hover:text-[#49B6E5] transition-colors">
                        <Target size={18} strokeWidth={3} />
                    </div>
                    <span className="font-black text-slate-900 uppercase tracking-tight text-sm">{text}</span>
                </div>
            ),
        },
        {
            title: 'Tiêu chí chẩn đoán',
            dataIndex: 'regionCategory',
            key: 'regionCategory',
            width: 240,
            render: (val) => {
                const info = REGION_LABELS[val] || { label: val, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' }
                return (
                    <div className={clsx("inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-[2px] font-black uppercase tracking-widest text-[10px]", info.bg, info.color, info.border)}>
                        <MapPin size={12} strokeWidth={3} />
                        {info.label}
                    </div>
                )
            },
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 140,
            align: 'right',
            render: (_, record) => (
                <div className="flex items-center justify-end gap-2 pr-4">
                    <button
                        onClick={() => openEdit(record)}
                        className="p-2.5 rounded-xl border-[2px] border-transparent hover:border-slate-900/10 hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all"
                    >
                        <Edit3 size={18} strokeWidth={3} />
                    </button>
                    <Popconfirm
                        title="Xác nhận xóa câu hỏi này?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <button className="p-2.5 rounded-xl border-[2px] border-transparent hover:border-red-500/10 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
                            <Trash2 size={18} strokeWidth={3} />
                        </button>
                    </Popconfirm>
                </div>
            ),
        },
    ]

    const resultColumns: ColumnsType<TestResult> = [
        {
            title: 'Học viên',
            key: 'user',
            render: (_, r) => (
                <div className="flex items-center gap-3 py-1">
                    <div className="w-10 h-10 rounded-full border-[2.5px] border-slate-900 bg-white shadow-[2px_2px_0_#1f293705] flex items-center justify-center text-slate-700 font-black">
                        {r.userFullName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                        <div className="text-sm font-black text-slate-900 uppercase">{r.userFullName || '—'}</div>
                        <div className="text-[10px] font-bold text-slate-400 italic">{r.userEmail || '—'}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Điểm tổng',
            dataIndex: 'overallScore',
            key: 'overallScore',
            width: 140,
            align: 'center',
            sorter: (a, b) => (a.overallScore || 0) - (b.overallScore || 0),
            render: (val) => {
                const score = Math.round(val || 0)
                const colorClass = score >= 80 ? 'text-emerald-500 bg-emerald-50 border-emerald-200' : score >= 60 ? 'text-orange-500 bg-orange-50 border-orange-200' : 'text-rose-500 bg-rose-50 border-rose-200'
                return (
                    <div className={clsx("inline-flex items-center justify-center w-16 h-8 rounded-xl border-[2px] font-black text-xs", colorClass)}>
                        {score}%
                    </div>
                )
            },
        },
        {
            title: 'Hệ chẩn đoán',
            dataIndex: 'detectedRegion',
            key: 'detectedRegion',
            width: 180,
            align: 'center',
            render: (val) => val ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-black tracking-widest italic group-hover:scale-105 transition-transform">
                    <Zap size={10} className="text-yellow-400" fill="currentColor" />
                    {val}
                </div>
            ) : '—',
        },
        {
            title: 'Ngày thực hiện',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 180,
            align: 'right',
            sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            defaultSortOrder: 'descend',
            render: (val) => (
                <div className="text-right pr-4">
                    <div className="text-xs font-black text-slate-600">{val ? dayjs(val).format('DD/MM/YYYY') : '—'}</div>
                    <div className="text-[10px] font-bold text-slate-400 tracking-tighter opacity-70 italic">{val ? dayjs(val).format('HH:mm') : ''}</div>
                </div>
            ),
        },
        {
            title: 'Xem',
            key: 'actions',
            width: 80,
            align: 'center',
            render: (_, record) => (
                <button
                    onClick={() => {
                        setSelectedResult(record)
                        setViewDetailModalOpen(true)
                    }}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-[#49B6E5]"
                >
                    <ChevronRight size={18} strokeWidth={4} />
                </button>
            ),
        },
    ]

    const avgScore = results.length
        ? Math.round(results.reduce((s, r) => s + (r.overallScore || 0), 0) / results.length)
        : 0

    return (
        <div className="min-h-screen bg-[#fbf6ef] font-nunito p-8 space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-2">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-10 bg-[#49B6E5] rounded-full shadow-[2px_2px_0_#1f293705]" />
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Cấu hình Entry Test</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Quản lý câu hỏi chẩn đoán & thống kê kết quả đầu vào</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={activeTab === 'questions' ? fetchQuestions : fetchResults}
                        className="flex items-center gap-2 h-12 px-6 bg-white border-[3px] border-slate-900 rounded-2xl shadow-[4px_4px_0_#1f2937] text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all transition-all"
                    >
                        <RefreshCw size={16} className={clsx((loadingQ || loadingR) && 'animate-spin')} strokeWidth={3} />
                        Làm mới
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={openCreate}
                        className="flex items-center gap-2 h-12 px-8 bg-[#49B6E5] border-[3px] border-slate-900 rounded-2xl shadow-[5px_5px_0_#1f2937] text-xs font-black uppercase tracking-widest text-white transition-all"
                    >
                        <Plus size={18} strokeWidth={4} />
                        Thêm câu hỏi
                    </motion.button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Ngân hàng câu hỏi', value: questions.length, icon: Target, color: '#8b5cf6', bg: 'bg-violet-50' },
                    { label: 'Tổng lượt thi thử', value: results.length, icon: Users, color: '#49B6E5', bg: 'bg-blue-50' },
                    { label: 'Điểm trung bình', value: `${avgScore}%`, icon: Trophy, color: '#f59e0b', bg: 'bg-orange-50' },
                    { label: 'Tỷ lệ hoàn thành', value: results.length > 0 ? '98%' : '---', icon: Zap, color: '#10b981', bg: 'bg-emerald-50' },
                ].map((card) => {
                    const Icon = card.icon
                    return (
                        <motion.article
                            key={card.label}
                            whileHover={{ y: -5 }}
                            className="relative group h-full"
                        >
                            <div className="h-full rounded-3xl border-[3px] border-slate-900 bg-white p-6 shadow-[6px_6px_0_#1f2937] transition-all hover:shadow-[10px_10px_0_#1f2937] flex flex-col justify-between overflow-hidden">
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

            {/* Custom Tab Switcher */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-900/5 rounded-3xl w-fit">
                <button
                    onClick={() => setActiveTab('questions')}
                    className={clsx(
                        "px-8 py-3 rounded-[1.25rem] text-xs font-black uppercase tracking-widest transition-all",
                        activeTab === 'questions' ? "bg-white text-slate-900 shadow-sm border-[2.5px] border-slate-900 -translate-y-0.5" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    <div className="flex items-center gap-2">
                        <LayoutGrid size={14} strokeWidth={3} />
                        Câu hỏi ({questions.length})
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('results')}
                    className={clsx(
                        "px-8 py-3 rounded-[1.25rem] text-xs font-black uppercase tracking-widest transition-all",
                        activeTab === 'results' ? "bg-white text-slate-900 shadow-sm border-[2.5px] border-slate-900 -translate-y-0.5" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    <div className="flex items-center gap-2">
                        <Trophy size={14} strokeWidth={3} />
                        Kết quả ({results.length})
                    </div>
                </button>
            </div>

            {/* Tables Area */}
            <div className="space-y-6">
                {activeTab === 'questions' ? (
                    <div className="rounded-[2.5rem] border-[3px] border-slate-900 bg-white overflow-hidden shadow-[8px_8px_0_#1f2937]">
                        <div className="px-8 py-6 border-b-[3px] border-slate-900 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Target size={20} className="text-[#49B6E5]" strokeWidth={3} />
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Ngân hàng câu hỏi chẩn đoán</h2>
                            </div>
                            <button
                                onClick={openCreate}
                                className="p-2.5 rounded-xl border-[2.5px] border-slate-900 bg-white text-[#49B6E5] hover:bg-[#49B6E5] hover:text-white transition-all shadow-[3px_3px_0_#1f2937]"
                            >
                                <Plus size={20} strokeWidth={4} />
                            </button>
                        </div>
                        <div className="overflow-x-auto min-h-[400px]">
                            <Table
                                columns={questionColumns}
                                dataSource={questions}
                                rowKey="id"
                                loading={{
                                    spinning: loadingQ,
                                    indicator: (
                                        <div className="flex flex-col items-center justify-center">
                                            <motion.div
                                                animate={{ scale: [1, 1.1, 1] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="w-12 h-12 rounded-2xl bg-white border-[3px] border-slate-900 shadow-[4px_4px_0_#49B6E5] flex items-center justify-center mb-4"
                                            >
                                                <Target className="text-[#49B6E5]" size={24} />
                                            </motion.div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Đang nạp câu hỏi...</p>
                                        </div>
                                    )
                                }}
                                pagination={{
                                    pageSize: 15,
                                    className: "px-8 py-6 !m-0 border-t-[2px] border-slate-50"
                                }}
                                className="doodle-table"
                                rowClassName="group"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="rounded-[2.5rem] border-[3px] border-slate-900 bg-white overflow-hidden shadow-[8px_8px_0_#1f2937]">
                        <div className="px-8 py-6 border-b-[3px] border-slate-900 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Trophy size={20} className="text-orange-400" strokeWidth={3} />
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Lịch sử kết quả người dùng</h2>
                            </div>
                            <div className="px-5 py-1.5 rounded-full bg-orange-100 border-[2px] border-orange-200 text-[10px] font-black text-orange-600 uppercase tracking-widest italic">
                                Dữ liệu mới cập nhật
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <Table
                                columns={resultColumns}
                                dataSource={results}
                                rowKey="id"
                                loading={loadingR}
                                pagination={{
                                    pageSize: 6,
                                    className: "px-8 py-6 !m-0 border-t-[2px] border-slate-50"
                                }}
                                className="doodle-table"
                                rowClassName="group"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <Modal
                open={modalOpen}
                title={<div className="text-lg font-black uppercase text-slate-900 tracking-tight">{editing ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}</div>}
                onCancel={() => setModalOpen(false)}
                onOk={handleSave}
                confirmLoading={saving}
                width={540}
                centered
                className="doodle-modal"
            >
                <Form form={form} layout="vertical" className="mt-8 space-y-4">
                    <Form.Item
                        name="targetText"
                        label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Câu phát âm chẩn đoán</span>}
                        rules={[{ required: true, message: 'Nhập câu phát âm' }]}
                    >
                        <Input.TextArea rows={4} placeholder="Ví dụ: Nửa đêm nhai nếp nương nanh..." className="doodle-input resize-none" />
                    </Form.Item>

                    <Form.Item
                        name="regionCategory"
                        label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Phân loại vùng miền mục tiêu</span>}
                        rules={[{ required: true, message: 'Chọn vùng miền' }]}
                    >
                        <Select placeholder="Chọn miền chẩn đoán" className="doodle-select">
                            {Object.entries(REGION_LABELS).map(([k, v]) => {
                                const info = REGION_LABELS[k];
                                return (
                                    <Option key={k} value={k}>
                                        <div className="flex items-center gap-3">
                                            <div className={clsx("w-2 h-2 rounded-full", info.bg.replace('bg-', 'bg-[#').replace('-50', ']').replace('blue', '49B6E5').replace('orange', 'f97316').replace('emerald', '10b981'))} />
                                            <span className="font-bold text-slate-700">{v.label}</span>
                                        </div>
                                    </Option>
                                );
                            })}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

            {/* View Result Detail Modal */}
            <Modal
                open={viewDetailModalOpen}
                title={
                    <div className="flex flex-col">
                        <div className="text-xl font-black text-slate-900 uppercase tracking-tight">Kết quả Entry Test</div>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="px-3 py-0.5 rounded-full bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">{selectedResult?.userEmail}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{selectedResult?.detectedRegion || 'Chưa xác định'}</span>
                        </div>
                    </div>
                }
                onCancel={() => setViewDetailModalOpen(false)}
                footer={null}
                width={860}
                centered
                className="doodle-modal"
            >
                <div className="py-8 custom-scrollbar max-h-[650px] overflow-y-auto px-2">
                    {(() => {
                        try {
                            const details = JSON.parse(selectedResult?.details || '[]')
                            if (!Array.isArray(details) || details.length === 0) {
                                return (
                                    <div className="py-20 flex flex-col items-center justify-center opacity-30 grayscale">
                                        <Empty description="Không có dữ liệu chi tiết cho bài test này" />
                                    </div>
                                )
                            }
                            return (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-3 gap-6 mb-8">
                                        <div className="p-6 bg-emerald-50 border-[3px] border-slate-900 rounded-[2rem] shadow-[4px_4px_0_#1f293705] text-center">
                                            <div className="text-3xl font-black text-emerald-600 italic">{Math.round(selectedResult?.overallScore || 0)}%</div>
                                            <div className="text-[9px] font-black uppercase tracking-widest text-emerald-700/50 mt-1">Accuracy</div>
                                        </div>
                                        <div className="p-6 bg-blue-50 border-[3px] border-slate-900 rounded-[2rem] shadow-[4px_4px_0_#1f293705] text-center">
                                            <div className="text-3xl font-black text-[#49B6E5] italic">{details.length}</div>
                                            <div className="text-[9px] font-black uppercase tracking-widest text-blue-700/50 mt-1">Câu trả lời</div>
                                        </div>
                                        <div className="p-6 bg-orange-50 border-[3px] border-slate-900 rounded-[2rem] shadow-[4px_4px_0_#1f293705] text-center">
                                            <div className="text-2xl font-black text-orange-500 uppercase tracking-tighter truncate">{selectedResult?.detectedRegion || 'N/A'}</div>
                                            <div className="text-[9px] font-black uppercase tracking-widest text-orange-700/50 mt-1">Detected Region</div>
                                        </div>
                                    </div>

                                    {details.map((item: any, idx: number) => {
                                        const accuracy = Number(item.accuracy || 0)
                                        const isGood = accuracy >= 70
                                        return (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="relative group p-6 rounded-[2.5rem] border-[3px] border-slate-900 bg-white shadow-[6px_6px_0_#1f293705] hover:shadow-[10px_10px_0_#1f293705] transition-all"
                                            >
                                                <div className="flex justify-between items-start gap-4 mb-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-2xl border-[2.5px] border-slate-900 bg-slate-50 flex items-center justify-center font-black text-slate-800 italic">
                                                            {idx + 1}
                                                        </div>
                                                        <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight truncate max-w-[400px]">
                                                            {item.targetText}
                                                        </h4>
                                                    </div>
                                                    <div className={clsx("px-5 py-2 rounded-2xl border-[2.5px] border-slate-900 font-black text-sm italic shadow-[3px_3px_0_#1f293705]", isGood ? 'bg-emerald-400 text-white' : 'bg-orange-400 text-white')}>
                                                        {Math.round(accuracy)}%
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="p-4 bg-slate-50 rounded-2xl border-[2px] border-slate-900/5">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dịch từ audio (ASR)</span>
                                                            <Info size={11} className="text-slate-300" />
                                                        </div>
                                                        <div className="font-bold text-slate-700 italic">"{item.rawText || '—'}"</div>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-2xl border-[2px] border-slate-900/5">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phân tích chẩn đoán</span>
                                                            {item.isRegional && <Zap size={11} className="text-rose-500" fill="currentColor" />}
                                                        </div>
                                                        <div className={clsx("font-black text-xs uppercase tracking-tight", item.isRegional ? 'text-rose-500' : 'text-slate-500')}>
                                                            {item.detectedError || 'Không phát hiện lỗi đặc thù'}
                                                        </div>
                                                        {item.isRegional && (
                                                            <div className="mt-2 inline-flex px-2 py-0.5 rounded-lg bg-rose-500 text-white text-[8px] font-black uppercase tracking-widest">
                                                                Dấu hiệu vùng miền
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            )
                        } catch (e) {
                            return (
                                <div className="p-10 text-center space-y-6">
                                    <div className="w-16 h-16 rounded-full bg-rose-50 border-[3px] border-rose-500 flex items-center justify-center mx-auto">
                                        <XCircle size={32} className="text-rose-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-sm font-black text-rose-500 uppercase tracking-widest">Lỗi cấu trúc dữ liệu</div>
                                        <p className="text-xs font-bold text-slate-400 italic">Bản ghi cũ không tương thích với bộ giải mã JSON mới.</p>
                                    </div>
                                    <div className="p-6 bg-slate-900 rounded-[2rem] text-left text-[10px] text-slate-500 font-mono overflow-auto max-h-60 custom-scrollbar opacity-80">
                                        {selectedResult?.details}
                                    </div>
                                </div>
                            )
                        }
                    })()}
                </div>
            </Modal>

            <style dangerouslySetInnerHTML={{
                __html: `
                .doodle-table .ant-table-thead > tr > th {
                    background: transparent !important;
                    border-bottom: 3px solid #1f2937 !important;
                    padding: 1.5rem !important;
                }
                .doodle-table .ant-table-tbody > tr > td { padding: 1rem 1.5rem !important; border-bottom: 2px solid #1f293708 !important; }
                .doodle-table .ant-table-cell { font-family: 'Nunito', sans-serif !important; }
                
                .doodle-modal .ant-modal-content {
                    border: 4px solid #1f2937 !important; border-radius: 3rem !important;
                    box-shadow: 12px 12px 0 #1f2937 !important; background: #fbf6ef !important;
                    padding: 2.5rem !important;
                }
                .doodle-modal .ant-modal-header { background: transparent !important; border: none !important; margin-bottom: 1.5rem !important; }
                .doodle-modal .ant-btn-primary { 
                    background: #49B6E5 !important; height: 54px !important; border: 3px solid #1f2937 !important;
                    border-radius: 1.25rem !important; font-weight: 900 !important; text-transform: uppercase !important;
                    box-shadow: 5px 5px 0 #1f2937 !important; padding: 0 2rem !important;
                }
                .doodle-modal .ant-btn-default { height: 54px !important; border-radius: 1.25rem !important; font-weight: 900 !important; text-transform: uppercase !important; border: 2px solid #1f293720 !important; padding: 0 2rem !important; }
                
                .doodle-input {
                    padding: 1rem !important; border: 2.5px solid #1f293720 !important; border-radius: 1.25rem !important;
                    font-weight: 700 !important; font-family: 'Nunito' !important;
                }
                .doodle-input:focus { border-color: #49B6E5 !important; }
                
                .doodle-select .ant-select-selector {
                    height: 54px !important; border: 2.5px solid #1f293720 !important; border-radius: 1.25rem !important;
                    display: flex !important; align-items: center !important;
                }
                
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1f293710; border-radius: 10px; }
                 .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #1f293730; }
            `}} />
        </div>
    )
}

export default EntryTestManagementPage
