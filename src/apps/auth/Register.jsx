import React, { useState } from 'react'
import {
  Steps,
  Form,
  Input,
  Button,
  message,
} from 'antd'
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
} from 'lucide-react'

const passwordRules = [
  { required: true, message: 'Vui lòng nhập mật khẩu' },
  { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
  { pattern: /[A-Z]/, message: 'Phải chứa ít nhất 1 chữ hoa' },
  {
    pattern: /[!@#$%^&*(),.?":{}|<>]/,
    message: 'Phải chứa ít nhất 1 ký tự đặc biệt',
  },
]

const steps = [
  {
    title: 'Tài Khoản',
  },
  {
    title: 'Thông Tin',
  },
  {
    title: 'Xác Nhận',
  },
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
      // validation errors are already shown by antd
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
      if (err?.errorFields) {
        const fields = Object.keys(err.errorFields).map(key => ({
          name: key,
          errors: [err.errorFields[key]]
        }))
        form.setFields(fields)

        if (err.errorFields.email || err.errorFields.password) {
          setCurrent(0)
        } else if (err.errorFields.fullName || err.errorFields.phone) {
          setCurrent(1)
        }
        return
      }
      message.error(err?.message ?? 'Đăng ký thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  const values = current === 2 ? form.getFieldsValue(true) : {}

  const renderStepContent = () => {
    if (current === 0) {
      return (
        <div className="animate-fadeIn space-y-3">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input
              prefix={<Mail className="text-brand-green/60 w-5 h-5 mr-1" />}
              placeholder="Địa chỉ Email"
              className="rounded-2xl py-2.5 px-3 bg-gray-50/50 border-gray-200 hover:bg-white focus:bg-white focus:border-brand-green focus:shadow-[0_0_0_4px_rgba(20,184,166,0.1)] transition-all text-base"
            />
          </Form.Item>

          <Form.Item name="password" rules={passwordRules}>
            <Input.Password
              prefix={<Lock className="text-brand-green/60 w-5 h-5 mr-1" />}
              placeholder="Mật khẩu"
              className="rounded-2xl py-2.5 px-3 bg-gray-50/50 border-gray-200 hover:bg-white focus:bg-white focus:border-brand-green focus:shadow-[0_0_0_4px_rgba(20,184,166,0.1)] transition-all text-base"
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
              prefix={<ShieldCheck className="text-brand-green/60 w-5 h-5 mr-1" />}
              placeholder="Nhập lại mật khẩu"
              className="rounded-2xl py-2.5 px-3 bg-gray-50/50 border-gray-200 hover:bg-white focus:bg-white focus:border-brand-green focus:shadow-[0_0_0_4px_rgba(20,184,166,0.1)] transition-all text-base"
            />
          </Form.Item>
        </div>
      )
    }

    if (current === 1) {
      return (
        <div className="animate-fadeIn space-y-3">
          <Form.Item
            name="fullName"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input
              prefix={<User className="text-brand-green/60 w-5 h-5 mr-1" />}
              placeholder="Họ và Tên"
              className="rounded-2xl py-2.5 px-3 bg-gray-50/50 border-gray-200 hover:bg-white focus:bg-white focus:border-brand-green focus:shadow-[0_0_0_4px_rgba(20,184,166,0.1)] transition-all text-base"
            />
          </Form.Item>

          <Form.Item
            name="phone"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
          >
            <Input
              prefix={<Phone className="text-brand-green/60 w-5 h-5 mr-1" />}
              placeholder="Số điện thoại"
              className="rounded-2xl py-2.5 px-3 bg-gray-50/50 border-gray-200 hover:bg-white focus:bg-white focus:border-brand-green focus:shadow-[0_0_0_4px_rgba(20,184,166,0.1)] transition-all text-base"
            />
          </Form.Item>
        </div>
      )
    }

    return (
      <div className="animate-fadeIn">
        <div className="bg-gradient-to-br from-green-50 to-teal-50/30 p-5 rounded-[1.5rem] border border-green-100 mb-4 shadow-inner relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-brand-green/10 rounded-full blur-2xl"></div>
          <h3 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-teal-700 mb-4 flex items-center gap-2">
            <CheckCircle className="text-brand-green" size={20} /> Xác nhận thông tin
          </h3>
          <ul className="space-y-3 text-sm relative z-10">
            <li className="flex justify-between items-center bg-white/60 p-2.5 rounded-xl">
              <span className="text-gray-500 font-medium flex items-center gap-2">
                <Mail size={16} className="text-teal-500" /> Email
              </span>
              <span className="font-bold text-gray-800">{values.email}</span>
            </li>
            <li className="flex justify-between items-center bg-white/60 p-2.5 rounded-xl">
              <span className="text-gray-500 font-medium flex items-center gap-2">
                <User size={16} className="text-teal-500" /> Họ tên
              </span>
              <span className="font-bold text-gray-800">{values.fullName}</span>
            </li>
            <li className="flex justify-between items-center bg-white/60 p-2.5 rounded-xl">
              <span className="text-gray-500 font-medium flex items-center gap-2">
                <Phone size={16} className="text-teal-500" /> SĐT
              </span>
              <span className="font-bold text-gray-800">{values.phone}</span>
            </li>
          </ul>
        </div>
        <div className="text-center text-xs text-gray-400 font-medium">
          Bằng việc nhấn "Đăng Ký", bạn đồng ý với{' '}
          <a href="#" className="text-brand-green font-bold hover:underline">
            điều khoản sử dụng
          </a>{' '}
          của SpeakVN.
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-green-50 via-teal-50/50 to-blue-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden relative">
      {/* Decorative background blur elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[25rem] h-[25rem] bg-brand-green/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[25rem] h-[25rem] bg-teal-400/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob" style={{animationDelay: '2s'}}></div>
      <div className="absolute bottom-[-10%] left-[20%] w-[25rem] h-[25rem] bg-blue-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob" style={{animationDelay: '4s'}}></div>

      {/* Main Card Container */}
      <div className="w-full max-w-xl bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/60 relative z-10 flex flex-col transition-all duration-500 max-h-[95dvh] overflow-y-auto custom-scrollbar">
        
        {/* Header Section */}
        <div className="text-center pt-6 pb-2 px-6 md:px-10 shrink-0">
          <div className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-green to-teal-500 text-white shadow-lg shadow-teal-500/30 mb-2">
            <Sparkles size={24} />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-teal-700 mb-1">
            SpeakVN Journey
          </h1>
          <p className="text-gray-500 font-medium text-sm md:text-base">
            Khởi tạo hồ sơ để cá nhân hóa lộ trình của bạn.
          </p>
        </div>

        {/* Form Section */}
        <div className="px-6 pb-6 md:px-10 pt-2 flex-1 flex flex-col">
          <div className="px-2 mb-4 shrink-0">
            <Steps
              current={current}
              size="small"
              className="site-navigation-steps custom-steps font-medium"
              items={steps}
            />
          </div>

          <style>{`
            .custom-steps .ant-steps-item-process .ant-steps-item-icon {
              background: linear-gradient(to right, #14b8a6, #0f766e) !important;
              border: none !important;
            }
            .custom-steps .ant-steps-item-finish .ant-steps-item-icon {
              border-color: #14b8a6 !important;
            }
            .custom-steps .ant-steps-item-finish .ant-steps-icon {
              color: #14b8a6 !important;
            }
            .custom-steps .ant-steps-item-title {
              font-weight: 600 !important;
              font-size: 13px !important;
            }
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background-color: rgba(20, 184, 166, 0.2);
              border-radius: 20px;
            }
          `}</style>

          <Form
            layout="vertical"
            form={form}
            size="middle"
            className="flex-1 flex flex-col justify-between"
          >
            <div className="min-h-[200px]">
              {renderStepContent()}
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100/80 shrink-0">
              {current > 0 ? (
                <Button
                  onClick={prev}
                  className="rounded-xl h-11 px-5 border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50 flex items-center gap-2 font-bold text-sm transition-all"
                >
                  <ArrowLeft size={18} /> Quay lại
                </Button>
              ) : (
                <div />
              )}

              {current < steps.length - 1 ? (
                <Button
                  type="primary"
                  onClick={next}
                  className="rounded-xl h-11 px-6 bg-gradient-to-r from-brand-green to-teal-500 hover:from-green-600 hover:to-teal-600 border-none shadow-[0_8px_15px_rgb(20,184,166,0.2)] hover:shadow-[0_12px_20px_rgb(20,184,166,0.3)] flex items-center gap-2 font-bold text-sm transition-all transform hover:-translate-y-0.5"
                >
                  Tiếp tục <ArrowRight size={18} />
                </Button>
              ) : (
                <Button
                  type="primary"
                  onClick={onSubmit}
                  loading={submitting}
                  className="rounded-xl h-11 px-6 bg-gradient-to-r from-brand-green to-teal-600 hover:from-green-600 hover:to-teal-700 border-none shadow-[0_8px_15px_rgb(20,184,166,0.2)] hover:shadow-[0_12px_20px_rgb(20,184,166,0.3)] font-bold text-sm flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                >
                  Khởi Tạo Tài Khoản <CheckCircle size={18} />
                </Button>
              )}
            </div>
          </Form>

          <div className="mt-4 text-center pt-4 relative shrink-0">
            <div className="absolute inset-0 top-4 border-t border-gray-100/80 pointer-events-none"></div>
            <p className="text-gray-500 text-sm relative z-10 bg-white/80 inline-block px-4 font-medium backdrop-blur-md rounded-full">
              Đã có tài khoản?{' '}
              <Link
                to="/login"
                className="text-teal-600 font-extrabold hover:text-teal-800 transition-colors hover:underline ml-1"
              >
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
