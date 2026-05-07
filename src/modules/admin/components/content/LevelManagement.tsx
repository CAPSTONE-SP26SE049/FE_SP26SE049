import { useState, useEffect } from 'react';
import { Table, Tag, message } from 'antd';
import { adminService } from '../../services/adminService';

// Removed hardcoded REGION_MAP in favor of dynamic dialect.description

const STATUS_MAP: Record<string, { color: string; label: string }> = {
    'APPROVED': { color: 'success', label: 'Đã duyệt' },
    'PENDING': { color: 'warning', label: 'Chờ duyệt' },
    'REJECTED': { color: 'error', label: 'Từ chối' },
    'DRAFT': { color: 'default', label: 'Bản nháp' },
};

const LevelManagement: React.FC = () => {
    const [levels, setLevels] = useState<any[]>([]);
    const [dialects, setDialects] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const [levelsRes, dialectsRes] = await Promise.all([
                    adminService.getLevels().catch(() => ({ status: 'success', data: [] })),
                    adminService.getDialects().catch(() => ({ status: 'success', data: [] })),
                ]);
                const levelsData = levelsRes?.data || (Array.isArray(levelsRes) ? levelsRes : []);
                const dialectsData = dialectsRes?.data || (Array.isArray(dialectsRes) ? dialectsRes : []);
                setLevels(levelsData);
                setDialects(dialectsData);
            } catch {
                message.error('Lỗi khi tải danh sách Cấp Độ');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const getDialectDisplay = (record: any) => {
        if (record.dialect?.description) {
            return record.dialect.description;
        }
        if (record.dialect?.name) {
            return record.dialect.name;
        }
        const dId = record.dialectId || record.dialect?.id;
        const found = dialects.find((d: any) => d.id === dId);
        return found ? (found.description || found.name) : '—';
    };

    const columns = [
        {
            title: 'STT',
            key: 'stt',
            width: 60,
            align: 'center' as const,
            render: (_: any, __: any, index: number) => index + 1,
        },
        {
            title: 'Tên cấp độ',
            dataIndex: 'name',
            key: 'name',
            render: (v: string) => <span className="font-medium">{v}</span>
        },
        {
            title: 'Vùng miền',
            key: 'dialect',
            render: (_: any, record: any) => (
                <span className="text-blue-600 font-medium whitespace-normal" style={{ lineHeight: '1.4' }}>
                    {getDialectDisplay(record)}
                </span>
            ),
        },

        {
            title: 'Sao tối thiểu',
            dataIndex: 'minStarsRequired',
            key: 'minStarsRequired',
            width: 120,
            render: (v: number) => v != null ? `⭐ ${v}` : '—',
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
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
                    <h3 className="text-lg font-bold m-0">Danh sách cấp độ (Levels)</h3>
                    <p className="text-gray-400 text-xs mt-0.5">Chỉ xem — Educator là người tạo nội dung. Admin phê duyệt tại tab <strong>Chờ phê duyệt</strong>.</p>
                </div>
            </div>
            <Table
                columns={columns}
                dataSource={levels}
                rowKey="id"
                scroll={{ y: 'calc(100vh - 300px)' }}
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

export default LevelManagement;
