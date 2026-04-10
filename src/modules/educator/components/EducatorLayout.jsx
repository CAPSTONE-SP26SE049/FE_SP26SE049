import React, { useState } from 'react'
import { Avatar, Dropdown } from 'antd'
import { SettingOutlined, UserOutlined, LogoutOutlined, DashboardOutlined, TeamOutlined, PartitionOutlined, BarChartOutlined } from '@ant-design/icons'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../core/auth/AuthContext'
import { motion } from 'framer-motion'
import { LayoutDashboard, Users, Network, BarChart2, Settings, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'

const NAV_ITEMS = [
  { key: '/educator', icon: LayoutDashboard, label: 'Tổng quan' },
  { key: '/educator/classrooms', icon: Users, label: 'Quản lý lớp học' },
  { key: '/educator/students', icon: UserOutlined, label: 'Danh sách học sinh', isAntd: true },
  { key: '/educator/matrix', icon: Network, label: 'Ma trận đánh giá' },
  { key: '/educator/analytics', icon: BarChart2, label: 'Phân tích học sinh' },
  { key: '/educator/settings', icon: Settings, label: 'Cài đặt' },
]

const EducatorLayout = () => {
  const location = useLocation()
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const user = session?.user
  const userDisplayName = user?.fullName || 'Giáo vụ'

  const handleLogout = () => { logout(); navigate('/login') }

  const userMenu = {
    items: [
      { key: 'settings', icon: <SettingOutlined />, label: <Link to="/educator/settings">Cài đặt</Link> },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined className="text-red-500" />, label: <span className="text-red-500 font-semibold">Đăng xuất</span>, onClick: handleLogout },
    ]
  }

  const selectedKey = [...NAV_ITEMS]
    .sort((a, b) => b.key.length - a.key.length)
    .find(item => location.pathname === item.key || location.pathname.startsWith(item.key + '/'))?.key || '/educator'

  const currentLabel = NAV_ITEMS.find(i => i.key === selectedKey)?.label || 'Educator Portal'

  return (
    <div className="flex h-screen bg-[#f8f7ff] overflow-hidden font-sans">

      {/* ── Sidebar Wrapper ── */}
      <div className="relative flex-shrink-0" style={{ zIndex: 30 }}>
        <motion.aside
          animate={{ width: collapsed ? 80 : 260 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex flex-col h-full bg-white border-r border-purple-100 shadow-[4px_0_24px_rgba(147,51,234,0.06)] overflow-hidden"
        >
          {/* Logo */}
          <div className="flex items-center h-[72px] px-5 border-b border-purple-50 flex-shrink-0 overflow-hidden gap-3">
            <div className="w-10 h-10 min-w-[40px] rounded-xl bg-gradient-to-br from-purple-600 to-orange-500 flex items-center justify-center shadow-lg shadow-purple-500/30 flex-shrink-0">
              <Sparkles size={18} className="text-white" />
            </div>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="font-black text-lg leading-none">
                  Speak<span className="text-purple-600">VN</span>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-orange-400 mt-0.5">Educator Portal</div>
              </motion.div>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {NAV_ITEMS.map(item => {
              const isActive = selectedKey === item.key
              const Icon = item.icon
              return (
                <Link key={item.key} to={item.key}>
                  <div className={`relative flex items-center gap-3 px-3 h-12 rounded-2xl cursor-pointer transition-all duration-200 group
                                        ${isActive
                      ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/25'
                      : 'text-gray-500 hover:bg-purple-50 hover:text-purple-700'
                    }`}>
                    {isActive && (
                      <motion.div layoutId="educatorActiveNav"
                        className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                    {item.isAntd
                      ? <UserOutlined className="relative z-10 flex-shrink-0 text-lg" />
                      : <Icon size={20} className="relative z-10 flex-shrink-0" />
                    }
                    {!collapsed && (
                      <span className="relative z-10 font-bold text-sm whitespace-nowrap">{item.label}</span>
                    )}
                    {collapsed && (
                      <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                        {item.label}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900" />
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* User */}
          <div className="flex-shrink-0 border-t border-purple-50 p-3">
            <Dropdown menu={userMenu} placement="topRight" trigger={['click']}>
              <div className={`flex items-center cursor-pointer p-2 rounded-2xl hover:bg-purple-50 transition-all ${collapsed ? 'justify-center' : 'gap-3'}`}>
                <Avatar icon={<UserOutlined />} size={40}
                  src={user?.avatar}
                  className="bg-orange-100 text-orange-500 border-2 border-orange-200 flex-shrink-0"
                />
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-800 truncate">{userDisplayName}</div>
                    <div className="text-[10px] text-orange-500 uppercase tracking-widest font-black">Giáo viên</div>
                  </div>
                )}
              </div>
            </Dropdown>
          </div>
        </motion.aside>

        {/* Toggle button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute right-0 translate-x-1/2 top-[88px] w-7 h-7 bg-white border border-purple-200 rounded-full flex items-center justify-center shadow-md hover:bg-purple-50 hover:border-purple-400 transition-all z-40 text-purple-600"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-[72px] bg-white border-b border-purple-100 flex items-center justify-between px-8 flex-shrink-0 shadow-sm">
          <div>
            <h1 className="text-lg font-black text-gray-800 leading-tight">{currentLabel}</h1>
            <p className="text-xs text-gray-400 font-medium">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
            <div className="flex items-center gap-2.5 cursor-pointer px-3 py-1.5 rounded-xl hover:bg-purple-50 transition-all">
              <div className="hidden md:block text-right">
                <div className="text-sm font-bold text-gray-800 leading-tight">{userDisplayName}</div>
                <div className="text-[10px] text-orange-500 font-bold uppercase tracking-wider">Giáo viên</div>
              </div>
              <Avatar icon={<UserOutlined />} size={36}
                src={user?.avatar}
                className="bg-orange-100 text-orange-500 border-2 border-orange-200 flex-shrink-0"
              />
            </div>
          </Dropdown>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default EducatorLayout
