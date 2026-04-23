import React, { useEffect, useMemo, useState } from 'react';
import { Card, Empty, Progress, Tag, Typography, message, Skeleton } from 'antd';
import { educatorService, type ProgressOverview } from '../services/educatorService';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, MessageSquare, Activity, Sparkles } from '../../../lib/icons';
import clsx from 'clsx';

const { Title, Paragraph } = Typography;

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
    <div className="h-[calc(100vh-120px)] flex flex-col gap-4 overflow-hidden -mt-2">
      {/* ── Header ── */}
      <div className="flex-shrink-0">
        <div className="flex items-center gap-2 text-purple-600 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
          <BarChart3 size={14} /> Analytics & Tracking
        </div>
        <Title level={4} className="!m-0 !font-black !text-gray-800 tracking-tight">Phân tích tiến độ học tập</Title>
        <Paragraph className="!mb-0 text-gray-400 font-semibold text-[11px] mt-0.5 max-w-2xl uppercase tracking-wide line-clamp-1 italic">
          Số liệu chi tiết về khả năng phát âm và mức độ tương tác của toàn bộ lớp học.
        </Paragraph>
      </div>

      {/* ── Stats Hero ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
        {[
          { label: 'Tổng học viên', value: overview?.totalStudents ?? 0, icon: <Users size={20} />, color: 'bg-purple-600' },
          { label: 'Đang hoạt động', value: overview?.activeStudents ?? 0, icon: <Activity size={20} />, color: 'bg-emerald-500' },
          { label: 'Điểm phát âm TB', value: overview?.averagePronunciationScore ?? 0, icon: <Sparkles size={20} />, color: 'bg-orange-500' },
          { label: 'Phản hồi chờ', value: overview?.pendingFeedbackCount ?? 0, icon: <MessageSquare size={20} />, color: 'bg-rose-500' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-50 group hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className={clsx("w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform", item.color)}>
              {item.icon}
            </div>
            <div>
              <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{item.label}</div>
              <div className="text-xl font-black text-slate-800 leading-none">{loading ? '...' : item.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <Card
        className="rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex-1 flex flex-col"
        bodyStyle={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}
        title={<div className="flex items-center gap-2 py-1"><TrendingUp size={16} className="text-purple-600" /> <span className="font-extrabold text-gray-800 text-sm uppercase tracking-wider">Xu hướng phát âm chi tiết</span></div>}
      >
        {loading && !overview ? (
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => <Skeleton key={i} active paragraph={{ rows: 1 }} />)}
          </div>
        ) : metrics.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 custom-scrollbar">
            {metrics.map((metric, idx) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group"
              >
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{metric.label}</div>
                    <div className="text-xl font-black text-gray-800 group-hover:text-purple-600 transition-colors">{metric.value}%</div>
                  </div>
                  <Tag
                    color={metric.trend === 'UP' ? 'success' : metric.trend === 'DOWN' ? 'error' : 'default'}
                    bordered={false}
                    className="rounded-full px-2 font-black text-[9px] uppercase mb-1 flex items-center gap-1"
                  >
                    {metric.trend === 'UP' ? 'TREND: UP ↑' : metric.trend === 'DOWN' ? 'TREND: DOWN ↓' : 'TREND: STABLE →'}
                  </Tag>
                </div>
                <Progress
                  percent={metric.value}
                  showInfo={false}
                  strokeColor={{ '0%': '#9333ea', '100%': '#f97316' }}
                  strokeWidth={6}
                  className="m-0"
                  trailColor="#f8fafc"
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-60">
            <Empty description={<span className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Chưa có dữ liệu phân tích</span>} />
          </div>
        )}
      </Card>

      {/* ── Advice Card ── */}
      <div className="bg-gradient-to-r from-purple-50 to-orange-50 border border-purple-100 rounded-2xl p-4 flex items-center gap-4 flex-shrink-0">
        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-purple-600 flex-shrink-0">
          <Sparkles size={24} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Gợi ý từ AI Hệ Thống</span>
            <Tag color="purple" bordered={false} className="text-[8px] font-black m-0 px-1.5 h-4 flex items-center">BETA</Tag>
          </div>
          <Paragraph className="!m-0 text-slate-500 font-semibold text-[11px] leading-tight line-clamp-1 italic">
            Điểm ngữ điệu đang có xu hướng giảm ở nhóm cấp độ A1. Bạn nên xem xét giao thêm các bài tập shadow-reading trong tuần tới.
          </Paragraph>
        </div>
      </div>
    </div>
  );
};

export default ChapterManagementPage;
