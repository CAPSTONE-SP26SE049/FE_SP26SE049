import React, { useState, useEffect } from 'react'
import { Form, Input, message, Spin, Alert, Tooltip } from 'antd'
import { Cpu, Save, Loader2, Key, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { fetchConfigsAPI, updateConfigsAPI, fetchErrorTagsAPI } from '../../../services/systemConfigService'

const AiConfigManagementPage: React.FC = () => {
    const [aiForm] = Form.useForm()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [errorTags, setErrorTags] = useState<any[]>([])
    const [isDraggingOver, setIsDraggingOver] = useState(false)

    // ─── Fetch configurations & error tags on mount ─────────────────────────────
    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setError(null)

        // Fetch configs
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

        // Fetch error tags
        fetchErrorTagsAPI()
            .then((res: any) => {
                if (cancelled) return
                const list = res?.data?.data ?? res?.data ?? []
                setErrorTags(list)
            })
            .catch(err => {
                console.error('Failed to fetch error tags:', err)
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

    const handleInsertTag = (tagCode: string) => {
        const textarea = document.getElementById('pronunciation-system-instruction') as HTMLTextAreaElement
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const text = textarea.value
        const before = text.substring(0, start)
        const after = text.substring(end, text.length)
        
        const newValue = before + tagCode + after
        aiForm.setFieldsValue({
            'prompt.pronunciation-system-instruction': newValue
        })
        
        // Restore focus and selection
        setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(start + tagCode.length, start + tagCode.length)
        }, 10)
    }

    const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
        e.preventDefault()
        setIsDraggingOver(false)
        const tagCode = e.dataTransfer.getData('text/plain')
        if (!tagCode) return

        const textarea = e.currentTarget
        let insertPos = textarea.selectionStart

        // Drag coordinates character offset detection
        const documentObj = document as any
        if (documentObj.caretRangeFromPoint) {
            const range = documentObj.caretRangeFromPoint(e.clientX, e.clientY)
            if (range && range.startContainer === textarea.firstChild) {
                insertPos = range.startOffset
            }
        } else if (documentObj.caretPositionFromPoint) {
            const position = documentObj.caretPositionFromPoint(e.clientX, e.clientY)
            if (position && position.offsetNode === textarea.firstChild) {
                insertPos = position.offset
            }
        }

        const text = textarea.value
        const before = text.substring(0, insertPos)
        const after = text.substring(insertPos, text.length)
        const newValue = before + tagCode + after

        aiForm.setFieldsValue({
            'prompt.pronunciation-system-instruction': newValue
        })

        // Restore focus and position selection range
        setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(insertPos + tagCode.length, insertPos + tagCode.length)
        }, 10)
    }

    const handleProposePrompt = () => {
        if (errorTags.length === 0) {
            message.warning('Không tìm thấy tag lỗi nào từ database để sinh mẫu.')
            return
        }

        const tagsText = errorTags
            .map(t => `- Lỗi ${t.name} (Mã lỗi: ${t.tagCode})`)
            .join('\n')

        const proposedPrompt = `Bạn là chuyên gia phân tích phát âm tiếng Việt. QUAN TRỌNG: rawText là những gì người học THỰC SỰ ĐÃ NÓI (do ASR nhận diện). targetText là từ/câu CHUẨN mà người học CẦN phát âm đúng. Nhiệm vụ: đánh giá xem người học có phát âm đúng targetText không, dựa trên rawText. Nếu rawText khác targetText, hãy giải thích người học đã nói sai chỗ nào so với targetText.

Hệ thống hỗ trợ chẩn đoán các lỗi phát âm/vùng miền sau:
${tagsText}

Hãy ưu tiên đối chiếu phát hiện lỗi xem người học có mắc phải lỗi nào trong danh sách trên hay không. Không được trả lời chung chung, không được lặp lại nguyên văn targetText, và không được dùng câu ngắn kiểu 'Phát âm chưa chính xác' nếu chưa giải thích vì sao.`

        aiForm.setFieldsValue({
            'prompt.pronunciation-system-instruction': proposedPrompt
        })
        message.success('Đã đề xuất chỉ thị prompt chuẩn theo danh sách tag từ cơ sở dữ liệu!')
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
                                        label={
                                            <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-2">
                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">System Instruction chấm điểm phát âm</span>
                                                <button
                                                    type="button"
                                                    onClick={handleProposePrompt}
                                                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                                                >
                                                    <Sparkles size={12} />
                                                    Đề xuất Prompt theo DB
                                                </button>
                                            </div>
                                        }
                                         extra={
                                             <div className="mt-3 space-y-2">
                                                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                                                     Nhấn hoặc Kéo thả các thẻ lỗi bên dưới để chèn Tag Code vào vị trí con trỏ:
                                                 </span>
                                                 <div className="flex flex-wrap gap-2">
                                                     {/* Utility 1: Placeholder tag */}
                                                     <Tooltip title="Chèn mã tự động {availableErrorTags} để hệ thống tự động tải và thay thế bằng danh sách lỗi từ cơ sở dữ liệu khi gửi prompt">
                                                         <span
                                                             draggable
                                                             onDragStart={(e) => e.dataTransfer.setData('text/plain', '{availableErrorTags}')}
                                                             onClick={() => handleInsertTag('{availableErrorTags}')}
                                                             className="cursor-pointer select-none bg-sky-50 hover:bg-sky-100 hover:text-sky-600 hover:border-sky-400 border-[2px] border-sky-300 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wide text-sky-700 transition-all shadow-[2px_2px_0_#0000000d] active:translate-y-px"
                                                         >
                                                             Tự động tải danh sách lỗi
                                                         </span>
                                                     </Tooltip>

                                                     {/* Utility 2: Comma-separated tags */}
                                                     {errorTags.length > 0 && (
                                                         <Tooltip title="Chèn toàn bộ các mã lỗi đang có trong hệ thống dưới dạng chữ cách nhau bởi dấu phẩy">
                                                             <span
                                                                 draggable
                                                                 onDragStart={(e) => e.dataTransfer.setData('text/plain', errorTags.map(t => t.tagCode).filter(Boolean).join(', '))}
                                                                 onClick={() => handleInsertTag(errorTags.map(t => t.tagCode).filter(Boolean).join(', '))}
                                                                 className="cursor-pointer select-none bg-violet-50 hover:bg-violet-100 hover:text-violet-600 hover:border-violet-400 border-[2px] border-violet-300 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wide text-violet-700 transition-all shadow-[2px_2px_0_#0000000d] active:translate-y-px"
                                                             >
                                                                 Chèn tất cả mã lỗi hiện có
                                                             </span>
                                                         </Tooltip>
                                                     )}

                                                     {/* Dynamic Tags */}
                                                     {errorTags.map(tag => (
                                                         <Tooltip key={tag.id} title={`${tag.name}: ${tag.description || 'Chưa có mô tả'}`}>
                                                             <span
                                                                 draggable
                                                                 onDragStart={(e) => e.dataTransfer.setData('text/plain', tag.tagCode)}
                                                                 onClick={() => handleInsertTag(tag.tagCode)}
                                                                 className="cursor-pointer select-none bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 border-[2px] border-slate-200 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wide text-slate-700 transition-all shadow-[2px_2px_0_#0000000d] hover:shadow-[2px_2px_0_#10b98133] active:translate-y-px"
                                                             >
                                                                 {tag.name} ({tag.tagCode})
                                                             </span>
                                                         </Tooltip>
                                                     ))}
                                                     {errorTags.length === 0 && (
                                                         <span className="text-[9px] font-bold text-slate-300 uppercase italic">
                                                             Đang tải tag lỗi từ database...
                                                         </span>
                                                     )}
                                                 </div>
                                             </div>
                                         }
                                     >
                                         <Input.TextArea
                                             id="pronunciation-system-instruction"
                                             className={`doodle-input min-h-[140px] py-4 transition-all duration-200 ${
                                                 isDraggingOver 
                                                     ? 'border-[#10b981] border-dashed shadow-[0_0_0_4px_#10b98122] bg-emerald-50/20' 
                                                     : ''
                                             }`}
                                             placeholder="Nhập chỉ thị hệ thống..."
                                             onDragOver={(e) => {
                                                 e.preventDefault()
                                                 setIsDraggingOver(true)
                                             }}
                                             onDragLeave={() => setIsDraggingOver(false)}
                                             onDrop={handleDrop}
                                         />
                                     </Form.Item>

                                    <Form.Item
                                        name="prompt.pronunciation-schema-instruction"
                                        label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Schema JSON đầu ra</span>}
                                    >
                                        <Input.TextArea className="doodle-input min-h-[100px] py-4" placeholder="Nhập định dạng schema JSON..." />
                                    </Form.Item>

                                    <Form.Item
                                        name="prompt.quiz-explanation"
                                        label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Template Giải thích câu hỏi Quiz (Quiz Explanation)</span>}
                                        extra={<span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-1">Các từ khóa hỗ trợ: &#123;status&#125;, &#123;timeoutDetail&#125;, &#123;question&#125;, &#123;selectedAnswer&#125;, &#123;correctAnswer&#125;, &#123;skillType&#125;, &#123;hearingDetail&#125;, &#123;correctDetail&#125;</span>}
                                    >
                                        <Input.TextArea className="doodle-input min-h-[140px] py-4" placeholder="Nhập template giải thích câu hỏi..." />
                                    </Form.Item>

                                    <Form.Item
                                        name="prompt.entry-test-feedback"
                                        label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Template nhận xét Đánh giá năng lực đầu vào (Entry Test Feedback)</span>}
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
