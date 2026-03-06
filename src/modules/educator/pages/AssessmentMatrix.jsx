import React, { useState } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  InputNumber,
  Card,
  Tag,
  message,
} from 'antd'
import { educatorService } from '../services/educatorService'
import { useEffect } from 'react'

const ERROR_TYPES = [
  { label: 'Phát âm L/N', value: 'ln' },
  { label: 'Phát âm S/X', value: 'sx' },
  { label: 'Thanh điệu (Tones)', value: 'tones' },
  { label: 'Phát âm V/D', value: 'vd' },
]

const TARGET_REGIONS = [
  { label: 'Lộ trình Miền Bắc', value: 'north' },
  { label: 'Lộ trình Miền Trung', value: 'central' },
  { label: 'Lộ trình Miền Nam', value: 'south' },
]

const CHECKPOINTS = [
  { label: 'Bắt đầu từ Bài 1', value: 'level-1' },
  { label: 'Bắt đầu từ Bài 3', value: 'level-3' },
  { label: 'Bắt đầu từ Bài 5', value: 'level-5' },
]

const AssessmentMatrix = () => {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [form] = Form.useForm()

  const fetchRules = async () => {
    try {
      setLoading(true)
      const res = await educatorService.getPlacementRules()
      if (res.status === 'success' || res.data) {
        setRules(res.data || res)
      }
    } catch (error) {
      message.error('Không thể lấy danh sách luật phân lớp')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRules()
  }, [])

  const openNewRuleModal = () => {
    setEditingRule(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEditRuleModal = (record) => {
    setEditingRule(record)
    form.setFieldsValue({
      errorType: record.errorType,
      threshold: record.threshold,
      targetRegion: record.targetRegion,
      checkpoint: record.checkpoint,
      priority: record.priority,
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      await educatorService.upsertPlacementRule({
        ...values,
        id: editingRule?.id // Optional: backend handles upsert by errorType/region as per note
      })

      message.success(editingRule ? 'Rule updated' : 'Rule created')
      fetchRules()
      setModalOpen(false)
    } catch (error) {
      if (error.name !== 'ValidationError') {
        message.error('Failed to save rule')
      }
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Điều kiện (Loại lỗi sai)',
      dataIndex: 'errorType',
      key: 'errorType',
      render: (value) => {
        const label = ERROR_TYPES.find((t) => t.value === value)?.label ?? value
        return <Tag color="geekblue">{label}</Tag>
      },
    },
    {
      title: 'Ngưỡng đạt (> %)',
      dataIndex: 'threshold',
      key: 'threshold',
      render: (value) => `> ${value}%`,
    },
    {
      title: 'Hành động điều hướng (Lộ trình đích)',
      key: 'action',
      render: (_, record) => {
        const regionLabel =
          TARGET_REGIONS.find((r) => r.value === record.targetRegion)?.label ??
          record.targetRegion
        const checkpointLabel =
          CHECKPOINTS.find((c) => c.value === record.checkpoint)?.label ??
          record.checkpoint

        return (
          <span>
            <Tag color="purple">{regionLabel}</Tag>
            <Tag color="cyan">{checkpointLabel}</Tag>
          </span>
        )
      },
    },
    {
      title: 'Độ ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      sorter: (a, b) => a.priority - b.priority,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => openEditRuleModal(record)}
          style={{ fontWeight: 600 }}
        >
          Sửa
        </Button>
      ),
    },
  ]

  return (
    <>
      <Card
        variant="borderless"
        title={<span style={{ fontWeight: 600 }}>Logic Kiểm Tra Đầu Vào</span>}
        style={{ marginBottom: 16, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}
      >
        Các quy tắc này quyết định học sinh sẽ bắt đầu lộ trình từ đâu dựa trên kết quả bài kiểm tra đầu vào.
        Hệ thống sẽ đánh giá theo thứ tự ưu tiên và điều hướng người học đến vùng miền và bài học phù hợp.
      </Card>

      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button
          type="primary"
          onClick={openNewRuleModal}
          style={{ borderRadius: '8px', background: '#1890ff', border: 'none' }}
        >
          Thêm Quy Tắc Mới
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={rules}
        pagination={false}
        rowKey="key"
      />

      <Modal
        open={modalOpen}
        title={<span style={{ fontWeight: 600 }}>{editingRule ? 'Chỉnh Sửa Quy Tắc' : 'Thêm Quy Tắc Mới'}</span>}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText="Lưu Quy Tắc"
        cancelText="Hủy"
        okButtonProps={{ style: { background: '#1890ff', border: 'none' } }}
        centered
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Loại lỗi sai"
            name="errorType"
            rules={[{ required: true, message: 'Vui lòng chọn loại lỗi sai' }]}
          >
            <Select options={ERROR_TYPES} placeholder="Chọn loại lỗi sai" />
          </Form.Item>

          <Form.Item
            label="Ngưỡng đạt (> %)"
            name="threshold"
            rules={[
              { required: true, message: 'Vui lòng nhập phần trăm ngưỡng đạt' },
            ]}
          >
            <InputNumber
              min={0}
              max={100}
              style={{ width: '100%' }}
              addonAfter="%"
            />
          </Form.Item>

          <Form.Item
            label="Vùng miền (Lộ trình đích)"
            name="targetRegion"
            rules={[{ required: true, message: 'Vui lòng chọn vùng miền' }]}
          >
            <Select
              options={TARGET_REGIONS}
              placeholder="Chọn vùng miền đích"
            />
          </Form.Item>

          <Form.Item
            label="Bài học (Checkpoint)"
            name="checkpoint"
            rules={[{ required: true, message: 'Vui lòng chọn bài học checkpoint' }]}
          >
            <Select options={CHECKPOINTS} placeholder="Chọn bài học checkpoint" />
          </Form.Item>

          <Form.Item
            label="Độ ưu tiên"
            name="priority"
            rules={[{ required: true, message: 'Vui lòng thiết lập độ ưu tiên' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default AssessmentMatrix

