import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import badgeService from '../services/badgeService'
import type { BadgeCatalogItem, MyBadge } from '../services/badgeService'
import { Trophy, Star, Lock, ChevronLeft, ChevronRight, CheckCircle2 } from '../../../lib/icons'
import { DoodleLoading } from '../../../components/ui/DoodleLoading'
import clsx from 'clsx'

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = 'ALL' | 'EARNED' | 'LOCKED'

interface MergedBadge extends BadgeCatalogItem {
    earned: boolean
    earnedAt?: string
}

// ── Badge Detail Modal ────────────────────────────────────────────────────────
const BadgeModal: React.FC<{ badge: MergedBadge; onClose: () => void }> = ({ badge, onClose }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
    >
        <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: 'spring', bounce: 0.35, duration: 0.5 }}
            className="relative w-full max-w-sm bg-white rounded-[2.5rem] overflow-hidden border-[3px] border-slate-900 shadow-[8px_8px_0_#1f2937]"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="p-10 flex flex-col items-center gap-6">
                {/* Icon */}
                <div
                    className={clsx(
                        "relative w-32 h-32 rounded-[2.5rem] flex items-center justify-center border-[2.5px] border-slate-900 transition-all",
                        badge.earned
                            ? 'bg-yellow-50 shadow-[4px_4px_0_#1f2937]'
                            : 'bg-slate-100 shadow-inner'
                    )}
                >
                    <img
                        src={badge.iconUrl}
                        alt={badge.name}
                        className={clsx("w-20 h-20 object-contain", !badge.earned && 'grayscale opacity-30')}
                        onError={(e: any) => { e.target.style.display = 'none' }}
                    />
                    {!badge.earned && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Lock size={40} className="text-slate-400" />
                        </div>
                    )}
                </div>

                <div className="text-center">
                    <h3 className="text-2xl font-black text-slate-900 mb-2 font-nunito">{badge.name}</h3>
                    <p className="text-slate-500 font-bold text-sm leading-relaxed px-2">
                        {badge.earned ? 'Bạn đã xuất sắc chinh phục được danh hiệu này!' : 'Danh hiệu này vẫn đang chờ bạn khám phá đó!'}
                    </p>
                </div>

                {/* Status chip */}
                <div
                    className={clsx(
                        "px-6 py-2 rounded-2xl text-xs font-black tracking-widest uppercase border-[2.5px] border-slate-900 shadow-[3px_3px_0_#1f2937] flex items-center gap-2",
                        badge.earned ? 'bg-yellow-400 text-slate-900' : 'bg-slate-200 text-slate-500 shadow-none translate-y-0.5'
                    )}
                >
                    {badge.earned ? <><Star size={14} fill="currentColor" /> Đã đạt được</> : <><Lock size={14} /> Chưa mở khóa</>}
                </div>

                {/* Earned date */}
                {badge.earned && badge.earnedAt && (
                    <div className="bg-slate-50 px-4 py-2 rounded-xl border-[2px] border-slate-900 border-dashed">
                        <p className="text-[11px] text-slate-600 font-black flex items-center gap-2">
                            <CheckCircle2 size={12} className="text-green-500" />
                            Ngày đạt: {new Date(badge.earnedAt).toLocaleDateString('vi-VN')}
                        </p>
                    </div>
                )}

                {/* Close */}
                <button
                    onClick={onClose}
                    className="w-full h-14 mt-4 rounded-2xl font-black text-sm transition-all bg-white text-slate-900 border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f2937] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
                >
                    Đóng
                </button>
            </div>
        </motion.div>
    </motion.div>
)

