import { useState, useEffect } from 'react';
import { Avatar, message, Skeleton } from 'antd';
import { Search, Rocket, Clock, CheckCircle, Map, Target, Users } from 'lucide-react';
import { educatorService, type StudentAccount } from '../services/educatorService';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

const CustomPathSelectionPage = () => {
    const [students, setStudents] = useState<StudentAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [avatarErrors, setAvatarErrors] = useState<Record<string, boolean>>({});
    const navigate = useNavigate();

    const getAvatarUrl = (s: any) => {
        if (avatarErrors[s.id]) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.fullName || s.id}`;
        return s.avatar_url || s.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.fullName || s.id}`;
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await educatorService.getStudentAccounts();
            const studentData = Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []);
            setStudents(studentData.filter((u: any) => (u.roleCode || '').toUpperCase() !== 'ADMIN'));
        } catch (error) {
            message.error('Không thể tải danh sách học viên');
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = (students || []).filter(s => {
        const name = (s.fullName || '').toLowerCase();
        const email = (s.email || '').toLowerCase();
        const search = searchText.toLowerCase();
        return name.includes(search) || email.includes(search);
    });

    const statsCards = [
        { label: 'Thành viên', val: students.length, icon: Users, color: '#49B6E5', bg: 'bg-blue-50' },
        { label: 'Đã thiết lập', val: students.filter(s => s.hasCustomPath).length, icon: CheckCircle, color: '#10b981', bg: 'bg-emerald-50' },
        { label: 'Đang chờ', val: students.filter(s => !s.hasCustomPath).length, icon: Rocket, color: '#f59e0b', bg: 'bg-amber-50' },
    ];

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-6 bg-[#8b5cf6] rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b5cf6]">Personalization Hub</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Thiết kế lộ trình</h1>
                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">
                        Cá nhân hóa trải nghiệm học tập để <span className="text-slate-900">đột phá tiềm năng</span>
                    </p>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} strokeWidth={3} />
                    <input
                        type="text"
                        placeholder="Tìm học viên để thiết kế..."
                        className="w-full h-12 pl-12 pr-4 rounded-xl border-[2.5px] border-slate-900 bg-white font-black text-xs uppercase tracking-wider focus:outline-none focus:ring-4 focus:ring-[#49B6E5]/10 transition-all shadow-[4px_4px_0_#1f2937]"
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                    />
                </div>
            </div>

            {/* Stats Section */}
            <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
                                    <p className="text-3xl font-black text-slate-900 leading-none">{item.val}</p>
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

            {/* Students Table */}
            <article className="rounded-[2.5rem] border-[3px] border-slate-900 bg-white p-8 shadow-[10px_10px_0_#1f2937] overflow-hidden min-h-[500px]">
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-emerald-500 rounded-full" />
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Học viên đang học</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Chọn học viên để bắt đầu cá nhân hóa</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="border-b-[3px] border-slate-900 text-left bg-slate-50/50">
                                <th className="px-6 py-5 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400">Học viên</th>
                                <th className="px-6 py-5 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 text-center">Trạng thái lộ trình</th>
                                <th className="px-6 py-5 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 text-right pr-10">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-[2px] divide-slate-100">
                            <AnimatePresence>
                                {loading ? (
                                    [...Array(6)].map((_, i) => (
                                        <tr key={i}><td colSpan={3} className="py-6 px-6 border-b border-slate-100"><Skeleton active avatar paragraph={{ rows: 1 }} title={false} /></td></tr>
                                    ))
                                ) : filteredStudents.map((s, idx) => (
                                    <motion.tr
                                        key={s.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="group hover:bg-slate-50/80 transition-all cursor-default"
                                    >
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-4">
                                                <Avatar
                                                    src={getAvatarUrl(s)}
                                                    onError={() => { setAvatarErrors(prev => ({ ...prev, [s.id]: true })); return true; }}
                                                    className="border-[2.5px] border-slate-900 shadow-[3px_3px_0_#1f2937] transition-transform group-hover:rotate-6 bg-slate-100 flex-shrink-0"
                                                    size={52}
                                                />
                                                <div>
                                                    <div className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-[#49B6E5] transition-colors">{s.fullName}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 mt-1">{s.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            {s.hasCustomPath ? (
                                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 border-[2.5px] border-emerald-500 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-[3px_3px_0_#10b98120]">
                                                    <CheckCircle size={14} strokeWidth={3} /> Đã thiết lập
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 text-slate-400 border-[2px] border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-wider">
                                                    <Clock size={14} strokeWidth={3} /> Chờ thiết lập
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-6 text-right pr-10">
                                            <button
                                                onClick={() => navigate(`/educator/design-path/${s.id}`)}
                                                className={clsx(
                                                    "inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl border-[2.5px] border-slate-900 font-black text-[11px] uppercase tracking-wider shadow-[4px_4px_0_#1f2937] hover:-translate-y-1 hover:shadow-[6px_6px_0_#1f2937] transition-all active:translate-y-0 text-white",
                                                    s.hasCustomPath ? "bg-emerald-600" : "bg-[#49B6E5]"
                                                )}
                                            >
                                                {s.hasCustomPath ? (
                                                    <><Target size={16} strokeWidth={3} /> Cập nhật</>
                                                ) : (
                                                    <><Rocket size={16} strokeWidth={3} /> Thiết kế</>
                                                )}
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {!loading && filteredStudents.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                        <Map size={64} strokeWidth={1} className="mb-4 opacity-20" />
                        <p className="text-sm font-black uppercase tracking-[0.2em]">Không tìm thấy học viên</p>
                    </div>
                )}
            </article>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid white; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}} />
        </div>
    );
};

export default CustomPathSelectionPage;
