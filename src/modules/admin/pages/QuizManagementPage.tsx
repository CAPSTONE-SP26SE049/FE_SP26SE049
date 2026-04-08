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
    Upload,
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
    DownloadOutlined,
    UploadOutlined,
    ExportOutlined,
    DeleteOutlined,
    MinusCircleOutlined
} from '@ant-design/icons';
import { adminService } from '../services/adminService';
import { excelService, downloadBlob } from '../../educator/services/excelService';
import { uploadToCloudinary } from '../../../services/cloudinaryService';
import { synthesizeSpeechFPT, waitForAudioLink } from '../../../services/ttsService';
import { useParams, useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

const SKILL_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    READING: { label: 'Đọc hiểu', color: '#2563eb', icon: <ReadOutlined /> },
    LISTENING: { label: 'Nghe hiểu', color: '#7c3aed', icon: <SoundOutlined /> },
    WRITING: { label: 'Viết', color: '#059669', icon: <EditOutlined /> },
    SPEAKING: { label: 'Nói', color: '#ea580c', icon: <AudioOutlined /> },
};




const REGION_LABEL: Record<string, { label: string; color: string; bg: string }> = {
    NORTH: { label: 'Miền Bắc', color: '#1d4ed8', bg: '#dbeafe' },
    SOUTH: { label: 'Miền Nam', color: '#15803d', bg: '#dcfce7' },
    CENTRAL: { label: 'Miền Trung', color: '#b45309', bg: '#fef3c7' },
};

interface BatchQuestion {
    tempId: string;
    id: string; // The Bank Item ID
    relationId: string; // The specific QuizChallenge ID
    isExisting: boolean;
    skillType: string;
    difficultyTag: string;
    contentText: string;
    // READING (Error Correction)
    fullSentence: string;
    wrongWord: string;
    correctWord: string;
    // LISTENING
    audioUrl: string;
    options: string[];
    correctAnswer: string;
    transcript: string;
    // WRITING (Fill in blank)
    blankSentence: string;
    alternatives: string;
    // HELPERS
    hint: string;
    words?: string;
}

