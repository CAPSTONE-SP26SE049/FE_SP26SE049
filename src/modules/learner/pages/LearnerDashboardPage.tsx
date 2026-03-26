import { useEffect, useState } from 'react'
import { Typography, Progress, Card, Button, Spin } from 'antd'
import { motion } from 'framer-motion'
import {
    TrophyOutlined,
    FireOutlined,
    ReadOutlined,
    PlayCircleFilled,
    RightOutlined,
    LockOutlined
} from '@ant-design/icons'
import { useAuth } from '../../../core/auth/AuthContext'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import apiClient from '../../../services/apiClient'
import { learnerService } from '../services/learnerService'

const { Title, Text } = Typography

export default function LearnerDashboardPage() {
    const { session } = useAuth()
    const navigate = useNavigate()

    const user = session?.user

    const [statsData, setStatsData] = useState<any>({});
    const [currentLesson, setCurrentLesson] = useState<any>({
        title: 'Đang tải...',
        description: 'Vui lòng chờ giây lát.',
        progress: 0,
        id: null,
        locked: false
    });
    const [recentBadges, setRecentBadges] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setLoading(true);
                // 1. Lấy dữ liệu user mới nhất và huy hiệu
                const [meRes, badgesRes, dialectsRes] = await Promise.all([
                    apiClient.get('/users/me').catch(() => null),
                    apiClient.get('/badges/my-badges').catch(() => null),
                    learnerService.getDialects().catch(() => [])
                ]);

                if (meRes?.data) {
                    setStatsData(meRes.data);
                }

                if (badgesRes?.data?.data) {
                    setRecentBadges(badgesRes.data.data.slice(0, 3)); // Lấy top 3 badges
                }

                // 2. Tìm bài học hiện tại dựa trên region
                const userRegion = (meRes?.data?.region || user?.region || '').toUpperCase();
                const matchedDialect = dialectsRes.find((d: any) =>
                    d.name?.toUpperCase() === userRegion ||
                    d.name?.toLowerCase().includes(userRegion.toLowerCase()) ||
                    (userRegion === 'NORTH' && (d.name?.includes('Bắc') || d.name?.toUpperCase() === 'NORTH')) ||
                    (userRegion === 'CENTRAL' && (d.name?.includes('Trung') || d.name?.toUpperCase() === 'CENTRAL')) ||
                    (userRegion === 'SOUTH' && (d.name?.includes('Nam') || d.name?.toUpperCase() === 'SOUTH')) ||
                    (userRegion === 'BAC' && (d.name?.includes('Bắc') || d.name?.toUpperCase() === 'NORTH')) ||
                    (userRegion === 'TRUNG' && (d.name?.includes('Trung') || d.name?.toUpperCase() === 'CENTRAL')) ||
                    (userRegion === 'NAM' && (d.name?.includes('Nam') || d.name?.toUpperCase() === 'SOUTH'))
                // Fallback: nếu không match, lấy dialect đầu tiên
                ) ?? dialectsRes[0];

                if (matchedDialect) {
                    const levelData = await learnerService.getLevels(matchedDialect.id).catch(() => []);
                    const completedCount = levelData.filter((l: any) => l.isCompleted).length;
                    
                    setStatsData((prev: any) => ({ ...prev, completedLessons: completedCount }));

                    const activeLevel = levelData.find((lvl: any) => !lvl.isCompleted && !lvl.isLocked);
                    
                    if (activeLevel) {
                        setCurrentLesson({
                            title: activeLevel.name,
                            description: `Bài học • Màn ${activeLevel.levelOrder || 1}`,
                            progress: activeLevel.starsEarned ? Math.round((activeLevel.starsEarned / 3) * 100) : 0,
                            id: activeLevel.id,
                            locked: false
                        });
                    } else if (levelData.length > 0) {
                        // All completed
                        setCurrentLesson({
                            title: 'Đã hoàn thành lộ trình!',
                            description: 'Tuyệt vời, bạn đã vượt qua tất cả!',
                            progress: 100,
                            id: null,
                            locked: false
                        });
                    } else {
                        setCurrentLesson({
                            title: 'Chưa có bài học',
                            description: 'Lộ trình đang được cập nhật.',
                            progress: 0,
                            id: null,
                            locked: true
                        });
                    }
                } else {
                    // Không tìm được dialect nào — reset về nội dung rõ ràng
                    setCurrentLesson({
                        title: 'Bắt đầu lộ trình',
                        description: 'Chọn giọng miền từ trang Lộ Trình.',
                        progress: 0,
                        id: null,
                        locked: false
                    });
                }
            } catch (err) {
                console.error("Dashboard error", err);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [user]);

    const displayUser = { ...user, ...statsData };

    const stats = [
        { label: 'Chuỗi Ngày Học', value: displayUser.currentStreakDays || displayUser.streak || '0', icon: <FireOutlined />, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
        { label: 'Tổng Điểm XP', value: displayUser.totalExperience || displayUser.totalXp || '0', icon: <TrophyOutlined />, color: 'text-brand-blue', bg: 'bg-blue-50', border: 'border-blue-100' },
        { label: 'Bài Đã Học', value: displayUser.completedLessons || '0', icon: <ReadOutlined />, color: 'text-brand-green', bg: 'bg-green-50', border: 'border-green-100' },
    ]

    return (
        <div className="space-y-6 pb-4">

            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <Spin size="large" tip="Đang tải dữ liệu của bạn..." />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Continue Learning & Badges */}
                    <div className="lg:col-span-2 space-y-8">
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#4b4b4b' }}>Tiếp tục bài học</Title>
                            </div>
                            <motion.div
                                whileHover={{ y: -4 }}
                                className={clsx("bg-white rounded-3xl p-6 border-b-[6px] border border-gray-100 cursor-pointer shadow-sm transition-all group", currentLesson.locked ? 'border-b-gray-200 opacity-80' : 'border-b-gray-200 hover:border-b-brand-green')}
                                onClick={() => !currentLesson.locked && navigate('/learner/roadmap')}
                            >
                                <div className="flex sm:flex-row flex-col gap-6 items-center">
                                    <div className={clsx("w-24 h-24 shrink-0 rounded-full flex items-center justify-center border-4", currentLesson.locked ? 'bg-gray-100 border-gray-200' : 'bg-brand-green/10 border-brand-green/20')}>
                                        {currentLesson.locked ? (
                                            <LockOutlined className="text-4xl text-gray-400" />
                                        ) : (
                                            <PlayCircleFilled className="text-4xl text-brand-green group-hover:scale-110 transition-transform" />
                                        )}
                                    </div>
                                    <div className="flex-1 w-full text-center sm:text-left">
                                        <div className="text-brand-green font-bold text-sm tracking-wider uppercase mb-1">{currentLesson.description}</div>
                                        <Title level={3} style={{ margin: 0, color: '#4b4b4b', fontWeight: 800 }}>{currentLesson.title}</Title>
                                        <Text className="text-gray-500 mt-1 block">Tiếp tục chặng đường chinh phục rào cản ngôn ngữ của bạn.</Text>

                                        <div className="mt-4 flex items-center gap-4">
                                            <Progress
                                                percent={currentLesson.progress}
                                                strokeColor="#58cc02"
                                                trailColor="#f3f4f6"
                                                showInfo={false}
                                                className="flex-1"
                                            />
                                            <span className="font-bold text-gray-500">{currentLesson.progress}%</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </section>

                        {/* Badges Highlights */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#4b4b4b' }}>Huy hiệu nổi bật</Title>
                                <Button type="text" className="text-gray-400 font-bold hover:text-brand-blue" onClick={() => navigate('/learner/profile')}>Xem tất cả</Button>
                            </div>
                            {recentBadges.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {recentBadges.map((b, i) => (
                                        <motion.div key={b.id || i} whileHover={{ y: -4 }} className="flex flex-col items-center bg-white p-6 rounded-3xl border-2 border-yellow-400 shadow-sm transition-shadow hover:shadow-lg">
                                            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 bg-brand-yellow text-yellow-700 overflow-hidden shadow-inner">
                                                {b.badge?.imageUrl || b.imageUrl ? <img src={b.badge?.imageUrl || b.imageUrl} alt={b.badge?.name || b.name} className="w-full h-full object-cover" /> : <TrophyOutlined style={{fontSize: 28}} />}
                                            </div>
                                            <div className="font-extrabold text-gray-700 text-sm text-center line-clamp-2">{b.badge?.name || b.name || 'Huy hiệu'}</div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-gray-50 border border-gray-100 rounded-3xl p-8 text-center flex flex-col items-center">
                                    <TrophyOutlined className="text-4xl text-gray-300 mb-4" />
                                    <div className="text-gray-500 font-bold">Bạn chưa nhận huy hiệu nào</div>
                                    <div className="text-gray-400 text-sm mt-1">Hãy bắt đầu bài học lộ trình để sưu tập danh hiệu nhé!</div>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right Column: Stats & Highlights */}
                    <div className="space-y-6">
                        <Card className="rounded-3xl border-gray-100 shadow-sm overflow-hidden" bodyStyle={{ padding: '24px' }}>
                            <Title level={4} style={{ margin: 0, marginBottom: 20, fontWeight: 800, color: '#4b4b4b' }}>
                                Thống kê của bạn
                            </Title>
                            <div className="flex flex-col gap-4">
                                {stats.map((stat, i) => (
                                    <div key={i} className={clsx("flex items-center p-4 rounded-2xl border bg-white", stat.border)}>
                                        <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center text-xl mr-4", stat.bg, stat.color)}>
                                            {stat.icon}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">{stat.label}</div>
                                            <div className={clsx("text-2xl font-extrabold", stat.color)}>{stat.value}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Button
                                type="default"
                                block
                                className="mt-6 h-12 rounded-xl font-bold text-gray-500 hover:text-gray-900 border-gray-200"
                                onClick={() => navigate('/learner/profile')}
                            >
                                Xem Hồ Sơ Chi Tiết
                            </Button>
                        </Card>

                        <motion.div
                            whileHover={{ y: -4, scale: 1.02 }}
                            className="bg-brand-yellow rounded-3xl p-6 text-white shadow-lg cursor-pointer flex justify-between items-center"
                            onClick={() => navigate('/learner/roadmap')}
                        >
                            <div>
                                <div className="font-extrabold text-xl">Luyện tập thêm</div>
                                <div className="text-yellow-100 mt-1 font-medium">Bản đồ lộ trình</div>
                            </div>
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <RightOutlined />
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </div>
    )
}
