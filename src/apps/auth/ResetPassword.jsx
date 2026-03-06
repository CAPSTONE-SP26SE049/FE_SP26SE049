import React, { useState } from 'react'
import { Form, Input, Button, message, Alert } from 'antd'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { resetPasswordAPI } from '../../services/authService'
import { Lock, CheckCircle, ShieldCheck, ArrowLeft } from 'lucide-react'
import illustration from '../../assets/login-illustration.png'

const passwordRules = [
    { required: true, message: 'Vui lòng nhập mật khẩu mới' },
    { min: 8, message: 'Ít nhất 8 ký tự' },
    { pattern: /[A-Z]/, message: 'Ít nhất 1 chữ hoa' },
    {
        pattern: /[!@#$%^&*(),.?":{}|<>]/,
        message: 'Ít nhất 1 ký tự đặc biệt',
    },
]

export default function ResetPassword() {
    const [form] = Form.useForm()
    const [submitting, setSubmitting] = useState(false)

    const navigate = useNavigate()
    const location = useLocation()

    const [email] = useState(location.state?.email || '')

    const onSubmit = async (values) => {
        if (!email) {
            message.error('Vui lòng quay lại bước Quên mật khẩu để nhập email.')
            return
        }

        try {
            setSubmitting(true)
            await resetPasswordAPI(email, values.resetCode, values.newPassword)
            message.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập.')
            navigate('/login', { replace: true })
        } catch (err) {
            if (err?.status === 400 || err?.status === 404) {
                message.error(err?.message || 'Mã xác nhận không đúng hoặc đã hết hạn')
            } else {
                message.error('Đặt lại mật khẩu thất bại. Vui lòng thử lại sau.')
            }
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen flex bg-gray-50">
            {/* Left Panel - Branding & Illustration */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-green to-teal-600 relative overflow-hidden flex-col items-center justify-center text-white p-12">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                <div className="relative z-10 text-center max-w-lg">
                    <h1 className="text-4xl font-extrabold mb-4 tracking-tight drop-shadow-sm text-white">
                        SpeakVN Journey
                    </h1>
                    <p className="text-xl text-green-50 mb-8 font-light">
                        Chinh phục phát âm tiếng Việt qua hành trình khám phá đầy thú vị khắp Việt Nam.
                    </p>

                    <div className="relative mx-auto w-full max-w-md aspect-square bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow-2xl transform hover:scale-105 transition-transform duration-500">
                        <img
                            src={illustration}
                            alt="Bản đồ SpeakVN"
                            className="w-full h-full object-contain drop-shadow-lg"
                        />
                    </div>

                    <div className="mt-12 flex gap-4 justify-center">
                        <div className="text-center">
                            <div className="text-3xl font-bold">3</div>
                            <div className="text-sm opacity-80">Miền</div>
                        </div>
                        <div className="w-px bg-white/30 text-white"></div>
                        <div className="text-center">
                            <div className="text-3xl font-bold">15+</div>
                            <div className="text-sm opacity-80">Cấp Độ</div>
                        </div>
                        <div className="w-px bg-white/30"></div>
                        <div className="text-center">
                            <div className="text-3xl font-bold">AI</div>
                            <div className="text-sm opacity-80">Phản Hồi</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Reset Password Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
                <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100 relative z-10 animate-slideUp">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldCheck className="text-brand-red w-8 h-8" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Đặt Lại Mật Khẩu
                        </h2>
                        <p className="text-gray-500 font-medium">
                            Nhập mã OTP và tạo mật khẩu mới an toàn cho tài khoản {email ? <strong>{email}</strong> : 'của bạn'}.
                        </p>
                    </div>

                    {!email && (
                        <Alert
                            message="Yêu cầu email"
                            description="Vui lòng thực hiện lại từ bước quên mật khẩu để xác định tài khoản."
                            type="warning"
                            showIcon
                            className="mb-6 rounded-xl"
                        />
                    )}

                    <Form
                        layout="vertical"
                        form={form}
                        onFinish={onSubmit}
                        size="large"
                    >
                        <Form.Item
                            name="resetCode"
                            rules={[
                                { required: true, message: 'Vui lòng nhập mã OTP' },
                                { len: 6, message: 'Mã OTP phải đúng 6 ký tự' }
                            ]}
                        >
                            <Input
                                placeholder="Mã OTP 6 số"
                                maxLength={6}
                                className="text-center text-xl tracking-widest rounded-xl py-3 border-gray-200 focus:border-brand-red focus:shadow-red-100"
                            />
                        </Form.Item>

                        <Form.Item name="newPassword" rules={passwordRules} className="mt-6">
                            <Input.Password
                                prefix={<Lock className="text-gray-400 w-5 h-5 mr-2" />}
                                placeholder="Mật khẩu mới"
                                className="rounded-xl py-3 border-gray-200 focus:border-brand-red focus:shadow-red-100"
                            />
                        </Form.Item>

                        <Form.Item
                            name="confirmPassword"
                            dependencies={['newPassword']}
                            rules={[
                                { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('newPassword') === value) {
                                            return Promise.resolve()
                                        }
                                        return Promise.reject(new Error('Mật khẩu không khớp!'))
                                    },
                                }),
                            ]}
                        >
                            <Input.Password
                                prefix={<CheckCircle className="text-gray-400 w-5 h-5 mr-2" />}
                                placeholder="Nhập lại mật khẩu mới"
                                className="rounded-xl py-3 border-gray-200 focus:border-brand-red focus:shadow-red-100"
                            />
                        </Form.Item>

                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={submitting}
                            className="w-full rounded-xl h-12 bg-brand-red hover:bg-red-600 border-none shadow-lg shadow-red-200 text-white font-bold text-lg flex items-center justify-center gap-2 mt-4 transition-all transform hover:-translate-y-0.5"
                            disabled={!email}
                        >
                            Đổi Mật Khẩu <CheckCircle size={18} />
                        </Button>

                        <div className="mt-8 flex flex-col items-center text-sm">
                            <Link to="/login" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium transition-colors">
                                <ArrowLeft size={16} /> Quay lại đăng nhập
                            </Link>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    )
}
