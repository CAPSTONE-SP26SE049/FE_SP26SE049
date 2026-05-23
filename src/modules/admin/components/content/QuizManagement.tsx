import { useState, useEffect } from 'react';
import { Table, Tag, message } from 'antd';
import { adminService } from '../../services/adminService';

const STATUS_MAP: Record<string, { color: string; label: string }> = {
    'APPROVED': { color: 'success', label: 'Đã duyệt' },
    'PENDING': { color: 'warning', label: 'Chờ duyệt' },
    'REJECTED': { color: 'error', label: 'Từ chối' },
    'DRAFT': { color: 'default', label: 'Bản nháp' },
};

const QuizManagement: React.FC = () => {
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const res: any = await adminService.getQuizzes().catch(() => ({ status: 'success', data: [] }));
                const quizzesData = res?.data || (Array.isArray(res) ? res : []);
                setQuizzes(quizzesData);
            } catch {
                message.error('Lỗi khi tải dữ liệu Bài kiểm tra');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const columns = [
        {
            title: 'STT',
            key: 'stt',
            width: 60,
            align: 'center' as const,
            render: (_: any, __: any, index: number) => index + 1,
        },
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
            render: (v: string) => <span className="font-medium">{v}</span>,
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Người tạo',
            dataIndex: 'createdBy',
            key: 'createdBy',
            width: 150,
        },
        {
            title: 'Điểm đạt',
            dataIndex: 'passingScore',
            key: 'passingScore',
            width: 100,
            align: 'center' as const,
            render: (v: number) => `${v}đ`,
        },
        {
            title: 'Thời gian',
            dataIndex: 'timeLimitSeconds',
            key: 'timeLimitSeconds',
            width: 120,
            render: (v: number) => v ? `${v} giây` : 'Không giới hạn',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status: string) => {
                const s = STATUS_MAP[status?.toUpperCase()] || { color: 'default', label: status || '—' };
                return <Tag color={s.color}>{s.label}</Tag>;
            },
        },
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-bold m-0">Danh sách bài kiểm tra (Quizzes)</h3>
                    <p className="text-gray-400 text-xs mt-0.5">Danh sách tổng hợp — Phê duyệt nội dung mới tại tab <strong>Chờ phê duyệt</strong>.</p>
                </div>
            </div>
            <Table
                columns={columns}
                dataSource={quizzes}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 8 }}
                rowClassName={(record) =>
                    record.status?.toUpperCase() === 'REJECTED' ? 'bg-red-50' :
                        record.status?.toUpperCase() === 'PENDING' ? 'bg-yellow-50' : ''
                }
                locale={{ emptyText: 'Chưa có dữ liệu' }}
            />
        </div>
    );
};

export default QuizManagement;
