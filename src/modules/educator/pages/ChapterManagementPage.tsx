import React, { useEffect, useMemo, useState } from 'react';
import { Card, Empty, Progress, Space, Tag, Typography, message } from 'antd';
import { educatorService, type ProgressOverview } from '../services/educatorService';

const ChapterManagementPage: React.FC = () => {
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await educatorService.getProgressOverview();
        setOverview(res?.data ?? null);
      } catch {
        message.error('Không thể tải dữ liệu tiến độ');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const metrics = useMemo(() => overview?.pronunciationMetrics ?? [], [overview]);

  return (
    <div className="space-y-6">
      <div>
        <Typography.Title level={3} className="!mb-1">Theo dõi tiến độ</Typography.Title>
        <Typography.Paragraph type="secondary" className="!mb-0">
          Tổng quan tiến độ lớp học, học viên đang hoạt động và xu hướng phát âm.
        </Typography.Paragraph>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng học viên', value: overview?.totalStudents ?? 0 },
          { label: 'Đang hoạt động', value: overview?.activeStudents ?? 0 },
          { label: 'Điểm phát âm TB', value: overview?.averagePronunciationScore ?? 0 },
          { label: 'Phản hồi chờ xử lý', value: overview?.pendingFeedbackCount ?? 0 },
        ].map((item) => (
          <Card key={item.label} className="rounded-2xl shadow-sm border border-slate-100">
            <div className="text-slate-500 text-sm mb-2">{item.label}</div>
            <div className="text-2xl font-black text-slate-800">{item.value}</div>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl shadow-sm border border-slate-100" loading={loading}>
        <Typography.Title level={5} className="!mb-4">Xu hướng phát âm</Typography.Title>
        {metrics.length ? (
          <Space direction="vertical" className="w-full" size={16}>
            {metrics.map((metric) => (
              <div key={metric.label}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-slate-700">{metric.label}</span>
                  <Tag color={metric.trend === 'UP' ? 'success' : metric.trend === 'DOWN' ? 'error' : 'default'} bordered={false} className="rounded-full px-3">{metric.trend}</Tag>
                </div>
                <Progress percent={metric.value} strokeColor={{ '0%': '#9333ea', '100%': '#f59e0b' }} />
              </div>
            ))}
          </Space>
        ) : (
          <Empty description="Chưa có dữ liệu tiến độ từ backend" />
        )}
      </Card>
    </div>
  );
};

export default ChapterManagementPage;
