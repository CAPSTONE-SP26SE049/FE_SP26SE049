import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    CheckCircleFilled,
    CloseCircleFilled,
    AudioOutlined,
    ThunderboltFilled,
    LoadingOutlined,
    StarFilled,
    ArrowRightOutlined
} from '@ant-design/icons'
import { Spin, Button, Progress, message } from 'antd'

import apiClient from '../../../services/apiClient'
import { useAuth } from '../../../core/auth/AuthContext'
import { useAudioRecorder } from '../../../hooks/useAudioRecorder'
import { ASR_BASE_URL } from '../../../config'
import { Globe, Play, ChevronRight, MapPin, Sparkles } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────
// Region metadata match RoadmapPage
// ─────────────────────────────────────────────────────────────────────
const DIALECT_META: Record<string, {
    viName: string;
    tagline: string;
    emoji: string;
    description: string;
    photo: string;
    gradient: string;
    accent: string;
    color: string;
}> = {
    NORTH: {
        viName: 'Miền Bắc',
        tagline: 'Thanh lịch & Chuẩn mực',
        emoji: '',
        description: 'Chinh phục phát âm chuẩn — nền tảng của tiếng Việt quy chuẩn.',
        photo: '/region_mien_bac.png',
        gradient: 'from-[#49B6E5]/90 to-blue-500/90',
        color: '#49B6E5',
        accent: '#6ecbf2',
    },
    CENTRAL: {
        viName: 'Miền Trung',
        tagline: 'Nồng hậu & Di sản',
        emoji: '',
        description: 'Khám phá giọng nói đặc trưng vùng đất cố đô và di sản văn hoá.',
        photo: '/region_mien_trung.png',
        gradient: 'from-orange-500/90 to-amber-500/90',
        color: '#f97316',
        accent: '#fb923c',
    },
    SOUTH: {
        viName: 'Miền Nam',
        tagline: 'Sôi động & Cởi mở',
        emoji: '',
        description: 'Làm quen với giọng Nam năng động, cởi mở và thân thiện.',
        photo: '/region_mien_nam.png',
        gradient: 'from-emerald-500/90 to-teal-500/90',
        color: '#10b981',
        accent: '#34d399',
    },
}

