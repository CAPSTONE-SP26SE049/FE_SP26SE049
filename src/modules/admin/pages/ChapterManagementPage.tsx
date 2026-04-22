import React, { useEffect, useState, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import { useLocation, useNavigate } from 'react-router-dom';
import { message, Tag, Form, Input, InputNumber, Select, Button, Modal, Tooltip, Space, Badge, Row, Col, DatePicker, Popconfirm, Drawer, Descriptions, Divider, Spin, Empty, Pagination } from 'antd';
import { PlusOutlined, EditOutlined, SearchOutlined, FilterOutlined, ClearOutlined, SortAscendingOutlined, DownloadOutlined, UploadOutlined, FileExcelOutlined, DeleteOutlined, InfoCircleOutlined, WarningOutlined, CheckCircleOutlined, RocketOutlined } from '@ant-design/icons';
import { adminService } from '../services/adminService';
import { adminExcelService } from '../services/adminExcelService';
import { downloadBlob } from '../../educator/services/excelService';

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

    const REGION_LABEL: Record<string, { label: string; color: string; bg: string }> = {
        NORTH: { label: 'Miền Bắc', color: '#1d4ed8', bg: '#dbeafe' },
        SOUTH: { label: 'Miền Nam', color: '#15803d', bg: '#dcfce7' },
        CENTRAL: { label: 'Miền Trung', color: '#b45309', bg: '#fef3c7' },
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
            message.success('Xóa chương học (tạm) thành công');
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
            // Parse metadataJson if available
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

        // Search by name
        if (searchText.trim()) {
            const lower = searchText.trim().toLowerCase();
            data = data.filter((item) =>
                (item.name || '').toLowerCase().includes(lower)
            );
        }

        // Filter by region
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
    /** GET /api/v1/admin/excel/levels/template — một hàm duy nhất, không dùng file tĩnh */
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
        <div style={{ padding: '24px' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flex: 1 }}>
                    {fromClassroomName && (
                        <div style={{ color: '#64748b', fontSize: 14 }}>
                            Đang xem chương đã gán cho lớp: <strong>{fromClassroomName}</strong>
                        </div>
                    )}
                    <Input
                        prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                        placeholder="Tìm kiếm theo tên chương học..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        allowClear
                        style={{ borderRadius: 8, height: 40, width: 280 }}
                    />
                    <Select
                        placeholder="Lọc theo vùng"
                        value={filterRegion}
                        onChange={(val) => setFilterRegion(val)}
                        allowClear
                        style={{ width: 160, borderRadius: 8, height: 40 }}
                        suffixIcon={<FilterOutlined style={{ color: '#64748b' }} />}
                    >
                        <Select.Option value="NORTH">Miền Bắc</Select.Option>
                        <Select.Option value="CENTRAL">Miền Trung</Select.Option>
                        <Select.Option value="SOUTH">Miền Nam</Select.Option>
                    </Select>
                    {activeFilterCount > 0 && (
                        <Button
                            icon={<ClearOutlined />}
                            onClick={handleResetFilters}
                            style={{ borderRadius: 8, height: 40, borderColor: '#e2e8f0' }}
                        >
                            Xóa bộ lọc
                        </Button>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
                        {activeFilterCount > 0 ? (
                            <Badge
                                count={activeFilterCount}
                                style={{
                                    backgroundColor: '#2563eb',
                                    fontSize: 11,
                                    height: 20,
                                    lineHeight: '20px',
                                    borderRadius: 10,
                                    padding: '0 7px',
                                }}
                            />
                        ) : null}
                        <span style={{ color: '#94a3b8', fontSize: 13 }}>
                            {filteredLevels.length}/{mergedLevels.length} chương
                        </span>
                        <Tooltip title="Nhấn vào tiêu đề cột để sắp xếp">
                            <SortAscendingOutlined style={{ color: '#94a3b8', fontSize: 16, cursor: 'help' }} />
                        </Tooltip>
                    </div>
                </div>
                <Space>
                    <Button
                        htmlType="button"
                        icon={<DownloadOutlined />}
                        loading={templateDownloading}
                        onClick={downloadLevelsTemplateExcel}
                        style={{
                            height: '44px',
                            borderRadius: '10px',
                            fontWeight: 600,
                            paddingInline: 16,
                        }}
                    >
                        Template
                    </Button>
                    <Button
                        icon={<UploadOutlined />}
                        onClick={() => { setImportResult(null); setImportFile(null); setIsImportModalOpen(true); }}
                        style={{
                            height: '44px',
                            borderRadius: '10px',
                            fontWeight: 600,
                            paddingInline: 16,
                        }}
                    >
                        Import
                    </Button>
                    <Button
                        icon={<FileExcelOutlined />}
                        onClick={handleExportExcel}
                        style={{
                            height: '44px',
                            borderRadius: '10px',
                            fontWeight: 600,
                            paddingInline: 16,
                        }}
                    >
                        Export
                    </Button>
                    {fromClassroomId ? (
                        <Button
                            type="primary"
                            onClick={handleOpenAssignModal}
                            loading={assigning}
                            style={{
                                height: '40px',
                                borderRadius: '10px',
                                background: 'linear-gradient(90deg, #059669 0%, #10b981 100%)',
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(16,185,129,0.2)'
                            }}
                        >
                            Gán chương vào lớp
                        </Button>
                    ) : null}
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsCreateModalOpen(true)}
                        style={{
                            height: '44px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #9333ea, #7e22ce)',
                            border: 'none',
                            fontWeight: 600,
                            paddingInline: 20,
                            boxShadow: '0 4px 12px rgba(24,144,255,0.3)'
                        }}
                    >
                        Thêm chương học
                    </Button>
                </Space>
            </div>



            <Modal
                title={<span style={{ fontWeight: 600 }}>Tạo chương học mới</span>}
                open={isCreateModalOpen}
                onCancel={() => {
                    form.resetFields();
                    setIsCreateModalOpen(false);
                }}
                onOk={() => form.submit()}
                confirmLoading={creating}
                okText="Xác nhận"
                okButtonProps={{
                    style: { background: 'linear-gradient(135deg, #9333ea, #7e22ce)', border: 'none', borderRadius: '8px', height: 40, fontWeight: 600, paddingInline: 24, boxShadow: '0 4px 12px rgba(147,51,234,0.25)' }
                }}
                cancelText="Hủy bỏ"
                cancelButtonProps={{ style: { borderRadius: 8, height: 40 } }}
                centered
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateLevel}
                    initialValues={{ aiThreshold: 75, minStarsRequired: 3 }}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                        <Form.Item
                            label="Tên chương học"
                            name="name"
                            rules={[{ required: true, message: 'Vui lòng nhập tên chương học' }]}
                        >
                            <Input
                                placeholder="Ví dụ: Level 1"
                                maxLength={50}
                                onChange={(e) => form.setFieldsValue({ name: sanitizeText(e.target.value) })}
                            />
                        </Form.Item>
                        <Form.Item
                            label="Phương ngữ"
                            name="dialectId"
                            rules={[{ required: true, message: 'Vui lòng chọn phương ngữ' }]}
                        >
                            <Select
                                placeholder="Chọn phương ngữ"
                                options={dialects.map((dialect: any) => {
                                    const regionKey = (dialect.name || '').toUpperCase();
                                    const info = REGION_LABEL[regionKey];
                                    return {
                                        value: dialect.id,
                                        label: dialect.description || info?.label || dialect.name || dialect.code || dialect.id,
                                    };
                                })}
                            />
                        </Form.Item>
                        <Form.Item
                            label="Thứ tự chương học"
                            name="levelOrder"
                            hidden
                        >
                            <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item label="Ngưỡng AI" name="aiThreshold" hidden>
                            <InputNumber min={0} max={100} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item label="Error Tag ID" name="errorTagId" hidden>
                            <Input placeholder="ID error tag (nếu có)" />
                        </Form.Item>
                    </div>
                    <Form.Item label="Mô tả" name="description">
                        <Input.TextArea
                            rows={3}
                            placeholder="Mô tả chương học"
                            maxLength={100}
                            showCount
                        />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={<span style={{ fontWeight: 600 }}>Gán chương học vào lớp</span>}
                open={isAssignModalOpen}
                onCancel={() => {
                    assignmentForm.resetFields();
                    setIsAssignModalOpen(false);
                }}
                onOk={() => assignmentForm.submit()}
                confirmLoading={assigning}
                okText="Gán chương"
                okButtonProps={{
                    style: { background: 'linear-gradient(90deg, #059669 0%, #10b981 100%)', border: 'none', borderRadius: '8px', height: 40, fontWeight: 600, paddingInline: 24, boxShadow: '0 4px 12px rgba(16,185,129,0.25)' }
                }}
                cancelText="Hủy"
                cancelButtonProps={{ style: { borderRadius: 8, height: 40 } }}
                centered
            >
                <Form
                    form={assignmentForm}
                    layout="vertical"
                    onFinish={handleCreateAssignment}
                >
                    <Form.Item name="classroomId" hidden>
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label="Chọn chương học hiện có"
                        name="learningUnitId"
                        rules={[{ required: true, message: 'Vui lòng chọn chương học' }]}
                    >
                        <Select
                            loading={assigning}
                            placeholder="Chọn chương học để gán"
                            showSearch
                            optionFilterProp="label"
                            options={assignLevels.map((item: any) => ({
                                value: item.id,
                                label: item.name || item.levelName || item.id,
                            }))}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Hạn nộp"
                        name="dueDate"
                        rules={[{ required: true, message: 'Vui lòng chọn hạn nộp' }]}
                    >
                        <DatePicker
                            style={{ width: '100%' }}
                            showTime
                            format="DD/MM/YYYY HH:mm"
                        />
                    </Form.Item>

                    <Form.Item label="Trạng thái" name="status" initialValue="OPEN">
                        <Select
                            options={[
                                { value: 'OPEN', label: 'OPEN' },
                                { value: 'CLOSED', label: 'CLOSED' },
                            ]}
                        />
                    </Form.Item>

                    <Form.Item label="Mô tả" name="description">
                        <Input.TextArea rows={3} placeholder="Mô tả giao bài/chương học" />
                    </Form.Item>
                </Form>
            </Modal>

            <Drawer
                title={<span style={{ fontWeight: 700, fontSize: 18 }}>Chi tiết chương học</span>}
                placement="right"
                width={500}
                onClose={() => {
                    setIsDetailDrawerOpen(false);
                    setSelectedLevelForDetail(null);
                }}
                open={isDetailDrawerOpen}
                styles={{ body: { padding: '24px' } }}
            >
                {selectedLevelForDetail && (
                    <div className="space-y-6">
                        <Descriptions column={1} bordered size="small" labelStyle={{ fontWeight: 600, width: 140, background: '#f8fafc' }}>
                            <Descriptions.Item label="Tên chương học">
                                <span style={{ fontWeight: 700, color: '#1e293b' }}>{selectedLevelForDetail.name}</span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Vùng miền">
                                {(() => {
                                    const regionKey = getRegionKey(selectedLevelForDetail.dialectId);
                                    const info = REGION_LABEL[regionKey];
                                    return info ? <Tag color={info.color} style={{ background: info.bg, border: `1px solid ${info.color}30` }}>{info.label}</Tag> : <Tag>Không có</Tag>;
                                })()}
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                {(() => {
                                    const val = selectedLevelForDetail.status;
                                    if (val === 'APPROVED' || val === 'PUBLISHED') return <Tag color="success">Đã công bố</Tag>;
                                    if (val === 'PENDING') return <Tag color="warning">Đang chờ</Tag>;
                                    if (val === 'REJECTED') return <Tag color="error">Từ chối</Tag>;
                                    return <Tag color="default">Bản nháp</Tag>;
                                })()}
                            </Descriptions.Item>
                        </Descriptions>


                        <Divider orientation={"left" as any} style={{ margin: '24px 0 16px' }}>
                            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Mô tả nội dung
                            </span>
                        </Divider>

                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', color: '#475569', lineHeight: 1.6 }}>
                            {selectedLevelForDetail.description || selectedLevelForDetail.metadataJson?.description || 'Không có mô tả cho chương học này.'}
                        </div>

                        <Divider style={{ margin: '24px 0' }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: 12 }}>
                            <span>Ngày tạo: {selectedLevelForDetail.createdAt ? dayjs(selectedLevelForDetail.createdAt).format('DD/MM/YYYY HH:mm') : '—'}</span>
                            <span>Cập nhật: {selectedLevelForDetail.updatedAt ? dayjs(selectedLevelForDetail.updatedAt).format('DD/MM/YYYY HH:mm') : '—'}</span>
                        </div>
                    </div>
                )}
            </Drawer>

            {/* ====== Chapter Cards Grid ====== */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Guided hint banner */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 18px', borderRadius: 12,
                    background: 'linear-gradient(90deg, #eff6ff 0%, #f0fdf4 100%)',
                    border: '1px solid #bfdbfe'
                }}>
                    <span style={{ fontSize: 22 }}>📚</span>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#1e40af' }}>Chọn chương học để quản lý bài kiểm tra</div>
                        <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>Nhấn vào một chương học bên dưới để xem và quản lý danh sách bài kiểm tra của chương đó.</div>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 80 }}>
                        <Spin size="large" tip="Đang tải..." />
                    </div>
                ) : filteredLevels.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <Empty description={activeFilterCount > 0 ? 'Không tìm thấy chương học phù hợp' : 'Chưa có dữ liệu chương học'} />
                    </div>
                ) : (
                    (() => {
                        // Group by region
                        const grouped: Record<string, any[]> = {};
                        filteredLevels.forEach(level => {
                            const key = getRegionKey(level.dialectId) || 'OTHER';
                            if (!grouped[key]) grouped[key] = [];
                            grouped[key].push(level);
                        });
                        const regionOrder = ['NORTH', 'CENTRAL', 'SOUTH', 'OTHER'];
                        const existingRegions = regionOrder.filter(r => grouped[r]);
                        return (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                                gap: 24,
                                alignItems: 'start'
                            }}>
                                {existingRegions.map(regionKey => {
                                    const info = REGION_LABEL[regionKey] || { label: 'Khác', color: '#475569', bg: '#f8fafc' };
                                    const allCards = grouped[regionKey] || [];
                                    const pageSize = 3;
                                    const page = regionPages[regionKey] || 1;
                                    const pagedCards = allCards.slice((page - 1) * pageSize, page * pageSize);

                                    return (
                                        <div key={regionKey} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                                <div style={{ width: 4, height: 22, borderRadius: 2, background: info.color }} />
                                                <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{info.label}</span>
                                                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>({allCards.length} chương)</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                {pagedCards.map((level, idx) => {
                                                    const globalIdx = (page - 1) * pageSize + idx + 1;
                                                    return (
                                                        <div
                                                            key={level.id}
                                                            onClick={() => navigate(`/admin/quizzes/${level.id}`)}
                                                            style={{
                                                                cursor: 'pointer',
                                                                background: '#fff',
                                                                borderRadius: 14,
                                                                border: '1.5px solid #e2e8f0',
                                                                borderLeft: `4px solid ${info.color}`,
                                                                padding: '14px 16px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 14,
                                                                transition: 'all 0.18s ease',
                                                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                                                position: 'relative',
                                                                overflow: 'hidden',
                                                            }}
                                                            onMouseEnter={e => {
                                                                (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px rgba(0,0,0,0.10)`;
                                                                (e.currentTarget as HTMLElement).style.borderColor = info.color;
                                                                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                                                            }}
                                                            onMouseLeave={e => {
                                                                (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                                                                (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0';
                                                                (e.currentTarget as HTMLElement).style.borderLeftColor = info.color;
                                                                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                                                            }}
                                                        >
                                                            {/* Number badge */}
                                                            <div style={{
                                                                minWidth: 36, height: 36, borderRadius: 10,
                                                                background: info.bg || '#f1f5f9',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontWeight: 700, fontSize: 14, color: info.color, flexShrink: 0
                                                            }}>
                                                                {globalIdx}
                                                            </div>
                                                            {/* Chapter name */}
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    {level.name}
                                                                </div>
                                                                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                                                                    {level.description ? level.description.substring(0, 50) + (level.description.length > 50 ? '...' : '') : 'Nhấn để xem bài kiểm tra →'}
                                                                </div>
                                                            </div>
                                                            {/* CTA icons */}
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                                                <Tooltip title="Chỉnh sửa chương học">
                                                                    <Button
                                                                        icon={<EditOutlined />}
                                                                        size="small"
                                                                        onClick={e => { e.stopPropagation(); handleEditLevel(level); }}
                                                                        style={{ borderRadius: 8, border: '1px solid #e2e8f0', color: '#64748b', background: '#f8fafc' }}
                                                                    />
                                                                </Tooltip>
                                                                {fromClassroomId && level._fromAssignment ? (
                                                                    <Popconfirm
                                                                        title="Gỡ chương học khỏi lớp?"
                                                                        description="Chương học sẽ bị gỡ khỏi lớp này. Bạn chắc chắn chứ?"
                                                                        onConfirm={(e) => { e?.stopPropagation(); handleRemoveAssignment(level._assignmentId); }}
                                                                        onCancel={(e) => e?.stopPropagation()}
                                                                        okText="Gỡ"
                                                                        cancelText="Hủy"
                                                                        okButtonProps={{ danger: true, type: 'primary', style: { backgroundColor: '#ff4d4f', color: '#fff', borderColor: '#ff4d4f' } }}
                                                                    >
                                                                        <Button
                                                                            icon={<DeleteOutlined />}
                                                                            size="small"
                                                                            danger
                                                                            onClick={e => e.stopPropagation()}
                                                                            style={{ borderRadius: 8 }}
                                                                        />
                                                                    </Popconfirm>
                                                                ) : (
                                                                    <Popconfirm
                                                                        title="Xóa chương học?"
                                                                        description="Chương học sẽ bị ẩn khỏi hệ thống. Bạn chắc chắn chứ?"
                                                                        onConfirm={(e) => { e?.stopPropagation(); handleDeleteLevel(level.id); }}
                                                                        onCancel={(e) => e?.stopPropagation()}
                                                                        okText="Xóa"
                                                                        cancelText="Hủy"
                                                                        okButtonProps={{ danger: true, type: 'primary', style: { backgroundColor: '#ff4d4f', color: '#fff', borderColor: '#ff4d4f' } }}
                                                                    >
                                                                        <Button
                                                                            icon={<DeleteOutlined />}
                                                                            size="small"
                                                                            danger
                                                                            onClick={e => e.stopPropagation()}
                                                                            style={{ borderRadius: 8 }}
                                                                        />
                                                                    </Popconfirm>
                                                                )}
                                                                <div style={{
                                                                    width: 30, height: 30, borderRadius: 8,
                                                                    background: info.color + '15',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    color: info.color, fontSize: 16, fontWeight: 700
                                                                }}>
                                                                    →
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {allCards.length > pageSize && (
                                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
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


            <Modal
                title={<span style={{ fontWeight: 600 }}>Cập nhật chương học</span>}
                open={isEditModalOpen}
                onCancel={() => {
                    editForm.resetFields();
                    setIsEditModalOpen(false);
                    setEditingLevel(null);
                }}
                onOk={() => editForm.submit()}
                confirmLoading={updating}
                okText="Cập nhật"
                okButtonProps={{
                    style: { background: 'linear-gradient(135deg, #9333ea, #7e22ce)', border: 'none', borderRadius: '8px', height: 40, fontWeight: 600, paddingInline: 24, boxShadow: '0 4px 12px rgba(147,51,234,0.25)' }
                }}
                cancelText="Hủy bỏ"
                cancelButtonProps={{ style: { borderRadius: 8, height: 40 } }}
                centered
            >
                <Form
                    form={editForm}
                    layout="vertical"
                    onFinish={handleUpdateLevel}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                        <Form.Item
                            label="Tên chương học"
                            name="name"
                            rules={[{ required: true, message: 'Vui lòng nhập tên chương học' }]}
                        >
                            <Input
                                placeholder="Ví dụ: Level 1"
                                maxLength={50}
                                onChange={(e) => editForm.setFieldsValue({ name: sanitizeText(e.target.value) })}
                            />
                        </Form.Item>
                        <Form.Item
                            label="Phương ngữ"
                            name="dialectId"
                            rules={[{ required: true, message: 'Vui lòng chọn phương ngữ' }]}
                        >
                            <Select
                                placeholder="Chọn phương ngữ"
                                options={dialects.map((dialect: any) => {
                                    const regionKey = (dialect.name || '').toUpperCase();
                                    const info = REGION_LABEL[regionKey];
                                    return {
                                        value: dialect.id,
                                        label: dialect.description || info?.label || dialect.name || dialect.code || dialect.id,
                                    };
                                })}
                                onChange={(value) => fetchErrorTags(value)}
                            />
                        </Form.Item>
                        <Form.Item
                            label="Thứ tự chương học"
                            name="levelOrder"
                            hidden
                        >
                            <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item label="Ngưỡng AI" name="aiThreshold" hidden>
                            <InputNumber min={0} max={100} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item label="Error Tag" name="errorTagId" hidden>
                            <Select
                                placeholder="Chọn loại lỗi"
                                allowClear
                                options={errorTags.map((tag: any) => ({
                                    value: tag.id,
                                    label: tag.name || tag.tagCode || tag.id,
                                }))}
                            />
                        </Form.Item>
                    </div>
                    <Form.Item label="Mô tả" name="description">
                        <Input.TextArea
                            rows={3}
                            placeholder="Mô tả chương học"
                            maxLength={100}
                            showCount
                        />
                    </Form.Item>
                    <Form.Item
                        label="Ghi chú thay đổi"
                        name="comment"
                        rules={[{ required: true, message: 'Vui lòng nhập ghi chú thay đổi' }]}
                    >
                        <Input.TextArea
                            rows={2}
                            placeholder="Lý do hoặc nội dung cập nhật"
                            maxLength={100}
                            showCount
                        />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={<span style={{ fontWeight: 600 }}>Tạo quiz cho level {selectedLevelForQuiz?.name}</span>}
                open={isCreateQuizModalOpen}
                onCancel={() => {
                    quizForm.resetFields();
                    setIsCreateQuizModalOpen(false);
                    setSelectedLevelForQuiz(null);
                }}
                onOk={() => quizForm.submit()}
                confirmLoading={creatingQuiz}
                okText="Tạo quiz"
                okButtonProps={{
                    style: { background: 'linear-gradient(135deg, #9333ea, #7e22ce)', border: 'none', borderRadius: '8px', height: 40, fontWeight: 600, paddingInline: 24, boxShadow: '0 4px 12px rgba(147,51,234,0.25)' }
                }}
                cancelText="Hủy bỏ"
                cancelButtonProps={{ style: { borderRadius: 8, height: 40 } }}
                centered
                width={850}
            >
                <Form
                    form={quizForm}
                    layout="vertical"
                    onFinish={handleCreateQuiz}
                >
                    <Row gutter={24}>
                        <Col span={24}>
                            <Form.Item
                                label="Tên quiz"
                                name="title"
                                rules={[{ required: true, message: 'Vui lòng nhập tên quiz' }]}
                            >
                                <Input
                                    placeholder="Ví dụ: Thử thách Level 1"
                                    maxLength={50}
                                    onChange={(e) => quizForm.setFieldsValue({ title: sanitizeText(e.target.value) })}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={24}>
                        <Col span={12}>
                            <Form.Item label="Mô tả" name="description">
                                <Input.TextArea
                                    rows={2}
                                    placeholder="Mô tả bài quiz"
                                    maxLength={100}
                                    showCount
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Hướng dẫn" name="instructions">
                                <Input.TextArea
                                    rows={2}
                                    placeholder="Hướng dẫn làm bài"
                                    maxLength={100}
                                    showCount
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div style={{
                        background: '#f8fafc',
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        marginBottom: '20px'
                    }}>
                        <Form.Item
                            label="Mỗi câu (giây)"
                            name="secondsPerQuestion"
                            initialValue={90}
                            style={{ marginBottom: 0 }}
                        >
                            <InputNumber min={1} max={18000} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item
                            label="Điểm mỗi câu"
                            name="pointsPerQuestion"
                            rules={[{ required: true, message: 'Vui lòng nhập điểm mỗi câu' }]}
                            style={{ marginBottom: 0 }}
                        >
                            <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                            <Form.Item
                                label="Số câu Reading"
                                name="readingCount"
                                rules={[{ required: true, message: 'Bắt buộc' }]}
                                style={{ marginBottom: 0 }}
                            >
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item
                                label="Số câu Listening"
                                name="listeningCount"
                                rules={[{ required: true, message: 'Bắt buộc' }]}
                                style={{ marginBottom: 0 }}
                            >
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item
                                label="Số câu Speaking"
                                name="speakingCount"
                                rules={[{ required: true, message: 'Bắt buộc' }]}
                                style={{ marginBottom: 0 }}
                            >
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item
                                label="Số câu Writing"
                                name="writingCount"
                                rules={[{ required: true, message: 'Bắt buộc' }]}
                                style={{ marginBottom: 0 }}
                            >
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </div>
                    </div>

                    <Form.Item label="Ghi chú" name="comment" style={{ marginBottom: 0 }}>
                        <Input.TextArea
                            rows={1}
                            placeholder="Ghi chú khi tạo quiz"
                            maxLength={100}
                            showCount
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* ===== IMPORT MODAL ===== */}
            <Modal
                title={
                    <Space>
                        <UploadOutlined style={{ color: '#9333ea' }} />
                        <span style={{ fontWeight: 700, fontSize: 18 }}>Import chương học từ Excel</span>
                    </Space>
                }
                open={isImportModalOpen}
                onCancel={() => { setIsImportModalOpen(false); setImportFile(null); setImportResult(null); }}
                footer={null}
                centered
                width={540}
                destroyOnClose
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 12 }}>
                    {/* Step 1: Template */}
                    <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <span style={{ fontWeight: 700, color: '#1e293b' }}>1. Tải template mẫu</span>
                            <Button
                                type="dashed"
                                icon={<DownloadOutlined />}
                                loading={templateDownloading}
                                onClick={downloadLevelsTemplateExcel}
                                style={{ borderRadius: 8, fontWeight: 600 }}
                            >
                                Tải mẫu .xlsx
                            </Button>
                        </div>
                        <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                            Sử dụng file template đúng định dạng để đảm bảo dữ liệu được import chính xác vào hệ thống.
                        </p>
                    </div>

                    {/* Step 2: Guidelines */}
                    <div style={{ padding: 16, background: 'linear-gradient(135deg, #f0f7ff 0%, #e0efff 100%)', borderRadius: 12, border: '1px solid #bae6fd' }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <InfoCircleOutlined style={{ color: '#0284c7', marginTop: 3 }} />
                            <div>
                                <p style={{ margin: 0, fontSize: 13, color: '#0369a1', fontWeight: 600 }}>
                                    📌 Header bắt buộc (Tiếng Việt):
                                </p>
                                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#0c4a6e' }}>
                                    <strong>Tên chương học, Phương ngữ, Mô tả</strong>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Step 3: File Selection */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <span style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>2. Chọn file dữ liệu</span>
                        <div
                            style={{
                                position: 'relative',
                                border: '2px dashed #cbd5e1',
                                borderRadius: 12,
                                padding: '24px 16px',
                                textAlign: 'center',
                                background: importFile ? '#f0fdf4' : '#fafafa',
                                transition: 'all 0.3s ease',
                                borderColor: importFile ? '#22c55e' : '#cbd5e1'
                            }}
                        >
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                style={{
                                    position: 'absolute',
                                    top: 0, left: 0, width: '100%', height: '100%',
                                    opacity: 0, cursor: 'pointer', zIndex: 2
                                }}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                <FileExcelOutlined style={{ fontSize: 32, color: importFile ? '#16a34a' : '#94a3b8' }} />
                                <span style={{ fontSize: 14, color: '#475569', fontWeight: 500 }}>
                                    {importFile ? importFile.name : 'Nhấn để chọn hoặc kéo thả file Excel vào đây'}
                                </span>
                                {importFile && <span style={{ fontSize: 12, color: '#16a34a' }}>File đã sẵn sàng để import</span>}
                            </div>
                        </div>
                    </div>

                    {/* Result Display */}
                    {importResult && (
                        <div style={{
                            padding: 16,
                            background: importResult.failed > 0 ? '#fff7ed' : '#f0fdf4',
                            borderRadius: 12,
                            border: `1px solid ${importResult.failed > 0 ? '#ffedd5' : '#dcfce7'}`
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                {importResult.failed > 0 ? <WarningOutlined style={{ color: '#f97316' }} /> : <CheckCircleOutlined style={{ color: '#22c55e' }} />}
                                <span style={{ fontWeight: 700, color: importResult.failed > 0 ? '#9a3412' : '#166534' }}>
                                    Kết quả Import
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                                <span style={{ color: '#166534' }}>✅ Thành công: <strong>{importResult.success}</strong></span>
                                {importResult.failed > 0 && <span style={{ color: '#991b1b' }}>❌ Thất bại: <strong>{importResult.failed}</strong></span>}
                            </div>
                            {importResult.errors.length > 0 && (
                                <div style={{ marginTop: 12, maxHeight: 100, overflowY: 'auto', fontSize: 12, color: '#b91c1c', background: 'rgba(255,255,255,0.5)', padding: 8, borderRadius: 6 }}>
                                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                                        {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Button */}
                    <Button
                        type="primary"
                        icon={<RocketOutlined />}
                        loading={importing}
                        onClick={handleImportExcel}
                        disabled={!importFile}
                        block
                        size="large"
                        style={{
                            borderRadius: 12,
                            fontWeight: 700,
                            height: 50,
                            marginTop: 8,
                            background: !importFile ? '#e2e8f0' : 'linear-gradient(135deg, #9333ea, #7e22ce)',
                            border: 'none',
                            boxShadow: !importFile ? 'none' : '0 4px 12px rgba(147, 51, 234, 0.3)',
                            color: !importFile ? '#94a3b8' : '#fff'
                        }}
                    >
                        {importing ? 'Đang xử lý dữ liệu...' : 'Bắt đầu Import'}
                    </Button>
                </div>
            </Modal>
        </div >
    );
};

export default AdminChapterManagementPage;
