import React, { useEffect, useState } from 'react';
import {
    Card,
    Select,
    Table,
    Tag,
    Spin,
    Empty,
    Typography,
    Space,
    Badge,
    Tooltip,
    Statistic,
    Row,
    Col,
    Divider,
} from 'antd';
import {
    FileTextOutlined,
    ClockCircleOutlined,
    TrophyOutlined,
    QuestionCircleOutlined,
    ReadOutlined,
    SoundOutlined,
    AudioOutlined,
    FilterOutlined,
} from '@ant-design/icons';
import { educatorService } from '../services/educatorService';

const { Title, Text } = Typography;
const { Option } = Select;

const SKILL_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    READING: { label: 'Đọc hiểu', color: '#2563eb', icon: <ReadOutlined /> },
    LISTENING: { label: 'Nghe hiểu', color: '#7c3aed', icon: <SoundOutlined /> },
    PRONUNCIATION: { label: 'Phát âm', color: '#0891b2', icon: <AudioOutlined /> },
};

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
    BEGINNER: { label: 'Cơ bản', color: 'green' },
    INTERMEDIATE: { label: 'Trung bình', color: 'gold' },
    ADVANCED: { label: 'Nâng cao', color: 'red' },
};

const REGION_LABEL: Record<string, { label: string; color: string; bg: string }> = {
    NORTH: { label: 'Miền Bắc', color: '#1d4ed8', bg: '#dbeafe' },
    SOUTH: { label: 'Miền Nam', color: '#15803d', bg: '#dcfce7' },
    CENTRAL: { label: 'Miền Trung', color: '#b45309', bg: '#fef3c7' },
};

