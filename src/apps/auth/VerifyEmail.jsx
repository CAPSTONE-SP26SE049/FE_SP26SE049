import React, { useState, useEffect } from 'react'
import { Form, Input, Button, message, Alert } from 'antd'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { verifyEmailAPI, resendVerificationAPI } from '../../services/authService'
import { Mail, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import illustration from '../../assets/login-illustration.png'

export default function VerifyEmail() {
    const [form] = Form.useForm()
    const [submitting, setSubmitting] = useState(false)
    const [resending, setResending] = useState(false)
    const [countdown, setCountdown] = useState(0)

    const navigate = useNavigate()
    const location = useLocation()

    // Get email from URL params OR from router state (passed from Register)
    const [email] = useState(() => {
        const params = new URLSearchParams(location.search)
        return params.get('email') || location.state?.email || ''
    })

    // Auto-fill OTP code if present in the URL
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const codeParam = params.get('code')
        if (codeParam) {
            form.setFieldsValue({ code: codeParam })
        }
    }, [location.search, form])

    useEffect(() => {
        let timer
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000)
        }
        return () => clearTimeout(timer)
    }, [countdown])

    const onSubmit = async (values) => {
        if (!email) {
            message.error('Không tìm thấy email cần xác thực. Vui lòng đăng nhập lại.')
            navigate('/login')
            return
        }

        try {
            setSubmitting(true)
            await verifyEmailAPI(email, values.code)
            message.success('Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ.')
            navigate('/login', { replace: true })
        } catch (err) {
            message.error(err?.message || 'Mã xác nhận không đúng hoặc đã hết hạn')
        } finally {
            setSubmitting(false)
        }
    }

    const handleResend = async () => {
        if (!email) {
            message.error('Vui lòng nhập email ở trang đăng nhập hoặc đăng ký.')
            return
        }
        try {
            setResending(true)
            await resendVerificationAPI(email)
            message.success('Đã gửi lại mã xác thực!')
            setCountdown(60) // Prevent spamming resend
        } catch (err) {
            message.error(err?.message || 'Không thể gửi lại mã xác thực')
        } finally {
            setResending(false)
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

            {/* Right Panel - Verify Email Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
                <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100 relative z-10 animate-slideUp">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail className="text-brand-blue w-8 h-8" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Xác Thực Email
                        </h2>
                        <p className="text-gray-500 font-medium">
                            Mã OTP 6 số đã được gửi đến <br />
                            <strong className="text-gray-900">{email || 'email của bạn'}</strong>
                        </p>
                    </div>

                    {!email && (
                        <Alert
                            message="Chưa có thông tin email"
                            description="Vui lòng quay lại để bắt đầu quá trình xác thực."
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
                            name="code"
                            rules={[
                                { required: true, message: 'Vui lòng nhập mã OTP' },
                                { len: 6, message: 'Mã OTP phải đúng 6 ký tự' }
                            ]}
                        >
                            <Input
                                placeholder="Nhập mã 6 số"
                                maxLength={6}
                                className="text-center text-xl tracking-widest rounded-xl py-3 border-gray-200 focus:border-brand-blue focus:shadow-blue-100"
                            />
                        </Form.Item>

                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={submitting}
                            className="w-full rounded-xl h-12 bg-brand-blue hover:bg-blue-600 border-none shadow-lg shadow-blue-200 text-white font-bold text-lg flex items-center justify-center gap-2 mt-4 transition-all transform hover:-translate-y-0.5"
                            disabled={!email}
                        >
                            Xác Nhận <CheckCircle size={18} />
                        </Button>

                        <div className="mt-8 flex flex-col items-center gap-4 text-sm max-w-sm mx-auto">
                            <Button
                                type="link"
                                onClick={handleResend}
                                loading={resending}
                                disabled={countdown > 0 || !email}
                                className="flex items-center gap-2 text-gray-500 hover:text-brand-blue p-0 font-medium transition-colors"
                                title={countdown > 0 ? `Vui lòng đợi ${countdown}s để thử lại` : ''}
                            >
                                <RefreshCw size={16} className={resending ? 'animate-spin' : ''} />
                                {countdown > 0 ? `Gửi lại mã sau ${countdown}s` : 'Gửi lại mã xác thực'}
                            </Button>

                            <Link to="/login" className="flex items-center gap-2 text-gray-400 hover:text-gray-600 mt-2 font-medium transition-colors">
                                <ArrowLeft size={16} /> Quay lại đăng nhập
                            </Link>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    )
}
