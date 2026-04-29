import React, { useEffect, useState } from 'react'
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
import { ASR_BASE_URL, ASR_MODEL, ASR_LANGUAGE, ASR_SAMPLING_RATE } from '../../../config'
import { Globe, Play, ChevronRight, MapPin, Trophy, ArrowRight, Zap } from 'lucide-react'
import mienbacImg from '../../../assets/mienbac.png'
import mientrungImg from '../../../assets/mientrung.png'
import miennamImg from '../../../assets/miennam.png'

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
        emoji: '🏛️',
        description: 'Chinh phục phát âm chuẩn — nền tảng của tiếng Việt quy chuẩn.',
        photo: mienbacImg,
        gradient: 'from-indigo-500/90 to-blue-600/90',
        color: '#6366f1',
        accent: '#818cf8',
    },
    CENTRAL: {
        viName: 'Miền Trung',
        tagline: 'Nồng hậu & Di sản',
        emoji: '🏯',
        description: 'Khám phá giọng nói đặc trưng vùng đất cố đô và di sản văn hoá.',
        photo: mientrungImg,
        gradient: 'from-amber-500/90 to-orange-600/90',
        color: '#f59e0b',
        accent: '#fbbf24',
    },
    SOUTH: {
        viName: 'Miền Nam',
        tagline: 'Sôi động & Cởi mở',
        emoji: '🌆',
        description: 'Làm quen với giọng Nam năng động, cởi mở và thân thiện.',
        photo: miennamImg,
        gradient: 'from-emerald-500/90 to-teal-600/90',
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
            whileHover={{ y: -8, scale: 1.02 }}
            className="relative group cursor-pointer"
            onClick={() => onSelect(id)}
        >
            <div className="relative bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100 transition-all duration-500 group-hover:shadow-2xl group-hover:border-purple-200">
                {/* Photo Section */}
                <div className="relative h-48 overflow-hidden">
                    <img
                        src={meta.photo}
                        alt={meta.viName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        onError={(e: any) => { e.target.src = `https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80` }}
                    />

                    <div className="absolute top-4 left-4">
                        <span className="text-[10px] font-black tracking-[0.15em] text-white bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 uppercase">
                            {meta.tagline}
                        </span>
                    </div>

                    <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between">
                        <h3 className="text-3xl font-black text-white drop-shadow-lg leading-none">{meta.viName}</h3>
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-lg border border-white/20 backdrop-blur-sm bg-white/10">
                            {meta.emoji}
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <p className="text-gray-400 text-xs font-bold leading-relaxed mb-6 line-clamp-2 h-8">
                        {meta.description}
                    </p>
                    <button
                        className="w-full h-11 rounded-2xl font-black text-white text-xs flex items-center justify-center gap-2 transition-all duration-300 active:scale-95"
                        style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.accent})` }}
                    >
                        <Play size={14} className="fill-white" />
                        Bắt đầu chẩn đoán
                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
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
    audioUrl?: string
}

const EntryTestPage: React.FC = () => {
    const navigate = useNavigate()
    const { session, updateSessionItem } = useAuth()
    const recorder = useAudioRecorder()

    const [questions, setQuestions] = useState<EntryTestQuestion[]>([])
    const [loading, setLoading] = useState(true)
    const [idx, setIdx] = useState(0)
    const [analyzing, setAnalyzing] = useState(false)
    const [stepResults, setStepResults] = useState<StepResult[]>([])
    const [currentStepResult, setCurrentStepResult] = useState<StepResult | null>(null)
    const [finished, setFinished] = useState(false)
    const [finalData, setFinalData] = useState<any>(null)
    const [regionSelected, setRegionSelected] = useState(false)

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

    // 2. Handle Recording Stop & Analyze — Use centralized BE endpoint
    const handleRecordStop = async (blob: Blob) => {
        if (!blob || blob.size < 100) return
        setAnalyzing(true)

        try {
            // convert audio to WAV for better compatibility if needed, but BE usually handles it
            let audioFile = blob
            let fileName = 'recording.webm'
            const mime = (blob.type || '').toLowerCase()
            if (!mime.includes('wav')) {
                try {
                    audioFile = await convertWebmToWav(blob)
                    fileName = 'recording.wav'
                } catch (e) {
                    console.warn("WAV conversion failed, using original blob", e)
                }
            } else {
                fileName = 'recording.wav'
            }

            const formData = new FormData()
            formData.append('file', audioFile, fileName)
            formData.append('questionId', questions[idx]?.id)

            const res = await apiClient.post('/test/analyze-step', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            const result = res.data?.data || res.data
            
            // Extract values from unified BE response
            const finalScore = Number(result?.accuracy ?? result?.score ?? 0)
            const transcribedText = result?.azureTranscript || result?.rawText || result?.text || ''
            const wordDetails = result?.word_details || []
            const isRegional = result?.isRegional === true || detectRegionalError(result?.detectedError || result?.errorType || '')

            setCurrentStepResult({
                accuracy: finalScore,
                detectedError: result?.detectedError || result?.errorType || '',
                isRegional,
                rawText: transcribedText || '(Không nhận diện được)',
                targetText: questions[idx]?.targetText || '',
                regionCategory: questions[idx]?.regionCategory || '',
                feedback: result?.feedback || result?.suggestion || '',
                errorDetail: result?.errorDetail || '',
                wordDetails: wordDetails,
                audioUrl: result?.audioUrl // Store the Firebase URL from BE
            })
        } catch (err: any) {
            console.error('[EntryTest] Analyze failed:', err)
            message.error('Lỗi khi phân tích giọng nói: ' + (err?.response?.data?.message || err?.message || 'Không rõ'))
        } finally {
            setAnalyzing(false)
        }
    }

    // Phát hiện lỗi phát âm vùng miền từ errorType string (Cập nhật pattern đầy đủ hơn)
    const detectRegionalError = (errorType: string): boolean => {
        if (!errorType) return false
        const lower = errorType.toLowerCase()
        const regional = ['n/l', 'nl', 's/x', 'sx', 'tr/ch', 'trch', 'd/r', 'dr', 'r/gi', 'rgi', 'v/z', 'vz', 'dialect', 'vùng miền', 'đặc trưng']
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
                    region: data?.detectedRegion || 'NORTH'
                })
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
            <div className="min-h-screen bg-[#fbfaff] relative overflow-hidden flex flex-col items-center justify-center p-6">
                {/* Decorative background blur elements */}
                <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-purple-600/5 rounded-full filter blur-[120px] pointer-events-none"></div>
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
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-purple-100 mb-6 shadow-sm"
                        >
                            <Globe size={16} className="text-purple-600 animate-pulse" />
                            <span className="text-purple-700 text-[10px] font-black uppercase tracking-widest">Hệ thống chẩn đoán</span>
                        </motion.div>

                        <h1 className="text-4xl md:text-6xl font-black text-gray-800 leading-tight mb-4 tracking-tight">
                            Chào mừng <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-orange-500 font-black">Người Bạn Mới</span>
                        </h1>
                        <p className="text-gray-400 font-bold text-lg max-w-2xl mx-auto">
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
                        <p className="text-gray-300 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                            <MapPin size={12} /> Bạn có thể thay đổi khu vực học sau này trong hồ sơ cá nhân
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        )
    }

    if (loading) return <div className="flex justify-center items-center min-h-screen bg-[#f8f5ff]"><Spin size="large" /></div>

    if (finished) {
        return (
            <div className="min-h-screen bg-[#f8f3ea] flex items-center justify-center p-6 relative overflow-hidden">
                {/* Neobrutalist Background Patterns */}
                <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#e6dccb 2px, transparent 2px)', backgroundSize: '32px 32px' }} />
                <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-[#49B6E5]/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-[#f1c46f]/10 rounded-full blur-[100px] pointer-events-none" />

                <motion.div
                    initial={{ y: 50, opacity: 0, rotate: -1 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    className="relative z-10 w-full max-w-2xl bg-white border-[4px] border-slate-900 rounded-[3rem] p-8 md:p-12 shadow-[12px_12px_0_#1f2937]"
                >
                    {/* Header Badge */}
                    <div className="flex justify-center mb-8">
                        <div className="inline-flex items-center gap-3 bg-[#f1c46f] border-[3px] border-slate-900 rounded-full px-6 py-2 shadow-[4px_4px_0_#1f2937]">
                            <Trophy size={20} className="text-slate-900" />
                            <span className="font-black uppercase tracking-widest text-xs text-slate-900">Kết quả chẩn đoán AI</span>
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 text-center mb-4 leading-tight">
                        Chúc mừng bạn đã <span className="text-[#49B6E5]">hoàn thành!</span>
                    </h1>
                    <p className="text-slate-600 font-bold text-center mb-10 max-w-md mx-auto">
                        AI đã phân tích giọng nói của bạn. Dưới đây là đánh giá tổng quát về khả năng phát âm của bạn.
                    </p>

                    {/* Score Card Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                        <div className="bg-[#eef9fe] border-[3px] border-slate-900 rounded-[2rem] p-6 shadow-[6px_6px_0_#1f2937] flex flex-col items-center justify-center text-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#263D5B] mb-2">Độ chính xác tổng quát</span>
                            <div className="text-6xl font-black text-[#263D5B] mb-1">
                                {Math.round(finalData?.overallScore ?? 0)}<span className="text-2xl opacity-50">%</span>
                            </div>
                            <div className="h-2 w-24 bg-white border-[2px] border-slate-900 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${finalData?.overallScore ?? 0}%` }}
                                    className="h-full bg-[#49B6E5]" 
                                />
                            </div>
                        </div>

                        <div className="bg-[#fffaf2] border-[3px] border-slate-900 rounded-[2rem] p-6 shadow-[6px_6px_0_#1f2937] flex flex-col items-center justify-center text-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#D97706] mb-2">Miền chẩn đoán</span>
                            <div className="text-2xl font-black text-slate-900 mb-2">
                                {finalData?.detectedRegion === 'NORTH' ? 'Miền Bắc' : 
                                 finalData?.detectedRegion === 'CENTRAL' ? 'Miền Trung' : 'Miền Nam'}
                            </div>
                            <div className="inline-flex items-center gap-2 bg-white border-[2px] border-slate-900 rounded-full px-3 py-1 text-[10px] font-black text-slate-600">
                                <MapPin size={12} />
                                {finalData?.detectedRegion || 'SOUTH'}
                            </div>
                        </div>
                    </div>

                    {/* AI Feedback Summary */}
                    <div className="bg-slate-50 border-[3px] border-slate-900 rounded-[2rem] p-6 mb-10 relative overflow-hidden">
                        <div className="absolute top-4 right-4 text-slate-200">
                            <Zap size={48} />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                            <StarFilled className="text-[#f1c46f]" /> Nhận xét từ AI
                        </h3>
                        <p className="text-slate-700 font-bold leading-relaxed relative z-10">
                            {finalData?.feedback || "Bạn có khả năng phát âm khá tốt. Tuy nhiên, AI phát hiện một số điểm cần cải thiện ở các âm đặc trưng vùng miền để giọng nói tự nhiên hơn."}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                            onClick={() => navigate('/learner/custom-journey')}
                            className="flex-[1.5] group relative bg-[#49B6E5] border-[3px] border-slate-900 rounded-2xl py-5 px-6 shadow-[6px_6px_0_#1f2937] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_#1f2937] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                        >
                            <div className="flex items-center justify-center gap-3">
                                <div className="flex flex-col items-start">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#263D5B] opacity-70">Gợi ý từ AI</span>
                                    <span className="text-lg font-black text-slate-900">Lộ trình đề xuất</span>
                                </div>
                                <ArrowRight size={24} className="text-slate-900 transition-transform group-hover:translate-x-1" />
                            </div>
                        </button>

                        <button 
                            onClick={() => navigate('/learner/roadmap')}
                            className="flex-1 bg-white border-[3px] border-slate-900 rounded-2xl py-5 px-6 shadow-[6px_6px_0_#1f2937] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_#1f2937] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                        >
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tiêu chuẩn</span>
                                <span className="text-lg font-black text-slate-900">Lộ trình mặc định</span>
                            </div>
                        </button>
                    </div>

                    {/* Exploration Link */}
                    <div className="mt-8 text-center">
                        <button 
                            onClick={() => navigate('/learner/dashboard')}
                            className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                        >
                            Khám phá tự do trên Dashboard
                        </button>
                    </div>
                </motion.div>
            </div>
        )
    }

    const currentQ = questions[idx]
    const progressPercent = Math.round(((idx + 1) / questions.length) * 100)

    return (
        <div className="min-h-screen bg-[#f8f5ff] flex flex-col items-center p-6 sm:p-10">
            <div className="max-w-2xl w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                            <ThunderboltFilled className="text-2xl text-yellow-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-800 leading-none">Kiểm Tra Đầu Vào</h2>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Chế độ chẩn đoán</p>
                        </div>
                    </div>
                    <div className="w-48">
                        <Progress
                            percent={progressPercent}
                            showInfo={false}
                            strokeColor="#9333ea"
                            trailColor="#eee"
                            className="mb-0"
                        />
                        <p className="text-right text-[10px] font-black text-purple-400 mt-1">CÂU {idx + 1} / {questions.length}</p>
                    </div>
                </div>

                {/* Question Card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={idx}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        className="bg-white rounded-[3rem] p-8 sm:p-12 shadow-xl border border-purple-50 text-center mb-8"
                        style={{ boxShadow: '0 10px 40px rgba(147, 51, 234, 0.05)' }}
                    >
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-6">Hãy đọc to câu dưới đây:</p>
                        <h1 className="text-3xl sm:text-4xl font-black text-gray-800 leading-tight mb-10">
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
                                    className={`p-6 rounded-3xl mb-10 text-left border ${isGood ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'
                                        }`}
                                >
                                    <div className="flex items-center gap-4 mb-2">
                                        {isGood ? (
                                            <CheckCircleFilled className="text-green-500 text-xl" />
                                        ) : (
                                            <CloseCircleFilled className="text-orange-500 text-xl" />
                                        )}
                                        <span className="font-bold text-gray-700">Kết quả nhận diện:</span>
                                        <span className="font-black text-gray-900 ml-auto">{Math.round(normalizedAccuracy)}%</span>
                                    </div>
                                    <p className="italic text-gray-600 bg-white/50 p-3 rounded-xl border border-black/5 mb-4">
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
                                        <div className="mt-4 p-5 bg-blue-50/80 rounded-3xl border border-blue-100 text-blue-900 text-sm leading-relaxed">
                                            <div className="flex items-center gap-2 mb-3 text-blue-600 font-bold">
                                                <StarFilled />
                                                <span>NHẬN XÉT TỪ AI</span>
                                            </div>

                                            {currentStepResult.errorDetail && currentStepResult.feedback && currentStepResult.errorDetail === currentStepResult.feedback ? (
                                                <p className="font-medium">{currentStepResult.feedback}</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {currentStepResult.errorDetail && (
                                                        <div>
                                                            <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">Chi tiết lỗi:</p>
                                                            <p className="italic opacity-90">{currentStepResult.errorDetail}</p>
                                                        </div>
                                                    )}
                                                    {currentStepResult.feedback && (
                                                        <div>
                                                            <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">Gợi ý cải thiện:</p>
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
                                            <span className="text-xs font-bold text-purple-600 uppercase tracking-tighter">Phát hiện lỗi phát âm đặc trưng miền</span>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })()}

                        {/* Recorder Controls */}
                        <div className="flex flex-col items-center gap-6">
                            {!currentStepResult ? (
                                <div className="relative">
                                    <AnimatePresence>
                                        {recorder.isRecording && (
                                            <motion.div
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1.5, opacity: 0.2 }}
                                                exit={{ scale: 0.8, opacity: 0 }}
                                                className="absolute inset-0 bg-red-400 rounded-full blur-xl"
                                                transition={{ repeat: Infinity, duration: 1 }}
                                            />
                                        )}
                                    </AnimatePresence>

                                    <button
                                        className={`w-24 h-24 flex items-center justify-center rounded-full border-none shadow-2xl relative z-10 transition-all duration-300 outline-none ${recorder.isRecording
                                            ? 'bg-red-500 hover:bg-red-600 scale-90'
                                            : analyzing
                                                ? 'bg-gray-100 cursor-not-allowed'
                                                : 'bg-purple-600 hover:bg-purple-700 hover:scale-105'
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
                                            <LoadingOutlined className="text-3xl text-purple-600" />
                                        ) : recorder.isRecording ? (
                                            <div className="w-6 h-6 bg-white rounded-sm" />
                                        ) : (
                                            <AudioOutlined className="text-3xl text-white" />
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <Button
                                    type="primary"
                                    size="large"
                                    icon={<ArrowRightOutlined />}
                                    className="rounded-2xl h-14 px-10 font-bold bg-green-500 hover:bg-green-600 border-none flex items-center"
                                    onClick={handleNext}
                                >
                                    {idx + 1 === questions.length ? 'Xem kết quả' : 'Câu tiếp theo'}
                                </Button>
                            )}

                            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em]">
                                {analyzing ? 'Đang phân tích...' : recorder.isRecording ? 'Đang ghi âm...' : 'Nhấn để ghi âm'}
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Footer info */}
                <p className="text-center text-gray-400 text-xs font-medium">
                    Dữ liệu của bạn sẽ được bảo mật và dùng vào mục đích cải thiện lộ trình học tập.
                </p>
                {/* Loading Overlay khi đang phân tích kết quả cuối cùng */}
                {analyzing && !finished && (
                    <div className="fixed inset-0 z-[100] bg-white/70 backdrop-blur-md flex flex-col items-center justify-center">
                        <div className="relative">
                            <div className="w-24 h-24 border-[6px] border-purple-100 border-t-purple-600 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <ThunderboltFilled className="text-3xl text-yellow-500 animate-bounce" />
                            </div>
                        </div>
                        <h2 className="mt-8 text-2xl font-black text-slate-900 uppercase tracking-tight">AI Đang Phân Tích</h2>
                        <p className="mt-2 text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] animate-pulse">
                            Vui lòng đợi trong giây lát...
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default EntryTestPage;
