import React, { useEffect, useState } from 'react';
import { Table, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import { Search, Plus, Edit3, Trash2, Tag as TagIcon, MapPin, AlignLeft, Info, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { errorTagService, ErrorTagResponse, ErrorTagCreateRequest } from '../services/errorTagService';

const { Option } = Select;
const { TextArea } = Input;

const REGION_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    NORTH:   { label: 'NORTH',   color: 'text-blue-600',    bg: 'bg-blue-50',   border: 'border-blue-200' },
    CENTRAL: { label: 'CENTRAL', color: 'text-amber-600',   bg: 'bg-amber-50',  border: 'border-amber-200' },
    SOUTH:   { label: 'SOUTH',   color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
};

const ErrorTagManagementPage = () => {
    const [tags, setTags] = useState<ErrorTagResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingTag, setEditingTag] = useState<ErrorTagResponse | null>(null);
    const [form] = Form.useForm();

    const fetchTags = async () => {
        try {
            setLoading(true);
            const data = await errorTagService.getAll();
            const list = (data as any)?.data ?? data ?? [];
            setTags(Array.isArray(list) ? list : []);
        } catch {
            message.error('Không thể tải danh sách lỗi phát âm');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTags(); }, []);

    const filteredTags = tags.filter(t =>
        (t.name ?? '').toLowerCase().includes(searchText.toLowerCase()) ||
        (t.tagCode ?? '').toLowerCase().includes(searchText.toLowerCase()) ||
        (t.description ?? '').toLowerCase().includes(searchText.toLowerCase())
    );

    const handleOpenModal = (tag?: ErrorTagResponse) => {
        if (tag) {
            setEditingTag(tag);
            form.setFieldsValue({ tagCode: tag.tagCode, name: tag.name, description: tag.description, regions: tag.regions || [] });
        } else {
            setEditingTag(null);
            form.resetFields();
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => { setIsModalOpen(false); setEditingTag(null); form.resetFields(); };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            const payload: ErrorTagCreateRequest = { tagCode: values.tagCode, name: values.name, description: values.description, regions: values.regions };
            if (editingTag) {
                await errorTagService.update(editingTag.id, payload);
                message.success('Cập nhật thành công');
            } else {
                await errorTagService.create(payload);
                message.success('Tạo lỗi phát âm thành công');
            }
            fetchTags();
            handleCloseModal();
        } catch (error: any) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await errorTagService.delete(id);
            message.success('Đã xóa lỗi phát âm');
            fetchTags();
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Không thể xóa (đang được sử dụng)');
        }
    };

    const columns = [
        {
            title: <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mã Lỗi</span>,
            dataIndex: 'tagCode',
            key: 'tagCode',
            render: (text: string) => (
                <div className="flex items-center gap-2.5 py-1">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 border-[2px] border-slate-900 flex items-center justify-center shadow-[2px_2px_0_#1f2937] flex-shrink-0">
                        <TagIcon size={14} className="text-slate-500" strokeWidth={2.5} />
                    </div>
                    <span className="font-black text-slate-900 text-sm uppercase tracking-tight">{text}</span>
                </div>
            ),
        },
        {
            title: <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tên Hiển Thị</span>,
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <span className="font-bold text-slate-700 text-sm">{text}</span>,
        },
        {
            title: <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vùng Miền</span>,
            dataIndex: 'regions',
            key: 'regions',
            render: (regions: string[]) => (
                <div className="flex flex-wrap gap-1.5">
                    {(regions || []).map(r => {
                        const cfg = REGION_CONFIG[r] || { label: r, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' };
                        return (
                            <span key={r} className={clsx('px-2.5 py-0.5 rounded-lg border-[2px] font-black text-[9px] uppercase tracking-widest', cfg.bg, cfg.color, cfg.border)}>
                                {cfg.label}
                            </span>
                        );
                    })}
                </div>
            ),
        },
        {
            title: <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mô Tả</span>,
            dataIndex: 'description',
            key: 'description',
            render: (text: string) => (
                <div className="max-w-xs truncate text-sm font-bold text-slate-500" title={text}>{text || '—'}</div>
            ),
        },
        {
            title: <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 pr-4">Thao tác</span>,
            key: 'action',
            align: 'right' as const,
            render: (_: any, record: ErrorTagResponse) => (
                <div className="flex items-center justify-end gap-2 pr-4">
                    <button
                        onClick={() => handleOpenModal(record)}
                        className="p-2.5 rounded-xl border-[2px] border-transparent hover:border-slate-900/10 hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all"
                        title="Chỉnh sửa"
                    >
                        <Edit3 size={16} strokeWidth={3} />
                    </button>
                    <Popconfirm
                        title={<span className="font-black text-slate-900">Xóa lỗi vùng miền?</span>}
                        description={<span className="text-xs text-slate-500">Các bài học đang liên kết có thể bị ảnh hưởng.</span>}
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <button
                            className="p-2.5 rounded-xl border-[2px] border-transparent hover:border-rose-500/10 hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all"
                            title="Xóa"
                        >
                            <Trash2 size={16} strokeWidth={3} />
                        </button>
                    </Popconfirm>
                </div>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-[#fbf6ef] font-nunito p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-10 bg-[#49B6E5] rounded-full" />
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Lỗi Vùng Miền</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Quản lý danh mục các lỗi phát âm đặc trưng</p>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 h-12 px-8 bg-[#49B6E5] border-[3px] border-slate-900 rounded-2xl shadow-[5px_5px_0_#1f2937] text-xs font-black uppercase tracking-widest text-white transition-all"
                >
                    <Plus size={18} strokeWidth={4} />
                    Thêm Lỗi Mới
                </motion.button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-[2rem] border-[3px] border-slate-900 shadow-[4px_4px_0_#1f293705]">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} strokeWidth={3} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo mã lỗi, tên hoặc mô tả..."
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-white border-[2.5px] border-slate-900/10 rounded-2xl focus:border-[#49B6E5] focus:outline-none text-xs font-black uppercase tracking-wider transition-all placeholder:text-slate-300 placeholder:normal-case placeholder:tracking-normal"
                    />
                </div>
                <div className="ml-auto hidden lg:flex items-center gap-3 px-6 py-2 bg-slate-50 border-[2px] border-slate-900/10 rounded-2xl italic">
                    <div className="w-2 h-2 rounded-full bg-[#49B6E5] animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{filteredTags.length} kết quả</span>
                </div>
            </div>

            {/* Table */}
            <article className="rounded-[2.5rem] border-[3px] border-slate-900 bg-white shadow-[8px_8px_0_#1f2937] overflow-hidden">
                <div className="flex items-center gap-3 px-8 py-6 border-b-[3px] border-slate-900 bg-slate-50/10">
                    <TagIcon size={20} className="text-[#49B6E5]" strokeWidth={3} />
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Danh sách lỗi vùng miền</h2>
                </div>
                <div className="overflow-x-auto">
                    <Table
                        columns={columns}
                        dataSource={filteredTags}
                        rowKey="id"
                        loading={{
                            spinning: loading,
                            indicator: (
                                <div className="flex flex-col items-center justify-center">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                        className="w-12 h-12 rounded-2xl bg-white border-[3px] border-slate-900 shadow-[4px_4px_0_#49B6E5] flex items-center justify-center mb-4"
                                    >
                                        <Zap className="text-[#49B6E5]" size={24} fill="#49B6E5" fillOpacity={0.2} />
                                    </motion.div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Đang tải...</p>
                                </div>
                            ),
                        }}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total) => `Tổng ${total} mục`,
                            className: 'px-8 py-6 !m-0 border-t-[2px] border-slate-50',
                        }}
                        className="doodle-table-et"
                        rowClassName="group"
                    />
                </div>
            </article>

            {/* Create/Edit Modal */}
            <Modal
                title={
                    <div className="text-xl font-black text-slate-900 uppercase tracking-tight">
                        {editingTag ? 'Cập nhật Lỗi Vùng Miền' : 'Thêm Lỗi Vùng Miền Mới'}
                    </div>
                }
                open={isModalOpen}
                onCancel={handleCloseModal}
                footer={null}
                width={580}
                destroyOnClose
                className="doodle-modal-et"
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="tagCode"
                            label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Mã lỗi</span>}
                            rules={[{ required: true, message: 'Nhập mã lỗi' }]}
                        >
                            <Input
                                placeholder="Ví dụ: L_N, S_X..."
                                disabled={!!editingTag}
                                className="h-11 border-[2.5px] border-slate-900/20 rounded-xl font-bold focus:border-[#49B6E5]"
                            />
                        </Form.Item>
                        <Form.Item
                            name="name"
                            label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Tên hiển thị</span>}
                            rules={[{ required: true, message: 'Nhập tên hiển thị' }]}
                        >
                            <Input
                                placeholder="Ví dụ: Ngọng L - N"
                                className="h-11 border-[2.5px] border-slate-900/20 rounded-xl font-bold focus:border-[#49B6E5]"
                            />
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="regions"
                        label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Vùng miền áp dụng</span>}
                        rules={[{ required: true, message: 'Chọn ít nhất 1 vùng miền' }]}
                    >
                        <Select mode="multiple" placeholder="Chọn vùng miền..." className="doodle-select-et">
                            <Option value="NORTH">Miền Bắc (NORTH)</Option>
                            <Option value="CENTRAL">Miền Trung (CENTRAL)</Option>
                            <Option value="SOUTH">Miền Nam (SOUTH)</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Mô tả chi tiết</span>}
                    >
                        <TextArea
                            rows={3}
                            placeholder="Nhập mô tả về lỗi phát âm này..."
                            className="border-[2.5px] border-slate-900/20 rounded-xl font-bold resize-none focus:border-[#49B6E5]"
                        />
                    </Form.Item>

                    <div className="flex gap-4 pt-2">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={handleCloseModal}
                            className="flex-1 h-12 rounded-2xl border-[3px] border-slate-900 bg-white text-slate-400 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0_#1f293705]"
                        >
                            Hủy
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={submitting}
                            className="flex-1 h-12 rounded-2xl border-[3px] border-slate-900 bg-[#49B6E5] text-white font-black uppercase tracking-widest text-xs shadow-[4px_4px_0_#1f2937] disabled:opacity-50"
                        >
                            {submitting ? 'Đang lưu...' : editingTag ? 'Cập nhật' : 'Tạo mới'}
                        </motion.button>
                    </div>
                </Form>
            </Modal>

            <style dangerouslySetInnerHTML={{ __html: `
                .doodle-table-et .ant-table-thead > tr > th {
                    background: transparent !important;
                    border-bottom: 3px solid #1f2937 !important;
                    padding: 1.5rem !important;
                    font-family: 'Nunito' !important;
                }
                .doodle-table-et .ant-table-tbody > tr > td {
                    padding: 1.25rem 1.5rem !important;
                    border-bottom: 2px solid #1f293708 !important;
                }
                .doodle-table-et .ant-table-tbody > tr:hover > td {
                    background: #f8fafc !important;
                }
                .doodle-modal-et .ant-modal-content {
                    border: 4px solid #1f2937 !important;
                    border-radius: 3rem !important;
                    box-shadow: 12px 12px 0 #1f2937 !important;
                    background: #fbf6ef !important;
                    padding: 2.5rem !important;
                }
                .doodle-modal-et .ant-modal-header { background: transparent !important; border: none !important; margin-bottom: 0 !important; }
                .doodle-select-et .ant-select-selector {
                    min-height: 44px !important;
                    border: 2.5px solid rgba(15,23,42,0.2) !important;
                    border-radius: 0.75rem !important;
                    font-weight: 700 !important;
                }
                .doodle-select-et.ant-select-focused .ant-select-selector {
                    border-color: #49B6E5 !important;
                    box-shadow: none !important;
                }
            `}} />
        </div>
    );
};

export default ErrorTagManagementPage;
