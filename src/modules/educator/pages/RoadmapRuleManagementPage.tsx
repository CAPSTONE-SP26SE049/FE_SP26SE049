import React, { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Button, Table, Space, Popconfirm, message, Modal, Tag, Card, Select } from 'antd';
import { Plus, Trash2, Edit3, Save, RotateCcw, Map, Award, TrendingUp, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { roadmapRuleService, type RoadmapRule } from '../services/roadmapRuleService';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

const RoadmapRuleManagementPage: React.FC = () => {
    const navigate = useNavigate();
    const [rules, setRules] = useState<RoadmapRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingRule, setEditingRule] = useState<RoadmapRule | null>(null);
    const [form] = Form.useForm();

    const fetchRules = async () => {
        setLoading(true);
        try {
            const res = await roadmapRuleService.getAllRules();
            setRules(res.data?.data || []);
        } catch (err) {
            message.error('Không thể tải danh sách quy tắc');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const handleSave = async (values: any) => {
        try {
            const payload: RoadmapRule = {
                ...editingRule,
                ...values,
                difficulties: values.difficulties.join(','),
                isActive: true
            };
            await roadmapRuleService.saveRule(payload);
            message.success(editingRule ? 'Cập nhật quy tắc thành công' : 'Thêm quy tắc mới thành công');
            setModalVisible(false);
            fetchRules();
        } catch (err) {
            message.error('Lỗi khi lưu quy tắc');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await roadmapRuleService.deleteRule(id);
            message.success('Đã xóa quy tắc');
            fetchRules();
        } catch (err) {
            message.error('Lỗi khi xóa quy tắc');
        }
    };

    const handleReset = async () => {
        try {
            await roadmapRuleService.resetToDefault();
            message.success('Đã đặt lại quy tắc mặc định');
            fetchRules();
        } catch (err) {
            message.error('Lỗi khi đặt lại quy tắc');
        }
    };

    const columns = [
        {
            title: 'KHOẢNG ĐIỂM (%)',
            key: 'range',
            render: (_: any, record: RoadmapRule) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border-[2px] border-slate-900 flex items-center justify-center text-slate-900 font-black shadow-[2px_2px_0_#1f2937]">
                        {record.minPercent}
                    </div>
                    <span className="text-slate-300 font-black">→</span>
                    <div className="w-10 h-10 rounded-xl bg-[#49B6E5] border-[2px] border-slate-900 flex items-center justify-center text-white font-black shadow-[2px_2px_0_#1f2937]">
                        {record.maxPercent}
                    </div>
                </div>
            ),
        },
        {
            title: 'CẤP ĐỘ GÁN CHO LỘ TRÌNH',
            dataIndex: 'difficulties',
            key: 'difficulties',
            render: (text: string) => (
                <div className="flex flex-wrap gap-2">
                    {text.split(',').map((diff, i) => (
                        <Tag 
                            key={i} 
                            className="m-0 px-3 py-1 rounded-lg border-[2px] border-slate-900 bg-white font-black text-[10px] uppercase tracking-widest text-slate-700 shadow-[2px_2px_0_#1f293710]"
                        >
                            {diff.trim()}
                        </Tag>
                    ))}
                </div>
            ),
        },
        {
            title: 'THAO TÁC',
            key: 'action',
            render: (_: any, record: RoadmapRule) => (
                <Space size="middle">
                    <button
                        onClick={() => {
                            setEditingRule(record);
                            form.setFieldsValue({
                                ...record,
                                difficulties: record.difficulties.split(',').map(d => d.trim())
                            });
                            setModalVisible(true);
                        }}
                        className="p-2 rounded-xl border-[2px] border-slate-900 bg-white text-slate-600 hover:text-[#49B6E5] hover:bg-slate-50 transition-all shadow-[2px_2px_0_#1f293710] hover:shadow-[3px_3px_0_#49B6E5]"
                    >
                        <Edit3 size={18} strokeWidth={3} />
                    </button>
                    <Popconfirm title="Bạn có chắc chắn muốn xóa?" onConfirm={() => handleDelete(record.id!)}>
                        <button className="p-2 rounded-xl border-[2px] border-slate-900 bg-white text-slate-600 hover:text-red-500 hover:bg-slate-50 transition-all shadow-[2px_2px_0_#1f293710] hover:shadow-[3px_3px_0_#ef4444]">
                            <Trash2 size={18} strokeWidth={3} />
                        </button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="space-y-8 pb-10 font-nunito">
            {/* Header Section */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-6 bg-[#49B6E5] rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#49B6E5]">Roadmap Algorithm Config</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Cấu hình lộ trình cá nhân</h1>
                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">
                        Thiết lập quy tắc <span className="text-slate-900">phân bổ cấp độ học</span> dựa trên % độ chính xác của bài test
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleReset}
                        className="h-12 px-6 rounded-2xl border-[3px] border-slate-900 bg-white font-black text-xs uppercase tracking-widest text-slate-600 shadow-[4px_4px_0_#1f2937] hover:-translate-y-1 hover:shadow-[6px_6px_0_#1f2937] transition-all flex items-center gap-2"
                    >
                        <RotateCcw size={18} strokeWidth={3} /> Đặt lại mặc định
                    </button>
                    <button
                        onClick={() => {
                            setEditingRule(null);
                            form.resetFields();
                            setModalVisible(true);
                        }}
                        className="h-12 px-8 rounded-2xl border-[3px] border-slate-900 bg-[#49B6E5] font-black text-xs uppercase tracking-widest text-white shadow-[4px_4px_0_#1f2937] hover:-translate-y-1 hover:shadow-[6px_6px_0_#1f2937] transition-all flex items-center gap-2"
                    >
                        <Plus size={18} strokeWidth={3} /> Thêm quy tắc
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Stats Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="rounded-[2.5rem] border-[3px] border-slate-900 shadow-[10px_10px_0_#1f2937] overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <TrendingUp size={120} strokeWidth={3} />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-3">
                                <Award className="text-[#49B6E5]" size={24} strokeWidth={3} />
                                <h3 className="text-xl font-black uppercase tracking-tight">Thuật toán phân bổ</h3>
                            </div>
                            <p className="text-[11px] font-bold text-slate-500 italic leading-relaxed">
                                Hệ thống sẽ tính toán độ chính xác phát âm của từng "nhóm lỗi" (L/N, TR/CH,...) 
                                và đối chiếu với các quy tắc bên cạnh để chọn ra các cấp độ học phù hợp.
                            </p>
                            <div className="space-y-3">
                                <div className="p-4 rounded-2xl bg-slate-50 border-[2px] border-slate-900/5">
                                    <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Cấp độ ưu tiên</div>
                                    <div className="text-sm font-black text-slate-800">Beginner → Advanced</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 border-[2px] border-slate-900/5">
                                    <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Đơn vị đo lường</div>
                                    <div className="text-sm font-black text-slate-800">Phần trăm chính xác (%)</div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="bg-[#49B6E5] rounded-[2.5rem] border-[3px] border-slate-900 p-8 text-white shadow-[10px_10px_0_#1f2937] relative overflow-hidden">
                        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                        <h3 className="text-xl font-black uppercase tracking-tight mb-4 flex items-center gap-3">
                             <Map size={24} strokeWidth={3} /> Roadmap Tips
                        </h3>
                        <p className="text-white/80 text-[11px] font-bold italic leading-relaxed">
                            Nên thiết lập các khoảng điểm bao phủ từ 0 đến 100% để đảm bảo tất cả học viên đều nhận được lộ trình phù hợp.
                        </p>
                    </div>
                </div>

                {/* Main Table Area */}
                <div className="lg:col-span-8 bg-white rounded-[3rem] border-[3px] border-slate-900 shadow-[12px_12px_0_#1f293710] overflow-hidden">
                    <Table 
                        dataSource={rules} 
                        columns={columns} 
                        loading={loading}
                        rowKey="id"
                        pagination={false}
                        className="custom-premium-table"
                    />
                    {rules.length === 0 && !loading && (
                        <div className="py-20 text-center flex flex-col items-center">
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs italic">Chưa có quy tắc nào được thiết lập</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Rule Modal */}
            <Modal
                title={null}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={500}
                centered
                className="premium-modal"
            >
                <div className="p-2">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-[#49B6E5] border-[2.5px] border-slate-900 shadow-[3px_3px_0_#1f2937] flex items-center justify-center text-white">
                            <Plus size={20} strokeWidth={3} />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                            {editingRule ? 'Cập nhật quy tắc' : 'Thêm quy tắc mới'}
                        </h2>
                    </div>

                    <Form form={form} layout="vertical" onFinish={handleSave} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <Form.Item 
                                name="minPercent" 
                                label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">% Tối thiểu</span>}
                                rules={[{ required: true }]}
                            >
                                <InputNumber min={0} max={100} className="w-full premium-input-number" placeholder="0" />
                            </Form.Item>
                            <Form.Item 
                                name="maxPercent" 
                                label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">% Tối đa</span>}
                                rules={[{ required: true }]}
                            >
                                <InputNumber min={0} max={100} className="w-full premium-input-number" placeholder="100" />
                            </Form.Item>
                        </div>

                        <Form.Item 
                            name="difficulties" 
                            label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Danh sách cấp độ</span>}
                            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một cấp độ' }]}
                        >
                            <Select 
                                mode="multiple"
                                className="premium-select"
                                placeholder="Chọn các cấp độ"
                                options={[
                                    { label: 'BEGINNER', value: 'BEGINNER' },
                                    { label: 'INTERMEDIATE', value: 'INTERMEDIATE' },
                                    { label: 'ADVANCED', value: 'ADVANCED' },
                                ]}
                            />
                        </Form.Item>

                        <div className="pt-4 flex gap-4">
                            <button
                                type="button"
                                onClick={() => setModalVisible(false)}
                                className="flex-1 h-14 rounded-2xl border-[3px] border-slate-900 bg-white font-black text-xs uppercase tracking-widest text-slate-600 shadow-[4px_4px_0_#1f2937] hover:bg-slate-50 transition-all"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                className="flex-1 h-14 rounded-2xl border-[3px] border-slate-900 bg-[#49B6E5] font-black text-xs uppercase tracking-widest text-white shadow-[4px_4px_0_#1f2937] hover:-translate-y-1 hover:shadow-[6px_6px_0_#1f2937] transition-all flex items-center justify-center gap-2"
                            >
                                <Save size={18} strokeWidth={3} /> Lưu quy tắc
                            </button>
                        </div>
                    </Form>
                </div>
            </Modal>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-premium-table .ant-table-thead > tr > th {
                    background: #f8fafc !important;
                    font-family: 'Nunito', sans-serif !important;
                    font-weight: 900 !important;
                    font-size: 10px !important;
                    letter-spacing: 0.1em !important;
                    text-transform: uppercase !important;
                    color: #94a3b8 !important;
                    border-bottom: 3px solid #1f293705 !important;
                    padding: 24px !important;
                }
                .custom-premium-table .ant-table-tbody > tr > td {
                    padding: 24px !important;
                    border-bottom: 2px solid #1f293705 !important;
                    font-weight: 700 !important;
                }
                .premium-input {
                    height: 54px !important;
                    border: 3px solid #1f293710 !important;
                    border-radius: 1rem !important;
                    font-weight: 900 !important;
                }
                .premium-input-number {
                    height: 54px !important;
                    border: 3px solid #1f293710 !important;
                    border-radius: 1rem !important;
                    display: flex !important;
                    align-items: center !important;
                }
                .premium-input-number input {
                    height: 100% !important;
                    font-weight: 900 !important;
                }
                .premium-modal .ant-modal-content {
                    border-radius: 2.5rem !important;
                    border: 3px solid #1f2937 !important;
                    box-shadow: 15px 15px 0 #1f293710 !important;
                }
            `}} />
        </div>
    );
};

export default RoadmapRuleManagementPage;
