import React, { useMemo, useState } from 'react'
import { Avatar, Dropdown } from 'antd'
import { SettingOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../core/auth/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, ChartNoAxesCombined, MessageSquareMore, Sparkles, ChevronLeft, ChevronRight, Users, Bell, Search, PlusCircle } from 'lucide-react'
import clsx from 'clsx'

const NAV_ITEMS = [
  { key: '/educator', icon: BookOpen, label: 'Tổng quan' },
  { key: '/educator/students', icon: Users, label: 'Quản lý học viên' },
  { key: '/educator/design-path', icon: Sparkles, label: 'Thiết kế lộ trình' },
  { key: '/educator/progress', icon: ChartNoAxesCombined, label: 'Theo dõi tiến độ' },
  { key: '/educator/messages', icon: MessageSquareMore, label: 'Tương tác & phản hồi' },
  { key: '/educator/settings', icon: SettingOutlined, label: 'Cài đặt' },
]

const EducatorLayout = () => {
  const location = useLocation()
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [avatarErr, setAvatarErr] = useState(false)

  const user = session?.user
  const userDisplayName = user?.fullName || 'Educator'

  const handleLogout = () => { logout(); navigate('/login') }

  const userMenu = useMemo(() => ({
    items: [
      { key: 'profile', icon: <UserOutlined />, label: 'Hồ sơ cá nhân' },
      { key: 'settings', icon: <SettingOutlined />, label: <Link to="/educator/settings">Cài đặt</Link> },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined className="text-red-500" />, label: <span className="text-red-500 font-bold">Đăng xuất</span>, onClick: handleLogout },
    ]
  }), [])

  const selectedKey = [...NAV_ITEMS]
    .sort((a, b) => b.key.length - a.key.length)
    .find(item => location.pathname === item.key || location.pathname.startsWith(item.key + '/'))?.key || '/educator'

  const currentLabel = NAV_ITEMS.find(i => i.key === selectedKey)?.label || 'Educator Portal'

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-nunito">
      <div className="relative flex-shrink-0" style={{ zIndex: 50 }}>
        <motion.aside
          animate={{ width: collapsed ? 100 : 280 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-col h-full bg-white border-r border-slate-100 shadow-[0_0_40px_rgba(0,0,0,0.02)] overflow-hidden relative"
        >
          {/* Logo Section */}
          <div className="flex items-center h-[72px] px-6 gap-3">
            <div className="w-9 h-9 min-w-[36px] rounded-[12px] bg-gradient-to-br from-purple-600 via-purple-500 to-orange-500 flex items-center justify-center shadow-lg shadow-purple-500/20 rotate-3 transition-transform hover:rotate-0">
              <Sparkles size={18} className="text-white" />
            </div>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                <div className="font-black text-lg leading-none text-slate-800 tracking-tight">Speak<span className="text-purple-600">VN</span></div>
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-400 mt-0.5">Educator</div>
              </motion.div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
            {NAV_ITEMS.map(item => {
              const isActive = selectedKey === item.key
              const Icon = item.icon
              return (
                <Link key={item.key} to={item.key}>
                  <div className={clsx(
                    "relative flex items-center gap-3 px-4 h-12 rounded-xl cursor-pointer transition-all duration-300 group overflow-hidden",
                    isActive
                      ? "text-white shadow-lg shadow-purple-600/10"
                      : "text-slate-500 hover:bg-slate-50 hover:text-purple-600"
                  )}>
                    {isActive && (
                      <motion.div
                        layoutId="educatorActiveNav"
                        className="absolute inset-0 bg-gradient-to-r from-purple-700 via-purple-600 to-purple-500"
                        transition={{ type: 'spring', bounce: 0.15, duration: 0.6 }}
                      />
                    )}
                    <Icon size={20} className="relative z-10 flex-shrink-0" />
                    {!collapsed && (
                      <span className="relative z-10 font-black text-[11px] tracking-widest uppercase transition-colors">
                        {item.label}
                      </span>
                    )}
                    {isActive && !collapsed && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white z-10" />
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* User Section at Bottom */}
          <div className="flex-shrink-0 p-4 mb-2">
            <div className="bg-slate-50/50 rounded-[2rem] p-4 border border-slate-100 flex items-center justify-between group">
              <Dropdown menu={userMenu} placement="topRight" trigger={['click']}>
                <div className={clsx("flex items-center cursor-pointer transition-all", collapsed ? "justify-center w-full" : "gap-3 flex-1")}>
                  <Avatar
                    icon={<UserOutlined />}
                    size={40}
                    src={avatarErr ? null : (user?.avatar_url || user?.avatar)}
                    onError={() => { setAvatarErr(true); return true; }}
                    className="bg-white text-purple-500 border-2 border-white shadow-md flex-shrink-0"
                  />
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black text-slate-800 truncate leading-tight">{userDisplayName}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Educator</div>
                    </div>
                  )}
                </div>
              </Dropdown>
            </div>
          </div>

          {/* Collapse Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-[76px] w-6 h-6 bg-white border border-slate-100 rounded-lg flex items-center justify-center shadow-lg hover:bg-purple-600 hover:text-white transition-all z-[60] text-slate-400 group-hover:scale-110"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </motion.aside>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Modern Header */}
        <header className="h-[72px] bg-white border-b border-slate-50 flex items-center justify-between px-8 flex-shrink-0 relative z-40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
              <Search size={16} />
            </div>
            <div className="h-4 w-px bg-slate-200 mx-0.5" />
          </div>

          <div className="flex items-center gap-6">

            <div className="h-8 w-px bg-slate-100" />

            <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
              <div className="flex items-center gap-3 cursor-pointer group">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-black text-slate-800 group-hover:text-purple-600 transition-colors">{userDisplayName}</div>
                  <div className="text-[9px] text-purple-400 font-bold uppercase tracking-[0.05em] mt-0.5">Online</div>
                </div>
                <Avatar
                  icon={<UserOutlined />}
                  size={40}
                  src={avatarErr ? null : (user?.avatar_url || user?.avatar)}
                  onError={() => { setAvatarErr(true); return true; }}
                  className="bg-purple-100 text-purple-500 border-2 border-white shadow-xl flex-shrink-0 group-hover:scale-105 transition-transform"
                />
              </div>
            </Dropdown>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#f8fafc] custom-scrollbar">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  )
}

export default EducatorLayout;