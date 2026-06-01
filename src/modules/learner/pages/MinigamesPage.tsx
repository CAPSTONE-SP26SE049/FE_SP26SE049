import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Gamepad2, Puzzle, MessageCircle, ArrowRight, Sparkles, Layers, Search, Star, Zap } from 'lucide-react'
import clsx from 'clsx'

const PAIR_TYPES = [
    { value: 'N_L', label: 'N / L', short: 'N', description: 'Phân biệt âm mũi và âm bên', color: 'from-sky-400 to-blue-500', bg: 'bg-sky-50' },
    { value: 'S_X', label: 'S / X', short: 'S', description: 'Phân biệt âm xát răng', color: 'from-amber-400 to-orange-500', bg: 'bg-amber-50' },
    { value: 'D_GI_R', label: 'D / GI / R', short: 'D', description: 'Phân biệt âm đầu lưỡi', color: 'from-emerald-400 to-green-500', bg: 'bg-emerald-50' },
    { value: 'TR_CH', label: 'TR / CH', short: 'TR', description: 'Phân biệt âm quặt lưỡi', color: 'from-purple-400 to-violet-500', bg: 'bg-purple-50' },
]

const GAMES = [
    {
        id: 'word-challenge',
        title: 'Thử thách từ vựng',
        description: 'Chọn từ đúng hoặc xếp chữ để luyện phân biệt âm',
        icon: Puzzle,
        color: 'bg-[#49B6E5]',
        gradient: 'from-[#49B6E5] to-blue-500',
        difficulty: 'Dễ',
    },
    {
        id: 'matching-pairs',
        title: 'Nối cặp âm',
        description: 'Lật thẻ tìm cặp từ dễ nhầm lẫn — rèn trí nhớ và phản xạ',
        icon: Layers,
        color: 'bg-gradient-to-br from-pink-400 to-rose-500',
        gradient: 'from-pink-400 to-rose-500',
        difficulty: 'Trung bình',
    },
    {
        id: 'word-guess',
        title: 'Đoán từ',
        description: 'Đoán từ qua gợi ý, chọn đúng chữ cái trước khi hết mạng',
        icon: Search,
        color: 'bg-gradient-to-br from-violet-400 to-purple-600',
        gradient: 'from-violet-400 to-purple-600',
        difficulty: 'Khó',
    },
    {
        id: 'sentence-completion',
        title: 'Hoàn thành câu',
        description: 'Điền từ đúng vào chỗ trống dựa trên ngữ cảnh',
        icon: Sparkles,
        color: 'bg-amber-500',
        gradient: 'from-amber-400 to-orange-500',
        difficulty: 'Trung bình',
    },
    {
        id: 'conversation',
        title: 'Mô phỏng hội thoại',
        description: 'Trò chuyện với AI để luyện phát âm trong ngữ cảnh thực',
        icon: MessageCircle,
        color: 'bg-emerald-500',
        gradient: 'from-emerald-400 to-green-500',
        difficulty: 'Nâng cao',
    },
]

