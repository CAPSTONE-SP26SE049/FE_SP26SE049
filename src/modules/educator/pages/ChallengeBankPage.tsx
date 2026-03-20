import React, { useEffect, useState, useMemo } from 'react';
import {
    Typography,
    Card,
    Table,
    Tag,
    Space,
    Spin,
    Empty,
    Badge,
    Button,
    Modal,
    Form,
    Input,
    Select,
    Switch,
    message,
    Tooltip,
    Divider
} from 'antd';
import {
    DatabaseOutlined,
    ReadOutlined,
    SoundOutlined,
    AudioOutlined,
    QuestionCircleOutlined,
    PlusOutlined,
    EyeOutlined,
    InfoCircleOutlined,
    PictureOutlined,
    EditOutlined,
    SearchOutlined
} from '@ant-design/icons';
import { educatorService } from '../services/educatorService';
import type { ChallengeBank, ChallengeBankRequest } from '../services/educatorService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const SKILL_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    READING: { label: 'Đọc hiểu', color: '#2563eb', icon: <ReadOutlined /> },
    LISTENING: { label: 'Nghe hiểu', color: '#7c3aed', icon: <SoundOutlined /> },
    WRITING: { label: 'Viết', color: '#059669', icon: <EditOutlined /> },
    SPEAKING: { label: 'Nói', color: '#ea580c', icon: <AudioOutlined /> }
};

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
    BEGINNER: { label: 'Cơ bản', color: 'green' },
    INTERMEDIATE: { label: 'Trung bình', color: 'gold' },
    ADVANCED: { label: 'Nâng cao', color: 'red' },
};

