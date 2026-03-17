import React, { useEffect, useState, useMemo } from 'react'
import {
    Table,
    Button,
    Card,
    Space,
    Modal,
    Form,
    Input,
    InputNumber,
    message,
    Tooltip,
    Popconfirm,
    Progress,
    List,
    Typography,
    DatePicker,
    Select,
    Switch,
    Tag
} from 'antd'
import dayjs from 'dayjs'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    TeamOutlined,
    BarChartOutlined,
    SearchOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { educatorService } from '../services/educatorService'

const { Text } = Typography;

const ClassroomManagementPage: React.FC = () => {
    const [classrooms, setClassrooms] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [editingClass, setEditingClass] = useState<any>(null)
    const [submitting, setSubmitting] = useState(false)
    const [performanceModalVisible, setPerformanceModalVisible] = useState(false)
    const [performanceData, setPerformanceData] = useState<any>(null)
    const [performanceLoading, setPerformanceLoading] = useState(false)
    const [dialectOptions, setDialectOptions] = useState<{ label: string; value: string }[]>([])
    const [dialectMap, setDialectMap] = useState<Record<string, any>>({})
    const [searchText, setSearchText] = useState('')
    const [form] = Form.useForm()
    const navigate = useNavigate()
    const watchedStartDate = Form.useWatch('startDate', form)

    // Lọc client-side theo tên lớp hoặc mã lớp
    const filteredClassrooms = useMemo(() => {
        const keyword = searchText.trim().toLowerCase()
        if (!keyword) return classrooms
        return classrooms.filter(
            (c) =>
                c.name?.toLowerCase().includes(keyword) ||
                c.code?.toLowerCase().includes(keyword)
        )
    }, [classrooms, searchText])

    const fetchClassrooms = async () => {
        try {
            setLoading(true)
            const res: any = await educatorService.getClassrooms()
            if (res.status === 'success' || res.data) {
                setClassrooms(res.data || res)
            }
        } catch (error) {
            console.error('Failed to fetch classrooms:', error)
            message.error('Không thể tải danh sách lớp học')
        } finally {
            setLoading(false)
        }
    }

    const REGION_LABEL: Record<string, { label: string; color: string; bg: string }> = {
        NORTH: { label: 'Miền Bắc', color: '#1d4ed8', bg: '#dbeafe' },
        SOUTH: { label: 'Miền Nam', color: '#15803d', bg: '#dcfce7' },
        CENTRAL: { label: 'Miền Trung', color: '#b45309', bg: '#fef3c7' },
    }

    const fetchDialects = async () => {
        try {
            const res: any = await educatorService.getDialects()
            const list = res.data || res || []
            // Build a map: dialectId → dialect object
            const map: Record<string, any> = {}
            list.forEach((d: any) => { map[d.id] = d })
            setDialectMap(map)
            setDialectOptions(
                list.map((d: any) => {
                    // d.name = "NORTH"/"SOUTH"/"CENTRAL", d.description = "Miền Bắc"/"Miền Nam"/"Miền Trung"
                    const regionInfo = REGION_LABEL[(d.name || '').toUpperCase()]
                    const regionLabel = d.description || (regionInfo ? regionInfo.label : d.name || '')
                    return { label: regionLabel, value: d.id }
                })
            )
        } catch (err) {
            console.error('Failed to load dialects:', err)
        }
    }

    useEffect(() => {
        fetchClassrooms()
        fetchDialects()
    }, [])

    const handleOpenModal = (classroom: any = null) => {
        setEditingClass(classroom)
        if (classroom) {
            form.setFieldsValue({
                name: classroom.name,
                description: classroom.description,
                dialectId: classroom.dialectId,
                startDate: classroom.startDate ? dayjs(classroom.startDate) : null,
                endDate: classroom.endDate ? dayjs(classroom.endDate) : null,
                isActive: classroom.isActive ?? true,
                currentStudents: classroom.currentStudents ?? null,
            })
        } else {
            form.resetFields()
            form.setFieldsValue({ isActive: true })
        }
        setIsModalVisible(true)
    }

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields()
            setSubmitting(true)

            // Convert dayjs objects → ISO string for backend
            const payload: any = {
                name: values.name,
                description: values.description,
                dialectId: values.dialectId,
                isActive: values.isActive ?? true,
                startDate: values.startDate ? values.startDate.toISOString() : undefined,
                endDate: values.endDate ? values.endDate.toISOString() : undefined,
                currentStudents: values.currentStudents ?? undefined,
            }

            if (editingClass) {
                await educatorService.updateClassroom(editingClass.id, payload)
                message.success('Cập nhật lớp học thành công')
            } else {
                await educatorService.createClassroom(payload)
                message.success('Tạo lớp học mới thành công')
            }
            setIsModalVisible(false)
            fetchClassrooms()
        } catch (error: any) {
            console.error('Failed to save classroom:', error)
            message.error(error?.message || 'Lỗi khi lưu thông tin lớp học')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteClass = async (id: string) => {
        try {
            await educatorService.deleteClassroom(id)
            message.success('Đã xóa lớp học')
            fetchClassrooms()
        } catch (error) {
            console.error('Failed to delete classroom:', error)
            message.error('Lỗi khi xóa lớp học')
        }
    }

    const handleViewPerformance = async (classId: string) => {
        try {
            setPerformanceModalVisible(true)
            setPerformanceLoading(true)
            setPerformanceData(null)
            const res: any = await educatorService.getClassroomPerformance(classId)
            if (res.status === 'success' || res.data) {
                setPerformanceData(res.data || res)
            }
        } catch (error) {
            console.error('Failed to fetch performance:', error)
            message.error('Không thể tải báo cáo hiệu suất')
            setPerformanceModalVisible(false)
        } finally {
            setPerformanceLoading(false)
        }
    }

    const columns = [
        {
            title: 'STT',
            key: 'stt',
            width: 60,
            align: 'center' as const,
            render: (_: any, __: any, index: number) => index + 1,
        },
        {
            title: 'Tên Lớp Học',
            dataIndex: 'name',
            key: 'name',
            sorter: (a: any, b: any) => (a.name || '').localeCompare(b.name || '', 'vi'),
            render: (text: string) => <span className="font-semibold">{text}</span>
        },
        {
            title: 'Mã Lớp (Code)',
            dataIndex: 'code',
            key: 'code',
            sorter: (a: any, b: any) => (a.code || '').localeCompare(b.code || ''),
            render: (code: string) => <code className="bg-gray-100 px-2 py-1 rounded text-blue-600 font-mono">{code}</code>
        },
        {
            title: 'Ngày Tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            defaultSortOrder: 'descend' as const,
            sorter: (a: any, b: any) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            render: (date: string) => date ? new Date(date).toLocaleDateString('vi-VN') : '—'
        },
        {
            title: 'Mô Tả',
            dataIndex: 'description',
            key: 'description',
            width: 180,
            render: (text: string) =>
                text ? (
                    <Tooltip title={text}>
                        <span
                            style={{
                                display: 'block',
                                maxWidth: 160,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                color: '#4b5563',
                                fontSize: 13,
                                cursor: 'default'
                            }}
                        >
                            {text}
                        </span>
                    </Tooltip>
                ) : <span style={{ color: '#d1d5db' }}>—</span>
        },
        {
            title: 'Ngày Bắt Đầu',
            dataIndex: 'startDate',
            key: 'startDate',
            sorter: (a: any, b: any) =>
                new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime(),
            render: (date: string) => date ? new Date(date).toLocaleDateString('vi-VN') : '—'
        },
        {
            title: 'Ngày Kết Thúc',
            dataIndex: 'endDate',
            key: 'endDate',
            sorter: (a: any, b: any) =>
                new Date(a.endDate || 0).getTime() - new Date(b.endDate || 0).getTime(),
            render: (date: string) => date ? new Date(date).toLocaleDateString('vi-VN') : '—'
        },
        {
            title: 'HS hiện tại',
            dataIndex: 'currentStudents',
            key: 'currentStudents',
            align: 'center' as const,
            sorter: (a: any, b: any) => (a.currentStudents ?? 0) - (b.currentStudents ?? 0),
            render: (val: number) =>
                val != null
                    ? <span style={{ fontWeight: 600, color: '#2563eb' }}>{val}</span>
                    : <span style={{ color: '#d1d5db' }}>—</span>
        },
        {
            title: 'Vùng',
            dataIndex: 'dialectId',
            key: 'region',
            align: 'center' as const,
            filters: [
                { text: 'Miền Bắc', value: 'NORTH' },
                { text: 'Miền Nam', value: 'SOUTH' },
                { text: 'Miền Trung', value: 'CENTRAL' },
            ],
            onFilter: (value: any, record: any) => {
                const dialect = dialectMap[record.dialectId]
                // d.name = "NORTH"/"SOUTH"/"CENTRAL" is the region key
                return (dialect?.name || '').toUpperCase() === value
            },
            render: (dialectId: string) => {
                const dialect = dialectMap[dialectId]
                // API: d.name = NORTH/SOUTH/CENTRAL, d.description = Miền Bắc/Nam/Trung
                const regionKey = (dialect?.name || '').toUpperCase()
                const info = REGION_LABEL[regionKey]
                if (!info) return <span style={{ color: '#d1d5db' }}>—</span>
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
                )
            }
        },
        {
            title: 'Trạng Thái',
            dataIndex: 'isActive',
            key: 'isActive',
            align: 'center' as const,
            filters: [
                { text: 'Đang hoạt động', value: true },
                { text: 'Tạm dừng', value: false },
            ],
            onFilter: (value: any, record: any) => record.isActive === value,
            render: (isActive: boolean) =>
                isActive
                    ? <Tag color="success">Đang hoạt động</Tag>
                    : <Tag color="error">Tạm dừng</Tag>
        },
        {
            title: 'Hành Động',
            key: 'action',
            render: (_: any, record: any) => (
                <Space size="middle">
                    <Tooltip title="Xem báo cáo">
                        <Button
                            icon={<BarChartOutlined />}
                            onClick={() => handleViewPerformance(record.id)}
                            className="text-purple-600 border-purple-200 hover:bg-purple-50"
                        />
                    </Tooltip>
                    <Tooltip title="Xem học sinh">
                        <Button
                            icon={<TeamOutlined />}
                            onClick={() => navigate(`/educator/classrooms/${record.id}/students`)}
                        />
                    </Tooltip>
                    <Tooltip title="Sửa tên lớp">
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => handleOpenModal(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Xóa lớp học?"
                        description="Tất cả dữ liệu liên kết học sinh sẽ bị ảnh hưởng. Bạn chắc chắn chứ?"
                        onConfirm={() => handleDeleteClass(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Xóa lớp">
                            <Button icon={<DeleteOutlined />} danger />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ]

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
                <h2 className="text-2xl font-bold text-gray-800" style={{ margin: 0 }}>Quản Lý Lớp Học</h2>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleOpenModal()}
                    style={{
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(37,99,235,0.2)'
                    }}
                >
                    Thêm Lớp Mới
                </Button>
            </div>

            <Card
                variant="borderless"
                style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
            >
                {/* Thanh tìm kiếm */}
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Input
                        id="classroom-search"
                        prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                        placeholder="Tìm kiếm theo tên lớp hoặc mã lớp..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        allowClear
                        style={{ maxWidth: 360, borderRadius: 8 }}
                    />
                    {searchText && (
                        <span style={{ color: '#6b7280', fontSize: 13 }}>
                            Tìm thấy <strong>{filteredClassrooms.length}</strong> kết quả
                        </span>
                    )}
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredClassrooms}
                    rowKey="id"
                    loading={loading}
                    locale={{ emptyText: searchText ? 'Không tìm thấy lớp học phù hợp' : 'Chưa có dữ liệu lớp học' }}
                    showSorterTooltip={{ title: 'Nhấn để sắp xếp' }}
                />
            </Card>

            <Modal
                title={<span style={{ fontWeight: 600 }}>{editingClass ? 'Cập Nhật Lớp Học' : 'Tạo Lớp Mới'}</span>}
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={() => setIsModalVisible(false)}
                confirmLoading={submitting}
                okText={editingClass ? 'Cập Nhật' : 'Xác Nhận'}
                okButtonProps={{
                    style: { background: '#2563eb', border: 'none', borderRadius: '6px' }
                }}
                cancelText="Hủy bỏ"
                centered
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="name"
                        label="Tên Lớp"
                        rules={[
                            { required: true, message: 'Vui lòng nhập tên lớp học' },
                            { min: 3, message: 'Tên lớp phải ít nhất 3 ký tự' },
                            { max: 50, message: 'Tên lớp không quá 50 ký tự' }
                        ]}
                    >
                        <Input placeholder="Ví dụ: Lớp Phát âm Miền Bắc - Sáng T2" />
                    </Form.Item>

                    <Form.Item name="description" label="Mô Tả">
                        <Input.TextArea
                            placeholder="Mô tả ngắn về lớp học..."
                            autoSize={{ minRows: 2, maxRows: 4 }}
                        />
                    </Form.Item>

                    <Form.Item name="dialectId" label="Phương Ngữ (Vùng)">
                        <Select
                            placeholder="Chọn vùng phương ngữ"
                            options={dialectOptions}
                            allowClear
                            loading={dialectOptions.length === 0}
                        />
                    </Form.Item>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <Form.Item
                            name="startDate"
                            label="Ngày Bắt Đầu"
                            style={{ flex: 1 }}
                            rules={[
                                {
                                    validator: (_, value) => {
                                        if (value && value.isBefore(dayjs().startOf('day'))) {
                                            return Promise.reject('Ngày bắt đầu không được là ngày trong quá khứ')
                                        }
                                        return Promise.resolve()
                                    }
                                }
                            ]}
                        >
                            <DatePicker
                                style={{ width: '100%' }}
                                format="DD/MM/YYYY"
                                placeholder="Chọn ngày bắt đầu"
                                disabledDate={(current) =>
                                    current && current.isBefore(dayjs().startOf('day'))
                                }
                                onChange={() => {
                                    // Re-validate endDate khi startDate thay đổi
                                    form.validateFields(['endDate'])
                                }}
                            />
                        </Form.Item>
                        <Form.Item
                            name="endDate"
                            label="Ngày Kết Thúc"
                            style={{ flex: 1 }}
                            rules={[
                                {
                                    validator: (_, value) => {
                                        if (!value) return Promise.resolve()
                                        const start = watchedStartDate
                                        if (start && !value.isAfter(start)) {
                                            return Promise.reject('Ngày kết thúc phải sau ngày bắt đầu')
                                        }
                                        if (value.isBefore(dayjs().startOf('day'))) {
                                            return Promise.reject('Ngày kết thúc không được là ngày trong quá khứ')
                                        }
                                        return Promise.resolve()
                                    }
                                }
                            ]}
                        >
                            <DatePicker
                                style={{ width: '100%' }}
                                format="DD/MM/YYYY"
                                placeholder="Chọn ngày kết thúc"
                                disabledDate={(current) => {
                                    const start = watchedStartDate
                                    if (start) {
                                        // Phải sau ngày bắt đầu
                                        return current && !current.isAfter(start)
                                    }
                                    // Nếu chưa chọn startDate, chặn quá khứ
                                    return current && current.isBefore(dayjs().startOf('day'))
                                }}
                            />
                        </Form.Item>
                    </div>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <Form.Item
                            name="currentStudents"
                            label="Số Học Sinh Tối Đa"
                            style={{ flex: 1 }}
                            rules={[
                                {
                                    validator: (_, value) => {
                                        if (value !== undefined && value !== null && (value < 1 || value > 500)) {
                                            return Promise.reject('Số học sinh phải từ 1 đến 500')
                                        }
                                        return Promise.resolve()
                                    }
                                }
                            ]}
                        >
                            <InputNumber
                                min={1}
                                max={500}
                                placeholder="VD: 30"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                        <Form.Item name="isActive" label="Trạng Thái" valuePropName="checked" style={{ flex: 1 }}>
                            <Switch checkedChildren="Đang hoạt động" unCheckedChildren="Tạm dừng" defaultChecked />
                        </Form.Item>
                    </div>
                </Form>
            </Modal>

            <Modal
                title={<span style={{ fontWeight: 600 }}>Báo Cáo Hiệu Suất Lớp Học</span>}
                open={performanceModalVisible}
                onCancel={() => setPerformanceModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setPerformanceModalVisible(false)}>
                        Đóng
                    </Button>
                ]}
                width={600}
                centered
            >
                {performanceLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <Progress type="circle" percent={100} status="active" showInfo={false} />
                    </div>
                ) : performanceData ? (
                    <div className="space-y-6">
                        <div className="bg-gray-50 rounded-xl p-4 flex gap-8">
                            <div className="flex-1 text-center">
                                <div className="text-gray-500 mb-1">Điểm Trung Bình</div>
                                <div className="text-3xl font-bold text-blue-600">{performanceData.averageScore}</div>
                            </div>
                            <div className="flex-1 text-center border-l border-gray-200">
                                <div className="text-gray-500 mb-1">Tỷ Lệ Hoàn Thành</div>
                                <div className="text-3xl font-bold text-green-600">{performanceData.completionRate}%</div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Lỗi Phát Âm Phổ Biến</h3>
                            <List
                                itemLayout="horizontal"
                                dataSource={performanceData.commonErrors || []}
                                renderItem={(item: any) => (
                                    <List.Item>
                                        <List.Item.Meta
                                            title={<Text strong className="text-red-500">Âm vị: {item.phoneme}</Text>}
                                            description={`Xuất hiện: ${item.occurrenceCount} lần - Lỗi trung bình: ${item.averageErrorScore}`}
                                        />
                                    </List.Item>
                                )}
                                locale={{ emptyText: 'Chưa có dữ liệu lỗi phát âm' }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-8">Không có dữ liệu báo cáo.</div>
                )}
            </Modal>
        </div>
    )
}

export default ClassroomManagementPage
