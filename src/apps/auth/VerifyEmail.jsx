import React, { useState, useEffect } from 'react'
import { Form, Input, Button, message, Alert } from 'antd'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { verifyEmailAPI, resendVerificationAPI } from '../../services/authService'
import { Mail, CheckCircle, ArrowLeft, RefreshCw, Home, Sparkles } from 'lucide-react'

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
        <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-4 sm:p-8 font-nunito relative overflow-hidden">
            {/* Back to Home Button */}
            <Link
                to="/"
                className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-md border border-gray-200/50 rounded-full shadow-sm text-gray-500 hover:text-purple-600 hover:bg-white hover:shadow-md transition-all group font-bold text-sm"
            >
                <Home size={16} className="group-hover:-translate-x-1 transition-transform" />
                Về Trang Chủ
            </Link>

            {/* Subtle Background Blobs (matching Login/Register) */}
            <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] bg-purple-300/30 rounded-full mix-blend-multiply blur-[80px] animate-blob"></div>
            <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-orange-300/30 rounded-full mix-blend-multiply blur-[80px] animate-blob" style={{ animationDelay: '2s' }}></div>

            {/* Main Floating Card Container */}
            <div className="w-full max-w-[950px] bg-white rounded-[2rem] shadow-[0_20px_60px_rgba(147,51,234,0.15)] flex flex-col md:flex-row overflow-hidden relative z-10">

                {/* ==================== LEFT SIDE - REFINED POSTER ACCENT ==================== */}
                <div className="hidden md:block w-5/12 relative bg-gray-900 overflow-hidden">
                    <img
                        src="/speakvn_simple_poster.png"
                        alt="SpeakVN Hành Trình Xuyên Việt"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[15s] ease-out hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-purple-900/30 to-transparent"></div>

                    <div className="absolute bottom-10 left-8 right-8 text-white">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md mb-4 border border-white/20 shadow-lg shadow-black/20">
                            <Sparkles size={18} className="text-orange-300" />
                        </div>
                        <h2 className="text-3xl font-black leading-[1.1] mb-2 drop-shadow-xl text-white">
                            Hành Trình<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">Xuyên Việt</span>
                        </h2>
                        <p className="text-white/80 font-medium text-sm drop-shadow mt-1">
                            Chinh phục tiếng Việt chuẩn mọi vùng miền
                        </p>
                    </div>
                </div>

                {/* ==================== RIGHT SIDE - VERIFY EMAIL FORM ==================== */}
                <div className="w-full md:w-7/12 flex flex-col justify-center p-8 lg:p-12 bg-white relative">

                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-100">
                            <Mail className="text-purple-600 w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-extrabold text-gray-800 mb-2">
                            Xác Thực Email
                        </h2>
                        <p className="text-gray-500 text-sm font-medium">
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
                                className="text-center text-xl tracking-widest rounded-2xl h-14 bg-gray-50/50 border-gray-200 hover:border-purple-400 hover:bg-white focus:bg-white focus:border-purple-500 font-black shadow-sm transition-all"
                            />
                        </Form.Item>

                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={submitting}
                            className="w-full rounded-2xl h-12 text-base font-black border-none shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 flex items-center justify-center gap-2 mt-2 transition-all duration-300 hover:-translate-y-0.5"
                            style={{ background: 'linear-gradient(135deg, #a855f7, #9333ea, #7e22ce)' }}
                            disabled={!email}
                        >
                            XÁC NHẬN <CheckCircle size={18} />
                        </Button>

                        <div className="mt-8 flex flex-col items-center gap-4 text-sm mx-auto">
                            <Button
                                type="link"
                                onClick={handleResend}
                                loading={resending}
                                disabled={countdown > 0 || !email}
                                className="flex items-center gap-2 text-gray-500 hover:text-purple-600 p-0 font-bold transition-colors"
                            >
                                <RefreshCw size={16} className={resending ? 'animate-spin' : ''} />
                                {countdown > 0 ? `Gửi lại mã sau ${countdown}s` : 'Gửi lại mã xác thực'}
                            </Button>

                            <Link to="/login" className="flex items-center gap-2 text-gray-400 hover:text-gray-600 mt-2 font-bold transition-colors">
                                <ArrowLeft size={16} /> Quay lại đăng nhập
                            </Link>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    )
}
