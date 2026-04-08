import { useEffect, useState } from 'react'
import { Spin, Button } from 'antd'
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

export default function Dashboard() {
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
                    apiClient.get('/learner/my-badges').catch(() => null),
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
        { label: 'Bài Đã Học', value: displayUser.completedLessons || '0', icon: <ReadOutlined />, color: 'text-brand-green', bg: 'bg-green-50', border: 'border-green-100' },
    ]

    return (
        <div className="space-y-10 pb-12 font-nunito relative z-10">
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Spin size="large" />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left Column: Continue Learning & Badges */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* Welcome Back */}
                        <div className="mb-2">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase drop-shadow-2xl">
                                    Chào mừng trở lại, <span className="text-brand-green">{user?.fullName?.split(' ')[0] || 'Học viên'}</span>!
                                </h2>
                                <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.3em] mt-2">HÔM NAY BẠN MUỐN KHÁM PHÁ GÌ?</p>
                            </motion.div>
                        </div>

                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-black text-white/90 uppercase tracking-widest italic flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-brand-green rounded-full shadow-[0_0_10px_#58cc02]" />
                                    Tiếp tục bài học
                                </h3>
                            </div>
                            <motion.div
                                whileHover={{ y: -8, scale: 1.01 }}
                                className={clsx(
                                    "relative overflow-hidden bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/10 cursor-pointer shadow-2xl transition-all group",
                                    currentLesson.locked ? 'opacity-50 grayscale' : 'hover:border-white/20'
                                )}
                                onClick={() => !currentLesson.locked && navigate('/learner/roadmap')}
                            >
                                {/* Glow Effect */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/10 blur-[100px] -mr-32 -mt-32 transition-all group-hover:bg-brand-green/20" />

                                <div className="flex sm:flex-row flex-col gap-8 items-center relative z-10">
                                    <div className={clsx(
                                        "w-28 h-28 shrink-0 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all duration-500",
                                        currentLesson.locked ? 'bg-white/5 border border-white/5' : 'bg-brand-green shadow-[0_0_30px_rgba(88,204,2,0.3)] group-hover:rotate-6'
                                    )}>
                                        {currentLesson.locked ? (
                                            <LockOutlined className="text-4xl text-white/20" />
                                        ) : (
                                            <PlayCircleFilled className="text-5xl text-white group-hover:scale-110 transition-transform" />
                                        )}
                                    </div>
                                    <div className="flex-1 w-full text-center sm:text-left">
                                        <div className="text-brand-green font-black text-[10px] tracking-[.3em] uppercase mb-2">{currentLesson.description}</div>
                                        <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-4">{currentLesson.title}</h3>
                                        <p className="text-white/50 text-sm font-medium leading-relaxed mb-6">Tiếp tục chặng đường chinh phục rào cản ngôn ngữ và khám phá vẻ đẹp tâm hồn Việt.</p>

                                        <div className="flex items-center gap-6">
                                            <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${currentLesson.progress}%` }}
                                                    transition={{ duration: 1, ease: 'easeOut' }}
                                                    className="h-full bg-gradient-to-r from-brand-green to-teal-400 shadow-[0_0_15px_rgba(88,204,2,0.5)]"
                                                />
                                            </div>
                                            <span className="font-black text-white italic text-xl">{currentLesson.progress}%</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </section>

                        {/* Badges Highlights */}
                        <section>
                            <div className="flex items-center justify-between mb-6 px-1">
                                <h3 className="text-lg font-black text-white/90 uppercase tracking-widest italic flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-yellow-400 rounded-full shadow-[0_0_10px_#facc15]" />
                                    Huy hiệu mới nhất
                                </h3>
                                <Button
                                    type="text"
                                    className="text-white/40 font-black text-[10px] uppercase tracking-widest hover:text-brand-green transition-colors"
                                    onClick={() => navigate('/learner/profile')}
                                >
                                    Xem tất cả <RightOutlined className="ml-1" />
                                </Button>
                            </div>
                            {recentBadges.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                    {recentBadges.map((b, i) => (
                                        <motion.div
                                            key={b.id || i}
                                            whileHover={{ y: -10, scale: 1.02 }}
                                            className="flex flex-col items-center bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 shadow-2xl transition-all group hover:border-white/20"
                                        >
                                            <div className="relative w-24 h-24 rounded-full flex items-center justify-center mb-6 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] border border-white/10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 overflow-hidden">
                                                {b.badge?.imageUrl || b.imageUrl ? (
                                                    <img src={b.badge?.imageUrl || b.imageUrl} alt={b.badge?.name || b.name} className="w-[70%] h-[70%] object-contain filter drop-shadow-lg" />
                                                ) : (
                                                    <TrophyOutlined className="text-4xl text-yellow-500" />
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                            </div>
                                            <div className="font-black text-white text-[10px] text-center uppercase tracking-widest italic opacity-80 group-hover:opacity-100">{b.badge?.name || b.name || 'Huy hiệu'}</div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-12 text-center flex flex-col items-center shadow-2xl">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                                        <TrophyOutlined className="text-3xl text-white/20" />
                                    </div>
                                    <div className="text-white/60 font-black uppercase text-xs tracking-widest">Bạn chưa nhận huy hiệu nào</div>
                                    <p className="text-white/30 text-xs mt-2 font-medium italic">Tiếp tục học để mở khóa những danh hiệu cao quý nhất.</p>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right Column: Stats & Highlights */}
                    <div className="space-y-10">
                        {/* Stats Card */}
                        <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 p-8 shadow-2xl overflow-hidden relative group">
                            {/* Decorative Glow */}
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-green/20 blur-[60px] -ml-16 -mb-16" />

                            <h3 className="text-lg font-black text-white/90 uppercase tracking-widest italic mb-8 flex items-center justify-between">
                                Thống kê của bạn
                                <TrophyOutlined className="text-brand-green opacity-40 group-hover:scale-125 transition-transform duration-500" />
                            </h3>

                            <div className="flex flex-col gap-6">
                                {stats.map((stat, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-center p-5 rounded-[1.5rem] border border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-default group/item"
                                    >
                                        <div className={clsx(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mr-5 shadow-lg group-hover/item:scale-110 transition-all duration-300",
                                            stat.label.includes('Chuỗi') ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' : 'bg-brand-green/20 text-brand-green border border-brand-green/20'
                                        )}>
                                            {stat.icon}
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{stat.label}</div>
                                            <div className={clsx(
                                                "text-3xl font-black italic tracking-tighter",
                                                stat.label.includes('Chuỗi') ? 'text-orange-400' : 'text-brand-green'
                                            )}>
                                                {stat.value}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <Button
                                type="text"
                                block
                                className="mt-8 h-12 rounded-[1.25rem] font-black text-[10px] text-white/40 uppercase tracking-widest hover:text-white hover:bg-white/5 transition-all border border-white/5"
                                onClick={() => navigate('/learner/profile')}
                            >
                                Xem hồ sơ chi tiết
                            </Button>
                        </div>

                        {/* Extra Practice Banner */}
                        <motion.div
                            whileHover={{ y: -8, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="relative overflow-hidden bg-brand-green rounded-[2.5rem] p-8 text-white shadow-2xl cursor-pointer group"
                            onClick={() => navigate('/learner/roadmap')}
                        >
                            {/* Inner Shine Effect */}
                            <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:left-[100%] transition-all duration-1000 ease-in-out" />

                            <div className="flex justify-between items-center relative z-10">
                                <div>
                                    <div className="font-black text-2xl tracking-tighter italic uppercase">Luyện tập thêm</div>
                                    <div className="text-white/70 mt-1 font-black text-[10px] uppercase tracking-widest opacity-80">KHÁM PHÁ LỘ TRÌNH</div>
                                </div>
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner group-hover:rotate-12 transition-all duration-500 border border-white/10">
                                    <RightOutlined className="text-lg" />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </div>
    )
}
