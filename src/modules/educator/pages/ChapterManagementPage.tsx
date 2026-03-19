import React, { useEffect, useState } from 'react';
import { Card, Table, message, Tag, Form, Input, InputNumber, Select, Button, Modal, Tooltip, Space } from 'antd';
import { PlusOutlined, EditOutlined, FileAddOutlined } from '@ant-design/icons';
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
    const [isCreateQuizModalOpen, setIsCreateQuizModalOpen] = useState(false);
    const [creatingQuiz, setCreatingQuiz] = useState(false);
    const [selectedLevelForQuiz, setSelectedLevelForQuiz] = useState<any | null>(null);

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
                levelOrder: values.levelOrder,
                name: values.name,
                description: values.description || '',
                minStarsRequired: values.minStarsRequired,
                errorTagId: values.errorTagId,
                aiThreshold: values.aiThreshold,
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
                levelOrder: values.levelOrder,
                minStarsRequired: values.minStarsRequired,
                errorTagId: values.errorTagId,
                aiThreshold: values.aiThreshold,
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
            pronunciationCount: 0,
        });
        setIsCreateQuizModalOpen(true);
    };

    const handleCreateQuiz = async (values: any) => {
        if (!selectedLevelForQuiz?.id) return;
        setCreatingQuiz(true);
        try {
            const readingCount = Number(values.readingCount || 0);
            const listeningCount = Number(values.listeningCount || 0);
            const pronunciationCount = Number(values.pronunciationCount || 0);
            const questionCount = readingCount + listeningCount + pronunciationCount;
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
                ...buildQuestions('PRONUNCIATION', pronunciationCount),
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
            render: (text: string) => <strong>{text}</strong>,
        },
        {
            title: 'Vùng',
            dataIndex: 'dialectId',
            key: 'dialectId',
            render: (dialectId: string) => {
                const dialect = dialects.find((item) => item.id === dialectId);
                const regionKey = (dialect?.name || '').toUpperCase();
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
                <h2 className="text-2xl font-bold text-gray-800" style={{ margin: 0 }}>Quản Lý Chương Học</h2>
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
            </div>

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
                            rules={[{ required: true, message: 'Vui lòng nhập thứ tự level' }]}
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
                        <Form.Item label="Ngưỡng AI" name="aiThreshold">
                            <InputNumber min={0} max={100} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item label="Error Tag ID" name="errorTagId">
                            <Input placeholder="ID error tag (nếu có)" />
                        </Form.Item>
                    </div>
                    <Form.Item label="Mô tả" name="description">
                        <Input.TextArea rows={3} placeholder="Mô tả chương học" />
                    </Form.Item>
                </Form>
            </Modal>

            <Card
                variant="borderless"
                style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
            >
                <Table
                    dataSource={levels}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: 'Chưa có dữ liệu chương học' }}
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
                            rules={[{ required: true, message: 'Vui lòng nhập thứ tự level' }]}
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
                        <Form.Item label="Ngưỡng AI" name="aiThreshold">
                            <InputNumber min={0} max={100} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item label="Error Tag" name="errorTagId">
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
            >
                <Form
                    form={quizForm}
                    layout="vertical"
                    onFinish={handleCreateQuiz}
                >
                    <Form.Item
                        label="Tên quiz"
                        name="title"
                        rules={[{ required: true, message: 'Vui lòng nhập tên quiz' }]}
                    >
                        <Input placeholder="Ví dụ: Thử thách Level 1" />
                    </Form.Item>
                    <Form.Item label="Mô tả" name="description">
                        <Input.TextArea rows={2} placeholder="Mô tả bài quiz" />
                    </Form.Item>
                    <Form.Item label="Hướng dẫn" name="instructions">
                        <Input.TextArea rows={2} placeholder="Hướng dẫn làm bài" />
                    </Form.Item>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                        <Form.Item
                            label="Điểm đạt"
                            name="passingScore"
                            rules={[{ required: true, message: 'Vui lòng nhập điểm đạt' }]}
                        >
                            <InputNumber min={0} max={100} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item
                            label="Giới hạn phút"
                            name="timeLimitMinutes"
                        >
                            <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item
                            label="Điểm mỗi câu"
                            name="pointsPerQuestion"
                            rules={[{ required: true, message: 'Vui lòng nhập điểm mỗi câu' }]}
                        >
                            <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item
                            label="Độ khó"
                            name="difficulty"
                        >
                            <Select
                                options={[
                                    { value: 'BEGINNER', label: 'Beginner' },
                                    { value: 'INTERMEDIATE', label: 'Intermediate' },
                                    { value: 'ADVANCED', label: 'Advanced' },
                                ]}
                            />
                        </Form.Item>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                        <Form.Item
                            label="Số câu Reading"
                            name="readingCount"
                            rules={[{ required: true, message: 'Vui lòng nhập số câu Reading' }]}
                        >
                            <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item
                            label="Số câu Listening"
                            name="listeningCount"
                            rules={[{ required: true, message: 'Vui lòng nhập số câu Listening' }]}
                        >
                            <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item
                            label="Số câu Pronunciation"
                            name="pronunciationCount"
                            rules={[{ required: true, message: 'Vui lòng nhập số câu Pronunciation' }]}
                        >
                            <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                    </div>
                    <Form.Item label="Ghi chú" name="comment">
                        <Input.TextArea rows={2} placeholder="Ghi chú khi tạo quiz" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ChapterManagementPage;
