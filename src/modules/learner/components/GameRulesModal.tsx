import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, Target, Lightbulb, LucideIcon } from 'lucide-react'
import clsx from 'clsx'

interface GameRulesConfig {
    title: string
    icon: LucideIcon
    iconColor: string
    description: string
    rules: string[]
    scoring: string[]
    tips?: string[]
}

interface GameRulesModalProps {
    open: boolean
    config: GameRulesConfig
    onStart: () => void
    onClose?: () => void
}

const GameRulesModal: React.FC<GameRulesModalProps> = ({ open, config, onStart, onClose }) => {
    const Icon = config.icon

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pt-20 bg-black/40 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 30 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="bg-white rounded-[2.5rem] border-[3px] border-slate-900 shadow-[8px_8px_0_#1f2937] p-8 max-w-lg w-full max-h-[85vh] overflow-y-auto scrollbar-hide relative"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {/* Close button */}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="absolute top-5 right-5 w-9 h-9 rounded-xl border-[2px] border-slate-900 bg-slate-100 shadow-[2px_2px_0_#1f2937] flex items-center justify-center hover:-translate-y-0.5 hover:bg-red-50 transition-all"
                            >
                                <X size={16} strokeWidth={3} />
                            </button>
                        )}
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-6">
                            <motion.div
                                initial={{ rotate: -15 }}
                                animate={{ rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                                className={clsx("w-16 h-16 rounded-2xl border-[3px] border-slate-900 shadow-[4px_4px_0_#1f2937] flex items-center justify-center text-white", config.iconColor)}
                            >
                                <Icon size={28} strokeWidth={2.5} />
                            </motion.div>
                            <div>
                                <h2 className="text-2xl font-black text-[#263D5B] uppercase tracking-tight">{config.title}</h2>
                                <p className="text-sm font-bold text-slate-400">{config.description}</p>
                            </div>
                        </div>

                        {/* Rules */}
                        <div className="mb-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Target size={16} className="text-[#49B6E5]" />
                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Luật chơi</span>
                            </div>
                            <div className="space-y-2">
                                {config.rules.map((rule, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 + idx * 0.05 }}
                                        className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100"
                                    >
                                        <span className="w-6 h-6 rounded-lg bg-[#49B6E5] text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                                            {idx + 1}
                                        </span>
                                        <span className="text-sm font-medium text-[#263D5B]">{rule}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Scoring */}
                        <div className="mb-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap size={16} className="text-amber-500" />
                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Cách tính điểm</span>
                            </div>
                            <div className="bg-amber-50 rounded-xl border border-amber-100 p-4 space-y-2">
                                {config.scoring.map((s, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm font-bold text-amber-800">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                        {s}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tips */}
                        {config.tips && config.tips.length > 0 && (
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <Lightbulb size={16} className="text-emerald-500" />
                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Mẹo</span>
                                </div>
                                <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4 space-y-2">
                                    {config.tips.map((tip, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            {tip}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Start Button */}
                        <motion.button
                            whileHover={{ y: -3, scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={onStart}
                            className="w-full h-14 rounded-2xl border-[3px] border-slate-900 bg-gradient-to-r from-[#49B6E5] to-blue-500 text-white font-black text-lg uppercase tracking-wider shadow-[5px_5px_0_#1f2937] flex items-center justify-center gap-3 hover:shadow-[7px_7px_0_#1f2937] transition-shadow"
                        >
                            <Zap size={20} />
                            Bắt đầu chơi!
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default GameRulesModal
