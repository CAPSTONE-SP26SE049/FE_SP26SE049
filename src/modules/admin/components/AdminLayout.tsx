import { useState } from 'react'
import { Avatar, Dropdown } from 'antd'
import { UserOutlined, LogoutOutlined } from '@ant-design/icons'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../core/auth/AuthContext'
import { motion } from 'framer-motion'
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
} from 'lucide-react'

const NAV_ITEMS = [
  { key: '/admin', icon: LayoutDashboard, label: 'Tổng quan (Analytics)' },
  { key: '/admin/chapters', icon: BookOpen, label: 'Quản lý bài tập (Content)' },
  { key: '/admin/ai-monitor', icon: Bot, label: 'Giám sát AI (AI Monitor)' },
  { key: '/admin/users', icon: Users, label: 'Quản lý người dùng' },
  { key: '/admin/achievements', icon: Medal, label: 'Hệ thống Thành tựu' },
  { key: '/admin/settings', icon: Settings, label: 'Cài đặt hệ thống' },
]

const AdminLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, session } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const user = session?.user as any
  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined className="text-red-500" />,
        label: <span className="text-red-500 font-semibold">Đăng xuất</span>,
        onClick: handleLogout,
      },
    ],
  }

  const selectedKey = [...NAV_ITEMS]
    .sort((a, b) => b.key.length - a.key.length)
    .find(
      (item) =>
        location.pathname === item.key || location.pathname.startsWith(item.key + '/'),
    )?.key || '/admin'

  const currentLabel = NAV_ITEMS.find((i) => i.key === selectedKey)?.label || 'Admin Portal'

  return (
    <div className="flex h-screen bg-[#f8f7ff] overflow-hidden font-sans">
      <div className="relative flex-shrink-0" style={{ zIndex: 30 }}>
        <motion.aside
          animate={{ width: collapsed ? 80 : 280 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex h-full flex-col overflow-hidden border-r border-purple-100 bg-white shadow-[4px_0_24px_rgba(147,51,234,0.06)]"
        >
          <div className="flex h-[72px] flex-shrink-0 items-center gap-3 overflow-hidden border-b border-purple-50 px-5">
            <div className="flex h-10 w-10 min-w-[40px] flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-orange-500 shadow-lg shadow-purple-500/30">
              <Sparkles size={18} className="text-white" />
            </div>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-lg font-black leading-none">
                  Speak<span className="text-purple-600">VN</span>
                </div>
                <div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-purple-400">
                  Admin Portal
                </div>
              </motion.div>
            )}
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {NAV_ITEMS.map((item) => {
              const isActive = selectedKey === item.key
              const Icon = item.icon
              return (
                <Link key={item.key} to={item.key}>
                  <div
                    className={`group relative flex h-12 cursor-pointer items-center gap-3 rounded-2xl px-3 transition-all duration-200 ${isActive
                      ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/25'
                      : 'text-gray-500 hover:bg-purple-50 hover:text-purple-700'
                      }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="adminActiveNav"
                        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                    <Icon size={20} className="relative z-10 flex-shrink-0" />
                    {!collapsed && (
                      <span className="relative z-10 whitespace-nowrap text-sm font-bold">
                        {item.label}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          <div className="flex-shrink-0 border-t border-purple-50 p-3">
            <Dropdown menu={userMenu} placement="topRight" trigger={['click']}>
              <div
                className={`flex cursor-pointer items-center rounded-2xl p-2 transition-all hover:bg-purple-50 ${collapsed ? 'justify-center' : 'gap-3'}`}
              >
                <Avatar
                  icon={<UserOutlined />}
                  size={40}
                  className="flex-shrink-0 border-2 border-purple-200 bg-purple-100 text-purple-600"
                  src={user?.avatar}
                />
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-gray-800">{user?.fullName || 'Admin'}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-purple-500">
                      Quản trị viên
                    </div>
                  </div>
                )}
              </div>
            </Dropdown>
          </div>
        </motion.aside>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute right-0 top-[88px] z-40 flex h-7 w-7 translate-x-1/2 items-center justify-center rounded-full border border-purple-200 bg-white text-purple-600 shadow-md transition-all hover:border-purple-400 hover:bg-purple-50"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <header className="flex h-[72px] flex-shrink-0 items-center justify-between border-b border-purple-100 bg-white px-8 shadow-sm">
          <div>
            <h1 className="text-lg font-black leading-tight text-gray-800">{currentLabel}</h1>
            <p className="text-xs font-medium text-gray-400">
              {new Date().toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
            <div className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-1.5 transition-all hover:bg-purple-50">
              <div className="hidden text-right md:block">
                <div className="text-sm font-bold leading-tight text-gray-800">
                  {user?.fullName || 'Admin User'}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-500">
                  Quản trị viên
                </div>
              </div>
              <Avatar
                icon={<UserOutlined />}
                size={36}
                src={user?.avatar}
                className="flex-shrink-0 border-2 border-purple-200 bg-purple-100 text-purple-600"
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

export default AdminLayout
