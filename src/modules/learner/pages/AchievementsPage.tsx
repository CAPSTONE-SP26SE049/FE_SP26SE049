import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import badgeService from '../services/badgeService'
import type { BadgeCatalogItem, MyBadge } from '../services/badgeService'
import { Trophy, Star, Lock, ChevronLeft, ChevronRight } from 'lucide-react'

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
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
        onClick={onClose}
    >
        <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', bounce: 0.35, duration: 0.5 }}
            className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="p-8 flex flex-col items-center gap-5">
                {/* Icon */}
                <div
                    className={`relative w-28 h-28 rounded-full flex items-center justify-center shadow-inner ${badge.earned
                        ? 'bg-gradient-to-br from-orange-50 to-amber-100 border-2 border-amber-300 shadow-amber-200/50'
                        : 'bg-gray-100 border-2 border-gray-200'
                        }`}
                >
                    <img
                        src={badge.iconUrl}
                        alt={badge.name}
                        className={`w-16 h-16 object-contain ${!badge.earned ? 'grayscale opacity-40' : ''}`}
                        onError={(e: any) => { e.target.style.display = 'none' }}
                    />
                    {!badge.earned && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Lock size={32} className="text-gray-400" />
                        </div>
                    )}
                </div>

                {/* Status chip */}
                <span
                    className={`px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase border ${badge.earned
                        ? 'bg-amber-50 text-amber-600 border-amber-200'
                        : 'bg-gray-50 text-gray-400 border-gray-200'
                        }`}
                >
                    {badge.earned ? '✨ Đã đạt được' : '🔒 Chưa mở khóa'}
                </span>

                {/* Title */}
                <div className="text-center">
                    <h3 className="text-xl font-black text-gray-800 mb-2">{badge.name}</h3>
                    <p className="text-sm font-medium leading-relaxed text-gray-600">
                        {badge.description}
                    </p>
                </div>

                {/* Earned date */}
                {badge.earned && badge.earnedAt && (
                    <p className="text-xs text-amber-600 font-bold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                        Đạt được lúc: {new Date(badge.earnedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                )}

                {/* Close */}
                <button
                    onClick={onClose}
                    className="w-full h-12 mt-2 rounded-2xl font-black text-sm transition-all bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200"
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
        initial={{ opacity: 0, scale: 0.85, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.02, 0.2), type: 'spring', bounce: 0.3 }}
        whileHover={{ y: -4, scale: 1.02 }}
        onClick={onClick}
        className="flex flex-col items-center gap-3 cursor-pointer group bg-white p-4 rounded-3xl border border-purple-50 shadow-[0_2px_10px_rgba(147,51,234,0.03)] hover:shadow-[0_8px_20px_rgba(147,51,234,0.08)] hover:border-purple-100 transition-all"
    >
        {/* Circle */}
        <div
            className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all duration-300 ${badge.earned
                ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 shadow-inner'
                : 'bg-gray-50 border border-gray-100'
                }`}
        >
            {badge.iconUrl ? (
                <img
                    src={badge.iconUrl}
                    alt={badge.name}
                    className={`w-12 h-12 sm:w-14 sm:h-14 object-contain transition-transform group-hover:scale-110 ${!badge.earned ? 'grayscale opacity-30' : ''}`}
                    onError={(e: any) => { e.target.style.display = 'none' }}
                />
            ) : (
                <Trophy size={40} className={badge.earned ? "text-amber-400" : "text-gray-300"} />
            )}

            {/* Lock overlay */}
            {!badge.earned && (
                <div className="absolute inset-0 rounded-full flex items-center justify-center">
                </div>
            )}

            {/* Earned checkmark */}
            {badge.earned && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: Math.min(index * 0.02, 0.2) + 0.2, type: 'spring', bounce: 0.6 }}
                    className="absolute -top-1 -right-1 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center text-white shadow-md border-2 border-white"
                >
                    <Star size={14} fill="currentColor" />
                </motion.div>
            )}
        </div>

        {/* Name */}
        <p
            className={`text-center text-[13px] font-bold leading-snug w-full line-clamp-2 px-1 ${badge.earned ? 'text-gray-800' : 'text-gray-400'
                }`}
        >
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
        // Height is calc(100vh - 56px) to subtract the 14 (56px) header from LearnerLayout
        <div className="h-[calc(100vh-56px)] flex flex-col w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 bg-[#f8f5ff]">

            {/* ── Fixed Header Section (Does not scroll) ───────────────────────── */}
            <div className="flex-shrink-0 flex flex-col lg:flex-row gap-6 mb-6">

                {/* Title & Progress Card */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex-1 bg-white rounded-[2rem] p-6 lg:p-8 shadow-[0_8px_30px_rgba(147,51,234,0.04)] border border-purple-50 flex flex-col justify-center relative overflow-hidden"
                >
                    {/* Decorative background shapes */}
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-amber-100 to-orange-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
                    <div className="absolute right-20 -bottom-10 w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">

                        {/* Left: Title */}
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
                                    <Trophy size={24} className="text-white" />
                                </div>
                                <h1 className="text-3xl font-black text-gray-800 tracking-tight">Thành Tựu</h1>
                            </div>
                            <p className="text-gray-500 font-medium">Khám phá và chinh phục các huy hiệu</p>
                        </div>

                        {/* Right: Progress */}
                        <div className="flex-1 max-w-md w-full bg-gray-50/80 backdrop-blur rounded-2xl p-4 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-gray-600">
                                    Bạn đã chinh phục <span className="text-purple-600">{earnedCount}</span>/{totalCount}
                                </span>
                                <span className="text-lg font-black text-purple-600">{pct}%</span>
                            </div>

                            {/* Progress bar */}
                            <div className="relative h-3 rounded-full bg-gray-200 overflow-hidden shadow-inner">
                                <motion.div
                                    className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-purple-600 to-orange-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                                />
                            </div>
                        </div>

                    </div>
                </motion.div>

                {/* Basic Stats / Tabs Column */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full lg:w-80 flex flex-col gap-4 flex-shrink-0"
                >
                    {/* Quick Stats */}
                    <div className="flex gap-3 h-full">
                        <div className="flex-1 bg-white rounded-3xl p-4 flex flex-col items-center justify-center shadow-[0_4px_20px_rgba(147,51,234,0.03)] border border-purple-50">
                            <div className="text-2xl font-black text-amber-500">{earnedCount}</div>
                            <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Đã mở</div>
                        </div>
                        <div className="flex-1 bg-white rounded-3xl p-4 flex flex-col items-center justify-center shadow-[0_4px_20px_rgba(147,51,234,0.03)] border border-purple-50">
                            <div className="text-2xl font-black text-gray-300">{totalCount - earnedCount}</div>
                            <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Còn lại</div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-white p-1.5 rounded-2xl shadow-[0_4px_15px_rgba(147,51,234,0.03)] border border-purple-50">
                        {TABS.map((t) => (
                            <button
                                key={t.key}
                                onClick={() => handleTabChange(t.key)}
                                className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all relative ${tab === t.key
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                    }`}
                            >
                                {t.label}
                                {tab === t.key && (
                                    <motion.div
                                        layoutId="achievementsTab"
                                        className="absolute inset-0 bg-white rounded-xl shadow-sm border border-purple-100/50"
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
            <div className="flex-1 overflow-y-auto pb-8 min-h-0 hide-scrollbar -mx-4 px-4 sm:-mx-6 sm:px-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 pb-20">
                        <div className="w-10 h-10 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
                        <p className="text-sm font-bold text-purple-600/60">Đang tải danh sách thành tựu...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center h-full pb-20 text-center"
                    >
                        <div className="w-24 h-24 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                            <Lock size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700 mb-1">
                            {tab === 'EARNED' ? 'Chưa có thành tựu nào' : 'Bạn đã mở khóa tất cả!'}
                        </h3>
                        <p className="text-gray-400 font-medium">
                            {tab === 'EARNED' ? 'Hãy hoàn thành các bài học để nhận thêm danh hiệu nhé.' : 'Tuyệt vời, không còn thành tựu nào bị khóa.'}
                        </p>
                    </motion.div>
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="grid grid-cols-2 min-[500px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 auto-rows-max mb-6">
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
                            <div className="mt-auto flex items-center justify-center gap-4 pb-8">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-purple-600 shadow-sm border border-purple-100 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-50 transition-colors"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <div className="px-4 py-1.5 bg-white rounded-full text-sm font-bold text-gray-600 shadow-sm border border-purple-100">
                                    {currentPage} / {totalPages}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-purple-600 shadow-sm border border-purple-100 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-50 transition-colors"
                                >
                                    <ChevronRight size={20} />
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
