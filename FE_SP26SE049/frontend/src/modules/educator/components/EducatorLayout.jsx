import React from 'react'
import { Layout, Menu, Avatar, Typography } from 'antd'
import {
  DashboardOutlined,
  ReadOutlined,
  PartitionOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Link, Outlet, useLocation } from 'react-router-dom'

const { Header, Sider, Content } = Layout
const { Title } = Typography

const menuItems = [
  {
    key: '/educator',
    icon: <DashboardOutlined />,
    label: <Link to="/educator">Dashboard</Link>,
  },
  {
    key: '/educator/roadmap',
    icon: <ReadOutlined />,
    label: <Link to="/educator/roadmap">Curriculum Manager</Link>,
  },
  {
    key: '/educator/matrix',
    icon: <PartitionOutlined />,
    label: <Link to="/educator/matrix">Assessment Matrix</Link>,
  },
  {
    key: '/educator/analytics',
    icon: <BarChartOutlined />,
    label: <Link to="/educator/analytics">Student Analytics</Link>,
  },
  {
    key: '/educator/settings',
    icon: <SettingOutlined />,
    label: <Link to="/educator/settings">Settings</Link>,
  },
]

const EducatorLayout = () => {
  const location = useLocation()

  const selectedKey =
    menuItems.find((item) => location.pathname.startsWith(item.key))?.key ??
    '/educator'

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={250} theme="dark">
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 600,
            fontSize: 18,
          }}
        >
          SpeakVN Educator
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: '#fff' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingInline: 24,
              height: '100%',
            }}
          >
            <Title level={4} style={{ margin: 0 }}>
              SpeakVN Educator Portal
            </Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontWeight: 500 }}>Educator</span>
              <Avatar icon={<UserOutlined />} />
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

