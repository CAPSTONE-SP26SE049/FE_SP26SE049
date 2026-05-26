import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Avatar, message } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { customPathService, type PathLevel } from '../services/customPathService';
import { Layout, ChevronLeft, Save, Map, Search, Book, CheckCircle, Rocket, Zap, Target } from 'lucide-react';
import clsx from 'clsx';

const CustomPathDesignerPage: React.FC = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [allLevels, setAllLevels] = useState<PathLevel[]>([]);
    const [selectedLevelIds, setSelectedLevelIds] = useState<string[]>([]);
    const [searchText, setSearchText] = useState('');

    const [title, setTitle] = useState('Lộ trình học tập cá nhân');
    const [description, setDescription] = useState('Lộ trình được thiết kế riêng nhằm cải thiện các kỹ năng còn yếu.');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [levelsRes, currentPathRes] = await Promise.all([
                    customPathService.getAllLevels(),
                    customPathService.getStudentCustomPath(studentId!).catch(() => ({ data: null }))
                ]);

                setAllLevels(levelsRes.data || []);

                if (currentPathRes?.data) {
                    setTitle(currentPathRes.data.title);
                    setDescription(currentPathRes.data.description);
                    setSelectedLevelIds(currentPathRes.data.levels.map((l: any) => l.levelId));
                }
            } catch (err) {
                message.error('Không thể tải dữ liệu');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [studentId]);

    const handleSave = async () => {
        if (selectedLevelIds.length === 0) {
            message.warning('Vui lòng chọn ít nhất một chương');
            return;
        }

        setSubmitting(true);
        try {
            await customPathService.createCustomPath(studentId!, {
                title,
                description,
                levelIds: selectedLevelIds
            });
            message.success('Đã lưu lộ trình thành công!');
            navigate('/educator/design-path');
        } catch (err) {
            message.error('Lỗi khi lưu lộ trình');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredLevels = (allLevels || []).filter(l => {
        const name = (l.levelName || '').toLowerCase();
        const region = (l.region || '').toLowerCase();
        const search = searchText.toLowerCase();
        return name.includes(search) || region.includes(search);
    });

    const toggleLevel = (id: string) => {
        setSelectedLevelIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    if (loading) return (
        <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 rounded-3xl border-[4px] border-slate-900 border-t-[#49B6E5] shadow-[6px_6px_0_#1f2937]"
            />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Đang nạp bản đồ kiến thức...</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-10 font-nunito">
            {/* Header & Breadcrumbs */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-6 bg-[#49B6E5] rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#49B6E5]">Knowledge Map Designer</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Thiết kế lộ trình riêng</h1>
                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">
                        Cá nhân hóa trải nghiệm học tập bằng cách <span className="text-slate-900">chọn các phần phù hợp nhất</span>
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/educator/design-path')}
                        className="h-12 px-6 rounded-2xl border-[3px] border-slate-900 bg-white font-black text-xs uppercase tracking-widest text-slate-600 shadow-[4px_4px_0_#1f2937] hover:-translate-y-1 hover:shadow-[6px_6px_0_#1f2937] transition-all flex items-center gap-2"
                    >
                        <ChevronLeft size={18} strokeWidth={3} /> Quay lại
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={submitting}
                        className="h-12 px-8 rounded-2xl border-[3px] border-slate-900 bg-[#49B6E5] font-black text-xs uppercase tracking-widest text-white shadow-[4px_4px_0_#1f2937] hover:-translate-y-1 hover:shadow-[6px_6px_0_#1f2937] transition-all flex items-center gap-2 disabled:opacity-50 disabled:grayscale"
                    >
                        <Save size={18} strokeWidth={3} /> {submitting ? 'Đang lưu...' : 'Phát hành lộ trình'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Sidebar Settings */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-white rounded-[2.5rem] border-[3px] border-slate-900 shadow-[10px_10px_0_#1f2937] p-8 space-y-8 overflow-hidden relative">
                        <div className="flex items-center gap-3 mb-2">
                            <Layout size={20} className="text-[#49B6E5]" strokeWidth={3} />
                            <h3 className="text-xl font-black uppercase tracking-tight">Cấu hình lộ trình</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 ml-1">Tiêu đề hiển thị</label>
                                <input
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full h-14 px-5 rounded-2xl border-[2.5px] border-slate-900/10 hover:border-slate-900 focus:border-[#49B6E5] focus:outline-none font-black text-sm text-slate-900 transition-all placeholder:text-slate-300"
                                    placeholder="Vd: Luyện âm vực cao..."
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 ml-1">Mô tả định hướng</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={5}
                                    className="w-full p-5 rounded-2xl border-[2.5px] border-slate-900/10 hover:border-slate-900 focus:border-[#49B6E5] focus:outline-none font-bold text-sm text-slate-600 transition-all resize-none placeholder:text-slate-300"
                                    placeholder="Giải thích lý do học viên cần lộ trình này..."
                                />
                            </div>
                        </div>

                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <Map size={120} strokeWidth={3} />
                        </div>
                    </div>

                    <motion.div
                        layout
                        className="bg-[#49B6E5] rounded-[2.5rem] border-[3px] border-slate-900 p-8 text-white shadow-[10px_10px_0_#1f2937] relative overflow-hidden"
                    >
                        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-black uppercase tracking-tight">Đã chọn ({selectedLevelIds.length})</h3>
                                <Rocket className="text-white/50" size={24} strokeWidth={3} />
                            </div>
                            <p className="text-white/80 text-[11px] font-bold italic mb-6 leading-relaxed">
                                Các học phần đã chọn sẽ được ưu tiên hiển thị trên giao diện của học viên sau khi bạn nhấn Lưu.
                            </p>

                            <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto custom-scrollbar-white pr-2">
                                <AnimatePresence>
                                    {selectedLevelIds.map(id => {
                                        const l = allLevels.find(level => level.levelId === id);
                                        return (
                                            <motion.div
                                                key={id}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                className="flex items-center gap-2 bg-white/20 hover:bg-white text-white hover:text-[#49B6E5] border-[2px] border-white/30 rounded-xl py-2 px-4 transition-all group cursor-default"
                                            >
                                                <span className="text-[10px] font-black uppercase tracking-wider">{l?.levelName}</span>
                                                <button onClick={() => toggleLevel(id)} className="opacity-50 hover:opacity-100">
                                                    <Zap size={14} fill="currentColor" />
                                                </button>
                                            </motion.div>
                                        );
                                    })}
                                    {selectedLevelIds.length === 0 && (
                                        <div className="w-full text-center py-8">
                                            <div className="text-[10px] font-black uppercase text-white/40 italic">Chưa có học phần nào được chọn</div>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Right Content Chapter Selection */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white p-5 rounded-[2rem] border-[3px] border-slate-900 shadow-[8px_8px_0_#1f293705] flex items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} strokeWidth={3} />
                            <input
                                placeholder="Tìm kiếm theo tên chương, vùng miền hoặc kiến thức..."
                                value={searchText}
                                onChange={e => setSearchText(e.target.value)}
                                className="w-full h-12 pl-12 pr-4 border-none bg-slate-50/50 rounded-xl font-black text-xs uppercase tracking-wider focus:outline-none transition-all placeholder:text-slate-300"
                            />
                        </div>
                        <div className="flex items-center gap-3 px-6 h-12 border-l-[2px] border-slate-100 text-[#49B6E5]">
                            <Target size={20} strokeWidth={3} />
                            <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap hidden md:inline">Global Map</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
                        {filteredLevels.map((level, i) => {
                            const isSelected = selectedLevelIds.includes(level.levelId);
                            return (
                                <motion.div
                                    key={level.levelId}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    onClick={() => toggleLevel(level.levelId)}
                                    className="cursor-pointer"
                                >
                                    <div className={clsx(
                                        "p-6 rounded-[2.5rem] border-[3.5px] transition-all duration-300 relative overflow-hidden group",
                                        isSelected
                                            ? "bg-slate-50 border-slate-900 shadow-[8px_8px_0_#49B6E5]"
                                            : "bg-white border-slate-900 shadow-[6px_6px_0_#1f293710] hover:shadow-[8px_8px_0_#1f293720] hover:-translate-y-1 hover:border-slate-900"
                                    )}>
                                        {isSelected && (
                                            <div className="absolute top-6 right-6 text-[#49B6E5]">
                                                <div className="w-8 h-8 rounded-full border-[2.5px] border-slate-900 bg-white flex items-center justify-center shadow-[2px_2px_0_#1f2937]">
                                                    <CheckCircle size={16} strokeWidth={4} />
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-5 relative z-10">
                                            <div className={clsx(
                                                "w-16 h-16 rounded-[1.5rem] flex items-center justify-center border-[3px] border-slate-900 shadow-[4px_4px_0_#1f2937] transition-all duration-300 group-hover:-rotate-3 group-hover:scale-105",
                                                isSelected ? "bg-[#49B6E5] text-white" : "bg-white text-slate-300"
                                            )}>
                                                <Book size={28} strokeWidth={3} />
                                            </div>
                                            <div className="flex-1">
                                                <div className={clsx(
                                                    "font-black text-lg tracking-tight mb-2 uppercase leading-snug",
                                                    isSelected ? "text-slate-900" : "text-slate-400 group-hover:text-slate-900"
                                                )}>
                                                    {level.levelName}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="px-3 py-0.5 rounded-lg border-[1.5px] border-slate-900 bg-white font-black text-[9px] uppercase tracking-wider text-slate-800">
                                                        {level.region}
                                                    </div>
                                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic group-hover:text-slate-400 transition-colors">Unit {i + 1}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {filteredLevels.length === 0 && (
                        <div className="py-20 bg-white rounded-[3rem] border-[3px] border-dashed border-slate-200 text-center flex flex-col items-center">
                            <div className="w-16 h-16 rounded-3xl bg-slate-50 border-[2.5px] border-slate-100 flex items-center justify-center mb-4">
                                <Zap className="text-slate-200" size={32} />
                            </div>
                            <p className="text-sm font-black uppercase tracking-widest text-slate-300 italic">Không tìm thấy mã kiến thức phù hợp</p>
                        </div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar-white::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar-white::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .custom-scrollbar-white::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.4); border-radius: 10px; }
            `}} />
        </div>
    );
};

export default CustomPathDesignerPage;
