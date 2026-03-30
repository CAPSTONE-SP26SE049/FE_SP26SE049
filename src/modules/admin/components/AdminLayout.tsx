import { Layout, Menu, Avatar, Dropdown, Button } from 'antd'
import {
    DashboardOutlined,
    UserOutlined,
    SettingOutlined,
    LogoutOutlined,
    BellOutlined,
    TrophyOutlined,
    BookOutlined,
    FileTextOutlined,
} from '@ant-design/icons'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../core/auth/AuthContext'

const { Header, Sider, Content } = Layout

const CHAPTER_NAV_KEY = 'chapter-nav'

const AdminLayout = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { logout, session } = useAuth()
    const [menuOpenKeys, setMenuOpenKeys] = useState<string[]>([])

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const menuItems = useMemo(
        () =>
            [
                {
                    key: '/admin',
                    icon: <DashboardOutlined />,
                    label: <Link to="/admin">Tổng quan</Link>,
                },
                {
                    key: '/admin/users',
                    icon: <UserOutlined />,
                    label: <Link to="/admin/users">Quản lý tài khoản</Link>,
                },
                {
                    key: CHAPTER_NAV_KEY,
                    icon: <BookOutlined />,
                    label: 'Học phần & Bài kiểm tra',
                    children: [
                        {
                            key: 'chapter-r-all',
                            label: <Link to="/admin/chapters">Tất cả miền</Link>,
                        },
                        {
                            key: 'chapter-r-BAC',
                            label: <Link to="/admin/chapters?region=BAC">Miền Bắc</Link>,
                        },
                        {
                            key: 'chapter-r-TRUNG',
                            label: <Link to="/admin/chapters?region=TRUNG">Miền Trung</Link>,
                        },
                        {
                            key: 'chapter-r-NAM',
                            label: <Link to="/admin/chapters?region=NAM">Miền Nam</Link>,
                        },
                    ],
                },
                {
                    key: '/admin/challenges',
                    icon: <FileTextOutlined />,
                    label: <Link to="/admin/challenges">Kho thử thách</Link>,
                },

                {
                    key: '/admin/rewards',
                    icon: <TrophyOutlined />,
                    label: <Link to="/admin/rewards">Huy hiệu & Thành tích</Link>,
                },
                {
                    type: 'divider',
                },
                {
                    key: '/admin/settings',
                    icon: <SettingOutlined />,
                    label: <Link to="/admin/settings">Cài đặt hệ thống</Link>,
                },
            ] as any,
        []
    )

    const selectedMenuKeys = useMemo(() => {
        if (location.pathname === '/admin/chapters') {
            const r = new URLSearchParams(location.search).get('region')
            if (r === 'BAC' || r === 'TRUNG' || r === 'NAM') {
                return [`chapter-r-${r}`]
            }
            return ['chapter-r-all']
        }
        return [location.pathname]
    }, [location.pathname, location.search])

    useEffect(() => {
        if (location.pathname === '/admin/chapters') {
            setMenuOpenKeys((prev) => (prev.includes(CHAPTER_NAV_KEY) ? prev : [...prev, CHAPTER_NAV_KEY]))
        }
    }, [location.pathname])

    const onMenuOpenChange = useCallback((keys: string[]) => {
        setMenuOpenKeys(keys)
    }, [])

    const headerTitle = useMemo(() => {
        if (location.pathname === '/admin/chapters') {
            const r = new URLSearchParams(location.search).get('region')
            const map: Record<string, string> = {
                BAC: 'Miền Bắc',
                TRUNG: 'Miền Trung',
                NAM: 'Miền Nam',
            }
            if (r && map[r]) {
                return `Học phần & Bài kiểm tra — ${map[r]}`
            }
            return 'Học phần & Bài kiểm tra'
        }
        const flat: Record<string, string> = {
            '/admin': 'Tổng quan',
            '/admin/users': 'Quản lý tài khoản',
            '/admin/challenges': 'Kho thử thách',
            '/admin/rewards': 'Huy hiệu & Thành tích',
            '/admin/settings': 'Cài đặt hệ thống',
        }
        return flat[location.pathname] || 'Admin Portal'
    }, [location.pathname, location.search])

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                width={260}
                theme="dark"
                className="shadow-xl z-20"
                style={{
                    overflow: 'auto',
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                }}
            >
                <div className="h-16 flex items-center justify-center border-b border-gray-700">
                    <h1 className="text-white text-xl font-bold tracking-wider">
                        <span className="text-brand-green">SpeakVN</span> Admin
                    </h1>
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={selectedMenuKeys}
                    openKeys={menuOpenKeys}
                    onOpenChange={onMenuOpenChange}
                    items={menuItems}
                    className="mt-4 text-base"
                />
            </Sider>
            <Layout
                style={{
                    marginLeft: 260,
                    height: '100vh',
                    maxHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                <Header
                    className="bg-white shadow-sm px-6 flex justify-between items-center h-16 z-10"
                    style={{ flexShrink: 0 }}
                >
                    <h2 className="text-xl font-semibold text-gray-800 m-0">
                        {headerTitle}
                    </h2>
                    <div className="flex items-center gap-6">
                        <Button
                            type="text"
                            icon={<BellOutlined className="text-xl text-gray-600" />}
                            className="rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-100"
                        />
                        <Dropdown menu={{
                            items: [
                                {
                                    key: 'logout',
                                    icon: <LogoutOutlined />,
                                    label: 'Đăng xuất',
                                    onClick: handleLogout,
                                }
                            ]
                        }} placement="bottomRight" arrow>
                            <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors">
                                <div className="text-right hidden md:block">
                                    <div className="text-sm font-semibold text-gray-800">
                                        {(session?.user as any)?.fullName || (session?.user as any)?.name || 'Admin User'}
                                    </div>
                                    <div className="text-xs text-gray-500">System Administrator</div>
                                </div>
                                <Avatar
                                    size="large"
                                    style={{ backgroundColor: '#10b981' }}
                                    icon={<UserOutlined />}
                                />
                            </div>
                        </Dropdown>
                    </div>
                </Header>
                <Content
                    className="p-6"
                    style={{
                        flex: 1,
                        minHeight: 0,
                        overflow: 'auto',
                    }}
                >
                    <div className="p-6 bg-white rounded-2xl shadow-sm animate-fadeIn">
                        <Outlet />
                    </div>
                </Content>
            </Layout>
        </Layout>
    )
}

export default AdminLayout
