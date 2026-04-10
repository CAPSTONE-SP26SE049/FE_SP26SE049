import React, { useState, useEffect } from 'react'
import {
    Table, Card, Input, Tag, Space, Button, Tooltip, Modal, Form,
    message, Typography, Switch, Popconfirm, Upload, Row, Col
} from 'antd'
import {
    SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
    TrophyOutlined, ReloadOutlined, EyeOutlined, EyeInvisibleOutlined
} from '@ant-design/icons'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../../../firebase'
import rewardService from '../services/rewardService'

const { Title, Text } = Typography
const { TextArea } = Input

// ─── Types ──────────────────────────────────────────────────────────────────
interface Reward {
    id: string
    code: string
    name: string
    description: string
    iconUrl: string
    isActive: boolean
    createdAt: string
    updatedAt: string
    linkedQuizId: string | null
    linkedQuizName: string | null
    linkedLevelName: string | null
}

// ─── Main Page ──────────────────────────────────────────────────────────────
const RewardManagementPage = () => {
    const [rewards, setRewards] = useState<Reward[]>([])
    const [loading, setLoading] = useState(true)
    const [searchText, setSearchText] = useState('')

    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState<Reward | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [fileList, setFileList] = useState<any[]>([])
    const [form] = Form.useForm()

    // ── Fetch ────────────────────────────────────────────────────────────────
    const fetchRewards = async () => {
        try {
            setLoading(true)
            const res: any = await rewardService.getAll().catch(() => null)
            console.log('Rewards raw response:', res)

            let list: Reward[] = []
            if (Array.isArray(res)) {
                list = res
            } else if (res.data && Array.isArray(res.data)) {
                list = res.data
            } else if (Array.isArray(res.content)) {
                list = res.content
            } else if (res.data?.data && Array.isArray(res.data.data)) {
                // Thêm trường hợp bọc 2 lớp data (thường gặp khi proxy/axios interceptor)
                list = res.data.data
            }

            console.log('Final rewards list to render:', list)
            setRewards(list)
        } catch (error) {
            console.error('Failed to fetch rewards:', error)
            message.error('Không thể tải danh sách huy hiệu')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRewards()
    }, [])

    // ── Create / Edit ────────────────────────────────────────────────────────
    const openCreate = () => {
        setEditing(null)
        form.resetFields()
        form.setFieldsValue({ isActive: true })
        setFileList([])
        setModalOpen(true)
    }

    const openEdit = (record: Reward) => {
        setEditing(record)
        form.setFieldsValue({
            code: record.code,
            name: record.name,
            description: record.description,
            iconUrl: record.iconUrl,
            isActive: record.isActive,
        })
        setFileList(record.iconUrl ? [{
            uid: '-1',
            name: 'current_icon.png',
            status: 'done',
            url: record.iconUrl,
        }] : [])
        setModalOpen(true)
    }

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields()
            setSubmitting(true)

            // Handle file upload
            let finalIconUrl = values.iconUrl || ''
            const file = fileList[0]?.originFileObj
            if (file) {
                const storageRef = ref(storage, `badges/${Date.now()}_${file.name}`)
                const snapshot = await uploadBytes(storageRef, file)
                finalIconUrl = await getDownloadURL(snapshot.ref)
            }

            const payload = {
                code: values.code,
                name: values.name,
                description: values.description || '',
                iconUrl: finalIconUrl,
                isActive: values.isActive ?? true,
            }

            if (editing) {
                await rewardService.update(editing.id, payload)
                message.success('Cập nhật huy hiệu thành công!')
            } else {
                await rewardService.create(payload)
                message.success('Tạo huy hiệu thành công!')
            }

            setModalOpen(false)
            fetchRewards()
        } catch (err: any) {
            if (err?.errorFields) return // form validation
            message.error(err?.message || 'Có lỗi xảy ra')
        } finally {
            setSubmitting(false)
        }
    }

    // ── Toggle ───────────────────────────────────────────────────────────────
    const handleToggle = async (record: Reward) => {
        try {
            await rewardService.toggleActive(record.id)
            message.success(`Đã ${record.isActive ? 'ẩn' : 'hiển thị'} huy hiệu`)
            fetchRewards()
        } catch {
            message.error('Không thể cập nhật trạng thái')
        }
    }

    // ── Delete ───────────────────────────────────────────────────────────────
    const handleDelete = async (id: string) => {
        try {
            await rewardService.delete(id)
            message.success('Đã xóa huy hiệu')
            fetchRewards()
        } catch {
            message.error('Không thể xóa huy hiệu')
        }
    }

    // ── Filter ───────────────────────────────────────────────────────────────
    const filteredData = rewards.filter((r) =>
        r.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        r.code?.toLowerCase().includes(searchText.toLowerCase())
    )

    // ── Columns ──────────────────────────────────────────────────────────────
    const columns = [
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
            title: 'Huy hiệu',
            key: 'badge',
            width: 280,
            render: (_: any, r: Reward) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12, padding: 2,
                        background: 'linear-gradient(135deg, #9333ea, #7e22ce)',
                        flexShrink: 0, boxShadow: '0 2px 8px rgba(24,144,255,0.3)'
                    }}>
                        <div style={{
                            width: '100%', height: '100%', borderRadius: 10,
                            background: '#fff', overflow: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {r.iconUrl ? (
                                <img
                                    src={r.iconUrl} alt={r.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none'
                                    }}
                                />
                            ) : (
                                <TrophyOutlined style={{ color: '#9333ea', fontSize: 20 }} />
                            )}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>{r.name}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace', marginTop: 2 }}>{r.code}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            width: 200,
            ellipsis: true,
            render: (text: string) => (
                <Text type="secondary" style={{ fontSize: 13 }}>{text || '—'}</Text>
            ),
        },
        {
            title: 'Quiz liên kết',
            key: 'linkedQuiz',
            width: 200,
            render: (_: any, r: Reward) => {
                if (!r.linkedQuizName) {
                    return <Text type="secondary" style={{ fontSize: 13 }}>Chưa gắn quiz</Text>
                }
                return (
                    <div>
                        <div style={{ fontWeight: 500, color: '#1e293b', fontSize: 13 }}>{r.linkedQuizName}</div>
                        {r.linkedLevelName && (
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                                Level: {r.linkedLevelName}
                            </div>
                        )}
                    </div>
                )
            },
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            width: 130,
            render: (isActive: boolean, r: Reward) => (
                <Popconfirm
                    title={isActive ? 'Ẩn huy hiệu này?' : 'Hiện huy hiệu này?'}
                    description={isActive
                        ? 'Người chơi sẽ không thấy huy hiệu này nữa.'
                        : 'Người chơi sẽ thấy và có thể mở khóa huy hiệu này.'
                    }
                    onConfirm={() => handleToggle(r)}
                    okText={isActive ? 'Ẩn đi' : 'Hiện lên'}
                    cancelText="Hủy"
                    okButtonProps={{ danger: isActive }}
                >
                    <Tag
                        icon={isActive ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                        color={isActive ? 'success' : 'default'}
                        style={{ cursor: 'pointer' }}
                    >
                        {isActive ? 'Hiển thị' : 'Đang ẩn'}
                    </Tag>
                </Popconfirm>
            ),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 120,
            render: (date: string) => date ? new Date(date).toLocaleDateString('vi-VN') : 'N/A',
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: 120,
            align: 'center' as const,
            render: (_: any, r: Reward) => (
                <Space size="middle">
                    <Tooltip title="Chỉnh sửa">
                        <Button type="text" icon={<EditOutlined style={{ color: '#f59e0b', fontSize: 17 }} />}
                            onClick={() => openEdit(r)} />
                    </Tooltip>
                    <Tooltip title="Xóa">
                        <Popconfirm
                            title="Xóa huy hiệu này?"
                            description="Hành động này không thể hoàn tác."
                            onConfirm={() => handleDelete(r.id)}
                            okText="Xóa" cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                        >
                            <Button type="text" danger icon={<DeleteOutlined style={{ fontSize: 17 }} />} />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ]

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div style={{ padding: '24px' }}>
            {/* Header */}
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>

                <Button
                    icon={<PlusOutlined />}
                    onClick={openCreate}
                    style={{
                        borderRadius: 10, height: 44, fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(147,51,234,0.35)',
                        border: 'none',
                        background: 'linear-gradient(135deg, #9333ea, #7e22ce)',
                        color: 'white', paddingInline: 20,
                    }}
                >
                    Thêm huy hiệu
                </Button>
            </div>

            {/* Filter */}
            <div style={{ marginBottom: 20, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Input
                    placeholder="Tìm kiếm theo tên hoặc code..."
                    prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                    size="large"
                    style={{ width: 360, borderRadius: 10, height: 42 }}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                />
                <Tooltip title="Tải lại">
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={fetchRewards}
                        loading={loading}
                        style={{ borderRadius: 10, height: 42, width: 42, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    />
                </Tooltip>
            </div>

            {/* Table */}
            <Card style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
                <Table
                    columns={columns}
                    dataSource={filteredData}
                    rowKey="id"
                    scroll={{ x: 'max-content', y: 400 }}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        pageSizeOptions: ['5', '10', '20', '50'],
                        showTotal: (total) => `Tổng ${total} huy hiệu`,
                        style: { padding: '16px 24px' },
                    }}
                    loading={loading}
                    locale={{ emptyText: 'Chưa có dữ liệu' }}
                    size="large"
                />
            </Card>

            {/* Create / Edit Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600 }}>
                        <TrophyOutlined style={{ color: '#faad14' }} />
                        {editing ? 'Chỉnh sửa huy hiệu' : 'Tạo huy hiệu mới'}
                    </div>
                }
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
                width={560}
                destroyOnClose
            >
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="code"
                                label="Mã Code (unique)"
                                rules={[{ required: true, message: 'Nhập mã code' }]}
                            >
                                <Input placeholder="VD: LEARN_FIRST_LEVEL" style={{ fontFamily: 'monospace' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="name"
                                label="Tên hiển thị"
                                rules={[{ required: true, message: 'Nhập tên huy hiệu' }]}
                            >
                                <Input placeholder="VD: Bước Chân Đầu Tiên" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="description" label="Mô tả">
                        <TextArea rows={2} placeholder="Mô tả ngắn hiển thị cho người chơi..." />
                    </Form.Item>

                    <Form.Item label="Icon huy hiệu">
                        <Upload
                            listType="picture-card"
                            fileList={fileList}
                            beforeUpload={() => false}
                            onChange={({ fileList: newList }) => setFileList(newList.slice(-1))}
                            onRemove={() => { setFileList([]); form.setFieldsValue({ iconUrl: '' }) }}
                            accept="image/*"
                            maxCount={1}
                        >
                            {fileList.length === 0 && (
                                <div>
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8, fontSize: 12 }}>Upload</div>
                                </div>
                            )}
                        </Upload>
                        <Form.Item name="iconUrl" noStyle>
                            <Input type="hidden" />
                        </Form.Item>
                    </Form.Item>

                    <Form.Item name="isActive" label="Hiển thị với người chơi" valuePropName="checked">
                        <Switch checkedChildren="Hiện" unCheckedChildren="Ẩn" />
                    </Form.Item>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
                        <Button
                            onClick={() => setModalOpen(false)}
                            style={{ borderRadius: 8, height: 40, fontWeight: 500 }}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            loading={submitting}
                            style={{
                                borderRadius: 8, height: 40, fontWeight: 600,
                                border: 'none',
                                background: 'linear-gradient(135deg, #9333ea, #7e22ce)',
                                color: 'white',
                                boxShadow: '0 4px 12px rgba(147,51,234,0.25)',
                                paddingInline: 24,
                            }}
                        >
                            {editing ? 'Lưu thay đổi' : 'Tạo huy hiệu'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    )
}

export default RewardManagementPage
