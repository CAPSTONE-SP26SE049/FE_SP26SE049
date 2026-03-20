import { useState, useEffect } from 'react'
import {
    Table,
    Button,
    Tag,
    Input,
    Space,
    Avatar,
    Progress,
    Modal,
    Form,
    message,
    Tooltip,
    Popconfirm,
    Empty,
    Card,
    Alert,
    Upload,
    Select
} from 'antd'
import { TeamOutlined } from '@ant-design/icons'
import {
    SearchOutlined,
    UserAddOutlined,
    MessageOutlined,
    EyeOutlined,
    DeleteOutlined,
    ArrowLeftOutlined,
    DownloadOutlined,
    UploadOutlined
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { educatorService } from '../services/educatorService'

const StudentManagementPage = () => {
    const { classId } = useParams<{ classId: string }>()
    const navigate = useNavigate()
    const [students, setStudents] = useState<any[]>([])
    const [classroomInfo, setClassroomInfo] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [isAddModalVisible, setIsAddModalVisible] = useState(false)
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState<any>(null)
    const [submitting, setSubmitting] = useState(false)
    const [form] = Form.useForm()
    const [addForm] = Form.useForm()

    // States for classroom selector (when no classId)
    const [classList, setClassList] = useState<any[]>([])
    const [classLoading, setClassLoading] = useState(false)
    const [classSearch, setClassSearch] = useState('')
    const [importingStudents, setImportingStudents] = useState(false)
    const [dialectMap, setDialectMap] = useState<Record<string, any>>({})
    const [dialectOptions, setDialectOptions] = useState<{ label: string; value: string }[]>([])
    const [regionFilter, setRegionFilter] = useState<string | null>(null)

    const REGION_LABEL: Record<string, { label: string; color: string; bg: string }> = {
        NORTH: { label: 'Miền Bắc', color: '#1d4ed8', bg: '#dbeafe' },
        SOUTH: { label: 'Miền Nam', color: '#15803d', bg: '#dcfce7' },
        CENTRAL: { label: 'Miền Trung', color: '#b45309', bg: '#fef3c7' },
    }

    const fetchStudents = async () => {
        if (!classId) return
        try {
            setLoading(true)
            const res: any = await educatorService.getClassroomStudents(classId)
            if (res.status === 'success' || res.data) {
                setStudents(res.data || res)
            }
        } catch (error) {
            console.error('Failed to fetch students:', error)
            message.error('Không thể tải danh sách học sinh')
        } finally {
            setLoading(false)
        }
    }

    const fetchClassroomInfo = async () => {
        if (!classId) return
        try {
            const res: any = await educatorService.getClassroomById(classId)
            setClassroomInfo(res.data || res)
        } catch (err) {
            console.error('Failed to fetch classroom info:', err)
        }
    }

    useEffect(() => {
        if (classId) {
            fetchClassroomInfo()
            fetchStudents()
        } else {
            // Fetch classrooms and dialects for selector
            const loadClasses = async () => {
                try {
                    setClassLoading(true)
                    const [classRes, dialectRes]: any[] = await Promise.all([
                        educatorService.getClassrooms(),
                        educatorService.getDialects(),
                    ])
                    setClassList(classRes.data || classRes || [])
                    const dList = dialectRes.data || dialectRes || []
                    const map: Record<string, any> = {}
                    dList.forEach((d: any) => { map[d.id] = d })
                    setDialectMap(map)
                    setDialectOptions(
                        dList.map((d: any) => {
                            const regionInfo = REGION_LABEL[(d.name || '').toUpperCase()]
                            return { label: d.description || regionInfo?.label || d.name || '', value: d.id }
                        })
                    )
                } catch { /* ignore */ } finally { setClassLoading(false) }
            }
            loadClasses()
        }
    }, [classId])

    const handleAddStudent = async (values: { email: string }) => {
        if (!classId) return

        // Kiểm tra giới hạn trước khi gọi API
        const currentStudents = classroomInfo?.currentStudents
        if (currentStudents != null && students.length >= currentStudents) {
            message.error({
                content: `Lớp học đã đạt giới hạn tối đa ${currentStudents} học sinh. Không thể thêm thêm.`,
                duration: 4,
            })
            return
        }

        try {
            setSubmitting(true)
            await educatorService.addStudentToClassroom(classId, values)
            message.success('Đã thêm học sinh vào lớp thành công')
            setIsAddModalVisible(false)
            addForm.resetFields()
            fetchStudents()
        } catch (error: any) {
            console.error('Failed to add student:', error)
            message.error(
                error?.message ||
                error?.response?.data?.message ||
                'Lỗi khi thêm học sinh'
            )
        } finally {
            setSubmitting(false)
        }
    }

    const handleRemoveStudent = async (studentId: string) => {
        if (!classId) return
        try {
            await educatorService.removeStudentFromClassroom(classId, studentId)
            message.success('Đã xóa học sinh khỏi lớp')
            fetchStudents()
        } catch (error) {
            console.error('Failed to remove student:', error)
            message.error('Lỗi khi xóa học sinh')
        }
    }

    const handleGiveFeedback = (student: any) => {
        setSelectedStudent(student)
        setFeedbackModalOpen(true)
    }

    const handleFeedbackSubmit = () => {
        form.validateFields().then(() => {
            message.success(`Nhận xét đã được gửi tới ${selectedStudent.fullName || selectedStudent.name}!`)
            setFeedbackModalOpen(false)
            form.resetFields()
        })
    }

    // ========== Export CSV ==========
    const handleExportStudents = () => {
        if (students.length === 0) {
            message.warning('Không có dữ liệu học sinh để xuất')
            return
        }
        const className = classroomInfo?.name || 'lop_hoc'
        const headers = ['STT', 'Họ Tên', 'Email', 'Tiến Độ (%)', 'Sao tích lũy']
        const rows = students.map((s, i) => [
            i + 1,
            `"${(s.fullName || s.name || '').replace(/"/g, '""')}"`,
            s.email || '',
            s.progress ?? 0,
            s.totalStars ?? 0,
        ].join(','))
        const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `danh_sach_hoc_sinh_${className.replace(/\s+/g, '_')}.csv`
        link.click()
        URL.revokeObjectURL(url)
        message.success('Xuất file CSV thành công!')
    }

    // ========== Import CSV ==========
    const handleImportStudents = async (file: File) => {
        if (!classId) return
        setImportingStudents(true)
        try {
            const text = await file.text()
            const lines = text.split(/\r?\n/).filter(l => l.trim())
            if (lines.length < 2) {
                message.error('File CSV cần có header và ít nhất 1 dòng dữ liệu')
                return
            }

            const parseCSVLine = (line: string): string[] => {
                const result: string[] = []
                let current = '', inQuotes = false
                for (let i = 0; i < line.length; i++) {
                    const ch = line[i]
                    if (inQuotes) {
                        if (ch === '"' && line[i + 1] === '"') { current += '"'; i++ }
                        else if (ch === '"') inQuotes = false
                        else current += ch
                    } else {
                        if (ch === '"') inQuotes = true
                        else if (ch === ',') { result.push(current.trim()); current = '' }
                        else current += ch
                    }
                }
                result.push(current.trim())
                return result
            }

            const header = parseCSVLine(lines[0]).map(h => h.replace(/^\uFEFF/, '').toLowerCase())
            const emailIdx = header.findIndex(h => h.includes('email') || h.includes('mail'))

            if (emailIdx === -1) {
                message.error('File CSV thiếu cột "Email". Vui lòng kiểm tra lại.')
                return
            }

            let success = 0, failed = 0, skipped = 0
            const dataLines = lines.slice(1)
            for (const line of dataLines) {
                const cols = parseCSVLine(line)
                const email = cols[emailIdx]?.trim()
                if (!email) { skipped++; continue }
                try {
                    await educatorService.addStudentToClassroom(classId, { email })
                    success++
                } catch {
                    failed++
                }
            }
            message.success(`Nhập CSV hoàn tất: ${success} thành công, ${failed} thất bại${skipped ? `, ${skipped} bỏ qua` : ''}`)
            fetchStudents()
        } catch (err) {
            console.error('Import CSV error:', err)
            message.error('Lỗi khi đọc file CSV')
        } finally {
            setImportingStudents(false)
        }
    }

    const filteredData = students.filter(
        (student) =>
            (student.fullName || student.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
            (student.email || '').toLowerCase().includes(searchText.toLowerCase())
    )

    const columns = [
        {
            title: 'STT',
            key: 'stt',
            width: 60,
            align: 'center' as const,
            render: (_: any, __: any, index: number) => index + 1,
        },
        {
            title: 'Học Sinh',
            key: 'name',
            render: (_: any, record: any) => (
                <Space>
                    <Avatar style={{ backgroundColor: '#87d068' }}>
                        {(record.fullName || record.name || '?').charAt(0)}
                    </Avatar>
                    <div>
                        <div style={{ fontWeight: 600, color: '#1a1a1a' }}>{record.fullName || record.name}</div>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.email}</div>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Tiến Độ',
            key: 'progress',
            width: 200,
            render: (_: any, record: any) => <Progress percent={record.progress || 0} size="small" />,
        },
        {
            title: 'Sao tích lũy',
            dataIndex: 'totalStars',
            key: 'totalStars',
            render: (stars: number) => (
                <Tag color="gold" style={{ borderRadius: '12px', border: 'none', paddingInline: '10px' }}>
                    {stars || 0} ⭐
                </Tag>
            ),
        },
        {
            title: 'Hành Động',
            key: 'action',
            render: (_: any, record: any) => (
                <Space size="middle">
                    <Tooltip title="Xem chi tiết">
                        <Button
                            icon={<EyeOutlined />}
                            shape="circle"
                            style={{ color: '#1890ff' }}
                            onClick={() => navigate(`/educator/analytics?studentId=${record.id}`)}
                        />
                    </Tooltip>
                    <Tooltip title="Gửi phản hồi">
                        <Button
                            type="primary"
                            icon={<MessageOutlined />}
                            shape="circle"
                            style={{ background: '#52c41a', border: 'none' }}
                            onClick={() => handleGiveFeedback(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Xóa học sinh?"
                        description="Học sinh này sẽ bị loại khỏi lớp học này."
                        onConfirm={() => handleRemoveStudent(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{
                            danger: true,
                            style: { background: '#ff4d4f', color: '#fff', borderColor: '#ff4d4f' }
                        }}
                    >
                        <Tooltip title="Xóa khỏi lớp">
                            <Button
                                icon={<DeleteOutlined />}
                                shape="circle"
                                danger
                                style={{ color: '#ff4d4f', borderColor: '#ff4d4f' }}
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ]

    if (!classId) {
        const filtered = classList.filter(c => {
            const matchSearch = (c.name || '').toLowerCase().includes(classSearch.toLowerCase()) ||
                (c.code || '').toLowerCase().includes(classSearch.toLowerCase())
            const matchRegion = !regionFilter || c.dialectId === regionFilter
            return matchSearch && matchRegion
        })

        return (
            <div style={{ padding: '8px 0' }}>
                <div style={{ marginBottom: 20 }}>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1e293b' }}>
                        Danh Sách Học Sinh
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>
                        Chọn một lớp học để quản lý học sinh
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Input
                        prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                        placeholder="Tìm kiếm lớp học..."
                        value={classSearch}
                        onChange={(e) => setClassSearch(e.target.value)}
                        allowClear
                        style={{ maxWidth: 300, borderRadius: 10, height: 40 }}
                    />
                    <Select
                        placeholder="Lọc theo vùng miền"
                        value={regionFilter}
                        onChange={(val) => setRegionFilter(val)}
                        allowClear
                        style={{ minWidth: 180, borderRadius: 10, height: 40 }}
                        options={[{ label: 'Tất cả vùng', value: '' as any }, ...dialectOptions]}
                    />
                    {(classSearch || regionFilter) && (
                        <span style={{ fontSize: 13, color: '#6b7280' }}>
                            Tìm thấy <strong>{filtered.length}</strong> lớp
                        </span>
                    )}
                </div>

                {classLoading ? (
                    <div style={{ textAlign: 'center', padding: 60 }}>
                        <Progress type="circle" percent={100} status="active" showInfo={false} />
                        <p style={{ marginTop: 12, color: '#94a3b8' }}>Đang tải danh sách lớp...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <Card variant="borderless" style={{ borderRadius: 16, textAlign: 'center', padding: 40 }}>
                        <Empty description={classSearch ? 'Không tìm thấy lớp học' : 'Chưa có lớp học nào'} />
                    </Card>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: 16,
                    }}>
                        {filtered.map((c) => (
                            <div
                                key={c.id}
                                onClick={() => navigate(`/educator/classrooms/${c.id}/students`, { state: { classroomName: c.name } })}
                                style={{
                                    background: '#fff',
                                    borderRadius: 14,
                                    padding: '20px 22px',
                                    cursor: 'pointer',
                                    border: '1.5px solid #e5e7eb',
                                    transition: 'all 0.25s ease',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#3b82f6'
                                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(59,130,246,0.15)'
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#e5e7eb'
                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
                                    e.currentTarget.style.transform = 'translateY(0)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', lineHeight: 1.3 }}>
                                        {c.name}
                                    </div>
                                    {c.isActive
                                        ? <Tag color="success" style={{ margin: 0 }}>Hoạt động</Tag>
                                        : <Tag color="error" style={{ margin: 0 }}>Tạm dừng</Tag>
                                    }
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                    <code style={{
                                        background: '#f1f5f9', padding: '2px 8px', borderRadius: 6,
                                        fontSize: 12, color: '#3b82f6', fontWeight: 600,
                                    }}>{c.code}</code>
                                    {(() => {
                                        const d = dialectMap[c.dialectId]
                                        const ri = d ? REGION_LABEL[(d.name || '').toUpperCase()] : null
                                        return ri ? (
                                            <span style={{
                                                fontSize: 11, fontWeight: 600, padding: '2px 8px',
                                                borderRadius: 6, color: ri.color, background: ri.bg,
                                            }}>{ri.label}</span>
                                        ) : null
                                    })()}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, color: '#64748b' }}>
                                    <span><TeamOutlined style={{ marginRight: 4 }} />Tối đa: {c.currentStudents ?? 0} HS</span>
                                    {c.startDate && (
                                        <span>Bắt đầu: {new Date(c.startDate).toLocaleDateString('vi-VN')}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    const navState = (window.history.state?.usr) as { classroomName?: string } | undefined;
    const displayClassName = classroomInfo?.name || navState?.classroomName || '';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
                <Space size="large">
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/educator/students')}
                        style={{ border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                    />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 m-0">
                            {displayClassName ? `Lớp: ${displayClassName}` : 'Danh Sách Học Sinh'}
                        </h2>
                        {classroomInfo && (
                            <span style={{ fontSize: 13, color: '#6b7280' }}>
                                <TeamOutlined />&nbsp;
                                <span style={{
                                    fontWeight: 600,
                                    color: classroomInfo.currentStudents != null && students.length >= classroomInfo.currentStudents
                                        ? '#ef4444'
                                        : classroomInfo.currentStudents != null && students.length >= classroomInfo.currentStudents * 0.8
                                            ? '#f59e0b'
                                            : '#10b981'
                                }}>
                                    {students.length}
                                </span>
                                {classroomInfo.currentStudents != null && (
                                    <span> / {classroomInfo.currentStudents}</span>
                                )}
                                <span> học sinh</span>
                            </span>
                        )}
                    </div>
                </Space>
                <Space size={10}>
                    <Button
                        icon={<DownloadOutlined />}
                        onClick={handleExportStudents}
                        style={{ borderRadius: 10, height: 40 }}
                    >
                        Xuất CSV
                    </Button>
                    <Upload
                        accept=".csv"
                        showUploadList={false}
                        beforeUpload={(file) => { handleImportStudents(file); return false; }}
                    >
                        <Button
                            icon={<UploadOutlined />}
                            loading={importingStudents}
                            style={{ borderRadius: 10, height: 40 }}
                        >
                            Nhập CSV
                        </Button>
                    </Upload>
                    <Tooltip
                        title={
                            classroomInfo?.currentStudents != null && students.length >= classroomInfo.currentStudents
                                ? `Lớp đã đầy (tối đa ${classroomInfo.currentStudents} học sinh)`
                                : ''
                        }
                    >
                        <Button
                            type="primary"
                            icon={<UserAddOutlined />}
                            onClick={() => setIsAddModalVisible(true)}
                            disabled={
                                classroomInfo?.currentStudents != null &&
                                students.length >= classroomInfo.currentStudents
                            }
                            style={{
                                height: 40,
                                borderRadius: 10,
                                background:
                                    classroomInfo?.currentStudents != null && students.length >= classroomInfo.currentStudents
                                        ? undefined
                                        : 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(16,185,129,0.2)'
                            }}
                        >
                            Thêm Học Sinh
                        </Button>
                    </Tooltip>
                </Space>
            </div>

            {/* Cảnh báo gần đầy / đã đầy */}
            {classroomInfo?.currentStudents != null && students.length >= classroomInfo.currentStudents && (
                <Alert
                    type="error"
                    showIcon
                    message={`Lớp học đã đạt giới hạn tối đa ${classroomInfo.currentStudents} học sinh`}
                    description="Không thể thêm học sinh mới. Vui lòng cập nhật lớp học để tăng giới hạn."
                    style={{ borderRadius: 10, marginBottom: 8 }}
                />
            )}
            {classroomInfo?.currentStudents != null
                && students.length < classroomInfo.currentStudents
                && students.length >= classroomInfo.currentStudents * 0.8
                && (
                    <Alert
                        type="warning"
                        showIcon
                        message={`Lớp sắp đầy (${students.length}/${classroomInfo.currentStudents} học sinh)`}
                        description={`Lớp học gần đạt giới hạn. Chỉ có thể thêm tối đa ${classroomInfo.currentStudents - students.length} học sinh nữa.`}
                        style={{ borderRadius: 10, marginBottom: 8 }}
                    />
                )}

            <Card
                variant="borderless"
                style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
            >
                <div className="mb-6 max-w-md">
                    <Input
                        placeholder="Tìm kiếm theo tên hoặc email..."
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        size="large"
                        style={{ borderRadius: '10px' }}
                        onChange={(e) => setSearchText(e.target.value)}
                        value={searchText}
                    />
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredData}
                    rowKey="id"
                    loading={loading}
                />
            </Card>

            {/* Modal Thêm Học Sinh */}
            <Modal
                title="Thêm Học Sinh Vào Lớp"
                open={isAddModalVisible}
                onOk={() => addForm.submit()}
                onCancel={() => setIsAddModalVisible(false)}
                confirmLoading={submitting}
                okText="Thêm"
                okButtonProps={{ className: '!bg-blue-600 hover:!bg-blue-500 !border-none !text-white' }}
                cancelText="Hủy"
            >
                <Form form={addForm} layout="vertical" onFinish={handleAddStudent}>
                    <Form.Item
                        name="email"
                        label="Email Học Sinh"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email học sinh' },
                            { type: 'email', message: 'Vui lòng nhập đúng định dạng email' },
                            { max: 100, message: 'Email không quá 100 ký tự' }
                        ]}
                    >
                        <Input placeholder="student.example@gmail.com" />
                    </Form.Item>
                    <p className="text-gray-500 text-xs italic">
                        * Lưu ý: Học sinh phải có tài khoản trên hệ thống mới có thể thêm vào lớp.
                    </p>
                </Form>
            </Modal>

            {/* Modal Phản Hồi */}
            <Modal
                title={`Gửi phản hồi cho ${selectedStudent?.fullName || selectedStudent?.name}`}
                open={feedbackModalOpen}
                onOk={handleFeedbackSubmit}
                onCancel={() => setFeedbackModalOpen(false)}
                okText="Gửi"
                okButtonProps={{ className: '!bg-blue-600 hover:!bg-blue-500 !border-none !text-white' }}
                cancelText="Hủy"
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="content"
                        label="Nội dung nhận xét"
                        rules={[
                            { required: true, message: 'Vui lòng nhập nội dung nhận xét!' },
                            { min: 10, message: 'Nhận xét phải ít nhất 10 ký tự' },
                            { max: 500, message: 'Nhận xét không quá 500 ký tự' }
                        ]}
                    >
                        <Input.TextArea rows={4} placeholder="Nhập nhận xét của bạn về tiến độ học tập của học sinh..." showCount maxLength={500} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default StudentManagementPage
