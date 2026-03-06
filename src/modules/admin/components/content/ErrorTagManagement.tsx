import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { adminService } from '../../services/adminService';

const ErrorTagManagement: React.FC = () => {
    const [errorTags, setErrorTags] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    const fetchErrorTags = async () => {
        try {
            setLoading(true);
            const res = await adminService.getErrorTags().catch(() => ({ status: 'success', data: [] }));
            if (res.status === 'success') {
                setErrorTags(res.data || []);
            }
        } catch (error) {
            message.error('Lỗi khi tải danh sách Lỗi Phát Âm (Error Tags)');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchErrorTags();
    }, []);

    const handleOpenModal = () => {
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleSubmit = async (values: any) => {
        try {
            setLoading(true);
            await adminService.createErrorTag(values.tagCode, values.name, values.description || '');
            message.success('Tạo Lỗi Phát Âm mới thành công');
            setIsModalVisible(false);
            fetchErrorTags();
        } catch (error: any) {
            message.error(error.message || 'Có lỗi xảy ra khi tạo Lỗi Phát Âm');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            setLoading(true);
            await adminService.deleteErrorTag(id);
            message.success('Đã xóa Lỗi Phát Âm');
            fetchErrorTags();
        } catch (error: any) {
            message.error(error.message || 'Xóa thất bại');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { title: 'Mã Lỗi (Code)', dataIndex: 'tagCode', key: 'tagCode', render: (text: string) => <strong>{text}</strong> },
        { title: 'Tên Lỗi', dataIndex: 'name', key: 'name' },
        { title: 'Mô Tả', dataIndex: 'description', key: 'description' },
        {
            title: 'Hành Động',
            key: 'action',
            render: (_: any, record: any) => (
                <Space size="middle">
                    <Popconfirm title="Chắc chắn xóa lỗi này?" onConfirm={() => handleDelete(record.id)}>
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
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
                <h3 className="text-lg font-bold">Danh sách Lỗi Phát Âm (Error Tags)</h3>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleOpenModal}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-medium h-10 px-5 rounded-lg border-none shadow-sm"
                >
                    Thêm Lỗi Mới
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={errorTags}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 5 }}
            />

            <Modal
                title="Thêm Lỗi Phát Âm Mới"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form layout="vertical" form={form} onFinish={handleSubmit}>
                    <Form.Item name="tagCode" label="Mã Lỗi (VD: L_N)" rules={[{ required: true, message: 'Vui lòng nhập mã lỗi' }]}>
                        <Input placeholder="Nhập mã viết hoa không dấu" />
                    </Form.Item>
                    <Form.Item name="name" label="Tên Lỗi (VD: Ngọng L - N)" rules={[{ required: true, message: 'Vui lòng nhập tên lỗi' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="Mô Tả">
                        <Input.TextArea rows={3} placeholder="Mô tả chi tiết về loại lỗi cơ bản này..." />
                    </Form.Item>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button onClick={() => setIsModalVisible(false)} className="rounded-lg h-10 px-6">Hủy</Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-medium h-10 px-8 rounded-lg border-none shadow-md"
                        >
                            Tạo Mới
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default ErrorTagManagement;