const QuizManagementPage: React.FC = () => {
    const [levels, setLevels] = useState<any[]>([]);
    const [dialects, setDialects] = useState<any[]>([]);
    const [selectedLevelId, setSelectedLevelId] = useState<string | undefined>(undefined);
    const [quiz, setQuiz] = useState<any | null>(null);
    const [loadingLevels, setLoadingLevels] = useState(false);
    const [loadingQuiz, setLoadingQuiz] = useState(false);

    useEffect(() => {
        const fetchLevels = async () => {
            setLoadingLevels(true);
            try {
                const res: any = await educatorService.getLevelsForSelection();
                setLevels(res?.data || (Array.isArray(res) ? res : []));
            } catch {
                setLevels([]);
            } finally {
                setLoadingLevels(false);
            }
        };

        const fetchDialects = async () => {
            try {
                const res: any = await educatorService.getDialects();
                setDialects(res?.data || (Array.isArray(res) ? res : []));
            } catch {
                setDialects([]);
            }
        };

        fetchLevels();
        fetchDialects();
    }, []);

    const handleLevelChange = async (levelId: string) => {
        setSelectedLevelId(levelId);
        setQuiz(null);
        setLoadingQuiz(true);
        try {
            const res: any = await educatorService.getQuizzesByLevel(levelId);
            console.log('[QuizManagement] raw response:', res);

            // apiClient unwraps axios response.data once → res = { status, data: quiz } OR quiz directly
            let quizData = null;
            if (res?.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
                // Standard: { status: 'success', data: { ...quiz } }
                quizData = res.data;
            } else if (res?.id) {
                // Already unwrapped to quiz object directly
                quizData = res;
            } else if (Array.isArray(res?.data) && res.data.length > 0) {
                // API returns array of quizzes → take first
                quizData = res.data[0];
            } else if (Array.isArray(res) && res.length > 0) {
                quizData = res[0];
            }

            console.log('[QuizManagement] quizData resolved:', quizData);
            setQuiz(quizData);
        } catch (err) {
            console.error('[QuizManagement] fetch error:', err);
            setQuiz(null);
        } finally {
            setLoadingQuiz(false);
        }
    };

    const getRegionInfo = (dialectId: string) => {
        const dialect = dialects.find((d) => d.id === dialectId);
        const regionKey = (dialect?.name || '').toUpperCase();
        return REGION_LABEL[regionKey] || null;
    };

    const selectedLevel = levels.find((l) => l.id === selectedLevelId);

    const questionColumns = [
        {
            title: 'STT',
            key: 'stt',
            width: 60,
            align: 'center' as const,
            render: (_: any, __: any, index: number) => (
                <span style={{ fontWeight: 600, color: '#64748b' }}>{index + 1}</span>
            ),
        },
        {
            title: 'Kỹ năng',
            dataIndex: 'skillType',
            key: 'skillType',
            render: (skillType: string) => {
                const cfg = SKILL_CONFIG[skillType] || { label: skillType, color: '#888', icon: <QuestionCircleOutlined /> };
                return (
                    <Tag
                        icon={cfg.icon}
                        style={{
                            background: `${cfg.color}15`,
                            border: `1px solid ${cfg.color}40`,
                            color: cfg.color,
                            fontWeight: 600,
                            borderRadius: 20,
                            padding: '2px 10px',
                        }}
                    >
                        {cfg.label}
                    </Tag>
                );
            },
        },
        {
            title: 'Độ khó',
            dataIndex: 'difficulty',
            key: 'difficulty',
            render: (difficulty: string) => {
                const cfg = DIFFICULTY_CONFIG[difficulty] || { label: difficulty || '—', color: 'default' };
                return <Tag color={cfg.color}>{cfg.label}</Tag>;
            },
        },
        {
            title: 'Thứ tự',
            dataIndex: 'questionOrder',
            key: 'questionOrder',
            align: 'center' as const,
            render: (val: number) => (
                <Badge count={val} style={{ backgroundColor: '#e2e8f0', color: '#334155', boxShadow: 'none', fontWeight: 700 }} />
            ),
        },
        {
            title: 'Điểm',
            dataIndex: 'points',
            key: 'points',
            align: 'center' as const,
            render: (val: number) => (
                <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: 15 }}>
                    <TrophyOutlined style={{ marginRight: 4, fontSize: 13 }} />
                    {val}
                </span>
            ),
        },
    ];

    const regionInfo = selectedLevel ? getRegionInfo(selectedLevel.dialectId) : null;

    return (
        <div style={{ padding: 0 }}>
            {/* Header */}
            <div
                style={{
                    marginBottom: 28,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 12,
                }}
            >
                <div>
                    <Title level={2} style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
                        <FileTextOutlined style={{ marginRight: 10, color: '#2563eb' }} />
                        Quản Lý Quiz
                    </Title>
                    <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>
                        Xem danh sách quiz và câu hỏi theo từng chương học
                    </Text>
                </div>
            </div>

            {/* Filter Card */}
            <Card
                style={{
                    borderRadius: 16,
                    marginBottom: 24,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    border: '1px solid #e2e8f0',
                }}
                bodyStyle={{ padding: '20px 24px' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <FilterOutlined style={{ color: '#2563eb', fontSize: 18 }} />
                    <Text strong style={{ fontSize: 15, whiteSpace: 'nowrap' }}>
                        Chọn chương học:
                    </Text>
                    <Select
                        placeholder="Chọn chương học để xem quiz..."
                        style={{ minWidth: 320, flex: 1, maxWidth: 500 }}
                        onChange={handleLevelChange}
                        loading={loadingLevels}
                        value={selectedLevelId}
                        showSearch
                        filterOption={(input, option) =>
                            (option?.children as any)?.toLowerCase().includes(input.toLowerCase())
                        }
                        size="large"
                    >
                        {levels.map((level) => {
                            const rInfo = getRegionInfo(level.dialectId);
                            return (
                                <Option key={level.id} value={level.id}>
                                    {level.name}
                                    {rInfo ? ` — ${rInfo.label}` : ''}
                                </Option>
                            );
                        })}
                    </Select>
                </div>
            </Card>

            {/* Content Area */}
            {!selectedLevelId && !loadingQuiz && (
                <div
                    style={{
                        textAlign: 'center',
                        padding: '80px 24px',
                        background: '#f8fafc',
                        borderRadius: 16,
                        border: '2px dashed #cbd5e1',
                    }}
                >
                    <FileTextOutlined style={{ fontSize: 56, color: '#94a3b8', marginBottom: 16 }} />
                    <Title level={4} style={{ color: '#64748b', margin: 0 }}>
                        Chọn một chương học để xem danh sách quiz
                    </Title>
                    <Text type="secondary">Sử dụng bộ lọc phía trên để bắt đầu</Text>
                </div>
            )}

            {loadingQuiz && (
                <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                    <Spin size="large" tip="Đang tải dữ liệu quiz..." />
                </div>
            )}

            {!loadingQuiz && selectedLevelId && !quiz && (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        <Text type="secondary">Chương học này chưa có quiz nào</Text>
                    }
                    style={{ padding: '60px 0' }}
                />
            )}

            {!loadingQuiz && quiz && (
                <>
                    {/* Quiz Info Card */}
                    <Card
                        style={{
                            borderRadius: 16,
                            marginBottom: 24,
                            boxShadow: '0 4px 20px rgba(37,99,235,0.08)',
                            border: '1.5px solid #bfdbfe',
                            background: 'linear-gradient(135deg, #eff6ff 0%, #fff 100%)',
                        }}
                        bodyStyle={{ padding: '24px 28px' }}
                    >
                        {/* Title row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                            <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 12,
                                    background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <FileTextOutlined style={{ fontSize: 22, color: '#fff' }} />
                            </div>
                            <div>
                                <Title level={4} style={{ margin: 0, fontSize: 18 }}>
                                    {quiz.name || quiz.title}
                                </Title>
                                {regionInfo && (
                                    <span
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            padding: '2px 10px',
                                            borderRadius: 20,
                                            fontSize: 12,
                                            fontWeight: 600,
                                            color: regionInfo.color,
                                            background: regionInfo.bg,
                                            border: `1.5px solid ${regionInfo.color}40`,
                                            marginTop: 4,
                                        }}
                                    >
                                        {regionInfo.label}
                                    </span>
                                )}
                            </div>
                        </div>

                        {quiz.description && (
                            <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
                                {quiz.description}
                            </Text>
                        )}

                        {quiz.instructions && (
                            <div
                                style={{
                                    background: '#fef9c3',
                                    border: '1px solid #fde68a',
                                    borderRadius: 8,
                                    padding: '10px 14px',
                                    marginBottom: 16,
                                    fontSize: 13,
                                    color: '#92400e',
                                }}
                            >
                                <strong>Hướng dẫn:</strong> {quiz.instructions}
                            </div>
                        )}

                        <Divider style={{ margin: '16px 0' }} />

                        {/* Stats */}
                        <Row gutter={[24, 16]}>
                            <Col xs={12} sm={6}>
                                <Statistic
                                    title={<span style={{ fontSize: 12, color: '#64748b' }}>Số câu hỏi</span>}
                                    value={quiz.questions?.length ?? quiz.questionCount ?? 0}
                                    prefix={<QuestionCircleOutlined style={{ color: '#2563eb' }} />}
                                    valueStyle={{ fontSize: 22, fontWeight: 700, color: '#2563eb' }}
                                />
                            </Col>
                            <Col xs={12} sm={6}>
                                <Statistic
                                    title={<span style={{ fontSize: 12, color: '#64748b' }}>Điểm đạt</span>}
                                    value={quiz.passingScore ?? '—'}
                                    suffix={quiz.passingScore ? '%' : ''}
                                    prefix={<TrophyOutlined style={{ color: '#f59e0b' }} />}
                                    valueStyle={{ fontSize: 22, fontWeight: 700, color: '#f59e0b' }}
                                />
                            </Col>
                            <Col xs={12} sm={6}>
                                <Statistic
                                    title={<span style={{ fontSize: 12, color: '#64748b' }}>Thời gian</span>}
                                    value={quiz.timeLimitMinutes ?? '—'}
                                    suffix={quiz.timeLimitMinutes ? ' phút' : ''}
                                    prefix={<ClockCircleOutlined style={{ color: '#0891b2' }} />}
                                    valueStyle={{ fontSize: 22, fontWeight: 700, color: '#0891b2' }}
                                />
                            </Col>
                            <Col xs={12} sm={6}>
                                <div>
                                    <Text style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>
                                        ID quiz
                                    </Text>
                                    <Tooltip title={quiz.id}>
                                        <code
                                            style={{
                                                fontSize: 13,
                                                background: '#f1f5f9',
                                                padding: '3px 8px',
                                                borderRadius: 6,
                                                color: '#475569',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {quiz.id?.substring(0, 8)}...
                                        </code>
                                    </Tooltip>
                                </div>
                            </Col>
                        </Row>
                    </Card>

                    {/* Questions Table */}
                    {quiz.questions && quiz.questions.length > 0 && (
                        <Card
                            title={
                                <Space>
                                    <QuestionCircleOutlined style={{ color: '#2563eb' }} />
                                    <span style={{ fontWeight: 600 }}>
                                        Danh sách câu hỏi ({quiz.questions.length} câu)
                                    </span>
                                </Space>
                            }
                            style={{
                                borderRadius: 16,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                                border: '1px solid #e2e8f0',
                            }}
                            headStyle={{ borderRadius: '16px 16px 0 0' }}
                        >
                            {/* Skill summary pills */}
                            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                                {Object.entries(SKILL_CONFIG).map(([key, cfg]) => {
                                    const count = quiz.questions.filter((q: any) => q.skillType === key).length;
                                    if (count === 0) return null;
                                    return (
                                        <span
                                            key={key}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                padding: '4px 12px',
                                                borderRadius: 20,
                                                background: `${cfg.color}12`,
                                                border: `1px solid ${cfg.color}30`,
                                                color: cfg.color,
                                                fontWeight: 600,
                                                fontSize: 13,
                                            }}
                                        >
                                            {cfg.icon}
                                            {cfg.label}: {count} câu
                                        </span>
                                    );
                                })}
                            </div>

                            <Table
                                dataSource={quiz.questions}
                                columns={questionColumns}
                                rowKey={(r: any) => `${r.questionOrder}-${r.skillType}`}
                                pagination={false}
                                size="middle"
                                locale={{ emptyText: 'Không có câu hỏi nào' }}
                                rowClassName={(_, index) =>
                                    index % 2 === 0 ? '' : 'quiz-row-alt'
                                }
                            />
                        </Card>
                    )}
                </>
            )}

            <style>{`
                .quiz-row-alt td {
                    background: #f8fafc !important;
                }
            `}</style>
        </div>
    );
};

export default QuizManagementPage;
