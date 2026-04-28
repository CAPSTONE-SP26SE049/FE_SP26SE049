import { useState, useEffect } from 'react';
import { Avatar, message, Button } from 'antd';
import { Mail, Clock, Sparkles, MessageCircle, AudioLines, ChevronRight, Inbox } from 'lucide-react';
import { DoodleLoading } from '../../../components/ui/DoodleLoading';
import { feedbackService, type Feedback } from '../../educator/services/feedbackService';
import { motion, AnimatePresence } from 'framer-motion';
import ChatBox from '../components/ChatBox';
import clsx from 'clsx';

const MailboxPage = () => {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEducator, setSelectedEducator] = useState<{ id: string, name: string } | null>(null);

    useEffect(() => {
        fetchMailbox();
    }, []);

    const fetchMailbox = async () => {
        try {
            const data = await feedbackService.getMailbox();
            setFeedbacks(data);
        } catch (error) {
            message.error('Không thể tải hộp thư');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <DoodleLoading message="Đang kiểm tra thư..." />;

    const renderFeedbackCard = (item: Feedback, index: number) => {
        const isDetailFeedback = !!item.attemptId;

        return (
            <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, type: 'spring', bounce: 0.3 }}
                className="relative"
            >
                {/* Sketchy Card Container */}
                <div className={clsx(
                    "relative bg-white rounded-[2rem] border-[2.5px] border-slate-900 overflow-hidden transition-all duration-300 group",
                    "shadow-[6px_6px_0_#1f2937] hover:shadow-[10px_10px_0_#1f2937] hover:-translate-y-1",
                    !isDetailFeedback && "bg-gradient-to-br from-[#fbf6ef] to-white"
                )}>
                    <div className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row gap-8">

                            {/* Left: Educator Profile */}
                            <div className="flex flex-row md:flex-col items-center md:items-center gap-4 flex-shrink-0">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-[#49B6E5] rounded-2xl rotate-6 transition-transform group-hover:rotate-12" />
                                    <Avatar
                                        size={64}
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.educatorName}`}
                                        className="relative rounded-2xl border-[2.5px] border-slate-900 bg-white"
                                    />
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-[2px] border-slate-900 flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                    </div>
                                </div>
                                <div className="text-left md:text-center space-y-1">
                                    <h4 className="font-nunito font-black text-slate-900 text-sm leading-none">{item.educatorName}</h4>
                                    <span className="inline-block text-[9px] font-black text-[#49B6E5] uppercase tracking-wider ">Giáo viên</span>

                                    <div className="pt-2 hidden md:block">
                                        <button
                                            onClick={() => setSelectedEducator({ id: item.educatorId, name: item.educatorName })}
                                            className="px-4 py-1.5 rounded-xl border-[2px] border-slate-900 bg-white text-slate-900 text-[10px] font-black shadow-[2px_2px_0_#1f2937] active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1 mx-auto"
                                        >
                                            <MessageCircle size={12} strokeWidth={3} />
                                            Trò chuyện
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Right Content */}
                            <div className="flex-1 space-y-6">
                                {/* Meta Header */}
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full border-[1.5px] border-slate-900 shadow-[2px_2px_0_rgba(0,0,0,0.1)]">
                                            <Clock size={12} className="text-slate-500" strokeWidth={3} />
                                            <span className="text-[10px] font-black text-slate-500">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                        <span className={clsx(
                                            "text-[10px] font-black px-3 py-1 rounded-full border-[1.5px] border-slate-900 shadow-[2px_2px_0_rgba(0,0,0,0.1)]",
                                            isDetailFeedback ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
                                        )}>
                                            {isDetailFeedback ? 'CHI TIẾT BÀI TẬP' : 'NHẬN XÉT TỔNG QUAN'}
                                        </span>
                                    </div>
                                    <div className={clsx(
                                        "flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest",
                                        item.priority === 'HIGH' ? "text-red-500" : "text-green-500"
                                    )}>
                                        <div className={clsx("w-2 h-2 rounded-full", item.priority === 'HIGH' ? "bg-red-500" : "bg-green-500")} />
                                        {item.priority === 'HIGH' ? 'Quan trọng' : 'Thông thường'}
                                    </div>
                                </div>

                                {/* The Message Content */}
                                <div className="relative">
                                    <div className="absolute -left-4 top-0 bottom-0 w-1 bg-[#7dd3fc] rounded-full" />
                                    <p className="font-nunito font-bold text-base md:text-lg text-slate-800 leading-relaxed italic pl-2">
                                        "{item.comment}"
                                    </p>
                                </div>

                                {/* Exercise Specific Content */}
                                {isDetailFeedback && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-[#fbf6ef]/50 rounded-[1.5rem] border-[2px] border-slate-900 p-5 space-y-4 shadow-[4px_4px_0_rgba(0,0,0,0.05)]"
                                    >
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Câu mẫu</span>
                                                    <p className="font-nunito font-black text-slate-900 text-lg">"{item.targetText}"</p>
                                                </div>
                                                {item.asrTranscription && (
                                                    <div>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Bạn đã nói</span>
                                                        <p className="font-nunito font-bold text-sm text-[#49B6E5]">"{item.asrTranscription}"</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-center sm:justify-end">
                                                <div className="bg-white rounded-2xl border-[2.5px] border-slate-900 p-4 min-w-[140px] text-center shadow-[4px_4px_0_#1f2937] rotate-1 group-hover:rotate-0 transition-transform">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Điểm đánh giá</span>
                                                    <div className="text-3xl font-black text-slate-900 leading-none mb-2">
                                                        {item.groqScore ?? (item as any).score ?? 0}
                                                        <span className="text-xs text-slate-300 ml-1">/100</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-slate-100 rounded-full border-[1.5px] border-slate-900 overflow-hidden">
                                                        <div
                                                            className="h-full bg-[#49B6E5] rounded-full"
                                                            style={{ width: `${item.groqScore ?? (item as any).score ?? 0}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {item.audioUrl && (
                                            <div className="bg-white p-3 rounded-2xl border-[2px] border-slate-900 flex items-center gap-4 shadow-[3px_3px_0_rgba(0,0,0,0.05)]">
                                                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500 border-[1.5px] border-slate-900">
                                                    <AudioLines size={20} strokeWidth={3} />
                                                </div>
                                                <audio controls className="h-8 flex-1 opacity-80" src={item.audioUrl} />
                                            </div>
                                        )}

                                        {(item.groqFeedback || (item as any).feedback) && (
                                            <div className="relative bg-yellow-50 rounded-2xl border-[2px] border-slate-900 p-4 pt-8 shadow-[3px_3px_0_rgba(0,0,0,0.05)] overflow-hidden">
                                                <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:scale-110 transition-transform">
                                                    <Sparkles className="text-yellow-600" size={32} />
                                                </div>
                                                <div className="absolute top-0 left-0 px-3 py-1 bg-yellow-400 text-slate-900 font-black text-[9px] uppercase border-b-[2px] border-r-[2px] border-slate-900 rounded-br-xl">
                                                    AI Phân tích lỗi
                                                </div>
                                                <p className="font-nunito font-bold text-xs text-yellow-900 m-0 leading-relaxed italic">
                                                    {item.groqFeedback || (item as any).feedback}
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* Mobile Chat Button */}
                                <div className="md:hidden pt-2">
                                    <button
                                        onClick={() => setSelectedEducator({ id: item.educatorId, name: item.educatorName })}
                                        className="w-full py-3 rounded-2xl border-[2.5px] border-slate-900 bg-white text-slate-900 text-xs font-black shadow-[4px_4px_0_#1f2937] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
                                    >
                                        <MessageCircle size={14} strokeWidth={3} />
                                        Trò chuyện với giáo viên
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen bg-[#fbf6ef] font-nunito p-6 lg:p-10 pb-24">
            <div className="max-w-none mx-auto space-y-10 px-4 lg:px-8">

                {/* Header Doodle Section */}
                <header className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <motion.div
                            initial={{ rotate: -10, scale: 0.8 }}
                            animate={{ rotate: 0, scale: 1 }}
                            className="w-20 h-20 bg-[#49B6E5] rounded-[2.5rem] border-[3px] border-slate-900 shadow-[6px_6px_0_#1f2937] flex items-center justify-center text-white"
                        >
                            <Mail size={32} strokeWidth={2.5} />
                        </motion.div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-nunito font-black text-slate-900 leading-tight">Hộp thư</h1>
                            <p className="text-slate-500 font-bold text-sm md:text-base mt-1">Phản hồi cá nhân hóa từ giáo viên SpeakVN</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="bg-white border-[2.5px] border-slate-900 rounded-2xl px-6 py-3 shadow-[4px_4px_0_#1f2937] flex flex-col items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng phản hồi</span>
                            <span className="text-2xl font-black text-slate-900">{feedbacks.length}</span>
                        </div>
                    </div>

                    {/* Decorative hand-drawn line */}
                    <div className="absolute -bottom-6 left-0 right-0 h-1">
                        <svg className="w-full h-full text-slate-900/20" viewBox="0 0 1200 4" preserveAspectRatio="none">
                            <path d="M0,2 Q300,0 600,2 T1200,2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-8 pt-6">
                    {feedbacks.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-24 flex flex-col items-center text-center px-6"
                        >
                            <div className="relative w-40 h-40 mb-8">
                                <div className="absolute inset-0 bg-slate-100 rounded-[3rem] rotate-12 scale-95" />
                                <div className="relative inset-0 w-full h-full bg-white border-[3px] border-slate-900 rounded-[3rem] shadow-[8px_8px_0_#1f2937] flex items-center justify-center">
                                    <Inbox size={64} className="text-slate-200" strokeWidth={1} />
                                </div>
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 3 }}
                                    className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-400 rounded-2xl border-[2.5px] border-slate-900 flex items-center justify-center shadow-[4px_4px_0_#1f2937] -rotate-12"
                                >
                                    <Sparkles size={24} className="text-slate-900" />
                                </motion.div>
                            </div>
                            <h3 className="text-2xl font-nunito font-black text-slate-900 mb-2">Hộp thư đang trống</h3>
                            <p className="text-slate-400 font-bold max-w-sm">
                                Tiếp tục luyện tập và tham gia các bài học để nhận được những nhận xét hữu ích từ giáo viên nhé!
                            </p>
                            <Button
                                type="primary"
                                size="large"
                                className="mt-8 h-14 px-10 rounded-2xl font-black text-lg bg-slate-900 border-none shadow-[6px_6px_0_#1f2937] hover:translate-y-[-2px] transition-transform"
                                icon={<ChevronRight size={20} />}
                            >
                                Đi đến Lộ trình
                            </Button>
                        </motion.div>
                    ) : (
                        feedbacks.map((item, index) => renderFeedbackCard(item, index))
                    )}
                </div>
            </div>

            <AnimatePresence>
                {selectedEducator && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20, rotate: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20, rotate: -5 }}
                        className="fixed bottom-6 right-6 z-[1000]"
                    >
                        {/* Wrapper for sketchy look on chat box if possible, or just the box */}
                        <div className="relative">
                            <div className="absolute -inset-2 bg-slate-900 rounded-3xl opacity-10 blur-xl" />
                            <ChatBox
                                friend={{ id: selectedEducator.id, name: selectedEducator.name }}
                                onClose={() => setSelectedEducator(null)}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .custom-audio-player::-webkit-media-controls-panel {
                    background-color: transparent;
                }
                .ant-progress-inner {
                    border: 1.5px solid #1f2937 !important;
                    background-color: #f1f5f9 !important;
                }
                .ant-progress-bg {
                    border-right: 1.5px solid #1f2937 !important;
                }
            `}</style>
        </div>
    );
};

export default MailboxPage;
