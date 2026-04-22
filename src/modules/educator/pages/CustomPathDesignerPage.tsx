import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Button, Card, Typography,
    Input, message, Spin, Tag, Empty
} from 'antd';
import {
    SearchOutlined,
    BookOutlined, RocketOutlined, CompassOutlined,
    CheckCircleFilled
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { customPathService, type PathLevel } from '../services/customPathService';
import { Layout, ChevronLeft, Save, Map } from 'lucide-react';
import clsx from 'clsx';

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

    if (loading) return (
        <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
            <Spin size="large" />
            <Text className="font-bold text-gray-400 animate-pulse">Đang tải bản đồ kiến thức...</Text>
        </div>
    );

    return (
        <div className="flex flex-col gap-8 -mt-2">
            {/* ── Breadcrumbs & UI ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-purple-600 text-[10px] font-black uppercase tracking-[0.35em] mb-2">
                        <Map size={14} /> Knowledge Map Designer
                    </div>
                    <Title level={2} className="!m-0 !font-black !text-gray-800 tracking-tight text-3xl">Thiết kế lộ trình riêng</Title>
                    <Paragraph className="!mb-0 text-gray-400 font-medium text-xs mt-1">
                        Cá nhân hóa trải nghiệm học tập bằng cách chọn các học phần phù hợp nhất.
                    </Paragraph>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        icon={<ChevronLeft size={18} />}
                        onClick={() => navigate('/educator/design-path')}
                        className="h-12 px-6 rounded-2xl font-bold border-gray-100 shadow-sm hover:border-purple-200 transition-all flex items-center gap-2"
                    >
                        Quay lại
                    </Button>
                    <Button
                        type="primary"
                        icon={<Save size={18} />}
                        loading={submitting}
                        onClick={handleSave}
                        className="h-12 px-8 rounded-2xl font-black border-none bg-gradient-to-r from-purple-600 to-purple-500 shadow-xl shadow-purple-500/20 hover:scale-[1.02] transition-transform flex items-center gap-2"
                    >
                        Phát hành lộ trình
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* ── Left Sidebar Settings ── */}
                <div className="lg:col-span-4 space-y-6">
                    <Card
                        className="rounded-[2rem] border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden"
                        title={<div className="flex items-center gap-2 py-1"><Layout size={18} className="text-purple-500" /> <span className="font-black text-gray-800">Cấu hình lộ trình</span></div>}
                    >
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Tiêu đề hiển thị</label>
                                <Input
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="rounded-xl h-12 border-gray-100 font-bold text-gray-700 focus:border-purple-300"
                                    placeholder="Vd: Luyện âm vực cao..."
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Mô tả định hướng</label>
                                <Input.TextArea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="rounded-2xl border-gray-100 font-medium text-gray-600 focus:border-purple-300"
                                    rows={5}
                                    placeholder="Giải thích lý do học viên cần lộ trình này..."
                                />
                            </div>
                        </div>
                    </Card>

                    <motion.div
                        layout
                        className="bg-gradient-to-br from-purple-700 to-purple-600 rounded-[2rem] p-8 text-white shadow-2xl shadow-purple-500/20 relative overflow-hidden"
                    >
                        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <Title level={4} className="!text-white !font-black !m-0">Đã chọn ({selectedLevelIds.length})</Title>
                                <RocketOutlined className="text-2xl opacity-50" />
                            </div>
                            <Paragraph className="text-purple-100 text-xs font-medium mb-6 opacity-80 leading-relaxed">
                                Các học phần đã chọn sẽ được ưu tiên hiển thị trên giao diện của học viên sau khi bạn nhấn Lưu.
                            </Paragraph>

                            <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                                <AnimatePresence>
                                    {selectedLevelIds.map(id => {
                                        const l = allLevels.find(level => level.levelId === id);
                                        return (
                                            <motion.div
                                                key={id}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                            >
                                                <Tag
                                                    closable
                                                    onClose={() => toggleLevel(id)}
                                                    className="bg-white/20 border-none text-white font-black rounded-lg py-1 px-3 text-[10px] flex items-center gap-1"
                                                >
                                                    {l?.levelName}
                                                </Tag>
                                            </motion.div>
                                        );
                                    })}
                                    {selectedLevelIds.length === 0 && (
                                        <div className="text-[10px] font-black uppercase text-white/40 italic py-4">Chưa có học phần nào</div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ── Right Content Chapter Selection ── */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-50 flex items-center gap-4">
                        <Input
                            prefix={<SearchOutlined className="text-gray-400 mr-2" />}
                            placeholder="Tìm kiếm theo tên chương, vùng miền hoặc kiến thức..."
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            className="h-12 border-none bg-slate-50 rounded-2xl font-medium focus:ring-0 shadow-none"
                            allowClear
                        />
                        <div className="flex items-center gap-2 px-4 border-l border-slate-100 text-purple-600">
                            <CompassOutlined className="text-xl" />
                            <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Global Map</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredLevels.map((level, i) => {
                            const isSelected = selectedLevelIds.includes(level.levelId);
                            return (
                                <motion.div
                                    key={level.levelId}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    onClick={() => toggleLevel(level.levelId)}
                                    className="cursor-pointer group"
                                >
                                    <div className={clsx(
                                        "p-6 rounded-[2rem] border-2 transition-all duration-500 relative overflow-hidden",
                                        isSelected
                                            ? "bg-gradient-to-br from-white to-purple-50/50 border-purple-500 shadow-xl shadow-purple-500/10"
                                            : "bg-white border-white hover:border-purple-200 shadow-sm"
                                    )}>
                                        {isSelected && (
                                            <div className="absolute top-4 right-4 text-purple-600 animate-in zoom-in-0 duration-300">
                                                <CheckCircleFilled className="text-xl" />
                                            </div>
                                        )}

                                        <div className="flex items-center gap-5 relative z-10">
                                            <div className={clsx(
                                                "w-16 h-16 rounded-3xl flex items-center justify-center text-2xl transition-all duration-500 group-hover:scale-110",
                                                isSelected ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30" : "bg-slate-100 text-slate-400"
                                            )}>
                                                <BookOutlined />
                                            </div>
                                            <div>
                                                <div className={clsx(
                                                    "font-black text-lg tracking-tight mb-1 transition-colors",
                                                    isSelected ? "text-purple-800" : "text-gray-800"
                                                )}>
                                                    {level.levelName}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Tag className="rounded-lg border-none bg-slate-100 text-slate-500 font-black text-[9px] uppercase px-2">
                                                        {level.region}
                                                    </Tag>
                                                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest italic">Unit {i + 1}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {filteredLevels.length === 0 && (
                        <div className="py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
                            <Empty description={<span className="text-gray-400 font-bold italic">Không tìm thấy chương nào khớp với tiêu chí của bạn</span>} />
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default CustomPathDesignerPage;