// ── Badge Card ────────────────────────────────────────────────────────────────
const BadgeCard: React.FC<{ badge: MergedBadge; index: number; onClick: () => void }> = ({ badge, index, onClick }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.05, 0.4), type: 'spring', bounce: 0.4 }}
        whileHover={{ y: -6, scale: 1.05 }}
        onClick={onClick}
        className={clsx(
            "flex flex-col items-center gap-4 cursor-pointer group bg-white p-6 rounded-[2rem] border-[2.5px] border-slate-900 transition-all font-nunito",
            badge.earned ? "shadow-[4px_4px_0_#49B6E5]" : "shadow-[4px_4px_0_#1f2937] hover:shadow-[6px_6px_0_#1f2937]"
        )}
    >
        {/* Circle/Icon container */}
        <div
            className={clsx(
                "relative w-20 h-20 rounded-[1.5rem] flex items-center justify-center transition-all duration-300 border-[2px] border-slate-900 shadow-[3px_3px_0_#1f2937]",
                badge.earned ? "bg-yellow-50" : "bg-slate-50 opacity-60"
            )}
        >
            {badge.iconUrl ? (
                <img
                    src={badge.iconUrl}
                    alt={badge.name}
                    className={clsx("w-12 h-12 object-contain transition-transform group-hover:scale-110", !badge.earned && 'grayscale opacity-30')}
                    onError={(e: any) => { e.target.style.display = 'none' }}
                />
            ) : (
                <Trophy size={40} className={badge.earned ? "text-yellow-400" : "text-slate-200"} />
            )}

            {/* Earned checkmark */}
            {badge.earned && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: Math.min(index * 0.05, 0.4) + 0.3, type: 'spring', bounce: 0.6 }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-slate-900 shadow-[2px_2px_0_#1f2937] border-[2px] border-slate-900 z-10"
                >
                    <CheckCircle2 size={16} strokeWidth={3} />
                </motion.div>
            )}
        </div>

        {/* Name */}
        <p className={clsx(
            "text-center text-sm font-black leading-tight w-full line-clamp-2 px-1 font-nunito uppercase tracking-tight",
            badge.earned ? 'text-slate-900' : 'text-slate-400'
        )}>
            {badge.name}
        </p>
    </motion.div>
)

