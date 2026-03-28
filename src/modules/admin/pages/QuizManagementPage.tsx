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
    DeleteOutlined
} from '@ant-design/icons';
import { adminService } from '../services/adminService';
import { excelService, downloadBlob } from '../../educator/services/excelService';
import { useParams, useNavigate } from 'react-router-dom';

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

    // --- Import Challenges Excel to Quiz State ---
    const [isImportChallengesModalOpen, setIsImportChallengesModalOpen] = useState(false);
    const [importChallengesFile, setImportChallengesFile] = useState<File | null>(null);
    const [importingChallenges, setImportingChallenges] = useState(false);
    const [importChallengesSkillType, setImportChallengesSkillType] = useState<string>('MIXED');
    const [importChallengesResult, setImportChallengesResult] = useState<any | null>(null);

    const [editingChallengeId, setEditingChallengeId] = useState<string | null>(null);

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
            pointsPerQuestion: quiz.pointsPerQuestion || 10,
            readingCount,
            listeningCount,
            speakingCount,
            writingCount,
            comment: quiz.comment,
            difficulty: quiz.difficulty || 'BEGINNER',
            skillType: quiz.skillType || 'MIXED',
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
                passingScore: quiz.passingScore ?? 80,
                timeLimitMinutes: quiz.timeLimitMinutes ?? 15,
                skillType: values.skillType,
                questionCount: finalQuestions.length,
                comment: values.comment || 'Cập nhật quiz',
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
                timeLimitMinutes: 15,
                skillType: values.skillType || 'MIXED',
                questionCount: 0,
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
                    formVals.words = meta.words?.join('|');
                    formVals.error_index = meta.error_index;
                    formVals.correct_word = meta.correct_word;
                    formVals.hint = meta.hint;
                } else if (skill === 'LISTENING') {
                    formVals.audioUrl = meta.audioUrl;
                    formVals.options = meta.options?.join('\n');
                    formVals.correctAnswer = meta.correctAnswer;
                    formVals.transcript = meta.transcript;
                } else if (skill === 'WRITING') {
                    formVals.scrambledWords = meta.scrambledWords?.join('\n');
                    formVals.correctSentence = meta.correctSentence;
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

    const handleCreateNewChallenge = async (values: any) => {
        if (!quiz?.id) return;
        setSubmittingCreate(true);
        try {
            let metadataJson: any = {};
            const skill = activeSkillType || values.skillType;

            if (skill === 'READING') {
                metadataJson = {
                    words: values.words ? values.words.split('|').map((o: string) => o.trim()).filter(Boolean) : [],
                    error_index: values.error_index,
                    correct_word: values.correct_word,
                    hint: values.hint || ""
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
                metadataJson: metadataJson
            };

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
        const header = 'Tên quiz,Mô tả,Hướng dẫn,Điểm đạt (%),Thời gian (phút),Loại kỹ năng';
        const sample = 'Màn 1 - Khởi động,Nhận diện cơ bản lỗi phát âm,Nghe và chọn từ đúng,60,5,READING';
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

            for (let i = 0; i < rows.length; i++) {
                const cols = rows[i].split(',');
                if (cols.length < 4) { errors.push(`Dòng ${i + 2}: thiếu cột`); continue; }

                const title = cols[0]?.trim();
                const description = cols[1]?.trim() || '';
                const instructions = cols[2]?.trim() || '';
                const passingScore = parseInt(cols[3]?.trim() || '70');
                const timeLimitMinutes = parseInt(cols[4]?.trim() || '10');
                const skillType = cols[5]?.trim() || 'MIXED';

                if (!title) { errors.push(`Dòng ${i + 2}: thiếu tên quiz`); continue; }
                if (existingNames.includes(title.toLowerCase().trim())) {
                    errors.push(`Dòng ${i + 2}: "${title}" đã tồn tại`);
                    continue;
                }

                try {
                    const payload = {
                        levelId: selectedLevelId,
                        title,
                        description,
                        instructions,
                        passingScore: isNaN(passingScore) ? 70 : passingScore,
                        timeLimitMinutes: isNaN(timeLimitMinutes) ? 10 : timeLimitMinutes,
                        skillType,
                        questionCount: 0,
                        comment: `Import từ CSV - ${skillType}`,
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
        if (quizzes.length === 0) { message.warning('Không có quiz để export'); return; }
        const header = 'Tên quiz,Mô tả,Hướng dẫn,Điểm đạt (%),Thời gian (phút),Loại kỹ năng,Số câu hỏi';
        const rows = quizzes.map(q => {
            const name = (q.name || q.title || '').replace(/,/g, ';');
            const desc = (q.description || '').replace(/,/g, ';');
            const inst = (q.instructions || '').replace(/,/g, ';');
            return `${name},${desc},${inst},${q.passingScore || ''},${q.timeLimitMinutes || ''},${q.skillType || 'MIXED'},${q.questions?.length ?? q.questionCount ?? 0}`;
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
                                    <div>
                                        <Text style={{ color: '#334155' }}>{meta.words.join(' ')}</Text>
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
            title: 'Độ khó',
            dataIndex: 'difficulty',
            key: 'difficulty',
            render: (difficulty: string) => {
                const cfg = DIFFICULTY_CONFIG[difficulty] || { label: difficulty || '—', color: 'default' };
                return <Tag color={cfg.color}>{cfg.label}</Tag>;
            },
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
                                type="text"
                                icon={<EyeOutlined style={{ color: '#2563eb' }} />}
                                onClick={() => showDetail(record, index)}
                            />
                        </Tooltip>
                        <Tooltip title="Chỉnh sửa câu hỏi này">
                            <Button
                                type="text"
                                icon={<EditOutlined style={{ color: '#faad14' }} />}
                                onClick={() => handleEditQuestion(record, index)}
                            />
                        </Tooltip>
                        <Tooltip title="Gỡ khỏi bài thi">
                            <Button
                                type="text"
                                icon={<DeleteOutlined style={{ color: '#ff4d4f' }} />}
                                onClick={() => handleRemoveQuestion(record, index)}
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
            title: 'Thông số',
            key: 'stats',
            render: (_: any, record: any) => (
                <Space size={8}>
                    <Tooltip title="Số câu hỏi">
                        <Tag color="blue" icon={<FileTextOutlined />}>{record.questions?.length ?? record.questionCount ?? 0}</Tag>
                    </Tooltip>
                </Space>
            )
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
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={(e) => {
                        e.stopPropagation();
                        setQuiz(record);
                    }}
                    style={{ borderRadius: 6, fontWeight: 600 }}
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

        // Tự động sắp xếp (ví dụ: Màn 1, Màn 2, ... Màn 10, Màn 11)
        result = [...result].sort((a, b) => {
            const titleA = a.title || a.name || '';
            const titleB = b.title || b.name || '';

            const numA = parseInt(titleA.match(/\d+/)?.[0] || '0');
            const numB = parseInt(titleB.match(/\d+/)?.[0] || '0');
            if (numA !== numB) {
                return numA - numB;
            }
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
                            onClick={handleBackToChapters}
                            style={{ borderRadius: 10, border: '1.5px solid #e2e8f0', height: 44, width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        />
                    )}
                    <div style={{ background: '#e6f7ff', padding: 10, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800" style={{ margin: 0 }}>
                            {selectedLevelId && selectedLevel
                                ? <>
                                    Quản lý bài kiểm tra
                                    <span style={{ color: '#64748b', fontWeight: 400, fontSize: 16, margin: '0 8px' }}>›</span>
                                    <span style={{ color: '#1890ff', fontSize: 20 }}>{selectedLevel.name}</span>
                                </>
                                : quiz
                                    ? <>
                                        Quản lý bài kiểm tra
                                        <span style={{ color: '#64748b', fontWeight: 400, fontSize: 16, margin: '0 8px' }}>›</span>
                                        <span style={{ color: '#1890ff', fontSize: 20 }}>{quiz.name || quiz.title}</span>
                                    </>
                                    : 'Quản lý bài kiểm tra'
                            }
                        </h2>
                        <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
                            {quiz
                                ? 'Chi tiết và câu hỏi của bài kiểm tra'
                                : selectedLevelId && selectedLevel
                                    ? `Quản lý các bài kiểm tra trong chương "${selectedLevel.name}"`
                                    : 'Chọn chương học để xem và quản lý bài kiểm tra'}
                        </div>
                    </div>
                </div>
                <Space size={12}>
                    {selectedLevelId && !quiz && (
                        <>
                            <Button
                                icon={<DownloadOutlined />}
                                onClick={handleDownloadQuizTemplate}
                                style={{
                                    height: '44px',
                                    borderRadius: '10px',
                                    border: '1.5px solid #1890ff',
                                    color: '#1890ff',
                                    background: '#e6f7ff',
                                    fontWeight: 600,
                                    paddingInline: 16,
                                }}
                            >
                                Template
                            </Button>
                            <Button
                                icon={<UploadOutlined />}
                                onClick={() => { setIsImportModalOpen(true); setImportFile(null); setImportResult(null); }}
                                style={{
                                    height: '44px',
                                    borderRadius: '10px',
                                    border: '1.5px solid #52c41a',
                                    color: '#52c41a',
                                    background: '#f6ffed',
                                    fontWeight: 600,
                                    paddingInline: 16,
                                }}
                            >
                                Import
                            </Button>
                            <Button
                                icon={<ExportOutlined />}
                                onClick={handleExportQuizCSV}
                                style={{
                                    height: '44px',
                                    borderRadius: '10px',
                                    border: '1.5px solid #fa8c16',
                                    color: '#fa8c16',
                                    background: '#fff7e6',
                                    fontWeight: 600,
                                    paddingInline: 16,
                                }}
                            >
                                Export
                            </Button>
                            <Button
                                icon={<PlusOutlined />}
                                onClick={() => setIsCreateQuizModalOpen(true)}
                                style={{
                                    height: '44px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: 'linear-gradient(90deg, #1890ff, #0076e4)',
                                    color: '#fff',
                                    fontWeight: 600,
                                    paddingInline: 20,
                                    boxShadow: '0 4px 12px rgba(24, 144, 255, 0.35)',
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
                    {/* Quiz Info Card */}
                    <Card
                        style={{
                            borderRadius: 16,
                            marginBottom: 24,
                            boxShadow: '0 4px 20px rgba(37,99,235,0.08)',
                            border: '1.5px solid #bfdbfe',
                            background: 'linear-gradient(135deg, #eff6ff 0%, #fff 100%)',
                        }}
                        styles={{ body: { padding: '24px 28px' } }}
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
                                    title={<span style={{ fontSize: 12, color: '#64748b' }}>Thời gian</span>}
                                    value={quiz.timeLimitMinutes ?? '—'}
                                    suffix={quiz.timeLimitMinutes ? ' phút' : ''}
                                    prefix={<ClockCircleOutlined style={{ color: '#0891b2' }} />}
                                    valueStyle={{ fontSize: 22, fontWeight: 700, color: '#0891b2' }}
                                />
                            </Col>

                        </Row>
                    </Card>

                    {/* Action Buttons - Always visible */}
                    <Card
                        style={{
                            borderRadius: 16,
                            marginBottom: 24,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                            border: '1px solid #e2e8f0',
                        }}
                        headStyle={{ borderRadius: '16px 16px 0 0' }}
                        title={
                            <Space>
                                <QuestionCircleOutlined style={{ color: '#2563eb' }} />
                                <span style={{ fontWeight: 600 }}>
                                    Danh sách câu hỏi ({quiz.questions?.length ?? quiz.questionCount ?? 0} câu)
                                </span>
                            </Space>
                        }
                    >
                        {/* Skill summary pills + Add buttons */}
                        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                            <Text strong style={{ marginRight: 8 }}>Thêm câu hỏi theo kỹ năng:</Text>
                            {Object.entries(SKILL_CONFIG)
                                .filter(([key]) => !quiz.skillType || quiz.skillType === 'MIXED' || quiz.skillType === key)
                                .map(([key, cfg]) => {
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

                        {/* Import Excel buttons */}
                        <div style={{
                            display: 'flex',
                            gap: 10,
                            marginBottom: 20,
                            padding: '12px 16px',
                            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                            borderRadius: 12,
                            border: '1px solid #bbf7d0',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                        }}>
                            <UploadOutlined style={{ fontSize: 18, color: '#15803d' }} />
                            <Text strong style={{ color: '#166534', fontSize: 13, marginRight: 8 }}>
                                Import hàng loạt từ Excel:
                            </Text>
                            <Button
                                icon={<DownloadOutlined />}
                                onClick={handleDownloadChallengeTemplate}
                                style={{
                                    height: 36,
                                    borderRadius: 10,
                                    fontWeight: 600,
                                    border: '1.5px solid #1890ff',
                                    color: '#1890ff',
                                    background: '#e6f7ff',
                                    paddingInline: 14,
                                }}
                            >
                                Template {quiz.skillType === 'MIXED' ? 'Tổng hợp' : SKILL_CONFIG[quiz.skillType]?.label || ''}
                            </Button>
                            <Button
                                icon={<UploadOutlined />}
                                onClick={openImportChallengesModal}
                                style={{
                                    height: 36,
                                    borderRadius: 10,
                                    fontWeight: 600,
                                    border: '1.5px solid #52c41a',
                                    color: '#52c41a',
                                    background: '#f6ffed',
                                    paddingInline: 14,
                                }}
                            >
                                Import câu hỏi từ Excel
                            </Button>
                            <Text type="secondary" style={{ fontSize: 11, flex: 1, minWidth: 150 }}>
                                {quiz.skillType === 'MIXED'
                                    ? 'Template gồm 4 sheet: Đọc, Nghe, Viết, Nói'
                                    : `Template cho kỹ năng ${SKILL_CONFIG[quiz.skillType]?.label || quiz.skillType}`}
                            </Text>
                        </div>

                        {/* Questions Table */}
                        {quiz.questions && quiz.questions.length > 0 ? (
                            <Table
                                dataSource={quiz.questions}
                                columns={questionColumns}
                                rowKey={(r: any) => `${r.id}-${r.questionOrder}-${r.skillType}`}
                                locale={{ emptyText: 'Không có câu hỏi nào' }}
                                scroll={{ x: 'max-content' }}
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

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <Form.Item name="difficultyTag" label={<Text strong>Độ khó</Text>}>
                                            <Select>
                                                {Object.entries(DIFFICULTY_CONFIG).map(([k, v]) => (
                                                    <Option key={k} value={k}>{v.label}</Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </div>

                                    <Card size="small" style={{ background: '#f8fafc', borderRadius: 8, marginBottom: 16 }}>
                                        {activeSkillType === 'READING' && (
                                            <>
                                                <Form.Item
                                                    name="words"
                                                    label="Các từ trong câu (phân cách bằng |)"
                                                    extra="Ví dụ: Ông|lội|kể|chuyện"
                                                    rules={[{ required: true }]}
                                                >
                                                    <Input.TextArea rows={2} placeholder="Con|lai|kia|chạy|lên|nương" />
                                                </Form.Item>
                                                <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.words !== currentValues.words}>
                                                    {({ getFieldValue }) => {
                                                        const wordsText = getFieldValue('words') || '';
                                                        const parsedWords = wordsText.split('|').map((s: string) => s.trim()).filter(Boolean);
                                                        return (
                                                            <Form.Item
                                                                name="error_index"
                                                                label="Từ bị viết sai"
                                                                rules={[{ required: true }]}
                                                            >
                                                                <Select placeholder="Chọn từ bị sai">
                                                                    {parsedWords.map((word: string, idx: number) => (
                                                                        <Option key={idx} value={idx}>{word}</Option>
                                                                    ))}
                                                                </Select>
                                                            </Form.Item>
                                                        );
                                                    }}
                                                </Form.Item>
                                                <Form.Item
                                                    name="correct_word"
                                                    label="Từ viết đúng"
                                                    rules={[{ required: true }]}
                                                >
                                                    <Input placeholder="Ví dụ: nai" />
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
                                            <Button onClick={() => setIsChallengeModalOpen(false)} style={{ borderRadius: 8, height: 40, fontWeight: 600 }}>Hủy</Button>
                                            <Button type="primary" htmlType="submit" loading={submittingCreate}
                                                style={{ borderRadius: 8, height: 40, fontWeight: 700, paddingInline: 24, background: 'linear-gradient(90deg, #1890ff, #0076e4)', border: 'none', color: '#fff', boxShadow: '0 4px 12px rgba(24,144,255,0.25)' }}>
                                                {editingChallengeId ? 'Lưu cập nhật' : 'Lưu và thêm vào quiz'}
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
                            <div>
                                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Độ khó:</Text>
                                <Tag color={DIFFICULTY_CONFIG[selectedDetailChallenge.difficultyTag]?.color}>{DIFFICULTY_CONFIG[selectedDetailChallenge.difficultyTag]?.label}</Tag>
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
                title={<span style={{ fontWeight: 600 }}>Chỉnh sửa quiz</span>}
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
                        <Col span={10}>
                            <Form.Item
                                label="Tên quiz"
                                name="title"
                                rules={[{ required: true, message: 'Vui lòng nhập tên quiz' }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={7}>
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
                        <Col span={7}>
                            <Form.Item label="Loại kỹ năng" name="skillType">
                                <Select
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                            <Form.Item label="Điểm mỗi câu" name="pointsPerQuestion" style={{ marginBottom: 0 }}>
                                <InputNumber style={{ width: '100%' }} />
                            </Form.Item>
                        </div>

                        <Form.Item noStyle shouldUpdate={(prev, cur) => prev.skillType !== cur.skillType}>
                            {({ getFieldValue }) => {
                                const skillType = getFieldValue('skillType');
                                const showAll = !skillType || skillType === 'MIXED';
                                const fields = [
                                    { key: 'READING', label: 'Số câu Reading', name: 'readingCount' },
                                    { key: 'LISTENING', label: 'Số câu Listening', name: 'listeningCount' },
                                    { key: 'SPEAKING', label: 'Số câu Speaking', name: 'speakingCount' },
                                    { key: 'WRITING', label: 'Số câu Writing', name: 'writingCount' },
                                ];
                                const visibleFields = showAll ? fields : fields.filter(f => f.key === skillType);
                                return (
                                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${visibleFields.length}, 1fr)`, gap: '12px' }}>
                                        {visibleFields.map(f => (
                                            <Form.Item key={f.key} label={f.label} name={f.name} style={{ marginBottom: 0 }}>
                                                <InputNumber min={0} style={{ width: '100%' }} />
                                            </Form.Item>
                                        ))}
                                    </div>
                                );
                            }}
                        </Form.Item>
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                        <Form.Item name="skillType" label={<Text strong>Loại kỹ năng</Text>} rules={[{ required: true, message: 'Chọn loại kỹ năng' }]}>
                            <Select placeholder="Chọn loại" options={[
                                { value: 'READING', label: '📖 Reading' },
                                { value: 'LISTENING', label: '🎧 Listening' },
                                { value: 'SPEAKING', label: '🎙️ Speaking' },
                                { value: 'WRITING', label: '✍️ Writing' },
                                { value: 'MIXED', label: '🎯 Tổng hợp' },
                            ]} />
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
                            Các cột: Tên quiz, Mô tả, Hướng dẫn, Điểm đạt (%), Thời gian (phút), Độ khó
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
        </div>
    );

};

export default AdminQuizManagementPage;
