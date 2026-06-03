import { useState, useEffect } from 'react';
import { Card, Progress, List, Avatar, Tooltip } from 'antd';
import { Users, CheckCircle, MessageSquare, Target, Zap, Clock, TrendingUp, ChevronRight, Info } from 'lucide-react';
import { educatorService } from '../services/educatorService';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const EducatorOverviewPage = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avatarErrors, setAvatarErrors] = useState<Record<string, boolean>>({});

  const getAvatarUrl = (s: any) => {
    if (avatarErrors[s.id]) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.fullName || s.id}`;
    return s.avatar_url || s.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.fullName || s.id}`;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const response = await educatorService.getDashboardSummary();
        setSummary(response.data);
      } catch (error) {
        console.error('Lỗi tải dữ liệu tổng quan:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-3xl border-[4px] border-slate-900 border-t-[#49B6E5] shadow-[6px_6px_0_#1f2937]"
        />
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Đang nạp dữ liệu hệ thống...</p>
      </div>
    );
  }

  const stats = [
    { title: 'Tổng học viên', value: summary?.totalStudents || 0, icon: Users, color: '#49B6E5', bg: 'bg-blue-50', tooltip: 'Tổng số tài khoản học viên trong hệ thống' },
    { title: 'Học viên online', value: summary?.activeStudents || 0, icon: Clock, color: '#10b981', bg: 'bg-emerald-50', tooltip: 'Số lượng học viên đang có trạng thái hoạt động' },
    { title: 'Độ chính xác TB', value: `${summary?.averagePronunciationScore || 0}%`, icon: Target, color: '#f59e0b', bg: 'bg-amber-50', tooltip: 'Điểm phát âm trung bình của toàn bộ các học viên' },
    { title: 'Yêu cầu hỗ trợ', value: summary?.pendingFeedbackCount || 0, icon: Zap, color: '#ef4444', bg: 'bg-rose-50', tooltip: 'Số lượng yêu cầu chờ phản hồi từ giáo viên' },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-[8px_8px_0_#49B6E5]"
      >
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-black uppercase tracking-tight">Chào mừng quay lại, <span className="text-[#49B6E5]">Giáo viên</span></h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Hệ thống đã sẵn sàng hỗ trợ bạn quản lý và cải thiện kỹ năng phát âm của học viên.</p>
          </div>
          <div className="flex gap-4">
            <div className="px-6 py-3 bg-white/10 rounded-2xl border-[2px] border-white/20 backdrop-blur-md">
              <Tooltip title="Tỷ lệ tăng/giảm số lượt hoàn thành bài tập của học viên so với tuần trước" placement="bottom">
                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-help">
                  Hiệu suất tuần
                  <Info size={12} />
                </div>
              </Tooltip>
              <div className={clsx("text-xl font-black", (summary?.weeklyProgressRate || 0) >= 0 ? "text-emerald-400" : "text-rose-400")}>
                {(summary?.weeklyProgressRate || 0) > 0 ? '+' : ''}{summary?.weeklyProgressRate || 0}%
              </div>
            </div>
          </div>
        </div>
        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#49B6E5] opacity-10 blur-[100px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 opacity-10 blur-[80px] -ml-24 -mb-24" />
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -5, rotate: 1 }}
              className="group bg-white p-6 rounded-[2rem] border-[3px] border-slate-900 shadow-[6px_6px_0_#1f2937] transition-all"
            >
              <div className={clsx("w-14 h-14 rounded-2xl border-[3px] border-slate-900 flex items-center justify-center mb-6 shadow-[4px_4px_0_#1f2937] transition-transform group-hover:-rotate-6", item.bg)}>
                <Icon size={24} style={{ color: item.color }} strokeWidth={3} />
              </div>
              <div className="flex items-center gap-1 mb-1">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{item.title}</div>
                <Tooltip title={item.tooltip} placement="top">
                  <Info size={12} className="text-slate-400 cursor-help" />
                </Tooltip>
              </div>
              <div className="text-3xl font-black text-slate-900 tracking-tight">{item.value}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Progress Chart & New Students */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-[2.5rem] border-[3px] border-slate-900 shadow-[10px_10px_0_#1f2937] overflow-hidden" bodyStyle={{ padding: '2rem' }}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
                <Tooltip title="Phân tích điểm số dựa theo các kỹ năng phát âm (tính từ các lượt làm bài thực tế)">
                  <h3 className="text-xl font-black uppercase tracking-tight cursor-help flex items-center gap-2">
                    Kỹ năng mục tiêu
                    <Info size={16} className="text-slate-400" />
                  </h3>
                </Tooltip>
              </div>
              <button className="text-[10px] font-black uppercase tracking-widest text-[#49B6E5] hover:underline flex items-center gap-1">Chi tiết <ChevronRight size={14} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {(summary?.pronunciationMetrics || []).map((m: any) => (
                <div key={m.label} className="p-5 rounded-2xl border-[2px] border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-900 transition-all">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-600">{m.label}</span>
                    <span className={clsx("text-[10px] font-black uppercase px-2 py-0.5 rounded-full", m.trend === 'UP' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400')}>
                      {m.trend === 'UP' ? 'Improving' : 'Stable'}
                    </span>
                  </div>
                  <Progress
                    percent={m.value}
                    strokeColor="#49B6E5"
                    railColor="#e2e8f0"
                    strokeWidth={12}
                    className="doodle-progress"
                    format={p => <span className="font-black text-slate-900">{p}%</span>}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-[2.5rem] border-[3px] border-slate-900 shadow-[10px_10px_0_#1f2937] overflow-hidden" bodyStyle={{ padding: '2rem' }}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-emerald-400 rounded-full" />
                <h3 className="text-xl font-black uppercase tracking-tight">Học viên mới (24h)</h3>
              </div>
              <TrendingUp className="text-emerald-500" />
            </div>
            <List
              dataSource={summary?.recentStudents || []}
              renderItem={(item: any) => (
                <List.Item className="border-none px-0 py-4 group">
                  <div className="w-full flex items-center justify-between p-4 rounded-2xl border-[2.5px] border-transparent hover:border-slate-900 hover:bg-white transition-all">
                    <div className="flex items-center gap-4">
                      <Avatar
                        src={getAvatarUrl(item)}
                        size={52}
                        onError={() => { setAvatarErrors(prev => ({ ...prev, [item.id]: true })); return true; }}
                        className="border-[2.5px] border-slate-900 shadow-[3px_3px_0_#1f2937] group-hover:rotate-6 transition-transform"
                      />
                      <div>
                        <div className="text-[14px] font-black text-slate-900 uppercase tracking-tight">{item.fullName}</div>
                        <div className="text-[10px] font-bold text-slate-400 mt-0.5">{item.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-slate-900">{item.level}</div>
                      <div className="text-[8px] font-black uppercase tracking-widest text-[#49B6E5]">Level</div>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </div>

        {/* Right Column: Actions & Notifications */}
        <div className="space-y-8">
          <Card className="rounded-[2.5rem] border-[3px] border-slate-900 shadow-[10px_10px_0_#1f2937] bg-[#49B6E5] text-white" bodyStyle={{ padding: '2rem' }}>
            <h4 className="text-lg font-black uppercase tracking-tight mb-6">Phản hồi nhanh</h4>
            <div className="space-y-4">
              {[
                { text: 'Thiết kế lộ trình cho newbie', icon: Target },
                { text: 'Kiểm tra log của Gemini AI', icon: MessageSquare },
                { text: 'Cập nhật tài liệu luyện âm', icon: Users },
              ].map(action => (
                <button key={action.text} className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white hover:text-[#49B6E5] rounded-2xl border-[2px] border-white/20 transition-all group font-black text-[10px] uppercase tracking-widest">
                  <span className="flex items-center gap-3"><action.icon size={16} /> {action.text}</span>
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all" />
                </button>
              ))}
            </div>
          </Card>

          <Card className="rounded-[2.5rem] border-[3px] border-slate-900 shadow-[10px_10px_0_#1f2937] overflow-hidden" bodyStyle={{ padding: '2rem' }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-6 bg-rose-400 rounded-full" />
              <h3 className="text-xl font-black uppercase tracking-tight">Cần hỗ trợ</h3>
            </div>
            <div className="space-y-6">
              {(summary?.pendingFeedbacks || []).map((fb: any) => (
                <div key={fb.id} className="relative p-4 rounded-2xl border-[2.5px] border-slate-100 bg-slate-50/30 group hover:border-slate-900 hover:bg-white transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar
                      src={getAvatarUrl({ id: fb.studentId, fullName: fb.studentName })}
                      size={32}
                      className="border-[1.5px] border-slate-900"
                    />
                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{fb.studentName}</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 leading-relaxed italic truncate">"{fb.content || 'Yêu cầu kiểm tra tiến độ...'}"</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">2 giờ trước</span>
                    <button className="text-[9px] font-black uppercase text-[#49B6E5] hover:underline">Xử lý ngay</button>
                  </div>
                </div>
              ))}
              {(summary?.pendingFeedbacks || []).length === 0 && (
                <div className="py-10 text-center">
                  <CheckCircle className="mx-auto text-emerald-400 mb-4" size={32} />
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-300">Mọi thứ đã gọn gàng!</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .doodle-progress .ant-progress-text { font-family: 'Nunito' !important; }
        .ant-card { font-family: 'Nunito' !important; }
      `}} />
    </div>
  );
};

export default EducatorOverviewPage;
