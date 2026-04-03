import { useEffect, useState } from 'react';

import { Card, Select, Avatar, Spin, Typography, Tag, Segmented } from 'antd';
import { TrophyOutlined, FireFilled, StarFilled, GlobalOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { Shield, Zap, Target } from 'lucide-react';
import apiClient from '../../../services/apiClient';
import { useAuth } from '../../../core/auth/AuthContext';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;
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

    const getRankColor = (rank: number) => {
        switch (rank) {
            case 1:
                return 'text-yellow-500 bg-yellow-50 border-yellow-200';
            case 2:
                return 'text-gray-500 bg-gray-50 border-gray-200';
            case 3:
                return 'text-orange-600 bg-orange-50 border-orange-200';
            default:
                return 'text-gray-400 bg-white border-gray-100';
        }
    };

    const renderEntry = (entry: LeaderboardEntry, isCurrentUser = false) => {
        const isTop3 = entry.rankPosition <= 3;

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={entry.accountId}
                className={`flex items-center justify-between p-4 mb-3 rounded-2xl border-2 transition-all ${isCurrentUser
                    ? 'border-brand-blue bg-blue-50/50 shadow-sm'
                    : isTop3
                        ? 'border-yellow-200 bg-white shadow-sm'
                        : 'border-transparent hover:border-gray-100 hover:bg-gray-50'
                    }`}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 flex items-center justify-center font-black text-lg rounded-full border-2 ${getRankColor(entry.rankPosition)}`}>
                        {getRankIcon(entry.rankPosition)}
                    </div>

                    <Avatar
                        src={entry.avatarUrl}
                        size={48}
                        className="bg-brand-blue/10 border-2 border-white shadow-sm"
                    />

                    <div>
                        <div className="font-extrabold text-gray-800 text-base">
                            {entry.fullName || 'Người Học'} {isCurrentUser && <Tag color="blue" className="ml-2 rounded-xl text-xs border-none font-bold">BẠN</Tag>}
                        </div>
                        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                            {entry.region || 'SpeakVN Player'}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                    {sortBy === 'TOTAL_XP' && (
                        <div className="flex items-center gap-1.5 text-brand-yellow font-black text-lg">
                            <Zap size={20} /> {entry.totalExperience || 0} XP
                        </div>
                    )}
                    {sortBy === 'TOTAL_STARS' && (
                        <div className="flex items-center gap-1.5 text-yellow-500 font-black text-lg">
                            <StarFilled /> {entry.totalStars || 0} Sao
                        </div>
                    )}
                    {sortBy === 'CHALLENGES_COMPLETED' && (
                        <div className="flex items-center gap-1.5 text-green-500 font-black text-lg">
                            <Target size={20} /> {entry.challengesCompleted || 0} Bài
                        </div>
                    )}

                    <div className="flex items-center gap-1 text-orange-500 text-xs font-bold bg-orange-50 px-2 py-0.5 rounded-lg">
                        <FireFilled /> {entry.currentStreakDays || 0}
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="max-w-3xl mx-auto pb-12 pt-6">
            <div className="text-center mb-8">
                <TrophyOutlined className="text-5xl text-brand-blue mb-4 block" />
                <Title level={2} style={{ color: '#1f2937', fontWeight: 800, margin: 0 }}>
                    Bảng Xếp Hạng
                </Title>
                <Text className="text-gray-500 font-medium text-base">
                    Thi đua cùng cộng đồng học viên SpeakVN
                </Text>
            </div>

            <Card className="rounded-3xl border-none shadow-sm mb-6" bodyStyle={{ padding: '24px' }}>
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50 p-3 rounded-2xl">
                    <Segmented
                        options={[
                            { label: <div className="flex items-center gap-2 px-2 py-1 font-bold"><EnvironmentOutlined /> Khu Vực</div>, value: 'REGIONAL' },
                            { label: <div className="flex items-center gap-2 px-2 py-1 font-bold"><GlobalOutlined /> Toàn Cầu</div>, value: 'GLOBAL' }
                        ]}
                        value={scope}
                        onChange={(value) => setScope(value as any)}
                        size="large"
                        className="p-1 w-full md:w-auto"
                    />

                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                        {scope === 'REGIONAL' && (
                            <Select
                                value={region}
                                onChange={setRegion}
                                className="w-32"
                                size="large"
                                variant="borderless"
                                dropdownStyle={{ borderRadius: 12 }}
                            >
                                <Option value="NORTH"><span className="font-bold">Miền Bắc</span></Option>
                                <Option value="CENTRAL"><span className="font-bold">Miền Trung</span></Option>
                                <Option value="SOUTH"><span className="font-bold">Miền Nam</span></Option>
                            </Select>
                        )}
                        <Select
                            value={period}
                            onChange={setPeriod}
                            className="w-36"
                            size="large"
                            variant="borderless"
                        >
                            <Option value="DAILY"><span className="font-bold text-gray-600">Hôm Nay</span></Option>
                            <Option value="WEEKLY"><span className="font-bold text-gray-600">Tuần Này</span></Option>
                            <Option value="MONTHLY"><span className="font-bold text-gray-600">Tháng Này</span></Option>
                            <Option value="ALL_TIME"><span className="font-bold text-gray-600">Mọi Thời Đại</span></Option>
                        </Select>

                        <Select
                            value={sortBy}
                            onChange={setSortBy}
                            className="w-36"
                            size="large"
                            variant="borderless"
                        >
                            <Option value="TOTAL_XP"><span className="font-bold text-yellow-600">Theo XP</span></Option>
                            <Option value="TOTAL_STARS"><span className="font-bold text-yellow-500">Theo Sao</span></Option>
                            <Option value="CHALLENGES_COMPLETED"><span className="font-bold text-green-600">Bài Tập</span></Option>
                        </Select>
                    </div>
                </div>
            </Card>

            <div className="bg-white rounded-3xl p-6 shadow-sm min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Spin size="large" />
                        <div className="mt-4 font-bold tracking-wide uppercase">Đang tải dữ liệu...</div>
                    </div>
                ) : data?.entries && data.entries.length > 0 ? (
                    <div>
                        {/* Current User Rank Block (Sticky-ish to top of results) */}
                        {data.myRank && (
                            <div className="mb-6 pb-6 border-b-2 border-gray-100 border-dashed">
                                <div className="text-xs uppercase font-extrabold text-brand-blue tracking-widest mb-3 px-2">Vị Trí Của Bạn</div>
                                {renderEntry(data.myRank, true)}
                            </div>
                        )}

                        <div className="text-xs uppercase font-extrabold text-gray-400 tracking-widest mb-3 px-2">Xếp Hạng Chung</div>
                        {data.entries.map((entry) => renderEntry(entry, entry.accountId === user?.id))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Shield size={32} className="text-gray-300" />
                        </div>
                        <div className="font-bold text-gray-500 text-lg">Chưa có dữ liệu xếp hạng</div>
                        <div className="text-gray-400">Hãy là người đầu tiên ghi danh!</div>
                    </div>
                )}
            </div>
        </div>
    );
}
