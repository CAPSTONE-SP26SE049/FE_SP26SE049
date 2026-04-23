import { useEffect, useRef, useState } from 'react';
import { Avatar, Spin } from 'antd';
import { FireFilled, CheckCircleFilled, GlobalOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { Trophy, Star, Crown, Medal, Award, RefreshCw, MapPin, ChevronLeft, ChevronRight } from '../../../lib/icons';
import apiClient from '../../../services/apiClient';
import { useAuth } from '../../../core/auth/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
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
    { label: 'Miền Bắc', value: 'NORTH', emoji: '🏛️' },
    { label: 'Miền Trung', value: 'CENTRAL', emoji: '🏯' },
    { label: 'Miền Nam', value: 'SOUTH', emoji: '🌆' },
];

const PAGE_SIZE = 10;

/* ─── Compact Podium ─────────────────────────────────── */
const podConfig = (rank: number) => {
    if (rank === 1) return {
        badge: <Crown size={16} className="text-amber-400 drop-shadow" />,
        ring: 'ring-2 ring-amber-300 ring-offset-1',
        podBg: 'bg-gradient-to-b from-amber-400 to-yellow-500',
        podH: 'h-20', size: 48, label: 'text-amber-600',
    };
    if (rank === 2) return {
        badge: <Medal size={14} className="text-slate-400" />,
        ring: 'ring-2 ring-slate-200 ring-offset-1',
        podBg: 'bg-gradient-to-b from-slate-300 to-slate-400',
        podH: 'h-14', size: 40, label: 'text-slate-500',
    };
    return {
        badge: <Award size={14} className="text-orange-400" />,
        ring: 'ring-2 ring-orange-200 ring-offset-1',
        podBg: 'bg-gradient-to-b from-orange-300 to-amber-400',
        podH: 'h-10', size: 40, label: 'text-orange-500',
    };
};

