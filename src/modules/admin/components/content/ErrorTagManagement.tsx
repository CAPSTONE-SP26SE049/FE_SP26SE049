import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Popconfirm, Select } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { Trash2 } from 'lucide-react';
import { adminService } from '../../services/adminService';

const ErrorTagManagement: React.FC = () => {
    const [errorTags, setErrorTags] = useState<any[]>([]);
    const [dialects, setDialects] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingTag, setEditingTag] = useState<any>(null);
    const [form] = Form.useForm();

    const fetchDialects = async () => {
        try {
            const res = await adminService.getDialects().catch(() => ({ status: 'success', data: [] }));
            if (res.status === 'success') {
                setDialects(res.data || []);
            }
        } catch (error) {
            console.error('Error fetching dialects:', error);
        }
    };

    const fetchErrorTags = async () => {
        try {
            setLoading(true);
            const res = await adminService.getErrorTags().catch(() => ({ status: 'success', data: [] }));
            if (res.status === 'success') {
                setErrorTags(res.data || []);
            }
        } catch (error) {
            message.error('Lỗi khi tải danh sách lỗi phát âm (Error Tags)');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchErrorTags();
        fetchDialects();
    }, []);

    const handleOpenModal = (tag?: any) => {
        if (tag) {
            setEditingTag(tag);
            form.setFieldsValue({
                tagCode: tag.tagCode,
                name: tag.name,
                description: tag.description,
                regions: tag.regions || []
            });
        } else {
            setEditingTag(null);
            form.resetFields();
        }
        setIsModalVisible(true);
    };

    const handleSubmit = async (values: any) => {
        try {
            setLoading(true);
            if (editingTag) {
                await adminService.updateErrorTag(editingTag.id, values);
                message.success('Cập nhật lỗi phát âm thành công');
            } else {
                await adminService.createErrorTag(values.tagCode, values.name, values.description || '', values.regions || []);
                message.success('Tạo lỗi phát âm mới thành công');
            }
            setIsModalVisible(false);
            fetchErrorTags();
        } catch (error: any) {
            message.error(error.message || `Có lỗi xảy ra khi ${editingTag ? 'cập nhật' : 'tạo'} lỗi phát âm`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            setLoading(true);
            await adminService.deleteErrorTag(id);
            message.success('Đã xóa lỗi phát âm');
            fetchErrorTags();
        } catch (error: any) {
            message.error(error.message || 'Xóa thất bại');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'STT',
            key: 'stt',
            width: 60,
            align: 'center' as const,
            render: (_: any, __: any, index: number) => index + 1,
        },
        { title: 'Mã lỗi (Code)', dataIndex: 'tagCode', key: 'tagCode', render: (text: string) => <strong>{text}</strong> },
        { title: 'Tên lỗi', dataIndex: 'name', key: 'name' },
        { title: 'Mô tả', dataIndex: 'description', key: 'description' },
        {
            title: 'Vùng miền',
            dataIndex: 'regions',
            key: 'regions',
            render: (regions: string[]) => (
                <div className="flex flex-wrap gap-1">
                    {regions && regions.length > 0 ? regions.map(r => {
                        const dialect = dialects.find(d => d.name === r);
                        return (
                            <span key={r} className="text-gray-700 font-medium px-2 border-r last:border-0 border-gray-300">
                                {dialect ? dialect.description : r}
                            </span>
                        );
                    }) : '-'}
                </div>
            )
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_: any, record: any) => (
                <Space size="middle">
                    <Button
                        type="text"
                        onClick={() => handleOpenModal(record)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white transition-all border-none"
                    >
                        <EditOutlined style={{ fontSize: 16 }} />
                    </Button>
                    <Popconfirm
                        title="Chắc chắn xóa lỗi này?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ style: { backgroundColor: '#1677ff', color: 'white' }, className: "hover:!bg-[#1677ff] hover:!text-white border-none" }}
                        cancelButtonProps={{ className: "hover:!border-gray-300 hover:!text-gray-700 hover:!bg-transparent" }}
                    >
                        <Button
                            type="text"
                            danger
                            icon={<Trash2 size={16} />}
                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all border-none"
                        />
                    </Popconfirm>
                </Space>
            ),
        }
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Danh sách lỗi phát âm (Error Tags)</h3>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-medium h-10 px-5 rounded-lg border-none shadow-sm"
                >
                    Thêm lỗi mới
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={errorTags}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 5 }}
                locale={{ emptyText: 'Chưa có dữ liệu' }}
            />

            <Modal
                title={editingTag ? "Chỉnh sửa lỗi phát âm" : "Thêm lỗi phát âm mới"}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form layout="vertical" form={form} onFinish={handleSubmit}>
                    <Form.Item
                        name="tagCode"
                        label="Mã lỗi (VD: L_N)"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mã lỗi' },
                            { pattern: /^[A-Z0-9_]+$/, message: 'Mã lỗi chỉ gồm chữ Hoa, số và dấu gạch dưới' },
                            { min: 2, message: 'Mã ít nhất 2 ký tự' },
                            { max: 20, message: 'Mã không quá 20 ký tự' }
                        ]}
                    >
                        <Input placeholder="Nhập mã viết hoa không dấu (VD: L_N, D_GI)" />
                    </Form.Item>
                    <Form.Item
                        name="name"
                        label="Tên lỗi (VD: Ngọng L - N)"
                        rules={[
                            { required: true, message: 'Vui lòng nhập tên lỗi' },
                            { min: 3, message: 'Tên ít nhất 3 ký tự' },
                            { max: 100, message: 'Tên không quá 100 ký tự' }
                        ]}
                    >
                        <Input placeholder="Nhập tên hiển thị..." />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Mô tả"
                        rules={[{ max: 300, message: 'Mô tả không quá 300 ký tự' }]}
                    >
                        <Input.TextArea rows={2} placeholder="Mô tả chi tiết về loại lỗi cơ bản này..." showCount maxLength={300} />
                    </Form.Item>
                    <Form.Item
                        name="regions"
                        label="Áp dụng cho vùng miền"
                        rules={[{ required: true, message: 'Vui lòng chọn ít nhất một vùng miền' }]}
                    >
                        <Select mode="multiple" placeholder="Chọn các vùng miền áp dụng">
                            {dialects.map(d => (
                                <Select.Option key={d.id} value={d.name}>
                                    {d.description}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button onClick={() => setIsModalVisible(false)} className="rounded-lg h-10 px-6">Hủy</Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-medium h-10 px-8 rounded-lg border-none shadow-md"
                        >
                            {editingTag ? 'Cập nhật' : 'Tạo mới'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default ErrorTagManagement;
