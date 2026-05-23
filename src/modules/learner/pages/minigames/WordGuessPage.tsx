import React, { useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, RotateCcw, Trophy, Heart, HelpCircle, Lightbulb, Search } from 'lucide-react'
import clsx from 'clsx'
import GameRulesModal from '../../components/GameRulesModal'

interface WordData {
    word: string
    hint: string
    category: string
}

const MOCK_WORDS: Record<string, WordData[]> = {
    N_L: [
        { word: 'nắng', hint: 'Ánh mặt trời chiếu xuống', category: 'Thời tiết' },
        { word: 'lạnh', hint: 'Cảm giác khi mùa đông đến', category: 'Thời tiết' },
        { word: 'nước', hint: 'Chất lỏng uống hàng ngày', category: 'Tự nhiên' },
        { word: 'lửa', hint: 'Cháy sáng, tỏa nhiệt', category: 'Tự nhiên' },
        { word: 'nồi', hint: 'Dụng cụ nấu ăn', category: 'Nhà bếp' },
        { word: 'lưỡi', hint: 'Bộ phận trong miệng giúp nếm', category: 'Cơ thể' },
        { word: 'nấm', hint: 'Mọc ở nơi ẩm ướt, có thể ăn được', category: 'Thực phẩm' },
        { word: 'lồng', hint: 'Dùng để nhốt chim', category: 'Đồ vật' },
    ],
    S_X: [
        { word: 'sáng', hint: 'Buổi đầu tiên trong ngày', category: 'Thời gian' },
        { word: 'xanh', hint: 'Màu của lá cây', category: 'Màu sắc' },
        { word: 'sông', hint: 'Dòng nước chảy dài', category: 'Tự nhiên' },
        { word: 'xuân', hint: 'Mùa đầu tiên trong năm', category: 'Thời gian' },
        { word: 'sách', hint: 'Đọc để học kiến thức', category: 'Đồ vật' },
        { word: 'xóm', hint: 'Khu dân cư nhỏ', category: 'Địa điểm' },
        { word: 'sợi', hint: 'Dùng để dệt vải', category: 'Đồ vật' },
        { word: 'xương', hint: 'Bộ khung bên trong cơ thể', category: 'Cơ thể' },
    ],
    D_GI_R: [
        { word: 'dừa', hint: 'Cây nhiệt đới, quả có nước ngọt', category: 'Thực vật' },
        { word: 'gió', hint: 'Không khí chuyển động', category: 'Tự nhiên' },
        { word: 'rừng', hint: 'Nơi có nhiều cây cối', category: 'Tự nhiên' },
        { word: 'dạy', hint: 'Giáo viên làm việc này', category: 'Hành động' },
        { word: 'giày', hint: 'Đi ở chân khi ra ngoài', category: 'Đồ vật' },
        { word: 'rắn', hint: 'Loài bò sát không chân', category: 'Động vật' },
        { word: 'dầu', hint: 'Chất lỏng dùng để chiên', category: 'Nhà bếp' },
        { word: 'giấc', hint: '... mơ — khi ngủ', category: 'Sinh hoạt' },
    ],
    TR_CH: [
        { word: 'trăng', hint: 'Sáng trên bầu trời đêm', category: 'Tự nhiên' },
        { word: 'chim', hint: 'Loài có cánh, biết bay', category: 'Động vật' },
        { word: 'trường', hint: 'Nơi học sinh đến học', category: 'Địa điểm' },
        { word: 'chợ', hint: 'Nơi mua bán hàng hóa', category: 'Địa điểm' },
        { word: 'trẻ', hint: 'Người còn nhỏ tuổi', category: 'Con người' },
        { word: 'chạy', hint: 'Di chuyển nhanh bằng chân', category: 'Hành động' },
        { word: 'trái', hint: 'Quả cây, hoặc hướng ngược phải', category: 'Tự nhiên' },
        { word: 'cháo', hint: 'Món ăn nấu từ gạo loãng', category: 'Thực phẩm' },
    ],
}

const PAIR_LABELS: Record<string, string> = {
    N_L: 'N / L', S_X: 'S / X', D_GI_R: 'D / GI / R', TR_CH: 'TR / CH'
}

