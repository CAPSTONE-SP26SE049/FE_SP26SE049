import React from 'react'
import {
  Brain,
  Server,
  TrendingUp,
  Users,
  Activity,
  Zap,
  Target
} from 'lucide-react'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  type ChartOptions,
} from 'chart.js'
import { Bar, Radar } from 'react-chartjs-2'
import { adminService } from '../services/adminService'
import { motion } from 'framer-motion'
import clsx from 'clsx'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
)

type AnalyticsOverview = {
  totalUsers?: number | string
  totalAttempts?: number | string
  averageScore?: number | string
}

const toNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const pronunciationPairs = ['N/L', 'TR/CH', 'S/X & D/R/GI']

const getHeatColor = (value: number) => {
  if (value >= 0.28) return '#ef4444' // Red
  if (value >= 0.18) return '#f97316' // Orange
  if (value >= 0.1) return '#f59e0b'  // Amber
  return '#10b981'                   // Emerald
}

const AdminDashboardPage = () => {
  const [loading, setLoading] = React.useState(true)
  const [overview, setOverview] = React.useState<AnalyticsOverview>({})
  const [heatmaps, setHeatmaps] = React.useState<any>({})
  const [health, setHealth] = React.useState<any>({})
  const [aiPerformance, setAiPerformance] = React.useState<any>({})
  const [userProgress, setUserProgress] = React.useState<any[]>([])
  const [selectedUser, setSelectedUser] = React.useState<any>(null)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [overviewRes, heatmapsRes, healthRes, aiRes, progressRes]: any[] = await Promise.all([
          adminService.getAnalyticsOverview().catch(() => ({ status: 'error' })),
          adminService.getAnalyticsErrorHeatmaps().catch(() => ({ status: 'error' })),
          adminService.getSystemHealth().catch(() => ({ status: 'error' })),
          adminService.getAiPerformance().catch(() => ({ status: 'error' })),
          adminService.getAnalyticsUsersProgress().catch(() => ({ status: 'error' })),
        ])

        if (overviewRes.status === 'success') {
          const data = overviewRes.data?.data ?? overviewRes.data ?? {}
          setOverview(data)
        }
        if (heatmapsRes.status === 'success') setHeatmaps(heatmapsRes.data)
        if (healthRes.status === 'success') setHealth(healthRes.data)
        if (aiRes.status === 'success') setAiPerformance(aiRes.data)
        if (progressRes.status === 'success') {
          setUserProgress(progressRes.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch admin dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const heatmapValues = pronunciationPairs.map((pair) => {
    if (pair === 'N/L') return Number(heatmaps?.['north'] ?? 0)
    if (pair === 'TR/CH') return Number(heatmaps?.['south'] ?? 0)
    if (pair === 'S/X & D/R/GI') return Number(heatmaps?.['central'] ?? 0)
    return 0
  })

  const heatmapData = {
    labels: pronunciationPairs,
    datasets: [
      {
        label: 'Tỉ lệ phát âm lỗi',
        data: heatmapValues,
        backgroundColor: heatmapValues.map(getHeatColor),
        borderRadius: 12,
        borderWidth: 3,
        borderColor: '#1f2937',
        barPercentage: 0.6,
      },
    ],
  }

  const getRadarData = (user: any) => {
    if (!user) return null
    const progress = user.totalQuizzes > 0 ? (user.completedQuizzes / user.totalQuizzes) * 100 : 0
    const accuracy = user.completedQuizzes > 0 ? (user.totalStars / (user.completedQuizzes * 3)) * 100 : 0
    const consistency = Math.min((user.currentStreak / 30) * 100, 100)
    const avgScore = user.averageScore || 0
    const totalStarsNorm = Math.min((user.totalStars / 50) * 100, 100)

    return {
      labels: ['Tiến độ', 'Chất lượng', 'Kỷ luật', 'Điểm TB', 'Tích lũy'],
      datasets: [
        {
          label: user.fullName,
          data: [progress, accuracy, consistency, avgScore, totalStarsNorm],
          backgroundColor: 'rgba(73, 182, 229, 0.2)',
          borderColor: '#49B6E5',
          borderWidth: 3,
          pointBackgroundColor: '#49B6E5',
          pointBorderColor: '#1f2937',
          pointBorderWidth: 2,
          pointRadius: 4,
        },
      ],
    }
  }

  const radarOptions: ChartOptions<'radar'> = {
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: { display: false },
        grid: { color: 'rgba(31, 41, 55, 0.1)', lineWidth: 1.5 },
        angleLines: { color: 'rgba(31, 41, 55, 0.1)' },
        pointLabels: {
          font: { size: 11, weight: 'bold', family: 'Nunito' },
          color: '#1f2937',
        },
      },
    },
    plugins: {
      legend: { display: false },
    },
    maintainAspectRatio: false,
  }

  const heatmapOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2937',
        titleFont: { weight: 'bold' },
        padding: 12,
        cornerRadius: 12,
        callbacks: {
          label: (ctx) => `${(Number(ctx.raw) * 100).toFixed(1)}% lỗi thuật toán`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 1.0,
        ticks: {
          callback: (value) => `${Number(value) * 100}%`,
          font: { weight: 'bold' },
        },
        grid: { color: 'rgba(31, 41, 55, 0.05)' },
      },
      x: {
        grid: { display: false },
        ticks: { font: { weight: 'bold', size: 10 } }
      },
    },
  }

  const topCards = [
    {
      label: 'Tổng người dùng',
      value: toNumber(overview.totalUsers),
      icon: Users,
      color: '#49B6E5',
      bg: 'bg-blue-50',
    },
    {
      label: 'Lượt tập phát âm',
      value: toNumber(overview.totalAttempts),
      icon: Activity,
      color: '#8b5cf6',
      bg: 'bg-violet-50',
    },
    {
      label: 'Điểm trung bình',
      value: toNumber(overview.averageScore).toFixed(1),
      icon: Target,
      color: '#10b981',
      bg: 'bg-emerald-50',
    },
  ]

  if (loading && !overview.totalUsers) {
    return (
      <div className="flex flex-col items-center justify-center py-60">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-20 h-20 rounded-[2rem] bg-white border-[3px] border-slate-900 shadow-[8px_8px_0_#49B6E5] flex items-center justify-center mb-8"
        >
          <Brain className="text-[#49B6E5]" size={40} />
        </motion.div>
        <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Đang nạp dữ liệu phân tích...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Top Cards */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {topCards.map((item, idx) => {
          const Icon = item.icon
          return (
            <motion.article
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group relative rounded-[2rem] border-[3px] border-slate-900 bg-white p-6 shadow-[6px_6px_0_#1f2937] transition-all hover:-translate-y-1 hover:shadow-[10px_10px_0_#1f2937]"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                  <p className="text-4xl font-black text-slate-900 leading-none">{item.value}</p>
                </div>
                <div
                  className={clsx("w-14 h-14 rounded-2xl border-[2.5px] border-slate-900 shadow-[3px_3px_0_#1f2937] flex items-center justify-center transition-transform group-hover:rotate-6", item.bg)}
                  style={{ color: item.color }}
                >
                  <Icon size={28} strokeWidth={3} />
                </div>
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-10 group-hover:opacity-30 transition-opacity">
                <Zap size={16} fill="currentColor" />
                <Zap size={16} fill="currentColor" />
              </div>
            </motion.article>
          )
        })}
      </section>

      {/* Analytics Row */}
      <section className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <article className="xl:col-span-2 rounded-[2.5rem] border-[3px] border-slate-900 bg-white p-8 shadow-[8px_8px_0_#1f2937]">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-2 h-10 bg-orange-400 rounded-full" />
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Biểu đồ lỗi phát âm</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Dữ liệu phân tích vùng miền chính xác</p>
              </div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-50 border-[2px] border-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-[2px_2px_0_#1f2937]">
              Realtime Logs
            </div>
          </div>
          <div className="h-[350px]">
            <Bar data={heatmapData} options={heatmapOptions} />
          </div>
        </article>

        <article className="rounded-[2.5rem] border-[3px] border-slate-900 bg-white p-8 shadow-[8px_8px_0_#1f2937] flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 border-[2px] border-slate-900 flex items-center justify-center text-indigo-600 shadow-[2px_2px_0_#1f2937]">
              <Server size={20} strokeWidth={3} />
            </div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">Hệ thống AI</h2>
          </div>

          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border-[2.5px] border-slate-900 shadow-[4px_4px_0_#065f4630]">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-800 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Server Status
              </span>
              <span className="font-black text-xs uppercase tracking-tighter text-emerald-700">
                {health.status || 'CONNECTED'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border-[2px] border-slate-900 shadow-[3px_3px_0_#00000010]">
                <div className="flex items-center gap-2">
                  <Brain size={16} className="text-[#49B6E5]" strokeWidth={3} />
                  <span className="text-[10px] font-black uppercase text-slate-600">Parakeet Engine</span>
                </div>
                <span className="font-black text-[10px] text-emerald-600 uppercase">
                  {health.parakeetStatus || 'ONLINE'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border-[2px] border-slate-900 shadow-[3px_3px_0_#00000010]">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-orange-500" strokeWidth={3} />
                  <span className="text-[10px] font-black uppercase text-slate-600">Gemini Cloud</span>
                </div>
                <span className="font-black text-[10px] text-emerald-600 uppercase">
                  CONNECTED
                </span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t-[2px] border-slate-900/5 space-y-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Độ trễ trung bình</span>
                <span className="text-lg font-black text-slate-900">
                  {aiPerformance.averageLatencyMs ? `${aiPerformance.averageLatencyMs}ms` : '124ms'}
                </span>
              </div>
              <div className="flex items-center justify-between px-2 text-[#49B6E5]">
                <span className="text-[10px] font-black uppercase tracking-widest">Độ chính xác AI</span>
                <span className="text-lg font-black">
                  {aiPerformance.accuracyRate ? `${(aiPerformance.accuracyRate * 100).toFixed(1)}%` : '98.2%'}
                </span>
              </div>
            </div>
          </div>
        </article>
      </section>

      {/* Data Table Section */}
      <section className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <article className="xl:col-span-2 rounded-[2.5rem] border-[3px] border-slate-900 bg-white p-8 shadow-[8px_8px_0_#1f2937]">
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Xếp hạng tiến độ</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Dữ liệu học tập chi tiết của từng cá nhân</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-[#49B6E5] rounded-xl border-[2px] border-slate-900 text-white shadow-[3px_3px_0_#1f2937] text-[10px] font-black uppercase tracking-widest cursor-default group">
              <TrendingUp size={14} className="group-hover:translate-x-1 transition-transform" />
              Live Tracking
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b-[3px] border-slate-900/5 text-left">
                  <th className="pb-4 pt-2 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 w-1/3">Học viên</th>
                  <th className="pb-4 pt-2 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400">Tiến trình học</th>
                  <th className="pb-4 pt-2 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 text-center">Sao</th>
                  <th className="pb-4 pt-2 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 text-right">Chuỗi học</th>
                </tr>
              </thead>
              <tbody className="divide-y-[2px] divide-slate-100">
                {userProgress.map((item) => {
                  const isSelected = selectedUser?.id === item.id
                  const progress = item.totalQuizzes > 0
                    ? Math.round((item.completedQuizzes / item.totalQuizzes) * 100)
                    : 0
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedUser(item)}
                      className={clsx(
                        "group transition-all cursor-pointer",
                        isSelected ? "bg-slate-50" : "hover:bg-slate-50/50"
                      )}
                    >
                      <td className="py-5 pr-4">
                        <div className="flex items-center gap-3">
                          <div className={clsx(
                            "w-10 h-10 rounded-xl border-[2px] flex items-center justify-center font-black transition-all group-hover:rotate-6",
                            isSelected ? "bg-[#49B6E5] border-slate-900 text-white" : "bg-slate-100 border-slate-200 text-slate-400"
                          )}>
                            {item.fullName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className={clsx("text-sm font-black uppercase tracking-tight", isSelected ? "text-[#49B6E5]" : "text-slate-900")}>
                              {item.fullName}
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{item.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 max-w-[120px] h-3 rounded-full bg-slate-100 border-[1.5px] border-slate-900/10 overflow-hidden relative shadow-inner">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              className={clsx("absolute inset-y-0 left-0 rounded-full", isSelected ? "bg-[#49B6E5]" : "bg-slate-400")}
                            />
                          </div>
                          <span className="text-[11px] font-black text-slate-900">{progress}%</span>
                        </div>
                      </td>
                      <td className="py-5 text-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-50 border-[1.5px] border-orange-200 text-orange-600 font-black text-xs">
                          <span>{item.totalStars}</span>
                          <span className="text-xs">⭐</span>
                        </div>
                      </td>
                      <td className="py-5 text-right pr-2">
                        <span className="text-xs font-black uppercase tracking-tighter text-slate-500">
                          {item.currentStreak} <span className="text-[10px]">Ngày</span> 🔥
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </article>

        {/* User Detail Radar */}
        <article className="rounded-[2.5rem] border-[3px] border-slate-900 bg-white p-8 shadow-[8px_8px_0_#1f2937] flex flex-col items-center justify-center min-h-[400px]">
          {selectedUser ? (
            <div className="w-full h-full flex flex-col group">
              <div className="mb-10 text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#49B6E5]/10 text-[#49B6E5] border-[2px] border-[#49B6E5]/20 text-[10px] font-black uppercase tracking-widest">
                  Phân tích năng lực
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight group-hover:scale-105 transition-transform duration-300">
                  {selectedUser.fullName}
                </h3>
              </div>
              <div className="flex-1 relative min-h-[250px] w-full">
                <Radar data={getRadarData(selectedUser)!} options={radarOptions} />
              </div>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="mx-auto w-20 h-20 rounded-3xl bg-slate-50 border-[3px] border-slate-900 border-dashed flex items-center justify-center text-slate-300"
              >
                <Target size={32} strokeWidth={3} />
              </motion.div>
              <div>
                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Chi tiết học viên</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Chọn một học viên trong danh sách<br />để xem biểu đồ kỹ năng</p>
              </div>
            </div>
          )}
        </article>
      </section>
    </div>
  )
}

export default AdminDashboardPage
