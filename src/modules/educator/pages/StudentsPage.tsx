import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar, Button, Input, Progress, Select, Table, Tag, Tooltip, Typography, message, Dropdown
} from 'antd';
import {
  LockOutlined, SearchOutlined,
  TeamOutlined, UserAddOutlined, RocketOutlined,
  EditOutlined, UnlockOutlined
} from '@ant-design/icons';
import {
  Activity, ChevronRight, Sparkles, Trophy, MoreVertical,
  Mail, Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { educatorService, type StudentAccount } from '../services/educatorService';
import clsx from 'clsx';

const { Title, Paragraph } = Typography;
const STUDENT_LEVEL_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1'];

const StudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');

  // Avatar error management
  const [avatarErrors, setAvatarErrors] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await educatorService.getStudentAccounts();
      const list = Array.isArray(res?.data) ? res.data : [];
      setStudents(list.filter((user: any) => (user.roleCode || '').toUpperCase() !== 'ADMIN'));
    } catch {
      message.error('Không thể tải danh sách học viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter((student) => student.isActive !== false).length;
    const avgProgress = total ? Math.round(students.reduce((sum, student) => sum + (student.progressPercent || 0), 0) / total) : 0;
    const avgPronunciation = total ? Math.round(students.reduce((sum, student) => sum + (student.pronunciationScore || 0), 0) / total) : 0;
    return { total, active, avgProgress, avgPronunciation };
  }, [students]);

  const filteredStudents = useMemo(() => students.filter((student) => {
    const matchesSearch = !searchText ||
      student.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchText.toLowerCase());
    const matchesLevel = levelFilter === 'ALL' || student.level === levelFilter;
    return matchesSearch && matchesLevel;
  }), [students, searchText, levelFilter]);

  const getStudentAvatar = (record: StudentAccount) => {
    if (avatarErrors[record.id]) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${record.fullName || record.id}`;
    return record.avatar_url || record.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${record.fullName || record.id}`;
  };

  const columns = [
    {
      title: <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Học viên</span>,
      key: 'student',
      render: (_: unknown, record: StudentAccount) => (
        <div className="flex items-center gap-3 py-1">
          <Avatar
            src={getStudentAvatar(record)}
            onError={() => setAvatarErrors(prev => ({ ...prev, [record.id]: true }))}
            size={40}
            className="rounded-xl border border-white shadow-sm bg-slate-100"
          />
          <div className="flex flex-col">
            <span className="font-bold text-gray-800 text-xs leading-tight">{record.fullName}</span>
            <span className="text-[11px] text-gray-400 font-medium tracking-wide truncate max-w-[180px] italic mt-0.5">{record.email}</span>
          </div>
        </div>
      )
    },
    {
      title: <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none text-center block">Level</span>,
      dataIndex: 'level',
      key: 'level',
      align: 'center' as const,
      render: (level: string) => (
        <Tag className="font-black rounded-lg border-none bg-purple-100 text-purple-700 px-2 py-0.5 text-[9px] uppercase shadow-sm m-0">
          {level || 'N/A'}
        </Tag>
      )
    },
    {
      title: <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Tiến độ</span>,
      dataIndex: 'progressPercent',
      key: 'progressPercent',
      render: (progress: number) => (
        <div className="min-w-[120px] flex flex-col gap-1">
          <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase tracking-wide">
            <span>Progress</span>
            <span className="text-purple-600">{progress || 0}%</span>
          </div>
          <Progress percent={progress || 0} size="small" strokeColor="#9333ea" showInfo={false} strokeWidth={4} className="m-0" />
        </div>
      )
    },
    {
      title: <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none text-center block">Accuracy</span>,
      dataIndex: 'pronunciationScore',
      key: 'pronunciationScore',
      align: 'center' as const,
      render: (score: number) => (
        <div className="flex flex-col items-center">
          <span className={clsx("text-xs font-black", score >= 80 ? "text-green-600" : score >= 50 ? "text-orange-500" : "text-rose-500")}>
            {score || 0}%
          </span>
          <span className="text-[8px] font-bold text-gray-300 uppercase leading-none">Score</span>
        </div>
      )
    },
    {
      title: <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Path</span>,
      key: 'path',
      render: (_: any, record: StudentAccount) => record.hasCustomPath ? (
        <Tag className="rounded-full px-2 py-0.5 font-black text-[8px] uppercase border-none bg-orange-100 text-orange-600 m-0">CUSTOM</Tag>
      ) : (
        <Tag className="rounded-full px-2 py-0.5 font-black text-[8px] uppercase border-none bg-slate-100 text-slate-400 m-0">STANDARD</Tag>
      )
    },
    {
      title: <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none text-right block">Thao tác</span>,
      key: 'action',
      align: 'right' as const,
      render: (_: any, record: StudentAccount) => (
        <div className="flex items-center justify-end gap-1">
          <Tooltip title="Chi tiết">
            <Button
              type="text"
              size="small"
              shape="circle"
              icon={<ChevronRight size={14} />}
              className="bg-slate-50 text-slate-400 hover:bg-purple-600 hover:text-white transition-all shadow-sm"
              onClick={() => navigate(`/educator/students/${record.id}/custom-path`)}
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                { key: 'edit', label: 'Chỉnh sửa kỹ thuật', icon: <EditOutlined /> },
                { key: 'status', label: record.isActive !== false ? 'Khóa tài khoản' : 'Mở khóa', icon: record.isActive !== false ? <LockOutlined /> : <UnlockOutlined />, danger: record.isActive !== false },
              ]
            }}
            trigger={['click']}
          >
            <Button type="text" size="small" shape="circle" icon={<MoreVertical size={14} className="text-gray-400" />} />
          </Dropdown>
        </div>
      )
    },
  ];

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-4 overflow-hidden -mt-2">
      {/* ── Header Section ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 text-purple-600 text-[9px] font-black uppercase tracking-[0.2em] mb-1">
            <TeamOutlined /> Học viên & Lộ trình
          </div>
          <Title level={4} className="!m-0 !font-black !text-gray-800 tracking-tight">Cộng đồng học viên</Title>
          <Paragraph className="!mb-0 text-gray-400 font-semibold text-[11px] mt-0.5 uppercase tracking-wide line-clamp-1 italic">
            Quản lý toàn bộ {students.length} học viên trong hệ thống của bạn.
          </Paragraph>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button icon={<Download size={14} />} className="h-8 rounded-lg font-black border-slate-100 shadow-sm text-[10px] uppercase tracking-wider">Export</Button>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            className="h-8 rounded-lg font-black border-none bg-purple-600 shadow-lg shadow-purple-500/10 text-[10px] uppercase tracking-wider"
          >
            Thêm mới
          </Button>
        </div>
      </div>

      {/* ── Stats Section ── */}
      <div className="grid grid-cols-4 gap-4 flex-shrink-0">
        {[
          { label: 'Tổng Học Viên', val: stats.total, icon: <TeamOutlined />, color: 'bg-purple-600' },
          { label: 'Hoạt Động', val: stats.active, icon: <Activity size={18} />, color: 'bg-emerald-500' },
          { label: 'Tiến độ TB', val: `${stats.avgProgress}%`, icon: <Trophy size={18} />, color: 'bg-orange-500' },
          { label: 'Phát âm TB', val: `${stats.avgPronunciation}%`, icon: <Sparkles size={18} />, color: 'bg-rose-500' },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-2xl p-3 shadow-sm border border-slate-50 flex items-center gap-3 transition-all hover:shadow-md">
            <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center shadow-sm text-white", item.color)}>
              {item.icon}
            </div>
            <div>
              <div className="text-lg font-black text-slate-800 leading-none">{item.val}</div>
              <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wide mt-1 leading-none">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Control Bar Section ── */}
      <div className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <Input
            placeholder="Tìm học viên..."
            prefix={<SearchOutlined className="text-gray-300" />}
            className="h-9 rounded-xl border border-slate-50 bg-slate-50/50 shadow-inner px-4 text-[11px] font-semibold"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Select
            size="middle"
            className="w-40 font-bold text-[11px] uppercase"
            value={levelFilter}
            onChange={setLevelFilter}
            options={[{ value: 'ALL', label: 'TẤT CẢ LEVEL' }, ...STUDENT_LEVEL_OPTIONS.map(l => ({ value: l, label: `LEVEL ${l}` }))]}
          />
        </div>
        <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest hidden md:block">
          Hiển thị <span className="text-purple-600">{filteredStudents.length}</span> / {students.length}
        </div>
      </div>

      {/* ── Table Area ── */}
      <div className="flex-1 overflow-hidden bg-white rounded-3xl shadow-sm border border-slate-50 flex flex-col">
        <Table
          rowKey="id"
          columns={columns as any}
          dataSource={filteredStudents}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            className: 'premium-pagination p-3 m-0 border-t border-slate-50'
          }}
          className="custom-premium-table-v2 dense-table"
          rowClassName="hover:bg-purple-50/20 transition-all"
          scroll={{ y: 'calc(100vh - 440px)' }}
        />
      </div>

      <style>{`
        .custom-premium-table-v2 .ant-table-thead > tr > th {
            background: #fdfaff;
            padding: 10px 20px;
            border-bottom: 1px solid #f1f5f9;
        }
        .custom-premium-table-v2 .ant-table-tbody > tr > td {
            padding: 8px 20px;
            border-bottom: 1px solid #fafafa;
        }
        .premium-pagination .ant-pagination-item-active {
            border-radius: 8px;
            border-color: #9333ea;
            background: #9333ea;
        }
        .premium-pagination .ant-pagination-item-active a { color: white !important; }
        .premium-pagination .ant-pagination-item {
            border-radius: 8px;
            font-weight: 800;
            border: none;
            background: #f8fafc;
            font-size: 10px;
        }
      `}</style>
    </div>
  );
};

export default StudentsPage;
