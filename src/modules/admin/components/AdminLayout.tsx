import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../core/auth/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Bot,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Medal,
  FlaskConical,
  LogOut,
  User,
  MoreVertical,
  Tag,
  Cpu
} from 'lucide-react'
import clsx from 'clsx'

const NAV_ITEMS = [
  { key: '/admin', icon: LayoutDashboard, label: 'Tổng quan' },
  { key: '/admin/chapters', icon: BookOpen, label: 'Quản lý bài tập' },
  { key: '/admin/error-tags', icon: Tag, label: 'Lỗi vùng miền' },
  { key: '/admin/ai-monitor', icon: Bot, label: 'Giám sát AI' },
  { key: '/admin/entry-test', icon: FlaskConical, label: 'Quản lý Entry Test' },
  { key: '/admin/users', icon: Users, label: 'Người dùng' },
  { key: '/admin/achievements', icon: Medal, label: 'Thành tựu' },
  { key: '/admin/ai-config', icon: Cpu, label: 'Cấu hình AI' },
  { key: '/admin/settings', icon: Settings, label: 'Cài đặt' },
]

const AdminLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, session } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const user = session?.user as any
  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const selectedKey = [...NAV_ITEMS]
    .sort((a, b) => b.key.length - a.key.length)
    .find((item) => {
      // Special case: /admin/quizzes should highlight the Chapters menu item
      if (item.key === '/admin/chapters' && location.pathname.startsWith('/admin/quizzes')) {
        return true
      }
      return (
        location.pathname === item.key || location.pathname.startsWith(item.key + '/')
      )
    })?.key || '/admin'

  const currentLabel = NAV_ITEMS.find((i) => i.key === selectedKey)?.label || 'Quản trị'

  return (
    <div className="flex h-screen bg-[#fbf6ef] overflow-hidden font-nunito">
      {/* Sidebar */}
      <div className="relative flex-shrink-0 z-30">
        <motion.aside
          animate={{ width: collapsed ? 100 : 300 }}
          transition={{ duration: 0.4, type: 'spring', damping: 20 }}
          className="flex h-full flex-col overflow-hidden border-r-[3px] border-slate-900 bg-white shadow-[4px_0_0_#1f293710]"
        >
          {/* Logo Area */}
          <div className="flex h-[80px] flex-shrink-0 items-center justify-center border-b-[3px] border-slate-900/5 px-6">
            <div className={clsx(
              "flex items-center gap-3 transition-all duration-300",
              collapsed ? "justify-center" : "justify-start w-full"
            )}>
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#49B6E5] border-[2.5px] border-slate-900 shadow-[3px_3px_0_#1f2937]">
                <Sparkles size={24} className="text-white" fill="white" />
              </div>
              {!collapsed && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                  <div className="text-xl font-black text-slate-900 leading-none">
                    Speak<span className="text-[#49B6E5]">VN</span>
                  </div>
                  <div className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    ADMIN PORTAL
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-3 overflow-y-auto px-4 py-8 custom-scrollbar">
            {NAV_ITEMS.map((item) => {
              const isActive = selectedKey === item.key
              const Icon = item.icon
              return (
                <Link key={item.key} to={item.key}>
                  <motion.div
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={clsx(
                      "group relative flex h-14 items-center gap-4 rounded-2xl border-[2.5px] px-4 transition-all duration-200",
                      isActive
                        ? "bg-[#49B6E5] border-slate-900 text-white shadow-[4px_4px_0_#1f2937]"
                        : "bg-white border-transparent text-slate-500 hover:border-slate-900/10 hover:bg-slate-50 hover:text-slate-900",
                      collapsed && "justify-center px-0"
                    )}
                  >
                    <Icon size={22} strokeWidth={3} className="flex-shrink-0" />
                    {!collapsed && (
                      <span className="whitespace-nowrap text-[14px] font-black uppercase tracking-wider">
                        {item.label}
                      </span>
                    )}
                    {isActive && !collapsed && (
                      <div className="absolute right-4">
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      </div>
                    )}
                  </motion.div>
                </Link>
              )
            })}
          </nav>

          {/* Bottom Profile Area */}
          <div className="flex-shrink-0 border-t-[3px] border-slate-900/5 p-4">
            <div className={clsx(
              "relative flex items-center rounded-2xl border-[2.5px] border-slate-900 bg-white p-3 shadow-[4px_4px_0_#1f2937] transition-all",
              collapsed ? "justify-center" : "gap-3"
            )}>
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-xl bg-orange-100 border-[2px] border-slate-900 flex items-center justify-center overflow-hidden shadow-[2px_2px_0_#1f2937]">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Admin" className="w-full h-full object-cover" />
                  ) : (
                    <User className="text-orange-500" size={20} strokeWidth={3} />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-[2px] border-slate-900 shadow-[1px_1px_0_#1f2937]" />
              </div>

              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-black text-slate-900 uppercase leading-none">{user?.fullName || 'Hệ thống'}</div>
                  <div className="mt-1 text-[9px] font-black uppercase tracking-widest text-[#49B6E5]">
                    Quản trị cao cấp
                  </div>
                </div>
              )}

              {!collapsed && (
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="p-1 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"
                >
                  <MoreVertical size={18} />
                </button>
              )}

              {/* User Popup Menu */}
              <AnimatePresence>
                {showUserMenu && !collapsed && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full left-0 right-0 mb-4 bg-white border-[2.5px] border-slate-900 shadow-[6px_6px_0_#1f2937] rounded-2xl overflow-hidden z-50 py-2"
                  >
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 transition-colors text-sm font-black uppercase tracking-widest"
                    >
                      <LogOut size={18} strokeWidth={3} />
                      Đăng xuất
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.aside>

        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute right-0 top-[100px] z-40 flex h-9 w-9 translate-x-1/2 items-center justify-center rounded-xl border-[2.5px] border-slate-900 bg-white text-slate-900 shadow-[3px_3px_0_#1f2937] transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          {collapsed ? <ChevronRight size={18} strokeWidth={3} /> : <ChevronLeft size={18} strokeWidth={3} />}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-[80px] flex-shrink-0 items-center justify-between border-b-[3px] border-slate-900 bg-white px-10 shadow-[0_4px_0_#1f293705]">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-8 bg-[#49B6E5] rounded-full" />
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 leading-tight">
                {currentLabel}
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {new Date().toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-xs font-black text-slate-900 uppercase">Trạng thái máy chủ</span>
              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-green-500">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Đang hoạt động
              </span>
            </div>
            <div className="w-[1px] h-10 bg-slate-100 hidden lg:block" />
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-50 border-[2px] border-slate-900 shadow-[3px_3px_0_#00000005]">
              <div className="w-9 h-9 rounded-xl bg-orange-400 border-[2px] border-slate-900 flex items-center justify-center text-white shadow-[2px_2px_0_#1f2937]">
                <User size={18} strokeWidth={3} fill="currentColor" />
              </div>
              <span className="hidden sm:inline text-sm font-black uppercase tracking-tight text-slate-800">
                {user?.fullName || 'Admin'}
              </span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <Outlet />
        </main>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid #fbf6ef; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  )
}

export default AdminLayout
