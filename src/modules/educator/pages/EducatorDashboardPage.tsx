import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, message, List, Avatar, Tag } from 'antd';
import { 
    TeamOutlined, 
    FileDoneOutlined, 
    RiseOutlined, 
    CheckCircleOutlined,
    UserOutlined,
    PartitionOutlined
} from '@ant-design/icons';
import { educatorService } from '../services/educatorService';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

const EducatorDashboardPage = () => {
    const [summary, setSummary] = useState<any>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sumRes, actRes] = await Promise.all([
                educatorService.getDashboardSummary(),
                educatorService.getRecentActivities()
            ]);
            setSummary(sumRes.data);
            setActivities(actRes.data || []);
        } catch (error) {
            message.error('Không thể tải dữ liệu dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const stats = [
        {
            title: 'Tổng số học viên',
            value: summary?.totalStudents || 0,
            icon: <TeamOutlined style={{ color: '#1890ff', fontSize: 24 }} />,
            color: '#e6f7ff',
        },
        {
            title: 'Lộ trình đang chạy',
            value: summary?.activeClassrooms || 0,
            icon: <PartitionOutlined style={{ color: '#faad14', fontSize: 24 }} />,
            color: '#fffbe6',
        },
        {
            title: 'Tổng lượt luyện tập',
            value: summary?.totalAttempts || 0,
            icon: <FileDoneOutlined style={{ color: '#52c41a', fontSize: 24 }} />,
            color: '#f6ffed',
        },
        {
            title: 'Điểm trung bình',
            value: (summary?.averageClassScore || 0).toFixed(1),
            suffix: '%',
            icon: <RiseOutlined style={{ color: '#722ed1', fontSize: 24 }} />,
            color: '#f9f0ff',
        },
    ];

    return (
        <div style={{ padding: '0px' }}>
            <Title level={2} style={{ marginBottom: '24px' }}>Tổng quan hệ thống</Title>
            
            <Row gutter={[24, 24]}>
                {stats.map((item, index) => (
                    <Col xs={24} sm={6} key={index}>
                        <Card variant="outlined" style={{ borderRadius: '12px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <Statistic
                                title={<Text type="secondary" style={{ fontSize: '14px' }}>{item.title}</Text>}
                                value={item.value}
                                valueStyle={{ color: '#1a1a1a', fontWeight: 700, fontSize: '24px' }}
                                prefix={
                                    <div style={{ 
                                        width: '40px', 
                                        height: '40px', 
                                        borderRadius: '10px', 
                                        background: item.color, 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        marginRight: '12px'
                                    }}>
                                        {item.icon}
                                    </div>
                                }
                                suffix={item.suffix}
                                loading={loading}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row gutter={[24, 24]} style={{ marginTop: '32px' }}>
                <Col xs={24} lg={16}>
                    <Card title="Hoạt động gần đây" variant="outlined" style={{ borderRadius: '12px' }}>
                        <List
                            loading={loading}
                            itemLayout="horizontal"
                            dataSource={activities}
                            renderItem={(item) => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<Avatar icon={<CheckCircleOutlined />} style={{ backgroundColor: '#52c41a' }} />}
                                        title={<a href="#">{item.title}</a>}
                                        description={dayjs(item.createdAt).fromNow()}
                                    />
                                    <Tag color="cyan">Luyện tập</Tag>
                                </List.Item>
                            )}
                            locale={{ emptyText: 'Chưa có hoạt động nào hôm nay' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card title="Học viên đứng đầu" variant="outlined" style={{ borderRadius: '12px' }}>
                        <List
                            loading={loading}
                            itemLayout="horizontal"
                            dataSource={[
                                { name: 'Nguyễn Văn An', xp: '1,250 XP' },
                                { name: 'Trần Thị Bình', xp: '1,100 XP' },
                                { name: 'Lê Văn Cường', xp: '950 XP' },
                            ]}
                            renderItem={(item, index) => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<Avatar icon={<UserOutlined />} />}
                                        title={item.name}
                                        description={item.xp}
                                    />
                                    <Text strong>#{index + 1}</Text>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default EducatorDashboardPage;
