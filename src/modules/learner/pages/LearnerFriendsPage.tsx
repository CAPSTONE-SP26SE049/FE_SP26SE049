import React, { useState, useEffect } from 'react';
import { List, Avatar, Button, Input, message, Spin, Popconfirm, Badge } from 'antd';
import {
    UserOutlined,
    SearchOutlined,
    UserAddOutlined,
    CheckOutlined,
    CloseOutlined,
    DeleteOutlined,
    StopOutlined,
    TeamOutlined
} from '@ant-design/icons';
import apiClient from '../../../services/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export default function LearnerFriendsPage() {
    const [activeTab, setActiveTab] = useState('friends');
    const [loading, setLoading] = useState(false);

    // Data states
    const [friends, setFriends] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchPendingRequests();
        if (activeTab === 'friends') {
            fetchFriends();
        }
    }, [activeTab]);

    const fetchFriends = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/friends');
            if (res?.data) {
                setFriends(res.data);
            }
        } catch (err) {
            console.error(err);
            message.error("Lỗi khi tải danh sách bạn bè.");
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingRequests = async () => {
        try {
            const res = await apiClient.get('/friends/requests/pending');
            if (res?.data) {
                setPendingRequests(res.data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSearch = async (value: string) => {
        if (!value || value.length < 2) {
            message.warning("Vui lòng nhập ít nhất 2 ký tự.");
            return;
        }
        setLoading(true);
        try {
            const res = await apiClient.get(`/friends/search?query=${encodeURIComponent(value)}`);
            if (res?.data) {
                setSearchResults(res.data);
            }
        } catch (err) {
            console.error(err);
            message.error("Lỗi khi tìm kiếm.");
        } finally {
            setLoading(false);
        }
    };

    const handleSendRequest = async (userId: string) => {
        try {
            await apiClient.post('/friends/request', { addresseeId: userId });
            message.success("Đã gửi lời mời kết bạn.");
            setSearchResults(prev => prev.map(u => u.userId === userId ? { ...u, status: 'PENDING' } : u));
        } catch (err: any) {
            console.error(err);
            message.error(err.response?.data?.message || "Không thể gửi lời mời.");
        }
    };

    const handleAcceptRequest = async (friendshipId: string) => {
        try {
            await apiClient.put(`/friends/${friendshipId}/accept`);
            message.success("Đã đồng ý kết bạn.");
            setPendingRequests(prev => prev.filter(req => req.friendshipId !== friendshipId));
            if (activeTab === 'friends') fetchFriends();
        } catch (err) {
            console.error(err);
            message.error("Lỗi khi xử lý.");
        }
    };

    const handleDeclineRequest = async (friendshipId: string) => {
        try {
            await apiClient.put(`/friends/${friendshipId}/decline`);
            message.success("Đã từ chối lời mời.");
            setPendingRequests(prev => prev.filter(req => req.friendshipId !== friendshipId));
        } catch (err) {
            console.error(err);
            message.error("Lỗi khi xử lý.");
        }
    };

    const handleUnfriend = async (friendshipId: string) => {
        try {
            await apiClient.delete(`/friends/${friendshipId}`);
            message.success("Đã hủy kết bạn.");
            setFriends(prev => prev.filter(f => f.friendshipId !== friendshipId));
        } catch (err) {
            console.error(err);
            message.error("Lỗi khi xử lý.");
        }
    };

    const handleBlock = async (friendshipId: string) => {
        try {
            await apiClient.put(`/friends/${friendshipId}/block`);
            message.success("Đã chặn ngường dùng này.");
            setFriends(prev => prev.filter(f => f.friendshipId !== friendshipId));
        } catch (err) {
            console.error(err);
            message.error("Lỗi khi chặn người dùng.");
        }
    };

    const renderAvatar = (url: string, name: string) => (
        <Avatar src={url} icon={!url && <UserOutlined />} size={54} className="bg-white/10 text-white/80 border border-white/20 shadow-lg" />
    );

    const tabs = [
        { id: 'friends', label: `Bạn bè ${friends.length > 0 ? `(${friends.length})` : ''}` },
        { id: 'pending', label: 'Lời mời', count: pendingRequests.length },
        { id: 'search', label: 'Tìm kiếm' }
    ];

    return (
        <div className="w-full max-w-5xl mx-auto py-10 px-4">

            {/* Header Section */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center text-center mb-12">
                <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-indigo-500/40 to-purple-600/40 border border-white/20 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.3)] backdrop-blur-xl mb-6 relative group overflow-hidden">
                    <TeamOutlined className="text-white text-4xl relative z-10 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out" />
                </div>
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 italic tracking-tighter uppercase drop-shadow-2xl mb-2">
                    Cộng Đồng SpeakVN
                </h1>
                <p className="text-white/60 font-medium tracking-wide">Kết nối, giao lưu và cùng chinh phục tiếng Việt.</p>
            </motion.div>

            {/* Custom Tab Switcher */}
            <div className="flex justify-center mb-10 w-full relative z-20">
                <div className="flex gap-2 p-2 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl relative">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={clsx(
                                    "relative px-8 py-3.5 rounded-[1.5rem] font-bold text-sm tracking-wide uppercase transition-all duration-300 overflow-hidden",
                                    isActive ? "text-white" : "text-white/50 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabIndicator"
                                        className="absolute inset-0 bg-gradient-to-r from-indigo-600/80 to-purple-600/80 shadow-lg -z-10"
                                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center gap-2">
                                    {tab.label}
                                    {tab.count !== undefined && tab.count > 0 && (
                                        <Badge count={tab.count} style={{ backgroundColor: '#ef4444', color: 'white', fontWeight: 'bold' }} />
                                    )}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 min-h-[500px] shadow-2xl shadow-black/50 relative overflow-hidden"
            >
                {/* Background Ambient Glow */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />

                <Spin spinning={loading} size="large" className="custom-spin">
                    {/* 1. Friends List */}
                    {activeTab === 'friends' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {friends.length === 0 && !loading && (
                                <div className="col-span-full py-20 text-center text-white/40 italic font-medium">Bạn chưa kết nối với ai. Hãy tìm kiếm bạn bè mới!</div>
                            )}
                            {friends.map((item, index) => (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}
                                    key={item.friendshipId}
                                    className="bg-white/[0.04] border border-white/10 hover:border-indigo-500/50 hover:bg-white/[0.08] transition-all duration-300 rounded-[1.5rem] p-5 flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4">
                                        {renderAvatar(item.avatarUrl, item.fullName)}
                                        <div>
                                            <h3 className="text-white font-bold text-lg m-0 group-hover:text-indigo-300 transition-colors">{item.fullName}</h3>
                                            <p className="text-white/40 text-xs mt-1">Kết bạn: {new Date(item.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Popconfirm title="Chặn người này?" onConfirm={() => handleBlock(item.friendshipId)} okText="Chặn" cancelText="Hủy" overlayClassName="dark-popconfirm" okButtonProps={{ danger: true }}>
                                            <Button type="text" danger icon={<StopOutlined />} className="text-red-400 hover:bg-red-500/20" />
                                        </Popconfirm>
                                        <Popconfirm title="Hủy kết bạn?" onConfirm={() => handleUnfriend(item.friendshipId)} okText="Hủy" cancelText="Đóng" overlayClassName="dark-popconfirm" okButtonProps={{ danger: true }}>
                                            <Button type="text" danger icon={<DeleteOutlined />} className="text-red-400 hover:bg-red-500/20" />
                                        </Popconfirm>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* 2. Pending Requests */}
                    {activeTab === 'pending' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pendingRequests.length === 0 && !loading && (
                                <div className="col-span-full py-20 text-center text-white/40 italic font-medium">Không có lời mời kết bạn nào.</div>
                            )}
                            {pendingRequests.map((item, index) => (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}
                                    key={item.friendshipId}
                                    className="bg-indigo-500/[0.05] border border-indigo-500/20 hover:border-indigo-500/50 hover:bg-indigo-500/[0.1] transition-all duration-300 rounded-[1.5rem] p-5 flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4">
                                        {renderAvatar(item.avatarUrl, item.fullName)}
                                        <div>
                                            <h3 className="text-white font-bold text-lg m-0 group-hover:text-indigo-300 transition-colors">{item.fullName}</h3>
                                            <p className="text-white/50 text-xs mt-1 italic">Đã gửi lời mời cho bạn</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button danger shape="circle" onClick={() => handleDeclineRequest(item.friendshipId)} icon={<CloseOutlined />} className="bg-red-500/10 border-none text-red-400 hover:bg-red-500/30 hover:text-white" />
                                        <Button type="primary" shape="circle" className="bg-emerald-500 hover:bg-emerald-400 border-none text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]" onClick={() => handleAcceptRequest(item.friendshipId)} icon={<CheckOutlined />} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* 3. Search */}
                    {activeTab === 'search' && (
                        <div className="space-y-8">
                            <div className="max-w-2xl mx-auto flex gap-3">
                                <Input
                                    placeholder="Tìm kiếm qua tên hoặc email..."
                                    allowClear
                                    size="large"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onPressEnter={() => handleSearch(searchQuery)}
                                    className="bg-white/5 border-white/10 text-white placeholder-white/30 hover:border-indigo-500 focus:border-indigo-500 rounded-2xl h-14 px-6 text-lg"
                                    prefix={<SearchOutlined className="text-white/40 mr-2" />}
                                />
                                <Button
                                    type="primary"
                                    onClick={() => handleSearch(searchQuery)}
                                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 border-none rounded-2xl h-14 px-8 font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                                >
                                    Tìm theo tên
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                                {searchResults.length === 0 && !loading && searchQuery !== "" && (
                                    <div className="col-span-full py-20 text-center text-white/40 italic font-medium">Không tìm thấy kết quả phù hợp.</div>
                                )}
                                {searchResults.map((item, index) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                                        key={item.userId}
                                        className="bg-white/[0.04] border border-white/10 hover:border-white/30 hover:bg-white/[0.08] transition-all duration-300 rounded-[1.5rem] p-5 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            {renderAvatar(item.avatarUrl, item.fullName)}
                                            <div>
                                                <h3 className="text-white font-bold text-lg m-0">{item.fullName}</h3>
                                                <p className="text-white/40 text-xs mt-1">Học viên SpeakVN</p>
                                            </div>
                                        </div>
                                        <div>
                                            {(() => {
                                                const status = item.status || item.friendshipStatus;
                                                if (!status || status === 'null') {
                                                    return (
                                                        <Button type="primary" className="bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white border border-indigo-500/30 rounded-xl px-5 font-bold" onClick={() => handleSendRequest(item.userId)} icon={<UserAddOutlined />}>
                                                            Kết bạn
                                                        </Button>
                                                    );
                                                } else if (status === 'PENDING') {
                                                    return <span className="px-4 py-2 bg-yellow-500/20 text-yellow-300 font-bold text-xs rounded-xl border border-yellow-500/20">ĐÃ GỬI LỜI MỜI</span>;
                                                } else if (status === 'ACCEPTED') {
                                                    return <span className="px-4 py-2 bg-emerald-500/20 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-500/20"><CheckOutlined className="mr-1" /> BẠN BÈ</span>;
                                                } else if (status === 'BLOCKED') {
                                                    return <span className="px-4 py-2 bg-red-500/20 text-red-300 font-bold text-xs rounded-xl border border-red-500/20">ĐÃ CHẶN</span>;
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </Spin>
            </motion.div>

            {/* Custom Styles for Spin and Input */}
            <style>{`
                .custom-spin .ant-spin-dot-item { background-color: #818cf8 !important; }
                .ant-input-affix-wrapper, .ant-input { background: transparent !important; color: white !important; }
                .ant-input::placeholder { color: rgba(255,255,255,0.3) !important; }
                .dark-popconfirm .ant-popover-inner { background: #1f2937; border: 1px solid rgba(255,255,255,0.1); border-radius: 1rem; color: white; }
                .dark-popconfirm .ant-popover-message-title { color: white; }
            `}</style>
        </div>
    );
}