const Podium = ({ entries, userId }: { entries: LeaderboardEntry[]; userId?: string }) => {
    if (!entries.length) return null;
    const top = entries.slice(0, Math.min(3, entries.length));
    const ordered = top.length === 3 ? [top[1], top[0], top[2]] : top;

    return (
        <div className="flex items-end justify-center gap-3 pt-1 pb-0">
            {ordered.map((e, i) => {
                const cfg = podConfig(e.rankPosition);
                const isMe = e.accountId === userId;
                return (
                    <motion.div key={e.accountId}
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, type: 'spring', bounce: 0.3 }}
                        className="flex flex-col items-center flex-1 max-w-[110px]"
                    >
                        <div className="mb-0.5">{cfg.badge}</div>
                        <div className={clsx("rounded-full mb-1 relative", cfg.ring)}>
                            <Avatar src={e.avatar_url || e.avatarUrl} size={cfg.size} className="border-2 border-white" />
                            {isMe && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center">
                                    <CheckCircleFilled className="text-white text-[7px]" />
                                </div>
                            )}
                        </div>
                        <p className="font-black text-gray-800 text-[10px] text-center truncate max-w-[100px] leading-tight">
                            {e.fullName || 'Player'}
                            {isMe && <span className="block text-purple-500 text-[8px]">(Bạn)</span>}
                        </p>
                        <p className={clsx("text-[10px] font-bold mt-0.5 mb-1", cfg.label)}>
                            {e.totalStars} ⭐ • {e.badgeCount || 0} 🏆
                        </p>
                        <div className={clsx("w-full rounded-t-xl flex items-center justify-center font-black text-white text-sm shadow-md", cfg.podBg, cfg.podH)}>
                            #{e.rankPosition}
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
            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(idx * 0.025, 0.25) }}
            className={clsx(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all",
                isMe
                    ? "bg-purple-50 border-purple-200 ring-1 ring-purple-100"
                    : "bg-white border-gray-100 hover:border-purple-100 hover:bg-purple-50/30"
            )}
        >
            <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-gray-400 text-xs flex-shrink-0">
                {e.rankPosition}
            </div>
            <div className="relative flex-shrink-0">
                <Avatar src={e.avatar_url || e.avatarUrl} size={32} className={clsx("border-2", isMe ? "border-purple-300" : "border-gray-100")} />
                {isMe && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-purple-500 rounded-full border border-white flex items-center justify-center">
                        <CheckCircleFilled className="text-white text-[7px]" />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-xs truncate">
                    {e.fullName || 'Người học'}
                    {isMe && <span className="ml-1.5 text-[8px] bg-purple-500 text-white px-1.5 py-0.5 rounded-full font-black">BẠN</span>}
                </p>
                <p className="text-[9px] text-gray-400 font-semibold flex items-center gap-1 mt-0.5">
                    <FireFilled className="text-orange-400" style={{ fontSize: 9 }} /> {e.currentStreakDays || 0} ngày học • <Trophy size={9} className="text-amber-500" /> {e.badgeCount || 0} huy hiệu
                </p>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 rounded-lg border border-yellow-100 flex-shrink-0">
                <Star size={10} className="text-yellow-500" />
                <span className="font-black text-yellow-600 text-xs">{e.totalStars || 0}</span>
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
    const scopeLabel = scope === 'GLOBAL' ? 'Toàn quốc' : `${currentRegion?.emoji} ${currentRegion?.label}`;

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] min-h-[600px] w-full bg-[#f8f5ff] overflow-hidden">

            {/* ── Header Strip ── */}
            <div className="flex-shrink-0 px-6 py-3 bg-white border-b border-gray-100"
                style={{ boxShadow: '0 2px 12px rgba(147,51,234,0.04)' }}>
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-orange-400/20">
                            <Trophy size={16} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-gray-800 leading-none">Bảng Xếp Hạng</h2>
                            <p className="text-[10px] text-gray-400 font-semibold mt-0.5 flex items-center gap-1">
                                {scope === 'REGIONAL' && <MapPin size={9} className="text-purple-400" />}
                                {scopeLabel}
                            </p>
                        </div>
                    </div>

                    {/* Controls row */}
                    <div className="flex items-center gap-2">
                        {/* Scope toggle */}
                        <div className="bg-gray-50 rounded-xl border border-gray-100 p-0.5 flex gap-0.5">
                            {([
                                { label: 'Khu vực', value: 'REGIONAL', icon: EnvironmentOutlined },
                                { label: 'Toàn quốc', value: 'GLOBAL', icon: GlobalOutlined },
                            ] as const).map(({ label, value, icon: Icon }) => (
                                <button key={value} onClick={() => setScope(value)}
                                    className={clsx(
                                        "h-7 px-2.5 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-all duration-200 whitespace-nowrap",
                                        scope === value
                                            ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-sm shadow-purple-500/20"
                                            : "text-gray-400 hover:text-purple-500 hover:bg-white"
                                    )}>
                                    <Icon style={{ fontSize: 10 }} /> {label}
                                </button>
                            ))}
                        </div>

                        {/* Region chips */}
                        <AnimatePresence>
                            {scope === 'REGIONAL' && (
                                <motion.div key="regions" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                                    className="flex gap-0.5 bg-gray-50 rounded-xl border border-gray-100 p-0.5">
                                    {REGIONS.map(r => (
                                        <button key={r.value} onClick={() => setRegion(r.value)}
                                            className={clsx(
                                                "h-7 px-2.5 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all duration-200 whitespace-nowrap",
                                                region === r.value
                                                    ? "bg-purple-600 text-white shadow-sm"
                                                    : "text-gray-400 hover:text-purple-500 hover:bg-white"
                                            )}>
                                            {r.emoji} {r.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button onClick={load} disabled={loading}
                            className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-purple-50 hover:border-purple-200 transition-all disabled:opacity-40">
                            <RefreshCw size={12} className={clsx("text-gray-400", loading && "animate-spin")} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="flex-1 min-h-0 overflow-hidden p-4">
                <div className="max-w-6xl mx-auto h-full">
                    {loading ? (
                        <div className="flex justify-center items-center h-full bg-white rounded-2xl border border-gray-100">
                            <Spin size="large" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full bg-white rounded-2xl border border-red-100">
                            <span className="text-3xl mb-2">⚠️</span>
                            <p className="font-bold text-gray-500 text-sm">Không thể tải dữ liệu</p>
                            <button onClick={load} className="mt-2 text-purple-600 font-bold text-sm hover:underline">Thử lại</button>
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full bg-white rounded-2xl border border-gray-100">
                            <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center mb-3 border border-yellow-100">
                                <Trophy size={22} className="text-yellow-200" />
                            </div>
                            <p className="font-bold text-gray-400 text-sm">Chưa có dữ liệu xếp hạng</p>
                            <p className="text-gray-300 text-xs mt-1">Hãy là người đầu tiên ghi tên lên bảng vàng!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 h-full">

                            {/* Left: Podium — 2 cols */}
                            <div className="lg:col-span-2 h-full overflow-hidden">
                                {top3.length > 0 && (
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col"
                                        style={{ boxShadow: '0 4px 20px rgba(147,51,234,0.06)' }}>
                                        <div className="h-0.5 w-full bg-gradient-to-r from-purple-500 via-orange-400 to-amber-400" />
                                        <div className="px-4 pt-3 pb-2 flex-shrink-0">
                                            <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest flex items-center gap-1.5">
                                                <Crown size={10} className="text-amber-400" /> Top 3 dẫn đầu
                                            </p>
                                        </div>
                                        <div className="flex-1 px-3 pb-3 flex flex-col justify-center">
                                            <Podium entries={top3} userId={user?.id} />
                                        </div>

                                        {data?.myRank && data.myRank.rankPosition <= 3 && (
                                            <div className="px-3 pb-3">
                                                <div className="bg-purple-50 rounded-xl px-3 py-1.5 text-center border border-purple-100">
                                                    <p className="text-[9px] font-black text-purple-500">🎉 Bạn đang trong Top 3!</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Right: Full ranking — 3 cols */}
                            <div className="lg:col-span-3 flex flex-col h-full gap-2 overflow-hidden">

                                {/* My rank if not top 3 */}
                                {data?.myRank && data.myRank.rankPosition > 3 && (
                                    <div className="bg-white rounded-xl border border-purple-100 shadow-sm p-2.5 flex-shrink-0"
                                        style={{ boxShadow: '0 2px 12px rgba(147,51,234,0.06)' }}>
                                        <p className="text-[9px] uppercase font-black text-purple-500 tracking-widest mb-1.5">Vị trí của bạn</p>
                                        <Row e={data.myRank} idx={0} userId={user?.id} />
                                    </div>
                                )}

                                {/* Rankings #4+ with pagination */}
                                {rest.length > 0 && (
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex-1 flex flex-col min-h-0 overflow-hidden"
                                        style={{ boxShadow: '0 4px 20px rgba(147,51,234,0.06)' }}>
                                        <div className="flex items-center justify-between mb-2 flex-shrink-0">
                                            <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest">
                                                Bảng xếp hạng
                                            </p>
                                            <span className="text-[9px] text-gray-300 font-bold">{entries.length} người</span>
                                        </div>

                                        <style dangerouslySetInnerHTML={{
                                            __html: `
                                        .lb-scroll::-webkit-scrollbar { width: 3px; }
                                        .lb-scroll::-webkit-scrollbar-track { background: transparent; }
                                        .lb-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
                                        .lb-scroll::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
                                    `}} />
                                        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 lb-scroll">
                                            {pagedRest.map((e, i) => <Row key={e.accountId} e={e} idx={i} userId={user?.id} />)}
                                        </div>

                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 flex-shrink-0">
                                                <button
                                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                                    disabled={page === 1}
                                                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50 border border-gray-100 text-[10px] font-bold text-gray-400 hover:bg-purple-50 hover:border-purple-100 hover:text-purple-600 transition-all disabled:opacity-30"
                                                >
                                                    <ChevronLeft size={11} /> Trước
                                                </button>
                                                <div className="flex items-center gap-0.5">
                                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                                        const p = totalPages <= 5 ? i + 1 : (page <= 3 ? i + 1 : page - 2 + i);
                                                        if (p < 1 || p > totalPages) return null;
                                                        return (
                                                            <button key={p} onClick={() => setPage(p)}
                                                                className={clsx(
                                                                    "w-6 h-6 rounded-lg text-[10px] font-black transition-all",
                                                                    page === p ? "bg-purple-600 text-white shadow-sm" : "bg-gray-50 text-gray-400 hover:bg-purple-50"
                                                                )}>
                                                                {p}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                <button
                                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={page === totalPages}
                                                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50 border border-gray-100 text-[10px] font-bold text-gray-400 hover:bg-purple-50 hover:border-purple-100 hover:text-purple-600 transition-all disabled:opacity-30"
                                                >
                                                    Tiếp <ChevronRight size={11} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
