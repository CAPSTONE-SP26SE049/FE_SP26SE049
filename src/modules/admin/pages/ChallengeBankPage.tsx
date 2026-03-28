import React, { useEffect, useState, useMemo } from 'react';
import {
    Typography,
    Card,
    Table,
    Tag,
    Space,
    Spin,
    Empty,
    Button,
    Modal,
    Form,
    Input,
    Select,
    message,
    Tooltip,
    Divider,
    Dropdown,
    Upload,
    Alert
} from 'antd';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../firebase';
import {
    DatabaseOutlined,
    ReadOutlined,
    SoundOutlined,
    AudioOutlined,
    QuestionCircleOutlined,
    PlusOutlined,
    EyeOutlined,
    InfoCircleOutlined,
    EditOutlined,
    SearchOutlined,
    DownloadOutlined,
    UploadOutlined,
    FileExcelOutlined,
    ArrowRightOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import { adminService, type ChallengeBank, type ChallengeBankRequest } from '../services/adminService';
import { excelService, downloadBlob } from '../../educator/services/excelService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const SKILL_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    READING: { label: 'Đọc hiểu', color: '#2563eb', icon: <ReadOutlined /> },
    LISTENING: { label: 'Nghe hiểu', color: '#7c3aed', icon: <SoundOutlined /> },
    WRITING: { label: 'Viết', color: '#059669', icon: <EditOutlined /> },
    SPEAKING: { label: 'Nói', color: '#ea580c', icon: <AudioOutlined /> },
    ENTRY_TEST: { label: 'Kiểm tra đầu vào', color: '#dc2626', icon: <QuestionCircleOutlined /> }
};

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
    BEGINNER: { label: 'Cơ bản', color: 'green' },
    INTERMEDIATE: { label: 'Trung bình', color: 'gold' },
    ADVANCED: { label: 'Nâng cao', color: 'red' },
};

const REGION_CONFIG: Record<string, { label: string; color: string }> = {
    BAC: { label: 'Miền Bắc', color: '#1890ff' },
    TRUNG: { label: 'Miền Trung', color: '#fa8c16' },
    NAM: { label: 'Miền Nam', color: '#52c41a' },
};

