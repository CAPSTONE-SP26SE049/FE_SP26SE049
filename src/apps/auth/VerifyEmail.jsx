import React, { useState, useEffect } from 'react'
import { Form, Input, Button, message, Alert } from 'antd'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { verifyEmailAPI, resendVerificationAPI } from '../../services/authService'
import { Mail, CheckCircle, ArrowLeft, RefreshCw, Home, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { DoodleLoading } from '../../components/ui/DoodleLoading'

export default function VerifyEmail() {
    const [form] = Form.useForm()
    const [submitting, setSubmitting] = useState(false)
    const [resending, setResending] = useState(false)
    const [countdown, setCountdown] = useState(0)

    const navigate = useNavigate()
    const location = useLocation()

    const [email] = useState(() => {
        const params = new URLSearchParams(location.search)
        return params.get('email') || location.state?.email || ''
    })

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
            setCountdown(60)
        } catch (err) {
            message.error(err?.message || 'Không thể gửi lại mã xác thực')
        } finally {
            setResending(false)
        }
    }

    if (submitting) {
        return (
            <div className="min-h-screen bg-[#fbf6ef] flex items-center justify-center">
                <DoodleLoading message="Đang xác thực tài khoản..." />
            </div>
        )
    }

    return (
        <div className="h-screen w-full bg-[#fbf6ef] flex items-center justify-center p-4 sm:p-2 font-nunito relative overflow-hidden">

            <Link
                to="/"
                className="absolute top-6 left-6 z-20 flex items-center gap-2 px-5 py-2.5 bg-white border-[2.5px] border-slate-900 rounded-2xl shadow-[4px_4px_0_#1f2937] text-slate-900 hover:bg-sky-50 transition-all font-black text-xs uppercase tracking-widest active:translate-y-0.5 active:shadow-none"
            >
                <Home size={16} strokeWidth={2.5} />
                Về Trang Chủ
            </Link>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[1000px] h-full max-h-[600px] bg-white rounded-[2.5rem] border-[3px] border-slate-900 shadow-[10px_10px_0_#1f2937] flex flex-col md:flex-row overflow-hidden relative z-10"
            >

                {/* LEFT SIDE */}
                <div className="hidden md:block w-5/12 relative bg-slate-900 border-r-[3px] border-slate-900 overflow-hidden">
                    <img
                        src="/speakvn_simple_poster.png"
                        alt="SpeakVN"
                        className="absolute inset-0 w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-[#49B6E5]/20 mix-blend-multiply"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>

                    <div className="absolute bottom-10 left-8 right-8 text-white space-y-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-400 border-[2.5px] border-white shadow-[3px_3px_0_#ffffff33]">
                            <Sparkles size={24} className="text-white" strokeWidth={3} />
                        </div>
                        <h2 className="text-4xl font-black leading-[1.1] font-nunito uppercase tracking-tight">
                            Xác Thực<br />
                            <span className="text-orange-400">Tài Khoản</span>
                        </h2>
                    </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="w-full md:w-7/12 flex flex-col justify-center p-8 lg:p-14 bg-white relative">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-sky-50 rounded-2xl border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f2937] flex items-center justify-center mx-auto mb-6">
                            <Mail className="text-[#49B6E5] w-8 h-8" strokeWidth={3} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Kiểm tra Email</h2>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-2 px-4">
                            Mã OTP đã được gửi đến <br />
                            <strong className="text-slate-900">{email || 'email của bạn'}</strong>
                        </p>
                    </div>

                    {!email && (
                        <div className="mb-8 p-4 bg-orange-50 rounded-2xl border-[2px] border-orange-200 text-orange-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                            Chưa có thông tin email.
                        </div>
                    )}

                    <Form
                        layout="vertical"
                        form={form}
                        onFinish={onSubmit}
                        size="large"
                        className="doodle-form"
                    >
                        <Form.Item
                            name="code"
                            rules={[
                                { required: true, message: 'Vui lòng nhập mã OTP' },
                                { len: 6, message: 'Mã OTP phải đúng 6 ký tự' }
                            ]}
                            className="mb-8"
                        >
                            <Input
                                placeholder="Nhập mã 6 số"
                                maxLength={6}
                                className="text-center text-2xl tracking-[0.5em] h-16 rounded-2xl border-[2.5px] border-slate-900 bg-slate-50 font-black shadow-[3px_3px_0_#1f2937] focus:bg-white transition-all overflow-hidden"
                            />
                        </Form.Item>

                        <Form.Item className="mb-10">
                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                disabled={!email}
                                className="h-14 rounded-2xl bg-[#49B6E5] text-white border-[2.5px] border-slate-900 shadow-[6px_6px_0_#1f2937] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0_#1f2937] active:translate-y-0.5 active:shadow-none"
                            >
                                XÁC NHẬN <CheckCircle size={18} strokeWidth={3} />
                            </Button>
                        </Form.Item>

                        <div className="flex flex-col items-center gap-6">
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={countdown > 0 || !email || resending}
                                className="text-slate-400 hover:text-[#49B6E5] font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw size={14} strokeWidth={3} className={resending ? 'animate-spin' : ''} />
                                {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã xác thực'}
                            </button>

                            <Link to="/login" className="flex items-center gap-1.5 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest transition-colors group">
                                <ArrowLeft size={16} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
                                Quay lại đăng nhập
                            </Link>
                        </div>
                    </Form>
                </div>
            </motion.div>

            <style>{`
                .doodle-form .ant-input {
                  border: none !important;
                  background: transparent !important;
                }
                .doodle-form .ant-input-affix-wrapper {
                  border: 2.5px solid #1f2937 !important;
                  border-radius: 1rem !important;
                  padding: 0 16px !important;
                  box-shadow: 2px 2px 0 #1f2937 !important;
                  transition: all 0.2s ease !important;
                  background-color: #f8fafc !important;
                }
                .doodle-form .ant-input-affix-wrapper:hover {
                  box-shadow: 4px 4px 0 #1f2937 !important;
                  transform: translate(-1px, -1px);
                }
                .doodle-form .ant-input-affix-wrapper-focused {
                  box-shadow: 4px 4px 0 #1f2937 !important;
                  border-color: #49B6E5 !important;
                  background-color: white !important;
                }
                .doodle-form .ant-form-item-explain-error {
                  font-size: 10px;
                  text-transform: uppercase;
                  font-weight: 900;
                  margin-top: 4px;
                  text-align: center;
                  color: #ef4444;
                }
            `}</style>
        </div>
    )
}
