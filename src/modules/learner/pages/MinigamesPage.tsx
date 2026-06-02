import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Gamepad2, Puzzle, MessageCircle, ArrowRight, Sparkles, Layers, Search, Star, Zap, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'

const PAIR_TYPES = [
    {
        value: 'N_L',
        label: 'N / L',
        short: 'N',
        description: 'Phân biệt âm mũi và âm bên',
        color: 'from-sky-400 to-blue-500',
        bg: 'bg-sky-50',
        ring: 'shadow-[4px_4px_0_#0f172a]',
        accent: 'text-sky-600',
    },
    {
        value: 'S_X',
        label: 'S / X',
        short: 'S',
        description: 'Phân biệt âm xát răng',
        color: 'from-amber-400 to-orange-500',
        bg: 'bg-amber-50',
        ring: 'shadow-[4px_4px_0_#0f172a]',
        accent: 'text-amber-600',
    },
    {
        value: 'D_GI_R',
        label: 'D / GI / R',
        short: 'D',
        description: 'Phân biệt âm đầu lưỡi',
        color: 'from-emerald-400 to-green-500',
        bg: 'bg-emerald-50',
        ring: 'shadow-[4px_4px_0_#0f172a]',
        accent: 'text-emerald-600',
    },
    {
        value: 'TR_CH',
        label: 'TR / CH',
        short: 'TR',
        description: 'Phân biệt âm quặt lưỡi',
        color: 'from-violet-400 to-purple-500',
        bg: 'bg-violet-50',
        ring: 'shadow-[4px_4px_0_#0f172a]',
        accent: 'text-violet-600',
    },
] as const

const GAMES = [
    {
        id: 'word-challenge',
        title: 'Thử thách từ vựng',
        description: 'Chọn từ đúng hoặc xếp chữ để luyện phân biệt âm thật nhanh.',
        icon: Puzzle,
        color: 'bg-[#49B6E5]',
        gradient: 'from-[#49B6E5] to-blue-500',
        difficulty: 'Dễ',
        difficultyClass: 'bg-sky-100 text-sky-700 border-sky-200',
        note: 'Phản xạ nhanh',
    },
    {
        id: 'matching-pairs',
        title: 'Nối cặp âm',
        description: 'Lật thẻ tìm cặp từ dễ nhầm lẫn để rèn trí nhớ và tai nghe.',
        icon: Layers,
        color: 'bg-gradient-to-br from-pink-400 to-rose-500',
        gradient: 'from-pink-400 to-rose-500',
        difficulty: 'Trung bình',
        difficultyClass: 'bg-amber-100 text-amber-700 border-amber-200',
        note: 'Ghi nhớ âm',
    },
    {
        id: 'word-guess',
        title: 'Đoán từ',
        description: 'Tìm đúng chữ cái theo gợi ý trước khi hết lượt đoán.',
        icon: Search,
        color: 'bg-gradient-to-br from-violet-400 to-purple-600',
        gradient: 'from-violet-400 to-purple-600',
        difficulty: 'Khó',
        difficultyClass: 'bg-rose-100 text-rose-700 border-rose-200',
        note: 'Tư duy chữ',
    },
    {
        id: 'sentence-completion',
        title: 'Hoàn thành câu',
        description: 'Điền từ đúng vào chỗ trống dựa trên ngữ cảnh câu nói.',
        icon: Sparkles,
        color: 'bg-amber-500',
        gradient: 'from-amber-400 to-orange-500',
        difficulty: 'Trung bình',
        difficultyClass: 'bg-amber-100 text-amber-700 border-amber-200',
        note: 'Ngữ cảnh',
    },
    {
        id: 'conversation',
        title: 'Mô phỏng hội thoại',
        description: 'Luyện phát âm trong ngữ cảnh thực tế bằng các đoạn hội thoại ngắn.',
        icon: MessageCircle,
        color: 'bg-emerald-500',
        gradient: 'from-emerald-400 to-green-500',
        difficulty: 'Nâng cao',
        difficultyClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        note: 'Tình huống thật',
    },
] as const

