import { useState, useEffect } from 'react';
import { Avatar, message, Skeleton } from 'antd';
import { Search, Rocket, Clock, CheckCircle, Map, Target, Users, Zap, Filter, ChevronDown, RotateCcw } from 'lucide-react';
import { educatorService, type StudentAccount } from '../services/educatorService';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import RoadmapPreviewModal from '../components/RoadmapPreviewModal';

const CustomPathSelectionPage = () => {
    const [students, setStudents] = useState<StudentAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [avatarErrors, setAvatarErrors] = useState<Record<string, boolean>>({});
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'SET' | 'NOT_SET' | 'AI' | 'MANUAL'>('ALL');
    const navigate = useNavigate();

    // Modal state
    const [previewVisible, setPreviewVisible] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string; type: 'AI' | 'MANUAL' | 'NONE' } | null>(null);

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

            // Robust data extraction
            let studentData: any[] = [];
            if (response && response.data) {
                studentData = Array.isArray(response.data) ? response.data : [];
            } else if (Array.isArray(response)) {
                studentData = response;
            }

            setStudents(studentData.filter((u: any) => (u.roleCode || '').toUpperCase() !== 'ADMIN'));
        } catch (error) {
            console.error('Fetch students error:', error);
            message.error('Không thể tải danh sách học viên. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = (students || []).filter(s => {
        const name = (s.fullName || '').toLowerCase();
        const email = (s.email || '').toLowerCase();
        const search = searchText.toLowerCase();
        const matchesSearch = name.includes(search) || email.includes(search);

        let matchesStatus = true;
        if (statusFilter === 'SET') matchesStatus = !!s.hasCustomPath;
        else if (statusFilter === 'NOT_SET') matchesStatus = !s.hasCustomPath;
        else if (statusFilter === 'AI') matchesStatus = !!(s.hasCustomPath && s.customPathType === 'AI');
        else if (statusFilter === 'MANUAL') matchesStatus = !!(s.hasCustomPath && s.customPathType === 'MANUAL');

        return matchesSearch && matchesStatus;
    });

    const handleViewRoadmap = (s: StudentAccount) => {
        setSelectedStudent({ id: s.id, name: s.fullName, type: s.customPathType });
        setPreviewVisible(true);
    };

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
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b5cf6]">Trung tâm cá nhân hóa</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Thiết kế lộ trình</h1>
                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">
                        Cá nhân hóa trải nghiệm học tập để <span className="text-slate-900">đột phá tiềm năng</span>
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} strokeWidth={3} />
                        <select
                            className="h-12 pl-12 pr-10 rounded-xl border-[2.5px] border-slate-900 bg-white font-black text-[10px] uppercase tracking-widest appearance-none focus:outline-none shadow-[4px_4px_0_#1f2937] cursor-pointer hover:bg-slate-50 transition-colors"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as any)}
                        >
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value="SET">Đã thiết lập</option>
                            <option value="NOT_SET">Đang chờ</option>
                            <option value="AI">Tự động (AI)</option>
                            <option value="MANUAL">Thủ công (GV)</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-900 pointer-events-none" size={16} strokeWidth={3} />
                    </div>

                    <div className="relative w-full md:w-80 flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} strokeWidth={3} />
                            <input
                                type="text"
                                placeholder="Tìm học viên..."
                                className="w-full h-12 pl-12 pr-4 rounded-xl border-[2.5px] border-slate-900 bg-white font-black text-xs uppercase tracking-wider focus:outline-none focus:ring-4 focus:ring-[#49B6E5]/10 transition-all shadow-[4px_4px_0_#1f2937]"
                                value={searchText}
                                onChange={e => setSearchText(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={fetchStudents}
                            disabled={loading}
                            className="w-12 h-12 flex items-center justify-center rounded-xl border-[2.5px] border-slate-900 bg-white shadow-[4px_4px_0_#1f2937] hover:-translate-y-1 hover:shadow-[6px_6px_0_#1f2937] active:translate-y-0 active:shadow-[2px_2px_0_#1f2937] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                            title="Làm mới danh sách"
                        >
                            <RotateCcw className={clsx("text-slate-900 transition-transform duration-500", loading && "animate-spin")} size={18} strokeWidth={3} />
                        </button>
                    </div>
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
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 border-[2.5px] border-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0_#10b98120]">
                                                        <CheckCircle size={14} strokeWidth={3} /> Đã thiết lập
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                        {s.customPathType === 'AI' ? (
                                                            <><Zap size={12} fill="#8b5cf6" className="text-[#8b5cf6]" /> Cơ chế tự động</>
                                                        ) : (
                                                            <><Users size={12} className="text-slate-400" /> Giáo viên thiết lập</>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 text-slate-300 border-[2px] border-slate-200 border-dashed rounded-full text-[10px] font-black uppercase tracking-widest">
                                                    <Clock size={14} strokeWidth={3} /> Đang trống
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-6 text-right pr-10">
                                            <div className="flex items-center justify-end gap-3">
                                                {s.hasCustomPath && (
                                                    <button
                                                        onClick={() => handleViewRoadmap(s)}
                                                        className="w-10 h-10 rounded-xl border-[2.5px] border-slate-900 bg-white text-slate-900 flex items-center justify-center shadow-[3px_3px_0_#1f2937] hover:-translate-y-1 hover:shadow-[5px_5px_0_#1f2937] transition-all"
                                                        title="Xem chi tiết lộ trình"
                                                    >
                                                        <Search size={18} strokeWidth={3} />
                                                    </button>
                                                )}
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
                                            </div>
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
            {/* Preview Modal */}
            {selectedStudent && (
                <RoadmapPreviewModal
                    visible={previewVisible}
                    onClose={() => setPreviewVisible(false)}
                    studentId={selectedStudent.id}
                    studentName={selectedStudent.name}
                    pathType={selectedStudent.type}
                />
            )}
        </div>
    );
};

export default CustomPathSelectionPage;
