import React from 'react';
import { Typography, Card, Empty } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';

const { Title } = Typography;

const ChallengeBankPage: React.FC = () => {
    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <DatabaseOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                <Title level={2} style={{ margin: 0 }}>Ngân hàng thử thách</Title>
            </div>

            <Card>
                <Empty
                    description="Tính năng Ngân hàng thử thách đang được phát triển"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                    <p style={{ color: '#8c8c8c' }}>
                        Tại đây, giáo vụ có thể quản lý, tạo mới và chỉnh sửa các thử thách (từ, câu, đoạn văn) cho hệ thống.
                    </p>
                </Empty>
            </Card>
        </div>
    );
};

export default ChallengeBankPage;
