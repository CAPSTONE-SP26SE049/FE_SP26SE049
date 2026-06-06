import React, { useState, useEffect, useMemo } from 'react'
import { Table, Modal, Form, Input, Select, message, Popconfirm, Tabs } from 'antd'
import { motion } from 'framer-motion'
import { Plus, Edit3, Trash2, Search, Gamepad2, Zap, ChevronRight, RefreshCw } from 'lucide-react'
import clsx from 'clsx'
import { minigameService, MinigameChallengeResponse, MinigameChallengeRequest } from '../../learner/services/minigameService'

const { TextArea } = Input

const PAIR_TYPES = ['N_L', 'S_X', 'D_GI_R', 'TR_CH']
const PAIR_LABELS: Record<string, string> = {
    N_L: 'N / L', S_X: 'S / X', D_GI_R: 'D / GI / R', TR_CH: 'TR / CH'
}

const GAME_TYPES = [
    { key: 'WORD_CHALLENGE',        label: 'Thử thách từ vựng',    desc: 'Chọn từ đúng / xếp chữ' },
    { key: 'SENTENCE_COMPLETION',   label: 'Hoàn thành câu', desc: 'Điền từ vào câu' },
    { key: 'MATCHING_PAIRS',        label: 'Nối cặp âm',    desc: 'Nối cặp âm' },
    { key: 'WORD_GUESS',            label: 'Đoán từ',        desc: 'Đoán từ qua gợi ý' },
    { key: 'CONVERSATION_SCENARIO', label: 'Hội thoại',      desc: 'Kịch bản hội thoại' },
]

// Dynamic form implementation removes the need for JSON_TEMPLATES

