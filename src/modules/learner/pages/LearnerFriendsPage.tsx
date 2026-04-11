import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Avatar, Input, Spin, Popconfirm, Tooltip, message } from 'antd';
import {
    UserOutlined,
    SearchOutlined,
    UserAddOutlined,
    CheckOutlined,
    CloseOutlined,
    DeleteOutlined,
    StopOutlined,
    TeamOutlined,
    SendOutlined,
} from '@ant-design/icons';
import apiClient, { getUnreadCounts } from '../../../services/apiClient';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from '../../../core/auth/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Users, UserPlus, Clock, UserSearch, RefreshCw, MessageCircle } from 'lucide-react';
import ChatBox from '../components/ChatBox';

/* ─── Types ─────────────────────────────────────────── */
interface Friend {
    friendshipId: string;
    userId: string;
    fullName: string;
    avatarUrl: string;
    status: string;
    createdAt: string;
}

interface SearchUser {
    userId: string;
    fullName: string;
    avatarUrl: string;
    friendshipStatus: string | null;
}

type Tab = 'friends' | 'requests' | 'sent' | 'search';

/* ─── Empty State ─────────────────────────────────────── */
const EmptyState = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-4 border border-purple-100">
            <Icon size={28} className="text-purple-300" />
        </div>
        <div className="font-bold text-gray-500 text-base">{title}</div>
        <p className="text-gray-400 text-sm mt-1 max-w-xs">{desc}</p>
    </div>
);

