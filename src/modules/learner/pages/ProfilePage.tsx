import { useEffect, useRef, useState } from 'react'
import { Button, Form, Input, Select, Modal, message, Tooltip, Progress } from 'antd'
import {
    CameraOutlined, TrophyOutlined, CheckCircleOutlined,
} from '@ant-design/icons'
import {
    Flame, Star, Shield, BookOpen, ArrowRight, Landmark, Castle, Building2,
    Mail, Phone, Calendar, Edit, MessageSquare, Target, Activity,
    TrendingUp, TrendingDown, Minus, ChevronRight, Layout, Zap
} from 'lucide-react'
import { useAuth } from '../../../core/auth/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { apiClient } from '../../../services/apiClient'
import { useParams, useNavigate } from 'react-router-dom'
import { educatorService } from '../../educator/services/educatorService'

const { Option } = Select

const REGION_MAP: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    north: { label: 'Miền Bắc', icon: Landmark, color: '#6366f1', bg: '#eef2ff' },
    central: { label: 'Miền Trung', icon: Castle, color: '#f59e0b', bg: '#fffbeb' },
    south: { label: 'Miền Nam', icon: Building2, color: '#10b981', bg: '#ecfdf5' },
}

const BRAND_BLUE = '#49B6E5'
const BRAND_ORANGE = '#f97316'

