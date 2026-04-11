import { useEffect, useState } from 'react';
import { Table, Button, Card, Typography, message, Switch, Input } from 'antd';
import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { educatorService } from '../services/educatorService';

const { Title } = Typography;

const StudentManagementPage = () => {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const navigate = useNavigate();

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const response = await educatorService.getAssignedStudents();
            setStudents(response.data || []);
        } catch (error) {
            message.error('Không thể tải danh sách học viên');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const handleStatusChange = async (studentId: string, checked: boolean) => {
        try {
            await educatorService.updateStudentStatus(studentId, checked);
            message.success('Cập nhật trạng thái thành công');
            fetchStudents();
        } catch (error) {
            message.error('Lỗi khi cập nhật trạng thái');
        }
    };

    const columns = [
        {
            title: 'Họ và tên',
            dataIndex: 'fullName',
            key: 'fullName',
            render: (text: string) => <span style={{ fontWeight: 600 }}>{text}</span>,
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive: boolean, record: any) => (
                <Switch 
                    checked={isActive} 
                    onChange={(checked) => handleStatusChange(record.id, checked)}
                    checkedChildren="Hoạt động" 
                    unCheckedChildren="Khóa"
                />
            ),
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_: any, record: any) => (
                <Button 
                    type="primary" 
                    icon={<EyeOutlined />} 
                    onClick={() => navigate(`/educator/students/${record.id}`)}
                >
                    Chi tiết
                </Button>
            ),
        },
    ];

    const filteredStudents = students.filter(s => 
        (s.fullName || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <Title level={2}>Quản lý học viên</Title>
                <Input 
                    placeholder="Tìm kiếm học viên..." 
                    prefix={<SearchOutlined />} 
                    style={{ width: 300 }}
                    onChange={e => setSearchText(e.target.value)}
                />
            </div>
            <Card variant="outlined">
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

export default StudentManagementPage;