const ChallengeBankPage: React.FC = () => {
    const [challenges, setChallenges] = useState<ChallengeBank[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedChallenge, setSelectedChallenge] = useState<ChallengeBank | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [skillFilter, setSkillFilter] = useState<string | null>(null);
    const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);

    const filteredChallenges = useMemo(() => {
        return challenges.filter(c => {
            const matchesSearch = !searchTerm || c.contentText?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSkill = !skillFilter || c.skillType === skillFilter;
            const matchesDifficulty = !difficultyFilter || c.difficultyTag === difficultyFilter;
            return matchesSearch && matchesSkill && matchesDifficulty;
        });
    }, [challenges, searchTerm, skillFilter, difficultyFilter]);

    // Watch skillType to change form fields dynamically
    const skillType = Form.useWatch('skillType', form);

    const fetchChallenges = async () => {
        setLoading(true);
        try {
            const res: any = await educatorService.getChallengeBank();
            setChallenges(res?.data || (Array.isArray(res) ? res : []));
        } catch (err) {
            console.error("[ChallengeBank] Error fetching:", err);
            message.error("Không thể tải danh sách câu hỏi");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChallenges();
    }, []);

    const handleCreate = async (values: any) => {
        setSubmitting(true);
        try {
            let metadataJson: any = {};

            if (values.skillType === 'READING') {
                metadataJson = {
                    options: values.options ? values.options.split('\n').filter((o: string) => o.trim()) : [],
                    correctAnswer: values.correctAnswer,
                    hint: values.hint || "",
                    imageUrl: values.imageUrl || ""
                };
            } else if (values.skillType === 'LISTENING') {
                metadataJson = {
                    audioUrl: values.audioUrl || "",
                    options: values.options ? values.options.split('\n').filter((o: string) => o.trim()) : [],
                    correctAnswer: values.correctAnswer,
                    transcript: values.transcript || ""
                };
            } else if (values.skillType === 'WRITING') {
                metadataJson = {
                    scrambledWords: values.scrambledWords ? values.scrambledWords.split(/[\n,]+/).map((s: string) => s.trim()).filter(Boolean) : [],
                    correctSentence: values.correctSentence,
                    hint: values.hint || ""
                };
            } else if (values.skillType === 'SPEAKING') {
                metadataJson = {
                    audioUrl: values.audioUrl || "",
                    transcript: values.transcript || "",
                    hint: values.hint || ""
                };
            } else {
                // Fallback for PRONUNCIATION / SPEAKING or others
                metadataJson = { ...values.metadataJson };
            }

            const payload: ChallengeBankRequest = {
                contentText: values.contentText,
                skillType: values.skillType,
                difficultyTag: values.difficultyTag,
                isGlobal: values.isGlobal ?? true,
                metadataJson: metadataJson
            };

            await educatorService.createChallengeBankItem(payload);
            message.success("Tạo câu hỏi thành công");
            setIsModalOpen(false);
            form.resetFields();
            fetchChallenges(); // Refresh list
        } catch (err: any) {
            console.error("[ChallengeBank] Error creating:", err);
            message.error(err?.message || "Lỗi khi tạo câu hỏi");
        } finally {
            setSubmitting(false);
        }
    };

    const showDetail = (record: ChallengeBank) => {
        setSelectedChallenge(record);
        setIsDetailModalOpen(true);
    };

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
            title: 'Nội dung câu hỏi',
            dataIndex: 'contentText',
            key: 'contentText',
            render: (text: string) => (
                <Text strong style={{ fontSize: 14 }}>{text}</Text>
            ),
        },
        {
            title: 'Kỹ năng',
            dataIndex: 'skillType',
            key: 'skillType',
            width: 150,
            render: (skill: string) => {
                const cfg = SKILL_CONFIG[skill] || { label: skill, color: '#888', icon: <QuestionCircleOutlined /> };
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
            dataIndex: 'difficultyTag',
            key: 'difficultyTag',
            width: 120,
            render: (tag: string) => {
                const cfg = DIFFICULTY_CONFIG[tag] || { label: tag, color: 'default' };
                return <Tag color={cfg.color}>{cfg.label}</Tag>;
            },
        },
        {
            title: 'Phạm vi',
            dataIndex: 'isGlobal',
            key: 'isGlobal',
            width: 120,
            render: (isGlobal: boolean) => (
                <Badge
                    status={isGlobal ? 'success' : 'default'}
                    text={isGlobal ? 'Hệ thống' : 'Cá nhân'}
                />
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 100,
            align: 'center' as const,
            render: (_: any, record: ChallengeBank) => (
                <Space>
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="text"
                            icon={<EyeOutlined style={{ color: '#1890ff' }} />}
                            onClick={() => showDetail(record)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        background: '#e6f7ff',
                        padding: '10px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <DatabaseOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                    </div>
                    <div>
                        <Title level={2} style={{ margin: 0, fontSize: 24 }}>Ngân hàng thử thách</Title>
                        <Text type="secondary">Quản lý và tạo câu hỏi cho các bài kiểm tra</Text>
                    </div>
                </div>
                <Button
                    icon={<PlusOutlined />}
                    onClick={() => setIsModalOpen(true)}
                    size="large"
                    style={{
                        borderRadius: 10,
                        height: 48,
                        fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(24, 144, 255, 0.35)',
                        border: 'none',
                        background: 'linear-gradient(90deg, #1890ff, #0076e4)',
                        color: 'white',
                        paddingInline: 24,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                    }}
                >
                    Tạo câu hỏi mới
                </Button>
            </div>

            {/* Filter Row */}
            <div style={{ marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Input
                    placeholder="Tìm kiếm nội dung câu hỏi..."
                    prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                    style={{ width: 320, borderRadius: 10, height: 42 }}
                    allowClear
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <Select
                    placeholder="Lọc theo kỹ năng"
                    allowClear
                    style={{ minWidth: 180, height: 42 }}
                    onChange={val => setSkillFilter(val)}
                >
                    {Object.entries(SKILL_CONFIG).map(([key, cfg]) => (
                        <Select.Option key={key} value={key}>{cfg.label}</Select.Option>
                    ))}
                </Select>
                <Select
                    placeholder="Lọc theo độ khó"
                    allowClear
                    style={{ minWidth: 180, height: 42 }}
                    onChange={val => setDifficultyFilter(val)}
                >
                    {Object.entries(DIFFICULTY_CONFIG).map(([key, cfg]) => (
                        <Select.Option key={key} value={key}>{cfg.label}</Select.Option>
                    ))}
                </Select>
            </div>

            <Card
                style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}
                bodyStyle={{ padding: 0 }}
            >
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px' }}>
                        <Spin size="large" tip="Đang tải dữ liệu..." />
                    </div>
                ) : challenges.length > 0 ? (
                    <Table
                        columns={columns}
                        dataSource={filteredChallenges}
                        rowKey="id"
                        pagination={{
                            pageSize: 10,
                            showTotal: (total) => `Tổng cộng ${total} câu hỏi`,
                            style: { padding: '16px 24px' }
                        }}
                        size="large"
                        style={{ borderRadius: '16px' }}
                    />
                ) : (
                    <div style={{ padding: '60px' }}>
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                                <Space direction="vertical" align="center">
                                    <Text type="secondary" style={{ fontSize: 16 }}>Chưa có câu hỏi nào trong ngân hàng</Text>
                                    <Button type="link" onClick={() => setIsModalOpen(true)}>Bắt đầu tạo câu hỏi đầu tiên</Button>
                                </Space>
                            }
                        />
                    </div>
                )}
            </Card>

            {/* Modal: Create Question */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                        <PlusOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                        <Title level={4} style={{ margin: 0 }}>Thêm câu hỏi mới vào kho</Title>
                    </div>
                }
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    form.resetFields();
                }}
                onOk={() => form.submit()}
                confirmLoading={submitting}
                width={750}
                centered
                okText="Lưu câu hỏi"
                cancelText="Hủy"
                okButtonProps={{
                    style: { height: 40, borderRadius: 8, paddingInline: 24, fontWeight: 600 }
                }}
                cancelButtonProps={{
                    style: { height: 40, borderRadius: 8 }
                }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreate}
                    initialValues={{ skillType: 'READING', difficultyTag: 'BEGINNER', isGlobal: true }}
                    style={{ marginTop: 24 }}
                >
                    <Form.Item
                        name="contentText"
                        label={<Text strong>Tiêu đề bài tập / Yêu cầu</Text>}
                        rules={[{ required: true, message: 'Vui lòng nhập nội dung yêu cầu' }]}
                    >
                        <TextArea
                            rows={2}
                            placeholder="Ví dụ: Chọn từ đúng chính tả để điền vào chỗ trống: 'Con ... đang ăn cỏ'"
                            style={{ borderRadius: 8 }}
                        />
                    </Form.Item>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                        <Form.Item
                            name="skillType"
                            label={<Text strong>Kỹ năng</Text>}
                            rules={[{ required: true }]}
                        >
                            <Select style={{ width: '100%' }}>
                                {Object.entries(SKILL_CONFIG).map(([key, cfg]) => (
                                    <Select.Option key={key} value={key}>
                                        <Space>{cfg.icon} {cfg.label}</Space>
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="difficultyTag"
                            label={<Text strong>Độ khó</Text>}
                            rules={[{ required: true }]}
                        >
                            <Select style={{ width: '100%' }}>
                                {Object.entries(DIFFICULTY_CONFIG).map(([key, cfg]) => (
                                    <Select.Option key={key} value={key}>{cfg.label}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="isGlobal"
                            label={<Text strong>Phạm vi hệ thống</Text>}
                            valuePropName="checked"
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32 }}>
                                <Switch />
                                <Text type="secondary" style={{ fontSize: 12 }}>Bật để dùng chung</Text>
                            </div>
                        </Form.Item>
                    </div>

                    <Card
                        size="small"
                        title={
                            <Space>
                                <InfoCircleOutlined style={{ color: '#1890ff' }} />
                                <span>Cấu trúc câu hỏi cho kỹ năng: {SKILL_CONFIG[skillType]?.label || skillType}</span>
                            </Space>
                        }
                        style={{ marginTop: 8, borderRadius: 12, border: '1px solid #f0f0f0', background: '#fafafa' }}
                    >
                        {/* READING Metadata Fields */}
                        {skillType === 'READING' && (
                            <>
                                <Form.Item
                                    name="options"
                                    label={<Text strong>Các lựa chọn</Text>}
                                    extra="Nhập mỗi lựa chọn trên một dòng mới"
                                    rules={[{ required: true, message: 'Vui lòng nhập các lựa chọn' }]}
                                >
                                    <TextArea rows={4} placeholder="nợn&#10;lợn&#10;lộn" style={{ borderRadius: 8 }} />
                                </Form.Item>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.options !== currentValues.options}>
                                        {({ getFieldValue }) => {
                                            const optionsText = getFieldValue('options') || '';
                                            const parsedOptions = optionsText.split('\n').map((s: string) => s.trim()).filter(Boolean);
                                            return (
                                                <Form.Item
                                                    name="correctAnswer"
                                                    label={<Text strong>Đáp án chính xác</Text>}
                                                    rules={[{ required: true, message: 'Nhập đáp án đúng' }]}
                                                >
                                                    <Select placeholder="Chọn từ danh sách..." style={{ borderRadius: 8 }}>
                                                        {parsedOptions.map((opt: string, idx: number) => (
                                                            <Select.Option key={idx} value={opt}>{opt}</Select.Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            );
                                        }}
                                    </Form.Item>
                                    <Form.Item name="hint" label={<Text strong>Gợi ý</Text>}>
                                        <Input placeholder="Ví dụ: Chú ý âm đầu 'L' hay 'N'" style={{ borderRadius: 8 }} />
                                    </Form.Item>
                                </div>
                                <Form.Item name="imageUrl" label={<Text strong>Hình ảnh minh họa (URL)</Text>}>
                                    <Input placeholder="https://..." prefix={<PictureOutlined />} style={{ borderRadius: 8 }} />
                                </Form.Item>
                            </>
                        )}

                        {/* LISTENING Metadata Fields */}
                        {skillType === 'LISTENING' && (
                            <>
                                <Form.Item
                                    name="audioUrl"
                                    label={<Text strong>Đường dẫn âm thanh (Audio URL)</Text>}
                                    rules={[{ required: true, message: 'Vui lòng nhập link file âm thanh' }]}
                                >
                                    <Input placeholder="https://..." style={{ borderRadius: 8 }} />
                                </Form.Item>
                                <Form.Item
                                    name="options"
                                    label={<Text strong>Các lựa chọn nghe</Text>}
                                    extra="Nhập mỗi lựa chọn trên một dòng mới"
                                    rules={[{ required: true, message: 'Vui lòng nhập các lựa chọn' }]}
                                >
                                    <TextArea rows={3} placeholder="Lúa nếp&#10;Lúa nết&#10;Núa nếp" style={{ borderRadius: 8 }} />
                                </Form.Item>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.options !== currentValues.options}>
                                        {({ getFieldValue }) => {
                                            const optionsText = getFieldValue('options') || '';
                                            const parsedOptions = optionsText.split('\n').map((s: string) => s.trim()).filter(Boolean);
                                            return (
                                                <Form.Item
                                                    name="correctAnswer"
                                                    label={<Text strong>Đáp án chính xác</Text>}
                                                    rules={[{ required: true, message: 'Nhập đáp án đúng' }]}
                                                >
                                                    <Select placeholder="Chọn từ danh sách..." style={{ borderRadius: 8 }}>
                                                        {parsedOptions.map((opt: string, idx: number) => (
                                                            <Select.Option key={idx} value={opt}>{opt}</Select.Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            );
                                        }}
                                    </Form.Item>
                                    <Form.Item name="transcript" label={<Text strong>Bản phiên âm / Lời thoại (Transcript)</Text>}>
                                        <Input placeholder="Lúa nếp là lúa nếp làng" style={{ borderRadius: 8 }} />
                                    </Form.Item>
                                </div>
                            </>
                        )}

                        {/* WRITING Metadata Fields */}
                        {skillType === 'WRITING' && (
                            <>
                                <Form.Item
                                    name="scrambledWords"
                                    label={<Text strong>Các từ bị xáo trộn</Text>}
                                    extra="Nhập các từ cách nhau bởi dấu phẩy hoặc xuống dòng"
                                    rules={[{ required: true, message: 'Nhập các từ xáo trộn' }]}
                                >
                                    <TextArea rows={3} placeholder="Nếp, Lúa, Làng, Là, Nếp, Lúa" style={{ borderRadius: 8 }} />
                                </Form.Item>
                                <Form.Item
                                    name="correctSentence"
                                    label={<Text strong>Câu hoàn chỉnh đúng</Text>}
                                    rules={[{ required: true, message: 'Nhập câu đúng' }]}
                                >
                                    <Input placeholder="Lúa nếp là lúa nếp làng" style={{ borderRadius: 8 }} />
                                </Form.Item>
                                <Form.Item name="hint" label={<Text strong>Gợi ý</Text>}>
                                    <Input placeholder="Gợi ý ngữ cảnh..." style={{ borderRadius: 8 }} />
                                </Form.Item>
                            </>
                        )}

                        {/* SPEAKING Metadata Fields */}
                        {skillType === 'SPEAKING' && (
                            <>
                                <Form.Item
                                    name="audioUrl"
                                    label={<Text strong>Âm thanh mẫu (Reference Audio URL)</Text>}
                                    rules={[{ required: true, message: 'Nhập link âm thanh mẫu' }]}
                                >
                                    <Input placeholder="https://..." prefix={<SoundOutlined />} style={{ borderRadius: 8 }} />
                                </Form.Item>
                                <Form.Item
                                    name="transcript"
                                    label={<Text strong>Nội dung cần nói (Transcript)</Text>}
                                    rules={[{ required: true, message: 'Nhập nội dung cần nói' }]}
                                >
                                    <TextArea rows={2} placeholder="Câu mẫu để học sinh luyện nói" style={{ borderRadius: 8 }} />
                                </Form.Item>
                                <Form.Item name="hint" label={<Text strong>Gợi ý kỹ thuật nói</Text>}>
                                    <Input placeholder="Ví dụ: Chú ý nhấn mạnh vào âm cuối..." style={{ borderRadius: 8 }} />
                                </Form.Item>
                            </>
                        )}
                    </Card>
                </Form>
            </Modal>

            {/* Modal: Detail View */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <EyeOutlined style={{ color: '#1890ff' }} />
                        <span>Chi tiết câu hỏi</span>
                    </div>
                }
                open={isDetailModalOpen}
                onCancel={() => setIsDetailModalOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setIsDetailModalOpen(false)} type="primary" style={{ borderRadius: 6 }}>
                        Đóng
                    </Button>
                ]}
                width={650}
                centered
            >
                {selectedChallenge && (
                    <div style={{ padding: '8px 0' }}>
                        <div style={{ marginBottom: 20 }}>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Yêu cầu câu hỏi:</Text>
                            <Title level={5} style={{ marginTop: 0 }}>{selectedChallenge.contentText}</Title>
                        </div>

                        <div style={{ display: 'flex', gap: 40, marginBottom: 24 }}>
                            <div>
                                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Kỹ năng:</Text>
                                {(() => {
                                    const cfg = SKILL_CONFIG[selectedChallenge.skillType] || { label: selectedChallenge.skillType, color: '#888' };
                                    return <Tag color={cfg.color}>{cfg.label}</Tag>;
                                })()}
                            </div>
                            <div>
                                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Độ khó:</Text>
                                <Tag color={DIFFICULTY_CONFIG[selectedChallenge.difficultyTag]?.color}>{DIFFICULTY_CONFIG[selectedChallenge.difficultyTag]?.label}</Tag>
                            </div>
                            <div>
                                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Phạm vi:</Text>
                                <Tag color={selectedChallenge.isGlobal ? 'green' : 'blue'}>
                                    {selectedChallenge.isGlobal ? 'Hệ thống' : 'Cá nhân'}
                                </Tag>
                            </div>
                        </div>

                        <Divider style={{ margin: '16px 0' }} />

                        <div style={{ background: '#f9f9f9', padding: '16px', borderRadius: '12px', border: '1px solid #eee' }}>
                            <Title level={5} style={{ marginTop: 0, marginBottom: 16, fontSize: 15 }}>
                                <InfoCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                                Chi tiết Metadata ({selectedChallenge.skillType})
                            </Title>

                            {/* READING Details */}
                            {selectedChallenge.skillType === 'READING' && (
                                <>
                                    <div style={{ marginBottom: 16 }}>
                                        <Text strong>Các lựa chọn:</Text>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 8 }}>
                                            {selectedChallenge.metadataJson?.options?.map((opt: string, idx: number) => (
                                                <Tag key={idx} color={opt === selectedChallenge.metadataJson?.correctAnswer ? 'success' : 'default'} style={{ padding: '4px 12px', borderRadius: 6 }}>
                                                    {opt}
                                                </Tag>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <Text strong style={{ display: 'block' }}>Đáp án đúng:</Text>
                                            <Text type="success" strong>{selectedChallenge.metadataJson?.correctAnswer}</Text>
                                        </div>
                                        {selectedChallenge.metadataJson?.hint && (
                                            <div>
                                                <Text strong style={{ display: 'block' }}>Gợi ý:</Text>
                                                <Text>{selectedChallenge.metadataJson?.hint}</Text>
                                            </div>
                                        )}
                                    </div>
                                    {selectedChallenge.metadataJson?.imageUrl && (
                                        <div style={{ marginTop: 16 }}>
                                            <Text strong style={{ display: 'block', marginBottom: 8 }}>Ảnh minh họa:</Text>
                                            <img src={selectedChallenge.metadataJson.imageUrl} style={{ maxWidth: '100%', borderRadius: 8 }} />
                                        </div>
                                    )}
                                </>
                            )}

                            {/* LISTENING Details */}
                            {selectedChallenge.skillType === 'LISTENING' && (
                                <>
                                    <div style={{ marginBottom: 16 }}>
                                        <Text strong>File âm thanh:</Text>
                                        <div style={{ marginTop: 4 }}>
                                            <audio controls src={selectedChallenge.metadataJson?.audioUrl} style={{ width: '100%' }} />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: 16 }}>
                                        <Text strong>Các lựa chọn:</Text>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 8 }}>
                                            {selectedChallenge.metadataJson?.options?.map((opt: string, idx: number) => (
                                                <Tag key={idx} color={opt === selectedChallenge.metadataJson?.correctAnswer ? 'success' : 'default'} style={{ padding: '4px 12px', borderRadius: 6 }}>
                                                    {opt}
                                                </Tag>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <Text strong style={{ display: 'block' }}>Đáp án đúng:</Text>
                                            <Text type="success" strong>{selectedChallenge.metadataJson?.correctAnswer}</Text>
                                        </div>
                                        {selectedChallenge.metadataJson?.transcript && (
                                            <div>
                                                <Text strong style={{ display: 'block' }}>Lời thoại (Transcript):</Text>
                                                <Text italic>{selectedChallenge.metadataJson?.transcript}</Text>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* WRITING Details */}
                            {selectedChallenge.skillType === 'WRITING' && (
                                <>
                                    <div style={{ marginBottom: 16 }}>
                                        <Text strong>Từ ngữ xáo trộn:</Text>
                                        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {selectedChallenge.metadataJson?.scrambledWords?.map((word: string, idx: number) => (
                                                <Tag key={idx} style={{ background: '#fff', border: '1px dashed #d9d9d9' }}>{word}</Tag>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: 16 }}>
                                        <Text strong style={{ display: 'block' }}>Câu hoàn chỉnh:</Text>
                                        <Text type="success" strong style={{ fontSize: 16 }}>{selectedChallenge.metadataJson?.correctSentence}</Text>
                                    </div>
                                    {selectedChallenge.metadataJson?.hint && (
                                        <div>
                                            <Text strong style={{ display: 'block' }}>Gợi ý:</Text>
                                            <Text>{selectedChallenge.metadataJson?.hint}</Text>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* SPEAKING Details */}
                            {selectedChallenge.skillType === 'SPEAKING' && (
                                <>
                                    <div style={{ marginBottom: 16 }}>
                                        <Text strong>Âm thanh mẫu:</Text>
                                        <div style={{ marginTop: 4 }}>
                                            <audio controls src={selectedChallenge.metadataJson?.audioUrl} style={{ width: '100%' }} />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: 16 }}>
                                        <Text strong style={{ display: 'block' }}>Nội dung cần nói:</Text>
                                        <Text type="success" strong style={{ fontSize: 16 }}>{selectedChallenge.metadataJson?.transcript}</Text>
                                    </div>
                                    {selectedChallenge.metadataJson?.hint && (
                                        <div>
                                            <Text strong style={{ display: 'block' }}>Gợi ý:</Text>
                                            <Text>{selectedChallenge.metadataJson?.hint}</Text>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div style={{ marginTop: 20, textAlign: 'right' }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Ngày tạo: {dayjs(selectedChallenge.createdAt).format('DD/MM/YYYY HH:mm')}
                            </Text>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ChallengeBankPage;
