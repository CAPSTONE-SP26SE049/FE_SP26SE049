import { useState, useEffect } from 'react';
import { Card, Typography, Spin, Avatar, Tag, message, Badge, Button } from 'antd';
import { Mail, Clock, Sparkles, MessageCircle } from 'lucide-react';
import { feedbackService, type Feedback } from '../../educator/services/feedbackService';
import { motion, AnimatePresence } from 'framer-motion';
import ChatBox from '../components/ChatBox';

const { Title, Text, Paragraph } = Typography;

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

    if (loading) return <div className="h-[400px] flex items-center justify-center"><Spin size="large" /></div>;

    const renderFeedbackCard = (item: Feedback, index: number) => {
        const isDetailFeedback = !!item.attemptId;

        return (
            <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
            >
                <Card className={`rounded-3xl border-none shadow-sm hover:shadow-md transition-all group overflow-hidden ${isDetailFeedback ? 'bg-white' : 'bg-gradient-to-br from-indigo-50/50 to-white'}`}>
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Profile & Header section */}
                        <div className="flex-shrink-0 flex md:flex-col items-center gap-3">
                            <Avatar size={48} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.educatorName}`} className="border-2 border-white shadow-sm" />
                            <div className="md:text-center">
                                <div className="font-bold text-slate-800 text-[11px] leading-tight">{item.educatorName}</div>
                                <div className="text-[8px] font-black text-violet-500 uppercase tracking-tighter mt-0.5">Giáo viên</div>

                                <Button
                                    type="link"
                                    size="small"
                                    icon={<MessageCircle size={12} />}
                                    className="mt-1 text-violet-600 font-bold flex items-center gap-1 mx-auto text-[10px]"
                                    onClick={() => setSelectedEducator({ id: item.educatorId, name: item.educatorName })}
                                >
                                    Trò chuyện
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4">
                            {/* Metadata */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <Clock size={12} />
                                    {new Date(item.createdAt).toLocaleString('vi-VN')}
                                    <span className="mx-1">•</span>
                                    <Tag color={isDetailFeedback ? 'orange' : 'blue'} className="border-none rounded-full text-[9px] px-3 font-black">
                                        {isDetailFeedback ? 'CHI TIẾT BÀI TẬP' : 'NHẬN XÉT TỔNG QUAN'}
                                    </Tag>
                                </div>
                                <Badge status={item.priority === 'HIGH' ? 'error' : 'processing'} text={item.priority === 'HIGH' ? 'QUAN TRỌNG' : 'THÔNG THƯỜNG'} className="text-[10px] font-bold" />
                            </div>

                            {/* Educator's Message */}
                            <div className="relative">
                                <div className="pl-3 border-l-2 border-indigo-200">
                                    <Paragraph className="text-sm font-semibold text-slate-800 m-0 leading-relaxed italic">
                                        "{item.comment}"
                                    </Paragraph>
                                </div>
                            </div>

                            {/* Detail Section if applicable */}
                            {isDetailFeedback && (
                                <div className="mt-4 bg-slate-50/80 p-3 rounded-xl border border-slate-100 space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex-1 min-w-[150px]">
                                            <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Mục tiêu: <span className="text-slate-800 italic normal-case font-bold">"{item.targetText}"</span></div>
                                            {item.asrTranscription && (
                                                <div className="text-[9px] text-slate-500 font-medium italic">
                                                    Máy nhận diện: <span className="font-black text-indigo-600">"{item.asrTranscription}"</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-center bg-white px-2 py-1.5 rounded-xl border border-slate-100 min-w-[70px]">
                                            <div className="text-[8px] font-black text-slate-300 uppercase leading-none mb-0.5">Điểm AI</div>
                                            <div className="text-lg font-black text-indigo-600 leading-none">
                                                {item.groqScore ?? (item as any).score ?? 0}
                                                <span className="text-[9px] text-slate-300">/100</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50/30 py-8 px-4">
            <div className="max-w-4xl mx-auto space-y-6">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-indigo-50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 rounded-full blur-3xl opacity-40" />
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                            <Mail size={24} />
                        </div>
                        <div>
                            <Title level={3} style={{ margin: 0, fontWeight: 900, color: '#1e293b' }}>Hộp thư</Title>
                            <Text className="text-slate-400 font-bold text-xs">Phản hồi cá nhân hóa từ giáo viên SpeakVN</Text>
                        </div>
                    </div>
                    <div className="relative z-10 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
                        <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest text-center">Tổng: <span className="text-indigo-600 text-sm ml-1">{feedbacks.length}</span></div>
                    </div>
                </header>

                <div className="space-y-6">
                    {feedbacks.length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 flex flex-col items-center">
                            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                <Sparkles size={40} className="text-slate-300" />
                            </div>
                            <Title level={3} className="text-slate-400">Hộp thư đang trống</Title>
                            <Text className="text-slate-400">Tiếp tục luyện tập để nhận được những lời khuyên hữu ích từ giáo viên nhé!</Text>
                        </motion.div>
                    ) : (
                        feedbacks.map((item, index) => renderFeedbackCard(item, index))
                    )}
                </div>
            </div>

            <AnimatePresence>
                {selectedEducator && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed bottom-4 right-4 z-[100]"
                    >
                        <ChatBox
                            friend={{ id: selectedEducator.id, name: selectedEducator.name }}
                            onClose={() => setSelectedEducator(null)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MailboxPage;
