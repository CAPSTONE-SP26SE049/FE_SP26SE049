import React, { useState, useCallback } from 'react'
import { Form, Input, Button, message, Checkbox } from 'antd'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../core/auth/AuthContext'
import { Lock, Mail, Sparkles, Twitter, Home } from 'lucide-react'
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google'

const GOOGLE_CLIENT_ID = '1086072031174-fk0iepl3k13dol2u53tjsueo3c3vq70j.apps.googleusercontent.com'
const FACEBOOK_APP_ID = '1169205748542841'
const FB_REDIRECT_URI = `${window.location.origin}/auth/facebook/callback`

const passwordRules = [
  { required: true, message: 'Vui lòng nhập mật khẩu!' },
  { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
]

function LoginForm() {
  const navigate = useNavigate()
  const { login, socialLogin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [facebookLoading, setFacebookLoading] = useState(false)

  const navigateByRole = useCallback((session) => {
    if (session.user.role === 'ADMIN') {
      navigate('/admin', { replace: true })
    } else if (session.user.role === 'EDUCATOR') {
      navigate('/educator', { replace: true })
    } else {
      navigate('/learner/roadmap', { replace: true })
    }
  }, [navigate])

  const googleLogin = useGoogleLogin({
    flow: 'implicit',
    scope: 'openid email profile',
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true)
      try {
        const session = await socialLogin('GOOGLE', tokenResponse.access_token)
        message.success(`Chào mừng ${session.user.fullName}!`)
        navigateByRole(session)
      } catch (err) {
        const backendMsg = err?.response?.data?.message
        message.error(backendMsg ?? err?.message ?? 'Đăng nhập Google thất bại. Vui lòng thử lại.')
      } finally {
        setGoogleLoading(false)
      }
    },
    onError: (err) => {
      console.error('Google login error:', err)
      message.error('Google đăng nhập bị hủy bỏ hoặc xảy ra lỗi.')
    },
  })

  const handleGoogleLogin = () => {
    googleLogin()
  }

  const handleFacebookLogin = () => {
    setFacebookLoading(true)
    const fbOAuthURL = `https://www.facebook.com/v19.0/dialog/oauth?` +
      `client_id=${FACEBOOK_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(FB_REDIRECT_URI)}` +
      `&scope=public_profile,email` +
      `&response_type=token` +
      `&display=popup`

    const width = 580
    const height = 600
    const left = (window.screen.width - width) / 2
    const top = (window.screen.height - height) / 2
    const popup = window.open(
      fbOAuthURL,
      'facebook-login',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
    )

    if (!popup) {
      message.error('Popup bị chặn! Vui lòng cho phép popup cho trang này.')
      setFacebookLoading(false)
      return
    }

    const pollTimer = setInterval(() => {
      try {
        if (!popup || popup.closed) {
          clearInterval(pollTimer)
          setFacebookLoading(false)
          return
        }

        const popupUrl = popup.location.href
        if (popupUrl && popupUrl.startsWith(window.location.origin)) {
          clearInterval(pollTimer)
          const hash = popup.location.hash
          popup.close()

          if (hash) {
            const params = new URLSearchParams(hash.substring(1))
            const accessToken = params.get('access_token')

            if (accessToken) {
              socialLogin('FACEBOOK', accessToken)
                .then((session) => {
                  message.success(`Chào mừng ${session.user.fullName}!`)
                  navigateByRole(session)
                })
                .catch((err) => {
                  message.error(err?.message ?? 'Đăng nhập Facebook thất bại.')
                })
                .finally(() => setFacebookLoading(false))
              return
            }
          }
          message.error('Đăng nhập Facebook thất bại. Không nhận được token.')
          setFacebookLoading(false)
        }
      } catch (e) {
      }
    }, 500)
  }

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const session = await login(values.email, values.password, values.remember)
      navigateByRole(session)
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
    <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-4 sm:p-8 font-nunito relative overflow-hidden">
      {/* Back to Home Button */}
      <Link
        to="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-md border border-gray-200/50 rounded-full shadow-sm text-gray-500 hover:text-purple-600 hover:bg-white hover:shadow-md transition-all group font-bold text-sm"
      >
        <Home size={16} className="group-hover:-translate-x-1 transition-transform" />
        Về Trang Chủ
      </Link>

      {/* Subtle Background Blobs */}
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
          {/* Elegant overlay gradient to seamlessly blend */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-purple-900/30 to-transparent"></div>

          {/* Content overlaid on poster */}
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

        {/* ==================== RIGHT SIDE - LOGIN FORM ==================== */}
        <div className="w-full md:w-7/12 flex flex-col justify-center p-8 lg:p-10 bg-white relative">

          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="text-3xl font-black tracking-tight">
                <span className="text-gray-800">Speak</span>
                <span className="text-purple-600">VN</span>
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-800 mb-1">Chào mừng trở lại!</h1>
            <p className="text-gray-400 text-sm font-medium">Đăng nhập để vào hệ thống</p>
          </div>

          {/* Form */}
          <Form
            name="login"
            layout="vertical"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            autoComplete="off"
            size="large"
            className="login-form-v3"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Vui lòng nhập email hợp lệ!' }
              ]}
              style={{ marginBottom: '16px' }}
            >
              <Input
                prefix={<Mail className="text-gray-400 w-5 h-5 mr-1.5" strokeWidth={2.5} />}
                placeholder="Địa chỉ Email"
                className="h-12 rounded-2xl bg-gray-50/50 border-gray-200 hover:border-purple-400 hover:bg-white focus:bg-white focus:border-purple-500 text-gray-700 font-bold text-sm shadow-sm transition-all"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={passwordRules}
              style={{ marginBottom: '16px' }}
            >
              <Input.Password
                prefix={<Lock className="text-gray-400 w-5 h-5 mr-1.5" strokeWidth={2.5} />}
                placeholder="Mật khẩu"
                className="h-12 rounded-2xl bg-gray-50/50 border-gray-200 hover:border-purple-400 hover:bg-white focus:bg-white focus:border-purple-500 text-gray-700 font-bold text-sm shadow-sm transition-all"
              />
            </Form.Item>

            <div className="flex justify-between items-center mb-5">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox className="text-gray-500 text-xs font-bold login-checkbox">Ghi nhớ tôi</Checkbox>
              </Form.Item>
              <Link
                to="/forgot-password"
                className="text-orange-500 hover:text-orange-600 font-bold text-xs transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <Form.Item style={{ marginBottom: '16px' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="h-12 rounded-2xl text-base font-black border-none shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-0.5 transition-all duration-300"
                style={{ background: 'linear-gradient(135deg, #a855f7, #9333ea, #7e22ce)' }}
              >
                ĐĂNG NHẬP
              </Button>
            </Form.Item>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest px-2">
                <span className="bg-white px-3 text-gray-300 font-bold">Hoặc tiếp tục với</span>
              </div>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <Button
                onClick={handleGoogleLogin}
                loading={googleLoading}
                className="flex items-center justify-center h-11 rounded-2xl border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 font-bold text-gray-600 text-sm transition-all shadow-sm group"
              >
                <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </Button>
              <Button
                onClick={handleFacebookLogin}
                loading={facebookLoading}
                className="flex items-center justify-center h-11 rounded-2xl border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 font-bold text-gray-600 text-sm transition-all shadow-sm group"
              >
                <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button>
            </div>

            {/* Register Link */}
            <div className="text-center bg-gray-50/50 py-3 rounded-xl border border-gray-100 mt-2">
              <span className="text-gray-500 text-xs font-bold">Chưa có tài khoản? </span>
              <Link to="/register" className="text-purple-600 hover:text-purple-700 font-black text-xs uppercase tracking-wide transition-colors">
                Đăng Ký
              </Link>
            </div>
          </Form>
        </div>
      </div>

      {/* Scoped Styles */}
      <style>{`
        .login-form-v3 .ant-input-affix-wrapper {
          border-radius: 16px !important;
          padding: 0 16px !important;
        }
        .login-form-v3 .ant-input-affix-wrapper:hover {
          border-color: #a855f7 !important;
        }
        .login-form-v3 .ant-input-affix-wrapper-focused {
          border-color: #9333ea !important;
          box-shadow: 0 0 0 4px rgba(147, 51, 234, 0.1) !important;
        }
        .login-checkbox .ant-checkbox-checked .ant-checkbox-inner {
          background-color: #9333ea !important;
          border-color: #9333ea !important;
        }
        .login-checkbox .ant-checkbox-inner {
          border-radius: 6px !important;
          width: 18px !important;
          height: 18px !important;
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
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0px 1000px white inset !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </div >
  )
}

export default function Login() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LoginForm />
    </GoogleOAuthProvider>
  )
}