const GAME_RULES_CONFIG = {
    title: 'Đoán từ',
    icon: Search,
    iconColor: 'bg-gradient-to-br from-violet-400 to-purple-600',
    description: 'Đoán từ qua gợi ý, chọn đúng chữ cái',
    rules: [
        'Mỗi lượt sẽ có 1 từ ẩn và gợi ý về nghĩa',
        'Chọn từng chữ cái để đoán từ',
        'Bạn có 5 mạng — mỗi chữ sai mất 1 mạng',
        'Dùng "Gợi ý" để mở 1 chữ (tốn 1 mạng)',
        'Đoán hết 8 từ hoặc hết mạng = kết thúc',
    ],
    scoring: [
        'Đoán đúng từ: +10 điểm',
        'Mỗi mạng còn lại cuối game: +5 bonus',
        'Không dùng gợi ý: +3 bonus mỗi từ',
    ],
    tips: [
        'Bắt đầu với nguyên âm (a, e, i, o, u) để tìm cấu trúc từ',
        'Chú ý gợi ý và danh mục để thu hẹp đáp án',
    ],
}

const VIETNAMESE_CHARS = [
    'a', 'ă', 'â', 'b', 'c', 'd', 'đ', 'e', 'ê', 'g', 'h', 'i',
    'k', 'l', 'm', 'n', 'o', 'ô', 'ơ', 'p', 'q', 'r', 's', 't',
    'u', 'ư', 'v', 'x', 'y'
]

function normalizeChar(char: string): string {
    return char.normalize('NFD').replace(/[̀-ͯ]/g, '').replace('đ', 'd').replace('Đ', 'D')
}

