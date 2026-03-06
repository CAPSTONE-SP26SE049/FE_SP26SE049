import { useState, useEffect } from 'react';
import { Table, Tag, message } from 'antd';
import { adminService } from '../../services/adminService';

const STATUS_MAP: Record<string, { color: string; label: string }> = {
    'APPROVED': { color: 'success', label: 'Đã duyệt' },
    'PENDING': { color: 'warning', label: 'Chờ duyệt' },
    'REJECTED': { color: 'error', label: 'Từ chối' },
    'DRAFT': { color: 'default', label: 'Bản nháp' },
};

const ChallengeManagement: React.FC = () => {
    const [challenges, setChallenges] = useState<any[]>([]);
    const [levels, setLevels] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const [challengesRes, levelsRes] = await Promise.all([
                    adminService.getChallenges().catch(() => ({ status: 'success', data: [] })),
                    adminService.getLevels().catch(() => ({ status: 'success', data: [] })),
                ]);
                const challengesData = challengesRes?.data || (Array.isArray(challengesRes) ? challengesRes : []);
                const levelsData = levelsRes?.data || (Array.isArray(levelsRes) ? levelsRes : []);
                setChallenges(challengesData);
                setLevels(levelsData);
            } catch {
                message.error('Lỗi khi tải dữ liệu Thử Thách');
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
            title: 'Nội dung (Text)',
            dataIndex: 'contentText',
            key: 'contentText',
            render: (v: string) => <span className="font-medium">{v}</span>,
        },
        {
            title: 'Loại',
            dataIndex: 'type',
            key: 'type',
            width: 120,
            render: (t: string) => (
                <span className={t === 'WORD' ? 'text-blue-600' : t === 'SENTENCE' ? 'text-green-600' : 'text-purple-600 font-medium'}>{t}</span>
            ),
        },
        {
            title: 'Cấp độ',
            key: 'level',
            render: (_: any, record: any) => {
                const level = levels.find((l: any) => l.id === (record.levelId || record.level?.id));
                return <span className="text-gray-700 font-medium">{level?.name || record.levelId || '—'}</span>;
            },
        },
        {
            title: 'Phiên âm IPA',
            dataIndex: 'phoneticTranscriptionIpa',
            key: 'phoneticTranscriptionIpa',
            render: (v: string) => <code className="text-xs bg-gray-100 px-1 rounded">{v || '—'}</code>,
        },
        {
            title: 'Âm vị',
            dataIndex: 'focusPhonemes',
            key: 'focusPhonemes',
            width: 100,
            render: (v: string) => v || '—',
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
                    <h3 className="text-lg font-bold m-0">Danh sách thử thách (Challenges)</h3>
                    <p className="text-gray-400 text-xs mt-0.5">Chỉ xem — Educator là người tạo nội dung. Admin phê duyệt tại tab <strong>Chờ phê duyệt</strong>.</p>
                </div>
            </div>
            <Table
                columns={columns}
                dataSource={challenges}
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

export default ChallengeManagement;
