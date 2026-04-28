import { useEffect, useRef, useState } from 'react'
import { Button, Form, Input, Select, Modal, message } from 'antd'
import {
    CameraOutlined, TrophyOutlined, CheckCircleOutlined,
} from '@ant-design/icons'
import { Flame, Star, Shield, BookOpen, ArrowRight, Landmark, Castle, Building2, Mail, Phone, Calendar, Edit } from 'lucide-react'
import { useAuth } from '../../../core/auth/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { apiClient } from '../../../services/apiClient'

const { Option } = Select

const REGION_OPTIONS = [
    { value: 'north', label: 'Miền Bắc', icon: Landmark },
    { value: 'central', label: 'Miền Trung', icon: Castle },
    { value: 'south', label: 'Miền Nam', icon: Building2 },
]
const REGION_MAP: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    north: { label: 'Miền Bắc', icon: Landmark, color: '#6366f1', bg: '#eef2ff' },
    central: { label: 'Miền Trung', icon: Castle, color: '#f59e0b', bg: '#fffbeb' },
    south: { label: 'Miền Nam', icon: Building2, color: '#10b981', bg: '#ecfdf5' },
}
const PROGRESS_LABELS: Record<string, { label: string; color: string }> = {
    NORTH: { label: 'Giọng Bắc', color: '#6366f1' },
    CENTRAL: { label: 'Giọng Trung', color: '#f59e0b' },
    SOUTH: { label: 'Giọng Nam', color: '#10b981' },
}
const BRAND_ORANGE = '#f97316'

function BadgeIcon({ badge }: { badge: any }) {
    const url = badge?.iconUrl || badge?.imageUrl || badge?.icon_url
    const [err, setErr] = useState(false)
    if (url && !err)
        return <img src={url} alt={badge?.name} className="w-7 h-7 object-contain" onError={() => setErr(true)} />
    return <TrophyOutlined className="text-yellow-400 text-sm" />
}

