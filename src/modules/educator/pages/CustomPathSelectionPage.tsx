import { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Typography, Avatar, Tag, message } from 'antd';
import { Search, User, Rocket, Clock, CheckCircle, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { educatorService, StudentAccount } from '../services/educatorService';

const { Title, Text } = Typography;

const CustomPathSelectionPage = () => {
    const [students, setStudents] = useState<StudentAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await educatorService.getStudentAccounts();
            // Data is in response.data according to apiClient unwrap
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

    const columns = [
        {
            title: 'Học viên',
            key: 'user',
            render: (record: StudentAccount) => (
                <div className="flex items-center gap-3">
                    <Avatar icon={<User />} className="bg-indigo-100 text-indigo-500" />
                    <div>
                        <div className="font-bold text-slate-800">{record.fullName}</div>
                        <div className="text-xs text-slate-400">{record.email}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Trạng thái lộ trình',
            key: 'status',
            render: (record: StudentAccount) => (
                record.hasCustomPath ? (
                    <Tag color="success" className="rounded-full px-3 py-1 font-semibold flex items-center gap-1 w-fit border-none bg-green-50 text-green-600">
                        <CheckCircle size={12} /> Đã thiết lập
                    </Tag>
                ) : (
                    <Tag color="default" className="rounded-full px-3 py-1 font-semibold flex items-center gap-1 w-fit border-slate-200 bg-slate-50 text-slate-500">
                        <Clock size={12} /> Sẵn sàng
                    </Tag>
                )
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (record: StudentAccount) => (
                <Button
                    type="primary"
                    icon={record.hasCustomPath ? <Compass size={16} /> : <Rocket size={16} />}
                    className={`rounded-xl font-bold transition-all border-none ${record.hasCustomPath
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
                        : 'bg-indigo-600 hover:bg-violet-600 shadow-indigo-100'
                        }`}
                    onClick={() => navigate(`/educator/students/${record.id}/custom-path`)}
                >
                    {record.hasCustomPath ? 'Cập nhật lộ trình' : 'Thiết kế lộ trình'}
                </Button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <Title level={2} style={{ margin: 0 }}>Chọn học viên</Title>
                    <Text type="secondary">Vui lòng chọn học viên bạn muốn thiết kế lộ trình cá nhân hóa</Text>
                </div>
                <Input
                    prefix={<Search size={18} className="text-slate-400" />}
                    placeholder="Tìm tên hoặc email học viên..."
                    style={{ width: 320 }}
                    className="rounded-xl h-11"
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                />
            </div>

            <Card className="rounded-2xl shadow-sm border-indigo-50">
                <Table
                    columns={columns}
                    dataSource={filteredStudents}
                    loading={loading}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                />
            </Card>
        </div>
    );
};

export default CustomPathSelectionPage;
