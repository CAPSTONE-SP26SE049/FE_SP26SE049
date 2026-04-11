import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Card, Tabs, Typography, Row, Col, Statistic, Table, 
    Button, message, Timeline, Form, Input, InputNumber, 
    DatePicker, Modal, Progress, Space, Divider
} from 'antd';
import { 
    ArrowLeftOutlined, TrophyOutlined, FireOutlined, 
    LineChartOutlined, MessageOutlined, BookOutlined 
} from '@ant-design/icons';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, RadarChart, PolarGrid, 
    PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { educatorService } from '../services/educatorService';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const StudentDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<any>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [quests, setQuests] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isQuestModalVisible, setIsQuestModalVisible] = useState(false);
    const [form] = Form.useForm();

    const fetchData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [profRes, analRes, questRes, feedRes] = await Promise.all([
                educatorService.getStudentProfile(id),
                educatorService.getStudentAnalytics(id),
                educatorService.getStudentQuests(id),
                educatorService.getStudentFeedbackHistory(id)
            ]);
            setProfile(profRes.data);
            setAnalytics(analRes.data);
            setQuests(questRes.data || []);
            setFeedback(feedRes.data || []);
        } catch (error) {
            message.error('Không thể tải dữ liệu học sinh');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleAssignQuest = async (values: any) => {
        if (!id) return;
        try {
            const payload = {
                ...values,
                endDate: values.endDate ? values.endDate.toISOString() : null
            };
            await educatorService.assignQuestToStudent(id, payload);
            message.success('Đã giao mục tiêu mới cho học sinh');
            setIsQuestModalVisible(false);
            form.resetFields();
            fetchData();
        } catch (error) {
            message.error('Lỗi khi giao mục tiêu');
        }
    };

    if (loading) return <Card loading={true} />;

    return (
        <div style={{ padding: '0 24px' }}>
            <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/educator/students')}
                style={{ marginBottom: '16px' }}
            >
                Quay lại
            </Button>

            <Card style={{ marginBottom: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Row gutter={24} align="middle">
                    <Col xs={24} sm={12}>
                        <Title level={3} style={{ margin: 0 }}>{profile?.fullName}</Title>
                        <Text type="secondary">{profile?.email}</Text>
                    </Col>
                    <Col xs={12} sm={6}>
                        <Statistic 
                            title="Tổng XP" 
                            value={profile?.totalXp} 
                            prefix={<TrophyOutlined style={{ color: '#faad14' }} />} 
                        />
                    </Col>
                    <Col xs={12} sm={6}>
                        <Statistic 
                            title="Chuỗi ngày học" 
                            value={profile?.currentStreak} 
                            prefix={<FireOutlined style={{ color: '#ff4d4f' }} />} 
                        />
                    </Col>
                </Row>
            </Card>

            <Tabs 
                defaultActiveKey="analytics" 
                size="large"
                items={[
                    {
                        key: 'analytics',
                        label: <span><LineChartOutlined /> Phân tích</span>,
                        children: (
                            <Row gutter={24}>
                                <Col span={24} style={{ marginBottom: '24px' }}>
                                    <Card title="Xu hướng điểm số (30 ngày gần nhất)" variant="outlined">
                                        <div style={{ height: 350, minHeight: 350 }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={analytics?.scoreTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                    <XAxis dataKey="date" />
                                                    <YAxis domain={[0, 100]} />
                                                    <Tooltip />
                                                    <Line type="monotone" dataKey="score" stroke="#1890ff" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </Card>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Card title="Top 5 lỗi phát âm" variant="outlined">
                                        <Table 
                                            dataSource={analytics?.topErrors} 
                                            pagination={false}
                                            rowKey="phoneme"
                                            columns={[
                                                { title: 'Phoneme', dataIndex: 'phoneme', key: 'phoneme' },
                                                { title: 'Độ chính xác', dataIndex: 'accuracy', key: 'accuracy', render: (val) => `${val.toFixed(1)}%` },
                                                { title: 'Lượt thử', dataIndex: 'count', key: 'count' },
                                            ]}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Card title="Phân bổ kỹ năng" variant="outlined">
                                        <div style={{ height: 350, minHeight: 350, display: 'flex', justifyContent: 'center' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart data={[
                                                    { subject: 'Phát âm', A: profile?.averageSpeakingScore || 0, fullMark: 100 },
                                                    { subject: 'Nghe', A: 75, fullMark: 100 },
                                                    { subject: 'Từ vựng', A: 85, fullMark: 100 },
                                                    { subject: 'Đọc', A: 70, fullMark: 100 },
                                                ]}>
                                                    <PolarGrid />
                                                    <PolarAngleAxis dataKey="subject" />
                                                    <Radar name="Kỹ năng" dataKey="A" stroke="#1890ff" fill="#1890ff" fillOpacity={0.6} />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </Card>
                                </Col>
                            </Row>
                        )
                    },
                    {
                        key: 'quests',
                        label: <span><TrophyOutlined /> Mục tiêu (Goals)</span>,
                        children: (
                            <>
                                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button type="primary" onClick={() => setIsQuestModalVisible(true)}>Giao mục tiêu mới</Button>
                                </div>
                                <Row gutter={[16, 16]}>
                                    {quests.map((q: any, index) => (
                                        <Col xs={24} sm={12} md={8} key={index}>
                                            <Card variant="outlined" style={{ borderRadius: '8px' }}>
                                                <Title level={5}>{q.title}</Title>
                                                <Space direction="vertical" style={{ width: '100%' }}>
                                                    <Text type="secondary">Thưởng: {q.xp}</Text>
                                                    <Progress percent={q.progress} status={q.done ? 'success' : 'active'} />
                                                    {q.done && <Tag color="success">Hoàn thành</Tag>}
                                                </Space>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            </>
                        )
                    },
                    {
                        key: 'feedback',
                        label: <span><MessageOutlined /> Nhận xét</span>,
                        children: (
                            <Card variant="outlined">
                                <Timeline mode="left">
                                    {feedback.map((f: any, index) => (
                                        <Timeline.Item key={index} label={dayjs(f.createdAt).format('DD/MM/YYYY HH:mm')}>
                                            <Card size="small" variant="outlined" style={{ background: '#f9f9f9' }}>
                                                <Paragraph style={{ margin: 0 }}>{f.comment}</Paragraph>
                                                <Tag color={f.priority === 'HIGH' ? 'red' : 'blue'} style={{ marginTop: '8px' }}>
                                                    Độ ưu tiên: {f.priority}
                                                </Tag>
                                            </Card>
                                        </Timeline.Item>
                                    ))}
                                </Timeline>
                            </Card>
                        )
                    },
                    {
                        key: 'assignments',
                        label: <span><BookOutlined /> Bài tập</span>,
                        children: (
                            <Card title="Nhiệm vụ đang học" variant="outlined">
                                <Table 
                                    dataSource={profile?.activeAssignments} 
                                    rowKey="id"
                                    columns={[
                                        { title: 'Tên bài học', dataIndex: 'lessonTitle', key: 'lessonTitle' },
                                        { title: 'Hạn chót', dataIndex: 'deadline', key: 'deadline', render: (val) => dayjs(val).format('DD/MM/YYYY') },
                                        { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (val) => <Tag color="gold">{val}</Tag> },
                                    ]}
                                />
                            </Card>
                        )
                    }
                ]} 
            />

            <Modal
                title="Giao mục tiêu cá nhân cho học sinh"
                open={isQuestModalVisible}
                onCancel={() => setIsQuestModalVisible(false)}
                onOk={() => form.submit()}
                destroyOnHidden
            >
                <Form form={form} layout="vertical" onFinish={handleAssignQuest}>
                    <Form.Item name="title" label="Tiêu đề mục tiêu" rules={[{ required: true }]}>
                        <Input placeholder="Ví dụ: Hoàn thành 5 bài học phát âm" />
                    </Form.Item>
                    <Form.Item name="questType" label="Loại nhiệm vụ" rules={[{ required: true }]}>
                        <Input placeholder="Ví dụ: SPEAKING, QUIZ_PASS" />
                    </Form.Item>
                    <Space size="large">
                        <Form.Item name="targetValue" label="Số lượng mục tiêu" rules={[{ required: true }]}>
                            <InputNumber min={1} defaultValue={1} />
                        </Form.Item>
                        <Form.Item name="xpReward" label="Thưởng XP" rules={[{ required: true }]}>
                            <InputNumber min={0} defaultValue={50} />
                        </Form.Item>
                    </Space>
                    <Form.Item name="endDate" label="Ngày hết hạn (tùy chọn)">
                        <DatePicker showTime style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="description" label="Ghi chú">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default StudentDetailPage;