export default function ProfilePage() {
    const { studentId } = useParams()
    const navigate = useNavigate()
    const { session, updateSessionItem } = useAuth()
    const isEducatorView = !!studentId

    // For Learner view
    const user = session?.user
    const [badges, setBadges] = useState<any[]>([])
    const [progress, setProgress] = useState<Record<string, number>>({})
    const [badgesLoading, setBadgesLoading] = useState(true)
    const [progressLoading, setProgressLoading] = useState(true)

    // For Educator view
    const [studentData, setStudentData] = useState<any>(null)
    const [analytics, setAnalytics] = useState<any>(null)
    const [pronunciationData, setPronunciationData] = useState<any>(null)
    const [loading, setLoading] = useState(isEducatorView)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isBadgesModalOpen, setIsBadgesModalOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [avatarErr, setAvatarErr] = useState(false)
    const [form] = Form.useForm()

    // ══════ DATA FETCHING (EDUCATOR) ══════
    useEffect(() => {
        if (!isEducatorView) return

        const fetchStudentData = async () => {
            setLoading(true)
            try {
                const [accRes, analyticsRes, pronunRes] = await Promise.all([
                    educatorService.getStudentAccountById(studentId!),
                    educatorService.getAnalyticsReportByStudent(studentId!),
                    educatorService.getPronunciationAnalytics(studentId!)
                ])

                // apiClient unwraps data already if configured, but let's be safe
                setStudentData(accRes?.data || accRes)
                setAnalytics(analyticsRes?.data || analyticsRes)
                setPronunciationData(pronunRes?.data || pronunRes)
            } catch (err) {
                console.error('Error fetching student details:', err)
                message.error('Không thể tải thông tin học viên')
            } finally {
                setLoading(false)
            }
        }

        fetchStudentData()
    }, [studentId, isEducatorView])

    // ══════ DATA FETCHING (LEARNER) ══════
    useEffect(() => {
        if (isEducatorView) return

        apiClient.get('/learner/my-badges')
            .then((res: any) => {
                const l = res?.data?.data ?? res?.data ?? []
                setBadges(Array.isArray(l) ? l : [])
            })
            .catch(() => { })
            .finally(() => setBadgesLoading(false))

        apiClient.get('/users/me/progress')
            .then((res: any) => {
                const body = res?.data?.data ?? res?.data ?? {}
                const regions: any[] = body?.regions ?? []
                const map: Record<string, number> = {}
                regions.forEach((r: any) => {
                    if (r?.regionName) map[r.regionName] = Math.round(r.completionPercentage ?? 0)
                })
                if (Object.keys(map).length) setProgress(map)
            })
            .catch(() => { })
            .finally(() => setProgressLoading(false))
    }, [isEducatorView])

    const handleEdit = () => {
        form.setFieldsValue({
            fullName: user?.fullName,
            phone: user?.phone || user?.phoneNumber,
            region: (user?.region || '').toLowerCase(),
            avatarUrl: (user as any)?.avatar_url || user?.avatar,
        })
        setIsModalOpen(true)
    }

    const handleSave = async () => {
        try {
            const v = await form.validateFields()
            setSaving(true)
            await apiClient.put('/users/me', { fullName: v.fullName, phone: v.phone, region: v.region, avatar: v.avatarUrl, avatar_url: v.avatarUrl })
            updateSessionItem?.({ fullName: v.fullName, phone: v.phone, region: v.region, avatar: v.avatarUrl, avatar_url: v.avatarUrl } as any)
            message.success('Cập nhật hồ sơ thành công!')
            setIsModalOpen(false)
        } catch (e: any) {
            if (e?.errorFields) return
            message.error(e?.response?.data?.message || 'Không thể cập nhật hồ sơ')
        } finally { setSaving(false) }
    }

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-[4px] border-slate-200 border-t-[#49B6E5] rounded-full animate-spin" />
                    <span className="font-black text-slate-400 uppercase tracking-widest text-xs">Đang tải dữ liệu...</span>
                </div>
            </div>
        )
    }

    // Determine which data to use
    const activeData = isEducatorView ? studentData : user
    const regionKey = (activeData?.region || activeData?.level || '').toLowerCase()
    const region = REGION_MAP[regionKey] || REGION_MAP.north
    const streak = activeData?.currentStreakDays ?? activeData?.streak ?? 0
    const totalStars = activeData?.totalStars ?? 0
    const joinDate = activeData?.createdAt
        ? new Date(activeData.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long' })
        : 'Mới gia nhập'

    // ══════ UI COMPONENTS ══════

    const StatCard = ({ icon: Icon, label, value, color, bg }: any) => (
        <div className="flex-1 bg-white border-[3px] border-slate-900 rounded-2xl p-4 shadow-[4px_4px_0_#1f2937] flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl border-[2px] border-slate-900 flex items-center justify-center mb-2 shadow-[2px_2px_0_#1f2937]" style={{ backgroundColor: bg }}>
                <Icon size={20} className="text-slate-900" />
            </div>
            <div className="text-2xl font-black text-slate-900 leading-none">{value}</div>
            <div className="mt-1 text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</div>
        </div>
    )

    return (
        <div className="max-w-7xl mx-auto space-y-8 font-nunito animate-in fade-in duration-500">

            {/* Header / Profile Info */}
            <div className="relative bg-white border-[3px] border-slate-900 rounded-[2.5rem] p-8 shadow-[12px_12px_0_#1f2937] overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#49B6E5]/5 rounded-bl-full -z-0" />
                <div className="absolute bottom-10 left-10 w-20 h-20 border-[3px] border-[#f97316]/10 rounded-full -z-0" />

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    {/* Avatar */}
                    <div className="relative">
                        <div className="w-32 h-32 rounded-3xl border-[4px] border-slate-900 bg-slate-50 overflow-hidden shadow-[6px_6px_0_#1f2937]">
                            <img
                                src={activeData?.avatarUrl || activeData?.avatar || (activeData as any)?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeData?.fullName || 'User'}`}
                                alt="Profile"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as any).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeData?.fullName || 'User'}`
                                }}
                            />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-2xl border-[3px] border-slate-900 flex items-center justify-center shadow-[3px_3px_0_#1f2937]">
                            <CheckCircleOutlined className="text-white text-lg" />
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                                {activeData?.fullName || 'Học viên'}
                            </h1>
                            <span className="px-3 py-1 rounded-xl border-[2px] border-slate-900 bg-[#fef3c7] text-slate-900 font-black text-[10px] uppercase tracking-widest shadow-[3px_3px_0_#1f2937]">
                                Level: {activeData?.level || 'Bắt đầu'}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-500 mb-6">
                            <div className="flex items-center gap-1.5">
                                <Mail size={14} className="text-slate-400" />
                                <span className="text-sm font-bold">{activeData?.email || 'Chưa cập nhật'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Phone size={14} className="text-slate-400" />
                                <span className="text-sm font-bold">{activeData?.phone || activeData?.phoneNumber || 'Chưa cập nhật'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Calendar size={14} className="text-slate-400" />
                                <span className="text-sm font-bold">Tham gia: {joinDate}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                            {isEducatorView ? (
                                <>
                                    <button
                                        type="button"
                                        className="h-12 px-6 bg-[#49B6E5] border-[3px] border-slate-900 text-white font-black uppercase text-xs shadow-[4px_4px_0_#1f2937] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1f2937] transition-all flex items-center justify-center gap-2"
                                    >
                                        <MessageSquare size={16} />
                                        Nhắn tin
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/educator/students')}
                                        className="h-12 px-6 bg-white border-[3px] border-slate-900 text-slate-900 font-black uppercase text-xs shadow-[4px_4px_0_#1f2937] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1f2937] transition-all flex items-center justify-center"
                                    >
                                        Quay lại
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleEdit}
                                    className="h-12 px-6 bg-[#49B6E5] border-[3px] border-slate-900 text-white font-black uppercase text-xs shadow-[4px_4px_0_#1f2937] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1f2937] transition-all flex items-center justify-center gap-2"
                                >
                                    <Edit size={16} />
                                    Chỉnh sửa hồ sơ
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="flex gap-3 w-full md:w-auto">
                        <StatCard icon={Flame} label="Chuỗi ngày" value={streak} color="#f97316" bg="#fff7ed" />
                        <StatCard icon={Star} label="Tổng sao" value={totalStars} color="#eab308" bg="#fefce8" />
                        <StatCard icon={Shield} label="Huy hiệu" value={isEducatorView ? 'N/A' : (badges.length || 0)} color="#8b5cf6" bg="#f5f3ff" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Analytics & Progress */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Educator Analytics Section */}
                    {isEducatorView ? (
                        <div className="bg-white border-[3px] border-slate-900 rounded-[2.5rem] p-8 shadow-[12px_12px_0_#1f2937]">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-8 bg-[#49B6E5] rounded-full" />
                                <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Phân tích năng lực</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Pronunciation Score Chart Placeholder */}
                                <div className="p-6 rounded-3xl border-[3px] border-slate-900 bg-slate-50">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="text-sm font-black uppercase tracking-widest text-slate-400">Điểm phát âm</div>
                                        <div className="text-2xl font-black text-[#49B6E5]">{activeData?.pronunciationScore || 0}%</div>
                                    </div>
                                    <div className="h-4 bg-white border-[2.5px] border-slate-900 rounded-full overflow-hidden mb-4">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${activeData?.pronunciationScore || 0}%` }}
                                            className="h-full bg-[#49B6E5]"
                                        />
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 text-center">
                                        Vượt qua 85% học viên cùng cấp độ
                                    </div>
                                </div>

                                {/* Learning Effectiveness */}
                                <div className="p-6 rounded-3xl border-[3px] border-slate-900 bg-white">
                                    <div className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Hiệu quả tiếp thu</div>
                                    <div className="space-y-4">
                                        {(analytics?.learningEffectiveness || [
                                            { label: 'Từ vựng', value: 75 },
                                            { label: 'Ngữ pháp', value: 60 },
                                            { label: 'Phản xạ', value: 85 }
                                        ]).map((item: any, idx: number) => (
                                            <div key={idx}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">{item.label}</span>
                                                    <span className="text-[10px] font-black text-slate-900">{item.value}%</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-slate-900" style={{ width: `${item.value}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Weak Phonemes / Error Patterns */}
                            <div className="mt-8">
                                <div className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Mẫu lỗi phát âm thường gặp</div>
                                <div className="flex flex-wrap gap-2">
                                    {(activeData?.weakPhonemes || ['tr', 'ng', 'kh', 'th']).map((p: string, i: number) => (
                                        <div key={i} className="px-4 py-2 rounded-xl border-[2px] border-slate-900 bg-white shadow-[3px_3px_0_#1f2937] flex items-center gap-3">
                                            <span className="font-black text-[#f97316] uppercase">/{p}/</span>
                                            <div className="w-[1px] h-3 bg-slate-200" />
                                            <span className="text-[10px] font-bold text-slate-500">Tỷ lệ lỗi: 12%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Learner Progress Section */
                        <div className="bg-white border-[3px] border-slate-900 rounded-[2.5rem] p-8 shadow-[12px_12px_0_#1f2937]">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-8 bg-[#49B6E5] rounded-full" />
                                <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Tiến độ ngôn ngữ</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {Object.entries(progress).length > 0 ? (
                                    Object.entries(progress).map(([key, pct], idx) => (
                                        <div key={idx} className="p-6 rounded-3xl border-[3px] border-slate-900 bg-slate-50 shadow-[4px_4px_0_#1f2937]">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-sm font-black uppercase tracking-widest text-slate-600">{key}</span>
                                                <span className="text-lg font-black text-[#49B6E5]">{pct}%</span>
                                            </div>
                                            <Progress
                                                percent={pct}
                                                strokeColor={BRAND_BLUE}
                                                railColor="white"
                                                strokeWidth={12}
                                                showInfo={false}
                                                className="mb-2"
                                            />
                                            <p className="text-[10px] font-bold text-slate-400 text-center mt-2 uppercase tracking-tighter">Hoàn thành các bài luyện tập để tăng tốc!</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-2 text-center py-12">
                                        <div className="w-16 h-16 bg-slate-50 border-[3px] border-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                            <BookOpen size={32} className="text-slate-300" />
                                        </div>
                                        <p className="font-black text-slate-400 uppercase tracking-widest text-sm">Chưa có tiến độ ghi nhận</p>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/learner/journey')}
                                            className="mt-4 border-none text-[#49B6E5] font-black uppercase text-[10px] tracking-widest hover:bg-[#49B6E5]/5 px-4 h-8 rounded-lg flex items-center justify-center gap-1 mx-auto"
                                        >
                                            Khám phá ngay <ArrowRight size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Achievements & Recent Activity */}
                <div className="lg:col-span-4 space-y-8">

                    {/* Achievements */}
                    <div className="bg-white border-[3px] border-slate-900 rounded-[2.5rem] p-8 shadow-[12px_12px_0_#1f2937]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1.5 h-6 bg-yellow-400 rounded-full" />
                            <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">Thành tích</h2>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {(isEducatorView ? [] : badges).slice(0, 9).map((b, i) => (
                                <Tooltip title={b?.badge?.name || b?.name} key={i}>
                                    <motion.div
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        className="aspect-square rounded-2xl border-[2.5px] border-slate-900 bg-[#fefce8] flex items-center justify-center shadow-[3px_3px_0_#1f2937] cursor-help"
                                    >
                                        <img src={b?.badge?.iconUrl || b?.iconUrl} className="w-10 h-10 object-contain" alt="Badge" />
                                    </motion.div>
                                </Tooltip>
                            ))}
                            {(isEducatorView ? [] : badges).length === 0 && (
                                <div className="col-span-3 py-6 text-center">
                                    <TrophyOutlined className="text-slate-200 text-3xl mb-2" />
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Chưa có huy hiệu</p>
                                </div>
                            )}
                        </div>

                        {/* View all button if badges > 9 */}
                        {!isEducatorView && badges.length > 9 && (
                            <button
                                type="button"
                                onClick={() => setIsBadgesModalOpen(true)}
                                className="mt-5 w-full py-2.5 rounded-xl border-[2.5px] border-slate-900 bg-white text-slate-900 font-black uppercase text-[10px] tracking-wider shadow-[3px_3px_0_#1f2937] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#1f2937] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5"
                            >
                                Xem tất cả thành tựu ({badges.length}) <ChevronRight size={14} strokeWidth={3} />
                            </button>
                        )}
                    </div>

                    {/* Recent Sessions (Educator Only) */}
                    {isEducatorView && (
                        <div className="bg-white border-[3px] border-slate-900 rounded-[2.5rem] p-8 shadow-[12px_12px_0_#1f2937]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1.5 h-6 bg-green-400 rounded-full" />
                                <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">Phiên học gần đây</h2>
                            </div>

                            <div className="space-y-4">
                                {(analytics?.recentSessions || [
                                    { id: '1', score: 92, createdAt: '2026-04-28T10:00:00Z' },
                                    { id: '2', score: 85, createdAt: '2026-04-27T15:30:00Z' },
                                    { id: '3', score: 78, createdAt: '2026-04-26T09:15:00Z' }
                                ]).map((s: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl border-[2px] border-slate-100 hover:border-slate-900 hover:bg-slate-50 transition-all cursor-default">
                                        <div>
                                            <div className="text-xs font-black text-slate-900 uppercase">Giao tiếp hằng ngày</div>
                                            <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                                                {new Date(s.createdAt).toLocaleDateString('vi-VN')}
                                            </div>
                                        </div>
                                        <div className="text-sm font-black text-green-500">+{s.score}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ══════ EDIT MODAL ══════ */}
            <Modal
                title={
                    <div className="flex items-center gap-3 pb-1">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center border-[2px] border-slate-900 bg-[#fff7ed] shadow-[2px_2px_0_#1f2937]">
                            <Edit size={16} className="text-slate-900" />
                        </div>
                        <div>
                            <div className="font-black text-slate-900 uppercase tracking-tight">Chỉnh sửa hồ sơ</div>
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Cập nhật thông tin cá nhân</div>
                        </div>
                    </div>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null} centered width={520} destroyOnClose
                className="neobrutalist-modal"
            >
                <Form form={form} layout="vertical" className="mt-6" requiredMark={false}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Form.Item name="fullName" label={<span className="font-black text-slate-900 text-xs uppercase tracking-wider">Họ và tên</span>}
                            rules={[{ required: true }, { min: 2 }, { max: 100 }]}>
                            <Input placeholder="Nguyễn Văn A" className="h-12 rounded-xl border-[2.5px] border-slate-900 font-bold" />
                        </Form.Item>
                        <Form.Item name="phone" label={<span className="font-black text-slate-900 text-xs uppercase tracking-wider">Số điện thoại</span>}
                            rules={[
                                {
                                    validator: (_, value) => {
                                        if (!value || value.trim() === '') {
                                            return Promise.resolve();
                                        }
                                        if (/^(0|\+84)[0-9]{9,10}$/.test(value)) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Số điện thoại không hợp lệ'));
                                    }
                                }
                            ]}>
                            <Input placeholder="0901234567" className="h-12 rounded-xl border-[2.5px] border-slate-900 font-bold" />
                        </Form.Item>
                    </div>

                    <Form.Item name="region" label={<span className="font-black text-slate-900 text-xs uppercase tracking-wider">Khu vực học</span>}
                        rules={[{ required: true, message: 'Vui lòng chọn khu vực' }]}>
                        <Select placeholder="Chọn khu vực" className="h-12 rounded-xl border-[2.5px] border-slate-900">
                            {Object.entries(REGION_MAP).map(([val, o]) => (
                                <Option key={val} value={val}>
                                    <div className="flex items-center gap-2 font-bold"><o.icon size={14} /> {o.label}</div>
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="avatarUrl" label={<span className="font-black text-slate-900 text-xs uppercase tracking-wider">Link ảnh đại diện</span>}
                        rules={[{ type: 'url', message: 'URL không hợp lệ' }]}>
                        <Input prefix={<CameraOutlined className="text-slate-400" />} placeholder="https://…/avatar.jpg" className="h-12 rounded-xl border-[2.5px] border-slate-900 font-bold" />
                    </Form.Item>

                    <div className="flex gap-4 justify-end mt-8">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="h-12 px-6 rounded-xl border-[3px] border-slate-900 bg-white text-slate-900 font-black uppercase text-xs shadow-[4px_4px_0_#1f2937] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1f2937] transition-all"
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            disabled={saving}
                            onClick={handleSave}
                            className="h-12 px-8 rounded-xl border-[3px] border-slate-900 bg-[#f97316] text-white font-black uppercase text-xs shadow-[4px_4px_0_#1f2937] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1f2937] transition-all disabled:opacity-50"
                        >
                            {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </Form>
            </Modal>

            {/* ══════ ALL BADGES MODAL ══════ */}
            <Modal
                title={
                    <div className="flex items-center gap-3 pb-1">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center border-[2px] border-slate-900 bg-[#fefce8] shadow-[2px_2px_0_#1f2937]">
                            <TrophyOutlined className="text-slate-900 text-lg" />
                        </div>
                        <div>
                            <div className="font-black text-slate-900 uppercase tracking-tight">Tất cả thành tựu</div>
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Các huy hiệu đã đạt được ({badges.length})</div>
                        </div>
                    </div>
                }
                open={isBadgesModalOpen}
                onCancel={() => setIsBadgesModalOpen(false)}
                footer={null} centered width={650} destroyOnClose
                className="neobrutalist-modal"
            >
                <div className="mt-6 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 8px; }
                        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }
                        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                    `}} />
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 p-1">
                        {badges.map((b, i) => (
                            <Tooltip title={b?.badge?.description || b?.description} key={i}>
                                <motion.div
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    className="flex flex-col items-center p-3 rounded-2xl border-[2.5px] border-slate-900 bg-[#fefce8] shadow-[3px_3px_0_#1f2937] text-center"
                                >
                                    <img src={b?.badge?.iconUrl || b?.iconUrl} className="w-12 h-12 object-contain mb-2" alt="Badge" />
                                    <div className="text-[9px] font-black text-slate-900 leading-tight line-clamp-2 uppercase">
                                        {b?.badge?.name || b?.name}
                                    </div>
                                </motion.div>
                            </Tooltip>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end mt-6">
                    <button
                        type="button"
                        onClick={() => setIsBadgesModalOpen(false)}
                        className="h-12 px-6 rounded-xl border-[3px] border-slate-900 bg-white text-slate-900 font-black uppercase text-xs shadow-[4px_4px_0_#1f2937] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1f2937] transition-all"
                    >
                        Đóng
                    </button>
                </div>
            </Modal>

            <style dangerouslySetInnerHTML={{
                __html: `
                .neobrutalist-modal .ant-modal-content {
                    border: 4px solid #1f2937;
                    box-shadow: 12px 12px 0 #1f2937;
                    border-radius: 2.5rem;
                    padding: 2rem;
                }
                .neobrutalist-modal .ant-modal-header {
                    border-bottom: none;
                    margin-bottom: 0;
                }
                .ant-select-selector {
                    border-width: 2.5px !important;
                    border-color: #1f2937 !important;
                    border-radius: 0.75rem !important;
                    height: 48px !important;
                    display: flex !important;
                    align-items: center !important;
                    box-shadow: none !important;
                }
                .ant-progress-inner {
                    border: 2.5px solid #1f2937 !important;
                }
            `}} />
        </div>
    )
}
