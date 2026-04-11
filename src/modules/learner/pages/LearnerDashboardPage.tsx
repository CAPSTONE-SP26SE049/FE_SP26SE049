import { useEffect, useState } from 'react'
import { Spin, Button, Progress, Avatar } from 'antd'
import { motion } from 'framer-motion'
import {
    HeartFilled,
    FireFilled,
    ThunderboltFilled,
    PlayCircleFilled,
    CheckCircleFilled,
    ArrowRightOutlined
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

    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setLoading(true);
                setErrorMsg(null);
                // Call the new O(1) Dashboard Summary API
                const res = await apiClient.get('/learner/dashboard');
                console.log("Dashboard API Response:", res);
                if (res?.data) {
                    setDashboardData(res.data);
                } else {
                    console.warn("Dashboard API returned empty data field:", res);
                    setErrorMsg("Không có dữ liệu trả về từ máy chủ.");
                }
            } catch (err: any) {
                console.error("Dashboard error", err);
                setErrorMsg(err?.message || "Đã xảy ra lỗi khi tải dữ liệu.");
            } finally {
                setLoading(false);
            }
        };
        
        if (user) {
            loadDashboardData();
        }
    }, [user]);

    if (loading) return (
        <div className="flex justify-center items-center h-[70vh]">
            <Spin size="large" />
        </div>
    );

    if (errorMsg || !dashboardData) return (
        <div className="flex justify-center items-center h-[70vh] flex-col gap-4">
            <h3 className="text-red-500 font-bold">{errorMsg || "Dữ liệu không khả dụng"}</h3>
            <Button onClick={() => window.location.reload()}>Tải lại trang</Button>
        </div>
    );

    const { currentLesson, stats, dailyQuests, skillData } = dashboardData;

    return (
        <div className="w-full h-full text-[#202124] animate-in fade-in duration-500 pb-12">
            
            {/* Dashboard Grid Container: 40% Left, 60% Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* ---------------- LEFT COLUMN (40%) ---------------- */}
                <div className="lg:col-span-5 flex flex-col gap-8">
                    
                    {/* Hero Resume Card */}
                    <motion.div 
                        whileHover={{ y: -4 }}
                        className="bg-gradient-to-br from-[#00897B] to-[#00695C] rounded-3xl p-8 text-white shadow-xl shadow-[#00897B]/20 overflow-hidden relative"
                    >
                        {/* Decorative Background Elements */}
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl mix-blend-overlay"></div>
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl mix-blend-overlay"></div>
                        
                        <div className="relative z-10">
                            <h2 className="text-white/80 font-bold uppercase tracking-widest text-xs mb-8 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#A7FFEB] animate-pulse"></span>
                                Học tiếp ngay
                            </h2>
                            
                            <h3 className="text-3xl font-black italic tracking-tight mb-2 leading-tight">
                                {currentLesson?.title || 'Đang tải...'}
                            </h3>
                            <p className="text-white/80 font-medium mb-10 text-sm">
                                {currentLesson?.levelName ? `Chặng: ${currentLesson.levelName}` : 'Hành trình'} • {currentLesson?.description || '...'}
                            </p>
                            
                            <div className="flex items-end justify-between mb-2">
                                <span className="font-bold text-sm">Tiến độ chặng</span>
                                <span className="font-black text-xl italic">{currentLesson?.progress || 0}%</span>
                            </div>
                            <Progress 
                                percent={currentLesson?.progress || 0} 
                                showInfo={false} 
                                strokeColor="#A7FFEB" 
                                trailColor="rgba(255,255,255,0.2)" 
                                className="!m-0 mb-8"
                            />
                            
                            {currentLesson?.isLocked ? (
                                <div className="w-full bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl px-5 py-4 text-center">
                                    <div className="text-2xl mb-1">🔒</div>
                                    <p className="font-bold text-white text-sm mb-1">Chặng này đang bị khóa</p>
                                    <p className="text-white/80 text-xs">
                                        Cần <span className="font-black text-[#A7FFEB]">{currentLesson.starsNeeded} ⭐</span> từ chặng trước
                                        &nbsp;(hiện có: <span className="font-black text-[#A7FFEB]">{currentLesson.currentStars ?? 0} ⭐</span>)
                                    </p>
                                    <Button 
                                        type="default"
                                        size="large"
                                        onClick={() => navigate('/learner/roadmap')}
                                        className="w-full mt-3 bg-white text-[#00695C] hover:bg-[#F0F2F5] !h-12 rounded-2xl font-black text-sm border-none"
                                    >
                                        Xem lộ trình →
                                    </Button>
                                </div>
                            ) : (
                                <Button 
                                    type="primary" 
                                    size="large"
                                    onClick={() => {
                                        if (currentLesson?.id && currentLesson.id !== "1") {
                                            navigate(`/learner/quiz/${currentLesson.id}`);
                                        } else {
                                            navigate('/learner/roadmap');
                                        }
                                    }}
                                    className="w-full bg-white text-[#00695C] hover:bg-[#F0F2F5] hover:text-[#004D40] !h-14 rounded-2xl font-black text-base shadow-lg border-none flex items-center justify-center gap-2"
                                >
                                    <PlayCircleFilled className="text-xl" /> Tiếp tục bài học
                                </Button>
                            )}
                        </div>
                    </motion.div>

                    {/* Quick Profile / Level Card */}
                    <div className="bg-white rounded-3xl p-6 border border-[#E0E3E7] shadow-sm flex items-center gap-5">
                        <div className="relative">
                            <Avatar src={user?.avatar} size={64} className="border-4 border-[#E0F2F1] shadow-sm" />
                            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-[#FB8C00] to-[#E65100] text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-sm">
                                LV.12
                            </div>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-black text-lg text-[#202124] leading-tight truncate">{user?.fullName || 'Học viên'}</h4>
                            <p className="text-xs font-bold text-[#5F6368] uppercase tracking-widest mt-1">Học giả thanh lịch</p>
                        </div>
                    </div>

                </div>

                {/* ---------------- RIGHT COLUMN (60%) ---------------- */}
                <div className="lg:col-span-7 flex flex-col gap-8">
                    
                    {/* Quick Gamification Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-2xl p-5 border border-[#E0E3E7] shadow-sm flex flex-col items-center justify-center gap-2 hover:-translate-y-1 transition-transform cursor-default">
                            <div className="w-10 h-10 rounded-full bg-[#FFF3E0] flex items-center justify-center">
                                <FireFilled className="text-[#E65100] text-xl" />
                            </div>
                            <div className="text-xl font-black italic text-[#202124]">{stats?.streakDays || 0}</div>
                            <div className="text-[10px] uppercase font-bold text-[#5F6368] tracking-widest">Streak Ngày</div>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-[#E0E3E7] shadow-sm flex flex-col items-center justify-center gap-2 hover:-translate-y-1 transition-transform cursor-default">
                            <div className="w-10 h-10 rounded-full bg-[#E0F2F1] flex items-center justify-center">
                                <ThunderboltFilled className="text-[#00897B] text-xl" />
                            </div>
                            <div className="text-xl font-black italic text-[#202124]">{stats?.xp || 0}</div>
                            <div className="text-[10px] uppercase font-bold text-[#5F6368] tracking-widest">Kinh nghiệm</div>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-[#E0E3E7] shadow-sm flex flex-col items-center justify-center gap-2 hover:-translate-y-1 transition-transform cursor-default">
                            <div className="w-10 h-10 rounded-full bg-[#FCE4EC] flex items-center justify-center">
                                <HeartFilled className="text-[#D81B60] text-xl" />
                            </div>
                            <div className="text-xl font-black italic text-[#202124]">{stats?.lives || 0}</div>
                            <div className="text-[10px] uppercase font-bold text-[#5F6368] tracking-widest">Mạng (Lives)</div>
                        </div>
                    </div>

                    {/* Daily Quests (Gamified) */}
                    <div className="bg-white rounded-3xl p-8 border border-[#E0E3E7] shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-black uppercase tracking-widest text-[#202124]">
                                NHIỆM VỤ HÔM NAY
                            </h2>
                            <span className="text-xs font-bold text-[#00897B] px-3 py-1 bg-[#E0F2F1] rounded-full">
                                Hoàn thành {(dailyQuests || []).filter((q: any) => q.done).length}/{(dailyQuests || []).length}
                            </span>
                        </div>
                        
                        <div className="flex flex-col gap-4">
                            {(dailyQuests || []).map((quest: any, idx: number) => (
                                <div key={idx} className={clsx(
                                    "p-4 rounded-2xl border-2 flex items-center gap-4 transition-all",
                                    quest.done ? "bg-[#F8F9FA] border-transparent opacity-60" : "bg-white border-[#E0E3E7] hover:border-[#00897B] cursor-pointer"
                                )}>
                                    <div className={clsx(
                                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2",
                                        quest.done ? "bg-[#00897B] border-[#00897B] text-white" : "bg-[#F8F9FA] border-[#E0E3E7] text-[#E0E3E7]"
                                    )}>
                                        <CheckCircleFilled className={quest.done ? "text-sm" : "hidden"} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className={clsx("font-bold text-sm mb-1", quest.done ? "line-through text-[#5F6368]" : "text-[#202124]")}>
                                            {quest.title}
                                        </h4>
                                        {!quest.done && quest.progress !== undefined && (
                                            <Progress percent={quest.progress} showInfo={false} size="small" strokeColor="#00897B" trailColor="#E0E3E7" className="!m-0 w-1/2" />
                                        )}
                                    </div>
                                    <div className="font-black text-[#FB8C00] text-sm italic bg-[#FFF3E0] px-3 py-1 rounded-full">
                                        {quest.xp}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Personal Skill Radar Chart */}
                    <div className="bg-white rounded-3xl p-8 border border-[#E0E3E7] shadow-sm flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1 w-full text-center md:text-left">
                            <h2 className="text-sm font-black uppercase tracking-widest text-[#202124] mb-3">
                                PHÂN TÍCH NĂNG LỰC
                            </h2>
                            <p className="text-sm text-[#5F6368] font-medium leading-relaxed mb-6">
                                Biểu đồ đa chiều thể hiện sự tiến bộ của bạn qua quá trình rèn luyện trên nền tảng. Kỹ năng Phát âm đang là điểm mạnh nhất!
                            </p>
                            <Button type="link" className="text-[#00897B] font-bold p-0 uppercase tracking-widest text-xs flex items-center gap-1">
                                Xem chi tiết <ArrowRightOutlined />
                            </Button>
                        </div>
                        <div className="w-[240px] h-[220px] shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={skillData}>
                                    <PolarGrid stroke="#E0E3E7" />
                                    <PolarAngleAxis 
                                        dataKey="subject" 
                                        tick={{ fill: '#5F6368', fontSize: 11, fontWeight: 700 }} 
                                    />
                                    <Radar 
                                        name="Level" 
                                        dataKey="val" 
                                        stroke="#00897B" 
                                        strokeWidth={3}
                                        fill="#00897B" 
                                        fillOpacity={0.2} 
                                    />
                                    <Radar 
                                        name="Mục tiêu" 
                                        dataKey="fullMark" 
                                        stroke="transparent" 
                                        fill="transparent" 
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
