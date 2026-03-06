import { Typography, Progress, Card, Button } from 'antd'
import { motion } from 'framer-motion'
import {
    TrophyOutlined,
    FireOutlined,
    ReadOutlined,
    PlayCircleFilled,
    RightOutlined
} from '@ant-design/icons'
import { useAuth } from '../../../core/auth/AuthContext'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'

const { Title, Text } = Typography

export default function LearnerDashboardPage() {
    const { session } = useAuth()
    const navigate = useNavigate()

    const user = session?.user

    const stats = [
        { label: 'Chuỗi Ngày Học', value: user?.streak || '0', icon: <FireOutlined />, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
        { label: 'Tổng Điểm XP', value: user?.totalXp || '0', icon: <TrophyOutlined />, color: 'text-brand-blue', bg: 'bg-blue-50', border: 'border-blue-100' },
        { label: 'Bài Đã Học', value: user?.completedLessons || '0', icon: <ReadOutlined />, color: 'text-brand-green', bg: 'bg-green-50', border: 'border-green-100' },
    ]

    const currentLesson = {
        title: 'Chưa có bài học',
        description: 'Bắt đầu lộ trình học tập của bạn ngay hôm nay.',
        progress: 0,
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Welcome Banner */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-brand-blue to-teal-400 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                <div className="relative z-10">
                    <Title level={2} style={{ color: 'white', margin: 0, fontWeight: 800 }}>
                        Chào mừng trở lại, {user?.fullName || 'bạn'}! 👋
                    </Title>
                    <p className="text-blue-50 text-lg mt-2 max-w-xl">
                        Hôm nay là một ngày tuyệt vời để tiếp tục hành trình mở khóa tiếng Việt của bạn. Hãy giữ vững chuỗi học nhé!
                    </p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Continue Learning */}
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#4b4b4b' }}>Tiếp tục bài học</Title>
                        </div>
                        <motion.div
                            whileHover={{ y: -4 }}
                            className="bg-white rounded-3xl p-6 border-b-[6px] border-b-gray-200 border border-gray-100 cursor-pointer shadow-sm hover:border-b-brand-green transition-all group"
                            onClick={() => navigate('/learner/roadmap')}
                        >
                            <div className="flex sm:flex-row flex-col gap-6 items-center">
                                <div className="w-24 h-24 shrink-0 rounded-full bg-brand-green/10 flex items-center justify-center border-4 border-brand-green/20">
                                    <PlayCircleFilled className="text-4xl text-brand-green group-hover:scale-110 transition-transform" />
                                </div>
                                <div className="flex-1 w-full text-center sm:text-left">
                                    <div className="text-brand-green font-bold text-sm tracking-wider uppercase mb-1">Chương 2 • Bài 3</div>
                                    <Title level={3} style={{ margin: 0, color: '#4b4b4b', fontWeight: 800 }}>{currentLesson.title}</Title>
                                    <Text className="text-gray-500 mt-1 block">{currentLesson.description}</Text>

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
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <Text className="text-gray-400 italic text-sm">Chăm chỉ học tập, thành công sẽ đến!</Text>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </section>

                    {/* Feature Coming Soon */}
                    <section>
                        <Title level={4} style={{ margin: 0, marginBottom: 16, fontWeight: 800, color: '#4b4b4b' }}>Mục tiêu hàng ngày</Title>
                        <div className="bg-gray-50 border border-gray-100 rounded-3xl p-8 text-center">
                            <TrophyOutlined className="text-4xl text-gray-300 mb-4" />
                            <div className="text-gray-500 font-semibold">Tính năng "Mục tiêu hàng ngày" đang được phát triển</div>
                            <div className="text-gray-400 text-sm mt-1">Hãy quay lại sau nhé!</div>
                        </div>
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
                                <div key={i} className={clsx("flex items-center p-4 rounded-2xl border", stat.bg, stat.border)}>
                                    <div className={clsx("text-2xl mr-4", stat.color)}>
                                        {stat.icon}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-500 uppercase tracking-wide">{stat.label}</div>
                                        <div className={clsx("text-2xl font-extrabold", stat.color)}>{stat.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button
                            type="default"
                            block
                            className="mt-6 h-12 rounded-xl font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                            onClick={() => navigate('/learner/profile')}
                        >
                            Xem Hồ Sơ Chi Tiết
                        </Button>
                    </Card>

                    <motion.div
                        whileHover={{ y: -4 }}
                        className="bg-brand-yellow rounded-3xl p-6 text-white shadow-lg cursor-pointer flex justify-between items-center"
                    >
                        <div>
                            <div className="font-extrabold text-xl">Luyện tập phát âm</div>
                            <div className="text-yellow-100 mt-1">Ôn lại các từ đã sai</div>
                        </div>
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <RightOutlined />
                        </div>
                    </motion.div>
                </div>

            </div>
        </div>
    )
}
