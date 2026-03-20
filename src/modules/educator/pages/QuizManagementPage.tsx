import React, { useEffect, useState, useMemo } from 'react';
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
    Button,
    Modal,
    Tabs,
    Form,
    Input,
    InputNumber,
    message,
    Checkbox,
} from 'antd';
import {
    FileTextOutlined,
    ClockCircleOutlined,
    TrophyOutlined,
    QuestionCircleOutlined,
    ReadOutlined,
    SoundOutlined,
    AudioOutlined,
    PlusOutlined,
    BankOutlined,
    EditOutlined,
    SearchOutlined,
    EyeOutlined,
    InfoCircleOutlined,
    ArrowLeftOutlined,
} from '@ant-design/icons';
import { educatorService } from '../services/educatorService';

const { Title, Text } = Typography;
const { Option } = Select;

const SKILL_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    READING: { label: 'Đọc hiểu', color: '#2563eb', icon: <ReadOutlined /> },
    LISTENING: { label: 'Nghe hiểu', color: '#7c3aed', icon: <SoundOutlined /> },
    WRITING: { label: 'Viết', color: '#059669', icon: <EditOutlined /> },
    SPEAKING: { label: 'Nói', color: '#ea580c', icon: <AudioOutlined /> },
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
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [quiz, setQuiz] = useState<any | null>(null);
    const [loadingLevels, setLoadingLevels] = useState(false);
    const [loadingQuiz, setLoadingQuiz] = useState(false);

    // --- State for Adding Challenges ---
    const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
    const [activeSkillType, setActiveSkillType] = useState<string | null>(null);
    const [availableChallenges, setAvailableChallenges] = useState<any[]>([]);
    const [loadingBank, setLoadingBank] = useState(false);
    const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [createForm] = Form.useForm();
    const [submittingCreate, setSubmittingCreate] = useState(false);
    const [submittingAssign, setSubmittingAssign] = useState(false);
    const [updatingQuiz, setUpdatingQuiz] = useState(false);
    const [isEditQuizModalOpen, setIsEditQuizModalOpen] = useState(false);
    const [editQuizForm] = Form.useForm();
    const [isCreateQuizModalOpen, setIsCreateQuizModalOpen] = useState(false);
    const [creatingQuiz, setCreatingQuiz] = useState(false);
    const [newQuizForm] = Form.useForm();

    // --- State for Filtering ---
    const [searchTerm, setSearchTerm] = useState('');
    const [regionFilter, setRegionFilter] = useState<string | null>(null);

    // --- State for Challenge Detail ---
    const [selectedDetailChallenge, setSelectedDetailChallenge] = useState<any | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [bankSearchText, setBankSearchText] = useState('');
    const [quizChallenges, setQuizChallenges] = useState<any[]>([]);
    const [loadingQuizChallenges, setLoadingQuizChallenges] = useState(false);

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

    useEffect(() => {
        const fetchQuizChallenges = async () => {
            if (quiz?.id) {
                setLoadingQuizChallenges(true);
                try {
                    const res: any = await educatorService.getQuizChallenges(quiz.id);
                    setQuizChallenges(res?.data || (Array.isArray(res) ? res : []));
                } catch (e) {
                    console.error("Failed to fetch quiz challenges", e);
                    setQuizChallenges([]);
                } finally {
                    setLoadingQuizChallenges(false);
                }
            } else {
                setQuizChallenges([]);
            }
        };
        fetchQuizChallenges();
    }, [quiz?.id]);

    const handleLevelChange = async (levelId: string) => {
        setSelectedLevelId(levelId);
        setQuiz(null);
        setQuizzes([]);
        setLoadingQuiz(true);
        try {
            const res: any = await educatorService.getQuizzesByLevel(levelId);
            console.log('[QuizManagement] raw response:', res);

            let quizList: any[] = [];
            if (res?.data && Array.isArray(res.data)) {
                quizList = res.data;
            } else if (Array.isArray(res)) {
                quizList = res;
            } else if (res?.data && typeof res.data === 'object') {
                quizList = [res.data];
            } else if (res?.id) {
                quizList = [res];
            }

            console.log('[QuizManagement] quizList resolved:', quizList);

            const formattedQuizzes = quizList.map(quizData => {
                let formatted = { ...quizData };
                if (formatted && (formatted.metadataJson || formatted.itemsJson)) {
                    try {
                        const metadata = typeof formatted.metadataJson === 'string'
                            ? JSON.parse(formatted.metadataJson)
                            : (formatted.metadataJson || {});

                        const items = typeof formatted.itemsJson === 'string'
                            ? JSON.parse(formatted.itemsJson)
                            : (formatted.itemsJson || []);

                        formatted = {
                            ...formatted,
                            ...metadata,
                            questions: items || []
                        };
                    } catch (e) {
                        console.error("Error parsing quiz JSON fields:", e);
                    }
                }
                return formatted;
            });

            setQuizzes(formattedQuizzes);
        } catch (err) {
            console.error('[QuizManagement] fetch error:', err);
            setQuizzes([]);
        } finally {
            setLoadingQuiz(false);
        }
    };

    const fetchBank = async () => {
        setLoadingBank(true);
        try {
            const res: any = await educatorService.getChallengeBank();
            setAvailableChallenges(res?.data || (Array.isArray(res) ? res : []));
        } catch (err) {
            console.error('[QuizManagement] fetch bank error:', err);
            message.error('Không thể tải ngân hàng thử thách');
        } finally {
            setLoadingBank(false);
        }
    };

    const openChallengeModal = (skillType: string) => {
        setActiveSkillType(skillType);
        setIsChallengeModalOpen(true);
        setIsCreatingNew(false);
        setSelectedBankIds([]);
        setBankSearchText(''); // Reset search
        fetchBank();
    };


    const filteredLevels = useMemo(() => {
        return levels.filter(level => {
            const matchesSearch = level.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRegion = !regionFilter || level.dialectId === regionFilter;
            return matchesSearch && matchesRegion;
        });
    }, [levels, searchTerm, regionFilter]);

    const handleBackToChapters = () => {
        if (quiz) {
            setQuiz(null);
        } else {
            setSelectedLevelId(undefined);
            setQuizzes([]);
        }
    };

    const handleOpenEditQuiz = () => {
        if (!quiz) return;

        const qList = Array.isArray(quiz.questions) ? quiz.questions : [];
        const readingCount = qList.filter((q: any) => q.skillType === 'READING').length;
        const listeningCount = qList.filter((q: any) => q.skillType === 'LISTENING').length;
        const speakingCount = qList.filter((q: any) => q.skillType === 'SPEAKING').length;
        const writingCount = qList.filter((q: any) => q.skillType === 'WRITING').length;

        editQuizForm.setFieldsValue({
            title: quiz.name || quiz.title,
            description: quiz.description,
            instructions: quiz.instructions,
            passingScore: quiz.passingScore || 80,
            timeLimitMinutes: quiz.timeLimitMinutes || 15,
            pointsPerQuestion: quiz.pointsPerQuestion || 10,
            readingCount,
            listeningCount,
            speakingCount,
            writingCount,
            comment: quiz.comment,
            difficulty: quiz.difficulty || 'BEGINNER',
        });
        setIsEditQuizModalOpen(true);
    };

    const handleUpdateQuiz = async (values: any) => {
        if (!quiz?.id || !selectedLevelId) return;
        setUpdatingQuiz(true);
        try {
            const readingCount = Number(values.readingCount || 0);
            const listeningCount = Number(values.listeningCount || 0);
            const speakingCount = Number(values.speakingCount || 0);
            const writingCount = Number(values.writingCount || 0);

            // Logic to preserve existing questions but adjust counts
            const currentQuestions = Array.isArray(quiz.questions) ? [...quiz.questions] : [];
            const newQuestions: any[] = [];

            const skills = [
                { type: 'READING', count: readingCount },
                { type: 'LISTENING', count: listeningCount },
                { type: 'SPEAKING', count: speakingCount },
                { type: 'WRITING', count: writingCount }
            ];

            skills.forEach(skill => {
                const existingOfType = currentQuestions.filter(q => q.skillType === skill.type);
                if (existingOfType.length >= skill.count) {
                    // Keep first N existing
                    newQuestions.push(...existingOfType.slice(0, skill.count));
                } else {
                    // Keep all existing and add placeholders
                    newQuestions.push(...existingOfType);
                    const diff = skill.count - existingOfType.length;
                    for (let i = 0; i < diff; i++) {
                        newQuestions.push({
                            skillType: skill.type,
                            difficulty: values.difficulty || 'BEGINNER',
                            points: values.pointsPerQuestion || 10,
                        });
                    }
                }
            });

            const finalQuestions = newQuestions.map((q, idx) => ({
                ...q,
                questionOrder: idx + 1
            }));

            const payload = {
                levelId: selectedLevelId,
                title: values.title,
                description: values.description,
                instructions: values.instructions,
                passingScore: values.passingScore,
                timeLimitMinutes: values.timeLimitMinutes,
                questionCount: finalQuestions.length,
                comment: values.comment || 'Cập nhật quiz',
                questions: finalQuestions
            };

            await educatorService.updateQuiz(quiz.id, payload);
            message.success('Cập nhật quiz thành công');
            setIsEditQuizModalOpen(false);
            handleLevelChange(selectedLevelId);
        } catch (err: any) {
            message.error(err?.message || 'Lỗi khi cập nhật quiz');
        } finally {
            setUpdatingQuiz(false);
        }
    };

    const handleCreateQuiz = async (values: any) => {
        if (!selectedLevelId) return;
        setCreatingQuiz(true);
        try {
            const payload = {
                levelId: selectedLevelId,
                title: values.title,
                description: values.description,
                instructions: values.instructions,
                passingScore: values.passingScore || 80,
                timeLimitMinutes: values.timeLimitMinutes || 15,
                questionCount: 0,
                comment: 'Tạo quiz mới',
                questions: []
            };

            await educatorService.createQuiz(payload);
            message.success('Tạo bài kiểm tra mới thành công');
            setIsCreateQuizModalOpen(false);
            newQuizForm.resetFields();
            handleLevelChange(selectedLevelId);
        } catch (err: any) {
            message.error(err?.message || 'Lỗi khi tạo bài kiểm tra');
        } finally {
            setCreatingQuiz(false);
        }
    };

    const parseMetadata = (challenge: any) => {
        if (!challenge) return challenge;
        let parsed = { ...challenge };
        if (typeof parsed.metadataJson === 'string') {
            try {
                parsed.metadataJson = JSON.parse(parsed.metadataJson);
            } catch (e) {
                console.error('Failed to parse metadataJson:', e);
                parsed.metadataJson = {};
            }
        }
        // Normalize: API may return 'answer' instead of 'correctAnswer'
        if (parsed.metadataJson && parsed.metadataJson.answer && !parsed.metadataJson.correctAnswer) {
            parsed.metadataJson.correctAnswer = parsed.metadataJson.answer;
        }
        return parsed;
    };

    const showDetail = async (record: any, index?: number) => {
        console.log('[showDetail] called with record:', record, 'index:', index);
        if (quiz?.id) {
            try {
                // Resolve detailed information from Bank via Quiz ID API
                const res: any = await educatorService.getQuizChallenges(quiz.id);
                console.log('[showDetail] getQuizChallenges response:', res);

                // Handle both res.data (wrapped) and res (unwrapped) array
                const items = res?.data || (Array.isArray(res) ? res : []);
                console.log('[showDetail] items count:', items.length);

                // Strategy 1: Match by challengeId
                let bankItem = items.find((item: any) =>
                    (record.id && item.challenge?.id === record.id) ||
                    (record.challengeId && item.challenge?.id === record.challengeId)
                );

                // Strategy 2: Match by orderIndex === questionOrder
                if (!bankItem && record.questionOrder != null) {
                    bankItem = items.find((item: any) =>
                        item.orderIndex === record.questionOrder
                    );
                    console.log('[showDetail] matched by orderIndex:', bankItem);
                }

                // Strategy 3: Match by array index position
                if (!bankItem && index != null && index < items.length) {
                    bankItem = items[index];
                    console.log('[showDetail] matched by array index:', bankItem);
                }

                console.log('[showDetail] final bankItem:', bankItem);

                if (bankItem?.challenge) {
                    const parsed = parseMetadata(bankItem.challenge);
                    console.log('[showDetail] parsed challenge:', parsed);
                    setSelectedDetailChallenge(parsed);
                    setIsDetailModalOpen(true);
                    return;
                }
            } catch (err) {
                console.error("Failed to resolve challenge detail:", err);
            }
        }

        // Fallback: use the record directly (also parse metadataJson)
        const parsed = parseMetadata(record);
        setSelectedDetailChallenge(parsed);
        setIsDetailModalOpen(true);
    };


    const handleAssignFromBank = async () => {
        if (!quiz?.id || selectedBankIds.length === 0) return;
        setSubmittingAssign(true);
        try {
            await educatorService.assignChallengesToQuiz(quiz.id, selectedBankIds);
            message.success('Gán câu hỏi vào quiz thành công');
            setIsChallengeModalOpen(false);
            // Refresh quiz data
            if (selectedLevelId) handleLevelChange(selectedLevelId);
        } catch (err) {
            message.error('Gán câu hỏi thất bại');
        } finally {
            setSubmittingAssign(false);
        }
    };

    const handleCreateNewChallenge = async (values: any) => {
        if (!quiz?.id) return;
        setSubmittingCreate(true);
        try {
            let metadataJson: any = {};
            const skill = activeSkillType || values.skillType;

            if (skill === 'READING') {
                metadataJson = {
                    options: values.options ? values.options.split('\n').filter((o: string) => o.trim()) : [],
                    correctAnswer: values.correctAnswer,
                    hint: values.hint || "",
                    imageUrl: values.imageUrl || ""
                };
            } else if (skill === 'LISTENING') {
                metadataJson = {
                    audioUrl: values.audioUrl || "",
                    options: values.options ? values.options.split('\n').filter((o: string) => o.trim()) : [],
                    correctAnswer: values.correctAnswer,
                    transcript: values.transcript || ""
                };
            } else if (skill === 'WRITING') {
                metadataJson = {
                    scrambledWords: values.scrambledWords ? values.scrambledWords.split(/[\n,]+/).map((s: string) => s.trim()).filter(Boolean) : [],
                    correctSentence: values.correctSentence,
                    hint: values.hint || ""
                };
            } else if (skill === 'SPEAKING') {
                metadataJson = {
                    audioUrl: values.audioUrl || "",
                    transcript: values.transcript || "",
                    hint: values.hint || ""
                };
            }

            const payload = {
                contentText: values.contentText,
                skillType: skill,
                difficultyTag: values.difficultyTag,
                isGlobal: values.isGlobal ?? true,
                metadataJson: metadataJson
            };

            const res: any = await educatorService.createChallengeBankItem(payload);
            const newChallengeId = res?.data?.id || res?.id;

            if (newChallengeId) {
                // Auto assign to quiz after creation
                await educatorService.assignChallengesToQuiz(quiz.id, [newChallengeId]);
                message.success('Tạo và gán câu hỏi thành công');
            } else {
                message.success('Tạo câu hỏi thành công');
            }

            setIsChallengeModalOpen(false);
            createForm.resetFields();
            if (selectedLevelId) handleLevelChange(selectedLevelId);
        } catch (err: any) {
            message.error(err?.message || 'Lỗi khi tạo câu hỏi');
        } finally {
            setSubmittingCreate(false);
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
        {
            title: 'Chi tiết',
            key: 'action',
            width: 80,
            align: 'center' as const,
            render: (_: any, record: any, index: number) => {
                let isMapped = false;
                if (quizChallenges && quizChallenges.length > 0) {
                    let bankItem = quizChallenges.find((item: any) =>
                        (record.id && item.challenge?.id === record.id) ||
                        (record.challengeId && item.challenge?.id === record.challengeId)
                    );
                    if (!bankItem && record.questionOrder != null) {
                        bankItem = quizChallenges.find((item: any) =>
                            item.orderIndex === record.questionOrder
                        );
                    }
                    if (!bankItem && index != null && index < quizChallenges.length) {
                        bankItem = quizChallenges[index];
                    }
                    if (bankItem?.challenge) {
                        isMapped = true;
                    }
                }

                if (loadingQuizChallenges) {
                    return <Spin size="small" />;
                }

                if (!isMapped && !record.contentText) {
                    return null;
                }

                return (
                    <Tooltip title="Xem nội dung câu hỏi">
                        <Button
                            type="text"
                            icon={<EyeOutlined style={{ color: '#2563eb' }} />}
                            onClick={() => showDetail(record, index)}
                        />
                    </Tooltip>
                );
            },
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
                    <Title level={2} style={{ margin: 0, fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                        {selectedLevelId && (
                            <Button
                                icon={<ArrowLeftOutlined />}
                                onClick={handleBackToChapters}
                                style={{ marginRight: 16, borderRadius: 10, border: '1.5px solid #e2e8f0' }}
                            />
                        )}
                        <FileTextOutlined style={{ marginRight: 10, color: '#2563eb' }} />
                        Quản Lý Quiz
                    </Title>
                    <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>
                        Xem danh sách quiz và câu hỏi theo từng chương học
                    </Text>
                </div>
            </div>



            {/* Content Area */}
            {!selectedLevelId && !loadingQuiz && (
                <div style={{ padding: '8px 0' }}>
                    <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
                        <div>
                            <Title level={3} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.5px', color: '#1e293b' }}>
                                Khám Phá Các Chương Học
                            </Title>
                            <Text style={{ color: '#64748b', fontSize: 15 }}>
                                Tìm kiếm và chọn một hệ chương trình bên dưới
                            </Text>
                        </div>

                        <Space size={12} className="filter-controls">
                            <Input
                                placeholder="Tìm tên chương..."
                                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                                style={{ width: 260, borderRadius: 12, height: 42 }}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                allowClear
                            />
                            <Select
                                placeholder="Lọc vùng miền"
                                style={{ width: 160, height: 42 }}
                                allowClear
                                onChange={(val) => setRegionFilter(val)}
                                options={[
                                    { value: '7c862590-7985-11ef-93bc-0242ac110002', label: 'Miền Bắc' },
                                    { value: '3c862590-7985-11ef-93bc-0242ac110000', label: 'Miền Nam' },
                                    { value: '5c862590-7985-11ef-93bc-0242ac110001', label: 'Miền Trung' },
                                ]}
                                dropdownStyle={{ borderRadius: 12 }}
                            />
                            <div style={{
                                background: '#eff6ff',
                                padding: '0 20px',
                                borderRadius: 12,
                                border: '1px solid #dbeafe',
                                height: 42,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8
                            }}>
                                <Badge count={filteredLevels.length} color="#2563eb" />
                                <Text strong style={{ color: '#2563eb', fontSize: 13 }}>Chương</Text>
                            </div>
                        </Space>
                    </div>

                    <Row gutter={[24, 24]}>
                        {filteredLevels.length > 0 ? (
                            filteredLevels.map((level) => {
                                const rInfo = getRegionInfo(level.dialectId);
                                return (
                                    <Col xs={24} sm={12} lg={8} xl={6} key={level.id}>
                                        <div
                                            onClick={() => handleLevelChange(level.id)}
                                            className="premium-level-card"
                                        >
                                            <div className="card-accent" style={{ background: rInfo?.color || '#3b82f6' }}></div>

                                            <div className="card-top">
                                                <div className="icon-wrapper" style={{
                                                    background: rInfo ? `${rInfo.bg}` : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                                                    color: rInfo?.color || '#2563eb'
                                                }}>
                                                    <FileTextOutlined style={{ fontSize: 24 }} />
                                                </div>
                                                {rInfo && (
                                                    <div className="region-tag" style={{ border: `1px solid ${rInfo.color}30`, background: `${rInfo.bg}80` }}>
                                                        <span className="dot" style={{ background: rInfo.color }}></span>
                                                        <span style={{ color: rInfo.color, fontWeight: 600 }}>{rInfo.label}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="card-content">
                                                <h3 className="card-title">{level.name}</h3>
                                                <p className="card-desc">
                                                    {level.description || 'Hệ thống bài học và kiểm tra thuộc chương trình này đã sẵn sàng để quản lý.'}
                                                </p>
                                            </div>

                                            <div className="card-footer">
                                                <div className="action-btn">
                                                    <span>Quản lý Quiz</span>
                                                    <div className="arrow">→</div>
                                                </div>
                                            </div>
                                        </div>
                                    </Col>
                                );
                            })
                        ) : (
                            <Col span={24}>
                                <div style={{
                                    padding: '60px 0',
                                    textAlign: 'center',
                                    background: '#f8fafc',
                                    borderRadius: 32,
                                    border: '1.5px dashed #e2e8f0'
                                }}>
                                    <Empty description="Không tìm thấy chương nào khớp với bộ lọc" />
                                </div>
                            </Col>
                        )}
                    </Row>
                </div>
            )}

            {loadingQuiz && (
                <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                    <Spin size="large" tip="Đang tải dữ liệu quiz..." />
                </div>
            )}

            {!loadingQuiz && selectedLevelId && !quiz && quizzes.length === 0 && (
                <div style={{ padding: '60px 0', textAlign: 'center' }}>
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<Text type="secondary">Chương học này chưa có bài kiểm tra nào</Text>}
                    />
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateQuizModalOpen(true)} style={{ marginTop: 16 }}>
                        Tạo bài kiểm tra đầu tiên
                    </Button>
                </div>
            )}

            {!loadingQuiz && selectedLevelId && !quiz && quizzes.length > 0 && (
                <div style={{ padding: '8px 0' }}>
                    <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <Title level={3} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.5px', color: '#1e293b' }}>
                                Danh Sách Bài Kiểm Tra
                            </Title>
                            <Text style={{ color: '#64748b', fontSize: 15 }}>
                                Vui lòng chọn một bài kiểm tra để xem và quản lý chi tiết
                            </Text>
                        </div>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setIsCreateQuizModalOpen(true)}
                            size="large"
                            style={{
                                borderRadius: 8,
                                fontWeight: 600,
                                background: '#1890ff',
                            }}
                        >
                            Tạo bài kiểm tra
                        </Button>
                    </div>

                    <Row gutter={[24, 24]}>
                        {quizzes.map((q) => (
                            <Col xs={24} sm={12} lg={8} xl={6} key={q.id}>
                                <div
                                    onClick={() => setQuiz(q)}
                                    className="premium-level-card"
                                >
                                    <div className="card-accent" style={{ background: '#f59e0b' }}></div>
                                    <div className="card-top">
                                        <div className="icon-wrapper" style={{
                                            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                            color: '#d97706'
                                        }}>
                                            <TrophyOutlined style={{ fontSize: 24 }} />
                                        </div>
                                    </div>

                                    <div className="card-content">
                                        <h3 className="card-title">{q.name || q.title || 'Untitled Quiz'}</h3>
                                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
                                            <Tag color="orange" style={{ margin: 0 }}>
                                                {q.questions?.length ?? q.questionCount ?? 0} câu hỏi
                                            </Tag>
                                            {q.passingScore && (
                                                <Tag color="green" style={{ margin: 0 }}>
                                                    {q.passingScore}% đạt
                                                </Tag>
                                            )}
                                        </div>
                                    </div>

                                    <div className="card-footer">
                                        <div className="action-btn">
                                            <span>Xem chi tiết</span>
                                            <div className="arrow">→</div>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </div>
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
                                    <Tooltip title="Chỉnh sửa thông tin quiz">
                                        <Button
                                            type="text"
                                            icon={<EditOutlined style={{ color: '#2563eb' }} />}
                                            size="small"
                                            style={{ marginLeft: 8 }}
                                            onClick={handleOpenEditQuiz}
                                        />
                                    </Tooltip>
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
                            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                                <Text strong style={{ marginRight: 8 }}>Thêm câu hỏi theo kỹ năng:</Text>
                                {Object.entries(SKILL_CONFIG).map(([key, cfg]) => {
                                    const count = (quiz.questions || []).filter((q: any) => q.skillType === key).length;
                                    return (
                                        <div key={key} style={{ display: 'flex', alignItems: 'center' }}>
                                            <span
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    padding: '6px 14px',
                                                    borderRadius: '20px 0 0 20px',
                                                    background: `${cfg.color}12`,
                                                    border: `1px solid ${cfg.color}30`,
                                                    borderRight: 'none',
                                                    color: cfg.color,
                                                    fontWeight: 600,
                                                    fontSize: 13,
                                                }}
                                            >
                                                {cfg.icon}
                                                {cfg.label}: {count}
                                            </span>
                                            <Tooltip title={`Thêm câu hỏi ${cfg.label}`}>
                                                <Button
                                                    size="small"
                                                    icon={<PlusOutlined />}
                                                    onClick={() => openChallengeModal(key)}
                                                    style={{
                                                        borderRadius: '0 20px 20px 0',
                                                        height: 33,
                                                        background: cfg.color,
                                                        color: '#fff',
                                                        border: `1px solid ${cfg.color}`,
                                                        padding: '0 10px',
                                                    }}
                                                />
                                            </Tooltip>
                                        </div>
                                    );
                                })}
                            </div>

                            <Table
                                dataSource={quiz.questions}
                                columns={questionColumns}
                                rowKey={(r: any) => `${r.questionOrder}-${r.skillType}`}
                                locale={{ emptyText: 'Không có câu hỏi nào' }}
                                rowClassName={(_, index) =>
                                    index % 2 === 0 ? '' : 'quiz-row-alt'
                                }
                            />
                        </Card>
                    )}
                </>
            )}

            <Modal
                title={
                    <Space>
                        <BankOutlined style={{ color: '#2563eb' }} />
                        <span>Thêm câu hỏi cho kỹ năng: {activeSkillType ? SKILL_CONFIG[activeSkillType]?.label : ''}</span>
                    </Space>
                }
                open={isChallengeModalOpen}
                onCancel={() => setIsChallengeModalOpen(false)}
                width={800}
                footer={null}
                centered
                destroyOnClose
            >
                <Tabs
                    activeKey={isCreatingNew ? 'create' : 'bank'}
                    onChange={(key) => setIsCreatingNew(key === 'create')}
                    items={[
                        {
                            key: 'bank',
                            label: (
                                <span>
                                    <BankOutlined /> Chọn từ ngân hàng
                                </span>
                            ),
                            children: (
                                <div style={{ minHeight: 400 }}>
                                    <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
                                        <Input
                                            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                                            placeholder="Tìm kiếm nội dung câu hỏi..."
                                            style={{ borderRadius: 8 }}
                                            value={bankSearchText}
                                            onChange={(e) => setBankSearchText(e.target.value)}
                                        />
                                    </div>
                                    <Table
                                        loading={loadingBank}
                                        dataSource={availableChallenges
                                            .filter(c => c.skillType === activeSkillType)
                                            .filter(c => c.contentText.toLowerCase().includes(bankSearchText.toLowerCase()))
                                        }
                                        rowKey="id"
                                        size="middle"
                                        columns={[
                                            {
                                                title: 'Nội dung',
                                                dataIndex: 'contentText',
                                                key: 'contentText',
                                                render: (text: string) => <Text strong>{text}</Text>
                                            },
                                            {
                                                title: 'Độ khó',
                                                dataIndex: 'difficultyTag',
                                                key: 'difficultyTag',
                                                width: 120,
                                                render: (tag: string) => {
                                                    const cfg = DIFFICULTY_CONFIG[tag] || { label: tag, color: 'default' };
                                                    return <Tag color={cfg.color}>{cfg.label}</Tag>;
                                                }
                                            },
                                            {
                                                title: 'Chi tiết',
                                                key: 'action',
                                                width: 80,
                                                align: 'center' as const,
                                                render: (_: any, record: any) => (
                                                    <Tooltip title="Xem chi tiết câu hỏi">
                                                        <Button
                                                            type="text"
                                                            icon={<EyeOutlined style={{ color: '#2563eb' }} />}
                                                            onClick={() => showDetail(record)}
                                                        />
                                                    </Tooltip>
                                                )
                                            }
                                        ]}
                                        rowSelection={{
                                            type: 'checkbox',
                                            selectedRowKeys: selectedBankIds,
                                            onChange: (keys) => setSelectedBankIds(keys as string[])
                                        }}
                                        pagination={{ pageSize: 5 }}
                                    />
                                    <Divider />
                                    <div style={{ display: 'flex', justifySelf: 'end', gap: 12 }}>
                                        <Button onClick={() => setIsChallengeModalOpen(false)}>Hủy</Button>
                                        <Button
                                            type="primary"
                                            onClick={handleAssignFromBank}
                                            disabled={selectedBankIds.length === 0}
                                            loading={submittingAssign}
                                        >
                                            Xác nhận thêm {selectedBankIds.length > 0 ? `(${selectedBankIds.length})` : ''}
                                        </Button>
                                    </div>
                                </div>
                            )
                        },
                        {
                            key: 'create',
                            label: (
                                <span>
                                    <PlusOutlined /> Tạo câu hỏi mới
                                </span>
                            ),
                            children: (
                                <Form
                                    form={createForm}
                                    layout="vertical"
                                    onFinish={handleCreateNewChallenge}
                                    initialValues={{ difficultyTag: 'BEGINNER', isGlobal: true }}
                                    style={{ marginTop: 16 }}
                                >
                                    <Form.Item
                                        name="contentText"
                                        label={<Text strong>Nội dung câu hỏi / Yêu cầu</Text>}
                                        rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
                                    >
                                        <Input.TextArea rows={2} placeholder="Ví dụ: Tìm từ trái nghĩa với..." style={{ borderRadius: 8 }} />
                                    </Form.Item>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <Form.Item name="difficultyTag" label={<Text strong>Độ khó</Text>}>
                                            <Select>
                                                {Object.entries(DIFFICULTY_CONFIG).map(([k, v]) => (
                                                    <Option key={k} value={k}>{v.label}</Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                        <Form.Item name="isGlobal" label="Dùng chung toàn hệ thống" valuePropName="checked">
                                            <Checkbox defaultChecked>Bật</Checkbox>
                                        </Form.Item>
                                    </div>

                                    <Card size="small" style={{ background: '#f8fafc', borderRadius: 8, marginBottom: 16 }}>
                                        {activeSkillType === 'READING' && (
                                            <>
                                                <Form.Item name="options" label="Các lựa chọn (Mỗi dòng 1 lựa chọn)" rules={[{ required: true }]}>
                                                    <Input.TextArea rows={3} placeholder="Option 1&#10;Option 2" />
                                                </Form.Item>
                                                <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.options !== currentValues.options}>
                                                    {({ getFieldValue }) => {
                                                        const optionsText = getFieldValue('options') || '';
                                                        const parsedOptions = optionsText.split('\n').map((s: string) => s.trim()).filter(Boolean);
                                                        return (
                                                            <Form.Item name="correctAnswer" label="Đáp án đúng" rules={[{ required: true }]}>
                                                                <Select placeholder="Chọn từ các lựa chọn trên">
                                                                    {parsedOptions.map((opt: string, idx: number) => (
                                                                        <Option key={idx} value={opt}>{opt}</Option>
                                                                    ))}
                                                                </Select>
                                                            </Form.Item>
                                                        );
                                                    }}
                                                </Form.Item>
                                                <Form.Item name="hint" label="Gợi ý (Không bắt buộc)">
                                                    <Input placeholder="Gợi ý cho người học..." />
                                                </Form.Item>
                                            </>
                                        )}

                                        {activeSkillType === 'LISTENING' && (
                                            <>
                                                <Form.Item name="audioUrl" label="Link file âm thanh URL" rules={[{ required: true }]}>
                                                    <Input placeholder="https://..." />
                                                </Form.Item>
                                                <Form.Item name="options" label="Các lựa chọn (Mỗi dòng 1 lựa chọn)" rules={[{ required: true }]}>
                                                    <Input.TextArea rows={3} />
                                                </Form.Item>
                                                <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.options !== currentValues.options}>
                                                    {({ getFieldValue }) => {
                                                        const optionsText = getFieldValue('options') || '';
                                                        const parsedOptions = optionsText.split('\n').map((s: string) => s.trim()).filter(Boolean);
                                                        return (
                                                            <Form.Item name="correctAnswer" label="Đáp án đúng" rules={[{ required: true }]}>
                                                                <Select placeholder="Chọn từ danh sách...">
                                                                    {parsedOptions.map((opt: string, idx: number) => (
                                                                        <Option key={idx} value={opt}>{opt}</Option>
                                                                    ))}
                                                                </Select>
                                                            </Form.Item>
                                                        );
                                                    }}
                                                </Form.Item>
                                            </>
                                        )}

                                        {activeSkillType === 'WRITING' && (
                                            <>
                                                <Form.Item name="scrambledWords" label="Các từ bị xáo trộn (Cách nhau bởi dấu phẩy)" rules={[{ required: true }]}>
                                                    <Input.TextArea placeholder="Con, mèo, đang, ngủ" />
                                                </Form.Item>
                                                <Form.Item name="correctSentence" label="Câu hoàn chỉnh đúng" rules={[{ required: true }]}>
                                                    <Input />
                                                </Form.Item>
                                            </>
                                        )}

                                        {activeSkillType === 'SPEAKING' && (
                                            <>
                                                <Form.Item name="transcript" label="Nội dung cần nói" rules={[{ required: true }]}>
                                                    <Input.TextArea />
                                                </Form.Item>
                                                <Form.Item name="audioUrl" label="Link file âm thanh mẫu" rules={[{ required: true }]}>
                                                    <Input />
                                                </Form.Item>
                                            </>
                                        )}
                                    </Card>

                                    <div style={{ textAlign: 'right', marginTop: 16 }}>
                                        <Space>
                                            <Button onClick={() => setIsChallengeModalOpen(false)}>Hủy</Button>
                                            <Button type="primary" htmlType="submit" loading={submittingCreate}>
                                                Lưu và thêm vào quiz
                                            </Button>
                                        </Space>
                                    </div>
                                </Form>
                            )
                        }
                    ]}
                />
            </Modal>

            {/* Detail View Modal (Nested or separate) */}
            <Modal
                title={
                    <Space>
                        <EyeOutlined style={{ color: '#2563eb' }} />
                        <span>Chi tiết câu hỏi</span>
                    </Space>
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
                zIndex={2000} // Ensure it's above the first modal
            >
                {selectedDetailChallenge && (
                    <div style={{ padding: '8px 0' }}>
                        <div style={{ marginBottom: 20 }}>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Yêu cầu câu hỏi:</Text>
                            <Title level={5} style={{ marginTop: 0 }}>{selectedDetailChallenge.contentText}</Title>
                        </div>

                        <div style={{ display: 'flex', gap: 40, marginBottom: 24 }}>
                            <div>
                                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Kỹ năng:</Text>
                                {(() => {
                                    const cfg = SKILL_CONFIG[selectedDetailChallenge.skillType] || { label: selectedDetailChallenge.skillType, color: '#888' };
                                    return <Tag color={cfg.color}>{cfg.label}</Tag>;
                                })()}
                            </div>
                            <div>
                                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Độ khó:</Text>
                                <Tag color={DIFFICULTY_CONFIG[selectedDetailChallenge.difficultyTag]?.color}>{DIFFICULTY_CONFIG[selectedDetailChallenge.difficultyTag]?.label}</Tag>
                            </div>
                            <div>
                                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Phạm vi:</Text>
                                <Tag color={selectedDetailChallenge.isGlobal ? 'green' : 'blue'}>
                                    {selectedDetailChallenge.isGlobal ? 'Hệ thống' : 'Cá nhân'}
                                </Tag>
                            </div>
                        </div>

                        <Divider style={{ margin: '16px 0' }} />

                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <Title level={5} style={{ marginTop: 0, marginBottom: 16, fontSize: 15 }}>
                                <InfoCircleOutlined style={{ marginRight: 8, color: '#2563eb' }} />
                                Cấu trúc dữ liệu ({selectedDetailChallenge.skillType})
                            </Title>

                            {selectedDetailChallenge.skillType === 'READING' && (
                                <>
                                    <div style={{ marginBottom: 16 }}>
                                        <Text strong>Các lựa chọn:</Text>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 8 }}>
                                            {selectedDetailChallenge.metadataJson?.options?.map((opt: string, idx: number) => (
                                                <Tag key={idx} color={opt === selectedDetailChallenge.metadataJson?.correctAnswer ? 'success' : 'default'} style={{ padding: '4px 12px', borderRadius: 6 }}>
                                                    {opt}
                                                </Tag>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <Text strong style={{ display: 'block' }}>Đáp án đúng:</Text>
                                            <Tag color="success" style={{ marginTop: 4 }}>{selectedDetailChallenge.metadataJson?.correctAnswer}</Tag>
                                        </div>
                                        {selectedDetailChallenge.metadataJson?.hint && (
                                            <div>
                                                <Text strong style={{ display: 'block' }}>Gợi ý:</Text>
                                                <Text>{selectedDetailChallenge.metadataJson?.hint}</Text>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {selectedDetailChallenge.skillType === 'LISTENING' && (
                                <>
                                    <div style={{ marginBottom: 16 }}>
                                        <Text strong>File âm thanh:</Text>
                                        <div style={{ marginTop: 8 }}>
                                            <audio controls src={selectedDetailChallenge.metadataJson?.audioUrl} style={{ width: '100%' }} />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: 16 }}>
                                        <Text strong>Các lựa chọn:</Text>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 8 }}>
                                            {selectedDetailChallenge.metadataJson?.options?.map((opt: string, idx: number) => (
                                                <Tag key={idx} color={opt === selectedDetailChallenge.metadataJson?.correctAnswer ? 'success' : 'default'} style={{ padding: '4px 12px', borderRadius: 6 }}>
                                                    {opt}
                                                </Tag>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <Text strong style={{ display: 'block' }}>Đáp án đúng:</Text>
                                            <Tag color="success" style={{ marginTop: 4 }}>{selectedDetailChallenge.metadataJson?.correctAnswer}</Tag>
                                        </div>
                                        {selectedDetailChallenge.metadataJson?.transcript && (
                                            <div>
                                                <Text strong style={{ display: 'block' }}>Transcript:</Text>
                                                <Text italic>{selectedDetailChallenge.metadataJson?.transcript}</Text>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {selectedDetailChallenge.skillType === 'WRITING' && (
                                <>
                                    <div style={{ marginBottom: 16 }}>
                                        <Text strong>Từ ngữ xáo trộn:</Text>
                                        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {selectedDetailChallenge.metadataJson?.scrambledWords?.map((word: string, idx: number) => (
                                                <Tag key={idx} style={{ background: '#fff', border: '1px dashed #d9d9d9' }}>{word}</Tag>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: 16 }}>
                                        <Text strong style={{ display: 'block' }}>Câu hoàn chỉnh:</Text>
                                        <Text type="success" strong style={{ fontSize: 16 }}>{selectedDetailChallenge.metadataJson?.correctSentence}</Text>
                                    </div>
                                </>
                            )}

                            {selectedDetailChallenge.skillType === 'SPEAKING' && (
                                <>
                                    <div style={{ marginBottom: 16 }}>
                                        <Text strong>Âm thanh mẫu:</Text>
                                        <div style={{ marginTop: 8 }}>
                                            <audio controls src={selectedDetailChallenge.metadataJson?.audioUrl} style={{ width: '100%' }} />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: 16 }}>
                                        <Text strong style={{ display: 'block' }}>Nội dung cần nói:</Text>
                                        <Text type="success" strong style={{ fontSize: 16 }}>{selectedDetailChallenge.metadataJson?.transcript}</Text>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Edit Quiz Modal */}
            <Modal
                title={<span style={{ fontWeight: 600 }}>Chỉnh Sửa Quiz</span>}
                open={isEditQuizModalOpen}
                onCancel={() => setIsEditQuizModalOpen(false)}
                onOk={() => editQuizForm.submit()}
                confirmLoading={updatingQuiz}
                okText="Lưu thay đổi"
                width={800}
                centered
            >
                <Form
                    form={editQuizForm}
                    layout="vertical"
                    onFinish={handleUpdateQuiz}
                >
                    <Row gutter={24}>
                        <Col span={12}>
                            <Form.Item
                                label="Tên quiz"
                                name="title"
                                rules={[{ required: true, message: 'Vui lòng nhập tên quiz' }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Độ khó" name="difficulty">
                                <Select
                                    options={[
                                        { value: 'BEGINNER', label: 'Beginner' },
                                        { value: 'INTERMEDIATE', label: 'Intermediate' },
                                        { value: 'ADVANCED', label: 'Advanced' },
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={24}>
                        <Col span={12}>
                            <Form.Item label="Mô tả" name="description">
                                <Input.TextArea rows={2} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Hướng dẫn" name="instructions">
                                <Input.TextArea rows={2} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                            <Form.Item label="Điểm đạt (%)" name="passingScore" style={{ marginBottom: 0 }}>
                                <InputNumber style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item label="Thời gian (phút)" name="timeLimitMinutes" style={{ marginBottom: 0 }}>
                                <InputNumber style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item label="Điểm mỗi câu" name="pointsPerQuestion" style={{ marginBottom: 0 }}>
                                <InputNumber style={{ width: '100%' }} />
                            </Form.Item>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                            <Form.Item label="Số câu Reading" name="readingCount" style={{ marginBottom: 0 }}>
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item label="Số câu Listening" name="listeningCount" style={{ marginBottom: 0 }}>
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item label="Số câu Speaking" name="speakingCount" style={{ marginBottom: 0 }}>
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item label="Số câu Writing" name="writingCount" style={{ marginBottom: 0 }}>
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </div>
                    </div>

                    <Form.Item label="Ghi chú cập nhật" name="comment">
                        <Input placeholder="Lý do chỉnh sửa..." />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={
                    <Space>
                        <PlusOutlined style={{ color: '#2563eb' }} />
                        <span style={{ fontSize: 18, fontWeight: 700 }}>Tạo Bài Kiểm Tra Mới</span>
                    </Space>
                }
                open={isCreateQuizModalOpen}
                onCancel={() => {
                    setIsCreateQuizModalOpen(false);
                    newQuizForm.resetFields();
                }}
                onOk={() => newQuizForm.submit()}
                confirmLoading={creatingQuiz}
                okText="Tạo mới"
                cancelText="Hủy"
                width={700}
                centered
            >
                <Form
                    form={newQuizForm}
                    layout="vertical"
                    onFinish={handleCreateQuiz}
                    initialValues={{
                        passingScore: 80,
                        timeLimitMinutes: 15,
                    }}
                    style={{ marginTop: 20 }}
                >
                    <Form.Item name="title" label={<Text strong>Tên bài kiểm tra</Text>} rules={[{ required: true, message: 'Vui lòng nhập tên bài kiểm tra' }]}>
                        <Input placeholder="Ví dụ: Kiểm tra cuối khóa phát âm" />
                    </Form.Item>
                    <Form.Item name="description" label={<Text strong>Mô tả ngắn</Text>}>
                        <Input.TextArea rows={2} placeholder="Mô tả nội dung bài kiểm tra" />
                    </Form.Item>
                    <Form.Item name="instructions" label={<Text strong>Hướng dẫn cho học viên</Text>}>
                        <Input.TextArea rows={2} placeholder="Nội quy, thời gian, hướng dẫn chi tiết..." />
                    </Form.Item>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Form.Item name="passingScore" label={<Text strong>Điểm cần đạt (%)</Text>} rules={[{ required: true, message: 'Nhập điểm cần đạt' }]}>
                            <InputNumber min={1} max={100} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name="timeLimitMinutes" label={<Text strong>Thời gian làm bài (phút)</Text>} rules={[{ required: true, message: 'Nhập thời gian làm bài' }]}>
                            <InputNumber min={1} max={300} style={{ width: '100%' }} />
                        </Form.Item>
                    </div>
                </Form>
            </Modal>

            <style>{`
                .quiz-row-alt td {
                    background: #f8fafc !important;
                }
                .premium-level-card {
                    background: white;
                    border-radius: 24px;
                    border: 1px solid #f1f5f9;
                    padding: 24px;
                    height: 100%;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }
                .premium-level-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    border-color: transparent;
                }
                .card-accent {
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 100px;
                    height: 4px;
                    border-bottom-left-radius: 4px;
                }
                .card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 24px;
                }
                .icon-wrapper {
                    width: 56px;
                    height: 56px;
                    border-radius: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.4s ease;
                }
                .premium-level-card:hover .icon-wrapper {
                    transform: scale(1.1) rotate(5deg);
                }
                .region-tag {
                    padding: 6px 14px;
                    border-radius: 100px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 12px;
                }
                .dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }
                .card-content {
                    flex: 1;
                }
                .card-title {
                    margin: 0 0 12px 0;
                    font-size: 18px;
                    font-weight: 700;
                    color: #0f172a;
                    line-height: 1.3;
                }
                .card-desc {
                    color: #64748b;
                    font-size: 14px;
                    line-height: 1.6;
                    margin: 0;
                    display: -webkit-box;
                    WebkitLineClamp: 3;
                    WebkitBoxOrient: 'vertical';
                    overflow: hidden;
                }
                .card-footer {
                    margin-top: 24px;
                    padding-top: 20px;
                    border-top: 1px solid #f1f5f9;
                }
                .action-btn {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    color: #2563eb;
                    font-weight: 700;
                    font-size: 14px;
                }
                .arrow {
                    width: 32px;
                    height: 32px;
                    border-radius: 10px;
                    background: #f8fafc;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                    color: #64748b;
                }
                .premium-level-card:hover .arrow {
                    background: #2563eb;
                    color: white;
                    transform: translateX(4px);
                }
            `}</style>
        </div>
    );

};

export default QuizManagementPage;
