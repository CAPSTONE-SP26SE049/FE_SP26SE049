import React from 'react';
import { Card, Empty, Typography } from 'antd';

const SettingsPage: React.FC = () => {
    return (
        <Card className="rounded-2xl shadow-sm border border-slate-100">
            <Typography.Title level={3} className="!mb-2">Cài đặt</Typography.Title>
            <Typography.Paragraph type="secondary">
                Cấu hình tài khoản, giao diện và thiết lập riêng cho giáo viên.
            </Typography.Paragraph>
            <Empty description="Nội dung cài đặt sẽ hiển thị ở đây" />
        </Card>
    );
};

export default SettingsPage;
