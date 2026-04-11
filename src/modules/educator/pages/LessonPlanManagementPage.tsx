import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Card, Typography, message, Modal, Form, Input, Select, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined, BookOutlined } from '@ant-design/icons';
import { educatorService } from '../services/educatorService';

const { Title, Text } = Typography;

const LessonPlanManagementPage = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [units, setUnits] = useState([]);
    const [form] = Form.useForm();

    const fetchData = async () => {
        setLoading(true);
        try {
            const planRes = await educatorService.getLessonPlans();
            setPlans(planRes.data || []);
            
            const unitRes = await educatorService.getLevelsForSelection();
            setUnits(unitRes.data || []);
        } catch (error) {
            message.error('Không thể tải danh sách lộ trình');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreatePlan = async (values: any) => {
        try {
            await educatorService.createLessonPlan(values.title, values.description, values.unitIds);
            message.success('Tạo lộ trình bài giảng thành công');
            setIsModalVisible(false);
            form.resetFields();
            fetchData();
        } catch (error) {
            message.error('Lỗi khi tạo lộ trình');
        }
    };

    const columns = [
        {
            title: 'Tên lộ trình',
            dataIndex: 'title',
            key: 'title',
            render: (text: string) => <span style={{ fontWeight: 600 }}>{text}</span>,
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'Số bài học',
            dataIndex: 'unitCount',
            key: 'unitCount',
            render: (count: number) => <Tag color="blue">{count} bài học</Tag>,
        },
        {
            title: 'Người tạo',
            dataIndex: 'creatorName',
            key: 'creatorName',
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: any) => (
                <Space size="middle">
                    <Button icon={<BookOutlined />} size="small">Xem bài học</Button>
                    <Button danger icon={<DeleteOutlined />} size="small" />
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <Title level={2}>Lộ trình bài giảng mẫu</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
                    Tạo lộ trình mới
                </Button>
            </div>

            <Card variant="outlined">
                <Table 
                    columns={columns} 
                    dataSource={plans} 
                    loading={loading}
                    rowKey="id"
                />
            </Card>

            <Modal
                title="Tạo lộ trình bài giảng mới"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => form.submit()}
                width={600}
                destroyOnHidden
            >
                <Form form={form} layout="vertical" onFinish={handleCreatePlan}>
                    <Form.Item name="title" label="Tiêu đề lộ trình" rules={[{ required: true }]}>
                        <Input placeholder="Ví dụ: Tiếng Việt cơ bản cho người Nhật" />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả">
                        <Input.TextArea rows={3} placeholder="Mô tả mục tiêu của lộ trình này..." />
                    </Form.Item>
                    <Divider>Thành phần bài học</Divider>
                    <Form.Item name="unitIds" label="Chọn các Unit / Level" rules={[{ required: true }]}>
                        <Select 
                            mode="multiple" 
                            placeholder="Chọn bài học từ ngân hàng..."
                            options={units.map((u: any) => ({ label: u.name, value: u.id }))}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default LessonPlanManagementPage;
