import { useEffect, useRef, useState } from 'react';
import { Avatar } from 'antd';
import { Trophy, Star, Crown, Medal, Award, RefreshCw, MapPin, ChevronLeft, ChevronRight, Landmark, Castle, Building2, CheckCircle2, Globe, Flame } from '../../../lib/icons';
import apiClient from '../../../services/apiClient';
import { useAuth } from '../../../core/auth/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { DoodleLoading } from '../../../components/ui/DoodleLoading';
import clsx from 'clsx';

/* ─── Types ─────────────────────────────────────────── */
interface LeaderboardEntry {
    rankPosition: number;
    accountId: string;
    fullName: string;
    avatarUrl: string;
    avatar_url?: string;
    totalStars: number;
    challengesCompleted: number;
    currentStreakDays: number;
    badgeCount: number;
}
interface LeaderboardData {
    entries: LeaderboardEntry[];
    myRank: LeaderboardEntry | null;
}

/* ─── Regions ─────────────────────────────────────────── */
const REGIONS = [
    { label: 'Miền Bắc', value: 'NORTH', icon: Landmark },
    { label: 'Miền Trung', value: 'CENTRAL', icon: Castle },
    { label: 'Miền Nam', value: 'SOUTH', icon: Building2 },
];

const PAGE_SIZE = 10;

/* ─── Compact Podium ─────────────────────────────────── */
const podConfig = (rank: number) => {
    if (rank === 1) return {
        badge: <Crown size={20} className="text-yellow-400 fill-yellow-400 drop-shadow-[2px_2px_0_rgba(0,0,0,0.2)]" />,
        ring: 'border-[2.5px] border-yellow-400 shadow-[2px_2px_0_#1f2937]',
        podBg: 'bg-yellow-100',
        podH: 'h-24', size: 64, label: 'text-yellow-700',
    };
    if (rank === 2) return {
        badge: <Medal size={18} className="text-slate-400 fill-slate-400" />,
        ring: 'border-[2.5px] border-slate-300 shadow-[2px_2px_0_#1f2937]',
        podBg: 'bg-slate-100',
        podH: 'h-18', size: 52, label: 'text-slate-600',
    };
    return {
        badge: <Award size={18} className="text-orange-400 fill-orange-400" />,
        ring: 'border-[2.5px] border-orange-300 shadow-[2px_2px_0_#1f2937]',
        podBg: 'bg-orange-50',
        podH: 'h-12', size: 48, label: 'text-orange-600',
    };
};

