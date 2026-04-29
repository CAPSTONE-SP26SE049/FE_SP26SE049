import React, { useEffect, useState } from 'react';
import { Modal, Spin } from 'antd';
import { customPathService, CustomPath } from '../services/customPathService';
import { Book, CheckCircle, Map, FileText, X, Rocket, Zap, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface RoadmapPreviewModalProps {
    visible: boolean;
    onClose: () => void;
    studentId: string;
    studentName: string;
    pathType?: 'AI' | 'MANUAL' | 'NONE';
}

const RoadmapPreviewModal: React.FC<RoadmapPreviewModalProps> = ({ visible, onClose, studentId, studentName, pathType }) => {
    const [loading, setLoading] = useState(false);
    const [path, setPath] = useState<CustomPath | null>(null);

    useEffect(() => {
        if (visible && studentId) {
            fetchPath();
        }
    }, [visible, studentId]);

    const fetchPath = async () => {
        setLoading(true);
        try {
            const res = await customPathService.getStudentCustomPath(studentId);
            setPath(res.data);
        } catch (err) {
            console.error('Failed to fetch path', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={visible}
            onCancel={onClose}
            footer={null}
            closeIcon={null}
            width={700}
            centered
            className="roadmap-preview-modal"
            bodyStyle={{ padding: 0 }}
        >
            <div className="bg-white rounded-[2rem] border-[4px] border-slate-900 overflow-hidden font-nunito shadow-[12px_12px_0_#1f2937]">
                {/* Header */}
                <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <Map size={120} strokeWidth={3} />
                    </div>
                    
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all group"
                    >
                        <X size={20} className="group-hover:rotate-90 transition-transform" />
                    </button>

                    <div className="flex items-center gap-3 mb-4">
                        <div className={clsx(
                            "px-3 py-1 rounded-lg border-[2px] border-white/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
                            pathType === 'AI' ? "bg-blue-500/20 text-blue-300" : "bg-amber-500/20 text-amber-300"
                        )}>
                            {pathType === 'AI' ? <ShieldCheck size={12} /> : <Zap size={12} fill="currentColor" />}
                            {pathType === 'AI' ? 'Lộ trình tự động' : 'Giáo viên thiết lập'}
                        </div>
                    </div>

                    <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Chi tiết lộ trình</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic flex items-center gap-2">
                        Học viên: <span className="text-white">{studentName}</span>
                    </p>
                </div>

                {/* Content */}
                <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="w-12 h-12 rounded-2xl border-[4px] border-slate-900 border-t-[#49B6E5]"
                            />
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest animate-pulse">Đang nạp dữ liệu...</p>
                        </div>
                    ) : path ? (
                        <div className="space-y-8">
                            <div className="bg-slate-50 p-6 rounded-2xl border-[3px] border-slate-900/5">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">{path.title}</h3>
                                <p className="text-sm font-bold text-slate-500 leading-relaxed">{path.description}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between ml-1">
                                    <div className="flex items-center gap-2">
                                        <Rocket size={16} className="text-[#49B6E5]" strokeWidth={3} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Các học phần mục tiêu</span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-[#49B6E5]">{path.levels.length} Chương</span>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {path.levels.map((level, i) => (
                                        <div key={level.levelId} className="flex items-center gap-4 p-4 bg-white border-[3px] border-slate-900 rounded-2xl shadow-[4px_4px_0_#1f293705] hover:shadow-[4px_4px_0_#1f2937] hover:-translate-y-0.5 transition-all">
                                            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{level.levelName}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{level.region} • {level.quizzes.length} Quizzes</div>
                                            </div>
                                            <div className="text-slate-200">
                                                <CheckCircle size={20} strokeWidth={3} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-20 text-center">
                            <FileText size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-sm font-black uppercase text-slate-400 tracking-widest">Không tìm thấy thông tin lộ trình</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 border-t-[3px] border-slate-900/5 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-8 h-12 rounded-xl border-[3px] border-slate-900 bg-white font-black text-xs uppercase tracking-widest text-slate-600 shadow-[4px_4px_0_#1f2937] hover:-translate-y-1 hover:shadow-[6px_6px_0_#1f2937] transition-all"
                    >
                        Đóng cửa sổ
                    </button>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .roadmap-preview-modal .ant-modal-content {
                    background: transparent;
                    box-shadow: none;
                }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}} />
        </Modal>
    );
};

export default RoadmapPreviewModal;
