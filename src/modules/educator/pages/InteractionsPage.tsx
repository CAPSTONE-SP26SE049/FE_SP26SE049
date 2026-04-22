import { useState, useEffect, useRef } from 'react';
import { Card, Button, Modal, Input, message, Typography, Avatar, Empty, Tooltip, Tabs, Badge, Tag } from 'antd';
import { MessageSquare, Star, Send, Users, AudioLines, MessageCircle, History, Bot, Sparkles, MessageCircleMore, LayoutDashboard, User } from 'lucide-react';
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
    const [searchText, setSearchText] = useState('');

    // Chat states
    const [messages, setMessages] = useState<any[]>([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Avatar state management
    const [avatarErrors, setAvatarErrors] = useState<Record<string, boolean>>({});

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
            if (selectedStudent) fetchAttempts(selectedStudent.id);
        } catch (error) {
            message.error('Gửi nhận xét thất bại');
        }
    };

    const filteredStudents = students.filter(s =>
        s.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchText.toLowerCase())
    );

    const formatTimeShort = (time: any) => {
        if (!time) return '';
        const date = new Date(time);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const highlightErrors = (original: string, asr: string) => {
        const cleanOriginal = original || '';
        const cleanAsr = asr || '';
        const oWords = cleanOriginal.split(' ');
        const aWords = cleanAsr.split(' ');

        return oWords.map((word, i) => {
            const isWrong = aWords[i]?.toLowerCase().replace(/[.,!?;:]/g, '') !== word.toLowerCase().replace(/[.,!?;:]/g, '');
            return (
                <span key={i} className={`${isWrong ? 'text-rose-500 font-bold underline decoration-rose-300 underline-offset-2' : 'text-slate-700'} mr-1`}>
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

    const getStudentAvatar = (student: StudentAccount) => {
        if (avatarErrors[student.id]) {
            return `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.fullName || student.id}`;
        }
        return student.avatar_url || student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.fullName || student.id}`;
    };

    const overallFeedbacks = feedbacks.filter(f => !f.attemptId);

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-4 overflow-hidden -mt-2">
            {/* --- Student Sidebar --- */}
            <div className="w-full lg:w-[320px] flex-shrink-0 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 pb-3">
                    <div className="flex items-center justify-between mb-4">
                        <Title level={5} className="!m-0 !font-black !text-gray-800 tracking-tight text-sm uppercase">Học viên</Title>
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                            <Users size={16} />
                        </div>
                    </div>
                    <Input.Search
                        placeholder="Tìm tên..."
                        className="rounded-xl border border-slate-100 font-semibold"
                        size="middle"
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
                    {loading && students.length === 0 ? (
                        <div className="p-10 text-center"><Star className="animate-spin text-purple-200 inline" size={24} /></div>
                    ) : (
                        (filteredStudents || []).map(student => {
                            const isSelected = selectedStudent?.id === student.id;
                            const hasUnread = student.unreadCount && student.unreadCount > 0;
                            return (
                                <motion.div
                                    key={student.id}
                                    whileHover={{ x: 3 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleSelectStudent(student)}
                                    className={`relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-purple-50 shadow-sm' : 'hover:bg-slate-50'}`}
                                >
                                    <Avatar
                                        size={40}
                                        src={getStudentAvatar(student)}
                                        onError={() => setAvatarErrors(prev => ({ ...prev, [student.id]: true }))}
                                        className="border border-white shadow-sm bg-slate-100"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div className={`text-xs font-bold truncate ${hasUnread ? 'text-slate-900' : 'text-slate-700'}`}>{student.fullName}</div>
                                            <div className="text-[8px] text-slate-400 font-bold ml-1 uppercase">
                                                {formatTimeShort(student.lastMessageAt)}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className={`text-[10px] truncate ${hasUnread ? 'text-purple-600 font-black' : 'text-slate-400 font-medium'}`}>
                                                {student.lastMessage || 'Bắt đầu cuộc trò chuyện'}
                                            </div>
                                            {hasUnread && (
                                                <Badge count={student.unreadCount} size="small" />
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* --- Main Content Area --- */}
            <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
                <AnimatePresence mode="wait">
                    {!selectedStudent ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="h-full flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center"
                        >
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-purple-200 blur-3xl opacity-10 rounded-full scale-150 animate-pulse" />
                                <div className="relative w-32 h-32 bg-gradient-to-br from-purple-50 to-orange-50 rounded-3xl flex items-center justify-center shadow-inner">
                                    <MessageCircleMore size={60} className="text-purple-500 opacity-60" />
                                </div>
                            </div>
                            <Title level={4} className="!font-black text-gray-800 mb-2">Kết nối để phát triển</Title>
                            <Paragraph className="text-slate-400 text-sm max-w-xs mx-auto font-medium">Chọn một học viên từ danh sách bên trái để bắt đầu thảo luận và gửi những nhận xét quý báu giúp họ cải thiện kỹ năng.</Paragraph>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={selectedStudent.id}
                            initial={{ opacity: 0, scale: 0.99 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col h-full gap-4 overflow-hidden"
                        >
                            {/* Student Header Card */}
                            <Card className="rounded-2xl border-none shadow-sm overflow-hidden bg-gradient-to-r from-white to-purple-50/20" bodyStyle={{ padding: '12px 20px' }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="relative p-0.5 bg-white rounded-full shadow-sm">
                                            <Avatar
                                                size={48}
                                                src={getStudentAvatar(selectedStudent)}
                                                onError={() => setAvatarErrors(prev => ({ ...prev, [selectedStudent.id]: true }))}
                                                className="bg-slate-100"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <Title level={5} className="!m-0 !font-black !text-gray-800 tracking-tight">{selectedStudent.fullName}</Title>
                                                <Tag color="purple" className="rounded-full text-[9px] font-black uppercase border-none px-2 h-4 flex items-center m-0">Level {selectedStudent.level || 'A1'}</Tag>
                                            </div>
                                            <Text className="text-[10px] text-gray-400 font-bold">{selectedStudent.email}</Text>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="small" icon={<LayoutDashboard size={14} />} className="rounded-lg font-black flex items-center gap-1.5 border-purple-100 text-purple-600 text-[10px] uppercase h-8 px-3">BÁO CÁO</Button>
                                    </div>
                                </div>
                            </Card>

                            {/* Tabs Area */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-0 flex-1 overflow-hidden flex flex-col">
                                <Tabs
                                    defaultActiveKey="chat"
                                    className="premium-tabs-compact flex-1 flex flex-col"
                                    items={[
                                        {
                                            key: 'chat',
                                            label: (<span className="flex items-center gap-2 font-black px-6 py-3 text-[10px] uppercase tracking-wider"><MessageCircle size={14} /> THẢO LUẬN</span>),
                                            children: (
                                                <div className="flex flex-col h-full bg-slate-50/30">
                                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                                        {chatLoading && messages.length === 0 ? (
                                                            <div className="h-full flex items-center justify-center"><Star className="animate-spin text-purple-300" size={32} /></div>
                                                        ) : messages.length === 0 ? (
                                                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có tin nhắn nào." className="mt-10" />
                                                        ) : (
                                                            messages.map((msg: any) => {
                                                                const isStudent = msg.senderId === selectedStudent.id;
                                                                return (
                                                                    <div key={msg.id || msg.timestamp} className={`flex ${isStudent ? 'justify-start' : 'justify-end'}`}>
                                                                        <div className={`max-w-[75%] rounded-2xl p-3 shadow-sm ${isStudent ? 'bg-white border text-slate-700 rounded-bl-none' : 'bg-purple-600 text-white rounded-br-none'}`}>
                                                                            <div className="font-bold text-xs leading-relaxed italic">"{msg.content}"</div>
                                                                            <div className={`text-[8px] mt-1 text-right opacity-60 font-black uppercase`}>
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
                                                    <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
                                                        <Input
                                                            placeholder="Nhập nội dung tư vấn..."
                                                            className="flex-1 h-9 rounded-lg border border-slate-100 bg-slate-50 font-bold text-xs"
                                                            value={messageInput}
                                                            onChange={e => setMessageInput(e.target.value)}
                                                            onPressEnter={handleSendMessage}
                                                        />
                                                        <Button
                                                            type="primary"
                                                            className="h-9 px-4 rounded-lg font-black bg-purple-600 border-none shadow-sm flex items-center gap-2 text-[10px] uppercase"
                                                            icon={<Send size={12} />}
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
                                            label: (<span className="flex items-center gap-2 font-black px-6 py-3 text-[10px] uppercase tracking-wider"><History size={14} /> LỊCH SỬ</span>),
                                            children: (
                                                <div className="h-full overflow-y-auto p-4 space-y-4 bg-slate-50/30 custom-scrollbar">
                                                    {overallFeedbacks.length > 0 && (
                                                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 shadow-sm mb-4">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <Star size={14} fill="currentColor" className="text-amber-500" />
                                                                <Title level={5} className="!m-0 !font-black !text-amber-800 !text-xs uppercase">Nhận xét tổng thể ({overallFeedbacks.length})</Title>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {overallFeedbacks.map((f) => (
                                                                    <div key={f.id} className="bg-white/70 p-3 rounded-lg border border-white/80">
                                                                        <Paragraph className="m-0 text-amber-900 font-bold italic text-[11px]">"{f.comment}"</Paragraph>
                                                                        <div className="mt-1 flex justify-between items-center text-[7px] text-amber-700/50 font-black uppercase">
                                                                            <span>By {f.educatorName}</span>
                                                                            <span>{new Date(f.createdAt).toLocaleDateString()}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {attemptsLoading ? (
                                                        <div className="py-20 text-center"><Sparkles className="animate-bounce text-purple-400 inline" size={24} /></div>
                                                    ) : attempts.length === 0 ? (
                                                        <Empty description="Chưa có lịch sử phát âm" className="mt-10" />
                                                    ) : (
                                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                                            {(attempts || []).map((attempt, idx) => {
                                                                const educatorComment = feedbacks.find(f => f.attemptId === attempt.id);
                                                                const score = attempt.geminiScore || attempt.groqScore || 0;
                                                                const feedbackText = attempt.geminiFeedback || attempt.groqFeedback || "";

                                                                return (
                                                                    <motion.div key={attempt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                                                                        <Card className="rounded-xl border border-slate-200 shadow-none hover:shadow-sm transition-all duration-300 bg-white group" bodyStyle={{ padding: '12px' }}>
                                                                            <div className="flex justify-between items-center mb-2">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-black shadow-sm text-xs`} style={{ backgroundColor: getScoreColor(score) }}>
                                                                                        {score}
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="text-[7px] font-black text-slate-300 uppercase tracking-widest">{new Date(attempt.createdAt).toLocaleDateString()}</div>
                                                                                        <Text className="text-[9px] font-bold text-slate-400">{new Date(attempt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                                                                    </div>
                                                                                </div>
                                                                                <Tooltip title="Nhận xét">
                                                                                    <Button shape="circle" size="small" icon={<MessageSquare size={12} />} className="text-purple-600 bg-purple-50 border-none hover:bg-purple-600 hover:text-white transition-all" onClick={() => { setSelectedAttempt(attempt); setFeedbackModalVisible(true); }} />
                                                                                </Tooltip>
                                                                            </div>

                                                                            <div className="space-y-2">
                                                                                <div className="text-[11px] font-black text-slate-800 leading-tight line-clamp-1">"{attempt.targetText}"</div>
                                                                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 overflow-hidden text-[10px] font-bold leading-relaxed">
                                                                                    {highlightErrors(attempt.targetText, attempt.asrTranscription)}
                                                                                </div>

                                                                                {/* AI Insights Compact */}
                                                                                <div className="flex items-start gap-1.5 p-1.5 bg-purple-50/30 rounded-lg border border-purple-50/50">
                                                                                    <Bot size={12} className="text-purple-400 flex-shrink-0 mt-0.5" />
                                                                                    <Paragraph className="text-[9px] text-slate-500 font-bold leading-tight m-0 italic line-clamp-1">"{feedbackText}"</Paragraph>
                                                                                </div>

                                                                                {educatorComment && (
                                                                                    <div className="p-1.5 bg-orange-50/30 rounded-lg border border-orange-100/50 border-dashed">
                                                                                        <Paragraph className="text-[10px] text-purple-900 font-black m-0 line-clamp-1 italic">"{educatorComment.comment}"</Paragraph>
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

            {/* Modal Gửi Nhận Xét */}
            <Modal
                title={null}
                open={feedbackModalVisible}
                onCancel={() => { setFeedbackModalVisible(false); setSelectedAttempt(null); }}
                footer={null}
                centered
                width={450}
                className="premium-modal-compact"
                bodyStyle={{ padding: 0 }}
            >
                <div className="overflow-hidden rounded-2xl">
                    <div className="bg-gradient-to-br from-purple-700 to-indigo-800 p-6 text-white">
                        <Title level={5} className="!text-white !m-0 !font-black !text-sm uppercase tracking-widest">Gửi nhận xét giáo viên</Title>
                    </div>
                    <div className="p-6 space-y-4">
                        {selectedAttempt ? (
                            <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                                <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Mục tiêu luyện tập</Text>
                                <div className="text-sm font-bold text-slate-700 italic">"{selectedAttempt.targetText}"</div>
                                <div className="flex items-center gap-2 pt-1">
                                    <div className="px-3 py-1 bg-white rounded-full border border-purple-50 shadow-sm text-[10px] font-black text-purple-600">
                                        {selectedAttempt.geminiScore || selectedAttempt.groqScore} Điểm AI
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-2">
                                <Star className="text-amber-500" size={14} />
                                <Text className="font-bold text-amber-800 text-[10px]">Nhận xét định hướng học tập dài hạn.</Text>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Text className="text-[9px] font-black text-slate-700 uppercase tracking-wide">Lời khuyên của chuyên gia</Text>
                            <TextArea
                                placeholder="Nhập nhận xét chi tiết giúp học viên tiến bộ..."
                                rows={4}
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                className="rounded-xl p-3 text-xs bg-slate-50 border-slate-200 focus:bg-white transition-all font-bold"
                            />
                        </div>

                        <Button
                            type="primary"
                            block
                            size="middle"
                            className="rounded-xl h-10 font-black shadow-lg bg-gradient-to-r from-purple-600 to-indigo-600 border-none text-[11px] uppercase tracking-widest"
                            onClick={handleSendFeedback}
                            disabled={!comment.trim()}
                        >
                            XÁC NHẬN GỬI
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default InteractionsPage;
