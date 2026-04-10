import { useEffect, useState } from 'react'
import { Spin, Button, Progress, Avatar } from 'antd'
import { motion } from 'framer-motion'
import {
    PlayCircleFilled,
    RightOutlined,
    LockOutlined,
    TrophyOutlined,
    FireOutlined,
    ReadOutlined,
    RiseOutlined,
    CheckCircleFilled,
    ClockCircleOutlined
} from '@ant-design/icons'
import { useAuth } from '../../../core/auth/AuthContext'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import apiClient from '../../../services/apiClient'
import { learnerService } from '../services/learnerService'
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    ResponsiveContainer
} from 'recharts';

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

    const skillData = [
        { subject: 'Nghe', A: 85, fullMark: 100 },
        { subject: 'Nói', A: 70, fullMark: 100 },
        { subject: 'Phát âm', A: 90, fullMark: 100 },
        { subject: 'Ngữ pháp', A: 65, fullMark: 100 },
        { subject: 'Từ vựng', A: 80, fullMark: 100 },
    ];

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setLoading(true);
                const [meRes, badgesRes, dialectsRes] = await Promise.all([
                    apiClient.get('/users/me').catch(() => null),
                    apiClient.get('/learner/my-badges').catch(() => null),
                    learnerService.getDialects().catch(() => [])
                ]);

                if (meRes?.data) setStatsData(meRes.data);
                if (badgesRes?.data?.data) setRecentBadges(badgesRes.data.data.slice(0, 4));

                const userRegion = (meRes?.data?.region || user?.region || '').toUpperCase();
                const matchedDialect = dialectsRes.find((d: any) =>
                    d.name?.toUpperCase() === userRegion ||
                    d.name?.toLowerCase().includes(userRegion.toLowerCase()) ||
                    (userRegion === 'NORTH' && d.name?.includes('Bắc')) ||
                    (userRegion === 'SOUTH' && d.name?.includes('Nam'))
                ) ?? dialectsRes[0];

                if (matchedDialect) {
                    const levelData = await learnerService.getLevels(matchedDialect.id).catch(() => []);
                    const completedCount = levelData.filter((l: any) => l.isCompleted).length;
                    setStatsData((prev: any) => ({ ...prev, completedLessons: completedCount }));

                    const activeLevel = levelData.find((lvl: any) => !lvl.isCompleted && !lvl.isLocked);
                    if (activeLevel) {
                        setCurrentLesson({
                            title: activeLevel.name,
                            description: `${matchedDialect.name} • Màn ${activeLevel.levelOrder || 1}`,
                            progress: activeLevel.starsEarned ? Math.round((activeLevel.starsEarned / 3) * 100) : 0,
                            id: activeLevel.id,
                            locked: false
                        });
                    }
                }
            } catch (err) {
                console.error("Dashboard error", err);
            } finally {
                setLoading(false);
            }
        };
        loadDashboardData();
    }, [user]);

    if (loading) return (
        <div className="flex justify-center items-center h-[70vh]">
            <Spin size="large" />
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Title */}
            <div>
                <h1 className="text-3xl font-extrabold text-[#202124] tracking-tight mb-2">
                    Chào mừng trở lại, {user?.fullName?.split(' ')[0] || 'Member'}! 👋
                </h1>
                <p className="text-[#5F6368] font-medium italic">Tiếp tục hành trình chinh phục tiếng Việt ngay hôm nay nào.</p>
            </div>

            {/* Top Grid: Skills & Current Lesson */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Skill Profile Card */}
                <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-[#E0E3E7] p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-lg font-bold text-[#202124]">Hồ sơ kỹ năng</h2>
                        <RiseOutlined className="text-[#00897B]" />
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                                <PolarGrid stroke="#E0E3E7" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#5F6368', fontSize: 12, fontWeight: 600 }} />
                                <Radar
                                    name="Năng lực"
                                    dataKey="A"
                                    stroke="#00897B"
                                    fill="#00897B"
                                    fillOpacity={0.5}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-center text-xs text-[#5F6368] mt-4 font-medium italic">
                        Bạn đang tiến bộ nhanh nhất ở kỹ năng **Phát âm**.
                    </p>
                </div>

                {/* Continue Learning Hero Card */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-[#E0E3E7] overflow-hidden flex flex-col">
                    <div className="p-8 flex flex-col md:flex-row gap-8 flex-1">
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-[#E0F2F1] rounded-2xl flex items-center justify-center shrink-0">
                            <PlayCircleFilled className="text-5xl md:text-6xl text-[#00897B]" />
                        </div>
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F0FE] text-[#1967D2] text-[10px] font-bold uppercase tracking-wider mb-3">
                                <ClockCircleOutlined /> Đang trong quá trình
                            </div>
                            <h2 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{currentLesson.description}</h2>
                            <h3 className="text-2xl font-extrabold text-[#202124] mb-4">{currentLesson.title}</h3>
                            <p className="text-[#5F6368] text-sm mb-6 leading-relaxed">Tiếp tục thực hành các câu giao tiếp cơ bản với giọng Miền để mở khóa bài học tiếp theo.</p>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-bold text-[#202124]">Tiến trình bài học</span>
                                    <span className="text-sm font-black text-[#00897B] italic">{currentLesson.progress}%</span>
                                </div>
                                <Progress 
                                    percent={currentLesson.progress} 
                                    showInfo={false} 
                                    strokeColor="#00897B" 
                                    trailColor="#F1F3F4"
                                    className="!m-0"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="px-8 py-5 bg-[#F8F9FA] border-t border-[#E0E3E7] flex justify-end">
                        <Button 
                            type="primary" 
                            size="large"
                            onClick={() => navigate('/learner/roadmap')}
                            className="bg-[#00897B] hover:bg-[#00796B] !h-12 border-none rounded-xl font-bold px-8 shadow-md"
                        >
                            Học tiếp ngay <RightOutlined className="ml-2 text-xs" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: 'Streak hiện tại', value: statsData.currentStreakDays || '0', unit: 'Ngày', icon: <FireOutlined />, color: 'text-orange-600', bg: 'bg-orange-50' },
                    { label: 'Bài đã hoàn thành', value: statsData.completedLessons || '0', unit: 'Bài học', icon: <CheckCircleFilled />, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Huy hiệu sở hữu', value: recentBadges.length || '0', unit: 'Huy hiệu', icon: <TrophyOutlined />, color: 'text-yellow-600', bg: 'bg-yellow-50' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-[#E0E3E7] flex items-center gap-5">
                        <div className={clsx("w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-inner", stat.bg, stat.color)}>
                            {stat.icon}
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-[#5F6368] uppercase tracking-widest">{stat.label}</div>
                            <div className="text-2xl font-black text-[#202124] italic tracking-tight">
                                {stat.value} <span className="text-sm font-bold opacity-30 not-italic">{stat.unit}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Lower Grid: Journey & Progress Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {/* My Journey Timeline */}
               <div className="bg-white rounded-2xl shadow-sm border border-[#E0E3E7] p-8">
                   <h2 className="text-lg font-bold text-[#202124] mb-8">Lộ trình của tôi</h2>
                   <div className="space-y-8 relative">
                       <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-100" />
                       {[
                           { title: 'Ngữ điệu cơ bản', status: 'done', desc: 'Đã hoàn thành lúc 10/03/2026' },
                           { title: 'Từ vựng thông dụng', status: 'current', desc: 'Đang diễn ra • 85%' },
                           { title: 'Giao tiếp hằng ngày', status: 'locked', desc: 'Cần đạt trình độ sơ cấp' }
                       ].map((item, i) => (
                           <div key={i} className="flex gap-6 relative z-10">
                               <div className={clsx(
                                   "w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm shrink-0",
                                   item.status === 'done' ? 'bg-[#E8F5E9] text-[#2E7D32]' : 
                                   item.status === 'current' ? 'bg-[#E3F2FD] text-[#1976D2]' : 'bg-gray-100 text-gray-400'
                               )}>
                                   {item.status === 'done' ? <CheckCircleFilled /> : i + 1}
                               </div>
                               <div>
                                   <div className={clsx("font-bold text-sm mb-0.5", item.status === 'locked' ? 'text-gray-300' : 'text-[#202124]')}>{item.title}</div>
                                   <div className="text-[10px] uppercase font-bold text-[#5F6368] tracking-widest">{item.desc}</div>
                               </div>
                           </div>
                       ))}
                   </div>
               </div>

               {/* Detailed Progress Overiew */}
               <div className="bg-white rounded-2xl shadow-sm border border-[#E0E3E7] p-8">
                   <h2 className="text-lg font-bold text-[#202124] mb-8">Tổng quan tiến độ</h2>
                   <div className="space-y-6">
                       {[
                           { label: 'Đọc hiểu', value: 82, color: '#1967D2' },
                           { label: 'Viết', value: 45, color: '#FB8C00' },
                           { label: 'Nghe', value: 95, color: '#00897B' },
                       ].map((item, i) => (
                           <div key={i}>
                               <div className="flex justify-between items-center mb-2">
                                   <span className="text-xs font-bold text-[#202124] uppercase tracking-wider">{item.label}</span>
                                   <span className="text-xs font-black text-[#5F6368]">{item.value}%</span>
                               </div>
                               <Progress 
                                   percent={item.value} 
                                   strokeColor={item.color} 
                                   showInfo={false} 
                                   size="small"
                                   trailColor="#F8F9FA"
                               />
                           </div>
                       ))}
                   </div>
                   <div className="mt-8 pt-8 border-t border-gray-50 flex items-center gap-4">
                        <Avatar.Group maxCount={3}>
                            <Avatar src="https://i.pravatar.cc/150?u=1" />
                            <Avatar src="https://i.pravatar.cc/150?u=2" />
                            <Avatar src="https://i.pravatar.cc/150?u=3" />
                        </Avatar.Group>
                        <span className="text-xs font-medium text-[#5F6368]">
                            Bạn và 12 người khác đang học cùng cấp độ!
                        </span>
                   </div>
               </div>
            </div>
        </div>
    );
}
