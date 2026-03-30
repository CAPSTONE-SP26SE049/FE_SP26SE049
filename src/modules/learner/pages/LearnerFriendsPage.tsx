import React, { useState, useEffect } from 'react';
import { Tabs, List, Avatar, Button, Input, message, Spin, Card, Typography, Popconfirm, Badge, Space } from 'antd';
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
import { motion } from 'framer-motion';

const { Title, Text } = Typography;
const { Search } = Input;

export default function LearnerFriendsPage() {
    const [activeTab, setActiveTab] = useState('friends');
    const [loading, setLoading] = useState(false);
    
    // Data states
    const [friends, setFriends] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        // Luôn load lời mời để hiển thị badge đỏ
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
            // Cập nhật state tìm kiếm để chuyển nút Thêm thành chờ
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

    // Render helpers
    const renderAvatar = (url: string, name: string) => (
        <Avatar src={url} icon={!url && <UserOutlined />} size="large" className="bg-brand-blue/10 text-brand-blue" />
    );

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                    <TeamOutlined className="text-white text-2xl" />
                </div>
                <div>
                    <Title level={3} style={{ margin: 0, fontWeight: 800, color: '#4b4b4b' }}>Cộng Đồng</Title>
                    <Text className="text-gray-500">Kết nối và cùng học với bạn bè.</Text>
                </div>
            </div>

            <Card className="rounded-3xl shadow-sm border-gray-100 uppercase-tabs-title" bodyStyle={{ padding: '0px 24px 24px 24px' }}>
                <Tabs 
                    activeKey={activeTab} 
                    onChange={setActiveTab} 
                    size="large"
                    tabBarStyle={{ fontWeight: 'bold' }}
                    items={[
                        {
                            label: `Danh Sách Bạn Bè ${friends.length > 0 ? `(${friends.length})` : ''}`,
                            key: 'friends',
                            children: (
                                <Spin spinning={loading && friends.length === 0}>
                                    <List
                                        itemLayout="horizontal"
                                        dataSource={friends}
                                        locale={{ emptyText: "Chưa có bạn bè nào." }}
                                        renderItem={(item) => (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                <List.Item
                                                    actions={[
                                                        <Popconfirm
                                                            title="Chặn ngường dùng này?"
                                                            onConfirm={() => handleBlock(item.friendshipId)}
                                                            okText="Chặn"
                                                            cancelText="Bỏ qua"
                                                            okButtonProps={{ danger: true }}
                                                        >
                                                            <Button danger icon={<StopOutlined />} className="border-red-200 text-red-500 bg-red-50 font-medium">Chặn</Button>
                                                        </Popconfirm>,
                                                        <Popconfirm
                                                            title="Bạn chắc chắn muốn hủy kết bạn?"
                                                            onConfirm={() => handleUnfriend(item.friendshipId)}
                                                            okText="Hủy kết bạn"
                                                            cancelText="Bỏ qua"
                                                            okButtonProps={{ danger: true }}
                                                        >
                                                            <Button danger icon={<DeleteOutlined />} className="border-red-200 text-red-500 bg-red-50 font-medium">Hủy Bạn</Button>
                                                        </Popconfirm>
                                                    ]}
                                                    className="hover:bg-gray-50 rounded-xl px-4 my-2 transition-colors border border-transparent hover:border-gray-100"
                                                >
                                                    <List.Item.Meta
                                                        avatar={renderAvatar(item.avatarUrl, item.fullName)}
                                                        title={<span className="font-bold text-gray-800 text-base">{item.fullName}</span>}
                                                        description={<span className="text-xs text-gray-400">Đã kết bạn • {new Date(item.createdAt).toLocaleDateString()}</span>}
                                                    />
                                                </List.Item>
                                            </motion.div>
                                        )}
                                    />
                                </Spin>
                            )
                        },
                        {
                            label: (
                                <span>
                                    Lời Mời &nbsp;
                                    <Badge count={pendingRequests.length} className="site-badge-count-109" />
                                </span>
                            ),
                            key: 'pending',
                            children: (
                                <Spin spinning={loading && pendingRequests.length === 0}>
                                    <List
                                        itemLayout="horizontal"
                                        dataSource={pendingRequests}
                                        locale={{ emptyText: "Không có lời mời nào." }}
                                        renderItem={(item) => (
                                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                                                <List.Item
                                                    actions={[
                                                        <Button danger onClick={() => handleDeclineRequest(item.friendshipId)} icon={<CloseOutlined />} className="border-red-200 text-red-500 bg-red-50 font-medium">Từ chối</Button>,
                                                        <Button type="primary" className="bg-[#58cc02] hover:bg-[#46a302] border-none text-white font-medium" onClick={() => handleAcceptRequest(item.friendshipId)} icon={<CheckOutlined />}>Chấp nhận</Button>
                                                    ]}
                                                    className="hover:bg-blue-50/50 rounded-xl px-4 my-2 transition-colors border border-blue-50"
                                                >
                                                    <List.Item.Meta
                                                        avatar={renderAvatar(item.avatarUrl, item.fullName)}
                                                        title={<span className="font-bold text-gray-800 text-base">{item.fullName}</span>}
                                                        description={<span className="text-xs text-gray-400">Muốn kết bạn với bạn</span>}
                                                    />
                                                </List.Item>
                                            </motion.div>
                                        )}
                                    />
                                </Spin>
                            )
                        },
                        {
                            label: 'Tìm Kiếm Người Dùng',
                            key: 'search',
                            children: (
                                <div className="space-y-6">
                                    <div className="flex max-w-xl gap-2">
                                        <Input 
                                            placeholder="Nhập tên người dùng hoặc email..." 
                                            allowClear 
                                            size="large" 
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onPressEnter={() => handleSearch(searchQuery)}
                                            className="shadow-sm border-gray-200"
                                        />
                                        <Button 
                                            type="primary" 
                                            size="large" 
                                            onClick={() => handleSearch(searchQuery)}
                                            icon={<SearchOutlined />}
                                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 border-none shadow-sm"
                                        >
                                            Tìm Kiếm
                                        </Button>
                                    </div>
                                    <Spin spinning={loading}>
                                        <List
                                            itemLayout="horizontal"
                                            dataSource={searchResults}
                                            locale={{ emptyText: "Hãy tìm kiếm để kết nối với bạn bè mới." }}
                                            renderItem={(item) => (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                    <List.Item
                                                        actions={[
                                                            (() => {
                                                                const status = item.status || item.friendshipStatus;
                                                                if (!status || status === 'null') {
                                                                    return <Button type="primary" className="bg-blue-500 hover:bg-blue-600 border-none font-medium" onClick={() => handleSendRequest(item.userId)} icon={<UserAddOutlined />}>Kết Bạn</Button>
                                                                } else if (status === 'PENDING') {
                                                                    return <Button disabled className="font-medium bg-gray-100 text-gray-400">Đã gửi lời mời</Button>
                                                                } else if (status === 'ACCEPTED') {
                                                                    return <Button type="dashed" disabled icon={<CheckOutlined />} className="font-medium">Bạn Bè</Button>
                                                                } else if (status === 'BLOCKED') {
                                                                    return <Button disabled danger className="font-medium bg-red-50 text-red-200">Đã chặn</Button>
                                                                }
                                                                return null;
                                                            })()
                                                        ]}
                                                        className="hover:bg-gray-50 rounded-xl px-4 my-2 transition-colors"
                                                    >
                                                        <List.Item.Meta
                                                            avatar={renderAvatar(item.avatarUrl, item.fullName)}
                                                            title={<span className="font-bold text-gray-800 text-base">{item.fullName}</span>}
                                                            description={<span className="text-xs text-gray-400">Thành viên SpeakVN</span>}
                                                        />
                                                    </List.Item>
                                                </motion.div>
                                            )}
                                        />
                                    </Spin>
                                </div>
                            )
                        }
                    ]}
                />
            </Card>
        </div>
    );
}