// ─────────────────────────────────────────────────────────────────────
// Sub-component: Region Card
// ─────────────────────────────────────────────────────────────────────
const RegionCard = ({ id, meta, index, onSelect }: any) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.15, type: 'spring', bounce: 0.3 }}
            whileHover={{ y: -6, scale: 1.02 }}
            className="relative group cursor-pointer"
            onClick={() => onSelect(id)}
        >
            <div className="relative bg-white rounded-[2rem] overflow-hidden border-[3px] border-slate-900 shadow-[6px_6px_0_#1f2937] transition-all duration-300">
                {/* Photo Section */}
                <div className="relative h-44 overflow-hidden border-b-[3px] border-slate-900">
                    <img
                        src={meta.photo}
                        alt={meta.viName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        onError={(e: any) => { e.target.src = `https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80` }}
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${meta.gradient} opacity-60`} />

                    <div className="absolute top-4 left-4">
                        <span className="text-[9px] font-black tracking-widest text-white bg-slate-900/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 uppercase">
                            {meta.tagline}
                        </span>
                    </div>

                    <div className="absolute bottom-4 left-5 right-5">
                        <h3 className="text-2xl font-black text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.4)] uppercase tracking-tight">{meta.viName}</h3>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-slate-500 text-xs font-bold leading-relaxed h-8 line-clamp-2">
                        {meta.description}
                    </p>
                    <button
                        className="w-full h-11 rounded-xl border-[2px] border-slate-900 font-black text-white text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[2px_2px_0_#1f2937]"
                        style={{ backgroundColor: meta.color }}
                    >
                        <Play size={12} className="fill-white" />
                        BẮT ĐẦU CHẨN ĐOÁN
                        <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </motion.div>
    )
}

// --- Types ---
interface EntryTestQuestion {
    id: string
    targetText: string
    regionCategory: string
}

interface StepResult {
    accuracy: number
    detectedError: string
    isRegional: boolean
    rawText: string
    targetText: string
    regionCategory: string
    feedback?: string
    errorDetail?: string
    wordDetails?: any[] // Thêm chi tiết từng từ
}

const EntryTestPage: React.FC = () => {
    const navigate = useNavigate()
    const { session, updateSessionItem, refreshUserProfile } = useAuth()
    const recorder = useAudioRecorder()

    const [questions, setQuestions] = useState<EntryTestQuestion[]>([])
    const [loading, setLoading] = useState(true)
    const [idx, setIdx] = useState(0)
    const [analyzing, setAnalyzing] = useState(false)
    const [stepResults, setStepResults] = useState<StepResult[]>([])
    const [currentStepResult, setCurrentStepResult] = useState<StepResult | null>(null)
    const [finished, setFinished] = useState(false)
    const [finalData, setFinalData] = useState<any>(null)
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
    const [regionSelected, setRegionSelected] = useState(false)
    const [errorTags, setErrorTags] = useState<{ id: string; tagCode: string; name: string }[]>([])

    // Fetch dynamic error tags from database on mount
    useEffect(() => {
        const fetchErrorTags = async () => {
            try {
                const res = await apiClient.get('/public/error-tags')
                const list = res.data?.data || res.data || []
                setErrorTags(list)
            } catch (err) {
                console.error('Failed to fetch error tags:', err)
            }
        }
        fetchErrorTags()
    }, [])

    // 0. Redirect if already done or auto-start if region exists
    useEffect(() => {
        if (session?.user?.hasDoneEntryTest && !finished && !analyzing) {
            console.log("User already done entry test. Redirecting...");
            navigate('/learner/roadmap')
            return
        }

        // If user already has a region in profile, auto-start test
        if (session?.user?.region && !regionSelected && !loading) {
            console.log("Region detected in profile:", session.user.region);
            startTest(session.user.region.toUpperCase())
        }
    }, [session, navigate, finished, analyzing, regionSelected, loading])

    // 1. Fetch Question Set based on selected region
    const startTest = async (region: string) => {
        setSelectedRegion(region)
        setRegionSelected(true)
        setLoading(true)
        try {
            const res = await apiClient.get(`/test/placement-set?region=${region}`)
            setQuestions(res.data?.data || res.data || [])
        } catch (err) {
            message.error('Không thể tải bộ câu hỏi kiểm tra')
            setRegionSelected(false)
        } finally {
            setLoading(false)
        }
    }

    // WebM → WAV converter (giống QuizPage)
    const convertWebmToWav = async (webmBlob: Blob): Promise<Blob> => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const arrayBuffer = await webmBlob.arrayBuffer()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

        const numOfChan = audioBuffer.numberOfChannels
        const length = audioBuffer.length * numOfChan * 2 + 44
        const buffer = new ArrayBuffer(length)
        const view = new DataView(buffer)
        let pos = 0

        const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2 }
        const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4 }

        setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157)
        setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(numOfChan)
        setUint32(audioBuffer.sampleRate); setUint32(audioBuffer.sampleRate * 2 * numOfChan)
        setUint16(numOfChan * 2); setUint16(16); setUint32(0x61746164); setUint32(length - pos - 4)

        const channels: Float32Array[] = []
        for (let i = 0; i < numOfChan; i++) channels.push(audioBuffer.getChannelData(i))
        let offset = 0
        while (pos < length) {
            for (let i = 0; i < numOfChan; i++) {
                let sample = Math.max(-1, Math.min(1, channels[i][offset]))
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0
                view.setInt16(pos, sample, true); pos += 2
            }
            offset++
        }
        return new Blob([buffer], { type: 'audio/wav' })
    }

    // 2. Handle Recording Stop & Analyze — COPY ĐÚNG LUỒNG từ QuizPage.evaluateSpeaking
    const handleRecordStop = async (blob: Blob) => {
        if (!blob || blob.size < 100) return
        setAnalyzing(true)

        try {
            // Bước 1: convert audio sang WAV
            let audioForAsr = blob
            let uploadFileName = 'recording.webm'
            try {
                const mime = (blob.type || '').toLowerCase()
                if (!mime.includes('wav')) {
                    audioForAsr = await convertWebmToWav(blob)
                    uploadFileName = 'recording.wav'
                } else {
                    uploadFileName = 'recording.wav'
                }
            } catch {
                audioForAsr = blob
                uploadFileName = 'recording.webm'
            }

            // Bước 2: gọi Local ASR (Sử dụng ASR_URL từ env, đo latency)
            const asrStartTime = Date.now()
            const asrFormData = new FormData()
            asrFormData.append('audio', audioForAsr, uploadFileName)
            const targetText = questions[idx]?.targetText || ''
            asrFormData.append('target', targetText)

            const asrResponse = await fetch(ASR_BASE_URL, {
                method: 'POST',
                body: asrFormData,
            })
            if (!asrResponse.ok) throw new Error(`ASR Server error: ${asrResponse.status}`)

            const asrData = await asrResponse.json()
            const asrProcessingTimeMs = Date.now() - asrStartTime

            // Format mới: { success: true, data: { transcribed, score, word_details, record_id } }
            const apiResult = asrData.success ? asrData.data : null
            if (!apiResult) throw new Error("Server trả về lỗi logic")

            const transcribedText = apiResult.transcribed || ''
            const normalizedScore = apiResult.score || 0
            const wordDetails = apiResult.word_details || []

            // Bước 3: gọi BE /ai/feedback với đầy đủ metadata để đồng bộ logic
            const isConsent = localStorage.getItem('speakvn_consent_given') !== 'false'
            const feedbackResponse = await apiClient.post('/ai/feedback', {
                transcribedText,
                targetText,
                challengeId: questions[idx]?.id || null,
                dialect: questions[idx]?.regionCategory || '',
                consentGiven: isConsent,
                asrProcessingTimeMs
            })

            // Fix: Unwrap data if needed
            const result = feedbackResponse.data?.data || feedbackResponse.data || feedbackResponse
            // Ưu tiên điểm từ model ASR custom
            const finalScore = normalizedScore || Number(result?.score ?? result?.accuracy ?? 0)
            const isRegional = result?.isRegional === true || detectRegionalError(result?.detectedError || '')
            const detectedError = result?.detectedError || result?.errorType || ''

            setCurrentStepResult({
                accuracy: finalScore,
                detectedError: detectedError,
                isRegional,
                rawText: transcribedText || '(Không nhận diện được)',
                targetText,
                regionCategory: questions[idx]?.regionCategory || '',
                feedback: result?.feedback || result?.suggestion || '',
                errorDetail: result?.errorDetail || '',
                wordDetails: wordDetails // Lưu thêm chi tiết từ
            })
        } catch (err: any) {
            console.error('[EntryTest] Analyze failed:', err)
            message.error('Lỗi khi phân tích giọng nói: ' + (err?.message || 'Không rõ'))
        } finally {
            setAnalyzing(false)
        }
    }

    // Phát hiện lỗi phát âm vùng miền từ errorType string (Cập nhật pattern động từ Database)
    const detectRegionalError = (errorType: string): boolean => {
        if (!errorType) return false
        const lower = errorType.toLowerCase()

        // 1. Đối chiếu động với danh sách error tags từ database
        const matchesDbTag = errorTags.some(tag => {
            const code = (tag.tagCode || '').toLowerCase()
            const name = (tag.name || '').toLowerCase()
            return (
                (code && lower.includes(code)) ||
                (name && lower.includes(name)) ||
                (code && lower.includes(code.replace('_', '/'))) ||
                (code && lower.includes(code.replace('_', '-')))
            )
        })
        if (matchesDbTag) return true

        // 2. Standard fallback keywords
        const regional = ['n/l', 'nl', 's/x', 'sx', 'tr/ch', 'trch', 'd/r', 'dr', 'r/gi', 'rgi', 'v/z', 'vz', 'dialect', 'vùng miền', 'đặc trưng', 'ngọng']
        return regional.some(p => lower.includes(p))
    }

    // 3. Next Question
    const handleNext = () => {
        if (!currentStepResult) return

        const nextResults = [...stepResults, currentStepResult]

        if (idx + 1 < questions.length) {
            setStepResults(nextResults)
            setCurrentStepResult(null)
            setIdx(idx + 1)
        } else {
            // Câu cuối: Chạy finishTest luôn mà không xóa UI cũ để tránh flicker
            finishTest(nextResults)
        }
    }

    // 4. Finish Test
    const finishTest = async (results: StepResult[]) => {
        setAnalyzing(true) // Dùng analyzing làm trạng thái loading chung
        try {
            const res = await apiClient.post('/test/finish', results)
            const data = res.data?.data || res.data
            setFinalData(data)

            // Cập nhật trạng thái xong
            setFinished(true)

            // Cập nhật session sau khi đã đổi state 'finished' để không bị redirect sớm
            if (updateSessionItem) {
                updateSessionItem({
                    hasDoneEntryTest: true,
                    region: data?.detectedRegion || null
                })
            }
            if (refreshUserProfile) {
                await refreshUserProfile()
            }
        } catch (err) {
            message.error('Lỗi khi lưu kết quả bài test')
        } finally {
            setAnalyzing(false)
        }
    }

    // Màn hình chọn miền đẹp chuẩn Roadmap
    if (!regionSelected) {
        return (
            <div className="min-h-screen bg-[#fbf6ef] relative overflow-hidden flex flex-col items-center justify-center p-6 font-nunito">
                {/* Decorative background doodle-like faint shapes */}
                <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-[#49B6E5]/5 rounded-full filter blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-orange-500/5 rounded-full filter blur-[120px] pointer-events-none"></div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-6xl w-full relative z-10"
                >
                    {/* Header */}
                    <div className="text-center mb-12">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#fffcf9] rounded-full border-[2.5px] border-slate-900 mb-6 shadow-[3px_3px_0_#1f2937]"
                        >
                            <Globe size={16} className="text-[#49B6E5] animate-pulse" />
                            <span className="text-slate-900 text-[10px] font-black uppercase tracking-widest">Hệ thống chẩn đoán</span>
                        </motion.div>

                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight mb-4 tracking-tight">
                            Chào mừng <span className="text-[#49B6E5] font-black">Người Bạn Mới</span>
                        </h1>
                        <p className="text-slate-500 font-bold text-lg max-w-2xl mx-auto">
                            Để bắt đầu, hãy cho chúng tôi biết bạn muốn chẩn đoán theo giọng miền nào nhé.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {Object.entries(DIALECT_META).map(([key, meta], index) => (
                            <RegionCard
                                key={key}
                                id={key}
                                meta={meta}
                                index={index}
                                onSelect={startTest}
                            />
                        ))}
                    </div>

                    {/* Footer hint */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="mt-16 text-center"
                    >
                        <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                            <MapPin size={12} /> Bạn có thể thay đổi khu vực học sau này trong hồ sơ cá nhân
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        )
    }

    if (loading) return <div className="flex justify-center items-center min-h-screen bg-[#fbf6ef] font-nunito"><Spin size="large" /></div>

    if (finished) {
        const score = Math.round(finalData?.overallScore ?? 0)
        const radius = 60
        const circumference = 2 * Math.PI * radius
        const strokeDashoffset = circumference - (score / 100) * circumference

        // Count regional errors committed by the user during the diagnostic test
        const getErrorCounts = () => {
            const counts: Record<string, { code: string; count: number; name: string }> = {}
            stepResults.forEach(res => {
                if (res.isRegional && res.detectedError) {
                    let code = res.detectedError.toUpperCase().trim()

                    // Localization mapping for system codes
                    if (code === 'REGIONAL_ERROR' || code === 'REGIONAL') {
                        code = 'VÙNG MIỀN'
                    } else if (code === 'PRONUNCIATION_MISMATCH' || code === 'MISMATCH') {
                        code = 'LỆCH ÂM'
                    }

                    const matchingTag = errorTags.find(t =>
                        (t.tagCode || '').toUpperCase() === code ||
                        (t.name || '').toUpperCase().includes(code)
                    )

                    let name = matchingTag?.name || `Lỗi phát âm ${code}`
                    if (code === 'VÙNG MIỀN' && !matchingTag) {
                        name = 'Lỗi phát âm đặc trưng vùng miền'
                    }

                    const key = matchingTag?.tagCode || code
                    if (!counts[key]) {
                        counts[key] = { code: key, count: 0, name }
                    }
                    counts[key].count += 1
                }
            })
            return Object.values(counts).sort((a, b) => b.count - a.count)
        }

        const getAIEvaluationSummary = () => {
            if (score >= 85) {
                return "Chúc mừng bạn! Khả năng phát âm tiếng Việt của bạn cực kỳ xuất sắc. Các âm tiết chuẩn chỉnh, nhịp điệu tự nhiên và chuẩn mực vùng miền cao. Chúng tôi đề xuất một lộ trình học siêu tốc để củng cố và tối ưu hóa các chi tiết phát âm nâng cao."
            }
            if (score >= 70) {
                return "Tuyệt vời! Kỹ năng nói của bạn đạt mức Khá tốt. Bạn có nền tảng rất vững chắc, tuy nhiên có phát hiện một số xu hướng ảnh hưởng nhẹ từ phương ngữ. Lộ trình của bạn đã được thiết kế tập trung sửa nhanh các lỗi này để đạt độ chuẩn tối đa."
            }
            return "Phát âm của bạn ở mức Cơ bản. Một số phụ âm đầu hoặc nguyên âm đang có xu hướng bị ảnh hưởng rõ nét bởi giọng vùng miền. Đừng lo lắng, chúng tôi đã chuẩn bị lộ trình học tập tối ưu, đi sâu khắc phục chi tiết từng âm để giúp bạn tự tin nói chuẩn giọng thương hiệu."
        }

        const errorsList = getErrorCounts()
        const regionMeta = DIALECT_META[finalData?.detectedRegion || 'NORTH']

        return (
            <div className="min-h-screen bg-[#fbf6ef] font-nunito flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
                {/* Decorative background shapes */}
                <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-[#49B6E5]/5 rounded-full filter blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-emerald-500/5 rounded-full filter blur-[120px] pointer-events-none"></div>

                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-5xl w-full relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-start"
                >
                    {/* LEFT COLUMN (SVG Circle + AI Summary) - Span 5 */}
                    <div className="md:col-span-5 flex flex-col bg-white p-8 rounded-[2.5rem] border-[3px] border-slate-900 shadow-[8px_8px_0_#1f2937] text-center w-full">
                        <h2 className="text-2xl font-black text-slate-900 mb-1">Hoàn Tất Kiểm Tra Đầu Vào!</h2>
                        <p className="text-slate-500 font-bold text-xs mb-8">
                            Dưới đây là chẩn đoán giọng nói của bạn.
                        </p>

                        {/* Duolingo Percentage Circle Ring */}
                        <div className="relative w-40 h-40 flex items-center justify-center mx-auto mb-6">
                            <svg className="w-full h-full transform -rotate-90">
                                {/* Track circle */}
                                <circle
                                    cx="80"
                                    cy="80"
                                    r={radius}
                                    className="stroke-slate-100"
                                    strokeWidth="12"
                                    fill="transparent"
                                />
                                {/* Fill circle */}
                                <motion.circle
                                    cx="80"
                                    cy="80"
                                    r={radius}
                                    className="stroke-[#10b981]"
                                    strokeWidth="12"
                                    fill="transparent"
                                    strokeDasharray={circumference}
                                    initial={{ strokeDashoffset: circumference }}
                                    animate={{ strokeDashoffset }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center justify-center">
                                <span className="text-4xl font-black text-slate-900">{score}%</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">CHÍNH XÁC</span>
                            </div>
                        </div>

                        {/* AI General Overview Block */}
                        <div className="p-5 bg-sky-50 rounded-[1.5rem] border-[2px] border-slate-900 text-left shadow-[4px_4px_0_#1f2937]">
                            <div className="flex items-center gap-2 mb-2 text-[#49B6E5] font-black">
                                <span className="text-[10px] uppercase tracking-widest">ĐÁNH GIÁ TỪ AI</span>
                            </div>
                            <p className="text-slate-700 text-xs font-bold leading-relaxed italic">
                                "{getAIEvaluationSummary()}"
                            </p>
                        </div>
                    </div>

                    {/* RIGHT COLUMN (Errors list & Actions) - Span 7 */}
                    <div className="md:col-span-7 flex flex-col gap-6 w-full">
                        {/* Selected dialect header */}
                        {regionMeta && (
                            <div className="bg-white border-[3px] border-slate-900 rounded-[2rem] p-6 shadow-[8px_8px_0_#1f2937] flex items-center gap-4">
                                <div className="text-left">
                                    <span className="text-[10px] font-black tracking-widest text-[#49B6E5] bg-sky-50 border border-[#49B6E5]/20 px-3 py-1 rounded-full uppercase">
                                        {regionMeta.tagline}
                                    </span>
                                    <h3 className="text-2xl font-black text-slate-900 mt-2 uppercase">Lộ Trình: {regionMeta.viName}</h3>
                                </div>
                            </div>
                        )}

                        {/* Pronunciation error counts */}
                        <div className="bg-white border-[3px] border-slate-900 rounded-[2rem] p-8 shadow-[8px_8px_0_#1f2937]">
                            <h4 className="font-black text-slate-900 text-sm mb-6 uppercase tracking-wider text-left border-b-2 border-slate-100 pb-3 flex items-center gap-2">
                                Chi tiết lỗi phát âm phương ngữ
                            </h4>

                            {errorsList.length === 0 ? (
                                <div className="bg-emerald-50 border-[2px] border-slate-900 rounded-[1.5rem] p-6 text-center shadow-[4px_4px_0_#1f2937]">
                                    <h4 className="font-black text-emerald-800 text-sm mt-3 uppercase tracking-wide">Tuyệt vời! Không phát hiện lỗi vùng miền</h4>
                                    <p className="text-xs text-emerald-600 font-bold mt-1.5 leading-relaxed">
                                        Phát âm của bạn rất chuẩn mực và không bị ảnh hưởng bởi phương ngữ địa phương trong bài kiểm tra vừa rồi.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {errorsList.map((err, i) => (
                                        <div key={i} className="flex items-center justify-between bg-orange-50 border-[2px] border-slate-900 rounded-2xl p-4 shadow-[4px_4px_0_#1f2937] transition-all hover:translate-y-[-2px]">
                                            <div className="flex items-center gap-3">
                                                <span className="w-10 h-10 rounded-xl bg-orange-100 border-[2px] border-slate-900 flex items-center justify-center text-xs font-black text-orange-600 -rotate-3">
                                                    {err.code}
                                                </span>
                                                <div className="text-left">
                                                    <p className="text-xs font-black text-slate-900 leading-tight uppercase">{err.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">Phát hiện qua bài test</p>
                                                </div>
                                            </div>
                                            <div className="bg-orange-500 border-[2px] border-slate-900 px-4 py-1.5 rounded-full text-xs font-black text-white shadow-[2px_2px_0_#1f2937] italic">
                                                {err.count} lần
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Large call to action button */}
                        <button
                            className="w-full h-16 rounded-2xl bg-[#10b981] hover:bg-[#059669] border-[3px] border-slate-900 shadow-[8px_8px_0_#1f2937] text-white font-black text-lg transition-all active:translate-y-0.5 active:shadow-[4px_4px_0_#1f2937] uppercase tracking-wider flex items-center justify-center gap-3"
                            onClick={() => navigate('/learner/dashboard')}
                        >
                            Bắt đầu lộ trình cá nhân hóa ngay
                        </button>
                    </div>
                </motion.div>
            </div>
        )
    }

    const currentQ = questions[idx]
    const progressPercent = Math.round(((idx + 1) / questions.length) * 100)

    return (
        <div className="min-h-screen bg-[#fbf6ef] font-nunito flex flex-col items-center p-6 sm:p-10">
            <div className="max-w-2xl w-full">
                {/* Header */}
                <div className="flex flex-col gap-5 mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white rounded-2xl border-[2.5px] border-slate-900 flex items-center justify-center shadow-[3px_3px_0_#1f2937] -rotate-3">
                                <ThunderboltFilled className="text-2xl text-yellow-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 leading-none">Kiểm tra đầu vào</h2>
                                <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-1">Chẩn Đoán Năng Lực</p>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate(-1)}
                            className="px-4 py-2 bg-white border-[2.5px] border-slate-900 rounded-xl shadow-[3px_3px_0_#1f2937] text-xs font-black text-slate-900 transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
                        >
                            Thoát
                        </button>
                    </div>

                    {/* Progress System */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-5 bg-white border-[2.5px] border-slate-900 rounded-full overflow-hidden p-0.5 shadow-[inner_0_2px_4px_rgba(0,0,0,0.05)]">
                            <motion.div
                                className="h-full bg-gradient-to-r from-[#49B6E5] via-[#49B6E5]/80 to-[#49B6E5] rounded-full border-r-[2px] border-slate-900"
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                            />
                        </div>
                        <div className="bg-slate-900 text-white px-3 py-1 rounded-xl text-[10px] font-black shadow-[3px_3px_0_#49B6E5] italic">
                            Câu {idx + 1}/{questions.length} ({progressPercent}%)
                        </div>
                    </div>
                </div>

                {/* Question Card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={idx}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        className="bg-white rounded-[2.5rem] p-8 sm:p-12 border-[3px] border-slate-900 shadow-[8px_8px_0_#1f2937] text-center mb-8"
                    >
                        <p className="text-slate-500 font-black uppercase tracking-widest text-xs mb-6">Hãy đọc to câu dưới đây:</p>
                        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight mb-10">
                            {currentQ?.targetText}
                        </h1>

                        {/* AI Result Feedback (if simulated or real) */}
                        {currentStepResult && (() => {
                            const normalizedAccuracy = currentStepResult.accuracy <= 1 ? currentStepResult.accuracy * 100 : currentStepResult.accuracy;
                            const isGood = normalizedAccuracy >= 70;

                            return (
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={`p-6 rounded-[2rem] mb-10 text-left border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f2937] ${isGood ? 'bg-emerald-50' : 'bg-orange-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-4 mb-2">
                                        {isGood ? (
                                            <CheckCircleFilled className="text-green-500 text-xl" />
                                        ) : (
                                            <CloseCircleFilled className="text-orange-500 text-xl" />
                                        )}
                                        <span className="font-bold text-slate-700">Kết quả nhận diện:</span>
                                        <span className="font-black text-slate-900 ml-auto">{Math.round(normalizedAccuracy)}%</span>
                                    </div>
                                    <p className="italic text-slate-800 bg-[#fbf6ef]/80 p-4 rounded-xl border-[2px] border-slate-900/10 mb-4 font-bold">
                                        {currentStepResult.rawText || "Không nhận diện được âm thanh"}
                                    </p>

                                    {/* Hiển thị chi tiết từng từ (Word Details) */}
                                    {currentStepResult.wordDetails && currentStepResult.wordDetails.length > 0 && (
                                        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
                                            {currentStepResult.wordDetails.map((item: any, i: number) => {
                                                const isWrong = item.status === 'wrong';
                                                const textColor = item.status === 'correct' ? 'text-green-600' :
                                                    item.status === 'near' ? 'text-yellow-600' :
                                                        'text-red-600';
                                                return (
                                                    <span key={i} className={`font-black text-lg ${textColor} ${isWrong ? 'underline decoration-[3px] underline-offset-4' : ''}`}>
                                                        {item.word}
                                                    </span>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {(currentStepResult.errorDetail || currentStepResult.feedback) && (
                                        <div className="mt-4 p-5 bg-sky-50 rounded-[1.5rem] border-[2px] border-slate-900 text-slate-900 text-sm leading-relaxed shadow-[2px_2px_0_#1f2937]">
                                            <div className="flex items-center gap-2 mb-3 text-[#49B6E5] font-black">
                                                <StarFilled />
                                                <span>NHẬN XÉT TỪ AI</span>
                                            </div>

                                            {currentStepResult.errorDetail && currentStepResult.feedback && currentStepResult.errorDetail === currentStepResult.feedback ? (
                                                <p className="font-medium">{currentStepResult.feedback}</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {currentStepResult.errorDetail && (
                                                        <div>
                                                            <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Chi tiết lỗi:</p>
                                                            <p className="italic opacity-90">{currentStepResult.errorDetail}</p>
                                                        </div>
                                                    )}
                                                    {currentStepResult.feedback && (
                                                        <div>
                                                            <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Gợi ý cải thiện:</p>
                                                            <p className="font-medium">{currentStepResult.feedback}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {currentStepResult.isRegional && (
                                        <div className="mt-3 flex items-center gap-2">
                                            <StarFilled className="text-yellow-500 text-xs" />
                                            <span className="text-xs font-black text-purple-600 uppercase tracking-tighter">Phát hiện lỗi phát âm đặc trưng miền</span>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })()}

                        {/* Recorder Controls */}
                        <div className="flex flex-col items-center gap-6">
                            {!currentStepResult ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative">
                                        <AnimatePresence>
                                            {recorder.isRecording && (
                                                <motion.div
                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                    animate={{ scale: 1.5, opacity: 0.2 }}
                                                    exit={{ scale: 0.8, opacity: 0 }}
                                                    className="absolute inset-0 bg-rose-400 rounded-full blur-xl animate-pulse"
                                                    transition={{ repeat: Infinity, duration: 1 }}
                                                />
                                            )}
                                        </AnimatePresence>

                                        <button
                                            className={`w-24 h-24 flex items-center justify-center rounded-full border-[3px] border-slate-900 relative z-10 transition-all duration-300 outline-none shadow-[6px_6px_0_#1f2937] active:translate-y-0.5 active:shadow-[2px_2px_0_#1f2937] ${recorder.isRecording
                                                ? 'bg-rose-500 text-white'
                                                : analyzing
                                                    ? 'bg-slate-200 cursor-not-allowed text-slate-400'
                                                    : 'bg-[#49B6E5] hover:bg-[#3ba2cf] text-white'
                                                }`}
                                            onClick={async () => {
                                                if (analyzing) return
                                                if (recorder.isRecording) {
                                                    const blob = await recorder.stopRecording()
                                                    if (blob) handleRecordStop(blob)
                                                } else {
                                                    recorder.startRecording()
                                                }
                                            }}
                                            disabled={analyzing}
                                        >
                                            {analyzing ? (
                                                <LoadingOutlined className="text-3xl text-slate-500" />
                                            ) : recorder.isRecording ? (
                                                <div className="w-6 h-6 bg-white rounded-sm" />
                                            ) : (
                                                <AudioOutlined className="text-3xl text-white" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    className="h-14 px-10 rounded-2xl bg-[#10b981] hover:bg-[#059669] border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f2937] text-white font-black flex items-center justify-center gap-2 transition-all active:translate-y-0.5 active:shadow-[2px_2px_0_#1f2937] uppercase tracking-wider"
                                    onClick={handleNext}
                                >
                                    {idx + 1 === questions.length ? 'Xem kết quả' : 'Câu tiếp theo'}
                                    <ArrowRightOutlined />
                                </button>
                            )}

                            <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em]">
                                {analyzing ? 'Đang phân tích...' : recorder.isRecording ? 'Đang ghi âm...' : 'Nhấn để ghi âm'}
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Footer info */}
                <p className="text-center text-slate-400 text-xs font-semibold">
                    Dữ liệu của bạn sẽ được bảo mật và dùng vào mục đích cải thiện lộ trình học tập.
                </p>
            </div>
        </div>
    )
}

export default EntryTestPage;
