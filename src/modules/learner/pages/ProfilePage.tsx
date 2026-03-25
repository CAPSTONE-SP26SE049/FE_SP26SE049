import { useEffect, useState } from 'react'
import { Card, Avatar, Typography, Button, Switch, Progress, Select, Modal, Form, Input, Divider, message } from 'antd'
import { UserOutlined, SettingOutlined, BellOutlined, TrophyOutlined, EditOutlined, PhoneOutlined, EnvironmentOutlined, CameraOutlined } from '@ant-design/icons'
import { Flame, Zap, Lock, Shield } from 'lucide-react'
import { useAuth } from '../../../core/auth/AuthContext'
import { motion } from 'framer-motion'
import { apiClient } from '../../../services/apiClient'

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

const BadgeItem = ({ imageUrl, icon: Icon, title, level, locked }: any) => (
    <div className={`flex flex-col items-center p-4 rounded-2xl border-2 ${locked ? 'bg-gray-50 border-gray-200 opacity-50' : 'bg-white border-yellow-400 shadow-sm'}`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 overflow-hidden ${locked ? 'bg-gray-200 text-gray-400' : 'bg-brand-yellow text-yellow-700'}`}>
            {imageUrl ? <img src={imageUrl} alt={title} className="w-full h-full object-cover" /> : (locked ? <Lock size={24} /> : (Icon ? <Icon size={32} /> : <TrophyOutlined style={{fontSize: 32}} />))}
        </div>
        <div className="font-bold text-gray-700 text-sm text-center">{title}</div>
        <div className="text-xs text-gray-400 font-bold uppercase mt-1">{level ? `Cấp độ ${level}` : 'Đã đạt'}</div>
    </div>
);

export default function ProfilePage() {
    const { session, updateSessionItem } = useAuth()
    const user = session?.user

    const regionName = getRegionLabel(user?.region)

    const [badges, setBadges] = useState<any[]>([]);
    const [progress, setProgress] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        const loadProfileData = async () => {
            try {
                setLoading(true);
                const [badgesRes, progressRes] = await Promise.all([
                    apiClient.get('/badges/my-badges').catch(() => ({ data: { data: [] } })),
                    apiClient.get('/users/me/progress').catch(() => ({ data: { data: { progressByRegion: {} } } }))
                ]);
                
                if (badgesRes.data?.data) {
                    setBadges(badgesRes.data.data);
                }
                if (progressRes.data?.data?.progressByRegion) {
                    setProgress(progressRes.data.data.progressByRegion);
                }
            } catch (error) {
                console.error("Failed to load profile data", error);
            } finally {
                setLoading(false);
            }
        };
        
        loadProfileData();
    }, []);

    const handleEdit = () => {
        form.setFieldsValue({
            fullName: user?.fullName,
            phone: user?.phone || user?.phoneNumber,
            region: user?.region,
            avatarUrl: user?.avatar,
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setSaving(true);
            
            await apiClient.patch('/users/me', {
                fullName: values.fullName,
                phone: values.phone,
                region: values.region,
                avatar: values.avatarUrl
            });

<<<<<<< HEAD
            updateSessionItem({
                fullName: values.fullName,
                phone: values.phone,
                region: values.region,
                avatar: values.avatarUrl
            });
=======
            if (updateSessionItem) {
                updateSessionItem({
                    fullName: values.fullName,
                    phone: values.phone,
                    region: values.region,
                    avatar: values.avatarUrl
                });
            }
>>>>>>> 4fd3e2f (feat: Add profile editing functionality with a modal, form, and API integration, replacing `updateSession` with `updateSessionItem`.)

            message.success('Cập nhật hồ sơ thành công!');
            setIsModalOpen(false);
        } catch (error: any) {
            console.error("Failed to update profile", error);
            message.error(error?.response?.data?.message || 'Không thể cập nhật hồ sơ');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full flex flex-col md:flex-row gap-8 pb-8 border-b border-gray-200 mb-8 pt-8"
            >
                <div className="relative inline-block mx-auto md:mx-0">
                    <Avatar
                        src={user?.avatar}
                        icon={!user?.avatar && <UserOutlined />}
                        size={120}
                        className="bg-brand-blue/10 text-brand-blue border-4 border-white shadow-xl"
                    />
                    <div className="absolute bottom-0 right-1 w-8 h-8 bg-brand-green rounded-full border-[3px] border-white flex justify-center items-center shadow-md">
                        <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                    </div>
                </div>
                
                <div className="flex-1 text-center md:text-left flex flex-col justify-center gap-1">
                    <div className="flex flex-col md:flex-row justify-between items-center md:items-start">
                        <div>
                            <Title level={2} style={{ margin: '0 0 4px', fontWeight: 800, color: '#4b4b4b' }}>
                                {user?.fullName || 'Người Học Ẩn Danh'}
                            </Title>
                            <Text className="text-gray-500 font-medium tracking-wide block">
                                Học viên SpeakVN • {regionName}
                            </Text>
                            <div className="text-gray-400 text-sm mt-1">
                                Tham gia từ {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'gần đây'}
                            </div>
                        </div>
                        <Button 
                            className="mt-4 md:mt-0 font-bold text-gray-500 hover:text-brand-blue rounded-xl border-gray-200 shadow-sm" 
                            icon={<SettingOutlined />}
                            onClick={handleEdit}
                        >
                            Cài đặt
                        </Button>
                    </div>

                    <div className="flex justify-center md:justify-start gap-8 md:gap-12 mt-6">
                        <div className="flex flex-col items-center md:items-start group">
                            <div className="flex items-center gap-2 text-gray-800 font-bold text-xl mb-1 group-hover:text-brand-orange transition-colors">
                                <Flame className="text-brand-orange" /> {user?.streak || 0}
                            </div>
                            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Chuỗi ngày</div>
                        </div>
                        <div className="flex flex-col items-center md:items-start group">
                            <div className="flex items-center gap-2 text-gray-800 font-bold text-xl mb-1 group-hover:text-brand-yellow transition-colors">
                                <Zap className="text-brand-yellow" /> {user?.totalXp || 0}
                            </div>
                            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tổng XP</div>
                        </div>
                        <div className="flex flex-col items-center md:items-start group">
                            <div className="flex items-center gap-2 text-gray-800 font-bold text-xl mb-1 group-hover:text-brand-blue transition-colors">
                                <Shield className="text-brand-blue" /> Đồng
                            </div>
                            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Hạng đấu</div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="flex flex-col lg:flex-row gap-8 mt-6 pt-2">
                {/* Cột trái: Thông tin tài khoản & Cài đặt (Sticky Sidebar) */}
                <div className="w-full md:w-1/3 space-y-6 md:sticky md:top-24 h-max">
                    {/* Cài đặt hệ thống */}
                    <Card className="rounded-3xl shadow-sm border-gray-100" bodyStyle={{ padding: '28px' }} title={<span className="font-extrabold text-lg text-gray-700">Cài đặt hệ thống</span>}>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-brand-blue text-sm">
                                        <BellOutlined />
                                    </div>
                                    <div className="font-bold text-gray-700 text-sm">Thông báo đẩy</div>
                                </div>
                                <Switch defaultChecked className="bg-brand-green" />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 text-sm">
                                        <SettingOutlined />
                                    </div>
                                    <div className="font-bold text-gray-700 text-sm">Hiệu ứng âm thanh</div>
                                </div>
                                <Switch defaultChecked className="bg-brand-green" />
                            </div>
                        </div>
                    </Card>

                    {/* Thông tin tài khoản */}
                    <Card className="rounded-3xl shadow-sm border-gray-100" bodyStyle={{ padding: '28px' }} title={<span className="font-extrabold text-lg text-gray-700">Thông tin tài khoản</span>}>
                        <div className="space-y-4">
                            <div>
                                <div className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-1">Email</div>
                                <div className="text-gray-900 font-semibold">{user?.email || 'Chưa cập nhật'}</div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Cột phải: Tiến trình & Thành tích (Scrollable) */}
                <div className="w-full md:w-2/3 space-y-8">
                    
                    {/* Tiến độ ngôn ngữ */}
                    <Card className="rounded-3xl shadow-sm border-gray-100 overflow-hidden" bodyStyle={{ padding: 0 }} title={<span className="font-extrabold text-lg text-gray-700 px-8 pt-6 pb-2 block border-b border-gray-50">Tiến độ ngôn ngữ</span>}>
                        <div className="max-h-[350px] overflow-y-auto px-8 py-6 custom-scrollbar">
                            <div className="space-y-6 pl-1 pr-3">
                                {Object.keys(progress).length > 0 ? Object.entries(progress).map(([region, percent], idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between mb-2">
                                            <span className={`font-bold tracking-wide ${idx % 2 === 0 ? 'text-brand-green' : (idx % 3 === 0 ? 'text-brand-orange' : 'text-brand-blue')}`}>{region.includes('Miền') || region.includes('miền') ? region : `Giọng ${region}`}</span>
                                            <span className="font-bold text-gray-400 text-sm">{percent}%</span>
                                        </div>
                                        <Progress percent={percent} strokeColor={idx % 2 === 0 ? "#58cc02" : (idx % 3 === 0 ? "#ff8c00" : "#3b82f6")} trailColor="#f3f4f6" showInfo={false} />
                                    </div>
                                )) : (
                                    <div className="text-gray-400 text-center py-4">{loading ? 'Đang tải...' : 'Chưa có thông tin tiến độ hệ thống.'}</div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Thành tích */}
                    <Card className="rounded-3xl shadow-sm border-gray-100 overflow-hidden" bodyStyle={{ padding: 0 }} title={
                        <div className="flex justify-between items-center px-8 pt-6 pb-2 border-b border-gray-50">
                            <span className="font-extrabold text-lg text-gray-700">Thành tích</span>
                            <Button type="text" className="text-gray-400 uppercase tracking-widest text-xs font-bold hover:text-gray-600">Xem tất cả</Button>
                        </div>
                    }>
                        <div className="max-h-[400px] overflow-y-auto px-8 py-6 custom-scrollbar">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pr-2">
                                {badges.length > 0 ? badges.map((b, idx) => (
                                    <BadgeItem key={b.id || idx} imageUrl={b.badge?.imageUrl || b.imageUrl} title={b.badge?.name || b.name || 'Huy hiệu'} locked={false} />
                                )) : (
                                    loading ? <div className="text-gray-400 col-span-3 text-center py-4">Đang tải...</div> : <div className="text-gray-400 col-span-3 text-center py-4">Bạn chưa nhận được danh hiệu nào. Hãy tiếp tục học nhé!</div>
                                )}
                            </div>
                        </div>
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
