import React, { useState, useEffect } from 'react'
import { Layout, Menu, Typography, Dropdown, Avatar, Button } from 'antd'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
    AppstoreOutlined,
    CompassOutlined,
    UserOutlined,
    LogoutOutlined,
    TrophyOutlined,
    FireFilled,
    MenuFoldOutlined,
    MenuUnfoldOutlined
} from '@ant-design/icons'
import { useAuth } from '../../../core/auth/AuthContext'
import { motion } from 'framer-motion'
import clsx from 'clsx'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography

export default function LearnerLayout() {
    const { session, logout } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    const [collapsed, setCollapsed] = useState(false)

    // Fallbacks if session is missing
    const user = session?.user || { fullName: 'Learner', avatar: null }

    useEffect(() => {
        if (session && session.user.role === 'USER' && !session.user.region && location.pathname !== '/learner/entrytest') {
            navigate('/learner/entrytest', { replace: true })
        }
    }, [session, location.pathname, navigate])

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const userMenu = {
        items: [
            {
                key: 'profile',
                icon: <UserOutlined />,
                label: <Link to="/learner/profile">Hồ Sơ Cá Nhân</Link>,
            },
            {
                type: 'divider',
            },
            {
                key: 'logout',
                icon: <LogoutOutlined className="text-red-500" />,
                label: <span className="text-red-500 font-medium">Đăng Xuất</span>,
                onClick: handleLogout,
            },
        ],
    }

    const menuItems = [
        {
            key: '/learner/dashboard',
            icon: <AppstoreOutlined style={{ fontSize: '18px' }} />,
            label: <Link to="/learner/dashboard" className="font-semibold text-base tracking-wide">Bảng Điều Khiển</Link>,
        },
        {
            key: '/learner/roadmap',
            icon: <CompassOutlined style={{ fontSize: '18px' }} />,
            label: <Link to="/learner/roadmap" className="font-semibold text-base tracking-wide">Bản Đồ Hành Trình</Link>,
        },
        {
            key: '/learner/profile',
            icon: <UserOutlined style={{ fontSize: '18px' }} />,
            label: <Link to="/learner/profile" className="font-semibold text-base tracking-wide">Hồ Sơ Của Tôi</Link>,
        },
    ]

    // Activate the menu item based on current path
    const selectedKey = menuItems.find((item) => location.pathname.startsWith(item.key))?.key || '/learner/dashboard'

    return (
        <Layout className="min-h-screen bg-gray-50">
            {/* Sidebar Navigation */}
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                width={260}
                theme="light"
                className="shadow-[4px_0_24px_rgba(0,0,0,0.02)] border-r border-gray-100 z-20"
                style={{
                    overflow: 'auto',
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                }}
            >
                <div className="h-20 flex items-center justify-center px-4 border-b border-gray-100">
                    {/* Logo Section */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className={clsx(
                            "flex items-center gap-3 overflow-hidden whitespace-nowrap transition-all duration-300",
                            collapsed ? "w-10 justify-center" : "w-full justify-start px-2"
                        )}
                    >
                        <div className="w-10 h-10 min-w-[40px] rounded-xl bg-gradient-to-br from-brand-green to-teal-500 flex items-center justify-center shadow-lg shadow-green-200">
                            <TrophyOutlined className="text-white text-xl" />
                        </div>
                        {!collapsed && (
                            <span className="font-extrabold text-xl text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-teal-600">
                                SpeakVN
                            </span>
                        )}
                    </motion.div>
                </div>

                <Menu
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    items={menuItems}
                    className="mt-6 border-none px-3"
                    // Customizing Antd Menu slightly via global classes or inline styles where possible
                    style={{ backgroundColor: 'transparent' }}
                />

                {/* Toggle Collapse Button at the bottom */}
                <div className="absolute bottom-6 w-full px-4 flex justify-center">
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        className="w-full h-12 rounded-xl text-gray-400 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center"
                    />
                </div>
            </Sider>

            <Layout className="bg-transparent" style={{ marginLeft: collapsed ? 80 : 260, transition: 'margin-left 0.2s' }}>
                {/* Top Header */}
                <Header className="h-20 bg-white/80 backdrop-blur-md px-8 flex items-center justify-between shadow-[0_4px_24px_rgba(0,0,0,0.02)] border-b border-gray-100 sticky top-0 z-10 transition-all duration-300">
                    {/* Left Header Area */}
                    <div className="flex items-center gap-6">
                        {/* Optional: Page Title could go here based on route */}
                    </div>

                    {/* Right Header Area - Stats & Profile */}
                    <div className="flex items-center gap-6">

                        {/* Streak */}
                        <div className="hidden sm:flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100 cursor-pointer hover:bg-orange-100 transition-colors">
                            <FireFilled className="text-orange-500 text-lg" />
                            <span className="font-bold text-orange-600">
                                {session?.user?.streak ?? 0} Ngày
                            </span>
                        </div>

                        {/* User Dropdown */}
                        <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
                            <div className="flex items-center gap-3 cursor-pointer p-2 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                <div className="hidden md:flex flex-col items-end leading-tight">
                                    <Text strong className="text-sm text-gray-800">{user.fullName}</Text>
                                    <Text type="secondary" className="text-xs">Học Viên</Text>
                                </div>
                                <Avatar
                                    src={user.avatar}
                                    icon={!user.avatar && <UserOutlined />}
                                    size={42}
                                    className="bg-brand-blue/10 text-brand-blue border-2 border-brand-blue/20"
                                />
                            </div>
                        </Dropdown>
                    </div>
                </Header>

                {/* Main Content Area */}
                <Content className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
                    {/* The Outlet renders the child routes dynamically */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="h-full"
                    >
                        <Outlet />
                    </motion.div>
                </Content>
            </Layout>
        </Layout>
    )
}
