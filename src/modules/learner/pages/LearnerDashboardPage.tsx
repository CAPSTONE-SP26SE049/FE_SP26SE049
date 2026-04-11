import { useEffect, useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    PlayCircleFilled,
    RightOutlined,
    LockOutlined,
    TrophyOutlined,
} from '@ant-design/icons'
import { Spin } from 'antd'
import { useAuth } from '../../../core/auth/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Flame, Star, ArrowRight, BookOpen, Map, Trophy, Sparkles, Zap, Target, Volume2, Play, Pause, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
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

/* ─── Pronunciation 3D Card component ─────────────────── */
function Pronunciation3DCard() {
    const mvRef = useRef<any>(null)
    const [animations, setAnimations] = useState<string[]>([])
    const [activeAnim, setActiveAnim] = useState<string | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [modelLoaded, setModelLoaded] = useState(false)
    const autoPlayRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const handleLoad = useCallback(() => {
        const mv = mvRef.current
        if (!mv) return
        setTimeout(() => {
            const avail: string[] = mv.availableAnimations ?? []
            setAnimations(avail)
            if (avail.length > 0) {
                setActiveAnim(avail[0])
            }
            setModelLoaded(true)
        }, 300)
    }, [])

    const playAnimation = useCallback((name: string) => {
        const mv = mvRef.current
        if (!mv) return
        mv.setAttribute('animation-name', name)
        mv.setAttribute('autoplay', '')
        mv.play?.()
        setActiveAnim(name)
        setIsPlaying(true)
    }, [])

    const pauseAnimation = useCallback(() => {
        const mv = mvRef.current
        if (!mv) return
        mv.pause?.()
        setIsPlaying(false)
    }, [])

    const resumeAnimation = useCallback(() => {
        const mv = mvRef.current
        if (!mv || !activeAnim) return
        mv.play?.()
        setIsPlaying(true)
    }, [activeAnim])

    const handleSelectAnim = useCallback((name: string) => {
        if (autoPlayRef.current) clearTimeout(autoPlayRef.current)
        playAnimation(name)
    }, [playAnimation])

    const handlePrev = useCallback(() => {
        if (!animations.length || !activeAnim) return
        const idx = animations.indexOf(activeAnim)
        const prev = animations[(idx - 1 + animations.length) % animations.length]
        handleSelectAnim(prev)
    }, [animations, activeAnim, handleSelectAnim])

    const handleNext = useCallback(() => {
        if (!animations.length || !activeAnim) return
        const idx = animations.indexOf(activeAnim)
        const next = animations[(idx + 1) % animations.length]
        handleSelectAnim(next)
    }, [animations, activeAnim, handleSelectAnim])

    const handleReset = useCallback(() => {
        const mv = mvRef.current
        if (!mv) return
        mv.pause?.()
        mv.currentTime = 0
        setIsPlaying(false)
    }, [])

    // Auto-play first animation once loaded
    useEffect(() => {
        if (modelLoaded && animations.length > 0 && activeAnim) {
            autoPlayRef.current = setTimeout(() => playAnimation(activeAnim), 500)
        }
        return () => { if (autoPlayRef.current) clearTimeout(autoPlayRef.current) }
    }, [modelLoaded])

    const animLabel = (raw: string) => {
        // Clean up animation name for display
        return raw.replace(/_/g, ' ').replace(/\bAnim\b/gi, '').trim() || raw
    }

    const activeIdx = activeAnim ? animations.indexOf(activeAnim) : -1

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-white rounded-3xl border border-gray-100 overflow-hidden"
            style={{ boxShadow: '0 8px 32px rgba(147,51,234,0.10)' }}
        >
            {/* Top accent */}
            <div className="h-1 w-full bg-gradient-to-r from-purple-500 via-fuchsia-400 to-orange-400" />

            {/* Header */}
            <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
                <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-fuchsia-400 rounded-full" />
                    <Volume2 size={14} className="text-purple-500" />
                    Mô hình phát âm 3D
                </h3>
                <div className="flex items-center gap-2">
                    {modelLoaded && animations.length > 0 && (
                        <span className="text-[10px] bg-purple-50 text-purple-500 px-2 py-0.5 rounded-full font-black border border-purple-100">
                            {animations.length} âm
                        </span>
                    )}
                    {modelLoaded && activeAnim && (
                        <span className="text-[10px] bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full font-black border border-orange-100 max-w-[120px] truncate">
                            {animLabel(activeAnim)}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-0">
                {/* 3D Viewer */}
                <div className="relative bg-gray-950 overflow-hidden flex-1" style={{ minHeight: 280, maxHeight: 340 }}>
                    {/* Ambient glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-600/15 rounded-full blur-[80px] pointer-events-none" />

                    <model-viewer
                        ref={(el: any) => {
                            if (el && el !== mvRef.current) {
                                mvRef.current = el
                                el.addEventListener('load', handleLoad)
                                el.addEventListener('finished', () => setIsPlaying(false))
                            }
                        }}
                        src="/3D/Pronunciation.glb"
                        alt="Mô hình 3D phát âm tiếng Việt"
                        camera-controls
                        shadow-intensity="1"
                        exposure="1.5"
                        camera-orbit="0deg 80deg auto"
                        field-of-view="35deg"
                        interaction-prompt="none"
                        animation-crossfade-duration="0.3"
                        style={{
                            width: '100%',
                            height: '100%',
                            minHeight: '280px',
                            outline: 'none',
                            '--poster-color': 'transparent',
                        } as React.CSSProperties}
                    />

                    {/* Loading overlay */}
                    {!modelLoaded && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/95 backdrop-blur-sm z-20">
                            <Spin size="large" />
                            <p className="mt-3 text-gray-500 text-[10px] font-black uppercase tracking-widest">Đang tải mô hình 3D...</p>
                        </div>
                    )}

                    {/* Playback controls overlay */}
                    {modelLoaded && (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full border border-white/10">
                            <button onClick={handlePrev} className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-white transition-colors">
                                <ChevronLeft size={13} />
                            </button>
                            <button
                                onClick={isPlaying ? pauseAnimation : resumeAnimation}
                                disabled={!activeAnim}
                                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all"
                            >
                                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                            </button>
                            <button onClick={handleReset} className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-white transition-colors">
                                <RotateCcw size={11} />
                            </button>
                            <button onClick={handleNext} className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-white transition-colors">
                                <ChevronRight size={13} />
                            </button>
                            <span className="text-white/40 text-[9px] font-bold ml-1 uppercase tracking-wider">Kéo để xoay</span>
                        </div>
                    )}
                </div>

                {/* Animation selector panel */}
                {modelLoaded && animations.length > 0 && (
                    <div className="lg:w-52 xl:w-60 border-t lg:border-t-0 lg:border-l border-gray-100 p-3 flex flex-col gap-2 bg-gray-50/50">
                        <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest px-1 mb-1">Chọn cặp âm</p>
                        <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-y-auto lg:max-h-[260px] pb-1 scrollbar-thin">
                            {animations.map((anim, i) => (
                                <motion.button
                                    key={anim}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    onClick={() => handleSelectAnim(anim)}
                                    className={`flex-shrink-0 lg:flex-shrink text-left px-3 py-2 rounded-xl text-xs font-black transition-all border flex items-center gap-2 min-w-[90px] lg:min-w-0 ${activeAnim === anim
                                        ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/20'
                                        : 'bg-white text-gray-600 border-gray-100 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] flex-shrink-0 ${activeAnim === anim ? 'bg-white/20' : 'bg-purple-50'}`}>
                                        <span className={activeAnim === anim ? 'text-white' : 'text-purple-500'}>
                                            {i + 1}
                                        </span>
                                    </div>
                                    <span className="truncate">{animLabel(anim)}</span>
                                    {activeAnim === anim && isPlaying && (
                                        <span className="ml-auto flex-shrink-0">
                                            <span className="inline-flex gap-0.5">
                                                {[0, 1, 2].map(j => (
                                                    <span key={j} className="block w-0.5 bg-white/80 rounded-full animate-pulse"
                                                        style={{ height: 8 + (j % 2) * 4, animationDelay: `${j * 0.15}s` }} />
                                                ))}
                                            </span>
                                        </span>
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer hint */}
            {modelLoaded && (
                <div className="px-5 py-2.5 border-t border-gray-50 flex items-center justify-between">
                    <p className="text-[10px] text-gray-400 font-medium">
                        {activeAnim
                            ? <>Đang xem: <strong className="text-purple-500">{animLabel(activeAnim)}</strong> — {activeIdx + 1}/{animations.length}</>
                            : 'Chọn một cặp âm để xem mô phỏng'
                        }
                    </p>
                    <button
                        onClick={() => { }}
                        className="text-[10px] text-purple-500 font-black hover:text-purple-700 transition-colors flex items-center gap-1"
                    >
                        Chi tiết <RightOutlined style={{ fontSize: 8 }} />
                    </button>
                </div>
            )}
        </motion.div>
    )
}

/* ─── Main Dashboard ───────────────────────────────────── */
export default function Dashboard() {
    const { session, updateSessionItem } = useAuth()
    const navigate = useNavigate()
    const user = session?.user

    const [completedLessons, setCompletedLessons] = useState<number>(0)
    const [currentLesson, setCurrentLesson] = useState<any>({
        title: 'Lộ trình của bạn',
        description: 'Bài học • Màn 1',
        progress: 0,
        id: null,
        locked: false
    })
    const [recentBadges, setRecentBadges] = useState<any[]>([])
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
                setRecentBadges(Array.isArray(list) ? list.slice(0, 6) : [])
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
                const completed = levels.filter((l: any) => l.isCompleted).length
                setCompletedLessons(completed)

                const active = levels.find((l: any) => !l.isCompleted && !l.isLocked)
                if (active) {
                    setCurrentLesson({
                        title: active.name,
                        description: `Bài học • Màn ${active.levelOrder || 1}`,
                        progress: active.starsEarned ? Math.round((active.starsEarned / 3) * 100) : 0,
                        id: active.id,
                        locked: false
                    })
                } else if (levels.length > 0) {
                    setCurrentLesson({
                        title: 'Đã hoàn thành lộ trình!',
                        description: 'Tuyệt vời, bạn đã vượt qua tất cả!',
                        progress: 100,
                        id: null,
                        locked: false
                    })
                }
            } catch { }
            finally { setLessonLoading(false) }
        }
        if (user) loadLesson()
        else setLessonLoading(false)
    }, [user?.id])

    const streak = (user as any)?.currentStreakDays ?? (user as any)?.streak ?? 0
    const totalStars = user?.totalStars ?? 0
    const firstName = user?.fullName?.split(' ').slice(-1)[0] || 'Học viên'

    return (
        <div className="flex flex-col w-full pb-12">

            {/* ══════ HERO BANNER ══════ */}
            <div
                className="flex-shrink-0 relative overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, #1e1145 0%, #3b1d8e 35%, #7c3aed 65%, #f97316 100%)',
                }}
            >
                {/* Decorative elements */}
                {[...Array(12)].map((_, i) => (
                    <motion.div key={i}
                        className="absolute rounded-full"
                        style={{
                            width: 3 + (i % 3) * 2, height: 3 + (i % 3) * 2,
                            background: `rgba(255,255,255,${0.08 + (i % 4) * 0.06})`,
                            left: `${(i * 8.3) % 100}%`, top: `${15 + (i * 17) % 70}%`,
                        }}
                        animate={{ y: [-4, 4, -4], opacity: [0.3, 0.8, 0.3] }}
                        transition={{ duration: 2 + i * 0.4, repeat: Infinity }}
                    />
                ))}

                <div className="max-w-6xl mx-auto relative px-6 py-8 flex flex-col md:flex-row md:items-center gap-6">
                    {/* Mascot */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, x: -20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ type: 'spring', bounce: 0.5 }}
                        className="hidden md:block w-28 h-28 lg:w-32 lg:h-32 flex-shrink-0"
                    >
                        <img src="/dashboard-mascot.png" alt="SpeakVN Mascot" className="w-full h-full object-contain drop-shadow-2xl" />
                    </motion.div>
                    {/* Left: Welcome */}
                    <div className="flex-1 min-w-0">
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles size={14} className="text-orange-300" />
                                <span className="text-orange-200/80 text-[10px] font-black uppercase tracking-[0.2em]">Chào mừng trở lại</span>
                            </div>
                            <h1 className="text-2xl font-black text-white leading-tight">
                                {firstName} <span className="text-2xl">👋</span>
                            </h1>
                            <p className="text-white/40 text-xs font-medium mt-1">Hôm nay bạn muốn chinh phục điều gì?</p>
                        </motion.div>
                    </div>

                    {/* Right: Stat pills */}
                    <div className="flex flex-wrap md:flex-nowrap items-center justify-end gap-3 flex-shrink-0">
                        {[
                            { icon: <Flame fill="currentColor" strokeWidth={1.5} size={20} className="text-orange-400" />, val: streak, glow: 'rgba(249,115,22,0.2)' },
                            { icon: <Star fill="currentColor" strokeWidth={1.5} size={20} className="text-yellow-400" />, val: totalStars, glow: 'rgba(234,179,8,0.2)' },
                            { icon: <BookOpen fill="currentColor" strokeWidth={1.5} size={20} className="text-purple-300" />, val: completedLessons, glow: 'rgba(168,85,247,0.2)' },
                            { icon: <Trophy fill="currentColor" strokeWidth={1.5} size={20} className="text-rose-400" />, val: recentBadges.length, glow: 'rgba(244,63,94,0.2)' },
                        ].map((s, i) => (
                            <motion.div key={i}
                                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.15 + i * 0.05, type: 'spring', bounce: 0.4 }}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 transition-all cursor-default overflow-hidden relative group"
                                style={{ boxShadow: `0 8px 24px ${s.glow}` }}
                            >
                                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                                <div className="relative drop-shadow-[0_0_12px_currentColor]">
                                    {s.icon}
                                </div>
                                <span className="relative text-white font-black text-[16px] drop-shadow-md">{s.val}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ══════ BODY ══════ */}
            <div className="flex-1 bg-[#f8f5ff]">
                <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

                    {/* Main Layout Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* ── LEFT COLUMN: Lesson Card & Badges ── */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Lesson Card */}
                            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full"
                                    style={{ boxShadow: '0 4px 20px rgba(147,51,234,0.06)' }}>
                                    <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
                                        <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
                                            <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-orange-400 rounded-full" />
                                            Tiếp tục bài học
                                        </h3>
                                        <button onClick={() => navigate('/learner/roadmap')}
                                            className="text-purple-500 font-bold text-[11px] uppercase tracking-wider hover:text-purple-700 flex items-center gap-1 transition-colors">
                                            Xem tất cả <RightOutlined style={{ fontSize: 9 }} />
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        {lessonLoading ? (
                                            <div className="bg-gray-100 rounded-xl h-24 animate-pulse" />
                                        ) : (
                                            <div
                                                className={`relative bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 rounded-xl p-5 text-white cursor-pointer group overflow-hidden hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 ${currentLesson.locked ? 'opacity-60 grayscale' : ''}`}
                                                onClick={() => !currentLesson.locked && navigate('/learner/roadmap')}
                                            >
                                                <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/8 to-transparent group-hover:left-full transition-all duration-1000" />
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/15 flex-shrink-0 group-hover:rotate-6 transition-transform">
                                                        {currentLesson.locked
                                                            ? <LockOutlined className="text-lg text-white/50" />
                                                            : <PlayCircleFilled className="text-2xl text-white" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-purple-200/70 text-[10px] font-bold uppercase tracking-widest mb-0.5">{currentLesson.description}</div>
                                                        <h4 className="text-base font-black text-white leading-tight">{currentLesson.title}</h4>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <div className="flex-1 h-1.5 bg-white/15 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }} animate={{ width: `${currentLesson.progress}%` }}
                                                                    transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                                                                    className="h-full bg-gradient-to-r from-orange-400 to-yellow-300 rounded-full"
                                                                />
                                                            </div>
                                                            <span className="text-white/80 font-black text-xs">{currentLesson.progress}%</span>
                                                        </div>
                                                    </div>
                                                    <ArrowRight size={18} className="text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            {/* ── Badges Section ── */}
                            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm"
                                    style={{ boxShadow: '0 4px 20px rgba(147,51,234,0.06)' }}>
                                    <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
                                        <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
                                            <div className="w-1 h-4 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full" />
                                            Huy hiệu đạt được
                                        </h3>
                                        <button onClick={() => navigate('/learner/profile')}
                                            className="text-orange-500 font-bold text-[11px] uppercase tracking-wider hover:text-orange-700 flex items-center gap-1 transition-colors">
                                            Xem tất cả <RightOutlined style={{ fontSize: 9 }} />
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        {badgesLoading ? (
                                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                                                {[...Array(5)].map((_, i) => (
                                                    <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                                                ))}
                                            </div>
                                        ) : recentBadges.length > 0 ? (
                                            <div className="grid grid-cols-4 gap-3">
                                                {recentBadges.map((b, i) => {
                                                    const bData = b?.badge ?? b
                                                    const imgUrl = bData?.iconUrl || bData?.imageUrl || bData?.icon_url
                                                    return (
                                                        <motion.div key={b.id || i} whileHover={{ y: -3, scale: 1.04 }}
                                                            className="flex flex-col items-center p-3 rounded-xl text-center group cursor-default"
                                                            style={{ background: 'linear-gradient(135deg,#fefce8,#fef3c7)', border: '1px solid #fde68a' }}>
                                                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-400/20 to-orange-400/20 border border-yellow-200 flex items-center justify-center mb-1.5 group-hover:rotate-12 transition-transform overflow-hidden">
                                                                {imgUrl
                                                                    ? <img src={imgUrl} alt={bData?.name} className="w-7 h-7 object-contain" />
                                                                    : <TrophyOutlined className="text-yellow-500 text-sm" />}
                                                            </div>
                                                            <div className="text-[9px] font-black text-gray-600 leading-tight line-clamp-2">{bData?.name || 'Huy hiệu'}</div>
                                                        </motion.div>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-4 py-3 px-2">
                                                <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center border border-yellow-100 flex-shrink-0">
                                                    <TrophyOutlined className="text-xl text-yellow-300" />
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

                        {/* ── RIGHT COLUMN: Quick Actions & Extras ── */}
                        <div className="lg:col-span-1 space-y-6">

                            {/* Quick Actions */}
                            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-full"
                                    style={{ boxShadow: '0 4px 20px rgba(147,51,234,0.06)' }}>
                                    <div className="px-5 py-3 border-b border-gray-50">
                                        <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
                                            <div className="w-1 h-4 bg-gradient-to-b from-orange-400 to-pink-500 rounded-full" />
                                            Truy cập nhanh
                                        </h3>
                                    </div>
                                    <div className="p-4 grid grid-cols-2 gap-2">
                                        {[
                                            { icon: Map, label: 'Lộ trình', desc: 'Bản đồ', path: '/learner/roadmap', c: '#7c3aed', bg: '#f5f3ff', border: '#ede9fe' },
                                            { icon: Trophy, label: 'Xếp hạng', desc: 'Thứ hạng', path: '/learner/leaderboard', c: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
                                            { icon: Zap, label: 'Phát âm', desc: 'Luyện tập', path: '/learner/pronunciation', c: '#06b6d4', bg: '#ecfeff', border: '#a5f3fc' },
                                            { icon: Target, label: 'Bạn bè', desc: 'Kết nối', path: '/learner/friends', c: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
                                        ].map(({ icon: Icon, label, desc, path, c, bg, border }, i) => (
                                            <motion.button key={i}
                                                whileHover={{ y: -2 }}
                                                onClick={() => navigate(path)}
                                                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all hover:shadow-md group"
                                                style={{ background: bg, borderColor: border }}
                                            >
                                                <div className="w-9 h-9 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"
                                                    style={{ background: `${c}18` }}>
                                                    <Icon size={16} style={{ color: c }} />
                                                </div>
                                                <span className="text-[11px] font-black" style={{ color: c }}>{label}</span>
                                                <span className="text-[9px] text-gray-400 font-medium">{desc}</span>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Decorative Motivational Card */}
                            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                                <div className="bg-gradient-to-br from-indigo-700 via-purple-700 to-fuchsia-700 rounded-2xl p-5 text-white border border-purple-400/30 shadow-lg shadow-purple-500/20 relative overflow-hidden group hover:shadow-purple-500/30 transition-all min-h-[170px] flex flex-col justify-end">

                                    {/* Generated Background Image */}
                                    <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl">
                                        <img src="/daily_goal_card.png" alt="Goal Illustration" className="w-full h-full object-cover opacity-50 group-hover:opacity-60 group-hover:scale-110 transition-all duration-700 mix-blend-screen" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/95 via-purple-800/40 to-transparent" />
                                    </div>

                                    <div className="relative z-10 w-full">
                                        <h3 className="font-black text-lg mb-1 leading-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">Mục tiêu hôm nay</h3>
                                        <p className="text-white/95 text-[11px] mb-4 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] font-semibold leading-relaxed">Hoàn thành bài học mới để không làm tắt ngọn lửa nhiệt huyết nhé!</p>

                                        <button
                                            onClick={() => navigate('/learner/roadmap')}
                                            className="w-full py-2.5 rounded-xl bg-white/95 backdrop-blur-md text-purple-700 font-extrabold text-[11px] uppercase tracking-wider hover:bg-white hover:text-orange-600 hover:-translate-y-0.5 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.3)] focus:outline-none"
                                        >
                                            Chơi ngay 🚀
                                        </button>
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
