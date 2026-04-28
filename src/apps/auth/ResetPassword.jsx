import React, { useState } from 'react'
import { Form, Input, Button, message } from 'antd'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { resetPasswordAPI } from '../../services/authService'
import { Lock, CheckCircle, ShieldCheck, ArrowLeft, Sparkles, Home } from 'lucide-react'
import { motion } from 'framer-motion'
import { DoodleLoading } from '../../components/ui/DoodleLoading'

const passwordRules = [
    { required: true, message: 'Vui lòng nhập mật khẩu mới' },
    { min: 8, message: 'Ít nhất 8 ký tự' },
    { pattern: /[A-Z]/, message: 'Ít nhất 1 chữ hoa' },
    { pattern: /[a-z]/, message: 'Ít nhất 1 chữ thường' },
    { pattern: /\d/, message: 'Ít nhất 1 số' },
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

    if (submitting) {
        return (
            <div className="min-h-screen bg-[#fbf6ef] flex items-center justify-center">
                <DoodleLoading message="Đang cập nhật mật khẩu mới..." />
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
                className="w-full max-w-[1000px] h-full max-h-[620px] bg-white rounded-[2.5rem] border-[3px] border-slate-900 shadow-[10px_10px_0_#1f2937] flex flex-col md:flex-row overflow-hidden relative z-10"
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
                            Mật Khẩu<br />
                            <span className="text-orange-400">Mới An Toàn</span>
                        </h2>
                    </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="w-full md:w-7/12 flex flex-col justify-center p-8 lg:p-14 bg-white relative">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-sky-50 rounded-2xl border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f2937] flex items-center justify-center mx-auto mb-6">
                            <ShieldCheck className="text-[#49B6E5] w-8 h-8" strokeWidth={3} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Đặt Lại Mật Khẩu</h2>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-2 px-4 text-center">
                            Nhập OTP và tạo mật khẩu mới cho <br />
                            <strong className="text-slate-900">{email || 'tài khoản của bạn'}</strong>
                        </p>
                    </div>

                    {!email && (
                        <div className="mb-8 p-4 bg-orange-50 rounded-2xl border-[2px] border-orange-200 text-orange-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                            Vui lòng bắt đầu lại từ bước "Quên mật khẩu".
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
                            name="resetCode"
                            rules={[
                                { required: true, message: 'Vui lòng nhập mã OTP' },
                                { len: 6, message: 'Mã OTP phải đúng 6 ký tự' }
                            ]}
                            className="mb-5"
                        >
                            <Input
                                placeholder="OTP 6 số"
                                maxLength={6}
                                className="text-center text-xl tracking-[0.6em] h-14 rounded-2xl border-[2.5px] border-slate-900 bg-slate-50 font-black shadow-[2px_2px_0_#1f2937] focus:bg-white transition-all overflow-hidden"
                            />
                        </Form.Item>

                        <Form.Item name="newPassword" rules={passwordRules} className="mb-5">
                            <Input.Password
                                prefix={<Lock size={20} className="text-slate-400 mr-2" strokeWidth={2.5} />}
                                placeholder="Mật khẩu mới"
                                className="h-14 rounded-2xl border-[2.5px] border-slate-900 bg-slate-50 font-black text-sm shadow-[2px_2px_0_#1f2937] hover:shadow-[4px_4px_0_#1f2937]"
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
                            className="mb-8"
                        >
                            <Input.Password
                                prefix={<CheckCircle size={20} className="text-slate-400 mr-2" strokeWidth={2.5} />}
                                placeholder="Xác nhận mật khẩu"
                                className="h-14 rounded-2xl border-[2.5px] border-slate-900 bg-slate-50 font-black text-sm shadow-[2px_2px_0_#1f2937] hover:shadow-[4px_4px_0_#1f2937]"
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
                                ĐỔI MẬT KHẨU <CheckCircle size={18} strokeWidth={3} />
                            </Button>
                        </Form.Item>

                        <div className="text-center">
                            <Link to="/login" className="flex items-center justify-center gap-1.5 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest transition-colors group">
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