/* ─── Friend Card ─────────────────────────────────────── */
const FriendCard = ({
    item,
    onOpenChat,
    onUnfriend,
    onBlock,
    unreadCount,
}: {
    item: Friend;
    onOpenChat: (friend: Friend) => void;
    onUnfriend: (id: string) => void;
    onBlock: (id: string) => void;
    unreadCount?: number;
}) => (
    <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:border-purple-100 hover:shadow-sm transition-all group"
    >
        <div className="relative flex-shrink-0">
            <Avatar
                src={item.avatarUrl}
                icon={!item.avatarUrl && <UserOutlined />}
                size={48}
                className="bg-purple-100 text-purple-600 border-2 border-purple-100"
            />
            {unreadCount != null && unreadCount > 0 && (
                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold min-w-[1.25rem] h-5 px-0.5 flex items-center justify-center rounded-full border-2 border-white z-10">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white" />
        </div>
        <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-800 text-sm truncate">{item.fullName || 'Người dùng'}</div>
            <div className="text-xs text-gray-400 font-medium mt-0.5">
                Kết bạn từ {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'gần đây'}
            </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip title="Nhắn tin">
                <button
                    onClick={() => onOpenChat(item)}
                    className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center hover:bg-purple-100 transition-all"
                >
                    <MessageCircle size={14} className="text-purple-600" />
                </button>
            </Tooltip>
            <Popconfirm
                title="Hủy kết bạn?"
                description="Bạn có chắc muốn hủy kết bạn với người này?"
                onConfirm={() => onUnfriend(item.friendshipId)}
                okText="Hủy kết bạn"
                cancelText="Đóng"
                okButtonProps={{ danger: true }}
            >
                <button className="w-8 h-8 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center hover:bg-red-100 transition-all">
                    <DeleteOutlined className="text-red-400 text-xs" />
                </button>
            </Popconfirm>
            <Popconfirm
                title="Chặn người này?"
                description="Họ sẽ không thể gửi lời mời kết bạn cho bạn nữa."
                onConfirm={() => onBlock(item.friendshipId)}
                okText="Chặn"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
            >
                <button className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-red-50 hover:border-red-100 transition-all">
                    <StopOutlined className="text-gray-400 text-xs hover:text-red-400" />
                </button>
            </Popconfirm>
        </div>
    </motion.div>
);

/* ─── Request Card ────────────────────────────────────── */
const RequestCard = ({
    item,
    onAccept,
    onDecline,
    type = 'received',
    onCancel,
}: {
    item: Friend;
    onAccept?: (id: string) => void;
    onDecline?: (id: string) => void;
    type?: 'received' | 'sent';
    onCancel?: (id: string) => void;
}) => (
    <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={clsx(
            "flex items-center gap-4 p-4 rounded-2xl border transition-all",
            type === 'received'
                ? "bg-purple-50 border-purple-100"
                : "bg-white border-gray-100"
        )}
    >
        <Avatar
            src={item.avatarUrl}
            icon={!item.avatarUrl && <UserOutlined />}
            size={48}
            className="bg-purple-100 text-purple-600 border-2 border-purple-100 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-800 text-sm truncate">{item.fullName || 'Người dùng'}</div>
            <div className="text-xs text-gray-400 font-medium mt-0.5">
                {type === 'received' ? '✉️ Đã gửi lời mời kết bạn cho bạn' : '⏳ Đang chờ phản hồi'}
            </div>
        </div>
        {type === 'received' && onAccept && onDecline ? (
            <div className="flex gap-2 flex-shrink-0">
                <Popconfirm
                    title="Từ chối lời mời?"
                    onConfirm={() => onDecline(item.friendshipId)}
                    okText="Từ chối"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                >
                    <button className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-all">
                        <CloseOutlined className="text-gray-400 text-sm" />
                    </button>
                </Popconfirm>
                <button
                    onClick={() => onAccept(item.friendshipId)}
                    className="h-9 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-bold flex items-center gap-1.5 hover:shadow-md hover:shadow-purple-500/20 transition-all"
                >
                    <CheckOutlined className="text-xs" /> Đồng ý
                </button>
            </div>
        ) : (
            <Popconfirm
                title="Hủy lời mời?"
                onConfirm={() => onCancel?.(item.friendshipId)}
                okText="Hủy"
                cancelText="Đóng"
                okButtonProps={{ danger: true }}
            >
                <button className="h-8 px-3 rounded-xl bg-gray-100 text-gray-500 text-xs font-bold hover:bg-red-50 hover:text-red-500 transition-all">
                    Hủy lời mời
                </button>
            </Popconfirm>
        )}
    </motion.div>
);

/* ─── Search Result Card ──────────────────────────────── */
const SearchCard = ({ item, onSend }: { item: SearchUser; onSend: (id: string) => void }) => {
    const status = item.friendshipStatus;

    const renderAction = () => {
        if (!status || status === 'DECLINED') {
            return (
                <button
                    onClick={() => onSend(item.userId)}
                    className="h-9 px-4 rounded-xl bg-purple-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-purple-700 transition-all shadow-sm shadow-purple-500/20"
                >
                    <UserAddOutlined className="text-xs" /> Kết bạn
                </button>
            );
        }
        if (status === 'PENDING') {
            return <span className="px-3 py-1.5 bg-yellow-50 text-yellow-600 font-bold text-xs rounded-xl border border-yellow-100">Đã gửi lời mời</span>;
        }
        if (status === 'ACCEPTED') {
            return <span className="px-3 py-1.5 bg-green-50 text-green-600 font-bold text-xs rounded-xl border border-green-100 flex items-center gap-1"><CheckOutlined /> Bạn bè</span>;
        }
        if (status === 'BLOCKED') {
            return <span className="px-3 py-1.5 bg-red-50 text-red-500 font-bold text-xs rounded-xl border border-red-100">Đã chặn</span>;
        }
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:border-purple-100 hover:shadow-sm transition-all"
        >
            <Avatar
                src={item.avatarUrl}
                icon={!item.avatarUrl && <UserOutlined />}
                size={48}
                className="bg-purple-100 text-purple-600 border-2 border-purple-100 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-800 text-sm truncate">{item.fullName || 'Người dùng'}</div>
                <div className="text-xs text-gray-400 font-medium mt-0.5">Học viên SpeakVN</div>
            </div>
            <div className="flex-shrink-0">{renderAction()}</div>
        </motion.div>
    );
};

/* ─── Main Page ───────────────────────────────────────── */
export default function LearnerFriendsPage() {
    const { session } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('friends');
    const [loading, setLoading] = useState(false);

    const [activeChatFriend, setActiveChatFriend] = useState<Friend | null>(null);
    const activeChatFriendRef = useRef<Friend | null>(null);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

    const currentUserId = session?.user?.id;
    const token = useMemo(() => {
        if (typeof window === 'undefined') return null;
        return (
            window.sessionStorage.getItem('ACCESS_TOKEN') ||
            window.localStorage.getItem('ACCESS_TOKEN') ||
            session?.accessToken ||
            null
        );
    }, [session?.accessToken]);

    const sockJsUrl = useMemo(() => {
        const apiUrl = import.meta.env.VITE_API_URL;
        if (apiUrl) {
            const resolved = new URL(apiUrl, window.location.origin);
            return `${resolved.protocol}//${resolved.host}${resolved.pathname}`.replace('/api/v1', '/ws');
        }
        return 'http://localhost:8082/ws';
    }, []);

    useEffect(() => {
        activeChatFriendRef.current = activeChatFriend;
    }, [activeChatFriend]);

    const [friends, setFriends] = useState<Friend[]>([]);
    const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
    const [sentRequests, setSentRequests] = useState<Friend[]>([]);
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    // Normalize API response (handles data.data, data.data.data wrapping)
    const unwrap = (res: any): any[] => {
        const d = res?.data;
        if (Array.isArray(d)) return d;
        if (Array.isArray(d?.data)) return d.data;
        if (Array.isArray(d?.data?.data)) return d.data.data;
        return [];
    };

    const handleOpenChat = useCallback((friend: Friend) => {
        setUnreadCounts((prev) => ({ ...prev, [friend.userId]: 0 }));
        setActiveChatFriend(friend);
    }, []);

    const fetchFriends = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/friends');
            setFriends(unwrap(res));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchPending = useCallback(async () => {
        try {
            const res = await apiClient.get('/friends/requests/pending');
            setPendingRequests(unwrap(res));
        } catch (err) {
            console.error(err);
        }
    }, []);

    const fetchSent = useCallback(async () => {
        try {
            const res = await apiClient.get('/friends/requests/sent');
            setSentRequests(unwrap(res));
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        fetchFriends();
        fetchPending();
    }, []);

    useEffect(() => {
        let cancelled = false;
        const loadUnread = async () => {
            try {
                const data = await getUnreadCounts();
                if (cancelled || data == null || typeof data !== 'object') return;
                const next: Record<string, number> = {};
                Object.entries(data as Record<string, unknown>).forEach(([k, v]) => {
                    const n = typeof v === 'number' ? v : Number(v);
                    if (!Number.isNaN(n)) next[k] = n;
                });
                setUnreadCounts(next);
            } catch (e) {
                console.error(e);
            }
        };
        loadUnread();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!token || !currentUserId) return;

        const client = new Client({
            webSocketFactory: () => new SockJS(sockJsUrl),
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            connectionTimeout: 10000,
            reconnectDelay: 5000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            onConnect: () => {
                client.subscribe(`/topic/chat/${currentUserId}`, (frame) => {
                    try {
                        const newMessage = JSON.parse(frame.body) as {
                            type?: string;
                            senderId?: string;
                            recipientId?: string;
                            content?: string;
                        };
                        if (String(newMessage.type ?? '') === 'READ_RECEIPT') return;
                        const senderId = String(newMessage.senderId ?? '');
                        if (!senderId) return;
                        if (String(newMessage.recipientId ?? '') !== String(currentUserId)) return;
                        if (!String(newMessage.content ?? '').trim()) return;

                        const open = activeChatFriendRef.current;
                        if (open && String(open.userId) === senderId) return;

                        setUnreadCounts((prev) => ({
                            ...prev,
                            [senderId]: (prev[senderId] || 0) + 1,
                        }));
                    } catch {
                        // ignore malformed frame
                    }
                });
            },
        });

        client.activate();
        return () => {
            try {
                client.deactivate();
            } catch {
                // ignore
            }
        };
    }, [token, currentUserId, sockJsUrl]);

    useEffect(() => {
        if (activeTab === 'sent') fetchSent();
    }, [activeTab]);

    const handleSearch = async (q: string) => {
        const query = q || searchQuery;
        if (!query || query.trim().length < 2) {
            message.warning('Vui lòng nhập ít nhất 2 ký tự.');
            return;
        }
        setLoading(true);
        setHasSearched(false);
        try {
            const res = await apiClient.get(`/friends/search?query=${encodeURIComponent(query.trim())}`);
            setSearchResults(unwrap(res));
            setHasSearched(true);
        } catch (err: any) {
            console.error(err);
            message.error(err?.response?.data?.message || 'Lỗi khi tìm kiếm.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendRequest = async (userId: string) => {
        try {
            await apiClient.post('/friends/request', { addresseeId: userId });
            message.success('Đã gửi lời mời kết bạn!');
            setSearchResults(prev => prev.map(u => u.userId === userId ? { ...u, friendshipStatus: 'PENDING' } : u));
            fetchPending();
        } catch (err: any) {
            message.error(err?.response?.data?.message || 'Không thể gửi lời mời.');
        }
    };

    const handleAccept = async (id: string) => {
        try {
            await apiClient.put(`/friends/${id}/accept`);
            message.success('Đã đồng ý kết bạn!');
            setPendingRequests(prev => prev.filter(r => r.friendshipId !== id));
            fetchFriends();
        } catch (err: any) {
            message.error(err?.response?.data?.message || 'Lỗi khi xử lý.');
        }
    };

    const handleDecline = async (id: string) => {
        try {
            await apiClient.put(`/friends/${id}/decline`);
            message.success('Đã từ chối lời mời.');
            setPendingRequests(prev => prev.filter(r => r.friendshipId !== id));
        } catch (err: any) {
            message.error(err?.response?.data?.message || 'Lỗi khi xử lý.');
        }
    };

    const handleUnfriend = async (id: string) => {
        try {
            await apiClient.delete(`/friends/${id}`);
            message.success('Đã hủy kết bạn.');
            setFriends(prev => prev.filter(f => f.friendshipId !== id));
        } catch (err: any) {
            message.error(err?.response?.data?.message || 'Lỗi khi xử lý.');
        }
    };

    const handleBlock = async (id: string) => {
        try {
            await apiClient.put(`/friends/${id}/block`);
            message.success('Đã chặn người dùng.');
            setFriends(prev => prev.filter(f => f.friendshipId !== id));
        } catch (err: any) {
            message.error(err?.response?.data?.message || 'Lỗi khi chặn người dùng.');
        }
    };

    const handleCancelSent = async (id: string) => {
        try {
            await apiClient.delete(`/friends/${id}`);
            message.success('Đã hủy lời mời.');
            setSentRequests(prev => prev.filter(r => r.friendshipId !== id));
        } catch (err: any) {
            message.error(err?.response?.data?.message || 'Lỗi khi xử lý.');
        }
    };

    const TABS = [
        { id: 'friends' as Tab, label: 'Bạn bè', icon: Users, count: friends.length },
        { id: 'requests' as Tab, label: 'Lời mời', icon: UserPlus, count: pendingRequests.length, badge: true },
        { id: 'sent' as Tab, label: 'Đã gửi', icon: SendOutlined, count: 0 },
        { id: 'search' as Tab, label: 'Tìm kiếm', icon: UserSearch, count: 0 },
    ];

    const refreshCurrentTab = () => {
        if (activeTab === 'friends') fetchFriends();
        if (activeTab === 'requests') fetchPending();
        if (activeTab === 'sent') fetchSent();
    };

    return (
        <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-5">

            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-400 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <TeamOutlined className="text-white text-xl" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-800">Bạn Bè</h2>
                        <p className="text-sm text-gray-400 font-medium">Kết nối và học cùng cộng đồng SpeakVN</p>
                    </div>
                </div>
                {activeTab !== 'search' && (
                    <button
                        onClick={refreshCurrentTab}
                        disabled={loading}
                        className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-purple-50 hover:border-purple-200 transition-all disabled:opacity-50"
                    >
                        <RefreshCw size={15} className={clsx("text-gray-500", loading && "animate-spin")} />
                    </button>
                )}
            </div>

            {/* ── Tab Bar ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1 flex gap-1">
                {TABS.map(({ id, label, icon: Icon, count, badge }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={clsx(
                            "flex-1 h-10 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 relative",
                            activeTab === id
                                ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md shadow-purple-500/20"
                                : "text-gray-400 hover:text-purple-600 hover:bg-purple-50"
                        )}
                    >
                        {typeof Icon === 'function' ? <Icon size={13} /> : <Icon className="text-xs" />}
                        <span className="hidden sm:inline">{label}</span>
                        {badge && count > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                                {count}
                            </span>
                        )}
                        {!badge && count > 0 && activeTab === id && (
                            <span className="text-white/70 text-[10px]">({count})</span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Content ── */}
            <div className="min-h-80">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                    >
                        {/* Friends List */}
                        {activeTab === 'friends' && (
                            loading ? (
                                <div className="flex justify-center py-12"><Spin size="large" /></div>
                            ) : friends.length === 0 ? (
                                <EmptyState
                                    icon={Users}
                                    title="Chưa có bạn bè nào"
                                    desc="Hãy tìm kiếm và kết bạn với các học viên khác trong cộng đồng!"
                                />
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {friends.map(item => (
                                        <FriendCard
                                            key={item.friendshipId}
                                            item={item}
                                            onOpenChat={handleOpenChat}
                                            onUnfriend={handleUnfriend}
                                            onBlock={handleBlock}
                                            unreadCount={unreadCounts[item.userId]}
                                        />
                                    ))}
                                </div>
                            )
                        )}

                        {/* Received Requests */}
                        {activeTab === 'requests' && (
                            loading ? (
                                <div className="flex justify-center py-12"><Spin size="large" /></div>
                            ) : pendingRequests.length === 0 ? (
                                <EmptyState
                                    icon={UserPlus}
                                    title="Không có lời mời nào"
                                    desc="Khi ai đó gửi lời mời kết bạn, bạn sẽ thấy ở đây."
                                />
                            ) : (
                                <div className="space-y-3">
                                    <div className="text-xs text-gray-400 font-bold uppercase tracking-widest px-1">
                                        {pendingRequests.length} lời mời đang chờ
                                    </div>
                                    <AnimatePresence>
                                        {pendingRequests.map(item => (
                                            <RequestCard
                                                key={item.friendshipId}
                                                item={item}
                                                type="received"
                                                onAccept={handleAccept}
                                                onDecline={handleDecline}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )
                        )}

                        {/* Sent Requests */}
                        {activeTab === 'sent' && (
                            loading ? (
                                <div className="flex justify-center py-12"><Spin size="large" /></div>
                            ) : sentRequests.length === 0 ? (
                                <EmptyState
                                    icon={Clock}
                                    title="Chưa gửi lời mời nào"
                                    desc="Các lời mời kết bạn bạn đã gửi sẽ xuất hiện tại đây."
                                />
                            ) : (
                                <div className="space-y-3">
                                    <div className="text-xs text-gray-400 font-bold uppercase tracking-widest px-1">
                                        {sentRequests.length} lời mời đã gửi
                                    </div>
                                    {sentRequests.map(item => (
                                        <RequestCard
                                            key={item.friendshipId}
                                            item={item}
                                            type="sent"
                                            onCancel={handleCancelSent}
                                        />
                                    ))}
                                </div>
                            )
                        )}

                        {/* Search */}
                        {activeTab === 'search' && (
                            <div className="space-y-5">
                                {/* Search Input */}
                                <div className="flex gap-3">
                                    <Input
                                        placeholder="Tìm kiếm theo tên hoặc email..."
                                        size="large"
                                        allowClear
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onPressEnter={() => handleSearch(searchQuery)}
                                        prefix={<SearchOutlined className="text-gray-400" />}
                                        className="rounded-2xl border-gray-200 hover:border-purple-300 focus-within:border-purple-400 h-12"
                                    />
                                    <button
                                        onClick={() => handleSearch(searchQuery)}
                                        disabled={loading}
                                        className="h-12 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold text-sm flex items-center gap-2 hover:shadow-md hover:shadow-purple-500/20 transition-all disabled:opacity-60 flex-shrink-0"
                                    >
                                        {loading ? <Spin size="small" /> : <><SearchOutlined /> Tìm</>}
                                    </button>
                                </div>

                                {/* Results */}
                                {loading && (
                                    <div className="flex justify-center py-8"><Spin size="large" /></div>
                                )}

                                {!loading && hasSearched && searchResults.length === 0 && (
                                    <EmptyState
                                        icon={UserSearch}
                                        title="Không tìm thấy kết quả"
                                        desc={`Không có học viên nào phù hợp với "${searchQuery}".`}
                                    />
                                )}

                                {!loading && !hasSearched && !searchQuery && (
                                    <div className="flex flex-col items-center py-12 text-center">
                                        <div className="text-5xl mb-4">🔍</div>
                                        <div className="font-bold text-gray-500 text-sm">Tìm kiếm học viên SpeakVN</div>
                                        <p className="text-gray-400 text-xs mt-1">Nhập tên hoặc email để tìm kiếm</p>
                                    </div>
                                )}

                                {!loading && searchResults.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="text-xs text-gray-400 font-bold uppercase tracking-widest px-1">
                                            {searchResults.length} kết quả
                                        </div>
                                        {searchResults.map(item => (
                                            <SearchCard key={item.userId} item={item} onSend={handleSendRequest} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {activeChatFriend && (
                <ChatBox
                    friend={activeChatFriend}
                    onClose={() => setActiveChatFriend(null)}
                />
            )}
        </div>
    );
}
