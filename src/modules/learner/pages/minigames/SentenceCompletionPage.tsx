import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, Trophy, Sparkles, Zap, Timer } from 'lucide-react'
import { message, Spin } from 'antd'
import clsx from 'clsx'
import { minigameService } from '../../services/minigameService'
import GameRulesModal from '../../components/GameRulesModal'

interface Challenge {
    id: string
    pairType: string
    sentence: string
    options: string[]
    correctIndex: number
    context?: string
    explanation?: string
}

const PAIR_LABELS: Record<string, string> = {
    N_L: 'N / L', S_X: 'S / X', D_GI_R: 'D / GI / R', TR_CH: 'TR / CH'
}

const GAME_RULES_CONFIG = {
    title: 'Hoàn thành câu',
    icon: Sparkles,
    iconColor: 'bg-amber-500',
    description: 'Điền từ đúng vào chỗ trống dựa trên ngữ cảnh',
    rules: [
        'Mỗi câu có 1 chỗ trống (___) cần điền từ đúng',
        'Bạn có 20 giây cho mỗi câu hỏi',
        'Chọn 1 trong các đáp án để hoàn thành câu',
        'Trả lời đúng liên tiếp để tạo combo bonus!',
    ],
    scoring: [
        'Trả lời đúng: +10 điểm',
        'Combo x2: +5 bonus, Combo x3+: +10 bonus',
        'Trả lời trong 10s đầu: +5 bonus tốc độ',
    ],
    tips: [
        'Đọc cả câu để hiểu ngữ cảnh trước khi chọn',
        'Chú ý âm đầu của từ cần điền',
    ],
}

