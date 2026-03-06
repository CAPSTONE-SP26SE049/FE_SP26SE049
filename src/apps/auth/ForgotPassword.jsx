import React, { useState } from 'react'
import { Form, Input, Button, message } from 'antd'
import { useNavigate, Link } from 'react-router-dom'
import { forgotPasswordAPI } from '../../services/authService'
import { Mail, ArrowLeft, Send } from 'lucide-react'
import illustration from '../../assets/login-illustration.png'

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

            {/* Right Panel - Forgot Password Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
                <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100 relative z-10 animate-slideUp">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail className="text-brand-green w-8 h-8" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Quên Mật Khẩu
                        </h2>
                        <p className="text-gray-500 font-medium">
                            Nhập email của bạn và chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.
                        </p>
                    </div>

                    <Form
                        layout="vertical"
                        form={form}
                        onFinish={onSubmit}
                        size="large"
                    >
                        <Form.Item
                            name="email"
                            rules={[
                                { required: true, message: 'Vui lòng nhập email' },
                                { type: 'email', message: 'Email không hợp lệ' },
                            ]}
                        >
                            <Input
                                prefix={<Mail className="text-gray-400 w-5 h-5 mr-2" />}
                                placeholder="Địa chỉ Email"
                                className="rounded-xl py-3 border-gray-200 focus:border-brand-green focus:shadow-green-100"
                            />
                        </Form.Item>

                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={submitting}
                            className="w-full rounded-xl h-12 bg-brand-green hover:bg-green-600 border-none shadow-lg shadow-green-200 text-white font-bold text-lg flex items-center justify-center gap-2 mt-4 transition-all transform hover:-translate-y-0.5"
                        >
                            Gửi Mã OTP <Send size={18} />
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
