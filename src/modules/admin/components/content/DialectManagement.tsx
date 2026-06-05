import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { Trash2 } from '../../../../lib/icons';
import { adminService } from '../../services/adminService';

const DialectManagement: React.FC = () => {
    const [dialects, setDialects] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form] = Form.useForm();

    const fetchDialects = async () => {
        try {
            setLoading(true);
            const res = await adminService.getDialects().catch(() => ({ status: 'success', data: [] }));
            if (res.status === 'success') {
                setDialects(res.data || []);
            }
        } catch (error) {
            message.error('Lỗi khi tải danh sách Vùng Miền');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDialects();
    }, []);

    const handleOpenModal = (record?: any) => {
        if (record) {
            setEditingId(record.id);
            form.setFieldsValue(record);
        } else {
            setEditingId(null);
            form.resetFields();
        }
        setIsModalVisible(true);
    };

    const handleSubmit = async (values: any) => {
        try {
            setLoading(true);
            if (editingId) {
                await adminService.updateDialect(editingId, values);
                message.success('Cập nhật thành công');
            } else {
                await adminService.createDialect(values);
                message.success('Tạo vùng miền mới thành công');
            }
            setIsModalVisible(false);
            fetchDialects();
        } catch (error: any) {
            message.error(error.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            setLoading(true);
            await adminService.deleteDialect(id);
            message.success('Đã xóa vùng miền');
            fetchDialects();
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
        {
            title: 'Mã vùng',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <strong>{text}</strong>
        },
        {
            title: 'Tên Hiển Thị (Tiếng Việt)',
            dataIndex: 'description',
            key: 'description',
            render: (text: string) => <span className="text-blue-600 font-medium">{text}</span>
        },
        {
            title: 'Thao tác',
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
                        title="Chắc chắn xóa vùng miền này?"
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
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">Danh sách vùng miền</h3>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleOpenModal()}
                    style={{ background: 'linear-gradient(135deg, #9333ea, #7e22ce)', border: 'none', color: '#fff', height: 40, paddingInline: 20, borderRadius: 8, fontWeight: 600, boxShadow: '0 4px 12px rgba(147,51,234,0.25)' }}
                >
                    Thêm vùng miền
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={dialects}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 5 }}
                locale={{ emptyText: 'Chưa có dữ liệu' }}
            />

            <Modal
                title={editingId ? "Sửa vùng miền" : "Thêm vùng miền mới"}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form layout="vertical" form={form} onFinish={handleSubmit}>
                    <Form.Item
                        name="name"
                        label="Mã vùng miền (VD: NORTH, MIEN_TAY)"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mã vùng' },
                            { pattern: /^[A-Z0-9_]+$/, message: 'Mã vùng chỉ gồm chữ Hoa, số và dấu gạch dưới' },
                            { min: 3, message: 'Mã vùng ít nhất 3 ký tự' },
                            { max: 20, message: 'Mã vùng không quá 20 ký tự' }
                        ]}
                    >
                        <Input placeholder="Nhập mã viết hoa không dấu..." disabled={!!editingId} />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Tên hiển thị (Tiếng Việt - VD: Miền Bắc)"
                        rules={[
                            { required: true, message: 'Vui lòng nhập tên hiển thị' },
                            { min: 3, message: 'Tên hiển thị ít nhất 3 ký tự' },
                            { max: 100, message: 'Tên hiển thị không quá 100 ký tự' }
                        ]}
                    >
                        <Input placeholder="Nhập tên tiếng Việt hiển thị trên giao diện..." />
                    </Form.Item>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button onClick={() => setIsModalVisible(false)} className="rounded-lg h-10 px-6">Hủy</Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            style={{ background: 'linear-gradient(135deg, #9333ea, #7e22ce)', border: 'none', color: '#fff', height: 40, paddingInline: 32, borderRadius: 8, fontWeight: 700, boxShadow: '0 4px 12px rgba(147,51,234,0.25)' }}
                        >
                            {editingId ? "Lưu thay đổi" : "Tạo mới"}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default DialectManagement;
