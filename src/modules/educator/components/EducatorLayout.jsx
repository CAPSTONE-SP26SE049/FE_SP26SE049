import React, { useMemo, useState } from 'react'
import { Avatar, Dropdown } from 'antd'
import { SettingOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../core/auth/AuthContext'
import { motion } from 'framer-motion'
import { BookOpen, ChartNoAxesCombined, MessageSquareMore, NotebookPen, Sparkles, ChevronLeft, ChevronRight, Users, BrainCircuit } from 'lucide-react'

const NAV_ITEMS = [
  { key: '/educator', icon: BookOpen, label: 'Tổng quan' },
  { key: '/educator/students', icon: Users, label: 'Quản lý học viên' },
  { key: '/educator/progress', icon: ChartNoAxesCombined, label: 'Theo dõi tiến độ' },
  { key: '/educator/lessons', icon: NotebookPen, label: 'Giáo án & mục tiêu' },
  { key: '/educator/messages', icon: MessageSquareMore, label: 'Tương tác & phản hồi' },
  { key: '/educator/analytics', icon: BrainCircuit, label: 'Phân tích dữ liệu' },
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
      { key: 'settings', icon: <SettingOutlined />, label: <Link to="/educator/settings">Cài đặt</Link> },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined className="text-red-500" />, label: <span className="text-red-500 font-semibold">Đăng xuất</span>, onClick: handleLogout },
    ]
  }), [])

  const selectedKey = [...NAV_ITEMS]
    .sort((a, b) => b.key.length - a.key.length)
    .find(item => location.pathname === item.key || location.pathname.startsWith(item.key + '/'))?.key || '/educator'

  const currentLabel = NAV_ITEMS.find(i => i.key === selectedKey)?.label || 'Educator Portal'

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 overflow-hidden font-sans">
      <div className="relative flex-shrink-0" style={{ zIndex: 30 }}>
        <motion.aside animate={{ width: collapsed ? 84 : 272 }} transition={{ duration: 0.25, ease: 'easeInOut' }} className="flex flex-col h-full bg-white/90 backdrop-blur border-r border-indigo-100 shadow-[4px_0_24px_rgba(79,70,229,0.08)] overflow-hidden">
          <div className="flex items-center h-[72px] px-5 border-b border-indigo-50 flex-shrink-0 gap-3">
            <div className="w-10 h-10 min-w-[40px] rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles size={18} className="text-white" />
            </div>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="font-black text-lg leading-none">Speak<span className="text-indigo-600">VN</span></div>
                <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-indigo-400 mt-0.5">Educator Journey</div>
              </motion.div>
            )}
          </div>
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {NAV_ITEMS.map(item => {
              const isActive = selectedKey === item.key
              const Icon = item.icon
              return <Link key={item.key} to={item.key}><div className={`relative flex items-center gap-3 px-3 h-12 rounded-2xl cursor-pointer transition-all duration-200 group ${isActive ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-700'}`}>{isActive && <motion.div layoutId="educatorActiveNav" className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl" transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }} />}{<Icon size={20} className="relative z-10 flex-shrink-0" />}{!collapsed && <span className="relative z-10 font-bold text-sm whitespace-nowrap">{item.label}</span>}</div></Link>
            })}
          </nav>
          <div className="flex-shrink-0 border-t border-indigo-50 p-3">
            <Dropdown menu={userMenu} placement="topRight" trigger={['click']}>
              <div className={`flex items-center cursor-pointer p-2 rounded-2xl hover:bg-indigo-50 transition-all ${collapsed ? 'justify-center' : 'gap-3'}`}>
                <Avatar 
                  icon={<UserOutlined />} 
                  size={40} 
                  src={avatarErr ? null : (user?.avatar_url || user?.avatar)} 
                  onError={() => { setAvatarErr(true); return true; }}
                  className="bg-indigo-100 text-indigo-500 border-2 border-indigo-200 flex-shrink-0" 
                />
                {!collapsed && <div className="flex-1 min-w-0"><div className="text-sm font-bold text-slate-800 truncate">{userDisplayName}</div><div className="text-[10px] text-indigo-500 uppercase tracking-widest font-black">Giáo viên</div></div>}
              </div>
            </Dropdown>
          </div>
        </motion.aside>
        <button onClick={() => setCollapsed(!collapsed)} className="absolute right-0 translate-x-1/2 top-[88px] w-7 h-7 bg-white border border-indigo-200 rounded-full flex items-center justify-center shadow-md hover:bg-indigo-50 transition-all z-40 text-indigo-600">{collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}</button>
      </div>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-[72px] bg-white/90 backdrop-blur border-b border-indigo-100 flex items-center justify-between px-8 flex-shrink-0 shadow-sm">
          <div><h1 className="text-lg font-black text-slate-800 leading-tight">{currentLabel}</h1><p className="text-xs text-slate-400 font-medium">SpeakVN Journey educator workspace</p></div>
          <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
            <div className="flex items-center gap-2.5 cursor-pointer px-3 py-1.5 rounded-xl hover:bg-indigo-50 transition-all">
              <div className="hidden md:block text-right">
                <div className="text-sm font-bold text-slate-800 leading-tight">{userDisplayName}</div>
                <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Giáo viên</div>
              </div>
              <Avatar 
                icon={<UserOutlined />} 
                size={36} 
                src={avatarErr ? null : (user?.avatar_url || user?.avatar)} 
                onError={() => { setAvatarErr(true); return true; }}
                className="bg-indigo-100 text-indigo-500 border-2 border-indigo-200 flex-shrink-0" 
              />
            </div>
          </Dropdown>
        </header>
        <main className="flex-1 overflow-y-auto p-6"><Outlet /></main>
      </div>
    </div>
  )
}

export default EducatorLayout