const WordGuessPage: React.FC = () => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const pairType = searchParams.get('pair') || 'N_L'

    const [showRules, setShowRules] = useState(true)
    const [words, setWords] = useState<WordData[]>([])
    const [currentWordIndex, setCurrentWordIndex] = useState(0)
    const [guessedChars, setGuessedChars] = useState<Set<string>>(new Set())
    const [lives, setLives] = useState(5)
    const [score, setScore] = useState(0)
    const [usedHint, setUsedHint] = useState(false)
    const [wordCompleted, setWordCompleted] = useState(false)
    const [wordFailed, setWordFailed] = useState(false)
    const [gameOver, setGameOver] = useState(false)
    const [lostLife, setLostLife] = useState(false)
    const [correctGuess, setCorrectGuess] = useState(false)

    const currentWord = words[currentWordIndex]

    const initGame = useCallback(() => {
        const allWords = MOCK_WORDS[pairType] || MOCK_WORDS.N_L
        const shuffled = [...allWords].sort(() => Math.random() - 0.5)
        setWords(shuffled)
        setCurrentWordIndex(0)
        setGuessedChars(new Set())
        setLives(5)
        setScore(0)
        setUsedHint(false)
        setWordCompleted(false)
        setWordFailed(false)
        setGameOver(false)
    }, [pairType])

    const startGame = () => {
        setShowRules(false)
        initGame()
    }

    const isCharRevealed = (char: string): boolean => {
        if (char === ' ') return true
        const normalized = normalizeChar(char)
        for (const guessed of guessedChars) {
            if (normalizeChar(guessed) === normalized) return true
        }
        return false
    }

    const isWordComplete = (word: string, guessed: Set<string>): boolean => {
        return [...word].every(char => {
            if (char === ' ') return true
            const normalized = normalizeChar(char)
            for (const g of guessed) {
                if (normalizeChar(g) === normalized) return true
            }
            return false
        })
    }

    const handleCharClick = (char: string) => {
        if (wordCompleted || wordFailed || gameOver || guessedChars.has(char)) return

        const newGuessed = new Set(guessedChars)
        newGuessed.add(char)
        setGuessedChars(newGuessed)

        const normalizedChar = normalizeChar(char)
        const wordChars = [...currentWord.word].map(c => normalizeChar(c))
        const isCorrect = wordChars.includes(normalizedChar)

        if (isCorrect) {
            setCorrectGuess(true)
            setTimeout(() => setCorrectGuess(false), 400)

            if (isWordComplete(currentWord.word, newGuessed)) {
                setWordCompleted(true)
                let points = 10
                if (!usedHint) points += 3
                setScore(prev => prev + points)
            }
        } else {
            setLostLife(true)
            setTimeout(() => setLostLife(false), 500)
            const newLives = lives - 1
            setLives(newLives)
            if (newLives <= 0) {
                setWordFailed(true)
                setGameOver(true)
            }
        }
    }

    const handleHint = () => {
        if (lives <= 1 || wordCompleted || wordFailed) return
        setUsedHint(true)
        setLives(prev => prev - 1)

        const unrevealed = [...currentWord.word].filter(char => char !== ' ' && !isCharRevealed(char))
        if (unrevealed.length > 0) {
            const randomChar = unrevealed[Math.floor(Math.random() * unrevealed.length)]
            const baseChar = normalizeChar(randomChar)
            const matchingKey = VIETNAMESE_CHARS.find(c => normalizeChar(c) === baseChar)
            if (matchingKey) {
                const newGuessed = new Set(guessedChars)
                newGuessed.add(matchingKey)
                setGuessedChars(newGuessed)

                if (isWordComplete(currentWord.word, newGuessed)) {
                    setWordCompleted(true)
                    setScore(prev => prev + 10)
                }
            }
        }
    }

    const handleNextWord = () => {
        if (currentWordIndex + 1 >= words.length) {
            setGameOver(true)
            setScore(prev => prev + lives * 5)
            return
        }
        setCurrentWordIndex(prev => prev + 1)
        setGuessedChars(new Set())
        setUsedHint(false)
        setWordCompleted(false)
        setWordFailed(false)
    }

    const handleRestart = () => {
        setShowRules(true)
    }

    if (showRules) {
        return (
            <div className="min-h-screen bg-[#fbf6ef] font-nunito p-6 lg:p-10">
                <GameRulesModal open={showRules} config={GAME_RULES_CONFIG} onStart={startGame} onClose={() => navigate('/learner/minigames')} />
            </div>
        )
    }

    if (gameOver) {
        return (
            <div className="min-h-screen bg-[#fbf6ef] font-nunito flex items-center justify-center p-6">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-[2.5rem] border-[3px] border-slate-900 shadow-[8px_8px_0_#1f2937] p-10 text-center max-w-md w-full"
                >
                    <div className={clsx("w-20 h-20 rounded-[2rem] border-[3px] border-slate-900 shadow-[4px_4px_0_#1f2937] flex items-center justify-center mx-auto mb-6", lives > 0 ? "bg-amber-400" : "bg-slate-400")}>
                        <Trophy size={36} className="text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-[#263D5B] uppercase tracking-tight mb-2">
                        {lives > 0 ? 'Hoàn thành!' : 'Hết mạng!'}
                    </h2>
                    <p className="text-slate-500 font-bold mb-2">Cặp âm: {PAIR_LABELS[pairType]}</p>
                    <p className="text-slate-400 font-bold text-sm mb-6">
                        Đoán được {currentWordIndex + (wordCompleted ? 1 : 0)}/{words.length} từ
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
            </div>
        )
    }

    if (!currentWord) return null

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
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Từ</span>
                            <p className="font-black text-[#263D5B] text-sm">{currentWordIndex + 1}/{words.length}</p>
                        </div>
                        <div className="px-4 py-2 rounded-xl border-[2px] border-slate-900 bg-white shadow-[2px_2px_0_#1f2937]">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Điểm</span>
                            <p className="font-black text-[#49B6E5] text-sm">{score}</p>
                        </div>
                    </div>
                </div>

                {/* Lives */}
                <div className="flex items-center justify-center gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <motion.div
                            key={i}
                            animate={lostLife && i === lives ? { scale: [1, 1.5, 0], opacity: [1, 1, 0] } : {}}
                            transition={{ duration: 0.5 }}
                        >
                            <Heart
                                size={28}
                                className={clsx(
                                    "transition-all",
                                    i < lives ? "text-red-500 fill-red-500" : "text-slate-200 fill-slate-200"
                                )}
                            />
                        </motion.div>
                    ))}
                </div>

                {/* Word Card */}
                <motion.div
                    animate={correctGuess ? { scale: [1, 1.02, 1] } : {}}
                    className="bg-white rounded-[2rem] border-[2.5px] border-slate-900 shadow-[6px_6px_0_#1f2937] p-8"
                >
                    {/* Category & Hint */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-purple-500 border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937] flex items-center justify-center">
                            <Lightbulb size={18} className="text-white" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{currentWord.category}</span>
                            <p className="font-bold text-[#263D5B] text-sm">{currentWord.hint}</p>
                        </div>
                    </div>

                    {/* Word Display */}
                    <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
                        {[...currentWord.word].map((char, idx) => {
                            if (char === ' ') {
                                return <div key={idx} className="w-4" />
                            }
                            const revealed = isCharRevealed(char)
                            return (
                                <motion.div
                                    key={idx}
                                    initial={false}
                                    animate={revealed ? { scale: [0.8, 1.1, 1], rotateX: [90, 0] } : {}}
                                    transition={{ duration: 0.3 }}
                                    className={clsx(
                                        "w-12 h-14 rounded-xl border-[2.5px] flex items-center justify-center text-2xl font-black",
                                        revealed
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-[2px_2px_0_#16a34a]"
                                            : "border-slate-900 bg-slate-100 text-transparent shadow-[3px_3px_0_#1f2937]"
                                    )}
                                >
                                    {revealed ? char : '_'}
                                </motion.div>
                            )
                        })}
                    </div>

                    {/* Hint Button */}
                    {!wordCompleted && !wordFailed && (
                        <div className="flex justify-center mb-6">
                            <motion.button
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleHint}
                                disabled={lives <= 1}
                                className="px-4 py-2 rounded-xl border-[2px] border-slate-900 bg-amber-50 text-amber-700 font-black text-xs uppercase tracking-wider shadow-[2px_2px_0_#1f2937] flex items-center gap-2 disabled:opacity-40"
                            >
                                <HelpCircle size={14} /> Gợi ý (-1 mạng)
                            </motion.button>
                        </div>
                    )}

                    {/* Keyboard */}
                    {!wordCompleted && !wordFailed && (
                        <div className="flex flex-wrap justify-center gap-2">
                            {VIETNAMESE_CHARS.map(char => {
                                const isUsed = guessedChars.has(char)
                                const normalizedChar = normalizeChar(char)
                                const wordChars = [...currentWord.word].map(c => normalizeChar(c))
                                const isCorrectChar = isUsed && wordChars.includes(normalizedChar)
                                const isWrongChar = isUsed && !wordChars.includes(normalizedChar)

                                return (
                                    <motion.button
                                        key={char}
                                        whileHover={!isUsed ? { y: -2 } : {}}
                                        whileTap={!isUsed ? { scale: 0.9 } : {}}
                                        onClick={() => handleCharClick(char)}
                                        disabled={isUsed}
                                        className={clsx(
                                            "w-9 h-9 rounded-lg border-[2px] font-black text-sm flex items-center justify-center transition-all",
                                            isCorrectChar && "border-emerald-500 bg-emerald-100 text-emerald-700",
                                            isWrongChar && "border-red-300 bg-red-50 text-red-300",
                                            !isUsed && "border-slate-900 bg-white shadow-[2px_2px_0_#1f2937] hover:bg-purple-50 hover:border-purple-500"
                                        )}
                                    >
                                        {char}
                                    </motion.button>
                                )
                            })}
                        </div>
                    )}

                    {/* Word completed */}
                    {wordCompleted && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center"
                        >
                            <div className="p-4 bg-emerald-50 rounded-xl border-[2px] border-emerald-400 mb-4">
                                <p className="font-black text-emerald-700">Chính xác! 🎉</p>
                            </div>
                            <motion.button
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={handleNextWord}
                                className="w-full h-12 rounded-xl border-[2.5px] border-slate-900 bg-[#263D5B] text-white font-black text-sm uppercase tracking-wider shadow-[3px_3px_0_#1f2937] flex items-center justify-center gap-2"
                            >
                                {currentWordIndex + 1 >= words.length ? 'Xem kết quả' : 'Từ tiếp theo →'}
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Word failed */}
                    {wordFailed && !gameOver && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center"
                        >
                            <div className="p-4 bg-red-50 rounded-xl border-[2px] border-red-400 mb-4">
                                <p className="font-black text-red-700">Đáp án: {currentWord.word}</p>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}

export default WordGuessPage
