import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { LockOutlined, PlayCircleFilled, RightOutlined, TrophyOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight, Leaf, Map, Target, Trophy, Zap } from 'lucide-react'

import { useAuth } from '../../../core/auth/AuthContext'
import apiClient from '../../../services/apiClient'
import { learnerService } from '../services/learnerService'
import '@google/model-viewer'

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
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
            }, HTMLElement>
        }
    }
}

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
        locked: false,
    })
    const [allBadges, setAllBadges] = useState<any[]>([])
    const [badgePage, setBadgePage] = useState(0)
    const [lessonLoading, setLessonLoading] = useState(true)
    const [badgesLoading, setBadgesLoading] = useState(true)

    const badgesFetched = useRef(false)
    const lessonFetched = useRef(false)
    const BADGES_PER_PAGE = 8

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
                apiClient.get('/users/me')
                    .then((res: any) => {
                        const data = res?.data?.data ?? res?.data
                        if (data && updateSessionItem) {
                            updateSessionItem({
                                totalStars: data.totalStars ?? data.totalStar ?? 0,
                                streak: data.streak ?? data.currentStreakDays ?? 0,
                                totalExperience: data.totalXp ?? data.totalExperience ?? 0,
                            })
                        }
                    })
                    .catch(() => { })

                const dialects = await learnerService.getDialects().catch(() => [])
                if (!dialects.length) return

                const userRegion = (user?.region || 'SOUTH').toUpperCase()
                const dialect = dialects.find((d: any) => {
                    const n = d.name?.toUpperCase() ?? ''
                    if (userRegion === 'NORTH') return n.includes('BẮC') || n === 'NORTH'
                    if (userRegion === 'CENTRAL') return n.includes('TRUNG') || n === 'CENTRAL'
                    return n.includes('NAM') || n === 'SOUTH'
                }) ?? dialects[0]

                if (!dialect) return

                const levels = await learnerService.getLevels(dialect.id).catch(() => [])
                const active = levels.find((l: any) => !l.isCompleted && !l.isLocked)

                if (active) {
                    setCurrentLesson({
                        title: active.name,
                        description: `Bài học • Màn ${active.levelOrder || 1}`,
                        progress: active.starsEarned ? Math.round((active.starsEarned / 3) * 100) : 0,
                        id: active.id,
                        dialectId: dialect.id,
                        locked: false,
                    })
                } else if (levels.length > 0) {
                    setCurrentLesson({
                        title: 'Đã hoàn thành lộ trình!',
                        description: 'Tuyệt vời, bạn đã vượt qua tất cả!',
                        progress: 100,
                        id: levels[levels.length - 1].id,
                        dialectId: dialect.id,
                        locked: false,
                    })
                }
            } catch {
            } finally {
                setLessonLoading(false)
            }
        }

        if (user) loadLesson()
        else setLessonLoading(false)
    }, [user?.id, updateSessionItem])

    const firstName = user?.fullName?.split(' ').slice(-1)[0] || 'Học viên'
    const totalBadgePages = Math.ceil(allBadges.length / BADGES_PER_PAGE)
    const currentBadges = allBadges.slice(badgePage * BADGES_PER_PAGE, (badgePage + 1) * BADGES_PER_PAGE)

    const quickActions = useMemo(() => ([
        { icon: Map, label: 'Lộ trình', desc: 'Bản đồ học', path: '/learner/roadmap', tint: '#263D5B', bg: '#f7f4ee' },
        { icon: Trophy, label: 'Xếp hạng', desc: 'Bảng điểm', path: '/learner/leaderboard', tint: '#D97706', bg: '#fff8ee' },
        { icon: Zap, label: 'Phát âm', desc: 'Luyện ngay', path: '/learner/pronunciation', tint: '#49B6E5', bg: '#eef9fe' },
        { icon: Target, label: 'Bạn bè', desc: 'Kết nối', path: '/learner/friends', tint: '#16A34A', bg: '#effaf3' },
    ]), [])

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#f8f3ea] text-slate-900">
            <div className="pointer-events-none absolute inset-0 z-0">
                <div className="absolute inset-0 opacity-55" style={{ backgroundImage: 'radial-gradient(#e6dccb 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                <div className="absolute inset-0 opacity-35" style={{ backgroundImage: 'linear-gradient(to right, rgba(38,61,91,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(38,61,91,0.05) 1px, transparent 1px)', backgroundSize: '96px 96px' }} />
                <div className="absolute -top-24 right-[-8%] h-80 w-80 rounded-full bg-[#49B6E5]/10 blur-3xl" />
                <div className="absolute bottom-[-10%] left-[-6%] h-96 w-96 rounded-full bg-[#f1c46f]/20 blur-3xl" />
            </div>

            <div className="relative z-10 mx-auto flex w-full max-w-none flex-col gap-4 px-4 lg:px-8 py-4">
                <section className="relative overflow-hidden rounded-[2rem] border-[3px] border-slate-900 bg-[#fbf6ef] shadow-[8px_8px_0_#1f2937]">
                    <div className="absolute inset-0 opacity-35" style={{ backgroundImage: 'linear-gradient(rgba(38,61,91,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(38,61,91,0.05) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
                    <div className="absolute left-6 top-6 h-5 w-5 rounded-full border-[3px] border-slate-900 bg-[#49B6E5]" />
                    <div className="absolute right-8 top-8 h-4 w-14 rotate-[-8deg] rounded-full bg-[#f1c46f]" />
                    <div className="relative grid gap-6 p-5 lg:grid-cols-[1.35fr_0.8fr] lg:p-7">
                        <div className="space-y-5">
                            <div className="inline-flex items-center gap-3 rounded-full border-[3px] border-slate-900 bg-white px-4 py-2 shadow-[5px_5px_0_#1f2937]">
                                <Leaf size={16} className="text-[#49B6E5]" />
                                <span className="text-xs font-black uppercase tracking-[0.22em] text-slate-700">Learner dashboard</span>
                            </div>

                            <div className="max-w-3xl">
                                <p className="mb-2 text-sm font-semibold text-slate-600">Xin chào {firstName},</p>
                                <h1 className="font-serif text-3xl leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
                                    Học vui hơn với một giao diện <span className="relative ml-2 inline-block"><span className="relative z-10">phác thảo</span><span className="absolute inset-x-0 bottom-1 h-3 rotate-[-2deg] rounded-full bg-[#7dd3fc]" /></span>.
                                </h1>
                                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-700 sm:text-base">Tiếp tục lộ trình, mở khóa huy hiệu và luyện tập theo phong cách doodle: nhẹ nhàng, rõ ràng, dễ dùng và có điểm nhấn.</p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button onClick={() => navigate('/learner/roadmap')} className="group inline-flex items-center gap-2 rounded-xl border-[3px] border-slate-900 bg-[#49B6E5] px-5 py-3 text-sm font-black text-slate-900 shadow-[4px_4px_0_#1f2937] transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#49B6E5]/30">
                                    Đi tiếp lộ trình
                                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                                </button>
                                <button onClick={() => navigate('/learner/profile')} className="inline-flex items-center gap-2 rounded-xl border-[3px] border-slate-900 bg-white px-5 py-3 text-sm font-black text-slate-900 shadow-[4px_4px_0_#1f2937] transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-300">
                                    Xem hồ sơ
                                </button>
                            </div>
                        </div>

                        <div className="relative flex items-end justify-center lg:justify-end">
                            <div className="w-full max-w-[18rem] rounded-[1.5rem] border-[3px] border-slate-900 bg-white p-4 shadow-[6px_6px_0_#1f2937]">
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Tiến độ hôm nay</span>
                                    <span className="rounded-full border-[1.5px] border-slate-900 bg-[#f1c46f] px-2 py-0.5 text-[10px] font-black">{currentLesson.progress}%</span>
                                </div>

                                <div className="rounded-xl border-[2.5px] border-slate-900 bg-[#fffaf2] p-3">
                                    {lessonLoading ? (
                                        <div className="h-36 animate-pulse rounded-[1rem] bg-slate-100" />
                                    ) : (
                                        <div
                                            className={`${currentLesson.locked ? 'opacity-60 grayscale' : ''} cursor-pointer`}
                                            onClick={() => !currentLesson.locked && navigate('/learner/roadmap', { state: { fromRoadmap: true, dialectId: currentLesson.dialectId, chapterId: currentLesson.id } })}
                                        >
                                            <div className="mb-2 flex items-center gap-2">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl border-[2.5px] border-slate-900 bg-[#49B6E5]/20">
                                                    {currentLesson.locked ? <LockOutlined className="text-base text-slate-500" /> : <PlayCircleFilled className="text-lg text-slate-900" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">{currentLesson.description}</p>
                                                    <h2 className="text-base font-black text-slate-900 truncate">{currentLesson.title}</h2>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="h-2 flex-1 overflow-hidden rounded-full border-[1.5px] border-slate-900 bg-white">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${currentLesson.progress}%` }}
                                                        transition={{ duration: 1, ease: 'easeOut' }}
                                                        className="h-full rounded-full bg-[#49B6E5]"
                                                    />
                                                </div>
                                                <span className="text-xs font-black">{currentLesson.progress}%</span>
                                            </div>

                                            <div className="mt-3 inline-flex items-center gap-2 text-xs font-black text-slate-700">
                                                Tiếp tục học
                                                <RightOutlined style={{ fontSize: 9 }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-[1.35fr_0.95fr]">
                    <div className="rounded-[1.5rem] border-[3px] border-slate-900 bg-[#fffaf2] p-4 shadow-[6px_6px_0_#1f2937]">
                        <div className="mb-4 flex items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Huy hiệu đã mở khóa</h3>
                                <p className="text-xs text-slate-600">Bộ sưu tập nhỏ để ghi nhận tiến bộ của bạn.</p>
                            </div>

                            <div className="flex items-center gap-2">
                                {totalBadgePages > 1 && (
                                    <div className="flex items-center gap-1 rounded-full border-2 border-slate-900 bg-white px-1.5 py-0.5 shadow-[2px_2px_0_#1f2937]">
                                        <button onClick={() => setBadgePage((p) => Math.max(0, p - 1))} disabled={badgePage === 0} className="grid h-7 w-7 place-items-center rounded-full border-[1.5px] border-slate-900 bg-[#f7f2ea] text-slate-900 disabled:opacity-30">
                                            <ChevronLeft size={12} />
                                        </button>
                                        <span className="px-1.5 text-[10px] font-black text-slate-600">{badgePage + 1}/{totalBadgePages}</span>
                                        <button onClick={() => setBadgePage((p) => Math.min(totalBadgePages - 1, p + 1))} disabled={badgePage === totalBadgePages - 1} className="grid h-7 w-7 place-items-center rounded-full border-[1.5px] border-slate-900 bg-[#f7f2ea] text-slate-900 disabled:opacity-30">
                                            <ChevronRight size={12} />
                                        </button>
                                    </div>
                                )}

                                <button onClick={() => navigate('/learner/profile')} className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-slate-900 bg-[#f1c46f] px-3 py-1.5 text-[10px] font-black text-slate-900 shadow-[3px_3px_0_#1f2937]">
                                    Tất cả
                                    <RightOutlined style={{ fontSize: 9 }} />
                                </button>
                            </div>
                        </div>

                        {badgesLoading ? (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {[...Array(8)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-[1.25rem] border-2 border-slate-900 bg-slate-100" />)}
                            </div>
                        ) : allBadges.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                                {currentBadges.map((b, i) => {
                                    const bData = b?.badge ?? b
                                    const imgUrl = bData?.iconUrl || bData?.imageUrl || bData?.icon_url

                                    return (
                                        <motion.div key={b.id || i} whileHover={{ y: -2, rotate: -1 }} className="rounded-xl border-2 border-slate-900 bg-white p-2.5 text-center shadow-[3px_3px_0_#1f2937]">
                                            <div className="mx-auto mb-1.5 grid h-12 w-12 place-items-center rounded-xl border-2 border-slate-900 bg-[#f1c46f]/30">
                                                {imgUrl ? <img src={imgUrl} alt={bData?.name} className="h-8 w-8 object-contain" /> : <TrophyOutlined className="text-xl text-[#D97706]" />}
                                            </div>
                                            <div className="text-[11px] font-black leading-tight text-slate-800 line-clamp-2">{bData?.name || 'Huy hiệu'}</div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="rounded-[1.25rem] border-2 border-dashed border-slate-300 bg-white p-5">
                                <div className="flex items-center gap-3">
                                    <div className="grid h-12 w-12 place-items-center rounded-2xl border-2 border-slate-900 bg-[#f1c46f]/30">
                                        <TrophyOutlined className="text-xl text-[#D97706]" />
                                    </div>
                                    <div>
                                        <div className="text-base font-black text-slate-900">Chưa có huy hiệu</div>
                                        <p className="text-sm text-slate-600">Hoàn thành các bài học để mở khóa danh hiệu đầu tiên.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="overflow-hidden rounded-[1.5rem] border-[3px] border-slate-900 bg-[#263D5B] p-4 text-white shadow-[6px_6px_0_#1f2937]">
                            <div className="mb-2 inline-flex rounded-full border-1.5 border-white/30 bg-white/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-white/80">Mục tiêu hôm nay</div>
                            <h3 className="text-lg font-black leading-tight">Hoàn thành bài học mới để giữ nhịp học tập.</h3>
                            <button onClick={() => navigate('/learner/roadmap')} className="mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-slate-900 bg-[#7dd3fc] px-4 py-2 text-xs font-black text-slate-900 shadow-[4px_4px_0_#111827] transition-transform hover:-translate-y-0.5">
                                Bắt đầu ngay
                                <ArrowRight size={16} />
                            </button>
                        </div>

                        <div className="rounded-[1.5rem] border-[3px] border-slate-900 bg-[#fffaf2] p-4 shadow-[6px_6px_0_#1f2937]">
                            <div className="mb-3">
                                <h3 className="text-xl font-black text-slate-900">Truy cập nhanh</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                                {quickActions.map(({ icon: Icon, label, desc, path, tint, bg }) => (
                                    <motion.button key={label} whileHover={{ y: -1.5 }} onClick={() => navigate(path)} className="rounded-xl border-2 border-slate-900 p-3 text-left shadow-[3px_3px_0_#1f2937] transition-transform" style={{ background: bg }}>
                                        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg border-2 border-slate-900 bg-white">
                                            <Icon size={16} style={{ color: tint }} />
                                        </div>
                                        <div className="text-[11px] font-black" style={{ color: tint }}>{label}</div>
                                        <div className="mt-0.5 text-[10px] font-medium text-slate-500 truncate">{desc}</div>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}
