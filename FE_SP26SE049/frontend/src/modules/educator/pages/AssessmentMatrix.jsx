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
} from 'antd'

const ERROR_TYPES = [
  { label: 'L/N', value: 'ln' },
  { label: 'S/X', value: 'sx' },
  { label: 'Tones', value: 'tones' },
  { label: 'V/D', value: 'vd' },
]

const TARGET_REGIONS = [
  { label: 'North Map', value: 'north' },
  { label: 'Central Map', value: 'central' },
  { label: 'South Map', value: 'south' },
]

const CHECKPOINTS = [
  { label: 'Start at Level 1', value: 'level-1' },
  { label: 'Start at Level 3', value: 'level-3' },
  { label: 'Start at Level 5', value: 'level-5' },
]

const AssessmentMatrix = () => {
  const [rules, setRules] = useState([
    {
      key: '1',
      errorType: 'tones',
      threshold: 30,
      targetRegion: 'central',
      checkpoint: 'level-1',
      priority: 1,
    },
    {
      key: '2',
      errorType: 'ln',
      threshold: 40,
      targetRegion: 'north',
      checkpoint: 'level-3',
      priority: 2,
    },
  ])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [form] = Form.useForm()

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

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      if (editingRule) {
        const updated = rules.map((rule) =>
          rule.key === editingRule.key ? { ...editingRule, ...values } : rule,
        )
        setRules(updated)
        // eslint-disable-next-line no-console
        console.log('Updated rule set:', updated)
      } else {
        const newRule = {
          key: String(Date.now()),
          ...values,
        }
        const updated = [...rules, newRule]
        setRules(updated)
        // eslint-disable-next-line no-console
        console.log('New rule set:', updated)
      }
      setModalOpen(false)
    })
  }

  const columns = [
    {
      title: 'Condition (Error Type)',
      dataIndex: 'errorType',
      key: 'errorType',
      render: (value) => {
        const label = ERROR_TYPES.find((t) => t.value === value)?.label ?? value
        return <Tag color="geekblue">{label}</Tag>
      },
    },
    {
      title: 'Threshold (> %)',
      dataIndex: 'threshold',
      key: 'threshold',
      render: (value) => `> ${value}%`,
    },
    {
      title: 'Action (Target Route)',
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
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      sorter: (a, b) => a.priority - b.priority,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button type="link" onClick={() => openEditRuleModal(record)}>
          Edit
        </Button>
      ),
    },
  ]

  return (
    <>
      <Card
        type="inner"
        title="Placement Test Logic"
        style={{ marginBottom: 16 }}
      >
        These rules determine where players will start their journey based on
        their placement test results. The engine will evaluate rules by
        priority and route the learner to the appropriate region and level.
      </Card>

      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button type="primary" onClick={openNewRuleModal}>
          Add New Rule
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
        title={editingRule ? 'Edit Rule' : 'Add New Rule'}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText="Save"
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Error Type"
            name="errorType"
            rules={[{ required: true, message: 'Please select an error type' }]}
          >
            <Select options={ERROR_TYPES} placeholder="Select error type" />
          </Form.Item>

          <Form.Item
            label="Fail Percentage (>% )"
            name="threshold"
            rules={[
              { required: true, message: 'Please enter fail percentage' },
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
            label="Target Region"
            name="targetRegion"
            rules={[{ required: true, message: 'Please select target region' }]}
          >
            <Select
              options={TARGET_REGIONS}
              placeholder="Select target region"
            />
          </Form.Item>

          <Form.Item
            label="Checkpoint"
            name="checkpoint"
            rules={[{ required: true, message: 'Please select checkpoint' }]}
          >
            <Select options={CHECKPOINTS} placeholder="Select checkpoint" />
          </Form.Item>

          <Form.Item
            label="Priority"
            name="priority"
            rules={[{ required: true, message: 'Please set priority' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default AssessmentMatrix

