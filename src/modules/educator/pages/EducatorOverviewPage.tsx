import React, { useEffect, useMemo, useState } from 'react'
import { Card, Col, Row, Typography, Progress, Table, Tag, Button, Form, Input, Select, message, Empty, Avatar, Skeleton } from 'antd'
import { educatorService, type StudentAccount, type ProgressOverview, type LessonPlan, type FeedbackItem, type AnalyticsReport } from '../services/educatorService'
import { ArrowUpRight, MessageSquareMore, Users, BrainCircuit, Sparkles, Trophy, Rocket, ChevronRight, Activity, TrendingUp, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

const { Title, Text } = Typography

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

        // Robust data extraction Handle both direct arrays and { data: [...] } wrappers
        const extractData = (res: any) => {
          if (!res) return null;
          if (Array.isArray(res)) return res;
          if (res.data && Array.isArray(res.data)) return res.data;
          if (res.data) return res.data;
          return null;
        }

        setStudents(extractData(studentsRes) || [])
        setOverview(extractData(overviewRes) || null)
        setLessonPlans(extractData(lessonsRes) || [])
        setMessages(extractData(messagesRes) || [])
        setReports(extractData(reportsRes) || [])
      } catch (err) {
        console.error('Fetch error:', err);
        message.error('Không thể tải dữ liệu Educator')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const topStudents = useMemo(() =>
    [...students].sort((a, b) => (b.progressPercent || 0) - (a.progressPercent || 0)).slice(0, 5),
    [students]
  )

  return (
    <div className="flex flex-col gap-4 -mt-2">
      {/* ─── Hero Section ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-700 via-purple-600 to-orange-500 p-6 shadow-xl shadow-purple-500/10">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-orange-400/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
          <div className="flex-1">
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center gap-2 text-white/80 text-[11px] font-bold uppercase tracking-widest mb-2">
                <Sparkles size={12} className="text-orange-300" /> Executive Overview
              </div>
              <Title level={3} className="!text-white !m-0 !font-black tracking-tight mb-2">Chào buổi sáng, Giáo viên! 👋</Title>
              <p className="text-white/80 text-[13px] font-medium max-w-lg leading-relaxed">
                Hệ thống đã sẵn sàng. Hôm nay có <span className="text-orange-200 font-black decoration-orange-200/30 underline decoration-2 underline-offset-4">{overview?.pendingFeedbackCount || 0} yêu cầu</span> mới cần bạn xử lý.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-shrink-0">
            {[
              { icon: <Users size={16} />, label: 'Học viên', val: students.length, color: 'text-white' },
              { icon: <Activity size={16} />, label: 'Active', val: overview?.activeStudents || 0, color: 'text-green-300' },
              { icon: <TrendingUp size={16} />, label: 'Điểm TB', val: `${(overview?.averagePronunciationScore || 0).toFixed(1)}`, color: 'text-orange-300' },
              { icon: <MessageSquareMore size={16} />, label: 'Phản hồi', val: overview?.pendingFeedbackCount || 0, color: 'text-amber-300' },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex flex-col items-center min-w-[100px] shadow-lg">
                <div className={clsx("mb-2 opacity-90", stat.color)}>{stat.icon}</div>
                <div className="text-xl font-black leading-none mb-1">{loading ? '...' : stat.val}</div>
                <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest leading-none">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={15}>
          <Card
            title={<div className="flex items-center gap-2"><Trophy size={16} className="text-amber-500" /> <span className="font-black text-gray-800 text-sm">Học viên tiêu biểu</span></div>}
            className="rounded-2xl border-none shadow-sm h-full"
            loading={loading}
          >
            <Table
              rowKey="id"
              pagination={false}
              dataSource={topStudents}
              columns={[
                {
                  title: 'Học viên',
                  render: (_, row: StudentAccount) => (
                    <div className="flex items-center gap-3 py-1">
                      <Avatar src={row.avatar_url || row.avatar} className="border border-purple-50 shadow-sm" size={36} />
                      <div>
                        <div className="font-bold text-slate-800 text-xs leading-none">{row.fullName || 'N/A'}</div>
                        <div className="text-[10px] text-slate-400 font-semibold tracking-wide italic mt-1">{row.email}</div>
                      </div>
                    </div>
                  )
                },
                {
                  title: 'Lộ trình',
                  render: (_, row: StudentAccount) => (
                    <Tag color="purple" bordered={false} className="font-bold rounded-lg px-2 text-[10px] uppercase tracking-wide">
                      {row.learningPath?.title || 'Chưa gán'}
                    </Tag>
                  )
                },
                {
                  title: 'Tiến độ',
                  render: (_, row: StudentAccount) => (
                    <div className="min-w-[100px] flex flex-col gap-1">
                      <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                        <span>Progress</span>
                        <span className="text-purple-600">{row.progressPercent || 0}%</span>
                      </div>
                      <Progress percent={row.progressPercent || 0} size="small" strokeLinecap="round" strokeColor={{ '0%': '#9333ea', '100%': '#7e22ce' }} showInfo={false} strokeWidth={4} />
                    </div>
                  )
                },
                {
                  title: 'Thao tác',
                  align: 'right',
                  render: (_, row: StudentAccount) => (
                    <Button
                      type="text"
                      className="text-purple-600 font-black text-[10px] hover:bg-purple-50 rounded-lg flex items-center gap-0.5 ml-auto h-7 px-2"
                      onClick={() => form.setFieldsValue({
                        studentId: row.id,
                        title: `Lộ trình luyện tập: ${row.fullName}`,
                        focusArea: (row.weakPhonemes || []).join(', ')
                      })}
                    >
                      Sửa <ChevronRight size={12} />
                    </Button>
                  )
                },
              ]}
              className="custom-dashboard-table compact-table"
            />
          </Card>
        </Col>

        <Col xs={24} xl={9}>
          <Card
            title={<div className="flex items-center gap-2"><Activity size={16} className="text-purple-500" /> <span className="font-black text-gray-800 text-sm">Chỉ số phát âm TB</span></div>}
            className="rounded-2xl border-none shadow-sm h-full"
          >
            <div className="space-y-4">
              {(overview?.pronunciationMetrics || []).map((metric: any, idx) => (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} key={metric.label} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-gray-600">{metric.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-gray-800">{metric.value}%</span>
                      <Tag bordered={false} color={metric.trend === 'UP' ? 'success' : metric.trend === 'DOWN' ? 'error' : 'default'} className="rounded-full text-[8px] font-black px-1 leading-tight">
                        {metric.trend === 'UP' ? '↑' : metric.trend === 'DOWN' ? '↓' : '→'}
                      </Tag>
                    </div>
                  </div>
                  <Progress
                    percent={metric.value}
                    showInfo={false}
                    strokeColor={metric.value > 70 ? '#10b981' : metric.value > 40 ? '#f59e0b' : '#ef4444'}
                    strokeWidth={5}
                    trailColor="#f1f5f9"
                  />
                </motion.div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={12}>
          <Card
            title={<div className="flex items-center gap-2"><BrainCircuit size={16} className="text-orange-500" /> <span className="font-black text-gray-800 text-sm">Giáo án & Mục tiêu</span></div>}
            className="rounded-2xl border-none shadow-sm h-full overflow-hidden"
            bodyStyle={{ padding: 0 }}
          >
            <div className="p-1 space-y-0.5 overflow-y-auto max-h-[320px]">
              {lessonPlans.length ? lessonPlans.map((plan: LessonPlan, idx) => (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}
                  key={plan.id} className="p-3 border-b border-gray-50 last:border-none group hover:bg-orange-50/30 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <Title level={5} className="!m-0 !font-black !text-xs group-hover:text-orange-600 transition-colors">{plan.title}</Title>
                    <Tag color={plan.status === 'PUBLISHED' ? 'success' : 'default'} bordered={false} className="font-bold text-[8px] rounded-full uppercase leading-none px-1.5">{plan.status}</Tag>
                  </div>
                  <Text className="text-[11px] text-gray-400 block mb-2 leading-tight line-clamp-1">{plan.objective}</Text>
                  <div className="flex flex-wrap gap-1">
                    {(plan.achievementGoals || []).slice(0, 3).map(goal => (
                      <div key={goal} className="px-1.5 py-0.5 bg-gray-50 text-[9px] font-bold text-gray-400 rounded-md border border-gray-100">
                        {goal}
                      </div>
                    ))}
                    {(plan.achievementGoals || []).length > 3 && (
                      <div className="px-1.5 py-0.5 text-[9px] font-bold text-gray-300">
                        +{(plan.achievementGoals || []).length - 3}
                      </div>
                    )}
                  </div>
                </motion.div>
              )) : (
                <div className="py-12"><Empty description={<span className="text-gray-400 font-bold italic">Chưa có giáo án tùy chỉnh</span>} /></div>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={12}>
          <Card
            title={<div className="flex items-center gap-2"><MessageSquareMore size={16} className="text-purple-500" /> <span className="font-black text-gray-800 text-sm">Phản hồi & Tương tác</span></div>}
            className="rounded-2xl border-none shadow-sm h-full overflow-hidden"
            bodyStyle={{ padding: 0 }}
          >
            <div className="p-1 space-y-0.5 overflow-y-auto max-h-[320px]">
              {messages.length ? messages.map((item: FeedbackItem, idx) => (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}
                  key={item.id} className="p-3 border-b border-gray-50 last:border-none hover:bg-purple-50/30 transition-colors relative">
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      <span className="font-bold text-gray-800 text-[11px]">{item.studentName}</span>
                    </div>
                    <span className="text-[8px] text-gray-300 font-bold uppercase">{item.channel}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium leading-tight bg-gray-50/50 p-2 rounded-xl border border-gray-100/50 line-clamp-2">
                    {item.content}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <Tag color={item.priority === 'HIGH' ? 'red' : item.priority === 'MEDIUM' ? 'orange' : 'blue'} bordered={false} className="rounded-full text-[8px] font-black px-1.5 leading-none h-4 flex items-center">
                      {item.priority}
                    </Tag>
                    <Button type="link" size="small" className="text-purple-600 font-bold text-[10px] h-auto p-0">Trả lời 💬</Button>
                  </div>
                </motion.div>
              )) : (
                <div className="py-12"><Empty description={<span className="text-gray-400 font-bold italic">Không có tin nhắn mới</span>} /></div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2"><Activity size={16} className="text-rose-500" /> <span className="font-black text-gray-800 text-sm">Phân tích lỗi phát âm</span></div>
            <Button type="link" className="text-gray-400 font-bold text-[9px] uppercase">Xem tất cả</Button>
          </div>
        }
        className="rounded-2xl border-none shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reports.length ? reports.map((report, idx) => (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
              key={report.studentId} className="p-3 rounded-xl border border-gray-50 bg-slate-50/30 hover:border-rose-100 group transition-all">
              <div className="font-bold text-slate-700 text-xs mb-3 group-hover:text-rose-600 transition-colors flex items-center justify-between">
                {report.studentName}
                <ArrowUpRight size={12} className="text-slate-300" />
              </div>
              <div className="space-y-3">
                {report.pronunciationErrors?.map((err: any) => (
                  <div key={err.phoneme} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                      <span>/{err.phoneme}/</span>
                      <span className="text-rose-500 font-black">{err.accuracy}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-slate-100">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${err.accuracy}%` }} transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-gradient-to-r from-rose-400 to-rose-300 shadow-[0_0_8px_rgba(251,113,133,0.3)]" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )) : [...Array(4)].map((_, i) => (
            <div key={i} className="p-4 rounded-2xl border border-gray-50"><Skeleton active paragraph={{ rows: 2 }} /></div>
          ))}
        </div>
      </Card>

      <Card
        className="rounded-3xl border-none shadow-sm bg-white overflow-hidden relative"
        bodyStyle={{ padding: 0 }}
      >
        <div className="absolute right-0 top-0 w-24 h-24 bg-purple-50 rounded-bl-[100%] z-0" />
        <div className="relative z-10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shadow-inner">
              <Rocket size={20} />
            </div>
            <div>
              <Title level={4} className="!m-0 !font-black !text-gray-800 !text-base">Thiết kế lộ trình học cá nhân 🚀</Title>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Custom AI-Assisted learning paths</p>
            </div>
          </div>

          <Form form={form} layout="vertical" onFinish={async values => {
            try {
              const payload = {
                studentId: values.studentId,
                title: values.title,
                focusArea: values.focusArea,
                milestones: (values.milestones || '').split('\n').filter(Boolean),
                description: values.description
              }
              await educatorService.createCustomLearningPath(payload)
              message.success('Đã tạo lộ trình học thành công')
              form.resetFields()
            } catch {
              message.error('Không thể tạo lộ trình học')
            }
          }} className="max-w-5xl">
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item name="studentId" label={<span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Học viên mục tiêu</span>} rules={[{ required: true }]}>
                  <Select
                    size="middle" placeholder="Chọn học viên..."
                    className="w-full"
                    options={students.map(s => ({ value: s.id, label: s.fullName }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="title" label={<span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tên lộ trình</span>} rules={[{ required: true }]}>
                  <Input size="middle" placeholder="Vd: Luyện phát âm /r/ & /l/" className="rounded-lg" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="focusArea" label={<span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Trọng tâm</span>} rules={[{ required: true }]}>
                  <Input size="middle" placeholder="Vd: Phonetic precision" className="rounded-lg" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="milestones" label={<span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Mốc đạt được (Mỗi dòng 1 mốc)</span>} rules={[{ required: true }]} className="mb-2">
                  <Input.TextArea rows={3} className="rounded-xl text-xs" placeholder="Chinh phục được 10 từ khó nhất..." />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="description" label={<span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Mô tả thêm</span>} className="mb-2">
                  <Input.TextArea rows={3} className="rounded-xl text-xs" placeholder="Lộ trình này tập trung vào..." />
                </Form.Item>
              </Col>
            </Row>
            <div className="flex justify-end mt-2">
              <Button
                type="primary" htmlType="submit"
                className="h-10 px-8 rounded-xl font-black text-xs border-none bg-gradient-to-r from-purple-600 to-purple-500 shadow-lg shadow-purple-500/20 hover:scale-[1.02] transition-transform flex items-center gap-2"
              >
                <CheckCircle2 size={16} /> Lưu & Kích hoạt
              </Button>
            </div>
          </Form>
        </div>
      </Card>

      <style>{`
                .custom-dashboard-table .ant-table-thead > tr > th {
                    background: #f8fafc;
                    color: #94a3b8;
                    font-size: 9px;
                    padding: 8px 16px;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    font-weight: 900;
                    border-bottom: 1px solid #f1f5f9;
                }
                .custom-dashboard-table .ant-table-tbody > tr > td {
                    padding: 4px 16px;
                    border-bottom: 1px solid #f8fafc;
                }
                .ant-statistic-title {
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    color: #94a3b8;
                    letter-spacing: 0.05em;
                }
                .ant-statistic-content-value {
                    font-weight: 900;
                    color: #1e293b;
                }
            `}</style>
    </div>
  )
}

export default EducatorOverviewPage;
