import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Avatar, Input, Popconfirm, Tooltip, message, Modal } from 'antd';
import apiClient, { getUnreadCounts } from '../../../services/apiClient';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from '../../../core/auth/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import {
    Users,
    UserPlus,
    Clock,
    UserSearch,
    RefreshCw,
    MessageCircle,
    MapPin,
    Calendar,
    Trophy,
    Flame,
    Trash2,
    ShieldAlert,
    UserCheck,
    Search,
    Eye,
    XCircle,
    Send
} from '../../../lib/icons';
import { DoodleLoading } from '../../../components/ui/DoodleLoading';
import ChatBox from '../components/ChatBox';

/* ─── Types ─────────────────────────────────────────── */
interface Friend {
    friendshipId: string;
    userId: string;
    fullName: string;
    avatarUrl: string;
    avatar_url?: string;
    status: string;
    createdAt: string;
}

interface SearchUser {
    userId: string;
    fullName: string;
    avatarUrl: string;
    avatar_url?: string;
    friendshipStatus: string | null;
}

interface FriendPublicProfile {
    id: string;
    fullName: string;
    avatarUrl: string;
    avatar_url?: string;
    region: string | null;
    totalStars: number;
    currentStreakDays: number;
    totalExperience: number;
    memberSince: string;
}

type Tab = 'friends' | 'requests' | 'sent' | 'search';

/* ─── Region Label ────────────────────────────── */
const regionLabel = (code: string | null) => {
    if (!code) return 'Chưa cập nhật';
    const map: Record<string, string> = {
        NORTH: 'Miền Bắc', CENTRAL: 'Miền Trung', SOUTH: 'Miền Nam',
        BAC: 'Miền Bắc', TRUNG: 'Miền Trung', NAM: 'Miền Nam',
    };
    return map[code.toUpperCase()] ?? code;
};

/* ─── Friend Profile Modal ─────────────────────────── */
const FriendProfileModal = ({
    open,
    onClose,
    friend,
}: {
    open: boolean;
    onClose: () => void;
    friend: Friend | null;
}) => {
    const [profile, setProfile] = useState<FriendPublicProfile | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !friend) return;
        setProfile(null);
        setLoading(true);
        apiClient
            .get(`/friends/${friend.userId}/profile`)
            .then((res) => {
                const d = res?.data?.data ?? res?.data;
                setProfile(d);
            })
            .catch((err) => {
                message.error(err?.response?.data?.message || 'Không thể tải hồ sơ.');
                onClose();
            })
            .finally(() => setLoading(false));
    }, [open, friend?.userId]);

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={400}
            centered
            styles={{
                body: { padding: 0 }
            }}
            className="doodle-modal"
        >
            <style>{`
                .doodle-modal .ant-modal-content {
                    border-radius: 2.5rem !important;
                    border: 3px solid #1f2937 !important;
                    box-shadow: 8px 8px 0 #1f2937 !important;
                    padding: 0 !important;
                    overflow: hidden !important;
                }
            `}</style>
            {loading || !profile ? (
                <div className="flex justify-center items-center py-20">
                    <DoodleLoading message="Đang xem hồ sơ..." />
                </div>
            ) : (
                <div className="overflow-hidden bg-[#fbf6ef] font-nunito">
                    {/* Header with Pattern */}
                    <div className="h-32 bg-[#49B6E5] border-b-[2.5px] border-slate-900 relative">
                        <div className="absolute inset-0 opacity-10"
                            style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #1f2937 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
                            <div className="p-1 bg-white rounded-2xl border-[2px] border-slate-900 shadow-[3px_3px_0_#1f2937]">
                                <Avatar
                                    src={profile.avatar_url || profile.avatarUrl}
                                    size={72}
                                    className="bg-sky-100 rounded-[1.2rem]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center pt-10 px-6 pb-8">
                        <h3 className="text-xl font-black text-slate-900 text-center font-nunito uppercase tracking-tight">
                            {profile.fullName || 'Người dùng'}
                        </h3>

                        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-xl border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937]">
                                <MapPin size={13} className="text-[#49B6E5]" />
                                <span className="text-slate-900 text-xs font-black">{regionLabel(profile.region)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-xl border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937]">
                                <Calendar size={12} className="text-slate-400" />
                                <span className="text-slate-900 text-[11px] font-black">{new Date(profile.memberSince).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full mt-8">
                            <div className="flex flex-col items-center p-4 bg-yellow-50 rounded-[2rem] border-[2px] border-slate-900 shadow-[4px_4px_0_#1f2937]">
                                <Trophy size={24} className="text-yellow-600 mb-1" />
                                <span className="font-black text-xl text-slate-900 leading-none">{profile.totalStars ?? 0}</span>
                                <span className="text-[10px] text-yellow-600 font-black uppercase tracking-widest mt-1">Sao đạt</span>
                            </div>
                            <div className="flex flex-col items-center p-4 bg-orange-50 rounded-[2rem] border-[2px] border-slate-900 shadow-[4px_4px_0_#1f2937]">
                                <Flame size={24} className="text-orange-500 mb-1" />
                                <span className="font-black text-xl text-slate-900 leading-none">{profile.currentStreakDays ?? 0}</span>
                                <span className="text-[10px] text-orange-600 font-black uppercase tracking-widest mt-1">Chuỗi nổ</span>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full h-14 mt-8 rounded-2xl bg-white border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f2937] font-black text-slate-900 transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};


