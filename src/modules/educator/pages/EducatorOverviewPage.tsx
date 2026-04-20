import React, { useEffect, useMemo, useState } from 'react'
import { Card, Col, Row, Typography, Progress, Table, Tag, Button, Space, Form, Input, Select, message, Empty, Statistic } from 'antd'
import { educatorService, type StudentAccount, type ProgressOverview, type LessonPlan, type FeedbackItem, type AnalyticsReport, type PronunciationMetric } from '../services/educatorService'
import { ArrowUpRight, MessageSquareMore, Users, BrainCircuit } from 'lucide-react'

const { Text } = Typography

const EducatorOverviewPage: React.FC = () => {
  const [students, setStudents] = useState<StudentAccount[]>([])
  const [overview, setOverview] = useState<ProgressOverview | null>(null)
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([])
  const [messages, setMessages] = useState<FeedbackItem[]>([])
  const [reports, setReports] = useState<AnalyticsReport[]>([])
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [studentsRes, overviewRes, lessonsRes, messagesRes, reportsRes] = await Promise.all([
          educatorService.getStudentAccounts(),
          educatorService.getProgressOverview(),
          educatorService.getLessonPlans(),
          educatorService.getMessages(),
          educatorService.getAnalyticsReports(),
        ])
        setStudents(studentsRes?.data ?? [])
        setOverview(overviewRes?.data ?? null)
        setLessonPlans(lessonsRes?.data ?? [])
        setMessages(messagesRes?.data ?? [])
        setReports(reportsRes?.data ?? [])
      } catch {
        message.error('Không thể tải dữ liệu Educator mới')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const topStudents = useMemo(() => [...students].sort((a, b) => b.progressPercent - a.progressPercent).slice(0, 5), [students])

  return <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="rounded-2xl shadow-sm"><Statistic title="Học viên" value={overview?.totalStudents ?? students.length} prefix={<Users size={18} />} /></Card>
      <Card className="rounded-2xl shadow-sm"><Statistic title="Đang hoạt động" value={overview?.activeStudents ?? 0} prefix={<ArrowUpRight size={18} />} /></Card>
      <Card className="rounded-2xl shadow-sm"><Statistic title="Điểm phát âm TB" value={overview?.averagePronunciationScore ?? 0} precision={1} prefix={<BrainCircuit size={18} />} /></Card>
      <Card className="rounded-2xl shadow-sm"><Statistic title="Phản hồi chờ xử lý" value={overview?.pendingFeedbackCount ?? 0} prefix={<MessageSquareMore size={18} />} /></Card>
    </div>

    <Row gutter={16}>
      <Col xs={24} lg={14}>
        <Card title="Quản lý tài khoản học viên" className="rounded-2xl shadow-sm" loading={loading}>
          <Table rowKey="id" pagination={false} dataSource={topStudents} columns={[
            { title: 'Học viên', render: (_, row: StudentAccount) => <div><div className="font-semibold">{row.fullName}</div><Text type="secondary">{row.email}</Text></div> },
            { title: 'Lộ trình', render: (_, row: StudentAccount) => <Tag color="purple">{row.learningPath.title}</Tag> },
            { title: 'Tiến độ', render: (_, row: StudentAccount) => <Progress percent={row.progressPercent} size="small" strokeColor="#9333ea" /> },
            { title: 'Thao tác', render: (_, row: StudentAccount) => <Button type="link" className="text-purple-600 font-bold" onClick={() => form.setFieldsValue({ studentId: row.id, title: `${row.fullName} - path mới`, focusArea: row.weakPhonemes.join(', ') })}>Thiết lập path</Button> },
          ]} />
        </Card>
      </Col>
      <Col xs={24} lg={10}>
        <Card title="Theo dõi tiến độ" className="rounded-2xl shadow-sm" loading={loading}>
          <div className="space-y-4">
            {(overview?.pronunciationMetrics ?? []).map((metric: PronunciationMetric) => <div key={metric.label} className="space-y-1">
              <div className="flex justify-between text-sm"><span>{metric.label}</span><Tag color={metric.trend === 'UP' ? 'success' : metric.trend === 'DOWN' ? 'error' : 'default'} className="rounded-full">{metric.trend}</Tag></div>
              <Progress percent={metric.value} strokeColor="linear-gradient(90deg, #9333ea 0%, #a855f7 100%)" />
            </div>)}
          </div>
        </Card>
      </Col>
    </Row>

    <Row gutter={16}>
      <Col xs={24} lg={12}>
        <Card title="Giáo án tùy chỉnh & mục tiêu thành tựu" className="rounded-2xl shadow-sm" loading={loading}>
          <div className="space-y-3">
            {lessonPlans.length ? lessonPlans.map((plan: LessonPlan) => <div key={plan.id} className="p-4 border border-purple-50 rounded-xl bg-purple-50/20">
              <div className="flex justify-between items-start"><Text strong className="text-purple-900">{plan.title}</Text><Tag color="purple" bordered={false}>{plan.status}</Tag></div>
              <div className="text-sm text-slate-600">{plan.objective}</div>
              <div className="mt-2 flex flex-wrap gap-2">{plan.achievementGoals.map((goal: string) => <Tag key={goal} color="orange" bordered={false}>{goal}</Tag>)}</div>
            </div>) : <Empty description="Chưa có giáo án" />}
          </div>
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title="Tương tác, phản hồi và nhắn tin" className="rounded-2xl shadow-sm" loading={loading}>
          <div className="space-y-3">
            {messages.length ? messages.map((item: FeedbackItem) => <div key={item.id} className="p-4 border border-slate-100 rounded-xl hover:border-purple-200 transition-all">
              <div className="flex justify-between"><Text strong className="text-slate-800">{item.studentName}</Text><Tag color={item.priority === 'HIGH' ? 'error' : item.priority === 'MEDIUM' ? 'warning' : 'processing'} bordered={false}>{item.channel}</Tag></div>
              <div className="text-sm text-slate-600 font-medium">{item.content}</div>
            </div>) : <Empty description="Chưa có tin nhắn/feedback" />}
          </div>
        </Card>
      </Col>
    </Row>

    <Card title="Phân tích dữ liệu phát âm" className="rounded-2xl shadow-sm" loading={loading}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reports.slice(0, 3).map((report: AnalyticsReport) => <div key={report.studentId} className="p-4 rounded-xl border bg-white">
          <div className="font-semibold mb-2">{report.studentName}</div>
          <div className="text-sm text-slate-500 font-semibold mb-1">Lỗi phát âm nổi bật</div>
          <div className="mt-2 flex flex-wrap gap-2">{report.pronunciationErrors.map((err: any) => <Tag key={err.phoneme} color="magenta" bordered={false}>{err.phoneme}: {err.accuracy}%</Tag>)}</div>
        </div>)}
      </div>
    </Card>

    <Card title="Tạo lộ trình học tùy chỉnh" className="rounded-2xl shadow-sm">
      <Form form={form} layout="vertical" onFinish={async values => {
        try {
          await educatorService.createCustomLearningPath({ studentId: values.studentId, title: values.title, focusArea: values.focusArea, milestones: values.milestones.split('\n').filter(Boolean), description: values.description })
          message.success('Đã tạo lộ trình học')
          form.resetFields()
        } catch {
          message.error('Không thể tạo lộ trình học')
        }
      }}>
        <Row gutter={16}>
          <Col xs={24} md={8}><Form.Item name="studentId" label="Học viên" rules={[{ required: true }]}><Select options={students.map(s => ({ value: s.id, label: s.fullName }))} /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="title" label="Tên lộ trình" rules={[{ required: true }]}><Input /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="focusArea" label="Trọng tâm" rules={[{ required: true }]}><Input /></Form.Item></Col>
          <Col xs={24}><Form.Item name="milestones" label="Mốc đạt được" rules={[{ required: true }]}><Input.TextArea rows={3} placeholder="Mỗi dòng là một mốc" /></Form.Item></Col>
          <Col xs={24}><Form.Item name="description" label="Mô tả"><Input.TextArea rows={2} /></Form.Item></Col>
        </Row>
        <Space><Button type="primary" htmlType="submit" className="rounded-xl px-8 h-11 bg-gradient-to-r from-purple-600 to-purple-500 border-none shadow-lg shadow-purple-200">Lưu lộ trình</Button></Space>
      </Form>
    </Card>
  </div>
}

export default EducatorOverviewPage
