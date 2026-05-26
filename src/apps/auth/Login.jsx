import React, { useState, useCallback } from 'react'
import { Form, Input, Button, message, Checkbox } from 'antd'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../core/auth/AuthContext'
import { getLearnerOnboardingPath } from '../../utils/onboarding'
import { Lock, Mail, Home, Sparkles, User, ArrowRight } from 'lucide-react'
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google'
import { motion } from 'framer-motion'
import { DoodleLoading } from '../../components/ui/DoodleLoading'

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
      navigate(getLearnerOnboardingPath(session.user), { replace: true })
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbf6ef] flex items-center justify-center">
        <DoodleLoading message="Đang đưa bạn vào hệ thống..." />
      </div>
    )
  }

  return (
    <div className="h-screen w-full bg-[#fbf6ef] flex items-center justify-center p-4 sm:p-2 font-nunito relative overflow-hidden">

      {/* Decorative Doodles (Absolute positioning) */}
      <div className="absolute top-10 left-10 pointer-events-none opacity-20">
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="currentColor" className="text-slate-900 animate-float">
          <path d="M20,50 Q35,20 50,50 T80,50" strokeWidth="3" fill="none" />
        </svg>
      </div>
      <div className="absolute bottom-10 right-10 pointer-events-none opacity-20">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="currentColor" className="text-slate-900 animate-float" style={{ animationDelay: '2s' }}>
          <circle cx="60" cy="60" r="40" strokeWidth="3" strokeDasharray="10 5" />
          <path d="M40,60 L80,60 M60,40 L60,80" strokeWidth="3" />
        </svg>
      </div>

      {/* Back to Home Button */}
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
        className="w-full max-w-[900px] h-full max-h-[620px] bg-white rounded-[2.5rem] border-[3px] border-slate-900 shadow-[10px_10px_0_#1f2937] flex flex-col md:flex-row overflow-hidden relative z-10"
      >

        {/* ==================== LEFT SIDE - DOODLE POSTER ==================== */}
        <div className="hidden md:block w-5/12 relative bg-slate-900 border-r-[3px] border-slate-900 overflow-hidden">
          <img
            src="/speakvn_simple_poster.png"
            alt="SpeakVN"
            className="absolute inset-0 w-full h-full object-cover opacity-80 transition-transform duration-[15s] ease-out hover:scale-110"
          />
          {/* Hand-drawn overlay elements */}
          <div className="absolute inset-0 bg-[#49B6E5]/20 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>

          <div className="absolute bottom-6 left-6 right-6 text-white space-y-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-orange-400 border-[2.5px] border-white shadow-[2px_2px_0_#ffffff33]">
              <Sparkles size={20} className="text-white" strokeWidth={3} />
            </div>
            <div>
              <h2 className="text-3xl font-black leading-tight font-nunito uppercase tracking-tight">
                Học Tiếng<br />
                <span className="text-orange-400">Việt Thật</span><br />
                Vui Nhộn
              </h2>
              <p className="text-white/80 font-bold text-xs mt-2 leading-relaxed opacity-70">
                Chinh phục mọi phương ngữ cùng SpeakVN
              </p>
            </div>
          </div>

          {/* Doodle Accent */}
          <div className="absolute top-8 right-8 text-white/30">
            <svg width="60" height="60" viewBox="0 0 60 60" fill="currentColor">
              <path d="M10,10 L20,10 L20,20 L10,20 Z M30,30 L40,30 L40,40 L30,40 Z M50,10 L55,10 L55,15 L50,15 Z" />
            </svg>
          </div>
        </div>

        {/* ==================== RIGHT SIDE - DOODLE FORM ==================== */}
        <div className="w-full md:w-7/12 flex flex-col justify-center p-6 lg:p-8 bg-white relative">

          {/* Header Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#49B6E5] border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937] flex items-center justify-center">
                <User size={20} className="text-white" strokeWidth={3} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight font-nunito leading-none">Chào Mừng!</h1>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Đăng nhập để vào hệ thống</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <Form
            name="login"
            layout="vertical"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            autoComplete="off"
            size="large"
            className="doodle-form"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Vui lòng nhập email hợp lệ!' }
              ]}
              className="mb-3"
            >
              <Input
                prefix={<Mail size={18} className="text-slate-400 mr-1.5" strokeWidth={2.5} />}
                placeholder="Địa chỉ Email"
                className="h-12 rounded-xl border-[2px] border-slate-900 bg-slate-50 font-black text-xs shadow-[2px_2px_0_#1f2937] focus:bg-white transition-all"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={passwordRules}
              className="mb-3"
            >
              <Input.Password
                prefix={<Lock size={18} className="text-slate-400 mr-1.5" strokeWidth={2.5} />}
                placeholder="Mật khẩu"
                className="h-12 rounded-xl border-[2px] border-slate-900 bg-slate-50 font-black text-xs shadow-[2px_2px_0_#1f2937] focus:bg-white transition-all"
              />
            </Form.Item>

            <div className="flex justify-between items-center mb-5">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox className="text-slate-900 text-[10px] font-black uppercase tracking-widest doodle-checkbox">Ghi nhớ</Checkbox>
              </Form.Item>
              <Link
                to="/forgot-password"
                className="text-orange-500 hover:text-orange-600 font-black text-[10px] uppercase tracking-widest transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <Form.Item className="mb-4">
              <Button
                type="primary"
                htmlType="submit"
                block
                className="h-12 rounded-xl bg-[#49B6E5] text-white border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f2937] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
              >
                Đăng Nhập <ArrowRight size={16} strokeWidth={3} />
              </Button>
            </Form.Item>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-[1.5px] border-slate-100" />
              </div>
              <div className="relative flex justify-center text-[9px] uppercase tracking-[0.22em] px-2">
                <span className="bg-white px-3 text-slate-300 font-black">HOẶC ĐĂNG NHẬP VỚI</span>
              </div>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="flex items-center justify-center h-10 rounded-xl border-[2px] border-slate-900 bg-white shadow-[3px_3px_0_#1f2937] hover:bg-slate-50 transition-all active:translate-y-0.5 active:shadow-none disabled:opacity-50"
              >
                {googleLoading ? <DoodleLoading size="small" /> : (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Google</span>
                  </div>
                )}
              </button>
              <button
                type="button"
                onClick={handleFacebookLogin}
                disabled={facebookLoading}
                className="flex items-center justify-center h-10 rounded-xl border-[2px] border-slate-900 bg-white shadow-[3px_3px_0_#1f2937] hover:bg-slate-50 transition-all active:translate-y-0.5 active:shadow-none disabled:opacity-50"
              >
                {facebookLoading ? <DoodleLoading size="small" /> : (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Facebook</span>
                  </div>
                )}
              </button>
            </div>

            {/* Bottom Section */}
            <div className="text-center pt-2">
              <Link
                to="/register"
                className="inline-flex flex-col items-center group"
              >
                <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-0.5 group-hover:text-slate-600 transition-colors">Chưa có tài khoản?</span>
                <span className="text-[#49B6E5] font-black text-xs uppercase tracking-wider relative">
                  Đăng Ký Ngay
                  <span className="absolute -bottom-1 left-0 w-full h-[1.5px] bg-[#49B6E5] scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                </span>
              </Link>
            </div>
          </Form>

          {/* Scoped Styles for Doodle Ant Elements */}
          <style>{`
            .doodle-form .ant-input-affix-wrapper {
              border: 2px solid #1f2937 !important;
              border-radius: 0.8rem !important;
              padding: 0 12px !important;
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
            .doodle-checkbox .ant-checkbox-inner {
              border: 2px solid #1f2937 !important;
              border-radius: 5px !important;
              width: 16px !important;
              height: 16px !important;
            }
            .doodle-checkbox .ant-checkbox-checked .ant-checkbox-inner {
              background-color: #49B6E5 !important;
              border-color: #1f2937 !important;
            }
          `}</style>
        </div>
      </motion.div>
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