const Podium = ({ entries, userId }: { entries: LeaderboardEntry[]; userId?: string }) => {
    if (!entries.length) return null;
    const top = entries.slice(0, Math.min(3, entries.length));
    const ordered = top.length === 3 ? [top[1], top[0], top[2]] : top;

    return (
        <div className="flex items-end justify-center gap-1 md:gap-3 pt-6 pb-2">
            {ordered.map((e, i) => {
                const cfg = podConfig(e.rankPosition);
                const isMe = e.accountId === userId;
                return (
                    <motion.div key={e.accountId}
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, type: 'spring', bounce: 0.4 }}
                        className="flex flex-col items-center flex-1 max-w-[120px]"
                    >
                        <div className="mb-1.5 relative">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10 scale-100">
                                {cfg.badge}
                            </div>
                            <Avatar
                                src={e.avatar_url || e.avatarUrl}
                                size={cfg.size}
                                className={clsx("bg-white", cfg.ring)}
                            />
                            {isMe && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-600 rounded-full border-[1.5px] border-slate-900 shadow-[1.5px_1.5px_0_#1f2937] flex items-center justify-center z-10">
                                    <CheckCircle2 size={10} className="text-white" />
                                </div>
                            )}
                        </div>
                        <div className="text-center mb-2">
                            <p className="font-black text-slate-800 text-[10px] md:text-xs truncate max-w-[90px] leading-tight font-nunito">
                                {e.fullName || 'Người học'}
                            </p>
                            {isMe && <span className="text-purple-600 text-[8px] font-black uppercase tracking-tighter">Bạn</span>}
                        </div>

                        <div className={clsx(
                            "w-full rounded-t-2xl border-t-[2px] border-x-[2px] border-slate-900 flex flex-col items-center justify-center shadow-[2px_0_0_#1f2937,-2px_0_0_#1f2937] relative",
                            cfg.podBg,
                            cfg.podH
                        )}>
                            <span className="font-black text-slate-900 text-xl md:text-2xl leading-none">#{e.rankPosition}</span>
                            <div className="flex items-center gap-1 mt-0.5">
                                <Star size={10} className="text-yellow-600 fill-yellow-600" />
                                <span className="text-slate-700 font-black text-[10px]">{e.totalStars}</span>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

/* ─── Compact Row ─────────────────────────────────────── */
const Row = ({ e, idx, userId }: { e: LeaderboardEntry; idx: number; userId?: string }) => {
    const isMe = e.accountId === userId;
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(idx * 0.05, 0.5) }}
            className={clsx(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl border-[2px] border-slate-900 transition-all font-nunito bg-white group",
                isMe ? "shadow-[3px_3px_0_#9333ea]" : "shadow-[3px_3px_0_#1f2937] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#1f2937]"
            )}
        >
            <div className={clsx(
                "w-7 h-7 rounded-lg border-[1.5px] border-slate-900 flex items-center justify-center font-black text-xs flex-shrink-0 shadow-[1.5px_1.5px_0_#1f2937]",
                isMe ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-900"
            )}>
                {e.rankPosition}
            </div>
            <div className="relative flex-shrink-0">
                <Avatar
                    src={e.avatar_url || e.avatarUrl}
                    size={32}
                    className={clsx("border-[1.5px] border-slate-900", isMe ? "bg-purple-100" : "bg-white")}
                />
                {isMe && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-purple-600 rounded-full border-[1px] border-slate-900 flex items-center justify-center z-10 shadow-[1px_1px_0_#1f2937]">
                        <CheckCircle2 size={8} className="text-white" />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-black text-slate-900 text-[11px] truncate">
                    {e.fullName || 'Người học'}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[9px] text-slate-500 font-bold flex items-center gap-1">
                        <Flame size={8} className="text-orange-500 fill-orange-500" />
                        <span className="text-slate-700">{e.currentStreakDays || 0}d</span>
                    </p>
                    <p className="text-[9px] text-slate-500 font-bold flex items-center gap-0.5">
                        <Award size={8} className="text-purple-500" />
                        <span className="text-slate-700">{e.badgeCount || 0}</span>
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 rounded-lg border-[1.5px] border-slate-900 shadow-[1.5px_1.5px_0_#1f2937] flex-shrink-0">
                <Star size={10} className="text-yellow-600 fill-yellow-600" />
                <span className="font-black text-slate-900 text-xs">{e.totalStars || 0}</span>
            </div>
        </motion.div>
    );
};

/* ─── Main ────────────────────────────────────────────── */
export default function LearnerLeaderboardPage() {
    const { session } = useAuth();
    const user = session?.user;

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<LeaderboardData | null>(null);
    const [error, setError] = useState(false);
    const [scope, setScope] = useState<'GLOBAL' | 'REGIONAL'>('REGIONAL');
    const [region, setRegion] = useState<string>(() => {
        const r = (user?.region || 'SOUTH').toUpperCase();
        if (r.includes('BAC') || r === 'NORTH') return 'NORTH';
        if (r.includes('TRUNG') || r === 'CENTRAL') return 'CENTRAL';
        return 'SOUTH';
    });
    const [page, setPage] = useState(1);

    const abort = useRef<AbortController | null>(null);

    const load = async () => {
        abort.current?.abort();
        abort.current = new AbortController();
        setLoading(true);
        setError(false);
        setPage(1);
        try {
            const url = scope === 'GLOBAL'
                ? '/leaderboards/global?period=ALL_TIME&sortBy=TOTAL_STARS'
                : `/leaderboards/region/${region}?period=ALL_TIME&sortBy=TOTAL_STARS`;
            const res: any = await apiClient.get(url);
            setData(res?.data?.data ?? res?.data ?? null);
        } catch (e: any) {
            if (e?.name !== 'CanceledError' && e?.code !== 'ERR_CANCELED') setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [scope, region]);

    const entries = data?.entries ?? [];
    const top3 = entries.slice(0, 3);
    const rest = entries.slice(3);

    const totalPages = Math.ceil(rest.length / PAGE_SIZE);
    const pagedRest = rest.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const currentRegion = REGIONS.find(r => r.value === region);
    const scopeLabel = scope === 'GLOBAL' ? 'Toàn quốc' : (
        <div className="flex items-center gap-1">
            {currentRegion?.icon && <currentRegion.icon size={10} />}
            {currentRegion?.label}
        </div>
    );

    return (
        <div className="flex flex-col min-h-screen bg-[#fbf6ef] font-nunito pb-20">
            {/* ── Header Strip ── */}
            <div className="sticky top-0 z-[50] bg-[#fbf6ef]/95 backdrop-blur-md px-4 py-3 transition-all duration-300 border-b-[2.5px] border-slate-900/10">
                <div className="max-w-none mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border-[2px] border-slate-900 shadow-[3px_3px_0_#1f2937] flex items-center justify-center -rotate-2 text-yellow-500">
                            <Trophy size={20} className="fill-yellow-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 leading-none">Bảng Xếp Hạng</h2>
                            <p className="text-xs text-slate-500 font-bold mt-0.5 flex items-center gap-1">
                                {scope === 'REGIONAL' && <MapPin size={12} className="text-[#49B6E5]" />}
                                {scopeLabel}
                            </p>
                        </div>
                    </div>

                    {/* Controls row */}
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        {/* Scope toggle */}
                        <div className="bg-white rounded-xl border-[2px] border-slate-900 p-0.5 flex gap-0.5 shadow-[2px_2px_0_#1f2937]">
                            {([
                                { label: 'Khu vực', value: 'REGIONAL', icon: MapPin },
                                { label: 'Toàn quốc', value: 'GLOBAL', icon: Globe },
                            ] as const).map(({ label, value, icon: Icon }) => (
                                <button key={value} onClick={() => setScope(value)}
                                    className={clsx(
                                        "h-8 px-3 rounded-lg font-black text-[10px] flex items-center justify-center gap-1.5 transition-all duration-200 whitespace-nowrap",
                                        scope === value
                                            ? "bg-[#49B6E5] text-white border-[1.5px] border-slate-900 shadow-[1.5px_1.5px_0_#1f2937]"
                                            : "text-slate-500 hover:bg-slate-50"
                                    )}>
                                    <Icon size={12} strokeWidth={2.5} /> {label}
                                </button>
                            ))}
                        </div>

                        {/* Region chips */}
                        <AnimatePresence>
                            {scope === 'REGIONAL' && (
                                <motion.div key="regions" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex gap-0.5 bg-white rounded-xl border-[2px] border-slate-900 p-0.5 shadow-[2px_2px_0_#1f2937]">
                                    {REGIONS.map(r => (
                                        <button key={r.value} onClick={() => setRegion(r.value)}
                                            className={clsx(
                                                "h-8 px-2.5 rounded-lg font-black text-[10px] flex items-center gap-1.5 transition-all duration-200 whitespace-nowrap",
                                                region === r.value
                                                    ? "bg-[#BAE6FD] text-[#0369A1] border-[1.5px] border-slate-900"
                                                    : "text-slate-400 hover:bg-slate-50"
                                            )}>
                                            <r.icon size={12} strokeWidth={2.5} /> {r.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button onClick={load} disabled={loading}
                            className="w-9 h-9 rounded-xl bg-white border-[2px] border-slate-900 flex items-center justify-center hover:bg-slate-50 transition-all shadow-[2px_2px_0_#1f2937] active:translate-y-0.5 active:shadow-none">
                            <RefreshCw size={16} className={clsx("text-slate-900", loading && "animate-spin")} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="flex-1 px-4 py-4 overflow-y-auto">
                <div className="max-w-none mx-auto px-2">
                    {loading ? (
                        <div className="flex justify-center items-center py-40">
                            <DoodleLoading message="Đang tải bảng vàng..." />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border-[2.5px] border-slate-900 shadow-[6px_6px_0_#1f2937]">
                            <div className="text-6xl mb-6">🏜️</div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Ối! Có lỗi rồi</h3>
                            <p className="text-slate-500 font-bold mb-8 text-center max-w-sm px-6">Chúng tôi không thể kết nối được với bảng vàng lúc này. Hãy thử lại xem sao nhé!</p>
                            <button
                                onClick={load}
                                className="px-8 py-3 bg-[#49B6E5] text-white font-black rounded-2xl border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f2937] active:translate-y-1 active:shadow-none transition-all"
                            >
                                Thử lại ngay
                            </button>
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border-[2.5px] border-slate-900 shadow-[6px_6px_0_#1f2937]">
                            <div className="text-6xl mb-6">👻</div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Bảng vàng trống trơn</h3>
                            <p className="text-slate-500 font-bold mb-6">Hãy là người đầu tiên ghi tên lên đây nhé!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                            {/* Left: Podium — 5 cols */}
                            <div className="lg:col-span-5 hidden md:block sticky top-20">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white rounded-[1.5rem] border-[2px] border-slate-900 shadow-[6px_6px_0_#1f2937] overflow-hidden flex flex-col"
                                >
                                    <div className="bg-[#BAE6FD] px-6 py-3 border-b-[2px] border-slate-900 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Crown size={18} className="text-yellow-500 fill-yellow-500" />
                                            <span className="font-black text-slate-900 uppercase tracking-wider text-xs mt-0.5">Top 3 Dẫn Đầu</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-4 bg-[#fdfaff]">
                                        <Podium entries={top3} userId={user?.id} />
                                    </div>

                                    {data?.myRank && (
                                        <div className="p-4 bg-slate-50 border-t-[2px] border-slate-900">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Vị trí của bạn</p>
                                            <Row e={data.myRank} idx={0} userId={user?.id} />
                                        </div>
                                    )}
                                </motion.div>
                            </div>

                            {/* Right: Full ranking — 7 cols */}
                            <div className="lg:col-span-7 flex flex-col gap-3">
                                <div className="bg-white rounded-[1.5rem] border-[2px] border-slate-900 shadow-[4px_4px_0_#1f2937] p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2">
                                            <Medal size={18} className="text-[#49B6E5]" />
                                            <h3 className="text-lg font-black text-slate-900">Thứ Hạng Khác</h3>
                                        </div>
                                        <span className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded-full border-[1.5px] border-slate-900 shadow-[1.5px_1.5px_0_#1f2937]">
                                            {entries.length} người học
                                        </span>
                                    </div>

                                    <style>{`
                                        .ranking-scroll::-webkit-scrollbar {
                                            width: 8px;
                                        }
                                        .ranking-scroll::-webkit-scrollbar-track {
                                            background: #f1f5f9;
                                            border-radius: 4px;
                                            border: 1.5px solid #1f2937;
                                        }
                                        .ranking-scroll::-webkit-scrollbar-thumb {
                                            background: #49B6E5;
                                            border-radius: 4px;
                                            border: 1.5px solid #1f2937;
                                        }
                                        .ranking-scroll::-webkit-scrollbar-thumb:hover {
                                            background: #38a1d0;
                                        }
                                    `}</style>

                                    <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2 ranking-scroll">
                                        {pagedRest.length > 0 ? (
                                            pagedRest.map((e, i) => <Row key={e.accountId} e={e} idx={i} userId={user?.id} />)
                                        ) : (
                                            <div className="py-12 text-center">
                                                <p className="text-slate-400 font-bold">Chưa có người học khác xếp hạng</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between mt-10 pt-8 border-t-[2.5px] border-slate-900/10">
                                            <button
                                                onClick={() => {
                                                    setPage(p => Math.max(1, p - 1));
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                disabled={page === 1}
                                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-[2px] border-slate-900 font-black text-xs text-slate-900 shadow-[3px_3px_0_#1f2937] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all disabled:opacity-30"
                                            >
                                                <ChevronLeft size={16} strokeWidth={3} /> Trước
                                            </button>

                                            <div className="flex items-center gap-1.5">
                                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                                    const p = totalPages <= 5 ? i + 1 : (page <= 3 ? i + 1 : page - 2 + i);
                                                    if (p < 1 || p > totalPages) return null;
                                                    return (
                                                        <button key={p} onClick={() => {
                                                            setPage(p);
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                            className={clsx(
                                                                "w-9 h-9 rounded-xl font-black text-xs transition-all border-[2px]",
                                                                page === p
                                                                    ? "bg-slate-900 text-white border-slate-900 shadow-[2px_2px_0_#49B6E5]"
                                                                    : "bg-white text-slate-400 border-slate-200 hover:border-slate-900 hover:text-slate-900 shadow-[2px_2px_0_#e2e8f0]"
                                                            )}>
                                                            {p}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <button
                                                onClick={() => {
                                                    setPage(p => Math.min(totalPages, p + 1));
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                disabled={page === totalPages}
                                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-[2px] border-slate-900 font-black text-xs text-slate-900 shadow-[3px_3px_0_#1f2937] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all disabled:opacity-30"
                                            >
                                                Tiếp <ChevronRight size={16} strokeWidth={3} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
