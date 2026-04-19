import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Upload, message, Spin, Alert } from 'antd'
import {
    UserOutlined, LockOutlined, SaveOutlined,
    MailOutlined, PhoneOutlined, CameraOutlined, SafetyCertificateOutlined,
    LoadingOutlined
} from '@ant-design/icons'
import { useAuth } from '../../../core/auth/AuthContext'
import { fetchProfileAPI, updateProfileAPI, changePasswordAPI } from '../../../services/userService'

const BRAND_PURPLE = 'linear-gradient(135deg, #9333ea, #7e22ce)'
const BRAND_ORANGE = 'linear-gradient(135deg, #f97316, #ea580c)'

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
                // Handle { data: { data: {...} } } or { data: {...} } wrapping
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
                // Fallback to session cache
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
        { key: 'profile' as const, icon: <UserOutlined />, label: 'Hồ sơ cá nhân', color: '#9333ea', bg: '#faf5ff' },
        { key: 'security' as const, icon: <LockOutlined />, label: 'Bảo mật', color: '#f97316', bg: '#fff7ed' },
    ]

    const inputStyle = { borderRadius: 12, height: 44, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }

    const avatarUrl = liveProfile?.avatar_url || liveProfile?.avatarUrl || liveProfile?.avatar
        || (session?.user as any)?.avatar_url
        || (session?.user as any)?.avatarUrl
        || (session?.user as any)?.avatar

    return (
        <div className="flex flex-col overflow-hidden rounded-2xl" style={{ height: 'calc(100vh - 110px)', background: '#f8f5ff' }}>

            {/* ── Header Strip ── */}
            <div className="flex-shrink-0 px-6 py-4 flex items-center gap-4 border-b border-gray-100 bg-white"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                    style={{ background: BRAND_PURPLE }}>
                    <UserOutlined style={{ fontSize: 18 }} />
                </div>
                <div>
                    <h1 className="text-lg font-black text-gray-800 leading-tight">Cài đặt hệ thống</h1>
                    <p className="text-xs text-gray-400 font-medium">Quản lý thông tin cá nhân và bảo mật</p>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="flex-1 flex min-h-0 p-4 gap-4">

                {/* Sidebar */}
                <div className="w-48 flex-shrink-0 flex flex-col gap-2">
                    {tabs.map(tab => (
                        <button key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left font-bold text-sm ${activeTab === tab.key
                                ? 'shadow-sm border'
                                : 'text-gray-500 hover:bg-white hover:shadow-sm border border-transparent'
                                }`}
                            style={activeTab === tab.key ? { color: tab.color, backgroundColor: tab.bg, borderColor: `${tab.color}30` } : {}}
                        >
                            <span style={{ color: activeTab === tab.key ? tab.color : '#9ca3af', fontSize: 16 }}>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 bg-white rounded-2xl border border-gray-100 overflow-auto p-6"
                    style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>

                    {/* ── Profile Tab ── */}
                    {activeTab === 'profile' && (
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-5 rounded-full" style={{ background: '#9333ea' }} />
                                <h2 className="font-black text-gray-800">Thông tin chung</h2>
                            </div>

                            {profileError && (
                                <Alert
                                    type="warning"
                                    message="Không thể tải dữ liệu mới nhất từ server"
                                    description="Đang hiển thị thông tin từ phiên đăng nhập. Kiểm tra kết nối và thử lại."
                                    className="mb-4 rounded-xl"
                                    showIcon
                                    closable
                                />
                            )}

                            <div className="flex gap-8">
                                {/* Avatar */}
                                <div className="flex-shrink-0">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden hover:border-purple-300 transition-all">
                                            {loadingProfile ? (
                                                <Spin indicator={<LoadingOutlined style={{ fontSize: 24, color: '#9333ea' }} spin />} />
                                            ) : avatarUrl ? (
                                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <UserOutlined className="text-3xl text-gray-300" />
                                            )}
                                            <div className="absolute inset-0 bg-purple-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-[2px] rounded-2xl">
                                                <Upload showUploadList={false}>
                                                    <div className="flex flex-col items-center text-white">
                                                        <CameraOutlined className="text-xl" />
                                                        <span className="text-[10px] font-bold mt-0.5">Thay ảnh</span>
                                                    </div>
                                                </Upload>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Form */}
                                <div className="flex-1">
                                    {loadingProfile ? (
                                        <div className="flex flex-col gap-4 mt-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="h-11 rounded-xl bg-gray-100 animate-pulse" />
                                            ))}
                                        </div>
                                    ) : (
                                        <Form
                                            form={profileForm}
                                            layout="vertical"
                                            onFinish={handleUpdateProfile}
                                            requiredMark={false}
                                            scrollToFirstError
                                        >
                                            {/* Họ và tên */}
                                            <Form.Item
                                                name="fullName"
                                                label={<span className="font-bold text-gray-600 text-sm">Họ và tên</span>}
                                                rules={[
                                                    { required: true, message: 'Vui lòng nhập họ và tên' },
                                                    { min: 2, message: 'Họ và tên phải có ít nhất 2 ký tự' },
                                                    { max: 100, message: 'Họ và tên không vượt quá 100 ký tự' },
                                                    {
                                                        pattern: /^[\p{L}\s'-]+$/u,
                                                        message: 'Họ và tên chỉ được chứa chữ cái, khoảng trắng, dấu gạch ngang và dấu nháy đơn'
                                                    },
                                                    {
                                                        validator: (_, val) => {
                                                            if (val && val.trim().length < 2) return Promise.reject('Họ và tên không được chỉ là khoảng trắng')
                                                            return Promise.resolve()
                                                        }
                                                    }
                                                ]}
                                            >
                                                <Input
                                                    prefix={<UserOutlined className="text-gray-300" />}
                                                    style={inputStyle}
                                                    placeholder="Nguyễn Văn A"
                                                    maxLength={100}
                                                    showCount
                                                />
                                            </Form.Item>

                                            {/* Email — read-only */}
                                            <Form.Item
                                                name="email"
                                                label={<span className="font-bold text-gray-600 text-sm">Email</span>}
                                                extra={<span className="text-gray-400 text-[11px]">Email dùng để đăng nhập và nhận thông báo — không thể thay đổi</span>}
                                            >
                                                <Input
                                                    disabled
                                                    prefix={<MailOutlined className="text-gray-300" />}
                                                    style={{ ...inputStyle, backgroundColor: '#f1f5f9', color: '#64748b' }}
                                                />
                                            </Form.Item>

                                            {/* Số điện thoại */}
                                            <Form.Item
                                                name="phone"
                                                label={<span className="font-bold text-gray-600 text-sm">Số điện thoại</span>}
                                                rules={[
                                                    {
                                                        pattern: /^(0|\+84)[3-9]\d{8}$/,
                                                        message: 'Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678)'
                                                    },
                                                    { max: 15, message: 'Số điện thoại không vượt quá 15 ký tự' }
                                                ]}
                                            >
                                                <Input
                                                    prefix={<PhoneOutlined className="text-gray-300" />}
                                                    style={inputStyle}
                                                    placeholder="0912 345 678"
                                                    maxLength={15}
                                                />
                                            </Form.Item>

                                            <div className="flex justify-end mt-2">
                                                <Button
                                                    type="primary"
                                                    htmlType="submit"
                                                    loading={savingProfile}
                                                    icon={<SaveOutlined />}
                                                    className="h-11 px-7 rounded-xl font-bold border-none"
                                                    style={{ background: BRAND_PURPLE, boxShadow: '0 4px 14px rgba(147,51,234,0.3)' }}
                                                >
                                                    Lưu thay đổi
                                                </Button>
                                            </div>
                                        </Form>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Security Tab ── */}
                    {activeTab === 'security' && (
                        <div className="max-w-lg">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-1 h-5 rounded-full" style={{ background: '#f97316' }} />
                                <h2 className="font-black text-gray-800">Bảo mật tài khoản</h2>
                            </div>

                            {/* Tip */}
                            <div className="flex gap-3 p-3.5 rounded-2xl mb-5 border border-orange-100" style={{ background: '#fff7ed' }}>
                                <SafetyCertificateOutlined className="text-orange-500 text-base mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-orange-800 mb-0.5">Mẹo bảo mật</p>
                                    <p className="text-xs text-orange-600/80">Dùng mật khẩu ≥ 8 ký tự, gồm chữ hoa, thường, số và ký tự đặc biệt.</p>
                                </div>
                            </div>

                            <Form
                                form={passwordForm}
                                layout="vertical"
                                onFinish={handleChangePassword}
                                requiredMark={false}
                                scrollToFirstError
                            >
                                <Form.Item
                                    name="oldPassword"
                                    label={<span className="font-bold text-gray-600 text-sm">Mật khẩu hiện tại</span>}
                                    rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
                                >
                                    <Input.Password style={inputStyle} placeholder="••••••••" />
                                </Form.Item>

                                <Form.Item
                                    name="newPassword"
                                    label={<span className="font-bold text-gray-600 text-sm">Mật khẩu mới</span>}
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                                        { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
                                        { max: 72, message: 'Mật khẩu không vượt quá 72 ký tự' },
                                        {
                                            pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                            message: 'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số'
                                        },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (value && value === getFieldValue('oldPassword'))
                                                    return Promise.reject(new Error('Mật khẩu mới phải khác mật khẩu hiện tại!'))
                                                return Promise.resolve()
                                            }
                                        })
                                    ]}
                                >
                                    <Input.Password style={inputStyle} placeholder="••••••••" />
                                </Form.Item>

                                <Form.Item
                                    name="confirmPassword"
                                    label={<span className="font-bold text-gray-600 text-sm">Xác nhận mật khẩu mới</span>}
                                    dependencies={['newPassword']}
                                    rules={[
                                        { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value || getFieldValue('newPassword') === value) return Promise.resolve()
                                                return Promise.reject(new Error('Mật khẩu không khớp!'))
                                            }
                                        })
                                    ]}
                                >
                                    <Input.Password style={inputStyle} placeholder="••••••••" />
                                </Form.Item>

                                <div className="flex justify-end mt-2">
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={savingPassword}
                                        icon={<LockOutlined />}
                                        className="h-11 px-7 rounded-xl font-bold border-none"
                                        style={{ background: BRAND_ORANGE, boxShadow: '0 4px 14px rgba(249,115,22,0.3)' }}
                                    >
                                        Cập nhật mật khẩu
                                    </Button>
                                </div>
                            </Form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AdminSettingsPage
