import React, { useState, useEffect, useCallback } from 'react'
import {
    Table, Button, Modal, Form, Input, Select, Switch, Tag, Space,
    Tooltip, Popconfirm, message, Typography, Card,
    Drawer, Row, Col, Divider, Upload
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, TrophyOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../../../firebase'
import rewardService from '../services/rewardService'

const { Text } = Typography
const { TextArea } = Input
const { Option } = Select


interface Reward {
    id: string
    code: string
    name: string
    description: string
    category: string
    iconUrl: string
    criteriaJson: string
    isActive: boolean
    createdAt: string
    updatedAt: string
}

interface CriteriaData {
    type?: string
    threshold?: number
    region?: string
    level?: string
    pair?: string
    game?: string
    max_rank?: number
    from?: number
    to?: number
    [key: string]: unknown
}


// ─── Định nghĩa các loại criteria trigger ──────────────────────────────────
const CRITERIA_TYPES = [
    { value: 'levels_completed', label: 'Số màn đã hoàn thành' },
    { value: 'region_completed', label: 'Hoàn thành 1 vùng miền' },
    { value: 'all_regions_completed', label: 'Hoàn thành tất cả vùng' },
    { value: 'difficulty_completed', label: 'Hoàn thành độ khó' },
    { value: 'three_star_count', label: 'Số lần đạt 3 sao' },
    { value: 'all_levels_three_star', label: 'Tất cả màn đạt 3 sao' },
    { value: 'fail_then_pass_same_level', label: 'Thua rồi thắng cùng màn' },
    { value: 'pronunciation_level_passed', label: 'Màn phát âm passed' },
    { value: 'phoneme_accuracy', label: 'Độ chính xác phụ âm (%)' },
    { value: 'all_phoneme_pairs_mastered', label: 'Thành thạo tất cả phụ âm' },
    { value: 'tone_accuracy', label: 'Độ chính xác thanh điệu (%)' },
    { value: 'perfect_pronunciation_session', label: 'Phiên phát âm hoàn hảo' },
    { value: 'entry_test_completed', label: 'Hoàn thành bài kiểm tra đầu vào' },
    { value: 'fast_pronunciation_count', label: 'Phát âm nhanh (<3s)' },
    { value: 'minigame_played', label: 'Số lần chơi mini-game' },
    { value: 'minigame_type_played', label: 'Chơi loại mini-game cụ thể' },
    { value: 'reading_saga_completed', label: 'Hoàn thành Saga Đọc' },
    { value: 'writing_levels_completed', label: 'Màn Viết hoàn thành' },
    { value: 'mario_levels_completed', label: 'Màn Mario hoàn thành' },
    { value: 'all_minigame_types_played', label: 'Đã chơi tất cả loại game' },
    { value: 'minigame_perfect_score', label: 'Điểm tuyệt đối mini-game' },
    { value: 'total_stars', label: 'Tổng số sao tích lũy' },
    { value: 'perfect_score_count', label: 'Số lần đạt điểm tuyệt đối' },
    { value: 'friend_count', label: 'Số bạn bè' },
    { value: 'leaderboard_rank', label: 'Thứ hạng bảng xếp hạng' },
    { value: 'study_hour_range', label: 'Học trong khung giờ đặc biệt' },
]

const CATEGORIES = ['LEARNING', 'PRONUNCIATION', 'MINI_GAMES', 'SCORE', 'SOCIAL', 'SPECIAL']
const CATEGORY_COLORS: Record<string, string> = {
    LEARNING: 'blue', PRONUNCIATION: 'purple', MINI_GAMES: 'green',
    SCORE: 'gold', SOCIAL: 'cyan', SPECIAL: 'magenta',
    GENERAL: 'default', CHALLENGE: 'orange'
}
const CATEGORY_LABELS: Record<string, string> = {
    LEARNING: 'Học tập', PRONUNCIATION: 'Phát âm', MINI_GAMES: 'Mini-games',
    SCORE: 'Điểm số', SOCIAL: 'Xã hội', SPECIAL: 'Đặc biệt',
    GENERAL: 'Chung', CHALLENGE: 'Thử thách'
}

/**
 * Ánh xạ Danh mục → danh sách loại tiêu chí cho phép
 * Khi người dùng chọn Danh mục, chỉ hiển thị các tiêu chí liên quan.
 */
const CATEGORY_CRITERIA_MAP: Record<string, string[]> = {
    LEARNING: [
        'levels_completed',         // Số màn hoàn thành
        'region_completed',          // Hoàn thành 1 vùng miền
        'all_regions_completed',     // Hoàn thành tất cả vùng
        'difficulty_completed',      // Hoàn thành độ khó
        'three_star_count',          // Số lần đạt 3 sao
        'all_levels_three_star',     // Tất cả màn đạt 3 sao
        'fail_then_pass_same_level', // Thua rồi thắng cùng màn
    ],
    PRONUNCIATION: [
        'pronunciation_level_passed',    // Màn phát âm passed
        'phoneme_accuracy',              // Độ chính xác phụ âm
        'all_phoneme_pairs_mastered',    // Thành thạo tất cả phụ âm
        'tone_accuracy',                // Độ chính xác thanh điệu
        'perfect_pronunciation_session', // Phiên phát âm hoàn hảo
        'entry_test_completed',          // Kiểm tra đầu vào
        'fast_pronunciation_count',      // Phát âm nhanh
    ],
    MINI_GAMES: [
        'minigame_played',           // Số lần chơi mini-game
        'minigame_type_played',      // Chơi loại mini-game cụ thể
        'reading_saga_completed',    // Hoàn thành Saga Đọc
        'writing_levels_completed',  // Màn Viết hoàn thành
        'mario_levels_completed',    // Màn Mario hoàn thành
        'all_minigame_types_played', // Đã chơi tất cả loại game
        'minigame_perfect_score',    // Điểm tuyệt đối mini-game
    ],
    SCORE: [
        'total_stars',         // Tổng số sao tích lũy
        'perfect_score_count', // Số lần đạt điểm tuyệt đối
    ],
    SOCIAL: [
        'friend_count',        // Số bạn bè
        'leaderboard_rank',    // Thứ hạng bảng xếp hạng
    ],
    SPECIAL: [
        'study_hour_range',    // Học trong khung giờ đặc biệt
    ],
}

// ─── Helper: Build criteriaJson từ form ─────────────────────────────────────
const buildCriteriaJson = (type: string, fields: Record<string, unknown>): string => {
    const base = { type }
    switch (type) {
        case 'levels_completed':
        case 'three_star_count':
        case 'fail_then_pass_same_level':
        case 'pronunciation_level_passed':
        case 'perfect_pronunciation_session':
        case 'minigame_played':
        case 'writing_levels_completed':
        case 'mario_levels_completed':
        case 'minigame_perfect_score':
        case 'total_stars':
        case 'perfect_score_count':
        case 'friend_count':
            return JSON.stringify({ ...base, threshold: Number(fields.threshold) })
        case 'region_completed':
            return JSON.stringify({ ...base, region: fields.region })
        case 'difficulty_completed':
            return JSON.stringify({ ...base, level: fields.level })
        case 'phoneme_accuracy':
            return JSON.stringify({ ...base, pair: fields.pair, threshold: Number(fields.threshold) })
        case 'tone_accuracy':
            return JSON.stringify({ ...base, threshold: Number(fields.threshold) })
        case 'fast_pronunciation_count':
            return JSON.stringify({ ...base, ms_limit: 3000, threshold: Number(fields.threshold) })
        case 'minigame_type_played':
            return JSON.stringify({ ...base, game: fields.game, threshold: Number(fields.threshold || 1) })
        case 'leaderboard_rank':
            return JSON.stringify({ ...base, max_rank: Number(fields.max_rank) })
        case 'study_hour_range':
            return JSON.stringify({ ...base, from: Number(fields.from), to: Number(fields.to), threshold: Number(fields.threshold) })
        case 'all_regions_completed':
        case 'all_levels_three_star':
        case 'all_phoneme_pairs_mastered':
        case 'entry_test_completed':
        case 'reading_saga_completed':
        case 'all_minigame_types_played':
            return JSON.stringify(base)
        default:
            return JSON.stringify(base)
    }
}

// ─── Helper: Parse criteriaJson để fill form ────────────────────────────────────
const parseCriteriaJson = (json: string): CriteriaData => {
    try { return JSON.parse(json) } catch { return {} }
}

// ─── Helper: Format criteria thành tiếng Việt dễ hiểu ───────────────────────────
type CriteriaDisplay = { icon: string; label: string; detail: string; fullText: string }

const formatCriteria = (parsed: CriteriaData): CriteriaDisplay => {
    const t = parsed.threshold
    const r = parsed.region
    const g = parsed.game
    const l = parsed.level
    switch (parsed.type) {
        // LEARNING
        case 'levels_completed':
            return { icon: '🗺️', label: 'Hoàn thành màn', detail: `≥ ${t} màn học`, fullText: `Người chơi phải hoàn thành ít nhất ${t} màn học` }
        case 'region_completed':
            return { icon: '🏴', label: 'Hoàn thành vùng', detail: `Vùng ${r}`, fullText: `Hoàn thành toàn bộ màn thuộc vùng ${r}` }
        case 'all_regions_completed':
            return { icon: '🇺🇳', label: 'Cả 3 vùng miền', detail: 'Bắc + Trung + Nam', fullText: 'Hoàn thành tất cả vùng miền (Bắc, Trung, Nam)' }
        case 'difficulty_completed':
            return { icon: '💪', label: 'Độ khó học', detail: `Độ ${l || ''}`, fullText: `Hoàn thành tất cả màn ở độ khó ${l || ''}` }
        case 'three_star_count':
            return { icon: '⭐', label: '3 Sao', detail: `≥ ${t} lần`, fullText: `Đạt ít nhất ${t} lần 3 sao trong bất kỳ màn nào` }
        case 'all_levels_three_star':
            return { icon: '🌟', label: 'Tất cả 3 sao', detail: 'Mọi màn', fullText: 'Mọi màn đếu phải đạt 3 sao' }
        case 'fail_then_pass_same_level':
            return { icon: '🔄', label: 'Kiên trì', detail: 'Thua → Thắng', fullText: 'Thua một màn rồi sau đó thắng lại chính màn đó' }
        // PRONUNCIATION
        case 'pronunciation_level_passed':
            return { icon: '🎤', label: 'Màn phát âm', detail: `≥ ${t} màn`, fullText: `Vượt qua ít nhất ${t} màn phát âm` }
        case 'phoneme_accuracy':
            return { icon: '🔊', label: 'Chính xác phụ âm', detail: `≥ ${t}%`, fullText: `Đạt độ chính xác ≥ ${t}% khi luyện phụ âm` }
        case 'all_phoneme_pairs_mastered':
            return { icon: '🎯', label: 'Thành thạo phụ âm', detail: 'Tất cả', fullText: 'Thành thạo toàn bộ cặp phụ âm trong hệ thống' }
        case 'tone_accuracy':
            return { icon: '🎧', label: 'Chính xác thanh điệu', detail: `≥ ${t}%`, fullText: `Đạt độ chính xác ≥ ${t}% khi luyện thanh điệu` }
        case 'perfect_pronunciation_session':
            return { icon: '💎', label: 'Phiên hoàn hảo', detail: `≥ ${t} phiên`, fullText: `Hoàn thành ít nhất ${t} phiên phát âm 100%` }
        case 'entry_test_completed':
            return { icon: '📝', label: 'Kiểm tra đầu vào', detail: 'Hoàn thành', fullText: 'Hoàn thành bài kiểm tra phát âm đầu vào' }
        case 'fast_pronunciation_count':
            return { icon: '⚡', label: 'Phát âm nhanh', detail: `≥ ${t} lần`, fullText: `Phát âm chính xác trong < 3 giây ít nhất ${t} lần` }
        // MINI-GAMES
        case 'minigame_played':
            return { icon: '🎮', label: 'Chơi mini-game', detail: `≥ ${t} lần`, fullText: `Chơi mini-game ít nhất ${t} lần` }
        case 'minigame_type_played':
            return { icon: '🎲', label: `Game ${g || ''}`, detail: `≥ ${t} lần`, fullText: `Chơi mini-game loại ${g} ít nhất ${t} lần` }
        case 'reading_saga_completed':
            return { icon: '📖', label: 'Saga Đọc', detail: 'Hoàn thành', fullText: 'Hoàn thành toàn bộ màn Saga Đọc' }
        case 'writing_levels_completed':
            return { icon: '✏️', label: 'Màn Viết', detail: `≥ ${t} màn`, fullText: `Hoàn thành ít nhất ${t} màn luyện Viết` }
        case 'mario_levels_completed':
            return { icon: '🍄', label: 'Màn Mario', detail: `≥ ${t} màn`, fullText: `Hoàn thành ít nhất ${t} màn Mario` }
        case 'all_minigame_types_played':
            return { icon: '🇺🇳', label: 'Đủ loại game', detail: 'Tất cả', fullText: 'Đã chơi qua tất cả các loại mini-game' }
        case 'minigame_perfect_score':
            return { icon: '💥', label: 'Điểm tuyệt đối', detail: `≥ ${t} lần`, fullText: `Đạt điểm tuyệt đối trong mini-game ít nhất ${t} lần` }
        // SCORE
        case 'total_stars':
            return { icon: '🌟', label: 'Tích lũy sao', detail: `≥ ${t} ⭐`, fullText: `Tích lũy tổng cộng ít nhất ${t} sao` }
        case 'perfect_score_count':
            return { icon: '🏆', label: 'Điểm tuyệt đối', detail: `≥ ${t} lần`, fullText: `Đạt điểm tuyệt đối 100% ít nhất ${t} lần` }
        // SOCIAL
        case 'friend_count':
            return { icon: '👥', label: 'Bạn bè', detail: `≥ ${t} người`, fullText: `Có ít nhất ${t} bạn bè trong ứng dụng` }
        case 'leaderboard_rank':
            return { icon: '🥇', label: 'Xếp hạng', detail: `Top ${parsed.max_rank}`, fullText: `Lọc vào top ${parsed.max_rank} bảng xếp hạng` }
        // SPECIAL
        case 'study_hour_range':
            return { icon: '🌙', label: 'Khung giờ', detail: `${parsed.from}h–${parsed.to}h (≥${t}×)`, fullText: `Học ít nhất ${t} lần trong khung giờ ${parsed.from}h–${parsed.to}h` }
        default:
            return { icon: '❓', label: parsed.type || '—', detail: '', fullText: 'Chưa xác định' }
    }
}

// ─── Dynamic Criteria Fields ─────────────────────────────────────────────────
const CriteriaFields = ({ criteriaType }: { criteriaType: string | null }) => {
    if (!criteriaType) return null
    const needsThreshold = [
        'levels_completed', 'three_star_count', 'fail_then_pass_same_level',
        'pronunciation_level_passed', 'perfect_pronunciation_session', 'minigame_played',
        'writing_levels_completed', 'mario_levels_completed', 'minigame_perfect_score',
        'total_stars', 'perfect_score_count', 'friend_count', 'tone_accuracy',
        'fast_pronunciation_count',
    ]
    const noFields = [
        'all_regions_completed', 'all_levels_three_star', 'all_phoneme_pairs_mastered',
        'entry_test_completed', 'reading_saga_completed', 'all_minigame_types_played',
    ]
    if (noFields.includes(criteriaType)) {
        return <Text type="secondary" className="text-xs">Không cần thêm tham số</Text>
    }
    return (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 space-y-3">
            {needsThreshold.includes(criteriaType) && (
                <Form.Item name="threshold" label="Ngưỡng (threshold)" rules={[{ required: true }]}>
                    <Input type="number" min={1} placeholder="VD: 5" />
                </Form.Item>
            )}
            {criteriaType === 'region_completed' && (
                <Form.Item name="region" label="Vùng miền" rules={[{ required: true }]}>
                    <Select placeholder="Chọn vùng">
                        <Option value="NORTH">🔵 Vùng Bắc</Option>
                        <Option value="CENTRAL">🟡 Vùng Trung</Option>
                        <Option value="SOUTH">🔴 Vùng Nam</Option>
                    </Select>
                </Form.Item>
            )}
            {criteriaType === 'difficulty_completed' && (
                <Form.Item name="level" label="Độ khó" rules={[{ required: true }]}>
                    <Select>
                        <Option value="BEGINNER">Sơ cấp</Option>
                        <Option value="INTERMEDIATE">Trung cấp</Option>
                        <Option value="ADVANCED">Cao cấp</Option>
                    </Select>
                </Form.Item>
            )}
            {criteriaType === 'phoneme_accuracy' && (
                <>
                    <Form.Item name="pair" label="Cặp phụ âm" rules={[{ required: true }]}>
                        <Select>
                            <Option value="N_L">N/L</Option>
                            <Option value="S_X">S/X</Option>
                            <Option value="D_GI_R">D/GI/R</Option>
                            <Option value="TR_CH">TR/CH</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="threshold" label="Ngưỡng chính xác (%)" rules={[{ required: true }]}>
                        <Input type="number" min={1} max={100} placeholder="VD: 90" />
                    </Form.Item>
                </>
            )}
            {criteriaType === 'minigame_type_played' && (
                <>
                    <Form.Item name="game" label="Loại mini-game" rules={[{ required: true }]}>
                        <Select>
                            <Option value="READING">📖 Reading</Option>
                            <Option value="WRITING">✏️ Writing</Option>
                            <Option value="MARIO">🍄 Mario</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="threshold" label="Số lần" rules={[{ required: true }]}>
                        <Input type="number" min={1} placeholder="VD: 1" />
                    </Form.Item>
                </>
            )}
            {criteriaType === 'leaderboard_rank' && (
                <Form.Item name="max_rank" label="Top (max rank)" rules={[{ required: true }]}>
                    <Input type="number" min={1} placeholder="VD: 10" />
                </Form.Item>
            )}
            {criteriaType === 'study_hour_range' && (
                <>
                    <Row gutter={8}>
                        <Col span={12}>
                            <Form.Item name="from" label="Từ giờ" rules={[{ required: true }]}>
                                <Input type="number" min={0} max={23} placeholder="VD: 5" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="to" label="Đến giờ" rules={[{ required: true }]}>
                                <Input type="number" min={0} max={23} placeholder="VD: 8" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="threshold" label="Số lần tối thiểu" rules={[{ required: true }]}>
                        <Input type="number" min={1} placeholder="VD: 10" />
                    </Form.Item>
                </>
            )}
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const RewardManagementPage = () => {
    const [rewards, setRewards] = useState<Reward[]>([])
    const [loading, setLoading] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState<Reward | null>(null)
    const [detailDrawer, setDetailDrawer] = useState<Reward | null>(null)
    const [criteriaType, setCriteriaType] = useState<string | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [fileList, setFileList] = useState<any[]>([])
    const [uploading, setUploading] = useState(false)
    const [form] = Form.useForm()

    const fetchRewards = useCallback(async () => {
        setLoading(true)
        try {
            const res = await rewardService.getAll()
            setRewards(res?.data || [])
        } catch {
            message.error('Không thể tải danh sách hùy hiệu')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchRewards() }, [fetchRewards])

    const openCreate = () => {
        setEditing(null)
        form.resetFields()
        setCriteriaType(null)
        setSelectedCategory(null)
        setFileList([])
        setModalOpen(true)
    }

    const openEdit = (record: Reward) => {
        setEditing(record)
        setSelectedCategory(record.category)
        const parsed = parseCriteriaJson(record.criteriaJson)
        setCriteriaType(parsed.type || null)
        form.setFieldsValue({
            code: record.code,
            name: record.name,
            description: record.description,
            category: record.category,
            iconUrl: record.iconUrl,
            isActive: record.isActive,
            criteriaType: parsed.type,
            threshold: parsed.threshold,
            region: parsed.region,
            level: parsed.level,
            pair: parsed.pair,
            game: parsed.game,
            max_rank: parsed.max_rank,
            from: parsed.from,
            to: parsed.to,
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
            setUploading(true)

            // 1. Handle File Upload if exists
            let finalIconUrl = values.iconUrl || ''
            const file = fileList[0]?.originFileObj
            if (file) {
                const storageRef = ref(storage, `badges/${Date.now()}_${file.name}`)
                const snapshot = await uploadBytes(storageRef, file)
                finalIconUrl = await getDownloadURL(snapshot.ref)
            }

            // 2. Build Payload
            const criteriaJson = buildCriteriaJson(values.criteriaType, values)
            const payload = {
                code: values.code,
                name: values.name,
                description: values.description,
                category: values.category,
                iconUrl: finalIconUrl,
                criteriaJson,
                isActive: values.isActive ?? true,
            }

            if (editing) {
                await rewardService.update(editing.id, payload)
                message.success('Cập nhật hùy hiệu thành công!')
            } else {
                await rewardService.create(payload)
                message.success('Tạo hùy hiệu thành công!')
            }
            setModalOpen(false)
            fetchRewards()
        } catch (err: any) {
            if (err?.errorFields) return
            message.error(err?.message || 'Có lỗi xảy ra')
        } finally {
            setUploading(false)
        }
    }

    const handleToggle = async (record: Reward) => {
        try {
            await rewardService.toggleActive(record.id)
            message.success(`Đã ${record.isActive ? 'ẩn' : 'kích hoạt'} huy hiệu`)
            fetchRewards()
        } catch {
            message.error('Không thể cập nhật trạng thái')
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await rewardService.delete(id)
            message.success('Đã xóa phần thưởng')
            fetchRewards()
        } catch {
            message.error('Không thể xóa phần thưởng')
        }
    }

    const filtered = rewards.filter((r: Reward) => {
        const matchText = r.name?.toLowerCase().includes(searchText.toLowerCase()) ||
            r.code?.toLowerCase().includes(searchText.toLowerCase())
        const matchCat = categoryFilter === 'ALL' || r.category === categoryFilter
        return matchText && matchCat
    })

    const columns = [
        {
            title: 'Huy hiệu',
            key: 'badge',
            width: 300,
            render: (_: unknown, r: Reward) => (
                <div className="flex items-center gap-3">
                    <div style={{
                        width: 48, height: 48, borderRadius: 14, padding: 3,
                        background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                        flexShrink: 0, boxShadow: '0 2px 8px rgba(245,158,11,0.4)'
                    }}>
                        <div style={{
                            width: '100%', height: '100%', borderRadius: 11,
                            background: '#fff', overflow: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {r.iconUrl ? (
                                <img
                                    src={r.iconUrl}
                                    alt={r.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                        const parent = target.parentElement
                                        if (parent) { parent.style.background = 'linear-gradient(135deg,#f59e0b,#f97316)'; parent.innerHTML = '<span style="font-size:22px">🏆</span>' }
                                    }}
                                />
                            ) : (
                                <TrophyOutlined style={{ color: '#f97316', fontSize: 24 }} />
                            )}
                        </div>
                    </div>
                    <div>
                        <div className="font-semibold text-gray-800 text-sm">{r.name}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">{r.code}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Danh mục',
            dataIndex: 'category',
            width: 150,
            render: (v: string) => (
                <Tag color={CATEGORY_COLORS[v] || 'default'}>
                    {CATEGORY_LABELS[v] || v || '—'}
                </Tag>
            ),
        },
        {
            title: 'Tiêu chí mở khóa',
            dataIndex: 'criteriaJson',
            width: 200,
            render: (v: string) => {
                const parsed = parseCriteriaJson(v)
                const { icon, label, detail, fullText } = formatCriteria(parsed)
                return (
                    <Tooltip
                        title={
                            <div>
                                <div style={{ fontWeight: 600, marginBottom: 4 }}>{icon} {label}</div>
                                <div style={{ fontSize: 12, opacity: 0.85 }}>{fullText}</div>
                                <div style={{ fontSize: 10, marginTop: 6, opacity: 0.5, fontFamily: 'monospace' }}>
                                    {v}
                                </div>
                            </div>
                        }
                        color="#1e1b4b"
                    >
                        <div style={{ cursor: 'help' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ fontSize: 14 }}>{icon}</span>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#312e81' }}>{label}</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1, paddingLeft: 19 }}>{detail}</div>
                        </div>
                    </Tooltip>
                )
            },
        },
        {
            title: 'Hiển thị',
            dataIndex: 'isActive',
            width: 130,
            render: (v: boolean, r: Reward) => (
                <Tooltip
                    title={v
                        ? 'Huy hiệu đang hiển thị với người chơi. Click để ẩn đi.'
                        : 'Huy hiệu đang bị ẩn, người chơi không thấy. Click để hiển thị.'
                    }
                >
                    <Popconfirm
                        title={v ? 'Ẩn huy hiệu này?' : 'Hiện huy hiệu này?'}
                        description={v
                            ? 'Người chơi sẽ không thấy huy hiệu này nữa.'
                            : 'Người chơi sẽ thấy và có thể mở khóa huy hiệu này.'
                        }
                        onConfirm={() => handleToggle(r)}
                        okText={v ? 'Ẩn đi' : 'Hiện lên'}
                        cancelText="Hủy"
                        okButtonProps={{ danger: v }}
                    >
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '4px 10px', borderRadius: 20, cursor: 'pointer',
                            border: `1.5px solid ${v ? '#86efac' : '#d1d5db'}`,
                            background: v ? '#f0fdf4' : '#f9fafb',
                            transition: 'all 0.2s',
                            userSelect: 'none',
                        }}>
                            <div style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: v ? '#22c55e' : '#9ca3af',
                                boxShadow: v ? '0 0 6px rgba(34,197,94,0.6)' : 'none',
                            }} />
                            <span style={{
                                fontSize: 12, fontWeight: 600,
                                color: v ? '#16a34a' : '#6b7280'
                            }}>
                                {v ? 'Hiển thị' : 'Đang ẩn'}
                            </span>
                        </div>
                    </Popconfirm>
                </Tooltip>
            ),
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: 120,
            render: (_: unknown, r: Reward) => (
                <Space size={4}>
                    <Tooltip title="Xem chi tiết">
                        <Button type="text" size="small" icon={<EyeOutlined />}
                            onClick={() => setDetailDrawer(r)} />
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                        <Button type="text" size="small" icon={<EditOutlined />}
                            onClick={() => openEdit(r)} />
                    </Tooltip>
                    <Tooltip title="Xóa vĩnh viễn">
                        <Popconfirm
                            title="Xóa hùy hiệu này?"
                            description="Hành động này không thể hoàn tác."
                            onConfirm={() => handleDelete(r.id)}
                            okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}
                        >
                            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ]

    const stats = {
        total: rewards.length,
        active: rewards.filter((r: Reward) => r.isActive).length,
        categories: [...new Set(rewards.map((r: Reward) => r.category))].length,
    }

    return (
        <div className="space-y-4">
            {/* ── Compact Header Bar ─────────────────────────────────────────── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#fff', borderRadius: 16, padding: '14px 20px',
                boxShadow: '0 1px 6px rgba(0,0,0,0.07)', gap: 12
            }}>
                {/* Left: title + stats chips */}
                <div className="flex items-center gap-4 flex-wrap flex-1 min-w-0">
                    <div className="flex items-center gap-2 shrink-0">
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'linear-gradient(135deg,#f59e0b,#f97316)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <TrophyOutlined style={{ color: '#fff', fontSize: 18 }} />
                        </div>
                        <div>
                            <div className="font-bold text-gray-800 text-base leading-tight">Quản lý Huy hiệu</div>
                            <div className="text-xs text-gray-400">Badge management</div>
                        </div>
                    </div>

                    {/* Stat chips */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {[
                            { label: 'Tổng', val: stats.total, bg: '#eff6ff', color: '#2563eb', dot: '#3b82f6' },
                            { label: 'Đang hiện', val: stats.active, bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' },
                            { label: 'Danh mục', val: stats.categories, bg: '#faf5ff', color: '#7c3aed', dot: '#a855f7' },
                            { label: 'Kết quả lọc', val: filtered.length, bg: '#fff7ed', color: '#c2410c', dot: '#f97316' },
                        ].map(s => (
                            <div key={s.label} style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                background: s.bg, borderRadius: 20, padding: '4px 12px'
                            }}>
                                <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot }} />
                                <span style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.val}</span>
                                <span style={{ fontSize: 11, color: '#9ca3af' }}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Add button */}
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={openCreate}
                    size="middle"
                    id="btn-create-reward"
                    style={{
                        background: 'linear-gradient(135deg,#f59e0b,#f97316)',
                        border: 'none', borderRadius: 10, fontWeight: 600,
                        boxShadow: '0 2px 8px rgba(245,158,11,0.35)', flexShrink: 0
                    }}
                >
                    Thêm Huy hiệu
                </Button>
            </div>

            {/* ── Filter Bar ─────────────────────────────────────────────────── */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                background: '#fff', borderRadius: 14, padding: '10px 16px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
            }}>
                {/* Category filter */}
                <Select
                    value={categoryFilter}
                    onChange={(v) => setCategoryFilter(v)}
                    size="middle"
                    style={{ width: 185, borderRadius: 8 }}
                    options={[
                        { value: 'ALL', label: '🏆 Tất cả danh mục' },
                        ...CATEGORIES.map(c => ({ value: c, label: CATEGORY_LABELS[c] }))
                    ]}
                />

                {/* Search */}
                <Input
                    placeholder="Tìm theo tên hoặc code..."
                    prefix={<SearchOutlined style={{ color: '#d1d5db' }} />}
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    style={{ width: 260, borderRadius: 8 }}
                    allowClear
                />

                {/* Refresh icon button */}
                <Tooltip title="Tải lại dữ liệu">
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={fetchRewards}
                        loading={loading}
                        style={{ borderRadius: 8 }}
                    />
                </Tooltip>

            </div>

            {/* Table */}
            <Card className="rounded-2xl shadow-sm border-none">
                <Table
                    rowKey="id"
                    dataSource={filtered}
                    columns={columns}
                    loading={loading}
                    pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `Tổng ${total} huy hiệu` }}
                    size="middle"
                    rowClassName="hover:bg-blue-50 transition-colors"
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            {/* Create / Edit Modal */}
            <Modal
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                onOk={handleSubmit}
                confirmLoading={uploading}
                title={
                    <div className="flex items-center gap-2 text-lg font-semibold">
                        <TrophyOutlined className="text-yellow-500" />
                        {editing ? 'Chỉnh sửa Huy hiệu' : 'Tạo Huy hiệu mới'}
                    </div>
                }
                okText={editing ? 'Lưu thay đổi' : 'Tạo'}
                cancelText="Hủy"
                width={640}
                destroyOnClose
            >
                <Form form={form} layout="vertical" className="pt-4">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="code" label="Mã Code (unique)" rules={[{ required: true, message: 'Nhập mã code' }]}>
                                <Input placeholder="VD: LEARN_FIRST_LEVEL" className="font-mono" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="category" label="Danh mục" rules={[{ required: true, message: 'Chọn danh mục' }]}>
                                <Select
                                    placeholder="Chọn danh mục"
                                    onChange={(v: string) => {
                                        setSelectedCategory(v)
                                        // Reset tiêu chí khi đổi danh mục
                                        setCriteriaType(null)
                                        form.resetFields(['criteriaType', 'threshold', 'region', 'level', 'pair', 'game', 'max_rank', 'from', 'to'])
                                    }}
                                >
                                    {CATEGORIES.map(c => (
                                        <Option key={c} value={c}>
                                            <span>{CATEGORY_LABELS[c]}</span>
                                            <span style={{ marginLeft: 8, fontSize: 11, color: '#9ca3af' }}>
                                                ({(CATEGORY_CRITERIA_MAP[c] || []).length} tiêu chí)
                                            </span>
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="name" label="Tên hiển thị" rules={[{ required: true, message: 'Nhập tên huy hiệu' }]}>
                        <Input placeholder="VD: Bước Chân Đầu Tiên 👣" />
                    </Form.Item>

                    <Form.Item name="description" label="Mô tả">
                        <TextArea rows={2} placeholder="Mô tả ngắn hiển thị cho người chơi..." />
                    </Form.Item>

                    <Form.Item label="Hình ảnh Huy hiệu" required>
                        <Upload
                            listType="picture-card"
                            fileList={fileList}
                            onChange={({ fileList }) => setFileList(fileList)}
                            beforeUpload={() => false} // Don't upload automatically
                            maxCount={1}
                        >
                            {fileList.length < 1 && (
                                <div>
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8 }}>Tải ảnh</div>
                                </div>
                            )}
                        </Upload>
                        <Text type="secondary" className="text-xs">
                            Khuyên dùng ảnh PNG trong suốt, kích thước 256x256px.
                        </Text>
                    </Form.Item>

                    <Form.Item name="iconUrl" hidden>
                        <Input />
                    </Form.Item>

                    <Divider className="text-sm font-medium text-purple-600">
                        🔓 Điều kiện Unlock
                    </Divider>

                    {!selectedCategory ? (
                        <div className="text-center py-3 px-4 bg-gray-50 rounded-lg text-gray-400 text-sm mb-4">
                            ← Hãy chọn <strong>Danh mục</strong> trước để xem các tiêu chí phù hợp
                        </div>
                    ) : (
                        <Form.Item
                            name="criteriaType"
                            label={
                                <span>
                                    Kiểu tiêu chí
                                    <span style={{ marginLeft: 8, fontSize: 11, color: '#6b7280' }}>
                                        (theo danh mục <strong>{CATEGORY_LABELS[selectedCategory]}</strong>)
                                    </span>
                                </span>
                            }
                            rules={[{ required: true, message: 'Chọn kiểu tiêu chí' }]}
                        >
                            <Select
                                showSearch
                                placeholder={`Chọn tiêu chí cho ${CATEGORY_LABELS[selectedCategory]}...`}
                                onChange={(v: string) => {
                                    setCriteriaType(v)
                                    form.resetFields(['threshold', 'region', 'level', 'pair', 'game', 'max_rank', 'from', 'to'])
                                }}
                                optionFilterProp="label"
                                options={(
                                    CATEGORY_CRITERIA_MAP[selectedCategory] || []
                                ).map(criteriaKey => {
                                    const found = CRITERIA_TYPES.find(c => c.value === criteriaKey)
                                    return found ? { value: found.value, label: found.label } : null
                                }).filter(Boolean) as { value: string; label: string }[]}
                            />
                        </Form.Item>
                    )}

                    <CriteriaFields criteriaType={criteriaType} />

                    <Form.Item name="isActive" label="Trạng thái" valuePropName="checked" initialValue={true} className="mt-4">
                        <Switch checkedChildren="Hiện với người chơi" unCheckedChildren="Ẩn" />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Detail Drawer */}
            <Drawer
                open={!!detailDrawer}
                onClose={() => setDetailDrawer(null)}
                title={<span className="font-bold">{detailDrawer?.name}</span>}
                width={420}
            >
                {detailDrawer && (
                    <div className="space-y-4">
                        <div className="flex justify-center py-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl">
                            <div style={{ width: 80, height: 80, borderRadius: 20, padding: 4, background: 'linear-gradient(135deg,#f59e0b,#f97316)', boxShadow: '0 4px 16px rgba(245,158,11,0.4)' }}>
                                <div style={{ width: '100%', height: '100%', borderRadius: 16, background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {detailDrawer?.iconUrl
                                        ? <img src={detailDrawer.iconUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : <TrophyOutlined style={{ color: '#f97316', fontSize: 36 }} />
                                    }
                                </div>
                            </div>
                        </div>
                        <div>
                            <Tag color={CATEGORY_COLORS[detailDrawer?.category || ''] || 'default'}>
                                {CATEGORY_LABELS[detailDrawer?.category || ''] || detailDrawer?.category || '—'}
                            </Tag>
                        </div>
                        {([
                            ['Code', <code key="code" className="font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded">{detailDrawer?.code}</code>],
                            ['Mô tả', detailDrawer?.description || '—'],
                            ['Trạng thái', detailDrawer?.isActive ? <Tag key="tag-active" color="green">Đang hiện</Tag> : <Tag key="tag-hidden">Đã ẩn</Tag>],
                        ] as [string, React.ReactNode][]).map(([label, val]) => (
                            <div key={label}>
                                <Text type="secondary" className="text-xs uppercase tracking-wider">{label}</Text>
                                <div className="mt-1 font-medium">{val}</div>
                            </div>
                        ))}
                        <Divider />
                        <Text type="secondary" className="text-xs uppercase tracking-wider">Tiêu chí Unlock (JSON)</Text>
                        <pre className="mt-2 bg-gray-900 text-green-400 p-4 rounded-xl text-xs overflow-auto max-h-48">
                            {JSON.stringify(parseCriteriaJson(detailDrawer?.criteriaJson || ''), null, 2)}
                        </pre>
                    </div>
                )}
            </Drawer>
        </div>
    )
}

export default RewardManagementPage