const AdminChallengeBankPage: React.FC = () => {
    const [challenges, setChallenges] = useState<ChallengeBank[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedChallenge, setSelectedChallenge] = useState<ChallengeBank | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [audioFile, setAudioFile] = useState<File | null>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [skillFilter, setSkillFilter] = useState<string | null>(null);
    const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);
    const [regionFilter, setRegionFilter] = useState<string | null>(null);

    // Import/Export states
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importSkillType, setImportSkillType] = useState<string>('READING');
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<any>(null);
    const [exporting, setExporting] = useState(false);

    const filteredChallenges = useMemo(() => {
        return challenges.filter(c => {
            const matchesSearch = !searchTerm || c.contentText?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSkill = !skillFilter || c.skillType === skillFilter;
            const matchesDifficulty = !difficultyFilter || c.difficultyTag === difficultyFilter;
            const matchesRegion = !regionFilter || c.region === regionFilter;
            return matchesSearch && matchesSkill && matchesDifficulty && matchesRegion;
        });
    }, [challenges, searchTerm, skillFilter, difficultyFilter, regionFilter]);

    // Watch skillType to change form fields dynamically
    const skillType = Form.useWatch('skillType', form);

    const fetchChallenges = async () => {
        setLoading(true);
        try {
            const res: any = await adminService.getChallengeBank();
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

    const [editingChallengeId, setEditingChallengeId] = useState<string | null>(null);

    const handleSubmit = async (values: any) => {
        setSubmitting(true);
        try {
            let finalAudioUrl = values.audioUrl || "";

            // Handle Audio Upload to Firebase if a new file is selected
            if (audioFile) {
                const storageRef = ref(storage, `challenges/audio/${Date.now()}_${audioFile.name}`);
                const uploadTask = await uploadBytes(storageRef, audioFile);
                finalAudioUrl = await getDownloadURL(uploadTask.ref);
            }

            let metadataJson: any = {};

            if (values.skillType === 'READING') {
                metadataJson = {
                    words: values.words ? values.words.split('|').map((w: string) => w.trim()).filter(Boolean) : [],
                    error_index: values.error_index,
                    correct_word: values.correct_word,
                    hint: values.hint || ""
                };
            } else if (values.skillType === 'LISTENING') {
                metadataJson = {
                    audioUrl: finalAudioUrl,
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
            } else if (values.skillType === 'SPEAKING' || values.skillType === 'ENTRY_TEST') {
                metadataJson = {
                    audioUrl: finalAudioUrl,
                    transcript: values.transcript || "",
                    hint: values.hint || ""
                };
            } else {
                // Fallback
                metadataJson = { ...values.metadataJson };
            }

            const payload: ChallengeBankRequest = {
                contentText: values.contentText,
                skillType: values.skillType,
                difficultyTag: values.difficultyTag,
                region: values.region || 'BAC',
                metadataJson: metadataJson
            };

            if (editingChallengeId) {
                await adminService.updateChallengeBankItem(editingChallengeId, payload);
                message.success("Cập nhật câu hỏi thành công");
            } else {
                await adminService.createChallengeBankItem(payload);
                message.success("Tạo câu hỏi thành công");
            }
            
            setIsModalOpen(false);
            form.resetFields();
            setEditingChallengeId(null);
            setAudioFile(null);
            fetchChallenges(); // Refresh list
        } catch (err: any) {
            console.error("[ChallengeBank] Error saving:", err);
            message.error(err?.message || "Lỗi khi lưu câu hỏi");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (record: ChallengeBank) => {
        setEditingChallengeId(record.id);
        
        let meta = record.metadataJson;
        if (typeof meta === 'string') {
            try { meta = JSON.parse(meta); } catch(e) { meta = {}; }
        }
        meta = meta || {};

        const formVals: any = {
            contentText: record.contentText,
            skillType: record.skillType,
            difficultyTag: record.difficultyTag,
            region: record.region
        };

        if (record.skillType === 'READING') {
            formVals.words = meta.words?.join('|');
            formVals.error_index = meta.error_index;
            formVals.correct_word = meta.correct_word;
            formVals.hint = meta.hint;
        } else if (record.skillType === 'LISTENING') {
            formVals.audioUrl = meta.audioUrl;
            formVals.options = meta.options?.join('\n');
            formVals.correctAnswer = meta.correctAnswer;
            formVals.transcript = meta.transcript;
        } else if (record.skillType === 'WRITING') {
            formVals.scrambledWords = meta.scrambledWords?.join('\n');
            formVals.correctSentence = meta.correctSentence;
            formVals.hint = meta.hint;
        } else if (record.skillType === 'SPEAKING' || record.skillType === 'ENTRY_TEST') {
            formVals.audioUrl = meta.audioUrl;
            formVals.transcript = meta.transcript;
            formVals.hint = meta.hint;
        }

        form.setFieldsValue(formVals);
        setAudioFile(null);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        Modal.confirm({
            title: 'Chắc chắn xóa câu hỏi này?',
            content: 'Hành động này sẽ gỡ câu hỏi khỏi tất cả những quiz đang sử dụng nó và không thể hoàn tác.',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy bỏ',
            onOk: async () => {
                try {
                    await adminService.deleteChallengeBankItem(id);
                    message.success('Đã xóa câu hỏi thành công!');
                    fetchChallenges();
                } catch (error) {
                    message.error('Có lỗi xảy ra khi xóa câu hỏi');
                }
            }
        });
    };

    const showDetail = (record: ChallengeBank) => {
        setSelectedChallenge(record);
        setIsDetailModalOpen(true);
    };

    // ════════════════════════════════════════
    //  IMPORT / EXPORT HANDLERS
    // ════════════════════════════════════════

    const handleDownloadTemplate = async (skillType: string) => {
        try {
            message.loading({ content: 'Đang tải template...', key: 'dl' });
            const blob = await excelService.downloadChallengeTemplate(skillType);
            downloadBlob(blob, `template_${skillType.toLowerCase()}.xlsx`);
            message.success({ content: 'Tải template thành công!', key: 'dl' });
        } catch (err) {
            console.error('[Excel] Download template error:', err);
            message.error({ content: 'Không thể tải template', key: 'dl' });
        }
    };

    const handleExport = async (skillType?: string) => {
        setExporting(true);
        try {
            message.loading({ content: 'Đang xuất dữ liệu...', key: 'exp' });
            const blob = await excelService.exportChallenges(skillType);
            const filename = skillType
                ? `challenge_bank_${skillType.toLowerCase()}.xlsx`
                : 'challenge_bank_all.xlsx';
            downloadBlob(blob, filename);
            message.success({ content: 'Export thành công!', key: 'exp' });
        } catch (err) {
            console.error('[Excel] Export error:', err);
            message.error({ content: 'Không thể export dữ liệu', key: 'exp' });
        } finally {
            setExporting(false);
        }
    };

    const handleImportSubmit = async () => {
        if (!importFile) {
            message.warning('Vui lòng chọn file Excel');
            return;
        }
        setImporting(true);
        setImportResult(null);
        try {
            const res: any = await excelService.importChallenges(importSkillType, importFile);
            setImportResult(res?.data || res);
            message.success('Import hoàn tất!');
            fetchChallenges(); // Refresh list
        } catch (err: any) {
            console.error('[Excel] Import error:', err);
            message.error(err?.response?.data?.message || 'Lỗi khi import');
        } finally {
            setImporting(false);
        }
    };

    const templateMenuItems = Object.entries(SKILL_CONFIG).map(([key, cfg]) => ({
        key: `template-${key}`,
        icon: cfg.icon,
        label: `Template ${cfg.label}`,
        onClick: () => handleDownloadTemplate(key),
    }));

    const exportMenuItems = [
        {
            key: 'export-all',
            icon: <FileExcelOutlined />,
            label: 'Tất cả kỹ năng',
            onClick: () => handleExport(),
        },
        ...Object.entries(SKILL_CONFIG).map(([key, cfg]) => ({
            key: `export-${key}`,
            icon: cfg.icon,
            label: cfg.label,
            onClick: () => handleExport(key),
        })),
    ];

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
            width: 350,
            render: (text: string, record: any) => {
                let meta = record.metadataJson;
                if (typeof meta === 'string') {
                    try {
                        meta = JSON.parse(meta);
                    } catch (e) {
                        meta = {};
                    }
                }
                meta = meta || {};
                const skill = record.skillType;

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                            {text || '—'}
                        </Text>
                        
                        <div style={{ fontSize: 14 }}>
                            {skill === 'READING' && Array.isArray(meta.words) && (
                                <>
                                    <div>
                                        {meta.words.map((w: string, i: number) => (
                                            <span key={i} style={{
                                                color: i === meta.error_index ? '#ef4444' : '#334155',
                                                textDecoration: i === meta.error_index ? 'line-through' : 'none',
                                                fontWeight: i === meta.error_index ? 600 : 400,
                                                marginRight: 4
                                            }}>
                                                {w}
                                            </span>
                                        ))}
                                        {meta.correct_word && (
                                            <Text type="success" strong style={{ marginLeft: 6 }}>
                                                <ArrowRightOutlined style={{ fontSize: 12, marginRight: 6 }} />
                                                {meta.correct_word}
                                            </Text>
                                        )}
                                    </div>
                                </>
                            )}

                            {(skill === 'LISTENING' || skill === 'SPEAKING' || skill === 'ENTRY_TEST') && meta.transcript && (
                                <Text italic style={{ color: '#0f172a' }}>"{meta.transcript}"</Text>
                            )}

                            {skill === 'WRITING' && meta.correctSentence && (
                                <Text strong style={{ color: '#0f172a' }}>{meta.correctSentence}</Text>
                            )}
                        </div>
                    </div>
                );
            },
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
            title: 'Miền',
            dataIndex: 'region',
            key: 'region',
            width: 120,
            render: (region: string) => {
                const cfg = REGION_CONFIG[region] || { label: region || 'Chưa xác định', color: '#999' };
                return <Tag color={cfg.color}>{cfg.label}</Tag>;
            },
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 150,
            align: 'center' as const,
            render: (_: any, record: ChallengeBank) => (
                <Space size="small">
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="text"
                            icon={<EyeOutlined style={{ color: '#1890ff' }} />}
                            onClick={() => showDetail(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            type="text"
                            icon={<EditOutlined style={{ color: '#faad14' }} />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Xóa">
                        <Button
                            type="text"
                            icon={<DeleteOutlined style={{ color: '#ff4d4f' }} />}
                            onClick={() => handleDelete(record.id)}
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
                <Space size={12}>
                    <Dropdown menu={{ items: templateMenuItems }} trigger={['click']} placement="bottomRight">
                        <Button
                            icon={<DownloadOutlined />}
                            size="large"
                            style={{
                                borderRadius: 10,
                                height: 44,
                                fontWeight: 600,
                                border: '1.5px solid #1890ff',
                                color: '#1890ff',
                                paddingInline: 16,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                background: '#e6f7ff',
                            }}
                        >
                            Template
                        </Button>
                    </Dropdown>
                    <Button
                        icon={<UploadOutlined />}
                        size="large"
                        onClick={() => {
                            setImportResult(null);
                            setImportFile(null);
                            setIsImportModalOpen(true);
                        }}
                        style={{
                            borderRadius: 10,
                            height: 44,
                            fontWeight: 600,
                            border: '1.5px solid #52c41a',
                            color: '#52c41a',
                            paddingInline: 16,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            background: '#f6ffed',
                        }}
                    >
                        Import
                    </Button>
                    <Dropdown menu={{ items: exportMenuItems }} trigger={['click']} placement="bottomRight">
                        <Button
                            icon={<FileExcelOutlined />}
                            size="large"
                            loading={exporting}
                            style={{
                                borderRadius: 10,
                                height: 44,
                                fontWeight: 600,
                                border: '1.5px solid #fa8c16',
                                color: '#fa8c16',
                                paddingInline: 16,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                background: '#fff7e6',
                            }}
                        >
                            Export
                        </Button>
                    </Dropdown>
                    <Button
                        icon={<PlusOutlined />}
                        onClick={() => setIsModalOpen(true)}
                        size="large"
                        style={{
                            borderRadius: 10,
                            height: 44,
                            fontWeight: 600,
                            boxShadow: '0 4px 12px rgba(24, 144, 255, 0.35)',
                            border: 'none',
                            background: 'linear-gradient(90deg, #1890ff, #0076e4)',
                            color: 'white',
                            paddingInline: 20,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                        }}
                    >
                        Tạo câu hỏi mới
                    </Button>
                </Space>
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
                <Select
                    placeholder="Lọc theo miền"
                    allowClear
                    style={{ minWidth: 160, height: 42 }}
                    onChange={val => setRegionFilter(val)}
                >
                    {Object.entries(REGION_CONFIG).map(([key, cfg]) => (
                        <Select.Option key={key} value={key}>{cfg.label}</Select.Option>
                    ))}
                </Select>
            </div>

            <Card
                style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}
                styles={{ body: { padding: 0 } }}
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
                        scroll={{ x: 'max-content' }}
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

            {/* Modal: Create/Edit Question */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                        {editingChallengeId ? <EditOutlined style={{ color: '#faad14', fontSize: 20 }} /> : <PlusOutlined style={{ color: '#1890ff', fontSize: 20 }} />}
                        <Title level={4} style={{ margin: 0 }}>
                            {editingChallengeId ? 'Cập nhật câu hỏi' : 'Thêm câu hỏi mới vào kho'}
                        </Title>
                    </div>
                }
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    form.resetFields();
                    setEditingChallengeId(null);
                }}
                onOk={() => form.submit()}
                confirmLoading={submitting}
                width={750}
                centered
                okText={editingChallengeId ? "Lưu cập nhật" : "Thêm mới"}
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
                    onFinish={handleSubmit}
                initialValues={{ skillType: 'READING', difficultyTag: 'BEGINNER', region: 'BAC' }}
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
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
                            name="region"
                            label={<Text strong>Miền</Text>}
                            rules={[{ required: true, message: 'Vui lòng chọn miền' }]}
                        >
                            <Select style={{ width: '100%' }}>
                                {Object.entries(REGION_CONFIG).map(([key, cfg]) => (
                                    <Select.Option key={key} value={key}>{cfg.label}</Select.Option>
                                ))}
                            </Select>
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
                                    name="words"
                                    label={<Text strong>Các từ trong câu (phân cách bằng |)</Text>}
                                    extra="Nhập các từ, phân cách bởi dấu | (Ví dụ: Ông|lội|kể|chuyện)"
                                    rules={[{ required: true, message: 'Vui lòng nhập các từ trong câu' }]}
                                >
                                    <TextArea rows={2} placeholder="Con|lai|kia|chạy|lên|nương" style={{ borderRadius: 8 }} />
                                </Form.Item>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.words !== currentValues.words}>
                                        {({ getFieldValue }) => {
                                            const wordsText = getFieldValue('words') || '';
                                            const parsedWords = wordsText.split('|').map((s: string) => s.trim()).filter(Boolean);
                                            return (
                                                <Form.Item
                                                    name="error_index"
                                                    label={<Text strong>Từ bị viết sai</Text>}
                                                    rules={[{ required: true, message: 'Chọn từ bị sai' }]}
                                                >
                                                    <Select placeholder="Chọn từ bị sai..." style={{ borderRadius: 8 }}>
                                                        {parsedWords.map((word: string, idx: number) => (
                                                            <Select.Option key={idx} value={idx}>{word}</Select.Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            );
                                        }}
                                    </Form.Item>
                                    <Form.Item
                                        name="correct_word"
                                        label={<Text strong>Từ viết đúng</Text>}
                                        rules={[{ required: true, message: 'Nhập từ viết đúng' }]}
                                    >
                                        <Input placeholder="Ví dụ: nai" style={{ borderRadius: 8 }} />
                                    </Form.Item>
                                </div>
                                <Form.Item name="hint" label={<Text strong>Gợi ý</Text>}>
                                    <Input placeholder="Ví dụ: Chú ý âm đầu L/N, lai -> nai" style={{ borderRadius: 8 }} />
                                </Form.Item>
                            </>
                        )}

                        {/* LISTENING Metadata Fields */}
                        {skillType === 'LISTENING' && (
                            <>
                                <Form.Item
                                    label={<Text strong>Âm thanh bài nghe</Text>}
                                    required={!editingChallengeId}
                                >
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                        <Upload
                                            accept="audio/*"
                                            maxCount={1}
                                            beforeUpload={(file) => {
                                                setAudioFile(file);
                                                return false;
                                            }}
                                            onRemove={() => setAudioFile(null)}
                                            fileList={audioFile ? [audioFile as any] : []}
                                        >
                                            <Button icon={<UploadOutlined />}>Chọn file âm thanh</Button>
                                        </Upload>
                                        
                                        <Form.Item name="audioUrl" noStyle>
                                            <Input hidden />
                                        </Form.Item>

                                        {(audioFile || form.getFieldValue('audioUrl')) && (
                                            <div style={{ marginTop: 8, padding: 8, background: '#f0f2f5', borderRadius: 8 }}>
                                                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                                                    Xem trước âm thanh:
                                                </Text>
                                                <audio 
                                                    controls 
                                                    src={audioFile ? URL.createObjectURL(audioFile) : form.getFieldValue('audioUrl')} 
                                                    style={{ width: '100%', height: 32 }} 
                                                />
                                            </div>
                                        )}
                                    </Space>
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
                                    <Form.Item
                                        name="correctAnswer"
                                        label={<Text strong>Đáp án chính xác</Text>}
                                        rules={[{ required: true, message: 'Nhập đáp án đúng' }]}
                                    >
                                        <Input placeholder="Nhập đáp án đúng" style={{ borderRadius: 8 }} />
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

                        {/* SPEAKING & ENTRY_TEST Metadata Fields */}
                        {(skillType === 'SPEAKING' || skillType === 'ENTRY_TEST') && (
                            <>
                                <Form.Item
                                    label={<Text strong>Âm thanh mẫu</Text>}
                                    required={!editingChallengeId}
                                >
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                        <Upload
                                            accept="audio/*"
                                            maxCount={1}
                                            beforeUpload={(file) => {
                                                setAudioFile(file);
                                                return false;
                                            }}
                                            onRemove={() => setAudioFile(null)}
                                            fileList={audioFile ? [audioFile as any] : []}
                                        >
                                            <Button icon={<UploadOutlined />}>Chọn file âm thanh mẫu</Button>
                                        </Upload>

                                        <Form.Item name="audioUrl" noStyle>
                                            <Input hidden />
                                        </Form.Item>

                                        {(audioFile || form.getFieldValue('audioUrl')) && (
                                            <div style={{ marginTop: 8, padding: 8, background: '#f0f2f5', borderRadius: 8 }}>
                                                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                                                    Nghe thử:
                                                </Text>
                                                <audio 
                                                    controls 
                                                    src={audioFile ? URL.createObjectURL(audioFile) : form.getFieldValue('audioUrl')} 
                                                    style={{ width: '100%', height: 32 }} 
                                                />
                                            </div>
                                        )}
                                    </Space>
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
                        </div>

                        <Divider style={{ margin: '16px 0' }} />

                        <div style={{ background: '#f9f9f9', padding: '16px', borderRadius: '12px', border: '1px solid #eee' }}>
                            <Title level={5} style={{ marginTop: 0, marginBottom: 16, fontSize: 15 }}>
                                <InfoCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                                Chi tiết Metadata ({selectedChallenge.skillType})
                            </Title>

                            {/* SPEAKING & ENTRY_TEST Details */}
                            {(selectedChallenge.skillType === 'SPEAKING' || selectedChallenge.skillType === 'ENTRY_TEST') && (
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

                            {/* READING Details */}
                            {selectedChallenge.skillType === 'READING' && (
                                <>
                                    <div style={{ marginBottom: 16 }}>
                                        <Text strong>Các từ trong câu (phân cách bằng |):</Text>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 8 }}>
                                            {selectedChallenge.metadataJson?.words?.map((word: string, idx: number) => (
                                                <Tag key={idx} color={idx === selectedChallenge.metadataJson?.error_index ? 'error' : 'default'} style={{ padding: '4px 12px', borderRadius: 6 }}>
                                                    {word}
                                                </Tag>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <Text strong style={{ display: 'block' }}>Từ viết đúng:</Text>
                                            <Text type="success" strong style={{ fontSize: 16 }}>{selectedChallenge.metadataJson?.correct_word}</Text>
                                        </div>
                                        {selectedChallenge.metadataJson?.hint && (
                                            <div>
                                                <Text strong style={{ display: 'block' }}>Gợi ý:</Text>
                                                <Text>{selectedChallenge.metadataJson?.hint}</Text>
                                            </div>
                                        )}
                                    </div>
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


                        </div>

                        <div style={{ marginTop: 20, textAlign: 'right' }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Ngày tạo: {dayjs(selectedChallenge.createdAt).format('DD/MM/YYYY HH:mm')}
                            </Text>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal: Import Excel */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                        <UploadOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                        <Typography.Title level={4} style={{ margin: 0 }}>Import câu hỏi từ Excel</Typography.Title>
                    </div>
                }
                open={isImportModalOpen}
                onCancel={() => {
                    setIsImportModalOpen(false);
                    setImportResult(null);
                    setImportFile(null);
                }}
                onOk={handleImportSubmit}
                confirmLoading={importing}
                okText="Import"
                cancelText="Hủy"
                okButtonProps={{
                    disabled: !importFile,
                    icon: <UploadOutlined />,
                    style: { height: 40, borderRadius: 8, paddingInline: 24, fontWeight: 600, background: '#52c41a', border: 'none' }
                }}
                cancelButtonProps={{ style: { height: 40, borderRadius: 8 } }}
                width={600}
                centered
            >
                <div style={{ marginTop: 20 }}>
                    {/* Step 1: Chọn kỹ năng */}
                    <div style={{ marginBottom: 20 }}>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>1. Chọn kỹ năng</Text>
                        <Select
                            value={importSkillType}
                            onChange={val => setImportSkillType(val)}
                            style={{ width: '100%' }}
                            size="large"
                        >
                            {Object.entries(SKILL_CONFIG).map(([key, cfg]) => (
                                <Select.Option key={key} value={key}>
                                    <Space>{cfg.icon} {cfg.label}</Space>
                                </Select.Option>
                            ))}
                        </Select>
                    </div>

                    {/* Step 2: Download template */}
                    <div style={{ marginBottom: 20 }}>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>2. Tải template mẫu</Text>
                        <Button
                            icon={<DownloadOutlined />}
                            onClick={() => handleDownloadTemplate(importSkillType)}
                            style={{ borderRadius: 8, borderColor: '#1890ff', color: '#1890ff' }}
                        >
                            Tải template {SKILL_CONFIG[importSkillType]?.label}
                        </Button>
                        <Text type="secondary" style={{ display: 'block', marginTop: 6, fontSize: 12 }}>
                            Tải file mẫu, điền dữ liệu theo hướng dẫn, rồi upload ở bước 3
                        </Text>
                    </div>

                    {/* Step 3: Upload file */}
                    <div style={{ marginBottom: 20 }}>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>3. Upload file Excel đã điền</Text>
                        <Upload.Dragger
                            accept=".xlsx,.xls"
                            maxCount={1}
                            beforeUpload={(file) => {
                                setImportFile(file);
                                return false; // prevent auto upload
                            }}
                            onRemove={() => setImportFile(null)}
                            fileList={importFile ? [{ uid: '-1', name: importFile.name, status: 'done' } as any] : []}
                            style={{ borderRadius: 12, borderColor: '#52c41a' }}
                        >
                            <p style={{ fontSize: 32, color: '#52c41a', marginBottom: 8 }}>
                                <FileExcelOutlined />
                            </p>
                            <p style={{ fontWeight: 600 }}>Kéo thả file hoặc click để chọn</p>
                            <p style={{ color: '#999', fontSize: 12 }}>Chỉ hỗ trợ file .xlsx, .xls</p>
                        </Upload.Dragger>
                    </div>

                    {/* Import Result */}
                    {importResult && (
                        <div style={{ marginTop: 16 }}>
                            <Alert
                                type={importResult.errorCount > 0 ? 'warning' : 'success'}
                                message={`Thành công: ${importResult.successCount} | Bỏ qua: ${importResult.skipCount} | Lỗi: ${importResult.errorCount}`}
                                description={
                                    importResult.messages?.length > 0 && (
                                        <ul style={{ margin: '8px 0 0', paddingLeft: 20, maxHeight: 150, overflow: 'auto' }}>
                                            {importResult.messages.map((msg: string, idx: number) => (
                                                <li key={idx} style={{ fontSize: 12, color: msg.includes('Lỗi') ? '#ff4d4f' : msg.includes('bỏ qua') ? '#faad14' : '#52c41a' }}>
                                                    {msg}
                                                </li>
                                            ))}
                                        </ul>
                                    )
                                }
                                showIcon
                                style={{ borderRadius: 10 }}
                            />
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default AdminChallengeBankPage;
