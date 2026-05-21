import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, Trophy, Puzzle, Zap, Timer } from 'lucide-react'
import { message, Spin } from 'antd'
import clsx from 'clsx'
import { minigameService } from '../../services/minigameService'
import GameRulesModal from '../../components/GameRulesModal'

interface Challenge {
    id: string
    pairType: string
    prompt?: string
    options?: string[]
    correctIndex?: number
    explanation?: string
    type?: string
    targetWord?: string
    scrambledLetters?: string[]
    hint?: string
}

const PAIR_LABELS: Record<string, string> = {
    N_L: 'N / L', S_X: 'S / X', D_GI_R: 'D / GI / R', TR_CH: 'TR / CH'
}

const GAME_RULES_CONFIG = {
    title: 'Thử thách từ vựng',
    icon: Puzzle,
    iconColor: 'bg-[#49B6E5]',
    description: 'Chọn từ đúng hoặc xếp chữ để luyện phân biệt âm',
    rules: [
        'Mỗi câu hỏi có 15 giây để trả lời',
        'Chọn đáp án đúng hoặc xếp chữ thành từ hoàn chỉnh',
        'Trả lời đúng liên tiếp để tạo combo và nhân điểm',
        'Hết giờ = trả lời sai',
    ],
    scoring: [
        'Trả lời đúng: +10 điểm',
        'Combo x2: điểm x1.5, Combo x3+: điểm x2',
        'Trả lời trong 5s đầu: +5 bonus',
    ],
    tips: [
        'Đọc kỹ câu hỏi trước khi chọn',
        'Với xếp chữ, tìm âm đầu trước rồi ghép phần còn lại',
    ],
}

