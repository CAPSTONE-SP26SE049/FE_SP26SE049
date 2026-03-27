import React, { useEffect, useState, useMemo } from 'react';
import {
    Card, Table, message, Tag, Form, Input, InputNumber,
    Select, Button, Modal, Tooltip, Space, Row, Col,
    Popconfirm, Typography
} from 'antd';
import {
    PlusOutlined, EditOutlined, FileAddOutlined, SearchOutlined,
    UploadOutlined, DeleteOutlined, ReadOutlined, SoundOutlined,
    AudioOutlined, ArrowLeftOutlined, TrophyOutlined, ArrowRightOutlined
} from '@ant-design/icons';
import { adminService } from '../services/adminService';

const { Title, Text } = Typography;

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

const AdminChapterManagementPage: React.FC = () => {
    const [viewMode, setViewMode] = useState<'CHAPTERS' | 'QUIZZES' | 'QUIZ_DETAIL'>('CHAPTERS');
    const [selectedChapter, setSelectedChapter] = useState<any | null>(null);
    const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);

    // --- Chapter State ---
    const [levels, setLevels] = useState<any[]>([]);
    const [dialects, setDialects] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState<any | null>(null);

    // --- Quiz State ---
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loadingQuizzes, setLoadingQuizzes] = useState(false);
    const [isCreateQuizModalOpen, setIsCreateQuizModalOpen] = useState(false);
    const [creatingQuiz, setCreatingQuiz] = useState(false);

    // --- Challenge State ---
    const [quizChallenges, setQuizChallenges] = useState<any[]>([]);
    const [loadingQuizChallenges, setLoadingQuizChallenges] = useState(false);
    const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
    const [availableChallenges, setAvailableChallenges] = useState<any[]>([]);
    const [loadingBank, setLoadingBank] = useState(false);
    const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);

    // --- Forms ---
    const [form] = Form.useForm();
    const [editForm] = Form.useForm();
    const [quizForm] = Form.useForm();

    // --- Filter State ---
    const [searchText, setSearchText] = useState('');
    const [filterRegion, setFilterRegion] = useState<string | undefined>(undefined);

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        fetchLevels();
        fetchDialects();
    }, []);

    const fetchLevels = async () => {
        setLoading(true);
        try {
            const response = await adminService.getLevels();
            setLevels(response.data || []);
        } catch (error) {
            message.error('Không thể tải danh sách chương học');
        } finally {
            setLoading(false);
        }
    };

    const fetchDialects = async () => {
        try {
            const response = await adminService.getDialects();
            setDialects(response.data || []);
        } catch (error) {
            console.error('Lỗi tải phương ngữ:', error);
        }
    };

    const fetchQuizzes = async (chapterId: string) => {
        setLoadingQuizzes(true);
        try {
            const response = await adminService.getQuizzesByLevel(chapterId);
            setQuizzes(response.data || []);
        } catch (error) {
            message.error('Không thể tải danh sách bài tập');
        } finally {
            setLoadingQuizzes(false);
        }
    };

    const fetchQuizChallenges = async (quizId: string) => {
        setLoadingQuizChallenges(true);
        try {
            const response = await adminService.getQuizChallenges(quizId);
            setQuizChallenges(response.data || []);
        } catch (error) {
            message.error('Không thể tải danh sách thử thách');
        } finally {
            setLoadingQuizChallenges(false);
        }
    };

    const fetchChallengeBank = async (skillType: string) => {
        setLoadingBank(true);
        try {
            const response = await adminService.getChallengeBank(skillType);
            setAvailableChallenges(response.data || []);
        } catch (error) {
            message.error('Không thể tải ngân hàng thử thách');
        } finally {
            setLoadingBank(false);
        }
    };

    const handleCreateLevel = async (values: any) => {
        setCreating(true);
        try {
            await adminService.createLevel({
                ...values,
                levelOrder: levels.length + 1,
                status: 'APPROVED'
            });
            message.success('Đã thêm chương học mới');
            setIsCreateModalOpen(false);
            form.resetFields();
            fetchLevels();
        } catch (error) {
            message.error('Lỗi khi thêm chương học');
        } finally {
            setCreating(false);
        }
    };

    const handleUpdateLevel = async (values: any) => {
        if (!selectedLevel) return;
        setUpdating(true);
        try {
            await adminService.updateLevel(selectedLevel.id, values);
            message.success('Đã cập nhật chương học');
            setIsEditModalOpen(false);
            fetchLevels();
        } catch (error) {
            message.error('Lỗi khi cập nhật chương học');
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteLevel = async (id: string) => {
        try {
            await adminService.deleteLevel(id);
            message.success('Đã xóa chương học');
            fetchLevels();
        } catch (error) {
            message.error('Lỗi khi xóa chương học');
        }
    };

    const handleCreateQuiz = async (values: any) => {
        if (!selectedChapter) return;
        setCreatingQuiz(true);
        try {
            await adminService.createQuiz({
                ...values,
                levelId: selectedChapter.id
            });
            message.success('Đã thêm bài tập mới');
            setIsCreateQuizModalOpen(false);
            quizForm.resetFields();
            fetchQuizzes(selectedChapter.id);
        } catch (error) {
            message.error('Lỗi khi thêm bài tập');
        } finally {
            setCreatingQuiz(false);
        }
    };

    const handleDeleteQuiz = async (quizId: string) => {
        try {
            await adminService.deleteQuiz(quizId);
            message.success('Đã xóa bài tập');
            if (selectedChapter) fetchQuizzes(selectedChapter.id);
        } catch (error) {
            message.error('Lỗi khi xóa bài tập');
        }
    };

    const handleAssignChallenges = async () => {
        if (!selectedQuiz || selectedBankIds.length === 0) return;
        setLoadingBank(true);
        try {
            await adminService.assignChallengesToQuiz(selectedQuiz.id, selectedBankIds);
            message.success(`Đã thêm ${selectedBankIds.length} thử thách`);
            setIsChallengeModalOpen(false);
            setSelectedBankIds([]);
            fetchQuizChallenges(selectedQuiz.id);
        } catch (error) {
            message.error('Lỗi khi gán thử thách');
        } finally {
            setLoadingBank(false);
        }
    };

    const handleRemoveChallenge = async (challengeId: string) => {
        if (!selectedQuiz) return;
        try {
            await adminService.removeChallengeFromQuiz(selectedQuiz.id, challengeId);
            message.success('Đã gỡ thử thách');
            fetchQuizChallenges(selectedQuiz.id);
        } catch (error) {
            message.error('Lỗi khi gỡ thử thách');
        }
    };

    const getRegionKey = (dialectId: string) => {
        const d = dialects.find((item: any) => item.id === dialectId);
        if (!d) return 'UNKNOWN';
        const name = (d.name || '').toUpperCase();
        if (name.includes('BAC') || name.includes('NORTH')) return 'BAC';
        if (name.includes('TRUNG') || name.includes('CENTRAL')) return 'TRUNG';
        if (name.includes('NAM') || name.includes('SOUTH')) return 'NAM';
        return name;
    };

    const filteredLevels = useMemo(() => {
        let data = [...levels];
        if (searchText) {
            data = data.filter(l => (l.name || '').toLowerCase().includes(searchText.toLowerCase()));
        }
        if (filterRegion) {
            data = data.filter(l => getRegionKey(l.dialectId) === filterRegion);
        }
        return data;
    }, [levels, searchText, filterRegion, dialects]);

    const chapterColumns = [
        {
            title: 'Tên chương học',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: any) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{text}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {record.metadata_json?.description || record.description || 'Không có mô tả'}
                    </Text>
                </Space>
            ),
        },
        {
            title: 'Vùng miền',
            dataIndex: 'dialectId',
            key: 'dialectId',
            render: (dialectId: string) => {
                const region = getRegionKey(dialectId);
                const color = region === 'BAC' ? 'red' : region === 'TRUNG' ? 'gold' : 'blue';
                return <Tag color={color}>{region}</Tag>;
            },
        },
        {
            title: 'Yêu cầu sao',
            dataIndex: ['metadata_json', 'min_stars_required'],
            key: 'min_stars_required',
            render: (stars: any, record: any) => {
                const val = stars ?? record.minStarsRequired ?? 0;
                return <Space><TrophyOutlined style={{ color: '#faad14' }} /> {val}</Space>;
            },
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 150,
            align: 'center' as const,
            render: (_: any, record: any) => (
                <Space size="small">
                    <Tooltip title="Quản lý bài tập">
                        <Button
                            type="primary"
                            icon={<FileAddOutlined />}
                            size="middle"
                            onClick={() => {
                                setSelectedChapter(record);
                                setViewMode('QUIZZES');
                                fetchQuizzes(record.id);
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            size="middle"
                            onClick={() => {
                                setSelectedLevel(record);
                                editForm.setFieldsValue({
                                    name: record.name,
                                    dialectId: record.dialectId,
                                    description: record.metadata_json?.description || record.description,
                                    minStarsRequired: record.metadata_json?.min_stars_required || record.minStarsRequired,
                                });
                                setIsEditModalOpen(true);
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Xóa chương học">
                        <Popconfirm 
                            title="Xóa chương này?" 
                            description="Tất cả bài tập trong chương cũng sẽ bị ảnh hưởng."
                            onConfirm={() => handleDeleteLevel(record.id)}
                            okText="Xóa"
                            cancelText="Hủy"
                        >
                            <Button type="primary" danger icon={<DeleteOutlined />} size="middle" />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const quizColumns = [
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
            render: (text: string, record: any) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{text}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{record.description}</Text>
                </Space>
            ),
        },
        {
            title: 'Kỹ năng',
            dataIndex: 'skillType',
            key: 'skillType',
            render: (type: string) => {
                const config = SKILL_CONFIG[type] || { label: type, color: 'default', icon: <ReadOutlined /> };
                return <Tag color={config.color} icon={config.icon}>{config.label}</Tag>;
            },
        },
        {
            title: 'Độ khó',
            dataIndex: 'difficultyTag',
            key: 'difficultyTag',
            render: (tag: string) => {
                const config = DIFFICULTY_CONFIG[tag] || { label: tag, color: 'default' };
                return <Tag color={config.color}>{config.label}</Tag>;
            },
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 120,
            align: 'center' as const,
            render: (_: any, record: any) => (
                <Space size="middle">
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="primary"
                            icon={<ArrowRightOutlined />}
                            onClick={() => {
                                setSelectedQuiz(record);
                                setViewMode('QUIZ_DETAIL');
                                fetchQuizChallenges(record.id);
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Xóa bài tập">
                        <Popconfirm title="Xóa bài tập này?" onConfirm={() => handleDeleteQuiz(record.id)}>
                            <Button danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const challengeColumns = [
        {
            title: 'Nội dung',
            dataIndex: 'contentText',
            key: 'contentText',
            ellipsis: true,
        },
        {
            title: 'Loại',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => <Tag color="blue">{type}</Tag>,
        },
        {
            title: 'Âm thanh',
            dataIndex: 'referenceAudioUrl',
            key: 'referenceAudioUrl',
            render: (url: string) => url ? <Tag color="cyan">Đã có</Tag> : <Tag>Chưa có</Tag>,
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 100,
            align: 'center' as const,
            render: (_: any, record: any) => (
                <Tooltip title="Gỡ khỏi bài tập">
                    <Popconfirm title="Gỡ thử thách?" onConfirm={() => handleRemoveChallenge(record.id)}>
                        <Button danger type="text" icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Tooltip>
            ),
        },
    ];

    const renderChapterView = () => (
        <div className="space-y-6">
            <Card style={{ marginBottom: '24px' }} styles={{ body: { padding: '16px' } }}>
                <Row gutter={[16, 16]} align="middle" justify="space-between">
                    <Col xs={24} sm={16} md={18}>
                        <Space size="middle" style={{ width: '100%' }}>
                            <Input
                                prefix={<SearchOutlined />}
                                placeholder="Tìm kiếm chương..."
                                value={searchText}
                                onChange={e => setSearchText(e.target.value)}
                                style={{ width: 300 }}
                            />
                            <Select
                                style={{ width: 180 }}
                                placeholder="Vùng miền"
                                allowClear
                                onChange={val => setFilterRegion(val)}
                            >
                                <Select.Option value="BAC">Miền Bắc</Select.Option>
                                <Select.Option value="TRUNG">Miền Trung</Select.Option>
                                <Select.Option value="NAM">Miền Nam</Select.Option>
                            </Select>
                        </Space>
                    </Col>
                    <Col xs={24} sm={8} md={6} style={{ textAlign: 'right' }}>
                        <Space>
                            <Button type="primary" icon={<UploadOutlined />} onClick={() => setIsImportModalOpen(true)}>Import</Button>
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)}>Thêm chương</Button>
                        </Space>
                    </Col>
                </Row>
            </Card>
            <Table
                dataSource={filteredLevels}
                columns={chapterColumns}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />
        </div>
    );

    const renderQuizView = () => (
        <div className="space-y-6">
            <Button icon={<ArrowLeftOutlined />} onClick={() => setViewMode('CHAPTERS')}>Quay lại</Button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0' }}>
                <Title level={2} style={{ margin: 0 }}>Bài tập của {selectedChapter?.name}</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateQuizModalOpen(true)}>Thêm bài tập</Button>
            </div>
            <Table
                dataSource={quizzes}
                columns={quizColumns}
                rowKey="id"
                loading={loadingQuizzes}
            />
        </div>
    );

    const renderQuizDetailView = () => (
        <div className="space-y-6">
            <Button icon={<ArrowLeftOutlined />} onClick={() => setViewMode('QUIZZES')}>Quay lại</Button>
            <Card style={{ margin: '16px 0' }}>
                <Title level={3}>{selectedQuiz?.title}</Title>
                <Text type="secondary">{selectedQuiz?.description}</Text>
                <div style={{ marginTop: '16px' }}>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            fetchChallengeBank(selectedQuiz?.skillType);
                            setIsChallengeModalOpen(true);
                        }}
                    >
                        Thêm từ ngân hàng
                    </Button>
                </div>
            </Card>
            <Table
                dataSource={quizChallenges}
                columns={challengeColumns}
                rowKey="id"
                loading={loadingQuizChallenges}
            />
        </div>
    );

    return (
        <div style={{ padding: '24px' }}>
            {viewMode === 'CHAPTERS' && renderChapterView()}
            {viewMode === 'QUIZZES' && renderQuizView()}
            {viewMode === 'QUIZ_DETAIL' && renderQuizDetailView()}

            {/* Modals for Create/Edit Chapter */}
            <Modal
                title="Thêm Chương Học"
                open={isCreateModalOpen}
                onCancel={() => setIsCreateModalOpen(false)}
                onOk={() => form.submit()}
                confirmLoading={creating}
            >
                <Form form={form} layout="vertical" onFinish={handleCreateLevel}>
                    <Form.Item name="name" label="Tên chương" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="dialectId" label="Phương ngữ" rules={[{ required: true }]}>
                        <Select options={dialects.map((d: any) => ({ value: d.id, label: d.name }))} />
                    </Form.Item>
                    <Form.Item name="minStarsRequired" label="Sao yêu cầu" initialValue={3}><InputNumber min={0} /></Form.Item>
                    <Form.Item name="description" label="Mô tả"><Input.TextArea /></Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Chỉnh sửa Chương Học"
                open={isEditModalOpen}
                onCancel={() => setIsEditModalOpen(false)}
                onOk={() => editForm.submit()}
                confirmLoading={updating}
            >
                <Form form={editForm} layout="vertical" onFinish={handleUpdateLevel}>
                    <Form.Item name="name" label="Tên chương" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="dialectId" label="Phương ngữ" rules={[{ required: true }]}>
                        <Select options={dialects.map((d: any) => ({ value: d.id, label: d.name }))} />
                    </Form.Item>
                    <Form.Item name="minStarsRequired" label="Sao yêu cầu"><InputNumber min={0} /></Form.Item>
                    <Form.Item name="description" label="Mô tả"><Input.TextArea /></Form.Item>
                </Form>
            </Modal>

            {/* Modal for Create Quiz */}
            <Modal
                title="Thêm Bài Tập"
                open={isCreateQuizModalOpen}
                onCancel={() => setIsCreateQuizModalOpen(false)}
                onOk={() => quizForm.submit()}
                confirmLoading={creatingQuiz}
            >
                <Form form={quizForm} layout="vertical" onFinish={handleCreateQuiz}>
                    <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="description" label="Mô tả"><Input.TextArea /></Form.Item>
                    <Form.Item name="skillType" label="Kỹ năng" rules={[{ required: true }]}>
                        <Select options={Object.entries(SKILL_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))} />
                    </Form.Item>
                    <Form.Item name="difficultyTag" label="Độ khó" initialValue="BEGINNER">
                        <Select options={Object.entries(DIFFICULTY_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))} />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Modal for Challenge Bank Selection */}
            <Modal
                title="Ngân hàng thử thách"
                open={isChallengeModalOpen}
                onCancel={() => setIsChallengeModalOpen(false)}
                width={800}
                onOk={handleAssignChallenges}
            >
                <Table
                    rowSelection={{
                        selectedRowKeys: selectedBankIds,
                        onChange: (keys) => setSelectedBankIds(keys as string[]),
                    }}
                    dataSource={availableChallenges}
                    columns={[
                        { title: 'Nội dung', dataIndex: 'contentText' },
                        { title: 'Loại', dataIndex: 'type' },
                    ]}
                    rowKey="id"
                    loading={loadingBank}
                    pagination={{ pageSize: 15 }}
                />
            </Modal>

            {/* Modal for Import */}
            <Modal
                title="Import Chương Học"
                open={isImportModalOpen}
                onCancel={() => setIsImportModalOpen(false)}
                footer={null}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <input type="file" accept=".csv" onChange={e => setImportFile(e.target.files?.[0] || null)} />
                    <Button
                        type="primary"
                        loading={importing}
                        onClick={async () => {
                            if (!importFile) return;
                            setImporting(true);
                            // Simple mock/trigger for now
                            message.info('Tính năng import đang được tối ưu hóa');
                            setImporting(false);
                            setIsImportModalOpen(false);
                        }}
                    >
                        Bắt đầu Import
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default AdminChapterManagementPage;
