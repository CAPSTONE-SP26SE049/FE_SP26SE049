import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Reorder, motion, AnimatePresence } from 'framer-motion';
import {
    Select, Tag, Spin, Empty, Space, Tooltip, Row, Col,
    Divider, Button, Modal, Form, Input, InputNumber, message,
    Pagination, Popconfirm, Badge
} from 'antd';
import {
    Trophy, HelpCircle, BookOpen, Volume2, Mic, Plus,
    Library, Edit3, Search, Eye, Info, ArrowLeft, Download,
    Upload, ExternalLink, Trash2, MinusCircle, LayoutGrid, Zap,
    ChevronRight, Loader2, Save, MoreVertical, Sliders, RotateCcw
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { excelService, downloadBlob } from '../../educator/services/excelService';
import { uploadToCloudinary } from '../../../services/cloudinaryService';
import { synthesizeSpeechFPT, waitForAudioLink } from '../../../services/ttsService';
import { useParams, useNavigate } from 'react-router-dom';
import clsx from 'clsx';

const SKILL_CONFIG: Record<string, { label: string; color: string; icon: any; bg: string }> = {
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
    skillType: string; contentText: string;
    fullSentence: string; wrongWord: string; correctWord: string;
    options: string[]; correctAnswer: string;
    transcript: string; correctSentence?: string; blankSentence: string;
    alternatives: string; hint: string; words?: string; audioUrl: string;
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
    const lastWritingSuggestionRef = useRef('');
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
    const [deletedQuestionsHistory, setDeletedQuestionsHistory] = useState<{ question: BatchQuestion; index: number }[]>([]);
    const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
    const [rewards, setRewards] = useState<any[]>([]);
    const [loadingRewards, setLoadingRewards] = useState(false);
    const [submittingReward, setSubmittingReward] = useState(false);
    const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
    const [rewardFilter, setRewardFilter] = useState<'ALL' | 'UNASSIGNED' | 'ASSIGNED_OTHER' | 'ASSIGNED_CURRENT'>('ALL');
    const [rewardSearchTerm, setRewardSearchTerm] = useState('');
    const [isImportChallengesModalOpen, setIsImportChallengesModalOpen] = useState(false);
    const [importChallengesFile, setImportChallengesFile] = useState<File | null>(null);
    const [importingChallenges, setImportingChallenges] = useState(false);
    const [exportingTemplate, setExportingTemplate] = useState(false);
    const [exportingQuiz, setExportingQuiz] = useState(false);
    const [importChallengesSkillType, setImportChallengesSkillType] = useState<string>('MIXED');

    const isValidExcelFile = (file: File) => /\.(xlsx|xls|csv)$/i.test(file.name);
    const [viewMode, setViewMode] = useState<'roadmap' | 'skill_groups'>('roadmap');
    const [levelsMetaLoading, setLevelsMetaLoading] = useState(true);
    const levelsLookupRetriedRef = useRef(false);

    const unwrapList = useCallback((res: any): any[] => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (res.status === 'success' || res.data !== undefined) {
            const inner = res.data ?? res;
            if (Array.isArray(inner)) return inner;
            if (Array.isArray(inner?.data)) return inner.data;
        }
        const raw = res?.data ?? res;
        if (Array.isArray(raw)) return raw;
        if (Array.isArray(raw?.data)) return raw.data;
        return [];
    }, []);

    const fetchLevelsAndDialects = useCallback(async () => {
        setLevelsMetaLoading(true);
        try {
            const [lRes, dRes]: any[] = await Promise.all([
                adminService.getLevels(),
                adminService.getDialects(),
            ]);
            setLevels(unwrapList(lRes));
            setDialects(unwrapList(dRes));
        } catch (e) {
            console.error('Failed to fetch levels/dialects', e);
        } finally {
            setLevelsMetaLoading(false);
        }
    }, [unwrapList]);

    // --- Data Fetching ---
    useEffect(() => {
        const initData = async () => {
            await fetchLevelsAndDialects();
            try {
                const rRes: any = await adminService.getBadgesForAdmin();
                setRewards(rRes?.data || (Array.isArray(rRes) ? rRes : []));
            } catch (e) {
                console.error('Init rewards failed', e);
            }
        };
        initData();
    }, [fetchLevelsAndDialects]);

    useEffect(() => {
        levelsLookupRetriedRef.current = false;
    }, [selectedLevelId]);

    useEffect(() => {
        if (!selectedLevelId || levelsMetaLoading) return;
        const isResolved = levels.some(l => String(l.id) === String(selectedLevelId));
        if (isResolved || levelsLookupRetriedRef.current) return;
        levelsLookupRetriedRef.current = true;
        fetchLevelsAndDialects();
    }, [selectedLevelId, levels, levelsMetaLoading, fetchLevelsAndDialects]);

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
                        f = { ...f, ...meta };
                    } catch (e) { /* ignore */ }
                }
                // Independently parse itemsJson if it exists
                const rawItems = f.itemsJson || q.itemsJson;
                if (rawItems) {
                    try {
                        const items = typeof rawItems === 'string' ? JSON.parse(rawItems) : rawItems;
                        f.questions = Array.isArray(items) ? items : [];
                    } catch (e) { f.questions = []; }
                } else if (!f.questions) {
                    f.questions = [];
                }
                f.badgeId = q.rewardCatalogId || q.badgeId || null;
                return f;
            });
            formatted.sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0));
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

    const handleOpenEditQuiz = (qObj?: any) => {
        const activeQuiz = qObj || quiz;
        if (!activeQuiz) return;
        const qList = Array.isArray(activeQuiz.questions) ? activeQuiz.questions : [];
        const getCnt = (type: string) => qList.filter((q: any) => q.skillType === type).length;
        editQuizForm.setFieldsValue({
            title: activeQuiz.title || activeQuiz.name,
            description: activeQuiz.description,
            instructions: activeQuiz.instructions,
            passingScore: activeQuiz.passingScore || 80,
            secondsPerQuestion: activeQuiz.timeLimitSeconds || 90,
            skillType: activeQuiz.skillType || 'MIXED',
            readingCount: getCnt('READING'),
            listeningCount: getCnt('LISTENING'),
            speakingCount: getCnt('SPEAKING'),
            writingCount: getCnt('WRITING'),
            orderIndex: activeQuiz.orderIndex || 1,
        });
        setIsEditQuizModalOpen(true);
    };

    const onConfirmReward = async () => {
        if (!quiz?.id) return;
        const currentAttachedId = quiz.rewardCatalogId || quiz.badgeId || null;
        if (selectedRewardId === currentAttachedId) {
            setIsRewardModalOpen(false);
            return;
        }
        setSubmittingReward(true);
        try {
            if (selectedRewardId === null) {
                if (currentAttachedId) {
                    await adminService.attachRewardToQuiz(quiz.id, currentAttachedId);
                }
            } else {
                await adminService.attachRewardToQuiz(quiz.id, selectedRewardId);
            }
            message.success('Cập nhật phần thưởng thành công!');
            setIsRewardModalOpen(false);
            handleLevelChange(selectedLevelId!, true);
        } catch (err: any) {
            message.error('Lỗi khi cập nhật phần thưởng!');
        } finally { setSubmittingReward(false); }
    };

    const handleAttachReward = async (rewardId: string) => {
        setSelectedRewardId(rewardId);
    };

    const handleRemoveReward = async () => {
        if (!quiz?.id) return;
        const currentAttachedId = quiz.rewardCatalogId || quiz.badgeId || null;
        if (!currentAttachedId) return;
        setSubmittingReward(true);
        try {
            await adminService.attachRewardToQuiz(quiz.id, currentAttachedId);
            message.success('Đã gỡ phần thưởng thành công!');
            setIsRewardModalOpen(false);
            handleLevelChange(selectedLevelId!, true);
        } catch (err: any) {
            message.error('Lỗi khi gỡ phần thưởng!');
        } finally { setSubmittingReward(false); }
    };

    const openRewardModal = async () => {
        setIsRewardModalOpen(true);
        const currentBadgeId = quiz?.rewardCatalogId || quiz?.badgeId || null;
        setSelectedRewardId(currentBadgeId);
        if (rewards.length === 0) {
            setLoadingRewards(true);
            try {
                const res: any = await adminService.getBadgesForAdmin();
                setRewards(res?.data || (Array.isArray(res) ? res : []));
            } finally { setLoadingRewards(false); }
        }
    };

    // --- Batch Editing Logic ---
    const addBatchQuestion = () => setBatchQuestions(prev => [...prev, {
        tempId: `new-${Date.now()}-${Math.random()}`, id: '', relationId: '', isExisting: false,
        skillType: quiz?.skillType !== 'MIXED' ? quiz?.skillType : 'LISTENING',
        contentText: '', fullSentence: '', wrongWord: '', correctWord: '',
        options: ['', '', '', ''], correctAnswer: '', transcript: '', correctSentence: '', blankSentence: '', alternatives: '', hint: '', words: ''
    } as any]);

    const removeBatchQuestion = (tid: string) => {
        setBatchQuestions(prev => {
            if (prev.length <= 1) {
                message.warning("Phải giữ lại ít nhất 1 câu hỏi!");
                return prev;
            }
            const index = prev.findIndex(q => q.tempId === tid);
            if (index !== -1) {
                const targetQuestion = prev[index];
                setDeletedQuestionsHistory(hist => [...hist, { question: targetQuestion, index }]);
                message.success({
                    content: (
                        <div className="flex items-center gap-2">
                            <span>Đã xóa câu hỏi số {index + 1}</span>
                            <button
                                onClick={() => handleUndoDeleteQuestion()}
                                className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase rounded-lg border-[1.5px] border-slate-900 shadow-[2px_2px_0_#1f2937] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all ml-2"
                            >
                                HOÀN TÁC
                            </button>
                        </div>
                    ),
                    duration: 6,
                    key: 'delete-question-toast'
                });
            }
            return prev.filter(q => q.tempId !== tid);
        });
    };

    const handleUndoDeleteQuestion = () => {
        setDeletedQuestionsHistory(prevHist => {
            if (prevHist.length === 0) return prevHist;
            const last = prevHist[prevHist.length - 1];
            setBatchQuestions(prevQuestions => {
                const updated = [...prevQuestions];
                updated.splice(last.index, 0, last.question);
                return updated;
            });
            message.success({ content: `Đã hoàn tác khôi phục câu hỏi!`, key: 'delete-question-toast' });
            return prevHist.slice(0, -1);
        });
    };
    const updateBatchQuestionField = (tid: string, f: string, v: any) => setBatchQuestions(prev => prev.map(q => {
        if (q.tempId !== tid) return q;
        const nextQ = { ...q, [f]: v };
        if (q.skillType === 'WRITING' && (f === 'blankSentence' || f === 'correctAnswer')) {
            const blank = f === 'blankSentence' ? v : q.blankSentence;
            const answer = f === 'correctAnswer' ? v : q.correctAnswer;
            nextQ.transcript = (blank || '').replace(/_+/g, answer || '').trim();
            nextQ.correctSentence = nextQ.transcript;
        }
        if (q.skillType === 'LISTENING' && f === 'correctAnswer') {
            nextQ.correctSentence = v;
        }
        return nextQ;
    }));
    const updateBatchOption = (tid: string, idx: number, v: string) => setBatchQuestions(prev => prev.map(q => {
        if (q.tempId !== tid) return q;
        const oldOpt = q.options[idx];
        const opts = [...q.options]; opts[idx] = v;
        const nextQ = { ...q, options: opts };
        if (q.skillType === 'LISTENING' && q.correctAnswer === oldOpt && oldOpt !== '') {
            nextQ.correctAnswer = v;
            nextQ.correctSentence = v;
        }
        return nextQ;
    }));

    const handleAutoGenerateAudioBatch = async (tid: string) => {
        const q = batchQuestions.find(i => i.tempId === tid);
        if (!q?.transcript) { message.warning('Nhập transcript trước!'); return; }
        setUploadingBatch(prev => ({ ...prev, [tid]: true }));
        try {
            message.success('Đã nhận transcript!');
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
                    const correctSentence = q.correctSentence || q.correctAnswer || "";
                    meta = { options: q.options.filter(o => o.trim()), correctAnswer: q.correctAnswer, transcript: correctSentence, correctSentence: correctSentence, hint: q.hint };
                } else if (q.skillType === 'WRITING') {
                    meta = { blankSentence: q.blankSentence, correctAnswer: q.correctAnswer, alternatives: (q.alternatives || '').split(',').map(s => s.trim()).filter(Boolean), hint: q.hint, transcript: q.transcript || "", correctSentence: q.transcript || "" };
                } else if (q.skillType === 'SPEAKING') {
                    const correctSentence = q.correctSentence || "";
                    meta = { transcript: correctSentence, correctSentence: correctSentence, hint: q.hint };
                }

                const payload = { contentText: q.contentText, skillType: q.skillType, metadataJson: meta };
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
        setDeletedQuestionsHistory([]);
        if (displayQuestions.length > 0) {
            setBatchQuestions(displayQuestions.map((c: any, idx: number) => {
                const p = parseMetadata(c);
                const meta = p.metadataJson || {};
                return {
                    tempId: `ex-${p.id}-${idx}`, id: p.id, relationId: p.relationId || '', isExisting: true,
                    skillType: p.skillType || quiz?.skillType || 'LISTENING', contentText: p.contentText || '',
                    fullSentence: Array.isArray(meta.words) ? meta.words.join(' ') : (p.contentText || ''),
                    wrongWord: (Array.isArray(meta.words) && meta.error_index != null) ? meta.words[meta.error_index] : '',
                    correctWord: meta.correct_word || meta.correctWord || '',
                    options: Array.isArray(meta.options) ? [...meta.options, '', '', ''].slice(0, 4) : ['', '', '', ''],
                    correctAnswer: meta.correctAnswer || meta.answer || '',
                    transcript: meta.transcript || meta.correctSentence || '',
                    correctSentence: meta.correctSentence || meta.transcript || '',
                    blankSentence: meta.blankSentence || '',
                    alternatives: Array.isArray(meta.alternatives) ? meta.alternatives.join(', ') : '',
                    hint: meta.hint || ''
                } as any;
            }));
        } else setBatchQuestions([{ tempId: 'new-1', id: '', relationId: '', isExisting: false, skillType: quiz?.skillType !== 'MIXED' ? quiz?.skillType || 'LISTENING' : 'LISTENING', options: ['', '', '', ''] } as any]);
        setIsBatchQuestionsModalOpen(true);
    };

    const openImportChallengesModal = () => {
        setImportChallengesSkillType(quiz?.skillType === 'MIXED' ? 'MIXED' : quiz?.skillType);
        setImportChallengesFile(null);
        setIsImportChallengesModalOpen(true);
    };

    const handleImportChallengesToQuiz = async () => {
        if (!importChallengesFile || !quiz?.id) return;
        if (!isValidExcelFile(importChallengesFile)) {
            message.error('Chỉ chấp nhận file .xlsx, .xls hoặc .csv');
            return;
        }
        setImportingChallenges(true);
        try {
            const res: any = importChallengesSkillType === 'MIXED'
                ? await excelService.importMixedToQuiz(quiz.id, importChallengesFile)
                : await excelService.importChallengesToQuiz(importChallengesSkillType, quiz.id, importChallengesFile);
            const data = res?.data ?? res;
            const successCount = data?.successCount ?? 0;
            const errorCount = data?.errorCount ?? 0;
            if (successCount > 0) {
                message.success(`Nhập file thành công: ${successCount} câu`);
                handleLevelChange(selectedLevelId!, true);
                fetchQuizChallenges();
                setIsImportChallengesModalOpen(false);
            } else {
                message.warning('Nhập file hoàn tất nhưng không có câu nào được thêm');
            }
            if (errorCount > 0) {
                const msgs = data?.messages ?? [];
                message.error(`Có ${errorCount} lỗi khi nhập file${msgs.length ? `: ${msgs[0]}` : ''}`);
            }
        } catch (err: any) {
            message.error(err?.message || err?.response?.data?.message || 'Nhập file thất bại');
        } finally {
            setImportingChallenges(false);
        }
    };

    const handleExportTemplate = async () => {
        if (!quiz || exportingTemplate) return;
        setExportingTemplate(true);
        try {
            message.loading({ content: 'Đang tải file mẫu...', key: 'export-template', duration: 0 });
            const blob = quiz.skillType === 'MIXED'
                ? await excelService.downloadMixedTemplate()
                : await excelService.downloadChallengeTemplate(quiz.skillType);
            downloadBlob(blob, `form_mau_${quiz.skillType.toLowerCase()}_quiz.xlsx`);
            message.success({ content: 'Tải file mẫu thành công!', key: 'export-template' });
        } catch (err) {
            message.error({ content: 'Lỗi tải file mẫu!', key: 'export-template' });
        } finally {
            setExportingTemplate(false);
        }
    };

    const handleExportQuizQuestions = async () => {
        if (!quiz || exportingQuiz) return;
        setExportingQuiz(true);
        try {
            message.loading({ content: 'Đang xuất file...', key: 'export-quiz', duration: 0 });
            const blob = await excelService.exportQuizQuestions(quiz.id);
            const titleStr = quiz.title || quiz.name || 'quiz';
            downloadBlob(blob, `danh_sach_cau_hoi_${titleStr.toLowerCase().replace(/\s+/g, '_')}.xlsx`);
            message.success({ content: 'Xuất file thành công!', key: 'export-quiz' });
        } catch (err: any) {
            message.error({ content: 'Lỗi xuất file!', key: 'export-quiz' });
        } finally {
            setExportingQuiz(false);
        }
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
                timeLimitSeconds: values.secondsPerQuestion || 90,
                skillType: values.skillType || 'MIXED',
                questionCount: 0,
                questions: []
            });
            message.success('Tạo màn học thành công');
            setIsCreateQuizModalOpen(false);
            newQuizForm.resetFields();
            handleLevelChange(selectedLevelId);
        } catch (error: any) {
            message.error('Thêm màn học thất bại');
        } finally { setCreatingQuiz(false); }
    };

    const handleUpdateQuiz = async (values: any) => {
        if (!quiz?.id || !selectedLevelId) return;
        setUpdatingQuiz(true);
        try {
            const qCount = quiz.questions?.length || 0;
            await adminService.updateQuiz(quiz.id, {
                levelId: selectedLevelId,
                title: values.title,
                description: values.description,
                instructions: values.instructions,
                timeLimitSeconds: values.secondsPerQuestion || 90,
                skillType: values.skillType,
                questionCount: qCount,
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
            const vals: any = { contentText: bankItem.challenge.contentText };
            if (skill === 'READING') {
                vals.fullSentence = meta.words?.join(' ');
                vals.wrongWord = meta.words && meta.error_index != null ? meta.words[meta.error_index] : '';
                vals.correctWord = meta.correct_word || meta.correctWord;
                vals.hint = meta.hint;
            } else if (skill === 'LISTENING' || skill === 'SPEAKING') {
                vals.transcript = meta.transcript || meta.correctSentence || '';
                vals.correctSentence = meta.correctSentence || meta.transcript || '';
                if (skill === 'LISTENING') {
                    vals.options = meta.options?.join('\n');
                    vals.correctAnswer = meta.correctAnswer;
                }
                vals.hint = meta.hint;
            } else if (skill === 'WRITING') {
                vals.blankSentence = meta.blankSentence || meta.correctSentence;
                vals.correctAnswer = meta.correctAnswer;
                vals.alternatives = Array.isArray(meta.alternatives) ? meta.alternatives.join(', ') : '';
                vals.transcript = meta.transcript || '';
                vals.correctSentence = meta.correctSentence || '';
                vals.hint = meta.hint;
                lastWritingSuggestionRef.current = vals.transcript;
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
                const correctSentence = values.correctSentence || values.correctAnswer || "";
                meta = { 
                    options: values.options?.split('\n').filter((o: string) => o.trim()) || [], 
                    correctAnswer: values.correctAnswer, 
                    answer: values.correctAnswer, 
                    transcript: values.contentText || correctSentence, 
                    correctSentence: correctSentence 
                };
            } else if (skill === 'WRITING') {
                meta = { blankSentence: values.blankSentence, correctAnswer: values.correctAnswer, alternatives: values.alternatives?.split(/[,;]+/).map((s: string) => s.trim()).filter(Boolean) || [], hint: values.hint || "", transcript: values.transcript || "", correctSentence: values.transcript || "" };
            } else if (skill === 'SPEAKING') {
                const correctSentence = values.correctSentence || "";
                meta = { transcript: correctSentence, correctSentence: correctSentence, hint: values.hint || "" };
            }
            const payload = { contentText: values.contentText, skillType: skill, metadataJson: meta };
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
            message.success({ content: 'Không cần tạo Audio URL nữa theo yêu cầu!', key: 'tts' });
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

    const filteredLevels = useMemo(() => levels.filter(l => (l.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) && (!regionFilter || l.dialectId === regionFilter)), [levels, searchTerm, regionFilter]);
    const filteredQuizzes = useMemo(() => (localQuizOrder ?? quizzes).filter(q => (q.title || q.name || '').toLowerCase().includes(quizSearchTerm.toLowerCase()) && (!quizSkillFilter || q.skillType === quizSkillFilter)), [quizzes, localQuizOrder, quizSearchTerm, quizSkillFilter]);

    const getRegionKey = (dialectId: string) => {
        const d = dialects.find(i => i.id === dialectId);
        const n = (d?.name || '').toUpperCase();
        if (n.includes('BẮC') || n === 'NORTH') return 'NORTH';
        if (n.includes('TRUNG') || n === 'CENTRAL') return 'CENTRAL';
        if (n.includes('NAM') || n === 'SOUTH') return 'SOUTH';
        return 'NORTH';
    };

    const currentLevel = useMemo(() => {
        if (!selectedLevelId) return null;
        return levels.find(l => String(l.id) === String(selectedLevelId)) ?? null;
    }, [levels, selectedLevelId]);

    const currentDialectLabel = useMemo(() => {
        if (!currentLevel?.dialectId) return null;
        const dialect = dialects.find(d => String(d.id) === String(currentLevel.dialectId));
        if (dialect?.description || dialect?.name) {
            return dialect.description || dialect.name;
        }
        const regionKey = getRegionKey(currentLevel.dialectId);
        return REGION_LABEL[regionKey]?.label ?? null;
    }, [currentLevel, dialects]);

    const chapterDisplayName = useMemo(() => {
        if (!selectedLevelId) return '';
        const name = currentLevel?.name || currentLevel?.levelName;
        if (name) return name;
        if (levelsMetaLoading) return 'Đang tải...';
        return 'Không tìm thấy dữ liệu chương';
    }, [selectedLevelId, currentLevel, levelsMetaLoading]);

    const filteredRewards = rewards.filter(badge => {
        if (rewardSearchTerm) {
            const nameMatch = badge.name?.toLowerCase().includes(rewardSearchTerm.toLowerCase());
            const codeMatch = badge.code?.toLowerCase().includes(rewardSearchTerm.toLowerCase());
            if (!nameMatch && !codeMatch) return false;
        }
        const isCurrentQuiz = badge.linkedQuizId === quiz?.id;
        const isOtherQuiz = badge.linkedQuizId && badge.linkedQuizId !== quiz?.id;
        const isUnassigned = !badge.linkedQuizId;

        if (rewardFilter === 'UNASSIGNED') return isUnassigned;
        if (rewardFilter === 'ASSIGNED_OTHER') return isOtherQuiz;
        if (rewardFilter === 'ASSIGNED_CURRENT') return isCurrentQuiz;
        return true;
    });

    return (
        <div className="h-screen bg-[#fbf6ef] font-nunito p-4 md:p-6 overflow-hidden flex flex-col">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    {selectedLevelId && (
                        <motion.button
                            whileHover={{ scale: 1.05, x: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { if (quiz) { setQuiz(null); setQuizChallenges([]); } else handleBackToChapters(); }}
                            className="w-12 h-12 bg-white border-[2.5px] border-slate-900 rounded-2xl shadow-[4px_4px_0_#1f2937] flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all shrink-0"
                        >
                            <ArrowLeft size={18} strokeWidth={3} />
                        </motion.button>
                    )}

                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-[#49B6E5] rounded-full shadow-[2px_2px_0_#1f293705]" />
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                                {quiz ? quiz.name || quiz.title : (selectedLevelId ? "Dòng thời gian luyện tập" : "Quản lý màn học")}
                            </h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                                {selectedLevelId ? `CHƯƠNG: ${chapterDisplayName} • ${currentDialectLabel || '...'}` : "Nội dung học tập theo cấp độ"}
                            </p>
                            {selectedLevelId && currentLevel?.description && (
                                <p className="text-xs font-bold text-slate-500 mt-2 line-clamp-2 max-w-2xl bg-slate-100/60 border border-slate-200/40 rounded-xl px-3 py-1.5 shadow-[2px_2px_0_#1f293705]">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1">Mô tả:</span>
                                    {currentLevel.description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
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

            <div className="flex-1 overflow-hidden flex flex-col pt-4">
                <AnimatePresence mode="wait">
                    {!selectedLevelId && (
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
                    )}
                    {selectedLevelId && !quiz && (
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
                                <div className="flex flex-col items-center w-full">
                                    {/* View Mode Toggle */}
                                    <div className="flex justify-center mb-8">
                                        <div className="bg-slate-200/50 p-1 rounded-2xl flex gap-1 border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f2937]">
                                            <button
                                                onClick={() => setViewMode('roadmap')}
                                                className={clsx("px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", viewMode === 'roadmap' ? "bg-white border-[2.5px] border-slate-900 shadow-[3px_3px_0_#49B6E5] text-slate-900" : "text-slate-500 hover:bg-slate-300/30")}
                                            >Dòng thời gian</button>
                                            <button
                                                onClick={() => setViewMode('skill_groups')}
                                                className={clsx("px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", viewMode === 'skill_groups' ? "bg-white border-[2.5px] border-slate-900 shadow-[3px_3px_0_#49B6E5] text-slate-900" : "text-slate-500 hover:bg-slate-300/30")}
                                            >Nhóm kỹ năng</button>
                                        </div>
                                    </div>

                                    {viewMode === 'roadmap' ? (
                                        <div className="w-full flex-1 flex flex-col overflow-hidden">
                                            <div className="flex-1 flex items-center overflow-x-auto overflow-y-hidden px-12 custom-scrollbar relative">
                                                <Reorder.Group axis="x" values={filteredQuizzes} onReorder={handleReorder} className="flex items-center gap-20 relative min-w-max mx-auto px-20 h-full">
                                                    {/* Central Timeline Line */}
                                                    <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 bg-slate-900/5 rounded-full z-0" />

                                                    {filteredQuizzes.map((q, idx) => {
                                                        const cfg = SKILL_CONFIG[q.skillType] || { label: 'T.Hợp', color: '#64748b', icon: Zap, bg: 'bg-slate-50' };
                                                        const isEven = idx % 2 === 0;
                                                        return (
                                                            <Reorder.Item key={q.id} value={q} className="relative z-10 flex flex-col items-center" style={{ width: '280px' }}>
                                                                <motion.div
                                                                    whileHover={{ scale: 1.05, y: isEven ? -10 : 10 }}
                                                                    className={clsx(
                                                                        "w-full bg-white border-[3.5px] border-slate-900 rounded-[2.5rem] p-6 shadow-[8px_8px_0_#1f2937] flex flex-col gap-4 group cursor-pointer transition-all hover:shadow-[12px_12px_0_#1f2937] relative z-20",
                                                                        isEven ? "mb-[8rem]" : "mt-[8rem]"
                                                                    )}
                                                                    onClick={() => setQuiz(q)}
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="px-3 py-1 rounded-full bg-slate-100 border-2 border-slate-200 text-[9px] font-black uppercase text-slate-400 tracking-wider">Màn {idx + 1}</div>
                                                                        <div className="flex gap-2">
                                                                            <button onClick={(e) => { e.stopPropagation(); setQuiz(q); handleOpenEditQuiz(q); }} className="p-1.5 hover:bg-blue-50 rounded-xl text-slate-400 hover:text-blue-500 transition-all"><Edit3 size={16} strokeWidth={3} /></button>
                                                                            <Popconfirm 
                                                                                title="Xóa màn học?" 
                                                                                onConfirm={(e) => { e?.stopPropagation(); handleDeleteQuiz(q.id); }} 
                                                                                onCancel={(e) => e?.stopPropagation()} 
                                                                                okText="Xóa" 
                                                                                cancelText="Hủy"
                                                                                okButtonProps={{ 
                                                                                    style: { backgroundColor: '#ef4444', color: '#ffffff', fontWeight: '900', border: '2px solid #1f2937' },
                                                                                    className: "hover:bg-red-600 rounded-xl"
                                                                                }}
                                                                                cancelButtonProps={{ 
                                                                                    style: { fontWeight: '700' },
                                                                                    className: "rounded-xl"
                                                                                }}
                                                                            >
                                                                                <button onClick={e => e.stopPropagation()} className="p-1.5 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 transition-all">
                                                                                    <Trash2 size={16} strokeWidth={3} />
                                                                                </button>
                                                                            </Popconfirm>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-4">
                                                                        <div className={clsx("w-14 h-14 rounded-2xl border-[3px] border-slate-900 shadow-[4px_4px_0_#1f2937] flex items-center justify-center shrink-0 transition-transform group-hover:rotate-6", cfg.bg)}>
                                                                            <cfg.icon size={28} style={{ color: cfg.color }} strokeWidth={3} />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight line-clamp-2 leading-tight">{q.title || q.name}</h4>
                                                                            <div className="flex items-center gap-2 mt-1 text-[9px] font-bold text-slate-400">
                                                                                <HelpCircle size={12} className="text-[#49B6E5]" /> {q.questionCount || q.questions?.length || 0} câu đố
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-[#49B6E5] border-[3px] border-slate-900 rounded-2xl flex items-center justify-center text-white shadow-sm opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                                                                        <ChevronRight size={20} strokeWidth={4} />
                                                                    </div>
                                                                </motion.div>

                                                                {/* Visual Connector to Timeline */}
                                                                <div className={clsx("absolute w-[3px] bg-slate-900/10 z-0", isEven ? "top-[100%] mt-[4rem] h-8" : "bottom-[100%] mb-[4rem] h-8")} />
                                                                <div className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-[3.5px] border-slate-900 bg-white z-10 shadow-[3px_3px_0_#1f2937]" />
                                                            </Reorder.Item>
                                                        );
                                                    })}
                                                </Reorder.Group>
                                            </div>

                                            <div className="mt-2 shrink-0 mb-8 flex flex-col items-center">
                                                <div className="px-8 py-3 bg-white border-[3px] border-slate-900 rounded-3xl shadow-[5px_5px_0_#1f2937] flex items-center gap-4 animate-bounce-subtle">
                                                    <div className="flex -space-x-2">
                                                        <div className="w-6 h-6 rounded-lg bg-blue-100 border-2 border-slate-900 flex items-center justify-center text-blue-600"><BookOpen size={12} /></div>
                                                        <div className="w-6 h-6 rounded-lg bg-violet-100 border-2 border-slate-900 flex items-center justify-center text-violet-600"><Volume2 size={12} /></div>
                                                        <div className="w-6 h-6 rounded-lg bg-emerald-100 border-2 border-slate-900 flex items-center justify-center text-emerald-600"><Edit3 size={12} /></div>
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Giữ và kéo để thay đổi thứ tự lộ trình học tập</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full max-w-6xl mx-auto flex-1 overflow-y-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-6 custom-scrollbar">
                                            {Object.entries(SKILL_CONFIG).map(([skillKey, cfg]) => {
                                                const skillQuizzes = filteredQuizzes.filter(q => q.skillType === skillKey);
                                                if (skillQuizzes.length === 0) return null;
                                                return (
                                                    <div key={skillKey} className="bg-white border-[2.5px] border-slate-900 rounded-[1.5rem] p-4 shadow-[4px_4px_0_#1f2937] flex flex-col h-fit max-h-full">
                                                        <div className="flex items-center gap-2 mb-4 shrink-0">
                                                            <div className={clsx("w-12 h-12 rounded-xl border-[2.5px] border-slate-900 shadow-[2px_2px_0_#1f2937] flex items-center justify-center", cfg.bg)}>
                                                                <cfg.icon size={18} style={{ color: cfg.color }} strokeWidth={3} />
                                                            </div>
                                                            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{cfg.label}</h3>
                                                        </div>
                                                        <div className="space-y-2 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                                                            {skillQuizzes.map((q, idx) => (
                                                                <div key={q.id} onClick={() => setQuiz(q)} className="p-3 bg-slate-50 border-[2px] border-slate-200 rounded-[1.25rem] cursor-pointer hover:border-[#49B6E5] hover:bg-blue-50/30 transition-all group flex items-center gap-3">
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center justify-between mb-1">
                                                                            <span className="text-[8px] font-black uppercase text-slate-400 leading-none">Màn {q.orderIndex || idx + 1}</span>
                                                                            {q.rewardIconUrl ? (
                                                                                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5" title={`Thành tựu: ${q.rewardName}`}>
                                                                                    <img src={q.rewardIconUrl} className="w-3 h-3 object-cover rounded-sm" alt="" />
                                                                                    <span className="text-[6.5px] font-black text-amber-600 uppercase tracking-tighter">Quà</span>
                                                                                </div>
                                                                            ) : (
                                                                                <span className="text-[7px] font-bold text-[#49B6E5] uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">{(q.questions?.length || q.questionCount || 0)} câu đố</span>
                                                                            )}
                                                                        </div>
                                                                        <h4 className="text-[10px] font-black text-slate-900 truncate uppercase tracking-tight">{q.title || q.name}</h4>
                                                                    </div>
                                                                    <Edit3 size={12} className="text-[#49B6E5] opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}
                    {selectedLevelId && quiz && (
                        /* ── Quiz Detail / Questions View ── */
                        <motion.div
                            key="quiz-detail"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="flex-1 flex flex-col overflow-hidden space-y-3"
                        >
                            <article className="bg-white rounded-[2rem] border-[3px] border-slate-900 shadow-[8px_8px_0_#1f293708] overflow-hidden flex flex-col flex-1">
                                <div className="p-5 border-b-[2.5px] border-slate-900/5 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 bg-white">
                                    <div className="flex items-center gap-4">
                                        <div className={clsx(
                                            "w-16 h-16 rounded-[1.5rem] border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f2937] flex items-center justify-center shrink-0",
                                            SKILL_CONFIG[quiz.skillType]?.bg || 'bg-slate-50'
                                        )}>
                                            {(() => {
                                                const cfg = SKILL_CONFIG[quiz.skillType] || { icon: HelpCircle, color: '#64748b' };
                                                const Icon = cfg.icon;
                                                return <Icon size={28} strokeWidth={3} style={{ color: cfg.color }} />;
                                            })()}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <Badge status="processing" color="#49B6E5" />
                                                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#49B6E5]">
                                                    {SKILL_CONFIG[quiz.skillType]?.label || 'Hỗn hợp'}
                                                </span>
                                            </div>
                                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight truncate">{quiz.title || quiz.name}</h2>
                                            <p className="text-[10px] font-bold text-slate-400 truncate max-w-md">{quiz.description || "Nội dung bài tập & danh sách câu hỏi."}</p>
                                            
                                            {/* Reward Badge Display */}
                                            {(quiz.rewardIconUrl || quiz.rewardName) && (
                                                <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-amber-50 border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937] rounded-xl w-fit">
                                                    <div className="w-5 h-5 rounded-md border border-slate-900 overflow-hidden bg-white flex items-center justify-center shrink-0">
                                                        <img src={quiz.rewardIconUrl || "https://img.icons8.com/color/96/medal.png"} alt="Badge" className="w-full h-full object-cover" />
                                                    </div>
                                                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-700">Thành tựu: {quiz.rewardName}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <motion.button onClick={openRewardModal} whileHover={{ y: -2 }} className="px-4 py-2 bg-white border-[2px] border-slate-900 rounded-xl shadow-[3px_3px_0_#1f2937] text-[9px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-2"><Trophy size={14} strokeWidth={3} /> Quà</motion.button>
                                        <motion.button onClick={openBatchQuestionsModal} whileHover={{ y: -2 }} className="px-5 py-2.5 bg-slate-900 border-[2px] border-slate-900 rounded-xl shadow-[4px_4px_0_#49B6E5] text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-2 transition-all"><Sliders size={16} strokeWidth={3} /> Biên tập</motion.button>
                                    </div>
                                </div>

                                <div className="p-5 flex-1 flex flex-col overflow-hidden bg-[#fafafa]/20">
                                    <div className="flex items-center justify-between mb-4 shrink-0 px-1">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-5 bg-slate-900 rounded-full" />
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Danh sách câu đố ({displayQuestions.length})</h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <motion.button onClick={openImportChallengesModal} whileHover={{ y: -1 }} className="flex items-center gap-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-[#49B6E5] transition-all"><Upload size={14} strokeWidth={3} /> Nhập file</motion.button>
                                            <motion.button onClick={handleExportTemplate} disabled={exportingTemplate} whileHover={{ y: -1 }} className="flex items-center gap-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-500 transition-all disabled:opacity-50"><Download size={14} strokeWidth={3} /> {exportingTemplate ? 'Đang tải...' : 'Tải file mẫu'}</motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                onClick={handleExportQuizQuestions}
                                                disabled={exportingQuiz}
                                                className="px-4 py-2 bg-[#E2F5FC] text-[#49B6E5] border-[2px] border-[#49B6E5] rounded-xl shadow-[3px_3px_0_#1f2937] text-[9px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                                            >
                                                <Download size={14} strokeWidth={4} /> {exportingQuiz ? 'Đang xuất...' : 'Xuất file'}
                                            </motion.button>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                        {loadingQuizChallenges ? (
                                            <div className="py-20 flex flex-col items-center gap-4">
                                                <div className="w-12 h-12 border-[3.5px] border-slate-100 border-t-[#49B6E5] rounded-full animate-spin" />
                                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Đang tải dữ liệu...</span>
                                            </div>
                                        ) : displayQuestions.length === 0 ? (
                                            <div className="py-12 border-[3px] border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center gap-4 bg-white/50">
                                                <div className="w-16 h-16 bg-slate-50 border-[2.5px] border-slate-900 rounded-[1.25rem] flex items-center justify-center text-slate-200">
                                                    <HelpCircle size={32} />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Chưa có câu hỏi</p>
                                                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">Vui lòng sử dụng tính năng thêm hoặc nhập liệu.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-2">
                                                {displayQuestions.map((q: any, idx: number) => {
                                                    const cfg = SKILL_CONFIG[q.skillType] || { label: q.skillType, color: '#64748b', icon: HelpCircle, bg: 'bg-slate-50' };
                                                    const p = parseMetadata(q);
                                                    const meta = p.metadataJson || {};

                                                    return (
                                                        <motion.div
                                                            key={q.id || idx}
                                                            whileHover={{ y: -3 }}
                                                            className="group relative bg-white border-[2.5px] border-slate-900 rounded-[1.5rem] p-4 shadow-[4px_4px_0_#1f293708] transition-all hover:shadow-[5px_5px_0_#1f293710] flex flex-col justify-between min-h-[120px]"
                                                        >
                                                            <div className="flex items-start gap-4">
                                                                <div className={clsx("w-10 h-10 rounded-xl border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937] flex items-center justify-center shrink-0 transition-transform group-hover:-rotate-3", cfg.bg)}>
                                                                    <cfg.icon size={18} style={{ color: cfg.color }} strokeWidth={3} />
                                                                </div>
                                                                <div className="flex-1 min-w-0 pr-10">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="px-1.5 py-0.5 bg-slate-100 rounded-md text-[7px] font-black uppercase text-slate-400 tracking-tighter"># {idx + 1}</span>
                                                                        <span className="text-[7px] font-black uppercase tracking-widest truncate" style={{ color: cfg.color }}>{cfg.label}</span>
                                                                    </div>
                                                                    <p className="text-[12px] font-black text-slate-900 leading-tight line-clamp-2 mb-2 pr-2">{q.contentText || "(Trống)"}</p>
                                                                </div>
                                                            </div>

                                                            <div className="mt-auto pt-2 border-t-[1.5px] border-slate-900/5 flex items-center justify-between">
                                                                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 overflow-hidden">
                                                                    {q.skillType === 'LISTENING' && meta.transcript && <div className="truncate shrink-0"><span className="text-[#49B6E5] text-[7px] uppercase">Audio</span></div>}
                                                                    {q.skillType === 'READING' && (meta.correct_word || meta.correctWord) && <div className="truncate"><span className="text-emerald-500 text-[7px] uppercase">Đáp án:</span> {meta.correct_word || meta.correctWord}</div>}
                                                                    {q.skillType === 'WRITING' && meta.correctAnswer && <div className="truncate"><span className="text-violet-500 text-[7px] uppercase">Điền:</span> {meta.correctAnswer}</div>}
                                                                </div>
                                                            </div>

                                                            <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                                                <button onClick={() => handleEditQuestion(q, idx)} className="p-1.5 bg-white border-[1.5px] border-slate-900 rounded-lg hover:bg-blue-50 text-blue-500 shadow-sm transition-all"><Edit3 size={12} strokeWidth={3} /></button>
                                                                <button onClick={() => handleRemoveQuestion(q, idx)} className="p-1.5 bg-white border-[1.5px] border-slate-900 rounded-lg hover:bg-red-50 text-red-500 shadow-sm transition-all"><Trash2 size={12} strokeWidth={3} /></button>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </article>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

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
                            <Form.Item name="skillType" label={<span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Loại kỹ năng</span>} initialValue="LISTENING">
                                <Select className="doodle-select">
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

            {/* --- Challenge (Individual) Modal --- */}
            <Modal
                title={<div className="text-lg font-black uppercase tracking-tight text-slate-900 flex items-center gap-3"><Zap className="text-[#49B6E5]" /> {editingChallengeId ? "Cập nhật câu đố" : "Thêm câu đố mới"}</div>}
                open={isChallengeModalOpen}
                onCancel={() => setIsChallengeModalOpen(false)}
                footer={null}
                width={650}
                centered
                className="doodle-modal"
            >
                <Form
                    form={createForm}
                    layout="vertical"
                    onFinish={handleCreateNewChallenge}
                    className="mt-6 space-y-4"
                    onValuesChange={(changedValues, allValues) => {
                        if (activeSkillType === 'WRITING' && (changedValues.blankSentence !== undefined || changedValues.correctAnswer !== undefined)) {
                            const blank = allValues.blankSentence || '';
                            const answer = allValues.correctAnswer || '';
                            const currentTranscript = allValues.transcript || '';
                            const oldSuggestion = lastWritingSuggestionRef.current;
                            if (!currentTranscript || currentTranscript === oldSuggestion) {
                                const suggestion = blank.replace(/_+/g, answer).trim();
                                createForm.setFieldsValue({ transcript: suggestion, correctSentence: suggestion });
                                lastWritingSuggestionRef.current = suggestion;
                            }
                        }
                        if (activeSkillType === 'LISTENING' && changedValues.correctAnswer !== undefined) {
                            const curSentence = createForm.getFieldValue('correctSentence') || '';
                            if (!curSentence.trim().includes(' ')) {
                                createForm.setFieldsValue({ correctSentence: changedValues.correctAnswer });
                            }
                        }
                    }}
                >
                    {/* Skill Selector - Only show if Quiz is MIXED */}
                    {quiz?.skillType === 'MIXED' ? (
                        <Form.Item name="skillType" label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Loại kỹ năng</span>} initialValue={activeSkillType}>
                            <Select
                                className="doodle-select"
                                onChange={(v) => setActiveSkillType(v)}
                            >
                                {Object.entries(SKILL_CONFIG).map(([k, v]) => (
                                    <Select.Option key={k} value={k}>{v.label}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    ) : (
                        <div className="p-4 bg-slate-50 border-[2.5px] border-slate-900/5 rounded-2xl flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase text-slate-400">Kỹ năng cố định:</span>
                                <Badge status="processing" color={SKILL_CONFIG[quiz?.skillType]?.color} text={<span className="text-xs font-black uppercase" style={{ color: SKILL_CONFIG[quiz?.skillType]?.color }}>{SKILL_CONFIG[quiz?.skillType]?.label}</span>} />
                            </div>
                            <div className="text-[8px] font-black text-slate-300 uppercase tracking-tighter italic">Tối ưu theo màn học</div>
                        </div>
                    )}

                    <Form.Item name="contentText" label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nội dung hiển thị chính</span>} rules={[{ required: true }]}>
                        <Input.TextArea rows={2} className="doodle-input" placeholder="Ví dụ: Luyện phát âm 'n' và 'l'..." />
                    </Form.Item>

                    <div className="bg-[#fafafa] p-6 rounded-[2rem] border-[2.5px] border-dashed border-slate-200">
                        {activeSkillType === 'LISTENING' && (
                            <div className="space-y-4">
                                <Form.Item name="correctSentence" label={<span className="text-[9px] font-black uppercase text-slate-400">Nội dung câu đọc chuẩn</span>} rules={[{ required: true }]}>
                                    <Input.TextArea rows={2} className="doodle-input border-emerald-200 text-xs font-bold" placeholder="Ví dụ: Trời nồm nên nhà bị nồm..." />
                                </Form.Item>
                                <Form.Item name="options" label={<span className="text-[9px] font-black uppercase text-slate-400">Danh sách đáp án (Mỗi dòng 1 câu)</span>} rules={[{ required: true }]}>
                                    <Input.TextArea rows={4} className="doodle-input" placeholder="Đáp án A&#10;Đáp án B&#10;..." />
                                </Form.Item>
                                <Form.Item name="correctAnswer" label={<span className="text-[9px] font-black uppercase text-slate-400">Đáp án đúng (Phải khớp chính xác một dòng trên)</span>} rules={[{ required: true }]}>
                                    <Input className="doodle-input border-emerald-200" />
                                </Form.Item>
                            </div>
                        )}

                        {activeSkillType === 'WRITING' && (
                            <div className="space-y-4">
                                <Form.Item name="blankSentence" label={<span className="text-[9px] font-black uppercase text-slate-400">Câu đục lỗ (Dùng '_' cho chỗ trống)</span>} rules={[{ required: true }]}>
                                    <Input className="doodle-input" placeholder="Ví dụ: Con _ đang gặm cỏ" />
                                </Form.Item>
                                <Form.Item name="correctAnswer" label={<span className="text-[9px] font-black uppercase text-slate-400">Đáp án đúng</span>} rules={[{ required: true }]}>
                                    <Input className="doodle-input border-emerald-200" placeholder="bò" />
                                </Form.Item>
                                <Form.Item name="alternatives" label={<span className="text-[9px] font-black uppercase text-slate-400">Các đáp án chấp nhận khác (Cắt nhau bởi dấu phẩy)</span>}>
                                    <Input className="doodle-input" placeholder="nghé, trâu" />
                                </Form.Item>
                            </div>
                        )}

                        {activeSkillType === 'SPEAKING' && (
                            <div className="space-y-4">
                                <Form.Item name="correctSentence" label={<span className="text-[9px] font-black uppercase text-slate-400">Nội dung câu đọc chuẩn</span>} rules={[{ required: true }]}>
                                    <Input.TextArea rows={2} className="doodle-input border-emerald-200 text-xs font-bold" placeholder="Ví dụ: Lúa nếp là lúa nếp làng..." />
                                </Form.Item>
                                <div className="p-4 bg-orange-50 border-2 border-orange-100 rounded-2xl flex items-center gap-3">
                                    <Mic className="text-orange-500" size={20} />
                                    <p className="text-[10px] font-bold text-orange-600 leading-tight">Học viên sẽ được yêu cầu nói chính xác đoạn văn bản này để hoàn thành câu đố.</p>
                                </div>
                            </div>
                        )}

                        <Form.Item name="hint" label={<span className="text-[9px] font-black uppercase text-slate-400 mt-4 block">Gợi ý (Không bắt buộc)</span>}>
                            <Input className="doodle-input" />
                        </Form.Item>
                    </div>

                    <div className="flex justify-end gap-3 pt-6">
                        <motion.button
                            type="submit"
                            disabled={submittingCreate}
                            className="h-12 px-10 bg-slate-900 border-[3px] border-slate-900 rounded-2xl shadow-[4px_4px_0_#49B6E5] text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2"
                        >
                            {submittingCreate ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {editingChallengeId ? "Cập nhật" : "Tạo và thêm vào bài tập"}
                        </motion.button>
                    </div>
                </Form>
            </Modal>

            {/* --- Import Challenges Modal --- */}
            <Modal
                title={<div className="text-lg font-black uppercase tracking-tight text-slate-900 flex items-center gap-3"><Upload className="text-[#49B6E5]" /> Nhập file bài tập</div>}
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
                            <Select
                                className="doodle-select"
                                value={importChallengesSkillType}
                                onChange={setImportChallengesSkillType}
                                disabled={quiz?.skillType !== 'MIXED'}
                            >
                                <Select.Option value="MIXED">Tổng hợp (Mixed)</Select.Option>
                                {Object.entries(SKILL_CONFIG).map(([k, v]) => <Select.Option key={k} value={k}>{v.label}</Select.Option>)}
                            </Select>
                        </Form.Item>

                        <div className="p-10 border-[3px] border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50 flex flex-col items-center gap-4 group hover:border-[#49B6E5] transition-all cursor-pointer relative overflow-hidden">
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
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
                                {importingChallenges ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                {importingChallenges ? 'Đang nhập file...' : 'Nhập file'}
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
                footer={
                    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                        <div>
                            {(quiz?.rewardCatalogId || quiz?.badgeId) && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={submittingReward}
                                    onClick={handleRemoveReward}
                                    className="px-4 py-2 border-[2px] border-rose-200 hover:border-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-500 bg-white transition-all flex items-center gap-1.5"
                                >
                                    {submittingReward ? <Loader2 className="animate-spin" size={12} /> : null}
                                    Gỡ gán phần thưởng
                                </motion.button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIsRewardModalOpen(false)}
                                className="px-4 py-2 border-[2px] border-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 bg-white shadow-[2px_2px_0_#1f2937]"
                            >
                                Hủy bỏ
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onConfirmReward}
                                disabled={submittingReward}
                                className="px-5 py-2 bg-slate-900 border-[2px] border-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-[3px_3px_0_#49B6E5] flex items-center gap-2"
                            >
                                {submittingReward ? <Loader2 className="animate-spin" size={14} /> : null}
                                Xác nhận chọn
                            </motion.button>
                        </div>
                    </div>
                }
                centered
                width={700}
                className="doodle-modal shadow-xl"
            >
                <div className="mt-6 space-y-6">
                    <p className="text-xs font-bold text-slate-400">Chọn một huy hiệu mà học viên sẽ nhận được khi hoàn thành xuất sắc bài tập này.</p>
                    
                    {/* Search & Filter Controls */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Input
                            placeholder="Tìm kiếm thành tựu..."
                            value={rewardSearchTerm}
                            onChange={e => setRewardSearchTerm(e.target.value)}
                            className="doodle-input flex-1"
                        />
                        <Select
                            value={rewardFilter}
                            onChange={val => setRewardFilter(val)}
                            className="doodle-select w-full sm:w-[220px]"
                            options={[
                                { label: 'Tất cả thành tựu', value: 'ALL' },
                                { label: 'Đã gán cho quiz khác', value: 'ASSIGNED_OTHER' },
                                { label: 'Chưa được gán', value: 'UNASSIGNED' },
                            ]}
                        />
                    </div>

                    {loadingRewards ? (
                        <div className="py-20 flex justify-center"><Spin /></div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-1">

                            {filteredRewards.map(badge => {
                                const isCurrentQuiz = badge.linkedQuizId === quiz?.id;
                                const isOtherQuiz = badge.linkedQuizId && badge.linkedQuizId !== quiz?.id;
                                return (
                                    <motion.div
                                        key={badge.id}
                                        whileHover={{ scale: 1.02 }}
                                        className={clsx(
                                            "p-4 rounded-[2rem] border-[3px] flex flex-col items-center justify-between gap-3 transition-all cursor-pointer min-h-[160px]",
                                            selectedRewardId === badge.id ? "bg-amber-50 border-amber-500 shadow-[3px_3px_0_#f59e0b]" : "bg-white border-slate-900 shadow-[3px_3px_0_#1f293705] hover:border-amber-500"
                                        )}
                                        onClick={() => handleAttachReward(badge.id)}
                                    >
                                        <div className="w-16 h-16 rounded-2xl border-[2px] border-slate-900 overflow-hidden shadow-sm">
                                            <img src={badge.iconUrl || badge.icon_url || "https://img.icons8.com/color/96/medal.png"} alt="Badge" className="w-full h-full object-cover" />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-tight text-center leading-tight">{badge.name}</span>
                                        
                                        {/* Status Indicators */}
                                        <div className="w-full flex justify-center">
                                            {isCurrentQuiz ? (
                                                <span className="text-[8px] font-black uppercase bg-emerald-50 border border-emerald-300 text-emerald-600 px-2 py-0.5 rounded-full">Đang gán</span>
                                            ) : isOtherQuiz ? (
                                                <span className="text-[8px] font-black uppercase bg-amber-50 border border-amber-300 text-amber-600 px-2 py-0.5 rounded-full truncate max-w-full text-center" title={`Gán cho: ${badge.linkedQuizName} (Level: ${badge.linkedLevelName})`}>
                                                    Gán: {badge.linkedQuizName}
                                                </span>
                                            ) : (
                                                <span className="text-[8px] font-black uppercase bg-slate-50 border border-slate-200 text-slate-400 px-2 py-0.5 rounded-full">Chưa gán</span>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
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
                            {deletedQuestionsHistory.length > 0 && (
                                <motion.button
                                    onClick={handleUndoDeleteQuestion}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-500 rounded-xl text-[10px] font-black uppercase border-[2px] border-orange-100 hover:border-orange-500 transition-all shadow-xs"
                                >
                                    <RotateCcw size={14} strokeWidth={3} /> Hoàn tác ({deletedQuestionsHistory.length})
                                </motion.button>
                            )}
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
                <div className="mt-8 max-h-[calc(100vh-220px)] overflow-y-auto px-6 custom-scrollbar space-y-8 pb-10">
                    <AnimatePresence>
                        {batchQuestions.map((q: any, idx: number) => {
                            const cfg = SKILL_CONFIG[q.skillType] || { label: '?', color: '#ccc', bg: 'bg-slate-50' };
                            return (
                                <motion.div key={q.tempId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white border-[3px] border-slate-900 rounded-[2rem] p-6 shadow-[5px_5px_0_#1f293705] border-l-[8px]" style={{ borderLeftColor: cfg.color }}>
                                    {/* Card Header Row - Prevents overlap completely */}
                                    <div className="flex items-center justify-between mb-6 border-b-[2.5px] border-dashed border-slate-200 pb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="px-3.5 py-1 bg-slate-900 text-white border-[2px] border-slate-900 rounded-xl text-xs font-black shadow-sm">Câu hỏi {idx + 1}</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#49B6E5] bg-blue-50/50 px-2.5 py-1 rounded-lg border-[1.5px] border-blue-100">({cfg.label})</span>
                                        </div>
                                        <button
                                            onClick={() => removeBatchQuestion(q.tempId)}
                                            className="px-4 py-1.5 bg-red-50 border-[2px] border-slate-900 rounded-xl text-red-500 text-[10px] font-black uppercase shadow-[3px_3px_0_#1f2937] hover:bg-red-100 hover:text-red-600 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all flex items-center gap-1.5 z-20"
                                        >
                                            <Trash2 size={14} strokeWidth={3} /> Xóa câu hỏi
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                        {/* Skill & Difficulty */}
                                        <div className="lg:col-span-3 space-y-4">
                                            <Form.Item label={<span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Loại kỹ năng</span>} className="mb-2">
                                                <Select
                                                    className="doodle-select"
                                                    value={q.skillType}
                                                    onChange={v => updateBatchQuestionField(q.tempId, 'skillType', v)}
                                                    disabled={quiz?.skillType !== 'MIXED'}
                                                >
                                                    {Object.entries(SKILL_CONFIG).map(([k, v]) => <Select.Option key={k} value={k}>{v.label}</Select.Option>)}
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
                                                {(q.skillType === 'LISTENING' || q.skillType === 'SPEAKING') && (
                                                    <>
                                                        <Form.Item className="md:col-span-2 mb-0" label={
                                                            <div className="flex items-center justify-between w-full pr-1">
                                                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Nội dung câu đọc chuẩn</span>
                                                            </div>
                                                        }>
                                                            <Input.TextArea rows={2} className="doodle-input text-xs border-emerald-200 font-bold" placeholder="Nội dung câu đọc chuẩn..." value={q.correctSentence} onChange={e => updateBatchQuestionField(q.tempId, 'correctSentence', e.target.value)} />
                                                        </Form.Item>
                                                        {q.skillType === 'LISTENING' && (
                                                            <div className="md:col-span-2 mt-4">
                                                                <div className="flex flex-wrap items-center gap-2 mb-2 ml-1">
                                                                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Danh sách đáp án</span>
                                                                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">Tích chọn vòng tròn bên phải của đáp án để đặt làm đáp án đúng!</span>
                                                                </div>
                                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                                                    {q.options.map((opt: string, oi: number) => (
                                                                        <div key={oi} className="relative">
                                                                            <Input className={clsx("doodle-input text-xs pr-8", q.correctAnswer === opt && opt !== "" ? "border-emerald-500 bg-emerald-50 font-black text-emerald-800" : "")} placeholder={`Đáp án ${oi + 1}`} value={opt} onChange={e => updateBatchOption(q.tempId, oi, e.target.value)} />
                                                                            <Tooltip title="Đặt làm đáp án đúng">
                                                                                <button onClick={() => updateBatchQuestionField(q.tempId, 'correctAnswer', opt)} className={clsx("absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 transition-colors", q.correctAnswer === opt && opt !== "" ? "bg-emerald-500 border-emerald-500 cursor-default" : "border-slate-300 hover:border-emerald-500")} />
                                                                            </Tooltip>
                                                                        </div>
                                                                    ))}
                                                                </div>
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

                                                {/* Hint field - all skill types */}
                                                <Form.Item label={<span className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Gợi ý (không bắt buộc)</span>} className="md:col-span-2 mb-0">
                                                    <Input className="doodle-input" placeholder="Nhập gợi ý cho người học..." value={q.hint || ''} onChange={e => updateBatchQuestionField(q.tempId, 'hint', e.target.value)} />
                                                </Form.Item>
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
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .animate-bounce-subtle { animation: bounce-subtle 3s ease-in-out infinite; }
            `}} />
        </div>
    );
};

export default AdminQuizManagementPage;