const MinigamesPage: React.FC = () => {
    const navigate = useNavigate()
    const [selectedPair, setSelectedPair] = useState<string>('N_L')

    const handlePlayGame = (gameId: string) => {
        navigate(`/learner/minigames/${gameId}?pair=${selectedPair}`)
    }

    return (
        <div className="min-h-screen bg-[#fbf6ef] font-nunito p-4 lg:p-8 pb-24 relative overflow-hidden">
            {/* Decorative background doodles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <svg className="absolute top-20 left-10 w-16 h-16 text-sky-200 opacity-40" viewBox="0 0 40 40">
                    <path d="M 20,5 Q 25,15 35,20 Q 25,25 20,35 Q 15,25 5,20 Q 15,15 20,5 Z" fill="currentColor" />
                </svg>
                <svg className="absolute top-40 right-20 w-12 h-12 text-amber-200 opacity-50" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="8" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4,3" />
                </svg>
                <svg className="absolute bottom-40 left-20 w-20 h-20 text-purple-200 opacity-30" viewBox="0 0 40 40">
                    <path d="M 5,20 Q 12,12 20,5 Q 28,12 35,20 Q 28,28 20,35 Q 12,28 5,20" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <svg className="absolute top-60 right-40 w-8 h-8 text-emerald-300 opacity-50" viewBox="0 0 20 20">
                    <circle cx="10" cy="10" r="4" fill="currentColor" />
                </svg>
                <svg className="absolute bottom-60 right-10 w-14 h-14 text-pink-200 opacity-40" viewBox="0 0 40 40">
                    <path d="M 10,20 Q 20,5 30,20 Q 20,35 10,20" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
            </div>

            <div className="max-w-6xl mx-auto space-y-8 relative z-10">

                {/* Header */}
                <header className="relative">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-5"
                    >
                        <motion.div
                            initial={{ rotate: -15, scale: 0.7 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200 }}
                            className="w-16 h-16 bg-gradient-to-br from-[#49B6E5] to-blue-600 rounded-[2rem] border-[3px] border-slate-900 shadow-[5px_5px_0_#1f2937] flex items-center justify-center text-white relative"
                        >
                            <Gamepad2 size={28} strokeWidth={2.5} />
                            <motion.div
                                animate={{ rotate: [0, 15, -15, 0] }}
                                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full border-[2px] border-slate-900 flex items-center justify-center"
                            >
                                <Star size={10} fill="white" className="text-white" />
                            </motion.div>
                        </motion.div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-[#263D5B] leading-tight tracking-tight">
                                Minigames
                            </h1>
                            <p className="text-slate-400 font-bold text-sm mt-0.5">Luyện chữa ngọng qua trò chơi vui nhộn</p>
                        </div>
                    </motion.div>
                </header>

                {/* Pair Type Selection */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-[#49B6E5]" />
                        <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">Chọn cặp âm muốn luyện</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {PAIR_TYPES.map((pair, idx) => (
                            <motion.button
                                key={pair.value}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.06 }}
                                whileHover={{ y: -4, rotate: selectedPair === pair.value ? 0 : 1 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => setSelectedPair(pair.value)}
                                className={clsx(
                                    "relative p-4 rounded-2xl border-[2.5px] text-left transition-all overflow-hidden",
                                    selectedPair === pair.value
                                        ? "border-slate-900 bg-white shadow-[4px_4px_0_#1f2937] -translate-y-0.5"
                                        : "border-slate-200 bg-white/70 shadow-[2px_2px_0_#e2e8f0] hover:border-slate-900 hover:shadow-[3px_3px_0_#1f2937]"
                                )}
                            >
                                {selectedPair === pair.value && (
                                    <motion.div
                                        layoutId="pairBg"
                                        className={clsx("absolute inset-0 opacity-[0.06]", pair.bg)}
                                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                    />
                                )}
                                <div className="relative z-10">
                                    <div className={clsx("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-black text-xs border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937] mb-3", pair.color)}>
                                        {pair.short}
                                    </div>
                                    <div className="font-black text-[#263D5B] text-base leading-tight">{pair.label}</div>
                                    <p className="text-[10px] font-bold text-slate-400 mt-1 leading-snug">{pair.description}</p>
                                    {selectedPair === pair.value && (
                                        <motion.div
                                            layoutId="pairIndicator"
                                            className="mt-3 h-[3px] w-full bg-gradient-to-r from-[#49B6E5] to-blue-400 rounded-full"
                                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                        />
                                    )}
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </section>

                {/* Games Grid */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-400" />
                            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">Chọn trò chơi</h2>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border-[1.5px] border-slate-200">
                            <Zap size={10} className="text-amber-500" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{GAMES.length} trò chơi</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <AnimatePresence>
                            {GAMES.map((game, idx) => {
                                const Icon = game.icon
                                return (
                                    <motion.div
                                        key={game.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.15 + idx * 0.08, type: 'spring', stiffness: 200 }}
                                        whileHover={{ y: -6, rotate: -0.5 }}
                                        className="bg-white rounded-[1.8rem] border-[2.5px] border-slate-900 p-5 shadow-[4px_4px_0_#1f2937] hover:shadow-[6px_6px_0_#1f2937] transition-shadow cursor-pointer group relative overflow-hidden"
                                        onClick={() => handlePlayGame(game.id)}
                                    >
                                        {/* Background decoration */}
                                        <div className={clsx("absolute -bottom-8 -right-8 w-32 h-32 rounded-full opacity-[0.04] bg-gradient-to-br", game.gradient)} />

                                        <div className="relative z-10">
                                            {/* Icon */}
                                            <div className={clsx("w-12 h-12 rounded-[1rem] border-[2.5px] border-slate-900 shadow-[3px_3px_0_#1f2937] flex items-center justify-center text-white mb-4 group-hover:rotate-6 group-hover:scale-105 transition-transform", game.color)}>
                                                <Icon size={22} strokeWidth={2.5} />
                                            </div>

                                            {/* Title */}
                                            <h3 className="font-black text-lg text-[#263D5B] uppercase tracking-tight mb-1.5 leading-tight">{game.title}</h3>

                                            {/* Description */}
                                            <p className="text-[11px] font-medium text-slate-400 leading-relaxed mb-4 line-clamp-2">{game.description}</p>

                                            {/* Footer */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-[#49B6E5] font-black text-[11px] uppercase tracking-wider group-hover:gap-3 transition-all">
                                                    Chơi ngay <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider px-2 py-0.5 bg-slate-50 rounded-full border border-slate-100">
                                                    {game.difficulty}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>
                </section>

                {/* Bottom info bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl border-[2px] border-slate-200 shadow-[3px_3px_0_#e2e8f0] p-4 flex items-center gap-4"
                >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#49B6E5] to-blue-500 border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937] flex items-center justify-center flex-shrink-0">
                        <Sparkles size={16} className="text-white" />
                    </div>
                    <div className="flex-1">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Đang luyện</span>
                        <p className="font-black text-[#263D5B] text-sm">
                            {PAIR_TYPES.find(p => p.value === selectedPair)?.label}
                            <span className="font-bold text-slate-400 text-xs ml-2">— {PAIR_TYPES.find(p => p.value === selectedPair)?.description}</span>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

export default MinigamesPage
