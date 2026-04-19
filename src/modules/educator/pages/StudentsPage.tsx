import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Card, Empty, Input, Progress, Select, Space, Table, Tag, Tooltip, Typography, message } from 'antd';
import { CheckCircleOutlined, DownloadOutlined, LockOutlined, SearchOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { educatorService, type StudentAccount } from '../services/educatorService';

const STUDENT_LEVEL_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1'];

const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<StudentAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');

  useEffect(() => {
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
        setStudents(list.filter((user: StudentAccount & { roleCode?: string }) => (user.roleCode || '').toUpperCase() !== 'ADMIN'));
      } catch {
        message.error('Không thể tải danh sách học viên');
      } finally {
        setLoading(false);
      }
    };
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
    const matchesSearch = !searchText || student.fullName?.toLowerCase().includes(searchText.toLowerCase()) || student.email?.toLowerCase().includes(searchText.toLowerCase());
    const matchesLevel = levelFilter === 'ALL' || student.level === levelFilter;
    return matchesSearch && matchesLevel;
  }), [students, searchText, levelFilter]);

  const columns = [
    { title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">STT</span>, key: 'stt', width: 60, align: 'center' as const, render: (_: unknown, __: StudentAccount, index: number) => <span className="font-bold text-gray-400 text-sm">{index + 1}</span> },
    { title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Học viên</span>, key: 'student', render: (_: unknown, record: StudentAccount) => (<div className="flex items-center gap-3"><Avatar src={record.avatar_url || record.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${record.id}`} icon={<UserOutlined />} className="w-10 h-10 rounded-xl" style={{ borderRadius: 10 }} /><div><div className="font-bold text-gray-800 text-sm leading-tight">{record.fullName}</div><div className="text-xs text-gray-400">{record.email}</div></div></div>) },
    { title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Cấp độ</span>, dataIndex: 'level', key: 'level', render: (level: string) => <Tag color="blue" className="font-bold rounded-lg">{level || 'N/A'}</Tag> },
    { title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Tiến độ</span>, dataIndex: 'progressPercent', key: 'progressPercent', render: (progress: number) => <div className="min-w-[160px]"><Progress percent={progress || 0} size="small" /></div> },
    { title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Phát âm</span>, dataIndex: 'pronunciationScore', key: 'pronunciationScore', render: (score: number) => <span className="font-semibold text-slate-700">{score || 0}/100</span> },
    { title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Trạng thái</span>, key: 'status', render: () => <Tag icon={<CheckCircleOutlined />} color="success" className="font-bold rounded-lg">Hoạt động</Tag> },
    { title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Tham gia</span>, key: 'lastActiveAt', render: (_: unknown, record: StudentAccount) => <span className="text-sm text-gray-500 font-medium">{record.lastActiveAt ? new Date(record.lastActiveAt).toLocaleDateString('vi-VN') : 'N/A'}</span> },
    { title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Thao tác</span>, key: 'action', align: 'center' as const, render: () => (<Space size={4}><Tooltip title="Xem chi tiết"><Button type="text" shape="circle" icon={<SearchOutlined style={{ color: '#2563eb' }} />} /></Tooltip><Tooltip title="Tạo lộ trình học"><Button type="text" shape="circle" icon={<TeamOutlined style={{ color: '#8b5cf6' }} />} /></Tooltip><Tooltip title="Khóa học viên"><Button type="text" shape="circle" icon={<LockOutlined style={{ color: '#ef4444' }} />} /></Tooltip></Space>) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Typography.Title level={3} className="!mb-1">Quản lý học viên</Typography.Title>
          <Typography.Paragraph type="secondary" className="!mb-0">Theo dõi danh sách học viên, tiến độ học tập và điểm phát âm từ backend.</Typography.Paragraph>
        </div>
        <Space wrap>
          <Button icon={<DownloadOutlined />}>Export</Button>
          <Button type="primary">Thêm học viên</Button>
        </Space>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[{ label: 'Tổng học viên', value: stats.total, icon: <TeamOutlined /> }, { label: 'Đang hoạt động', value: stats.active, icon: <CheckCircleOutlined /> }, { label: 'Tiến độ TB', value: `${stats.avgProgress}%`, icon: <UserOutlined /> }, { label: 'Phát âm TB', value: `${stats.avgPronunciation}/100`, icon: <LockOutlined /> }].map((item) => (
          <Card key={item.label} className="rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 mb-2">{item.label}{item.icon}</div>
            <div className="text-2xl font-black text-slate-800">{item.value}</div>
          </Card>
        ))}
      </div>

      <div className="flex gap-4 flex-wrap items-center justify-between">
        <Input prefix={<SearchOutlined className="text-gray-300" />} placeholder="Tìm theo tên hoặc email..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="max-w-sm rounded-xl" allowClear />
        <Select value={levelFilter} onChange={setLevelFilter} className="min-w-44" options={[{ value: 'ALL', label: 'Tất cả cấp độ' }, ...STUDENT_LEVEL_OPTIONS.map((level) => ({ value: level, label: level }))]} />
      </div>

      <Card className="rounded-2xl shadow-sm border border-slate-100" loading={loading}>
        {filteredStudents.length ? <Table rowKey="id" columns={columns as any} dataSource={filteredStudents} pagination={{ pageSize: 10 }} /> : <Empty description="Chưa có học viên nào" />}
      </Card>
    </div>
  );
};

export default StudentsPage;