/* ─── Empty State ─────────────────────────────────────── */
const EmptyState = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border-[2.5px] border-slate-900 shadow-[6px_6px_0_#1f2937] text-center px-10">
        <div className="w-20 h-20 bg-sky-50 rounded-3xl flex items-center justify-center mb-6 border-[2px] border-slate-900 shadow-[4px_4px_0_#1f2937]">
            <Icon size={32} className="text-[#49B6E5]" />
        </div>
        <div className="font-black text-slate-900 text-lg uppercase tracking-tight font-nunito">{title}</div>
        <p className="text-slate-400 font-bold text-sm mt-3 max-w-xs">{desc}</p>
    </div>
);

/* ─── Friend Card ─────────────────────────────────────── */
const FriendCard = ({
    item,
    onOpenChat,
    onViewProfile,
    onUnfriend,
    onBlock,
    unreadCount,
}: {
    item: Friend;
    onOpenChat: (friend: Friend) => void;
    onViewProfile: (friend: Friend) => void;
    onUnfriend: (id: string) => void;
    onBlock: (id: string) => void;
    unreadCount?: number;
}) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-white rounded-2xl border-[2px] border-slate-900 shadow-[4px_4px_0_#1f2937] transition-all group relative overflow-hidden"
    >
        {/* Hand-drawn decoration */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-[#49B6E5]/10 rounded-bl-full pointer-events-none" />

        <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
                <div className="p-0.5 bg-white rounded-xl border-[1.5px] border-slate-900 shadow-[2px_2px_0_#1f2937]">
                    <Avatar
                        src={item.avatar_url || item.avatarUrl}
                        size={48}
                        className="bg-sky-50 rounded-[0.7rem]"
                    />
                </div>
                {unreadCount != null && unreadCount > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black min-w-[1.6rem] h-7 px-1 flex items-center justify-center rounded-full border-[2.5px] border-slate-900 z-10 shadow-[2px_2px_0_#1f2937] animate-bounce">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-[2.5px] border-slate-900 shadow-[1px_1px_0_#1f2937]" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-black text-slate-900 text-base lg:text-lg font-nunito truncate uppercase tracking-tight">
                    {item.fullName || 'Người dùng'}
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-lg border-[1.5px] border-slate-200">
                        Bạn từ {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'gần đây'}
                    </div>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-shrink-0 w-full sm:w-auto justify-end">
            <Tooltip title="Xem hồ sơ">
                <button
                    onClick={() => onViewProfile(item)}
                    className="w-10 h-10 rounded-lg bg-white border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937] flex items-center justify-center hover:bg-sky-50 transition-all text-slate-900 active:translate-y-0.5 active:shadow-none"
                >
                    <Eye size={16} strokeWidth={2.5} />
                </button>
            </Tooltip>

            <button
                onClick={() => onOpenChat(item)}
                className="flex-1 sm:flex-none h-10 px-4 rounded-lg bg-[#49B6E5] text-white border-[2px] border-slate-900 shadow-[3px_3px_0_#1f2937] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
            >
                <MessageCircle size={14} fill="white" />
                <span className="mt-0.5">Nhắn tin</span>
            </button>

            <div className="flex gap-2">
                <Popconfirm
                    title="Hủy kết bạn?"
                    description="Bạn chắc chứ?"
                    onConfirm={() => onUnfriend(item.friendshipId)}
                    okText="Hủy"
                    cancelText="Hủy bỏ"
                    okButtonProps={{ danger: true }}
                >
                    <Tooltip title="Hủy kết bạn">
                        <button className="w-10 h-10 rounded-lg bg-white border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937] flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all active:translate-y-0.5 active:shadow-none">
                            <Trash2 size={16} strokeWidth={2.5} />
                        </button>
                    </Tooltip>
                </Popconfirm>

                <Popconfirm
                    title="Chặn?"
                    onConfirm={() => onBlock(item.friendshipId)}
                    okText="Chặn"
                    cancelText="Thôi"
                    okButtonProps={{ danger: true }}
                >
                    <Tooltip title="Chặn">
                        <button className="w-10 h-10 rounded-lg bg-white border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937] flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all active:translate-y-0.5 active:shadow-none">
                            <ShieldAlert size={16} strokeWidth={2.5} />
                        </button>
                    </Tooltip>
                </Popconfirm>
            </div>
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
            "flex items-center gap-3 p-4 rounded-2xl border-[2px] transition-all",
            type === 'received'
                ? "bg-sky-50 border-slate-900 shadow-[3px_3px_0_#1f2937]"
                : "bg-white border-slate-200"
        )}
    >
        <div className="p-0.5 bg-white rounded-lg border-[1.5px] border-slate-900 shadow-[1.5px_1.5px_0_#1f2937]">
            <Avatar
                src={item.avatar_url || item.avatarUrl}
                size={40}
                className="bg-sky-100 rounded-md flex-shrink-0"
            />
        </div>
        <div className="flex-1 min-w-0">
            <div className="font-black text-slate-900 text-sm truncate uppercase tracking-tight font-nunito">{item.fullName || 'Người dùng'}</div>
            <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                {type === 'received' ? '✉️ Muốn kết bạn với bạn' : '⏳ Chờ phản hồi...'}
            </div>
        </div>
        {type === 'received' && onAccept && onDecline ? (
            <div className="flex gap-2 flex-shrink-0">
                <Popconfirm
                    title="Từ chối?"
                    onConfirm={() => onDecline(item.friendshipId)}
                    okText="Từ chối"
                    cancelText="Thôi"
                    okButtonProps={{ danger: true }}
                >
                    <button className="w-10 h-10 rounded-xl bg-white border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937] flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all active:translate-y-0.5 active:shadow-none">
                        <XCircle size={18} strokeWidth={2.5} />
                    </button>
                </Popconfirm>
                <button
                    onClick={() => onAccept(item.friendshipId)}
                    className="h-10 px-5 rounded-xl bg-orange-400 text-white border-[2px] border-slate-900 shadow-[3px_3px_0_#1f2937] font-black text-[11px] uppercase tracking-widest flex items-center gap-1.5 transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
                >
                    <UserCheck size={14} /> Chấp nhận
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
                <button className="h-9 px-4 rounded-xl bg-white border-[1.5px] border-slate-900 shadow-[2px_2px_0_#1f2937] text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-red-500 transition-all active:translate-y-0.5 active:shadow-none">
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
                    className="h-10 px-5 rounded-xl bg-orange-400 text-white border-[2px] border-slate-900 shadow-[3px_3px_0_#1f2937] font-black text-[11px] uppercase tracking-widest flex items-center gap-1.5 transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
                >
                    <UserPlus size={14} /> Kết bạn
                </button>
            );
        }
        if (status === 'PENDING') {
            return <div className="px-4 py-2 bg-yellow-50 text-yellow-600 font-black text-[10px] uppercase tracking-widest rounded-xl border-[1.5px] border-slate-900 shadow-[2px_2px_0_#1f2937]">Đã gửi</div>;
        }
        if (status === 'ACCEPTED') {
            return <div className="px-4 py-2 bg-green-50 text-green-600 font-black text-[10px] uppercase tracking-widest rounded-xl border-[1.5px] border-slate-900 shadow-[2px_2px_0_#1f2937] flex items-center gap-1.5"><UserCheck size={12} /> Bạn bè</div>;
        }
        if (status === 'BLOCKED') {
            return <div className="px-4 py-2 bg-red-50 text-red-500 font-black text-[10px] uppercase tracking-widest rounded-xl border-[1.5px] border-slate-900 shadow-[2px_2px_0_#1f2937]">Đã chặn</div>;
        }
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 p-5 bg-white rounded-3xl border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f2937] transition-all group overflow-hidden"
        >
            <div className="p-0.5 bg-white rounded-xl border-[1.5px] border-slate-900 shadow-[2px_2px_0_#1f2937]">
                <Avatar
                    src={item.avatar_url || item.avatarUrl}
                    size={52}
                    className="bg-sky-50 rounded-lg flex-shrink-0"
                />
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-black text-slate-900 text-sm truncate uppercase tracking-tight font-nunito">{item.fullName || 'Người dùng'}</div>
                <div className="text-[10px] text-slate-400 font-bold mt-1">Học viên SpeakVN</div>
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
    const [profileTarget, setProfileTarget] = useState<Friend | null>(null);
    const [profileModalOpen, setProfileModalOpen] = useState(false);

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
        return 'https://speakvn-backend-221596280724.asia-southeast1.run.app/ws';
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

    // Normalize API response
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

    const handleViewProfile = useCallback((friend: Friend) => {
        setProfileTarget(friend);
        setProfileModalOpen(true);
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
                Object.entries(data as unknown as Record<string, unknown>).forEach(([k, v]) => {
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
    }, [activeTab, fetchSent]);

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
        { id: 'sent' as Tab, label: 'Đã gửi', icon: Send, count: 0 },
        { id: 'search' as Tab, label: 'Tìm kiếm', icon: UserSearch, count: 0 },
    ];

    const refreshCurrentTab = () => {
        if (activeTab === 'friends') fetchFriends();
        if (activeTab === 'requests') fetchPending();
        if (activeTab === 'sent') fetchSent();
    };

    return (
        <div className="bg-[#fbf6ef] min-h-screen">
            <div className="p-4 lg:p-6 max-w-none mx-auto space-y-4 font-nunito px-4 lg:px-8">

                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white border-[2.5px] border-slate-900 rounded-xl flex items-center justify-center shadow-[3px_3px_0_#1f2937]">
                            <Users size={24} className="text-[#49B6E5]" />
                        </div>
                        <div className="space-y-0.5">
                            <h2 className="text-2xl lg:text-3xl font-black text-slate-900 font-nunito uppercase tracking-tight">Cộng Đồng</h2>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Gặp gỡ và học tập cùng nhau</p>
                        </div>
                    </div>
                    {activeTab !== 'search' && (
                        <button
                            onClick={refreshCurrentTab}
                            disabled={loading}
                            className="w-10 h-10 rounded-xl bg-white border-[2px] border-slate-900 shadow-[3px_3px_0_#1f2937] flex items-center justify-center hover:bg-sky-50 transition-all disabled:opacity-50 active:translate-y-0.5 active:shadow-none"
                        >
                            <RefreshCw size={18} className={clsx("text-slate-900", loading && "animate-spin")} />
                        </button>
                    )}
                </div>

                {/* ── Segmented Control (Tabs) ── */}
                <div className="bg-white rounded-2xl border-[2px] border-slate-900 shadow-[4px_4px_0_#1f2937] p-1.5 flex flex-wrap md:flex-nowrap gap-1.5">
                    {TABS.map(({ id, label, icon: Icon, count, badge }) => {
                        const I = Icon as any;
                        const isActive = activeTab === id;
                        return (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={clsx(
                                    "flex-1 h-10 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 relative",
                                    isActive
                                        ? "bg-[#49B6E5] text-white border-[1.5px] border-slate-900 shadow-[2px_2px_0_#1f2937]"
                                        : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                                )}
                            >
                                <I size={14} strokeWidth={isActive ? 3 : 2} />
                                <span className="hidden sm:inline">{label}</span>
                                {badge && count > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-[1.5px] border-slate-900 shadow-[1px_1px_0_#1f2937]">
                                        {count}
                                    </span>
                                )}
                                {!badge && count > 0 && isActive && (
                                    <span className="text-white/80 text-[10px]">({count})</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* ── Content ── */}
                <div className="min-h-[400px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Friends List */}
                            {activeTab === 'friends' && (
                                loading ? (
                                    <div className="flex justify-center py-20"><DoodleLoading message="Đang tìm bạn bè..." /></div>
                                ) : friends.length === 0 ? (
                                    <EmptyState
                                        icon={Users}
                                        title="Chưa có bạn bè nào"
                                        desc="Hãy tìm kiếm và kết bạn với các học viên khác trong cộng đồng!"
                                    />
                                ) : (
                                    <div className="grid grid-cols-1 gap-5">
                                        {friends.map(item => (
                                            <FriendCard
                                                key={item.friendshipId}
                                                item={item}
                                                onOpenChat={handleOpenChat}
                                                onViewProfile={handleViewProfile}
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
                                    <div className="flex justify-center py-20"><DoodleLoading message="Đang kiểm tra lời mời..." /></div>
                                ) : pendingRequests.length === 0 ? (
                                    <EmptyState
                                        icon={UserPlus}
                                        title="Không có lời mời nào"
                                        desc="Khi ai đó gửi lời mời kết bạn, bạn sẽ thấy ở đây."
                                    />
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2">
                                            <div className="h-10 px-4 rounded-xl bg-orange-50 border-[2px] border-slate-900 shadow-[3px_3px_0_#1f2937] flex items-center gap-2">
                                                <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                                                <span className="text-[10px] text-slate-900 font-black uppercase tracking-widest">{pendingRequests.length} Lời mời mới</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    </div>
                                )
                            )}

                            {/* Sent Requests */}
                            {activeTab === 'sent' && (
                                loading ? (
                                    <div className="flex justify-center py-20"><DoodleLoading message="Đang tải lời mời..." /></div>
                                ) : sentRequests.length === 0 ? (
                                    <EmptyState
                                        icon={Clock}
                                        title="Chưa gửi lời mời nào"
                                        desc="Các lời mời kết bạn bạn đã gửi sẽ xuất hiện tại đây."
                                    />
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2">
                                            <div className="h-10 px-4 rounded-xl bg-white border-[2px] border-slate-900 shadow-[3px_3px_0_#1f2937] flex items-center gap-2">
                                                <span className="text-[10px] text-slate-900 font-black uppercase tracking-widest">{sentRequests.length} Lời mời đã gửi</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {sentRequests.map(item => (
                                                <RequestCard
                                                    key={item.friendshipId}
                                                    item={item}
                                                    type="sent"
                                                    onCancel={handleCancelSent}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )
                            )}

                            {/* Search */}
                            {activeTab === 'search' && (
                                <div className="space-y-8">
                                    {/* Search Input */}
                                    <div className="flex gap-4 p-2 bg-white rounded-[1.8rem] border-[2.5px] border-slate-900 shadow-[6px_6px_0_#1f2937]">
                                        <div className="flex-1 relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                <Search size={20} />
                                            </div>
                                            <Input
                                                placeholder="Tìm theo tên học viên..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onPressEnter={() => handleSearch(searchQuery)}
                                                className="w-full h-14 pl-12 pr-4 border-none bg-transparent text-lg font-black font-nunito placeholder:text-slate-300 focus:shadow-none"
                                            />
                                        </div>
                                        <button
                                            onClick={() => handleSearch(searchQuery)}
                                            className="h-14 px-8 rounded-[1.2rem] bg-[#49B6E5] text-white border-[2px] border-slate-900 shadow-[3px_3px_0_#1f2937] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
                                        >
                                            Tìm kiếm
                                        </button>
                                    </div>

                                    {/* Results */}
                                    <div className="space-y-4">
                                        {loading ? (
                                            <div className="flex justify-center py-20"><DoodleLoading message="Đang tìm kiếm..." /></div>
                                        ) : hasSearched && searchResults.length === 0 ? (
                                            <div className="py-12 bg-white rounded-[2rem] border-[2px] border-slate-900 shadow-[4px_4px_0_#1f2937] text-center border-dashed">
                                                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Không tìm thấy ai phù hợp</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {searchResults.map((item) => (
                                                    <SearchCard key={item.userId} item={item} onSend={handleSendRequest} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Profile Modal */}
            <FriendProfileModal
                open={profileModalOpen}
                onClose={() => setProfileModalOpen(false)}
                friend={profileTarget}
            />

            {/* Chat Box Integration */}
            {activeChatFriend && (
                <div className="fixed bottom-0 right-0 z-50 p-6">
                    <ChatBox
                        friend={activeChatFriend}
                        onClose={() => setActiveChatFriend(null)}
                    />
                </div>
            )}
        </div>
    );
}