const WordChallengePage: React.FC = () => {
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
    const [timeLeft, setTimeLeft] = useState(15)
    const [shakeWrong, setShakeWrong] = useState(false)
    const [bounceCorrect, setBounceCorrect] = useState(false)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Arrange mode state
    const [arrangedLetters, setArrangedLetters] = useState<string[]>([])
    const [remainingLetters, setRemainingLetters] = useState<string[]>([])
    const [arrangeChecked, setArrangeChecked] = useState(false)
    const [arrangeCorrect, setArrangeCorrect] = useState(false)

    const fetchChallenges = async () => {
        setLoading(true)
        try {
            const res: any = await minigameService.getWordChallenges(pairType)
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
        setTimeLeft(15)
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
        if (showResult || arrangeChecked) return
        const current = challenges[currentIndex]
        if (current?.type === 'ARRANGE') {
            setArrangeChecked(true)
            setArrangeCorrect(false)
            setCombo(0)
        } else {
            setShowResult(true)
            setSelectedAnswer(-1)
            setCombo(0)
            setShakeWrong(true)
            setTimeout(() => setShakeWrong(false), 500)
        }
    }

    useEffect(() => {
        if (challenges.length > 0 && !showResult && !arrangeChecked && !gameOver) {
            startTimer()
        }
        return () => stopTimer()
    }, [currentIndex, challenges.length])

    useEffect(() => {
        if (challenges.length > 0 && challenges[0]?.type === 'ARRANGE' && challenges[0].scrambledLetters) {
            setRemainingLetters([...challenges[0].scrambledLetters])
        }
    }, [challenges])

    useEffect(() => {
        const current = challenges[currentIndex]
        if (current?.type === 'ARRANGE' && current.scrambledLetters && arrangedLetters.length === 0 && !arrangeChecked) {
            setRemainingLetters([...current.scrambledLetters])
        }
    }, [currentIndex])

    const current = challenges[currentIndex]
    const isArrangeMode = current?.type === 'ARRANGE'

    const calculatePoints = (isCorrect: boolean): number => {
        if (!isCorrect) return 0
        let points = 10
        if (timeLeft >= 10) points += 5
        if (combo >= 2) points = Math.floor(points * 1.5)
        if (combo >= 3) points = Math.floor(points * 2 / 1.5)
        return points
    }

    const handleSelectAnswer = (idx: number) => {
        if (showResult) return
        stopTimer()
        setSelectedAnswer(idx)
        setShowResult(true)
        if (idx === current.correctIndex) {
            const newCombo = combo + 1
            setCombo(newCombo)
            const points = calculatePoints(true)
            setScore(prev => prev + points)
            setBounceCorrect(true)
            setTimeout(() => setBounceCorrect(false), 500)
        } else {
            setCombo(0)
            setShakeWrong(true)
            setTimeout(() => setShakeWrong(false), 500)
        }
    }

    const handleArrangeLetterClick = (letter: string, idx: number) => {
        if (arrangeChecked) return
        setArrangedLetters(prev => [...prev, letter])
        setRemainingLetters(prev => prev.filter((_, i) => i !== idx))
    }

    const handleRemoveArrangedLetter = (idx: number) => {
        if (arrangeChecked) return
        const letter = arrangedLetters[idx]
        setRemainingLetters(prev => [...prev, letter])
        setArrangedLetters(prev => prev.filter((_, i) => i !== idx))
    }

    const handleCheckArrange = () => {
        stopTimer()
        const userWord = arrangedLetters.join('')
        const target = current.targetWord?.replace(/\s/g, '') || ''
        const correct = userWord === target
        setArrangeCorrect(correct)
        setArrangeChecked(true)
        if (correct) {
            const newCombo = combo + 1
            setCombo(newCombo)
            const points = calculatePoints(true)
            setScore(prev => prev + points)
            setBounceCorrect(true)
            setTimeout(() => setBounceCorrect(false), 500)
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
        setArrangedLetters([])
        setArrangeChecked(false)
        setArrangeCorrect(false)
        const next = challenges[currentIndex + 1]
        if (next?.type === 'ARRANGE' && next.scrambledLetters) {
            setRemainingLetters([...next.scrambledLetters])
        }
    }

    const handleRestart = () => {
        stopTimer()
        setCurrentIndex(0)
        setSelectedAnswer(null)
        setShowResult(false)
        setScore(0)
        setCombo(0)
        setGameOver(false)
        setArrangedLetters([])
        setArrangeChecked(false)
        setArrangeCorrect(false)
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
                {/* Confetti */}
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
                        className="h-full bg-[#49B6E5] rounded-full"
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
                        className={clsx("h-full rounded-full", timeLeft <= 5 ? "bg-red-500" : "bg-emerald-400")}
                        animate={{ width: `${(timeLeft / 15) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>

                {/* Question Card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0, scale: bounceCorrect ? [1, 1.02, 1] : 1 }}
                        exit={{ opacity: 0, x: -50 }}
                        className={clsx("bg-white rounded-[2rem] border-[2.5px] border-slate-900 shadow-[6px_6px_0_#1f2937] p-8")}
                    >
                        <motion.div animate={shakeWrong ? { x: [0, -10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.4 }}>
                            {!isArrangeMode ? (
                                <>
                                    {/* Multiple Choice Mode */}
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-[#49B6E5] border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937] flex items-center justify-center">
                                            <Puzzle size={18} className="text-white" />
                                        </div>
                                        <h3 className="font-black text-lg text-[#263D5B]">{current.prompt}</h3>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        {current.options?.map((option, idx) => {
                                            const isCorrect = idx === current.correctIndex
                                            const isSelected = idx === selectedAnswer
                                            return (
                                                <motion.button
                                                    key={idx}
                                                    whileHover={!showResult ? { y: -2 } : {}}
                                                    whileTap={!showResult ? { scale: 0.98 } : {}}
                                                    onClick={() => handleSelectAnswer(idx)}
                                                    disabled={showResult}
                                                    className={clsx(
                                                        "w-full p-4 rounded-xl border-[2.5px] font-black text-left text-lg transition-all",
                                                        showResult && isCorrect && "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-[3px_3px_0_#16a34a]",
                                                        showResult && isSelected && !isCorrect && "border-red-500 bg-red-50 text-red-700 shadow-[3px_3px_0_#dc2626]",
                                                        !showResult && "border-slate-900 bg-white shadow-[3px_3px_0_#1f2937] hover:bg-sky-50 hover:border-[#49B6E5]",
                                                        showResult && !isSelected && !isCorrect && "border-slate-200 bg-slate-50 text-slate-400 shadow-none"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-8 h-8 rounded-lg border-[2px] border-current flex items-center justify-center text-sm">
                                                            {String.fromCharCode(65 + idx)}
                                                        </span>
                                                        {option}
                                                        {showResult && isCorrect && <CheckCircle2 size={20} className="ml-auto" />}
                                                        {showResult && isSelected && !isCorrect && <XCircle size={20} className="ml-auto" />}
                                                    </div>
                                                </motion.button>
                                            )
                                        })}
                                    </div>

                                    {showResult && current.explanation && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-4 p-4 bg-sky-50 rounded-xl border-[2px] border-[#49B6E5]"
                                        >
                                            <p className="text-sm font-bold text-[#263D5B]">{current.explanation}</p>
                                        </motion.div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {/* Arrange Mode */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500 border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937] flex items-center justify-center">
                                            <Puzzle size={18} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-lg text-[#263D5B]">Xếp chữ thành từ đúng</h3>
                                            {current.hint && <p className="text-xs font-bold text-slate-400">Gợi ý: {current.hint}</p>}
                                        </div>
                                    </div>

                                    {/* Arranged area */}
                                    <div className="min-h-[60px] p-3 rounded-xl border-[2.5px] border-dashed border-slate-300 bg-slate-50 flex flex-wrap gap-2 mb-4">
                                        {arrangedLetters.length === 0 && (
                                            <span className="text-sm font-bold text-slate-300 self-center">Nhấn vào chữ bên dưới để xếp...</span>
                                        )}
                                        {arrangedLetters.map((letter, idx) => (
                                            <motion.button
                                                key={`arranged-${idx}`}
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                onClick={() => handleRemoveArrangedLetter(idx)}
                                                className={clsx(
                                                    "w-10 h-10 rounded-lg border-[2px] font-black text-lg flex items-center justify-center",
                                                    arrangeChecked && arrangeCorrect && "border-emerald-500 bg-emerald-50 text-emerald-700",
                                                    arrangeChecked && !arrangeCorrect && "border-red-500 bg-red-50 text-red-700",
                                                    !arrangeChecked && "border-slate-900 bg-white shadow-[2px_2px_0_#1f2937] hover:bg-red-50"
                                                )}
                                            >
                                                {letter}
                                            </motion.button>
                                        ))}
                                    </div>

                                    {/* Remaining letters */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {remainingLetters.map((letter, idx) => (
                                            <motion.button
                                                key={`remaining-${idx}`}
                                                whileHover={{ y: -2 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleArrangeLetterClick(letter, idx)}
                                                className="w-10 h-10 rounded-lg border-[2.5px] border-slate-900 bg-white shadow-[3px_3px_0_#1f2937] font-black text-lg flex items-center justify-center hover:bg-[#49B6E5] hover:text-white transition-colors"
                                            >
                                                {letter}
                                            </motion.button>
                                        ))}
                                    </div>

                                    {!arrangeChecked && arrangedLetters.length > 0 && (
                                        <motion.button
                                            whileHover={{ y: -2 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={handleCheckArrange}
                                            className="w-full h-12 rounded-xl border-[2.5px] border-slate-900 bg-[#49B6E5] text-white font-black text-sm uppercase tracking-wider shadow-[3px_3px_0_#1f2937]"
                                        >
                                            Kiểm tra
                                        </motion.button>
                                    )}

                                    {arrangeChecked && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={clsx("p-4 rounded-xl border-[2px]", arrangeCorrect ? "bg-emerald-50 border-emerald-400" : "bg-red-50 border-red-400")}
                                        >
                                            <p className={clsx("font-black text-sm", arrangeCorrect ? "text-emerald-700" : "text-red-700")}>
                                                {arrangeCorrect ? 'Chính xác!' : `Sai rồi! Đáp án đúng: ${current.targetWord}`}
                                            </p>
                                        </motion.div>
                                    )}
                                </>
                            )}

                            {/* Next button */}
                            {(showResult || arrangeChecked) && (
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

export default WordChallengePage
