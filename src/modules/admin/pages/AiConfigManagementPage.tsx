import React, { useState, useEffect } from 'react'
import { Form, Input, message, Spin, Alert } from 'antd'
import { Cpu, Save, Loader2, Key } from 'lucide-react'
import { motion } from 'framer-motion'
import { fetchConfigsAPI, updateConfigsAPI } from '../../../services/systemConfigService'

const AiConfigManagementPage: React.FC = () => {
    const [aiForm] = Form.useForm()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // ─── Fetch configurations on mount ─────────────────────────────
    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setError(null)

        fetchConfigsAPI()
            .then((res: any) => {
                if (cancelled) return
                const configsList = res?.data?.data ?? res?.data ?? []
                const valuesMap: Record<string, string> = {}
                configsList.forEach((c: any) => {
                    valuesMap[c.configKey] = c.configValue || ''
                })
                aiForm.setFieldsValue(valuesMap)
            })
            .catch((err: any) => {
                if (cancelled) return
                const msg = err?.response?.data?.message || 'Không thể tải cấu hình AI.'
                setError(msg)
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => { cancelled = true }
    }, [])

    const handleUpdateConfigs = async (values: any) => {
        try {
            setSaving(true)
            await updateConfigsAPI(values)
            message.success('Cập nhật cấu hình AI thành công!')
        } catch (error: any) {
            const msg = error?.response?.data?.message || error.message || 'Cập nhật cấu hình AI thất bại.'
            message.error(msg)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#fbf6ef] font-nunito p-8 space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-10 bg-[#10b981] rounded-full shadow-[2px_2px_0_#1f293705]" />
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Cấu hình AI & Prompt</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Lưu trữ và tùy chỉnh Tokens, Mô hình, và câu lệnh Prompts hệ thống</p>
                    </div>
                </div>
            </div>

            <article className="w-full bg-white rounded-[2.5rem] border-[3.5px] border-slate-900 shadow-[10px_10px_0_#1f2937] overflow-hidden">
                <div className="p-8 lg:p-12">
                    <div className="flex items-center gap-4 border-b-[2px] border-slate-50 pb-6 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                            <Cpu size={24} strokeWidth={3} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Thông số AI & Chỉ thị Prompt</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tránh fix cứng các tham số AI giúp cập nhật an toàn và nhanh chóng</p>
                        </div>
                    </div>

                    {error && (
                        <Alert
                            message={<span className="text-xs font-black uppercase tracking-widest">Sự cố đồng bộ</span>}
                            description={<span className="text-[10px] font-bold italic">{error}</span>}
                            type="error"
                            showIcon
                            className="rounded-2xl border-[2px] border-red-200 mb-8"
                        />
                    )}

                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                            <Spin size="large" />
                            <span className="text-xs font-black uppercase text-slate-400 animate-pulse">Đang tải cấu hình AI...</span>
                        </div>
                    ) : (
                        <Form
                            form={aiForm}
                            layout="vertical"
                            onFinish={handleUpdateConfigs}
                            className="space-y-10"
                        >
                            {/* Section 1: API Configs */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                    <span className="text-[11px] font-black uppercase tracking-widest text-[#49B6E5]">Cấu hình Groq API & Mô hình</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Form.Item
                                        name="groq.api-key"
                                        label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Groq API Key</span>}
                                    >
                                        <Input.Password className="doodle-input" placeholder="gsk_..." prefix={<Key size={16} className="text-slate-300 mr-2" />} />
                                    </Form.Item>

                                    <Form.Item
                                        name="groq.endpoint"
                                        label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Groq Endpoint</span>}
                                    >
                                        <Input className="doodle-input" placeholder="https://api.groq.com/openai/v1/chat/completions" />
                                    </Form.Item>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Form.Item
                                        name="groq.model"
                                        label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Mô hình AI chính</span>}
                                    >
                                        <Input className="doodle-input" placeholder="llama-3.3-70b-versatile" />
                                    </Form.Item>

                                    <Form.Item
                                        name="groq.fallback-models"
                                        label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Mô hình fallback dự phòng</span>}
                                    >
                                        <Input className="doodle-input" placeholder="llama-3.3-70b-versatile,llama-3.1-8b-instant" />
                                    </Form.Item>
                                </div>
                            </div>

                            {/* Section 2: Prompts */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                    <span className="text-[11px] font-black uppercase tracking-widest text-[#49B6E5]">Cấu hình Prompts & Chỉ thị</span>
                                </div>

                                <div className="space-y-8">
                                    <Form.Item
                                        name="prompt.pronunciation-system-instruction"
                                        label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">System Instruction chấm điểm phát âm</span>}
                                    >
                                        <Input.TextArea className="doodle-input min-h-[120px] py-4" placeholder="Nhập chỉ thị hệ thống..." />
                                    </Form.Item>

                                    <Form.Item
                                        name="prompt.pronunciation-schema-instruction"
                                        label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Schema JSON đầu ra</span>}
                                    >
                                        <Input.TextArea className="doodle-input min-h-[100px] py-4" placeholder="Nhập định dạng schema JSON..." />
                                    </Form.Item>

                                    <Form.Item
                                        name="prompt.quiz-explanation"
                                        label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Mẫu giải thích câu hỏi bài kiểm tra</span>}
                                        extra={<span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-1">Các từ khóa hỗ trợ: &#123;status&#125;, &#123;timeoutDetail&#125;, &#123;question&#125;, &#123;selectedAnswer&#125;, &#123;correctAnswer&#125;, &#123;skillType&#125;, &#123;hearingDetail&#125;, &#123;correctDetail&#125;</span>}
                                    >
                                        <Input.TextArea className="doodle-input min-h-[140px] py-4" placeholder="Nhập template giải thích câu hỏi..." />
                                    </Form.Item>

                                    <Form.Item
                                        name="prompt.entry-test-feedback"
                                        label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Mẫu nhận xét đánh giá năng lực đầu vào</span>}
                                        extra={<span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-1">Từ khóa hỗ trợ: &#123;errorDetails&#125;</span>}
                                    >
                                        <Input.TextArea className="doodle-input min-h-[120px] py-4" placeholder="Nhập template nhận xét..." />
                                    </Form.Item>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-50 flex justify-end">
                                <motion.button
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={saving}
                                    className="h-14 px-10 bg-slate-900 border-[3px] border-slate-900 rounded-2xl shadow-[5px_5px_0_#10b981] text-xs font-black uppercase tracking-widest text-white transition-all flex items-center gap-3"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                    Lưu cấu hình AI
                                </motion.button>
                            </div>
                        </Form>
                    )}
                </div>
            </article>

            {/* Custom Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .doodle-input {
                    border: 2.5px solid #1f293720 !important; border-radius: 1.25rem !important;
                    font-weight: 700 !important; font-family: 'Nunito' !important;
                    transition: all 0.2s ease !important;
                }
                .doodle-input:focus, .doodle-input:hover { border-color: #10b981 !important; box-shadow: none !important; }
                input.doodle-input { height: 54px; }
                
                .ant-input-password .ant-input-suffix { font-size: 18px; color: #94a3b8; }
                .ant-input-password-icon { color: #94a3b8 !important; }
                
                .ant-form-item-label label { margin-bottom: 4px !important; }
                .ant-form-item-explain-error { font-size: 10px; font-weight: 800; text-transform: uppercase; margin-top: 4px; }
            `}} />
        </div>
    )
}

export default AiConfigManagementPage
