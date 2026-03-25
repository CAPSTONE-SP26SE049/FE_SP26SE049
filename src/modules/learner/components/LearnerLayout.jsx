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
    MenuUnfoldOutlined,
    SettingOutlined
} from '@ant-design/icons'
import { useAuth } from '../../../core/auth/AuthContext'
import { motion } from 'framer-motion'
import clsx from 'clsx'

const { Sider, Content } = Layout
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
    ]

    // Activate the menu item based on current path
    const selectedKey = menuItems.find((item) => location.pathname.startsWith(item.key))?.key || '/learner/dashboard'

    return (
        <Layout className="min-h-screen bg-gray-50 flex flex-row">
            {/* Sidebar Navigation */}
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                width={260}
                theme="light"
                className="shadow-[4px_0_24px_rgba(0,0,0,0.02)] border-r border-gray-100 flex flex-col fixed h-screen z-50 overflow-y-auto"
                style={{ position: 'sticky', top: 0, height: '100vh' }}
            >
                <div className="flex flex-col h-full bg-white">
                    {/* Top Section: Logo */}
                    <Dropdown overlay={
                        <Menu>
                            <Menu.Item key="collapse" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)}>
                                {collapsed ? "Mở Menu" : "Thu gọn Menu"}
                            </Menu.Item>
                        </Menu>
                    } trigger={['contextMenu']}>
                        <div className="h-20 flex items-center justify-center px-4 border-b border-gray-100 shrink-0 cursor-pointer" onClick={() => setCollapsed(!collapsed)}>
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
                    </Dropdown>

                    {/* Middle Section: Menu */}
                    <div className="flex-1 overflow-y-auto py-4">
                        <Menu
                            mode="inline"
                            selectedKeys={[selectedKey]}
                            items={menuItems}
                            className="border-none px-3"
                            style={{ backgroundColor: 'transparent' }}
                        />
                    </div>

                    {/* Bottom Section: Stats & Profile */}
                    <div className="shrink-0 border-t border-gray-100 p-4 space-y-4 bg-gray-50/50">
                        {/* Stats Wrapper */}
                        <div className={clsx("flex flex-col gap-2 transition-opacity duration-300", collapsed ? "hidden" : "block")}>
                            <div className="flex items-center gap-3 bg-orange-50 px-3 py-2 rounded-xl border border-orange-100">
                                <FireFilled className="text-orange-500 text-lg" />
                                <span className="font-bold text-orange-600 text-sm whitespace-nowrap">{user?.streak || '0'} Ngày Học</span>
                            </div>
                            <div className="flex items-center gap-3 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">
                                <TrophyOutlined className="text-brand-blue text-lg" />
                                <span className="font-bold text-blue-600 text-sm whitespace-nowrap">{user?.totalXp || '0'} XP Tổng</span>
                            </div>
                        </div>

                        {/* Collapsed Stats Version */}
                        {collapsed && (
                            <div className="flex flex-col gap-3 items-center">
                                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-100">
                                    <FireFilled />
                                </div>
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-brand-blue border border-blue-100">
                                    <TrophyOutlined />
                                </div>
                            </div>
                        )}

                        {/* User Profile */}
                        <Dropdown menu={userMenu} placement={collapsed ? "bottomLeft" : "topRight"} trigger={['click']}>
                            <div className={clsx(
                                "flex items-center cursor-pointer p-2 rounded-2xl hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200",
                                collapsed ? "justify-center" : "gap-3"
                            )}>
                                <Avatar
                                    src={user.avatar}
                                    icon={!user.avatar && <UserOutlined />}
                                    size={42}
                                    className="bg-brand-blue/10 text-brand-blue border-2 border-brand-blue/20 shrink-0"
                                />
                                {!collapsed && (
                                    <div className="flex-1 min-w-0 flex flex-col leading-tight">
                                        <Text strong className="text-sm text-gray-800 truncate">{user.fullName || 'Người Dùng'}</Text>
                                        <Text type="secondary" className="text-xs">Học Viên</Text>
                                    </div>
                                )}
                            </div>
                        </Dropdown>
                    </div>
                </div>
            </Sider>

            {/* Main Content Area */}
            <Layout className="bg-transparent flex-1 transition-all duration-300">
                <Content className="p-4 sm:px-8 sm:pt-2 sm:pb-8 max-w-7xl mx-auto w-full min-h-screen">
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
