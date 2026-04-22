import React from 'react'
import {
  BookOpen,
  Brain,
  Server,
  TrendingUp,
  Users,
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
  if (value >= 0.28) return 'rgba(239, 68, 68, 0.9)'
  if (value >= 0.18) return 'rgba(249, 115, 22, 0.88)'
  if (value >= 0.1) return 'rgba(245, 158, 11, 0.86)'
  return 'rgba(34, 197, 94, 0.82)'
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
        borderRadius: 8,
        barPercentage: 0.5,
        categoryPercentage: 0.5,
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
          backgroundColor: 'rgba(139, 92, 246, 0.2)',
          borderColor: 'rgba(139, 92, 246, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(139, 92, 246, 1)',
          pointBorderColor: '#fff',
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
        grid: { color: 'rgba(148, 163, 184, 0.15)' },
        pointLabels: {
          font: { size: 10, weight: 'bold' },
          color: '#64748b',
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
        callbacks: {
          label: (ctx) => `${(Number(ctx.raw) * 100).toFixed(1)}% lỗi`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 1.0,
        ticks: {
          callback: (value) => `${Number(value) * 100}%`,
        },
        grid: { color: 'rgba(148, 163, 184, 0.25)' },
      },
      x: {
        grid: { display: false },
      },
    },
  }

  const topCards = [
    {
      label: 'Tổng người dùng',
      value: toNumber(overview.totalUsers),
      icon: Users,
      tone: 'text-blue-600 bg-blue-100',
    },
    {
      label: 'Lượt tập phát âm',
      value: toNumber(overview.totalAttempts),
      icon: BookOpen,
      tone: 'text-violet-600 bg-violet-100',
    },
    {
      label: 'Điểm trung bình',
      value: toNumber(overview.averageScore).toFixed(1),
      icon: TrendingUp,
      tone: 'text-emerald-600 bg-emerald-100',
    },
  ]

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {topCards.map((item) => {
          const Icon = item.icon
          return (
            <article
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-800">{item.value}</p>
                </div>
                <div className={`rounded-xl p-2.5 ${item.tone}`}>
                  <Icon size={18} />
                </div>
              </div>
            </article>
          )
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <article className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-800">Heat Map lỗi phát âm</h2>
              <p className="text-sm text-slate-500">Mức độ lỗi theo nhóm âm (N/L, S/X...)</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              Analytics
            </span>
          </div>
          <div className="h-[300px]">
            <Bar data={heatmapData} options={heatmapOptions} />
          </div>
        </article>

        <article className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-800">Trạng thái hệ thống AI</h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <span className="flex items-center gap-2 text-slate-600"><Server size={15} /> System</span>
              <span className={`font-bold ${health.status === 'UP' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {health.status || 'OFFLINE'}
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span className="flex items-center gap-2 text-slate-600 text-xs">
                  <Brain size={14} className="text-violet-500" /> Parakeet (Local)
                </span>
                <span className={`font-bold text-[12px] ${health.parakeetStatus === 'ONLINE' ? 'text-emerald-600' : 'text-amber-500'}`}>
                  {health.parakeetStatus || 'OFFLINE'}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span className="flex items-center gap-2 text-slate-600 text-xs">
                  <TrendingUp size={14} className="text-blue-500" /> Groq Flash (Cloud)
                </span>
                <span className={`font-bold text-[12px] ${health.groqStatus === 'CONNECTED' ? 'text-emerald-600' : 'text-amber-500'}`}>
                  {health.groqStatus || 'OFFLINE'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-slate-500">Latency</span>
                <span className="font-extrabold text-slate-800">
                  {aiPerformance.averageLatencyMs ? `${aiPerformance.averageLatencyMs}ms` : '---'}
                </span>
              </div>
              <div className="flex items-center justify-between px-1">
                <span className="text-slate-500">Avg. Accuracy</span>
                <span className="font-extrabold text-slate-800 text-emerald-600">
                  {aiPerformance.accuracyRate ? `${(aiPerformance.accuracyRate * 100).toFixed(1)}%` : '---'}
                </span>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <article className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-800">Bảng thống kê tiến độ người dùng</h2>
              <p className="text-sm text-slate-500">Chọn một người dùng để xem biểu đồ năng lực</p>
            </div>
            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">User Management</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-3 pr-4 font-semibold">Người dùng</th>
                  <th className="py-3 pr-4 font-semibold">Tiến độ</th>
                  <th className="py-3 pr-4 font-semibold text-center">Số sao</th>
                  <th className="py-3 pr-4 font-semibold">Streak</th>
                </tr>
              </thead>
              <tbody>
                {userProgress.map((item) => {
                  const isSelected = selectedUser?.id === item.id
                  const progress = item.totalQuizzes > 0
                    ? Math.round((item.completedQuizzes / item.totalQuizzes) * 100)
                    : 0
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedUser(item)}
                      className={`border-b border-slate-100 text-slate-700 cursor-pointer transition-all uppercase ${isSelected ? 'bg-violet-50 border-violet-200' : 'hover:bg-slate-50'
                        }`}
                    >
                      <td className="py-3 pr-4">
                        <div className={`font-semibold ${isSelected ? 'text-violet-700' : ''}`}>{item.fullName}</div>
                        <div className="text-xs text-slate-400">{item.email}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="font-semibold">{progress}%</span>
                        </div>
                        <div className="h-1.5 w-24 rounded-full bg-slate-100">
                          <div
                            className={`h-1.5 rounded-full ${isSelected ? 'bg-violet-600' : 'bg-violet-500'}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-bold text-center text-amber-500">
                        <div className="flex items-center justify-center gap-1">
                          <span>{item.totalStars}</span>
                          <span className="text-sm">⭐</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-medium">{item.currentStreak} ngày</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col items-center justify-center min-h-[350px]">
          {selectedUser ? (
            <div className="w-full h-full flex flex-col">
              <div className="mb-4 text-center">
                <h3 className="text-md font-bold text-slate-800 uppercase line-clamp-1">{selectedUser.fullName}</h3>
                <p className="text-xs text-slate-500">Biểu đồ năng lực cá nhân</p>
              </div>
              <div className="flex-1 relative min-h-[250px]">
                <Radar data={getRadarData(selectedUser)!} options={radarOptions} />
              </div>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                <TrendingUp size={24} />
              </div>
              <p className="text-sm text-slate-400 font-medium">Chọn một người dùng<br />để phân tích chuyên sâu</p>
            </div>
          )}
        </article>
      </section>

      {loading && <p className="text-sm font-medium text-slate-400">Đang tải dữ liệu dashboard...</p>}
    </div>
  )
}

export default AdminDashboardPage