const PAIR_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
    N_L:    { color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200' },
    S_X:    { color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200' },
    D_GI_R: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    TR_CH:  { color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-200' },
}

const MinigameManagementPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('WORD_CHALLENGE')
    const [data, setData] = useState<MinigameChallengeResponse[]>([])
    const [loading, setLoading] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [pairFilter, setPairFilter] = useState('')

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<MinigameChallengeResponse | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [form] = Form.useForm()

    const fetchData = async (gameType: string) => {
        try {
            setLoading(true)
            const res = await minigameService.adminGetAll(gameType, pairFilter || undefined)
            setData(res)
        } catch {
            message.error('Không thể tải dữ liệu')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData(activeTab) }, [activeTab, pairFilter])

    const filtered = useMemo(() => {
        if (!searchText) return data
        const q = searchText.toLowerCase()
        return data.filter(d => JSON.stringify(d.questionData).toLowerCase().includes(q))
    }, [data, searchText])

    const handleOpenCreate = () => {
        setEditingItem(null)
        form.resetFields()
        form.setFieldsValue({ pairType: 'N_L', options: ['', '', '', ''], correctIndex: 0 })
        setIsModalOpen(true)
    }

    const handleOpenEdit = (item: MinigameChallengeResponse) => {
        setEditingItem(item)
        form.resetFields()
        form.setFieldsValue({ pairType: item.pairType, ...item.questionData })
        setIsModalOpen(true)
    }

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields()
            
            let questionData: Record<string, any> = {}
            if (activeTab === 'WORD_CHALLENGE') {
                const cleanedOptions = (values.options || []).filter((opt: any) => opt !== undefined && opt !== null && String(opt).trim() !== '')
                questionData = { prompt: values.prompt, options: cleanedOptions, correctIndex: values.correctIndex, explanation: values.explanation }
            } else if (activeTab === 'SENTENCE_COMPLETION') {
                const cleanedOptions = (values.options || []).filter((opt: any) => opt !== undefined && opt !== null && String(opt).trim() !== '')
                questionData = { context: values.context, sentence: values.sentence, options: cleanedOptions, correctIndex: values.correctIndex }
            } else if (activeTab === 'MATCHING_PAIRS') {
                questionData = { word1: values.word1, word2: values.word2 }
            } else if (activeTab === 'WORD_GUESS') {
                questionData = { word: values.word, hint: values.hint, category: values.category }
            } else if (activeTab === 'CONVERSATION_SCENARIO') {
                questionData = { scenario: values.scenario }
            }

            setSubmitting(true)
            const payload: MinigameChallengeRequest = {
                gameType: activeTab,
                pairType: values.pairType,
                questionData,
            }
            if (editingItem) {
                await minigameService.adminUpdate(editingItem.id, payload)
                message.success('Cập nhật thành công')
            } else {
                await minigameService.adminCreate(payload)
                message.success('Tạo câu hỏi thành công')
            }
            setIsModalOpen(false)
            fetchData(activeTab)
        } catch (err: any) {
            if (err?.errorFields) return
            message.error(err?.response?.data?.message || 'Có lỗi xảy ra')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await minigameService.adminDelete(id)
            message.success('Đã xóa câu hỏi')
            fetchData(activeTab)
        } catch (err: any) {
            message.error(err?.response?.data?.message || 'Không thể xóa')
        }
    }

    const columns = [
        {
            title: <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">#</span>,
            key: 'stt',
            width: 60,
            align: 'center' as const,
            render: (_: any, __: any, idx: number) => (
                <div className="w-8 h-8 rounded-lg bg-slate-50 border-[2px] border-slate-900 flex items-center justify-center font-black text-slate-400 text-xs italic">{idx + 1}</div>
            ),
        },
        {
            title: <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cặp âm</span>,
            dataIndex: 'pairType',
            key: 'pairType',
            render: (pt: string) => {
                const cfg = PAIR_CONFIG[pt] || { color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' }
                return (
                    <span className={clsx('px-2.5 py-1 rounded-xl border-[2px] font-black text-[9px] uppercase tracking-widest', cfg.bg, cfg.color, cfg.border)}>
                        {PAIR_LABELS[pt] || pt}
                    </span>
                )
            },
        },
        {
            title: <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nội dung</span>,
            key: 'content',
            render: (_: any, record: MinigameChallengeResponse) => {
                const d = record.questionData
                const preview = d?.prompt || d?.sentence || d?.word || d?.scenario || d?.word1
                    ? `${d?.prompt || d?.sentence || d?.word || d?.scenario || `${d?.word1} / ${d?.word2}`}`
                    : JSON.stringify(d).slice(0, 60) + '...'
                return <div className="text-sm font-bold text-slate-700 max-w-xs truncate">{preview}</div>
            },
        },
        {
            title: <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ngày tạo</span>,
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (d: string) => (
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                    {d ? new Date(d).toLocaleDateString('vi-VN') : '—'}
                </div>
            ),
        },
        {
            title: <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 pr-4">Thao tác</span>,
            key: 'action',
            align: 'right' as const,
            render: (_: any, record: MinigameChallengeResponse) => (
                <div className="flex items-center justify-end gap-2 pr-4">
                    <button onClick={() => handleOpenEdit(record)} className="p-2.5 rounded-xl border-[2px] border-transparent hover:border-slate-900/10 hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all">
                        <Edit3 size={16} strokeWidth={3} />
                    </button>
                    <Popconfirm
                        title={<span className="font-black text-slate-900">Xóa câu hỏi này?</span>}
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}
                    >
                        <button className="p-2.5 rounded-xl border-[2px] border-transparent hover:border-rose-500/10 hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all">
                            <Trash2 size={16} strokeWidth={3} />
                        </button>
                    </Popconfirm>
                </div>
            ),
        },
    ]

    return (
        <div className="min-h-screen bg-[#fbf6ef] font-nunito p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-10 bg-[#49B6E5] rounded-full" />
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Quản lý Minigames</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Quản lý câu hỏi cho tất cả minigames</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <motion.button
                        whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                        onClick={() => fetchData(activeTab)}
                        className="flex items-center gap-2 h-12 px-5 bg-white border-[3px] border-slate-900 rounded-2xl shadow-[4px_4px_0_#1f2937] text-xs font-black uppercase tracking-widest text-slate-600"
                    >
                        <RefreshCw size={16} strokeWidth={3} /> Làm mới
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                        onClick={handleOpenCreate}
                        className="flex items-center gap-2 h-12 px-8 bg-[#49B6E5] border-[3px] border-slate-900 rounded-2xl shadow-[5px_5px_0_#1f2937] text-xs font-black uppercase tracking-widest text-white"
                    >
                        <Plus size={18} strokeWidth={4} /> Thêm câu hỏi
                    </motion.button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 bg-white border-[3px] border-slate-900 rounded-2xl p-1.5 w-fit shadow-[4px_4px_0_#1f2937]">
                {GAME_TYPES.map(gt => (
                    <button
                        key={gt.key}
                        onClick={() => { setActiveTab(gt.key); setSearchText(''); setPairFilter('') }}
                        className={clsx(
                            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                            activeTab === gt.key ? 'bg-[#49B6E5] text-white shadow-[2px_2px_0_#1f2937]' : 'text-slate-400 hover:text-slate-900'
                        )}
                    >
                        <Gamepad2 size={12} strokeWidth={3} />
                        {gt.label}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-[2rem] border-[3px] border-slate-900 shadow-[4px_4px_0_#1f293705]">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} strokeWidth={3} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm nội dung câu hỏi..."
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-white border-[2.5px] border-slate-900/10 rounded-2xl focus:border-[#49B6E5] focus:outline-none text-xs font-black uppercase tracking-wider transition-all placeholder:text-slate-300 placeholder:normal-case"
                    />
                </div>
                <div className="relative w-48">
                    <select
                        value={pairFilter}
                        onChange={e => setPairFilter(e.target.value)}
                        className="w-full h-12 pl-4 pr-8 bg-white border-[2.5px] border-slate-900/10 rounded-2xl focus:border-[#49B6E5] appearance-none focus:outline-none text-[10px] font-black uppercase tracking-widest cursor-pointer"
                    >
                        <option value="">Tất cả cặp âm</option>
                        {PAIR_TYPES.map(pt => <option key={pt} value={pt}>{PAIR_LABELS[pt]}</option>)}
                    </select>
                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none text-slate-400" size={12} strokeWidth={4} />
                </div>
                <div className="ml-auto hidden lg:flex items-center gap-3 px-6 py-2 bg-slate-50 border-[2px] border-slate-900/10 rounded-2xl italic">
                    <div className="w-2 h-2 rounded-full bg-[#49B6E5] animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{filtered.length} câu hỏi</span>
                </div>
            </div>

            {/* Table */}
            <article className="rounded-[2.5rem] border-[3px] border-slate-900 bg-white shadow-[8px_8px_0_#1f2937] overflow-hidden">
                <div className="flex items-center gap-3 px-8 py-6 border-b-[3px] border-slate-900 bg-slate-50/10">
                    <Gamepad2 size={20} className="text-[#49B6E5]" strokeWidth={3} />
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                        {GAME_TYPES.find(g => g.key === activeTab)?.label} — {GAME_TYPES.find(g => g.key === activeTab)?.desc}
                    </h2>
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
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                        className="w-12 h-12 rounded-2xl bg-white border-[3px] border-slate-900 shadow-[4px_4px_0_#49B6E5] flex items-center justify-center mb-4">
                                        <Zap className="text-[#49B6E5]" size={24} fill="#49B6E5" fillOpacity={0.2} />
                                    </motion.div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Đang tải...</p>
                                </div>
                            ),
                        }}
                        pagination={{ pageSize: 10, showTotal: t => `Tổng ${t} câu`, className: 'px-8 py-6 !m-0 border-t-[2px] border-slate-50' }}
                        className="doodle-table-mg"
                        rowClassName="group"
                    />
                </div>
            </article>

            {/* Create/Edit Modal */}
            <Modal
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                centered
                width={600}
                className="doodle-modal-mg"
                title={<div className="text-xl font-black text-slate-900 uppercase tracking-tight">{editingItem ? 'Cập nhật câu hỏi' : 'Thêm câu hỏi mới'}</div>}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1.5">Loại game</div>
                            <div className="h-11 px-4 bg-slate-50 border-[2px] border-slate-900/20 rounded-xl flex items-center font-black text-sm text-slate-600">
                                {GAME_TYPES.find(g => g.key === activeTab)?.label}
                            </div>
                        </div>
                        <Form.Item name="pairType" label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Cặp âm</span>} rules={[{ required: true }]} className="!mb-0">
                            <Select className="doodle-select-mg">
                                {PAIR_TYPES.map(pt => <Select.Option key={pt} value={pt}>{PAIR_LABELS[pt]}</Select.Option>)}
                            </Select>
                        </Form.Item>
                    </div>

                    {activeTab === 'WORD_CHALLENGE' && (
                        <>
                            <Form.Item name="prompt" label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Câu hỏi (Prompt)</span>} rules={[{ required: true, message: 'Nhập câu hỏi' }]}>
                                <Input className="doodle-input-mg" placeholder="VD: Chọn từ đúng: ___ nước" />
                            </Form.Item>
                            <div className="grid grid-cols-2 gap-4">
                                {[0, 1, 2, 3].map(idx => (
                                    <Form.Item
                                        key={idx}
                                        name={['options', idx]}
                                        label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Lựa chọn {['A', 'B', 'C', 'D'][idx]}</span>}
                                        rules={[
                                            { required: idx < 2, message: 'Nhập lựa chọn' },
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    if (value && idx > 0) {
                                                        const prevVal = getFieldValue(['options', idx - 1]);
                                                        if (!prevVal || String(prevVal).trim() === '') {
                                                            return Promise.reject(new Error(`Hãy điền Lựa chọn ${['A', 'B', 'C', 'D'][idx - 1]} trước`));
                                                        }
                                                    }
                                                    return Promise.resolve();
                                                }
                                            })
                                        ]}
                                        dependencies={idx > 0 ? [['options', idx - 1]] : []}
                                    >
                                        <Input className="doodle-input-mg" />
                                    </Form.Item>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Form.Item
                                    name="correctIndex"
                                    label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Đáp án đúng</span>}
                                    rules={[
                                        { required: true, message: 'Chọn đáp án' },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                const opts = getFieldValue('options') || [];
                                                if (value !== undefined && (opts[value] === undefined || opts[value] === null || String(opts[value]).trim() === '')) {
                                                    return Promise.reject(new Error('Đáp án đúng phải là một lựa chọn hợp lệ'));
                                                }
                                                return Promise.resolve();
                                            },
                                        }),
                                    ]}
                                >
                                    <Select className="doodle-select-mg">
                                        {[0, 1, 2, 3].map(idx => <Select.Option key={idx} value={idx}>Lựa chọn {['A', 'B', 'C', 'D'][idx]}</Select.Option>)}
                                    </Select>
                                </Form.Item>
                                <Form.Item name="explanation" label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Giải thích (Tùy chọn)</span>}>
                                    <Input className="doodle-input-mg" placeholder="VD: Dùng L vì..." />
                                </Form.Item>
                            </div>
                        </>
                    )}

                    {activeTab === 'SENTENCE_COMPLETION' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <Form.Item name="context" label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Ngữ cảnh</span>} rules={[{ required: true, message: 'Nhập ngữ cảnh' }]}>
                                    <Input className="doodle-input-mg" placeholder="VD: Thời tiết" />
                                </Form.Item>
                                <Form.Item
                                    name="correctIndex"
                                    label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Đáp án đúng</span>}
                                    rules={[
                                        { required: true, message: 'Chọn đáp án' },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                const opts = getFieldValue('options') || [];
                                                if (value !== undefined && (opts[value] === undefined || opts[value] === null || String(opts[value]).trim() === '')) {
                                                    return Promise.reject(new Error('Đáp án đúng phải là một lựa chọn hợp lệ'));
                                                }
                                                return Promise.resolve();
                                            },
                                        }),
                                    ]}
                                >
                                    <Select className="doodle-select-mg">
                                        {[0, 1, 2, 3].map(idx => <Select.Option key={idx} value={idx}>Lựa chọn {['A', 'B', 'C', 'D'][idx]}</Select.Option>)}
                                    </Select>
                                </Form.Item>
                            </div>
                            <Form.Item name="sentence" label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Câu hỏi (Sentence)</span>} rules={[{ required: true, message: 'Nhập câu hỏi' }]}>
                                <Input className="doodle-input-mg" placeholder="VD: ___ trời hôm nay rất đẹp" />
                            </Form.Item>
                            <div className="grid grid-cols-2 gap-4">
                                {[0, 1, 2, 3].map(idx => (
                                    <Form.Item
                                        key={idx}
                                        name={['options', idx]}
                                        label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Lựa chọn {['A', 'B', 'C', 'D'][idx]}</span>}
                                        rules={[
                                            { required: idx < 2, message: 'Nhập lựa chọn' },
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    if (value && idx > 0) {
                                                        const prevVal = getFieldValue(['options', idx - 1]);
                                                        if (!prevVal || String(prevVal).trim() === '') {
                                                            return Promise.reject(new Error(`Hãy điền Lựa chọn ${['A', 'B', 'C', 'D'][idx - 1]} trước`));
                                                        }
                                                    }
                                                    return Promise.resolve();
                                                }
                                            })
                                        ]}
                                        dependencies={idx > 0 ? [['options', idx - 1]] : []}
                                    >
                                        <Input className="doodle-input-mg" />
                                    </Form.Item>
                                ))}
                            </div>
                        </>
                    )}

                    {activeTab === 'MATCHING_PAIRS' && (
                        <div className="grid grid-cols-2 gap-4">
                            <Form.Item name="word1" label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Từ thứ nhất</span>} rules={[{ required: true, message: 'Nhập từ' }]}>
                                <Input className="doodle-input-mg" placeholder="VD: nón" />
                            </Form.Item>
                            <Form.Item name="word2" label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Từ thứ hai</span>} rules={[{ required: true, message: 'Nhập từ' }]}>
                                <Input className="doodle-input-mg" placeholder="VD: lón" />
                            </Form.Item>
                        </div>
                    )}

                    {activeTab === 'WORD_GUESS' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <Form.Item name="word" label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Từ khóa</span>} rules={[{ required: true, message: 'Nhập từ khóa' }]}>
                                    <Input className="doodle-input-mg" placeholder="VD: nắng" />
                                </Form.Item>
                                <Form.Item name="category" label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Chủ đề</span>} rules={[{ required: true, message: 'Nhập chủ đề' }]}>
                                    <Input className="doodle-input-mg" placeholder="VD: Thời tiết" />
                                </Form.Item>
                            </div>
                            <Form.Item name="hint" label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Gợi ý</span>} rules={[{ required: true, message: 'Nhập gợi ý' }]}>
                                <Input className="doodle-input-mg" placeholder="VD: Ánh mặt trời chiếu xuống" />
                            </Form.Item>
                        </>
                    )}

                    {activeTab === 'CONVERSATION_SCENARIO' && (
                        <Form.Item name="scenario" label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Kịch bản hội thoại</span>} rules={[{ required: true, message: 'Nhập kịch bản' }]}>
                            <TextArea rows={4} className="border-[2.5px] border-slate-900/20 rounded-xl font-bold p-3 focus:border-[#49B6E5] resize-none" placeholder="VD: Bạn đang mua nước mắm ở chợ..." />
                        </Form.Item>
                    )}

                    <div className="flex gap-4 pt-2">
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={() => setIsModalOpen(false)}
                            className="flex-1 h-12 rounded-2xl border-[3px] border-slate-900 bg-white text-slate-400 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0_#1f293705]">
                            Hủy
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} type="submit" disabled={submitting}
                            className="flex-1 h-12 rounded-2xl border-[3px] border-slate-900 bg-[#49B6E5] text-white font-black uppercase tracking-widest text-xs shadow-[4px_4px_0_#1f2937] disabled:opacity-50">
                            {submitting ? 'Đang lưu...' : editingItem ? 'Cập nhật' : 'Tạo mới'}
                        </motion.button>
                    </div>
                </Form>
            </Modal>

            <style dangerouslySetInnerHTML={{ __html: `
                .doodle-table-mg .ant-table-thead > tr > th { background: transparent !important; border-bottom: 3px solid #1f2937 !important; padding: 1.5rem !important; }
                .doodle-table-mg .ant-table-tbody > tr > td { padding: 1.25rem 1.5rem !important; border-bottom: 2px solid #1f293708 !important; }
                .doodle-modal-mg .ant-modal-content { border: 4px solid #1f2937 !important; border-radius: 3rem !important; box-shadow: 12px 12px 0 #1f2937 !important; background: #fbf6ef !important; padding: 2.5rem !important; }
                .doodle-modal-mg .ant-modal-header { background: transparent !important; border: none !important; margin-bottom: 1rem !important; }
                .doodle-select-mg .ant-select-selector { height: 44px !important; border: 2.5px solid rgba(15,23,42,0.2) !important; border-radius: 0.75rem !important; display: flex !important; align-items: center !important; font-weight: 700 !important; }
                .doodle-input-mg { height: 44px !important; border: 2.5px solid rgba(15,23,42,0.2) !important; border-radius: 0.75rem !important; font-weight: 700 !important; font-size: 14px !important; }
                .doodle-input-mg:focus { border-color: #49B6E5 !important; box-shadow: none !important; }
            `}} />
        </div>
    )
}

export default MinigameManagementPage
