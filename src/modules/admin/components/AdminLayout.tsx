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
import { useAuth } from '../../../core/auth/AuthContext'

const { Header, Sider, Content } = Layout

const AdminLayout = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { logout, session } = useAuth()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const menuItems = [
        {
            key: '/admin',
            icon: <DashboardOutlined />,
            label: <Link to="/admin">Tổng quan</Link>,
        },
        {
            key: '/admin/users',
            icon: <UserOutlined />,
            label: <Link to="/admin/users">Quản lý người dùng</Link>,
        },
        {
            key: '/admin/chapters',
            icon: <BookOutlined />,
            label: <Link to="/admin/chapters">Học phần & Bài kiểm tra</Link>,
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
    ] as any

    const findMenuLabel = (path: string) => {
        const item = menuItems.find((i: any) => i.key === path) as any
        return item?.label?.props?.children || 'Admin Portal'
    }

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
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    className="mt-4 text-base"
                />
            </Sider>
            <Layout style={{ marginLeft: 260 }}>
                <Header className="bg-white shadow-sm px-6 flex justify-between items-center h-16 z-10 sticky top-0">
                    <h2 className="text-xl font-semibold text-gray-800 m-0">
                        {findMenuLabel(location.pathname)}
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
                <Content className="m-6">
                    <div className="p-6 bg-white rounded-2xl shadow-sm min-h-[calc(100vh-112px)] animate-fadeIn">
                        <Outlet />
                    </div>
                </Content>
            </Layout>
        </Layout>
    )
}

export default AdminLayout
