import React from 'react'
import dayjs from 'dayjs'
import { Spin } from 'antd'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Filler,
    type ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { adminService } from '../services/adminService'
import {
    Activity, Bot, Mic, Brain, RefreshCw, ChevronRight,
    User, Target, MessageSquare, Zap, CheckCircle2,
    LayoutGrid, Search, Eye, MoreVertical
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

interface AttemptLog {
    id: string
    userEmail: string
    userFullName: string
    targetText: string
    asrTranscription: string
    audioUrl?: string
    groqScore?: number
    groqFeedback?: string
    isCorrect: boolean
    dialect?: string
    processingTimeMs?: number
    asrProcessingTimeMs?: number
    createdAt: string
}

const AiMonitorPage = () => {
    const [logs, setLogs] = React.useState<AttemptLog[]>([])
    const [loading, setLoading] = React.useState(true)
    const [selectedLog, setSelectedLog] = React.useState<AttemptLog | null>(null)
    const [limit, setLimit] = React.useState(50)
    const [searchTerm, setSearchTerm] = React.useState('')

    const fetchLogs = React.useCallback(async () => {
        setLoading(true)
        try {
            const res: any = await adminService.getAiMonitorLogs(limit)
            if (res.status === 'success') {
                setLogs(res.data || [])
            }
        } catch (e) {
            console.error('Failed to fetch AI monitor logs', e)
        } finally {
            setLoading(false)
        }
    }, [limit])

    React.useEffect(() => {
        fetchLogs()
    }, [fetchLogs])

    const chartLogs = logs.slice(0, 30).reverse()
    const latencyLabels = chartLogs.map((_l, i) => `#${i + 1}`)

    const latencyChartData = {
        labels: latencyLabels,
        datasets: [
            {
                label: 'Parakeet (ASR) ms',
                data: chartLogs.map((l) => l.asrProcessingTimeMs ?? null),
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.05)',
                borderWidth: 4,
                pointRadius: 6,
                pointBackgroundColor: '#fff',
                pointBorderWidth: 3,
                pointBorderColor: '#8b5cf6',
                tension: 0.4,
                fill: true,
                spanGaps: true,
            },
            {
                label: 'Groq AI (Cloud) ms',
                data: chartLogs.map((l) => l.processingTimeMs ?? (l as any).groqLatencyMs ?? (l as any).geminiLatencyMs ?? null),
                borderColor: '#49B6E5',
                backgroundColor: 'rgba(73, 182, 229, 0.05)',
                borderWidth: 4,
                pointRadius: 6,
                pointBackgroundColor: '#fff',
                pointBorderWidth: 3,
                pointBorderColor: '#49B6E5',
                tension: 0.4,
                fill: true,
                spanGaps: true,
            },
        ],
    }

    const chartOptions: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    pointStyle: 'rectRounded',
                    padding: 20,
                    font: { family: 'Nunito', weight: 'bold', size: 12 }
                }
            },
            tooltip: {
                backgroundColor: '#1f2937',
                titleFont: { family: 'Nunito', weight: 'bold' },
                bodyFont: { family: 'Nunito' },
                padding: 12,
                cornerRadius: 12,
                callbacks: {
                    label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y != null ? ctx.parsed.y + 'ms' : 'N/A'}`,
                },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { family: 'Nunito', weight: 'bold', size: 11 }, color: '#94a3b8' }
            },
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(31, 41, 55, 0.05)', lineWidth: 2 },
                ticks: {
                    font: { family: 'Nunito', weight: 'bold', size: 11 },
                    color: '#94a3b8',
                    callback: (v) => v + 'ms'
                },
            },
        },
    }

    const validGroq = logs.filter((l) => (l.processingTimeMs ?? (l as any).groqLatencyMs ?? (l as any).geminiLatencyMs) != null)
    const validAsr = logs.filter((l) => (l.asrProcessingTimeMs ?? (l as any).azureLatencyMs) != null)
    const avgGroq =
        validGroq.length > 0
            ? Math.round(validGroq.reduce((s, l) => s + (l.processingTimeMs ?? (l as any).groqLatencyMs ?? (l as any).geminiLatencyMs)!, 0) / validGroq.length)
            : null
    const avgAsr =
        validAsr.length > 0
            ? Math.round(validAsr.reduce((s, l) => s + (l.asrProcessingTimeMs ?? (l as any).azureLatencyMs)!, 0) / validAsr.length)
            : null
    const accuracy = logs.length > 0 ? ((logs.filter((l) => l.isCorrect).length / logs.length) * 100).toFixed(1) : null

    const dialectConfig: Record<string, { label: string, color: string, bg: string }> = {
        NORTH: { label: 'Bắc', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
        CENTRAL: { label: 'Trung', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
        SOUTH: { label: 'Nam', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
    }

    const filteredLogs = React.useMemo(() => {
        if (!searchTerm) return logs
        const lower = searchTerm.toLowerCase()
        return logs.filter(l => 
            l.userFullName?.toLowerCase().includes(lower) || 
            l.userEmail?.toLowerCase().includes(lower) ||
            l.targetText?.toLowerCase().includes(lower)
        )
    }, [logs, searchTerm])

    return (
        <div className="min-h-screen bg-[#fbf6ef] font-nunito p-8 space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-10 bg-[#49B6E5] rounded-full shadow-[2px_2px_0_#1f293705]" />
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">AI performance Monitor</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Giám sát hạ tầng ASR & Cloud AI theo thời gian thực</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <select
                            value={limit}
                            onChange={(e) => setLimit(Number(e.target.value))}
                            className="appearance-none h-12 pl-4 pr-10 bg-white border-[3px] border-slate-900 rounded-2xl shadow-[4px_4px_0_#1f2937] text-xs font-black uppercase tracking-widest text-slate-700 outline-none hover:bg-slate-50 transition-all cursor-pointer"
                        >
                            <option value={20}>20 Lượt</option>
                            <option value={50}>50 Lượt</option>
                            <option value={100}>100 Lượt</option>
                            <option value={200}>200 Lượt</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronRight className="rotate-90" size={16} strokeWidth={4} />
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={fetchLogs}
                        disabled={loading}
                        className="flex items-center gap-2 h-12 px-6 bg-[#49B6E5] border-[3px] border-slate-900 rounded-2xl shadow-[4px_4px_0_#1f2937] text-xs font-black uppercase tracking-widest text-white transition-all disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={clsx(loading && 'animate-spin')} strokeWidth={3} />
                        {loading ? 'Đang tải...' : 'Làm mới'}
                    </motion.button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Tổng lượt luyện tập', value: logs.length, icon: Activity, color: '#8b5cf6', bg: 'bg-violet-50' },
                    { label: 'Avg Latency Parakeet', value: avgAsr != null ? `${avgAsr}ms` : '---', icon: Mic, color: '#6366f1', bg: 'bg-indigo-50' },
                    { label: 'Avg Latency Groq AI', value: avgGroq != null ? `${avgGroq}ms` : '---', icon: Brain, color: '#49B6E5', bg: 'bg-blue-50' },
                    { label: 'Tỷ lệ chính xác', value: accuracy != null ? `${accuracy}%` : '---', icon: CheckCircle2, color: '#10b981', bg: 'bg-emerald-50' },
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

            {/* Latency Chart */}
            <article className="rounded-[2.5rem] border-[3px] border-slate-900 bg-white p-8 shadow-[8px_8px_0_#1f2937] overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Biểu đồ Latency hệ thống</h2>
                        <div className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-violet-500">
                                <div className="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-sm" /> Parakeet ASR
                            </span>
                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#49B6E5]">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#49B6E5] shadow-sm" /> Cloud AI (Groq)
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-[2px] border-slate-900 rounded-2xl">
                        <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dữ liệu thời gian thực</span>
                    </div>
                </div>
                <div className="h-[340px] relative">
                    {logs.length > 0 ? (
                        <div className="w-full h-full">
                            <Line data={latencyChartData} options={chartOptions} />
                        </div>
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center text-slate-300 space-y-4">
                            <Activity size={48} className="animate-pulse" />
                            <p className="font-black uppercase tracking-widest text-sm text-slate-400">
                                {loading ? 'Đang đồng bộ dữ liệu...' : 'Chưa có bản ghi latency nào'}
                            </p>
                        </div>
                    )}
                </div>
            </article>

            {/* Bottom Section: Logs & Detail */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Details Section (Shows on Top/Side depending on screen) */}
                <article className="xl:order-2 space-y-6">
                    <AnimatePresence mode="wait">
                        {selectedLog ? (
                            <motion.div
                                key={selectedLog.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="sticky top-8 space-y-6"
                            >
                                <div className="rounded-[2.5rem] border-[3px] border-slate-900 bg-white overflow-hidden shadow-[8px_8px_0_#1f2937]">
                                    <div className="bg-[#49B6E5] p-6 border-b-[3px] border-slate-900 flex items-center justify-between">
                                        <h3 className="text-white font-black uppercase tracking-widest text-sm">Chi tiết lượt tập</h3>
                                        <button onClick={() => setSelectedLog(null)} className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                                            <XCircle size={20} className="text-white" />
                                        </button>
                                    </div>

                                    <div className="p-8 space-y-8">
                                        {/* User Info */}
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl border-[2.5px] border-slate-900 bg-slate-50 shadow-[3px_3px_0_#1f2937] flex items-center justify-center text-slate-900">
                                                <User size={28} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <div className="text-lg font-black text-slate-900">{selectedLog.userFullName}</div>
                                                <div className="text-xs font-bold text-slate-400">{selectedLog.userEmail}</div>
                                            </div>
                                        </div>

                                        {/* Targets */}
                                        <div className="space-y-4">
                                            <div className="p-4 bg-slate-50 border-[2px] border-slate-900 rounded-2xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Target size={14} className="text-slate-400" strokeWidth={3} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Văn bản mẫu</span>
                                                </div>
                                                <div className="font-bold text-slate-800 leading-relaxed uppercase">{selectedLog.targetText}</div>
                                            </div>

                                            <div className={clsx("p-4 border-[2px] border-slate-900 rounded-2xl", selectedLog.isCorrect ? 'bg-emerald-50' : 'bg-rose-50')}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Mic size={14} className={selectedLog.isCorrect ? 'text-emerald-500' : 'text-rose-500'} strokeWidth={3} />
                                                    <span className={clsx("text-[10px] font-black uppercase tracking-widest", selectedLog.isCorrect ? 'text-emerald-500' : 'text-rose-500')}>Parakeet Nhận diện</span>
                                                </div>
                                                <div className={clsx("font-black text-lg", selectedLog.isCorrect ? 'text-emerald-600' : 'text-rose-600')}>
                                                    {selectedLog.asrTranscription || '(Yêu cầu audio thất bại)'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* AI Feedback */}
                                        {(selectedLog.groqFeedback || (selectedLog as any).feedback || (selectedLog as any).geminiFeedback) && (
                                            <div className="p-6 bg-blue-50 border-[2.5px] border-slate-900 rounded-2xl shadow-[4px_4px_0_#1f293705]">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <MessageSquare size={16} className="text-[#49B6E5]" strokeWidth={3} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#49B6E5]">Phản hồi từ Cloud AI</span>
                                                </div>
                                                <div className="text-xs font-bold text-slate-700 leading-relaxed italic">
                                                    "{selectedLog.groqFeedback || (selectedLog as any).feedback || (selectedLog as any).geminiFeedback}"
                                                </div>
                                            </div>
                                        )}

                                        {/* Latency Stats Overlay */}
                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t-[2px] border-slate-900/5">
                                            <div className="text-center">
                                                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 mb-1">ASR Latency</div>
                                                <div className="text-xl font-black text-violet-600 italic">
                                                    {selectedLog.asrProcessingTimeMs != null ? `${selectedLog.asrProcessingTimeMs}ms` : '—'}
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 mb-1">AI Latency</div>
                                                <div className="text-xl font-black text-[#49B6E5] italic">
                                                    {(selectedLog.processingTimeMs ?? (selectedLog as any).groqLatencyMs ?? (selectedLog as any).geminiLatencyMs) != null
                                                        ? `${selectedLog.processingTimeMs ?? (selectedLog as any).groqLatencyMs ?? (selectedLog as any).geminiLatencyMs}ms`
                                                        : '—'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-emerald-50 border-[2px] border-emerald-900/10 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500 shadow-sm flex items-center justify-center text-white font-black text-xs">
                                            {selectedLog.groqScore ?? (selectedLog as any).score ?? '80'}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Điểm đánh giá AI</span>
                                    </div>
                                    <Zap size={16} className="text-emerald-400" />
                                </div>
                            </motion.div>
                        ) : (
                            <div className="sticky top-8 rounded-[2.5rem] border-[3px] border-slate-900 border-dashed bg-white/40 p-12 text-center space-y-6 flex flex-col items-center h-[500px] justify-center">
                                <div className="w-20 h-20 rounded-[2rem] bg-white border-[3px] border-slate-900 shadow-[6px_6px_0_#1f293705] flex items-center justify-center animate-bounce">
                                    <Bot size={40} className="text-[#49B6E5]" strokeWidth={2.5} />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Trung tâm dữ liệu AI</h4>
                                    <p className="text-xs font-bold text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                                        Chọn một lượt luyện tập trong danh sách để phân tích kỹ thuật chi tiết.
                                    </p>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </article>

                {/* Main Logs Table Container */}
                <article className="xl:col-span-2 xl:order-1 rounded-[2.5rem] border-[3px] border-slate-900 bg-white shadow-[8px_8px_0_#1f2937] overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-8 py-6 border-b-[3px] border-slate-900 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <List size={20} className="text-[#49B6E5]" strokeWidth={3} />
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Chi tiết hoạt động hệ thống</h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm user, nội dung..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-4 py-1.5 text-xs font-bold bg-white border-[2px] border-slate-900 rounded-full shadow-[2px_2px_0_#1f293705] outline-none w-[200px] focus:w-[250px] transition-all"
                                />
                            </div>
                            <span className="px-4 py-1.5 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                {filteredLogs.length} Bản ghi
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-auto max-h-[700px] custom-scrollbar">
                        <table className="w-full border-collapse">
                            <thead className="sticky top-0 bg-white z-10">
                                <tr className="border-b-[2px] border-slate-100 text-left">
                                    <th className="py-5 px-8 text-[11px] font-black uppercase tracking-widest text-slate-400">Người dùng</th>
                                    <th className="py-5 px-6 text-[11px] font-black uppercase tracking-widest text-slate-400">Hoạt động</th>
                                    <th className="py-5 px-6 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">Cloud AI</th>
                                    <th className="py-5 px-6 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">Vùng</th>
                                    <th className="py-5 px-8 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading && logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-0">
                                            {loading ? (
                                                <div className="flex flex-col items-center justify-center p-24 bg-white/40 border-[3px] border-dashed border-slate-900/10 rounded-[3rem]">
                                                    <motion.div
                                                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                                                        transition={{ duration: 2, repeat: Infinity }}
                                                        className="w-16 h-16 rounded-[1.5rem] bg-white border-[3px] border-slate-900 shadow-[6px_6px_0_#F87171] flex items-center justify-center mb-6"
                                                    >
                                                        <LayoutGrid className="text-[#F87171]" size={32} />
                                                    </motion.div>
                                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Đang nạp dữ liệu giám sát...</p>
                                                </div>
                                            ) : null}
                                        </td>
                                    </tr>
                                ) : filteredLogs.map((log) => {
                                    const isSelected = selectedLog?.id === log.id
                                    const region = dialectConfig[log.dialect?.toUpperCase() || ''] || { label: '—', color: 'text-slate-400', bg: 'bg-slate-50 border-slate-100' }

                                    return (
                                        <motion.tr
                                            key={log.id}
                                            onClick={() => setSelectedLog(log)}
                                            whileHover={{ backgroundColor: 'rgba(73, 182, 229, 0.03)' }}
                                            className={clsx(
                                                "group cursor-pointer transition-all",
                                                isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                                            )}
                                        >
                                            <td className="py-6 px-8">
                                                <div className="flex items-center gap-3">
                                                    <div className={clsx(
                                                        "w-10 h-10 rounded-xl border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937] flex items-center justify-center flex-shrink-0 transition-transform group-hover:rotate-6",
                                                        isSelected ? 'bg-[#49B6E5] text-white' : 'bg-white text-slate-400'
                                                    )}>
                                                        <User size={18} strokeWidth={3} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className={clsx("text-sm font-black uppercase tracking-tight truncate max-w-[120px]", isSelected ? 'text-[#49B6E5]' : 'text-slate-900')}>
                                                            {log.userFullName || 'Unknown'}
                                                        </div>
                                                        <div className="text-[10px] font-bold text-slate-300 truncate max-w-[140px] italic">{log.userEmail}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-6">
                                                <div className="space-y-1">
                                                    <div className="text-xs font-black text-slate-800 uppercase line-clamp-1 max-w-[160px]">
                                                        {log.targetText}
                                                    </div>
                                                    <div className={clsx("text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5", log.isCorrect ? 'text-emerald-500' : 'text-rose-500')}>
                                                        <Mic size={12} strokeWidth={3} />
                                                        {log.asrTranscription || 'FAILED'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-6 text-center">
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 rounded-full text-white">
                                                    <div className={clsx("w-1.5 h-1.5 rounded-full shadow-[0_0_8px]", log.isCorrect ? 'bg-emerald-400 shadow-emerald-400' : 'bg-rose-400 shadow-rose-400')} />
                                                    <span className="text-[10px] font-black italic tracking-tighter">
                                                        {log.processingTimeMs ?? (log as any).groqLatencyMs ?? (log as any).geminiLatencyMs ?? '—'}ms
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-6 px-6 text-center">
                                                <span className={clsx("px-3 py-1 rounded-lg border-[1.5px] text-[10px] font-black uppercase tracking-widest", region.bg, region.color)}>
                                                    {region.label}
                                                </span>
                                            </td>
                                            <td className="py-6 px-8 text-right">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    {dayjs(log.createdAt).format('HH:mm')}
                                                </div>
                                                <div className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">
                                                    {dayjs(log.createdAt).format('DD MMM')}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </article>
            </div>

            {/* Custom Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1f293720; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #1f293740; }
                
                select::after { content: '▾'; position: absolute; right: 1rem; top: 1rem; }
            `}} />
        </div>
    )
}

const XCircle = ({ size, className }: { size: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
)

const List = ({ size, className, strokeWidth }: { size: number, className?: string, strokeWidth?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
)

export default AiMonitorPage
