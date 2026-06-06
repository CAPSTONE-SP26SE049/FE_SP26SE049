import React, { useState } from 'react'
import { Steps, Form, Input, Button, message } from 'antd'
import { useNavigate, Link } from 'react-router-dom'
import { registerAPI } from '../../services/authService'
import {
  User,
  Lock,
  Mail,
  Phone,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Home,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { DoodleLoading } from '../../components/ui/DoodleLoading'

const passwordRules = [
  { required: true, message: 'Vui lòng nhập mật khẩu' },
  { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
  { pattern: /[A-Z]/, message: 'Phải chứa ít nhất 1 chữ hoa' },
  { pattern: /[a-z]/, message: 'Phải chứa ít nhất 1 chữ thường' },
  { pattern: /\d/, message: 'Phải chứa ít nhất 1 số' },
  {
    pattern: /[!@#$%^&*(),.?":{}|<>]/,
    message: 'Phải chứa ít nhất 1 ký tự đặc biệt',
  },
]

const steps = [
  { title: 'Tài Khoản' },
  { title: 'Thông Tin' },
  { title: 'Hoàn Tất' },
]

export default function Register() {
  const [current, setCurrent] = useState(0)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const next = async () => {
    try {
      let fields = []
      if (current === 0) {
        fields = ['email', 'password', 'confirmPassword']
      } else if (current === 1) {
        fields = ['fullName', 'phone']
      }
      await form.validateFields(fields)
      setCurrent(current + 1)
    } catch {
    }
  }

  const prev = () => {
    setCurrent(current - 1)
  }

  const onSubmit = async () => {
    try {
      await form.validateFields()
      const allValues = form.getFieldsValue(true)
      const payload = {
        email: allValues.email,
        password: allValues.password,
        fullName: allValues.fullName,
        phone: allValues.phone,
      }

      setSubmitting(true)
      await registerAPI(payload)
      message.success('Đăng ký thành công! Vui lòng kiểm tra email để xác thực.')
      navigate('/verify-email', { replace: true, state: { email: allValues.email } })
    } catch (err) {
      // 1. Ant Design frontend validation error (err.errorFields is an Array)
      if (err?.errorFields && Array.isArray(err.errorFields)) {
        const errorNames = err.errorFields.map(field => field.name[0])
        if (errorNames.includes('email') || errorNames.includes('password') || errorNames.includes('confirmPassword')) {
          setCurrent(0)
        } else if (errorNames.includes('fullName') || errorNames.includes('phone')) {
          setCurrent(1)
        }
        return
      }

      // 2. Backend validation error (err.errorFields is an Object)
      if (err?.errorFields && typeof err.errorFields === 'object') {
        const fields = Object.keys(err.errorFields).map(key => ({
          name: key,
          errors: [err.errorFields[key]]
        }))
        form.setFields(fields)

        const errorKeys = Object.keys(err.errorFields)
        if (errorKeys.includes('email') || errorKeys.includes('password')) {
          setCurrent(0)
        } else if (errorKeys.includes('fullName') || errorKeys.includes('phone')) {
          setCurrent(1)
        }
        return
      }

      // 3. General backend error
      const backendMsg = err?.response?.data?.message
      message.error(backendMsg ?? err?.message ?? 'Đăng ký thất bại. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  const currentValues = form.getFieldsValue(true)

  const renderStepContent = () => {
    return (
      <div className="relative min-h-[220px]">
        {/* Step 1: Tai khoa */}
        <motion.div
          initial={{ opacity: 1, x: 0, height: 'auto' }}
          animate={{
            opacity: current === 0 ? 1 : 0,
            x: current === 0 ? 0 : -50,
            height: current === 0 ? 'auto' : 0,
          }}
          transition={{ duration: 0.3 }}
          className="space-y-4 overflow-hidden"
          style={{ pointerEvents: current === 0 ? 'auto' : 'none' }}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input
              prefix={<Mail size={20} className="text-slate-400 mr-2" strokeWidth={2.5} />}
              placeholder="Địa chỉ Email"
              className="h-14 rounded-2xl border-[2.5px] border-slate-900 bg-slate-50 font-black text-sm shadow-[2px_2px_0_#1f2937] hover:shadow-[4px_4px_0_#1f2937]"
            />
          </Form.Item>

          <Form.Item name="password" rules={passwordRules}>
            <Input.Password
              prefix={<Lock size={20} className="text-slate-400 mr-2" strokeWidth={2.5} />}
              placeholder="Mật khẩu"
              className="h-14 rounded-2xl border-[2.5px] border-slate-900 bg-slate-50 font-black text-sm shadow-[2px_2px_0_#1f2937] hover:shadow-[4px_4px_0_#1f2937]"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('Mật khẩu không khớp!'))
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<ShieldCheck size={20} className="text-slate-400 mr-2" strokeWidth={2.5} />}
              placeholder="Nhập lại mật khẩu"
              className="h-14 rounded-2xl border-[2.5px] border-slate-900 bg-slate-50 font-black text-sm shadow-[2px_2px_0_#1f2937] hover:shadow-[4px_4px_0_#1f2937]"
            />
          </Form.Item>
        </motion.div>

        {/* Step 2: Thong tin */}
        <motion.div
          initial={{ opacity: 0, x: 50, height: 0 }}
          animate={{
            opacity: current === 1 ? 1 : 0,
            x: current === 1 ? 0 : (current < 1 ? 50 : -50),
            height: current === 1 ? 'auto' : 0,
          }}
          transition={{ duration: 0.3 }}
          className="space-y-4 overflow-hidden"
          style={{ pointerEvents: current === 1 ? 'auto' : 'none' }}
        >
          <Form.Item
            name="fullName"
            rules={[
              { required: true, message: 'Vui lòng nhập họ tên' },
              { min: 2, message: 'Họ tên tối thiểu 2 ký tự' },
              { max: 50, message: 'Họ tên tối đa 50 ký tự' }
            ]}
          >
            <Input
              prefix={<User size={20} className="text-slate-400 mr-2" strokeWidth={2.5} />}
              placeholder="Họ và Tên"
              className="h-14 rounded-2xl border-[2.5px] border-slate-900 bg-slate-50 font-black text-sm shadow-[2px_2px_0_#1f2937] hover:shadow-[4px_4px_0_#1f2937]"
            />
          </Form.Item>

          <Form.Item
            name="phone"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại' },
              { pattern: /^(0|\+84)(3[2-9]|5[6-9]|7[06-9]|8[0-9]|9[0-9])\d{7}$/, message: 'Số điện thoại Việt Nam không hợp lệ' },
            ]}
          >
            <Input
              prefix={<Phone size={20} className="text-slate-400 mr-2" strokeWidth={2.5} />}
              placeholder="Số điện thoại"
              className="h-14 rounded-2xl border-[2.5px] border-slate-900 bg-slate-50 font-black text-sm shadow-[2px_2px_0_#1f2937] hover:shadow-[4px_4px_0_#1f2937]"
            />
          </Form.Item>
        </motion.div>

        {/* Step 3: Hoan tat */}
        <motion.div
          initial={{ opacity: 0, x: 50, height: 0 }}
          animate={{
            opacity: current === 2 ? 1 : 0,
            x: current === 2 ? 0 : 50,
            height: current === 2 ? 'auto' : 0,
          }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
          style={{ pointerEvents: current === 2 ? 'auto' : 'none' }}
        >
          <div className="bg-orange-50 p-6 rounded-[2rem] border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f2937] mb-4">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
              <CheckCircle className="text-green-500" size={20} strokeWidth={3} /> Xác nhận
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-white border-[2px] border-slate-900 p-3 rounded-xl shadow-[2px_2px_0_#1f2937]">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Email</span>
                <span className="font-black text-slate-900 text-sm tracking-tight">{currentValues.email}</span>
              </div>
              <div className="flex justify-between items-center bg-white border-[2px] border-slate-900 p-3 rounded-xl shadow-[2px_2px_0_#1f2937]">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Họ tên</span>
                <span className="font-black text-slate-900 text-sm tracking-tight">{currentValues.fullName}</span>
              </div>
              <div className="flex justify-between items-center bg-white border-[2px] border-slate-900 p-3 rounded-xl shadow-[2px_2px_0_#1f2937]">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">SĐT</span>
                <span className="font-black text-slate-900 text-sm tracking-tight">{currentValues.phone}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full bg-[#fbf6ef] flex items-center justify-center p-4 sm:p-2 font-nunito relative overflow-hidden">

      {/* Decorative Doodles */}
      <div className="absolute top-10 right-10 pointer-events-none opacity-20">
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="currentColor" className="text-slate-900 animate-float">
          <path d="M20,20 L80,80 M80,20 L20,80" strokeWidth="3" fill="none" />
        </svg>
      </div>

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
        className="w-full max-w-[550px] h-full max-h-[620px] bg-white rounded-[2.5rem] border-[3px] border-slate-900 shadow-[10px_10px_0_#1f2937] p-6 md:p-8 relative z-10 overflow-y-auto"
      >
        <div className="text-center mb-6">
          <div className="mx-auto w-10 h-10 rounded-2xl bg-orange-400 border-[2.5px] border-slate-900 shadow-[2px_2px_0_#1f2937] flex items-center justify-center mb-3">
            <Sparkles size={20} className="text-white" strokeWidth={3} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight font-nunito">Đăng Ký</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Bắt đầu hành trình của bạn</p>
        </div>

        <div className="mb-6 px-4">
          <Steps
            current={current}
            size="small"
            items={steps}
            className="doodle-steps"
          />
        </div>

        <Form layout="vertical" form={form} className="doodle-form">
          <div className="min-h-[220px]">
            {renderStepContent()}
          </div>

          <div className="flex justify-between items-center mt-6">
            {current > 0 ? (
              <Button
                onClick={prev}
                className="h-10 px-5 rounded-xl border-[2.5px] border-slate-900 bg-white shadow-[2px_2px_0_#1f2937] font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all active:translate-y-0.5 active:shadow-none"
              >
                <ArrowLeft size={14} strokeWidth={3} /> Quay lại
              </Button>
            ) : <div />}

            {current < steps.length - 1 ? (
              <Button
                type="primary"
                onClick={next}
                className="h-10 px-6 rounded-xl bg-[#49B6E5] text-white border-[2.5px] border-slate-900 shadow-[3px_3px_0_#1f2937] font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
              >
                Tiếp tục <ArrowRight size={14} strokeWidth={3} />
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={onSubmit}
                loading={submitting}
                className="h-10 px-6 rounded-xl bg-green-500 text-white border-[2.5px] border-slate-900 shadow-[3px_3px_0_#1f2937] font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
              >
                Hoàn Tất <CheckCircle size={14} strokeWidth={3} />
              </Button>
            )}
          </div>
        </Form>

        <div className="mt-8 text-center border-t-[2px] border-slate-100 pt-4">
          <Link to="/login" className="text-slate-400 hover:text-slate-600 font-black text-[9px] uppercase tracking-widest transition-colors flex flex-col items-center group">
            Đã có tài khoản?
            <span className="text-[#49B6E5] text-xs tracking-wider group-hover:underline">Đăng nhập ngay</span>
          </Link>
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
          font-size: 9px;
          text-transform: uppercase;
          font-weight: 900;
          margin-top: 4px;
          color: #ef4444;
        }
        .doodle-steps .ant-steps-item-process .ant-steps-item-icon {
          background-color: #49B6E5 !important;
          border: 2px solid #1f2937 !important;
          box-shadow: 2px 2px 0 #1f2937 !important;
        }
        .doodle-steps .ant-steps-item-finish .ant-steps-item-icon {
          background-color: #white !important;
          border: 2px solid #1f2937 !important;
          color: #49B6E5 !important;
        }
        .doodle-steps .ant-steps-item-title {
          font-family: 'Nunito', sans-serif !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
          font-size: 10px !important;
          letter-spacing: 0.05em !important;
          color: #1f2937 !important;
        }
        .doodle-steps .ant-steps-item-finish .ant-steps-item-title::after {
            background-color: #1f2937 !important;
            height: 2px !important;
        }
      `}</style>
    </div>
  )
}
