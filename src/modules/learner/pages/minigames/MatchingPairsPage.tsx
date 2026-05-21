import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, RotateCcw, Trophy, Timer, Zap, Layers } from 'lucide-react'
import clsx from 'clsx'
import GameRulesModal from '../../components/GameRulesModal'

interface Card {
    id: number
    word: string
    pairId: number
    flipped: boolean
    matched: boolean
}

const MOCK_PAIRS: Record<string, { word1: string; word2: string }[]> = {
    N_L: [
        { word1: 'nón', word2: 'lón' },
        { word1: 'nước', word2: 'lước' },
        { word1: 'nấm', word2: 'lấm' },
        { word1: 'nỗi', word2: 'lỗi' },
        { word1: 'nắng', word2: 'lắng' },
        { word1: 'nụ', word2: 'lụ' },
    ],
    S_X: [
        { word1: 'sáng', word2: 'xáng' },
        { word1: 'sắc', word2: 'xắc' },
        { word1: 'sơn', word2: 'xơn' },
        { word1: 'sung', word2: 'xung' },
        { word1: 'sấu', word2: 'xấu' },
        { word1: 'sót', word2: 'xót' },
    ],
    D_GI_R: [
        { word1: 'da', word2: 'gia' },
        { word1: 'dạy', word2: 'giạy' },
        { word1: 'dòng', word2: 'ròng' },
        { word1: 'dỗ', word2: 'giỗ' },
        { word1: 'dán', word2: 'rán' },
        { word1: 'dầu', word2: 'giầu' },
    ],
    TR_CH: [
        { word1: 'trăng', word2: 'chăng' },
        { word1: 'trời', word2: 'chời' },
        { word1: 'trẻ', word2: 'chẻ' },
        { word1: 'trung', word2: 'chung' },
        { word1: 'trà', word2: 'chà' },
        { word1: 'trắng', word2: 'chắng' },
    ],
}

const PAIR_LABELS: Record<string, string> = {
    N_L: 'N / L', S_X: 'S / X', D_GI_R: 'D / GI / R', TR_CH: 'TR / CH'
}

const GAME_RULES_CONFIG = {
    title: 'Nối cặp âm',
    icon: Layers,
    iconColor: 'bg-gradient-to-br from-pink-400 to-rose-500',
    description: 'Lật thẻ tìm cặp từ dễ nhầm lẫn',
    rules: [
        'Bảng gồm 12 thẻ úp, mỗi thẻ chứa 1 từ',
        'Lật 2 thẻ mỗi lượt — nếu là cặp âm dễ nhầm thì giữ nguyên',
        'Tìm hết 6 cặp trước khi hết giờ để chiến thắng',
        'Nối đúng liên tiếp sẽ được combo bonus!',
    ],
    scoring: [
        'Mỗi cặp đúng: +10 điểm',
        'Combo x2: +5 bonus, Combo x3+: +10 bonus',
        'Hoàn thành trước 30s: +20 bonus',
        'Hết giờ = Game Over',
    ],
    tips: [
        'Ghi nhớ vị trí thẻ đã lật để nối nhanh hơn',
        'Ưu tiên lật thẻ chưa thấy trước',
    ],
}

function shuffleArray<T>(arr: T[]): T[] {
    const shuffled = [...arr]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
}

