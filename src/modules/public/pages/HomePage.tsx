import type React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../core/auth/AuthContext'
import { Button } from 'antd'
import { 
  ArrowRightOutlined, 
  GlobalOutlined, 
  ThunderboltOutlined, 
  SafetyCertificateOutlined 
} from '@ant-design/icons'
import { motion } from 'framer-motion'

const HomePage: React.FC = () => {
  const { isAuthenticated, session } = useAuth()

  return (
    <div className="min-h-screen bg-white font-inter selection:bg-stitch-teal selection:text-white">
      {/* Immersive Header */}
      <nav className="h-20 px-8 md:px-20 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stitch-teal flex items-center justify-center shadow-lg shadow-stitch-teal/20">
            <GlobalOutlined className="text-white text-xl" />
          </div>
          <span className="font-black text-2xl text-stitch-dark tracking-tighter uppercase italic">
            Speak<span className="text-stitch-teal">VN</span>
          </span>
        </div>
        
        <div className="flex items-center gap-8">
          <Link to="/about" className="text-sm font-bold text-stitch-grey hover:text-stitch-teal transition-colors">Về chúng tôi</Link>
          <Link to="/features" className="text-sm font-bold text-stitch-grey hover:text-stitch-teal transition-colors">Tính năng</Link>
          {isAuthenticated ? (
            <Link to="/learner/dashboard">
              <Button type="primary" className="bg-stitch-teal hover:bg-stitch-teal-dark border-none rounded-xl h-10 font-bold px-6 shadow-md">
                Dashboard <ArrowRightOutlined />
              </Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button type="primary" className="bg-stitch-teal hover:bg-stitch-teal-dark border-none rounded-xl h-10 font-bold px-8 shadow-md">
                Đăng nhập
              </Button>
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-32 px-8 overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stitch-teal-light text-stitch-teal text-xs font-black uppercase tracking-widest mb-8">
              <ThunderboltOutlined /> Nền tảng học tiếng Việt 4.0
            </div>
            <h1 className="text-6xl md:text-7xl font-extrabold text-stitch-dark tracking-tight leading-[1.1] mb-8">
              Chinh phục <span className="text-stitch-teal italic">giọng Việt</span> đa vùng miền.
            </h1>
            <p className="text-xl text-stitch-grey font-medium leading-relaxed mb-10 max-w-lg">
              Trải nghiệm học tập cá nhân hóa, giúp bạn làm chủ cách phát âm và giao tiếp tự nhiên như người bản xứ tại cả 3 miền Bắc, Trung, Nam.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to={isAuthenticated ? "/learner/roadmap" : "/login"}>
                <Button size="large" className="bg-stitch-teal hover:bg-stitch-teal-dark text-white border-none rounded-2xl h-16 px-10 font-bold text-lg shadow-xl hover:shadow-2xl hover:translate-y-[-2px] transition-all">
                  Bắt đầu hành trình <ArrowRightOutlined className="ml-2" />
                </Button>
              </Link>
              <Button size="large" className="bg-white hover:bg-gray-50 text-stitch-dark border border-gray-200 rounded-2xl h-16 px-10 font-bold text-lg shadow-sm transition-all">
                Xem Catalog bài học
              </Button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-stitch-teal/10 rounded-[3rem] blur-3xl" />
            <img 
              src="https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1470&auto=format&fit=crop" 
              alt="Vietnam Learning" 
              className="relative rounded-[2.5rem] shadow-2xl border border-white/20 w-full h-[500px] object-cover"
            />
            {/* Floating Card UI */}
            <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 animate-bounce-slow">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
                    <SafetyCertificateOutlined className="text-2xl" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-stitch-grey uppercase tracking-widest">Tiến độ tuần</div>
                    <div className="text-xl font-black text-stitch-dark">+85% Hoàn thành</div>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-stitch-bg py-20 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-8 flex flex-wrap justify-between gap-12">
            {[
              { val: '10K+', label: 'Học viên tích cực' },
              { val: '500+', label: 'Bài học đa dạng' },
              { val: '98%', label: 'Tỉ lệ hài lòng' },
              { val: '3 Miền', label: 'Bắc - Trung - Nam' },
            ].map((s, i) => (
              <div key={i} className="text-center group">
                 <div className="text-4xl font-black text-stitch-teal mb-2 group-hover:scale-110 transition-transform">{s.val}</div>
                 <div className="text-sm font-bold text-stitch-grey uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-8 text-center border-t border-gray-100">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
              <GlobalOutlined className="text-gray-500" />
            </div>
            <span className="font-bold text-gray-800 tracking-tight">© 2026 SpeakVN Journey. All rights reserved.</span>
          </div>
          <div className="flex justify-center gap-10 text-sm font-bold text-stitch-grey">
             <a href="#" className="hover:text-stitch-teal transition-colors">Điều khoản</a>
             <a href="#" className="hover:text-stitch-teal transition-colors">Bảo mật</a>
             <a href="#" className="hover:text-stitch-teal transition-colors">Hỗ trợ</a>
          </div>
      </footer>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s infinite ease-in-out;
        }
      `}</style>
    </div>
  )
}

export default HomePage
