import { useState, useEffect, useRef } from 'react';
import { Card, Button, Modal, Input, message, Typography, Avatar, Empty, Tooltip, Tabs, Badge } from 'antd';
import { MessageSquare, Star, Send, Users, AudioLines, MessageCircle, History, Bot, Sparkles, MessageCircleMore, LayoutDashboard } from 'lucide-react';
import { educatorService, type StudentAccount } from '../services/educatorService';
import { feedbackService, type SpeakingAttempt, type Feedback } from '../services/feedbackService';
import { motion, AnimatePresence } from 'framer-motion';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const InteractionsPage = () => {
    const [students, setStudents] = useState<StudentAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<StudentAccount | null>(null);
    const [attempts, setAttempts] = useState<SpeakingAttempt[]>([]);
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [attemptsLoading, setAttemptsLoading] = useState(false);
    const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
    const [selectedAttempt, setSelectedAttempt] = useState<SpeakingAttempt | null>(null);
    const [comment, setComment] = useState('');

    // Chat states
    const [messages, setMessages] = useState<any[]>([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchStudents();
        const interval = setInterval(fetchStudents, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await educatorService.getStudentAccounts();
            const studentData = Array.isArray(response.data) ? response.data : [];
            setStudents(studentData);

            if (selectedStudent) {
                const current = studentData.find((s: any) => s.id === selectedStudent.id);
                if (current && current.unreadCount > 0) {
                    await educatorService.markAsRead(selectedStudent.id);
                }
            }
        } catch (error) {
            console.error('Lỗi tải danh sách:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAttempts = async (studentId: string) => {
        setAttemptsLoading(true);
        try {
            const [attRes, feedRes] = await Promise.all([
                feedbackService.getSpeakingAttempts(studentId),
                feedbackService.getStudentFeedbacks(studentId)
            ]);
            // Service now returns the array directly
            setAttempts(attRes || []);
            setFeedbacks(feedRes || []);
        } catch (error) {
            message.error('Không thể tải lịch sử luyện tập');
        } finally {
            setAttemptsLoading(false);
        }
    };

    const fetchConversation = async (studentId: string) => {
        setChatLoading(true);
        try {
            const response = await educatorService.getConversationMessages(studentId);
            setMessages(response.data || []);
            scrollToBottom();
            await educatorService.markAsRead(studentId);
            fetchStudents();
        } catch (error) {
            message.error('Không thể tải tin nhắn');
        } finally {
            setChatLoading(false);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSelectStudent = async (student: StudentAccount) => {
        setSelectedStudent(student);
        await Promise.all([
            fetchAttempts(student.id),
            fetchConversation(student.id)
        ]);
    };

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedStudent) return;

        try {
            const res = await educatorService.sendMessage({
                studentId: selectedStudent.id,
                content: messageInput
            });
            setMessages([...messages, res.data]);
            setMessageInput('');
            scrollToBottom();
            fetchStudents();
        } catch (error) {
            message.error('Gửi tin nhắn thất bại');
        }
    };

    const handleSendFeedback = async () => {
        if (!comment.trim() || !selectedStudent) return;
        try {
            await feedbackService.sendFeedback(selectedStudent.id, selectedAttempt?.id, comment);
            message.success('Đã gửi nhận xét thành công');
            setComment('');
            setFeedbackModalVisible(false);
            fetchAttempts(selectedStudent.id);
        } catch (error) {
            message.error('Gửi nhận xét thất bại');
        }
    };

    const formatTime = (timeStr?: string) => {
        if (!timeStr) return '';
        const date = new Date(timeStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        if (diff < 60000) return 'Vừa xong';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}p`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
        return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
    };

    const highlightErrors = (target: string | null | undefined, asr: string | null | undefined) => {
        if (!asr) return <span className="text-slate-400 italic">Chưa có dữ liệu</span>;
        if (!target) return <span>{asr}</span>;

        const targetWords = target.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/);
        const asrWords = asr.split(/\s+/);

        return asrWords.map((word, i) => {
            const cleanWord = word.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
            const isWrong = !targetWords.includes(cleanWord);
            return (
                <span key={i} className={`${isWrong ? 'text-rose-500 font-bold underline decoration-rose-300 underline-offset-4' : 'text-slate-700'} mr-1`}>
                    {word}
                </span>
            );
        });
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return '#22c55e'; // Green
        if (score >= 50) return '#f59e0b'; // Amber
        return '#ef4444'; // Red
    };

    const overallFeedbacks = feedbacks.filter(f => !f.attemptId);

    return (
        <div className="max-w-[1600px] mx-auto p-4 lg:p-8 min-h-screen bg-[#f8fafc]">
            <div className="flex flex-col lg:flex-row gap-8 h-full">

                {/* --- Student Sidebar --- */}
                <div className="w-full lg:w-[380px] flex-shrink-0">
                    <div className="bg-white rounded-[32px] shadow-sm border border-slate-200/60 overflow-hidden flex flex-col h-full sticky top-8">
                        <div className="p-8 pb-6 border-b border-slate-50">
                            <div className="flex items-center justify-between mb-6">
                                <Title level={4} style={{ margin: 0, fontWeight: 900, fontSize: '24px', letterSpacing: '-0.5px' }}>Học viên</Title>
                                <div className="p-2.5 bg-purple-50 rounded-2xl text-purple-600">
                                    <Users size={20} />
                                </div>
                            </div>
                            <Input.Search
                                placeholder="Tìm tên hoặc email..."
                                className="premium-search rounded-2xl"
                                size="large"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3 max-h-[calc(100vh-280px)] custom-scrollbar">
                            {loading && students.length === 0 ? (
                                <div className="p-10 text-center"><Star className="animate-spin text-purple-200 inline" size={32} /></div>
                            ) : (
                                (students || []).map(student => {
                                    const isSelected = selectedStudent?.id === student.id;
                                    const hasUnread = student.unreadCount && student.unreadCount > 0;
                                    return (
                                        <motion.div
                                            key={student.id}
                                            whileHover={{ x: 6 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleSelectStudent(student)}
                                            className={`relative flex items-center gap-4 p-5 rounded-3xl cursor-pointer transition-all duration-300 ${isSelected ? 'bg-purple-50/80 shadow-md shadow-purple-100/50' : 'hover:bg-slate-50'}`}
                                        >
                                            {isSelected && (
                                                <div className="absolute left-0 top-1/3 bottom-1/3 w-1.5 bg-purple-600 rounded-r-full" />
                                            )}

                                            <div className="relative">
                                                <Avatar size={56} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.fullName}`} className="border-2 border-white shadow-md" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className={`font-black truncate ${hasUnread ? 'text-slate-900' : 'text-slate-700'}`}>{student.fullName}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold whitespace-nowrap ml-2 uppercase">
                                                        {formatTime(student.lastMessageAt)}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <div className={`text-xs truncate ${hasUnread ? 'text-purple-600 font-black' : 'text-slate-400 font-medium'}`}>
                                                        {student.lastMessage || 'Bắt đầu cuộc trò chuyện'}
                                                    </div>
                                                    {hasUnread && (
                                                        <Badge count={student.unreadCount} className="ml-2" />
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* --- Main Content Area --- */}
                <div className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">
                        {!selectedStudent ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                className="h-full min-h-[800px] flex flex-col items-center justify-center bg-white rounded-[40px] border border-slate-200/60 shadow-sm p-12 text-center"
                            >
                                <div className="relative mb-10">
                                    <div className="absolute inset-0 bg-purple-200 blur-3xl opacity-20 rounded-full scale-150 animate-pulse" />
                                    <div className="relative w-48 h-48 bg-gradient-to-br from-purple-50 to-orange-50 rounded-[56px] flex items-center justify-center shadow-inner">
                                        <MessageCircleMore size={90} className="text-purple-500 opacity-60" />
                                    </div>
                                </div>
                                <Title level={2} style={{ fontWeight: 900, fontSize: '32px', marginBottom: '16px' }}>Kết nối để phát triển</Title>
                                <Paragraph className="text-slate-400 text-lg max-w-md mx-auto font-medium">Chọn một học viên từ danh sách bên trái để bắt đầu thảo luận và gửi những nhận xét quý báu giúp họ cải thiện kỹ năng.</Paragraph>
                            </motion.div>
                        ) : (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                {/* Student Header Card */}
                                <Card className="rounded-[32px] border-none shadow-xl shadow-slate-200/30 overflow-hidden bg-gradient-to-r from-white to-purple-50/30">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className="relative p-1 bg-white rounded-full shadow-lg">
                                                <Avatar size={80} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedStudent.fullName}`} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <Title level={3} style={{ margin: 0, fontWeight: 900, letterSpacing: '-0.5px' }}>{selectedStudent.fullName}</Title>
                                                    <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px] font-black uppercase">Level {selectedStudent.level || 'A1'}</div>
                                                </div>
                                                <Text className="text-slate-400 font-medium">{selectedStudent.email}</Text>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <Button icon={<LayoutDashboard size={18} />} className="rounded-2xl h-12 px-6 font-bold flex items-center gap-2 border-purple-100 text-purple-600">BÁO CÁO</Button>
                                        </div>
                                    </div>
                                </Card>

                                {/* Tabs Area */}
                                <div className="bg-white rounded-[40px] shadow-sm border border-slate-200/60 p-8 min-h-[700px]">
                                    <Tabs
                                        defaultActiveKey="chat"
                                        className="premium-tabs-v2"
                                        items={[
                                            {
                                                key: 'chat',
                                                label: (<span className="flex items-center gap-2 font-black py-4"><MessageCircle size={20} /> THẢO LUẬN</span>),
                                                children: (
                                                    <div className="flex flex-col h-[600px] pt-6 gap-6">
                                                        <div className="flex-1 overflow-y-auto px-6 space-y-6 custom-scrollbar">
                                                            {chatLoading && messages.length === 0 ? (
                                                                <div className="h-full flex items-center justify-center"><Star className="animate-spin text-purple-300" size={48} /></div>
                                                            ) : messages.length === 0 ? (
                                                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có tin nhắn nào. Hãy chủ động kết nối!" className="mt-20" />
                                                            ) : (
                                                                messages.map((msg) => {
                                                                    const isHọcSinh = msg.senderId === selectedStudent.id;
                                                                    return (
                                                                        <div key={msg.id || msg.timestamp} className={`flex ${isHọcSinh ? 'justify-start' : 'justify-end'}`}>
                                                                            <div className={`max-w-[75%] rounded-[28px] p-5 shadow-sm ${isHọcSinh ? 'bg-slate-100 border-none rounded-bl-none text-slate-800' : 'bg-gradient-to-br from-purple-600 to-orange-600 text-white rounded-br-none'}`}>
                                                                                <div className="font-semibold text-[15px] leading-relaxed italic">"{msg.content}"</div>
                                                                                <div className={`text-[9px] mt-2 text-right opacity-70 font-black uppercase tracking-tighter`}>
                                                                                    {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })
                                                            )}
                                                            <div ref={chatEndRef} />
                                                        </div>

                                                        {/* Input Area */}
                                                        <div className="px-6 py-4 bg-slate-50/80 rounded-[32px] flex items-center gap-4 border border-slate-100/50 backdrop-blur-sm">
                                                            <Input
                                                                placeholder="Nhập nội dung tư vấn..."
                                                                className="flex-1 h-14 rounded-2xl border-none shadow-none bg-transparent font-medium text-lg placeholder:text-slate-300"
                                                                value={messageInput}
                                                                onChange={e => setMessageInput(e.target.value)}
                                                                onPressEnter={handleSendMessage}
                                                            />
                                                            <Button
                                                                type="primary"
                                                                className="h-14 px-8 rounded-2xl flex items-center justify-center bg-gradient-to-r from-purple-600 to-orange-600 border-none shadow-xl shadow-purple-200/50 hover:scale-105 transition-transform"
                                                                icon={<Send size={20} />}
                                                                onClick={handleSendMessage}
                                                                disabled={!messageInput.trim()}
                                                            >
                                                                GỬI
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )
                                            },
                                            {
                                                key: 'feedback',
                                                label: (<span className="flex items-center gap-2 font-black py-4"><History size={20} /> LỊCH SỬ LUYỆN TẬP</span>),
                                                children: (
                                                    <div className="space-y-10 pt-6 px-2">
                                                        {/* Overall feedbacks summary box */}
                                                        {overallFeedbacks.length > 0 && (
                                                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-[32px] p-8 border border-amber-100/50 shadow-sm">
                                                                <div className="flex items-center gap-3 mb-6">
                                                                    <div className="p-2 bg-white rounded-xl shadow-sm text-amber-500"><Star size={20} fill="currentColor" /></div>
                                                                    <Title level={4} style={{ margin: 0, fontWeight: 900, color: '#92400e' }}>Nhận xét tổng thể ({overallFeedbacks.length})</Title>
                                                                </div>
                                                                <div className="space-y-4">
                                                                    {overallFeedbacks.map((f) => (
                                                                        <div key={f.id} className="bg-white/60 p-5 rounded-2xl border border-white/80 shadow-inner">
                                                                            <Paragraph className="m-0 text-amber-900 font-bold italic">"{f.comment}"</Paragraph>
                                                                            <div className="mt-3 flex justify-between items-center text-[10px] text-amber-700/50 font-black uppercase">
                                                                                <span>By {f.educatorName}</span>
                                                                                <span>{new Date(f.createdAt).toLocaleDateString()}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {attemptsLoading ? (
                                                            <div className="py-24 text-center"><Sparkles className="animate-bounce text-purple-400 inline" size={48} /></div>
                                                        ) : attempts.length === 0 ? (
                                                            <Empty description="Chưa có lịch sử phát âm" className="mt-20" />
                                                        ) : (
                                                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                                                {(attempts || []).map((attempt, idx) => {
                                                                    const educatorComment = feedbacks.find(f => f.attemptId === attempt.id);
                                                                    return (
                                                                        <motion.div key={attempt.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                                                                            <Card className="rounded-[36px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 bg-white group">
                                                                                <div className="flex justify-between items-center mb-6">
                                                                                    <div className="flex items-center gap-4">
                                                                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black shadow-lg transition-transform group-hover:scale-110 duration-300`} style={{ backgroundColor: getScoreColor(attempt.geminiScore) }}>
                                                                                            <span className="text-xl">{attempt.geminiScore}</span>
                                                                                        </div>
                                                                                        <div>
                                                                                            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{new Date(attempt.createdAt).toLocaleDateString()}</div>
                                                                                            <Text className="text-[11px] font-bold text-slate-400">{new Date(attempt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                                                                        </div>
                                                                                    </div>
                                                                                    <Tooltip title="Nhận xét chi tiết">
                                                                                        <Button shape="circle" icon={<MessageSquare size={20} />} className="text-purple-600 bg-purple-50 border-none hover:bg-purple-600 hover:text-white transition-all w-12 h-12" onClick={() => { setSelectedAttempt(attempt); setFeedbackModalVisible(true); }} />
                                                                                    </Tooltip>
                                                                                </div>

                                                                                <div className="space-y-6">
                                                                                    <div className="text-xl font-black text-slate-800 leading-tight">"{attempt.targetText}"</div>

                                                                                    <div className="bg-slate-50/80 p-5 rounded-3xl border border-slate-100/50 shadow-inner group-hover:bg-white transition-colors">
                                                                                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                                            <AudioLines size={14} /> Phát âm thực tế
                                                                                        </div>
                                                                                        <div className="text-lg font-bold leading-relaxed">
                                                                                            {highlightErrors(attempt.targetText, attempt.asrTranscription)}
                                                                                        </div>
                                                                                    </div>

                                                                                    {attempt.audioUrl && (
                                                                                        <div className="bg-gradient-to-r from-slate-100/50 to-purple-50/30 p-3 rounded-2xl flex items-center gap-4">
                                                                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-purple-500"><AudioLines size={16} /></div>
                                                                                            <audio controls className="h-4 flex-1 custom-audio-player" src={attempt.audioUrl} />
                                                                                        </div>
                                                                                    )}

                                                                                    {/* AI Phân tích */}
                                                                                    <div className="bg-[#fdfaff] p-6 rounded-[28px] border border-purple-50">
                                                                                        <div className="flex items-center gap-2 mb-3">
                                                                                            <Bot size={18} className="text-purple-500" />
                                                                                            <Text className="text-[10px] font-black text-purple-800 uppercase tracking-widest">AI Insights</Text>
                                                                                        </div>
                                                                                        <Paragraph className="text-[13px] text-slate-600 font-medium leading-relaxed m-0 italic">"{attempt.geminiFeedback}"</Paragraph>
                                                                                    </div>

                                                                                    {/* Educator Feedback section */}
                                                                                    {educatorComment && (
                                                                                        <div className="bg-purple-50/50 p-6 rounded-[28px] border border-purple-100/50 border-dashed">
                                                                                            <div className="flex items-center gap-2 mb-3">
                                                                                                <Star size={16} className="text-orange-500" fill="currentColor" />
                                                                                                <Text className="text-[10px] font-black text-purple-800 uppercase tracking-widest">Nhận xét của bạn</Text>
                                                                                            </div>
                                                                                            <Paragraph className="text-[13px] text-purple-900 font-bold m-0">{educatorComment.comment}</Paragraph>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </Card>
                                                                        </motion.div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            }
                                        ]}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Modal Gửi Nhận Xét */}
            <Modal
                title={null} open={feedbackModalVisible}
                onCancel={() => { setFeedbackModalVisible(false); setSelectedAttempt(null); }}
                footer={null} centered width={650}
                className="premium-modal"
            >
                <div className="rounded-[40px] overflow-hidden">
                    <div className="bg-gradient-to-br from-purple-700 to-orange-700 p-10 text-white relative">
                        <div className="absolute top-0 right-0 p-10 opacity-10"><MessageSquare size={120} /></div>
                        <Title level={2} style={{ color: 'white', margin: 0, fontWeight: 900, letterSpacing: '-1px' }}>Nhận xét chuyên môn</Title>
                        <Text className="text-purple-200 font-medium text-lg">Định hướng thực hành cho {selectedStudent?.fullName}</Text>
                    </div>
                    <div className="p-10 space-y-8 bg-white">
                        {selectedAttempt ? (
                            <div className="p-6 bg-slate-50 rounded-3xl space-y-3 border border-slate-100">
                                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-block">Câu luyện tập</Text>
                                <div className="text-2xl font-black text-purple-950 leading-tight">"{selectedAttempt.targetText}"</div>
                                <div className="flex items-center gap-4 pt-2">
                                    <div className="px-4 py-1.5 bg-white rounded-full border border-purple-50 shadow-sm text-xs font-black text-purple-600">{selectedAttempt.geminiScore} Điểm AI</div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-center gap-4">
                                <Star className="text-amber-500" />
                                <Text className="font-bold text-amber-900">Đây là nhận xét tổng quát cho toàn bộ quá trình của học viên.</Text>
                            </div>
                        )}

                        <div className="space-y-4">
                            <Text className="text-sm font-black text-slate-700 uppercase ml-2">Nội dung tư vấn</Text>
                            <TextArea
                                placeholder="Ví dụ: Bạn cần chú ý bật âm đuôi /t/ ở cuối câu, đồng thời kéo dài nguyên âm đôi /eɪ/..."
                                rows={6}
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                className="rounded-[28px] p-6 text-lg font-medium border-slate-200 bg-slate-50/30 focus:bg-white transition-all shadow-inner"
                            />
                        </div>

                        <Button
                            type="primary"
                            block
                            size="large"
                            className="rounded-[28px] h-20 font-black text-xl shadow-2xl shadow-purple-200 bg-gradient-to-r from-purple-600 to-orange-600 border-none flex items-center justify-center gap-4 hover:scale-105 transition-transform"
                            onClick={handleSendFeedback}
                        >
                            <Send size={28} /> GỬI NHẬN XÉT
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default InteractionsPage;
