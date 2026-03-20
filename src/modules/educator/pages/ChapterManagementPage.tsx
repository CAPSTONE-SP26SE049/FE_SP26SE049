import React, { useEffect, useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { useLocation } from 'react-router-dom';
import { Card, Table, message, Tag, Form, Input, InputNumber, Select, Button, Modal, Tooltip, Space, Badge, Row, Col, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, FileAddOutlined, SearchOutlined, FilterOutlined, ClearOutlined, SortAscendingOutlined } from '@ant-design/icons';
import { educatorService } from '../services/educatorService';

const ChapterManagementPage: React.FC = () => {
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
    const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);

    const fetchLevels = async () => {
        setLoading(true);
        try {
            const response: any = await educatorService.getLevelsForSelection();
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
            const response: any = await educatorService.getDialects();
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
            const response: any = await educatorService.getErrorTags(dialectId);
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

    useEffect(() => {
        fetchLevels();
        fetchDialects();
    }, []);

    const handleCreateLevel = async (values: any) => {
        setCreating(true);
        try {
            await educatorService.createLevel({
                dialectId: values.dialectId,
                levelOrder: values.levelOrder || 1,
                name: values.name,
                description: values.description || '',
                minStarsRequired: values.minStarsRequired,
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
            comment: '',
        });
        fetchErrorTags(record.dialectId || record.dialect?.id);
    };

    const handleUpdateLevel = async (values: any) => {
        if (!editingLevel?.id) return;
        setUpdating(true);
        try {
            await educatorService.updateLevel(editingLevel.id, {
                name: values.name,
                description: values.description,
                dialectId: values.dialectId ?? editingLevel.dialectId ?? editingLevel.dialect?.id,
                levelOrder: values.levelOrder || editingLevel.levelOrder || 1,
                minStarsRequired: values.minStarsRequired,
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

    const handleOpenCreateQuiz = (record: any) => {
        setSelectedLevelForQuiz(record);
        quizForm.setFieldsValue({
            title: record?.name ? `Quiz ${record.name}` : '',
            passingScore: 80,
            timeLimitMinutes: 15,
            pointsPerQuestion: 10,
            readingCount: 0,
            listeningCount: 0,
            speakingCount: 0,
            writingCount: 0,
        });
        setIsCreateQuizModalOpen(true);
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
                    difficulty: values.difficulty,
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

            await educatorService.createQuiz({
                levelId: selectedLevelForQuiz.id,
                title: values.title,
                description: values.description,
                instructions: values.instructions,
                passingScore: values.passingScore,
                timeLimitMinutes: values.timeLimitMinutes,
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
            const response: any = await educatorService.getLevelsForSelection();
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
            await educatorService.createAssignment({
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

    // --- Helper to resolve region key from dialectId ---
    const getRegionKey = (dialectId: string) => {
        const dialect = dialects.find((item) => item.id === dialectId);
        return (dialect?.name || '').toUpperCase();
    };

    const fetchedAssignments = (location.state as any)?.fetchedAssignments as any[] | undefined;
    const fromClassroomName = (location.state as any)?.fromClassroomName as string | undefined;
    const fromClassroomId = (location.state as any)?.fromClassroomId as string | undefined;

    const mergedLevels = useMemo(() => {
        if (!fetchedAssignments || fetchedAssignments.length === 0) return levels;

        const mappedFromAssignments = fetchedAssignments.map((item: any) => ({
            id: item.id,
            name: item.levelName || 'Không có tên chương',
            dialectId: item.dialectId,
            status: item.status || 'APPROVED',
            createdAt: item.createdAt,
            dueDate: item.dueDate,
            _fromAssignment: true,
        }));

        return mappedFromAssignments;
    }, [levels, fetchedAssignments]);

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

        // Filter by status
        if (filterStatus) {
            if (filterStatus === 'DRAFT') {
                data = data.filter((item) => !item.status || item.status === 'DRAFT');
            } else {
                data = data.filter((item) => item.status === filterStatus);
            }
        }

        return data;
    }, [mergedLevels, searchText, filterRegion, filterStatus, dialects]);

    const activeFilterCount = [searchText.trim(), filterRegion, filterStatus].filter(Boolean).length;

    const handleResetFilters = () => {
        setSearchText('');
        setFilterRegion(undefined);
        setFilterStatus(undefined);
    };

    const columns = [
        {
            title: 'STT',
            key: 'stt',
            width: 60,
            align: 'center' as const,
            render: (_: any, __: any, index: number) => index + 1,
        },
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 150,
            render: (text: string) => <code style={{ fontSize: '12px' }}>{text.substring(0, 8)}...</code>,
        },
        {
            title: 'Tên chương học',
            dataIndex: 'name',
            key: 'name',
            sorter: (a: any, b: any) => (a.name || '').localeCompare(b.name || '', 'vi'),
            render: (text: string) => <strong>{text}</strong>,
        },
        {
            title: 'Vùng',
            dataIndex: 'dialectId',
            key: 'dialectId',
            sorter: (a: any, b: any) => {
                const aRegion = getRegionKey(a.dialectId);
                const bRegion = getRegionKey(b.dialectId);
                return aRegion.localeCompare(bRegion);
            },
            render: (dialectId: string) => {
                const regionKey = getRegionKey(dialectId);
                const info = REGION_LABEL[regionKey];
                if (!info) return <Tag>Không có</Tag>;
                return (
                    <span
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 12px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            color: info.color,
                            background: info.bg,
                            border: `1.5px solid ${info.color}40`,
                            letterSpacing: '0.03em',
                            boxShadow: `0 1px 4px ${info.color}20`,
                        }}
                    >
                        {info.label}
                    </span>
                );
            },
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            sorter: (a: any, b: any) => (a.status || 'DRAFT').localeCompare(b.status || 'DRAFT'),
            render: (value?: string) => {
                if (value === 'APPROVED') return <Tag color="success">Đã duyệt</Tag>;
                if (value === 'PENDING') return <Tag color="warning">Chờ duyệt</Tag>;
                if (value === 'REJECTED') return <Tag color="error">Từ chối</Tag>;
                return <Tag color="default">Nháp</Tag>;
            },
        },
        {
            title: 'Hành Động',
            key: 'actions',
            render: (_: any, record: any) => (
                <Space size="middle">
                    <Tooltip title="Tạo quiz">
                        <Button icon={<FileAddOutlined />} onClick={() => handleOpenCreateQuiz(record)} />
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                        <Button icon={<EditOutlined />} onClick={() => handleEditLevel(record)} />
                    </Tooltip>
                </Space>
            ),
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800" style={{ margin: 0 }}>Quản Lý Chương Học</h2>
                    {fromClassroomName ? (
                        <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
                            Đang xem chương đã gán cho lớp: <strong>{fromClassroomName}</strong>
                        </div>
                    ) : null}
                </div>
                <Space>
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
                            height: '40px',
                            borderRadius: '10px',
                            background: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(37,99,235,0.2)'
                        }}
                    >
                        Thêm Chương Học
                    </Button>
                </Space>
            </div>

            {/* ====== FILTER & SORT TOOLBAR ====== */}
            <Card
                style={{
                    borderRadius: 14,
                    marginBottom: 0,
                    boxShadow: '0 2px 12px rgba(37,99,235,0.06)',
                    border: '1px solid #e2e8f0',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #fff 100%)',
                }}
                bodyStyle={{ padding: '16px 20px' }}
            >
                <Row gutter={[16, 12]} align="middle">
                    <Col xs={24} sm={24} md={8} lg={7}>
                        <Input
                            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                            placeholder="Tìm kiếm theo tên chương học..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                            style={{ borderRadius: 8, height: 38 }}
                        />
                    </Col>
                    <Col xs={12} sm={12} md={5} lg={5}>
                        <Select
                            placeholder="Lọc theo vùng"
                            value={filterRegion}
                            onChange={(val) => setFilterRegion(val)}
                            allowClear
                            style={{ width: '100%', borderRadius: 8 }}
                            suffixIcon={<FilterOutlined style={{ color: '#64748b' }} />}
                        >
                            <Select.Option value="NORTH">
                                <span style={{ color: '#1d4ed8', fontWeight: 600 }}>🔵 Miền Bắc</span>
                            </Select.Option>
                            <Select.Option value="CENTRAL">
                                <span style={{ color: '#b45309', fontWeight: 600 }}>🟠 Miền Trung</span>
                            </Select.Option>
                            <Select.Option value="SOUTH">
                                <span style={{ color: '#15803d', fontWeight: 600 }}>🟢 Miền Nam</span>
                            </Select.Option>
                        </Select>
                    </Col>
                    <Col xs={12} sm={12} md={5} lg={5}>
                        <Select
                            placeholder="Lọc trạng thái"
                            value={filterStatus}
                            onChange={(val) => setFilterStatus(val)}
                            allowClear
                            style={{ width: '100%', borderRadius: 8 }}
                            suffixIcon={<FilterOutlined style={{ color: '#64748b' }} />}
                        >
                            <Select.Option value="APPROVED">
                                <Tag color="success" style={{ margin: 0 }}>Đã duyệt</Tag>
                            </Select.Option>
                            <Select.Option value="PENDING">
                                <Tag color="warning" style={{ margin: 0 }}>Chờ duyệt</Tag>
                            </Select.Option>
                            <Select.Option value="REJECTED">
                                <Tag color="error" style={{ margin: 0 }}>Từ chối</Tag>
                            </Select.Option>
                            <Select.Option value="DRAFT">
                                <Tag color="default" style={{ margin: 0 }}>Nháp</Tag>
                            </Select.Option>
                        </Select>
                    </Col>
                    <Col xs={24} sm={24} md={6} lg={7}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {activeFilterCount > 0 && (
                                <Button
                                    icon={<ClearOutlined />}
                                    onClick={handleResetFilters}
                                    style={{ borderRadius: 8, height: 38, borderColor: '#e2e8f0' }}
                                >
                                    Xóa bộ lọc
                                </Button>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                            </div>
                            <Tooltip title="Nhấn vào tiêu đề cột để sắp xếp">
                                <SortAscendingOutlined style={{ color: '#94a3b8', fontSize: 16, cursor: 'help' }} />
                            </Tooltip>
                        </div>
                    </Col>
                </Row>
            </Card>

            <Modal
                title={<span style={{ fontWeight: 600 }}>Tạo Chương Học Mới</span>}
                open={isCreateModalOpen}
                onCancel={() => {
                    form.resetFields();
                    setIsCreateModalOpen(false);
                }}
                onOk={() => form.submit()}
                confirmLoading={creating}
                okText="Xác Nhận"
                okButtonProps={{
                    style: { background: '#2563eb', border: 'none', borderRadius: '6px' }
                }}
                cancelText="Hủy bỏ"
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
                            <Input placeholder="Ví dụ: Level 1" />
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
                            label="Thứ tự level"
                            name="levelOrder"
                            hidden
                        >
                            <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item
                            label="Số sao tối thiểu"
                            name="minStarsRequired"
                            rules={[{ required: true, message: 'Vui lòng nhập số sao tối thiểu' }]}
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
                        <Input.TextArea rows={3} placeholder="Mô tả chương học" />
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
                    style: { background: '#059669', border: 'none', borderRadius: '6px' }
                }}
                cancelText="Hủy"
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

            <Card
                variant="borderless"
                style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
            >
                <Table
                    dataSource={filteredLevels}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10, showTotal: (total) => `Tổng ${total} chương học` }}
                    locale={{ emptyText: activeFilterCount > 0 ? 'Không tìm thấy chương học phù hợp' : 'Chưa có dữ liệu chương học' }}
                    showSorterTooltip={{ title: 'Nhấn để sắp xếp' }}
                />
            </Card>

            <Modal
                title={<span style={{ fontWeight: 600 }}>Cập Nhật Chương Học</span>}
                open={isEditModalOpen}
                onCancel={() => {
                    editForm.resetFields();
                    setIsEditModalOpen(false);
                    setEditingLevel(null);
                }}
                onOk={() => editForm.submit()}
                confirmLoading={updating}
                okText="Cập Nhật"
                okButtonProps={{
                    style: { background: '#2563eb', border: 'none', borderRadius: '6px' }
                }}
                cancelText="Hủy bỏ"
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
                            <Input placeholder="Ví dụ: Level 1" />
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
                            label="Thứ tự level"
                            name="levelOrder"
                            hidden
                        >
                            <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item
                            label="Số sao tối thiểu"
                            name="minStarsRequired"
                            rules={[{ required: true, message: 'Vui lòng nhập số sao tối thiểu' }]}
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
                        <Input.TextArea rows={3} placeholder="Mô tả chương học" />
                    </Form.Item>
                    <Form.Item
                        label="Ghi chú thay đổi"
                        name="comment"
                        rules={[{ required: true, message: 'Vui lòng nhập ghi chú thay đổi' }]}
                    >
                        <Input.TextArea rows={2} placeholder="Lý do hoặc nội dung cập nhật" />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={<span style={{ fontWeight: 600 }}>Tạo Quiz cho Level {selectedLevelForQuiz?.name}</span>}
                open={isCreateQuizModalOpen}
                onCancel={() => {
                    quizForm.resetFields();
                    setIsCreateQuizModalOpen(false);
                    setSelectedLevelForQuiz(null);
                }}
                onOk={() => quizForm.submit()}
                confirmLoading={creatingQuiz}
                okText="Tạo Quiz"
                okButtonProps={{
                    style: { background: '#2563eb', border: 'none', borderRadius: '6px' }
                }}
                cancelText="Hủy bỏ"
                centered
                width={850}
            >
                <Form
                    form={quizForm}
                    layout="vertical"
                    onFinish={handleCreateQuiz}
                >
                    <Row gutter={24}>
                        <Col span={12}>
                            <Form.Item
                                label="Tên quiz"
                                name="title"
                                rules={[{ required: true, message: 'Vui lòng nhập tên quiz' }]}
                            >
                                <Input placeholder="Ví dụ: Thử thách Level 1" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Độ khó"
                                name="difficulty"
                            >
                                <Select
                                    placeholder="Chọn độ khó"
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
                                <Input.TextArea rows={2} placeholder="Mô tả bài quiz" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Hướng dẫn" name="instructions">
                                <Input.TextArea rows={2} placeholder="Hướng dẫn làm bài" />
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                            <Form.Item
                                label="Điểm đạt (%)"
                                name="passingScore"
                                rules={[{ required: true, message: 'Vui lòng nhập điểm đạt' }]}
                                style={{ marginBottom: 0 }}
                            >
                                <InputNumber min={0} max={100} style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item
                                label="Giới hạn (phút)"
                                name="timeLimitMinutes"
                                style={{ marginBottom: 0 }}
                            >
                                <InputNumber min={1} style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item
                                label="Điểm mỗi câu"
                                name="pointsPerQuestion"
                                rules={[{ required: true, message: 'Vui lòng nhập điểm mỗi câu' }]}
                                style={{ marginBottom: 0 }}
                            >
                                <InputNumber min={1} style={{ width: '100%' }} />
                            </Form.Item>
                        </div>

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
                        <Input.TextArea rows={1} placeholder="Ghi chú khi tạo quiz" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ChapterManagementPage;
