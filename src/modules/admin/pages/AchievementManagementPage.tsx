import React, { useEffect, useState, useMemo } from 'react';
import { Card, Table, message, Tag, Input, Button, Space, Tooltip, Row, Col, Avatar, Popconfirm, Modal, Form, Upload } from 'antd';
import {
    PlusOutlined,
    SearchOutlined,
    ClearOutlined,
    TrophyOutlined,
    EditOutlined,
    LayoutOutlined,
    DeleteOutlined,
    StopOutlined,
    LoadingOutlined,
    UploadOutlined
} from '@ant-design/icons';
import { adminService } from '../services/adminService';
import { uploadToCloudinary } from '../../../services/cloudinaryService';

const AchievementManagementPage: React.FC = () => {
    const [achievements, setAchievements] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAchievement, setEditingAchievement] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [iconPreview, setIconPreview] = useState<string>('');
    const [form] = Form.useForm();

    const fetchAchievements = async () => {
        setLoading(true);
        try {
            console.log('Fetching badges from /admin/rewards...');
            const response: any = await adminService.getBadgesForAdmin();
            console.log('API Response:', response);

            const data = response?.data || (Array.isArray(response) ? response : []);
            setAchievements(data);
        } catch (error: any) {
            console.error('Error fetching achievements:', error);
            message.error(error?.message || 'Không thể tải danh sách thành tựu');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await adminService.deleteReward(id);
            message.success('Xóa thành tựu thành công');
            fetchAchievements();
        } catch (error: any) {
            console.error('Error deleting achievement:', error);
            message.error(error?.message || 'Không thể xóa thành tựu');
        }
    };



    const handleOpenModal = (achievement: any = null) => {
        setEditingAchievement(achievement);
        if (achievement) {
            form.setFieldsValue({
                ...achievement,
            });
            setIconPreview(achievement.iconUrl || '');
        } else {
            form.resetFields();
            // Generate a random unique code for new achievement
            const randomCode = 'ACH_' + Math.random().toString(36).substring(2, 10).toUpperCase();
            form.setFieldsValue({
                code: randomCode,
            });
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
        } catch (error: any) {
            console.error('Upload failed:', error);
            message.error(error.message || 'Tải ảnh lên thất bại');
            onError(error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            const payload = {
                ...values,
                isActive: values.isActive ?? editingAchievement?.isActive ?? true,
            };

            if (editingAchievement) {
                await adminService.updateReward(editingAchievement.id, payload);
                message.success('Cập nhật thành tựu thành công');
            } else {
                await adminService.createReward(payload);
                message.success('Thêm thành tựu thành công');
            }

            setIsModalOpen(false);
            fetchAchievements();
        } catch (error: any) {
            if (error.errorFields) return; // Form validation error
            console.error('Error saving achievement:', error);
            message.error(error?.message || 'Không thể lưu thành tựu');
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        fetchAchievements();
    }, []);

    const filteredData = useMemo(() => {
        let data = [...achievements];
        if (searchText.trim()) {
            const lower = searchText.trim().toLowerCase();
            data = data.filter((item) =>
                (item.name || '').toLowerCase().includes(lower) ||
                (item.code || '').toLowerCase().includes(lower)
            );
        }
        return data;
    }, [achievements, searchText]);

    const columns = [
        {
            title: 'STT',
            key: 'stt',
            width: 70,
            align: 'center' as const,
            render: (_: any, __: any, index: number) => (
                <span style={{ fontWeight: 600, color: '#64748b' }}>{index + 1}</span>
            ),
        },
        {
            title: 'Huy hiệu',
            dataIndex: 'iconUrl',
            key: 'iconUrl',
            width: 100,
            align: 'center' as const,
            render: (url: string) => (
                <Avatar
                    src={url}
                    shape="square"
                    size={40}
                    icon={<TrophyOutlined />}
                    style={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px'
                    }}
                />
            )
        },
        {
            title: 'Tên thành tựu',
            dataIndex: 'name',
            key: 'name',
            sorter: (a: any, b: any) => (a.name || '').localeCompare(b.name || '', 'vi'),
            render: (text: string) => <span style={{ fontWeight: 600, color: '#1e293b' }}>{text}</span>,
        },

        {
            title: 'Gán cho Quiz',
            key: 'assignment',
            width: 200,
            render: (record: any) => (
                record.linkedQuizName ? (
                    <Space direction="vertical" size={0}>
                        <Tag color="processing" style={{ borderRadius: 4, margin: 0 }}>
                            <LayoutOutlined style={{ marginRight: 4 }} />
                            {record.linkedQuizName}
                        </Tag>
                        {record.linkedLevelName && (
                            <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>
                                Level: {record.linkedLevelName}
                            </span>
                        )}
                    </Space>
                ) : (
                    <Tag icon={<StopOutlined />} color="default" style={{ borderRadius: 4 }}>
                        Chưa gán
                    </Tag>
                )
            )
        },
        {
            title: 'Hành Động',
            key: 'actions',
            width: 120,
            align: 'center' as const,
            render: (record: any) => (
                <Space size="small">

                    <Tooltip title="Chỉnh sửa">
                        <Button
                            icon={<EditOutlined />}
                            style={{ borderRadius: '8px' }}
                            onClick={() => handleOpenModal(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Xóa">
                        <Popconfirm
                            title="Xóa thành tựu"
                            description="Bạn có chắc chắn muốn xóa thành tựu này không?"
                            onConfirm={() => handleDelete(record.id)}
                            okText="Có"
                            cancelText="Không"
                            okButtonProps={{ danger: true }}
                        >
                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                style={{ borderRadius: '8px' }}
                            />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: '#e6f7ff', padding: 10, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrophyOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800" style={{ margin: 0 }}>Quản lý thành tựu</h2>
                    </div>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleOpenModal()}
                    style={{
                        height: '44px',
                        borderRadius: '10px',
                        background: 'linear-gradient(90deg, #1890ff, #0076e4)',
                        border: 'none',
                        fontWeight: 600,
                        paddingInline: 20,
                        boxShadow: '0 4px 12px rgba(24,144,255,0.3)'
                    }}
                >
                    Thêm thành tựu
                </Button>
            </div>

            <Card
                style={{
                    borderRadius: 14,
                    marginBottom: 0,
                    boxShadow: '0 2px 12px rgba(37,99,235,0.06)',
                    border: '1px solid #e2e8f0',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #fff 100%)',
                }}
                styles={{ body: { padding: '16px 20px' } }}
            >
                <Row gutter={[16, 12]} align="middle">
                    <Col xs={24} sm={24} md={12} lg={10}>
                        <Input
                            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                            placeholder="Tìm kiếm theo tên hoặc mã thành tựu..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                            style={{ borderRadius: 8, height: 38 }}
                        />
                    </Col>
                    <Col xs={24} sm={24} md={12} lg={14}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-start' }}>
                            {searchText.trim() && (
                                <Button
                                    icon={<ClearOutlined />}
                                    onClick={() => setSearchText('')}
                                    style={{ borderRadius: 8, height: 38, borderColor: '#e2e8f0' }}
                                >
                                    Xóa bộ lọc
                                </Button>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ color: '#94a3b8', fontSize: 13 }}>
                                    {filteredData.length}/{achievements.length} thành tựu
                                </span>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Card>

            <div style={{ marginTop: '24px' }}>
                <Table
                    dataSource={filteredData}
                    columns={columns}
                    loading={loading}
                    rowKey="id"
                    scroll={{ y: 550 }}
                    pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng cộng ${total} thành tựu`,
                    }}
                    style={{
                        borderRadius: '12px',
                    }}
                />
            </div>
            <Modal
                title={editingAchievement ? "Chỉnh sửa thành tựu" : "Thêm thành tựu mới"}
                open={isModalOpen}
                onOk={handleSave}
                onCancel={() => setIsModalOpen(false)}
                confirmLoading={submitting}
                okText={editingAchievement ? "Cập nhật" : "Tạo mới"}
                okButtonProps={{
                    style: {
                        borderRadius: 8,
                        height: 40,
                        fontWeight: 700,
                        paddingInline: 24,
                        background: 'linear-gradient(90deg, #1890ff, #0076e4)',
                        border: 'none',
                        color: '#fff',
                        boxShadow: '0 4px 12px rgba(24,144,255,0.25)',
                    }
                }}
                cancelText="Hủy"
                cancelButtonProps={{ style: { borderRadius: 8, height: 40 } }}
                width={600}
                centered
            >
                <Form
                    form={form}
                    layout="vertical"
                    style={{ marginTop: 20 }}
                >
                    <Form.Item name="code" hidden>
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="name"
                        label="Tên thành tựu"
                        rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
                    >
                        <Input placeholder="Vd: Học giả chuyên cần" style={{ borderRadius: 8, height: 40 }} />
                    </Form.Item>



                    <Form.Item
                        name="iconUrl"
                        label="Hình ảnh huy hiệu"
                        rules={[{ required: true, message: 'Vui lòng tải lên icon huy hiệu' }]}
                    >
                        <Space align="start" size="large">
                            <Upload
                                name="file"
                                listType="picture-card"
                                showUploadList={false}
                                customRequest={handleUploadIcon}
                                accept="image/*"
                                style={{ borderRadius: '12px' }}
                            >
                                {iconPreview ? (
                                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                        <img src={iconPreview} alt="avatar" style={{ width: '100%', borderRadius: '8px' }} />
                                        {isUploading && (
                                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <LoadingOutlined />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        {isUploading ? <LoadingOutlined /> : <PlusOutlined />}
                                        <div style={{ marginTop: 8 }}>Tải lên</div>
                                    </div>
                                )}
                            </Upload>
                            <div style={{ flex: 1, paddingTop: 8 }}>
                                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                                    Tải ảnh từ máy tính lên Cloudinary để làm icon cho huy hiệu.
                                </p>
                                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>
                                    Khuyên dùng ảnh PNG hoặc SVG (Kích thước đề xuất: 128x128px)
                                </p>
                                {iconPreview && (
                                    <Input
                                        value={iconPreview}
                                        readOnly
                                        size="small"
                                        style={{ marginTop: 12, borderRadius: 6, fontSize: 11, background: '#f1f5f9' }}
                                        prefix={<UploadOutlined style={{ color: '#94a3b8' }} />}
                                    />
                                )}
                            </div>
                        </Space>
                    </Form.Item>

                    {editingAchievement && editingAchievement.linkedQuizName && (
                        <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                            <span style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 4 }}>
                                Hiện đang gán cho quiz:
                            </span>
                            <Space align="center">
                                <LayoutOutlined style={{ color: '#1890ff' }} />
                                <span style={{ fontWeight: 600 }}>{editingAchievement.linkedQuizName}</span>
                                <Tag color="blue">{editingAchievement.linkedLevelName}</Tag>
                            </Space>
                            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#f59e0b' }}>
                                * Để thay đổi gán, hãy vào phần Quản lý Chapter/Quiz để thiết lập lại phần thưởng.
                            </p>
                        </div>
                    )}
                </Form>
            </Modal>
        </div>
    );
};

export default AchievementManagementPage;
