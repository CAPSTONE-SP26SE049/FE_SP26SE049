import React, { useState, useEffect, useCallback } from 'react'
import { Form, Input, Button, message, Checkbox } from 'antd'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../core/auth/AuthContext'
import { Lock, Mail, Instagram, Twitter, Facebook, Search, Menu } from 'lucide-react'
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google'
// import bgImage from '../../assets/vietnam_bg.png' // Moved to public/vietnam_bg.png
const bgImage = '/vietnam_bg.png'

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
    <div className="relative min-h-screen w-full bg-black flex flex-col font-nunito overflow-hidden selection:bg-brand-green selection:text-white">
      {/* Background with Dark Overlay */}
      <div className="absolute inset-0 z-0 bg-[#0a0a0a]">
        <img
          src={bgImage}
          alt="Vietnam Landscape Professional"
          className="w-full h-full object-cover opacity-95 contrast-[1.05] transition-opacity duration-1000 animate-slow-zoom"
          style={{ imageRendering: '-webkit-optimize-contrast' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60"></div>
      </div>

      {/* Header (Simplified) */}
      <header className="relative z-20 flex justify-between items-center px-10 py-6 text-white/90">
        <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
          <Menu className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-4 cursor-pointer hover:text-white transition-colors">
          <Search className="w-5 h-5" />
        </div>
      </header>

      {/* Social Sidebar (Left) */}
      <div className="absolute left-10 top-1/2 -translate-y-1/2 z-20 hidden lg:flex flex-col gap-8 text-white/50">
        <Twitter className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
        <Facebook className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
        <Instagram className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
        <div className="w-4 h-4 flex items-center justify-center font-bold text-[10px] cursor-pointer hover:text-white transition-colors border border-white/50 rounded-full">V</div>
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Map Outline Decoration (Right) */}
        <div className="absolute right-[5%] top-1/2 -translate-y-1/2 pointer-events-none opacity-20 hidden xl:block">
          <svg width="300" height="600" viewBox="0 0 100 200" fill="none" stroke="white" strokeWidth="0.5">
            <path d="M40 10 Q 42 12, 45 15 T 48 25 T 42 35 T 38 45 T 44 55 T 50 65 T 58 75 T 65 85 T 72 95 T 80 105 T 75 115 T 65 125 T 55 135 T 45 145 T 48 155 T 44 165 T 40 175 T 45 185 T 42 195" />
          </svg>
        </div>

        {/* Central Brand & Login Card */}
        <div className="w-full max-w-lg mb-12">
          <div className="text-center mb-8">
            <h1 className="text-7xl font-black text-white italic tracking-tighter drop-shadow-2xl mb-4 leading-none select-none">
              Speak<span className="text-brand-green">VN</span>
            </h1>
            <p className="text-white/80 tracking-[0.3em] uppercase text-xs font-bold">Chinh Phục Mọi Nẻo Đường</p>
          </div>

          <div className="bg-white/5 backdrop-blur-lg border border-white/20 p-10 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform hover:scale-[1.01] transition-transform duration-500">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Đăng Nhập</h2>
              <p className="text-white/70 text-sm italic">Hành trình ngàn dặm bắt đầu từ bước chân này</p>
            </div>

            <Form
              name="login"
              layout="vertical"
              initialValues={{ remember: true }}
              onFinish={onFinish}
              autoComplete="off"
              size="large"
              className="login-form"
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Vui lòng nhập email hợp lệ!' }
                ]}
              >
                <Input
                  prefix={<Mail className="text-white/60 w-4 h-4 mr-2" />}
                  placeholder="Địa chỉ Email"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/50 rounded-2xl py-3 focus:bg-white/10"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={passwordRules}
              >
                <Input.Password
                  prefix={<Lock className="text-white/60 w-4 h-4 mr-2" />}
                  placeholder="Mật khẩu"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/50 rounded-2xl py-3 focus:bg-white/10"
                />
              </Form.Item>

              <div className="flex justify-between items-center mb-6 px-1">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox className="text-white/80 text-xs custom-checkbox">Ghi nhớ tôi</Checkbox>
                </Form.Item>

                <Link
                  to="/forgot-password"
                  className="text-brand-green/80 hover:text-brand-green font-semibold text-xs transition-colors italic"
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
                  className="bg-brand-green hover:bg-green-500 border-none h-14 rounded-2xl text-lg font-black shadow-lg shadow-brand-green/20 uppercase tracking-widest"
                >
                  Bắt Đầu
                </Button>
              </Form.Item>

              <div className="relative my-10">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-[10px] tracking-widest uppercase">
                  <span className="bg-black/20 backdrop-blur-md px-4 text-white/50">Hoặc tiếp tục với</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <Button
                  onClick={handleGoogleLogin}
                  loading={googleLoading}
                  className="flex items-center justify-center h-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 font-medium text-white/80 transition-all duration-300"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
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
                  className="flex items-center justify-center h-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 font-medium text-white transition-all duration-300"
                >
                  <Twitter className="w-4 h-4 mr-2 text-[#1DA1F2]" fill="currentColor" />
                  Facebook
                </Button>
              </div>

              <div className="text-center mt-6">
                <span className="text-white/60 text-xs">Chưa có tài khoản? </span>
                <Link to="/register" className="text-brand-green hover:underline font-bold text-xs uppercase tracking-wider transition-all">
                  Đăng Ký Ngay
                </Link>
              </div>
            </Form>
          </div>
        </div>
      </main>

      {/* Footer Feature Cards (Mirrored from Sample) */}
      <footer className="relative z-20 grid grid-cols-1 md:grid-cols-3 gap-6 px-10 pb-10">
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-all group cursor-pointer">
          <h3 className="text-white/60 text-[10px] font-bold tracking-[0.2em] uppercase mb-2 group-hover:text-brand-green transition-colors">Học Tập</h3>
          <p className="text-white/90 text-xs leading-relaxed">Khám phá kho tàng bài học phát âm phong phú, trải dài từ Bắc chí Nam.</p>
        </div>
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-all group cursor-pointer border-t-2 border-t-brand-green/30">
          <h3 className="text-white/60 text-[10px] font-bold tracking-[0.2em] uppercase mb-2 group-hover:text-brand-green transition-colors">Khám Phá</h3>
          <p className="text-white/90 text-xs leading-relaxed">Đắm mình vào văn hóa và con người từng vùng miền thông qua ngôn ngữ.</p>
        </div>
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-all group cursor-pointer">
          <h3 className="text-white/60 text-[10px] font-bold tracking-[0.2em] uppercase mb-2 group-hover:text-brand-green transition-colors">Thách Thức</h3>
          <p className="text-white/90 text-xs leading-relaxed">Vượt qua các cấp độ khó để giành lấy những danh hiệu vinh quang nhất.</p>
        </div>
      </footer>

      {/* Global Theme Overrides for Ant Design in dark mode */}
      <style>{`
        .login-form .ant-input-affix-wrapper,
        .login-form .ant-input-affix-wrapper:hover,
        .login-form .ant-input-affix-wrapper-focused {
          background-color: transparent !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          transition: all 0.3s ease;
        }
        
        .login-form .ant-input-affix-wrapper-focused {
          border-color: #58cc02 !important;
          box-shadow: 0 0 0 2px rgba(88, 204, 2, 0.1) !important;
        }

        .login-form .ant-input {
          background: transparent !important;
          color: white !important;
        }

        .login-form .ant-input::placeholder {
          color: rgba(255, 255, 255, 0.5) !important;
        }
        
        /* Transparent Fix for Chrome Autofill */
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
          -webkit-text-fill-color: white !important;
          -webkit-box-shadow: 0 0 0px 1000px transparent inset !important;
          transition: background-color 5000s ease-in-out 0s;
          background-color: transparent !important;
        }

        .custom-checkbox .ant-checkbox-inner {
          background-color: rgba(255, 255, 255, 0.05) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
        }
        .custom-checkbox .ant-checkbox-checked .ant-checkbox-inner {
          background-color: #58cc02 !important;
          border-color: #58cc02 !important;
        }
        @keyframes slow-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.03); }
        }
        .animate-slow-zoom {
          animation: slow-zoom 40s infinite alternate ease-in-out;
        }
      `}</style>
    </div>
  )
}

export default function Login() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LoginForm />
    </GoogleOAuthProvider>
  )
}
