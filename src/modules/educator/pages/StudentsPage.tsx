import { useState, useEffect, useMemo } from 'react';
import { Avatar, Tooltip, message } from 'antd';
import { Search, LayoutGrid, List, UserCheck, ShieldCheck, Users } from 'lucide-react';
import { educatorService, type StudentAccount } from '../services/educatorService';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

const StudentsPage = () => {
  const [students, setStudents] = useState<StudentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [avatarErrors, setAvatarErrors] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();


  const getAvatarUrl = (s: any) => {
    if (avatarErrors[s.id]) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.fullName || s.id}`;
    return s.avatar_url || s.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.fullName || s.id}`;
  };

  const load = async () => {
    setLoading(true);
    try {
      const response = await educatorService.getStudentAccounts();
      const studentData = Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []);
      setStudents(studentData.filter((u: any) => (u.roleCode || '').toUpperCase() !== 'ADMIN'));
    } catch {
      message.error('Không thể tải danh sách học viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredStudents = useMemo(() => {
    return (students || []).filter(s => {
      const matchesSearch = (s.fullName || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(searchText.toLowerCase());
      const matchesLevel = levelFilter === 'ALL' || (s.level || 'A1') === levelFilter;
      return matchesSearch && matchesLevel;
    });
  }, [students, searchText, levelFilter]);


  const stats = [
    { label: 'Tổng số', value: students.length, color: '#49B6E5', icon: Users },
    { label: 'Hoạt động', value: students.filter(s => (s.pronunciationScore || 0) > 0).length, color: '#10b981', icon: UserCheck },
    { label: 'Cần hỗ trợ', value: students.filter(s => (s.pronunciationScore || 0) < 50 && (s.pronunciationScore || 0) > 0).length, color: '#f59e0b', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Stats Section */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-6 bg-[#49B6E5] rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#49B6E5]">Student Directory</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Quản lý học viên</h1>
          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">
            Theo dõi tiến độ và <span className="text-slate-900">kỹ năng phát âm</span> của từng thành viên
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 xl:w-[600px]">
          {stats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white border-[2.5px] border-slate-900 p-4 rounded-[1.5rem] shadow-[4px_4px_0_#1f2937] flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937]" style={{ backgroundColor: s.color + '20', color: s.color }}>
                  <Icon size={20} strokeWidth={3} />
                </div>
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{s.label}</div>
                  <div className="text-xl font-black text-slate-900 leading-tight">{s.value}</div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} strokeWidth={3} />
          <input
            type="text"
            placeholder="Tìm kiếm học viên bằng tên hoặc email..."
            className="w-full h-14 pl-12 pr-4 rounded-[1.25rem] border-[3px] border-slate-900 bg-white font-black text-sm uppercase tracking-wider focus:outline-none focus:ring-8 focus:ring-[#49B6E5]/10 shadow-[6px_6px_0_#1f2937] transition-all"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" size={16} strokeWidth={3} />
            <select
              className="h-14 pl-12 pr-10 rounded-2xl border-[3px] border-slate-900 bg-white font-black text-xs uppercase tracking-widest appearance-none focus:outline-none shadow-[6px_6px_0_#1f2937] cursor-pointer"
              value={levelFilter}
              onChange={e => setLevelFilter(e.target.value)}
            >
              <option value="ALL">Tất cả Level</option>
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lv => <option key={lv} value={lv}>Level {lv}</option>)}
            </select>
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border-[3px] border-slate-900 shadow-[4px_4px_0_#1f2937">
            <button
              onClick={() => setViewMode('list')}
              className={clsx("p-2.5 rounded-xl transition-all", viewMode === 'list' ? "bg-white border-[2.5px] border-slate-900 shadow-sm text-slate-900" : "text-slate-400")}
            ><List size={20} strokeWidth={3} /></button>
            <button
              onClick={() => setViewMode('grid')}
              className={clsx("p-2.5 rounded-xl transition-all", viewMode === 'grid' ? "bg-white border-[2.5px] border-slate-900 shadow-sm text-slate-900" : "text-slate-400")}
            ><LayoutGrid size={20} strokeWidth={3} /></button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <article className="rounded-[2.5rem] border-[3px] border-slate-900 bg-white p-8 shadow-[12px_12px_0_#1f2937] overflow-hidden min-h-[500px]">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-2 h-10 bg-[#49B6E5] rounded-full" />
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Danh sách học viên</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Chi tiết tiến độ và kỹ năng phát âm của từng người</p>
            </div>
          </div>
          <div className="px-5 py-2.5 rounded-2xl border-[2.5px] border-slate-900 bg-slate-50 font-black text-[10px] uppercase tracking-widest text-slate-600 shadow-[4px_4px_0_#1f2937]">
            Live Database
          </div>
        </div>

        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#49B6E5] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b-[3px] border-slate-900/5 text-left bg-slate-50/30 rounded-t-2xl">
                  <th className="px-6 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Học viên</th>
                  <th className="px-6 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 text-center">Dialect</th>
                  <th className="px-6 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Tiến trình học</th>
                  <th className="px-6 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 text-center">Độ chính xác</th>
                  <th className="px-6 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 text-right pr-10">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y-[2px] divide-slate-100">
                <AnimatePresence>
                  {filteredStudents.map((s, idx) => (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group hover:bg-slate-50/50 transition-all cursor-default"
                    >
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          <Avatar
                            src={getAvatarUrl(s)}
                            onError={() => { setAvatarErrors(prev => ({ ...prev, [s.id]: true })); return true; }}
                            className="border-[2.5px] border-slate-900 shadow-[3px_3px_0_#1f2937] transition-transform group-hover:rotate-6 bg-slate-100"
                            size={52}
                          />
                          <div>
                            <div className="text-[14px] font-black text-slate-900 uppercase tracking-tight group-hover:text-[#49B6E5] transition-colors">{s.fullName}</div>
                            <div className="text-[10px] font-bold text-slate-400 mt-0.5">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <div className="inline-block px-4 py-1 rounded-xl border-[2.2px] border-slate-900 bg-white font-black text-[10px] shadow-[2px_2px_0_#1f2937] uppercase">
                          {((s as any).dialect || 'SOUTH').toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="w-40 space-y-2">
                          <div className="flex justify-between text-[9px] font-black uppercase text-slate-400 tracking-wider">
                            <span>Completing</span>
                            <span>{s.progressPercent || 0}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${s.progressPercent || 0}%` }}
                              className="h-full bg-[#49B6E5]"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <div className="flex flex-col items-center">
                          <span className={clsx("text-sm font-black italic", (s.pronunciationScore || 0) >= 80 ? "text-emerald-500" : (s.pronunciationScore || 0) >= 50 ? "text-[#49B6E5]" : "text-rose-500")}>
                            {s.pronunciationScore || 0}%
                          </span>
                          <span className="text-[8px] font-black uppercase text-slate-300 tracking-widest mt-1">Score</span>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right pr-10">
                        <div className="flex justify-end gap-2">
                          <Tooltip title="Gửi lời khuyên">
                            <button className="w-10 h-10 rounded-xl border-[2.2px] border-slate-900 flex items-center justify-center text-slate-400 hover:text-[#49B6E5] hover:bg-white hover:-translate-y-1 hover:shadow-[3px_3px_0_#1f2937] transition-all">
                              <ShieldCheck size={18} strokeWidth={3} />
                            </button>
                          </Tooltip>
                          <button
                            onClick={() => navigate(`/educator/students/profile/${s.id}`)}
                            className="h-10 px-5 rounded-xl border-[2.5px] border-slate-900 bg-white font-black text-[10px] uppercase tracking-widest shadow-[4px_4px_0_#1f2937] hover:-translate-y-1 hover:shadow-[6px_6px_0_#1f2937] transition-all active:translate-y-0 text-slate-900"
                          >
                            Profile
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredStudents.map((s, idx) => (
              <motion.article
                key={s.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="group relative p-6 bg-white rounded-[2rem] border-[3px] border-slate-900 shadow-[6px_6px_0_#1f2937] hover:shadow-[10px_10px_0_#1f2937] transition-all"
              >
                <div className="flex items-center gap-4 mb-6">
                  <Avatar
                    src={getAvatarUrl(s)}
                    onError={() => { setAvatarErrors(prev => ({ ...prev, [s.id]: true })); return true; }}
                    size={64}
                    className="border-[3px] border-slate-900 shadow-[4px_4px_0_#1f293705] group-hover:rotate-6 transition-transform"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight truncate">{s.fullName}</h3>
                    <p className="text-[10px] font-bold text-slate-400 truncate italic mb-2">{s.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 rounded-2xl bg-slate-50 border-[2px] border-slate-100 group-hover:border-slate-900/10 transition-all text-center">
                    <div className="text-[8px] font-black uppercase text-slate-300 tracking-[0.2em] mb-1">Score</div>
                    <div className={clsx("text-lg font-black italic", (s.pronunciationScore || 0) >= 80 ? "text-emerald-500" : "text-[#49B6E5]")}>{s.pronunciationScore || 0}%</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border-[2px] border-slate-100 group-hover:border-slate-900/10 transition-all text-center">
                    <div className="text-[8px] font-black uppercase text-slate-300 tracking-[0.2em] mb-1">Dialect</div>
                    <div className="text-xs font-black uppercase text-slate-900 tracking-tight">{((s as any).dialect || 'SOUTH')}</div>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 px-1">
                      <span>Progress</span>
                      <span>{s.progressPercent || 0}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full border border-slate-200 overflow-hidden">
                      <div className="h-full bg-[#49B6E5]" style={{ width: `${s.progressPercent || 0}%` }} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/educator/students/profile/${s.id}`)}
                    className="flex-1 py-3.5 rounded-2xl border-[2.5px] border-slate-900 bg-[#49B6E5] text-white font-black text-[10px] uppercase tracking-widest shadow-[4px_4px_0_#1f2937] hover:-translate-y-1 hover:shadow-[6px_6px_0_#1f2937] transition-all"
                  >
                    Profile
                  </button>
                  <Tooltip title="Gửi lời khuyên">
                    <button className="w-12 rounded-2xl border-[2.5px] border-slate-900 bg-white text-slate-400 hover:text-blue-500 shadow-[4px_4px_0_#1f2937] hover:-translate-y-1 hover:shadow-[6px_6px_0_#1f2937] transition-all flex items-center justify-center">
                      <ShieldCheck size={18} />
                    </button>
                  </Tooltip>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </article>

      <style dangerouslySetInnerHTML={{
        __html: `
        .doodle-table-container table { border-collapse: separate; border-spacing: 0 12px; }
      `}} />
    </div>
  );
};

export default StudentsPage;
