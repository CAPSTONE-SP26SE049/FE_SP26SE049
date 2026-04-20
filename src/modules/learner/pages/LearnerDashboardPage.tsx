import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
    PlayCircleFilled,
    RightOutlined,
    LockOutlined,
    TrophyOutlined,
} from '@ant-design/icons'

import { useAuth } from '../../../core/auth/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight, Map, Trophy, Zap, Target, ChevronLeft, ChevronRight } from 'lucide-react'
import apiClient from '../../../services/apiClient'
import { learnerService } from '../services/learnerService'
import '@google/model-viewer'

/* ─── model-viewer JSX type ───────────────────────────── */
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement> & {
                    src?: string
                    alt?: string
                    'camera-controls'?: boolean | string
                    'auto-rotate'?: boolean | string
                    'shadow-intensity'?: string
                    exposure?: string
                    'camera-orbit'?: string
                    'field-of-view'?: string
                    'interaction-prompt'?: string
                    'animation-name'?: string
                    autoplay?: boolean | string
                    'animation-crossfade-duration'?: string
                    loading?: string
                    style?: React.CSSProperties
                },
                HTMLElement
            >
        }
    }
}


/* ─── Main Dashboard ───────────────────────────────────── */
export default function Dashboard() {
    const { session, updateSessionItem } = useAuth()
    const navigate = useNavigate()
    const user = session?.user

    const [currentLesson, setCurrentLesson] = useState<any>({
        title: 'Lộ trình của bạn',
        description: 'Bài học • Màn 1',
        progress: 0,
        id: null,
        dialectId: null,
        locked: false
    })
    const [allBadges, setAllBadges] = useState<any[]>([])
    const [badgePage, setBadgePage] = useState(0)
    const BADGES_PER_PAGE = 8

    const [lessonLoading, setLessonLoading] = useState(true)
    const [badgesLoading, setBadgesLoading] = useState(true)

    const badgesFetched = useRef(false)
    const lessonFetched = useRef(false)

    useEffect(() => {
        if (badgesFetched.current) return
        badgesFetched.current = true
        apiClient.get('/learner/my-badges')
            .then((res: any) => {
                const list = res?.data?.data ?? res?.data ?? res ?? []
                setAllBadges(Array.isArray(list) ? list : [])
            })
            .catch(() => { })
            .finally(() => setBadgesLoading(false))
    }, [])

    useEffect(() => {
        if (lessonFetched.current) return
        lessonFetched.current = true

        const loadLesson = async () => {
            try {
                apiClient.get('/users/me').then((res: any) => {
                    const data = res?.data?.data ?? res?.data;
                    if (data && updateSessionItem) {
                        updateSessionItem({
                            totalStars: data.totalStars ?? data.totalStar ?? 0,
                            streak: data.streak ?? data.currentStreakDays ?? 0,
                            totalExperience: data.totalXp ?? data.totalExperience ?? 0,
                        });
                    }
                }).catch(() => { });

                const dialects = await learnerService.getDialects().catch(() => [])
                if (!dialects.length) { setLessonLoading(false); return }

                const userRegion = (user?.region || 'SOUTH').toUpperCase()
                const dialect = dialects.find((d: any) => {
                    const n = d.name?.toUpperCase() ?? ''
                    if (userRegion === 'NORTH') return n.includes('BẮC') || n === 'NORTH'
                    if (userRegion === 'CENTRAL') return n.includes('TRUNG') || n === 'CENTRAL'
                    return n.includes('NAM') || n === 'SOUTH'
                }) ?? dialects[0]

                if (!dialect) { setLessonLoading(false); return }

                const levels = await learnerService.getLevels(dialect.id).catch(() => [])
                const active = levels.find((l: any) => !l.isCompleted && !l.isLocked)
                if (active) {
                    setCurrentLesson({
                        title: active.name,
                        description: `Bài học • Màn ${active.levelOrder || 1}`,
                        progress: active.starsEarned ? Math.round((active.starsEarned / 3) * 100) : 0,
                        id: active.id,
                        dialectId: dialect.id,
                        locked: false
                    })
                } else if (levels.length > 0) {
                    setCurrentLesson({
                        title: 'Đã hoàn thành lộ trình!',
                        description: 'Tuyệt vời, bạn đã vượt qua tất cả!',
                        progress: 100,
                        id: levels[levels.length - 1].id,
                        dialectId: dialect.id,
                        locked: false
                    })
                }
            } catch { }
            finally { setLessonLoading(false) }
        }
        if (user) loadLesson()
        else setLessonLoading(false)
    }, [user?.id, updateSessionItem])

    const firstName = user?.fullName?.split(' ').slice(-1)[0] || 'Học viên'

    const totalBadgePages = Math.ceil(allBadges.length / BADGES_PER_PAGE)
    const currentBadges = allBadges.slice(badgePage * BADGES_PER_PAGE, (badgePage + 1) * BADGES_PER_PAGE)

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto flex flex-col w-full h-[calc(100vh-80px)] min-h-0">
            {/* ══════ HERO BANNER ══════ */}
            <div
                className="flex-shrink-0 relative overflow-hidden rounded-[2.5rem] mb-6"
                style={{
                    background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #f97316 100%)',
                    boxShadow: '0 8px 32px rgba(124,58,237,0.15)'
                }}
            >
                {[...Array(6)].map((_, i) => (
                    <motion.div key={i}
                        className="absolute rounded-full pointer-events-none"
                        style={{
                            width: 3 + (i % 3) * 2, height: 3 + (i % 3) * 2,
                            background: `rgba(255,255,255,${0.1 + (i % 4) * 0.08})`,
                            left: `${(i * 15) % 100}%`, top: `${10 + (i * 15) % 80}%`,
                        }}
                        animate={{ y: [-5, 5, -5], opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 3 + i * 0.5, repeat: Infinity }}
                    />
                ))}

                <div className="relative px-8 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        {/* Mascot */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', bounce: 0.5 }}
                            className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20 flex-shrink-0"
                        >
                            <img src="/dashboard-mascot.png" alt="Mascot" className="w-full h-full object-contain" />
                        </motion.div>

                        {/* Welcome text */}
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles size={14} className="text-orange-300" />
                                <span className="text-orange-100 text-xs font-black uppercase tracking-widest opacity-80">Tiếp tục hành trình</span>
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tight">
                                Chào buổi tốt, {firstName}! <span>✨</span>
                            </h1>
                            <p className="text-white/70 text-sm font-medium mt-1">Hôm nay bạn đã sẵn sàng phá vỡ rào cản ngôn ngữ chưa?</p>
                        </div>
                    </div>

                    <div className="hidden lg:block">
                        <button
                            onClick={() => navigate('/learner/roadmap')}
                            className="bg-white text-purple-600 px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-black/10 hover:scale-105 transition-transform"
                        >
                            Học ngay thôi! 🚀
                        </button>
                    </div>
                </div>
            </div>

            {/* ══════ BODY – flex-1 để lấp đầy chiều cao còn lại ══════ */}
            <div className="flex-1 min-h-0 bg-[#f8f5ff] overflow-hidden">
                <div className="h-full max-w-6xl mx-auto px-6 py-4 flex flex-col">

                    {/* Main Layout Grid – flex-1 giãn đều */}
                    <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4">

                        {/* ── LEFT COLUMN ── */}
                        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">

                            {/* Lesson Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="flex-shrink-0"
                            >
                                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                                    style={{ boxShadow: '0 4px 20px rgba(147,51,234,0.06)' }}>
                                    <div className="px-4 py-2.5 border-b border-gray-50 flex items-center justify-between">
                                        <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
                                            <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-orange-400 rounded-full" />
                                            Tiếp tục bài học
                                        </h3>
                                        <button onClick={() => navigate('/learner/roadmap')}
                                            className="text-purple-500 font-bold text-[11px] uppercase tracking-wider hover:text-purple-700 flex items-center gap-1 transition-colors">
                                            Xem tất cả <RightOutlined style={{ fontSize: 9 }} />
                                        </button>
                                    </div>
                                    <div className="p-3">
                                        {lessonLoading ? (
                                            <div className="bg-gray-100 rounded-xl h-16 animate-pulse" />
                                        ) : (
                                            <div
                                                className={`relative bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 rounded-xl px-4 py-3.5 text-white cursor-pointer group overflow-hidden hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 ${currentLesson.locked ? 'opacity-60 grayscale' : ''}`}
                                                onClick={() => !currentLesson.locked && navigate('/learner/roadmap', { state: { fromRoadmap: true, dialectId: currentLesson.dialectId, chapterId: currentLesson.id } })}
                                            >
                                                <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/8 to-transparent group-hover:left-full transition-all duration-1000" />
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/15 flex-shrink-0 group-hover:rotate-6 transition-transform">
                                                        {currentLesson.locked
                                                            ? <LockOutlined className="text-base text-white/50" />
                                                            : <PlayCircleFilled className="text-xl text-white" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-purple-200/70 text-[9px] font-bold uppercase tracking-widest mb-0.5">{currentLesson.description}</div>
                                                        <h4 className="text-sm font-black text-white leading-tight">{currentLesson.title}</h4>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <div className="flex-1 h-1 bg-white/15 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }} animate={{ width: `${currentLesson.progress}%` }}
                                                                    transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                                                                    className="h-full bg-gradient-to-r from-orange-400 to-yellow-300 rounded-full"
                                                                />
                                                            </div>
                                                            <span className="text-white/80 font-black text-xs">{currentLesson.progress}%</span>
                                                        </div>
                                                    </div>
                                                    <ArrowRight size={16} className="text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            {/* ── Badges Section – flex-1 lấp đầy không gian còn lại ── */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="flex-1 min-h-0 flex flex-col"
                            >
                                <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-100"
                                    style={{ boxShadow: '0 4px 20px rgba(147,51,234,0.06)' }}>
                                    <div className="px-4 py-2.5 border-b border-gray-50 flex items-center justify-between flex-shrink-0">
                                        <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
                                            <div className="w-1 h-4 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full" />
                                            Huy hiệu đạt được
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            {totalBadgePages > 1 && (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => setBadgePage(p => Math.max(0, p - 1))}
                                                        disabled={badgePage === 0}
                                                        className="w-5 h-5 flex items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:text-purple-600 hover:border-purple-200 disabled:opacity-30 transition-colors"
                                                    >
                                                        <ChevronLeft size={12} />
                                                    </button>
                                                    <span className="text-[10px] font-black text-gray-400">{badgePage + 1}/{totalBadgePages}</span>
                                                    <button
                                                        onClick={() => setBadgePage(p => Math.min(totalBadgePages - 1, p + 1))}
                                                        disabled={badgePage === totalBadgePages - 1}
                                                        className="w-5 h-5 flex items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:text-purple-600 hover:border-purple-200 disabled:opacity-30 transition-colors"
                                                    >
                                                        <ChevronRight size={12} />
                                                    </button>
                                                </div>
                                            )}
                                            <button onClick={() => navigate('/learner/profile')}
                                                className="text-orange-500 font-bold text-[11px] uppercase tracking-wider hover:text-orange-700 flex items-center gap-1 transition-colors">
                                                Xem tất cả <RightOutlined style={{ fontSize: 9 }} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-h-0 p-3 overflow-hidden">
                                        {badgesLoading ? (
                                            <div className="grid grid-cols-4 gap-2">
                                                {[...Array(8)].map((_, i) => (
                                                    <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                                                ))}
                                            </div>
                                        ) : allBadges.length > 0 ? (
                                            <div className="grid grid-cols-4 gap-2">
                                                {currentBadges.map((b, i) => {
                                                    const bData = b?.badge ?? b
                                                    const imgUrl = bData?.iconUrl || bData?.imageUrl || bData?.icon_url
                                                    return (
                                                        <motion.div key={b.id || i} whileHover={{ y: -2, scale: 1.04 }}
                                                            className="flex flex-col items-center p-2.5 rounded-xl text-center group cursor-default"
                                                            style={{ background: 'linear-gradient(135deg,#fefce8,#fef3c7)', border: '1px solid #fde68a' }}>
                                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400/20 to-orange-400/20 border border-yellow-200 flex items-center justify-center mb-1 group-hover:rotate-12 transition-transform overflow-hidden">
                                                                {imgUrl
                                                                    ? <img src={imgUrl} alt={bData?.name} className="w-6 h-6 object-contain" />
                                                                    : <TrophyOutlined className="text-yellow-500 text-xs" />}
                                                            </div>
                                                            <div className="text-[8px] font-black text-gray-600 leading-tight line-clamp-2">{bData?.name || 'Huy hiệu'}</div>
                                                        </motion.div>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 py-2 px-2">
                                                <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center border border-yellow-100 flex-shrink-0">
                                                    <TrophyOutlined className="text-lg text-yellow-300" />
                                                </div>
                                                <div>
                                                    <div className="text-gray-500 font-bold text-sm">Chưa có huy hiệu</div>
                                                    <p className="text-gray-400 text-xs mt-0.5">Tiếp tục học để mở khóa danh hiệu đầu tiên!</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                        </div>

                        {/* ── RIGHT COLUMN ── */}
                        <div className="lg:col-span-1 flex flex-col gap-4 min-h-0">

                            {/* Mục tiêu hôm nay – flex-shrink-0 */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="flex-shrink-0"
                            >
                                <div className="bg-gradient-to-br from-indigo-700 via-purple-700 to-fuchsia-700 rounded-2xl p-4 text-white border border-purple-400/30 shadow-lg shadow-purple-500/20 relative overflow-hidden group hover:shadow-purple-500/30 transition-all flex flex-col justify-end"
                                    style={{ minHeight: 150 }}>
                                    <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl">
                                        <img src="/daily_goal_card.png" alt="Goal Illustration" className="w-full h-full object-cover opacity-50 group-hover:opacity-60 group-hover:scale-110 transition-all duration-700 mix-blend-screen" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/95 via-purple-800/40 to-transparent" />
                                    </div>
                                    <div className="relative z-10 w-full">
                                        <h3 className="font-black text-base mb-0.5 leading-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">Mục tiêu hôm nay</h3>
                                        <p className="text-white/95 text-[10px] mb-3 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] font-semibold leading-relaxed">Hoàn thành bài học mới để không làm tắt ngọn lửa nhiệt huyết nhé!</p>
                                        <button
                                            onClick={() => navigate('/learner/roadmap')}
                                            className="w-full py-2 rounded-xl bg-white/95 backdrop-blur-md text-purple-700 font-extrabold text-[11px] uppercase tracking-wider hover:bg-white hover:text-orange-600 hover:-translate-y-0.5 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.3)] focus:outline-none"
                                        >
                                            Chơi ngay 🚀
                                        </button>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Truy cập nhanh – flex-1 lấp đầy */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex-1 min-h-0 flex flex-col"
                            >
                                <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-100"
                                    style={{ boxShadow: '0 4px 20px rgba(147,51,234,0.06)' }}>
                                    <div className="px-4 py-2.5 border-b border-gray-50 flex-shrink-0">
                                        <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
                                            <div className="w-1 h-4 bg-gradient-to-b from-orange-400 to-pink-500 rounded-full" />
                                            Truy cập nhanh
                                        </h3>
                                    </div>
                                    <div className="flex-1 min-h-0 p-3 grid grid-cols-2 gap-2 content-center">
                                        {[
                                            { icon: Map, label: 'Lộ trình', desc: 'Bản đồ', path: '/learner/roadmap', c: '#7c3aed', bg: '#f5f3ff', border: '#ede9fe' },
                                            { icon: Trophy, label: 'Xếp hạng', desc: 'Thứ hạng', path: '/learner/leaderboard', c: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
                                            { icon: Zap, label: 'Phát âm', desc: 'Luyện tập', path: '/learner/pronunciation', c: '#06b6d4', bg: '#ecfeff', border: '#a5f3fc' },
                                            { icon: Target, label: 'Bạn bè', desc: 'Kết nối', path: '/learner/friends', c: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
                                        ].map(({ icon: Icon, label, desc, path, c, bg, border }, i) => (
                                            <motion.button key={i}
                                                whileHover={{ y: -2 }}
                                                onClick={() => navigate(path)}
                                                className="flex flex-col items-center gap-1 p-3 rounded-xl border transition-all hover:shadow-md group"
                                                style={{ background: bg, borderColor: border }}
                                            >
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"
                                                    style={{ background: `${c}18` }}>
                                                    <Icon size={15} style={{ color: c }} />
                                                </div>
                                                <span className="text-[11px] font-black" style={{ color: c }}>{label}</span>
                                                <span className="text-[9px] text-gray-400 font-medium">{desc}</span>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
