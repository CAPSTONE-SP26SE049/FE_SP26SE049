import { useState, useEffect, useRef, useMemo } from 'react';
import { Avatar, message, Modal, Skeleton } from 'antd';
import { Search, MessageSquare, Star, Send, Users as UsersIcon, MessageCircle, History, Sparkles, MessageCircleMore, Bot, ChevronRight, Zap, X } from 'lucide-react';
import { educatorService, type StudentAccount } from '../services/educatorService';
import { feedbackService, type SpeakingAttempt, type Feedback } from '../services/feedbackService';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

// Interaction Area
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
    const [activeTab, setActiveTab] = useState<'chat' | 'feedback'>('chat');

    const [messages, setMessages] = useState<any[]>([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [avatarErrors, setAvatarErrors] = useState<Record<string, boolean>>({});
    const [expandedAttempts, setExpandedAttempts] = useState<Record<string, boolean>>({});

    const toggleExpandAttempt = (id: string) => {
        setExpandedAttempts(prev => ({ ...prev, [id]: !prev[id] }));
    };


    const getAvatarUrl = (s: any) => {
        if (!s) return '';
        if (avatarErrors[s.id]) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.fullName || s.id}`;
        return s.avatar_url || s.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.fullName || s.id}`;
    };

    const overallFeedbacks = useMemo(() => feedbacks.filter(f => !f.attemptId), [feedbacks]);

    useEffect(() => {
        fetchStudents();
        const interval = setInterval(fetchStudents, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await educatorService.getStudentAccounts();
            const studentData = Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []);
            setStudents(studentData.filter((u: any) => (u.roleCode || '').toUpperCase() !== 'ADMIN'));

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
        setExpandedAttempts({});
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

    const filteredStudents = (students || []).filter(s =>
        s.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchText.toLowerCase())
    );

    const highlightErrors = (original: string, asr: string, maxWords?: number) => {
        const oWords = (original || '').split(' ');
        const aWords = (asr || '').split(' ');
        const limit = maxWords && oWords.length > maxWords ? maxWords : oWords.length;
        const slicedWords = oWords.slice(0, limit);
        
        const rendered = slicedWords.map((word, i) => {
            const isWrong = aWords[i]?.toLowerCase().replace(/[.,!?;:]/g, '') !== word.toLowerCase().replace(/[.,!?;:]/g, '');
            return (
                <span key={i} className={clsx(isWrong ? 'text-rose-500 font-black underline underline-offset-2' : 'text-slate-700', 'mr-1', 'break-words')}>
                    {word}
                </span>
            );
        });

        if (maxWords && oWords.length > maxWords) {
            rendered.push(<span key="dots" className="text-slate-400 font-bold">...</span>);
        }

        return rendered;
    };

    const formatTargetText = (text: string, maxWords?: number) => {
        const words = (text || '').split(' ');
        if (maxWords && words.length > maxWords) {
            return words.slice(0, maxWords).join(' ') + '...';
        }
        return text;
    };

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-6 overflow-hidden -mt-2">
            {/* Sidebar Section */}
            <aside className="w-full lg:w-[320px] flex flex-col bg-white rounded-[2rem] border-[3px] border-slate-900 shadow-[6px_6px_0_#1f2937] overflow-hidden">
                <div className="p-5 border-b-[3px] border-slate-900/5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Hội thoại</h3>
                        <UsersIcon size={18} className="text-[#49B6E5]" strokeWidth={3} />
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} strokeWidth={3} />
                        <input
                            type="text"
                            placeholder="Tìm học viên..."
                            className="w-full h-10 pl-9 pr-4 rounded-xl border-[2px] border-slate-900 bg-slate-50 font-black text-[10px] uppercase tracking-wider focus:outline-none focus:ring-4 focus:ring-[#49B6E5]/10"
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-slate-50/30">
                    {loading && students.length === 0 ? (
                        [...Array(6)].map((_, i) => <div key={i} className="p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-sm"><Skeleton active avatar paragraph={{ rows: 1 }} title={false} /></div>)
                    ) : filteredStudents.map(student => {
                        const isSelected = selectedStudent?.id === student.id;
                        const hasUnread = (student as any).unreadCount && (student as any).unreadCount > 0;
                        return (
                            <motion.div
                                key={student.id}
                                whileHover={{ scale: 1.02, x: 4 }}
                                onClick={() => handleSelectStudent(student)}
                                className={clsx(
                                    "group relative flex items-center gap-3 p-3 rounded-2xl cursor-pointer border-[2.5px] transition-all",
                                    isSelected
                                        ? "bg-white border-slate-900 shadow-[4px_4px_0_#1f2937] z-10"
                                        : "bg-white/50 border-transparent hover:border-slate-900/10 hover:bg-white text-slate-500"
                                )}
                            >
                                <div className="relative flex-shrink-0">
                                    <Avatar
                                        size={40}
                                        src={getAvatarUrl(student)}
                                        onError={() => { setAvatarErrors(prev => ({ ...prev, [student.id]: true })); return true; }}
                                        className="border-[2px] border-slate-900 shadow-[2px_2px_0_#00000010] bg-slate-100"
                                    />
                                    {hasUnread && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-[2px] border-white shadow-sm animate-pulse" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <div className={clsx("text-[11px] font-black uppercase truncate", isSelected ? "text-[#49B6E5]" : (hasUnread ? "text-slate-900" : "text-slate-600"))}>
                                            {student.fullName}
                                        </div>
                                    </div>
                                    <div className={clsx("text-[9px] truncate mt-1", hasUnread ? "text-slate-900 font-bold" : "text-slate-400 font-medium")}>
                                        {student.lastMessage || 'Chưa có tin nhắn'}
                                    </div>
                                </div>
                                {isSelected && <ChevronRight size={14} className="text-[#49B6E5]" strokeWidth={3} />}
                            </motion.div>
                        );
                    })}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden">
                <AnimatePresence mode="wait">
                    {!selectedStudent ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="h-full flex flex-col items-center justify-center bg-white rounded-[2.5rem] border-[3px] border-slate-900 shadow-[10px_10px_0_#1f2937] p-10 text-center"
                        >
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-[#49B6E5] blur-3xl opacity-10 rounded-full scale-150 animate-pulse" />
                                <div className="relative w-28 h-28 bg-blue-50 rounded-[2rem] border-[3px] border-dashed border-slate-300 flex items-center justify-center">
                                    <MessageCircleMore size={56} className="text-slate-300" strokeWidth={1.5} />
                                </div>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-3">Hỗ trợ & Kết nối</h2>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest max-w-sm leading-relaxed">
                                Chọn một học viên để bắt đầu hành trình <span className="text-[#49B6E5]">thay đổi kỹ năng phát âm</span> của họ ngay hôm nay.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={selectedStudent.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col h-full gap-4 overflow-hidden"
                        >
                            {/* Student Info Bar */}
                            <header className="flex items-center justify-between p-4 bg-white rounded-2xl border-[3px] border-slate-900 shadow-[4px_4px_0_#1f2937]">
                                <div className="flex items-center gap-4">
                                    <Avatar
                                        size={48}
                                        src={getAvatarUrl(selectedStudent)}
                                        onError={() => { setAvatarErrors(prev => ({ ...prev, [selectedStudent.id]: true })); return true; }}
                                        className="border-[2.5px] border-slate-900 shadow-[2px_2px_0_#00000010] bg-slate-50"
                                    />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">{selectedStudent.fullName}</h2>
                                            <div className="px-3 py-1 bg-purple-100 text-purple-700 border-[2px] border-purple-900/10 rounded-xl text-[9px] font-black uppercase tracking-wider">Level {(selectedStudent as any).level || 'A1'}</div>
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400 mt-1">{selectedStudent.email}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 bg-slate-50 border-[2px] border-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-[2px_2px_0_#1f2937] hover:-translate-y-0.5 active:translate-y-0 transition-all">Lịch sử học</button>
                                    <button className="px-4 py-2 bg-[#49B6E5] border-[2px] border-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-[2px_2px_0_#1f2937] hover:-translate-y-0.5 active:translate-y-0 transition-all">Thiết kế lộ trình</button>
                                </div>
                            </header>

                            {/* Interaction Area */}
                            <div className="flex-1 bg-white rounded-[2.5rem] border-[3px] border-slate-900 shadow-[8px_8px_0_#1f2937] flex flex-col overflow-hidden">
                                {/* Custom Tabs */}
                                <div className="flex border-b-[3px] border-slate-900 bg-slate-50/50">
                                    <button
                                        onClick={() => setActiveTab('chat')}
                                        className={clsx(
                                            "flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                                            activeTab === 'chat' ? "bg-white border-r-[3px] border-slate-900 text-[#49B6E5]" : "text-slate-400 hover:text-slate-600 border-r-[3px] border-slate-900/5"
                                        )}
                                    >
                                        <MessageCircle size={14} strokeWidth={3} /> Thảo luận
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('feedback')}
                                        className={clsx(
                                            "flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                                            activeTab === 'feedback' ? "bg-white text-emerald-500" : "text-slate-400 hover:text-slate-600 border-l-[3px] border-slate-900/5 text-slate-400"
                                        )}
                                    >
                                        <History size={14} strokeWidth={3} /> Lịch sử phát âm
                                    </button>
                                </div>

                                <div className="flex-1 overflow-hidden">
                                    <AnimatePresence mode="wait">
                                        {activeTab === 'chat' ? (
                                            <motion.div
                                                key="chat"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 10 }}
                                                className="h-full flex flex-col"
                                            >
                                                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/20">
                                                    {chatLoading && messages.length === 0 ? (
                                                        <div className="h-full flex items-center justify-center text-slate-300"><Sparkles className="animate-spin" size={32} /></div>
                                                    ) : messages.length === 0 ? (
                                                        <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-40">
                                                            <Bot size={48} strokeWidth={1} className="mb-4" />
                                                            <p className="text-[10px] font-black uppercase tracking-widest">Bắt đầu cuộc trò chuyện với {selectedStudent.fullName}</p>
                                                        </div>
                                                    ) : (
                                                        messages.map((msg: any, idx) => {
                                                            const isStudent = msg.senderId === selectedStudent.id;
                                                            return (
                                                                <motion.div
                                                                    key={msg.id || idx}
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    className={clsx("flex flex-col", isStudent ? "items-start" : "items-end")}
                                                                >
                                                                    <div className={clsx(
                                                                        "max-w-[80%] px-5 py-3 rounded-2xl border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f2937] font-bold text-xs leading-relaxed",
                                                                        isStudent ? "bg-white text-slate-700 rounded-bl-none" : "bg-purple-100/30 text-slate-900 rounded-br-none"
                                                                    )}>
                                                                        {msg.content}
                                                                    </div>
                                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2 px-1">
                                                                        {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                </motion.div>
                                                            );
                                                        })
                                                    )}
                                                    <div ref={chatEndRef} />
                                                </div>

                                                <div className="p-5 border-t-[3px] border-slate-900 bg-white">
                                                    <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border-[2px] border-slate-900 shadow-inner">
                                                        <input
                                                            type="text"
                                                            placeholder="Nhập lời khuyên hoặc hướng dẫn cho học viên..."
                                                            className="flex-1 h-10 px-4 bg-transparent font-black text-[11px] uppercase tracking-wider focus:outline-none placeholder:text-slate-300"
                                                            value={messageInput}
                                                            onChange={e => setMessageInput(e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                                        />
                                                        <button
                                                            onClick={handleSendMessage}
                                                            disabled={!messageInput.trim()}
                                                            className="w-12 h-10 rounded-xl bg-[#49B6E5] border-[2px] border-slate-900 flex items-center justify-center text-white shadow-[3px_3px_0_#1f2937] hover:bg-blue-600 disabled:bg-slate-200 disabled:shadow-none disabled:border-slate-300 transition-all active:translate-y-0.5 active:shadow-sm"
                                                        >
                                                            <Send size={18} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="feedback"
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                className="h-full overflow-y-auto p-6 custom-scrollbar bg-slate-50/20 space-y-6"
                                            >
                                                {overallFeedbacks.length > 0 && (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-4 bg-amber-400 rounded-full" />
                                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">Lời khuyên định hướng ({overallFeedbacks.length})</h3>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {overallFeedbacks.map((f: any) => (
                                                                <div key={f.id} className="p-4 bg-amber-50/50 rounded-2xl border-[2px] border-slate-900 shadow-[4px_4px_0_#1f2937]">
                                                                    <p className="text-xs font-bold text-amber-900 italic leading-relaxed">"{f.comment}"</p>
                                                                    <div className="mt-3 flex justify-between items-center text-[8px] font-black uppercase text-amber-700/50">
                                                                        <span>By Teacher {f.educatorName}</span>
                                                                        <span>{new Date(f.createdAt).toLocaleDateString()}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-4 bg-purple-400 rounded-full" />
                                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">Nhật ký luyện tập chi tiết</h3>
                                                    </div>
                                                    {attemptsLoading ? (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl border-2 border-slate-100 animate-pulse" />)}
                                                        </div>
                                                    ) : attempts.length === 0 ? (
                                                        <div className="py-20 text-center opacity-30 italic font-bold text-slate-400">Học viên chưa tham gia luyện tập nào</div>
                                                    ) : (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            {attempts.map((attempt, idx) => {
                                                                const educatorComment = feedbacks.find(f => f.attemptId === attempt.id);
                                                                const score = (attempt as any).groqScore || (attempt as any).geminiScore || (attempt as any).score || 0;
                                                                const targetWords = (attempt.targetText || '').split(' ');
                                                                const isLongText = targetWords.length > 20;
                                                                const isExpanded = !!expandedAttempts[attempt.id];
                                                                return (
                                                                    <motion.div
                                                                        key={attempt.id}
                                                                        layout="position"
                                                                        initial={{ opacity: 0, y: 10 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        transition={{ delay: idx * 0.05 }}
                                                                        className="group p-5 bg-white rounded-2xl border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f2937] hover:shadow-[6px_6px_0_#1f2937] transition-all"
                                                                    >
                                                                        <div className="flex justify-between items-start mb-4">
                                                                            <div className="flex items-center gap-3">
                                                                                <div
                                                                                    className="w-10 h-10 rounded-xl border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937] flex items-center justify-center text-white font-black text-sm"
                                                                                    style={{ backgroundColor: score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444' }}
                                                                                >
                                                                                    {score}
                                                                                </div>
                                                                                <div>
                                                                                    <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{new Date(attempt.createdAt).toLocaleDateString()}</div>
                                                                                    <div className="text-[9px] font-bold text-slate-400">{new Date(attempt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                                                </div>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => { setSelectedAttempt(attempt); setFeedbackModalVisible(true); }}
                                                                                className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 border-[1.5px] border-slate-900 flex items-center justify-center hover:bg-purple-100 transition-all shadow-[2px_2px_0_#1f2937]"
                                                                            >
                                                                                <MessageSquare size={14} strokeWidth={3} />
                                                                            </button>
                                                                        </div>

                                                                        <div className="space-y-3">
                                                                            <div className="p-3 bg-slate-50 rounded-xl border-[1.5px] border-slate-900/10 transition-all duration-300">
                                                                                <div className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Mục tiêu âm đọc</div>
                                                                                <div className="text-xs font-black text-slate-800 leading-relaxed italic break-words">
                                                                                    "{isExpanded ? attempt.targetText : formatTargetText(attempt.targetText, 20)}"
                                                                                </div>
                                                                            </div>
                                                                            <div className="p-3 bg-slate-50/50 rounded-xl border-[1.5px] border-slate-900/10 transition-all duration-300">
                                                                                <div className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Thực tế học viên đọc</div>
                                                                                <div className="text-xs font-bold leading-relaxed break-words">
                                                                                    {highlightErrors(attempt.targetText, attempt.asrTranscription, isExpanded ? undefined : 20)}
                                                                                </div>
                                                                            </div>
                                                                            {isLongText && (
                                                                                <div className="flex justify-end">
                                                                                    <button
                                                                                        onClick={() => toggleExpandAttempt(attempt.id)}
                                                                                        className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-[#49B6E5] hover:text-[#38a1d0] transition-colors focus:outline-none"
                                                                                    >
                                                                                        {isExpanded ? 'Thu gọn' : 'Xem thêm'}
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                            {educatorComment && (
                                                                                <div className="p-3 bg-emerald-50/30 rounded-xl border-[1.5px] border-slate-900 border-dashed">
                                                                                    <div className="flex items-center gap-1.5 mb-1">
                                                                                        <Zap size={10} className="text-emerald-500" fill="currentColor" />
                                                                                        <span className="text-[8px] font-black text-emerald-700 uppercase tracking-widest">Lời khuyên của bạn</span>
                                                                                    </div>
                                                                                    <p className="text-xs font-black text-slate-900 italic leading-relaxed">"{educatorComment.comment}"</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </motion.div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Doodle Feedback Modal */}
            <Modal
                title={null}
                open={feedbackModalVisible}
                onCancel={() => { setFeedbackModalVisible(false); setSelectedAttempt(null); }}
                footer={null}
                centered
                width={480}
                className="doodle-modal"
                styles={{ body: { padding: 0 } }}
            >
                <div className="bg-white rounded-[2rem] border-[4px] border-slate-900 shadow-[10px_10px_0_#1f2937] overflow-hidden">
                    <header className="bg-[#8b5cf6] p-6 border-b-[4px] border-slate-900 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-white">
                            <Sparkles size={24} strokeWidth={3} />
                            <h3 className="text-lg font-black uppercase tracking-widest">Gửi lời tư vấn</h3>
                        </div>
                        <button onClick={() => setFeedbackModalVisible(false)} className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all">
                            <X size={20} strokeWidth={3} />
                        </button>
                    </header>

                    <div className="p-8 space-y-6">
                        {selectedAttempt ? (
                            <div className="p-5 bg-slate-50 rounded-2xl border-[2.5px] border-slate-900 border-dashed space-y-3 shadow-inner">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phân tích lỗi sai</div>
                                <div className="text-base font-black text-slate-800 italic leading-snug">"{selectedAttempt.targetText}"</div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border-[2px] border-slate-900 rounded-xl text-[10px] font-black text-[#49B6E5]">
                                    {(selectedAttempt as any).geminiScore || (selectedAttempt as any).groqScore || 0}% Accuracy
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-amber-50 rounded-2xl border-[2px] border-slate-900 flex items-center gap-3">
                                <Star className="text-amber-500 fill-amber-500" size={18} />
                                <span className="font-black text-amber-900 text-xs uppercase tracking-tight leading-none">Lời khuyên chiến lược dài hạn</span>
                            </div>
                        )}

                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <Bot size={16} className="text-[#49B6E5]" strokeWidth={3} /> Lời nhắn gửi đến học viên
                            </label>
                            <textarea
                                placeholder="Hãy cho học viên biết họ cần cải thiện điều gì cụ thể..."
                                rows={4}
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                className="w-full p-5 rounded-2xl border-[3px] border-slate-900 bg-slate-50 font-bold text-xs leading-relaxed focus:bg-white focus:outline-none focus:ring-8 focus:ring-[#8b5cf6]/10 transition-all placeholder:text-slate-300"
                            />
                        </div>

                        <button
                            onClick={handleSendFeedback}
                            disabled={!comment.trim()}
                            className="w-full py-4 rounded-2xl bg-[#8b5cf6] border-[3px] border-slate-900 text-white font-black text-sm uppercase tracking-[0.2em] shadow-[6px_6px_0_#1f2937] hover:-translate-y-1 hover:shadow-[10px_10px_0_#1f2937] active:translate-y-0.5 active:shadow-sm transition-all disabled:bg-slate-200 disabled:border-slate-300 disabled:shadow-none"
                        >
                            Xác nhận gửi lời nhắn
                        </button>
                    </div>
                </div>
            </Modal>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}} />
        </div>
    );
};

export default InteractionsPage;
