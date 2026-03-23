import { Card, Avatar, Typography, Divider, Button, Switch, Modal, Input, Select, Form, message, Upload } from 'antd'
import { UserOutlined, SettingOutlined, SafetyOutlined, BellOutlined, EditOutlined, CameraOutlined, PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { useAuth } from '../../../core/auth/AuthContext'
import { updateProfileAPI } from '../../../services/userService'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

const { Title, Text } = Typography
const { Option } = Select

const regionOptions = [
    { value: 'north', label: 'Miền Bắc' },
    { value: 'central', label: 'Miền Trung' },
    { value: 'south', label: 'Miền Nam' },
]

const getRegionLabel = (region: string | undefined) => {
    if (!region) return 'Mặc định'
    const found = regionOptions.find(r => r.value === region.toLowerCase() || r.value === region)
    return found ? found.label : region
}

export default function ProfilePage() {
    const { session, updateSession } = useAuth()
    const user = session?.user

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form] = Form.useForm()

    const openEditModal = () => {
        form.setFieldsValue({
            fullName: user?.fullName || '',
            phone: user?.phone || user?.phoneNumber || '',
            region: user?.region || 'south',
            avatarUrl: user?.avatar || '',
        })
        setIsModalOpen(true)
    }

    const handleSave = async () => {
        try {
            const values = await form.validateFields()
            setSaving(true)

            const payload: any = {}
            if (values.fullName !== undefined && values.fullName !== user?.fullName) {
                payload.fullName = values.fullName
            }
            if (values.phone !== undefined && values.phone !== (user?.phone || user?.phoneNumber)) {
                payload.phone = values.phone
            }
            if (values.region !== undefined && values.region !== user?.region) {
                payload.region = values.region
            }
            if (values.avatarUrl !== undefined && values.avatarUrl !== user?.avatar) {
                payload.avatarUrl = values.avatarUrl
            }

            if (Object.keys(payload).length === 0) {
                message.info('Không có thay đổi nào.')
                setSaving(false)
                return
            }

            const response: any = await updateProfileAPI(payload)
            const updatedData = response?.data || response

            // Update local session with the returned profile data
            updateSession({
                fullName: updatedData.fullName ?? values.fullName,
                phone: updatedData.phone ?? values.phone,
                region: updatedData.region ?? values.region,
                avatar: updatedData.avatar ?? values.avatarUrl,
            })

            message.success('Cập nhật hồ sơ thành công! 🎉')
            setIsModalOpen(false)
        } catch (error: any) {
            console.error('Update profile error:', error)
            if (error?.errorFields) {
                // Form validation error, let antd handle
                return
            }
            message.error(error?.message || 'Cập nhật thất bại. Vui lòng thử lại.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full text-center py-10"
            >
                <div className="relative inline-block">
                    <Avatar
                        src={user?.avatar}
                        icon={!user?.avatar && <UserOutlined />}
                        size={120}
                        className="bg-brand-blue/10 text-brand-blue border-4 border-white shadow-xl"
                    />
                    <div className="absolute bottom-0 right-0 w-8 h-8 bg-brand-green rounded-full border-[3px] border-white flex justify-center items-center shadow-md">
                        <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                    </div>
                </div>
                <Title level={2} style={{ margin: '16px 0 4px', fontWeight: 800, color: '#4b4b4b' }}>
                    {user?.fullName || 'Người Học Ẩn Danh'}
                </Title>
                <Text className="text-gray-500 font-medium tracking-wide">
                    Học viên SpeakVN • {getRegionLabel(user?.region)}
                </Text>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
                <div className="md:col-span-2 space-y-8">
                    {/* Account Information Section */}
                    <Card className="rounded-3xl shadow-sm border-gray-100" bodyStyle={{ padding: '32px' }} title={<span className="font-extrabold text-lg text-gray-700">Thông tin tài khoản</span>}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                            <div>
                                <div className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-1">Email</div>
                                <div className="text-gray-900 font-semibold">{user?.email || 'Chưa cập nhật'}</div>
                            </div>
                            <div>
                                <div className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-1">Khu Vực Học</div>
                                <div className="text-gray-900 font-semibold capitalize bg-gray-100 px-3 py-1 rounded-lg inline-block">
                                    {getRegionLabel(user?.region)}
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-1">Số Điện Thoại</div>
                                <div className="text-gray-900 font-semibold">
                                    {user?.phone || user?.phoneNumber || 'Chưa cập nhật'}
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-1">Loại Tài Khoản</div>
                                <div className="text-brand-blue font-bold tracking-wider inline-flex items-center gap-2">
                                    <SafetyOutlined />
                                    {user?.role || 'Học Viên'}
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-1">Ngày tham gia</div>
                                <div className="text-gray-900 font-semibold">
                                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Đang cập nhật'}
                                </div>
                            </div>
                        </div>
                        <Divider className="my-6 border-gray-100" />
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={openEditModal}
                            className="h-12 px-8 rounded-xl font-bold bg-brand-blue border-none shadow-md shadow-blue-100 hover:bg-blue-600 transition-transform hover:-translate-y-0.5"
                        >
                            Chỉnh Sửa Hồ Sơ
                        </Button>
                    </Card>

                    {/* Settings Section */}
                    <Card className="rounded-3xl shadow-sm border-gray-100" bodyStyle={{ padding: '32px' }} title={<span className="font-extrabold text-lg text-gray-700">Cài đặt hệ thống</span>}>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-brand-blue text-lg"><BellOutlined /></div>
                                    <div>
                                        <div className="font-bold text-gray-800">Thông báo đẩy (Push)</div>
                                        <div className="text-sm text-gray-500">Nhắc nhở học tập hàng ngày</div>
                                    </div>
                                </div>
                                <Switch defaultChecked className="bg-brand-green" />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 text-lg"><SettingOutlined /></div>
                                    <div>
                                        <div className="font-bold text-gray-800">Hiệu ứng âm thanh</div>
                                        <div className="text-sm text-gray-500">Phát âm thanh khi làm đúng/sai</div>
                                    </div>
                                </div>
                                <Switch defaultChecked className="bg-brand-green" />
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="rounded-3xl shadow-sm border-gray-100 text-center" bodyStyle={{ padding: '32px' }}>
                        <div className="w-16 h-16 mx-auto bg-brand-yellow/10 rounded-2xl flex items-center justify-center mb-4">
                            <span className="text-3xl font-extrabold text-brand-yellow text-center block" style={{ marginTop: '-4px' }}>⚡</span>
                        </div>
                        <Title level={4} style={{ fontWeight: 800, margin: 0, color: '#ffc800' }}>Gói Premium</Title>
                        <p className="text-gray-500 text-sm mt-2 mb-6 font-medium">
                            Học không giới hạn trọn bộ 3 miền và chấm điểm phát âm bằng AI chuyên sâu.
                        </p>
                        <Button className="w-full h-12 rounded-xl border-2 border-brand-yellow text-brand-yellow font-bold hover:bg-yellow-50 hover:border-yellow-500 hover:text-yellow-600">
                            Nâng Cấp Ngay
                        </Button>
                    </Card>
                </div>
            </div>

            {/* Edit Profile Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-3 pb-2">
                        <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center">
                            <EditOutlined className="text-brand-blue text-lg" />
                        </div>
                        <div>
                            <div className="font-extrabold text-gray-800 text-lg">Chỉnh Sửa Hồ Sơ</div>
                            <div className="text-xs text-gray-400 font-medium">Cập nhật thông tin cá nhân của bạn</div>
                        </div>
                    </div>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                centered
                width={520}
                className="profile-edit-modal"
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    className="mt-4"
                    requiredMark={false}
                >
                    {/* Avatar Preview */}
                    <div className="text-center mb-6">
                        <div className="relative inline-block">
                            <Avatar
                                src={form.getFieldValue('avatarUrl') || user?.avatar}
                                icon={<UserOutlined />}
                                size={96}
                                className="bg-brand-blue/10 text-brand-blue border-4 border-gray-100 shadow-lg"
                            />
                        </div>
                    </div>

                    <Form.Item
                        name="fullName"
                        label={<span className="font-bold text-gray-600">Họ và Tên</span>}
                        rules={[
                            { required: true, message: 'Vui lòng nhập họ và tên' },
                            { min: 2, message: 'Họ tên phải có ít nhất 2 ký tự' },
                            { max: 100, message: 'Họ tên không được quá 100 ký tự' },
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined className="text-gray-400" />}
                            placeholder="Nhập họ và tên"
                            className="h-12 rounded-xl"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        name="phone"
                        label={<span className="font-bold text-gray-600">Số Điện Thoại</span>}
                        rules={[
                            {
                                pattern: /^(0|\+84)[0-9]{9,10}$/,
                                message: 'Số điện thoại không hợp lệ (VD: 0912345678)',
                            },
                        ]}
                    >
                        <Input
                            prefix={<PhoneOutlined className="text-gray-400" />}
                            placeholder="Nhập số điện thoại"
                            className="h-12 rounded-xl"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        name="region"
                        label={<span className="font-bold text-gray-600">Khu Vực Học</span>}
                        rules={[{ required: true, message: 'Vui lòng chọn khu vực' }]}
                    >
                        <Select
                            placeholder="Chọn khu vực"
                            className="h-12 rounded-xl"
                            size="large"
                            suffixIcon={<EnvironmentOutlined className="text-gray-400" />}
                        >
                            {regionOptions.map(opt => (
                                <Option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="avatarUrl"
                        label={<span className="font-bold text-gray-600">Link Ảnh Đại Diện</span>}
                        rules={[
                            {
                                type: 'url',
                                message: 'Vui lòng nhập đường dẫn hợp lệ (https://...)',
                            },
                        ]}
                    >
                        <Input
                            prefix={<CameraOutlined className="text-gray-400" />}
                            placeholder="https://example.com/avatar.jpg"
                            className="h-12 rounded-xl"
                            size="large"
                        />
                    </Form.Item>

                    <Divider className="my-4 border-gray-100" />

                    <div className="flex gap-3 justify-end">
                        <Button
                            onClick={() => setIsModalOpen(false)}
                            className="h-12 px-6 rounded-xl font-bold"
                            size="large"
                        >
                            Hủy
                        </Button>
                        <Button
                            type="primary"
                            loading={saving}
                            onClick={handleSave}
                            className="h-12 px-8 rounded-xl font-bold bg-brand-blue border-none shadow-md shadow-blue-100 hover:bg-blue-600"
                            size="large"
                        >
                            {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    )
}
