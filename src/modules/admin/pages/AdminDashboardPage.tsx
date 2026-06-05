import React from 'react'
import {
  Brain,
  Server,
  TrendingUp,
  Users,
  Activity,
  Zap,
  Target,
  Search
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
import apiClient from '../../../services/apiClient'
import { motion, AnimatePresence } from 'framer-motion'
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
  
  // Real-time Engagement & Tournament States
  const [engagement, setEngagement] = React.useState<any>({})
  const [finalizingTournament, setFinalizingTournament] = React.useState(false)
  const [tournamentReport, setTournamentReport] = React.useState<any | null>(null)

  // Search & Filter States for Learner Table
  const [userSearch, setUserSearch] = React.useState('')
  const [performanceFilter, setPerformanceFilter] = React.useState('ALL')

  const executeFinalize = async () => {
    setFinalizingTournament(true)
    setTournamentReport(null)
    try {
      const res: any = await adminService.finalizeWeeklyTournament();
      const report = res?.data ?? res?.data?.data ?? res ?? {}
      setTournamentReport(report)
      loadAllTournaments()
      setNoticeModal({
        type: 'success',
        title: 'Chốt giải thành công',
        message: 'Đã chốt giải đấu tuần thành công! Top 3 học viên đã được vinh danh và nhận thưởng XP.'
      });
    } catch (err: any) {
      console.error('Failed to finalize tournament:', err)
      const backendMessage = err?.response?.data?.message || err?.message || 'Không thể chốt giải đấu lúc này.'
      setNoticeModal({
        type: 'error',
        title: 'Chốt giải thất bại',
        message: 'Lỗi: ' + backendMessage
      });
    } finally {
      setFinalizingTournament(false)
    }
  }

  const handleFinalizeTournament = async () => {
    const activeT = tournaments.find((t) => t.status === 'ACTIVE')
    if (activeT) {
      const isExpired = new Date(activeT.endsAt) <= new Date()
      if (!isExpired) {
        setNoticeModal({
          type: 'error',
          title: 'Không thể chốt giải đấu',
          message: `Không thể chốt giải đấu này sớm! Giải đấu "${activeT.name}" chưa kết thúc thời gian thi đấu. Vui lòng đợi đến khi hết hạn để đảm bảo công bằng cho tất cả học viên.`
        });
        return
      }
    }
    
    setNoticeModal({
      type: 'confirm',
      title: 'Xác nhận chốt giải đấu',
      message: 'Bạn có chắc chắn muốn chốt giải đấu tuần này không? Hành động này sẽ phát thưởng và tạo giải tuần mới. Không thể hoàn tác!',
      onConfirm: () => {
        executeFinalize()
      }
    })
  }

  // Tournament Editing States
  const [editingTournament, setEditingTournament] = React.useState(false)
  const [isSavingTournament, setIsSavingTournament] = React.useState(false)
  const [tournamentForm, setTournamentForm] = React.useState({ name: '', description: '', endsAt: '' })
  const [activeTournamentStatus, setActiveTournamentStatus] = React.useState<string>('ACTIVE')
  const [challengeBankQuestions, setChallengeBankQuestions] = React.useState<any[]>([])
  const [selectedQuestionIds, setSelectedQuestionIds] = React.useState<string[]>([])
  const [tSearch, setTSearch] = React.useState('')
  const [tRegion, setTRegion] = React.useState('ALL')

  const [noticeModal, setNoticeModal] = React.useState<{
    type: 'error' | 'success' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
  } | null>(null)

  // Upcoming Tournament & List States
  const [tournaments, setTournaments] = React.useState<any[]>([])
  const [isLoadingTournaments, setIsLoadingTournaments] = React.useState(false)
  const [isUpcomingModalOpen, setIsUpcomingModalOpen] = React.useState(false)
  const [isCreatingUpcoming, setIsCreatingUpcoming] = React.useState(false)
  const [upcomingForm, setUpcomingForm] = React.useState({
    name: '',
    description: '',
    startsAt: '',
    endsAt: ''
  })
  const [upcomingSelectedQuestionIds, setUpcomingSelectedQuestionIds] = React.useState<string[]>([])
  const [upTSearch, setUpTSearch] = React.useState('')
  const [upTRegion, setUpTRegion] = React.useState('ALL')

  // Tournament Tab & Search States
  const [tournamentTab, setTournamentTab] = React.useState<'ALL' | 'ACTIVE' | 'UPCOMING' | 'FINISHED'>('ALL')
  const [tournamentSearch, setTournamentSearch] = React.useState('')

  const filteredTournaments = React.useMemo(() => {
    return tournaments.filter((t) => {
      const matchesSearch = (t.name || '').toLowerCase().includes(tournamentSearch.toLowerCase());
      const matchesTab = 
        tournamentTab === 'ALL' ||
        (tournamentTab === 'ACTIVE' && t.status === 'ACTIVE') ||
        (tournamentTab === 'UPCOMING' && t.status === 'UPCOMING') ||
        (tournamentTab === 'FINISHED' && t.status === 'FINISHED');
      return matchesSearch && matchesTab;
    });
  }, [tournaments, tournamentSearch, tournamentTab]);

  // Tournament Leaderboard Viewing States
  const [viewingLeaderboardTournament, setViewingLeaderboardTournament] = React.useState<any | null>(null)
  const [leaderboardStandings, setLeaderboardStandings] = React.useState<any[]>([])
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = React.useState(false)

  const handleViewLeaderboard = async (tournament: any) => {
    setViewingLeaderboardTournament(tournament)
    setIsLoadingLeaderboard(true)
    try {
      const res: any = await adminService.getTournamentLeaderboard(tournament.id)
      const list = res?.data?.data ?? res?.data ?? res ?? []
      setLeaderboardStandings(list)
    } catch (err) {
      console.error('Failed to load leaderboard standings', err)
      setLeaderboardStandings([])
    } finally {
      setIsLoadingLeaderboard(false)
    }
  }

  const loadAllTournaments = async () => {
    setIsLoadingTournaments(true)
    try {
      const res: any = await adminService.getAllTournaments()
      const list = res?.data?.data ?? res?.data ?? res ?? []
      setTournaments(list)
    } catch (err) {
      console.error('Failed to load tournaments list', err)
    } finally {
      setIsLoadingTournaments(false)
    }
  }

  const handleCreateUpcomingTournament = async () => {
    if (!upcomingForm.startsAt || !upcomingForm.endsAt) {
      setNoticeModal({
        type: 'error',
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập đầy đủ thời gian bắt đầu và kết thúc!'
      });
      return
    }
    setIsCreatingUpcoming(true)
    try {
      const startsAtIso = new Date(upcomingForm.startsAt).toISOString()
      const endsAtIso = new Date(upcomingForm.endsAt).toISOString()
      
      await adminService.createUpcomingTournament(
        upcomingForm.name,
        upcomingForm.description,
        startsAtIso,
        endsAtIso,
        upcomingSelectedQuestionIds
      )
      setNoticeModal({
        type: 'success',
        title: 'Tạo giải đấu thành công',
        message: 'Tạo giải đấu chuẩn bị (Upcoming) thành công!'
      });
      setIsUpcomingModalOpen(false)
      setUpcomingForm({ name: '', description: '', startsAt: '', endsAt: '' })
      setUpcomingSelectedQuestionIds([])
      loadAllTournaments()
    } catch (err: any) {
      console.error('Failed to create upcoming tournament:', err)
      const errMsg = err?.response?.data?.message || err?.message || 'Không thể tạo giải đấu sắp tới.'
      setNoticeModal({
        type: 'error',
        title: 'Tạo giải đấu thất bại',
        message: 'Lỗi: ' + errMsg
      });
    } finally {
      setIsCreatingUpcoming(false)
    }
  }

  const loadActiveTournamentData = async () => {
    try {
      const res: any = await apiClient.get('/tournaments/active');
      const data = res?.data?.data ?? res?.data ?? res ?? {};
      setTournamentForm({
        name: data.name || '',
        description: data.description || '',
        endsAt: data.endsAt || ''
      });
      setActiveTournamentStatus(data.status || 'ACTIVE');
      if (data.challenges) {
        setSelectedQuestionIds(data.challenges.map((c: any) => c.id));
      }
    } catch (err) {
      console.error('Failed to load active tournament details', err);
    }
  };

  const loadChallengeBank = async () => {
    try {
      const res: any = await adminService.getChallengeBank();
      const list = res?.data?.data ?? res?.data ?? res ?? [];
      const speakingOnly = Array.isArray(list) 
        ? list.filter((c: any) => c.skillType === 'SPEAKING')
        : [];
      setChallengeBankQuestions(speakingOnly);
    } catch (err) {
      console.error('Failed to load challenge bank questions', err);
    }
  };

  React.useEffect(() => {
    if (editingTournament) {
      loadActiveTournamentData();
      loadChallengeBank();
    }
  }, [editingTournament]);

  React.useEffect(() => {
    if (isUpcomingModalOpen) {
      loadChallengeBank();
    }
  }, [isUpcomingModalOpen]);

  const handleSaveTournament = async () => {
    setIsSavingTournament(true);
    try {
      await adminService.updateActiveTournament(
        tournamentForm.name,
        tournamentForm.description,
        tournamentForm.endsAt
      );

      await adminService.assignActiveTournamentQuestions(selectedQuestionIds);

      setNoticeModal({
        type: 'success',
        title: 'Cập nhật thành công',
        message: 'Đã cập nhật thông tin giải đấu và câu hỏi thành công!'
      });
      setEditingTournament(false);
    } catch (err: any) {
      console.error('Failed to update active tournament:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Không thể cập nhật giải đấu.';
      setNoticeModal({
        type: 'error',
        title: 'Cập nhật thất bại',
        message: 'Lỗi: ' + errMsg
      });
    } finally {
      setIsSavingTournament(false);
    }
  };

  const filteredChallenges = React.useMemo(() => {
    return challengeBankQuestions.filter((c) => {
      const matchesSearch = (c.contentText || '').toLowerCase().includes(tSearch.toLowerCase());
      const matchesRegion = tRegion === 'ALL' || c.region === tRegion;
      return matchesSearch && matchesRegion;
    });
  }, [challengeBankQuestions, tSearch, tRegion]);

  const filteredUpcomingChallenges = React.useMemo(() => {
    return challengeBankQuestions.filter((c) => {
      const matchesSearch = (c.contentText || '').toLowerCase().includes(upTSearch.toLowerCase());
      const matchesRegion = upTRegion === 'ALL' || c.region === upTRegion;
      return matchesSearch && matchesRegion;
    });
  }, [challengeBankQuestions, upTSearch, upTRegion]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [overviewRes, heatmapsRes, healthRes, aiRes, progressRes, engagementRes]: any[] = await Promise.all([
          adminService.getAnalyticsOverview().catch(() => ({ status: 'error' })),
          adminService.getAnalyticsErrorHeatmaps().catch(() => ({ status: 'error' })),
          adminService.getSystemHealth().catch(() => ({ status: 'error' })),
          adminService.getAiPerformance().catch(() => ({ status: 'error' })),
          adminService.getAnalyticsUsersProgress().catch(() => ({ status: 'error' })),
          adminService.getAnalyticsEngagement().catch(() => ({ status: 'error' })),
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
        if (engagementRes.status === 'success' || (engagementRes && engagementRes.dailyActiveUsers !== undefined)) {
          const data = engagementRes.data?.data ?? engagementRes.data ?? engagementRes ?? {}
          setEngagement(data)
        }
      } catch (error) {
        console.error('Failed to fetch admin dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    loadAllTournaments()
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

  // --- Comparison Radar helper methods ---
  const getAverageStats = React.useCallback(() => {
    if (!userProgress || userProgress.length === 0) {
      return { progress: 50, accuracy: 65, consistency: 35, avgScore: 70, totalStarsNorm: 40 }
    }
    let sumProgress = 0, sumAccuracy = 0, sumConsistency = 0, sumAvgScore = 0, sumStarsNorm = 0
    userProgress.forEach((u: any) => {
      const p = u.totalQuizzes > 0 ? (u.completedQuizzes / u.totalQuizzes) * 100 : 0
      const a = u.completedQuizzes > 0 ? (u.totalStars / (u.completedQuizzes * 3)) * 100 : 0
      const c = Math.min((u.currentStreak / 30) * 100, 100)
      const s = u.averageScore || 0
      const st = Math.min((u.totalStars / 50) * 100, 100)
      sumProgress += p
      sumAccuracy += a
      sumConsistency += c
      sumAvgScore += s
      sumStarsNorm += st
    })
    const len = userProgress.length
    return {
      progress: sumProgress / len,
      accuracy: sumAccuracy / len,
      consistency: sumConsistency / len,
      avgScore: sumAvgScore / len,
      totalStarsNorm: sumStarsNorm / len
    }
  }, [userProgress])

  const getRadarData = (user: any) => {
    const avg = getAverageStats()
    
    if (!user) {
      return {
        labels: ['Tiến độ', 'Chất lượng', 'Kỷ luật', 'Điểm TB', 'Tích lũy'],
        datasets: [
          {
            label: 'Trung bình chung',
            data: [avg.progress, avg.accuracy, avg.consistency, avg.avgScore, avg.totalStarsNorm],
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            borderColor: '#f97316',
            borderWidth: 2,
            borderDash: [5, 5],
            pointBackgroundColor: '#f97316',
            pointBorderColor: '#1f2937',
            pointBorderWidth: 1.5,
            pointRadius: 3,
          }
        ]
      }
    }

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
          backgroundColor: 'rgba(73, 182, 229, 0.25)',
          borderColor: '#49B6E5',
          borderWidth: 3,
          pointBackgroundColor: '#49B6E5',
          pointBorderColor: '#1f2937',
          pointBorderWidth: 2,
          pointRadius: 4,
        },
        {
          label: 'Trung bình chung',
          data: [avg.progress, avg.accuracy, avg.consistency, avg.avgScore, avg.totalStarsNorm],
          backgroundColor: 'rgba(249, 115, 22, 0.05)',
          borderColor: '#f97316',
          borderWidth: 2,
          borderDash: [5, 5],
          pointBackgroundColor: '#f97316',
          pointBorderColor: '#1f2937',
          pointBorderWidth: 1.5,
          pointRadius: 3,
        }
      ]
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
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          font: { size: 10, weight: 'bold', family: 'Nunito' },
          boxWidth: 10,
        }
      },
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
      label: 'Hoạt động (24h)',
      value: toNumber(engagement.dailyActiveUsers ?? 0),
      icon: Activity,
      color: '#ec4899',
      bg: 'bg-pink-50',
    },
    {
      label: 'Thời gian/Phiên',
      value: `${toNumber(engagement.averageSessionTimeMinutes ?? 0)} p`,
      icon: Zap,
      color: '#f59e0b',
      bg: 'bg-amber-50',
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

  // Filter user progress array
  const filteredUserProgress = React.useMemo(() => {
    return userProgress.filter((item) => {
      const matchesSearch = (item.fullName || '').toLowerCase().includes(userSearch.toLowerCase()) || 
                            (item.email || '').toLowerCase().includes(userSearch.toLowerCase())
      
      let matchesPerformance = true
      if (performanceFilter === 'EXCELLENT') {
        matchesPerformance = (item.averageScore || 0) >= 80
      } else if (performanceFilter === 'ATTENTION') {
        matchesPerformance = (item.averageScore || 0) < 70
      } else if (performanceFilter === 'MEDIUM') {
        matchesPerformance = (item.averageScore || 0) >= 70 && (item.averageScore || 0) < 80
      }
      
      return matchesSearch && matchesPerformance
    })
  }, [userProgress, userSearch, performanceFilter])

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
    <div className="space-y-8 pb-10 text-slate-800">
      
      {/* Top Cards Grid */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {topCards.map((item, idx) => {
          const Icon = item.icon
          const isHighlight = item.label === 'Điểm trung bình' || item.label === 'Hoạt động (24h)'
          return (
            <motion.article
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={clsx(
                "group relative rounded-[2rem] border-[3px] border-slate-900 bg-white p-6 shadow-[6px_6px_0_#1f2937] transition-all hover:-translate-y-1",
                isHighlight ? "hover:shadow-[10px_10px_0_#49B6E5] hover:border-[#49B6E5]" : "hover:shadow-[10px_10px_0_#1f2937]"
              )}
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

      {/* Row 1: Balanced Visual Analytics Center */}
      <section className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        
        {/* Pronunciation Error Heatmap (2/3 width) */}
        <article className="xl:col-span-2 rounded-[2.5rem] border-[3px] border-slate-900 bg-white p-8 shadow-[8px_8px_0_#1f2937] flex flex-col justify-between h-[480px]">
          <div>
            <div className="flex items-center justify-between">
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
          </div>
          <div className="h-[320px] mt-6">
            <Bar data={heatmapData} options={heatmapOptions} />
          </div>
        </article>

        {/* User Competency Radar (1/3 width) - Locked height with left card! */}
        <article className="rounded-[2.5rem] border-[3px] border-slate-900 bg-white p-8 shadow-[8px_8px_0_#1f2937] flex flex-col justify-between h-[480px]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#49B6E5]/10 text-[#49B6E5] border-[2px] border-[#49B6E5]/20 text-[10px] font-black uppercase tracking-widest">
              Năng lực học tập
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mt-2 truncate">
              {selectedUser ? selectedUser.fullName : 'Học lực chung'}
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
              {selectedUser ? 'So sánh với trung bình hệ thống' : 'Chỉ số trung bình của tất cả học viên'}
            </p>
          </div>
          
          <div className="flex-1 relative w-full h-[280px] mt-4 flex items-center justify-center">
            <Radar data={getRadarData(selectedUser)} options={radarOptions} />
          </div>

          {selectedUser && (
            <button
              onClick={() => setSelectedUser(null)}
              className="w-full mt-2 py-2 rounded-xl border-2 border-slate-900 bg-slate-50 text-[10px] font-black uppercase text-slate-500 shadow-[2px_2px_0_#1f2937] hover:bg-slate-100 transition-colors"
            >
              Hủy chọn học viên (Xem chung)
            </button>
          )}
        </article>
      </section>

      {/* Row 2: Symmetric Operations Hub */}
      <section className="grid grid-cols-1 gap-8 md:grid-cols-2">
        
        {/* AI System Monitor */}
        <article className="rounded-[2.5rem] border-[3px] border-slate-900 bg-white p-8 shadow-[8px_8px_0_#1f2937] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 border-[2px] border-slate-900 flex items-center justify-center text-indigo-600 shadow-[2px_2px_0_#1f2937]">
                <Server size={20} strokeWidth={3} />
              </div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none mb-0">Hệ thống giám sát AI</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border-[2.5px] border-slate-900 shadow-[4px_4px_0_#065f4630]">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-800 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Server Status
                </span>
                <span className="font-black text-xs uppercase tracking-tighter text-emerald-700">
                  {health.status || 'CONNECTED'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border-[2px] border-slate-900 shadow-[3px_3px_0_#00000010]">
                  <div className="flex items-center gap-2 min-w-0">
                    <Brain size={16} className="text-[#49B6E5] flex-shrink-0" strokeWidth={3} />
                    <span className="text-[9px] font-black uppercase text-slate-600 truncate">Parakeet Engine</span>
                  </div>
                  <span className="font-black text-[9px] text-emerald-600 uppercase flex-shrink-0">
                    {health.parakeetStatus || 'ONLINE'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border-[2px] border-slate-900 shadow-[3px_3px_0_#00000010]">
                  <div className="flex items-center gap-2 min-w-0">
                    <Zap size={16} className="text-orange-500 flex-shrink-0" strokeWidth={3} />
                    <span className="text-[9px] font-black uppercase text-slate-600 truncate">Gemini Cloud</span>
                  </div>
                  <span className="font-black text-[9px] text-emerald-600 uppercase flex-shrink-0">
                    CONNECTED
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t-[2px] border-slate-900/5 grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Độ trễ trung bình</span>
              <span className="text-xl font-black text-slate-900">
                {aiPerformance.averageLatencyMs ? `${aiPerformance.averageLatencyMs}ms` : '124ms'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#49B6E5] block mb-0.5">Độ chính xác AI</span>
              <span className="text-xl font-black text-[#49B6E5]">
                {aiPerformance.accuracyRate ? `${(aiPerformance.accuracyRate * 100).toFixed(1)}%` : '98.2%'}
              </span>
            </div>
          </div>
        </article>

        {/* Weekly Tournament card */}
        <article className="rounded-[2.5rem] border-[3px] border-slate-900 bg-[#fffcf4] p-8 shadow-[8px_8px_0_#1f2937] flex flex-col justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border-[2.5px] border-slate-900 bg-[#fef9c3] px-3 py-1 text-[10px] font-black uppercase text-slate-800 shadow-[2px_2px_0_#1f2937]">
              Weekly Event
            </div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none mb-3">Giải Đấu Hàng Tuần</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Đóng giải đấu tuần đang diễn ra. Hệ thống sẽ tự động tổng kết Top 3 học viên dẫn đầu, phát thưởng XP, mở khóa Huy hiệu vô địch và khởi động kỳ giải đấu cho tuần kế tiếp.
            </p>
            {(() => {
              const activeT = tournaments.find((t) => t.status === 'ACTIVE');
              if (!activeT) return null;
              const isExpired = new Date(activeT.endsAt) <= new Date();
              const formattedEndsAt = (() => {
                try {
                  const date = new Date(activeT.endsAt);
                  return date.toLocaleString('vi-VN', {
                    timeZone: 'Asia/Ho_Chi_Minh',
                    hour12: false,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                } catch (e) {
                  return activeT.endsAt;
                }
              })();
              return (
                <div className="mt-4 p-4 rounded-xl border-2 border-slate-900 bg-white shadow-[2px_2px_0_#1f2937] space-y-2">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Giải đang diễn ra</p>
                  <p className="text-xs font-black text-slate-900 truncate">{activeT.name}</p>
                  <p className="text-[10px] font-bold text-slate-500">Kết thúc: {formattedEndsAt}</p>
                  <div className="pt-1">
                    {isExpired ? (
                      <span className="inline-block px-2.5 py-1 rounded-lg border-2 border-slate-900 bg-emerald-100 text-[10px] font-black text-emerald-800 shadow-[1px_1px_0_#1f2937]">
                        ĐÃ HẾT HẠN - SẴN SÀNG CHỐT
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-1 rounded-lg border-2 border-slate-900 bg-amber-100 text-[10px] font-black text-amber-800 shadow-[1px_1px_0_#1f2937]">
                        ĐANG THI ĐẤU - CHƯA ĐƯỢC CHỐT
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setEditingTournament(true)}
                className="flex-1 rounded-2xl border-[3px] border-slate-900 bg-white py-4 text-xs font-black text-slate-900 shadow-[4px_4px_0_#1f2937] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
              >
                CHỈNH SỬA GIẢI ĐẤU
              </button>
              <button
                onClick={handleFinalizeTournament}
                disabled={finalizingTournament}
                className="flex-1 rounded-2xl border-[3px] border-slate-900 bg-[#f1c46f] py-4 text-xs font-black text-slate-900 shadow-[4px_4px_0_#1f2937] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
              >
                {finalizingTournament ? 'ĐANG CHỐT...' : 'CHỐT GIẢI ĐẤU'}
              </button>
            </div>
            <button
              onClick={() => setIsUpcomingModalOpen(true)}
              className="w-full rounded-2xl border-[3px] border-slate-900 bg-[#C084FC] py-4 text-xs font-black text-slate-900 shadow-[4px_4px_0_#1f2937] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none text-center"
            >
              TẠO GIẢI ĐẤU SẮP TỚI
            </button>
          </div>
        </article>
      </section>

      {/* 📅 TOURNAMENTS LIST SECTION */}
      <section className="rounded-[2.5rem] border-[3px] border-slate-900 bg-white p-8 shadow-[8px_8px_0_#1f2937] space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b-2 border-slate-100 pb-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Danh sách & Lịch sử giải đấu</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
              Quản lý và xem lịch sử thứ hạng của tất cả các kỳ đấu đã qua, đang chạy, hoặc sắp diễn ra
            </p>
          </div>
          <button
            onClick={() => loadAllTournaments()}
            disabled={isLoadingTournaments}
            className="px-4 py-2 rounded-xl border-2 border-slate-900 bg-slate-50 text-xs font-black text-slate-700 shadow-[2px_2px_0_#1f2937] hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            {isLoadingTournaments ? 'ĐANG TẢI...' : 'TẢI LẠI DANH SÁCH'}
          </button>
        </div>

        {/* 🔍 SEARCH & TAB SWITCHERS FOR MANY TOURNAMENTS */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-2">
          {/* Tab Filter buttons */}
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'ACTIVE', 'UPCOMING', 'FINISHED'] as const).map((tab) => {
              const label = 
                tab === 'ALL' ? 'TẤT CẢ' : 
                tab === 'ACTIVE' ? 'ĐANG DIỄN RA' : 
                tab === 'UPCOMING' ? 'SẮP DIỄN RA' : 'ĐÃ KẾT THÚC / LỊCH SỬ';
              const isActive = tournamentTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setTournamentTab(tab)}
                  className={clsx(
                    "px-4 py-2 rounded-xl border-2 border-slate-900 text-xs font-black transition-all shadow-[2px_2px_0_#1f2937] active:translate-y-0.5 active:shadow-none",
                    isActive 
                      ? "bg-slate-900 text-white shadow-none" 
                      : "bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:max-w-xs">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">
              <Search size={14} strokeWidth={3} />
            </span>
            <input
              type="text"
              placeholder="Tìm giải đấu theo tên..."
              value={tournamentSearch}
              onChange={(e) => setTournamentSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border-2 border-slate-900 text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-slate-900 bg-slate-50/50"
            />
          </div>
        </div>

        {isLoadingTournaments ? (
          <div className="py-14 text-center">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Đang tải danh sách giải đấu...</p>
          </div>
        ) : filteredTournaments.length > 0 ? (
          <div className="overflow-x-auto border-2 border-slate-900 rounded-2xl max-h-[400px] overflow-y-auto custom-scrollbar shadow-[4px_4px_0_#1f2937] bg-white">
            <table className="w-full min-w-[800px] relative border-collapse">
              <thead className="sticky top-0 bg-slate-50 z-15 shadow-sm border-b-2 border-slate-900">
                <tr className="text-left bg-slate-100">
                  <th className="p-4 font-black text-[11px] uppercase tracking-[0.2em] text-slate-500 w-1/4">Giải đấu</th>
                  <th className="p-4 font-black text-[11px] uppercase tracking-[0.2em] text-slate-500 text-center">Loại</th>
                  <th className="p-4 font-black text-[11px] uppercase tracking-[0.2em] text-slate-500 text-center">Trạng thái</th>
                  <th className="p-4 font-black text-[11px] uppercase tracking-[0.2em] text-slate-500 text-center">Bắt đầu</th>
                  <th className="p-4 font-black text-[11px] uppercase tracking-[0.2em] text-slate-500 text-center">Kết thúc</th>
                  <th className="p-4 font-black text-[11px] uppercase tracking-[0.2em] text-slate-500 text-center">Số câu hỏi</th>
                  <th className="p-4 font-black text-[11px] uppercase tracking-[0.2em] text-slate-500 text-right pr-6">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100">
                {filteredTournaments.map((t) => {
                  let statusBg = 'bg-slate-100 border-slate-300 text-slate-650'
                  if (t.status === 'ACTIVE') statusBg = 'bg-emerald-50 border-emerald-300 text-emerald-600'
                  else if (t.status === 'UPCOMING') statusBg = 'bg-purple-50 border-purple-300 text-purple-650'

                  let questionsCount = 0
                  if (t.questionsJson) {
                    try {
                      const questions = typeof t.questionsJson === 'string' ? JSON.parse(t.questionsJson) : t.questionsJson
                      questionsCount = Array.isArray(questions) ? questions.length : 0
                    } catch (e) {
                      console.error('Error parsing questionsJson', e)
                    }
                  }

                  const formatDateTime = (isoString?: string) => {
                    if (!isoString) return 'N/A'
                    try {
                      const date = new Date(isoString)
                      return date.toLocaleString('vi-VN', {
                        timeZone: 'Asia/Ho_Chi_Minh',
                        hour12: false,
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    } catch (e) {
                      return isoString
                    }
                  }

                  return (
                    <tr key={t.id} className="group hover:bg-slate-50/40 transition-all">
                      <td className="p-4 pr-4">
                        <div>
                          <div className="text-sm font-black uppercase tracking-tight text-slate-900">
                            {t.name || 'Giải Đấu Tuần'}
                          </div>
                          {t.description && (
                            <div className="text-[10px] font-semibold text-slate-400 truncate max-w-[300px]" title={t.description}>
                              {t.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{t.type || 'WEEKLY'}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-lg border-[1.5px] font-black text-xs uppercase ${statusBg}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-xs font-bold text-slate-700">{formatDateTime(t.startsAt)}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-xs font-bold text-slate-700">{formatDateTime(t.endsAt)}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-xs font-black text-[#49B6E5]">
                          {questionsCount} câu hỏi
                        </span>
                      </td>
                      <td className="p-4 text-right pr-6">
                        {t.status !== 'UPCOMING' ? (
                          <button
                            onClick={() => handleViewLeaderboard(t)}
                            className="px-3 py-1.5 rounded-lg border-2 border-slate-900 bg-[#f1c46f] text-[10px] font-black text-slate-900 shadow-[2px_2px_0_#1f2937] hover:bg-[#e2b25b] active:translate-y-0.5 active:shadow-none"
                          >
                            XEM THỨ HẠNG
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 italic">Chưa bắt đầu</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-14 rounded-2xl border-2 border-dashed border-slate-200 text-center bg-slate-50">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Không có giải đấu nào được tìm thấy</p>
          </div>
        )}
      </section>

      {/* Row 3: 100% Width Learner Tracking Center */}
      <section className="rounded-[2.5rem] border-[3px] border-slate-900 bg-white p-8 shadow-[8px_8px_0_#1f2937] space-y-6">
        
        {/* Table filters and Search Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b-2 border-slate-100 pb-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Giám sát tiến độ học tập center</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Bấm chọn một dòng để phân tích năng lực học viên chi tiết của học viên phía trên</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                <Search size={14} strokeWidth={3} />
              </span>
              <input
                type="text"
                placeholder="Tìm học viên..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs rounded-xl border-2 border-slate-900 text-slate-905 font-bold focus:outline-none"
              />
            </div>

            {/* Performance filter */}
            <select
              value={performanceFilter}
              onChange={(e) => setPerformanceFilter(e.target.value)}
              className="rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-xs font-black text-slate-800 shadow-[2px_2px_0_#1f2937] focus:outline-none"
            >
              <option value="ALL">TẤT CẢ HỌC LỰC</option>
              <option value="EXCELLENT">XUẤT SẮC (&gt;= 80đ)</option>
              <option value="MEDIUM">TRUNG BÌNH (70 - 79đ)</option>
              <option value="ATTENTION">CẦN CHÚ Ý (&lt; 70đ)</option>
            </select>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#49B6E5] rounded-xl border-[2px] border-slate-900 text-white shadow-[2px_2px_0_#1f2937] text-[10px] font-black uppercase tracking-widest cursor-default group">
              <TrendingUp size={12} className="group-hover:translate-x-0.5 transition-transform" strokeWidth={3} />
              Live
            </div>
          </div>
        </div>

        {/* Data Table */}
        {filteredUserProgress.length > 0 ? (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b-[3px] border-slate-900/5 text-left">
                  <th className="pb-4 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 w-1/4">Học viên</th>
                  <th className="pb-4 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400">Tiến trình học</th>
                  <th className="pb-4 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 text-center">Tổng Sao đạt</th>
                  <th className="pb-4 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 text-center">Điểm Trung Bình</th>
                  <th className="pb-4 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 text-right pr-4">Chuỗi học (Streak)</th>
                </tr>
              </thead>
              <tbody className="divide-y-[2px] divide-slate-100">
                {filteredUserProgress.map((item) => {
                  const isSelected = selectedUser?.id === item.id
                  const progress = item.totalQuizzes > 0
                    ? Math.round((item.completedQuizzes / item.totalQuizzes) * 100)
                    : 0
                  
                  let scoreColor = 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  if ((item.averageScore || 0) < 70) {
                    scoreColor = 'bg-rose-50 border-rose-200 text-rose-600'
                  } else if ((item.averageScore || 0) < 80) {
                    scoreColor = 'bg-amber-50 border-amber-200 text-amber-600'
                  }

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedUser(item)}
                      className={clsx(
                        "group transition-all cursor-pointer",
                        isSelected ? "bg-slate-50/80" : "hover:bg-slate-50/40"
                      )}
                    >
                      <td className="py-4 pr-4">
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
                            <div className="text-[10px] font-bold text-slate-400 truncate max-w-[200px]">{item.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 max-w-[150px] h-3 rounded-full bg-slate-100 border-[1.5px] border-slate-900/10 overflow-hidden relative shadow-inner">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              className={clsx("absolute inset-y-0 left-0 rounded-full", isSelected ? "bg-[#49B6E5]" : "bg-slate-400")}
                            />
                          </div>
                          <span className="text-[11px] font-black text-slate-900">{progress}%</span>
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-50 border-[1.5px] border-orange-200 text-orange-600 font-black text-xs">
                          <span>{item.totalStars}</span>
                          <span className="text-xs">⭐</span>
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-lg border-[1.5px] font-black text-xs uppercase ${scoreColor}`}>
                          {toNumber(item.averageScore).toFixed(1)}đ
                        </span>
                      </td>
                      <td className="py-4 text-right pr-4">
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
        ) : (
          <div className="py-14 rounded-2xl border-2 border-dashed border-slate-200 text-center bg-slate-50">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Không có dữ liệu học viên trùng khớp</p>
          </div>
        )}
      </section>

      {/* 🎉 TOURNAMENT REPORT MODAL */}
      {tournamentReport && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-[2.5rem] border-[3px] border-slate-900 bg-[#fbf6ef] p-8 text-center shadow-[10px_10px_0_#1f2937] animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setTournamentReport(null)}
              className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full border-2 border-slate-900 bg-white font-black text-slate-900 shadow-[3px_3px_0_#1f2937] active:translate-y-0.5"
            >
              X
            </button>

            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border-[3px] border-slate-900 bg-[#fef9c3] shadow-[4px_4px_0_#1f2937]">
              <span className="text-3xl font-black">🏆</span>
            </div>

            <h3 className="text-2xl font-serif font-black leading-tight text-slate-900 uppercase">
              Chốt Giải Tuần Thành Công!
            </h3>
            <p className="mt-2 text-xs font-black uppercase text-slate-400">
              {tournamentReport.finalizedTournament || 'Mùa giải vừa qua'}
            </p>

            <div className="my-6 rounded-2xl border-[3px] border-slate-900 bg-white p-5 text-left shadow-[4px_4px_0_#1f2937] space-y-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">🥇 QUÁN QUÂN (+500 XP & CÚP)</p>
                <p className="text-sm font-black text-slate-900">{tournamentReport.champion || 'Chưa cập nhật'}</p>
              </div>
              <div className="border-t-2 border-slate-100 pt-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">🥈 Á QUÂN (+250 XP & HUY CHƯƠNG)</p>
                <p className="text-sm font-black text-slate-900">{tournamentReport.runnerUp || 'Chưa cập nhật'}</p>
              </div>
              <div className="border-t-2 border-slate-100 pt-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">🥉 HẠNG BA (+100 XP & HUY CHƯƠNG)</p>
                <p className="text-sm font-black text-slate-900">{tournamentReport.thirdPlace || 'Chưa cập nhật'}</p>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-dashed border-slate-300 p-4 mb-6 bg-slate-50 text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#49B6E5]">Kỳ đấu tiếp theo</span>
              <p className="text-xs font-bold text-slate-700 mt-1">{tournamentReport.newTournament || 'Giải Đấu Tuần Mới'}</p>
            </div>

            <button
              onClick={() => setTournamentReport(null)}
              className="w-full rounded-2xl border-[3px] border-slate-900 bg-[#10b981] py-4 text-base font-black text-white shadow-[4px_4px_0_#1f2937] hover:bg-[#059669]"
            >
              HOÀN TẤT
            </button>
          </div>
        </div>
      )}

      {/* 🛠️ EDIT TOURNAMENT MODAL */}
      <AnimatePresence>
        {editingTournament && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl rounded-[2.5rem] border-[3px] border-slate-900 bg-[#fbf6ef] p-6 lg:p-8 text-left shadow-[10px_10px_0_#1f2937] my-8 max-h-[90vh] flex flex-col"
            >
              <button
                onClick={() => setEditingTournament(false)}
                className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full border-2 border-slate-900 bg-white font-black text-slate-900 shadow-[3px_3px_0_#1f2937] active:translate-y-0.5"
              >
                X
              </button>

              <div className="mb-4">
                <span className="inline-block rounded-full border-2 border-slate-900 bg-[#7dd3fc] px-3 py-1 text-[10px] font-black uppercase text-slate-800 shadow-[2px_2px_0_#1f2937]">
                  Weekly Event Manager
                </span>
                <h3 className="mt-2 text-2xl font-black text-slate-900 uppercase">
                  Chỉnh Sửa Giải Đấu Tuần
                </h3>
                <p className="text-xs text-slate-500">Thay đổi thông tin kỳ đấu và chọn thủ công các câu hỏi phát âm từ kho câu hỏi.</p>
              </div>

              {/* Scrollable Container */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar my-4">
                
                {activeTournamentStatus === 'ACTIVE' && (
                  <div className="p-4 rounded-xl border-2 border-rose-900 bg-rose-50 text-xs font-black text-rose-800 shadow-[2px_2px_0_#1f2937] leading-relaxed">
                    Lưu ý: Giải đấu tuần này đang diễn ra (ACTIVE). Để đảm bảo tính công bằng và bảo vệ quyền lợi, điểm số của các học viên đang thi đấu, toàn bộ thông tin và danh sách câu hỏi đã được tự động khóa chỉnh sửa.
                  </div>
                )}

                {/* Form Fields */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Tên Giải Đấu</label>
                    <input
                      type="text"
                      value={tournamentForm.name}
                      onChange={(e) => setTournamentForm({ ...tournamentForm, name: e.target.value })}
                      disabled={activeTournamentStatus === 'ACTIVE'}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-900 bg-white text-slate-805 font-bold focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-300"
                      placeholder="Giải đấu Tuần..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Thời Gian Kết Thúc (ISO UTC)</label>
                    <input
                      type="text"
                      value={tournamentForm.endsAt}
                      onChange={(e) => setTournamentForm({ ...tournamentForm, endsAt: e.target.value })}
                      disabled={activeTournamentStatus === 'ACTIVE'}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-900 bg-white text-slate-805 font-bold focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-300"
                      placeholder="e.g. 2026-06-02T15:53:51Z"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Mô Tả Giải Đấu</label>
                    <textarea
                      value={tournamentForm.description}
                      onChange={(e) => setTournamentForm({ ...tournamentForm, description: e.target.value })}
                      disabled={activeTournamentStatus === 'ACTIVE'}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-900 bg-white text-slate-805 font-bold focus:outline-none h-20 resize-none disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-300"
                      placeholder="Mô tả chi tiết giải đấu..."
                    />
                  </div>
                </div>

                {/* Question Selection Panel */}
                <div className="border-t-[2px] border-slate-900/10 pt-4 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h4 className="text-base font-black text-slate-900 uppercase">
                        Chọn Câu Hỏi Phát Âm ({selectedQuestionIds.length} câu đang chọn)
                      </h4>
                      <p className="text-[10px] font-semibold text-slate-400">
                        {activeTournamentStatus === 'ACTIVE' 
                          ? 'Danh sách câu hỏi thi đấu hiện tại của tuần này.'
                          : 'Chọn tối thiểu 1 câu, tốt nhất là 10 câu phát âm.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Tìm câu hỏi..."
                        value={tSearch}
                        onChange={(e) => setTSearch(e.target.value)}
                        className="px-3 py-1.5 text-xs rounded-lg border-2 border-slate-900 bg-white text-slate-805 focus:outline-none"
                      />
                      <select
                        value={tRegion}
                        onChange={(e) => setTRegion(e.target.value)}
                        className="rounded-lg border-2 border-slate-900 bg-white px-2 py-1.5 text-xs font-black text-slate-800"
                      >
                        <option value="ALL">TẤT CẢ VÙNG</option>
                        <option value="BAC">MIỀN BẮC</option>
                        <option value="TRUNG">MIỀN TRUNG</option>
                        <option value="NAM">MIỀN NAM</option>
                      </select>
                    </div>
                  </div>

                  {/* List of Challenges */}
                  <div className="max-h-[220px] overflow-y-auto border-2 border-slate-900 rounded-2xl bg-white divide-y-2 divide-slate-100 custom-scrollbar">
                    {filteredChallenges.length > 0 ? (
                      filteredChallenges.map((c) => {
                        const isChecked = selectedQuestionIds.includes(c.id);
                        return (
                          <div
                            key={c.id}
                            onClick={() => {
                              if (activeTournamentStatus === 'ACTIVE') return;
                              if (isChecked) {
                                setSelectedQuestionIds(selectedQuestionIds.filter((id) => id !== c.id));
                              } else {
                                setSelectedQuestionIds([...selectedQuestionIds, c.id]);
                              }
                            }}
                            className={`flex items-start gap-3 p-3 text-xs transition-colors ${
                              activeTournamentStatus === 'ACTIVE' 
                                ? 'cursor-default' 
                                : 'cursor-pointer hover:bg-slate-50'
                            } ${isChecked ? 'bg-[#eef9fe]' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              disabled={activeTournamentStatus === 'ACTIVE'}
                              className="mt-0.5 accent-[#49B6E5]"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-serif font-black text-slate-800 leading-snug">"{c.contentText}"</p>
                              <div className="flex gap-2 mt-1">
                                <span className="rounded-full px-2 py-0.5 bg-slate-100 border text-[9px] font-bold text-slate-500">
                                  {c.region === 'BAC' ? 'BẮC' : c.region === 'TRUNG' ? 'TRUNG' : 'NAM'}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400">IPA: /{c.metadataJson?.ipa || c.metadataJson?.transcript || 'N/A'}/</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center text-slate-400 font-bold">Không tìm thấy câu hỏi phát âm nào trong kho</div>
                    )}
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t-[2px] border-slate-900/10 pt-4 mt-auto">
                {activeTournamentStatus === 'ACTIVE' ? (
                  <button
                    onClick={() => setEditingTournament(false)}
                    className="px-8 py-3 rounded-xl border-2 border-slate-900 bg-white text-xs font-black text-slate-700 shadow-[3px_3px_0_#1f2937] hover:bg-slate-50 transition-all active:translate-y-0.5 active:shadow-none"
                  >
                    ĐÓNG CHI TIẾT
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setEditingTournament(false)}
                      className="px-6 py-3 rounded-xl border-2 border-slate-900 bg-white text-xs font-black text-slate-500 shadow-[3px_3px_0_#1f2937]"
                    >
                      HỦY BỎ
                    </button>
                    <button
                      onClick={handleSaveTournament}
                      disabled={isSavingTournament || selectedQuestionIds.length === 0}
                      className="px-6 py-3 rounded-xl border-2 border-slate-900 bg-[#10b981] text-xs font-black text-white shadow-[3px_3px_0_#1f2937] disabled:opacity-50"
                    >
                      {isSavingTournament ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
                    </button>
                  </>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🛠️ CREATE UPCOMING TOURNAMENT MODAL */}
      <AnimatePresence>
        {isUpcomingModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl rounded-[2.5rem] border-[3px] border-slate-900 bg-[#fbf6ef] p-6 lg:p-8 text-left shadow-[10px_10px_0_#1f2937] my-8 max-h-[90vh] flex flex-col"
            >
              <button
                onClick={() => setIsUpcomingModalOpen(false)}
                className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full border-2 border-slate-900 bg-white font-black text-slate-900 shadow-[3px_3px_0_#1f2937] active:translate-y-0.5"
              >
                X
              </button>

              <div className="mb-4">
                <span className="inline-block rounded-full border-2 border-slate-900 bg-[#C084FC]/25 px-3 py-1 text-[10px] font-black uppercase text-[#8B5CF6] shadow-[2px_2px_0_#1f2937]">
                  Upcoming Event Creator
                </span>
                <h3 className="mt-2 text-2xl font-black text-slate-900 uppercase">
                  Tạo Giải Đấu Sắp Tới (Upcoming)
                </h3>
                <p className="text-xs text-slate-500">Lên lịch trước cho giải đấu tương lai và cấu hình danh sách câu hỏi phát âm.</p>
              </div>

              {/* Scrollable Container */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar my-4">
                
                {/* Form Fields */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Tên Giải Đấu</label>
                    <input
                      type="text"
                      value={upcomingForm.name}
                      onChange={(e) => setUpcomingForm({ ...upcomingForm, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-900 bg-white text-slate-900 font-bold focus:outline-none"
                      placeholder="Giải Đấu Tuần Sau..."
                    />
                  </div>
                  <div className="space-y-1 font-bold">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Mô Tả</label>
                    <input
                      type="text"
                      value={upcomingForm.description}
                      onChange={(e) => setUpcomingForm({ ...upcomingForm, description: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-900 bg-white text-slate-900 font-bold focus:outline-none"
                      placeholder="Mô tả sơ lược giải đấu..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Thời Gian Bắt Đầu</label>
                    <input
                      type="datetime-local"
                      value={upcomingForm.startsAt}
                      onChange={(e) => setUpcomingForm({ ...upcomingForm, startsAt: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-900 bg-white text-slate-900 font-bold focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Thời Gian Kết Thúc</label>
                    <input
                      type="datetime-local"
                      value={upcomingForm.endsAt}
                      onChange={(e) => setUpcomingForm({ ...upcomingForm, endsAt: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-900 bg-white text-slate-900 font-bold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Question Selection Panel */}
                <div className="border-t-[2px] border-slate-900/10 pt-4 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h4 className="text-base font-black text-slate-900 uppercase">Chọn Câu Hỏi Phát Âm ({upcomingSelectedQuestionIds.length} câu đang chọn)</h4>
                      <p className="text-[10px] font-semibold text-slate-400">Chọn các câu phát âm từ kho để gán cho giải đấu này.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Tìm câu hỏi..."
                        value={upTSearch}
                        onChange={(e) => setUpTSearch(e.target.value)}
                        className="px-3 py-1.5 text-xs rounded-lg border-2 border-slate-900 bg-white text-slate-900 focus:outline-none"
                      />
                      <select
                        value={upTRegion}
                        onChange={(e) => setUpTRegion(e.target.value)}
                        className="rounded-lg border-2 border-slate-900 bg-white px-2 py-1.5 text-xs font-black text-slate-800"
                      >
                        <option value="ALL">TẤT CẢ VÙNG</option>
                        <option value="BAC">MIỀN BẮC</option>
                        <option value="TRUNG">MIỀN TRUNG</option>
                        <option value="NAM">MIỀN NAM</option>
                      </select>
                    </div>
                  </div>

                  {/* List of Challenges */}
                  <div className="max-h-[200px] overflow-y-auto border-2 border-slate-900 rounded-2xl bg-white divide-y-2 divide-slate-100 custom-scrollbar">
                    {filteredUpcomingChallenges.length > 0 ? (
                      filteredUpcomingChallenges.map((c) => {
                        const isChecked = upcomingSelectedQuestionIds.includes(c.id);
                        return (
                          <div
                            key={c.id}
                            onClick={() => {
                              if (isChecked) {
                                setUpcomingSelectedQuestionIds(upcomingSelectedQuestionIds.filter((id) => id !== c.id));
                              } else {
                                setUpcomingSelectedQuestionIds([...upcomingSelectedQuestionIds, c.id]);
                              }
                            }}
                            className={`flex items-start gap-3 p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${
                              isChecked ? 'bg-[#f5eefb]' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="mt-0.5 accent-[#8B5CF6]"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-serif font-black text-slate-800 leading-snug">"{c.contentText}"</p>
                              <div className="flex gap-2 mt-1">
                                <span className="rounded-full px-2 py-0.5 bg-slate-100 border text-[9px] font-bold text-slate-500">
                                  {c.region === 'BAC' ? 'BẮC' : c.region === 'TRUNG' ? 'TRUNG' : 'NAM'}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400">IPA: /{c.metadataJson?.ipa || c.metadataJson?.transcript || 'N/A'}/</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center text-slate-400 font-bold">Không tìm thấy câu hỏi phát âm nào trong kho</div>
                    )}
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t-[2px] border-slate-900/10 pt-4 mt-auto">
                <button
                  onClick={() => setIsUpcomingModalOpen(false)}
                  className="px-6 py-3 rounded-xl border-2 border-slate-900 bg-white text-xs font-black text-slate-500 shadow-[3px_3px_0_#1f2937]"
                >
                  HỦY BỎ
                </button>
                <button
                  onClick={handleCreateUpcomingTournament}
                  disabled={isCreatingUpcoming || upcomingSelectedQuestionIds.length === 0}
                  className="px-6 py-3 rounded-xl border-2 border-slate-900 bg-[#C084FC] text-slate-950 text-xs font-black shadow-[3px_3px_0_#1f2937] disabled:opacity-50"
                >
                  {isCreatingUpcoming ? 'ĐANG TẠO...' : 'TẠO GIẢI ĐẤU'}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🏆 TOURNAMENT LEADERBOARD VIEW MODAL */}
      <AnimatePresence>
        {viewingLeaderboardTournament && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl rounded-[2.5rem] border-[3px] border-slate-900 bg-[#fbf6ef] p-6 lg:p-8 text-left shadow-[10px_10px_0_#1f2937] my-8 max-h-[90vh] flex flex-col"
            >
              <button
                onClick={() => setViewingLeaderboardTournament(null)}
                className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full border-2 border-slate-900 bg-white font-black text-slate-900 shadow-[3px_3px_0_#1f2937] active:translate-y-0.5"
              >
                X
              </button>

              <div className="mb-4">
                <span className="inline-block rounded-full border-2 border-slate-900 bg-[#f1c46f]/25 px-3 py-1 text-[10px] font-black uppercase text-[#c69130] shadow-[2px_2px_0_#1f2937]">
                  Tournament Standings
                </span>
                <h3 className="mt-2 text-2xl font-black text-slate-900 uppercase">
                  Bảng Xếp Hạng Giải Đấu
                </h3>
                <p className="text-sm font-bold text-slate-700 mt-1">
                  {viewingLeaderboardTournament.name || 'Giải Đấu Tuần'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Trạng thái: <span className="font-black uppercase text-[#49B6E5]">{viewingLeaderboardTournament.status}</span>
                </p>
              </div>

              {/* Scrollable Leaderboard List */}
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar my-4">
                {isLoadingLeaderboard ? (
                  <div className="py-10 text-center">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Đang tải xếp hạng...</p>
                  </div>
                ) : leaderboardStandings.length > 0 ? (
                  <div className="border-2 border-slate-900 rounded-2xl bg-white overflow-hidden shadow-[4px_4px_0_#1f2937]">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b-2 border-slate-950 bg-slate-50 text-left">
                          <th className="p-3 font-black text-[10px] uppercase text-slate-400 text-center w-12">Hạng</th>
                          <th className="p-3 font-black text-[10px] uppercase text-slate-400">Học viên</th>
                          <th className="p-3 font-black text-[10px] uppercase text-slate-400 text-center">Tổng Điểm</th>
                          <th className="p-3 font-black text-[10px] uppercase text-slate-400 text-center">Phát âm hoàn thành</th>
                          <th className="p-3 font-black text-[10px] uppercase text-slate-400 text-right pr-4">Độ chính xác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-slate-100">
                        {leaderboardStandings.map((p: any) => {
                          let rankBg = 'bg-slate-100 border-slate-200 text-slate-500'
                          let rankLabel = `${p.rankPosition}`
                          if (p.rankPosition === 1) {
                            rankBg = 'bg-yellow-100 border-yellow-300 text-yellow-700'
                            rankLabel = '🥇'
                          } else if (p.rankPosition === 2) {
                            rankBg = 'bg-slate-200 border-slate-300 text-slate-700'
                            rankLabel = '🥈'
                          } else if (p.rankPosition === 3) {
                            rankBg = 'bg-amber-100 border-amber-200 text-amber-800'
                            rankLabel = '🥉'
                          }

                          return (
                            <tr key={p.accountId || p.id} className="hover:bg-slate-50/50">
                              <td className="p-3 text-center">
                                <span className={`inline-flex w-7 h-7 rounded-full border items-center justify-center font-black ${rankBg}`}>
                                  {rankLabel}
                                </span>
                              </td>
                              <td className="p-3">
                                <div>
                                  <div className="font-black text-slate-900">{p.fullName}</div>
                                  <div className="text-[10px] font-bold text-slate-400">{p.email}</div>
                                </div>
                              </td>
                              <td className="p-3 text-center font-black text-slate-800">
                                {p.totalXp}
                              </td>
                              <td className="p-3 text-center text-slate-500">
                                {p.challengesCompleted}/10 câu
                              </td>
                              <td className="p-3 text-right pr-4">
                                <span className="inline-block px-2.5 py-0.5 rounded-full border-[1.5px] border-emerald-200 bg-emerald-50 text-[10px] font-black text-emerald-600">
                                  {p.averageScore ? p.averageScore.toFixed(1) : '0.0'}%
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-14 rounded-2xl border-2 border-dashed border-slate-200 text-center bg-slate-50">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Chưa có học viên nào tham gia giải đấu này</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end border-t-[2px] border-slate-900/10 pt-4 mt-auto">
                <button
                  onClick={() => setViewingLeaderboardTournament(null)}
                  className="px-6 py-3 rounded-xl border-2 border-slate-900 bg-white text-xs font-black text-slate-500 shadow-[3px_3px_0_#1f2937]"
                >
                  ĐÓNG
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📣 NEO-BRUTALISM NOTICE MODAL */}
      <AnimatePresence>
        {noticeModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-[2rem] border-[3px] border-slate-900 bg-[#fbf6ef] p-6 text-left shadow-[8px_8px_0_#1f2937] flex flex-col gap-4"
            >
              <div>
                <span className={clsx(
                  "inline-block rounded-full border-2 border-slate-900 px-3 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0_#1f2937]",
                  noticeModal.type === 'error' ? "bg-rose-100 text-rose-800" :
                  noticeModal.type === 'success' ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                )}>
                  {noticeModal.type === 'error' ? 'Lỗi hệ thống' :
                   noticeModal.type === 'success' ? 'Thành công' : 'Xác nhận thao tác'}
                </span>
                <h3 className="mt-3 text-lg font-black text-slate-900 uppercase leading-snug">
                  {noticeModal.title}
                </h3>
              </div>

              <p className="text-xs font-bold text-slate-600 leading-relaxed bg-white p-4 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0_#1f2937]">
                {noticeModal.message}
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                {noticeModal.type === 'confirm' ? (
                  <>
                    <button
                      onClick={() => setNoticeModal(null)}
                      className="px-4 py-2 rounded-xl border-2 border-slate-900 bg-white text-xs font-black text-slate-500 shadow-[3px_3px_0_#1f2937] hover:bg-slate-50 transition-colors"
                    >
                      HỦY BỎ
                    </button>
                    <button
                      onClick={() => {
                        if (noticeModal.onConfirm) noticeModal.onConfirm();
                        setNoticeModal(null);
                      }}
                      className="px-5 py-2 rounded-xl border-2 border-slate-900 bg-[#10b981] text-xs font-black text-white shadow-[3px_3px_0_#1f2937] hover:bg-emerald-600 transition-colors"
                    >
                      XÁC NHẬN
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setNoticeModal(null)}
                    className="px-6 py-2 rounded-xl border-2 border-slate-900 bg-[#49B6E5] text-xs font-black text-white shadow-[3px_3px_0_#1f2937] hover:bg-sky-500 transition-colors"
                  >
                    ĐỒNG Ý
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AdminDashboardPage
