import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Button, Card, Checkbox, List, Typography, Space,
    Breadcrumb, Input, message, Spin, Tag, Empty, Modal
} from 'antd';
import {
    SaveOutlined, ArrowLeftOutlined, SearchOutlined,
    BookOutlined, RocketOutlined, CompassOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { customPathService, type PathLevel } from '../services/customPathService';

const { Title, Text, Paragraph } = Typography;

const CustomPathDesignerPage: React.FC = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [allLevels, setAllLevels] = useState<PathLevel[]>([]);
    const [selectedLevelIds, setSelectedLevelIds] = useState<string[]>([]);
    const [searchText, setSearchText] = useState('');

    const [title, setTitle] = useState('Lộ trình học tập cá nhân');
    const [description, setDescription] = useState('Lộ trình được thiết kế riêng nhằm cải thiện các kỹ năng còn yếu.');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [levelsRes, currentPathRes] = await Promise.all([
                    customPathService.getAllLevels(),
                    customPathService.getStudentCustomPath(studentId!).catch(() => ({ data: null }))
                ]);

                setAllLevels(levelsRes.data || []);

                if (currentPathRes?.data) {
                    setTitle(currentPathRes.data.title);
                    setDescription(currentPathRes.data.description);
                    setSelectedLevelIds(currentPathRes.data.levels.map((l: any) => l.levelId));
                }
            } catch (err) {
                message.error('Không thể tải dữ liệu');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [studentId]);

    const handleSave = async () => {
        if (selectedLevelIds.length === 0) {
            message.warning('Vui lòng chọn ít nhất một chương');
            return;
        }

        setSubmitting(true);
        try {
            await customPathService.createCustomPath(studentId!, {
                title,
                description,
                levelIds: selectedLevelIds
            });
            message.success('Đã lưu lộ trình thành công!');
            navigate('/educator/design-path');
        } catch (err) {
            message.error('Lỗi khi lưu lộ trình');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredLevels = (allLevels || []).filter(l => {
        const name = (l.levelName || '').toLowerCase();
        const region = (l.region || '').toLowerCase();
        const search = searchText.toLowerCase();
        return name.includes(search) || region.includes(search);
    });

    const toggleLevel = (id: string) => {
        setSelectedLevelIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Spin size="large" /></div>;

    return (
        <div className="p-6 min-h-screen bg-gray-50/50">
            <Breadcrumb className="mb-6">
                <Breadcrumb.Item onClick={() => navigate('/educator/design-path')} className="cursor-pointer">Chọn học viên</Breadcrumb.Item>
                <Breadcrumb.Item>Thiết kế lộ trình</Breadcrumb.Item>
            </Breadcrumb>

            <div className="flex items-center justify-between mb-8">
                <Space direction="vertical" size={0}>
                    <Title level={2} className="!m-0 !font-black !text-slate-800">Cá nhân hóa lộ trình</Title>
                    <Text type="secondary">Thiết kế các chương học phù hợp nhất cho học viên này.</Text>
                </Space>
                <Space>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/educator/design-path')} className="rounded-xl h-10">Hủy bỏ</Button>
                    <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        loading={submitting}
                        onClick={handleSave}
                        className="rounded-xl h-10 border-none shadow-lg shadow-purple-200"
                        style={{ background: 'linear-gradient(135deg, #9333ea, #7e22ce)' }}
                    >
                        Lưu lộ trình
                    </Button>
                </Space>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Settings */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="rounded-2xl border-none shadow-sm" title={<span className="font-bold">Thông tin lộ trình</span>}>
                        <div className="space-y-4">
                            <div>
                                <Text strong className="text-gray-500 text-xs uppercase uppercase tracking-wider block mb-2">Tên lộ trình</Text>
                                <Input value={title} onChange={e => setTitle(e.target.value)} className="rounded-xl h-11" placeholder="Nhập tên lộ trình..." />
                            </div>
                            <div>
                                <Text strong className="text-gray-500 text-xs uppercase tracking-wider block mb-2">Mô tả mục tiêu</Text>
                                <Input.TextArea value={description} onChange={e => setDescription(e.target.value)} className="rounded-xl" rows={4} placeholder="Mục tiêu của lộ trình này là gì?" />
                            </div>
                        </div>
                    </Card>

                    <Card className="rounded-2xl border-none shadow-sm bg-purple-600 text-white overflow-hidden relative">
                        <div className="relative z-10">
                            <Title level={4} className="!text-white !font-bold mb-2">Đã chọn ({selectedLevelIds.length})</Title>
                            <Paragraph className="text-purple-100 mb-4">Các chương này sẽ xuất hiện trong bản đồ lộ trình của học viên.</Paragraph>
                            <div className="flex flex-wrap gap-2">
                                {selectedLevelIds.map(id => {
                                    const l = allLevels.find(level => level.levelId === id);
                                    return (
                                        <Tag key={id} closable onClose={() => toggleLevel(id)} className="bg-white/20 border-none text-white font-bold rounded-lg py-1 px-3">
                                            {l?.levelName}
                                        </Tag>
                                    );
                                })}
                            </div>
                        </div>
                        <RocketOutlined className="absolute -bottom-4 -right-4 text-white/10 text-9xl rotate-12" />
                    </Card>
                </div>

                {/* Right: Chapter Selection */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                        <Input
                            prefix={<SearchOutlined className="text-gray-300" />}
                            placeholder="Tìm kiếm chương hoặc vùng miền..."
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            className="border-none focus:ring-0 shadow-none flex-grow"
                        />
                        <CompassOutlined className="text-purple-400 text-xl mr-2" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredLevels.map((level, i) => {
                            const isSelected = selectedLevelIds.includes(level.levelId);
                            return (
                                <motion.div
                                    key={level.levelId}
                                    whileHover={{ y: -4 }}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => toggleLevel(level.levelId)}
                                >
                                    <Card
                                        className={`rounded-2xl cursor-pointer transition-all border-2 ${isSelected ? 'border-purple-500 bg-purple-50/30' : 'border-white hover:border-purple-200'}`}
                                        bodyStyle={{ padding: '20px' }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                    <BookOutlined />
                                                </div>
                                                <div>
                                                    <div className={`font-black text-lg ${isSelected ? 'text-purple-700' : 'text-slate-700'}`}>{level.levelName}</div>
                                                    <Tag className="rounded-md border-none bg-slate-100 text-slate-500 font-bold text-[10px] uppercase">{level.region}</Tag>
                                                </div>
                                            </div>
                                            <Checkbox checked={isSelected} className="custom-checkbox" />
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })}
                        {filteredLevels.length === 0 && (
                            <div className="col-span-2">
                                <Empty description="Không tìm thấy chương nào khớp với tìm kiếm" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomPathDesignerPage;
