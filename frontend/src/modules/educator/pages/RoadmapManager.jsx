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
  Button,
} from 'antd'
import { InboxOutlined, FlagOutlined } from '@ant-design/icons'
import { MOCK_CURRICULUM } from '../../../services/mockData'

const ERROR_TAG_OPTIONS = [
  { label: 'N/L Error', value: 'nl_error' },
  { label: 'S/X Error', value: 'sx_error' },
  { label: 'Tones', value: 'tones' },
  { label: 'Ending Consonants', value: 'ending_consonants' },
  { label: 'Rhythm & Intonation', value: 'rhythm_intonation' },
]

const REGION_CONFIG = {
  south: {
    key: 'south',
    label: 'Miền Nam ',
    color: 'green',
  },
  central: {
    key: 'central',
    label: 'Miền Trung',
    color: 'purple',
  },
  north: {
    key: 'north',
    label: 'Miền Bắc',
    color: 'red',
  },
}

const RoadmapManager = () => {
  const [activeRegion, setActiveRegion] = useState('south')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingLevel, setEditingLevel] = useState(null)
  const [form] = Form.useForm()

  const regionLevels = useMemo(
    () => MOCK_CURRICULUM[activeRegion] ?? [],
    [activeRegion],
  )

  const handleNodeClick = (level) => {
    setEditingLevel(level)
    form.setFieldsValue({
      title: level.title,
      errorTag: level.errorTag,
      aiThreshold: level.aiThreshold,
    })
    setDrawerOpen(true)
  }

  const handleSave = () => {
    form.validateFields().then((values) => {
      const updated = {
        ...editingLevel,
        title: values.title,
        errorTag: values.errorTag,
        aiThreshold: values.aiThreshold,
      }

      // Mock integration: log updated level + region
      // In real app, this is where an API call would go.
      // eslint-disable-next-line no-console
      console.log('Saving level for region:', activeRegion, updated)

      setEditingLevel(updated)
      setDrawerOpen(false)
    })
  }

  const tabItems = Object.values(REGION_CONFIG).map((region) => ({
    key: region.key,
    label: region.label,
  }))

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Tabs
          items={tabItems}
          activeKey={activeRegion}
          onChange={setActiveRegion}
        />
      </div>

      <Timeline mode="alternate" style={{ marginTop: 16 }}>
        {regionLevels.map((level) => (
          <Timeline.Item
            key={level.id}
            color={REGION_CONFIG[activeRegion].color}
            dot={<FlagOutlined style={{ fontSize: 18 }} />}
          >
            <Card
              hoverable
              onClick={() => handleNodeClick(level)}
              style={{
                borderLeft: `4px solid ${REGION_CONFIG[activeRegion].color}`,
              }}
              bodyStyle={{ padding: 16 }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <div>
                  <div
                    style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}
                  >
                    {level.title}
                  </div>
                  <div style={{ marginBottom: 8, color: '#555' }}>
                    {level.description}
                  </div>
                  <Tag color="geekblue">{level.errorTag}</Tag>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Badge
                    status={level.status === 'published' ? 'success' : 'default'}
                    text={
                      level.status === 'published' ? 'Published' : 'Draft'
                    }
                  />
                  <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
                    AI Threshold: {level.aiThreshold}%
                  </div>
                </div>
              </div>
            </Card>
          </Timeline.Item>
        ))}
      </Timeline>

      <Drawer
        title="Edit Level"
        placement="right"
        width={420}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
      >
        <Form
          layout="vertical"
          form={form}
          initialValues={{
            aiThreshold: 70,
          }}
        >
          <Form.Item
            label="Level Title"
            name="title"
            rules={[{ required: true, message: 'Please enter level title' }]}
          >
            <Input placeholder="Enter level title" />
          </Form.Item>

          <Form.Item
            label="Error Tag"
            name="errorTag"
            rules={[{ required: true, message: 'Please select error tag' }]}
          >
            <Select
              options={ERROR_TAG_OPTIONS}
              placeholder="Select error type"
              allowClear
            />
          </Form.Item>

          <Form.Item label="Reference Audio File" name="audio">
            <Upload.Dragger name="files" multiple={false} beforeUpload={() => false}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                Click or drag audio file to this area to upload
              </p>
              <p className="ant-upload-hint">
                This audio will be used as reference pronunciation for this
                level.
              </p>
            </Upload.Dragger>
          </Form.Item>

          <Form.Item
            label="AI Precision Threshold"
            name="aiThreshold"
            tooltip="Thiết lập điểm đậu tối thiểu mà AI yêu cầu cho level này."
          >
            <Slider
              min={0}
              max={100}
              marks={{
                0: '0%',
                50: '50%',
                100: '100%',
              }}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" onClick={handleSave} block>
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </>
  )
}

export default RoadmapManager