const AdminQuizManagementPage: React.FC = () => {
    const { levelId: urlLevelId } = useParams<{ levelId: string }>();
    const navigate = useNavigate();
    const [levels, setLevels] = useState<any[]>([]);
    const [dialects, setDialects] = useState<any[]>([]);
    const [selectedLevelId, setSelectedLevelId] = useState<string | undefined>(urlLevelId);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [quiz, setQuiz] = useState<any | null>(null);
    const [loadingQuiz, setLoadingQuiz] = useState(false);

    // Auto-load quiz when opened with levelId from URL
    React.useEffect(() => {
        if (urlLevelId) {
            setSelectedLevelId(urlLevelId);
        }
    }, [urlLevelId]);

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
    const [quizSearchTerm, setQuizSearchTerm] = useState('');
    const [quizSkillFilter, setQuizSkillFilter] = useState<string | null>(null);

    // --- State for Challenge Detail ---
    const [selectedDetailChallenge, setSelectedDetailChallenge] = useState<any | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [bankSearchText, setBankSearchText] = useState('');

    // --- Import/Export State (Quiz CSV) ---
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);
    const [quizChallenges, setQuizChallenges] = useState<any[]>([]);
    const [loadingQuizChallenges, setLoadingQuizChallenges] = useState(false);
    const [uploadingSingle, setUploadingSingle] = useState(false);
    const [uploadingBatch, setUploadingBatch] = useState<Record<string, boolean>>({});

    // --- TTS Handlers ---
    const handleAutoGenerateAudioSingle = async () => {
        const transcript = createForm.getFieldValue('transcript');
        if (!transcript) {
            message.warning('Vui lòng nhập nội dung Transcript trước!');
            return;
        }
        setUploadingSingle(true);
        const ttsKey = 'tts_single';
        try {
            message.loading({ content: 'Đang tạo giọng đọc AI...', key: ttsKey });
            const fptUrl = await synthesizeSpeechFPT(transcript);
            let readyUrl = await waitForAudioLink(fptUrl);
            if (readyUrl && !readyUrl.startsWith('http')) {
                readyUrl = 'https://' + readyUrl;
            }
            const cloudinaryUrl = await uploadToCloudinary(readyUrl, 'video');
            createForm.setFieldsValue({ audioUrl: cloudinaryUrl });
            message.success({ content: 'Tạo giọng đọc AI thành công!', key: ttsKey });
        } catch (err: any) {
            message.error({ content: err?.message || 'Lỗi khi tạo giọng đọc', key: ttsKey });
        } finally {
            setUploadingSingle(false);
        }
    };

    const handleAutoGenerateAudioBatch = async (tempId: string) => {
        const q = batchQuestions.find(i => i.tempId === tempId);
        if (!q || !q.transcript) {
            message.warning('Vui lòng nhập Transcript trước!');
            return;
        }
        setUploadingBatch(prev => ({ ...prev, [tempId]: true }));
        const ttsKey = `tts_${tempId}`;
        try {
            message.loading({ content: 'Đang tạo giọng đọc AI...', key: ttsKey });
            const fptUrl = await synthesizeSpeechFPT(q.transcript);
            let readyUrl = await waitForAudioLink(fptUrl);
            if (readyUrl && !readyUrl.startsWith('http')) {
                readyUrl = 'https://' + readyUrl;
            }
            const cloudinaryUrl = await uploadToCloudinary(readyUrl, 'video');
            updateBatchQuestionField(tempId, 'audioUrl', cloudinaryUrl);
            message.success({ content: 'Tạo giọng đọc AI thành công!', key: ttsKey });
        } catch (err: any) {
            message.error({ content: err?.message || 'Lỗi khi tạo giọng đọc', key: ttsKey });
        } finally {
            setUploadingBatch(prev => ({ ...prev, [tempId]: false }));
        }
    };

    // Filtered/Merged questions to ensure we always show the latest data from quizChallenges (detailed) 
    // over quiz.questions (metadata placeholder)
    const displayQuestions = useMemo(() => {
        if (!loadingQuizChallenges && quizChallenges && quizChallenges.length > 0) {
            return quizChallenges.map(qc => ({
                ...qc,                   // Root mapping data (orderIndex, points)
                ...qc.challenge,         // Flattened challenge data
                questionOrder: qc.orderIndex,
                difficulty: qc.challenge?.difficultyTag || qc.challenge?.difficulty,
                id: qc.challenge?.id || qc.id, // Ensure we have the challenge ID for bank updates
                relationId: qc.id              // Preserve the unique QuizChallenge relation ID
            }));
        }
        return quiz?.questions || [];
    }, [quizChallenges, quiz?.questions, loadingQuizChallenges]);

    // --- Import Challenges Excel to Quiz State ---
    const [isImportChallengesModalOpen, setIsImportChallengesModalOpen] = useState(false);
    const [importChallengesFile, setImportChallengesFile] = useState<File | null>(null);
    const [importingChallenges, setImportingChallenges] = useState(false);
    const [importChallengesSkillType, setImportChallengesSkillType] = useState<string>('MIXED');
    const [importChallengesResult, setImportChallengesResult] = useState<any | null>(null);

    const [editingChallengeId, setEditingChallengeId] = useState<string | null>(null);

    // --- Batch Manual Questions State (Kahoot style) ---
    const [isBatchQuestionsModalOpen, setIsBatchQuestionsModalOpen] = useState(false);
    const [submittingBatchQuestions, setSubmittingBatchQuestions] = useState(false);
    // --- Achievement Assignment State ---
    const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
    const [rewards, setRewards] = useState<any[]>([]);
    const [loadingRewards, setLoadingRewards] = useState(false);
    const [submittingReward, setSubmittingReward] = useState(false);
    const [batchQuestions, setBatchQuestions] = useState<BatchQuestion[]>([]);

    useEffect(() => {
        const fetchLevels = async () => {
            try {
                const res: any = await adminService.getLevelsForSelection();
                setLevels(res?.data || (Array.isArray(res) ? res : []));
            } catch {
                setLevels([]);
            }
        };

        const fetchDialects = async () => {
            try {
                const res: any = await adminService.getDialects();
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
                    const res: any = await adminService.getQuizChallenges(quiz.id);
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
            const res: any = await adminService.getQuizzesByLevel(levelId);
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

    // Auto-load quizzes when navigated with levelId from URL
    useEffect(() => {
        if (urlLevelId) {
            handleLevelChange(urlLevelId);
        }
    }, [urlLevelId]);

    const handleBackToChapters = () => {
        if (urlLevelId) {
            // Came from chapter page via URL – go back there
            navigate('/admin/chapters');
        } else {
            // Inline navigation – just reset state
            setSelectedLevelId(undefined);
            setQuiz(null);
            setQuizzes([]);
        }
    };

    const fetchBank = async () => {
        setLoadingBank(true);
        try {
            const res: any = await adminService.getChallengeBank();
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
            questionCount: quiz.questionCount || 10,
            secondsPerQuestion: Math.round((quiz.timeLimitSeconds || 900) / (quiz.questionCount || 10)),
            pointsPerQuestion: quiz.pointsPerQuestion || 10,
            readingCount,
            listeningCount,
            speakingCount,
            writingCount,
            comment: quiz.comment,
            difficulty: quiz.difficulty || 'BEGINNER',
            skillType: quiz.skillType || 'MIXED',
            orderIndex: quiz.orderIndex || 1,
        });
        setIsEditQuizModalOpen(true);
    };

    const handleUpdateQuiz = async (values: any) => {
        if (!quiz?.id || !selectedLevelId) return;
        setUpdatingQuiz(true);
        try {
            // Always sync question counts from current quiz data (read-only in UI)
            const currentQuestions = Array.isArray(quiz.questions) ? [...quiz.questions] : [];
            const readingCount = currentQuestions.filter((q: any) => q.skillType === 'READING').length;
            const listeningCount = currentQuestions.filter((q: any) => q.skillType === 'LISTENING').length;
            const speakingCount = currentQuestions.filter((q: any) => q.skillType === 'SPEAKING').length;
            const writingCount = currentQuestions.filter((q: any) => q.skillType === 'WRITING').length;

            // Logic to preserve existing questions but adjust counts
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
                passingScore: quiz.passingScore || 80,
                timeLimitSeconds: (quiz.questionCount || 10) * (values.secondsPerQuestion || 90),
                skillType: values.skillType,
                questionCount: quiz.questionCount || 10,
                comment: values.comment || 'Cập nhật quiz',
                orderIndex: values.orderIndex,
                questions: finalQuestions
            };

            await adminService.updateQuiz(quiz.id, payload);
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
                passingScore: 80,
                timeLimitSeconds: 10 * (values.secondsPerQuestion || 90),
                skillType: values.skillType || 'MIXED',
                questionCount: 10,
                comment: 'Tạo quiz mới',
                questions: []
            };

            await adminService.createQuiz(payload);
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
                const res: any = await adminService.getQuizChallenges(quiz.id);
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
            await adminService.assignChallengesToQuiz(quiz.id, selectedBankIds);
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

    const handleEditQuestion = async (record: any, index?: number) => {
        const parsed = parseMetadata(record);
        let challengeIdToModify = parsed.id;

        // Find inside quizChallenges
        if (quizChallenges && quizChallenges.length > 0) {
            let bankItem = quizChallenges.find((item: any) =>
                (parsed.id && item.challenge?.id === parsed.id) ||
                (parsed.challengeId && item.challenge?.id === parsed.challengeId)
            );
            if (!bankItem && parsed.questionOrder != null) {
                bankItem = quizChallenges.find((item: any) =>
                    item.orderIndex === parsed.questionOrder
                );
            }
            if (!bankItem && index != null && index < quizChallenges.length) {
                bankItem = quizChallenges[index];
            }
            if (bankItem?.challenge) {
                challengeIdToModify = bankItem.challenge.id;

                const meta = parseMetadata(bankItem.challenge).metadataJson || {};
                const formVals: any = {
                    contentText: bankItem.challenge.contentText,
                    difficultyTag: bankItem.challenge.difficultyTag || 'BEGINNER',
                };

                const skill = bankItem.challenge.skillType;
                if (skill === 'READING') {
                    formVals.fullSentence = meta.words?.join(' ');
                    formVals.wrongWord = (meta.words && meta.error_index != null) ? meta.words[meta.error_index] : '';
                    formVals.correctWord = meta.correct_word || meta.correctWord;
                    formVals.hint = meta.hint;
                } else if (skill === 'LISTENING') {
                    formVals.audioUrl = meta.audioUrl;
                    formVals.options = meta.options?.join('\n');
                    formVals.correctAnswer = meta.correctAnswer;
                    formVals.transcript = meta.transcript;
                } else if (skill === 'WRITING') {
                    formVals.blankSentence = meta.blankSentence || meta.correctSentence;
                    formVals.correctAnswer = meta.correctAnswer;
                    formVals.alternatives = Array.isArray(meta.alternatives) ? meta.alternatives.join(', ') : '';
                    formVals.hint = meta.hint;
                } else if (skill === 'SPEAKING') {
                    formVals.audioUrl = meta.audioUrl;
                    formVals.transcript = meta.transcript;
                    formVals.hint = meta.hint;
                }

                createForm.setFieldsValue(formVals);
                setActiveSkillType(skill);
                setIsCreatingNew(true);
                setEditingChallengeId(challengeIdToModify);
                setIsChallengeModalOpen(true);
                return;
            }
        }
        message.warning("Không lấy được dữ liệu chi tiết để sửa");
    };

    const handleRemoveQuestion = (record: any, index?: number) => {
        let challengeId = record.id;
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
                challengeId = bankItem.challenge.id;
            }
        }

        if (!quiz?.id || !challengeId) {
            message.warning("Không thể tìm thấy ID câu hỏi để xóa");
            return;
        }

        Modal.confirm({
            title: 'Gỡ câu hỏi',
            content: 'Bạn có chắc chắn muốn gỡ câu hỏi này khỏi bài kiểm tra hiện tại? (Vẫn giữ trong kho câu hỏi chung)',
            okText: 'Gỡ bỏ',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await adminService.removeChallengeFromQuiz(quiz.id, challengeId);
                    message.success('Gỡ câu hỏi thành công');
                    if (selectedLevelId) handleLevelChange(selectedLevelId);
                } catch (err: any) {
                    message.error('Lỗi khi gỡ câu hỏi');
                }
            }
        });
    };

    const openRewardModal = async () => {
        setIsRewardModalOpen(true);
        setLoadingRewards(true);
        try {
            const res: any = await adminService.getBadgesForAdmin();
            setRewards(res?.data || (Array.isArray(res) ? res : []));
        } catch {
            message.error('Không thể tải danh sách thành tựu');
        } finally {
            setLoadingRewards(false);
        }
    };

    const handleAttachReward = async (rewardId: string) => {
        if (!quiz?.id) return;
        setSubmittingReward(true);
        try {
            await adminService.attachRewardToQuiz(quiz.id, rewardId);
            message.success('Gán thành tựu cho bài kiểm tra thành công!');
            setIsRewardModalOpen(false);
            // Refresh quiz data
            handleLevelChange(selectedLevelId || "");
        } catch (err: any) {
            message.error(err?.response?.data?.message || 'Lỗi khi gán thành tựu');
        } finally {
            setSubmittingReward(false);
        }
    };

    const handleCreateNewChallenge = async (values: any) => {
        if (!quiz?.id) return;
        setSubmittingCreate(true);
        console.log('[handleCreateNewChallenge] values received:', values);

        // Dùng trực tiếp form values từ createForm để đảm bảo lấy được audioUrl
        const formValues = createForm.getFieldsValue();
        console.log('[handleCreateNewChallenge] createForm values:', formValues);

        try {
            let metadataJson: any = {};
            const skill = activeSkillType || values.skillType;
            const finalAudioUrl = formValues.audioUrl || values.audioUrl || "";

            if (skill === 'READING') {
                const words = values.fullSentence.trim().split(/\s+/);
                const errIdx = words.findIndex((w: string) => w.toLowerCase().replace(/[.,!?;:]/g, '') === values.wrongWord.toLowerCase().replace(/[.,!?;:]/g, ''));

                metadataJson = {
                    words: words,
                    error_index: errIdx === -1 ? 0 : errIdx,
                    correct_word: values.correctWord.trim(),
                    hint: values.hint || ""
                };
            } else if (skill === 'LISTENING') {
                metadataJson = {
                    audioUrl: finalAudioUrl,
                    options: values.options ? values.options.split('\n').filter((o: string) => o.trim()) : [],
                    correctAnswer: values.correctAnswer,
                    answer: values.correctAnswer, // Giữ cả answer cho tương thích
                    transcript: values.transcript || ""
                };
                console.log('[handleCreateNewChallenge] Prepared LISTENING metadata:', metadataJson);
            } else if (skill === 'WRITING') {
                const altArr = values.alternatives ? values.alternatives.split(/[,;]+/).map((s: string) => s.trim()).filter(Boolean) : [];
                metadataJson = {
                    blankSentence: values.blankSentence,
                    correctAnswer: values.correctAnswer,
                    alternatives: altArr,
                    hint: values.hint || ""
                };
            } else if (skill === 'SPEAKING') {
                metadataJson = {
                    audioUrl: finalAudioUrl,
                    transcript: values.transcript || "",
                    hint: values.hint || ""
                };
                console.log('[handleCreateNewChallenge] Prepared SPEAKING metadata:', metadataJson);
            }

            const payload = {
                contentText: values.contentText,
                skillType: skill,
                difficultyTag: values.difficultyTag,
                metadataJson: metadataJson
            };

            console.log('[handleCreateNewChallenge] Final payload before save:', payload);

            if (editingChallengeId) {
                await adminService.updateChallengeBankItem(editingChallengeId, payload);
                message.success('Cập nhật câu hỏi thành công');
            } else {
                const res: any = await adminService.createChallengeBankItem(payload);
                const newChallengeId = res?.data?.id || res?.id;

                if (newChallengeId) {
                    // Auto assign to quiz after creation
                    await adminService.assignChallengesToQuiz(quiz.id, [newChallengeId]);
                    message.success('Tạo và gán câu hỏi thành công');
                } else {
                    message.success('Tạo câu hỏi thành công');
                }
            }

            setIsChallengeModalOpen(false);
            createForm.resetFields();
            setEditingChallengeId(null);
            if (selectedLevelId) handleLevelChange(selectedLevelId);
        } catch (err: any) {
            message.error(err?.message || 'Lỗi khi lưu câu hỏi');
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

    // --- Import/Export/Template Handlers ---
    const handleDownloadQuizTemplate = () => {
        const header = 'Tên bài kiểm tra,Mô tả ngắn,Hướng dẫn cho học viên,Loại kỹ năng,Số giây mỗi câu hỏi';
        const sample = 'Kiểm tra cuối khóa phát âm,Luyện kỹ năng nghe hiểu,Nghe kỹ và chọn từ đúng,LISTENING,90';
        const blob = new Blob([`\uFEFF${header}\n${sample}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'quiz_template.csv';
        link.click();
        URL.revokeObjectURL(url);
        message.success('Đã tải template mẫu');
    };

    const handleImportQuizCSV = async () => {
        if (!importFile || !selectedLevelId) return;
        setImporting(true);
        setImportResult(null);
        try {
            const text = await importFile.text();
            const lines = text.split('\n').filter(l => l.trim());
            if (lines.length < 2) { message.warning('File rỗng'); setImporting(false); return; }

            const rows = lines.slice(1);
            let success = 0;
            const errors: string[] = [];

            const existingNames = quizzes.map(q => (q.name || q.title || '').toLowerCase().trim());
            let currentMaxOrder = quizzes.length > 0
                ? Math.max(...quizzes.map(q => q.orderIndex || 0))
                : 0;

            for (let i = 0; i < rows.length; i++) {
                const cols = rows[i].split(',');
                if (cols.length < 5) { errors.push(`Dòng ${i + 2}: thiếu cột (cần 5 cột)`); continue; }

                const title = cols[0]?.trim();
                const description = cols[1]?.trim() || '';
                const instructions = cols[2]?.trim() || '';
                const skillType = cols[3]?.trim() || 'MIXED';
                const secondsPerQuestion = parseInt(cols[4]?.trim() || '90');

                if (!title) { errors.push(`Dòng ${i + 2}: thiếu tên bài kiểm tra`); continue; }
                if (existingNames.includes(title.toLowerCase().trim())) {
                    errors.push(`Dòng ${i + 2}: "${title}" đã tồn tại`);
                    continue;
                }

                try {
                    currentMaxOrder++;
                    const payload = {
                        levelId: selectedLevelId,
                        title,
                        description,
                        instructions,
                        passingScore: 80, // Default passing score
                        timeLimitSeconds: 10 * (isNaN(secondsPerQuestion) ? 90 : secondsPerQuestion), // Default 10 câu hỏi
                        skillType,
                        questionCount: 10, // Default question count
                        comment: `Import từ CSV - ${skillType}`,
                        orderIndex: currentMaxOrder,
                        questions: [],
                    };
                    await adminService.createQuiz(payload);
                    success++;
                    existingNames.push(title.toLowerCase().trim());
                } catch (err: any) {
                    const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Lỗi tạo quiz';
                    errors.push(`Dòng ${i + 2}: ${msg}`);
                }
            }

            setImportResult({ success, errors });
            if (success > 0) {
                message.success(`Import thành công ${success} quiz`);
                handleLevelChange(selectedLevelId);
            }
        } catch (err) {
            message.error('Lỗi đọc file CSV');
        } finally {
            setImporting(false);
        }
    };

    const handleExportQuizCSV = () => {
        if (quizzes.length === 0) { message.warning('Không có bài kiểm tra để export'); return; }
        const header = 'Tên bài kiểm tra,Mô tả ngắn,Hướng dẫn cho học viên,Loại kỹ năng,Số giây mỗi câu hỏi';
        const rows = quizzes.map(q => {
            const name = (q.name || q.title || '').replace(/,/g, ';');
            const desc = (q.description || '').replace(/,/g, ';');
            const inst = (q.instructions || '').replace(/,/g, ';');
            const questionCount = q.questions?.length ?? q.questionCount ?? 10;
            const timeLimitSeconds = q.timeLimitSeconds ?? (q.timeLimitMinutes ? q.timeLimitMinutes * 60 : 900);
            const secondsPerQuestion = questionCount > 0 ? Math.round(timeLimitSeconds / questionCount) : 90;
            return `${name},${desc},${inst},${q.skillType || 'MIXED'},${secondsPerQuestion}`;
        });

        const csv = [header, ...rows].join('\n');
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `quiz_${selectedLevel?.name?.replace(/\s+/g, '_') || 'export'}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        message.success(`Đã export ${rows.length} quiz`);
    };

    // --- Import Challenges Excel to Quiz Handlers ---
    const handleDownloadChallengeTemplate = async () => {
        try {
            const quizSkill = quiz?.skillType || 'MIXED';

            // Determine which skill type to download:
            // - If quiz is a specific skill (not MIXED), always download that skill's template
            // - If quiz is MIXED, check importChallengesSkillType (from modal selector)
            let skillToDownload: string;
            if (quizSkill !== 'MIXED') {
                skillToDownload = quizSkill;
            } else if (importChallengesSkillType && importChallengesSkillType !== 'MIXED') {
                skillToDownload = importChallengesSkillType;
            } else {
                skillToDownload = 'MIXED';
            }

            if (skillToDownload === 'MIXED') {
                const blob = await excelService.downloadMixedTemplate();
                downloadBlob(blob, 'template_mixed.xlsx');
            } else {
                const blob = await excelService.downloadChallengeTemplate(skillToDownload);
                downloadBlob(blob, `template_${skillToDownload.toLowerCase()}.xlsx`);
            }
            message.success('Đã tải template Excel mẫu');
        } catch (err) {
            message.error('Không thể tải template');
        }
    };

    const handleImportChallengesToQuiz = async () => {
        if (!importChallengesFile || !quiz?.id) return;
        setImportingChallenges(true);
        setImportChallengesResult(null);
        try {
            let result: any;
            const isMixed = importChallengesSkillType === 'MIXED';

            if (isMixed) {
                result = await excelService.importMixedToQuiz(quiz.id, importChallengesFile);
            } else {
                result = await excelService.importChallengesToQuiz(importChallengesSkillType, quiz.id, importChallengesFile);
            }

            const importData = result?.data || result;
            setImportChallengesResult(importData);

            if (importData?.successCount > 0) {
                message.success(`Import thành công ${importData.successCount} câu hỏi vào quiz`);
                // Refresh quiz data
                if (selectedLevelId) handleLevelChange(selectedLevelId);
            } else {
                message.info('Không có câu hỏi mới nào được import');
            }
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || err?.message || 'Lỗi import';
            message.error(errorMsg);
        } finally {
            setImportingChallenges(false);
        }
    };

    const openImportChallengesModal = () => {
        const quizSkill = quiz?.skillType || 'MIXED';
        setImportChallengesSkillType(quizSkill === 'MIXED' ? 'MIXED' : quizSkill);
        setImportChallengesFile(null);
        setImportChallengesResult(null);
        setIsImportChallengesModalOpen(true);
    };

    const createEmptyBatchQuestion = (skillType?: string) => ({
        tempId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        id: '',
        relationId: '',
        isExisting: false,
        skillType: skillType || (quiz?.skillType && quiz.skillType !== 'MIXED' ? quiz.skillType : 'READING'),
        difficultyTag: 'BEGINNER',
        contentText: '',
        fullSentence: '',
        wrongWord: '',
        correctWord: '',
        audioUrl: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        transcript: '',
        // Writing (Fill in blank)
        blankSentence: '',
        alternatives: '',
        hint: ''
    });

    const openBatchQuestionsModal = () => {
        if (displayQuestions && displayQuestions.length > 0) {
            const seenBankIds = new Set<string>();
            const existing: BatchQuestion[] = displayQuestions.map((c: any, idx: number) => {
                const parsed = parseMetadata(c);
                const bankId = parsed.id;
                // If this bank item is already in our editor session, we 'detach' subsequent ones
                // so they can be edited independently as new items upon save.
                const isDuplicate = seenBankIds.has(bankId);
                seenBankIds.add(bankId);

                const meta = parsed.metadataJson || {};
                return {
                    tempId: `existing-${bankId}-${idx}`,
                    id: isDuplicate ? '' : bankId,
                    relationId: parsed.relationId || '',
                    isExisting: !isDuplicate,
                    skillType: parsed.skillType || 'READING',
                    difficultyTag: parsed.difficultyTag || 'BEGINNER',
                    contentText: parsed.contentText || '',
                    fullSentence: Array.isArray(meta.words) ? meta.words.join(' ') : (parsed.contentText || ''),
                    wrongWord: (Array.isArray(meta.words) && meta.error_index != null) ? meta.words[meta.error_index] : '',
                    correctWord: meta.correct_word || meta.correctWord || '',
                    audioUrl: meta.audioUrl || '',
                    options: Array.isArray(meta.options) ? [...meta.options, '', '', ''].slice(0, 4) : ['', '', '', ''],
                    correctAnswer: meta.correctAnswer || meta.answer || '',
                    transcript: meta.transcript || '',
                    blankSentence: meta.blankSentence || meta.correctSentence || '', // fallback to old correctSentence if any
                    alternatives: Array.isArray(meta.alternatives) ? meta.alternatives.join(', ') : '',
                    hint: meta.hint || ''
                };
            });
            setBatchQuestions(existing);
        } else {
            setBatchQuestions([createEmptyBatchQuestion()]);
        }
        setIsBatchQuestionsModalOpen(true);
    };

    const addBatchQuestion = () => {
        const allowedSkill = quiz?.skillType && quiz.skillType !== 'MIXED' ? quiz.skillType : undefined;
        setBatchQuestions(prev => [...prev, createEmptyBatchQuestion(allowedSkill)]);
    };

    const removeBatchQuestion = (tempId: string) => {
        setBatchQuestions(prev => {
            if (prev.length <= 1) return prev;
            return prev.filter(q => q.tempId !== tempId);
        });
    };

    const updateBatchQuestionField = (tempId: string, field: string, value: any) => {
        setBatchQuestions(prev => prev.map(q => q.tempId === tempId ? { ...q, [field]: value } : q));
    };

    const updateBatchOption = (tempId: string, optionIndex: number, value: string) => {
        setBatchQuestions(prev => prev.map(q => {
            if (q.tempId !== tempId) return q;
            const nextOptions = [...q.options];
            nextOptions[optionIndex] = value;
            return { ...q, options: nextOptions };
        }));
    };

    const handleSubmitBatchQuestions = async () => {
        if (!quiz?.id) return;

        const normalized = batchQuestions.map((q, idx) => {
            const options = (q.options || []).map(o => (o || '').trim()).filter(Boolean);
            const wordsArr = (q.words || '').split('|').map(w => w.trim()).filter(Boolean);

            return {
                ...q,
                _index: idx + 1,
                options,
                wordsArr
            } as any;
        });

        for (const q of normalized) {
            if (!q.contentText.trim()) {
                message.warning(`Câu ${q._index}: vui lòng nhập nội dung câu hỏi`);
                return;
            }

            if (q.skillType === 'READING') {
                if (!q.fullSentence.trim()) {
                    message.warning(`Câu ${q._index}: vui lòng nhập câu chứa lỗi`);
                    return;
                }
                if (!q.wrongWord.trim()) {
                    message.warning(`Câu ${q._index}: vui lòng nhập từ bị sai`);
                    return;
                }
                if (!q.correctWord.trim()) {
                    message.warning(`Câu ${q._index}: vui lòng nhập từ viết đúng`);
                    return;
                }

                // Logic: split sentence and find index of wrongWord
                const words = q.fullSentence.trim().split(/\s+/);
                const errIdx = words.findIndex((w: string) => w.toLowerCase().replace(/[.,!?;:]/g, '') === q.wrongWord.toLowerCase().replace(/[.,!?;:]/g, ''));

                if (errIdx === -1) {
                    message.warning(`Câu ${q._index}: Không tìm thấy từ "${q.wrongWord}" trong câu đã nhập`);
                    return;
                }
            }

            if (q.skillType === 'LISTENING') {
                if (q.options.length < 2) {
                    message.warning(`Câu ${q._index}: Nghe hiểu cần ít nhất 2 đáp án`);
                    return;
                }
                if (!q.correctAnswer.trim()) {
                    message.warning(`Câu ${q._index}: vui lòng chọn đáp án đúng`);
                    return;
                }
                if (!q.options.includes(q.correctAnswer.trim())) {
                    message.warning(`Câu ${q._index}: đáp án đúng phải nằm trong danh sách đáp án`);
                    return;
                }
            }

            if (q.skillType === 'WRITING') {
                if (!q.blankSentence.includes('_')) {
                    message.warning(`Câu ${q._index}: Nội dung câu đố cần chứa ký hiệu "_" để đục lỗ`);
                    return;
                }
                if (!q.correctAnswer.trim()) {
                    message.warning(`Câu ${q._index}: vui lòng nhập đáp án đúng`);
                    return;
                }
            }

            if (q.skillType === 'SPEAKING') {
                if (!q.transcript.trim()) {
                    message.warning(`Câu ${q._index}: Nói cần transcript`);
                    return;
                }
            }
        }

        setSubmittingBatchQuestions(true);
        try {
            // 1. Determine the final set of Bank IDs for the quiz
            const processedBankIds: string[] = [];
            const seenBankIdsForUpdate = new Set<string>();

            for (const q of normalized) {
                let metadataJson: any = {};
                if (q.skillType === 'READING') {
                    const words = q.fullSentence.trim().split(/\s+/);
                    const errIdx = words.findIndex((w: string) => w.toLowerCase().replace(/[.,!?;:]/g, '') === q.wrongWord.toLowerCase().replace(/[.,!?;:]/g, ''));

                    metadataJson = {
                        words: words,
                        error_index: errIdx === -1 ? 0 : errIdx,
                        correct_word: q.correctWord.trim(),
                        hint: q.hint || ''
                    };
                } else if (q.skillType === 'LISTENING') {
                    metadataJson = {
                        audioUrl: q.audioUrl || '',
                        options: q.options,
                        correctAnswer: q.correctAnswer.trim(),
                        answer: q.correctAnswer.trim(),
                        transcript: q.transcript || ''
                    };
                    console.log(`[handleSubmitBatchQuestions] Câu ${q._index} LISTENING Meta:`, metadataJson);
                } else if (q.skillType === 'WRITING') {
                    const altArr = q.alternatives.split(/[,;]+/).map((s: string) => s.trim()).filter(Boolean);
                    metadataJson = {
                        blankSentence: q.blankSentence.trim(),
                        correctAnswer: q.correctAnswer.trim(),
                        alternatives: altArr,
                        hint: q.hint || ''
                    };
                } else if (q.skillType === 'SPEAKING') {
                    metadataJson = {
                        audioUrl: q.audioUrl || '',
                        transcript: q.transcript || '',
                        hint: q.hint || ''
                    };
                    console.log(`[handleSubmitBatchQuestions] Câu ${q._index} SPEAKING Meta:`, metadataJson);
                }

                const payload = {
                    contentText: q.contentText.trim(),
                    skillType: q.skillType,
                    difficultyTag: q.difficultyTag || 'BEGINNER',
                    metadataJson
                };

                // Logic: If q.id exists but we've already updated it in this session (duplicate),
                // or if it's new, we CREATE a new bank item.
                // This ensures every slot in the quiz gets its own unique bank record if edited.
                const shouldCreateNew = !q.isExisting || !q.id || seenBankIdsForUpdate.has(q.id);

                if (!shouldCreateNew) {
                    await adminService.updateChallengeBankItem(q.id, payload);
                    processedBankIds.push(q.id);
                    seenBankIdsForUpdate.add(q.id);
                } else {
                    const res: any = await adminService.createChallengeBankItem(payload as any);
                    const newId = res?.data?.id || res?.id;
                    if (newId) processedBankIds.push(newId);
                }
            }

            // 2. Perform a FULL RESET of quiz assignments to ensure correct order and unique references
            // First, remove absolutely everything currently in the quiz
            const currentBankIds = Array.from(new Set(displayQuestions.map((d: any) => d.id).filter(Boolean)));
            for (const bid of currentBankIds) {
                await adminService.removeChallengeFromQuiz(quiz.id, bid as string).catch(() => { });
            }

            // 3. Re-assign the entire processed list in the correct order
            if (processedBankIds.length > 0) {
                // We call assignChallengesToQuiz with the whole array to set the new sequence
                await adminService.assignChallengesToQuiz(quiz.id, processedBankIds);
            }

            message.success('Đã đồng bộ toàn bộ câu hỏi và gán vào quiz thành công');
            setIsBatchQuestionsModalOpen(false);
            setBatchQuestions([]);
            if (selectedLevelId) handleLevelChange(selectedLevelId);
        } catch (err: any) {
            message.error(err?.message || 'Có lỗi khi lưu các câu hỏi');
        } finally {
            setSubmittingBatchQuestions(false);
        }
    };

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
            title: 'Nội dung',
            key: 'contentText',
            width: 350,
            render: (_text: string, record: any, index: number) => {
                let finalChallenge = null;

                // 1. Try to find the detailed challenge from quizChallenges
                if (quizChallenges && quizChallenges.length > 0) {
                    let bankItem = quizChallenges.find((item: any) =>
                        (record.id && item.challenge?.id === record.id) ||
                        (record.challengeId && item.challenge?.id === record.challengeId)
                    );
                    if (!bankItem && record.questionOrder != null) {
                        bankItem = quizChallenges.find((item: any) => item.orderIndex === record.questionOrder);
                    }
                    if (!bankItem && index != null && index < quizChallenges.length) {
                        bankItem = quizChallenges[index];
                    }
                    if (bankItem?.challenge) {
                        finalChallenge = bankItem.challenge;
                    }
                }

                // 2. Fallback to the record itself if it contains metadata
                if (!finalChallenge && record.metadataJson) {
                    finalChallenge = record;
                }

                if (finalChallenge) {
                    const parsed = parseMetadata(finalChallenge);
                    const meta = parsed.metadataJson || {};
                    const skill = parsed.skillType;

                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                                {parsed.contentText || '—'}
                            </Text>

                            <div style={{ fontSize: 14 }}>
                                {skill === 'READING' && Array.isArray(meta.words) && (
                                    <div style={{ background: '#fef2f2', padding: '6px 10px', borderRadius: 6, border: '1px solid #fee2e2' }}>
                                        {meta.words.map((w: string, i: number) => (
                                            <span key={i} style={{
                                                marginRight: 4,
                                                color: i === meta.error_index ? '#ef4444' : '#475569',
                                                fontWeight: i === meta.error_index ? 700 : 400,
                                                textDecoration: i === meta.error_index ? 'underline' : 'none'
                                            }}>
                                                {w}
                                            </span>
                                        ))}
                                        <div style={{ marginTop: 4, fontSize: 12, color: '#059669', borderTop: '1px solid #fee2e2', paddingTop: 2 }}>
                                            <span style={{ fontStyle: 'italic' }}>Correct: {meta.correct_word || meta.correctWord}</span>
                                        </div>
                                    </div>
                                )}

                                {(skill === 'LISTENING' || skill === 'SPEAKING') && meta.transcript && (
                                    <Text italic style={{ color: '#0f172a' }}>"{meta.transcript}"</Text>
                                )}

                                {skill === 'WRITING' && (meta.blankSentence || meta.correctSentence) && (
                                    <Text strong style={{ color: '#0f172a' }}>
                                        {meta.blankSentence || meta.correctSentence}
                                        {meta.correctAnswer && <Tag color="blue" style={{ marginLeft: 8 }}>{meta.correctAnswer}</Tag>}
                                    </Text>
                                )}
                            </div>
                        </div>
                    );
                }

                // Normal fallback
                const fallbackText = record.contentText || record.content || record.questionText || '—';
                return (
                    <Text style={{ maxWidth: 300, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {fallbackText}
                    </Text>
                );
            },
        },
        {
            title: 'Gợi ý',
            key: 'hint',
            width: 200,
            render: (_: any, record: any, index: number) => {
                let finalChallenge = null;
                if (quizChallenges && quizChallenges.length > 0) {
                    let bankItem = quizChallenges.find((item: any) =>
                        (record.id && item.challenge?.id === record.id) ||
                        (record.challengeId && item.challenge?.id === record.challengeId)
                    );
                    if (!bankItem && record.questionOrder != null) {
                        bankItem = quizChallenges.find((item: any) => item.orderIndex === record.questionOrder);
                    }
                    if (!bankItem && index != null && index < quizChallenges.length) {
                        bankItem = quizChallenges[index];
                    }
                    if (bankItem?.challenge) {
                        finalChallenge = bankItem.challenge;
                    }
                }
                if (!finalChallenge && record.metadataJson) {
                    finalChallenge = record;
                }
                if (finalChallenge) {
                    const parsed = parseMetadata(finalChallenge);
                    const meta = parsed.metadataJson || {};
                    const hint = meta.hint || meta.transcript || '';
                    if (hint) {
                        return (
                            <Text style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic' }}>
                                {hint}
                            </Text>
                        );
                    }
                }
                return <Text type="secondary">—</Text>;
            },
        },

        {
            title: 'Thao tác',
            key: 'action',
            width: 120,
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
                    <Space size="small">
                        <Tooltip title="Xem chi tiết">
                            <Button
                                icon={<EyeOutlined style={{ color: '#2563eb' }} />}
                                onClick={() => showDetail(record, index)}
                                style={{ borderRadius: 6, border: '1.5px solid #dbeafe', background: '#eff6ff' }}
                            />
                        </Tooltip>
                        <Tooltip title="Chỉnh sửa">
                            <Button
                                icon={<EditOutlined style={{ color: '#d97706' }} />}
                                onClick={() => handleEditQuestion(record, index)}
                                style={{ borderRadius: 6, border: '1.5px solid #fef3c7', background: '#fffbeb' }}
                            />
                        </Tooltip>
                        <Tooltip title="Gỡ khỏi quiz">
                            <Button
                                icon={<DeleteOutlined style={{ color: '#dc2626' }} />}
                                onClick={() => handleRemoveQuestion(record, index)}
                                style={{ borderRadius: 6, border: '1.5px solid #fee2e2', background: '#fef2f2' }}
                            />
                        </Tooltip>
                    </Space>
                );
            },
        },
    ];

    const levelColumns = [
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
            title: 'Tên chương',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => (
                <Text strong style={{ fontSize: 15, color: '#1e293b' }}>{text}</Text>
            )
        },
        {
            title: 'Miền',
            key: 'region',
            width: 130,
            render: (_: any, record: any) => {
                const rInfo = getRegionInfo(record.dialectId);
                if (!rInfo) return <Text type="secondary">—</Text>;
                return (
                    <Tag style={{
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 20,
                        padding: '2px 10px',
                        background: `${rInfo.color}15`,
                        border: `1px solid ${rInfo.color}40`,
                        color: rInfo.color,
                    }}>
                        {rInfo.label}
                    </Tag>
                );
            }
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (text: string) => <Text type="secondary" style={{ fontSize: 13 }}>{text || '—'}</Text>
        },

    ];


    const quizColumns = [
        {
            title: 'STT',
            key: 'stt',
            width: 70,
            align: 'center' as const,
            render: (_: any, __: any, index: number) => <span style={{ fontWeight: 600, color: '#64748b' }}>{index + 1}</span>
        },
        {
            title: 'Tên bài kiểm tra',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: any) => (
                <Text strong style={{ color: '#1e293b' }}>{text || record.title || 'Untitled Quiz'}</Text>
            )
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
                            background: `${cfg.color}10`,
                            border: `1px solid ${cfg.color}30`,
                            color: cfg.color,
                            fontWeight: 600,
                            borderRadius: 20
                        }}
                    >
                        {cfg.label}
                    </Tag>
                );
            }
        },
        {
            title: 'Thao tác',
            key: 'action',
            align: 'center' as const,
            width: 120,
            render: (_: any, record: any) => (
                <Button
                    type="primary"
                    ghost
                    size="middle"
                    icon={<EyeOutlined />}
                    onClick={(e) => {
                        e.stopPropagation();
                        setQuiz(record);
                    }}
                    style={{ borderRadius: 8, fontWeight: 600, border: '1.5px solid #1890ff' }}
                >
                    Chi tiết
                </Button>
            )
        }
    ];

    const filteredAndSortedQuizzes = useMemo(() => {
        let result = quizzes;
        if (quizSearchTerm) {
            result = result.filter(q => (q.title || q.name || '').toLowerCase().includes(quizSearchTerm.toLowerCase()));
        }
        if (quizSkillFilter) {
            result = result.filter(q => q.skillType === quizSkillFilter);
        }

        // Ưu tiên sắp xếp theo orderIndex (STT)
        result = [...result].sort((a, b) => {
            if (a.orderIndex != null && b.orderIndex != null) {
                return a.orderIndex - b.orderIndex;
            }
            if (a.orderIndex != null) return -1;
            if (b.orderIndex != null) return 1;

            const titleA = a.title || a.name || '';
            const titleB = b.title || b.name || '';
            const numA = parseInt(titleA.match(/\d+/)?.[0] || '0');
            const numB = parseInt(titleB.match(/\d+/)?.[0] || '0');
            if (numA !== numB) return numA - numB;
            return titleA.localeCompare(titleB);
        });

        return result;
    }, [quizzes, quizSearchTerm, quizSkillFilter]);

    const regionInfo = selectedLevel ? getRegionInfo(selectedLevel.dialectId) : null;

    return (
        <div style={{ padding: '24px' }}>
            {/* Header - đồng bộ với ChallengeBankPage */}
            <div className="flex justify-between items-center" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {selectedLevelId && (
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={() => {
                                if (quiz) {
                                    setQuiz(null);
                                    setQuizChallenges([]);
                                } else {
                                    handleBackToChapters();
                                }
                            }}
                            style={{ borderRadius: 10, border: '1.5px solid #e2e8f0', height: 40, width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        />
                    )}
                    <div style={{ background: '#e6f7ff', padding: 8, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileTextOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800" style={{ margin: 0, lineHeight: 1.2 }}>
                            {quiz
                                ? <>
                                    <span style={{ cursor: 'pointer', color: '#64748b', fontWeight: 400 }} onClick={handleBackToChapters}>Quản lý bài kiểm tra</span>
                                    <span style={{ color: '#64748b', fontWeight: 400, fontSize: 16, margin: '0 8px' }}>›</span>
                                    <span style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => { setQuiz(null); setQuizChallenges([]); }}>{selectedLevel?.name}</span>
                                    <span style={{ color: '#64748b', fontWeight: 400, fontSize: 16, margin: '0 8px' }}>›</span>
                                    <span style={{ color: '#1890ff', fontSize: 19 }}>{quiz.name || quiz.title}</span>
                                </>
                                : selectedLevelId && selectedLevel
                                    ? <>
                                        <span style={{ cursor: 'pointer', color: '#64748b', fontWeight: 400 }} onClick={handleBackToChapters}>Quản lý bài kiểm tra</span>
                                        <span style={{ color: '#64748b', fontWeight: 400, fontSize: 16, margin: '0 8px' }}>›</span>
                                        <span style={{ color: '#1890ff', fontSize: 19 }}>{selectedLevel.name}</span>
                                    </>
                                    : 'Quản lý bài kiểm tra'
                            }
                        </h2>
                        <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                            {quiz
                                ? `Chi tiết và câu hỏi của bài kiểm tra thuộc chương "${selectedLevel?.name}"`
                                : selectedLevelId && selectedLevel
                                    ? `Quản lý các bài kiểm tra trong chương "${selectedLevel.name}"`
                                    : 'Chọn chương học để xem và quản lý bài kiểm tra'}
                        </div>
                    </div>
                </div>
                <Space size={8}>
                    {selectedLevelId && !quiz && (
                        <>
                            <Button
                                icon={<DownloadOutlined />}
                                size="middle"
                                onClick={handleDownloadQuizTemplate}
                                style={{
                                    borderRadius: '8px',
                                    border: '1.5px solid #1890ff',
                                    color: '#1890ff',
                                    background: '#e6f7ff',
                                    fontWeight: 600,
                                }}
                            >
                                Template
                            </Button>
                            <Button
                                icon={<UploadOutlined />}
                                size="middle"
                                onClick={() => { setIsImportModalOpen(true); setImportFile(null); setImportResult(null); }}
                                style={{
                                    borderRadius: '8px',
                                    border: '1.5px solid #52c41a',
                                    color: '#52c41a',
                                    background: '#f6ffed',
                                    fontWeight: 600,
                                }}
                            >
                                Import
                            </Button>
                            <Button
                                icon={<ExportOutlined />}
                                size="middle"
                                onClick={handleExportQuizCSV}
                                style={{
                                    borderRadius: '8px',
                                    border: '1.5px solid #fa8c16',
                                    color: '#fa8c16',
                                    background: '#fff7e6',
                                    fontWeight: 600,
                                }}
                            >
                                Export
                            </Button>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                size="middle"
                                onClick={() => setIsCreateQuizModalOpen(true)}
                                style={{
                                    borderRadius: '8px',
                                    background: 'linear-gradient(90deg, #1890ff, #0076e4)',
                                    border: 'none',
                                    fontWeight: 600,
                                    boxShadow: '0 2px 8px rgba(24, 144, 255, 0.2)',
                                }}
                            >
                                Tạo bài kiểm tra
                            </Button>
                        </>
                    )}
                </Space>
            </div>



            {/* Content Area - Chọn chương học */}
            {!selectedLevelId && !loadingQuiz && (
                <div style={{ padding: '8px 0' }}>
                    {/* Filter row - đồng bộ style với ChallengeBankPage */}
                    <div style={{ marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <Input
                            placeholder="Tìm tên chương..."
                            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                            style={{ width: 320, borderRadius: 10, height: 42 }}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            allowClear
                        />
                        <Select
                            placeholder="Lọc vùng miền"
                            style={{ minWidth: 160, height: 42 }}
                            allowClear
                            onChange={(val) => setRegionFilter(val)}
                            options={dialects.map((d: any) => {
                                const regionKey = (d.name || '').toUpperCase();
                                const info = REGION_LABEL[regionKey];
                                return {
                                    value: d.id,
                                    label: info?.label || d.description || d.name || d.id,
                                };
                            })}
                        />
                        <div style={{
                            background: '#e6f7ff',
                            padding: '0 20px',
                            borderRadius: 10,
                            border: '1px solid #91d5ff',
                            height: 42,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                        }}>
                            <Badge count={filteredLevels.length} color="#1890ff" />
                            <Text strong style={{ color: '#1890ff', fontSize: 13 }}>Chương học</Text>
                        </div>
                    </div>

                    <Card
                        style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}
                        styles={{ body: { padding: 0 } }}
                    >
                        <Table
                            columns={levelColumns}
                            dataSource={filteredLevels}
                            rowKey="id"
                            scroll={{ x: 'max-content', y: 400 }}
                            pagination={{ pageSize: 15, showSizeChanger: true, style: { padding: '16px 24px' } }}
                            onRow={(record) => ({
                                onClick: () => handleLevelChange(record.id),
                                style: { cursor: 'pointer' }
                            })}
                            size="large"
                        />
                    </Card>
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
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateQuizModalOpen(true)} size="large" style={{ marginTop: 16, background: '#1890ff', borderColor: '#1890ff', color: '#fff', fontWeight: 600, borderRadius: 8 }}>
                        Tạo bài kiểm tra đầu tiên
                    </Button>
                </div>
            )}

            {!loadingQuiz && selectedLevelId && !quiz && quizzes.length > 0 && (
                <div style={{ padding: '8px 0' }}>
                    {/* Filter row cho quiz list */}
                    <div style={{ marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <Input
                            placeholder="Tìm bài kiểm tra..."
                            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                            style={{ width: 320, borderRadius: 10, height: 42 }}
                            onChange={(e) => setQuizSearchTerm(e.target.value)}
                            allowClear
                        />
                        <Select
                            placeholder="Lọc theo kỹ năng"
                            allowClear
                            style={{ minWidth: 180, height: 42 }}
                            onChange={(val) => setQuizSkillFilter(val)}
                            options={Object.entries(SKILL_CONFIG).map(([key, cfg]) => ({ label: cfg.label, value: key }))}
                        />
                    </div>

                    <Card
                        style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}
                        styles={{ body: { padding: 0 } }}
                    >
                        <Table
                            columns={quizColumns}
                            dataSource={filteredAndSortedQuizzes}
                            rowKey="id"
                            scroll={{ x: 'max-content', y: 400 }}
                            pagination={{ pageSize: 15, showSizeChanger: true, style: { padding: '16px 24px' } }}
                            onRow={(record) => ({
                                onClick: () => setQuiz(record),
                                style: { cursor: 'pointer' }
                            })}
                            size="large"
                        />
                    </Card>
                </div>
            )}

            {!loadingQuiz && quiz && (
                <>
                    {/* Quiz Info Card (Compact) */}
                    <Card
                        style={{
                            borderRadius: 16,
                            marginBottom: 20,
                            boxShadow: '0 2px 10px rgba(37,99,235,0.05)',
                            border: '1px solid #e2e8f0',
                            background: '#fff',
                        }}
                        styles={{ body: { padding: '16px 20px' } }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                            {/* Left Side: Quiz Identity & Stats */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12,
                                    background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 10px rgba(37,99,235,0.2)'
                                }}>
                                    <FileTextOutlined style={{ fontSize: 22, color: '#fff' }} />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <Title level={4} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
                                            {quiz.name || quiz.title}
                                        </Title>
                                        <Tooltip title="Chỉnh sửa thông tin bài kiểm tra">
                                            <Button
                                                size="small"
                                                type="text"
                                                icon={<EditOutlined style={{ color: '#64748b' }} />}
                                                onClick={handleOpenEditQuiz}
                                                style={{ borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            />
                                        </Tooltip>
                                        {regionInfo && (
                                            <Tag color="blue" style={{ borderRadius: 20, border: 'none', margin: 0, paddingInline: 10, fontSize: 11, fontWeight: 600, background: '#eff6ff', color: '#1d4ed8' }}>
                                                {regionInfo.label}
                                            </Tag>
                                        )}
                                    </div>
                                    <Space split={<Divider type="vertical" style={{ borderColor: '#e2e8f0', height: 12 }} />} style={{ marginTop: 0 }}>
                                        <span style={{ color: '#64748b', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <QuestionCircleOutlined style={{ fontSize: 13 }} />
                                            <strong>{loadingQuizChallenges ? (quiz.questions?.length || 0) : (displayQuestions.length || quiz.questionCount || 0)}</strong> câu hỏi
                                        </span>
                                        <span style={{ color: '#64748b', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <ClockCircleOutlined style={{ fontSize: 13 }} />
                                            <strong>{quiz.timeLimitSeconds || 900}</strong> s
                                        </span>

                                    </Space>
                                </div>
                            </div>

                            {/* Right Side: Reward Section */}
                            <div style={{
                                padding: '8px 12px',
                                background: quiz.rewardCatalogId ? '#fffbeb' : '#f8fafc',
                                borderRadius: 12,
                                border: quiz.rewardCatalogId ? '1px solid #fde68a' : '1px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                minHeight: 60,
                                transition: 'all 0.3s ease'
                            }}>
                                {quiz.rewardCatalogId ? (
                                    <>
                                        <div style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 8,
                                            background: '#fff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            padding: 4,
                                            boxShadow: '0 2px 5px rgba(217,119,6,0.1)'
                                        }}>
                                            <img
                                                src={quiz.rewardIconUrl || 'https://via.placeholder.com/30'}
                                                alt={quiz.rewardName}
                                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <Text type="secondary" style={{ fontSize: 11, lineHeight: 1.2, color: '#b45309' }}>Phần thưởng:</Text>
                                            <Text strong style={{ fontSize: 13, color: '#92400e' }}>{quiz.rewardName}</Text>
                                        </div>
                                        <Divider type="vertical" style={{ height: 24, margin: '0 4px' }} />
                                        <Tooltip title="Thay đổi phần thưởng">
                                            <Button
                                                type="text"
                                                icon={<EditOutlined style={{ color: '#f59e0b' }} />}
                                                onClick={openRewardModal}
                                                style={{ borderRadius: 6 }}
                                            />
                                        </Tooltip>
                                    </>
                                ) : (
                                    <Button
                                        type="dashed"
                                        icon={<TrophyOutlined />}
                                        onClick={openRewardModal}
                                        style={{
                                            height: 40,
                                            borderRadius: 8,
                                            color: '#d97706',
                                            borderColor: '#fcd34d',
                                            background: '#fff',
                                            fontWeight: 600,
                                            fontSize: 13
                                        }}
                                    >
                                        Thiết lập phần thưởng
                                    </Button>
                                )}
                            </div>
                        </div>



                        {(quiz.description || quiz.instructions) && (
                            <div style={{ marginTop: 12, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#475569', border: '1px solid #f1f5f9' }}>
                                {quiz.description && <div>{quiz.description}</div>}
                                {quiz.instructions && <div style={{ marginTop: 4, color: '#1e293b' }}>📝 <strong>Học viên lưu ý:</strong> {quiz.instructions}</div>}
                            </div>
                        )}
                    </Card>

                    {/* Action Buttons - Always visible */}
                    <Card
                        style={{
                            borderRadius: 16,
                            marginBottom: 24,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                            border: '1px solid #e2e8f0',
                        }}
                        headStyle={{ borderRadius: '16px 16px 0 0', borderBottom: '1px solid #f1f5f9' }}
                        title={
                            <Space>
                                <QuestionCircleOutlined style={{ color: '#2563eb' }} />
                                <span style={{ fontWeight: 600 }}>
                                    Danh sách câu hỏi ({loadingQuizChallenges ? (quiz.questions?.length || 0) : (displayQuestions.length || quiz.questionCount || 0)} câu)
                                </span>
                            </Space>
                        }
                        extra={
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={openBatchQuestionsModal}
                                style={{
                                    borderRadius: 8,
                                    height: 36,
                                    fontWeight: 700,
                                    background: 'linear-gradient(90deg, #1890ff, #0076e4)',
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(24,144,255,0.25)'
                                }}
                            >
                                Nhập trực tiếp nhiều câu
                            </Button>
                        }
                    >
                        {/* Import Excel buttons - Inline Row */}
                        <div style={{
                            display: 'flex',
                            gap: 12,
                            padding: '10px 16px',
                            background: '#f8fafc',
                            borderRadius: 12,
                            border: '1px solid #e2e8f0',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            marginBottom: 16
                        }}>
                            <UploadOutlined style={{ fontSize: 16, color: '#64748b' }} />
                            <Text strong style={{ color: '#475569', fontSize: 12 }}>
                                Excel:
                            </Text>
                            <Button
                                size="small"
                                icon={<DownloadOutlined />}
                                onClick={handleDownloadChallengeTemplate}
                                style={{
                                    borderRadius: 6,
                                    fontSize: 12,
                                    border: '1px solid #1890ff',
                                    color: '#1890ff',
                                }}
                            >
                                Template mẫu
                            </Button>
                            <Button
                                size="small"
                                icon={<PlusOutlined />}
                                onClick={openImportChallengesModal}
                                style={{
                                    borderRadius: 6,
                                    fontSize: 12,
                                    border: '1px solid #52c41a',
                                    color: '#52c41a',
                                }}
                            >
                                Import câu hỏi
                            </Button>
                            <Text type="secondary" style={{ fontSize: 11, marginLeft: 'auto' }}>
                                (Đọc, Nghe, Viết, Nói)
                            </Text>
                        </div>

                        {/* Questions Table */}
                        {displayQuestions && displayQuestions.length > 0 ? (
                            <Table
                                dataSource={displayQuestions}
                                columns={questionColumns}
                                rowKey={(r: any) => `${r.id}-${r.questionOrder}-${r.skillType}`}
                                locale={{ emptyText: 'Không có câu hỏi nào' }}
                                scroll={{ x: 'max-content', y: 600 }}
                                rowClassName={(_, index) =>
                                    index % 2 === 0 ? '' : 'quiz-row-alt'
                                }
                            />
                        ) : (
                            <div style={{
                                padding: '48px 24px',
                                textAlign: 'center',
                                background: '#f8fafc',
                                borderRadius: 16,
                                border: '1.5px dashed #cbd5e1',
                            }}>
                                <QuestionCircleOutlined style={{ fontSize: 48, color: '#94a3b8', marginBottom: 16 }} />
                                <div style={{ marginBottom: 8 }}>
                                    <Text style={{ fontSize: 16, fontWeight: 600, color: '#475569' }}>
                                        Quiz này chưa có câu hỏi nào
                                    </Text>
                                </div>
                                <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
                                    Thêm câu hỏi từ ngân hàng đề hoặc tạo câu hỏi mới bằng các nút bên trên
                                </Text>
                                <Space size={12}>
                                    <Button
                                        type="primary"
                                        icon={<BankOutlined />}
                                        onClick={() => openChallengeModal(quiz.skillType && quiz.skillType !== 'MIXED' ? quiz.skillType : 'READING')}
                                        style={{ borderRadius: 8, height: 40, fontWeight: 700, paddingInline: 24, background: 'linear-gradient(90deg, #1890ff, #0076e4)', border: 'none', color: '#fff', boxShadow: '0 4px 12px rgba(24,144,255,0.25)' }}
                                    >
                                        Chọn từ Ngân hàng đề
                                    </Button>
                                    <Button
                                        icon={<PlusOutlined />}
                                        onClick={() => { openChallengeModal(quiz.skillType && quiz.skillType !== 'MIXED' ? quiz.skillType : 'READING'); setIsCreatingNew(true); }}
                                        style={{ borderRadius: 8, height: 40, fontWeight: 700, paddingInline: 24, background: '#f0fdf4', color: '#15803d', border: '1.5px solid #86efac' }}
                                    >
                                        Tạo câu hỏi mới
                                    </Button>
                                </Space>
                            </div>
                        )}
                    </Card>
                </>
            )}




            <Modal
                title="Nhập trực tiếp nhiều câu hỏi"
                open={isBatchQuestionsModalOpen}
                onCancel={() => setIsBatchQuestionsModalOpen(false)}
                width={1100}
                footer={
                    <div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <Button
                            type="primary"
                            loading={submittingBatchQuestions}
                            onClick={handleSubmitBatchQuestions}
                            style={{
                                borderRadius: 8,
                                height: 44,
                                fontWeight: 700,
                                paddingInline: 32,
                                background: 'linear-gradient(90deg, #1890ff, #0076e4)',
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(24,144,255,0.25)'
                            }}
                        >
                            Lưu tất cả & thêm vào quiz
                        </Button>
                    </div>
                }
                centered
                destroyOnHidden
            >
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Text type="secondary">
                        Nhập từng câu hỏi + đáp án, có thể thêm không giới hạn. Hệ thống sẽ gửi tất cả trong một lần lưu.
                    </Text>
                    <Button icon={<PlusOutlined />} onClick={addBatchQuestion} style={{ borderRadius: 8, fontWeight: 600 }}>
                        Thêm câu hỏi
                    </Button>
                </div>

                <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 4 }}>
                    {batchQuestions.map((q, idx) => {
                        const filteredOptions = (q.options || []).map(o => (o || '').trim()).filter(Boolean);
                        return (
                            <Card
                                key={q.tempId}
                                size="small"
                                style={{ marginBottom: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}
                                title={<Text strong>Câu {idx + 1}</Text>}
                                extra={
                                    <Button
                                        type="text"
                                        danger
                                        icon={<MinusCircleOutlined />}
                                        disabled={batchQuestions.length <= 1}
                                        onClick={() => removeBatchQuestion(q.tempId)}
                                    >
                                        Xóa
                                    </Button>
                                }
                            >
                                <Row gutter={16}>
                                    <Col xs={24} md={8}>
                                        <Text strong>Kỹ năng</Text>
                                        <Select
                                            style={{ width: '100%', marginTop: 6 }}
                                            value={q.skillType}
                                            onChange={(val) => updateBatchQuestionField(q.tempId, 'skillType', val)}
                                            disabled={!!(quiz?.skillType && quiz.skillType !== 'MIXED')}
                                            options={Object.entries(SKILL_CONFIG)
                                                .filter(([key]) => !quiz?.skillType || quiz.skillType === 'MIXED' || quiz.skillType === key)
                                                .map(([key, cfg]) => ({ value: key, label: cfg.label }))}
                                        />
                                    </Col>
                                </Row>

                                <div style={{ marginTop: 12 }}>
                                    <Text strong>Tiêu đề bài tập / Yêu cầu</Text>
                                    <Input.TextArea
                                        rows={2}
                                        placeholder="Ví dụ: Chọn từ đúng chính tả để điền vào chỗ trống"
                                        value={q.contentText}
                                        onChange={(e) => updateBatchQuestionField(q.tempId, 'contentText', e.target.value)}
                                        style={{ marginTop: 6, borderRadius: 8 }}
                                    />
                                </div>

                                {q.skillType === 'READING' && (
                                    <>
                                        <div style={{ marginTop: 12 }}>
                                            <Text strong>Câu chứa lỗi sai (Sentence with Error)</Text>
                                            <Input.TextArea
                                                rows={2}
                                                placeholder="Ví dụ: Em đi nàm nương rẫy."
                                                value={q.fullSentence}
                                                onChange={(e) => updateBatchQuestionField(q.tempId, 'fullSentence', e.target.value)}
                                                style={{ marginTop: 6, borderRadius: 8 }}
                                            />
                                        </div>
                                        <Row gutter={12} style={{ marginTop: 12 }}>
                                            <Col xs={24} md={12}>
                                                <Text strong>Từ bị sai (Wrong Word)</Text>
                                                <Input
                                                    placeholder="Ví dụ: nàm"
                                                    value={q.wrongWord}
                                                    onChange={(e) => updateBatchQuestionField(q.tempId, 'wrongWord', e.target.value)}
                                                    style={{ marginTop: 6, borderRadius: 8 }}
                                                />
                                            </Col>
                                            <Col xs={24} md={12}>
                                                <Text strong>Từ viết đúng (Correct Word)</Text>
                                                <Input
                                                    placeholder="Ví dụ: làm"
                                                    value={q.correctWord}
                                                    onChange={(e) => updateBatchQuestionField(q.tempId, 'correctWord', e.target.value)}
                                                    style={{ marginTop: 6, borderRadius: 8 }}
                                                />
                                            </Col>
                                        </Row>
                                        <div style={{ marginTop: 12 }}>
                                            <Text strong>Gợi ý / Giải thích (Hint)</Text>
                                            <Input
                                                placeholder="Ví dụ: Động từ 'làm' phải bắt đầu bằng 'L'."
                                                value={q.hint}
                                                onChange={(e) => updateBatchQuestionField(q.tempId, 'hint', e.target.value)}
                                                style={{ marginTop: 6, borderRadius: 8 }}
                                            />
                                        </div>
                                    </>
                                )}

                                {q.skillType === 'LISTENING' && (
                                    <>
                                        <div style={{ marginTop: 12 }}>
                                            <Text strong>File âm thanh</Text>
                                            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <Upload
                                                    accept="audio/*"
                                                    maxCount={1}
                                                    showUploadList={false}
                                                    beforeUpload={async (file) => {
                                                        setUploadingBatch(prev => ({ ...prev, [q.tempId]: true }));
                                                        try {
                                                            const url = await uploadToCloudinary(file);
                                                            updateBatchQuestionField(q.tempId, 'audioUrl', url);
                                                            message.success('Tải file lên thành công!');
                                                        } catch (err) {
                                                            message.error('Lỗi khi tải file lên Cloudinary');
                                                        } finally {
                                                            setUploadingBatch(prev => ({ ...prev, [q.tempId]: false }));
                                                        }
                                                        return false;
                                                    }}
                                                >
                                                    <Button
                                                        icon={<UploadOutlined />}
                                                        loading={uploadingBatch[q.tempId]}
                                                        style={{ borderRadius: 8 }}
                                                    >
                                                        {q.audioUrl ? 'Thay đổi file' : 'Chọn file âm thanh'}
                                                    </Button>
                                                </Upload>

                                                <Button
                                                    icon={<AudioOutlined />}
                                                    onClick={() => handleAutoGenerateAudioBatch(q.tempId)}
                                                    loading={uploadingBatch[q.tempId]}
                                                    style={{ borderRadius: 8, background: '#f0f7ff', color: '#1890ff', border: '1px solid #91d5ff' }}
                                                >
                                                    Tạo bằng AI (từ Transcript)
                                                </Button>
                                                {q.audioUrl && (
                                                    <audio src={q.audioUrl} controls style={{ flex: 1, height: 32 }} />
                                                )}
                                            </div>
                                            {/* Hidden input to keep value in form logic if needed, though updateBatchQuestionField handles it */}
                                            <Input hidden value={q.audioUrl} />
                                        </div>
                                        <div style={{ marginTop: 12 }}>
                                            <Text strong>Transcript</Text>
                                            <Input.TextArea
                                                rows={2}
                                                placeholder="Nội dung audio"
                                                value={q.transcript}
                                                onChange={(e) => updateBatchQuestionField(q.tempId, 'transcript', e.target.value)}
                                                style={{ marginTop: 6, borderRadius: 8 }}
                                            />
                                        </div>
                                        <div style={{ marginTop: 12 }}>
                                            <Text strong>Đáp án</Text>
                                            <Row gutter={[10, 10]} style={{ marginTop: 6 }}>
                                                {q.options.map((opt, optIdx) => (
                                                    <Col xs={24} md={12} key={`${q.tempId}-opt-${optIdx}`}>
                                                        <Input
                                                            placeholder={`Đáp án ${optIdx + 1}`}
                                                            value={opt}
                                                            onChange={(e) => updateBatchOption(q.tempId, optIdx, e.target.value)}
                                                            style={{ borderRadius: 8 }}
                                                        />
                                                    </Col>
                                                ))}
                                            </Row>
                                        </div>
                                        <div style={{ marginTop: 12 }}>
                                            <Text strong>Đáp án đúng</Text>
                                            <Select
                                                style={{ width: '100%', marginTop: 6 }}
                                                value={q.correctAnswer || undefined}
                                                placeholder="Chọn đáp án đúng"
                                                onChange={(val) => updateBatchQuestionField(q.tempId, 'correctAnswer', val)}
                                                options={filteredOptions.map((o) => ({ value: o, label: o }))}
                                            />
                                        </div>
                                    </>
                                )}

                                {q.skillType === 'WRITING' && (
                                    <>
                                        <div style={{ marginTop: 12 }}>
                                            <Text strong>Nội dung câu đố (với ký hiệu _ )</Text>
                                            <Input.TextArea
                                                rows={2}
                                                placeholder="Ví dụ: Lúa _ là lúa nếp làng."
                                                value={q.blankSentence}
                                                onChange={(e) => updateBatchQuestionField(q.tempId, 'blankSentence', e.target.value)}
                                                style={{ marginTop: 6, borderRadius: 8 }}
                                            />
                                        </div>
                                        <Row gutter={12} style={{ marginTop: 12 }}>
                                            <Col xs={24} md={12}>
                                                <Text strong>Đáp án đúng (Correct Answer)</Text>
                                                <Input
                                                    placeholder="Ví dụ: nếp"
                                                    value={q.correctAnswer}
                                                    onChange={(e) => updateBatchQuestionField(q.tempId, 'correctAnswer', e.target.value)}
                                                    style={{ marginTop: 6, borderRadius: 8 }}
                                                />
                                            </Col>
                                            <Col xs={24} md={12}>
                                                <Text strong>Đáp án chấp nhận khác (Alternative)</Text>
                                                <Input
                                                    placeholder="Cách nhau bởi dấu phẩy"
                                                    value={q.alternatives}
                                                    onChange={(e) => updateBatchQuestionField(q.tempId, 'alternatives', e.target.value)}
                                                    style={{ marginTop: 6, borderRadius: 8 }}
                                                />
                                            </Col>
                                        </Row>
                                        <div style={{ marginTop: 12 }}>
                                            <Text strong>Gợi ý (Hint)</Text>
                                            <Input
                                                placeholder="Ví dụ: Ngược lại với nếp là tẻ."
                                                value={q.hint}
                                                onChange={(e) => updateBatchQuestionField(q.tempId, 'hint', e.target.value)}
                                                style={{ marginTop: 6, borderRadius: 8 }}
                                            />
                                        </div>
                                    </>
                                )}

                                {q.skillType === 'SPEAKING' && (
                                    <>
                                        <div style={{ marginTop: 12 }}>
                                            <Text strong>File âm thanh mẫu</Text>
                                            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <Upload
                                                    accept="audio/*"
                                                    maxCount={1}
                                                    showUploadList={false}
                                                    beforeUpload={async (file) => {
                                                        setUploadingBatch(prev => ({ ...prev, [q.tempId]: true }));
                                                        try {
                                                            const url = await uploadToCloudinary(file);
                                                            updateBatchQuestionField(q.tempId, 'audioUrl', url);
                                                            message.success('Tải file lên thành công!');
                                                        } catch (err) {
                                                            message.error('Lỗi khi tải file lên Cloudinary');
                                                        } finally {
                                                            setUploadingBatch(prev => ({ ...prev, [q.tempId]: false }));
                                                        }
                                                        return false;
                                                    }}
                                                >
                                                    <Button
                                                        icon={<UploadOutlined />}
                                                        loading={uploadingBatch[q.tempId]}
                                                        style={{ borderRadius: 8 }}
                                                    >
                                                        {q.audioUrl ? 'Thay đổi file mẫu' : 'Chọn file mẫu từ máy tính'}
                                                    </Button>
                                                </Upload>

                                                <Button
                                                    icon={<AudioOutlined />}
                                                    onClick={() => handleAutoGenerateAudioBatch(q.tempId)}
                                                    loading={uploadingBatch[q.tempId]}
                                                    style={{ borderRadius: 8, background: '#f0f7ff', color: '#1890ff', border: '1px solid #91d5ff' }}
                                                >
                                                    Tạo bằng AI (từ Transcript)
                                                </Button>
                                                {q.audioUrl && (
                                                    <audio src={q.audioUrl} controls style={{ flex: 1, height: 32 }} />
                                                )}
                                            </div>
                                            <Input hidden value={q.audioUrl} />
                                        </div>
                                        <div style={{ marginTop: 12 }}>
                                            <Text strong>Transcript</Text>
                                            <Input.TextArea
                                                rows={2}
                                                placeholder="Nội dung cần nói"
                                                value={q.transcript}
                                                onChange={(e) => updateBatchQuestionField(q.tempId, 'transcript', e.target.value)}
                                                style={{ marginTop: 6, borderRadius: 8 }}
                                            />
                                        </div>
                                        <div style={{ marginTop: 12 }}>
                                            <Text strong>Gợi ý</Text>
                                            <Input
                                                placeholder="Gợi ý (không bắt buộc)"
                                                value={q.hint}
                                                onChange={(e) => updateBatchQuestionField(q.tempId, 'hint', e.target.value)}
                                                style={{ marginTop: 6, borderRadius: 8 }}
                                            />
                                        </div>
                                    </>
                                )}
                            </Card>
                        );
                    })}
                </div>
            </Modal>

            <Modal
                title={
                    <Space>
                        {editingChallengeId ? <EditOutlined style={{ color: '#faad14' }} /> : <BankOutlined style={{ color: '#2563eb' }} />}
                        <span>
                            {editingChallengeId
                                ? `Cập nhật câu hỏi`
                                : `Thêm câu hỏi cho kỹ năng: ${activeSkillType ? SKILL_CONFIG[activeSkillType]?.label : ''}`
                            }
                        </span>
                    </Space>
                }
                open={isChallengeModalOpen}
                onCancel={() => {
                    setIsChallengeModalOpen(false);
                    setEditingChallengeId(null);
                }}
                width={800}
                footer={null}
                centered
                destroyOnHidden
            >
                <Tabs
                    activeKey={isCreatingNew ? 'create' : 'bank'}
                    onChange={(key) => setIsCreatingNew(key === 'create')}
                    items={[
                        ...(editingChallengeId ? [] : [{
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
                                            .filter(c => {
                                                if (!bankSearchText) return true;
                                                const search = bankSearchText.toLowerCase();
                                                if (c.contentText?.toLowerCase().includes(search)) return true;
                                                // Also search in metadataJson details
                                                const meta = typeof c.metadataJson === 'string'
                                                    ? (() => { try { return JSON.parse(c.metadataJson); } catch { return {}; } })()
                                                    : (c.metadataJson || {});
                                                if (Array.isArray(meta.words) && meta.words.join(' ').toLowerCase().includes(search)) return true;
                                                if (meta.correct_word?.toLowerCase().includes(search)) return true;
                                                if (meta.transcript?.toLowerCase().includes(search)) return true;
                                                if (meta.correctSentence?.toLowerCase().includes(search)) return true;
                                                return false;
                                            })
                                        }
                                        rowKey="id"
                                        size="middle"
                                        scroll={{ x: 'max-content' }}
                                        columns={[
                                            {
                                                title: 'Nội dung',
                                                dataIndex: 'contentText',
                                                key: 'contentText',
                                                render: (_text: string, record: any) => {
                                                    const parsed = parseMetadata(record);
                                                    const meta = parsed.metadataJson || {};
                                                    const skill = parsed.skillType;

                                                    return (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                                                                {parsed.contentText || '—'}
                                                            </Text>

                                                            <div style={{ fontSize: 14 }}>
                                                                {skill === 'READING' && Array.isArray(meta.words) && (
                                                                    <div>
                                                                        {meta.words.map((w: string, i: number) => (
                                                                            <span key={i} style={{
                                                                                color: '#334155',
                                                                                textDecoration: i === meta.error_index ? 'line-through' : 'none',
                                                                                fontWeight: i === meta.error_index ? 600 : 400,
                                                                                marginRight: 4
                                                                            }}>
                                                                                {w}
                                                                            </span>
                                                                        ))}

                                                                    </div>
                                                                )}

                                                                {(skill === 'LISTENING' || skill === 'SPEAKING') && meta.transcript && (
                                                                    <Text italic style={{ color: '#0f172a' }}>"{meta.transcript}"</Text>
                                                                )}

                                                                {skill === 'WRITING' && meta.correctSentence && (
                                                                    <Text strong style={{ color: '#0f172a' }}>{meta.correctSentence}</Text>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
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
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                        <Button onClick={() => setIsChallengeModalOpen(false)} style={{ borderRadius: 8, height: 40, fontWeight: 600 }}>Hủy</Button>
                                        <Button
                                            type="primary"
                                            onClick={handleAssignFromBank}
                                            disabled={selectedBankIds.length === 0}
                                            loading={submittingAssign}
                                            style={{ borderRadius: 8, height: 40, fontWeight: 700, paddingInline: 24, background: 'linear-gradient(90deg, #1890ff, #0076e4)', border: 'none', color: '#fff', boxShadow: '0 4px 12px rgba(24,144,255,0.25)' }}
                                        >
                                            Xác nhận thêm {selectedBankIds.length > 0 ? `(${selectedBankIds.length})` : ''}
                                        </Button>
                                    </div>
                                </div>
                            )
                        }]),
                        {
                            key: 'create',
                            label: (
                                <span>
                                    <PlusOutlined /> {editingChallengeId ? 'Cập nhật câu hỏi' : 'Tạo câu hỏi mới'}
                                </span>
                            ),
                            children: (
                                <Form
                                    form={createForm}
                                    layout="vertical"
                                    onFinish={handleCreateNewChallenge}
                                    initialValues={{ difficultyTag: 'BEGINNER' }}
                                    style={{ marginTop: 16 }}
                                >
                                    <Form.Item
                                        name="contentText"
                                        label={<Text strong>Nội dung câu hỏi / Yêu cầu</Text>}
                                        rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
                                    >
                                        <Input.TextArea rows={2} placeholder="Ví dụ: Tìm từ trái nghĩa với..." style={{ borderRadius: 8 }} />
                                    </Form.Item>



                                    <Card size="small" style={{ background: '#f8fafc', borderRadius: 8, marginBottom: 16 }}>
                                        {activeSkillType === 'READING' && (
                                            <>
                                                <Form.Item name="fullSentence" label={<Text strong>Câu chứa lỗi sai (Sentence with Error)</Text>} rules={[{ required: true }]}>
                                                    <Input.TextArea rows={2} placeholder="Ví dụ: Em đi nàm nương rẫy." />
                                                </Form.Item>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                                    <Form.Item name="wrongWord" label={<Text strong>Từ bị sai (Wrong Word)</Text>} rules={[{ required: true }]}>
                                                        <Input placeholder="Ví dụ: nàm" />
                                                    </Form.Item>
                                                    <Form.Item name="correctWord" label={<Text strong>Từ viết lại đúng</Text>} rules={[{ required: true }]}>
                                                        <Input placeholder="Ví dụ: làm" />
                                                    </Form.Item>
                                                </div>
                                                <Form.Item name="hint" label={<Text strong>Gợi ý / Giải thích (Hint)</Text>}>
                                                    <Input placeholder="Giải thích cho người học..." />
                                                </Form.Item>
                                            </>
                                        )}

                                        {activeSkillType === 'LISTENING' && (
                                            <>
                                                <Form.Item label={<Text strong>File âm thanh</Text>} required={!createForm.getFieldValue('audioUrl')}>
                                                    <Space direction="vertical" style={{ width: '100%' }}>
                                                        <Upload
                                                            accept="audio/*"
                                                            maxCount={1}
                                                            showUploadList={false}
                                                            beforeUpload={async (file) => {
                                                                setUploadingSingle(true);
                                                                try {
                                                                    const url = await uploadToCloudinary(file);
                                                                    createForm.setFieldsValue({ audioUrl: url });
                                                                    message.success('Tải file âm thanh lên thành công!');
                                                                } catch (err) {
                                                                    message.error('Lỗi khi tải file lên Cloudinary');
                                                                } finally {
                                                                    setUploadingSingle(false);
                                                                }
                                                                return false;
                                                            }}
                                                        >
                                                            <Button
                                                                icon={<UploadOutlined />}
                                                                loading={uploadingSingle}
                                                                style={{ borderRadius: 8 }}
                                                            >
                                                                {createForm.getFieldValue('audioUrl') ? 'Thay đổi file' : 'Chọn file từ máy tính'}
                                                            </Button>
                                                        </Upload>
                                                        <Button
                                                            icon={<AudioOutlined />}
                                                            onClick={handleAutoGenerateAudioSingle}
                                                            loading={uploadingSingle}
                                                            style={{ borderRadius: 8, background: '#f0f7ff', color: '#1890ff', border: '1px solid #91d5ff' }}
                                                        >
                                                            Tạo bằng AI (từ Transcript)
                                                        </Button>

                                                        {createForm.getFieldValue('audioUrl') && (
                                                            <div style={{ marginTop: 8, padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                                                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>Nghe thử:</Text>
                                                                <audio src={createForm.getFieldValue('audioUrl')} controls style={{ width: '100%', height: 36 }} />
                                                            </div>
                                                        )}
                                                        <Form.Item name="audioUrl" rules={[{ required: true, message: 'Vui lòng upload file âm thanh' }]} noStyle>
                                                            <Input hidden />
                                                        </Form.Item>
                                                    </Space>
                                                </Form.Item>
                                                <Form.Item name="transcript" label={<Text strong>Lời thoại (Transcript)</Text>} extra="Nhập nội dung để AI tạo giọng đọc">
                                                    <Input.TextArea rows={2} placeholder="Ví dụ: Lúa nếp là lúa nếp làng..." style={{ borderRadius: 8 }} />
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
                                                <Form.Item name="blankSentence" label={<Text strong>Nội dung câu đố (với ký hiệu _ )</Text>} rules={[{ required: true }]}>
                                                    <Input placeholder="Ví dụ: Lúa _ là lúa nếp làng." />
                                                </Form.Item>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                                    <Form.Item name="correctAnswer" label={<Text strong>Đáp án đúng</Text>} rules={[{ required: true }]}>
                                                        <Input placeholder="Ví dụ: nếp" />
                                                    </Form.Item>
                                                    <Form.Item name="alternatives" label={<Text strong>Đáp án chấp nhận khác</Text>}>
                                                        <Input placeholder="Cách nhau bởi dấu phẩy" />
                                                    </Form.Item>
                                                </div>
                                                <Form.Item name="hint" label={<Text strong>Gợi ý (Hint)</Text>}>
                                                    <Input placeholder="Gợi ý khi gặp khó khăn..." />
                                                </Form.Item>
                                            </>
                                        )}

                                        {activeSkillType === 'SPEAKING' && (
                                            <>
                                                <Form.Item name="transcript" label={<Text strong>Nội dung cần nói</Text>} rules={[{ required: true }]}>
                                                    <Input.TextArea rows={2} style={{ borderRadius: 8 }} />
                                                </Form.Item>
                                                <Form.Item label={<Text strong>File âm thanh mẫu</Text>} required={!createForm.getFieldValue('audioUrl')}>
                                                    <Space direction="vertical" style={{ width: '100%' }}>
                                                        <Upload
                                                            accept="audio/*"
                                                            maxCount={1}
                                                            showUploadList={false}
                                                            beforeUpload={async (file) => {
                                                                setUploadingSingle(true);
                                                                try {
                                                                    const url = await uploadToCloudinary(file);
                                                                    createForm.setFieldsValue({ audioUrl: url });
                                                                    message.success('Tải file âm thanh mẫu lên thành công!');
                                                                } catch (err) {
                                                                    message.error('Lỗi khi tải file lên Cloudinary');
                                                                } finally {
                                                                    setUploadingSingle(false);
                                                                }
                                                                return false;
                                                            }}
                                                        >
                                                            <Button
                                                                icon={<UploadOutlined />}
                                                                loading={uploadingSingle}
                                                                style={{ borderRadius: 8 }}
                                                            >
                                                                {createForm.getFieldValue('audioUrl') ? 'Thay đổi file mẫu' : 'Chọn file từ máy tính'}
                                                            </Button>
                                                        </Upload>
                                                        <Button
                                                            icon={<AudioOutlined />}
                                                            onClick={handleAutoGenerateAudioSingle}
                                                            loading={uploadingSingle}
                                                            style={{ borderRadius: 8, background: '#f0f7ff', color: '#1890ff', border: '1px solid #91d5ff' }}
                                                        >
                                                            Tạo bằng AI (từ Transcript)
                                                        </Button>

                                                        {createForm.getFieldValue('audioUrl') && (
                                                            <div style={{ marginTop: 8, padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                                                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>Nghe thử mẫu:</Text>
                                                                <audio src={createForm.getFieldValue('audioUrl')} controls style={{ width: '100%', height: 36 }} />
                                                            </div>
                                                        )}
                                                        <Form.Item name="audioUrl" rules={[{ required: true, message: 'Vui lòng upload file âm thanh mẫu' }]} noStyle>
                                                            <Input hidden />
                                                        </Form.Item>
                                                    </Space>
                                                </Form.Item>
                                            </>
                                        )}
                                    </Card >

                                    <div style={{ textAlign: 'right', marginTop: 16 }}>
                                        <Space>
                                            <Button onClick={() => setIsChallengeModalOpen(false)} style={{ borderRadius: 8, height: 40, fontWeight: 600 }}>Hủy</Button>
                                            <Button type="primary" htmlType="submit" loading={submittingCreate}
                                                style={{ borderRadius: 8, height: 40, fontWeight: 700, paddingInline: 24, background: 'linear-gradient(90deg, #1890ff, #0076e4)', border: 'none', color: '#fff', boxShadow: '0 4px 12px rgba(24,144,255,0.25)' }}>
                                                {editingChallengeId ? 'Lưu cập nhật' : 'Lưu và thêm vào quiz'}
                                            </Button>
                                        </Space>
                                    </div>
                                </Form >
                            )
                        }
                    ]}
                />
            </Modal >

            {/* Detail View Modal (Nested or separate) */}
            < Modal
                title={
                    < Space >
                        <EyeOutlined style={{ color: '#2563eb' }} />
                        <span>Chi tiết câu hỏi</span>
                    </Space >
                }
                open={isDetailModalOpen}
                onCancel={() => setIsDetailModalOpen(false)}
                footer={
                    [
                        <Button key="close" onClick={() => setIsDetailModalOpen(false)} type="primary"
                            style={{ borderRadius: 8, height: 40, fontWeight: 700, paddingInline: 32, background: 'linear-gradient(90deg, #1890ff, #0076e4)', border: 'none', color: '#fff', boxShadow: '0 4px 12px rgba(24,144,255,0.25)' }}>
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
                                        <Text strong>Các từ trong câu (phân cách bằng |):</Text>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 8 }}>
                                            {selectedDetailChallenge.metadataJson?.words?.map((word: string, idx: number) => (
                                                <Tag key={idx} color={idx === selectedDetailChallenge.metadataJson?.error_index ? 'error' : 'default'} style={{ padding: '4px 12px', borderRadius: 6 }}>
                                                    {word}
                                                </Tag>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <Text strong style={{ display: 'block' }}>Từ viết đúng:</Text>
                                            <Tag color="success" style={{ marginTop: 4 }}>{selectedDetailChallenge.metadataJson?.correct_word}</Tag>
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
                                        <Text strong>Nội dung câu đố:</Text>
                                        <div style={{ marginTop: 8, padding: '16px', background: '#fff', borderRadius: 12, border: '1px dashed #cbd5e1', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                                            <span style={{ fontSize: 18, color: '#1e293b', letterSpacing: '0.01em' }}>
                                                {selectedDetailChallenge.metadataJson?.blankSentence || selectedDetailChallenge.metadataJson?.correctSentence}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <Card size="small" style={{ borderRadius: 10, border: '1px solid #dcfce7', background: '#f0fdf4' }}>
                                            <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>ĐÁP ÁN ĐÚNG</Text>
                                            <Text strong style={{ fontSize: 16, color: '#16a34a' }}>
                                                {selectedDetailChallenge.metadataJson?.correctAnswer || '—'}
                                            </Text>
                                        </Card>

                                        {selectedDetailChallenge.metadataJson?.alternatives?.length > 0 && (
                                            <Card size="small" style={{ borderRadius: 10, border: '1px solid #e0f2fe', background: '#f0f9ff' }}>
                                                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>ĐÁP ÁN CHẤP NHẬN KHÁC</Text>
                                                <Space wrap>
                                                    {selectedDetailChallenge.metadataJson?.alternatives.map((alt: string, i: number) => (
                                                        <Tag key={i} color="blue" style={{ borderRadius: 4, margin: 0 }}>{alt}</Tag>
                                                    ))}
                                                </Space>
                                            </Card>
                                        )}

                                        {selectedDetailChallenge.metadataJson?.hint && (
                                            <div style={{ gridColumn: 'span 2', marginTop: 8, padding: '12px', background: '#fef3c7', borderRadius: 10, border: '1px solid #fde68a' }}>
                                                <Text strong style={{ color: '#92400e', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                    <InfoCircleOutlined /> Gợi ý (Hint)
                                                </Text>
                                                <Text style={{ color: '#b45309' }}>{selectedDetailChallenge.metadataJson?.hint}</Text>
                                            </div>
                                        )}
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
            </Modal >

            {/* Edit Quiz Modal */}
            < Modal
                title={< span style={{ fontWeight: 600 }}> Chỉnh sửa quiz</span >}
                open={isEditQuizModalOpen}
                onCancel={() => setIsEditQuizModalOpen(false)}
                onOk={() => editQuizForm.submit()}
                confirmLoading={updatingQuiz}
                okText="Lưu thay đổi"
                okButtonProps={{
                    style: { borderRadius: 8, height: 40, fontWeight: 700, paddingInline: 32, background: 'linear-gradient(90deg, #1890ff, #0076e4)', border: 'none', color: '#fff', boxShadow: '0 4px 12px rgba(24,144,255,0.25)' }
                }}
                cancelText="Hủy bỏ"
                cancelButtonProps={{ style: { borderRadius: 8, height: 40 } }}
                width={800}
                centered
            >
                <Form
                    form={editQuizForm}
                    layout="vertical"
                    onFinish={handleUpdateQuiz}
                >
                    <Row gutter={24}>
                        <Col span={14}>
                            <Form.Item
                                label="Tên quiz"
                                name="title"
                                rules={[{ required: true, message: 'Vui lòng nhập tên quiz' }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={10}>
                            <Form.Item label="Mỗi câu (giây)" name="secondsPerQuestion">
                                <InputNumber min={1} style={{ width: '100%' }} />
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

                    <Row gutter={24}>
                        <Col span={12}>
                            <Form.Item label="Kỹ năng" name="skillType"
                                extra={quizChallenges.length > 0 ? (
                                    <span style={{ color: '#f59e0b', fontSize: 12 }}>
                                        ⚠️ Không thể thay đổi kỹ năng khi đã có {quizChallenges.length} câu hỏi
                                    </span>
                                ) : undefined}
                            >
                                <Select
                                    disabled={quizChallenges.length > 0}
                                    options={[
                                        { value: 'READING', label: '📖 Reading' },
                                        { value: 'LISTENING', label: '🎧 Listening' },
                                        { value: 'SPEAKING', label: '🎙️ Speaking' },
                                        { value: 'WRITING', label: '✍️ Writing' },
                                        { value: 'MIXED', label: '🎯 Tổng hợp' },
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Điểm mỗi câu" name="pointsPerQuestion">
                                <InputNumber style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={24}>
                        <Col span={12}>
                            <Form.Item label="Số thứ tự (STT)" name="orderIndex" tooltip="Thứ tự hiển thị trong level">
                                <InputNumber min={1} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Ghi chú cập nhật" name="comment">
                                <Input placeholder="Lý do chỉnh sửa..." />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal >

            <Modal
                title={
                    <Space>
                        <PlusOutlined style={{ color: '#2563eb' }} />
                        <span style={{ fontSize: 18, fontWeight: 700 }}>Tạo bài kiểm tra mới</span>
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
                okButtonProps={{
                    style: { borderRadius: 8, height: 40, fontWeight: 700, paddingInline: 32, background: 'linear-gradient(90deg, #1890ff, #0076e4)', border: 'none', color: '#fff', boxShadow: '0 4px 12px rgba(24,144,255,0.25)' }
                }}
                cancelText="Hủy"
                cancelButtonProps={{ style: { borderRadius: 8, height: 40 } }}
                width={700}
                centered
            >
                <Form
                    form={newQuizForm}
                    layout="vertical"
                    onFinish={handleCreateQuiz}
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
                        <Form.Item name="skillType" label={<Text strong>Loại kỹ năng</Text>} rules={[{ required: true, message: 'Chọn loại kỹ năng' }]}>
                            <Select placeholder="Chọn loại" options={[
                                { value: 'READING', label: '📖 Reading' },
                                { value: 'LISTENING', label: '🎧 Listening' },
                                { value: 'SPEAKING', label: '🎙️ Speaking' },
                                { value: 'WRITING', label: '✍️ Writing' },
                                { value: 'MIXED', label: '🎯 Tổng hợp' },
                            ]} />
                        </Form.Item>
                        <Form.Item
                            name="secondsPerQuestion"
                            label={<Text strong>Số giây mỗi câu hỏi</Text>}
                            initialValue={90}
                            rules={[{ required: true, message: 'Nhập số giây mỗi câu' }]}
                        >
                            <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                    </div>
                </Form>
            </Modal>

            {/* Import Quiz Modal */}
            <Modal
                title={
                    <Space>
                        <UploadOutlined style={{ color: '#15803d' }} />
                        <span style={{ fontSize: 18, fontWeight: 700 }}>Import quiz từ CSV</span>
                    </Space>
                }
                open={isImportModalOpen}
                onCancel={() => setIsImportModalOpen(false)}
                footer={null}
                width={560}
                centered
            >
                <div style={{ marginTop: 20 }}>
                    <div style={{ marginBottom: 16, padding: 16, background: '#f0f9ff', borderRadius: 12, border: '1px solid #bae6fd' }}>
                        <Text style={{ color: '#0369a1', fontSize: 13 }}>
                            <strong>Hướng dẫn:</strong> Tải template mẫu, điền dữ liệu rồi upload file CSV.<br />
                            Các cột: Tên quiz, Mô tả, Hướng dẫn, Điểm đạt (%), Thời gian (giây)
                        </Text>
                    </div>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                        style={{ marginBottom: 16, display: 'block' }}
                    />
                    <Button
                        type="primary"
                        icon={<UploadOutlined />}
                        onClick={handleImportQuizCSV}
                        loading={importing}
                        disabled={!importFile}
                        size="large"
                        style={{ width: '100%', borderRadius: 10, fontWeight: 700, background: 'linear-gradient(90deg, #15803d, #16a34a)', border: 'none', color: '#fff', marginBottom: 16, height: 44, boxShadow: '0 4px 12px rgba(21,128,61,0.25)' }}
                    >
                        {importing ? 'Đang import...' : 'Bắt đầu Import'}
                    </Button>
                    {importResult && (
                        <div style={{ marginTop: 8 }}>
                            {importResult.success > 0 && (
                                <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, marginBottom: 8 }}>
                                    <Text style={{ color: '#15803d', fontWeight: 600 }}>
                                        ✅ Import thành công {importResult.success} quiz
                                    </Text>
                                </div>
                            )}
                            {importResult.errors.length > 0 && (
                                <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, maxHeight: 150, overflowY: 'auto' }}>
                                    {importResult.errors.map((err, i) => (
                                        <div key={i} style={{ color: '#dc2626', fontSize: 12, marginBottom: 2 }}>❌ {err}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Modal>

            {/* Import Challenges Excel to Quiz Modal */}
            <Modal
                title={
                    <Space>
                        <UploadOutlined style={{ color: '#15803d' }} />
                        <span style={{ fontSize: 18, fontWeight: 700 }}>Import câu hỏi từ Excel vào quiz</span>
                    </Space>
                }
                open={isImportChallengesModalOpen}
                onCancel={() => setIsImportChallengesModalOpen(false)}
                footer={null}
                width={640}
                centered
                destroyOnHidden
            >
                <div style={{ marginTop: 20 }}>
                    {/* Info box */}
                    <div style={{
                        marginBottom: 16,
                        padding: 16,
                        background: 'linear-gradient(135deg, #f0f9ff 0%, #ecfeff 100%)',
                        borderRadius: 12,
                        border: '1px solid #bae6fd',
                    }}>
                        <Text style={{ color: '#0369a1', fontSize: 13 }}>
                            <strong>📋 Hướng dẫn:</strong><br />
                            1. Chọn loại kỹ năng bên dưới<br />
                            2. Tải template Excel mẫu<br />
                            3. Điền dữ liệu câu hỏi theo template<br />
                            4. Upload file Excel đã điền để import câu hỏi vào quiz
                        </Text>
                    </div>

                    {/* Skill type selector */}
                    <div style={{ marginBottom: 16 }}>
                        <Text strong style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>
                            Loại kỹ năng:
                        </Text>
                        <Select
                            value={importChallengesSkillType}
                            onChange={(val) => setImportChallengesSkillType(val)}
                            style={{ width: '100%' }}
                            options={[
                                ...(quiz?.skillType === 'MIXED' || !quiz?.skillType
                                    ? [{ value: 'MIXED', label: '🎯 Tổng hợp (4 kỹ năng — mỗi kỹ năng 1 sheet)' }]
                                    : []),
                                ...Object.entries(SKILL_CONFIG)
                                    .filter(([key]) => !quiz?.skillType || quiz.skillType === 'MIXED' || quiz.skillType === key)
                                    .map(([key, cfg]) => ({
                                        value: key,
                                        label: `${cfg.icon ? '' : ''}${cfg.label}`,
                                    })),
                            ]}
                        />
                    </div>

                    {/* Download template button */}
                    <Button
                        icon={<DownloadOutlined />}
                        onClick={handleDownloadChallengeTemplate}
                        style={{
                            marginBottom: 16,
                            borderRadius: 8,
                            fontWeight: 600,
                            background: '#f0f9ff',
                            color: '#0369a1',
                            border: '1.5px solid #bae6fd',
                            width: '100%',
                        }}
                        size="large"
                    >
                        📥 Tải Template Excel
                        {importChallengesSkillType === 'MIXED'
                            ? ' (Tổng hợp 4 kỹ năng)'
                            : ` (${SKILL_CONFIG[importChallengesSkillType]?.label || importChallengesSkillType})`}
                    </Button>

                    <Divider style={{ margin: '16px 0' }}>Hoặc upload file đã điền</Divider>

                    {/* File upload */}
                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => setImportChallengesFile(e.target.files?.[0] || null)}
                        style={{
                            marginBottom: 16,
                            display: 'block',
                            width: '100%',
                            padding: 12,
                            border: '2px dashed #d1d5db',
                            borderRadius: 10,
                            cursor: 'pointer',
                            background: '#fafafa',
                        }}
                    />

                    {/* Import button */}
                    <Button
                        type="primary"
                        icon={<UploadOutlined />}
                        onClick={handleImportChallengesToQuiz}
                        loading={importingChallenges}
                        disabled={!importChallengesFile}
                        size="large"
                        style={{
                            width: '100%',
                            borderRadius: 10,
                            fontWeight: 700,
                            background: 'linear-gradient(90deg, #15803d, #16a34a)',
                            border: 'none',
                            marginBottom: 16,
                            height: 48,
                            fontSize: 15,
                            color: '#fff',
                            boxShadow: '0 4px 12px rgba(21,128,61,0.25)'
                        }}
                    >
                        {importingChallenges ? 'Đang import...' : '🚀 Import câu hỏi vào quiz'}
                    </Button>

                    {/* Result display */}
                    {importChallengesResult && (
                        <div style={{ marginTop: 8 }}>
                            {importChallengesResult.successCount > 0 && (
                                <div style={{
                                    padding: '12px 16px',
                                    background: '#f0fdf4',
                                    border: '1px solid #86efac',
                                    borderRadius: 10,
                                    marginBottom: 10,
                                }}>
                                    <Text style={{ color: '#15803d', fontWeight: 700, fontSize: 14 }}>
                                        ✅ Import thành công {importChallengesResult.successCount} câu hỏi
                                    </Text>
                                    {importChallengesResult.skipCount > 0 && (
                                        <Text style={{ color: '#a16207', display: 'block', fontSize: 12, marginTop: 4 }}>
                                            ⚠️ Bỏ qua {importChallengesResult.skipCount} câu (đã tồn tại)
                                        </Text>
                                    )}
                                    {importChallengesResult.errorCount > 0 && (
                                        <Text style={{ color: '#dc2626', display: 'block', fontSize: 12, marginTop: 4 }}>
                                            ❌ Lỗi {importChallengesResult.errorCount} dòng
                                        </Text>
                                    )}
                                </div>
                            )}
                            {importChallengesResult.messages && importChallengesResult.messages.length > 0 && (
                                <div style={{
                                    padding: '10px 14px',
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 10,
                                    maxHeight: 200,
                                    overflowY: 'auto',
                                    fontSize: 12,
                                    fontFamily: 'monospace',
                                }}>
                                    {importChallengesResult.messages.map((msg: string, i: number) => (
                                        <div
                                            key={i}
                                            style={{
                                                marginBottom: 3,
                                                color: msg.includes('✅') || msg.includes('thành công') ? '#15803d'
                                                    : msg.includes('❌') || msg.includes('Lỗi') ? '#dc2626'
                                                        : msg.includes('bỏ qua') || msg.includes('⚠') ? '#a16207'
                                                            : msg.startsWith('──') ? '#2563eb'
                                                                : '#475569',
                                                fontWeight: msg.startsWith('Import hoàn tất') || msg.startsWith('──') ? 700 : 400,
                                            }}
                                        >
                                            {msg}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Modal>

            {/* Achievement Assignment Modal */}
            <Modal
                title={
                    <Space>
                        <TrophyOutlined style={{ color: '#f59e0b' }} />
                        <span style={{ fontSize: 18, fontWeight: 700 }}>Thiết lập thành tựu cho bài kiểm tra</span>
                    </Space>
                }
                open={isRewardModalOpen}
                onCancel={() => setIsRewardModalOpen(false)}
                footer={null}
                width={600}
                centered
            >
                <div style={{ marginTop: 20 }}>
                    <div style={{ marginBottom: 16, padding: '12px 16px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a' }}>
                        <Text style={{ color: '#92400e', fontSize: 13 }}>
                            💡 Mỗi bài kiểm tra chỉ được gán duy nhất <strong>01 thành tựu</strong>. Nếu bài kiểm tra này hoàn thành xuất sắc, học viên sẽ nhận được huy hiệu này.
                        </Text>
                    </div>

                    <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                        {loadingRewards ? (
                            <div style={{ padding: '40px 0', textAlign: 'center' }}><Spin tip="Đang tải danh sách..." /></div>
                        ) : rewards.length === 0 ? (
                            <Empty description="Chưa có thành tựu nào trong kho" />
                        ) : (
                            <Row gutter={[12, 12]}>
                                {rewards.map((reward) => {
                                    const isCurrent = quiz?.rewardCatalogId === reward.id;
                                    const hasOtherReward = quiz?.rewardCatalogId && !isCurrent;
                                    const isAssignedToOther = reward.linkedQuizId && !isCurrent;

                                    return (
                                        <Col span={24} key={reward.id}>
                                            <div style={{
                                                padding: 12,
                                                borderRadius: 12,
                                                border: isCurrent ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                                                background: isCurrent ? '#fffbeb' : (isAssignedToOther || hasOtherReward ? '#f1f5f9' : '#fff'),
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                opacity: (isAssignedToOther || (hasOtherReward && !isCurrent)) ? 0.6 : 1,
                                                transition: 'all 0.2s'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <img
                                                        src={reward.iconUrl || 'https://via.placeholder.com/40'}
                                                        alt={reward.name}
                                                        style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 8 }}
                                                    />
                                                    <div>
                                                        <div style={{ fontWeight: 700, color: isCurrent ? '#92400e' : '#1e293b' }}>
                                                            {reward.name}
                                                            {isCurrent && <Tag color="orange" style={{ marginLeft: 8, borderRadius: 4 }}>Đang gán</Tag>}
                                                        </div>
                                                        <div style={{ fontSize: 12, color: '#64748b' }}>{reward.description}</div>
                                                        {isAssignedToOther ? (
                                                            <div style={{ fontSize: 11, color: '#ef4444', marginTop: 2, fontWeight: 500 }}>
                                                                ⚠️ Đã gán cho Quiz khác: {reward.linkedQuizName}
                                                            </div>
                                                        ) : hasOtherReward && (
                                                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                                                (Gỡ thành tựu hiện tại để gán mới)
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    type={isCurrent ? "default" : "primary"}
                                                    disabled={(isAssignedToOther || (hasOtherReward && !isCurrent)) || submittingReward}
                                                    loading={submittingReward && isCurrent}
                                                    onClick={() => handleAttachReward(reward.id)}
                                                    style={{
                                                        borderRadius: 8,
                                                        fontWeight: 600,
                                                        background: isCurrent ? '#fff' : (isAssignedToOther ? '#e2e8f0' : (hasOtherReward && !isCurrent ? '#e2e8f0' : '#f59e0b')),
                                                        borderColor: isCurrent ? '#f59e0b' : (isAssignedToOther ? '#e2e8f0' : (hasOtherReward && !isCurrent ? '#e2e8f0' : '#f59e0b')),
                                                        color: isCurrent ? '#f59e0b' : (isAssignedToOther ? '#94a3b8' : (hasOtherReward && !isCurrent ? '#94a3b8' : '#fff'))
                                                    }}
                                                >
                                                    {isCurrent ? 'Hủy gán' : (isAssignedToOther ? 'Đã gán' : 'Gán ngay')}
                                                </Button>
                                            </div>
                                        </Col>
                                    );
                                })}
                            </Row>
                        )}
                    </div>
                </div>
            </Modal>

            <style>{`
                .quiz-row-alt td {
                    background: #f8fafc !important;
                }
                .premium-level-card {
                    background: white;
                    border-radius: 20px;
                    border: 1.5px solid #f1f5f9;
                    padding: 24px;
                    height: 100%;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    transition: all 0.35s cubic-bezier(0.165, 0.84, 0.44, 1);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.06);
                }
                .premium-level-card:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 16px 32px -8px rgba(0, 0, 0, 0.12), 0 6px 12px -4px rgba(0, 0, 0, 0.06);
                    border-color: #bfdbfe;
                }
                .card-accent {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                }
                .card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 20px;
                }
                .icon-wrapper {
                    width: 52px;
                    height: 52px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.4s ease;
                }
                .premium-level-card:hover .icon-wrapper {
                    transform: scale(1.1) rotate(5deg);
                }
                .region-tag {
                    padding: 5px 12px;
                    border-radius: 100px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                }
                .dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                }
                .card-content {
                    flex: 1;
                    min-height: 0;
                }
                .card-title {
                    margin: 0 0 10px 0;
                    font-size: 17px;
                    font-weight: 700;
                    color: #0f172a;
                    line-height: 1.35;
                    letter-spacing: -0.2px;
                }
                .card-desc {
                    color: #64748b;
                    font-size: 13.5px;
                    line-height: 1.65;
                    margin: 0 0 14px 0;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .card-meta {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .meta-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 3px 10px;
                    border-radius: 8px;
                    font-size: 12px;
                    font-weight: 500;
                    color: #475569;
                    background: #f1f5f9;
                    border: 1px solid #e2e8f0;
                }
                .meta-stars {
                    color: #d97706;
                    background: #fffbeb;
                    border-color: #fde68a;
                }
                .card-footer {
                    margin-top: 20px;
                    padding-top: 16px;
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
        </div >
    );
};

export default AdminQuizManagementPage;
