import { useState, useEffect } from 'react'
import {
    Card, List, Button, Tag, Avatar, Modal, message,
    Tabs, Input, Descriptions, Rate, Spin, Timeline
} from 'antd'
import { Eye } from 'lucide-react'
import {
    CheckOutlined, CloseOutlined, FileTextOutlined,
    PlayCircleOutlined, SoundOutlined,
    HistoryOutlined, SyncOutlined
} from '@ant-design/icons'
import { adminService, type ReviewContentRequest } from '../services/adminService'
import DialectManagement from '../components/content/DialectManagement'
import LevelManagement from '../components/content/LevelManagement'
import ChallengeManagement from '../components/content/ChallengeManagement'
import ErrorTagManagement from '../components/content/ErrorTagManagement'
import SnapshotDiffRenderer from '../../../components/common/SnapshotDiffRenderer'

const ContentApprovalPage = () => {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [dialects, setDialects] = useState<any[]>([])
    const [errorTags, setErrorTags] = useState<any[]>([])

    // Detail Modal
    const [detailModalVisible, setDetailModalVisible] = useState(false)
    const [selectedItem, setSelectedItem] = useState<any>(null)

    // Reject Modal
    const [rejectModalVisible, setRejectModalVisible] = useState(false)
    const [rejectingItem, setRejectingItem] = useState<{ id: string, type: string } | null>(null)
    const [rejectionReason, setRejectionReason] = useState('')

    // History Modal
    const [historyModalVisible, setHistoryModalVisible] = useState(false)
    const [historyData, setHistoryData] = useState<any[]>([])
    const [historyLoading, setHistoryLoading] = useState(false)

    const openHistoryModal = async (id: string) => {
        setHistoryModalVisible(true)
        setHistoryLoading(true)
        try {
            const res: any = await adminService.getContentHistory(id)
            if (res.status === 'success' && res.data) {
                setHistoryData(res.data)
            } else {
                setHistoryData([])
            }
        } catch {
            message.error('Lỗi khi tải lịch sử duyệt')
            setHistoryData([])
        } finally {
            setHistoryLoading(false)
        }
    }

    const fetchApprovals = async () => {
        try {
            setLoading(true)
            const [levelsRes, challengesRes]: any[] = await Promise.all([
                adminService.getPendingLevels().catch(() => ({ status: 'error', data: [] })),
                adminService.getPendingChallenges().catch(() => ({ status: 'error', data: [] }))
            ])

            let unifiedData: any[] = []

            const levelsData = levelsRes?.data || (Array.isArray(levelsRes) ? levelsRes : []);
            const challengesData = challengesRes?.data || (Array.isArray(challengesRes) ? challengesRes : []);

            if (levelsData.length > 0) {
                unifiedData = [...unifiedData, ...levelsData.map((item: any) => ({
                    ...item,
                    type: 'level',
                    displayTitle: `Bài học: ${item.name || item.title}`,
                    submittedBy: item.createdBy || 'Educator',
                    date: new Date(item.createdAt || Date.now()).toLocaleDateString('vi-VN')
                }))]
            }

            if (challengesData.length > 0) {
                unifiedData = [...unifiedData, ...challengesData.map((item: any) => ({
                    ...item,
                    type: 'challenge',
                    displayTitle: `Bài tập (${item.type}): ${item.contentText}`,
                    submittedBy: item.createdBy || 'Educator',
                    date: new Date(item.createdAt || Date.now()).toLocaleDateString('vi-VN')
                }))]
            }

            setData(unifiedData)
        } catch (error) {
            console.error('Failed to fetch approvals:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const init = async () => {
            try {
                const [dialectsRes, errorTagsRes]: any[] = await Promise.all([
                    adminService.getDialects().catch(() => ({ status: 'error', data: [] })),
                    adminService.getErrorTags().catch(() => ({ status: 'error', data: [] })),
                ])
                const dialectsData = dialectsRes?.data || (Array.isArray(dialectsRes) ? dialectsRes : []);
                const errorTagsData = errorTagsRes?.data || (Array.isArray(errorTagsRes) ? errorTagsRes : []);

                if (dialectsData.length > 0) setDialects(dialectsData)
                if (errorTagsData.length > 0) setErrorTags(errorTagsData)
            } catch (_) { /* silent */ }
        }
        init()
        fetchApprovals()
    }, [])

    // --- Helpers ---
    const getDialectName = (item: any) => {
        if (item.dialect?.name) return item.dialect.name
        const found = dialects.find((d: any) => d.id === item.dialectId)
        return found ? found.name : item.dialectId || '—'
    }

    const getErrorTagName = (item: any) => {
        if (item.errorTag?.name) return item.errorTag.name
        const found = errorTags.find((t: any) => t.id === item.errorTagId)
        return found ? found.name : item.errorTagId || '—'
    }

    // --- Actions ---
    const handleApprove = (id: string, type: string) => {
        let comment = '';
        Modal.confirm({
            title: 'Phê duyệt nội dung này?',
            content: (
                <div className="mt-4">
                    <p className="text-gray-600 mb-2">Bạn có muốn để lại lời nhắn hoặc nhận xét cho Educator không? (Tùy chọn)</p>
                    <Input.TextArea
                        placeholder="Nhập ghi chú phê duyệt..."
                        rows={3}
                        maxLength={200}
                        showCount
                        onChange={(e) => { comment = e.target.value; }}
                    />
                </div>
            ),
            okText: 'Phê duyệt',
            cancelText: 'Hủy',
            okButtonProps: { className: 'bg-green-600 hover:bg-green-500 border-none rounded-lg' },
            onOk: async () => {
                try {
                    const payload: ReviewContentRequest = { status: 'APPROVED', comment: comment };
                    if (type === 'level') {
                        await adminService.reviewLevel(id, payload)
                    } else {
                        await adminService.reviewChallenge(id, payload)
                    }
                    message.success('Đã phê duyệt thành công!')
                    setDetailModalVisible(false)
                    fetchApprovals()
                } catch {
                    message.error('Lỗi khi phê duyệt')
                }
            }
        })
    }

    const handleRejectClick = (id: string, type: string) => {
        setRejectingItem({ id, type })
        setRejectionReason('')
        setRejectModalVisible(true)
    }

    const handleConfirmReject = async () => {
        if (!rejectingItem) return

        const trimmedReason = rejectionReason.trim();
        if (!trimmedReason) {
            message.warning('Vui lòng nhập lý do từ chối để Educator có thể sửa lại bài.');
            return;
        }
        if (trimmedReason.length > 200) {
            message.warning('Lý do từ chối không được vượt quá 200 ký tự.');
            return;
        }

        try {
            setLoading(true)
            const payload: ReviewContentRequest = {
                status: 'REJECTED',
                rejectionReason: rejectionReason, // Maintain for backward compatibility
                comment: rejectionReason        // New preferred field
            }
            if (rejectingItem.type === 'level') {
                await adminService.reviewLevel(rejectingItem.id, payload)
            } else {
                await adminService.reviewChallenge(rejectingItem.id, payload)
            }
            message.success('Đã từ chối nội dung.')
            setRejectModalVisible(false)
            setDetailModalVisible(false)
            fetchApprovals()
        } catch {
            message.error('Lỗi khi từ chối')
        } finally {
            setLoading(false)
        }
    }

    const handleViewDetail = (item: any) => {
        setSelectedItem(item)
        setDetailModalVisible(true)
    }

    // --- Detail Modal Content ---
    const renderDetailContent = () => {
        if (!selectedItem) return null

        if (selectedItem.type === 'level') {
            return (
                <Descriptions column={2} bordered size="small" className="mt-2">
                    <Descriptions.Item label="Tên bài học" span={2}>
                        <strong>{selectedItem.name || selectedItem.title || '—'}</strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="Mô tả" span={2}>
                        {selectedItem.description || '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Vùng miền">
                        <Tag color="blue">{getDialectName(selectedItem)}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Thứ tự">
                        {selectedItem.levelOrder ?? '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Sao tối thiểu">
                        <Rate disabled value={selectedItem.minStarsRequired ?? 0} count={5} />
                        <span className="ml-2 text-gray-500 text-sm">({selectedItem.minStarsRequired ?? 0}/5)</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngưỡng AI">
                        {selectedItem.aiThreshold != null ? `${selectedItem.aiThreshold}%` : '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Loại lỗi (Error Tag)">
                        {getErrorTagName(selectedItem) !== '—'
                            ? <Tag color="orange">{getErrorTagName(selectedItem)}</Tag>
                            : '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Audio URL">
                        {selectedItem.audioUrl
                            ? <a href={selectedItem.audioUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 flex items-center gap-1"><SoundOutlined /> Nghe thử</a>
                            : '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người tạo" span={2}>
                        {selectedItem.submittedBy || '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày gửi" span={2}>
                        {selectedItem.date || '—'}
                    </Descriptions.Item>
                </Descriptions>
            )
        }

        // challenge
        return (
            <Descriptions column={2} bordered size="small" className="mt-2">
                <Descriptions.Item label="Nội dung" span={2}>
                    <strong className="text-base">{selectedItem.contentText || '—'}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Loại thử thách">
                    <Tag color={selectedItem.type === 'WORD' ? 'blue' : selectedItem.type === 'SENTENCE' ? 'green' : 'purple'}>
                        {selectedItem.type}
                    </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Âm vị tập trung">
                    {selectedItem.focusPhonemes || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Phiên âm IPA" span={2}>
                    <code className="bg-gray-100 px-2 py-0.5 rounded text-blue-700 text-sm">
                        {selectedItem.phoneticTranscriptionIpa || '—'}
                    </code>
                </Descriptions.Item>
                <Descriptions.Item label="Reference Audio" span={2}>
                    {selectedItem.referenceAudioUrl
                        ? <a href={selectedItem.referenceAudioUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 flex items-center gap-1"><SoundOutlined /> Nghe thử</a>
                        : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Người tạo">
                    {selectedItem.submittedBy || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày gửi">
                    {selectedItem.date || '—'}
                </Descriptions.Item>
            </Descriptions>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Nội dung</h2>
                <Button
                    type="primary"
                    icon={<SyncOutlined />}
                    onClick={fetchApprovals}
                    loading={loading}
                    className="bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center justify-center shadow-md font-medium"
                >
                    Làm mới danh sách
                </Button>
            </div>

            <Card variant="borderless" className="shadow-sm rounded-xl">
                <Tabs defaultActiveKey="1" items={[
                    {
                        key: '1',
                        label: 'Chờ phê duyệt',
                        children: (
                            <List
                                className="content-approval-list"
                                itemLayout="horizontal"
                                dataSource={data}
                                loading={loading}
                                locale={{ emptyText: 'Không có nội dung chờ phê duyệt' }}
                                renderItem={(item: any) => (
                                    <List.Item
                                        actions={[
                                            <Button
                                                key="history"
                                                icon={<HistoryOutlined />}
                                                onClick={() => openHistoryModal(item.originalId || item.parentId || item.id)}
                                                className="rounded-lg border-gray-200 text-gray-600 hover:border-gray-800 hover:text-gray-800"
                                            >
                                                Lịch sử
                                            </Button>,
                                            <Button
                                                key="view"
                                                icon={<Eye size={18} />}
                                                onClick={() => handleViewDetail(item)}
                                                className="flex items-center justify-center rounded-lg border-blue-200 text-blue-600 hover:border-blue-500 hover:text-blue-500"
                                            >
                                                Xem chi tiết
                                            </Button>,
                                            <Button
                                                key="approve"
                                                type="primary"
                                                icon={<CheckOutlined />}
                                                className="bg-green-600 hover:bg-green-500 border-none rounded-lg"
                                                onClick={() => handleApprove(item.id, item.type)}
                                            >
                                                Duyệt
                                            </Button>,
                                            <Button
                                                key="reject"
                                                danger
                                                type="primary"
                                                icon={<CloseOutlined />}
                                                className="bg-red-600 hover:bg-red-500 border-none rounded-lg"
                                                onClick={() => handleRejectClick(item.id, item.type)}
                                            >
                                                Từ chối
                                            </Button>
                                        ]}
                                    >
                                        <List.Item.Meta
                                            avatar={
                                                <Avatar
                                                    size={48}
                                                    icon={item.type === 'level' ? <FileTextOutlined /> : <PlayCircleOutlined />}
                                                    className={item.type === 'level' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}
                                                />
                                            }
                                            title={<span className="text-lg font-medium text-gray-800">{item.displayTitle}</span>}
                                            description={
                                                <div className="space-y-1">
                                                    <div>
                                                        <span className="text-gray-500">Người gửi: </span>
                                                        <span className="font-semibold text-gray-700">{item.submittedBy}</span>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <Tag color={item.type === 'level' ? 'blue' : 'orange'}>{item.type.toUpperCase()}</Tag>
                                                        <span className="text-gray-400">{item.date}</span>
                                                    </div>
                                                </div>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        )
                    },
                    {
                        key: '2',
                        label: 'Vùng miền (Dialects)',
                        children: <DialectManagement />
                    },
                    {
                        key: '3',
                        label: 'Cấp độ (Levels)',
                        children: <LevelManagement />
                    },
                    {
                        key: '4',
                        label: 'Thử thách (Challenges)',
                        children: <ChallengeManagement />
                    },
                    {
                        key: '5',
                        label: 'Lỗi phát âm (Error Tags)',
                        children: <ErrorTagManagement />
                    }
                ]} />
            </Card>

            {/* ===== Detail Modal ===== */}
            <Modal
                title={
                    <div className="flex items-center gap-3">
                        <Avatar
                            size={36}
                            icon={selectedItem?.type === 'level' ? <FileTextOutlined /> : <PlayCircleOutlined />}
                            className={selectedItem?.type === 'level' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}
                        />
                        <div>
                            <div className="font-semibold text-gray-800">
                                {selectedItem?.type === 'level' ? 'Chi tiết bài học' : 'Chi tiết bài tập'}
                            </div>
                            <div className="text-xs text-gray-400 font-normal">
                                {selectedItem?.displayTitle}
                            </div>
                        </div>
                    </div>
                }
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                width={680}
                footer={
                    <div className="flex justify-between items-center">
                        <Button onClick={() => setDetailModalVisible(false)} className="rounded-lg h-9 px-5">
                            Đóng
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                danger
                                type="primary"
                                icon={<CloseOutlined />}
                                className="bg-red-600 hover:bg-red-500 border-none rounded-lg h-9"
                                onClick={() => {
                                    setDetailModalVisible(false)
                                    if (selectedItem) handleRejectClick(selectedItem.id, selectedItem.type)
                                }}
                            >
                                Từ chối
                            </Button>
                            <Button
                                type="primary"
                                icon={<CheckOutlined />}
                                className="bg-green-600 hover:bg-green-500 border-none rounded-lg h-9"
                                onClick={() => {
                                    if (selectedItem) handleApprove(selectedItem.id, selectedItem.type)
                                }}
                            >
                                Phê duyệt
                            </Button>
                        </div>
                    </div>
                }
            >
                {renderDetailContent()}
            </Modal>

            {/* ===== Reject Modal ===== */}
            <Modal
                title="Từ chối nội dung"
                open={rejectModalVisible}
                onOk={handleConfirmReject}
                onCancel={() => setRejectModalVisible(false)}
                okText="Xác nhận từ chối"
                cancelText="Hủy"
                okButtonProps={{
                    danger: true,
                    loading: loading,
                    className: "bg-red-600 hover:bg-red-500 border-none rounded-lg h-9"
                }}
                cancelButtonProps={{
                    className: "rounded-lg h-9"
                }}
            >
                <div className="mb-4">
                    <p className="text-gray-600 mb-2">Vui lòng cung cấp lý do từ chối để Educator có thể chỉnh sửa lại nội dung này.</p>
                    <Input.TextArea
                        rows={4}
                        placeholder="Nhập lý do từ chối..."
                        value={rejectionReason}
                        maxLength={200}
                        showCount
                        onChange={(e) => setRejectionReason(e.target.value)}
                    />
                </div>
            </Modal>

            {/* ===== History Modal ===== */}
            <Modal
                title="Lịch sử phê duyệt"
                open={historyModalVisible}
                onCancel={() => setHistoryModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setHistoryModalVisible(false)}>
                        Đóng
                    </Button>
                ]}
                centered
                width={600}
            >
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {historyLoading ? (
                        <div className="text-center py-6">
                            <Spin />
                        </div>
                    ) : historyData && historyData.length > 0 ? (
                        <Timeline
                            items={historyData.map((item: any, index: number) => {
                                const oldSnapshot = index < historyData.length - 1 ? historyData[index + 1].contentSnapshot : null;
                                const newSnapshot = item.contentSnapshot;
                                return {
                                    color: item.status === 'APPROVED' ? 'green' : item.status === 'REJECTED' ? 'red' : 'blue',
                                    children: (
                                        <div className="mb-2 w-full max-w-full overflow-hidden">
                                            <div className="font-semibold text-gray-800 flex items-center justify-between">
                                                {item.status === 'APPROVED' ? (
                                                    <span className="text-green-600">Đã phê duyệt</span>
                                                ) : item.status === 'REJECTED' ? (
                                                    <span className="text-red-600">bị từ chối</span>
                                                ) : (
                                                    <span className="text-blue-600">{item.status}</span>
                                                )}
                                                <span className="text-xs text-gray-400 font-normal pr-2">
                                                    {new Date(item.createdAt).toLocaleString('vi-VN')}
                                                </span>
                                            </div>
                                            {item.comment && (
                                                <div className="text-sm bg-gray-50 p-2 rounded mt-1 text-gray-700">
                                                    {item.comment}
                                                </div>
                                            )}
                                            <div className="text-xs text-gray-400 mt-1">
                                                Bởi: {item.createdBy || 'Admin'}
                                            </div>
                                            <SnapshotDiffRenderer
                                                oldSnapshot={oldSnapshot}
                                                newSnapshot={newSnapshot}
                                                contentType={item.contentType}
                                            />
                                        </div>
                                    )
                                };
                            })}
                        />
                    ) : (
                        <div className="text-center py-6 text-gray-400">
                            Không có lịch sử phê duyệt cho nội dung này.
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    )
}

export default ContentApprovalPage
