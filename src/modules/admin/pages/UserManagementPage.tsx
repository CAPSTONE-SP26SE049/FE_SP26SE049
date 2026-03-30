import React, { useMemo, useState } from 'react'
import {
  Table,
  Card,
  Input,
  Tag,
  Button,
  Tooltip,
  Avatar,
  Modal,
  Form,
  message,
  Select,
  Row,
  Col,
  Statistic,
  Typography,
  Descriptions,
} from 'antd'
import {
  SearchOutlined,
  UserOutlined,
  PlusOutlined,
  UploadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  StopOutlined,
  EditOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { Lock, Unlock } from 'lucide-react'
import { adminService, type AdminUser } from '../services/adminService'
import { getRegionLabel } from '../../../utils/regionDisplay'

const { Text } = Typography

const ROLE_LABELS: Record<string, string> = {
  USER: 'Học viên',
  EDUCATOR: 'Giáo viên',
  ADMIN: 'Quản trị viên',
}

const ROLE_TAG_COLOR: Record<string, string> = {
  USER: 'blue',
  EDUCATOR: 'green',
  ADMIN: 'red',
}

function formatRole(role: string | undefined | null) {
  if (!role) return '—'
  const upper = String(role).toUpperCase()
  return ROLE_LABELS[upper] ?? upper
}

function roleTagColor(role: string | undefined | null) {
  if (!role) return 'default'
  return ROLE_TAG_COLOR[String(role).toUpperCase()] ?? 'blue'
}

/** API có thể trả isActive boolean, chuỗi "false", hoặc field `active` — chuẩn hóa để lọc «Đã khóa» đúng. */
function parseBoolLoose(v: unknown, defaultValue: boolean): boolean {
  if (v === undefined || v === null) return defaultValue
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase()
    if (s === 'false' || s === '0' || s === 'no') return false
    if (s === 'true' || s === '1' || s === 'yes') return true
  }
  return Boolean(v)
}

function normalizeAdminUser(u: Record<string, unknown>): AdminUser {
  const rawActive = u.isActive !== undefined ? u.isActive : u.active
  return {
    ...(u as unknown as AdminUser),
    isActive: parseBoolLoose(rawActive, true),
    emailVerified: parseBoolLoose(u.emailVerified, false),
  }
}

