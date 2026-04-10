import React, { useState } from 'react'
import { Form, Input, Button, message } from 'antd'
import { useNavigate, Link } from 'react-router-dom'
import { forgotPasswordAPI } from '../../services/authService'
import { Mail, ArrowLeft, Send, Sparkles, Home } from 'lucide-react'

export default function ForgotPassword() {
    const [form] = Form.useForm()
    const [submitting, setSubmitting] = useState(false)
    const navigate = useNavigate()

    const onSubmit = async (values) => {
        try {
            setSubmitting(true)
            await forgotPasswordAPI(values.email)
            message.success('Mã xác nhận đã được gửi đến email của bạn')
            // Navigate to ResetPassword, pass email along so they don't have to retype it
            navigate('/reset-password', { state: { email: values.email } })
        } catch (err) {
            if (err?.status === 404) {
                message.error('Không tìm thấy tài khoản với email này')
                form.setFields([{ name: 'email', errors: ['Email không tồn tại'] }])
            } else {
                message.error(err?.message || 'Không thể yêu cầu khôi phục mật khẩu')
            }
        } finally {
            setSubmitting(false)
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

            {/* Subtle Background Blobs (Matches Login) */}
            <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] bg-purple-300/30 rounded-full mix-blend-multiply blur-[80px] animate-blob"></div>
            <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-orange-300/30 rounded-full mix-blend-multiply blur-[80px] animate-blob" style={{ animationDelay: '2s' }}></div>

            {/* Main Floating Card Container */}
            <div className="w-full max-w-[950px] bg-white rounded-[2rem] shadow-[0_20px_60px_rgba(147,51,234,0.15)] flex flex-col md:flex-row overflow-hidden relative z-10 transition-all duration-500">

                {/* ==================== LEFT SIDE - REFINED POSTER ACCENT ==================== */}
                <div className="hidden md:block w-5/12 relative bg-gray-900 overflow-hidden">
                    <img
                        src="/speakvn_simple_poster.png"
                        alt="SpeakVN Hành Trình Xuyên Việt"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[15s] ease-out hover:scale-110"
                    />
                    {/* Elegant overlay gradient to seamlessly blend */}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-purple-900/30 to-transparent"></div>

                    {/* Content overlaid on poster */}
                    <div className="absolute bottom-10 left-8 right-8 text-white">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md mb-4 border border-white/20 shadow-lg shadow-black/20">
                            <Sparkles size={18} className="text-orange-300" />
                        </div>
                        <h2 className="text-3xl font-black leading-[1.1] mb-2 drop-shadow-xl text-white">
                            Khôi Phục<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">Tài Khoản</span>
                        </h2>
                        <p className="text-white/80 font-medium text-sm drop-shadow mt-1">
                            Đừng lo lắng, chúng tôi sẽ giúp bạn lấy lại quyền truy cập ngay lập tức!
                        </p>
                    </div>
                </div>

                {/* ==================== RIGHT SIDE - FORGOT PASSWORD FORM ==================== */}
                <div className="w-full md:w-7/12 flex flex-col justify-center p-8 lg:p-14 bg-white relative">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <Mail className="text-purple-600 w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-extrabold text-gray-800 mb-2">
                            Quên Mật Khẩu?
                        </h2>
                        <p className="text-gray-400 text-sm font-medium px-4">
                            Nhập email của bạn và chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.
                        </p>
                    </div>

                    <Form
                        layout="vertical"
                        form={form}
                        onFinish={onSubmit}
                        size="large"
                        className="forgot-form"
                    >
                        <Form.Item
                            name="email"
                            rules={[
                                { required: true, message: 'Vui lòng nhập email!' },
                                { type: 'email', message: 'Email không hợp lệ!' },
                            ]}
                            style={{ marginBottom: '24px' }}
                        >
                            <Input
                                prefix={<Mail className="text-gray-400 w-5 h-5 mr-1.5" strokeWidth={2.5} />}
                                placeholder="Địa chỉ Email"
                                className="h-12 rounded-2xl bg-gray-50/50 border-gray-200 hover:border-purple-400 hover:bg-white focus:bg-white focus:border-purple-500 text-gray-700 font-bold text-sm shadow-sm transition-all"
                            />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: '16px' }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={submitting}
                                block
                                className="h-12 rounded-2xl text-base font-black border-none shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
                                style={{ background: 'linear-gradient(135deg, #a855f7, #9333ea, #7e22ce)' }}
                            >
                                GỬI MÃ OTP <Send size={18} />
                            </Button>
                        </Form.Item>

                        <div className="mt-8 flex flex-col items-center">
                            <Link to="/login" className="flex items-center gap-1.5 text-gray-400 hover:text-purple-600 font-bold text-sm transition-colors group">
                                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                Quay lại đăng nhập
                            </Link>
                        </div>
                    </Form>
                </div>
            </div>

            {/* Scoped Styles */}
            <style>{`
                .forgot-form .ant-input-affix-wrapper {
                    border-radius: 16px !important;
                    padding: 0 16px !important;
                }
                .forgot-form .ant-input-affix-wrapper:hover {
                    border-color: #a855f7 !important;
                }
                .forgot-form .ant-input-affix-wrapper-focused {
                    border-color: #9333ea !important;
                    box-shadow: 0 0 0 4px rgba(147, 51, 234, 0.1) !important;
                }
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
            `}</style>
        </div>
    )
}
