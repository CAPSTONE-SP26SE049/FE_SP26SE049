import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Upload, message, Spin, Alert } from 'antd'
import {
    User, Lock, Save, Mail, Phone,
    Camera, ShieldCheck, Loader2, Info,
    UserCircle, Key, ChevronRight, Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../../core/auth/AuthContext'
import { fetchProfileAPI, updateProfileAPI, changePasswordAPI } from '../../../services/userService'
import clsx from 'clsx'

const AdminSettingsPage: React.FC = () => {
    const { session, updateSessionItem } = useAuth()

    const [profileForm] = Form.useForm()
    const [passwordForm] = Form.useForm()

    const [savingProfile, setSavingProfile] = useState(false)
    const [savingPassword, setSavingPassword] = useState(false)
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile')
    const [loadingProfile, setLoadingProfile] = useState(true)
    const [profileError, setProfileError] = useState<string | null>(null)
    const [liveProfile, setLiveProfile] = useState<any>(null)

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
    }, [])

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
        { key: 'profile' as const, icon: UserCircle, label: 'Thông tin cá nhân', color: '#8b5cf6', bg: 'bg-violet-50' },
        { key: 'security' as const, icon: ShieldCheck, label: 'Bảo mật & MK', color: '#f97316', bg: 'bg-orange-50' },
    ]

    const avatarUrl = liveProfile?.avatar_url || liveProfile?.avatarUrl || liveProfile?.avatar
        || (session?.user as any)?.avatar_url
        || (session?.user as any)?.avatarUrl
        || (session?.user as any)?.avatar

    return (
        <div className="min-h-screen bg-[#fbf6ef] font-nunito p-8 space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-10 bg-[#49B6E5] rounded-full shadow-[2px_2px_0_#1f293705]" />
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Cài đặt hệ thống</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Tùy chỉnh thông tin cá nhân và quản lý an toàn bảo mật</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-10 items-start">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-72 flex flex-col gap-4">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.key
                        return (
                            <motion.button
                                key={tab.key}
                                whileHover={{ x: isActive ? 0 : 5 }}
                                onClick={() => setActiveTab(tab.key)}
                                className={clsx(
                                    "w-full px-6 py-4 rounded-2xl border-[3px] transition-all flex items-center justify-between group",
                                    isActive
                                        ? "bg-white border-slate-900 shadow-[5px_5px_0_#1f2937]"
                                        : "bg-transparent border-transparent hover:bg-white/50 text-slate-400"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={clsx(
                                        "w-10 h-10 rounded-xl border-[2px] border-slate-900 flex items-center justify-center transition-transform group-hover:rotate-3",
                                        isActive ? tab.bg : "bg-slate-50"
                                    )}>
                                        <Icon size={20} style={{ color: isActive ? tab.color : '#94a3b8' }} strokeWidth={3} />
                                    </div>
                                    <span className={clsx("text-xs font-black uppercase tracking-widest", isActive ? "text-slate-900" : "text-slate-400")}>
                                        {tab.label}
                                    </span>
                                </div>
                                {isActive && <ChevronRight size={14} className="text-slate-900" strokeWidth={4} />}
                            </motion.button>
                        )
                    })}

                    <div className="mt-10 p-6 bg-[#49B6E5]/10 border-[3px] border-slate-900 border-dashed rounded-[2rem]">
                        <div className="flex items-center gap-3 mb-3">
                            <Zap size={18} className="text-[#49B6E5]" fill="currentColor" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Mẹo quản trị</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 italic leading-relaxed">
                            Đảm bảo bạn luôn cập nhật mật khẩu ít nhất 3 tháng một lần để bảo vệ dữ liệu hệ thống.
                        </p>
                    </div>
                </div>

                {/* Content Area */}
                <article className="flex-1 w-full bg-white rounded-[2.5rem] border-[3.5px] border-slate-900 shadow-[10px_10px_0_#1f2937] overflow-hidden">
                    <div className="p-8 lg:p-12">
                        <AnimatePresence mode="wait">
                            {activeTab === 'profile' ? (
                                <motion.div
                                    key="profile"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-10"
                                >
                                    <div className="flex items-center gap-4 border-b-[2px] border-slate-50 pb-6">
                                        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-500">
                                            <User size={24} strokeWidth={3} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Hồ sơ cá nhân</h2>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cập nhật danh tính và thông tin liên lạc của bạn</p>
                                        </div>
                                    </div>

                                    {profileError && (
                                        <Alert
                                            message={<span className="text-xs font-black uppercase tracking-widest">Sự cố đồng bộ</span>}
                                            description={<span className="text-[10px] font-bold italic">Không thể tải dữ liệu mới nhất. Đang sử dụng dữ liệu tạm thời.</span>}
                                            type="warning"
                                            showIcon
                                            className="rounded-2xl border-[2px] border-orange-200"
                                        />
                                    )}

                                    <div className="flex flex-col md:flex-row gap-12">
                                        {/* Avatar Section */}
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="relative group">
                                                <div className="w-32 h-32 rounded-[2.5rem] border-[4px] border-slate-900 bg-white shadow-[6px_6px_0_#1f2937] overflow-hidden transition-transform group-hover:-rotate-2">
                                                    {loadingProfile ? (
                                                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50">
                                                            <motion.div
                                                                animate={{ rotate: 360 }}
                                                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                                                className="w-10 h-10 rounded-xl bg-white border-[2.5px] border-slate-900 shadow-[3px_3px_0_#49B6E5] flex items-center justify-center mb-2"
                                                            >
                                                                <Zap className="text-[#49B6E5]" size={20} fill="#49B6E5" fillOpacity={0.2} />
                                                            </motion.div>
                                                            <span className="text-[8px] font-black uppercase text-slate-300 animate-pulse">Syncing...</span>
                                                        </div>
                                                    ) : avatarUrl ? (
                                                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-200">
                                                            <UserCircle size={64} strokeWidth={1} />
                                                        </div>
                                                    )}
                                                </div>
                                                <Upload showUploadList={false}>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        className="absolute -bottom-2 -right-2 w-11 h-11 bg-[#49B6E5] border-[2.5px] border-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg transition-colors"
                                                    >
                                                        <Camera size={20} strokeWidth={3} />
                                                    </motion.button>
                                                </Upload>
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Ảnh đại diện</span>
                                        </div>

                                        {/* Form Section */}
                                        <div className="flex-1">
                                            <Form
                                                form={profileForm}
                                                layout="vertical"
                                                onFinish={handleUpdateProfile}
                                                className="space-y-6"
                                            >
                                                <Form.Item
                                                    name="fullName"
                                                    label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Họ và tên</span>}
                                                    rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                                                >
                                                    <Input
                                                        prefix={<User className="text-slate-300 mr-2" size={18} strokeWidth={3} />}
                                                        className="doodle-input"
                                                        placeholder="Ví dụ: Nguyễn Văn A"
                                                    />
                                                </Form.Item>

                                                <Form.Item
                                                    name="email"
                                                    label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Email xác thực</span>}
                                                >
                                                    <Input
                                                        prefix={<Mail className="text-slate-400 mr-2" size={18} strokeWidth={3} />}
                                                        className="doodle-input bg-slate-50 cursor-not-allowed opacity-70"
                                                        disabled
                                                    />
                                                </Form.Item>

                                                <Form.Item
                                                    name="phone"
                                                    label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Số điện thoại</span>}
                                                    rules={[{ pattern: /^(0|\+84)[3-9]\d{8}$/, message: 'Số điện thoại không hợp lệ' }]}
                                                >
                                                    <Input
                                                        prefix={<Phone className="text-slate-300 mr-2" size={18} strokeWidth={3} />}
                                                        className="doodle-input"
                                                        placeholder="09xx xxx xxx"
                                                    />
                                                </Form.Item>

                                                <div className="pt-4">
                                                    <motion.button
                                                        whileHover={{ scale: 1.02, y: -2 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        type="submit"
                                                        disabled={savingProfile}
                                                        className="h-14 px-10 bg-slate-900 border-[3px] border-slate-900 rounded-2xl shadow-[5px_5px_0_#49B6E5] text-xs font-black uppercase tracking-widest text-white transition-all flex items-center gap-3"
                                                    >
                                                        {savingProfile ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                                        Lưu hồ sơ
                                                    </motion.button>
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
                                    className="space-y-10"
                                >
                                    <div className="flex items-center gap-4 border-b-[2px] border-slate-50 pb-6">
                                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                                            <Lock size={24} strokeWidth={3} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">An toàn & Bảo mật</h2>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thay đổi mật khẩu và quản lý quyền truy cập</p>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-blue-50 border-[2.5px] border-slate-900/5 rounded-[2rem] flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white border-[2px] border-slate-900 flex items-center justify-center text-[#49B6E5] shrink-0">
                                            <Info size={20} strokeWidth={3} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-600">Lời khuyên an toàn</p>
                                            <p className="text-[11px] font-bold text-slate-500 italic leading-relaxed">
                                                Mật khẩu nên chứa ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và chữ số để đảm bảo an toàn tuyệt đối.
                                            </p>
                                        </div>
                                    </div>

                                    <Form
                                        form={passwordForm}
                                        layout="vertical"
                                        onFinish={handleChangePassword}
                                        className="max-w-md space-y-6"
                                    >
                                        <Form.Item
                                            name="oldPassword"
                                            label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Mật khẩu hiện tại</span>}
                                            rules={[{ required: true, message: 'Nhập mật khẩu hiện tại' }]}
                                        >
                                            <Input.Password
                                                prefix={<Key className="text-slate-300 mr-2" size={18} strokeWidth={3} />}
                                                className="doodle-input"
                                                placeholder="••••••••"
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            name="newPassword"
                                            label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Mật khẩu mới</span>}
                                            rules={[
                                                { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                                                { min: 8, message: 'Tối thiểu 8 ký tự' }
                                            ]}
                                        >
                                            <Input.Password
                                                prefix={<Lock className="text-slate-300 mr-2" size={18} strokeWidth={3} />}
                                                className="doodle-input"
                                                placeholder="••••••••"
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            name="confirmPassword"
                                            label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Xác nhận mật khẩu mới</span>}
                                            dependencies={['newPassword']}
                                            rules={[
                                                { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                                                ({ getFieldValue }) => ({
                                                    validator(_, value) {
                                                        if (!value || getFieldValue('newPassword') === value) return Promise.resolve()
                                                        return Promise.reject(new Error('Mật khẩu không khớp!'))
                                                    }
                                                })
                                            ]}
                                        >
                                            <Input.Password
                                                prefix={<Lock className="text-slate-300 mr-2" size={18} strokeWidth={3} />}
                                                className="doodle-input"
                                                placeholder="••••••••"
                                            />
                                        </Form.Item>

                                        <div className="pt-4">
                                            <motion.button
                                                whileHover={{ scale: 1.02, y: -2 }}
                                                whileTap={{ scale: 0.98 }}
                                                type="submit"
                                                disabled={savingPassword}
                                                className="h-14 px-10 bg-orange-500 border-[3px] border-slate-900 rounded-2xl shadow-[5px_5px_0_#1f2937] text-xs font-black uppercase tracking-widest text-white transition-all flex items-center gap-3"
                                            >
                                                {savingPassword ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                                Cập nhật mật khẩu
                                            </motion.button>
                                        </div>
                                    </Form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </article>
            </div>

            {/* Custom Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .doodle-input {
                    height: 54px; border: 2.5px solid #1f293720 !important; border-radius: 1.25rem !important;
                    font-weight: 700 !important; font-family: 'Nunito' !important;
                    transition: all 0.2s ease !important;
                    display: flex !important;
                    align-items: center !important;
                }
                .doodle-input:focus, .doodle-input:hover, .doodle-input:focus-within, .ant-input-affix-wrapper-focused { border-color: #49B6E5 !important; box-shadow: none !important; }
                
                .ant-input-password .ant-input-suffix { font-size: 18px; color: #94a3b8; }
                .ant-input-password-icon { color: #94a3b8 !important; }
                
                .ant-form-item-label label { margin-bottom: 4px !important; }
                .ant-form-item-explain-error { font-size: 10px; font-weight: 800; text-transform: uppercase; margin-top: 4px; }
            `}} />
        </div>
    )
}

export default AdminSettingsPage
