import { useEffect, useState } from 'react';

import { Select, Avatar, Spin, Segmented } from 'antd';
import { TrophyOutlined, FireFilled, StarFilled, GlobalOutlined, EnvironmentOutlined, CheckCircleFilled } from '@ant-design/icons';
import { Shield, Zap, Target } from 'lucide-react';
import apiClient from '../../../services/apiClient';
import { useAuth } from '../../../core/auth/AuthContext';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const { Option } = Select;

interface LeaderboardEntry {
    rankPosition: number;
    accountId: string;
    fullName: string;
    avatarUrl: string;
    totalExperience: number;
    totalStars: number;
    challengesCompleted: number;
    currentStreakDays: number;
    region: string;
}

interface LeaderboardData {
    scope: string;
    periodType: string;
    sortBy: string;
    entries: LeaderboardEntry[];
    myRank: LeaderboardEntry | null;
}

export default function LearnerLeaderboardPage() {
    const { session } = useAuth();
    const user = session?.user;

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<LeaderboardData | null>(null);

    // Filters
    const [scope, setScope] = useState<'GLOBAL' | 'REGIONAL'>('REGIONAL');
    const [region, setRegion] = useState<string>(user?.region || 'SOUTH'); // Default to user's region or SOUTH
    const [period, setPeriod] = useState<string>('WEEKLY');
    const [sortBy, setSortBy] = useState<string>('TOTAL_XP');

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            let endpoint = '/leaderboards/global';
            if (scope === 'REGIONAL') {
                const searchRegion = region === 'Miền Bắc' ? 'NORTH' : region === 'Miền Trung' ? 'CENTRAL' : region === 'Miền Nam' ? 'SOUTH' : region;
                // mapping vietnamese string to enum since region might be stored locally in vietnamese
                let regionCode = 'SOUTH';
                if (searchRegion.toLowerCase().includes('bắc') || searchRegion.toUpperCase() === 'NORTH') regionCode = 'NORTH';
                else if (searchRegion.toLowerCase().includes('trung') || searchRegion.toUpperCase() === 'CENTRAL') regionCode = 'CENTRAL';
                else if (searchRegion.toLowerCase().includes('nam') || searchRegion.toUpperCase() === 'SOUTH') regionCode = 'SOUTH';

                endpoint = `/leaderboards/region/${regionCode}`;
            }

            const res: any = await apiClient.get(`${endpoint}?period=${period}&sortBy=${sortBy}`);
            setData(res?.data?.data || res?.data || null);
        } catch (error) {
            console.error('Failed to fetch leaderboard', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, [scope, region, period, sortBy]);

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return '🏆';
            case 2:
                return '🥈';
            case 3:
                return '🥉';
            default:
                return rank;
        }
    };
    const renderEntry = (entry: LeaderboardEntry, isCurrentUser = false) => {
        const isTop3 = entry.rankPosition <= 3;

        return (
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                key={entry.accountId}
                className={clsx(
                    "flex items-center justify-between p-5 mb-4 rounded-3xl border transition-all duration-500 group relative overflow-hidden",
                    isCurrentUser
                        ? 'border-brand-green/50 bg-brand-green/10 shadow-[0_0_30px_rgba(88,204,2,0.15)] ring-1 ring-brand-green/20'
                        : isTop3
                            ? 'border-white/20 bg-white/5 shadow-2xl backdrop-blur-md'
                            : 'border-white/5 bg-white/2 hover:bg-white/10 hover:border-white/20'
                )}
            >
                {/* Decoration for top 3 */}
                {isTop3 && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[50px] -mr-16 -mt-16 group-hover:bg-white/10 transition-all" />
                )}

                <div className="flex items-center gap-6 relative z-10">
                    <div className={clsx(
                        "w-12 h-12 flex items-center justify-center font-black text-xl rounded-2xl border transition-all shadow-lg",
                        entry.rankPosition === 1 ? 'bg-yellow-400 border-yellow-200 text-white rotate-3 shadow-yellow-400/20' :
                            entry.rankPosition === 2 ? 'bg-slate-300 border-slate-100 text-white rotate-2 shadow-slate-300/20' :
                                entry.rankPosition === 3 ? 'bg-orange-500 border-orange-300 text-white -rotate-1 shadow-orange-500/20' :
                                    'bg-white/5 border-white/10 text-white/40'
                    )}>
                        {entry.rankPosition <= 3 ? (
                            <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">{getRankIcon(entry.rankPosition)}</span>
                        ) : entry.rankPosition}
                    </div>

                    <div className="relative">
                        <Avatar
                            src={entry.avatarUrl}
                            size={56}
                            className={clsx(
                                "border-2 shadow-2xl transition-transform group-hover:scale-105",
                                isCurrentUser ? 'border-brand-green' : 'border-white/20'
                            )}
                        />
                        {isCurrentUser && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand-green rounded-full border-2 border-black flex items-center justify-center">
                                <CheckCircleFilled className="text-white text-[10px]" />
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="font-black text-white text-lg tracking-tight flex items-center gap-2 italic uppercase">
                            {entry.fullName || 'Người Học'}
                            {isCurrentUser && <span className="bg-brand-green text-white text-[8px] px-2 py-0.5 rounded-full font-black tracking-widest leading-none shadow-[0_0_10px_#58cc02]">BẠN</span>}
                        </div>
                        <div className="text-[10px] text-white/60 font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                            <EnvironmentOutlined className="text-xs" />
                            {entry.region || 'SpeakVN Player'}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8 relative z-10">
                    <div className="flex flex-col items-end">
                        {sortBy === 'TOTAL_XP' && (
                            <div className="flex items-center gap-2 text-brand-green font-black text-2xl italic tracking-tighter drop-shadow-[0_0_15px_rgba(88,204,2,0.4)]">
                                <Zap size={22} className="fill-brand-green" /> {entry.totalExperience || 0} <span className="text-[10px] uppercase tracking-widest ml-0.5 opacity-50 not-italic">XP</span>
                            </div>
                        )}
                        {sortBy === 'TOTAL_STARS' && (
                            <div className="flex items-center gap-2 text-yellow-400 font-black text-2xl italic tracking-tighter drop-shadow-[0_0_15px_rgba(250,204,21,0.4)]">
                                <StarFilled /> {entry.totalStars || 0} <span className="text-[10px] uppercase tracking-widest ml-0.5 opacity-50 not-italic">SAO</span>
                            </div>
                        )}
                        {sortBy === 'CHALLENGES_COMPLETED' && (
                            <div className="flex items-center gap-2 text-blue-400 font-black text-2xl italic tracking-tighter drop-shadow-[0_0_15px_rgba(96,165,250,0.4)]">
                                <Target size={22} className="fill-blue-400" /> {entry.challengesCompleted || 0} <span className="text-[10px] uppercase tracking-widest ml-0.5 opacity-50 not-italic">BÀI</span>
                            </div>
                        )}

                        <div className="flex items-center gap-1.5 text-orange-400 text-[10px] font-black uppercase tracking-widest mt-1 opacity-60">
                            <FireFilled className="text-xs" /> {entry.currentStreakDays || 0} NGÀY HỌC
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto pb-20 pt-8 font-nunito relative z-10">
            <div className="text-center mb-12 relative">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <div className="inline-block relative mb-4">
                        <TrophyOutlined className="text-7xl text-brand-green drop-shadow-[0_0_30px_rgba(88,204,2,0.5)]" />
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                            className="absolute -inset-4 border border-dashed border-brand-green/20 rounded-full"
                        />
                    </div>
                    <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase drop-shadow-2xl leading-none">
                        Đại lộ <span className="text-brand-green">danh vọng</span>
                    </h2>
                    <p className="text-white/70 font-black text-[11px] uppercase tracking-[0.4em] mt-4">THI ĐUA CÙNG CỘNG ĐỒNG HỌC VIÊN SPEAKVN</p>
                </motion.div>
            </div>

            <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 p-4 mb-8 shadow-2xl relative overflow-hidden group">
                {/* Decorative background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-brand-green/30 to-transparent" />

                <div className="flex flex-col md:flex-row gap-4 justify-between items-center px-4 py-2">
                    <Segmented
                        options={[
                            { label: <div className="flex items-center gap-2 px-4 py-1.5 font-black uppercase text-[10px] tracking-widest"><EnvironmentOutlined /> Khu vực</div>, value: 'REGIONAL' },
                            { label: <div className="flex items-center gap-2 px-4 py-1.5 font-black uppercase text-[10px] tracking-widest"><GlobalOutlined /> Toàn cầu</div>, value: 'GLOBAL' }
                        ]}
                        value={scope}
                        onChange={(value) => setScope(value as any)}
                        size="large"
                        className="bg-white/5 p-1 leaderboard-segmented !rounded-2xl"
                    />

                    <div className="flex gap-1 items-center">
                        {scope === 'REGIONAL' && (
                            <Select
                                value={region}
                                onChange={setRegion}
                                className="leaderboard-select min-w-[140px]"
                                size="large"
                                variant="borderless"
                                dropdownStyle={{ backgroundColor: 'rgba(20, 20, 20, 0.95)', backdropFilter: 'blur(10px)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                                <Option value="NORTH"><span className="font-black text-white uppercase text-[10px] tracking-widest">Miền Bắc</span></Option>
                                <Option value="CENTRAL"><span className="font-black text-white uppercase text-[10px] tracking-widest">Miền Trung</span></Option>
                                <Option value="SOUTH"><span className="font-black text-white uppercase text-[10px] tracking-widest">Miền Nam</span></Option>
                            </Select>
                        )}
                        <div className="w-px h-6 bg-white/10 mx-2 hidden md:block" />
                        <Select
                            value={period}
                            onChange={setPeriod}
                            className="leaderboard-select min-w-[140px]"
                            size="large"
                            variant="borderless"
                            dropdownStyle={{ backgroundColor: 'rgba(20, 20, 20, 0.95)', backdropFilter: 'blur(10px)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            <Option value="DAILY"><span className="font-black text-white/80 uppercase text-[10px] tracking-widest">Hôm Nay</span></Option>
                            <Option value="WEEKLY"><span className="font-black text-white/80 uppercase text-[10px] tracking-widest">Tuần Này</span></Option>
                            <Option value="MONTHLY"><span className="font-black text-white/80 uppercase text-[10px] tracking-widest">Tháng Này</span></Option>
                            <Option value="ALL_TIME"><span className="font-black text-white/80 uppercase text-[10px] tracking-widest">Tất cả</span></Option>
                        </Select>
                        <div className="w-px h-6 bg-white/10 mx-2 hidden md:block" />
                        <Select
                            value={sortBy}
                            onChange={setSortBy}
                            className="leaderboard-select min-w-[140px]"
                            size="large"
                            variant="borderless"
                            dropdownStyle={{ backgroundColor: 'rgba(20, 20, 20, 0.95)', backdropFilter: 'blur(10px)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            <Option value="TOTAL_XP"><span className="font-black text-brand-green uppercase text-[10px] tracking-widest italic">Theo XP</span></Option>
                            <Option value="TOTAL_STARS"><span className="font-black text-yellow-400 uppercase text-[10px] tracking-widest italic">Theo Sao</span></Option>
                            <Option value="CHALLENGES_COMPLETED"><span className="font-black text-blue-400 uppercase text-[10px] tracking-widest italic">Theo Bài</span></Option>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="min-h-[500px] relative">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-80 text-white/50">
                        <Spin size="large" />
                        <div className="mt-6 font-black tracking-[0.3em] uppercase text-xs">Đang đồng bộ dữ liệu...</div>
                    </div>
                ) : data?.entries && data.entries.length > 0 ? (
                    <div>
                        {/* Current User Rank Block */}
                        {data.myRank && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mb-12 relative"
                            >
                                <div className="text-[10px] uppercase font-black text-brand-green tracking-[0.3em] mb-4 flex items-center gap-3 px-2">
                                    <div className="w-8 h-px bg-brand-green/30" />
                                    Vị trí của bạn
                                    <div className="flex-1 h-px bg-brand-green/10" />
                                </div>
                                {renderEntry(data.myRank, true)}
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            </motion.div>
                        )}

                        <div className="text-[10px] uppercase font-black text-white/50 tracking-[0.3em] mb-6 flex items-center gap-3 px-2">
                            <div className="w-8 h-px bg-white/10" />
                            Bảng tổng sắp
                            <div className="flex-1 h-px bg-white/5" />
                        </div>
                        <div className="space-y-2">
                            {data.entries.map((entry) => renderEntry(entry, entry.accountId === user?.id))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-80 bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl">
                        <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mb-6 border border-white/10">
                            <Shield size={40} className="text-white/10" />
                        </div>
                        <div className="font-black text-white/80 text-xl uppercase tracking-tighter italic">Chưa có dữ liệu xếp hạng</div>
                        <div className="text-white/60 text-xs font-medium mt-2 uppercase tracking-widest">Hãy là người đầu tiên ghi tên lên bảng vàng!</div>
                    </div>
                )}
            </div>

            <style>{`
                .leaderboard-segmented {
                    background: rgba(255, 255, 255, 0.03) !important;
                    border: 1px solid rgba(255, 255, 255, 0.05) !important;
                }
                .leaderboard-segmented .ant-segmented-item-selected {
                    background: #58cc02 !important;
                    color: white !important;
                    border-radius: 12px !important;
                    box-shadow: 0 4px 15px rgba(88, 204, 2, 0.3) !important;
                }
                .leaderboard-segmented .ant-segmented-item {
                    color: rgba(255, 255, 255, 0.7) !important;
                    transition: all 0.3s ease !important;
                }
                .leaderboard-segmented .ant-segmented-item:hover {
                    color: white !important;
                }
                .leaderboard-select .ant-select-selector {
                    color: white !important;
                    height: 48px !important;
                    display: flex !important;
                    align-items: center !important;
                }
                .leaderboard-select .ant-select-arrow {
                    color: rgba(255, 255, 255, 0.2) !important;
                }
            `}</style>
        </div>
    );
}
