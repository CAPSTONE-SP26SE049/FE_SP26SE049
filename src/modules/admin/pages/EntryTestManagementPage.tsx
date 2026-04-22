import React, { useEffect, useState } from 'react'
import {
    Table, Button, Modal, Form, Input, Select, Popconfirm,
    message, Tag, Tabs, Statistic, Card, Row, Col, Badge, Space, Empty
} from 'antd'
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    ExperimentOutlined, UserOutlined, TrophyOutlined, ReloadOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import apiClient from '../../../services/apiClient'

const { Option } = Select

interface Question {
    id: string
    targetText: string
    regionCategory: string
}

interface TestResult {
    id: string
    overallScore: number
    detectedRegion: string
    createdAt: string
    userEmail: string
    userFullName: string
    details?: string
}

const REGION_LABELS: Record<string, { label: string; color: string }> = {
    NORTH_NL: { label: 'Miền Bắc (N/L)', color: 'blue' },
    CENTRAL_DGIR: { label: 'Miền Trung (D/GI/R)', color: 'orange' },
    SOUTH_TRCH: { label: 'Miền Nam (TR/CH)', color: 'green' },
}

const EntryTestManagementPage: React.FC = () => {
    const [questions, setQuestions] = useState<Question[]>([])
    const [results, setResults] = useState<TestResult[]>([])
    const [loadingQ, setLoadingQ] = useState(false)
    const [loadingR, setLoadingR] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState<Question | null>(null)
    const [form] = Form.useForm()
    const [saving, setSaving] = useState(false)
    const [viewDetailModalOpen, setViewDetailModalOpen] = useState(false)
    const [selectedResult, setSelectedResult] = useState<TestResult | null>(null)

    const fetchQuestions = async () => {
        setLoadingQ(true)
        try {
            const res = await apiClient.get('/test/admin/questions')
            // apiClient interceptor unwraps response.data, so res = { status, message, data: [...] }
            const list = Array.isArray(res) ? res : (res?.data ?? [])
            setQuestions(list)
        } catch {
            message.error('Không thể tải danh sách câu hỏi')
        } finally {
            setLoadingQ(false)
        }
    }

    const fetchResults = async () => {
        setLoadingR(true)
        try {
            const res = await apiClient.get('/test/admin/results')
            // apiClient interceptor unwraps response.data, so res = { status, message, data: [...] }
            const list = Array.isArray(res) ? res : (res?.data ?? [])
            setResults(list)
        } catch {
            message.error('Không thể tải kết quả bài test')
        } finally {
            setLoadingR(false)
        }
    }

    useEffect(() => {
        fetchQuestions()
        fetchResults()
    }, [])

    const openCreate = () => {
        setEditing(null)
        form.resetFields()
        setModalOpen(true)
    }

    const openEdit = (q: Question) => {
        setEditing(q)
        form.setFieldsValue({ targetText: q.targetText, regionCategory: q.regionCategory })
        setModalOpen(true)
    }

    const handleSave = async () => {
        try {
            const values = await form.validateFields()
            setSaving(true)
            if (editing) {
                await apiClient.put(`/test/admin/questions/${editing.id}`, values)
                message.success('Cập nhật câu hỏi thành công')
            } else {
                await apiClient.post('/test/admin/questions', values)
                message.success('Tạo câu hỏi thành công')
            }
            setModalOpen(false)
            fetchQuestions()
        } catch (err: any) {
            if (!err?.errorFields) message.error('Lưu thất bại')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await apiClient.delete(`/test/admin/questions/${id}`)
            message.success('Xoá câu hỏi thành công')
            fetchQuestions()
        } catch {
            message.error('Xoá thất bại')
        }
    }

    const questionColumns: ColumnsType<Question> = [
        {
            title: 'Câu hỏi',
            dataIndex: 'targetText',
            key: 'targetText',
            render: (text) => <span className="font-semibold text-gray-800">{text}</span>,
        },
        {
            title: 'Phân loại vùng miền',
            dataIndex: 'regionCategory',
            key: 'regionCategory',
            width: 220,
            render: (val) => {
                const info = REGION_LABELS[val] || { label: val, color: 'default' }
                return <Tag color={info.color} className="font-bold">{info.label}</Tag>
            },
            filters: Object.entries(REGION_LABELS).map(([k, v]) => ({ text: v.label, value: k })),
            onFilter: (value, record) => record.regionCategory === value,
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 140,
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => openEdit(record)}
                        className="text-purple-600 hover:bg-purple-50"
                    />
                    <Popconfirm
                        title="Xoá câu hỏi này?"
                        okText="Xoá"
                        cancelText="Huỷ"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <Button type="text" icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                </Space>
            ),
        },
    ]

    const resultColumns: ColumnsType<TestResult> = [
        {
            title: 'Người dùng',
            key: 'user',
            render: (_, r) => (
                <div>
                    <div className="font-bold text-gray-800">{r.userFullName || '—'}</div>
                    <div className="text-xs text-gray-400">{r.userEmail || '—'}</div>
                </div>
            ),
        },
        {
            title: 'Điểm tổng',
            dataIndex: 'overallScore',
            key: 'overallScore',
            width: 130,
            sorter: (a, b) => (a.overallScore || 0) - (b.overallScore || 0),
            render: (val) => {
                const score = Math.round(val || 0)
                const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f97316' : '#ef4444'
                return <span className="font-black text-lg" style={{ color }}>{score}%</span>
            },
        },
        {
            title: 'Miền chẩn đoán',
            dataIndex: 'detectedRegion',
            key: 'detectedRegion',
            width: 160,
            render: (val) => val ? (
                <Badge
                    count={val}
                    style={{ backgroundColor: '#7c3aed', fontSize: 11, fontWeight: 700 }}
                />
            ) : '—',
        },
        {
            title: 'Thời gian',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 180,
            sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            defaultSortOrder: 'descend',
            render: (val) => val ? new Date(val).toLocaleString('vi-VN') : '—',
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 100,
            render: (_, record) => (
                <Button
                    type="link"
                    onClick={() => {
                        setSelectedResult(record)
                        setViewDetailModalOpen(true)
                    }}
                >
                    Chi tiết
                </Button>
            ),
        },
    ]

    const avgScore = results.length
        ? Math.round(results.reduce((s, r) => s + (r.overallScore || 0), 0) / results.length)
        : 0

    const regionCount = results.reduce((acc, r) => {
        if (r.detectedRegion) acc[r.detectedRegion] = (acc[r.detectedRegion] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                        <ExperimentOutlined className="text-purple-600" />
                        Quản lý Entry Test
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">Quản lý câu hỏi chẩn đoán và xem kết quả người dùng</p>
                </div>
            </div>

            {/* Stats */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                    <Card className="rounded-2xl border-purple-100 shadow-sm">
                        <Statistic
                            title={<span className="text-gray-500 font-bold text-xs uppercase">Tổng câu hỏi</span>}
                            value={questions.length}
                            prefix={<ExperimentOutlined className="text-purple-500" />}
                            valueStyle={{ color: '#7c3aed', fontWeight: 900 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card className="rounded-2xl border-purple-100 shadow-sm">
                        <Statistic
                            title={<span className="text-gray-500 font-bold text-xs uppercase">Lượt làm bài</span>}
                            value={results.length}
                            prefix={<UserOutlined className="text-blue-500" />}
                            valueStyle={{ color: '#2563eb', fontWeight: 900 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card className="rounded-2xl border-purple-100 shadow-sm">
                        <Statistic
                            title={<span className="text-gray-500 font-bold text-xs uppercase">Điểm trung bình</span>}
                            value={avgScore}
                            suffix="%"
                            prefix={<TrophyOutlined className="text-yellow-500" />}
                            valueStyle={{ color: '#d97706', fontWeight: 900 }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Tabs */}
            <div className="bg-white rounded-3xl shadow-sm border border-purple-50 overflow-hidden">
                <Tabs
                    defaultActiveKey="questions"
                    className="px-6"
                    items={[
                        {
                            key: 'questions',
                            label: (
                                <span className="font-bold flex items-center gap-1.5">
                                    <ExperimentOutlined /> Ngân hàng câu hỏi
                                    <Tag color="purple" className="ml-1">{questions.length}</Tag>
                                </span>
                            ),
                            children: (
                                <div className="pb-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex gap-2">
                                            {Object.entries(
                                                questions.reduce((acc, q) => {
                                                    acc[q.regionCategory] = (acc[q.regionCategory] || 0) + 1
                                                    return acc
                                                }, {} as Record<string, number>)
                                            ).map(([k, v]) => {
                                                const info = REGION_LABELS[k] || { label: k, color: 'default' }
                                                return <Tag key={k} color={info.color}>{info.label}: {v}</Tag>
                                            })}
                                        </div>
                                        <Space>
                                            <Button
                                                icon={<ReloadOutlined />}
                                                onClick={fetchQuestions}
                                                loading={loadingQ}
                                            >Làm mới</Button>
                                            <Button
                                                type="primary"
                                                icon={<PlusOutlined />}
                                                onClick={openCreate}
                                                className="bg-purple-600 hover:bg-purple-700 border-none rounded-xl font-bold"
                                            >
                                                Thêm câu hỏi
                                            </Button>
                                        </Space>
                                    </div>
                                    <Table
                                        columns={questionColumns}
                                        dataSource={questions}
                                        rowKey="id"
                                        loading={loadingQ}
                                        pagination={{ pageSize: 10, showSizeChanger: false }}
                                        className="rounded-2xl overflow-hidden"
                                        rowClassName="hover:bg-purple-50/30"
                                    />
                                </div>
                            ),
                        },
                        {
                            key: 'results',
                            label: (
                                <span className="font-bold flex items-center gap-1.5">
                                    <TrophyOutlined /> Kết quả người dùng
                                    <Tag color="blue" className="ml-1">{results.length}</Tag>
                                </span>
                            ),
                            children: (
                                <div className="pb-6">
                                    {/* Region breakdown */}
                                    {Object.keys(regionCount).length > 0 && (
                                        <div className="flex gap-2 mb-4">
                                            {Object.entries(regionCount).map(([region, count]) => (
                                                <Tag key={region} color="purple" className="font-bold">
                                                    {region}: {count} người
                                                </Tag>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex justify-end mb-4">
                                        <Button icon={<ReloadOutlined />} onClick={fetchResults} loading={loadingR}>
                                            Làm mới
                                        </Button>
                                    </div>
                                    <Table
                                        columns={resultColumns}
                                        dataSource={results}
                                        rowKey="id"
                                        loading={loadingR}
                                        pagination={{ pageSize: 10, showSizeChanger: false }}
                                        className="rounded-2xl overflow-hidden"
                                        rowClassName="hover:bg-blue-50/30"
                                    />
                                </div>
                            ),
                        },
                    ]}
                />
            </div>

            {/* Create/Edit Modal */}
            <Modal
                open={modalOpen}
                title={
                    <span className="font-black text-gray-800">
                        {editing ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}
                    </span>
                }
                onCancel={() => setModalOpen(false)}
                onOk={handleSave}
                okText={editing ? 'Cập nhật' : 'Tạo mới'}
                cancelText="Huỷ"
                okButtonProps={{
                    loading: saving,
                    className: 'bg-purple-600 hover:bg-purple-700 border-none font-bold rounded-xl'
                }}
                width={560}
                className="rounded-2xl"
            >
                <Form form={form} layout="vertical" className="mt-4">
                    <Form.Item
                        name="targetText"
                        label={<span className="font-bold">Câu phát âm</span>}
                        rules={[
                            { required: true, message: 'Vui lòng nhập câu phát âm' },
                            { min: 3, message: 'Câu phải có ít nhất 3 ký tự' },
                        ]}
                    >
                        <Input.TextArea
                            rows={3}
                            placeholder="VD: Nửa đêm nhai nếp nương nanh"
                            className="rounded-xl"
                        />
                    </Form.Item>
                    <Form.Item
                        name="regionCategory"
                        label={<span className="font-bold">Phân loại vùng miền</span>}
                        rules={[{ required: true, message: 'Vui lòng chọn vùng miền' }]}
                    >
                        <Select placeholder="Chọn vùng miền" className="rounded-xl">
                            {Object.entries(REGION_LABELS).map(([k, v]) => (
                                <Option key={k} value={k}>
                                    <Tag color={v.color}>{v.label}</Tag>
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

            {/* View Detail Modal */}
            <Modal
                open={viewDetailModalOpen}
                title={
                    <div className="flex items-center gap-3">
                        <TrophyOutlined className="text-purple-600" />
                        <div>
                            <div className="font-black text-gray-800">Chi tiết kết quả Entry Test</div>
                            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest leading-none">
                                {selectedResult?.userFullName} • {Math.round(selectedResult?.overallScore || 0)}%
                            </div>
                        </div>
                    </div>
                }
                onCancel={() => setViewDetailModalOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setViewDetailModalOpen(false)} className="rounded-xl font-bold">
                        Đóng
                    </Button>
                ]}
                width={800}
                className="rounded-3xl"
            >
                <div className="py-4">
                    {(() => {
                        try {
                            const details = JSON.parse(selectedResult?.details || '[]')
                            if (!Array.isArray(details) || details.length === 0) {
                                return <Empty description="Không có dữ liệu chi tiết cho bài test này" />
                            }
                            return (
                                <div className="space-y-4">
                                    {details.map((item: any, idx: number) => {
                                        const accuracy = Number(item.accuracy || 0)
                                        const isGood = accuracy >= 70
                                        return (
                                            <div key={idx} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/30">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">{idx + 1}</span>
                                                        <span className="font-bold text-gray-700">{item.targetText}</span>
                                                    </div>
                                                    <Tag color={isGood ? 'green' : 'orange'} className="font-black rounded-lg">
                                                        {Math.round(accuracy)}%
                                                    </Tag>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Dịch (ASR):</p>
                                                        <p className="text-gray-700 italic font-medium">{item.rawText || '—'}</p>
                                                    </div>
                                                    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Lỗi phát hiện:</p>
                                                        <p className="text-orange-600 font-bold text-xs">{item.detectedError || 'Không có lỗi đặc biệt'}</p>
                                                        {item.isRegional && (
                                                            <Tag color="red" className="mt-1 text-[9px] font-black uppercase">Lỗi vùng miền</Tag>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        } catch (e) {
                            return (
                                <div className="p-10 text-center">
                                    <Badge status="error" text="Hệ thống cũ: Dữ liệu chi tiết không ở định dạng JSON để hiển thị đẹp." />
                                    <pre className="mt-4 p-4 bg-gray-100 rounded-lg text-left text-xs overflow-auto max-h-60">
                                        {selectedResult?.details}
                                    </pre>
                                </div>
                            )
                        }
                    })()}
                </div>
            </Modal>
        </div>
    )
}

export default EntryTestManagementPage
