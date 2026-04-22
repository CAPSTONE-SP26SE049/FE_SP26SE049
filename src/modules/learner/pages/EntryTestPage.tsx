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
}

const EntryTestPage: React.FC = () => {
    const navigate = useNavigate()
    const { updateSessionItem } = useAuth()
    const recorder = useAudioRecorder()

    const [questions, setQuestions] = useState<EntryTestQuestion[]>([])
    const [loading, setLoading] = useState(true)
    const [idx, setIdx] = useState(0)
    const [analyzing, setAnalyzing] = useState(false)
    const [stepResults, setStepResults] = useState<StepResult[]>([])
    const [currentStepResult, setCurrentStepResult] = useState<StepResult | null>(null)
    const [finished, setFinished] = useState(false)
    const [finalData, setFinalData] = useState<any>(null)
    const initialized = useRef(false)

    // 1. Fetch Question Set
    useEffect(() => {
        if (initialized.current) return
        initialized.current = true

        const fetchQuestions = async () => {
            try {
                const res = await apiClient.get('/test/placement-set')
                setQuestions(res.data?.data || res.data || [])
            } catch (err) {
                message.error('Không thể tải bộ câu hỏi kiểm tra')
            } finally {
                setLoading(false)
            }
        }
        fetchQuestions()
    }, [])

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
            asrFormData.append('file', audioForAsr, uploadFileName)

            const asrResponse = await fetch(ASR_BASE_URL, {
                method: 'POST',
                body: asrFormData,
            })
            if (!asrResponse.ok) throw new Error(`ASR Server error: ${asrResponse.status}`)

            const asrData = await asrResponse.json()
            const asrProcessingTimeMs = Date.now() - asrStartTime

            const rawText = asrData.text || ''
            const transcribedText = typeof rawText === 'object' ? (rawText.text || '') : rawText

            // Bước 3: gọi BE /ai/feedback với đầy đủ metadata để đồng bộ logic
            const targetText = questions[idx]?.targetText || ''
            const feedbackResponse = await apiClient.post('/ai/feedback', {
                transcribedText,
                targetText,
                challengeId: questions[idx]?.id || null,
                dialect: questions[idx]?.regionCategory || '',
                consentGiven: false,
                asrProcessingTimeMs
            })

            // Fix: Unwrap data if needed
            const result = feedbackResponse.data?.data || feedbackResponse.data || feedbackResponse
            const normalizedScore = Number(result?.score ?? result?.accuracy ?? 0)
            const isRegional = result?.isRegional === true || detectRegionalError(result?.detectedError || '')
            const detectedError = result?.detectedError || result?.errorType || ''

            setCurrentStepResult({
                accuracy: normalizedScore,
                detectedError,
                isRegional,
                rawText: transcribedText || '(Không nhận diện được)',
                targetText,
                regionCategory: questions[idx]?.regionCategory || '',
                feedback: result?.feedback || result?.suggestion || '',
                errorDetail: result?.errorDetail || ''
            })
        } catch (err: any) {
            console.error('[EntryTest] Analyze failed:', err)
            message.error('Lỗi khi phân tích giọng nói: ' + (err?.message || 'Không rõ'))
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
        if (currentStepResult) {
            setStepResults(prev => [...prev, currentStepResult])
            setCurrentStepResult(null)

            if (idx + 1 < questions.length) {
                setIdx(idx + 1)
            } else {
                finishTest([...stepResults, currentStepResult])
            }
        }
    }

    // 4. Finish Test
    const finishTest = async (results: StepResult[]) => {
        try {
            const res = await apiClient.post('/test/finish', results)
            const data = res.data?.data || res.data
            setFinalData(data)
            setFinished(true)

            // Update session to reflect completed test
            updateSessionItem({ hasDoneEntryTest: true })
        } catch (err) {
            message.error('Lỗi khi lưu kết quả bài test')
        }
    }

    if (loading) return <div className="flex justify-center items-center min-h-screen bg-[#f8f5ff]"><Spin size="large" /></div>

    if (finished) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8f5ff] p-6 text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-lg w-full border border-purple-100"
                >
                    <div className="text-7xl mb-6">🎉</div>
                    <h1 className="text-3xl font-black text-gray-800 mb-4">Hoàn thành chẩn đoán!</h1>
                    <p className="text-gray-500 mb-8 font-medium">
                        Chúng tôi đã phân tích giọng nói của bạn và chuẩn bị một lộ trình học tập tối ưu.
                    </p>

                    <div className="bg-purple-50 rounded-3xl p-6 mb-8 text-left border border-purple-100">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-bold text-purple-700">Độ chính xác:</span>
                            <span className="font-black text-2xl text-purple-900">{Math.round(finalData?.overallScore ?? 0)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-purple-700">Miền chẩn đoán:</span>
                            <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                {finalData?.detectedRegion}
                            </span>
                        </div>
                    </div>

                    <Button
                        type="primary"
                        size="large"
                        block
                        className="h-16 rounded-2xl text-lg font-bold bg-purple-600 hover:bg-purple-700 border-none shadow-lg shadow-purple-200"
                        onClick={() => navigate('/learner/dashboard')}
                    >
                        Bắt đầu lộ trình ngay
                    </Button>
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
                            <h2 className="text-xl font-black text-gray-800 leading-none">Entry Test</h2>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Diagnostic Mode</p>
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
                                    <p className="italic text-gray-600 bg-white/50 p-3 rounded-xl border border-black/5">
                                        {currentStepResult.rawText || "Không nhận diện được âm thanh"}
                                    </p>

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
            </div>
        </div>
    )
}

export default EntryTestPage;
