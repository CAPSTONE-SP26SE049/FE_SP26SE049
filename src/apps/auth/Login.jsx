import React, { useState } from 'react'
import { Form, Input, Button, message, Checkbox } from 'antd'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../core/auth/AuthContext'
import { User, Lock, Mail } from 'lucide-react'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import illustration from '../../assets/login-illustration.png'

const GOOGLE_CLIENT_ID = '1086072031174-fk0iepl3k13dol2u53tjsueo3c3vq70j.apps.googleusercontent.com'

const passwordRules = [
  { required: true, message: 'Vui lòng nhập mật khẩu!' },
  { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
]

export default function Login() {
  const navigate = useNavigate()
  const { login, socialLogin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleLoading(true)
    try {
      const session = await socialLogin('GOOGLE', credentialResponse.credential)
      message.success(`Chào mừng ${session.user.fullName}!`)
      if (session.user.role === 'ADMIN') {
        navigate('/admin', { replace: true })
      } else if (session.user.role === 'EDUCATOR') {
        navigate('/educator', { replace: true })
      } else {
        navigate('/learner/roadmap', { replace: true })
      }
    } catch (err) {
      message.error(err?.message ?? 'Đăng nhập Google thất bại. Vui lòng thử lại.')
    } finally {
      setGoogleLoading(false)
    }
  }

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const session = await login(values.email, values.password, values.remember)

      if (session.user.role === 'ADMIN') {
        navigate('/admin', { replace: true })
      } else if (session.user.role === 'EDUCATOR') {
        navigate('/educator', { replace: true })
      } else {
        navigate('/learner/roadmap', { replace: true })
      }
    } catch (err) {
      if (err?.status === 403 || err?.response?.status === 403) {
        message.warning('Tài khoản chưa được xác thực. Vui lòng xác thực email.')
        navigate('/verify-email', { state: { email: values.email } })
      } else {
        message.error(err?.message ?? 'Thông tin đăng nhập không hợp lệ')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
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

        {/* Right Panel - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
          <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Chào Mừng Trở Lại!</h2>
              <p className="text-gray-500">Vui lòng đăng nhập để tiếp tục hành trình.</p>
            </div>

            <Form
              name="login"
              layout="vertical"
              initialValues={{ remember: true }}
              onFinish={onFinish}
              autoComplete="off"
              size="large"
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Vui lòng nhập email hợp lệ!' }
                ]}
              >
                <Input
                  prefix={<Mail className="text-gray-400 w-5 h-5" />}
                  placeholder="Địa chỉ Email"
                  className="rounded-xl py-3"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={passwordRules}
              >
                <Input.Password
                  prefix={<Lock className="text-gray-400 w-5 h-5" />}
                  placeholder="Mật khẩu"
                  className="rounded-xl py-3"
                />
              </Form.Item>

              <div className="flex justify-between items-center mb-6">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox className="text-gray-600">Ghi nhớ đăng nhập</Checkbox>
                </Form.Item>

                <Link
                  to="/forgot-password"
                  className="text-brand-blue font-semibold hover:text-blue-700 text-sm transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  className="bg-brand-green hover:bg-green-600 border-none h-12 rounded-xl text-lg font-bold shadow-lg shadow-green-200"
                >
                  Đăng Nhập
                </Button>
              </Form.Item>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-500">Hoặc tiếp tục với</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => message.error('Đăng nhập Google thất bại')}
                    theme="outline"
                    size="large"
                    text="signin_with"
                    shape="pill"
                    width="100%"
                  />
                </div>
                <Button className="flex items-center justify-center h-12 rounded-xl border border-gray-200 hover:bg-gray-50 font-medium text-gray-700">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                  Facebook
                </Button>
              </div>

              <div className="text-center text-gray-500 font-medium">
                Chưa có tài khoản?{' '}
                <Link to="/register" className="text-brand-green hover:text-green-700 font-bold hover:underline transition-all">
                  Đăng Ký Ngay
                </Link>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  )
}

