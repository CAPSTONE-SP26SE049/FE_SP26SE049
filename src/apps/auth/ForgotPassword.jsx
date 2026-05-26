import React, { useState } from 'react'
import { Form, Input, Button, message } from 'antd'
import { useNavigate, Link } from 'react-router-dom'
import { forgotPasswordAPI } from '../../services/authService'
import { Mail, ArrowLeft, Send, Sparkles, Home, ShieldQuestion } from 'lucide-react'
import { motion } from 'framer-motion'
import { DoodleLoading } from '../../components/ui/DoodleLoading'

export default function ForgotPassword() {
    const [form] = Form.useForm()
    const [submitting, setSubmitting] = useState(false)
    const navigate = useNavigate()

    const onSubmit = async (values) => {
        try {
            setSubmitting(true)
            await forgotPasswordAPI(values.email)
            message.success('Mã xác nhận đã được gửi đến email của bạn')
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

    if (submitting) {
        return (
            <div className="min-h-screen bg-[#fbf6ef] flex items-center justify-center">
                <DoodleLoading message="Đang xử lý yêu cầu..." />
            </div>
        )
    }

    return (
        <div className="h-screen w-full bg-[#fbf6ef] flex items-center justify-center p-4 sm:p-2 font-nunito relative overflow-hidden">

            {/* Back to Home */}
            <Link
                to="/"
                className="absolute top-6 left-6 z-20 flex items-center gap-2 px-5 py-2.5 bg-white border-[2.5px] border-slate-900 rounded-2xl shadow-[4px_4px_0_#1f2937] text-slate-900 hover:bg-sky-50 transition-all font-black text-xs uppercase tracking-widest active:translate-y-0.5 active:shadow-none"
            >
                <Home size={16} strokeWidth={2.5} />
                Về Trang Chủ
            </Link>

            {/* Main Container */}
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
                            Khôi Phục<br />
                            <span className="text-orange-400">Truy Cập</span>
                        </h2>
                    </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="w-full md:w-7/12 flex flex-col justify-center p-8 lg:p-14 bg-white relative">
                    <div className="mb-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-[#49B6E5] border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f2937] flex items-center justify-center">
                                <ShieldQuestion size={24} className="text-white" strokeWidth={3} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Quên Mật Khẩu?</h1>
                                <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Chúng tôi sẽ hỗ trợ bạn</p>
                            </div>
                        </div>
                    </div>

                    <Form
                        layout="vertical"
                        form={form}
                        onFinish={onSubmit}
                        size="large"
                        className="doodle-form"
                    >
                        <Form.Item
                            name="email"
                            rules={[
                                { required: true, message: 'Vui lòng nhập email!' },
                                { type: 'email', message: 'Email không hợp lệ!' },
                            ]}
                            className="mb-8"
                        >
                            <Input
                                prefix={<Mail size={20} className="text-slate-400 mr-2" strokeWidth={2.5} />}
                                placeholder="Địa chỉ Email của bạn"
                                className="h-14 rounded-2xl border-[2.5px] border-slate-900 bg-slate-50 font-black text-sm shadow-[2px_2px_0_#1f2937] hover:shadow-[4px_4px_0_#1f2937]"
                            />
                        </Form.Item>

                        <Form.Item className="mb-8">
                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                className="h-14 rounded-2xl bg-[#49B6E5] text-white border-[2.5px] border-slate-900 shadow-[6px_6px_0_#1f2937] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0_#1f2937] active:translate-y-0.5 active:shadow-none"
                            >
                                GỬI MÃ OTP <Send size={18} strokeWidth={3} />
                            </Button>
                        </Form.Item>

                        <div className="text-center">
                            <Link to="/login" className="flex items-center justify-center gap-1.5 text-slate-400 hover:text-slate-900 font-black text-xs uppercase tracking-widest transition-colors group">
                                <ArrowLeft size={16} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
                                Quay lại đăng nhập
                            </Link>
                        </div>
                    </Form>
                </div>
            </motion.div>

            <style>{`
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
                  color: #ef4444;
                }
            `}</style>
        </div>
    )
}
