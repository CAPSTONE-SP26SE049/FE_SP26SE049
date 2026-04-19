import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar, Button, Input, Progress, Select, Space, Table, Tag, Tooltip, Typography, message
} from 'antd';
import {
  CheckCircleOutlined, DownloadOutlined, LockOutlined, SearchOutlined,
  TeamOutlined, UserOutlined, UserAddOutlined, RocketOutlined,
  EditOutlined, UnlockOutlined, UploadOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { educatorService, type StudentAccount } from '../services/educatorService';

const STUDENT_LEVEL_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1'];

const StudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');

  const load = async () => {
    setLoading(true);
    try {
      const res = await educatorService.getStudentAccounts();
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data?.content)
            ? res.data.content
            : [];

      // Filter out admins if any, and ensure we have Account entities mapping to StudentAccount interface
      setStudents(list.filter((user: any) => (user.roleCode || '').toUpperCase() !== 'ADMIN'));
    } catch {
      message.error('Không thể tải danh sách học viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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

  const columns = [
    {
      title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">STT</span>,
      key: 'stt',
      width: 60,
      align: 'center' as const,
      render: (_: unknown, __: StudentAccount, index: number) => (
        <span className="font-bold text-gray-400 text-sm">{index + 1}</span>
      )
    },
    {
      title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Học viên</span>,
      key: 'student',
      render: (_: unknown, record: any) => (
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar
              src={record.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${record.id}`}
              icon={<UserOutlined />}
              className="w-10 h-10 rounded-xl"
              style={{ borderRadius: 10 }}
            />
            {record.isActive !== false
              ? <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white" />
              : <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-red-400 rounded-full border-2 border-white" />
            }
          </div>
          <div>
            <div className="font-bold text-gray-800 text-sm leading-tight">{record.fullName}</div>
            <div className="text-xs text-gray-400">{record.email}</div>
          </div>
        </div>
      )
    },
    {
      title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Cấp độ</span>,
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => <Tag color="blue" className="font-bold rounded-lg border-none bg-blue-50 text-blue-500">{level || 'N/A'}</Tag>
    },
    {
      title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Tiến độ</span>,
      dataIndex: 'progressPercent',
      key: 'progressPercent',
      render: (progress: number) => (
        <div className="min-w-[140px]">
          <Progress percent={progress || 0} size="small" strokeColor="#9333ea" />
        </div>
      )
    },
    {
      title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Phát âm</span>,
      dataIndex: 'pronunciationScore',
      key: 'pronunciationScore',
      render: (score: number) => (
        <span className="font-bold text-gray-700 text-sm">
          {score || 0}<span className="text-gray-400 font-normal">/100</span>
        </span>
      )
    },
    {
      title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Trạng thái</span>,
      key: 'status',
      render: (_: any, record: any) => record.isActive !== false ? (
        <Tag icon={<CheckCircleOutlined />} color="success" className="font-bold rounded-lg border-none bg-green-50 text-green-600">Hoạt động</Tag>
      ) : (
        <Tag icon={<LockOutlined />} color="error" className="font-bold rounded-lg border-none bg-red-50 text-red-600">Đã khóa</Tag>
      )
    },
    {
      title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Tham gia</span>,
      key: 'lastActiveAt',
      render: (_: unknown, record: any) => (
        <span className="text-sm text-gray-500 font-medium">
          {(record.createdAt || record.lastActiveAt) ? new Date(record.createdAt || record.lastActiveAt).toLocaleDateString('vi-VN') : 'N/A'}
        </span>
      )
    },
    {
      title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Thao tác</span>,
      key: 'action',
      align: 'center' as const,
      render: (_: any, record: any) => (
        <Space size={4}>
          <Tooltip title="Xem chi tiết">
            <Button type="text" shape="circle" icon={<SearchOutlined style={{ color: '#2563eb' }} />} />
          </Tooltip>
          <Tooltip title={record.isActive !== false ? "Khóa học viên" : "Mở khóa học viên"}>
            <Button
              type="text" shape="circle"
              icon={record.isActive !== false ? <LockOutlined style={{ color: '#ef4444' }} /> : <UnlockOutlined style={{ color: '#22c55e' }} />}
            />
          </Tooltip>
          <Tooltip title="Thiết kế lộ trình">
            <Button
              type="text" shape="circle"
              icon={<RocketOutlined style={{ color: '#8b5cf6' }} />}
              onClick={() => navigate(`/educator/students/${record.id}/custom-path`)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button type="text" shape="circle" icon={<EditOutlined style={{ color: '#f59e0b' }} />} />
          </Tooltip>
        </Space>
      )
    },
  ];

  return (
    <div className="p-6 min-h-screen bg-gray-50/50">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <Typography.Title level={3} className="!mb-1 !font-black !text-gray-800">Quản lý học viên</Typography.Title>
          <Typography.Paragraph type="secondary" className="!mb-0 font-medium">Theo dõi danh sách học viên, tiến độ học tập và điểm phát âm từ hệ thống.</Typography.Paragraph>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button icon={<DownloadOutlined />} className="rounded-xl h-11 font-bold border-gray-200 hover:text-purple-600 hover:border-purple-200 transition-all">
            Template
          </Button>
          <Button icon={<UploadOutlined />} className="rounded-xl h-11 font-bold border-gray-200 hover:text-purple-600 hover:border-purple-200 transition-all">
            Import
          </Button>
          <Button icon={<DownloadOutlined />} className="rounded-xl h-11 font-bold border-gray-200 hover:text-purple-600 hover:border-purple-200 transition-all">
            Export
          </Button>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            className="rounded-xl h-11 font-bold border-none shadow-lg shadow-purple-100"
            style={{ background: 'linear-gradient(135deg, #9333ea, #7e22ce)' }}
          >
            Thêm học viên
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Tổng học viên', value: stats.total, icon: <TeamOutlined />, color: '#9333ea', bg: '#faf5ff' },
          { label: 'Đang hoạt động', value: stats.active, icon: <CheckCircleOutlined />, color: '#0ea5e9', bg: '#f0f9ff' },
          { label: 'Tiến độ TB', value: `${stats.avgProgress}%`, icon: <UserOutlined />, color: '#10b981', bg: '#f0fdf4' },
          { label: 'Phát âm TB', value: `${stats.avgPronunciation}/100`, icon: <LockOutlined />, color: '#f59e0b', bg: '#fffbeb' }
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-5 border border-white shadow-sm flex items-center gap-4 hover:shadow-md transition-all group"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-transform group-hover:scale-110"
              style={{ backgroundColor: item.bg, color: item.color }}
            >
              {item.icon}
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800 tracking-tight">{item.value}</div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">{item.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-4 mb-5 flex-wrap">
        <Input
          prefix={<SearchOutlined className="text-gray-300" />}
          placeholder="Tìm theo tên hoặc email..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="max-w-sm rounded-xl h-11 border-gray-200 shadow-sm"
          allowClear
        />
        <Select
          value={levelFilter}
          onChange={setLevelFilter}
          className="min-w-44 h-11 rounded-xl"
          options={[{ value: 'ALL', label: 'Tất cả cấp độ' }, ...STUDENT_LEVEL_OPTIONS.map((level) => ({ value: level, label: level }))]}
        />
        <div className="ml-auto text-sm text-gray-400 font-bold">
          {filteredStudents.length} / {students.length} kết quả
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <Table
          rowKey="id"
          columns={columns as any}
          dataSource={filteredStudents}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => <span className="font-bold text-gray-400 text-xs">Tổng {total} học viên</span>,
            style: { padding: '16px 24px' }
          }}
          rowClassName="hover:bg-purple-50/20 transition-colors cursor-pointer"
          scroll={{ x: 'max-content' }}
        />
      </div>
    </div>
  );
};

export default StudentsPage;
