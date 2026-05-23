import React, { useEffect, useMemo, useState } from 'react';
import { Skeleton, message } from 'antd';
import { educatorService, type ProgressOverview } from '../services/educatorService';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, MessageSquare, Activity, Sparkles, Zap, TrendingDown, Target, Brain, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

const ChapterManagementPage: React.FC = () => {
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await educatorService.getProgressOverview();
        setOverview(res?.data ?? (res?.status?.toString() === 'success' ? res.data : null));
      } catch {
        message.error('Không thể tải dữ liệu tiến độ');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const metrics = useMemo(() => overview?.pronunciationMetrics ?? [], [overview]);

  const statsCards = [
    { label: 'Tổng học viên', value: overview?.totalStudents ?? 0, icon: Users, color: '#49B6E5', bg: 'bg-blue-50' },
    { label: 'Đang hoạt động', value: overview?.activeStudents ?? 0, icon: Activity, color: '#10b981', bg: 'bg-emerald-50' },
    { label: 'Phát âm TB', value: `${overview?.averagePronunciationScore ?? 0}%`, icon: Target, color: '#f59e0b', bg: 'bg-amber-50' },
    { label: 'Feedbacks chờ', value: overview?.pendingFeedbackCount ?? 0, icon: MessageSquare, color: '#ef4444', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-6 bg-[#49B6E5] rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#49B6E5]">Analytics & Tracking</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Phân tích tiến độ</h1>
          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">
            Theo dõi <span className="text-slate-900">từng bước đi nhỏ</span> hướng tới mục tiêu quốc tế
          </p>
        </div>
        <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f2937] text-[10px] font-black uppercase tracking-widest text-slate-600">
          <Zap size={16} fill="currentColor" className="text-amber-400" /> Live Monitoring
        </div>
      </div>

      {/* Stats Hero Section */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {statsCards.map((item, idx) => {
          const Icon = item.icon
          return (
            <motion.article
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group relative rounded-[2rem] border-[3px] border-slate-900 bg-white p-5 shadow-[6px_6px_0_#1f2937] transition-all hover:-translate-y-1 hover:shadow-[10px_10px_0_#1f2937]"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                  <p className="text-3xl font-black text-slate-900 leading-none">{loading ? '...' : item.value}</p>
                </div>
                <div
                  className={clsx("w-12 h-12 rounded-2xl border-[2.5px] border-slate-900 shadow-[3px_3px_0_#1f2937] flex items-center justify-center transition-transform group-hover:rotate-6", item.bg)}
                  style={{ color: item.color }}
                >
                  <Icon size={24} strokeWidth={3} />
                </div>
              </div>
            </motion.article>
          )
        })}
      </section>

      {/* Main Analytics Card */}
      <article className="rounded-[2.5rem] border-[3px] border-slate-900 bg-white p-8 shadow-[10px_10px_0_#1f2937] overflow-hidden min-h-[400px]">
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-2 h-10 bg-[#8b5cf6] rounded-full" />
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Xu hướng phát âm</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Chi tiết kỹ năng phát âm của toàn bộ hệ thống</p>
            </div>
          </div>
          <TrendingUp size={24} className="text-slate-200" />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {[...Array(4)].map((_, i) => <Skeleton key={i} active paragraph={{ rows: 2 }} title={false} />)}
          </div>
        ) : metrics.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
            {metrics.map((metric, idx) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{metric.label}</div>
                    <div className="text-2xl font-black text-slate-900 leading-none">{metric.value}%</div>
                  </div>
                  <div className={clsx(
                    "px-3 py-1 rounded-xl border-[2px] border-slate-900 font-black text-[9px] uppercase tracking-wider flex items-center gap-1.5 shadow-[2px_2px_0_#1f2937]",
                    metric.trend === 'UP' ? 'bg-emerald-100 text-emerald-700' : metric.trend === 'DOWN' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
                  )}>
                    {metric.trend === 'UP' ? <TrendingUp size={12} strokeWidth={3} /> : metric.trend === 'DOWN' ? <TrendingDown size={12} strokeWidth={3} /> : <Activity size={12} strokeWidth={3} />}
                    {metric.trend === 'UP' ? 'Improving' : metric.trend === 'DOWN' ? 'Attention' : 'Stable'}
                  </div>
                </div>
                <div className="h-4 w-full rounded-lg bg-slate-100 border-[2.5px] border-slate-900/10 overflow-hidden relative shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${metric.value}%` }}
                    className={clsx(
                      "absolute inset-y-0 left-0 rounded-[2px]",
                      metric.value >= 80 ? 'bg-emerald-500' : metric.value >= 50 ? 'bg-[#49B6E5]' : 'bg-rose-500'
                    )}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center opacity-60">
            <BarChart3 size={64} strokeWidth={1} className="text-slate-300 mb-4" />
            <span className="text-sm font-black uppercase tracking-widest text-slate-400">Chưa có dữ liệu thống kê</span>
          </div>
        )}
      </article>

      {/* Advice Section */}
      <article className="relative rounded-[2rem] border-[3px] border-slate-900 bg-gradient-to-r from-amber-50 to-orange-50 p-6 shadow-[6px_6px_0_#1f2937] overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
          <Brain size={120} strokeWidth={3} />
        </div>
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="w-16 h-16 rounded-[1.25rem] bg-white border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f2937] flex items-center justify-center text-amber-500 flex-shrink-0 animate-float">
            <Sparkles size={32} strokeWidth={3} fill="currentColor" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">AI Smart Coaching Tips</h3>
              <span className="px-2 py-0.5 rounded-lg border-[2px] border-slate-900 bg-amber-400 text-slate-900 text-[8px] font-black uppercase shadow-[2px_2px_0_#1f2937]">Beta</span>
            </div>
            <p className="text-sm font-bold text-slate-600 leading-relaxed italic max-w-3xl">
              "Dựa trên dữ liệu tuần này, nhóm âm tiết <span className="text-slate-900 underline decoration-amber-400 decoration-2">/ng/ và /nh/</span> đang có tỉ lệ sai sót cao (tăng 12%). Hãy tập trung vào các bài phát âm luyện lưỡi cho học viên cấp độ A2."
            </p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 rounded-2xl border-[2.5px] border-slate-900 bg-white text-slate-900 font-black text-[11px] uppercase tracking-wider shadow-[4px_4px_0_#1f2937] hover:-translate-y-1 hover:shadow-[6px_6px_0_#1f2937] transition-all whitespace-nowrap">
            Xem báo cáo chi tiết <ArrowRight size={16} strokeWidth={3} />
          </button>
        </div>
      </article>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
      `}} />
    </div>
  );
};

export default ChapterManagementPage;
