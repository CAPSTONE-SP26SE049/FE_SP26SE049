import React, { useState } from 'react'
import { Card, Steps, Form, Input, Button, Select, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { registerAPI } from '../../services/mockAuthService'

const { Step } = Steps

const passwordRules = [
  { required: true, message: 'Password is required' },
  { min: 8, message: 'Password must be at least 8 characters' },
  { pattern: /[A-Z]/, message: 'Must contain at least 1 uppercase letter' },
  {
    pattern: /[!@#$%^&*(),.?":{}|<>]/,
    message: 'Must contain at least 1 special character',
  },
]

const steps = ['Account Info', 'Personal Info', 'Confirmation']

export default function Register() {
  const [current, setCurrent] = useState(0)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const next = async () => {
    try {
      let fields = []
      if (current === 0) {
        fields = ['email', 'password', 'confirmPassword']
      } else if (current === 1) {
        fields = ['fullName', 'phone', 'region']
      }
      await form.validateFields(fields)
      setCurrent(current + 1)
    } catch {
      // validation errors are already shown by antd
    }
  }

  const prev = () => {
    setCurrent(current - 1)
  }

  const onSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        phone: values.phone,
        region: values.region,
        // SECURITY: không gửi role, backend sẽ default là 'user'
      }

      setSubmitting(true)
      await registerAPI(payload)
      message.success('Register successfully, please login')
      navigate('/login', { replace: true })
    } catch (err) {
      if (err?.errorFields) {
        // antd validation error, ignore
        return
      }
      message.error(err?.message ?? 'Register failed')
    } finally {
      setSubmitting(false)
    }
  }

  const values = form.getFieldsValue(true)

  const renderStepContent = () => {
    if (current === 0) {
      return (
        <>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input placeholder="your@email.com" />
          </Form.Item>

          <Form.Item label="Password" name="password" rules={passwordRules}>
            <Input.Password placeholder="Strong password" />
          </Form.Item>

          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(
                    new Error('Passwords do not match'),
                  )
                },
              }),
            ]}
          >
            <Input.Password placeholder="Repeat password" />
          </Form.Item>
        </>
      )
    }

    if (current === 1) {
      return (
        <>
          <Form.Item
            label="Full Name"
            name="fullName"
            rules={[{ required: true, message: 'Full name is required' }]}
          >
            <Input placeholder="Your full name" />
          </Form.Item>

          <Form.Item
            label="Phone"
            name="phone"
            rules={[{ required: true, message: 'Phone is required' }]}
          >
            <Input placeholder="Phone number" />
          </Form.Item>

          <Form.Item
            label="Region / Location"
            name="region"
            rules={[{ required: true, message: 'Region is required' }]}
          >
            <Select
              placeholder="Select region"
              options={[
                { value: 'north', label: 'North' },
                { value: 'central', label: 'Central' },
                { value: 'south', label: 'South' },
              ]}
            />
          </Form.Item>
        </>
      )
    }

    return (
      <div>
        <p>Please review your information before submitting:</p>
        <ul>
          <li>
            <strong>Email:</strong> {values.email}
          </li>
          <li>
            <strong>Full Name:</strong> {values.fullName}
          </li>
          <li>
            <strong>Phone:</strong> {values.phone}
          </li>
          <li>
            <strong>Region:</strong> {values.region}
          </li>
        </ul>
      </div>
    )
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
        title="Register"
        style={{ width: 600, maxWidth: '100%' }}
        bordered={false}
      >
        <Steps current={current} style={{ marginBottom: 24 }}>
          {steps.map((title) => (
            <Step key={title} title={title} />
          ))}
        </Steps>

        <Form
          layout="vertical"
          form={form}
          initialValues={{ region: 'south' }}
        >
          {renderStepContent()}

          <div
            style={{
              marginTop: 24,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            {current > 0 && (
              <Button onClick={prev} style={{ marginRight: 8 }}>
                Previous
              </Button>
            )}
            {current < steps.length - 1 && (
              <Button type="primary" onClick={next}>
                Next
              </Button>
            )}
            {current === steps.length - 1 && (
              <Button
                type="primary"
                onClick={onSubmit}
                loading={submitting}
              >
                Submit
              </Button>
            )}
          </div>
        </Form>
      </Card>
    </div>
  )
}