const UserManagementPage = () => {
  const [searchText, setSearchText] = useState('')
  const [roleFilter, setRoleFilter] = useState<string | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'inactive'>('ALL')
  const [verifiedFilter, setVerifiedFilter] = useState<'ALL' | 'yes' | 'no'>('ALL')
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [editForm] = Form.useForm()
  const [dialects, setDialects] = useState<{ id: string; name: string; description?: string }[]>([])

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res: unknown = await adminService.getUsers().catch(() => null)
      if (!res || typeof res !== 'object') {
        setUsers([])
        return
      }
      const r = res as { data?: unknown }
      let fetchedUsers: AdminUser[] = []
      const payload = r.data !== undefined ? r.data : res
      if (Array.isArray(payload)) {
        fetchedUsers = payload as AdminUser[]
      } else if (payload && typeof payload === 'object' && 'content' in payload && Array.isArray((payload as { content: unknown }).content)) {
        fetchedUsers = (payload as { content: AdminUser[] }).content
      }
      setUsers(fetchedUsers.map((row) => normalizeAdminUser(row as unknown as Record<string, unknown>)))
    } catch {
      message.error('Không tải được danh sách.')
    } finally {
      setLoading(false)
    }
  }

  const fetchDialects = async () => {
    try {
      const res: any = await adminService.getDialects()
      const data = res?.data ?? (Array.isArray(res) ? res : [])
      setDialects(Array.isArray(data) ? data : [])
    } catch {
      console.error('Failed to fetch dialects')
    }
  }

  React.useEffect(() => {
    fetchUsers()
    fetchDialects()
  }, [])

  const handleCreateEducator = async (values: { email: string; fullName: string }) => {
    try {
      setSubmitting(true)
      const res: any = await adminService.createEducator(values)
      if (res.status === 'success') {
        message.success('Tạo tài khoản thành công. Mật khẩu đã được gửi qua email.')
        setIsModalVisible(false)
        form.resetFields()
        fetchUsers()
      } else {
        message.error('Có lỗi xảy ra khi tạo tài khoản.')
      }
    } catch (error: any) {
      message.error(error.message || 'Tạo tài khoản thất bại.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenEditModal = (user: AdminUser) => {
    setEditingUser(user)
    editForm.setFieldsValue({
      fullName: user.fullName,
      phone: user.phone || '',
      region: user.region || undefined,
    })
    setIsEditModalVisible(true)
  }

  const handleOpenDetail = (user: AdminUser) => {
    setDetailUser(user)
    setDetailOpen(true)
  }

  const handleUpdateUser = async (values: { fullName: string; phone?: string; region?: string }) => {
    if (!editingUser) return
    try {
      setSubmitting(true)
      const res: any = await adminService.updateUser(editingUser.id, values)
      if (res.status === 'success') {
        message.success('Cập nhật thông tin thành công.')
        setIsEditModalVisible(false)
        setEditingUser(null)
        fetchUsers()
      } else {
        message.error('Có lỗi xảy ra khi cập nhật.')
      }
    } catch (error: any) {
      message.error(error.message || 'Cập nhật thất bại.')
    } finally {
      setSubmitting(false)
    }
  }

  const performToggleStatus = async (record: AdminUser) => {
    const newStatus = !record.isActive
    try {
      const res: any = await adminService.updateUserStatus(record.id, newStatus)
      if (res.status === 'success') {
        message.success(`Đã ${newStatus ? 'mở khóa' : 'khóa'} tài khoản thành công.`)
        fetchUsers()
      } else {
        message.error('Có lỗi xảy ra.')
      }
    } catch (error: any) {
      message.error(error.message || 'Cập nhật trạng thái thất bại.')
    }
  }

  const handleToggleStatus = (record: AdminUser) => {
    const willLock = record.isActive === true
    if (willLock) {
      Modal.confirm({
        title: 'Cảnh báo khóa tài khoản',
        icon: <ExclamationCircleOutlined className="!text-amber-500" />,
        content: (
          <div className="space-y-2 text-gray-700">
            <p className="m-0">
              Bạn sắp <strong className="text-gray-900">khóa</strong> tài khoản{' '}
              <strong className="text-gray-900">{record.fullName?.trim() || record.email || 'người dùng này'}</strong>.
            </p>
            <p className="m-0">
              Sau khi khóa, người dùng <strong>không thể đăng nhập</strong> cho đến khi bạn mở khóa lại.
            </p>
          </div>
        ),
        okText: 'Khóa tài khoản',
        okButtonProps: { danger: true, type: 'primary' },
        cancelText: 'Hủy',
        centered: true,
        onOk: () => performToggleStatus(record),
      })
      return
    }
    void performToggleStatus(record)
  }

  const filteredData = useMemo(() => {
    return users.filter((user) => {
      const q = searchText.trim().toLowerCase()
      const matchSearch =
        !q ||
        user.fullName?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        user.phone?.toLowerCase().includes(q)
      const rc = user.roleCode ? String(user.roleCode).toUpperCase() : ''
      const matchRole = roleFilter === 'ALL' || rc === roleFilter
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive)
      const matchVerified =
        verifiedFilter === 'ALL' ||
        (verifiedFilter === 'yes' && user.emailVerified) ||
        (verifiedFilter === 'no' && !user.emailVerified)
      return matchSearch && matchRole && matchStatus && matchVerified
    })
  }, [users, searchText, roleFilter, statusFilter, verifiedFilter])

  const stats = useMemo(() => {
    const total = users.length
    const educators = users.filter((u) => String(u.roleCode).toUpperCase() === 'EDUCATOR').length
    const learners = users.filter((u) => String(u.roleCode).toUpperCase() === 'USER').length
    const verified = users.filter((u) => u.emailVerified).length
    const locked = users.filter((u) => !u.isActive).length
    return { total, educators, learners, verified, locked }
  }, [users])

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchText, roleFilter, statusFilter, verifiedFilter])

  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 72,
      align: 'center' as const,
      onHeaderCell: () => ({
        style: { whiteSpace: 'nowrap' as const, padding: '12px 8px' },
      }),
      onCell: () => ({
        style: {
          whiteSpace: 'nowrap' as const,
          width: 72,
          minWidth: 72,
          maxWidth: 72,
          padding: '12px 8px',
        },
      }),
      render: (_: unknown, __: AdminUser, index: number) => (
        <span className="inline-block whitespace-nowrap tabular-nums leading-none">
          {(currentPage - 1) * pageSize + index + 1}
        </span>
      ),
    },
    {
      title: 'Họ tên',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 280,
      minWidth: 220,
      ellipsis: true,
      onHeaderCell: () => ({ style: { whiteSpace: 'nowrap' as const } }),
      onCell: () => ({
        style: { minWidth: 220 },
      }),
      render: (text: string, record: AdminUser) => (
        <div className="flex items-start gap-3 min-w-0">
          <Avatar
            className="shrink-0"
            icon={<UserOutlined />}
            src={record.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${record.id}`}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="font-medium block w-full truncate" title={text || undefined}>
              {text || '—'}
            </span>
            <span className="block w-full truncate text-xs text-gray-500" title={record.email}>
              {record.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'roleCode',
      key: 'roleCode',
      width: 130,
      align: 'center' as const,
      render: (role: string | null | undefined) => (
        <Tag color={roleTagColor(role)}>{formatRole(role)}</Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 128,
      align: 'center' as const,
      onCell: () => ({ style: { whiteSpace: 'nowrap' as const } }),
      render: (_: boolean, record: AdminUser) => {
        const isUserActive = record.isActive === true
        const color = isUserActive ? 'success' : 'error'
        const icon = isUserActive ? <CheckCircleOutlined /> : <StopOutlined />
        return (
          <span className="inline-flex max-w-full">
            <Tag icon={icon} color={color} className="!m-0 whitespace-nowrap">
              {isUserActive ? 'Hoạt động' : 'Đã khóa'}
            </Tag>
          </span>
        )
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 144,
      align: 'center' as const,
      onCell: () => ({
        style: {
          whiteSpace: 'nowrap' as const,
          textAlign: 'center' as const,
        },
      }),
      render: (_: unknown, record: AdminUser) => (
        <div className="inline-flex flex-nowrap items-center justify-center gap-0.5 min-w-[132px]">
          <Tooltip title="Xem chi tiết" getPopupContainer={() => document.body}>
            <Button
              type="text"
              className="text-gray-700 flex items-center justify-center p-0 w-8 h-8 shrink-0"
              icon={<EyeOutlined style={{ fontSize: 18 }} />}
              onClick={() => handleOpenDetail(record)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa" getPopupContainer={() => document.body}>
            <Button
              type="text"
              className="text-blue-600 flex items-center justify-center p-0 w-8 h-8 shrink-0"
              icon={<EditOutlined style={{ fontSize: 18 }} />}
              onClick={() => handleOpenEditModal(record)}
            />
          </Tooltip>
          {record.isActive ? (
            <Tooltip title="Khóa tài khoản" getPopupContainer={() => document.body}>
              <Button
                type="text"
                danger
                className="flex items-center justify-center p-0 w-8 h-8 shrink-0"
                icon={<Lock size={18} />}
                onClick={() => handleToggleStatus(record)}
              />
            </Tooltip>
          ) : (
            <Tooltip title="Mở khóa" getPopupContainer={() => document.body}>
              <Button
                type="text"
                className="text-green-600 flex items-center justify-center p-0 w-8 h-8 shrink-0"
                icon={<Unlock size={18} />}
                onClick={() => handleToggleStatus(record)}
              />
            </Tooltip>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 m-0">Quản lý tài khoản</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button icon={<DownloadOutlined />} onClick={() => message.info('Tính năng Export Excel đang phát triển')}>
            Export Excel
          </Button>
          <Button icon={<UploadOutlined />} onClick={() => message.info('Tính năng Import Excel đang phát triển')}>
            Import Excel
          </Button>
          <Button
            type="primary"
            className="!bg-blue-600 !border-none hover:!bg-blue-500 !text-white"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            Thêm người dùng
          </Button>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" className="shadow-sm">
            <Statistic title="Tổng tài khoản" value={stats.total} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" className="shadow-sm">
            <Statistic title="Học viên / Giáo viên" value={`${stats.learners} / ${stats.educators}`} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" className="shadow-sm">
            <Statistic title="Email đã xác thực" value={stats.verified} suffix={`/ ${stats.total}`} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" className="shadow-sm">
            <Statistic title="Đang khóa" value={stats.locked} valueStyle={{ color: stats.locked ? '#cf1322' : undefined }} />
          </Card>
        </Col>
      </Row>

      <Card variant="borderless" className="shadow-sm rounded-xl">
        <div className="mb-4 flex flex-col gap-4">
          <div className="max-w-md">
            <Input
              placeholder="Tìm theo tên, email hoặc số điện thoại..."
              prefix={<SearchOutlined />}
              size="large"
              allowClear
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm text-gray-600">Lọc:</span>
            <Select
              className="min-w-[160px]"
              value={roleFilter}
              onChange={(v) => setRoleFilter(v)}
              options={[
                { value: 'ALL', label: 'Mọi vai trò' },
                { value: 'USER', label: 'Học viên' },
                { value: 'EDUCATOR', label: 'Giáo viên' },
                { value: 'ADMIN', label: 'Quản trị' },
              ]}
            />
            <Select
              className="min-w-[160px]"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
              options={[
                { value: 'ALL', label: 'Mọi trạng thái' },
                { value: 'active', label: 'Đang hoạt động' },
                { value: 'inactive', label: 'Đã khóa' },
              ]}
            />
            <Select
              className="min-w-[180px]"
              value={verifiedFilter}
              onChange={(v) => setVerifiedFilter(v)}
              options={[
                { value: 'ALL', label: 'Email (tất cả)' },
                { value: 'yes', label: 'Đã xác thực email' },
                { value: 'no', label: 'Chưa xác thực' },
              ]}
            />
          </div>
        </div>
        <Table<AdminUser>
          className="[&_.ant-table-cell]:align-middle"
          rowHoverable={false}
          tableLayout="fixed"
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          scroll={{ x: 900 }}
          pagination={{
            current: currentPage,
            pageSize,
            total: filteredData.length,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (t) => `${t} tài khoản`,
            onChange: (page, size) => {
              setCurrentPage(page)
              setPageSize(size || 10)
            },
          }}
          loading={loading}
          locale={{ emptyText: 'Chưa có dữ liệu' }}
        />
      </Card>

      <Modal
        title="Tạo tài khoản người dùng"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false)
          form.resetFields()
        }}
        footer={null}
      >
        <Form layout="vertical" form={form} onFinish={handleCreateEducator}>
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[
              { required: true, message: 'Vui lòng nhập họ và tên' },
              { min: 3, message: 'Tên phải ít nhất 3 ký tự' },
              { max: 50, message: 'Tên không quá 50 ký tự' },
            ]}
          >
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Vui lòng nhập đúng định dạng email' },
              { max: 100, message: 'Email không quá 100 ký tự' },
            ]}
          >
            <Input placeholder="teacher.nguyen@example.com" />
          </Form.Item>
          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              className="!bg-blue-600 !border-none hover:!bg-blue-500 !text-white"
              loading={submitting}
            >
              Tạo tài khoản
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title={null}
        open={detailOpen}
        onCancel={() => {
          setDetailOpen(false)
          setDetailUser(null)
        }}
        footer={
          <div className="flex justify-end">
            <Button type="primary" className="!bg-blue-600 !border-none hover:!bg-blue-500" onClick={() => setDetailOpen(false)}>
              Đóng
            </Button>
          </div>
        }
        width={640}
        styles={{ body: { paddingTop: 20 } }}
      >
        {detailUser && (
          <div>
            <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-100">
              <Avatar
                size={72}
                icon={<UserOutlined />}
                className="shrink-0"
                src={
                  detailUser.avatarUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${detailUser.id}`
                }
              />
              <div className="min-w-0 flex-1 pt-1 space-y-3">
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-0.5">Họ và tên</div>
                  <div className="text-base font-semibold text-gray-900 truncate">{detailUser.fullName || '—'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-0.5">Email</div>
                  <Text className="text-sm text-gray-800 block truncate" copyable={{ text: detailUser.email }}>
                    {detailUser.email}
                  </Text>
                </div>
              </div>
            </div>

            <Descriptions
              bordered
              size="middle"
              column={1}
              layout="horizontal"
              labelStyle={{
                width: 168,
                minWidth: 168,
                maxWidth: 168,
                verticalAlign: 'top',
                background: '#fafafa',
                fontWeight: 600,
                color: 'rgba(0,0,0,0.65)',
                whiteSpace: 'normal',
              }}
              contentStyle={{
                background: '#fff',
                verticalAlign: 'top',
                wordBreak: 'break-word',
              }}
            >
              <Descriptions.Item label="Số điện thoại">
                <span className="whitespace-nowrap tabular-nums">{detailUser.phone || '—'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Vùng miền">{getRegionLabel(detailUser.region)}</Descriptions.Item>
              <Descriptions.Item label="Vai trò">
                <Tag color={roleTagColor(detailUser.roleCode)}>{formatRole(detailUser.roleCode)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Xác thực email">
                {detailUser.emailVerified ? (
                  <Tag color="success">Đã xác thực</Tag>
                ) : (
                  <Tag color="warning">Chưa xác thực</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {detailUser.isActive ? (
                  <Tag color="success" icon={<CheckCircleOutlined />}>
                    Hoạt động
                  </Tag>
                ) : (
                  <Tag color="error" icon={<StopOutlined />}>
                    Đã khóa
                  </Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tham gia">
                <span className="whitespace-nowrap">
                  {detailUser.createdAt
                    ? new Date(detailUser.createdAt).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : '—'}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Đăng nhập cuối">
                <span className="whitespace-nowrap tabular-nums">
                  {detailUser.lastLoginDate
                    ? new Date(detailUser.lastLoginDate).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : 'Chưa có'}
                </span>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>

      <Modal
        title="Chỉnh sửa tài khoản"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false)
          setEditingUser(null)
          editForm.resetFields()
        }}
        footer={null}
      >
        <Form layout="vertical" form={editForm} onFinish={handleUpdateUser}>
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[
              { required: true, message: 'Vui lòng nhập họ và tên' },
              { min: 3, message: 'Tên phải ít nhất 3 ký tự' },
              { max: 50, message: 'Tên không quá 50 ký tự' },
            ]}
          >
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[
              {
                pattern: /^(0[35789])[0-9]{8}$/,
                message: 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)',
              },
            ]}
          >
            <Input placeholder="0901234567" />
          </Form.Item>
          <Form.Item
            name="region"
            label="Vùng miền"
            rules={[{ required: true, message: 'Vui lòng chọn vùng miền' }]}
          >
            <Select placeholder="Chọn vùng miền" allowClear={false}>
              {dialects.map((d) => {
                const label = getRegionLabel(d.name)
                const display = label === '—' ? d.description || d.name : label
                return (
                  <Select.Option key={d.id} value={d.name}>
                    {display}
                  </Select.Option>
                )
              })}
            </Select>
          </Form.Item>
          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setIsEditModalVisible(false)}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              className="!bg-blue-600 !border-none hover:!bg-blue-500 !text-white"
              loading={submitting}
            >
              Lưu thay đổi
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default UserManagementPage
