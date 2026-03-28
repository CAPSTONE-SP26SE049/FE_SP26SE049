import React, { useState } from 'react'
import { Card, Tabs, Form, Input, Button, Upload, message, Divider, Typography } from 'antd'
import {
    UserOutlined,
    LockOutlined,
    UploadOutlined,
    SaveOutlined,
    MailOutlined,
    PhoneOutlined,
    SettingOutlined
} from '@ant-design/icons'
import { useAuth } from '../../../core/auth/AuthContext'
import { updateProfileAPI, changePasswordAPI } from '../../../services/userService'

const { Title, Text } = Typography

const AdminSettingsPage: React.FC = () => {
    const { session } = useAuth()
    const user = session?.user as any || {}

    const [profileForm] = Form.useForm()
    const [passwordForm] = Form.useForm()

    const [savingProfile, setSavingProfile] = useState(false)
    const [savingPassword, setSavingPassword] = useState(false)

    React.useEffect(() => {
        profileForm.setFieldsValue({
            fullName: user.fullName || user.name || '',
            email: user.email || '',
            phoneNumber: user.phoneNumber || user.phone || ''
        })
    }, [user, profileForm])

    const handleUpdateProfile = async (values: any) => {
        try {
            setSavingProfile(true)
            await updateProfileAPI(values)
            message.success('Cập nhật hồ sơ thành công')
        } catch (error: any) {
            message.error(error.message || 'Cập nhật hồ sơ thất bại')
        } finally {
            setSavingProfile(false)
        }
    }

    const handleChangePassword = async (values: any) => {
        try {
            setSavingPassword(true)
            await changePasswordAPI({ oldPassword: values.oldPassword, newPassword: values.newPassword })
            message.success('Đổi mật khẩu thành công')
            passwordForm.resetFields()
        } catch (error: any) {
            message.error(error.message || 'Đổi mật khẩu thất bại')
        } finally {
            setSavingPassword(false)
        }
    }

    const items = [
        {
            key: '1',
            label: (
                <span>
                    <UserOutlined /> Hồ sơ cá nhân
                </span>
            ),
            children: (
                <div className="max-w-2xl py-6">
                    <Title level={4} style={{ marginBottom: 24 }}>Thông tin chung</Title>
                    <div className="flex gap-8 mb-8 flex-wrap">
                        <div className="flex flex-col items-center">
                            <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center mb-4 overflow-hidden">
                                {user.avatar || user.avatarUrl ? (
                                    <img src={user.avatar || user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <UserOutlined className="text-3xl text-gray-400" />
                                )}
                            </div>
                            <Upload showUploadList={false}>
                                <Button icon={<UploadOutlined />}>Đổi ảnh đại diện</Button>
                            </Upload>
                        </div>

                        <div className="flex-1 min-w-[280px]">
                            <Form form={profileForm} layout="vertical" onFinish={handleUpdateProfile} requiredMark={false}>
                                <Form.Item name="fullName" label={<span className="font-medium">Họ và tên</span>} rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}>
                                    <Input size="large" prefix={<UserOutlined className="text-gray-400" />} />
                                </Form.Item>

                                <Form.Item name="email" label={<span className="font-medium">Email</span>}>
                                    <Input size="large" disabled prefix={<MailOutlined className="text-gray-400" />} />
                                </Form.Item>

                                <Form.Item name="phoneNumber" label={<span className="font-medium">Số điện thoại</span>}>
                                    <Input size="large" prefix={<PhoneOutlined className="text-gray-400" />} />
                                </Form.Item>

                                <Divider />

                                <Form.Item>
                                    <Button type="primary" htmlType="submit" size="large" loading={savingProfile} icon={<SaveOutlined />} style={{ borderRadius: 10, height: 48, fontWeight: 600, border: 'none', background: 'linear-gradient(90deg, #1890ff, #0076e4)', color: 'white', boxShadow: '0 4px 12px rgba(24,144,255,0.25)', paddingInline: 32 }}>
                                        Lưu thay đổi
                                    </Button>
                                </Form.Item>
                            </Form>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: '2',
            label: (
                <span>
                    <LockOutlined /> Bảo mật
                </span>
            ),
            children: (
                <div className="max-w-md py-6">
                    <Title level={4} style={{ marginBottom: 8 }}>Đổi mật khẩu</Title>
                    <Text type="secondary" className="block mb-6">
                        Sử dụng mật khẩu mạnh bao gồm chữ cái, số và ký tự đặc biệt để bảo vệ tài khoản của bạn.
                    </Text>

                    <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword} requiredMark={false}>
                        <Form.Item name="oldPassword" label={<span className="font-medium">Mật khẩu hiện tại</span>} rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}>
                            <Input.Password size="large" />
                        </Form.Item>

                        <Form.Item
                            name="newPassword"
                            label={<span className="font-medium">Mật khẩu mới</span>}
                            rules={[
                                { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                                { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' }
                            ]}
                        >
                            <Input.Password size="large" />
                        </Form.Item>

                        <Form.Item
                            name="confirmPassword"
                            label={<span className="font-medium">Xác nhận mật khẩu mới</span>}
                            dependencies={['newPassword']}
                            rules={[
                                { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('newPassword') === value) {
                                            return Promise.resolve()
                                        }
                                        return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'))
                                    },
                                }),
                            ]}
                        >
                            <Input.Password size="large" />
                        </Form.Item>

                        <Form.Item className="mt-8">
                            <Button type="primary" htmlType="submit" size="large" loading={savingPassword} icon={<LockOutlined />} style={{ borderRadius: 10, height: 48, fontWeight: 600, border: 'none', background: 'linear-gradient(90deg, #1890ff, #0076e4)', color: 'white', boxShadow: '0 4px 12px rgba(24,144,255,0.25)', paddingInline: 32 }}>
                                Cập nhật mật khẩu
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            ),
        },
    ]

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: '#e6f7ff', padding: 10, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SettingOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                </div>
                <div>
                    <Title level={2} style={{ margin: 0, fontSize: 24 }}>Cài đặt hệ thống</Title>
                    <Text type="secondary">Quản lý tài khoản cá nhân và các tuỳ chọn bảo mật</Text>
                </div>
            </div>

            <Card style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }} bodyStyle={{ paddingTop: 0 }}>
                <Tabs defaultActiveKey="1" items={items} size="large" />
            </Card>
        </div>
    )
}

export default AdminSettingsPage
