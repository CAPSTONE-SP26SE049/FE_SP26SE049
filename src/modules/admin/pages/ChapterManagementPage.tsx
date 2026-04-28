import React, { useEffect, useState, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import { useLocation, useNavigate } from 'react-router-dom';
import { message, Form, Input, InputNumber, Select, Modal, Tooltip, Badge, Row, Col, DatePicker, Popconfirm, Drawer, Divider, Spin, Empty, Pagination } from 'antd';
import {
    Plus, Search, MapPin,
    Download, Upload, FileSpreadsheet,
    Trash2, Edit3, ChevronRight,
    Info, AlertCircle, CheckCircle2,
    Rocket, BookOpen,
    LayoutGrid, Zap
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { adminExcelService } from '../services/adminExcelService';
import { downloadBlob } from '../../educator/services/excelService';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const AdminChapterManagementPage: React.FC = () => {
    const navigate = useNavigate();
    const [levels, setLevels] = useState<any[]>([]);
    const [dialects, setDialects] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingLevel, setEditingLevel] = useState<any | null>(null);
    const [errorTags, setErrorTags] = useState<any[]>([]);
    const [form] = Form.useForm();
    const [editForm] = Form.useForm();
    const [quizForm] = Form.useForm();
    const [assignmentForm] = Form.useForm();
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [assignLevels, setAssignLevels] = useState<any[]>([]);
    const [isCreateQuizModalOpen, setIsCreateQuizModalOpen] = useState(false);
    const [creatingQuiz, setCreatingQuiz] = useState(false);
    const [selectedLevelForQuiz, setSelectedLevelForQuiz] = useState<any | null>(null);
    const location = useLocation();

    // --- Filter & Sort State ---
    const [searchText, setSearchText] = useState('');
    const [filterRegion, setFilterRegion] = useState<string | undefined>(undefined);
    const [regionPages, setRegionPages] = useState<Record<string, number>>({ NORTH: 1, CENTRAL: 1, SOUTH: 1, OTHER: 1 });

    // Import/Export states
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
    const [templateDownloading, setTemplateDownloading] = useState(false);
    const templateDownloadInFlight = useRef(false);
    const [removedAssignmentIds, setRemovedAssignmentIds] = useState<string[]>([]);
    const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
    const [selectedLevelForDetail, setSelectedLevelForDetail] = useState<any | null>(null);

    const fetchLevels = async () => {
        setLoading(true);
        try {
            const response: any = await adminService.getLevelsForSelection();
            if (response && (response.status === 'success' || response.data)) {
                setLevels(response.data || response);
            } else {
                setLevels(Array.isArray(response) ? response : []);
            }
        } catch (error) {
            console.error('Error fetching levels:', error);
            message.error('Không thể tải danh sách chương học');
        } finally {
            setLoading(false);
        }
    };

    const REGION_LABEL: Record<string, { label: string; color: string; bg: string; iconBg: string }> = {
        NORTH: { label: 'Miền Bắc', color: '#49B6E5', bg: '#f0f9ff', iconBg: 'bg-blue-100' },
        SOUTH: { label: 'Miền Nam', color: '#10b981', bg: '#f0fdf4', iconBg: 'bg-emerald-100' },
        CENTRAL: { label: 'Miền Trung', color: '#f59e0b', bg: '#fffbeb', iconBg: 'bg-amber-100' },
    };

    const fetchDialects = async () => {
        try {
            const response: any = await adminService.getDialects();
            if (response && (response.status === 'success' || response.data)) {
                setDialects(response.data || response);
            } else {
                setDialects(Array.isArray(response) ? response : []);
            }
        } catch (error) {
            console.error('Error fetching dialects:', error);
            message.error('Không thể tải danh sách phương ngữ');
        }
    };

    const fetchErrorTags = async (dialectId?: string) => {
        if (!dialectId) {
            setErrorTags([]);
            return;
        }
        try {
            const response: any = await adminService.getErrorTags(dialectId);
            if (response && (response.status === 'success' || response.data)) {
                setErrorTags(response.data || response);
            } else {
                setErrorTags(Array.isArray(response) ? response : []);
            }
        } catch (error) {
            console.error('Error fetching error tags:', error);
            message.error('Không thể tải danh sách lỗi');
            setErrorTags([]);
        }
    };

    const sanitizeText = (val: string) => {
        if (typeof val !== 'string') return '';
        return val.replace(/[^a-zA-ZÀ-ỹà-ỹ0-9\s.,!?_'-]/g, '');
    };

    useEffect(() => {
        fetchLevels();
        fetchDialects();
    }, []);

    const handleCreateLevel = async (values: any) => {
        setCreating(true);
        try {
            await adminService.createLevel({
                dialectId: values.dialectId,
                levelOrder: values.levelOrder || 1,
                name: values.name,
                description: values.description || '',
                minStarsRequired: values.minStarsRequired ?? 3,
                errorTagId: values.errorTagId || null,
                difficultyLevel: values.difficultyLevel || null,
                aiThreshold: values.aiThreshold || 75,
            });
            message.success('Tạo chương học thành công');
            form.resetFields();
            setIsCreateModalOpen(false);
            fetchLevels();
        } catch (error: any) {
            console.error('Error creating level:', error);
            message.error(error?.message || 'Không thể tạo chương học');
        } finally {
            setCreating(false);
        }
    };

    const handleEditLevel = (record: any) => {
        setEditingLevel(record);
        setIsEditModalOpen(true);
        editForm.setFieldsValue({
            name: record.name,
            dialectId: record.dialectId || record.dialect?.id,
            levelOrder: record.levelOrder,
            minStarsRequired: record.minStarsRequired,
            aiThreshold: record.aiThreshold,
            difficultyLevel: record.difficultyLevel,
            errorTagId: record.errorTagId || (record.errorTag && typeof record.errorTag === 'object' ? record.errorTag.id : record.errorTag),
            description: record.description || '',
            comment: record.rejectionReason || '',
        });
        fetchErrorTags(record.dialectId || record.dialect?.id);
    };

    const handleUpdateLevel = async (values: any) => {
        if (!editingLevel?.id) return;
        setUpdating(true);
        try {
            await adminService.updateLevel(editingLevel.id, {
                name: values.name,
                description: values.description,
                dialectId: values.dialectId ?? editingLevel.dialectId ?? editingLevel.dialect?.id,
                levelOrder: values.levelOrder || editingLevel.levelOrder || 1,
                minStarsRequired: values.minStarsRequired ?? editingLevel.minStarsRequired ?? 3,
                errorTagId: values.errorTagId || (editingLevel.errorTag && typeof editingLevel.errorTag === 'object' ? editingLevel.errorTag.id : editingLevel.errorTag) || null,
                difficultyLevel: values.difficultyLevel || editingLevel.difficultyLevel || null,
                aiThreshold: values.aiThreshold || editingLevel.aiThreshold || 75,
                status: editingLevel.status || 'APPROVED',
                rejectionReason: editingLevel.rejectionReason ?? null,
                audioUrl: editingLevel.audioUrl ?? null,
                comment: values.comment,
            });
            message.success('Cập nhật chương học thành công');
            editForm.resetFields();
            setIsEditModalOpen(false);
            setEditingLevel(null);
            fetchLevels();
        } catch (error: any) {
            console.error('Error updating level:', error);
            message.error(error?.message || 'Không thể cập nhật chương học');
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteLevel = async (levelId: string) => {
        try {
            await adminService.deleteLevel(levelId);
            message.success('Xóa chương học thành công');
            fetchLevels();
        } catch (error: any) {
            console.error('Error deleting level:', error);
            message.error(error?.response?.data?.message || 'Không thể xóa chương học');
        }
    };

    const handleCreateQuiz = async (values: any) => {
        if (!selectedLevelForQuiz?.id) return;
        setCreatingQuiz(true);
        try {
            const readingCount = Number(values.readingCount || 0);
            const listeningCount = Number(values.listeningCount || 0);
            const speakingCount = Number(values.speakingCount || 0);
            const writingCount = Number(values.writingCount || 0);
            const questionCount = readingCount + listeningCount + speakingCount + writingCount;
            if (questionCount <= 0) {
                message.error('Vui lòng nhập số câu cho ít nhất một kỹ năng');
                setCreatingQuiz(false);
                return;
            }

            const buildQuestions = (skillType: string, count: number) => {
                if (count <= 0) return [];
                return Array.from({ length: count }, (_, index) => ({
                    skillType,
                    questionOrder: index + 1,
                    points: values.pointsPerQuestion,
                    challengeId: undefined,
                }));
            };

            const questions = [
                ...buildQuestions('READING', readingCount),
                ...buildQuestions('LISTENING', listeningCount),
                ...buildQuestions('SPEAKING', speakingCount),
                ...buildQuestions('WRITING', writingCount),
            ].map((question, index) => ({
                ...question,
                questionOrder: index + 1,
            }));

            await adminService.createQuiz({
                levelId: selectedLevelForQuiz.id,
                title: values.title,
                description: values.description,
                instructions: values.instructions,
                passingScore: 80,
                timeLimitSeconds: questionCount * (values.secondsPerQuestion || 90),
                questionCount,
                comment: values.comment,
                questions,
            });
            message.success('Tạo quiz thành công');
            quizForm.resetFields();
            setIsCreateQuizModalOpen(false);
            setSelectedLevelForQuiz(null);
        } catch (error: any) {
            console.error('Error creating quiz:', error);
            message.error(error?.message || 'Không thể tạo quiz');
        } finally {
            setCreatingQuiz(false);
        }
    };

    const loadAssignLevels = async () => {
        setAssigning(true);
        try {
            const response: any = await adminService.getLevelsForSelection();
            const list = response?.data || response || [];
            setAssignLevels(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error('Error loading levels for assignment:', error);
            message.error('Không thể tải danh sách chương học để gán');
            setAssignLevels([]);
        } finally {
            setAssigning(false);
        }
    };

    const handleOpenAssignModal = () => {
        setIsAssignModalOpen(true);
        assignmentForm.resetFields();
        assignmentForm.setFieldsValue({
            classroomId: fromClassroomId,
            status: 'OPEN',
            dueDate: dayjs().add(1, 'day'),
        });
        loadAssignLevels();
    };

    const handleCreateAssignment = async (values: any) => {
        try {
            setAssigning(true);
            await adminService.createAssignment({
                classroomId: values.classroomId,
                learningUnitId: values.learningUnitId,
                dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
                status: values.status || 'OPEN',
                description: values.description,
            });
            message.success('Gán chương học thành công');
            setIsAssignModalOpen(false);
            assignmentForm.resetFields();
        } catch (error: any) {
            console.error('Error creating assignment:', error);
            message.error(error?.message || 'Không thể gán chương học');
        } finally {
            setAssigning(false);
        }
    };

    const handleRemoveAssignment = async (assignmentId: string) => {
        if (!assignmentId) {
            message.error('Không tìm thấy ID assignment');
            return;
        }
        try {
            await adminService.deleteAssignment(assignmentId);
            message.success('Đã gỡ chương học khỏi lớp');
            setRemovedAssignmentIds(prev => [...prev, assignmentId]);
        } catch (error: any) {
            console.error('Error deleting assignment:', error);
            message.error(error?.response?.data?.message || error?.message || 'Không thể gỡ chương học');
        }
    };

    // --- Helper to resolve region key from dialectId ---
    const getRegionKey = (dialectId: string) => {
        const dialect = dialects.find((item) => item.id === dialectId);
        const name = (dialect?.name || '').toUpperCase();
        if (name.includes('BẮC')) return 'NORTH';
        if (name.includes('TRUNG')) return 'CENTRAL';
        if (name.includes('NAM')) return 'SOUTH';
        return name || 'NORTH';
    };

    const fetchedAssignments = (location.state as any)?.fetchedAssignments as any[] | undefined;
    const fromClassroomName = (location.state as any)?.fromClassroomName as string | undefined;
    const fromClassroomId = (location.state as any)?.fromClassroomId as string | undefined;

    const mergedLevels = useMemo(() => {
        if (!fetchedAssignments || fetchedAssignments.length === 0) return levels;

        const mappedFromAssignments = fetchedAssignments.map((item: any) => {
            let meta: any = {};
            if (item.metadataJson) {
                try {
                    meta = typeof item.metadataJson === 'string' ? JSON.parse(item.metadataJson) : item.metadataJson;
                } catch (e) { /* ignore */ }
            }

            return {
                id: item.levelId || item.id,
                name: item.levelName || 'Không có tên chương',
                dialectId: item.dialectId,
                description: meta.description || item.description || '',
                levelOrder: meta.level_order ?? item.levelOrder ?? null,
                minStarsRequired: meta.min_stars_required ?? item.minStarsRequired ?? null,
                aiThreshold: meta.ai_threshold ?? item.aiThreshold ?? null,
                difficultyLevel: meta.difficulty_level ?? item.difficultyLevel ?? null,
                errorTag: meta.error_tag ?? item.errorTag ?? null,
                errorTagId: meta.error_tag_id ?? item.errorTagId ?? (item.errorTag && typeof item.errorTag === 'object' ? item.errorTag.id : item.errorTag) ?? null,
                status: meta.status || item.status || 'APPROVED',
                createdAt: item.createdAt,
                dueDate: item.dueDate,
                _fromAssignment: true,
                _assignmentId: item.id,
            };
        });

        return mappedFromAssignments.filter((item: any) => !removedAssignmentIds.includes(item._assignmentId));
    }, [levels, fetchedAssignments, removedAssignmentIds]);

    // --- Filtered & Sorted data ---
    const filteredLevels = useMemo(() => {
        let data = [...mergedLevels];
        if (searchText.trim()) {
            const lower = searchText.trim().toLowerCase();
            data = data.filter((item) =>
                (item.name || '').toLowerCase().includes(lower)
            );
        }
        if (filterRegion) {
            data = data.filter((item) => {
                const regionKey = getRegionKey(item.dialectId);
                return regionKey === filterRegion;
            });
        }
        return data;
    }, [mergedLevels, searchText, filterRegion, dialects]);

    const activeFilterCount = [searchText.trim(), filterRegion].filter(Boolean).length;

    const handleResetFilters = () => {
        setSearchText('');
        setFilterRegion(undefined);
    };

    // ============ IMPORT / EXPORT ============
    const downloadLevelsTemplateExcel = async () => {
        if (templateDownloadInFlight.current) return;
        templateDownloadInFlight.current = true;
        setTemplateDownloading(true);
        try {
            message.loading({ content: 'Đang tải template...', key: 'tpl' });
            const blob = await adminExcelService.downloadLevelsTemplate();
            downloadBlob(blob, 'template_levels.xlsx');
            message.success({ content: 'Đã tải template mẫu', key: 'tpl' });
        } catch (err) {
            console.error('[Levels Excel] Template error:', err);
            message.error({ content: 'Không thể tải template', key: 'tpl' });
        } finally {
            templateDownloadInFlight.current = false;
            setTemplateDownloading(false);
        }
    };

    const handleImportExcel = async () => {
        if (!importFile) { message.warning('Vui lòng chọn file Excel'); return; }
        setImporting(true);
        setImportResult(null);
        try {
            const res: any = await adminExcelService.importLevels(importFile);
            const data = res?.data || res;
            setImportResult({
                success: data?.successCount ?? 0,
                failed: data?.errorCount ?? 0,
                errors: data?.messages || [],
            });
            if ((data?.successCount ?? 0) > 0) {
                message.success(`Import thành công ${data.successCount} chương học`);
                fetchLevels();
            } else {
                message.info('Import hoàn tất');
            }
            if ((data?.errorCount ?? 0) > 0) message.warning(`${data.errorCount} dòng bị lỗi`);
        } catch (err: any) {
            console.error('[Levels Excel] Import error:', err);
            message.error(err?.response?.data?.message || err?.message || 'Lỗi khi import');
        } finally {
            setImporting(false);
        }
    };

    const handleExportExcel = async () => {
        try {
            message.loading({ content: 'Đang export...', key: 'exp' });
            const blob = await adminExcelService.exportLevels();
            downloadBlob(blob, `levels_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
            message.success({ content: 'Export thành công!', key: 'exp' });
        } catch (err) {
            console.error('[Levels Excel] Export error:', err);
            message.error({ content: 'Không thể export', key: 'exp' });
        }
    };

    return (
        <div className="min-h-screen bg-[#fbf6ef] font-nunito pb-10">
            {/* Header / Actions Row */}
            <div className="flex flex-col gap-6 p-8">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-[#49B6E5] rounded-full shadow-[2px_2px_0_#1f293705]" />
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Quản lý Chương học</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Nội dung học tập theo vùng miền</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={downloadLevelsTemplateExcel}
                            className="flex items-center gap-2 px-5 py-3 bg-white border-[2.5px] border-slate-900 rounded-2xl shadow-[4px_4px_0_#1f2937] text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all"
                        >
                            <Download size={16} strokeWidth={3} />
                            Template
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { setImportResult(null); setImportFile(null); setIsImportModalOpen(true); }}
                            className="flex items-center gap-2 px-5 py-3 bg-white border-[2.5px] border-slate-900 rounded-2xl shadow-[4px_4px_0_#1f2937] text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
                        >
                            <Upload size={16} strokeWidth={3} />
                            Import
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleExportExcel}
                            className="flex items-center gap-2 px-5 py-3 bg-white border-[2.5px] border-slate-900 rounded-2xl shadow-[4px_4px_0_#1f2937] text-xs font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 transition-all"
                        >
                            <FileSpreadsheet size={16} strokeWidth={3} />
                            Export
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-[#49B6E5] border-[2.5px] border-slate-900 rounded-2xl shadow-[5px_5px_0_#1f2937] text-xs font-black uppercase tracking-widest text-white transition-all flex-shrink-0"
                        >
                            <Plus size={18} strokeWidth={4} />
                            Thêm chương
                        </motion.button>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex items-center gap-4 bg-white p-4 rounded-[2rem] border-[3px] border-slate-900 shadow-[4px_4px_0_#1f293705] flex-wrap">
                    <div className="relative flex-1 min-w-[280px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} strokeWidth={3} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm chương học..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 bg-white border-[2.5px] border-slate-900/10 rounded-2xl focus:border-[#49B6E5] focus:outline-none text-sm font-black uppercase tracking-wider transition-all placeholder:text-slate-300"
                        />
                    </div>

                    <div className="relative w-48">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} strokeWidth={3} />
                        <select
                            value={filterRegion || ''}
                            onChange={(e) => setFilterRegion(e.target.value || undefined)}
                            className="w-full h-12 pl-12 pr-4 bg-white border-[2.5px] border-slate-900/10 rounded-2xl focus:border-[#49B6E5] appearance-none focus:outline-none text-sm font-black uppercase tracking-widest transition-all cursor-pointer"
                        >
                            <option value="">Tất cả vùng</option>
                            <option value="NORTH">Miền Bắc</option>
                            <option value="CENTRAL">Miền Trung</option>
                            <option value="SOUTH">Miền Nam</option>
                        </select>
                    </div>

                    {activeFilterCount > 0 && (
                        <motion.button
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            onClick={handleResetFilters}
                            className="h-12 px-6 bg-slate-100 border-[2px] border-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-colors"
                        >
                            Xóa lọc
                        </motion.button>
                    )}

                    <div className="ml-auto flex items-center gap-3 px-4">
                        <LayoutGrid size={18} className="text-[#49B6E5]" strokeWidth={3} />
                        <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                            {filteredLevels.length} / {mergedLevels.length} chương
                        </span>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="px-8 space-y-12">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="w-16 h-16 rounded-[1.5rem] bg-white border-[3px] border-slate-900 shadow-[6px_6px_0_#49B6E5] flex items-center justify-center mb-6"
                        >
                            <Zap className="text-[#49B6E5]" size={32} fill="#49B6E5" fillOpacity={0.2} />
                        </motion.div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Đang đồng bộ dữ liệu...</p>
                    </div>
                ) : filteredLevels.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-white/40 border-[3px] border-dashed border-slate-900/10 rounded-[3rem]">
                        <Empty description={<span className="font-black uppercase tracking-widest text-slate-400">Không tìm thấy bản ghi nào</span>} />
                    </div>
                ) : (
                    (() => {
                        const grouped: Record<string, any[]> = {};
                        filteredLevels.forEach(level => {
                            const key = getRegionKey(level.dialectId) || 'OTHER';
                            if (!grouped[key]) grouped[key] = [];
                            grouped[key].push(level);
                        });
                        const regionOrder = ['NORTH', 'CENTRAL', 'SOUTH'];
                        const existingRegions = regionOrder.filter(r => grouped[r]);

                        return (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                {existingRegions.map(regionKey => {
                                    const info = REGION_LABEL[regionKey] || { label: 'Khác', color: '#475569', bg: '#f8fafc', iconBg: 'bg-slate-100' };
                                    const allCards = grouped[regionKey] || [];
                                    const pageSize = 3;
                                    const page = regionPages[regionKey] || 1;
                                    const pagedCards = allCards.slice((page - 1) * pageSize, page * pageSize);

                                    return (
                                        <div key={regionKey} className="flex flex-col gap-6">
                                            <div className="flex items-center justify-between px-2">
                                                <div className="flex items-center gap-3">
                                                    <div className={clsx("w-2 h-6 rounded-full", idxToBgColor(regionKey))} />
                                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{info.label}</h3>
                                                </div>
                                                <Badge count={allCards.length} showZero style={{ backgroundColor: '#1f2937', color: '#fff', fontWeight: '900' }} />
                                            </div>

                                            <div className="space-y-6">
                                                {pagedCards.map((level, idx) => {
                                                    const globalIdx = (page - 1) * pageSize + idx + 1;
                                                    return (
                                                        <motion.div
                                                            key={level.id}
                                                            whileHover={{ y: -5, scale: 1.02 }}
                                                            className="group relative"
                                                        >
                                                            <div
                                                                onClick={() => navigate(`/admin/quizzes/${level.id}`)}
                                                                className={clsx(
                                                                    "relative flex flex-col p-6 bg-white border-[3px] border-slate-900 rounded-[2rem] shadow-[6px_6px_0_#1f2937] transition-all cursor-pointer overflow-hidden z-10",
                                                                    "hover:shadow-[10px_10px_0_#1f2937]"
                                                                )}
                                                            >
                                                                <div className="flex items-start justify-between gap-4 mb-4">
                                                                    <div className={clsx("w-12 h-12 rounded-2xl border-[2.5px] border-slate-900 shadow-[3px_3px_0_#1f2937] flex items-center justify-center text-slate-900 font-black transition-transform group-hover:rotate-6", info.iconBg)}>
                                                                        {globalIdx}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Tooltip title="Chỉnh sửa">
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); handleEditLevel(level); }}
                                                                                className="p-2 hover:bg-slate-50 rounded-xl transition-colors border-[2px] border-transparent hover:border-slate-900/10 text-slate-400 hover:text-slate-900"
                                                                            >
                                                                                <Edit3 size={18} strokeWidth={3} />
                                                                            </button>
                                                                        </Tooltip>
                                                                        <Popconfirm
                                                                            title="Xác nhận xóa?"
                                                                            onConfirm={(e) => { e?.stopPropagation(); handleDeleteLevel(level.id); }}
                                                                            onCancel={(e) => e?.stopPropagation()}
                                                                            okText="Xóa"
                                                                            cancelText="Hủy"
                                                                        >
                                                                            <button
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                className="p-2 hover:bg-red-50 rounded-xl transition-colors border-[2px] border-transparent hover:border-red-500/10 text-slate-400 hover:text-red-500"
                                                                            >
                                                                                <Trash2 size={18} strokeWidth={3} />
                                                                            </button>
                                                                        </Popconfirm>
                                                                    </div>
                                                                </div>

                                                                <div className="mb-2">
                                                                    <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight group-hover:text-[#49B6E5] transition-colors line-clamp-1">{level.name}</h4>
                                                                    <p className="text-xs font-bold text-slate-400 mt-1 line-clamp-2 h-8 leading-relaxed">
                                                                        {level.description || 'Nội dung học tập tiếng Việt đặc thù theo từng địa phương.'}
                                                                    </p>
                                                                </div>

                                                                <div className="mt-4 pt-4 border-t-[2px] border-slate-900/5 flex flex-col gap-3">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        {level.difficultyLevel && (
                                                                            <div className="px-2 py-1 rounded-md bg-[#49B6E5]/10 text-[#49B6E5] text-[9px] font-black uppercase tracking-widest border border-[#49B6E5]/20">
                                                                                {level.difficultyLevel === 'BEGINNER' ? 'Cơ bản' : level.difficultyLevel === 'INTERMEDIATE' ? 'Trung bình' : 'Nâng cao'}
                                                                            </div>
                                                                        )}
                                                                        {level.errorTag && (
                                                                            <div className="px-2 py-1 rounded-md bg-purple-500/10 text-purple-600 text-[9px] font-black uppercase tracking-widest border border-purple-500/20">
                                                                                {typeof level.errorTag === 'object' ? level.errorTag.name : level.errorTag}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[9px] font-black uppercase text-slate-500">
                                                                            Mã: {level.id.slice(0, 8)}
                                                                        </div>
                                                                        <div className="flex items-center gap-1 text-[#49B6E5] font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            Chi tiết <ChevronRight size={14} strokeWidth={4} />
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Decorative pattern */}
                                                                <div className="absolute -bottom-4 -right-4 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform">
                                                                    <Zap size={100} strokeWidth={3} />
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>

                                            {allCards.length > pageSize && (
                                                <div className="flex justify-center mt-4">
                                                    <Pagination
                                                        size="small"
                                                        current={page}
                                                        total={allCards.length}
                                                        pageSize={pageSize}
                                                        onChange={(newPage) => setRegionPages(prev => ({ ...prev, [regionKey]: newPage }))}
                                                        hideOnSinglePage
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()
                )}
            </div>

            {/* Modals */}
            <Modal
                title={<div className="text-lg font-black uppercase tracking-tight text-slate-900">Tạo chương học mới</div>}
                open={isCreateModalOpen}
                onCancel={() => { form.resetFields(); setIsCreateModalOpen(false); }}
                onOk={() => form.submit()}
                confirmLoading={creating}
                centered
                width={500}
                className="doodle-modal"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateLevel}
                    initialValues={{ aiThreshold: 75, minStarsRequired: 3 }}
                    className="mt-6"
                >
                    <Form.Item
                        label={<span className="text-xs font-black uppercase text-slate-500 tracking-widest">Tên chương</span>}
                        name="name"
                        rules={[{ required: true, message: 'Vui lòng nhập tên chương' }]}
                    >
                        <Input className="doodle-input" placeholder="Ví dụ: Level 1" />
                    </Form.Item>

                    <Form.Item
                        label={<span className="text-xs font-black uppercase text-slate-500 tracking-widest">Phương ngữ</span>}
                        name="dialectId"
                        rules={[{ required: true, message: 'Vui lòng chọn phương ngữ' }]}
                    >
                        <Select
                            placeholder="Chọn vùng miền"
                            className="doodle-select"
                            onChange={(val) => fetchErrorTags(val)}
                            options={dialects.map((dialect: any) => {
                                const regionKey = (dialect.name || '').toUpperCase();
                                const info = REGION_LABEL[regionKey];
                                return {
                                    value: dialect.id,
                                    label: dialect.description || info?.label || dialect.name,
                                };
                            })}
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span className="text-xs font-black uppercase text-slate-500 tracking-widest">Độ khó</span>}
                        name="difficultyLevel"
                        rules={[{ required: true, message: 'Vui lòng chọn độ khó' }]}
                    >
                        <Select
                            placeholder="Chọn độ khó"
                            className="doodle-select"
                            options={[
                                { value: 'BEGINNER', label: 'Cơ bản (Beginner)' },
                                { value: 'INTERMEDIATE', label: 'Trung bình (Intermediate)' },
                                { value: 'ADVANCED', label: 'Nâng cao (Advanced)' }
                            ]}
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span className="text-xs font-black uppercase text-slate-500 tracking-widest">Loại lỗi (Error Tag)</span>}
                        name="errorTagId"
                        rules={[{ required: true, message: 'Vui lòng chọn loại lỗi' }]}
                    >
                        <Select
                            placeholder="Chọn loại lỗi"
                            className="doodle-select"
                            options={errorTags.map((tag: any) => ({
                                value: tag.id,
                                label: tag.name
                            }))}
                            disabled={errorTags.length === 0}
                        />
                    </Form.Item>

                    <Form.Item label={<span className="text-xs font-black uppercase text-slate-500 tracking-widest">Mô tả</span>} name="description">
                        <Input.TextArea rows={3} className="doodle-input" placeholder="Thông tin về chương học..." />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={<div className="text-lg font-black uppercase tracking-tight text-slate-900">Cập nhật chương học</div>}
                open={isEditModalOpen}
                onCancel={() => { editForm.resetFields(); setIsEditModalOpen(false); }}
                onOk={() => editForm.submit()}
                confirmLoading={updating}
                centered
                width={500}
                className="doodle-modal"
            >
                <Form
                    form={editForm}
                    layout="vertical"
                    onFinish={handleUpdateLevel}
                    className="mt-6"
                >
                    <Form.Item
                        label={<span className="text-xs font-black uppercase text-slate-500 tracking-widest">Tên chương</span>}
                        name="name"
                        rules={[{ required: true, message: 'Nhập tên chương' }]}
                    >
                        <Input className="doodle-input" />
                    </Form.Item>

                    <Form.Item
                        label={<span className="text-xs font-black uppercase text-slate-500 tracking-widest">Phương ngữ</span>}
                        name="dialectId"
                    >
                        <Select
                            placeholder="Chọn vùng miền"
                            className="doodle-select"
                            onChange={(val) => { fetchErrorTags(val); editForm.setFieldValue('errorTagId', undefined); }}
                            options={dialects.map((dialect: any) => {
                                const regionKey = (dialect.name || '').toUpperCase();
                                const info = REGION_LABEL[regionKey];
                                return {
                                    value: dialect.id,
                                    label: dialect.description || info?.label || dialect.name,
                                };
                            })}
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span className="text-xs font-black uppercase text-slate-500 tracking-widest">Độ khó</span>}
                        name="difficultyLevel"
                        rules={[{ required: true, message: 'Vui lòng chọn độ khó' }]}
                    >
                        <Select
                            placeholder="Chọn độ khó"
                            className="doodle-select"
                            options={[
                                { value: 'BEGINNER', label: 'Cơ bản (Beginner)' },
                                { value: 'INTERMEDIATE', label: 'Trung bình (Intermediate)' },
                                { value: 'ADVANCED', label: 'Nâng cao (Advanced)' }
                            ]}
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span className="text-xs font-black uppercase text-slate-500 tracking-widest">Loại lỗi (Error Tag)</span>}
                        name="errorTagId"
                        rules={[{ required: true, message: 'Vui lòng chọn loại lỗi' }]}
                    >
                        <Select
                            placeholder="Chọn loại lỗi"
                            className="doodle-select"
                            options={errorTags.map((tag: any) => ({
                                value: tag.id,
                                label: tag.name
                            }))}
                            disabled={errorTags.length === 0}
                        />
                    </Form.Item>

                    <Form.Item label={<span className="text-xs font-black uppercase text-slate-500 tracking-widest">Mô tả</span>} name="description">
                        <Input.TextArea rows={3} className="doodle-input" />
                    </Form.Item>

                    <Form.Item
                        label={<span className="text-xs font-black uppercase text-slate-500 tracking-widest">Ghi chú</span>}
                        name="comment"
                        rules={[{ required: true, message: 'Vui lòng cung cấp lý do thay đổi' }]}
                    >
                        <Input.TextArea rows={2} className="doodle-input" placeholder="Nội dung cập nhật..." />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={
                    <div className="flex items-center gap-3 text-slate-900 font-black uppercase tracking-tight">
                        <Rocket size={24} className="text-[#49B6E5]" strokeWidth={3} />
                        Import chương học
                    </div>
                }
                open={isImportModalOpen}
                onCancel={() => { setIsImportModalOpen(false); setImportFile(null); setImportResult(null); }}
                footer={null}
                centered
                width={540}
                className="doodle-modal"
            >
                <div className="flex flex-col gap-6 py-4">
                    <div className="bg-[#f0f9ff] p-4 rounded-2xl border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f293705]">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-black uppercase tracking-widest text-[#49B6E5]">1. Mẫu Excel</span>
                            <button onClick={downloadLevelsTemplateExcel} className="text-[10px] font-black uppercase underline text-slate-400 hover:text-[#49B6E5]">Tải mẫu</button>
                        </div>
                        <p className="text-[11px] font-bold text-slate-500">Vui lòng sử dụng đúng định dạng tệp mẫu để tránh lỗi hệ thống.</p>
                    </div>

                    <div className="space-y-3">
                        <span className="text-xs font-black uppercase text-slate-500 tracking-widest ml-1">2. Chọn tệp</span>
                        <div className={clsx(
                            "relative border-[3px] border-dashed rounded-[2rem] p-10 text-center transition-all group",
                            importFile ? "bg-emerald-50 border-emerald-400" : "bg-slate-50 border-slate-900/10 hover:border-[#49B6E5]"
                        )}>
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="flex flex-col items-center gap-3">
                                <FileSpreadsheet size={40} className={importFile ? 'text-emerald-500' : 'text-slate-300'} strokeWidth={3} />
                                <span className={clsx("text-xs font-black uppercase tracking-widest", importFile ? "text-emerald-700" : "text-slate-400")}>
                                    {importFile ? importFile.name : 'Nhấn để chọn tệp'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {importResult && (
                        <div className={clsx("p-4 rounded-2xl border-[2px]", importResult.failed > 0 ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200")}>
                            <div className="text-[11px] font-black uppercase tracking-widest mb-1">Kết quả import</div>
                            <div className="text-[10px] font-bold text-slate-600">Thành công: {importResult.success} | Lỗi: {importResult.failed}</div>
                        </div>
                    )}

                    <motion.button
                        whileHover={importFile ? { scale: 1.02 } : {}}
                        whileTap={importFile ? { scale: 0.98 } : {}}
                        onClick={handleImportExcel}
                        disabled={!importFile || importing}
                        className={clsx(
                            "w-full h-14 rounded-2xl border-[3px] border-slate-900 shadow-[4px_4px_0_#1f2937] text-sm font-black uppercase tracking-widest transition-all",
                            importFile ? "bg-[#49B6E5] text-white" : "bg-slate-100 text-slate-300 border-none shadow-none"
                        )}
                    >
                        {importing ? "Đang xử lý..." : "Xác nhận & Tải lên"}
                    </motion.button>
                </div>
            </Modal>

            <style dangerouslySetInnerHTML={{
                __html: `
                .doodle-input {
                    height: 50px; border: 2.5px solid #1f293720 !important; border-radius: 1rem !important;
                    font-family: 'Nunito', sans-serif !important; font-weight: 700 !important;
                }
                .doodle-input:focus { border-color: #49B6E5 !important; }
                
                .doodle-select .ant-select-selector {
                    height: 50px !important; border: 2.5px solid #1f293720 !important; border-radius: 1rem !important;
                    display: flex !important; align-items: center !important;
                }
                
                .doodle-modal .ant-modal-content {
                    border: 4px solid #1f2937 !important; border-radius: 2.5rem !important;
                    box-shadow: 12px 12px 0 #1f2937 !important; background: #fbf6ef !important;
                }
                .doodle-modal .ant-modal-header { background: transparent !important; border: none !important; }
                .doodle-modal .ant-btn-primary { 
                    background: #49B6E5 !important; height: 48px !important; border: 3px solid #1f2937 !important;
                    border-radius: 1rem !important; font-weight: 900 !important; text-transform: uppercase !important;
                    box-shadow: 4px 4px 0 #1f2937 !important;
                }
                .doodle-modal .ant-btn-default { height: 48px !important; border-radius: 1rem !important; font-weight: 900 !important; text-transform: uppercase !important; border: 2px solid #1f293720 !important; }
            `}} />
        </div >
    );
};

const idxToBgColor = (region: string) => {
    switch (region) {
        case 'NORTH': return 'bg-[#49B6E5]';
        case 'CENTRAL': return 'bg-orange-400';
        case 'SOUTH': return 'bg-emerald-500';
        default: return 'bg-slate-400';
    }
}

export default AdminChapterManagementPage;
