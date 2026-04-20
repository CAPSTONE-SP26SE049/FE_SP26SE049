import React, { useEffect, useMemo, useState } from 'react';
import { Card, Empty, List, Space, Tag, Typography, message } from 'antd';
import { BookOpen, CheckCircle2, Clock3, Target } from 'lucide-react';
import { educatorService, type LessonPlan } from '../services/educatorService';

const ChallengeBankPage: React.FC = () => {
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await educatorService.getLessonPlans();
        setLessonPlans(res?.data ?? []);
      } catch {
        message.error('Không thể tải dữ liệu giáo án');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const stats = useMemo(() => ({
    total: lessonPlans.length,
    published: lessonPlans.filter((plan) => plan.status === 'PUBLISHED').length,
    draft: lessonPlans.filter((plan) => plan.status === 'DRAFT').length,
    archived: lessonPlans.filter((plan) => plan.status === 'ARCHIVED').length,
  }), [lessonPlans]);

  return (
    <div className="space-y-6">
      <div>
        <Typography.Title level={3} className="!mb-1">Giáo án & mục tiêu</Typography.Title>
        <Typography.Paragraph type="secondary" className="!mb-0">
          Dữ liệu được tải trực tiếp từ backend để theo dõi giáo án, mục tiêu và trạng thái phát hành.
        </Typography.Paragraph>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng giáo án', value: stats.total, icon: <BookOpen size={18} /> },
          { label: 'Đã phát hành', value: stats.published, icon: <CheckCircle2 size={18} /> },
          { label: 'Bản nháp', value: stats.draft, icon: <Clock3 size={18} /> },
          { label: 'Lưu trữ', value: stats.archived, icon: <Target size={18} /> },
        ].map((item) => (
          <Card key={item.label} className="rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 mb-2">{item.label}{item.icon}</div>
            <div className="text-2xl font-black text-slate-800">{item.value}</div>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl shadow-sm border border-slate-100" loading={loading}>
        {lessonPlans.length ? (
          <List
            itemLayout="vertical"
            dataSource={lessonPlans}
            renderItem={(plan) => (
              <List.Item key={plan.id} className="!px-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Typography.Title level={5} className="!mb-1">{plan.title}</Typography.Title>
                    <Typography.Paragraph type="secondary" className="!mb-2">{plan.objective}</Typography.Paragraph>
                    <Space wrap>
                      <Tag color={plan.status === 'PUBLISHED' ? 'success' : plan.status === 'DRAFT' ? 'warning' : 'default'} bordered={false}>{plan.status}</Tag>
                      <Tag color="purple" bordered={false}>{plan.targetStudents.length} nhóm học viên</Tag>
                    </Space>
                  </div>
                  <div className="min-w-36 text-right">
                    <Typography.Text type="secondary" className="text-xs">Cập nhật gần nhất</Typography.Text>
                    <div className="font-semibold">{new Date(plan.updatedAt).toLocaleDateString('vi-VN')}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm font-semibold text-slate-700 mb-2">Mục tiêu thành tựu</div>
                  <Space wrap>
                    {plan.achievementGoals.map((goal) => <Tag key={goal} color="orange" bordered={false}>{goal}</Tag>)}
                  </Space>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <Empty description="Chưa có dữ liệu giáo án từ backend" />
        )}
      </Card>
    </div>
  );
};

export default ChallengeBankPage;
