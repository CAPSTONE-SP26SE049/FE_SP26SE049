import React from 'react'
import { Layout, Menu, Avatar, Typography } from 'antd'
import {
  DashboardOutlined,
  ReadOutlined,
  PartitionOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Link, Outlet, useLocation } from 'react-router-dom'

const { Header, Sider, Content } = Layout
const { Title } = Typography

const menuItems = [
  {
    key: '/educator',
    icon: <DashboardOutlined />,
    label: <Link to="/educator">Tổng quan</Link>,
  },
  {
    key: '/educator/classrooms',
    icon: <TeamOutlined />,
    label: <Link to="/educator/classrooms">Quản lý lớp học</Link>,
  },
  {
    key: '/educator/students',
    icon: <UserOutlined />,
    label: <Link to="/educator/students">Danh sách học sinh</Link>,
  },
  {
    key: '/educator/roadmap',
    icon: <ReadOutlined />,
    label: <Link to="/educator/roadmap">Lộ trình học tập</Link>,
  },
  {
    key: '/educator/matrix',
    icon: <PartitionOutlined />,
    label: <Link to="/educator/matrix">Ma trận đánh giá</Link>,
  },
  {
    key: '/educator/analytics',
    icon: <BarChartOutlined />,
    label: <Link to="/educator/analytics">Phân tích học sinh</Link>,
  },
  {
    key: '/educator/settings',
    icon: <SettingOutlined />,
    label: <Link to="/educator/settings">Cài đặt</Link>,
  },
]

const EducatorLayout = () => {
  const location = useLocation()

  const selectedKey =
    [...menuItems]
      .sort((a, b) => b.key.length - a.key.length)
      .find((item) => location.pathname.startsWith(item.key))?.key ?? '/educator'

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={260}
        theme="dark"
        style={{
          background: 'linear-gradient(180deg, #001529 0%, #000c17 100%)',
          boxShadow: '4px 0 10px rgba(0,0,0,0.1)'
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: 20,
            letterSpacing: '0.5px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            marginBottom: 8
          }}
        >
          SpeakVN Educator
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          style={{ background: 'transparent', border: 'none' }}
          className="educator-sidebar-menu"
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', zIndex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingInline: 24,
              height: '100%',
            }}
          >
            <Title level={4} style={{ margin: 0, color: '#1a1a1a', fontWeight: 600 }}>
              Cổng Quản Trị Giáo Vụ
            </Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Giáo vụ</span>
                <span style={{ fontSize: 12, color: '#888' }}>Hệ thống SpeakVN</span>
              </div>
              <Avatar
                size="large"
                icon={<UserOutlined />}
                style={{ backgroundColor: '#1890ff', cursor: 'pointer', boxShadow: '0 2px 4px rgba(24,144,255,0.3)' }}
              />
            </div>
          </div>
        </Header>
        <Content style={{ margin: '16px' }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: '#fff',
              borderRadius: 8,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default EducatorLayout
