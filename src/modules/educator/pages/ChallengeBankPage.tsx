import React, { useEffect, useMemo, useState } from 'react';
import { Card, Empty, List, Tag, Typography, message, Button, Skeleton } from 'antd';
import { BookOpen, CheckCircle2, Clock3, Target, LayoutDashboard, Rocket, Plus, ChevronRight, Sparkles } from 'lucide-react';
import { educatorService, type LessonPlan } from '../services/educatorService';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const { Title, Paragraph } = Typography;

const ChallengeBankPage: React.FC = () => {
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => ({
    total: lessonPlans.length,
    published: lessonPlans.filter((plan) => plan.status === 'PUBLISHED').length,
    draft: lessonPlans.filter((plan) => plan.status === 'DRAFT').length,
    archived: lessonPlans.filter((plan) => plan.status === 'ARCHIVED').length,
  }), [lessonPlans]);

  return (
    <div className="flex flex-col gap-8 -mt-2">
      {/* ── Header Section ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-orange-600 text-[9px] font-black uppercase tracking-[0.2em] mb-1">
            <LayoutDashboard size={14} /> Quản lý học thuật
          </div>
          <Title level={3} className="!m-0 !font-black !text-gray-800 tracking-tight">Giáo án & Mục tiêu</Title>
          <Paragraph className="!mb-0 text-gray-400 font-medium text-[11px] mt-0.5 max-w-xl">
            Phát hành các giáo án định hướng lộ trình học tập.
          </Paragraph>
        </div>

        <Button
          type="primary"
          icon={<Plus size={16} />}
          className="h-9 px-5 rounded-xl font-black border-none bg-gradient-to-r from-orange-600 to-orange-500 shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-transform flex items-center gap-2 text-xs"
        >
          Tạo giáo án
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng giáo án', value: stats.total, icon: <BookOpen size={18} />, color: 'bg-indigo-600' },
          { label: 'Đã phát hành', value: stats.published, icon: <CheckCircle2 size={18} />, color: 'bg-emerald-500' },
          { label: 'Bản nháp', value: stats.draft, icon: <Clock3 size={18} />, color: 'bg-amber-500' },
          { label: 'Lưu trữ', value: stats.archived, icon: <Target size={18} />, color: 'bg-slate-500' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-50 flex items-center gap-3 group hover:shadow-md transition-all"
          >
            <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md group-hover:rotate-12 transition-transform", item.color)}>
              {item.icon}
            </div>
            <div>
              <div className="text-xl font-black text-slate-800 leading-none">{loading ? '...' : item.value}</div>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{item.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Main List ── */}
      <Card
        className="rounded-3xl border-none shadow-sm overflow-hidden"
        bodyStyle={{ padding: 0 }}
      >
        {loading && lessonPlans.length === 0 ? (
          <div className="p-10 space-y-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} active avatar paragraph={{ rows: 2 }} />)}
          </div>
        ) : lessonPlans.length ? (
          <List
            itemLayout="vertical"
            dataSource={lessonPlans}
            renderItem={(plan, idx) => (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="group"
              >
                <List.Item key={plan.id} className="!px-6 !py-4 border-b border-gray-50 last:border-none hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <Title level={5} className="!m-0 !font-black !text-gray-800 group-hover:text-orange-600 transition-colors !text-sm">{plan.title}</Title>
                        <Tag
                          color={plan.status === 'PUBLISHED' ? 'success' : plan.status === 'DRAFT' ? 'warning' : 'default'}
                          bordered={false}
                          className="font-black text-[8px] px-1.5 rounded-full uppercase leading-none h-4 flex items-center"
                        >
                          {plan.status}
                        </Tag>
                      </div>
                      <Paragraph className="text-gray-500 font-medium text-xs !mb-2 max-w-3xl leading-snug line-clamp-1">
                        {plan.objective}
                      </Paragraph>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={10} className="text-orange-400" />
                          <div className="flex gap-1.5">
                            {plan.achievementGoals.slice(0, 3).map((goal) => (
                              <div key={goal} className="px-2 py-0.5 bg-gray-50 border border-gray-100 text-[10px] font-bold text-gray-500 rounded-md">
                                {goal}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-[8px] font-black text-gray-300 uppercase tracking-tighter">Cập nhật</div>
                        <div className="font-bold text-gray-400 text-[10px]">{new Date(plan.updatedAt).toLocaleDateString('vi-VN')}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-1.5">
                          {(plan.targetStudents || []).slice(0, 3).map((s, i) => (
                            <div key={i} className="w-7 h-7 rounded-full bg-orange-100 border border-white flex items-center justify-center text-[9px] font-black text-orange-600">
                              {s.slice(0, 1).toUpperCase()}
                            </div>
                          ))}
                        </div>
                        <Button size="small" type="text" className="text-orange-600 font-black text-[11px] hover:bg-orange-50 flex items-center gap-0.5 h-8 px-2">
                          Chi tiết <ChevronRight size={12} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </List.Item>
              </motion.div>
            )}
          />
        ) : (
          <div className="py-24">
            <Empty description={<span className="text-gray-400 font-bold italic">Chưa có giáo án nào được tạo trong hệ thống</span>} />
          </div>
        )}
      </Card>

      {/* ── Footer Banner ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-orange-500/90 to-amber-500/90 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg"
      >
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-white/70 text-[8px] font-black uppercase tracking-[0.2em] mb-2">
              <Rocket size={12} /> AI Suggested
            </div>
            <Title level={4} className="!text-white !font-black !m-0 !text-lg mb-1">Tự động hóa giáo án với AI?✨</Title>
            <p className="text-white/80 font-medium text-xs">Hệ thống gợi ý mục tiêu giáo án hằng tuần dựa trên phân tích lớp học.</p>
          </div>
          <Button className="h-9 px-6 rounded-xl font-black border-none text-orange-600 shadow-md bg-white hover:scale-105 transition-transform flex items-center gap-2 text-xs">
            Thử ngay <Sparkles size={16} />
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default ChallengeBankPage;