// ── Main Page ─────────────────────────────────────────────────────────────────
const AchievementsPage: React.FC = () => {
    const [catalog, setCatalog] = useState<BadgeCatalogItem[]>([])
    const [myBadges, setMyBadges] = useState<MyBadge[]>([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<Tab>('ALL')
    const [selected, setSelected] = useState<MergedBadge | null>(null)

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const PAGE_SIZE = 12

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                const [cat, mine] = await Promise.all([
                    badgeService.getCatalog(),
                    badgeService.getMyBadges(),
                ])
                setCatalog(cat)
                setMyBadges(mine)
            } catch (err) {
                console.error('Failed to load badges', err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    // Merge catalog with earned state
    const merged: MergedBadge[] = useMemo(() => {
        const earnedMap = new Map(myBadges.map((b) => [b.badge?.code, b]))
        return catalog.map((item) => {
            const earned = earnedMap.get(item.code)
            return { ...item, earned: !!earned, earnedAt: earned?.earnedAt }
        })
    }, [catalog, myBadges])

    const filtered = useMemo(() => {
        if (tab === 'EARNED') return merged.filter((b) => b.earned)
        if (tab === 'LOCKED') return merged.filter((b) => !b.earned)
        return merged
    }, [merged, tab])

    const earnedCount = merged.filter((b) => b.earned).length
    const totalCount = merged.length
    const pct = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0

    const TABS: { key: Tab; label: string }[] = [
        { key: 'ALL', label: 'Tất cả' },
        { key: 'EARNED', label: 'Đã đạt' },
        { key: 'LOCKED', label: 'Chưa đạt' },
    ]

    // Calculate Pagination
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
    const paginatedBadges = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE
        return filtered.slice(start, start + PAGE_SIZE)
    }, [filtered, currentPage])

    // Reset page when tab changes
    const handleTabChange = (newTab: Tab) => {
        setTab(newTab)
        setCurrentPage(1)
    }

    return (
        // Height is calc(100vh-80px) to subtract the 80px header from LearnerLayout
        <div className="min-h-screen flex flex-col w-full max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-20 bg-[#fbf6ef] font-nunito">

            {/* ── Fixed Header Section (Does not scroll) ───────────────────────── */}
            <div className="flex-shrink-0 flex flex-col lg:flex-row gap-8 mb-12">

                {/* Title & Progress Card */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 bg-white rounded-[2.5rem] p-8 md:p-10 border-[2.5px] border-slate-900 shadow-[8px_8px_0_#1f2937] flex flex-col justify-center relative overflow-hidden"
                >
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">

                        {/* Left: Title */}
                        <div>
                            <div className="flex items-center gap-5 mb-4">
                                <div className="w-16 h-16 bg-[#BAE6FD] rounded-[1.5rem] border-[2.5px] border-slate-900 flex items-center justify-center shadow-[4px_4px_0_#1f2937] -rotate-2">
                                    <Trophy size={32} className="text-[#0369A1]" strokeWidth={2.5} />
                                </div>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Thành Tựu</h1>
                            </div>
                            <p className="text-slate-500 font-bold text-lg">Hành trình chinh phục kho tàng huy hiệu SpeakVN</p>
                        </div>

                        {/* Right: Progress */}
                        <div className="flex-1 max-w-md w-full bg-[#f8fafc] rounded-[2rem] p-6 border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f2937]">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-black text-slate-600 uppercase tracking-wider">
                                    Bạn đã đạt <span className="text-[#49B6E5]">{earnedCount}</span>/{totalCount}
                                </span>
                                <div className="bg-slate-900 text-white px-3 py-1 rounded-full text-sm font-black">
                                    {pct}%
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="relative h-6 rounded-2xl bg-white border-[2.5px] border-slate-900 overflow-hidden">
                                <motion.div
                                    className="absolute left-0 top-0 h-full rounded-full bg-[#49B6E5] border-r-[2.5px] border-slate-900"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                                />
                            </div>
                        </div>

                    </div>
                </motion.div>

                {/* Basic Stats / Tabs Column */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full lg:w-96 flex flex-col gap-6 flex-shrink-0"
                >
                    {/* Quick Stats */}
                    <div className="flex gap-4">
                        <div className="flex-1 bg-white rounded-[2rem] p-6 border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f2937] flex flex-col items-center justify-center">
                            <div className="text-3xl font-black text-[#49B6E5]">{earnedCount}</div>
                            <div className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest leading-none">Đã quy đổi</div>
                        </div>
                        <div className="flex-1 bg-white rounded-[2rem] p-6 border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f2937] flex flex-col items-center justify-center">
                            <div className="text-3xl font-black text-slate-200">{totalCount - earnedCount}</div>
                            <div className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest leading-none">Cần đạt</div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-white p-1.5 rounded-[1.8rem] border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f2937]">
                        {TABS.map((t) => (
                            <button
                                key={t.key}
                                onClick={() => handleTabChange(t.key)}
                                className={clsx(
                                    "flex-1 py-3 rounded-[1.4rem] text-xs font-black transition-all relative z-10",
                                    tab === t.key ? "text-white" : "text-slate-500 hover:text-slate-900"
                                )}
                            >
                                {t.label}
                                {tab === t.key && (
                                    <motion.div
                                        layoutId="achievementsTab"
                                        className="absolute inset-0 bg-[#49B6E5] rounded-[1.2rem] border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937]"
                                        style={{ zIndex: -1 }}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* ── Scrollable Grid Section ────────────────────────────────────────── */}
            <div className="flex-1">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40">
                        <DoodleLoading message="Đang tìm kho báu..." />
                    </div>
                ) : filtered.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border-[3px] border-slate-900 shadow-[8px_8px_0_#1f2937]"
                    >
                        <div className="text-7xl mb-6">🏜️</div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2 font-nunito">
                            {tab === 'EARNED' ? 'Trống trải quá...' : 'Bạn đỉnh quá!'}
                        </h3>
                        <p className="text-slate-500 font-bold max-w-sm text-center px-6">
                            {tab === 'EARNED'
                                ? 'Bạn chưa đạt được huy hiệu nào ở mục này cả. Hãy tiếp tục học tập để lấp đầy kho báu nhé!'
                                : 'Tất cả huy hiệu đã được bạn mở khóa hết rồi đó. Không còn gì có thể làm khó được bạn!'}
                        </p>
                    </motion.div>
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="grid grid-cols-2 min-[500px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8 auto-rows-max mb-12">
                            <AnimatePresence mode="popLayout">
                                {paginatedBadges.map((badge, i) => (
                                    <BadgeCard
                                        key={badge.id}
                                        badge={badge}
                                        index={i}
                                        onClick={() => setSelected(badge)}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="mt-8 flex items-center justify-center gap-6 pb-12">
                                <button
                                    onClick={() => {
                                        setCurrentPage(p => Math.max(1, p - 1));
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    disabled={currentPage === 1}
                                    className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-900 shadow-[4px_4px_0_#1f2937] border-[2.5px] border-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all"
                                >
                                    <ChevronLeft size={24} strokeWidth={3} />
                                </button>
                                <div className="px-6 py-2.5 bg-white rounded-2xl text-base font-black text-slate-900 shadow-[4px_4px_0_#1f2937] border-[2.5px] border-slate-900 font-nunito">
                                    {currentPage} / {totalPages}
                                </div>
                                <button
                                    onClick={() => {
                                        setCurrentPage(p => Math.min(totalPages, p + 1));
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    disabled={currentPage === totalPages}
                                    className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-900 shadow-[4px_4px_0_#1f2937] border-[2.5px] border-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all"
                                >
                                    <ChevronRight size={24} strokeWidth={3} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Modal ─────────────────────────────────────────── */}
            <AnimatePresence>
                {selected && (
                    <BadgeModal badge={selected} onClose={() => setSelected(null)} />
                )}
            </AnimatePresence>

            <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
        </div>
    )
}

export default AchievementsPage
