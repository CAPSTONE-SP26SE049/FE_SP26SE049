import React, { useMemo, useState } from 'react'
import {
  Tabs,
  Timeline,
  Card,
  Tag,
  Badge,
  Drawer,
  Form,
  Input,
  Select,
  Upload,
  Slider,
  InputNumber, // Changed from Slider
  Button,
  Spin,
  Modal,
  Table,
  Space,
  Popconfirm,
  Rate,
  Tooltip,
  Alert,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, HistoryOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { educatorService } from '../services/educatorService'
import { message } from 'antd'
import SnapshotDiffRenderer from '../../../components/common/SnapshotDiffRenderer'

// Removed hardcoded ERROR_TAG_OPTIONS

const getStatusTag = (status, rejectionReason, comment) => {
  if (!status) return null
  switch (status.toUpperCase()) {
    case 'APPROVED':
      return <Tag color="success">Đã duyệt</Tag>
    case 'PENDING':
      return <Tag color="warning">Chờ duyệt</Tag>
    case 'REJECTED':
      return (
        <Tooltip title={`Lý do: ${comment || rejectionReason || 'Không có'}`}>
          <Tag color="error" style={{ cursor: 'help' }}>Từ chối</Tag>
        </Tooltip>
      )
    case 'DRAFT':
    default:
      return <Tag color="default">Bản nháp</Tag>
  }
}

// Removed hardcoded REGIONS and REGION_CONFIG in favor of dynamic dialects

// Fallback dialect IDs in case a region has no existing levels to copy from
// Removed hardcoded REGION_DIALECT_MAP in favor of dynamic fetching.

const RoadmapManager = () => {
  const [selectedDialect, setSelectedDialect] = useState(null) // Replaces activeRegion for 2-step navigation
  const [editingLevel, setEditingLevel] = useState(null)
  const [form] = Form.useForm()

  const [levels, setLevels] = useState([])
  const [loading, setLoading] = useState(false)
  const [dialects, setDialects] = useState([])
  const [errorTags, setErrorTags] = useState([])
  const [allErrorTags, setAllErrorTags] = useState([])
  const [dialectStats, setDialectStats] = useState({})

  // Rejected content tracking
  const [rejectedLevels, setRejectedLevels] = useState([])
  const [rejectedLoading, setRejectedLoading] = useState(false)
  const [showRejected, setShowRejected] = useState(true)

  // Challenges state
  const [levelChallenges, setLevelChallenges] = useState([])
  const [challengesLoading, setChallengesLoading] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState(null)
  const [challengeForm] = Form.useForm()

  // History state
  const [historyModalVisible, setHistoryModalVisible] = useState(false)
  const [historyData, setHistoryData] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const openHistoryModal = async (itemId) => {
    setHistoryModalVisible(true)
    setHistoryLoading(true)
    try {
      const res = await educatorService.getContentHistory(itemId)
      if (res.status === 'success' || res.data) {
        setHistoryData(res.data || res)
      } else {
        setHistoryData([])
      }
    } catch (err) {
      message.error('Lỗi khi tải lịch sử duyệt')
      setHistoryData([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const fetchDialects = async () => {
    try {
      setLoading(true)
      const res = await educatorService.getDialects()
      const data = res?.data || (Array.isArray(res) ? res : [])
      setDialects(data)
    } catch (error) {
      console.error('Failed to fetch dialects:', error)
      message.error('Không thể tải danh sách vùng miền')
    } finally {
      // Don't turn off loading here, let fetchDialectStats do it
    }
  }

  const fetchDialectStats = async (dialectsList) => {
    try {
      const stats = {};
      await Promise.all(
        dialectsList.map(async (dialect) => {
          let levelCount = 0;
          let challengeCount = 0;
          try {
            const levelsRes = await educatorService.getCurriculumByRegion(dialect.name);
            const levels = levelsRes?.data || (Array.isArray(levelsRes) ? levelsRes : []);
            levelCount = levels.length;

            await Promise.all(
              levels.map(async (level) => {
                try {
                  const challengesRes = await educatorService.getChallengesByLevel(level.id);
                  const challenges = challengesRes?.data || (Array.isArray(challengesRes) ? challengesRes : []);
                  challengeCount += challenges.length;
                } catch (e) {
                  // ignore individual errors
                }
              })
            );
          } catch (e) {
            // ignore
          }
          stats[dialect.id] = { levelCount, challengeCount };
        })
      );
      setDialectStats(stats);
    } catch (error) {
      console.error("Failed to fetch dialect stats", error);
    } finally {
      setLoading(false);
    }
  }

  const fetchErrorTags = async (dialectId) => {
    if (!dialectId) return []
    try {
      const res = await educatorService.getErrorTags(dialectId)
      const data = res?.data || (Array.isArray(res) ? res : [])
      const finalTags = Array.isArray(data) ? data : []
      setErrorTags(finalTags)
      return finalTags
    } catch (error) {
      console.error('Failed to fetch error tags:', error)
      return []
    }
  }

  const fetchAllErrorTags = async () => {
    try {
      const res = await educatorService.getErrorTags() // No dialectId = all tags
      const data = res?.data || (Array.isArray(res) ? res : [])
      setAllErrorTags(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch all error tags:', error)
    }
  }

  const fetchAllRejectedLevels = async () => {
    try {
      setRejectedLoading(true)
      // Use dynamic codes from dialects if available, fallback to basic ones
      const regionNames = dialects.length > 0 ? dialects.map(d => d.name) : ['SOUTH', 'CENTRAL', 'NORTH']
      const results = await Promise.all(
        regionNames.map(r => educatorService.getCurriculumByRegion(r).catch(() => ({ status: 'error', data: [] })))
      )
      const allLevels = results.flatMap(res => {
        const data = res?.data || (Array.isArray(res) ? res : [])
        return Array.isArray(data) ? data : []
      })
      setRejectedLevels(allLevels.filter(l => l.status?.toUpperCase() === 'REJECTED'))
    } catch (error) {
      console.error('Failed to fetch rejected levels:', error)
    } finally {
      setRejectedLoading(false)
    }
  }

  const fetchLevels = async (region) => {
    try {
      setLoading(true)
      const res = await educatorService.getCurriculumByRegion(region)
      const data = res?.data || (Array.isArray(res) ? res : [])
      setLevels(Array.isArray(data) ? data : [])
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu lộ trình')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchDialects()
    fetchAllErrorTags()
  }, [])

  React.useEffect(() => {
    if (dialects.length > 0) {
      fetchAllRejectedLevels()
      if (Object.keys(dialectStats).length === 0) {
        fetchDialectStats(dialects);
      }
    }
  }, [dialects])

  React.useEffect(() => {
    if (selectedDialect) {
      fetchLevels(selectedDialect.name)
      fetchErrorTags(selectedDialect.id)
    }
  }, [selectedDialect])

  const fetchChallenges = async (levelId) => {
    try {
      setChallengesLoading(true)
      const res = await educatorService.getChallengesByLevel(levelId)
      console.log('fetchChallenges res:', res);
      const data = res?.data || (Array.isArray(res) ? res : [])
      console.log('fetchChallenges data:', data);
      setLevelChallenges(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch challenges:', error)
      // Don't show global message error here to avoid noise in the modal
    } finally {
      setChallengesLoading(false)
    }
  }

  const handleNodeClick = (level) => {
    setEditingLevel(level)
    form.setFieldsValue({
      name: level.name,
      description: level.description,
      levelOrder: level.levelOrder,
      minStarsRequired: level.minStarsRequired,
      errorTagId: level.errorTagId || (level.errorTag && typeof level.errorTag === 'object' ? level.errorTag.id : level.errorTag),
      aiThreshold: level.aiThreshold,
      audioUrl: level.audioUrl,
      comment: '', // Reset comment for new edit session
    })

    // Fetch challenges and error tags for this level
    if (level.id) {
      fetchChallenges(level.id)
      const levelDialectId = level.dialect?.id || getDialectIdForRegion(activeRegion)
      fetchErrorTags(levelDialectId)
    } else {
      setLevelChallenges([])
    }
  }

  const handleAddNode = () => {
    // Determine the next level order
    const nextOrder = levels.length > 0 ? Math.max(...levels.map(l => l.levelOrder)) + 1 : 1
    const dialectId = selectedDialect?.id

    setEditingLevel({ isNew: true })
    form.resetFields()
    form.setFieldsValue({
      levelOrder: nextOrder,
      minStarsRequired: 0,
    })

    // Fetch error tags for the new level's region
    fetchErrorTags(dialectId)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      if (editingLevel.isNew) {
        const dialectId = selectedDialect?.id

        if (!dialectId) {
          throw new Error(`Không thể xác định ID Vùng miền, Vui lòng kiểm tra lại.`);
        }

        await educatorService.createLevel({
          dialectId: dialectId,
          levelOrder: values.levelOrder,
          name: values.name,
          description: values.description || '',
          minStarsRequired: values.minStarsRequired || 0,
          errorTagId: values.errorTagId,
          comment: values.comment
        })
        message.success('Tạo bài học thành công')
      } else {
        await educatorService.updateLevel(editingLevel.id || editingLevel.key, {
          name: values.name,
          description: values.description,
          levelOrder: values.levelOrder,
          minStarsRequired: values.minStarsRequired,
          errorTagId: values.errorTagId,
          aiThreshold: values.aiThreshold,
          comment: values.comment,
        })

        // Upload audio url if provided
        if (values.audioUrl) {
          try {
            await educatorService.uploadReferenceAudio(editingLevel.id || editingLevel.key, values.audioUrl)
          } catch (audioError) {
            console.error('Failed to upload audio url:', audioError)
            message.warning('Đã cập nhật bài học, nhưng cập nhật link Audio thất bại.')
          }
        }
      }

      fetchLevels(selectedDialect?.name)
      setEditingLevel(null) // Close modal
    } catch (error) {
      console.error('Failed to save level:', error)
      if (error?.name !== 'ValidationError') {
        const errorMsg = error?.message || (editingLevel?.isNew ? 'Không thể tạo bài học' : 'Không thể cập nhật bài học')
        message.error(typeof errorMsg === 'string' ? errorMsg : 'Đã xảy ra lỗi hệ thống')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteNode = (id) => {
    Modal.confirm({
      title: 'Xóa bài học?',
      content: 'Hành động này sẽ xóa vĩnh viễn bài học và không thể hoàn tác.',
      okText: 'Xóa ngay',
      cancelText: 'Hủy',
      okButtonProps: {
        danger: true,
        style: { background: '#ff4d4f', color: '#fff', border: 'none', height: '36px', borderRadius: '6px' }
      },
      cancelButtonProps: {
        style: { height: '36px', borderRadius: '6px' }
      },
      onOk: async () => {
        try {
          setLoading(true)
          await educatorService.deleteLevel(id)
          message.success('Đã xóa bài học thành công')
          fetchLevels(selectedDialect?.name)
        } catch (error) {
          console.error('Failed to delete level:', error)
          message.error('Không thể xóa bài học')
        } finally {
          setLoading(false)
        }
      }
    })
  }

  const handleChallengeSave = async () => {
    try {
      const values = await challengeForm.validateFields()
      setLoading(true)

      const payload = {
        levelId: editingLevel.id,
        ...values,
        focusPhonemes: Array.isArray(values.focusPhonemes) ? values.focusPhonemes.join(', ') : values.focusPhonemes
      }

      if (editingChallenge && editingChallenge.id) {
        await educatorService.updateChallenge(editingChallenge.id, payload)
        message.success('Cập nhật bài tập thành công')
      } else {
        await educatorService.createChallenge(payload)
        message.success('Thêm bài tập thành công')
      }

      fetchChallenges(editingLevel.id)
      setEditingChallenge(null)
    } catch (error) {
      console.error('Failed to save challenge:', error)
      message.error('Không thể lưu bài tập')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteChallenge = async (id) => {
    try {
      setLoading(true)
      await educatorService.deleteChallenge(id)
      message.success('Đã xóa bài tập')
      fetchChallenges(editingLevel.id)
    } catch (error) {
      message.error('Xóa bài tập thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleAddChallenge = () => {
    setEditingChallenge({ isNew: true })
    challengeForm.resetFields()
  }

  const handleEditChallenge = (challenge) => {
    setEditingChallenge(challenge)
    challengeForm.setFieldsValue({
      ...challenge,
      focusPhonemes: challenge.focusPhonemes ?
        (Array.isArray(challenge.focusPhonemes) ?
          challenge.focusPhonemes.map(p => typeof p === 'object' ? p.id : p) :
          challenge.focusPhonemes.split(',').map(s => s.trim())
        ) : [],
      comment: '', // Reset comment for new edit session
    })
  }

  if (loading && dialects.length === 0) {
    return (
      <div className="flex justify-center items-center h-48">
        <Spin size="large" description="Đang tải dữ liệu..." />
      </div>
    )
  }

  // STEP 1: Region Selection Table
  if (!selectedDialect) {
    return (
      <div className="roadmap-region-selection">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 m-0">Lộ Trình Học Tập - Chọn Phương Ngữ</h2>
        </div>
        <Card variant="borderless" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', background: '#fff' }}>
          <Table
            dataSource={dialects}
            rowKey="id"
            loading={loading}
            pagination={false}
            onRow={(record) => ({
              onClick: () => setSelectedDialect(record),
              style: { cursor: 'pointer' }
            })}
            columns={[
              {
                title: 'STT',
                key: 'stt',
                width: 70,
                align: 'center',
                render: (_, __, index) => index + 1,
              },
              {
                title: 'Khu vực / Tên phương ngữ',
                dataIndex: 'description',
                key: 'description',
                align: 'center',
                render: (text) => <span className="font-semibold text-blue-600 text-lg">{text}</span>
              },
              {
                title: 'Số cấp độ / bài kiểm tra',
                key: 'levelCount',
                align: 'center',
                render: (_, record) => {
                  const count = dialectStats[record.id]?.levelCount;
                  return count !== undefined ? <Tag color="blue">{count}</Tag> : <Spin size="small" />;
                }
              },
              {
                title: 'Số thử thách',
                key: 'challengeCount',
                align: 'center',
                render: (_, record) => {
                  const count = dialectStats[record.id]?.challengeCount;
                  return count !== undefined ? <Tag color="green">{count}</Tag> : <Spin size="small" />;
                }
              }
            ]}
          />
        </Card>
      </div>
    )
  }

  // STEP 2: Roadmap Management
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => setSelectedDialect(null)}
            className="rounded-lg h-9 px-4"
          >
            Trở Về
          </Button>
          <h2 className="text-xl font-bold text-gray-800 m-0">
            Lộ Trình: <span className="text-blue-600">{selectedDialect.description || selectedDialect.name}</span>
          </h2>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddNode}
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium h-9 px-4 rounded-lg border-none shadow-sm shadow-blue-200"
        >
          Thêm Bài Học Mới
        </Button>
      </div>

      {/* ===== Nội dung bị từ chối ===== */}
      {(rejectedLoading || rejectedLevels.length > 0) && showRejected && (
        <Card
          className="mb-4 rounded-xl"
          style={{ background: 'linear-gradient(135deg, #fff5f5 0%, #fff 100%)', borderColor: '#fca5a5', border: '1px solid #fca5a5' }}
        >
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚫</span>
              <div>
                <h3 className="text-red-700 font-bold text-base m-0">
                  Nội dung bị từ chối ({rejectedLevels.length})
                </h3>
                <p className="text-red-400 text-xs m-0">Vui lòng sửa lại và lưu để gửi lên Admin phê duyệt lại</p>
              </div>
            </div>
            <Button type="text" size="small" onClick={() => setShowRejected(false)} className="text-gray-400">Ẩn</Button>
          </div>
          {rejectedLoading ? (
            <div className="text-center py-4"><Spin /></div>
          ) : (
            <div className="space-y-3">
              {rejectedLevels.map(level => (
                <div key={level.id} className="bg-white rounded-xl border border-red-100 p-3 shadow-sm">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Tag color="red">BỊ TỪ CHỐI</Tag>
                        <span className="font-semibold text-gray-800">{level.name}</span>
                        <Tag color="blue" className="text-xs">Thứ tự: {level.levelOrder}</Tag>
                      </div>
                      <Alert
                        type="error"
                        showIcon
                        className="rounded-lg"
                        message="Lý do từ chối từ Admin:"
                        description={
                          <span className="font-medium">
                            {level.comment || level.rejectionReason || 'Admin chưa nhập lý do cụ thể.'}
                          </span>
                        }
                      />
                    </div>
                    <Button
                      type="default"
                      icon={<HistoryOutlined />}
                      className="rounded-lg h-8 px-3 mt-0 flex-shrink-0"
                      onClick={() => openHistoryModal(level.originalId || level.parentId || level.id)}
                    >
                      Lịch sử
                    </Button>
                    <Button
                      type="primary"
                      icon={<EditOutlined />}
                      className="bg-blue-600 hover:bg-blue-500 border-none rounded-lg h-8 px-4 mt-0 flex-shrink-0"
                      onClick={() => handleNodeClick(level)}
                    >
                      Sửa &amp; Gửi lại
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Card
        variant="borderless"
        style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', background: '#fff' }}
      >
        <Table
          dataSource={Array.isArray(levels) ? levels : []}
          rowKey={(record) => record.id}
          loading={loading}
          pagination={{ pageSize: 10 }}
          onRow={(record) => ({
            onClick: () => handleNodeClick(record),
            style: { cursor: 'pointer' }
          })}
          columns={[
            {
              title: 'Tên bài học',
              dataIndex: 'name',
              key: 'name',
              filterSearch: true,
              onFilter: (value, record) => record.name.toLowerCase().includes(value.toLowerCase()),
              render: (text) => <span style={{ fontWeight: 600, color: '#1890ff' }}>{text}</span>,
            },
            {
              title: 'Mô tả',
              dataIndex: 'description',
              key: 'description',
              ellipsis: true,
            },
            {
              title: 'Ngưỡng AI',
              dataIndex: 'aiThreshold',
              key: 'aiThreshold',
              render: (val) => <Tag color="orange" variant="filled">{val}%</Tag>,
              width: 120,
            },
            {
              title: 'Lỗi tập trung',
              dataIndex: 'errorTag',
              key: 'errorTag',
              render: (tag, record) => {
                if (!tag) return '-';

                // If tag is an object (from direct level fetch), use its name
                if (typeof tag === 'object' && tag.name) return <Tag color="cyan" variant="filled">{tag.name}</Tag>;

                // Otherwise (if it's a UUID or tag object without name), try resolving from allErrorTags or use record.errorTagId
                const tagId = typeof tag === 'object' ? tag.id : tag;
                const resolvedTag = allErrorTags.find(t => t.id === tagId || t.tagCode === tagId);

                return <Tag color="cyan" variant="filled">{resolvedTag ? resolvedTag.name : tagId}</Tag>;
              }
            },
            {
              title: 'Trạng thái',
              key: 'status',
              render: (_, record) => getStatusTag(record.status, record.rejectionReason, record.comment),
              width: 150,
            },
            {
              title: 'Thao tác',
              key: 'actions',
              width: 120,
              render: (_, record) => (
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Tooltip title="Lịch sử duyệt">
                    <Button
                      type="text"
                      size="small"
                      icon={<HistoryOutlined />}
                      onClick={() => openHistoryModal(record.originalId || record.parentId || record.id)}
                      className="bg-gray-50 hover:bg-gray-200 text-gray-600 transition-all rounded-md"
                    />
                  </Tooltip>
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteNode(record.id)}
                    className="opacity-100 hover:scale-120 transition-all text-red-500 hover:text-red-700 font-bold"
                    style={{ background: 'rgba(255, 77, 79, 0.05)', borderRadius: '6px' }}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={<span style={{ fontWeight: 600 }}>{editingLevel?.isNew ? 'Thêm Bài Học Mới' : 'Chi Tiết Bài Học'}</span>}
        open={!!editingLevel}
        onCancel={() => setEditingLevel(null)}
        footer={null} // Use custom footer in tabs if needed, or handle save inside
        width={800}
        centered
      >
        <Tabs
          defaultActiveKey="config"
          items={[
            {
              key: 'config',
              label: 'Cấu hình bài học',
              children: (
                <div className="py-1">
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSave}
                    style={{ marginTop: 8 }}
                  >
                    <Form.Item
                      label="Tên bài học"
                      name="name"
                      rules={[
                        { required: true, message: 'Vui lòng nhập tên bài học' },
                        { min: 3, message: 'Tên bài học phải ít nhất 3 ký tự' },
                        { max: 100, message: 'Tên bài học không quá 100 ký tự' }
                      ]}
                    >
                      <Input placeholder="Nhập tên bài học..." />
                    </Form.Item>

                    <Form.Item
                      label="Mô tả bài học"
                      name="description"
                      rules={[{ max: 500, message: 'Mô tả không quá 500 ký tự' }]}
                    >
                      <Input.TextArea placeholder="Nhập mô tả chi tiết..." rows={2} showCount maxLength={500} />
                    </Form.Item>

                    <div className="flex gap-3">
                      <Form.Item
                        label="Thứ tự bài học"
                        name="levelOrder"
                        rules={[{ required: true, message: 'Nhập thứ tự' }]}
                        className="flex-1"
                        tooltip="Thứ tự bài học được hệ thống quản lý tự động"
                      >
                        <InputNumber min={1} style={{ width: '100%' }} disabled />
                      </Form.Item>

                      <Form.Item
                        label="Số sao yêu cầu"
                        name="minStarsRequired"
                        rules={[{ required: true, message: 'Chọn số sao' }]}
                        className="flex-1"
                        tooltip="Số lượng sao tối thiểu người học cần đạt được ở bài học trước để mở khóa bài học này."
                      >
                        <Rate count={5} character={<span style={{ fontSize: '24px' }}>★</span>} />
                      </Form.Item>
                    </div>

                    <Form.Item
                      label="Lỗi tập trung (Error Tag)"
                      name="errorTagId"
                      rules={[{ required: true, message: 'Vui lòng chọn loại lỗi' }]}
                    >
                      <Select
                        placeholder="Chọn loại lỗi luyện tập"
                        allowClear
                        showSearch
                        optionFilterProp="children"
                        loading={loading}
                        options={errorTags.map(tag => ({
                          label: `${tag.name}${tag.description ? ` - ${tag.description}` : ''}`,
                          value: tag.id
                        }))}
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                      />
                    </Form.Item>

                    <Form.Item
                      label="Ngưỡng đạt (AI Threshold %)"
                      tooltip="Mức độ chính xác tối thiểu (%) mà AI yêu cầu học viên phải đạt được để vượt qua các thử thách trong bài học này."
                      style={{ marginBottom: '24px' }}
                    >
                      <div className="flex items-center gap-3">
                        <Form.Item name="aiThreshold" noStyle rules={[{ required: true, message: 'Vui lòng chọn ngưỡng đạt' }]}>
                          <Slider
                            min={0}
                            max={100}
                            className="flex-1"
                            marks={{ 0: '0%', 50: '50%', 80: '80%', 100: '100%' }}
                          />
                        </Form.Item>
                        <Form.Item name="aiThreshold" noStyle>
                          <InputNumber
                            min={0}
                            max={100}
                            formatter={(value) => `${value}%`}
                            parser={(value) => value?.replace('%', '')}
                            style={{ width: '80px' }}
                          />
                        </Form.Item>
                      </div>
                    </Form.Item>

                    <Form.Item
                      label="Link Audio Mẫu (Audio URL)"
                      name="audioUrl"
                      tooltip="Đường dẫn đến file âm thanh mẫu chuẩn của bài học này (Drive, S3,...)"
                      rules={[{ type: 'url', message: 'Vui lòng nhập link hợp lệ (http/https)' }]}
                    >
                      <Input placeholder="https://example.com/audio.mp3" />
                    </Form.Item>

                    <Form.Item
                      label="Ghi chú thay đổi"
                      name="comment"
                      tooltip="Nhập lý do hoặc nội dung thay đổi cho bài học này (Bắt buộc khi cập nhật)."
                      rules={[
                        { required: !editingLevel?.isNew, message: 'Vui lòng nhập ghi chú thay đổi' },
                        { max: 200, message: 'Ghi chú không quá 200 ký tự' }
                      ]}
                    >
                      <Input.TextArea placeholder="Chi tiết các thay đổi..." rows={2} showCount maxLength={500} />
                    </Form.Item>

                    <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-gray-100">
                      <Button onClick={() => setEditingLevel(null)} className="rounded-lg h-10 px-6 font-medium">Hủy</Button>
                      <Button
                        type="primary"
                        onClick={() => form.submit()}
                        loading={loading}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold h-10 px-8 rounded-lg border-none shadow-md shadow-blue-100"
                      >
                        Lưu Bài Học
                      </Button>
                    </div>
                  </Form>
                </div>
              )
            },
            {
              key: 'challenges',
              label: 'Danh sách bài tập',
              disabled: editingLevel?.isNew,
              children: (
                <div className="py-1">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-500 italic text-xs">Quản lý các từ/câu luyện tập bên trong bài học này.</span>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleAddChallenge}
                      size="small"
                      className="bg-blue-600 hover:bg-blue-500 border-none rounded-md px-3"
                    >
                      Thêm bài tập
                    </Button>
                  </div>

                  <Table
                    size="small"
                    dataSource={levelChallenges}
                    loading={challengesLoading}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    columns={[
                      {
                        title: 'STT',
                        key: 'stt',
                        width: 60,
                        align: 'center',
                        render: (_, __, index) => index + 1,
                      },
                      { title: 'Nội dung', dataIndex: 'contentText', key: 'contentText' },
                      {
                        title: 'Loại',
                        dataIndex: 'type',
                        key: 'type',
                        render: t => <Tag color={t === 'WORD' ? 'blue' : t === 'SENTENCE' ? 'green' : 'purple'}>{t}</Tag>,
                        width: 100
                      },
                      {
                        title: 'Âm vị/Lỗi',
                        key: 'focusPhonemes',
                        render: (_, record) => {
                          if (!record.focusPhonemes) return '-';
                          const tags = Array.isArray(record.focusPhonemes) ? record.focusPhonemes :
                            (typeof record.focusPhonemes === 'string' ? record.focusPhonemes.split(',').filter(s => s.trim()) : []);
                          return (
                            <div className="flex flex-wrap gap-1">
                              {tags.map((tag, i) => {
                                const tagName = typeof tag === 'object' ? tag.name : tag;
                                return <Tag color="cyan" key={i} className="text-[10px] m-0">{tagName}</Tag>
                              })}
                            </div>
                          );
                        }
                      },
                      { title: 'Phiên âm', dataIndex: 'phoneticTranscriptionIpa', key: 'phoneticTranscriptionIpa' },
                      {
                        title: 'Trạng thái',
                        dataIndex: 'status',
                        width: 130,
                        render: (s, record) => (
                          <div>
                            {getStatusTag(s, record.rejectionReason, record.comment)}
                            {s?.toUpperCase() === 'REJECTED' && (record.comment || record.rejectionReason) && (
                              <div className="text-red-500 text-xs mt-1 leading-snug">
                                🚫 {record.comment || record.rejectionReason}
                              </div>
                            )}
                          </div>
                        )
                      },
                      {
                        title: 'Thao tác',
                        key: 'action',
                        render: (_, record) => (
                          <Space>
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all border-none"
                              onClick={() => handleEditChallenge(record)}
                            />
                            <Button
                              type="text"
                              size="small"
                              icon={<HistoryOutlined />}
                              className="flex items-center justify-center w-7 h-7 rounded-md bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition-all border-none"
                              onClick={() => openHistoryModal(record.id)}
                            />
                            <Popconfirm title="Xóa bài tập này?" onConfirm={() => handleDeleteChallenge(record.id)}>
                              <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                className="flex items-center justify-center w-7 h-7 rounded-md bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all border-none"
                              />
                            </Popconfirm>
                          </Space>
                        )
                      }
                    ]}
                  />
                </div>
              )
            }
          ]}
        />
      </Modal>

      {/* Challenge Edit Modal */}
      <Modal
        title={editingChallenge?.isNew ? "Thêm Bài Tập Mới" : "Sửa Bài Tập"}
        open={!!editingChallenge}
        onCancel={() => setEditingChallenge(null)}
        onOk={() => challengeForm.submit()}
        okText="Lưu bài tập"
        cancelText="Hủy"
        okButtonProps={{
          loading: loading,
          className: "bg-blue-600 hover:bg-blue-500 text-white font-semibold h-10 px-8 rounded-lg border-none shadow-md shadow-blue-100"
        }}
        cancelButtonProps={{
          className: "rounded-lg h-10 px-6 font-medium"
        }}
        centered
      >
        <Form layout="vertical" form={challengeForm} onFinish={handleChallengeSave} style={{ marginTop: 16 }}>
          <div className="flex gap-3">
            <Form.Item className="flex-1" name="type" label="Loại Thử Thách" rules={[{ required: true, message: 'Bắt buộc' }]}>
              <Select options={[{ label: 'Từ đơn (WORD)', value: 'WORD' }, { label: 'Câu (SENTENCE)', value: 'SENTENCE' }, { label: 'Đoạn văn (PARAGRAPH)', value: 'PARAGRAPH' }]} />
            </Form.Item>
            <Form.Item
              className="flex-1"
              name="focusPhonemes"
              label="Âm Vị Tập Trung"
              rules={[{ required: true, message: 'Chọn ít nhất một âm vị' }]}
            >
              <Select
                mode="multiple"
                placeholder="Chọn âm vị..."
                allowClear
                showSearch
                optionFilterProp="children"
                loading={loading}
                options={errorTags.map(tag => ({
                  label: `${tag.name}${tag.description ? ` - ${tag.description}` : ''}`,
                  value: tag.id
                }))}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </div>
          <Form.Item
            name="contentText"
            label="Nội Dung Text"
            rules={[
              { required: true, message: 'Vui lòng nhập nội dung text' },
              { max: 1000, message: 'Nội dung không quá 1000 ký tự' }
            ]}
          >
            <Input placeholder="VD: Năng lực" />
          </Form.Item>
          <Form.Item
            name="phoneticTranscriptionIpa"
            label="Phiên Âm IPA"
            rules={[
              { required: true, message: 'Vui lòng nhập phiên âm IPA' },
              { pattern: /^[^\s]+(\s[^\s]+)*$/, message: 'Định dạng IPA không hợp lệ' }
            ]}
          >
            <Input placeholder="VD: naŋ˧ lak̚˧" />
          </Form.Item>
          <Form.Item
            name="referenceAudioUrl"
            label="Link Audio Mẫu"
            rules={[{ type: 'url', message: 'Vui lòng nhập link hợp lệ (http/https)' }]}
          >
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item
            name="comment"
            label="Ghi chú thay đổi"
            tooltip="Nhập lý do hoặc nội dung thay đổi cho bài tập này (Bắt buộc khi cập nhật)."
            rules={[
              { required: !!editingChallenge?.id, message: 'Vui lòng nhập ghi chú thay đổi' },
              { max: 200, message: 'Ghi chú không quá 200 ký tự' }
            ]}
          >
            <Input.TextArea placeholder="Nhập ghi chú..." rows={2} showCount maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>

      {/* History Modal */}
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
              items={historyData.map((item, index) => {
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
                        <span className="text-xs text-gray-400 font-normal">
                          {new Date(item.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      {item.comment && (
                        <div className="text-sm bg-gray-50 p-2 rounded mt-1 text-gray-700">
                          {item.comment}
                        </div>
                      )}
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
    </>
  )
}

export default RoadmapManager
