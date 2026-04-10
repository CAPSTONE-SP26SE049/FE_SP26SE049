import React, { useEffect, useState, useMemo } from 'react';
import { message, Input, Button, Skeleton, Select, Tag, Upload, Form, Popconfirm, Modal, Pagination } from 'antd';
import {
    PlusOutlined, SearchOutlined, TrophyOutlined, EditOutlined,
    LayoutOutlined, DeleteOutlined, StopOutlined, LoadingOutlined,
    CheckCircleOutlined, FilterOutlined, AppstoreOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { adminService } from '../services/adminService';
import { uploadToCloudinary } from '../../../services/cloudinaryService';

const PURPLE_BTN = {
    background: 'linear-gradient(135deg, #9333ea, #7e22ce)',
    border: 'none',
    boxShadow: '0 4px 14px rgba(147,51,234,0.3)',
    color: '#fff',
    fontWeight: 700,
    borderRadius: 12,
    height: 42,
}

// SpeakVN brand orange
const BRAND_ORANGE = '#f97316'

const AchievementManagementPage: React.FC = () => {
    const [achievements, setAchievements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAchievement, setEditingAchievement] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [iconPreview, setIconPreview] = useState<string>('');
    const [form] = Form.useForm();

    const fetchAchievements = async () => {
        setLoading(true);
        try {
            const response: any = await adminService.getBadgesForAdmin();
            const data = response?.data || (Array.isArray(response) ? response : []);
            setAchievements(data);
        } catch (error: any) {
            message.error('Không thể tải danh sách thành tựu');
        } finally { setLoading(false); }
    };

    const handleDelete = async (id: string) => {
        try {
            await adminService.deleteReward(id);
            message.success('Xóa thành tựu thành công');
            fetchAchievements();
        } catch (error: any) {
            message.error('Không thể xóa thành tựu');
        }
    };

    const handleOpenModal = (ac: any = null) => {
        setEditingAchievement(ac);
        if (ac) { form.setFieldsValue({ ...ac }); setIconPreview(ac.iconUrl || ''); }
        else { form.resetFields(); form.setFieldsValue({ code: 'ACH_' + Math.random().toString(36).substring(2, 10).toUpperCase() }); setIconPreview(''); }
        setIsModalOpen(true);
    };

    const handleUploadIcon = async (options: any) => {
        const { file, onSuccess, onError } = options;
        try {
            setIsUploading(true);
            const url = await uploadToCloudinary(file, 'image');
            setIconPreview(url); form.setFieldsValue({ iconUrl: url });
            message.success('Upload ảnh thành công!'); onSuccess("ok");
        } catch (e: any) { message.error('Upload thất bại'); onError(e); }
        finally { setIsUploading(false); }
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            const payload = { ...values, isActive: values.isActive ?? editingAchievement?.isActive ?? true };
            if (editingAchievement) { await adminService.updateReward(editingAchievement.id, payload); message.success('Cập nhật thành công'); }
            else { await adminService.createReward(payload); message.success('Thêm thành tựu thành công'); }
            setIsModalOpen(false); fetchAchievements();
        } catch (e: any) {
            if (e?.errorFields) return;
            message.error('Không thể lưu thành tựu');
        } finally { setSubmitting(false); }
    };

    useEffect(() => { fetchAchievements(); }, []);

    const filteredData = useMemo(() => {
        let data = [...achievements];
        if (searchText.trim()) {
            const lower = searchText.trim().toLowerCase();
            data = data.filter(item => (item.name || '').toLowerCase().includes(lower) || (item.code || '').toLowerCase().includes(lower));
        }
        if (statusFilter === 'assigned') data = data.filter(item => !!item.linkedQuizName);
        else if (statusFilter === 'unassigned') data = data.filter(item => !item.linkedQuizName);
        return data;
    }, [achievements, searchText, statusFilter]);

    // Reset pagination when filters change
    useEffect(() => { setCurrentPage(1); }, [searchText, statusFilter]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, currentPage, pageSize]);

    const assigned = achievements.filter(a => !!a.linkedQuizName).length;
    const unassigned = achievements.length - assigned;

    return (
        <div className="flex flex-col overflow-hidden rounded-2xl" style={{ height: 'calc(100vh - 110px)', background: 'linear-gradient(160deg, #faf5ff 0%, #f8faff 50%, #fff7f0 100%)' }}>

            {/* ━━━ TOP HERO ━━━ */}
            <div className="relative flex-shrink-0 px-6 py-5 overflow-hidden"
                style={{ background: `linear-gradient(135deg, #6d28d9 0%, #9333ea 55%, ${BRAND_ORANGE} 100%)`, borderRadius: '0 0 28px 28px' }}>
                {/* Dots decoration */}
                {[...Array(10)].map((_, i) => (
                    <motion.div key={i} className="absolute rounded-full bg-white/30"
                        style={{ width: 4 + (i % 4), height: 4 + (i % 4), left: `${(i * 10) % 100}%`, top: `${10 + (i * 22) % 80}%` }}
                        animate={{ y: [-3, 3, -3], opacity: [0.2, 0.6, 0.2] }}
                        transition={{ duration: 2 + i * 0.3, repeat: Infinity }} />
                ))}

                <div className="relative flex items-end justify-between">
                    <div>
                        <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Thống kê chung</p>
                        <h1 className="text-white text-xl md:text-2xl font-black">Tổng quan hệ thống</h1>
                        <p className="text-white/60 text-sm mt-1 font-medium">Theo dõi số lượng và trạng thái gán của các huy hiệu</p>
                    </div>
                    <Button icon={<PlusOutlined />} onClick={() => handleOpenModal()}
                        className="h-11 px-6 rounded-2xl font-black text-sm flex-shrink-0"
                        style={{ ...PURPLE_BTN, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                        Thêm thành tựu
                    </Button>
                </div>

                {/* Stats inside hero */}
                <div className="grid grid-cols-3 gap-3 mt-4 relative">
                    {[
                        { icon: '🏆', val: achievements.length, label: 'Tổng thành tựu', color: '#fbbf24' },
                        { icon: '✅', val: assigned, label: 'Đã gán Quiz', color: '#34d399' },
                        { icon: '⏳', val: unassigned, label: 'Chưa gán', color: '#fb923c' },
                    ].map(({ icon, val, label, color }, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                            className="flex items-center gap-3 rounded-2xl px-4 py-3"
                            style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)' }}>
                            <span className="text-2xl">{icon}</span>
                            <div>
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.1, type: 'spring' }}
                                    className="text-2xl font-black" style={{ color }}>{loading ? '…' : val}</motion.div>
                                <div className="text-white/60 text-xs font-bold">{label}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* ━━━ FILTER BAR ━━━ */}
            <div className="flex items-center gap-3 px-6 py-4 flex-shrink-0">
                <Input
                    prefix={<SearchOutlined className="text-gray-300" />}
                    placeholder="Tìm kiếm thành tựu, mã code..."
                    value={searchText} onChange={e => setSearchText(e.target.value)} allowClear
                    className="rounded-2xl h-10 border-gray-200 bg-white flex-1 max-w-xs"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                />
                <Select value={statusFilter || undefined} onChange={v => setStatusFilter(v || '')}
                    placeholder={<span className="flex items-center gap-1"><FilterOutlined />Trạng thái</span>}
                    allowClear className="h-10 w-44 rounded-2xl"
                    options={[
                        { label: '📋 Tất cả', value: '' },
                        { label: '✅ Đã gán', value: 'assigned' },
                        { label: '⏳ Chưa gán', value: 'unassigned' },
                    ]}
                />
                <span className="ml-auto text-sm text-gray-400 font-bold">
                    <AppstoreOutlined className="text-gray-300 mr-1" />{filteredData.length} / {achievements.length} thành tựu
                </span>
            </div>

            {/* ━━━ CARD GRID ━━━ */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
                                <Skeleton.Avatar size={64} shape="square" active className="rounded-2xl mb-3" />
                                <Skeleton active paragraph={{ rows: 1 }} title={false} />
                            </div>
                        ))}
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                        <div className="text-7xl mb-5 opacity-30">🏆</div>
                        <p className="font-black text-gray-400 text-lg">Không tìm thấy thành tựu</p>
                        <p className="text-gray-300 text-sm mt-2">Thử tìm với từ khóa khác hoặc thêm mới</p>
                        <Button icon={<PlusOutlined />} onClick={() => handleOpenModal()} className="mt-5 h-10 rounded-2xl font-bold"
                            style={{ ...PURPLE_BTN, height: 40 }}>
                            Thêm thành tựu đầu tiên
                        </Button>
                    </div>
                ) : (
                    <LayoutGroup>
                        <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            <AnimatePresence mode="popLayout">
                                {paginatedData.map((item, idx) => (
                                    <motion.div key={item.id} layout
                                        initial={{ opacity: 0, scale: 0.85, y: 16 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.85 }}
                                        transition={{ duration: 0.25, delay: (idx % pageSize) * 0.03 }}
                                        whileHover={{ y: -6, scale: 1.02 }}
                                        className="group relative bg-white rounded-3xl border border-gray-100 overflow-hidden cursor-default"
                                        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)', transition: 'box-shadow 0.3s' }}
                                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 12px 40px rgba(147,51,234,0.15)')}
                                        onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)')}
                                    >
                                        {/* Status dot */}
                                        <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow ${item.linkedQuizName ? 'bg-green-400' : 'bg-gray-200'}`}>
                                            {item.linkedQuizName
                                                ? <CheckCircleOutlined style={{ color: '#fff', fontSize: 10 }} />
                                                : <StopOutlined style={{ color: '#94a3b8', fontSize: 10 }} />
                                            }
                                        </div>

                                        {/* Icon area */}
                                        <div className="relative p-5 pb-3 flex justify-center"
                                            style={{ background: 'linear-gradient(135deg, #fef9f0 0%, #fff5e6 50%, #fef3c7 100%)' }}>
                                            {/* Glow on hover */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/0 to-orange-200/0 group-hover:from-yellow-200/20 group-hover:to-orange-200/20 transition-all duration-500" />
                                            {item.iconUrl ? (
                                                <motion.img src={item.iconUrl} alt={item.name}
                                                    className="w-16 h-16 object-contain relative z-10"
                                                    animate={{ rotate: 0 }}
                                                    whileHover={{ rotate: [0, -8, 8, -4, 0], transition: { duration: 0.5 } }}
                                                />
                                            ) : (
                                                <TrophyOutlined className="text-5xl text-yellow-200 relative z-10" />
                                            )}
                                        </div>

                                        {/* Body */}
                                        <div className="px-4 py-3">
                                            <p className="font-black text-gray-800 text-sm leading-tight truncate">{item.name}</p>

                                            {item.linkedQuizName ? (
                                                <div className="flex items-center gap-1 mt-1.5">
                                                    <LayoutOutlined style={{ color: '#9333ea', fontSize: 10 }} />
                                                    <span className="text-[10px] font-bold text-purple-600 truncate">{item.linkedQuizName}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-gray-300 font-semibold mt-1.5 block">Chưa gán quiz</span>
                                            )}
                                        </div>

                                        {/* Action strip */}
                                        <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                                            <motion.button whileTap={{ scale: 0.95 }}
                                                onClick={() => handleOpenModal(item)}
                                                className="flex items-center justify-center gap-1 h-8 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 text-xs font-black hover:bg-amber-100 transition-colors">
                                                <EditOutlined style={{ fontSize: 11 }} /> Sửa
                                            </motion.button>
                                            <Popconfirm title="Xóa thành tựu này?" onConfirm={() => handleDelete(item.id)}
                                                okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
                                                <motion.button whileTap={{ scale: 0.95 }}
                                                    className="flex items-center justify-center gap-1 h-8 rounded-xl bg-red-50 border border-red-100 text-red-500 text-xs font-black hover:bg-red-100 transition-colors">
                                                    <DeleteOutlined style={{ fontSize: 11 }} /> Xóa
                                                </motion.button>
                                            </Popconfirm>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    </LayoutGroup>
                )}

                {/* ━━━ PAGINATION ━━━ */}
                {!loading && filteredData.length > 0 && (
                    <div className="mt-8 flex justify-center pb-4">
                        <Pagination
                            current={currentPage}
                            pageSize={pageSize}
                            total={filteredData.length}
                            onChange={(page, size) => { setCurrentPage(page); setPageSize(size); }}
                            showSizeChanger
                            pageSizeOptions={['10', '20', '50', '100']}
                            showTotal={(total, range) => `${range[0]}-${range[1]} của ${total} thành tựu`}
                        />
                    </div>
                )}
            </div>

            {/* ━━━ MODAL ━━━ */}
            <Modal
                title={
                    <div className="flex items-center gap-3 pb-1">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl"
                            style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}>
                            {editingAchievement?.iconUrl
                                ? <img src={editingAchievement.iconUrl} className="w-7 h-7 object-contain" />
                                : '🏆'}
                        </div>
                        <div>
                            <div className="font-extrabold text-gray-800 text-base">
                                {editingAchievement ? 'Chỉnh sửa thành tựu' : 'Thêm thành tựu mới'}
                            </div>
                            <div className="text-xs text-gray-400 font-medium">
                                {editingAchievement ? `Đang sửa: ${editingAchievement.name}` : 'Tạo huy hiệu mới cho học viên'}
                            </div>
                        </div>
                    </div>
                }
                open={isModalOpen} onOk={handleSave} onCancel={() => { setIsModalOpen(false); setIconPreview('') }}
                confirmLoading={submitting}
                okText={editingAchievement ? '💾 Cập nhật' : '✨ Tạo mới'}
                okButtonProps={{ style: { ...PURPLE_BTN, boxShadow: '0 4px 12px rgba(147,51,234,0.25)', paddingInline: 28 } }}
                cancelText="Hủy"
                cancelButtonProps={{ style: { borderRadius: 12, height: 42, fontWeight: 600 } }}
                width={560} centered
            >
                <Form form={form} layout="vertical" className="mt-4">
                    <Form.Item name="code" hidden><Input /></Form.Item>

                    <Form.Item name="name" label={<span className="font-bold text-gray-600">Tên thành tựu</span>}
                        rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên!' }, { max: 30, message: 'Tối đa 30 ký tự' }]}>
                        <Input placeholder="Vd: Học giả chuyên cần 📚"
                            className="h-12 rounded-2xl" style={{ fontSize: 14 }} />
                    </Form.Item>

                    <Form.Item name="iconUrl" label={<span className="font-bold text-gray-600">Hình ảnh huy hiệu</span>}
                        rules={[{ required: true, message: 'Vui lòng tải lên icon huy hiệu' }]}>
                        <div className="flex items-center gap-5">
                            <Upload name="file" listType="picture-card" showUploadList={false}
                                customRequest={handleUploadIcon} accept="image/*"
                                style={{ borderRadius: 16 }}>
                                {iconPreview ? (
                                    <div className="relative w-full h-full rounded-xl overflow-hidden">
                                        <img src={iconPreview} className="w-full h-full object-contain" />
                                        {isUploading && (
                                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                                <LoadingOutlined className="text-purple-600 text-xl" />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-1">
                                        {isUploading ? <LoadingOutlined className="text-purple-600 text-xl" /> : <PlusOutlined className="text-gray-400 text-xl" />}
                                        <span className="text-xs text-gray-400 font-bold">Tải lên</span>
                                    </div>
                                )}
                            </Upload>
                            <div className="flex-1">
                                <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
                                    <p className="text-sm font-bold text-gray-600 mb-0.5">Hướng dẫn upload</p>
                                    <p className="text-xs text-gray-400">Ảnh PNG/SVG trong suốt, 128×128px</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Sẽ được upload lên Cloudinary CDN</p>
                                </div>
                                {iconPreview && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <CheckCircleOutlined className="text-green-500 text-xs" />
                                        <span className="text-xs text-green-600 font-bold">Đã upload thành công!</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Form.Item>

                    {editingAchievement?.linkedQuizName && (
                        <div className="rounded-2xl border border-purple-100 overflow-hidden">
                            <div className="bg-purple-50 px-4 py-2 border-b border-purple-100">
                                <span className="text-[10px] font-black text-purple-500 uppercase tracking-wider">Đang gán cho quiz</span>
                            </div>
                            <div className="p-3 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                                    <LayoutOutlined style={{ color: '#9333ea' }} />
                                </div>
                                <div>
                                    <p className="font-black text-gray-800 text-sm">{editingAchievement.linkedQuizName}</p>
                                    <Tag color="purple" className="mt-0.5">{editingAchievement.linkedLevelName}</Tag>
                                </div>
                            </div>
                            <div className="px-4 pb-3">
                                <p className="text-xs text-amber-600 font-medium">⚠️ Để thay đổi gán, vào Quản lý Chapter/Quiz để thiết lập lại.</p>
                            </div>
                        </div>
                    )}
                </Form>
            </Modal>
        </div>
    );
};

export default AchievementManagementPage;
