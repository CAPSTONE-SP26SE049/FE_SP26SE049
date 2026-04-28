import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Reorder, motion, AnimatePresence } from 'framer-motion';
import {
    Select, Tag, Spin, Empty, Space, Tooltip, Row, Col,
    Divider, Button, Modal, Form, Input, InputNumber, message,
    Pagination, Popconfirm, Badge
} from 'antd';
import {
    Clock, Trophy, HelpCircle, BookOpen, Volume2, Mic, Plus,
    Library, Edit3, Search, Eye, Info, ArrowLeft, Download,
    Upload, ExternalLink, Trash2, MinusCircle, LayoutGrid, Zap,
    ChevronRight, Loader2, Save, MoreVertical, Sliders
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { excelService, downloadBlob } from '../../educator/services/excelService';
import { uploadToCloudinary } from '../../../services/cloudinaryService';
import { synthesizeSpeechFPT, waitForAudioLink } from '../../../services/ttsService';
import { useParams, useNavigate } from 'react-router-dom';
import clsx from 'clsx';

const SKILL_CONFIG: Record<string, { label: string; color: string; icon: any; bg: string }> = {
    READING: { label: 'Đọc hiểu', color: '#2563eb', icon: BookOpen, bg: 'bg-blue-50' },
    LISTENING: { label: 'Nghe hiểu', color: '#7c3aed', icon: Volume2, bg: 'bg-violet-50' },
    WRITING: { label: 'Viết', color: '#059669', icon: Edit3, bg: 'bg-emerald-50' },
    SPEAKING: { label: 'Nói', color: '#ea580c', icon: Mic, bg: 'bg-orange-50' },
};

const REGION_LABEL: Record<string, { label: string; color: string; bg: string; iconBg: string }> = {
    NORTH: { label: 'Miền Bắc', color: '#49B6E5', bg: '#f0f9ff', iconBg: 'bg-blue-100' },
    SOUTH: { label: 'Miền Nam', color: '#10b981', bg: '#f0fdf4', iconBg: 'bg-emerald-100' },
    CENTRAL: { label: 'Miền Trung', color: '#f59e0b', bg: '#fffbeb', iconBg: 'bg-amber-100' },
};

const SECOND_OPTIONS = [
    { label: '15 giây', value: 15 }, { label: '30 giây', value: 30 },
    { label: '45 giây', value: 45 }, { label: '60 giây', value: 60 },
    { label: '90 giây', value: 90 }, { label: '120 giây', value: 120 }
];

interface BatchQuestion {
    tempId: string; id: string; relationId: string; isExisting: boolean;
    skillType: string; difficultyTag: string; contentText: string;
    fullSentence: string; wrongWord: string; correctWord: string;
    audioUrl: string; options: string[]; correctAnswer: string;
    transcript: string; correctSentence?: string; blankSentence: string;
    alternatives: string; hint: string; words?: string;
}

const AdminQuizManagementPage: React.FC = () => {
    const { levelId: urlLevelId } = useParams<{ levelId: string }>();
    const navigate = useNavigate();
    const [levels, setLevels] = useState<any[]>([]);
    const [dialects, setDialects] = useState<any[]>([]);
    const [selectedLevelId, setSelectedLevelId] = useState<string | undefined>(urlLevelId);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [localQuizOrder, setLocalQuizOrder] = useState<any[] | null>(null);
    const reorderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [quiz, setQuiz] = useState<any | null>(null);
    const [loadingQuiz, setLoadingQuiz] = useState(false);
    const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
    const [activeSkillType, setActiveSkillType] = useState<string | null>(null);
    const [createForm] = Form.useForm();
    const [submittingCreate, setSubmittingCreate] = useState(false);
    const [updatingQuiz, setUpdatingQuiz] = useState(false);
    const [isEditQuizModalOpen, setIsEditQuizModalOpen] = useState(false);
    const [editQuizForm] = Form.useForm();
    const [isCreateQuizModalOpen, setIsCreateQuizModalOpen] = useState(false);
    const [creatingQuiz, setCreatingQuiz] = useState(false);
    const [newQuizForm] = Form.useForm();
    const [searchTerm, setSearchTerm] = useState('');
    const [regionFilter, setRegionFilter] = useState<string | null>(null);
    const [quizSearchTerm, setQuizSearchTerm] = useState('');
    const [quizSkillFilter, setQuizSkillFilter] = useState<string | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [quizChallenges, setQuizChallenges] = useState<any[]>([]);
    const [loadingQuizChallenges, setLoadingQuizChallenges] = useState(false);
    const [uploadingSingle, setUploadingSingle] = useState(false);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [editingChallengeId, setEditingChallengeId] = useState<string | null>(null);
    const [isBatchQuestionsModalOpen, setIsBatchQuestionsModalOpen] = useState(false);
    const [submittingBatchQuestions, setSubmittingBatchQuestions] = useState(false);
    const [batchQuestions, setBatchQuestions] = useState<BatchQuestion[]>([]);
    const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
    const [rewards, setRewards] = useState<any[]>([]);
    const [loadingRewards, setLoadingRewards] = useState(false);
    const [submittingReward, setSubmittingReward] = useState(false);
    const [isImportChallengesModalOpen, setIsImportChallengesModalOpen] = useState(false);
    const [importChallengesFile, setImportChallengesFile] = useState<File | null>(null);
    const [importingChallenges, setImportingChallenges] = useState(false);
    const [importChallengesSkillType, setImportChallengesSkillType] = useState<string>('MIXED');

    // --- Data Fetching ---
    useEffect(() => {
        const initData = async () => {
            try {
                const [lRes, dRes]: any[] = await Promise.all([
                    adminService.getLevelsForSelection(),
                    adminService.getDialects()
                ]);
                setLevels(lRes?.data || (Array.isArray(lRes) ? lRes : []));
                setDialects(dRes?.data || (Array.isArray(dRes) ? dRes : []));
            } catch (e) {
                console.error('Init data failed', e);
            }
        };
        initData();
    }, []);

    const fetchQuizChallenges = useCallback(async () => {
        if (!quiz?.id) { setQuizChallenges([]); return; }
        setLoadingQuizChallenges(true);
        try {
            const res: any = await adminService.getQuizChallenges(quiz.id);
            setQuizChallenges(res?.data || (Array.isArray(res) ? res : []));
        } finally {
            setLoadingQuizChallenges(false);
        }
    }, [quiz?.id]);

    useEffect(() => { fetchQuizChallenges(); }, [fetchQuizChallenges]);

    const handleLevelChange = async (levelId: string, preserveQuizState = false) => {
        setSelectedLevelId(levelId);
        if (!preserveQuizState) setQuiz(null);
        setQuizzes([]);
        setLocalQuizOrder(null);
        setLoadingQuiz(true);
        try {
            const res: any = await adminService.getQuizzesByLevel(levelId);
            const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [res].filter(x => x?.id));
            const formatted = list.map((q: any) => {
                let f = { ...q };
                if (f.metadataJson) {
                    try {
                        const meta = typeof f.metadataJson === 'string' ? JSON.parse(f.metadataJson) : f.metadataJson;
                        const items = typeof f.itemsJson === 'string' ? JSON.parse(f.itemsJson) : (f.itemsJson || []);
                        f = { ...f, ...meta, questions: items };
                    } catch (e) { /* ignore */ }
                }
                return f;
            });
            setQuizzes(formatted);
            if (preserveQuizState) {
                setQuiz((prev: any) => formatted.find((q: any) => q.id === prev?.id) || prev);
            }
        } finally {
            setLoadingQuiz(false);
        }
    };

    useEffect(() => { if (urlLevelId) handleLevelChange(urlLevelId); }, [urlLevelId]);

    const handleBackToChapters = () => {
        if (urlLevelId) navigate('/admin/chapters');
        else { setSelectedLevelId(undefined); setQuiz(null); setQuizzes([]); }
    };

    const [uploadingBatch, setUploadingBatch] = useState<Record<string, boolean>>({});

    const handleOpenEditQuiz = () => {
        if (!quiz) return;
        const qList = Array.isArray(quiz.questions) ? quiz.questions : [];
        const getCnt = (type: string) => qList.filter((q: any) => q.skillType === type).length;
        editQuizForm.setFieldsValue({
            title: quiz.title || quiz.name,
            description: quiz.description,
            instructions: quiz.instructions,
            passingScore: quiz.passingScore || 80,
            secondsPerQuestion: Math.round((quiz.timeLimitSeconds || 900) / (qList.length || 10)),
            skillType: quiz.skillType || 'MIXED',
            readingCount: getCnt('READING'),
            listeningCount: getCnt('LISTENING'),
            speakingCount: getCnt('SPEAKING'),
            writingCount: getCnt('WRITING'),
            orderIndex: quiz.orderIndex || 1,
        });
        setIsEditQuizModalOpen(true);
    };

    const handleAttachReward = async (rewardId: string) => {
        if (!quiz?.id) return;
        setSubmittingReward(true);
        try {
            await adminService.attachRewardToQuiz(quiz.id, rewardId);
            message.success('Gán thành tựu thành công!');
            setIsRewardModalOpen(false);
            handleLevelChange(selectedLevelId!, true);
        } finally { setSubmittingReward(false); }
    };

    const openRewardModal = async () => {
        setIsRewardModalOpen(true);
        setLoadingRewards(true);
        try {
            const res: any = await adminService.getBadgesForAdmin();
            setRewards(res?.data || (Array.isArray(res) ? res : []));
        } finally { setLoadingRewards(false); }
    };

    // --- Batch Editing Logic ---
    const addBatchQuestion = () => setBatchQuestions(prev => [...prev, {
        tempId: `new-${Date.now()}-${Math.random()}`, id: '', relationId: '', isExisting: false,
        skillType: quiz?.skillType !== 'MIXED' ? quiz?.skillType : 'READING',
        difficultyTag: 'BEGINNER', contentText: '', fullSentence: '', wrongWord: '', correctWord: '',
        audioUrl: '', options: ['', '', '', ''], correctAnswer: '', transcript: '', blankSentence: '', alternatives: '', hint: ''
    } as any]);

    const removeBatchQuestion = (tid: string) => setBatchQuestions(prev => prev.length > 1 ? prev.filter(q => q.tempId !== tid) : prev);
    const updateBatchQuestionField = (tid: string, f: string, v: any) => setBatchQuestions(prev => prev.map(q => q.tempId === tid ? { ...q, [f]: v } : q));
    const updateBatchOption = (tid: string, idx: number, v: string) => setBatchQuestions(prev => prev.map(q => {
        if (q.tempId !== tid) return q;
        const opts = [...q.options]; opts[idx] = v;
        return { ...q, options: opts };
    }));

    const handleAutoGenerateAudioBatch = async (tid: string) => {
        const q = batchQuestions.find(i => i.tempId === tid);
        if (!q?.transcript) { message.warning('Nhập transcript trước!'); return; }
        setUploadingBatch(prev => ({ ...prev, [tid]: true }));
        try {
            const fpt = await synthesizeSpeechFPT(q.transcript);
            let url = await waitForAudioLink(fpt);
            if (url && !url.startsWith('http')) url = 'https://' + url;
            const cUrl = await uploadToCloudinary(url, 'video');
            updateBatchQuestionField(tid, 'audioUrl', cUrl);
            message.success('Đã tạo audio!');
        } finally { setUploadingBatch(prev => ({ ...prev, [tid]: false })); }
    };

    const handleSubmitBatchQuestions = async () => {
        if (!quiz?.id) return;
        setSubmittingBatchQuestions(true);
        try {
            const currentIds = displayQuestions.map((q: any) => q.id).filter(Boolean);
            for (const id of currentIds) await adminService.removeChallengeFromQuiz(quiz.id, id).catch(() => { });

            const newBankIds: string[] = [];
            for (const q of batchQuestions) {
                let meta: any = {};
                if (q.skillType === 'READING') {
                    const words = q.fullSentence.trim().split(/\s+/);
                    const eIdx = words.findIndex(w => w.toLowerCase().replace(/[.,!?;:]/g, '') === q.wrongWord.toLowerCase().replace(/[.,!?;:]/g, ''));
                    meta = { words, error_index: eIdx === -1 ? 0 : eIdx, correct_word: q.correctWord, hint: q.hint };
                } else if (q.skillType === 'LISTENING') {
                    meta = { audioUrl: q.audioUrl, options: q.options.filter(o => o.trim()), correctAnswer: q.correctAnswer, transcript: q.transcript, correctSentence: q.correctSentence };
                } else if (q.skillType === 'WRITING') {
                    meta = { blankSentence: q.blankSentence, correctAnswer: q.correctAnswer, alternatives: q.alternatives.split(',').map(s => s.trim()).filter(Boolean), hint: q.hint };
                } else if (q.skillType === 'SPEAKING') {
                    meta = { audioUrl: q.audioUrl, transcript: q.transcript, correctSentence: q.correctSentence, hint: q.hint };
                }

                const payload = { contentText: q.contentText, skillType: q.skillType, difficultyTag: q.difficultyTag, metadataJson: meta };
                if (q.id && q.isExisting) {
                    await adminService.updateChallengeBankItem(q.id, payload);
                    newBankIds.push(q.id);
                } else {
                    const res: any = await adminService.createChallengeBankItem(payload);
                    const nid = res?.data?.id || res?.id;
                    if (nid) newBankIds.push(nid);
                }
            }
            if (newBankIds.length > 0) await adminService.assignChallengesToQuiz(quiz.id, newBankIds);
            message.success('Đã lưu toàn bộ!');
            setIsBatchQuestionsModalOpen(false);
            handleLevelChange(selectedLevelId!, true);
            fetchQuizChallenges();
        } finally { setSubmittingBatchQuestions(false); }
    };

    const openBatchQuestionsModal = () => {
        if (displayQuestions.length > 0) {
            setBatchQuestions(displayQuestions.map((c: any, idx) => {
                const p = parseMetadata(c);
                const meta = p.metadataJson || {};
                return {
                    tempId: `ex-${p.id}-${idx}`, id: p.id, relationId: p.relationId || '', isExisting: true,
                    skillType: p.skillType || 'READING', difficultyTag: p.difficultyTag || 'BEGINNER', contentText: p.contentText || '',
                    fullSentence: Array.isArray(meta.words) ? meta.words.join(' ') : (p.contentText || ''),
                    wrongWord: (Array.isArray(meta.words) && meta.error_index != null) ? meta.words[meta.error_index] : '',
                    correctWord: meta.correct_word || meta.correctWord || '',
                    audioUrl: meta.audioUrl || '',
                    options: Array.isArray(meta.options) ? [...meta.options, '', '', ''].slice(0, 4) : ['', '', '', ''],
                    correctAnswer: meta.correctAnswer || meta.answer || '',
                    transcript: meta.transcript || '',
                    correctSentence: meta.correctSentence || '',
                    blankSentence: meta.blankSentence || '',
                    alternatives: Array.isArray(meta.alternatives) ? meta.alternatives.join(', ') : '',
                    hint: meta.hint || ''
                } as any;
            }));
        } else setBatchQuestions([{ tempId: 'new-1', id: '', relationId: '', isExisting: false, skillType: 'READING', options: ['', '', '', ''] } as any]);
        setIsBatchQuestionsModalOpen(true);
    };

    const openImportChallengesModal = () => {
        setImportChallengesSkillType(quiz?.skillType === 'MIXED' ? 'MIXED' : quiz?.skillType);
        setImportChallengesFile(null);
        setIsImportChallengesModalOpen(true);
    };

    const handleImportChallengesToQuiz = async () => {
        if (!importChallengesFile || !quiz?.id) return;
        setImportingChallenges(true);
        try {
            const res: any = importChallengesSkillType === 'MIXED'
                ? await excelService.importMixedToQuiz(quiz.id, importChallengesFile)
                : await excelService.importChallengesToQuiz(importChallengesSkillType, quiz.id, importChallengesFile);
            if ((res?.data || res)?.successCount > 0) {
                message.success('Import thành công!');
                handleLevelChange(selectedLevelId!, true);
                fetchQuizChallenges();
                setIsImportChallengesModalOpen(false);
            }
        } finally { setImportingChallenges(false); }
    };

    // --- Quiz Ops ---
    const handleCreateQuiz = async (values: any) => {
        if (!selectedLevelId) return;
        setCreatingQuiz(true);
        try {
            await adminService.createQuiz({
                levelId: selectedLevelId,
                title: values.title,
                description: values.description,
                instructions: values.instructions,
                passingScore: 80,
                timeLimitSeconds: 10 * (values.secondsPerQuestion || 90),
                skillType: values.skillType || 'MIXED',
                questionCount: 10,
                comment: 'Tạo màn học mới',
                questions: []
            });
            message.success('Tạo màn học thành công');
            setIsCreateQuizModalOpen(false);
            newQuizForm.resetFields();
            handleLevelChange(selectedLevelId);
        } finally { setCreatingQuiz(false); }
    };

    const handleUpdateQuiz = async (values: any) => {
        if (!quiz?.id || !selectedLevelId) return;
        setUpdatingQuiz(true);
        try {
            const qCount = quiz.questions?.length || 10;
            await adminService.updateQuiz(quiz.id, {
                levelId: selectedLevelId,
                title: values.title,
                description: values.description,
                instructions: values.instructions,
                passingScore: quiz.passingScore || 80,
                timeLimitSeconds: qCount * (values.secondsPerQuestion || 90),
                skillType: values.skillType,
                questionCount: qCount,
                comment: values.comment || 'Cập nhật quiz',
                orderIndex: values.orderIndex,
                questions: quiz.questions || []
            });
            message.success('Cập nhật thành công');
            setIsEditQuizModalOpen(false);
            handleLevelChange(selectedLevelId, true);
        } finally { setUpdatingQuiz(false); }
    };

    const handleDeleteQuiz = async (id: string) => {
        try {
            await adminService.deleteQuiz(id);
            message.success('Đã xóa bài kiểm tra');
            if (selectedLevelId) handleLevelChange(selectedLevelId);
        } catch (e: any) { message.error(e?.response?.data?.message || 'Lỗi khi xóa'); }
    };

    const handleReorder = useCallback((newOrder: any[]) => {
        const updated = newOrder.map((q, idx) => ({ ...q, orderIndex: idx + 1 }));
        setLocalQuizOrder(updated);
        if (reorderTimerRef.current) clearTimeout(reorderTimerRef.current);
        reorderTimerRef.current = setTimeout(async () => {
            try {
                await adminService.reorderQuizzes(updated.map(q => q.id));
                setQuizzes(updated);
                setLocalQuizOrder(null);
                message.success('Đã cập nhật thứ tự');
            } catch { setLocalQuizOrder(null); }
        }, 800);
    }, []);

    // --- Challenge Ops ---
    const parseMetadata = (c: any) => {
        if (!c) return c;
        let p = { ...c };
        if (typeof p.metadataJson === 'string') {
            try { p.metadataJson = JSON.parse(p.metadataJson); } catch { p.metadataJson = {}; }
        }
        if (p.metadataJson?.answer && !p.metadataJson.correctAnswer) p.metadataJson.correctAnswer = p.metadataJson.answer;
        return p;
    };

    const handleEditQuestion = async (record: any, index?: number) => {
        const p = parseMetadata(record);
        let targetId = p.id;
        let bankItem = quizChallenges.find(i => (p.id && i.challenge?.id === p.id) || (p.challengeId && i.challenge?.id === p.challengeId));
        if (!bankItem && p.questionOrder != null) bankItem = quizChallenges.find(i => i.orderIndex === p.questionOrder);
        if (!bankItem && index != null) bankItem = quizChallenges[index];

        if (bankItem?.challenge) {
            targetId = bankItem.challenge.id;
            const meta = parseMetadata(bankItem.challenge).metadataJson || {};
            const skill = bankItem.challenge.skillType;
            const vals: any = { contentText: bankItem.challenge.contentText, difficultyTag: bankItem.challenge.difficultyTag || 'BEGINNER' };
            if (skill === 'READING') {
                vals.fullSentence = meta.words?.join(' ');
                vals.wrongWord = meta.words && meta.error_index != null ? meta.words[meta.error_index] : '';
                vals.correctWord = meta.correct_word || meta.correctWord;
                vals.hint = meta.hint;
            } else if (skill === 'LISTENING' || skill === 'SPEAKING') {
                vals.audioUrl = meta.audioUrl;
                vals.transcript = meta.transcript;
                vals.correctSentence = meta.correctSentence;
                if (skill === 'LISTENING') {
                    vals.options = meta.options?.join('\n');
                    vals.correctAnswer = meta.correctAnswer;
                }
                vals.hint = meta.hint;
            } else if (skill === 'WRITING') {
                vals.blankSentence = meta.blankSentence || meta.correctSentence;
                vals.correctAnswer = meta.correctAnswer;
                vals.alternatives = Array.isArray(meta.alternatives) ? meta.alternatives.join(', ') : '';
                vals.hint = meta.hint;
            }
            createForm.setFieldsValue(vals);
            setActiveSkillType(skill);
            setEditingChallengeId(targetId);
            setIsChallengeModalOpen(true);
        }
    };

    const handleRemoveQuestion = (record: any, index?: number) => {
        let cid = record.id;
        let item = quizChallenges.find(i => (record.id && i.challenge?.id === record.id) || (record.challengeId && i.challenge?.id === record.challengeId));
        if (!item && index != null) item = quizChallenges[index];
        if (item?.challenge) cid = item.challenge.id;

        if (!quiz?.id || !cid) return;
        Modal.confirm({
            title: 'Gỡ câu hỏi',
            content: 'Xác nhận gỡ câu hỏi này khỏi bài kiểm tra?',
            okText: 'Gỡ bỏ', okType: 'danger', cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await adminService.removeChallengeFromQuiz(quiz.id, cid);
                    message.success('Đã gỡ câu hỏi');
                    handleLevelChange(selectedLevelId!, true);
                } catch { message.error('Lỗi khi gỡ'); }
            }
        });
    };

    const handleCreateNewChallenge = async (values: any) => {
        if (!quiz?.id) return;
        setSubmittingCreate(true);
        try {
            const formVals = createForm.getFieldsValue();
            const skill = activeSkillType || values.skillType;
            let meta: any = {};
            if (skill === 'READING') {
                const words = values.fullSentence.trim().split(/\s+/);
                const errIdx = words.findIndex((w: string) => w.toLowerCase().replace(/[.,!?;:]/g, '') === values.wrongWord.toLowerCase().replace(/[.,!?;:]/g, ''));
                meta = { words, error_index: errIdx === -1 ? 0 : errIdx, correct_word: values.correctWord.trim(), hint: values.hint || "" };
            } else if (skill === 'LISTENING') {
                meta = { audioUrl: formVals.audioUrl || "", options: values.options?.split('\n').filter((o: string) => o.trim()) || [], correctAnswer: values.correctAnswer, answer: values.correctAnswer, transcript: values.transcript || "", correctSentence: values.correctSentence || "" };
            } else if (skill === 'WRITING') {
                meta = { blankSentence: values.blankSentence, correctAnswer: values.correctAnswer, alternatives: values.alternatives?.split(/[,;]+/).map((s: string) => s.trim()).filter(Boolean) || [], hint: values.hint || "" };
            } else if (skill === 'SPEAKING') {
                meta = { audioUrl: formVals.audioUrl || "", transcript: values.transcript || "", correctSentence: values.correctSentence || "", hint: values.hint || "" };
            }
            const payload = { contentText: values.contentText, skillType: skill, difficultyTag: values.difficultyTag, metadataJson: meta };
            if (editingChallengeId) {
                await adminService.updateChallengeBankItem(editingChallengeId, payload);
                message.success('Cập nhật thành công');
            } else {
                const res: any = await adminService.createChallengeBankItem(payload);
                if (res?.id || res?.data?.id) await adminService.assignChallengesToQuiz(quiz.id, [res?.id || res?.data?.id]);
                message.success('Tạo và gán thành công');
            }
            setIsChallengeModalOpen(false);
            createForm.resetFields();
            setEditingChallengeId(null);
            handleLevelChange(selectedLevelId!, true);
        } finally { setSubmittingCreate(false); }
    };

    const handleAutoGenerateAudio = async () => {
        const transcript = createForm.getFieldValue('transcript');
        if (!transcript) { message.warning('Vui lòng nhập Transcript!'); return; }
        setUploadingSingle(true);
        try {
            message.loading({ content: 'AI đang tạo giọng...', key: 'tts' });
            const fptUrl = await synthesizeSpeechFPT(transcript);
            let readyUrl = await waitForAudioLink(fptUrl);
            if (readyUrl && !readyUrl.startsWith('http')) readyUrl = 'https://' + readyUrl;
            const cUrl = await uploadToCloudinary(readyUrl, 'video');
            createForm.setFieldsValue({ audioUrl: cUrl });
            message.success({ content: 'Đã tạo xong!', key: 'tts' });
        } catch { message.error({ content: 'Lỗi TTS', key: 'tts' }); }
        finally { setUploadingSingle(false); }
    };

    // --- View Helpers ---
    const displayQuestions = useMemo(() => {
        if (!loadingQuizChallenges && quizChallenges.length > 0) {
            return quizChallenges.map(qc => ({ ...qc, ...qc.challenge, questionOrder: qc.orderIndex, id: qc.challenge?.id || qc.id, relationId: qc.id }));
        }
        return quiz?.questions || [];
    }, [quizChallenges, quiz?.questions, loadingQuizChallenges]);

    const filteredLevels = useMemo(() => levels.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()) && (!regionFilter || l.dialectId === regionFilter)), [levels, searchTerm, regionFilter]);
    const filteredQuizzes = useMemo(() => (localQuizOrder ?? quizzes).filter(q => (q.title || q.name || '').toLowerCase().includes(quizSearchTerm.toLowerCase()) && (!quizSkillFilter || q.skillType === quizSkillFilter)), [quizzes, localQuizOrder, quizSearchTerm, quizSkillFilter]);

    const getRegionKey = (dialectId: string) => {
        const d = dialects.find(i => i.id === dialectId);
        const n = (d?.name || '').toUpperCase();
        if (n.includes('BẮC')) return 'NORTH';
        if (n.includes('TRUNG')) return 'CENTRAL';
        if (n.includes('NAM')) return 'SOUTH';
        return 'NORTH';
    };

    const selectedLevel = levels.find(l => l.id === selectedLevelId);
    const regionInfo = selectedLevel ? REGION_LABEL[getRegionKey(selectedLevel.dialectId)] : null;

    return (
        <div className="min-h-screen bg-[#fbf6ef] font-nunito p-8 space-y-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-10 bg-[#49B6E5] rounded-full shadow-[2px_2px_0_#1f293705]" />
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                            {quiz ? quiz.name || quiz.title : (selectedLevelId ? "Dòng thời gian luyện tập" : "Quản lý màn học")}
                        </h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                            {selectedLevelId ? `Chương: ${selectedLevel?.name || '...'} • ${regionInfo?.label || '...'}` : "Nội dung học tập theo cấp độ"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {selectedLevelId && (
                        <motion.button
                            whileHover={{ scale: 1.05, x: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { if (quiz) { setQuiz(null); setQuizChallenges([]); } else handleBackToChapters(); }}
                            className="flex items-center gap-2 px-4 py-3 bg-white border-[2.5px] border-slate-900 rounded-2xl shadow-[4px_4px_0_#1f2937] text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
                        >
                            <ArrowLeft size={16} strokeWidth={3} />
                            Quay lại
                        </motion.button>
                    )}

                    {!quiz && selectedLevelId && (
                        <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsCreateQuizModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-[#49B6E5] border-[2.5px] border-slate-900 rounded-2xl shadow-[5px_5px_0_#1f2937] text-[10px] font-black uppercase tracking-widest text-white transition-all"
                        >
                            <Plus size={18} strokeWidth={4} />
                            Thêm màn học
                        </motion.button>
                    )}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {!selectedLevelId ? (
                    /* ── Chapter Selection Grid ── */
                    <motion.div key="selection" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8 text-center py-20">
                        <div className="max-w-md mx-auto space-y-6">
                            <div className="w-24 h-24 bg-blue-50 border-[3px] border-slate-900 rounded-[2rem] shadow-[6px_6px_0_#1f2937] flex items-center justify-center mx-auto text-[#49B6E5]">
                                <Library size={48} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Chọn chương học để bắt đầu</h3>
                            <p className="text-xs font-bold text-slate-400">Vui lòng chọn một chương học từ màn hình quản lý chương học để cấu trúc danh sách bài tập.</p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                onClick={() => navigate('/admin/chapters')}
                                className="px-8 py-4 bg-slate-900 text-white border-[3px] border-slate-900 rounded-2xl shadow-[6px_6px_0_#49B6E5] text-xs font-black uppercase tracking-widest"
                            >
                                Đến quản lý chương học
                            </motion.button>
                        </div>
                    </motion.div>
                ) : !quiz ? (
                    /* ── Quiz List (Roadmap style) ── */
                    <motion.div key="quiz-list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12 pb-20">
                        {loadingQuiz ? (
                            <div className="flex flex-col items-center justify-center py-32 bg-white/40 border-[3px] border-dashed border-slate-900/10 rounded-[3rem]">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="w-16 h-16 rounded-[1.5rem] bg-white border-[3px] border-slate-900 shadow-[6px_6px_0_#49B6E5] flex items-center justify-center mb-6"
                                >
                                    <Zap className="text-[#49B6E5]" size={32} fill="#49B6E5" fillOpacity={0.2} />
                                </motion.div>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Đang nạp dữ liệu bài tập...</p>
                            </div>
                        ) : quizzes.length === 0 ? (
                            <div className="py-32 flex flex-col items-center gap-6 bg-white/40 border-[3px] border-dashed border-slate-900/10 rounded-[3rem]">
                                <Empty description={<span className="font-black uppercase text-slate-400">Chưa có bài kiểm tra nào</span>} />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <Reorder.Group axis="y" values={filteredQuizzes} onReorder={handleReorder} className="w-full max-w-3xl space-y-8 relative">
                                    {/* Vertical Line */}
                                    <div className="absolute left-1/2 -translate-x-1/2 top-4 bottom-4 w-1.5 bg-slate-900/5 rounded-full" />

                                    {filteredQuizzes.map((q, idx) => {
                                        const cfg = SKILL_CONFIG[q.skillType] || { label: 'Tổng hợp', color: '#64748b', icon: Zap, bg: 'bg-slate-50' };
                                        const Icon = cfg.icon;
                                        const isEven = idx % 2 === 0;

                                        return (
                                            <Reorder.Item key={q.id} value={q} className={clsx("relative flex items-center justify-center", isEven ? "md:justify-start" : "md:justify-end")}>
                                                <motion.div
                                                    whileHover={{ scale: 1.02 }}
                                                    className={clsx(
                                                        "w-full md:w-[45%] bg-white border-[3px] border-slate-900 rounded-[2.5rem] p-6 shadow-[8px_8px_0_#1f2937] flex gap-5 group cursor-pointer transition-shadow hover:shadow-[12px_12px_0_#1f2937]",
                                                        isEven ? "md:mr-auto" : "md:ml-auto"
                                                    )}
                                                    onClick={() => setQuiz(q)}
                                                >
                                                    <div className={clsx("w-16 h-16 rounded-3xl border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f2937] flex items-center justify-center shrink-0 transition-transform group-hover:rotate-6", cfg.bg)}>
                                                        <Icon size={28} style={{ color: cfg.color }} strokeWidth={3} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[8px] font-black uppercase text-slate-400">Màn {idx + 1}</div>
                                                            <div className="flex gap-1">
                                                                <button onClick={(e) => { e.stopPropagation(); setQuiz(q); handleOpenEditQuiz(); }} className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-500 transition-colors"><Edit3 size={16} /></button>
                                                                <Popconfirm title="Xóa màn học này?" onConfirm={(e) => { e?.stopPropagation(); handleDeleteQuiz(q.id); }} onCancel={(e) => e?.stopPropagation()} okText="Xóa" cancelText="Hủy"><button onClick={e => e.stopPropagation()} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button></Popconfirm>
                                                            </div>
                                                        </div>
                                                        <h4 className="text-base font-black text-slate-900 uppercase tracking-tight truncate">{q.title || q.name}</h4>
                                                        <div className="flex items-center gap-4 mt-3">
                                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                                                <HelpCircle size={12} className="text-[#49B6E5]" /> {q.questions?.length || q.questionCount || 0} câu
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                                                <Clock size={12} className="text-orange-400" /> {Math.round((q.timeLimitSeconds || 900) / 60)} phút
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Roadmap Dots */}
                                                    <div className={clsx("absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-[3px] border-slate-900 bg-white z-10 shadow-[2px_2px_0_#1f2937]", isEven ? "-right-8" : "-left-8")} />
                                                </motion.div>
                                            </Reorder.Item>
                                        );
                                    })}
                                </Reorder.Group>

                                <div className="mt-16 p-8 bg-white border-[3px] border-slate-900 border-dashed rounded-[3rem] text-center max-w-sm">
                                    <Sliders size={24} className="mx-auto mb-3 text-slate-300" />
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Gợi ý quản trị</p>
                                    <p className="text-[11px] font-bold text-slate-500 italic mt-2">Dùng chuột kéo các màn học để thay đổi thứ tự xuất hiện trong lộ trình của học viên.</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    /* ── Quiz Detail / Questions View ── */
                    <motion.div key="quiz-detail" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-8">
                        <article className="bg-white rounded-[3rem] border-[3.5px] border-slate-900 shadow-[10px_10px_0_#1f2937] overflow-hidden">
                            <div className="p-8 lg:p-10 border-b-[3px] border-slate-900/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-6">
                                    <div className={clsx("w-20 h-20 rounded-[2rem] border-[3px] border-slate-900 shadow-[6px_6px_0_#1f2937] flex items-center justify-center text-white", SKILL_CONFIG[quiz.skillType]?.bg || 'bg-slate-900')}>
                                        {(() => {
                                            const Icon = SKILL_CONFIG[quiz.skillType]?.icon || HelpCircle;
                                            return <Icon size={36} strokeWidth={3} className={quiz.skillType === 'MIXED' ? 'text-white' : `text-[${SKILL_CONFIG[quiz.skillType]?.color}]`} />
                                        })()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <Badge status="processing" color="#49B6E5" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#49B6E5]">Đang cấu trúc nội dung</span>
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{quiz.title || quiz.name}</h2>
                                        <p className="text-xs font-bold text-slate-400 mt-1 max-w-xl line-clamp-2">{quiz.description || "Chưa có mô tả chi tiết cho bài kiểm tra này."}</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <motion.button onClick={handleOpenEditQuiz} whileHover={{ y: -2 }} className="px-5 py-3 bg-white border-[2.5px] border-slate-900 rounded-2xl shadow-[4px_4px_0_#1f2937] text-[10px] font-black uppercase tracking-widest text-slate-700 flex items-center gap-2"><Edit3 size={16} /> Chỉnh sửa</motion.button>
                                    <motion.button onClick={openRewardModal} whileHover={{ y: -2 }} className="px-5 py-3 bg-white border-[2.5px] border-slate-900 rounded-2xl shadow-[4px_4px_0_#1f2937] text-[10px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-2"><Trophy size={16} /> Phần thưởng</motion.button>
                                    <motion.button onClick={openBatchQuestionsModal} whileHover={{ y: -2 }} className="px-5 py-3 bg-slate-900 border-[2.5px] border-slate-900 rounded-2xl shadow-[4px_4px_0_#49B6E5] text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2"><Plus size={16} /> Biên tập nhanh</motion.button>
                                </div>
                            </div>

                            <div className="p-8 lg:p-10">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-[#49B6E5] rounded-full" />
                                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Ngân hàng câu hỏi ({displayQuestions.length})</h3>
                                    </div>
                                    <div className="flex gap-3">
                                        <motion.button onClick={openImportChallengesModal} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"><Upload size={16} /> Import Excel</motion.button>
                                    </div>
                                </div>

                                {loadingQuizChallenges ? (
                                    <div className="py-20 flex flex-col items-center gap-4">
                                        <Loader2 className="animate-spin text-slate-300" size={40} />
                                        <span className="text-[10px] font-black uppercase text-slate-400">Đang quét kho câu hỏi...</span>
                                    </div>
                                ) : displayQuestions.length === 0 ? (
                                    <div className="py-24 border-[3px] border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center gap-4 bg-slate-50/30">
                                        <HelpCircle size={40} className="text-slate-200" />
                                        <p className="text-xs font-bold text-slate-400">Kéo thả hoặc thêm câu hỏi từ thư viện để bắt đầu.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {displayQuestions.map((q, idx) => {
                                            const cfg = SKILL_CONFIG[q.skillType] || { label: q.skillType, color: '#64748b', icon: HelpCircle, bg: 'bg-slate-50' };
                                            const SIcon = cfg.icon;
                                            const p = parseMetadata(q);
                                            const meta = p.metadataJson || {};

                                            return (
                                                <motion.div
                                                    key={q.id || idx}
                                                    whileHover={{ y: -4, scale: 1.01 }}
                                                    className="group relative bg-white border-[3px] border-slate-900 rounded-[2rem] p-5 shadow-[5px_5px_0_#1f2937] transition-all hover:shadow-[8px_8px_0_#1f2937]"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className={clsx("w-12 h-12 rounded-2xl border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937] flex items-center justify-center shrink-0", cfg.bg)}>
                                                            <SIcon size={20} style={{ color: cfg.color }} strokeWidth={3} />
                                                        </div>
                                                        <div className="flex-1 min-w-0 pr-10">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Câu {idx + 1} • {cfg.label}</span>
                                                                <span className={clsx("px-2 py-0.5 rounded-full text-[8px] font-black uppercase border", q.difficultyTag === 'EXTREME' ? 'bg-red-50 border-red-200 text-red-500' : 'bg-slate-50 border-slate-200 text-slate-400')}>
                                                                    {q.difficultyTag || 'Dễ'}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm font-black text-slate-900 leading-tight mb-2 line-clamp-2">{q.contentText || "—"}</p>

                                                            <div className="space-y-1 text-[10px] font-bold text-slate-400">
                                                                {q.skillType === 'LISTENING' && meta.transcript && <div><span className="text-[#49B6E5]">Audio:</span> "{meta.transcript.slice(0, 40)}{meta.transcript.length > 40 ? '...' : ''}"</div>}
                                                                {q.skillType === 'READING' && meta.correct_word && <div><span className="text-emerald-500">Đáp án:</span> {meta.correct_word}</div>}
                                                                {q.skillType === 'WRITING' && meta.correctAnswer && <div><span className="text-violet-500">Điền từ:</span> {meta.correctAnswer}</div>}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="absolute top-4 right-4 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEditQuestion(q, idx)} className="p-2 bg-white border-[2px] border-slate-900 rounded-xl hover:bg-blue-50 text-blue-500 shadow-sm"><Edit3 size={14} strokeWidth={3} /></button>
                                                        <button onClick={() => handleRemoveQuestion(q, idx)} className="p-2 bg-white border-[2px] border-slate-900 rounded-xl hover:bg-red-50 text-red-500 shadow-sm"><Trash2 size={14} strokeWidth={3} /></button>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}

                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            onClick={() => openBatchQuestionsModal()}
                                            className="h-full min-h-[120px] flex flex-col items-center justify-center gap-3 border-[3px] border-dashed border-slate-900/10 rounded-[2rem] hover:border-[#49B6E5] hover:bg-blue-50/50 transition-all group"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-slate-100 border-[2.5px] border-slate-900/5 flex items-center justify-center text-slate-300 group-hover:bg-[#49B6E5] group-hover:text-white transition-colors">
                                                <Plus size={20} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-[#49B6E5]">Thêm câu hỏi mới</span>
                                        </motion.button>
                                    </div>
                                )}
                            </div>
                        </article>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- Modals Modernized --- */}
            <Modal
                title={<div className="flex items-center gap-3 text-slate-900 font-black uppercase tracking-tight"><Plus size={20} strokeWidth={3} className="text-[#49B6E5]" /> {isEditQuizModalOpen ? "Cập nhật bài tập" : "Thêm màn học mới"}</div>}
                open={isCreateQuizModalOpen || isEditQuizModalOpen}
                onCancel={() => { setIsCreateQuizModalOpen(false); setIsEditQuizModalOpen(false); newQuizForm.resetFields(); editQuizForm.resetFields(); }}
                footer={null}
                centered
                width={550}
                className="doodle-modal"
            >
                <Form
                    form={isEditQuizModalOpen ? editQuizForm : newQuizForm}
                    layout="vertical"
                    onFinish={isEditQuizModalOpen ? handleUpdateQuiz : handleCreateQuiz}
                    className="mt-6 space-y-4"
                >
                    <Form.Item name="title" label={<span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Tiêu đề bài tập</span>} rules={[{ required: true, message: 'Nhập tiêu đề' }]}>
                        <Input className="doodle-input" placeholder="Ví dụ: Luyện âm n - l" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={14}>
                            <Form.Item name="skillType" label={<span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Loại kỹ năng</span>} initialValue="MIXED">
                                <Select className="doodle-select">
                                    <Select.Option value="MIXED">Tổng hợp (Mixed)</Select.Option>
                                    {Object.entries(SKILL_CONFIG).map(([k, v]) => <Select.Option key={k} value={k}>{v.label}</Select.Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={10}>
                            <Form.Item name="secondsPerQuestion" label={<span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Thời gian / câu</span>} initialValue={60}>
                                <Select className="doodle-select">
                                    {SECOND_OPTIONS.map(o => <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="description" label={<span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Mô tả ngắn</span>}>
                        <Input.TextArea rows={2} className="doodle-input" placeholder="Ghi chú về nội dung bài tập..." />
                    </Form.Item>

                    <Form.Item name="instructions" label={<span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Hướng dẫn cho học viên</span>}>
                        <Input.TextArea rows={2} className="doodle-input" placeholder="Học viên cần làm gì..." />
                    </Form.Item>

                    <div className="flex justify-end gap-3 pt-4">
                        <motion.button type="submit" disabled={creatingQuiz || updatingQuiz} className="h-12 px-10 bg-slate-900 border-[3px] border-slate-900 rounded-2xl shadow-[4px_4px_0_#49B6E5] text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center gap-2">
                            {(creatingQuiz || updatingQuiz) ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {isEditQuizModalOpen ? "Lưu thay đổi" : "Tạo ngay"}
                        </motion.button>
                    </div>
                </Form>
            </Modal>

            {/* --- Import Challenges Modal --- */}
            <Modal
                title={<div className="text-lg font-black uppercase tracking-tight text-slate-900 flex items-center gap-3"><Upload className="text-[#49B6E5]" /> Import bài tập từ Excel</div>}
                open={isImportChallengesModalOpen}
                onCancel={() => setIsImportChallengesModalOpen(false)}
                footer={null}
                centered
                width={500}
                className="doodle-modal"
            >
                <div className="mt-6 space-y-6">
                    <Form layout="vertical">
                        <Form.Item label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Loại kỹ năng trong file</span>}>
                            <Select className="doodle-select" value={importChallengesSkillType} onChange={setImportChallengesSkillType}>
                                <Select.Option value="MIXED">Tổng hợp (Mixed)</Select.Option>
                                {Object.entries(SKILL_CONFIG).map(([k, v]) => <Select.Option key={k} value={k}>{v.label}</Select.Option>)}
                            </Select>
                        </Form.Item>

                        <div className="p-10 border-[3px] border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50 flex flex-col items-center gap-4 group hover:border-[#49B6E5] transition-all cursor-pointer relative overflow-hidden">
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={(e) => setImportChallengesFile(e.target.files?.[0] || null)}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                            <div className="w-16 h-16 rounded-3xl bg-white border-[2.5px] border-slate-900/5 flex items-center justify-center text-slate-300 group-hover:text-[#49B6E5] group-hover:scale-110 transition-all">
                                <Upload size={32} />
                            </div>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-[#49B6E5]">
                                {importChallengesFile ? importChallengesFile.name : "Chọn file Excel (.xlsx)"}
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 pt-8">
                            <motion.button
                                onClick={handleImportChallengesToQuiz}
                                disabled={importingChallenges || !importChallengesFile}
                                className="h-12 px-10 bg-slate-900 border-[3px] border-slate-900 rounded-2xl shadow-[4px_4px_0_#49B6E5] text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center gap-2 disabled:opacity-50 disabled:grayscale"
                            >
                                {importingChallenges ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                Bắt đầu Import
                            </motion.button>
                        </div>
                    </Form>
                </div>
            </Modal>

            {/* --- Achievement Modal --- */}
            <Modal
                title={<div className="text-lg font-black uppercase tracking-tight text-slate-900 flex items-center gap-3"><Trophy className="text-amber-500" /> Phần thưởng bài tập</div>}
                open={isRewardModalOpen}
                onCancel={() => setIsRewardModalOpen(false)}
                footer={null}
                centered
                width={600}
                className="doodle-modal shadow-xl"
            >
                <div className="mt-6 space-y-6">
                    <p className="text-xs font-bold text-slate-400">Chọn một huy hiệu mà học viên sẽ nhận được khi hoàn thành xuất sắc bài tập này.</p>
                    {loadingRewards ? (
                        <div className="py-20 flex justify-center"><Spin /></div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {rewards.map(badge => (
                                <motion.div
                                    key={badge.id}
                                    whileHover={{ scale: 1.05 }}
                                    className={clsx(
                                        "p-4 rounded-[2rem] border-[3px] flex flex-col items-center gap-3 transition-all cursor-pointer",
                                        quiz?.badgeId === badge.id ? "bg-amber-50 border-amber-500" : "bg-white border-slate-900 shadow-[4px_4px_0_#1f293705] hover:border-amber-500"
                                    )}
                                    onClick={() => handleAttachReward(badge.id)}
                                >
                                    <div className="w-16 h-16 rounded-2xl border-[2px] border-slate-900 overflow-hidden shadow-sm">
                                        <img src={badge.iconUrl || badge.icon_url || "https://img.icons8.com/color/96/medal.png"} alt="Badge" className="w-full h-full object-cover" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-tight text-center leading-tight">{badge.name}</span>
                                    {submittingReward && quiz?.badgeId === badge.id && <Loader2 className="animate-spin text-amber-500" size={14} />}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>

            {/* Quiz Editor Drawer (Batch UI can be a large full-screen modal or separate page - keeping Modal for simplicity) */}
            <Modal
                title={
                    <div className="flex items-center justify-between w-full pr-10">
                        <div className="flex items-center gap-3 text-slate-900 font-black uppercase tracking-tight">
                            <Sliders className="text-[#49B6E5]" /> Biên tập bộ câu hỏi
                        </div>
                        <div className="flex gap-4">
                            <motion.button onClick={addBatchQuestion} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#49B6E5] rounded-xl text-[10px] font-black uppercase border-[2px] border-blue-100 hover:border-[#49B6E5] transition-all"><Plus size={14} /> Thêm mới</motion.button>
                            <motion.button onClick={handleSubmitBatchQuestions} disabled={submittingBatchQuestions} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase shadow-[3px_3px_0_#49B6E5] flex items-center gap-2">
                                {submittingBatchQuestions ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Lưu đồng bộ
                            </motion.button>
                        </div>
                    </div>
                }
                open={isBatchQuestionsModalOpen}
                onCancel={() => setIsBatchQuestionsModalOpen(false)}
                footer={null}
                width="85%"
                style={{ top: 20 }}
                className="doodle-modal-fullscreen"
            >
                <div className="mt-8 max-h-[calc(100vh-220px)] overflow-y-auto pr-2 custom-scrollbar space-y-8 pb-10">
                    <AnimatePresence>
                        {batchQuestions.map((q: any, idx: number) => {
                            const cfg = SKILL_CONFIG[q.skillType] || { label: '?', color: '#ccc', bg: 'bg-slate-50' };
                            return (
                                <motion.div key={q.tempId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white border-[3px] border-slate-900 rounded-[2rem] p-6 shadow-[5px_5px_0_#1f293705] border-l-[8px]" style={{ borderLeftColor: cfg.color }}>
                                    <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs z-10 border-[3px] border-white shadow-lg">{idx + 1}</div>
                                    <button onClick={() => removeBatchQuestion(q.tempId)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>

                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                        {/* Skill & Difficulty */}
                                        <div className="lg:col-span-3 space-y-4">
                                            <Form.Item label={<span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Loại kỹ năng</span>} className="mb-2">
                                                <Select className="doodle-select" value={q.skillType} onChange={v => updateBatchQuestionField(q.tempId, 'skillType', v)}>
                                                    {Object.entries(SKILL_CONFIG).map(([k, v]) => <Select.Option key={k} value={k}>{v.label}</Select.Option>)}
                                                </Select>
                                            </Form.Item>
                                            <Form.Item label={<span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Độ khó</span>} className="mb-2">
                                                <Select className="doodle-select" value={q.difficultyTag} onChange={v => updateBatchQuestionField(q.tempId, 'difficultyTag', v)}>
                                                    {['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXTREME'].map(d => <Select.Option key={d} value={d}>{d}</Select.Option>)}
                                                </Select>
                                            </Form.Item>
                                            <div className={clsx("p-3 rounded-xl border-[2px] shadow-sm", cfg.bg)}>
                                                <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Đang thiết lập cho</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-white border-[2px] border-slate-900/5 flex items-center justify-center shadow-xs">
                                                        {(() => { const SIcon = cfg.icon || HelpCircle; return <SIcon size={16} color={cfg.color} strokeWidth={3} />; })()}
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-tight" style={{ color: cfg.color }}>{cfg.label}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Question Content */}
                                        <div className="lg:col-span-9 space-y-4">
                                            <Form.Item label={<span className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Nội dung câu đố</span>} className="mb-2">
                                                <Input.TextArea rows={1} className="doodle-input font-black" placeholder="Ví dụ: Chọn từ có âm 'n' đúng nhất?" value={q.contentText} onChange={e => updateBatchQuestionField(q.tempId, 'contentText', e.target.value)} />
                                            </Form.Item>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Skill Specific Inputs */}
                                                {q.skillType === 'READING' && (
                                                    <>
                                                        <Form.Item label={<span className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Cả câu chứa lỗi</span>} className="mb-0">
                                                            <Input className="doodle-input" placeholder="Mẹ đi chợ mua lồi cơm" value={q.fullSentence} onChange={e => updateBatchQuestionField(q.tempId, 'fullSentence', e.target.value)} />
                                                        </Form.Item>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <Form.Item label={<span className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Từ bị sai</span>} className="mb-0"><Input className="doodle-input border-red-200" placeholder="lồi" value={q.wrongWord} onChange={e => updateBatchQuestionField(q.tempId, 'wrongWord', e.target.value)} /></Form.Item>
                                                            <Form.Item label={<span className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Từ sửa đúng</span>} className="mb-0"><Input className="doodle-input border-emerald-200" placeholder="nồi" value={q.correctWord} onChange={e => updateBatchQuestionField(q.tempId, 'correctWord', e.target.value)} /></Form.Item>
                                                        </div>
                                                    </>
                                                )}

                                                {(q.skillType === 'LISTENING' || q.skillType === 'SPEAKING') && (
                                                    <>
                                                        <Form.Item className="mb-0" label={
                                                            <div className="flex items-center justify-between w-full pr-1">
                                                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Transcript & Audio</span>
                                                                <button onClick={() => { updateBatchQuestionField(q.tempId, 'transcript', q.transcript); handleAutoGenerateAudioBatch(q.tempId); }} disabled={uploadingBatch[q.tempId]} className="text-[8px] font-black uppercase text-[#49B6E5] hover:underline flex items-center gap-1">
                                                                    {uploadingBatch[q.tempId] ? <Loader2 size={10} className="animate-spin" /> : <Mic size={10} />} AI Voice
                                                                </button>
                                                            </div>
                                                        }>
                                                            <Input className="doodle-input text-xs" placeholder="Nội dung văn bản..." value={q.transcript} onChange={e => updateBatchQuestionField(q.tempId, 'transcript', e.target.value)} />
                                                        </Form.Item>
                                                        <Form.Item label={<span className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">URL âm thanh</span>} className="mb-0">
                                                            <Input className="doodle-input text-xs" placeholder="https://..." value={q.audioUrl} onChange={e => updateBatchQuestionField(q.tempId, 'audioUrl', e.target.value)} />
                                                        </Form.Item>
                                                        {q.skillType === 'LISTENING' && (
                                                            <div className="md:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
                                                                {q.options.map((opt: string, oi: number) => (
                                                                    <div key={oi} className="relative">
                                                                        <Input className={clsx("doodle-input text-xs pr-8", q.correctAnswer === opt && opt !== "" ? "border-emerald-500 bg-emerald-50" : "")} placeholder={`Đáp án ${oi + 1}`} value={opt} onChange={e => updateBatchOption(q.tempId, oi, e.target.value)} />
                                                                        <button onClick={() => updateBatchQuestionField(q.tempId, 'correctAnswer', opt)} className={clsx("absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 transition-colors", q.correctAnswer === opt && opt !== "" ? "bg-emerald-500 border-emerald-500" : "border-slate-200")} />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </>
                                                )}

                                                {q.skillType === 'WRITING' && (
                                                    <>
                                                        <Form.Item label={<span className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Câu đục lỗ</span>} className="mb-0">
                                                            <Input className="doodle-input" placeholder="Mẹ đi chợ mua _ cơm" value={q.blankSentence} onChange={e => updateBatchQuestionField(q.tempId, 'blankSentence', e.target.value)} />
                                                        </Form.Item>
                                                        <Form.Item label={<span className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Đáp án</span>} className="mb-0">
                                                            <Input className="doodle-input border-emerald-200" placeholder="nồi" value={q.correctAnswer} onChange={e => updateBatchQuestionField(q.tempId, 'correctAnswer', e.target.value)} />
                                                        </Form.Item>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </Modal>

            {/* --- Global Doodle Styles --- */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .doodle-input { height: 42px; border: 2.5px solid #1f293715 !important; border-radius: 1rem !important; font-weight: 700 !important; font-family: 'Nunito' !important; transition: all 0.2s ease !important; font-size: 13px !important; }
                .doodle-input:focus, .doodle-input:hover { border-color: #49B6E5 !important; box-shadow: 2px 2px 0 #1f293705 !important; }
                .doodle-select .ant-select-selector { height: 42px !important; border: 2.5px solid #1f293715 !important; border-radius: 1rem !important; font-weight: 700 !important; padding-top: 4px !important; font-size: 13px !important; }
                .ant-select-focused .ant-select-selector { border-color: #49B6E5 !important; box-shadow: none !important; }
                .doodle-modal .ant-modal-content { border-radius: 2.5rem; border: 3.5px solid #1f2937; padding: 25px; box-shadow: 10px 10px 0 #1f293715; }
                .doodle-modal-fullscreen .ant-modal-content { border-radius: 2.5rem; border: 4px solid #1f2937; background: #fbf6ef; padding: 30px; }
                .ant-form-item-label label { margin-bottom: 2px !important; line-height: 1 !important; }
                .ant-modal-close { top: 25px; right: 25px; }
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1f293720; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #1f293740; }
            `}} />
        </div>
    );
};

export default AdminQuizManagementPage;
