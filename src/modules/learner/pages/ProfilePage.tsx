import { Card, Avatar, Typography, Divider, Button, Switch } from 'antd'
import { UserOutlined, SettingOutlined, SafetyOutlined, BellOutlined } from '@ant-design/icons'
import { useAuth } from '../../../core/auth/AuthContext'
import { motion } from 'framer-motion'

const { Title, Text } = Typography

export default function ProfilePage() {
    const { session } = useAuth()
    const user = session?.user

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
                    Học viên SpeakVN • {user?.region === 'north' ? 'Miền Bắc' : user?.region === 'central' ? 'Miền Trung' : 'Miền Nam'}
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
                                    Gói {user?.region || 'Mặc định'}
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
                        <Button type="primary" className="h-12 px-8 rounded-xl font-bold bg-brand-blue border-none shadow-md shadow-blue-100 hover:bg-blue-600 transition-transform hover:-translate-y-0.5">
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
        </div>
    )
}