const PAGE_STYLES = `
  .minigames-page {
    background-image:
      radial-gradient(circle at 12% 18%, rgba(73, 182, 229, 0.12) 0, rgba(73, 182, 229, 0.12) 90px, transparent 91px),
      radial-gradient(circle at 88% 14%, rgba(251, 191, 36, 0.12) 0, rgba(251, 191, 36, 0.12) 70px, transparent 71px),
      radial-gradient(circle at 82% 78%, rgba(244, 114, 182, 0.10) 0, rgba(244, 114, 182, 0.10) 84px, transparent 85px),
      linear-gradient(180deg, #fbf6ef 0%, #fffaf4 100%);
  }

  .doodle-dash {
    background-image: linear-gradient(90deg, #263d5b 50%, transparent 50%);
    background-size: 12px 2px;
    background-repeat: repeat-x;
    background-position: bottom;
  }
`

const MinigamesPage: React.FC = () => {
    const navigate = useNavigate()
    const [selectedPair, setSelectedPair] = useState<string>('N_L')

    const selectedPairMeta = PAIR_TYPES.find(pair => pair.value === selectedPair) ?? PAIR_TYPES[0]

    const handlePlayGame = (gameId: string) => {
        navigate(`/learner/minigames/${gameId}?pair=${selectedPair}`)
    }

    return (
        <div className="minigames-page min-h-screen font-nunito p-4 lg:p-8 pb-24 relative overflow-hidden text-[#263D5B]">
            <style>{PAGE_STYLES}</style>

            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <svg className="absolute left-6 top-20 h-16 w-16 text-sky-200/80" viewBox="0 0 40 40">
                    <path d="M 20,5 Q 25,15 35,20 Q 25,25 20,35 Q 15,25 5,20 Q 15,15 20,5 Z" fill="currentColor" />
                </svg>
                <svg className="absolute right-10 top-28 h-10 w-10 text-amber-300/80" viewBox="0 0 20 20">
                    <circle cx="10" cy="10" r="4" fill="currentColor" />
                </svg>
                <svg className="absolute bottom-24 left-10 h-10 w-24 text-violet-200/90" viewBox="0 0 48 16">
                    <path d="M 2,8 Q 10,2 18,8 Q 26,14 34,8 Q 42,2 46,8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <svg className="absolute bottom-36 right-10 h-16 w-16 text-rose-200/90" viewBox="0 0 40 40">
                    <path d="M 10,20 Q 20,5 30,20 Q 20,35 10,20" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
            </div>

            <div className="relative z-10 mx-auto max-w-6xl space-y-8">
                <header className="rounded-[2rem] border-[3px] border-slate-900 bg-white px-6 py-6 shadow-[8px_8px_0_#1f2937]">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-4">
                            <motion.div
                                initial={{ rotate: -12, scale: 0.8 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 220 }}
                                className="relative flex h-16 w-16 items-center justify-center rounded-[1.6rem] border-[3px] border-slate-900 bg-[#49B6E5] text-white shadow-[5px_5px_0_#1f2937]"
                            >
                                <Gamepad2 size={28} strokeWidth={2.6} />
                                <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-[2px] border-slate-900 bg-amber-300 text-slate-900 shadow-[2px_2px_0_#1f2937]">
                                    <Star size={12} fill="currentColor" />
                                </div>
                            </motion.div>

                            <div className="space-y-1">
                                <div className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-sky-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-sky-700 shadow-[2px_2px_0_#1f2937]">
                                    <Sparkles size={12} />
                                    Khu vui học phát âm
                                </div>
                                <h1 className="text-3xl font-black tracking-tight text-[#263D5B] md:text-4xl">
                                    Minigames
                                </h1>
                                <p className="max-w-2xl text-sm font-bold text-slate-500 md:text-base">
                                    Chọn cặp âm rồi vào trò chơi để luyện phản xạ, ghi nhớ và sửa lỗi phát âm theo cách vui nhộn.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border-[2px] border-slate-900 bg-amber-50 px-4 py-3 shadow-[3px_3px_0_#1f2937]">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">Trò chơi</p>
                                <p className="mt-1 text-2xl font-black text-slate-900">{GAMES.length}</p>
                            </div>
                            <div className="rounded-2xl border-[2px] border-slate-900 bg-emerald-50 px-4 py-3 shadow-[3px_3px_0_#1f2937]">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">Cặp âm</p>
                                <p className="mt-1 text-2xl font-black text-slate-900">{PAIR_TYPES.length}</p>
                            </div>
                            <div className="rounded-2xl border-[2px] border-slate-900 bg-violet-50 px-4 py-3 shadow-[3px_3px_0_#1f2937] col-span-2 sm:col-span-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-700">Đang chọn</p>
                                <p className="mt-1 text-lg font-black text-slate-900">{selectedPairMeta.label}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-[2rem] border-[3px] border-slate-900 bg-white p-5 shadow-[8px_8px_0_#1f2937]">
                        <div className="mb-4 flex items-center gap-3 doodle-dash pb-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border-[2px] border-slate-900 bg-sky-100 shadow-[2px_2px_0_#1f2937]">
                                <CheckCircle2 size={18} className="text-sky-700" strokeWidth={2.8} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900">Chọn cặp âm muốn luyện</h2>
                                <p className="text-xs font-bold text-slate-500">Bắt đầu bằng nhóm âm mà bạn muốn tập trung nhiều nhất.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {PAIR_TYPES.map((pair, idx) => (
                                <motion.button
                                    key={pair.value}
                                    initial={{ opacity: 0, y: 18 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    whileHover={{ y: -3, rotate: selectedPair === pair.value ? 0 : 0.5 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedPair(pair.value)}
                                    className={clsx(
                                        'relative overflow-hidden rounded-[1.6rem] border-[2.5px] p-4 text-left transition-all',
                                        selectedPair === pair.value
                                            ? 'border-slate-900 bg-white shadow-[5px_5px_0_#1f2937]'
                                            : 'border-slate-200 bg-[#fffaf6] shadow-[2px_2px_0_#e2e8f0] hover:border-slate-900 hover:shadow-[4px_4px_0_#1f2937]'
                                    )}
                                >
                                    <div className={clsx('absolute inset-0 opacity-0 transition-opacity', pair.bg, selectedPair === pair.value && 'opacity-100')} />
                                    <div className="relative z-10 flex items-start gap-3">
                                        <div className={clsx('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-[2px] border-slate-900 bg-gradient-to-br text-sm font-black text-white shadow-[2px_2px_0_#1f2937]', pair.color)}>
                                            {pair.short}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="text-base font-black text-slate-900">{pair.label}</h3>
                                                {selectedPair === pair.value && (
                                                    <span className={clsx('rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em]', pair.accent, 'border-current bg-white/80')}>
                                                        Đang chọn
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-xs font-bold text-slate-500 leading-relaxed">{pair.description}</p>
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    <aside className={clsx('rounded-[2rem] border-[3px] border-slate-900 p-5 shadow-[8px_8px_0_#1f2937]', selectedPairMeta.bg)}>
                        <div className="rounded-[1.5rem] border-[2px] border-slate-900 bg-white/90 p-5">
                            <div className={clsx('mb-3 inline-flex items-center gap-2 rounded-full border-[2px] border-slate-900 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] shadow-[2px_2px_0_#1f2937]', selectedPairMeta.accent, 'bg-white')}>
                                <Zap size={12} />
                                Gợi ý luyện tập
                            </div>
                            <h3 className="text-2xl font-black text-slate-900">{selectedPairMeta.label}</h3>
                            <p className="mt-2 text-sm font-bold leading-relaxed text-slate-600">
                                {selectedPairMeta.description}. Hãy ưu tiên các trò chơi có phản xạ nhanh và lặp lại nhiều lần để tai nghe quen dần với sự khác biệt.
                            </p>

                            <div className="mt-5 grid gap-3">
                                <div className="rounded-2xl border-[2px] border-slate-900 bg-slate-50 px-4 py-3 shadow-[2px_2px_0_#1f2937]">
                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Bắt đầu với</p>
                                    <p className="mt-1 text-sm font-black text-slate-900">Thử thách từ vựng hoặc Nối cặp âm</p>
                                </div>
                                <div className="rounded-2xl border-[2px] border-slate-900 bg-white px-4 py-3 shadow-[2px_2px_0_#1f2937]">
                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Mục tiêu</p>
                                    <p className="mt-1 text-sm font-black text-slate-900">Nghe đúng • Chọn nhanh • Nhớ lâu</p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </section>

                <section className="rounded-[2rem] border-[3px] border-slate-900 bg-white p-5 shadow-[8px_8px_0_#1f2937]">
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border-[2px] border-slate-900 bg-amber-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-amber-700 shadow-[2px_2px_0_#1f2937]">
                                <Gamepad2 size={12} />
                                Chọn trò chơi
                            </div>
                            <h2 className="mt-3 text-2xl font-black text-slate-900">Sẵn sàng vào màn chơi</h2>
                            <p className="mt-1 text-sm font-bold text-slate-500">Mỗi trò chơi đều dùng cặp âm bạn đang chọn để giữ trải nghiệm tập trung hơn.</p>
                        </div>

                        <div className="rounded-2xl border-[2px] border-slate-900 bg-slate-50 px-4 py-3 shadow-[2px_2px_0_#1f2937]">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Tổng cộng</p>
                            <p className="mt-1 text-lg font-black text-slate-900">{GAMES.length} trò chơi</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        <AnimatePresence>
                            {GAMES.map((game, idx) => {
                                const Icon = game.icon

                                return (
                                    <motion.button
                                        key={game.id}
                                        type="button"
                                        initial={{ opacity: 0, y: 24 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.12 + idx * 0.07, type: 'spring', stiffness: 200 }}
                                        whileHover={{ y: -5, rotate: -0.4 }}
                                        whileTap={{ scale: 0.985 }}
                                        onClick={() => handlePlayGame(game.id)}
                                        className="group relative overflow-hidden rounded-[1.8rem] border-[2.5px] border-slate-900 bg-[#fffaf6] p-5 text-left shadow-[5px_5px_0_#1f2937] transition-all hover:bg-white hover:shadow-[7px_7px_0_#1f2937]"
                                    >
                                        <div className={clsx('absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br opacity-10', game.gradient)} />
                                        <div className="absolute bottom-0 left-0 h-3 w-full bg-[linear-gradient(90deg,#263D5B_50%,transparent_50%)] bg-[length:12px_3px] bg-repeat-x opacity-50" />

                                        <div className="relative z-10">
                                            <div className="mb-4 flex items-start justify-between gap-3">
                                                <div className={clsx('flex h-12 w-12 items-center justify-center rounded-[1rem] border-[2.5px] border-slate-900 text-white shadow-[3px_3px_0_#1f2937] transition-transform group-hover:rotate-6 group-hover:scale-105', game.color)}>
                                                    <Icon size={22} strokeWidth={2.5} />
                                                </div>
                                                <span className={clsx('rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]', game.difficultyClass)}>
                                                    {game.difficulty}
                                                </span>
                                            </div>

                                            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{game.note}</p>
                                            <h3 className="text-xl font-black leading-tight text-[#263D5B]">{game.title}</h3>
                                            <p className="mt-2 min-h-[48px] text-sm font-bold leading-relaxed text-slate-500">
                                                {game.description}
                                            </p>

                                            <div className="mt-5 flex items-center justify-between rounded-2xl border-[2px] border-slate-900 bg-white px-4 py-3 shadow-[2px_2px_0_#1f2937]">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Cặp âm áp dụng</p>
                                                    <p className="mt-1 text-sm font-black text-slate-900">{selectedPairMeta.label}</p>
                                                </div>
                                                <div className="flex items-center gap-2 text-[#49B6E5] font-black text-sm">
                                                    Vào chơi
                                                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.button>
                                )
                            })}
                        </AnimatePresence>
                    </div>
                </section>
            </div>
        </div>
    )
}

export default MinigamesPage
