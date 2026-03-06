import React, { useState } from 'react'
import {
  Steps,
  Form,
  Input,
  Button,
  Select,
  message,
} from 'antd'
import { useNavigate, Link } from 'react-router-dom'
import { registerAPI } from '../../services/authService'
import {
  User,
  Lock,
  Mail,
  Phone,
  Globe,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react'

const { Step } = Steps
const { Option } = Select

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
    // description: 'Thiết lập đăng nhập',
  },
  {
    title: 'Thông Tin',
    // description: 'Hồ sơ cá nhân',
  },
  {
    title: 'Xác Nhận',
    // description: 'Kiểm tra lại',
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
        fields = ['fullName', 'phone', 'region']
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
        region: allValues.region,
      }

      setSubmitting(true)
      await registerAPI(payload)
      message.success('Đăng ký thành công! Vui lòng kiểm tra email để xác thực.')
      navigate('/verify-email', { replace: true, state: { email: allValues.email } })
    } catch (err) {
      if (err?.errorFields) {
        // Map backend errors to form fields
        const fields = Object.keys(err.errorFields).map(key => ({
          name: key,
          errors: [err.errorFields[key]]
        }))
        form.setFields(fields)

        // If error is in the first step (email/password), go back
        if (err.errorFields.email || err.errorFields.password) {
          setCurrent(0)
        } else if (err.errorFields.fullName || err.errorFields.phone || err.errorFields.region) {
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
        <div className="animate-fadeIn">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input
              prefix={<Mail className="text-gray-400 w-5 h-5" />}
              placeholder="Địa chỉ Email"
              className="rounded-xl py-3 border-gray-200 focus:border-brand-green focus:shadow-green-100"
            />
          </Form.Item>

          <Form.Item name="password" rules={passwordRules}>
            <Input.Password
              prefix={<Lock className="text-gray-400 w-5 h-5" />}
              placeholder="Mật khẩu"
              className="rounded-xl py-3 border-gray-200 focus:border-brand-green focus:shadow-green-100"
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
              prefix={<CheckCircle className="text-gray-400 w-5 h-5" />}
              placeholder="Nhập lại mật khẩu"
              className="rounded-xl py-3 border-gray-200 focus:border-brand-green focus:shadow-green-100"
            />
          </Form.Item>
        </div>
      )
    }

    if (current === 1) {
      return (
        <div className="animate-fadeIn">
          <Form.Item
            name="fullName"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input
              prefix={<User className="text-gray-400 w-5 h-5" />}
              placeholder="Họ và Tên"
              className="rounded-xl py-3 border-gray-200 focus:border-brand-green focus:shadow-green-100"
            />
          </Form.Item>

          <Form.Item
            name="phone"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
          >
            <Input
              prefix={<Phone className="text-gray-400 w-5 h-5" />}
              placeholder="Số điện thoại"
              className="rounded-xl py-3 border-gray-200 focus:border-brand-green focus:shadow-green-100"
            />
          </Form.Item>

          <Form.Item
            name="region"
            rules={[{ required: true, message: 'Vui lòng chọn vùng miền' }]}
          >
            <Select
              placeholder="Chọn vùng miền"
              size="large"
              suffixIcon={<Globe className="text-gray-400 w-5 h-5" />}
              className="rounded-xl border-gray-200 focus:border-brand-green"
              style={{ height: 50 }}
            >
              <Option value="north">Miền Bắc</Option>
              <Option value="central">Miền Trung</Option>
              <Option value="south">Miền Nam</Option>
            </Select>
          </Form.Item>
        </div>
      )
    }

    return (
      <div className="animate-fadeIn">
        <div className="bg-green-50/50 p-6 rounded-2xl border border-green-100 mb-6">
          <h3 className="text-lg font-bold text-brand-green mb-4 border-b border-green-200 pb-2">
            Xác nhận thông tin
          </h3>
          <ul className="space-y-4 text-sm">
            <li className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center gap-2">
                <Mail size={16} /> Email
              </span>
              <span className="font-semibold text-gray-900">{values.email}</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center gap-2">
                <User size={16} /> Họ tên
              </span>
              <span className="font-semibold text-gray-900">{values.fullName}</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center gap-2">
                <Phone size={16} /> SĐT
              </span>
              <span className="font-semibold text-gray-900">{values.phone}</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center gap-2">
                <Globe size={16} /> Vùng miền
              </span>
              <span className="font-semibold text-brand-green">
                {values.region === 'north'
                  ? 'Miền Bắc'
                  : values.region === 'central'
                    ? 'Miền Trung'
                    : 'Miền Nam'}
              </span>
            </li>
          </ul>
        </div>
        <div className="text-center text-xs text-gray-400">
          Bằng việc nhấn "Đăng Ký", bạn đồng ý với{' '}
          <a href="#" className="text-brand-green font-medium hover:underline">
            điều khoản sử dụng
          </a>{' '}
          của SpeakVN.
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-green to-teal-600 relative overflow-hidden py-10 px-4">
      {/* Background Pattern */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>

      {/* Main Card Container */}
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-slideUp">
        {/* Header Section inside Card */}
        <div className="text-center pt-10 pb-6 px-8 bg-white">
          <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-teal-600 mb-2">
            SpeakVN Journey
          </h1>
          <p className="text-gray-500 font-medium">
            Tạo tài khoản mới để bắt đầu hành trình.
          </p>
        </div>

        {/* Form Section */}
        <div className="px-8 pb-10">
          <Steps
            current={current}
            size="small"
            className="mb-8 site-navigation-steps"
            items={steps}
          />

          <Form
            layout="vertical"
            form={form}
            initialValues={{ region: 'south' }}
            size="large"
          >
            <div className="min-h-[300px]">{renderStepContent()}</div>

            <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-100">
              {current > 0 ? (
                <Button
                  onClick={prev}
                  className="rounded-xl h-12 px-6 border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50 flex items-center gap-2 font-medium transition-all"
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
                  className="rounded-xl h-12 px-8 bg-brand-green hover:bg-green-600 border-none shadow-lg shadow-green-100 flex items-center gap-2 font-bold text-lg transition-all transform hover:-translate-y-0.5"
                >
                  Tiếp tục <ArrowRight size={18} />
                </Button>
              ) : (
                <Button
                  type="primary"
                  onClick={onSubmit}
                  loading={submitting}
                  className="rounded-xl h-12 px-8 bg-gradient-to-r from-brand-blue to-brand-green hover:opacity-90 border-none shadow-lg shadow-green-200 font-bold text-lg flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                >
                  Đăng Ký <CheckCircle size={18} />
                </Button>
              )}
            </div>
          </Form>

          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-gray-500">
              Đã có tài khoản?{' '}
              <Link
                to="/login"
                className="text-brand-blue font-bold hover:text-blue-700 transition-colors hover:underline"
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
