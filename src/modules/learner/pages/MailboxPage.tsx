import { useState, useEffect } from 'react';
import { Card, Typography, Spin, Avatar, Tag, message, Badge, Progress, Button } from 'antd';
import { Mail, Clock, MessageSquare, Star, Sparkles, AudioLines, Info, MessageCircle } from 'lucide-react';
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
                            <Avatar size={64} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.educatorName}`} className="border-4 border-white shadow-sm" />
                            <div className="md:text-center">
                                <div className="font-black text-slate-800 text-sm leading-tight">{item.educatorName}</div>
                                <Tag color="indigo" className="text-[9px] font-bold rounded-full border-none mt-1 mx-0 uppercase">Giáo viên</Tag>

                                <Button
                                    type="link"
                                    size="small"
                                    icon={<MessageCircle size={14} />}
                                    className="mt-2 text-violet-600 font-bold flex items-center gap-1 mx-auto hover:text-violet-700"
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
                                <MessageSquare size={32} className="absolute -left-2 -top-2 opacity-5 text-indigo-600" />
                                <div className="pl-4 border-l-4 border-indigo-200">
                                    <Paragraph className="text-lg font-medium text-slate-800 m-0 leading-relaxed italic">
                                        "{item.comment}"
                                    </Paragraph>
                                </div>
                            </div>

                            {/* Detail Section if applicable */}
                            {isDetailFeedback && (
                                <div className="mt-6 bg-slate-50/80 p-5 rounded-2xl border border-slate-100 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex-1 min-w-[200px]">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                                                <Star size={12} className="text-amber-400 fill-amber-400" /> Ngữ cảnh luyện tập
                                            </div>
                                            <div className="text-sm font-bold text-slate-700 italic">"{item.targetText}"</div>
                                            {item.asrTranscription && (
                                                <div className="mt-2 text-xs text-slate-500">
                                                    Kết quả máy nhận diện: <span className="font-bold text-indigo-600 underline decoration-indigo-200">"{item.asrTranscription}"</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-center bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                                            <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Điểm AI</div>
                                            <div className="text-2xl font-black text-indigo-600 leading-none">{item.geminiScore || 0}<span className="text-xs text-slate-300">/100</span></div>
                                            <Progress percent={item.geminiScore || 0} showInfo={false} size="small" strokeColor="#6366f1" />
                                        </div>
                                    </div>

                                    {item.audioUrl && (
                                        <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                                            <AudioLines className="text-indigo-400" size={20} />
                                            <audio controls className="h-8 flex-1 custom-audio-player" src={item.audioUrl} />
                                        </div>
                                    )}

                                    {item.geminiFeedback && (
                                        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                                <Sparkles className="text-amber-500" />
                                            </div>
                                            <div className="text-[10px] font-bold text-amber-700 uppercase mb-1 flex items-center gap-1">
                                                <Info size={12} /> AI phân tích lỗi phát âm
                                            </div>
                                            <Paragraph className="text-xs text-amber-900 m-0 leading-relaxed italic">
                                                {item.geminiFeedback}
                                            </Paragraph>
                                        </div>
                                    )}
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
            <div className="max-w-4xl mx-auto space-y-10">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[40px] shadow-sm border border-indigo-50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -transtale-y-1/2 translate-x-1/4 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50" />
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="w-20 h-20 rounded-[30px] bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                            <Mail size={40} />
                        </div>
                        <div>
                            <Title level={1} style={{ margin: 0, fontWeight: 900, color: '#1e293b' }}>Hộp thư</Title>
                            <Text className="text-slate-400 font-medium text-lg">Phản hồi cá nhân hóa từ đội ngũ giáo viên SpeakVN</Text>
                        </div>
                    </div>
                    <div className="relative z-10 bg-indigo-50 px-6 py-3 rounded-2xl border border-indigo-100">
                        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest text-center mb-1">Tổng cộng</div>
                        <div className="text-3xl font-black text-indigo-600 text-center leading-none">{feedbacks.length}</div>
                        <div className="text-[10px] font-bold text-indigo-400 text-center mt-1 italic">Thông báo</div>
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