export default function ProfilePage() {
    const { session, updateSessionItem } = useAuth()
    const user = session?.user

    const [badges, setBadges] = useState<any[]>([])
    const [progress, setProgress] = useState<Record<string, number>>({})
    const [badgesLoading, setBadgesLoading] = useState(true)
    const [progressLoading, setProgressLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [avatarErr, setAvatarErr] = useState(false)
    const [form] = Form.useForm()
    const fetchedBadges = useRef(false)
    const fetchedProgress = useRef(false)

    useEffect(() => {
        setAvatarErr(false)
    }, [user?.avatar])

    useEffect(() => {
        if (fetchedBadges.current) return
        fetchedBadges.current = true
        apiClient.get('/learner/my-badges')
            .then((res: any) => {
                const l = res?.data?.data ?? res?.data ?? []
                setBadges(Array.isArray(l) ? l : [])
            })
            .catch(() => { })
            .finally(() => setBadgesLoading(false))
    }, [])

    useEffect(() => {
        if (fetchedProgress.current) return
        fetchedProgress.current = true
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
    }, [])

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

    const regionKey = (user?.region || '').toLowerCase()
    const region = REGION_MAP[regionKey]
    const streak = (user as any)?.currentStreakDays ?? (user as any)?.streak ?? 0
    const totalStars = user?.totalStars ?? 0
    const joinDate = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long' })
        : 'gần đây'
    const progressEntries = Object.entries(progress)

    return (
        <div className="flex flex-col pb-12">

            {/* ══════ HERO STRIP ══════ */}
            <div
                className="flex-shrink-0 relative overflow-hidden flex items-center px-8"
                style={{
                    height: 56,
                    background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 55%, #f97316 100%)',
                }}
            >
                {[...Array(6)].map((_, i) => (
                    <motion.span key={i}
                        className="absolute rounded-full bg-white/20"
                        style={{ width: 3, height: 3, left: `${(i * 16) % 100}%`, top: `${20 + (i * 18) % 60}%` }}
                        animate={{ y: [-3, 3, -3] }} transition={{ duration: 2.2 + i * 0.3, repeat: Infinity }} />
                ))}
                <div>
                    <p className="text-white/50 text-[9px] font-black uppercase tracking-[0.18em]">Hồ sơ cá nhân</p>
                    <h1 className="text-white text-sm font-black leading-tight">{user?.fullName || 'Học viên SpeakVN'}</h1>
                </div>
                <button
                    onClick={handleEdit}
                    className="ml-auto flex items-center gap-1.5 text-white text-xs font-black px-4 py-1.5 rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm"
                >
                    <Edit size={11} /> Chỉnh sửa
                </button>
            </div>

            {/* ══════ BODY — Balanced grid layout ══════ */}
            <div className="p-4">
                <div className="max-w-none mx-auto space-y-3 flex flex-col px-4 lg:px-8">

                    {/* ── ROW 1: User card + Account Info + Stats (full width, horizontal) ── */}
                    <div className="flex gap-3 flex-shrink-0 flex-wrap lg:flex-nowrap">

                        {/* Avatar + Name */}
                        <div className="w-full lg:w-[220px] flex-shrink-0 bg-white rounded-2xl border border-gray-100 overflow-hidden"
                            style={{ boxShadow: '0 4px 20px rgba(147,51,234,0.08)' }}>
                            <div style={{ height: 3, background: BRAND_ORANGE }} />
                            <div className="flex flex-col items-center text-center px-4 py-4">
                                <div className="relative mb-2">
                                    <div
                                        className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center border-2 border-white shadow-md"
                                        style={{ background: region?.bg || '#f5f3ff' }}
                                    >
                                        {user?.avatar && !avatarErr
                                            ? <img src={user.avatar} alt="" className="w-full h-full object-cover" onError={() => setAvatarErr(true)} />
                                            : <span className="text-xl font-black" style={{ color: region?.color || '#9333ea' }}>
                                                {user?.fullName?.[0] || 'U'}
                                            </span>
                                        }
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow flex items-center justify-center">
                                        <CheckCircleOutlined style={{ color: '#fff', fontSize: 8 }} />
                                    </div>
                                </div>
                                <p className="font-black text-gray-900 text-sm leading-tight">{user?.fullName || 'Học viên'}</p>
                                <p className="text-[10px] text-gray-400 font-medium mt-0.5">Học viên SpeakVN</p>
                                {region && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg mt-1.5 border"
                                        style={{ color: region.color, background: region.bg, borderColor: `${region.color}30` }}>
                                        <region.icon size={10} /> {region.label}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Account Info */}
                        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-100"
                            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div className="px-4 py-2 border-b border-gray-50 flex items-center gap-2">
                                <div className="w-1 h-3 rounded-full" style={{ background: BRAND_ORANGE }} />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Thông tin tài khoản</span>
                            </div>
                            <div className="p-3 grid grid-cols-2 gap-2">
                                {[
                                    { icon: <Mail size={12} />, label: 'Email', val: user?.email, c: '#9333ea', bg: '#faf5ff' },
                                    { icon: <Phone size={12} />, label: 'Điện thoại', val: user?.phone || user?.phoneNumber || 'Chưa cập nhật', c: BRAND_ORANGE, bg: '#fff7ed' },
                                    { icon: <region.icon size={12} />, label: 'Khu vực', val: region ? region.label : 'Chưa cập nhật', c: '#10b981', bg: '#f0fdf4' },
                                    { icon: <Calendar size={12} />, label: 'Tham gia', val: joinDate, c: '#6366f1', bg: '#eef2ff' },
                                ].map(({ icon, label, val, c, bg }, i) => (
                                    <div key={i} className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs" style={{ background: bg, color: c }}>{icon}</div>
                                        <div className="min-w-0">
                                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-wide">{label}</div>
                                            <div className="text-[11px] font-bold text-gray-700 truncate">{val || '—'}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="w-full lg:w-[280px] flex-shrink-0 bg-white rounded-2xl border border-gray-100"
                            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div className="px-4 py-2 border-b border-gray-50 flex items-center gap-2">
                                <div className="w-1 h-3 rounded-full bg-purple-500" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Thống kê</span>
                            </div>
                            <div className="p-3 grid grid-cols-3 gap-2">
                                {[
                                    { icon: <Flame size={18} style={{ color: BRAND_ORANGE }} />, val: streak, label: 'Chuỗi ngày', bg: '#fff7ed', border: '#fed7aa' },
                                    { icon: <Star size={18} className="text-yellow-500" />, val: totalStars, label: 'Tổng sao', bg: '#fefce8', border: '#fde68a' },
                                    { icon: <Shield size={18} className="text-purple-500" />, val: badgesLoading ? '…' : badges.length, label: 'Huy hiệu', bg: '#faf5ff', border: '#e9d5ff' },
                                ].map(({ icon, val, label, bg, border }, i) => (
                                    <div key={i} className="flex flex-col items-center py-3 rounded-xl border hover:shadow-sm transition-all"
                                        style={{ background: bg, borderColor: border }}>
                                        <div className="mb-1">{icon}</div>
                                        <span className="font-black text-gray-800 text-lg leading-none">{val}</span>
                                        <span className="text-[8px] text-gray-400 font-bold uppercase mt-1">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── ROW 2: Progress (left) + Badges (right) — equal width ── */}
                    <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">

                        {/* Progress */}
                        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col"
                            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div className="px-4 py-2 border-b border-gray-50 flex items-center gap-2 flex-shrink-0">
                                <div className="w-1 h-3 rounded-full" style={{ background: BRAND_ORANGE }} />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Tiến độ ngôn ngữ</span>
                            </div>
                            <div className="px-4 py-3 flex-1">
                                {progressLoading ? (
                                    <div className="space-y-3">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="space-y-1">
                                                <div className="h-3 w-1/3 bg-gray-100 rounded animate-pulse" />
                                                <div className="h-2.5 w-full bg-gray-100 rounded-full animate-pulse" />
                                            </div>
                                        ))}
                                    </div>
                                ) : progressEntries.length > 0 ? (
                                    <div className="space-y-4">
                                        {progressEntries.map(([key, pct], idx) => {
                                            const meta = PROGRESS_LABELS[key?.toUpperCase()] ?? { label: key, color: '#9333ea' }
                                            return (
                                                <div key={idx}>
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <span className="text-xs font-bold text-gray-600">{meta.label}</span>
                                                        <span className="text-xs font-black" style={{ color: meta.color }}>{pct}%</span>
                                                    </div>
                                                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <motion.div className="h-full rounded-full"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${pct}%` }}
                                                            transition={{ duration: 1, delay: idx * 0.15, ease: 'easeOut' }}
                                                            style={{ background: `linear-gradient(90deg, ${meta.color}99, ${meta.color})` }}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                                            style={{ background: '#fff7ed' }}>
                                            <BookOpen size={18} style={{ color: BRAND_ORANGE }} />
                                        </div>
                                        <p className="text-sm font-bold text-gray-500">Chưa có tiến độ học</p>
                                        <p className="text-xs text-gray-400 mt-0.5">Hoàn thành bài học để xem thống kê!</p>
                                        <button className="mt-2 flex items-center gap-1 text-xs font-black transition-colors"
                                            style={{ color: BRAND_ORANGE }}>
                                            Học ngay <ArrowRight size={11} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col"
                            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div className="px-4 py-2 border-b border-gray-50 flex items-center gap-2 flex-shrink-0">
                                <div className="w-1 h-3 rounded-full bg-yellow-400" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Huy hiệu & Thành tích</span>
                                {!badgesLoading && badges.length > 0 && (
                                    <span className="ml-auto text-[10px] font-black px-2 py-0.5 rounded-full"
                                        style={{ background: '#fff7ed', color: BRAND_ORANGE }}>
                                        {badges.length} huy hiệu
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto p-3">
                                {badgesLoading ? (
                                    <div className="grid grid-cols-4 gap-2">
                                        {[...Array(8)].map((_, i) => (
                                            <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
                                        ))}
                                    </div>
                                ) : badges.length > 0 ? (
                                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                        <AnimatePresence>
                                            {badges.map((b, idx) => {
                                                const bData = b?.badge ?? b
                                                return (
                                                    <motion.div key={b.id || idx}
                                                        initial={{ opacity: 0, scale: 0.7 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: idx * 0.03, type: 'spring', bounce: 0.4 }}
                                                        whileHover={{ y: -3, scale: 1.05 }}
                                                        className="relative group cursor-default"
                                                    >
                                                        <div className="flex flex-col items-center p-2 rounded-xl text-center hover:shadow-sm transition-all duration-200"
                                                            style={{ background: 'linear-gradient(135deg,#fef9f0,#fef3c7)', border: '1px solid #fde68a' }}>
                                                            <div className="w-8 h-8 flex items-center justify-center mb-0.5">
                                                                <BadgeIcon badge={bData} />
                                                            </div>
                                                            <div className="text-[8px] font-black text-gray-600 leading-tight line-clamp-2">{bData?.name || '—'}</div>
                                                        </div>
                                                    </motion.div>
                                                )
                                            })}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center py-4">
                                        <div className="text-4xl mb-2 opacity-20">🏆</div>
                                        <p className="font-black text-gray-500 text-sm">Chưa có huy hiệu nào!</p>
                                        <p className="text-gray-400 text-xs mt-1">Hoàn thành bài học để mở khóa thành tích</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════ EDIT MODAL ══════ */}
            <Modal
                title={
                    <div className="flex items-center gap-3 pb-1">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#fff7ed' }}>
                            <Edit size={16} style={{ color: BRAND_ORANGE }} />
                        </div>
                        <div>
                            <div className="font-extrabold text-gray-800">Chỉnh sửa hồ sơ</div>
                            <div className="text-xs text-gray-400 font-medium">Cập nhật thông tin cá nhân</div>
                        </div>
                    </div>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null} centered width={480} destroyOnHidden
            >
                <Form form={form} layout="vertical" className="mt-3" requiredMark={false}>
                    <Form.Item name="fullName" label={<span className="font-bold text-gray-600 text-sm">Họ và tên</span>}
                        rules={[{ required: true }, { min: 2 }, { max: 100 }]}>
                        <Input placeholder="Nguyễn Văn A" className="h-11 rounded-xl" />
                    </Form.Item>
                    <Form.Item name="phone" label={<span className="font-bold text-gray-600 text-sm">Số điện thoại</span>}
                        rules={[{ pattern: /^(0|\+84)[0-9]{9,10}$/, message: 'Số điện thoại không hợp lệ' }]}>
                        <Input placeholder="0901234567" className="h-11 rounded-xl" />
                    </Form.Item>
                    <Form.Item name="region" label={<span className="font-bold text-gray-600 text-sm">Khu vực học</span>}
                        rules={[{ required: true, message: 'Vui lòng chọn khu vực' }]}>
                        <Select placeholder="Chọn khu vực" className="h-11">
                            {REGION_OPTIONS.map(o => <Option key={o.value} value={o.value}><div className="flex items-center gap-2"><o.icon size={14} /> {o.label}</div></Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="avatarUrl" label={<span className="font-bold text-gray-600 text-sm">Link ảnh đại diện</span>}
                        rules={[{ type: 'url', message: 'URL không hợp lệ' }]}>
                        <Input prefix={<CameraOutlined className="text-gray-300" />} placeholder="https://…/avatar.jpg" className="h-11 rounded-xl" />
                    </Form.Item>
                    <div className="flex gap-3 justify-end mt-4">
                        <Button onClick={() => setIsModalOpen(false)} className="h-11 px-6 rounded-xl font-bold">Hủy</Button>
                        <Button type="primary" loading={saving} onClick={handleSave}
                            className="h-11 px-8 rounded-xl font-bold border-none"
                            style={{ background: `linear-gradient(135deg, ${BRAND_ORANGE}, #ea580c)`, boxShadow: '0 4px 14px rgba(249,115,22,0.35)' }}>
                            {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    )
}
