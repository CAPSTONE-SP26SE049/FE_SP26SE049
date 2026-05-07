import React, { useEffect, useState } from 'react';
import { Table, Modal, Form, Input, Select, message, Button, Popconfirm, Tag, Tooltip } from 'antd';
import { Search, Plus, Edit3, Trash2, Tag as TagIcon, MapPin, AlignLeft, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { errorTagService, ErrorTagResponse, ErrorTagCreateRequest } from '../services/errorTagService';

const { Option } = Select;
const { TextArea } = Input;

const REGION_COLORS: Record<string, string> = {
    NORTH: 'blue',
    CENTRAL: 'orange',
    SOUTH: 'green',
};

const ErrorTagManagementPage = () => {
    const [tags, setTags] = useState<ErrorTagResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingTag, setEditingTag] = useState<ErrorTagResponse | null>(null);
    const [form] = Form.useForm();

    const fetchTags = async () => {
        try {
            setLoading(true);
            const data = await errorTagService.getAll();
            setTags(data);
        } catch (error) {
            message.error('Không thể tải danh sách Error Tags');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTags();
    }, []);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value.toLowerCase());
    };

    const filteredTags = tags.filter((t) =>
        t.name.toLowerCase().includes(searchText) ||
        t.tagCode?.toLowerCase().includes(searchText) ||
        t.description?.toLowerCase().includes(searchText)
    );

    const handleOpenModal = (tag?: ErrorTagResponse) => {
        if (tag) {
            setEditingTag(tag);
            form.setFieldsValue({
                tagCode: tag.tagCode,
                name: tag.name,
                description: tag.description,
                regions: tag.regions || [],
            });
        } else {
            setEditingTag(null);
            form.resetFields();
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTag(null);
        form.resetFields();
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            const payload: ErrorTagCreateRequest = {
                tagCode: values.tagCode,
                name: values.name,
                description: values.description,
                regions: values.regions,
            };

            if (editingTag) {
                await errorTagService.update(editingTag.id, payload);
                message.success('Cập nhật Error Tag thành công');
            } else {
                await errorTagService.create(payload);
                message.success('Tạo Error Tag thành công');
            }

            fetchTags();
            handleCloseModal();
        } catch (error: any) {
            if (error?.response?.data?.message) {
                message.error(error.response.data.message);
            } else {
                message.error('Có lỗi xảy ra, vui lòng thử lại');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await errorTagService.delete(id);
            message.success('Đã xóa Error Tag');
            fetchTags();
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Không thể xóa Error Tag này (Có thể đang được sử dụng)');
        }
    };

    const columns = [
        {
            title: 'Mã Lỗi',
            dataIndex: 'tagCode',
            key: 'tagCode',
            render: (text: string) => (
                <div className="flex items-center gap-2">
                    <div className="bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                        <TagIcon className="w-4 h-4 text-slate-500" />
                    </div>
                    <span className="font-medium text-slate-700">{text}</span>
                </div>
            )
        },
        {
            title: 'Tên Hiển Thị',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <span className="font-medium text-slate-900">{text}</span>
        },
        {
            title: 'Vùng Miền',
            dataIndex: 'regions',
            key: 'regions',
            render: (regions: string[]) => (
                <div className="flex flex-wrap gap-1">
                    {regions && regions.map(r => (
                        <Tag key={r} color={REGION_COLORS[r] || 'default'}>{r}</Tag>
                    ))}
                </div>
            )
        },
        {
            title: 'Mô Tả',
            dataIndex: 'description',
            key: 'description',
            render: (text: string) => (
                <div className="max-w-xs truncate text-slate-500" title={text}>
                    {text || '-'}
                </div>
            )
        },
        {
            title: 'Hành động',
            key: 'action',
            align: 'right' as const,
            render: (_: any, record: ErrorTagResponse) => (
                <div className="flex justify-end gap-2">
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            type="text"
                            icon={<Edit3 className="w-4 h-4 text-blue-600" />}
                            onClick={() => handleOpenModal(record)}
                            className="hover:bg-blue-50"
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Xóa lỗi vùng miền"
                        description="Bạn có chắc muốn xóa lỗi này không? Các bài học đang liên kết có thể bị ảnh hưởng."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Xóa">
                            <Button
                                type="text"
                                danger
                                icon={<Trash2 className="w-4 h-4" />}
                                className="hover:bg-red-50"
                            />
                        </Tooltip>
                    </Popconfirm>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                        <TagIcon className="w-6 h-6 text-slate-700" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lỗi Vùng Miền</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Quản lý danh mục các lỗi phát âm đặc trưng</p>
                    </div>
                </div>

                <Button
                    type="primary"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => handleOpenModal()}
                    className="bg-slate-900 hover:bg-slate-800 shadow-md h-10 px-5 rounded-xl border-0"
                >
                    Thêm Lỗi Mới
                </Button>
            </div>

            {/* Filter */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo mã lỗi, tên hoặc mô tả..."
                        value={searchText}
                        onChange={handleSearch}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
            </div>

            {/* Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
                <Table
                    columns={columns}
                    dataSource={filteredTags}
                    rowKey="id"
                    scroll={{ y: 'calc(100vh - 350px)' }}
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng ${total} mục`
                    }}
                    className="[&_.ant-table-thead>tr>th]:bg-white [&_.ant-table-thead>tr>th]:text-slate-500 [&_.ant-table-thead>tr>th]:font-medium [&_.ant-table-thead>tr>th]:border-b-slate-200"
                />
            </motion.div>

            {/* Create/Edit Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2 mb-4">
                        <div className="bg-blue-50 p-1.5 rounded-lg border border-blue-100">
                            {editingTag ? <Edit3 className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
                        </div>
                        <span className="text-lg font-semibold">{editingTag ? 'Cập nhật Lỗi Vùng Miền' : 'Thêm Lỗi Vùng Miền Mới'}</span>
                    </div>
                }
                open={isModalOpen}
                onCancel={handleCloseModal}
                footer={null}
                width={600}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    className="space-y-4"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="tagCode"
                            label={<span className="font-medium text-slate-700 flex items-center gap-1.5"><TagIcon className="w-4 h-4" /> Mã lỗi</span>}
                            rules={[{ required: true, message: 'Vui lòng nhập mã lỗi!' }]}
                        >
                            <Input placeholder="Ví dụ: L_N, S_X..." className="rounded-lg" disabled={!!editingTag} />
                        </Form.Item>

                        <Form.Item
                            name="name"
                            label={<span className="font-medium text-slate-700 flex items-center gap-1.5"><Info className="w-4 h-4" /> Tên hiển thị</span>}
                            rules={[{ required: true, message: 'Vui lòng nhập tên hiển thị!' }]}
                        >
                            <Input placeholder="Ví dụ: Ngọng L - N" className="rounded-lg" />
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="regions"
                        label={<span className="font-medium text-slate-700 flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Vùng miền áp dụng</span>}
                        rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 vùng miền!' }]}
                    >
                        <Select mode="multiple" placeholder="Chọn vùng miền..." className="rounded-lg">
                            <Option value="NORTH">Miền Bắc (NORTH)</Option>
                            <Option value="CENTRAL">Miền Trung (CENTRAL)</Option>
                            <Option value="SOUTH">Miền Nam (SOUTH)</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label={<span className="font-medium text-slate-700 flex items-center gap-1.5"><AlignLeft className="w-4 h-4" /> Mô tả chi tiết</span>}
                    >
                        <TextArea rows={4} placeholder="Nhập mô tả về lỗi phát âm này..." className="rounded-lg" />
                    </Form.Item>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button onClick={handleCloseModal} className="h-10 px-5 rounded-xl border-slate-200">
                            Hủy
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={submitting}
                            className="bg-slate-900 hover:bg-slate-800 shadow-md h-10 px-5 rounded-xl border-0"
                        >
                            {editingTag ? 'Cập nhật' : 'Tạo mới'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default ErrorTagManagementPage;