const SentenceCompletionPage: React.FC = () => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const pairType = searchParams.get('pair') || 'N_L'

    const [showRules, setShowRules] = useState(true)
    const [challenges, setChallenges] = useState<Challenge[]>([])
    const [loading, setLoading] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
    const [showResult, setShowResult] = useState(false)
    const [score, setScore] = useState(0)
    const [combo, setCombo] = useState(0)
    const [gameOver, setGameOver] = useState(false)
    const [timeLeft, setTimeLeft] = useState(20)
    const [shakeWrong, setShakeWrong] = useState(false)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const fetchChallenges = async () => {
        setLoading(true)
        try {
            const res: any = await minigameService.getSentenceCompletions(pairType)
            const data = res?.data || (Array.isArray(res) ? res : [])
            setChallenges(data)
        } catch {
            message.error('Không thể tải câu hỏi')
        } finally {
            setLoading(false)
        }
    }

    const startGame = () => {
        setShowRules(false)
        fetchChallenges()
    }

    const startTimer = () => {
        setTimeLeft(20)
        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!)
                    handleTimeUp()
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }

    const stopTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current)
    }

    const handleTimeUp = () => {
        if (showResult) return
        setShowResult(true)
        setSelectedAnswer(-1)
        setCombo(0)
        setShakeWrong(true)
        setTimeout(() => setShakeWrong(false), 500)
    }

    useEffect(() => {
        if (challenges.length > 0 && !showResult && !gameOver) {
            startTimer()
        }
        return () => stopTimer()
    }, [currentIndex, challenges.length])

    const current = challenges[currentIndex]

    const handleSelectAnswer = (idx: number) => {
        if (showResult) return
        stopTimer()
        setSelectedAnswer(idx)
        setShowResult(true)
        if (idx === current.correctIndex) {
            const newCombo = combo + 1
            setCombo(newCombo)
            let points = 10
            if (timeLeft >= 10) points += 5
            if (newCombo >= 3) points += 10
            else if (newCombo >= 2) points += 5
            setScore(prev => prev + points)
        } else {
            setCombo(0)
            setShakeWrong(true)
            setTimeout(() => setShakeWrong(false), 500)
        }
    }

    const handleNext = () => {
        if (currentIndex + 1 >= challenges.length) {
            setGameOver(true)
            return
        }
        setCurrentIndex(prev => prev + 1)
        setSelectedAnswer(null)
        setShowResult(false)
    }

    const handleRestart = () => {
        stopTimer()
        setCurrentIndex(0)
        setSelectedAnswer(null)
        setShowResult(false)
        setScore(0)
        setCombo(0)
        setGameOver(false)
        setShowRules(true)
    }

    if (showRules) {
        return (
            <div className="min-h-screen bg-[#fbf6ef] font-nunito p-6 lg:p-10">
                <GameRulesModal open={showRules} config={GAME_RULES_CONFIG} onStart={startGame} onClose={() => navigate('/learner/minigames')} />
            </div>
        )
    }

    if (loading) return (
        <div className="min-h-screen bg-[#fbf6ef] flex items-center justify-center">
            <Spin size="large" />
        </div>
    )

    if (gameOver) return (
        <div className="min-h-screen bg-[#fbf6ef] font-nunito flex items-center justify-center p-6">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[2.5rem] border-[3px] border-slate-900 shadow-[8px_8px_0_#1f2937] p-10 text-center max-w-md w-full relative overflow-hidden"
            >
                {score > 0 && (
                    <div className="absolute inset-0 pointer-events-none">
                        {Array.from({ length: 15 }).map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ y: -20, x: Math.random() * 350, opacity: 1 }}
                                animate={{ y: 500, rotate: Math.random() * 720, opacity: 0 }}
                                transition={{ duration: 2 + Math.random(), delay: Math.random() * 0.3 }}
                                className={clsx("absolute w-2.5 h-2.5 rounded-sm", [
                                    'bg-pink-400', 'bg-amber-400', 'bg-emerald-400', 'bg-sky-400', 'bg-purple-400'
                                ][i % 5])}
                            />
                        ))}
                    </div>
                )}
                <div className="w-20 h-20 bg-amber-400 rounded-[2rem] border-[3px] border-slate-900 shadow-[4px_4px_0_#1f2937] flex items-center justify-center mx-auto mb-6">
                    <Trophy size={36} className="text-white" />
                </div>
                <h2 className="text-3xl font-black text-[#263D5B] uppercase tracking-tight mb-2">Hoàn thành!</h2>
                <p className="text-slate-500 font-bold mb-6">Cặp âm: {PAIR_LABELS[pairType]}</p>
                <div className="bg-[#fbf6ef] rounded-2xl border-[2px] border-slate-900 shadow-[3px_3px_0_#1f2937] p-6 mb-6">
                    <span className="text-5xl font-black text-[#49B6E5]">{score}</span>
                    <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wider">Tổng điểm</p>
                </div>
                <div className="flex gap-3">
                    <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleRestart}
                        className="flex-1 h-12 rounded-xl border-[2.5px] border-slate-900 bg-[#49B6E5] text-white font-black text-sm uppercase tracking-wider shadow-[3px_3px_0_#1f2937] flex items-center justify-center gap-2"
                    >
                        <RotateCcw size={16} /> Chơi lại
                    </motion.button>
                    <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/learner/minigames')}
                        className="flex-1 h-12 rounded-xl border-[2.5px] border-slate-900 bg-white text-[#263D5B] font-black text-sm uppercase tracking-wider shadow-[3px_3px_0_#1f2937] flex items-center justify-center gap-2"
                    >
                        <ArrowLeft size={16} /> Lobby
                    </motion.button>
                </div>
            </motion.div>
        </div>
    )

    if (!current) return null

    const sentenceParts = current.sentence.split('___')

    return (
        <div className="min-h-screen bg-[#fbf6ef] font-nunito p-6 lg:p-10">
            <div className="max-w-2xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate('/learner/minigames')} className="w-10 h-10 rounded-xl border-[2px] border-slate-900 bg-white shadow-[2px_2px_0_#1f2937] flex items-center justify-center hover:-translate-y-0.5 transition-transform">
                        <ArrowLeft size={18} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 rounded-xl border-[2px] border-slate-900 bg-white shadow-[2px_2px_0_#1f2937]">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cặp âm</span>
                            <p className="font-black text-[#263D5B] text-sm">{PAIR_LABELS[pairType]}</p>
                        </div>
                        <div className={clsx("px-4 py-2 rounded-xl border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937]", timeLeft <= 5 ? "bg-red-50" : "bg-white")}>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian</span>
                            <p className={clsx("font-black text-sm flex items-center gap-1", timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-[#263D5B]")}>
                                <Timer size={12} /> {timeLeft}s
                            </p>
                        </div>
                        <div className="px-4 py-2 rounded-xl border-[2px] border-slate-900 bg-white shadow-[2px_2px_0_#1f2937]">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Câu</span>
                            <p className="font-black text-[#263D5B] text-sm">{currentIndex + 1}/{challenges.length}</p>
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="h-3 bg-white rounded-full border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937] overflow-hidden">
                    <motion.div
                        className="h-full bg-amber-400 rounded-full"
                        animate={{ width: `${((currentIndex + 1) / challenges.length) * 100}%` }}
                        transition={{ type: 'spring', stiffness: 100 }}
                    />
                </div>

                {/* Combo & Score */}
                <div className="flex items-center justify-between">
                    <AnimatePresence>
                        {combo >= 2 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5, x: -20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 border-[2px] border-slate-900 shadow-[3px_3px_0_#1f2937]"
                            >
                                <span className="text-white font-black text-xs flex items-center gap-1">
                                    <Zap size={12} /> COMBO x{combo}!
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className="ml-auto px-4 py-2 rounded-xl border-[2px] border-slate-900 bg-white shadow-[2px_2px_0_#1f2937]">
                        <span className="font-black text-[#49B6E5] text-sm">{score} điểm</span>
                    </div>
                </div>

                {/* Timer bar */}
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                        className={clsx("h-full rounded-full", timeLeft <= 5 ? "bg-red-500" : "bg-amber-400")}
                        animate={{ width: `${(timeLeft / 20) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>

                {/* Question Card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="bg-white rounded-[2rem] border-[2.5px] border-slate-900 shadow-[6px_6px_0_#1f2937] p-8"
                    >
                        <motion.div animate={shakeWrong ? { x: [0, -10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.4 }}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-amber-500 border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937] flex items-center justify-center">
                                    <Sparkles size={18} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-black text-sm text-[#263D5B] uppercase tracking-tight">Hoàn thành câu</h3>
                                    {current.context && <p className="text-[11px] font-bold text-slate-400">{current.context}</p>}
                                </div>
                            </div>

                            {/* Sentence with blank */}
                            <div className="bg-[#fbf6ef] rounded-xl border-[2px] border-slate-200 p-6 mb-6 text-center">
                                <p className="text-xl font-black text-[#263D5B] leading-relaxed">
                                    {sentenceParts[0]}
                                    <motion.span
                                        animate={showResult && selectedAnswer === current.correctIndex ? { scale: [1, 1.2, 1] } : {}}
                                        className={clsx(
                                            "inline-block min-w-[60px] mx-1 px-3 py-1 rounded-lg border-[2px] border-dashed",
                                            showResult && selectedAnswer === current.correctIndex ? "border-emerald-400 bg-emerald-50 text-emerald-700" :
                                            showResult && selectedAnswer !== current.correctIndex ? "border-red-400 bg-red-50 text-red-700" :
                                            "border-[#49B6E5] bg-sky-50 text-[#49B6E5]"
                                        )}>
                                        {showResult ? current.options[current.correctIndex] : '___'}
                                    </motion.span>
                                    {sentenceParts[1]}
                                </p>
                            </div>

                            {/* Options */}
                            <div className="grid grid-cols-2 gap-3">
                                {current.options.map((option, idx) => {
                                    const isCorrect = idx === current.correctIndex
                                    const isSelected = idx === selectedAnswer
                                    return (
                                        <motion.button
                                            key={idx}
                                            whileHover={!showResult ? { y: -2, scale: 1.02 } : {}}
                                            whileTap={!showResult ? { scale: 0.95 } : {}}
                                            onClick={() => handleSelectAnswer(idx)}
                                            disabled={showResult}
                                            className={clsx(
                                                "p-4 rounded-xl border-[2.5px] font-black text-center text-lg transition-all",
                                                showResult && isCorrect && "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-[3px_3px_0_#16a34a]",
                                                showResult && isSelected && !isCorrect && "border-red-500 bg-red-50 text-red-700 shadow-[3px_3px_0_#dc2626]",
                                                !showResult && "border-slate-900 bg-white shadow-[3px_3px_0_#1f2937] hover:bg-sky-50 hover:border-[#49B6E5]",
                                                showResult && !isSelected && !isCorrect && "border-slate-200 bg-slate-50 text-slate-400 shadow-none"
                                            )}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                {option}
                                                {showResult && isCorrect && <CheckCircle2 size={18} />}
                                                {showResult && isSelected && !isCorrect && <XCircle size={18} />}
                                            </div>
                                        </motion.button>
                                    )
                                })}
                            </div>

                            {/* Explanation */}
                            {showResult && current.explanation && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 p-4 bg-sky-50 rounded-xl border-[2px] border-[#49B6E5]"
                                >
                                    <p className="text-sm font-bold text-[#263D5B]">{current.explanation}</p>
                                </motion.div>
                            )}

                            {/* Next button */}
                            {showResult && (
                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleNext}
                                    className="w-full mt-4 h-12 rounded-xl border-[2.5px] border-slate-900 bg-[#263D5B] text-white font-black text-sm uppercase tracking-wider shadow-[3px_3px_0_#1f2937] flex items-center justify-center gap-2"
                                >
                                    {currentIndex + 1 >= challenges.length ? 'Xem kết quả' : 'Câu tiếp theo →'}
                                </motion.button>
                            )}
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}

export default SentenceCompletionPage
