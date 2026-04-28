import React, { useState, useEffect } from 'react'
import { Form, Input, Upload, message, Alert } from 'antd'
import {
    User, Lock, Save, Mail, Phone, Camera, ShieldCheck,
    ChevronRight, Zap, Bell, CreditCard, Layout
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../../core/auth/AuthContext'
import { fetchProfileAPI, updateProfileAPI, changePasswordAPI } from '../../../services/userService'
import clsx from 'clsx'

const SettingsPage: React.FC = () => {
    const { session, updateSessionItem } = useAuth()

    const [profileForm] = Form.useForm()
    const [passwordForm] = Form.useForm()

    const [savingProfile, setSavingProfile] = useState(false)
    const [savingPassword, setSavingPassword] = useState(false)
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile')
    const [loadingProfile, setLoadingProfile] = useState(true)
    const [profileError, setProfileError] = useState<string | null>(null)
    const [liveProfile, setLiveProfile] = useState<any>(null)
    const [avatarError, setAvatarError] = useState(false)

    // ─── Fetch latest profile from server on mount ───────────────────
    useEffect(() => {
        let cancelled = false
        setLoadingProfile(true)
        setProfileError(null)

        fetchProfileAPI()
            .then((res: any) => {
                if (cancelled) return
                const profile = res?.data?.data ?? res?.data ?? {}
                setLiveProfile(profile)
                profileForm.setFieldsValue({
                    fullName: profile.fullName || '',
                    email: profile.email || '',
                    phone: profile.phone || '',
                })
            })
            .catch((err: any) => {
                if (cancelled) return
                const msg = err?.response?.data?.message || 'Không thể tải thông tin hồ sơ.'
                setProfileError(msg)
                const user = session?.user as any || {}
                profileForm.setFieldsValue({
                    fullName: user.fullName || user.name || '',
                    email: user.email || '',
                    phone: user.phone || user.phoneNumber || '',
                })
            })
            .finally(() => {
                if (!cancelled) setLoadingProfile(false)
            })

        return () => { cancelled = true }
    }, [session?.user, profileForm])

    // ─── Update Profile ──────────────────────────────────────────────
    const handleUpdateProfile = async (values: any) => {
        try {
            setSavingProfile(true)
            const payload = {
                fullName: values.fullName.trim(),
                phone: values.phone?.trim() || null,
            }
            await updateProfileAPI(payload)
            updateSessionItem({ fullName: payload.fullName, phone: payload.phone })
            setLiveProfile((prev: any) => ({ ...prev, ...payload }))
            message.success('Cập nhật hồ sơ thành công!')
        } catch (error: any) {
            const msg = error?.response?.data?.message || error.message || 'Cập nhật hồ sơ thất bại.'
            message.error(msg)
        } finally {
            setSavingProfile(false)
        }
    }

    // ─── Change Password ─────────────────────────────────────────────
    const handleChangePassword = async (values: any) => {
        try {
            setSavingPassword(true)
            await changePasswordAPI({ oldPassword: values.oldPassword, newPassword: values.newPassword })
            message.success('Đổi mật khẩu thành công!')
            passwordForm.resetFields()
        } catch (error: any) {
            const msg = error?.response?.data?.message || error.message || 'Đổi mật khẩu thất bại.'
            message.error(msg)
        } finally {
            setSavingPassword(false)
        }
    }

    const tabs = [
        { key: 'profile' as const, icon: User, label: 'Hồ sơ cá nhân', color: '#49B6E5', accent: 'bg-blue-50' },
        { key: 'security' as const, icon: Lock, label: 'Bảo mật & Cật nhật', color: '#f59e0b', accent: 'bg-amber-50' },
    ]

    const getAvatarUrl = () => {
        if (avatarError || !liveProfile) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${liveProfile?.fullName || 'Educator'}`;
        return liveProfile.avatar_url || liveProfile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${liveProfile.fullName || 'Educator'}`;
    };

    if (loadingProfile) return (
        <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 rounded-3xl border-[4px] border-slate-900 border-t-[#49B6E5] shadow-[6px_6px_0_#1f2937]"
            />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Đang nạp cài đặt cá nhân...</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-10 font-nunito">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-6 bg-[#49B6E5] rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#49B6E5]">User Preference</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Cài đặt tài khoản</h1>
                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">
                        Quản lý thông tin <span className="text-slate-900">định danh & bảo mật</span> của bạn
                    </p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-10 min-h-[600px]">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-72 flex-shrink-0 space-y-4">
                    <div className="bg-white rounded-[2.5rem] border-[3px] border-slate-900 p-6 shadow-[8px_8px_0_#1f2937] space-y-2">
                        {tabs.map(tab => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.key
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={clsx(
                                        "w-full flex items-center justify-between px-5 py-4 rounded-2xl border-[2.5px] transition-all group",
                                        isActive
                                            ? "bg-slate-900 border-slate-900 text-white shadow-[4px_4px_0_#49B6E5] -translate-y-1"
                                            : "bg-white border-transparent text-slate-400 hover:bg-slate-50 hover:border-slate-900/10 hover:text-slate-900"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <Icon size={20} className={clsx(isActive ? "text-[#49B6E5]" : "group-hover:text-slate-900")} strokeWidth={isActive ? 3 : 2} />
                                        <span className="text-[11px] font-black uppercase tracking-wider">{tab.label}</span>
                                    </div>
                                    <ChevronRight size={14} className={clsx("transition-transform", isActive ? "rotate-90 text-[#49B6E5]" : "opacity-0")} strokeWidth={4} />
                                </button>
                            )
                        })}
                    </div>

                    {/* Secondary helper box */}
                    <div className="bg-[#49B6E5] rounded-[2.5rem] border-[3px] border-slate-900 p-6 shadow-[8px_8px_0_#1f2937] text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <ShieldCheck size={20} strokeWidth={3} />
                            <span className="text-xs font-black uppercase tracking-widest">Trung tâm bảo mật</span>
                        </div>
                        <p className="text-[10px] font-bold italic leading-relaxed text-white/80">
                            Hệ thống bảo mật SpeakVN luôn được cập nhật để bảo vệ dữ liệu của bạn 24/7.
                        </p>
                    </div>
                </div>

                {/* Content Area */}
                <article className="flex-1 bg-white rounded-[3rem] border-[3px] border-slate-900 shadow-[12px_12px_0_#1f2937] relative overflow-hidden flex flex-col">
                    <div className="px-10 py-8 border-b-[3px] border-slate-900 flex items-center justify-between bg-slate-50/30">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white border-[2.5px] border-slate-900 shadow-[3px_3px_0_#1f2937] flex items-center justify-center">
                                {activeTab === 'profile' ? <User className="text-[#49B6E5]" size={20} strokeWidth={3} /> : <Lock className="text-amber-500" size={20} strokeWidth={3} />}
                            </div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                {activeTab === 'profile' ? 'Hồ sơ cá nhân' : 'Bảo mật tài khoản'}
                            </h2>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl border-[2px] border-slate-900/10 font-black text-[9px] uppercase tracking-widest text-slate-400 italic">
                            Live Sync Active
                        </div>
                    </div>

                    <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {activeTab === 'profile' ? (
                                <motion.div
                                    key="profile"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="max-w-3xl space-y-10"
                                >
                                    {profileError && (
                                        <Alert
                                            message={<span className="font-black uppercase text-[10px] tracking-widest">Dữ liệu từ phiên đăng nhập</span>}
                                            description={<span className="text-xs font-bold italic">Không thể kết nối với server hiện tại, hiển thị thông tin cục bộ.</span>}
                                            type="warning"
                                            showIcon
                                            className="rounded-2xl border-[2.5px] border-amber-200 bg-amber-50"
                                        />
                                    )}

                                    <div className="flex flex-col md:flex-row gap-12">
                                        {/* Avatar Column */}
                                        <div className="flex-shrink-0 flex flex-col items-center gap-4">
                                            <div className="relative group">
                                                <div className="w-32 h-32 rounded-[2rem] border-[4px] border-slate-900 bg-white shadow-[6px_6px_0_#1f2937] overflow-hidden flex items-center justify-center transition-transform hover:-rotate-3 group-hover:shadow-[8px_8px_0_#49B6E5]">
                                                    <img
                                                        src={getAvatarUrl()}
                                                        alt="Avatar"
                                                        className="w-full h-full object-cover"
                                                        onError={() => setAvatarError(true)}
                                                    />
                                                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm">
                                                        <Camera className="text-white mb-1" size={24} strokeWidth={3} />
                                                        <span className="text-[9px] font-black uppercase text-white tracking-widest">Thay đổi</span>
                                                    </div>
                                                </div>
                                                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-[#49B6E5] border-[3px] border-slate-900 shadow-[3px_3px_0_#1f2937] flex items-center justify-center text-white">
                                                    <Zap size={18} fill="currentColor" />
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Avatar Seed</p>
                                                <p className="text-xs font-bold text-slate-900 tracking-tight">{liveProfile?.id?.slice(0, 8)}</p>
                                            </div>
                                        </div>

                                        {/* Form Column */}
                                        <div className="flex-1 space-y-6">
                                            <Form
                                                form={profileForm}
                                                layout="vertical"
                                                onFinish={handleUpdateProfile}
                                                requiredMark={false}
                                                className="space-y-6"
                                            >
                                                <Form.Item
                                                    name="fullName"
                                                    label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Họ và tên</span>}
                                                    rules={[{ required: true, message: 'Nhập họ và tên' }]}
                                                >
                                                    <div className="relative group/field">
                                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/field:text-[#49B6E5] transition-colors" size={18} strokeWidth={3} />
                                                        <Input className="doodle-input pl-12" placeholder="Ví dụ: Nguyễn Văn A" />
                                                    </div>
                                                </Form.Item>

                                                <Form.Item
                                                    name="email"
                                                    label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Email đăng nhập</span>}
                                                >
                                                    <div className="relative opacity-60">
                                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} strokeWidth={3} />
                                                        <Input disabled className="doodle-input pl-12 bg-slate-50 cursor-not-allowed" />
                                                    </div>
                                                </Form.Item>

                                                <Form.Item
                                                    name="phone"
                                                    label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Số điện thoại liên hệ</span>}
                                                >
                                                    <div className="relative group/field">
                                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/field:text-[#49B6E5] transition-colors" size={18} strokeWidth={3} />
                                                        <Input className="doodle-input pl-12" placeholder="09xx xxx xxx" />
                                                    </div>
                                                </Form.Item>

                                                <div className="pt-4 flex justify-end">
                                                    <button
                                                        type="submit"
                                                        disabled={savingProfile}
                                                        className="h-14 px-10 rounded-2xl border-[3px] border-slate-900 bg-[#49B6E5] font-black text-xs uppercase tracking-[0.2em] text-white shadow-[6px_6px_0_#1f2937] hover:-translate-y-1 hover:shadow-[10px_10px_0_#1f2937] transition-all active:translate-y-0 flex items-center gap-3 disabled:opacity-50"
                                                    >
                                                        <Save size={18} strokeWidth={3} />
                                                        {savingProfile ? 'Đang lưu...' : 'Lưu hồ sơ'}
                                                    </button>
                                                </div>
                                            </Form>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="security"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="max-w-xl space-y-8"
                                >
                                    <div className="bg-amber-50 rounded-2xl border-[2.5px] border-amber-200 p-6 flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-white border-[2px] border-slate-900 flex-shrink-0 flex items-center justify-center text-amber-500">
                                            <Bell size={20} strokeWidth={3} className="animate-bounce" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black uppercase tracking-tight text-slate-900 mb-1">Mẹo bảo mật</h4>
                                            <p className="text-[10px] font-bold text-slate-500 italic">Mật khẩu nên chứa cả chữ hoa, chữ thường, số và ký tự đặc biệt để đảm bảo an toàn tối đa.</p>
                                        </div>
                                    </div>

                                    <Form
                                        form={passwordForm}
                                        layout="vertical"
                                        onFinish={handleChangePassword}
                                        requiredMark={false}
                                        className="space-y-6"
                                    >
                                        <Form.Item
                                            name="oldPassword"
                                            label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Mật khẩu hiện tại</span>}
                                            rules={[{ required: true, message: 'Nhập mật khẩu cũ' }]}
                                        >
                                            <Input.Password className="doodle-input" placeholder="••••••••" />
                                        </Form.Item>

                                        <Form.Item
                                            name="newPassword"
                                            label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Mật khẩu mới</span>}
                                            rules={[{ required: true, message: 'Nhập mật khẩu mới' }, { min: 8, message: 'Tối thiểu 8 ký tự' }]}
                                        >
                                            <Input.Password className="doodle-input" placeholder="••••••••" />
                                        </Form.Item>

                                        <Form.Item
                                            name="confirmPassword"
                                            label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Xác nhận mật khẩu mới</span>}
                                            dependencies={['newPassword']}
                                            rules={[
                                                { required: true, message: 'Xác nhận mật khẩu' },
                                                ({ getFieldValue }) => ({
                                                    validator(_, value) {
                                                        if (!value || getFieldValue('newPassword') === value) return Promise.resolve()
                                                        return Promise.reject(new Error('Mật khẩu không khớp!'))
                                                    }
                                                })
                                            ]}
                                        >
                                            <Input.Password className="doodle-input" placeholder="••••••••" />
                                        </Form.Item>

                                        <div className="pt-4 flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={savingPassword}
                                                className="h-14 px-10 rounded-2xl border-[3px] border-slate-900 bg-amber-500 font-black text-xs uppercase tracking-[0.2em] text-white shadow-[6px_6px_0_#1f2937] hover:-translate-y-1 hover:shadow-[10px_10px_0_#1f2937] transition-all active:translate-y-0 flex items-center gap-3 disabled:opacity-50"
                                            >
                                                <Lock size={18} strokeWidth={3} />
                                                {savingPassword ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
                                            </button>
                                        </div>
                                    </Form>

                                    <div className="pt-8 border-t-[2px] border-slate-50 grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-slate-50 border-[2px] border-slate-900/5 flex items-center gap-3 cursor-pointer hover:bg-white hover:border-slate-900 transition-all group">
                                            <CreditCard size={18} className="text-slate-400 group-hover:text-slate-900" />
                                            <span className="text-[9px] font-black uppercase text-slate-400 group-hover:text-slate-900">Tính năng thanh toán</span>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-slate-50 border-[2px] border-slate-900/5 flex items-center gap-3 cursor-pointer hover:bg-white hover:border-slate-900 transition-all group">
                                            <Layout size={18} className="text-slate-400 group-hover:text-slate-900" />
                                            <span className="text-[9px] font-black uppercase text-slate-400 group-hover:text-slate-900">Thiết bị đã đăng nhập</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </article>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .doodle-input {
                    height: 56px !important;
                    border: 3px solid #1f293710 !important;
                    border-radius: 1.25rem !important;
                    font-weight: 900 !important;
                    font-family: 'Nunito' !important;
                    background: #fbfbfc !important;
                    transition: all 0.2s ease !important;
                    padding-left: 1rem !important;
                }
                .doodle-input:focus, .doodle-input:hover {
                    border-color: #1f2937 !important;
                    background: white !important;
                    box-shadow: none !important;
                }
                .ant-form-item-label label { font-family: 'Nunito' !important; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            `}} />
        </div>
    )
}

export default SettingsPage;
