import React, { useEffect, useState } from 'react';
import { Typography, Card, Table, message, Tag } from 'antd';
import { BookOutlined } from '@ant-design/icons';
import { educatorService } from '../services/educatorService';

const { Title } = Typography;

const ChapterManagementPage: React.FC = () => {
    const [levels, setLevels] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchLevels = async () => {
        setLoading(true);
        try {
            const response: any = await educatorService.getLevelsForSelection();
            if (response && (response.status === 'success' || response.data)) {
                setLevels(response.data || response);
            } else {
                setLevels(Array.isArray(response) ? response : []);
            }
        } catch (error) {
            console.error('Error fetching levels:', error);
            message.error('Không thể tải danh sách chương học');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLevels();
    }, []);

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 150,
            render: (text: string) => <code style={{ fontSize: '12px' }}>{text.substring(0, 8)}...</code>,
        },
        {
            title: 'Tên chương học',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <strong>{text}</strong>,
        },
        {
            title: 'Mã phương ngữ',
            dataIndex: 'dialectId',
            key: 'dialectId',
            render: (text: string) => {
                const color = text.includes('0001') ? 'blue' : 'green';
                const label = text.includes('0001') ? 'Miền Bắc' : 'Hệ thống';
                return <Tag color={color}>{label}</Tag>;
            },
        },
        {
            title: 'Trạng thái',
            key: 'status',
            render: () => <Tag color="success">Đã duyệt</Tag>,
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <BookOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                <Title level={2} style={{ margin: 0 }}>Quản lý chương học</Title>
            </div>

            <Card>
                <div style={{ marginBottom: '16px' }}>
                    <p style={{ color: '#8c8c8c' }}>
                        Dưới đây là danh sách các chương học (levels) đã được phê duyệt để gán cho các bài kiểm tra.
                    </p>
                </div>

                <Table
                    dataSource={levels}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: 'Chưa có dữ liệu chương học' }}
                />
            </Card>
        </div>
    );
};

export default ChapterManagementPage;
