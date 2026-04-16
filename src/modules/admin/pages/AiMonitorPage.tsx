import React from 'react'
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
import { Activity, Bot, CheckCircle, XCircle, Mic, Brain, Clock, RefreshCw } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

interface AttemptLog {
    id: string
    userEmail: string
    userFullName: string
    targetText: string
    asrTranscription: string
    audioUrl?: string
    geminiScore?: number
    geminiFeedback?: string
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
                borderColor: 'rgba(139, 92, 246, 1)',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: 'rgba(139, 92, 246, 1)',
                tension: 0.4,
                fill: true,
                spanGaps: true,
            },
            {
                label: 'Gemini Flash (AI) ms',
                data: chartLogs.map((l) => l.processingTimeMs ?? null),
                borderColor: 'rgba(59, 130, 246, 1)',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
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
            legend: { position: 'top', labels: { usePointStyle: true, pointStyleWidth: 8 } },
            tooltip: {
                callbacks: {
                    label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y != null ? ctx.parsed.y + 'ms' : 'N/A'}`,
                },
            },
        },
        scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 } } },
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(148,163,184,0.1)' },
                ticks: { callback: (v) => v + 'ms' },
            },
        },
    }

    const validGeminiFlash = logs.filter((l) => l.processingTimeMs != null)
    const validAsr = logs.filter((l) => l.asrProcessingTimeMs != null)
    const avgGeminiFlash =
        validGeminiFlash.length > 0
            ? Math.round(validGeminiFlash.reduce((s, l) => s + l.processingTimeMs!, 0) / validGeminiFlash.length)
            : null
    const avgAsr =
        validAsr.length > 0
            ? Math.round(validAsr.reduce((s, l) => s + l.asrProcessingTimeMs!, 0) / validAsr.length)
            : null
    const accuracy = logs.length > 0 ? ((logs.filter((l) => l.isCorrect).length / logs.length) * 100).toFixed(1) : null

    const dialectColor: Record<string, string> = {
        NORTH: 'bg-blue-100 text-blue-700',
        CENTRAL: 'bg-amber-100 text-amber-700',
        SOUTH: 'bg-emerald-100 text-emerald-700',
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-500 mt-1">Theo dõi hiệu năng của Parakeet (Local) và Gemini Flash (Cloud) theo thời gian thực</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={limit}
                        onChange={(e) => setLimit(Number(e.target.value))}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm outline-none focus:border-violet-400"
                    >
                        <option value={20}>20 lần gần nhất</option>
                        <option value={50}>50 lần gần nhất</option>
                        <option value={100}>100 lần gần nhất</option>
                        <option value={200}>200 lần gần nhất</option>
                    </select>
                    <button
                        onClick={fetchLogs}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-violet-700 disabled:opacity-60"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Làm mới
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                {[
                    { label: 'Tổng lượt luyện tập', value: logs.length, icon: Activity, tone: 'text-violet-600 bg-violet-100' },
                    { label: 'Avg. Latency Parakeet', value: avgAsr != null ? `${avgAsr}ms` : '---', icon: Mic, tone: 'text-violet-600 bg-violet-100' },
                    { label: 'Avg. Latency Gemini Flash', value: avgGeminiFlash != null ? `${avgGeminiFlash}ms` : '---', icon: Brain, tone: 'text-blue-600 bg-blue-100' },
                    { label: 'Tỷ lệ chính xác', value: accuracy != null ? `${accuracy}%` : '---', icon: CheckCircle, tone: 'text-emerald-600 bg-emerald-100' },
                ].map((card) => {
                    const Icon = card.icon
                    return (
                        <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-start justify-between">
                            <div>
                                <p className="text-xs text-slate-500 font-semibold">{card.label}</p>
                                <p className="mt-2 text-2xl font-extrabold text-slate-800">{card.value}</p>
                            </div>
                            <div className={`rounded-xl p-2.5 ${card.tone}`}>
                                <Icon size={18} />
                            </div>
                        </article>
                    )
                })}
            </div>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-black text-slate-800">Biểu đồ Latency theo thời gian</h2>
                        <p className="text-sm text-slate-500">Violet = Parakeet ASR | Blue = Gemini Flash</p>
                    </div>
                    <span className="flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
                        <Clock size={12} /> Real-time
                    </span>
                </div>
                <div className="h-[280px]">
                    {logs.length > 0 ? (
                        <Line data={latencyChartData} options={chartOptions} />
                    ) : (
                        <div className="flex h-full items-center justify-center text-slate-400 text-sm">
                            {loading ? 'Đang tải...' : 'Chưa có dữ liệu latency'}
                        </div>
                    )}
                </div>
            </article>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <article className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <div>
                            <h2 className="text-lg font-black text-slate-800">Logs chi tiết</h2>
                            <p className="text-xs text-slate-400">Nhấn vào hàng để xem phản hồi chi tiết</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                            {logs.length} records
                        </span>
                    </div>
                    <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                        <table className="w-full min-w-[680px] text-sm">
                            <thead className="sticky top-0 bg-slate-50 z-10">
                                <tr className="border-b border-slate-200 text-left text-slate-500">
                                    <th className="py-3 px-4 font-semibold">Người dùng</th>
                                    <th className="py-3 px-4 font-semibold">Văn bản mẫu</th>
                                    <th className="py-3 px-4 font-semibold">ASR nhận diện</th>
                                    <th className="py-3 px-4 font-semibold text-center">Điểm</th>
                                    <th className="py-3 px-4 font-semibold text-center">Parakeet</th>
                                    <th className="py-3 px-4 font-semibold text-center">Gemini Flash</th>
                                    <th className="py-3 px-4 font-semibold">Vùng</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">Đang tải dữ liệu...</td>
                                    </tr>
                                )}
                                {!loading && logs.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">Chưa có dữ liệu</td>
                                    </tr>
                                )}
                                {logs.map((log) => {
                                    const isSelected = selectedLog?.id === log.id
                                    return (
                                        <tr
                                            key={log.id}
                                            onClick={() => setSelectedLog(log)}
                                            className={`border-b border-slate-50 cursor-pointer transition-colors text-slate-700 ${isSelected ? 'bg-violet-50' : 'hover:bg-slate-50'} `}
                                        >
                                            <td className="py-3 px-4">
                                                <div className={`text-xs font-bold truncate max-w-[120px] ${isSelected ? 'text-violet-700' : ''}`}>
                                                    {log.userFullName || '—'}
                                                </div>
                                                <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{log.userEmail}</div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="truncate max-w-[140px] block font-medium">{log.targetText}</span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`truncate max-w-[140px] block text-xs ${log.isCorrect ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                    {log.asrTranscription || '(không nhận diện được)'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {log.isCorrect ? (
                                                        <CheckCircle size={14} className="text-emerald-500" />
                                                    ) : (
                                                        <XCircle size={14} className="text-rose-500" />
                                                    )}
                                                    <span className="font-bold text-xs">{log.geminiScore ?? '—'}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="font-mono text-xs text-violet-700">
                                                    {log.asrProcessingTimeMs != null ? `${log.asrProcessingTimeMs}ms` : '—'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="font-mono text-xs text-blue-600">
                                                    {log.processingTimeMs != null ? `${log.processingTimeMs}ms` : '—'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                {log.dialect ? (
                                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${dialectColor[log.dialect] || 'bg-slate-100 text-slate-600'}`}>
                                                        {log.dialect}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm min-h-[300px] flex flex-col">
                    {selectedLog ? (
                        <div className="space-y-4 flex flex-col flex-1">
                            <div className="flex items-center justify-between">
                                <h3 className="text-md font-black text-slate-800">Chi tiết lượt luyện tập</h3>
                                <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
                            </div>
                            <div className="space-y-3 text-sm flex-1">
                                <div className="rounded-xl bg-violet-50 p-3">
                                    <div className="text-xs text-violet-500 font-semibold mb-1">👤 Người dùng</div>
                                    <div className="font-bold text-slate-800">{selectedLog.userFullName}</div>
                                    <div className="text-xs text-slate-500">{selectedLog.userEmail}</div>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-3">
                                    <div className="text-xs text-slate-500 font-semibold mb-1">🎯 Văn bản mẫu</div>
                                    <div className="font-semibold text-slate-800">{selectedLog.targetText}</div>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-3">
                                    <div className="text-xs text-slate-500 font-semibold mb-1 flex items-center gap-1">
                                        <Mic size={11} className="text-violet-500" /> Parakeet nhận diện
                                    </div>
                                    <div className={`font-medium ${selectedLog.isCorrect ? 'text-emerald-600' : 'text-rose-500'}`}>
                                        {selectedLog.asrTranscription || '(không nhận diện được)'}
                                    </div>
                                </div>
                                {selectedLog.geminiFeedback && (
                                    <div className="rounded-xl bg-blue-50 p-3">
                                        <div className="text-xs text-blue-500 font-semibold mb-1 flex items-center gap-1">
                                            <Brain size={11} /> Gemini Flash Feedback
                                        </div>
                                        <div className="text-xs text-slate-700 leading-relaxed">{selectedLog.geminiFeedback}</div>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <div className="rounded-xl bg-slate-50 p-3 text-center">
                                        <div className="text-xs text-slate-400">Parakeet</div>
                                        <div className="font-bold text-violet-700 text-lg">
                                            {selectedLog.asrProcessingTimeMs != null ? `${selectedLog.asrProcessingTimeMs}ms` : '—'}
                                        </div>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-3 text-center">
                                        <div className="text-xs text-slate-400">Gemini Flash</div>
                                        <div className="font-bold text-blue-600 text-lg">
                                            {selectedLog.processingTimeMs != null ? `${selectedLog.processingTimeMs}ms` : '—'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center flex-1 text-center space-y-3">
                            <div className="w-14 h-14 rounded-full bg-violet-50 flex items-center justify-center">
                                <Bot size={26} className="text-violet-400" />
                            </div>
                            <p className="text-sm text-slate-400 font-medium">
                                Chọn một dòng trong bảng<br />để xem chi tiết phản hồi AI
                            </p>
                        </div>
                    )}
                </article>
            </div>
        </div>
    )
}

export default AiMonitorPage