const MatchingPairsPage: React.FC = () => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const pairType = searchParams.get('pair') || 'N_L'

    const [showRules, setShowRules] = useState(true)
    const [cards, setCards] = useState<Card[]>([])
    const [flippedIds, setFlippedIds] = useState<number[]>([])
    const [matchedPairs, setMatchedPairs] = useState(0)
    const [score, setScore] = useState(0)
    const [combo, setCombo] = useState(0)
    const [timeLeft, setTimeLeft] = useState(60)
    const [gameStarted, setGameStarted] = useState(false)
    const [gameOver, setGameOver] = useState(false)
    const [won, setWon] = useState(false)
    const [shakeWrong, setShakeWrong] = useState(false)
    const [showConfetti, setShowConfetti] = useState(false)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const lockRef = useRef(false)

    const initGame = useCallback(() => {
        const pairs = MOCK_PAIRS[pairType] || MOCK_PAIRS.N_L
        const cardList: Card[] = []
        pairs.forEach((pair, idx) => {
            cardList.push({ id: idx * 2, word: pair.word1, pairId: idx, flipped: false, matched: false })
            cardList.push({ id: idx * 2 + 1, word: pair.word2, pairId: idx, flipped: false, matched: false })
        })
        setCards(shuffleArray(cardList))
        setFlippedIds([])
        setMatchedPairs(0)
        setScore(0)
        setCombo(0)
        setTimeLeft(60)
        setGameOver(false)
        setWon(false)
        setShowConfetti(false)
        lockRef.current = false
    }, [pairType])

    const startGame = () => {
        setShowRules(false)
        setGameStarted(true)
        initGame()
    }

    useEffect(() => {
        if (gameStarted && !gameOver) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!)
                        setGameOver(true)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [gameStarted, gameOver])

    const handleCardClick = (cardId: number) => {
        if (lockRef.current || gameOver) return
        const card = cards.find(c => c.id === cardId)
        if (!card || card.flipped || card.matched) return

        const newFlipped = [...flippedIds, cardId]
        setFlippedIds(newFlipped)
        setCards(prev => prev.map(c => c.id === cardId ? { ...c, flipped: true } : c))

        if (newFlipped.length === 2) {
            lockRef.current = true
            const [first, second] = newFlipped.map(id => cards.find(c => c.id === id)!)

            setTimeout(() => {
                if (first.pairId === second.pairId) {
                    setCards(prev => prev.map(c =>
                        c.pairId === first.pairId ? { ...c, matched: true } : c
                    ))
                    const newCombo = combo + 1
                    setCombo(newCombo)
                    let points = 10
                    if (newCombo >= 3) points += 10
                    else if (newCombo >= 2) points += 5
                    setScore(prev => prev + points)
                    setMatchedPairs(prev => {
                        const newMatched = prev + 1
                        if (newMatched >= 6) {
                            clearInterval(timerRef.current!)
                            setWon(true)
                            setGameOver(true)
                            setShowConfetti(true)
                            if (timeLeft > 30) setScore(s => s + 20)
                        }
                        return newMatched
                    })
                } else {
                    setShakeWrong(true)
                    setTimeout(() => setShakeWrong(false), 500)
                    setCombo(0)
                    setCards(prev => prev.map(c =>
                        newFlipped.includes(c.id) ? { ...c, flipped: false } : c
                    ))
                }
                setFlippedIds([])
                lockRef.current = false
            }, 800)
        }
    }

    const handleRestart = () => {
        if (timerRef.current) clearInterval(timerRef.current)
        setGameStarted(false)
        setShowRules(true)
    }

    return (
        <div className="min-h-screen bg-[#fbf6ef] font-nunito p-6 lg:p-10">
            <GameRulesModal open={showRules} config={GAME_RULES_CONFIG} onStart={startGame} onClose={() => navigate('/learner/minigames')} />

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
                        <div className={clsx("px-4 py-2 rounded-xl border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937]", timeLeft <= 10 ? "bg-red-50" : "bg-white")}>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian</span>
                            <p className={clsx("font-black text-sm flex items-center gap-1", timeLeft <= 10 ? "text-red-500" : "text-[#263D5B]")}>
                                <Timer size={12} /> {timeLeft}s
                            </p>
                        </div>
                        <div className="px-4 py-2 rounded-xl border-[2px] border-slate-900 bg-white shadow-[2px_2px_0_#1f2937]">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Điểm</span>
                            <p className="font-black text-[#49B6E5] text-sm">{score}</p>
                        </div>
                    </div>
                </div>

                {/* Combo indicator */}
                <AnimatePresence>
                    {combo >= 2 && !gameOver && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="flex items-center justify-center gap-2"
                        >
                            <div className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 border-[2px] border-slate-900 shadow-[3px_3px_0_#1f2937]">
                                <span className="text-white font-black text-sm flex items-center gap-1">
                                    <Zap size={14} /> COMBO x{combo}!
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Game Over */}
                {gameOver ? (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-[2.5rem] border-[3px] border-slate-900 shadow-[8px_8px_0_#1f2937] p-10 text-center"
                    >
                        {/* Confetti particles */}
                        {showConfetti && (
                            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2.5rem]">
                                {Array.from({ length: 20 }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ y: -20, x: Math.random() * 400, opacity: 1 }}
                                        animate={{ y: 500, rotate: Math.random() * 720, opacity: 0 }}
                                        transition={{ duration: 2 + Math.random(), delay: Math.random() * 0.5 }}
                                        className={clsx("absolute w-3 h-3 rounded-sm", [
                                            'bg-pink-400', 'bg-amber-400', 'bg-emerald-400', 'bg-sky-400', 'bg-purple-400'
                                        ][i % 5])}
                                    />
                                ))}
                            </div>
                        )}

                        <div className={clsx("w-20 h-20 rounded-[2rem] border-[3px] border-slate-900 shadow-[4px_4px_0_#1f2937] flex items-center justify-center mx-auto mb-6", won ? "bg-amber-400" : "bg-slate-400")}>
                            <Trophy size={36} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-black text-[#263D5B] uppercase tracking-tight mb-2">
                            {won ? 'Chiến thắng!' : 'Hết giờ!'}
                        </h2>
                        <p className="text-slate-500 font-bold mb-6">
                            {won ? `Hoàn thành trong ${60 - timeLeft}s` : `Tìm được ${matchedPairs}/6 cặp`}
                        </p>
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
                ) : gameStarted && (
                    /* Card Grid */
                    <motion.div
                        animate={shakeWrong ? { x: [0, -8, 8, -8, 8, 0] } : {}}
                        transition={{ duration: 0.4 }}
                        className="grid grid-cols-3 md:grid-cols-4 gap-4"
                    >
                        {cards.map(card => (
                            <motion.div
                                key={card.id}
                                whileHover={!card.flipped && !card.matched ? { y: -3 } : {}}
                                whileTap={!card.flipped && !card.matched ? { scale: 0.95 } : {}}
                                onClick={() => handleCardClick(card.id)}
                                className="relative aspect-square cursor-pointer"
                                style={{ perspective: '600px' }}
                            >
                                <motion.div
                                    animate={{ rotateY: card.flipped || card.matched ? 180 : 0 }}
                                    transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
                                    className="w-full h-full relative"
                                    style={{ transformStyle: 'preserve-3d' }}
                                >
                                    {/* Back (hidden) */}
                                    <div className={clsx(
                                        "absolute inset-0 rounded-2xl border-[2.5px] border-slate-900 flex items-center justify-center backface-hidden",
                                        card.matched ? "bg-emerald-100 border-emerald-500 shadow-[3px_3px_0_#16a34a]" : "bg-gradient-to-br from-[#49B6E5] to-blue-600 shadow-[4px_4px_0_#1f2937]"
                                    )} style={{ backfaceVisibility: 'hidden' }}>
                                        <span className="text-3xl font-black text-white">?</span>
                                    </div>
                                    {/* Front (word) */}
                                    <div className={clsx(
                                        "absolute inset-0 rounded-2xl border-[2.5px] flex items-center justify-center",
                                        card.matched
                                            ? "border-emerald-500 bg-emerald-50 shadow-[3px_3px_0_#16a34a]"
                                            : "border-slate-900 bg-white shadow-[4px_4px_0_#1f2937]"
                                    )} style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                                        <span className={clsx("text-xl font-black", card.matched ? "text-emerald-700" : "text-[#263D5B]")}>
                                            {card.word}
                                        </span>
                                    </div>
                                </motion.div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* Progress */}
                {gameStarted && !gameOver && (
                    <div className="flex items-center justify-center gap-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <motion.div
                                key={i}
                                animate={i < matchedPairs ? { scale: [1, 1.3, 1] } : {}}
                                className={clsx(
                                    "w-4 h-4 rounded-full border-[2px] border-slate-900",
                                    i < matchedPairs ? "bg-emerald-400 shadow-[2px_2px_0_#1f2937]" : "bg-slate-200"
                                )}
                            />
                        ))}
                        <span className="ml-2 text-xs font-black text-slate-400">{matchedPairs}/6 cặp</span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default MatchingPairsPage
