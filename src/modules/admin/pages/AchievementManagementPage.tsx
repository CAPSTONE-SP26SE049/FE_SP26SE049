import React, { useEffect, useState, useMemo } from 'react';
import { message, Input, Select, Upload, Form, Popconfirm, Modal, Pagination, Empty, Spin, Button } from 'antd';
import {
    Plus, Search, Trophy, Edit3,
    Trash2, Filter, LayoutGrid,
    Download, Upload as UploadIcon, FileSpreadsheet,
    CloudUpload, CheckCircle2, XCircle, Bot, Zap, Info, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '../services/adminService';
import { uploadToCloudinary } from '../../../services/cloudinaryService';
import clsx from 'clsx';

const AchievementManagementPage: React.FC = () => {
    const [achievements, setAchievements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importing, setImporting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [templateDownloading, setTemplateDownloading] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);

    const isValidExcelFile = (file: File) => /\.(xlsx|xls|csv)$/i.test(file.name);
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
        else {
            form.resetFields();
            form.setFieldsValue({ code: 'ACH_' + Math.random().toString(36).substring(2, 10).toUpperCase() });
            setIconPreview('');
        }
        setIsModalOpen(true);
    };

    const handleUploadIcon = async (options: any) => {
        const { file, onSuccess, onError } = options;
        try {
            setIsUploading(true);
            const url = await uploadToCloudinary(file, 'image');
            setIconPreview(url);
            form.setFieldsValue({ iconUrl: url });
            message.success('Tải ảnh lên thành công!');
            onSuccess("ok");
        } catch (e: any) {
            message.error('Upload thất bại');
            onError(e);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            const payload = { ...values, isActive: values.isActive ?? editingAchievement?.isActive ?? true };
            if (editingAchievement) {
                await adminService.updateReward(editingAchievement.id, payload);
                message.success('Cập nhật thành công');
            } else {
                await adminService.createReward(payload);
                message.success('Thêm thành tựu thành công');
            }
            setIsModalOpen(false);
            fetchAchievements();
        } catch (e: any) {
            if (e?.errorFields) return;
            message.error('Không thể lưu thành tựu');
        } finally {
            setSubmitting(false);
        }
    };

    const handleExportExcel = async () => {
        if (exporting) return;
        setExporting(true);
        try {
            message.loading({ content: 'Đang xuất file...', key: 'exp' });
            const blob: any = await adminService.exportRewardsToExcel();
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'achievements_export.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            message.success({ content: 'Xuất file thành công!', key: 'exp' });
        } catch (error) {
            message.error({ content: 'Lỗi xuất file', key: 'exp' });
        } finally {
            setExporting(false);
        }
    };

    const handleDownloadTemplate = async () => {
        if (templateDownloading) return;
        setTemplateDownloading(true);
        try {
            const blob: any = await adminService.downloadRewardTemplate();
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'achievement_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            message.success('Tải file mẫu thành công!');
        } catch (error) {
            message.error('Lỗi tải file mẫu');
        } finally {
            setTemplateDownloading(false);
        }
    };

    const handleImportExcel = async () => {
        if (!importFile) {
            message.warning('Vui lòng chọn file Excel');
            return;
        }
        if (!isValidExcelFile(importFile)) {
            message.error('Chỉ chấp nhận file .xlsx, .xls hoặc .csv');
            return;
        }
        setImporting(true);
        try {
            const res: any = await adminService.importRewardsFromExcel(importFile);
            const result = res?.data ?? res;
            message.success(`Nhập file hoàn tất: ${result?.successCount ?? 0} thành công, ${result?.errorCount ?? 0} lỗi`);
            if ((result?.errorCount ?? 0) > 0) {
                Modal.error({
                    title: 'Lỗi khi nhập file',
                    content: (
                        <div className="max-h-60 overflow-y-auto mt-2">
                            {(result?.messages ?? []).map((msg: string, i: number) => (
                                <p key={i} className="text-xs text-red-500 mb-1">Dòng {i + 1}: {msg}</p>
                            ))}
                        </div>
                    ),
                    className: 'doodle-modal'
                });
            }
            setIsImportModalOpen(false);
            setImportFile(null);
            fetchAchievements();
        } catch (error) {
            message.error('Lỗi nhập file');
        } finally {
            setImporting(false);
        }
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

    useEffect(() => { setCurrentPage(1); }, [searchText, statusFilter]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, currentPage, pageSize]);

    const assigned = achievements.filter(a => !!a.linkedQuizName).length;
    const unassigned = achievements.length - assigned;

    return (
        <div className="min-h-screen bg-[#fbf6ef] font-nunito p-8 space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-10 bg-[#49B6E5] rounded-full shadow-[2px_2px_0_#1f293705]" />
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Hệ thống Thành tựu</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Quản lý huy hiệu & phần thưởng vinh danh học viên</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleExportExcel}
                        disabled={exporting}
                        className="flex items-center gap-2 h-12 px-6 bg-white border-[3px] border-slate-900 rounded-2xl shadow-[4px_4px_0_#1f2937] text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
                    >
                        <FileSpreadsheet size={16} strokeWidth={3} />
                        {exporting ? 'Đang xuất...' : 'Xuất file'}
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsImportModalOpen(true)}
                        disabled={importing}
                        className="flex items-center gap-2 h-12 px-6 bg-white border-[3px] border-slate-900 rounded-2xl shadow-[4px_4px_0_#1f2937] text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all disabled:opacity-50"
                    >
                        <UploadIcon size={16} strokeWidth={3} />
                        Nhập file
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 h-12 px-8 bg-[#49B6E5] border-[3px] border-slate-900 rounded-2xl shadow-[5px_5px_0_#1f2937] text-xs font-black uppercase tracking-widest text-white transition-all"
                    >
                        <Plus size={18} strokeWidth={4} />
                        Tạo huy hiệu
                    </motion.button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Tổng số huy hiệu', value: achievements.length, icon: Trophy, color: '#f59e0b', bg: 'bg-orange-50' },
                    { label: 'Đã gán cho Quiz', value: assigned, icon: CheckCircle2, color: '#10b981', bg: 'bg-emerald-50' },
                    { label: 'Đang treo (Chưa gán)', value: unassigned, icon: Zap, color: '#ef4444', bg: 'bg-rose-50' },
                    { label: 'Tỷ lệ gán', value: achievements.length > 0 ? `${Math.round((assigned / achievements.length) * 100)}%` : '0%', icon: LayoutGrid, color: '#8b5cf6', bg: 'bg-violet-50' },
                ].map((card) => {
                    const Icon = card.icon
                    return (
                        <motion.article
                            key={card.label}
                            whileHover={{ y: -5 }}
                            className="relative group h-full"
                        >
                            <div className="h-full rounded-2xl border-[3px] border-slate-900 bg-white p-6 shadow-[6px_6px_0_#1f2937] transition-all hover:shadow-[10px_10px_0_#1f2937] flex flex-col justify-between overflow-hidden">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{card.label}</p>
                                    <p className="text-3xl font-black text-slate-900">{card.value}</p>
                                </div>
                                <div className={clsx("mt-6 w-12 h-12 rounded-2xl border-[2.5px] border-slate-900 shadow-[3px_3px_0_#1f2937] flex items-center justify-center transition-transform group-hover:rotate-6", card.bg)}>
                                    <Icon size={24} style={{ color: card.color }} strokeWidth={2.5} />
                                </div>
                                <div className="absolute -bottom-6 -right-6 opacity-5 pointer-events-none group-hover:scale-125 transition-transform">
                                    <Icon size={120} strokeWidth={3} />
                                </div>
                            </div>
                        </motion.article>
                    )
                })}
            </div>

            {/* Filters Area */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-[2rem] border-[3px] border-slate-900 shadow-[4px_4px_0_#1f293705]">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} strokeWidth={3} />
                    <input
                        type="text"
                        placeholder="Tìm tên huy hiệu, mã code..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-white border-[2.5px] border-slate-900/10 rounded-2xl focus:border-[#49B6E5] focus:outline-none text-xs font-black uppercase tracking-wider transition-all placeholder:text-slate-300"
                    />
                </div>

                <div className="relative w-64">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} strokeWidth={3} />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-white border-[2.5px] border-slate-900/10 rounded-2xl focus:border-[#49B6E5] appearance-none focus:outline-none text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="assigned">Đã gán cho Quiz</option>
                        <option value="unassigned">Chưa gán (Tự do)</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronRight className="rotate-90" size={12} strokeWidth={4} />
                    </div>
                </div>

                <div className="ml-auto hidden lg:flex items-center gap-3 px-6 py-2 bg-slate-50 border-[2px] border-slate-900/10 rounded-2xl italic">
                    <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{filteredData.length} Huy hiệu tìm thấy</span>
                </div>
            </div>

            {/* Achievement Grid Area */}
            <div className="flex-1">
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="aspect-square bg-white rounded-3xl border-[3px] border-slate-100 shadow-[4px_4px_0_#1f293705] animate-pulse" />
                        ))}
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border-[3px] border-slate-900 border-dashed backdrop-blur-sm grayscale opacity-30">
                        <Trophy size={64} className="text-slate-300 mb-6" />
                        <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest">Không có dữ liệu</h3>
                        <p className="text-xs font-bold text-slate-400 italic mt-1">Sử dụng tệp Excel hoặc thêm thủ công huy hiệu mới</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                        <AnimatePresence mode="popLayout">
                            {paginatedData.map((item, idx) => (
                                <motion.article
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, y: 0 }}
                                    transition={{ delay: (idx % 10) * 0.05 }}
                                    className="group relative flex flex-col items-center"
                                >
                                    <motion.div
                                        whileHover={{ y: -8, rotate: 2 }}
                                        className="relative w-full aspect-square bg-white border-[4px] border-slate-900 rounded-[2.5rem] shadow-[8px_8px_0_#1f2937] p-8 flex items-center justify-center overflow-hidden transition-shadow hover:shadow-[12px_12px_0_#1f2937]"
                                    >
                                        {/* Status Tag */}
                                        <div className={clsx(
                                            "absolute top-4 right-4 px-2.5 py-0.5 rounded-full border-[2px] border-slate-900 text-[8px] font-black uppercase tracking-tighter shadow-sm",
                                            item.linkedQuizName ? "bg-[#10b981] text-white" : "bg-white text-slate-400 border-slate-200 shadow-none"
                                        )}>
                                            {item.linkedQuizName ? 'Assigned' : 'Free'}
                                        </div>

                                        {item.iconUrl ? (
                                            <img src={item.iconUrl} alt={item.name} className="w-full h-full object-contain relative z-10" />
                                        ) : (
                                            <Trophy size={64} className="text-slate-100" strokeWidth={1} />
                                        )}

                                        {/* Action Overlay */}
                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] transition-opacity flex items-center justify-center gap-3 z-20">
                                            <button
                                                onClick={() => handleOpenModal(item)}
                                                className="w-11 h-11 rounded-2xl bg-white border-[2.5px] border-slate-900 text-slate-900 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                                            >
                                                <Edit3 size={18} strokeWidth={3} />
                                            </button>
                                            <Popconfirm
                                                title="Xác nhận xóa huy hiệu này?"
                                                onConfirm={() => handleDelete(item.id)}
                                                okText="Xóa"
                                                cancelText="Hủy"
                                            >
                                                <button className="w-11 h-11 rounded-2xl bg-white border-[2.5px] border-rose-500 text-rose-500 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform">
                                                    <Trash2 size={18} strokeWidth={3} />
                                                </button>
                                            </Popconfirm>
                                        </div>
                                    </motion.div>

                                    <div className="mt-4 text-center">
                                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight truncate max-w-[150px]">{item.name}</h4>
                                        <p className="text-[9px] font-bold text-slate-400 italic mt-1 leading-none truncate max-w-[150px]">
                                            {item.linkedQuizName ? `Gán: ${item.linkedQuizName}` : 'Chưa thiết lập Quiz'}
                                        </p>
                                    </div>
                                </motion.article>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Pagination Area */}
            {!loading && filteredData.length > 0 && (
                <div className="flex justify-center pt-8">
                    <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={filteredData.length}
                        onChange={(page, size) => { setCurrentPage(page); setPageSize(size); }}
                        showSizeChanger
                        className="doodle-pagination"
                    />
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                title={
                    <div className="flex flex-col">
                        <div className="text-xl font-black text-slate-900 uppercase tracking-tight">Huy hiệu vinh danh</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">
                            {editingAchievement ? `Cập nhật: ${editingAchievement.code}` : 'Thiết lập thành tựu mới'}
                        </div>
                    </div>
                }
                open={isModalOpen}
                onCancel={() => { setIsModalOpen(false); setIconPreview('') }}
                footer={null}
                width={560}
                centered
                className="doodle-modal"
            >
                <Form form={form} layout="vertical" onFinish={handleSave} className="mt-8 space-y-6">
                    <Form.Item name="code" hidden><Input /></Form.Item>

                    <Form.Item
                        name="name"
                        label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Tên hiển thị huy hiệu</span>}
                        rules={[{ required: true, whitespace: true, message: 'Nhập tên thành tựu' }]}
                    >
                        <div className="relative group">
                            <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#49B6E5] transition-colors" size={18} strokeWidth={3} />
                            <Input placeholder="Ví dụ: Chiến thần phát âm 🛡️" className="doodle-input pl-12" />
                        </div>
                    </Form.Item>

                    <Form.Item
                        name="iconUrl"
                        label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Hình ảnh thiết kế (PNG/SVG)</span>}
                        rules={[{ required: true, message: 'Tải lên hình ảnh huy hiệu' }]}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            <Upload
                                name="file"
                                listType="picture-card"
                                showUploadList={false}
                                customRequest={handleUploadIcon}
                                accept="image/*"
                                className="doodle-upload-square"
                            >
                                {iconPreview ? (
                                    <div className="relative w-full h-full overflow-hidden flex items-center justify-center p-2">
                                        <img src={iconPreview} className="w-full h-full object-contain" alt="prev" />
                                        {isUploading && (
                                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                                <Spin indicator={<Zap className="animate-pulse text-[#49B6E5]" size={24} />} />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className={clsx("w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 transition-colors", isUploading && "text-[#49B6E5]")}>
                                            <CloudUpload size={24} strokeWidth={3} />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Chọn ảnh</span>
                                    </div>
                                )}
                            </Upload>

                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 border-[2px] border-slate-900/5 rounded-2xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Info size={12} className="text-[#49B6E5]" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-[#49B6E5]">Hướng dẫn quy chuẩn</span>
                                    </div>
                                    <ul className="text-[10px] font-bold text-slate-500 space-y-1.5 leading-tight italic">
                                        <li>• Kích thước: 256x256px trở lên</li>
                                        <li>• Định dạng: PNG (Nền trong suốt)</li>
                                        <li>• Phong cách: Vector/Doodle đồng nhất</li>
                                    </ul>
                                </div>
                                {iconPreview && (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                                        <CheckCircle2 size={12} className="text-emerald-500" />
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Đã xác minh</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Form.Item>

                    {editingAchievement?.linkedQuizName && (
                        <div className="p-5 bg-violet-50 border-[2.5px] border-slate-900 rounded-[1.5rem] shadow-[4px_4px_0_#1f293705] flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white border-[2px] border-slate-900 flex items-center justify-center text-violet-500 shadow-sm">
                                <Bot size={24} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="text-[9px] font-black uppercase tracking-widest text-violet-400">Hợp đồng liên kết Quiz</div>
                                <div className="text-xs font-black text-slate-900 uppercase truncate mb-0.5">{editingAchievement.linkedQuizName}</div>
                                <div className="text-[9px] font-bold text-slate-400 italic">Level: {editingAchievement.linkedLevelName}</div>
                            </div>
                            <Zap size={20} className="text-yellow-400" fill="currentColor" />
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <Button
                            type="default"
                            onClick={() => { setIsModalOpen(false); setIconPreview('') }}
                            className="flex-1 h-12 rounded-2xl border-[3px] border-slate-900 font-black uppercase tracking-widest"
                        >
                            Hủy
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={submitting}
                            className="flex-1 h-12 rounded-2xl border-[3px] border-slate-900 bg-[#49B6E5] font-black uppercase tracking-widest"
                        >
                            Lưu huy hiệu
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* Import Excel Modal */}
            <Modal
                title={<div className="text-xl font-black text-slate-900 uppercase tracking-tight">Nhập thành tựu hàng loạt</div>}
                open={isImportModalOpen}
                onCancel={() => { setIsImportModalOpen(false); setImportFile(null); }}
                footer={null}
                centered
                width={520}
                className="doodle-modal"
            >
                <div className="mt-8 space-y-8">
                    <div className="relative group p-12 border-[3px] border-dashed border-slate-900/10 rounded-[2.5rem] bg-slate-100/50 hover:bg-white hover:border-[#49B6E5] transition-all text-center">
                        <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex flex-col items-center gap-5">
                            <div className={clsx("w-16 h-16 rounded-[1.5rem] border-[3px] border-slate-900 shadow-[6px_6px_0_#1f2937] flex items-center justify-center transition-transform group-hover:rotate-6", importFile ? "bg-orange-400 text-white" : "bg-white text-slate-300")}>
                                <FileSpreadsheet size={32} />
                            </div>
                            <div className="space-y-1">
                                <div className="text-xs font-black uppercase tracking-widest text-slate-500">
                                    {importFile ? importFile.name : 'Chọn tệp Excel Thành tựu'}
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 italic">Định dạng hỗ trợ: .xlsx, .xls</div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Yêu cầu cấu trúc</span>
                            <button onClick={handleDownloadTemplate} disabled={templateDownloading} className="text-[10px] font-black uppercase tracking-widest text-[#49B6E5] hover:underline underline-offset-4 disabled:opacity-50">{templateDownloading ? 'Đang tải...' : 'Tải file mẫu'}</button>
                        </div>
                        <div className="p-5 bg-blue-50 border-[2.5px] border-slate-900/5 rounded-3xl">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-white border-[2px] border-slate-900 flex items-center justify-center text-[#49B6E5] shrink-0">
                                    <Info size={18} strokeWidth={3} />
                                </div>
                                <p className="text-[11px] leading-relaxed font-bold text-slate-500 italic">
                                    Vui lòng sử dụng tệp mẫu của SpeakVN để đảm bảo các trường Mã code, Tên huy hiệu và Link icon được nhập chính xác. Mã code không được phép trùng lặp trong hệ thống.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setIsImportModalOpen(false)}
                            className="flex-1 h-14 rounded-2xl border-[3px] border-slate-900 bg-white text-slate-400 font-black uppercase tracking-widest shadow-[4px_4px_0_#1f293705]"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleImportExcel}
                            disabled={!importFile || importing}
                            className={clsx(
                                "flex-1 h-14 rounded-2xl border-[3px] border-slate-900 bg-[#49B6E5] text-white font-black uppercase tracking-widest shadow-[4px_4px_0_#1f2937] transition-all hover:-translate-y-0.5",
                                (!importFile || importing) && "opacity-50 grayscale cursor-not-allowed"
                            )}
                        >
                            {importing ? "Đang nhập file..." : "Nhập file"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Internal Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .doodle-pagination .ant-pagination-item {
                    border-radius: 12px; border: 2.5px solid #1f293710; font-family: 'Nunito'; font-weight: 800; background: white;
                }
                .doodle-pagination .ant-pagination-item-active {
                    background: #49B6E5 !important; border-color: #1f2937 !important;
                }
                .doodle-pagination .ant-pagination-item-active a { color: white !important; }
                
                .doodle-modal .ant-modal-content {
                    border: 4px solid #1f2937 !important; border-radius: 3rem !important;
                    box-shadow: 12px 12px 0 #1f2937 !important; background: #fbf6ef !important;
                    padding: 2.5rem !important;
                }
                .doodle-modal .ant-modal-header { background: transparent !important; border: none !important; margin-bottom: 1rem !important; }
                .doodle-modal .ant-modal-footer { display: none !important; }
                
                .doodle-input {
                    height: 54px; border: 2.5px solid #1f293720 !important; border-radius: 1.25rem !important;
                    font-weight: 700 !important; font-family: 'Nunito' !important;
                    transition: all 0.2s ease !important;
                }
                .doodle-input:focus { border-color: #49B6E5 !important; box-shadow: none !important; }
                
                .doodle-select .ant-select-selector {
                    height: 54px !important; border: 2.5px solid #1f293720 !important; border-radius: 1.25rem !important;
                    display: flex !important; align-items: center !important; font-weight: 700 !important;
                }
                
                .doodle-upload-square .ant-upload.ant-upload-select-picture-card {
                    width: 140px !important; height: 140px !important;
                    background: white !important; border: 3px dashed #1f293720 !important;
                    border-radius: 2rem !important; overflow: hidden !important;
                    margin: 0 !important; transition: all 0.3s !important;
                }
                .doodle-upload-square .ant-upload.ant-upload-select-picture-card:hover { border-color: #49B6E5 !important; }
                
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1f293710; border-radius: 10px; }
            `}} />
        </div>
    );
};

export default AchievementManagementPage;
