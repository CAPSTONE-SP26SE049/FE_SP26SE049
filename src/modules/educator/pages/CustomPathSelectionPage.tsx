import { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Typography, Avatar, Tag, message } from 'antd';
import { Search, Rocket, Clock, CheckCircle, Compass, Users, Map } from '../../../lib/icons';
import { useNavigate } from 'react-router-dom';
import { educatorService, type StudentAccount } from '../services/educatorService';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const { Title, Paragraph } = Typography;

const CustomPathSelectionPage = () => {
    const [students, setStudents] = useState<StudentAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const navigate = useNavigate();

    // Avatar error management
    const [avatarErrors, setAvatarErrors] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await educatorService.getStudentAccounts();
            const studentData = Array.isArray(response.data) ? response.data : [];
            setStudents(studentData);
        } catch (error) {
            message.error('Không thể tải danh sách học viên');
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = (students || []).filter(s => {
        const name = (s.fullName || '').toLowerCase();
        const email = (s.email || '').toLowerCase();
        const search = searchText.toLowerCase();
        return name.includes(search) || email.includes(search);
    });

    const getStudentAvatar = (record: StudentAccount) => {
        if (avatarErrors[record.id]) {
            return `https://api.dicebear.com/7.x/avataaars/svg?seed=${record.fullName || record.id}`;
        }
        return record.avatar_url || record.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${record.fullName || record.id}`;
    };

    const columns = [
        {
            title: <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Học viên</span>,
            key: 'user',
            render: (record: StudentAccount) => (
                <div className="flex items-center gap-3 py-1">
                    <Avatar
                        src={getStudentAvatar(record)}
                        onError={() => setAvatarErrors(prev => ({ ...prev, [record.id]: true }))}
                        size={40}
                        className="rounded-xl border border-white shadow-sm bg-slate-100"
                    />
                    <div>
                        <div className="font-bold text-slate-800 text-xs leading-tight">{record.fullName}</div>
                        <div className="text-[11px] text-slate-400 font-medium tracking-wide italic mt-0.5">{record.email}</div>
                    </div>
                </div>
            ),
        },
        {
            title: <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Trạng thái lộ trình</span>,
            key: 'status',
            render: (record: StudentAccount) => (
                record.hasCustomPath ? (
                    <Tag className="rounded-full px-2 py-0.5 font-black text-[8px] uppercase flex items-center gap-1.5 w-fit border-none bg-green-100 text-green-700 shadow-sm leading-none h-5">
                        <CheckCircle size={10} /> ĐÃ THIẾT LẬP
                    </Tag>
                ) : (
                    <Tag className="rounded-full px-2 py-0.5 font-black text-[8px] uppercase flex items-center gap-1.5 w-fit border-none bg-slate-100 text-slate-500 shadow-sm leading-none h-5">
                        <Clock size={10} /> CHỜ THIẾT LẬP
                    </Tag>
                )
            ),
        },
        {
            title: <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Thao tác</span>,
            key: 'action',
            align: 'right' as const,
            render: (record: StudentAccount) => (
                <Button
                    type="primary"
                    size="small"
                    icon={record.hasCustomPath ? <Compass size={14} /> : <Rocket size={14} />}
                    className={clsx(
                        "h-8 px-4 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all border-none shadow-md",
                        record.hasCustomPath
                            ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/10"
                            : "bg-purple-600 hover:bg-purple-500 shadow-purple-500/20"
                    )}
                    onClick={() => navigate(`/educator/students/${record.id}/custom-path`)}
                >
                    {record.hasCustomPath ? 'CẬP NHẬT' : 'THIẾT KẾ'}
                </Button>
            ),
        },
    ];

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col gap-4 overflow-hidden -mt-2">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 flex-shrink-0">
                <div>
                    <div className="flex items-center gap-2 text-purple-600 text-[9px] font-black uppercase tracking-[0.2em] mb-1">
                        <Map size={12} /> Personalization Hub
                    </div>
                    <Title level={4} className="!m-0 !font-black !text-gray-800 tracking-tight">Thiết kế lộ trình học tập</Title>
                    <Paragraph className="!mb-0 text-gray-400 font-semibold text-[11px] mt-0.5 uppercase tracking-wide line-clamp-1 italic">
                        Duyệt danh sách để cá nhân hóa lộ trình dựa trên năng lực từng học viên.
                    </Paragraph>
                </div>

                <div className="relative w-full md:w-64">
                    <Input
                        prefix={<Search size={14} className="text-slate-400 mr-1.5" />}
                        placeholder="Tìm học viên..."
                        className="h-9 rounded-xl border border-slate-100 bg-white shadow-sm font-semibold text-[11px] focus:ring-0"
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        allowClear
                    />
                </div>
            </div>

            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-3 gap-4 flex-shrink-0">
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-50 flex items-center gap-3 group hover:shadow-md transition-all">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                        <Users size={16} />
                    </div>
                    <div>
                        <div className="text-lg font-black text-slate-800 leading-none mb-0.5">{students.length}</div>
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Thành viên</div>
                    </div>
                </div>
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-50 flex items-center gap-3 group hover:shadow-md transition-all">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <CheckCircle size={16} />
                    </div>
                    <div>
                        <div className="text-lg font-black text-slate-800 leading-none mb-0.5">{students.filter(s => s.hasCustomPath).length}</div>
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Đã thiết lập</div>
                    </div>
                </div>
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-50 flex items-center gap-3 group hover:shadow-md transition-all">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
                        <Rocket size={16} />
                    </div>
                    <div>
                        <div className="text-lg font-black text-slate-800 leading-none mb-0.5">{students.filter(s => !s.hasCustomPath).length}</div>
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Đang chờ</div>
                    </div>
                </div>
            </div>

            {/* ── Main List ── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 overflow-hidden"
            >
                <Card className="rounded-2xl border border-slate-100 shadow-sm h-full overflow-hidden flex flex-col" bodyStyle={{ padding: 0, flex: 1, overflow: 'hidden' }}>
                    <Table
                        columns={columns as any}
                        dataSource={filteredStudents}
                        loading={loading}
                        rowKey="id"
                        pagination={{
                            pageSize: 8,
                            size: 'small',
                            className: 'premium-pagination p-3 m-0 border-t border-slate-50'
                        }}
                        scroll={{ y: 'calc(100vh - 430px)' }}
                        className="custom-premium-table-compact dense-table"
                        rowClassName="hover:bg-purple-50/20 transition-colors"
                    />
                </Card>
            </motion.div>

            <style>{`
                .custom-premium-table-compact .ant-table-thead > tr > th {
                    background: #fdfaff;
                    padding: 10px 20px;
                    border-bottom: 1px solid #f1f5f9;
                }
                .custom-premium-table-compact .ant-table-tbody > tr > td {
                    padding: 8px 20px;
                    border-bottom: 1px solid #fafafa;
                }
                .premium-pagination .ant-pagination-item-active {
                    border-radius: 8px;
                    border-color: #9333ea;
                    background: #9333ea;
                }
                .premium-pagination .ant-pagination-item-active a {
                    color: white !important;
                }
                .premium-pagination .ant-pagination-item {
                    border-radius: 8px;
                    font-weight: 800;
                    border: none;
                    background: #f8fafc;
                    font-size: 10px;
                }
                .ant-table-container { border-radius: 16px !important; }
            `}</style>
        </div>
    );
};

export default CustomPathSelectionPage;
