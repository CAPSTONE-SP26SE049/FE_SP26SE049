import React, { useState } from 'react'
import { Card, Form, Input, Button, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../core/auth/AuthContext'

const passwordRules = [
  { required: true, message: 'Password is required' },
  { min: 8, message: 'Password must be at least 8 characters' },
  { pattern: /[A-Z]/, message: 'Must contain at least 1 uppercase letter' },
  {
    pattern: /[!@#$%^&*(),.?":{}|<>]/,
    message: 'Must contain at least 1 special character',
  },
]

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values) => {
    setLoading(true)
    try {
      // Dùng AuthContext.login để gọi API, decode JWT và lưu session + sessionStorage
      const session = await login(values.email, values.password)

      if (session.user.role === 'admin') {
        navigate('/admin', { replace: true })
      } else if (session.user.role === 'educator') {
        navigate('/educator', { replace: true })
      } else if (session.user.role === 'user') {
        navigate('/', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch (err) {
      message.error(err?.message ?? 'Invalid login credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
        padding: 24,
      }}
    >
      <Card
        title="Login"
        style={{ width: 420, maxWidth: '100%' }}
        bordered={false}
      >
        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input placeholder="admin@speakvn.com" />
          </Form.Item>

          <Form.Item label="Password" name="password" rules={passwordRules}>
            <Input.Password placeholder="Password@1" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
          >
            Sign in
          </Button>
        </Form>
      </Card>
    </div>
  )
}

