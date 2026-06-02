import React, { useState, useRef, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Send, MessageCircle, Loader2, RotateCcw, Star } from 'lucide-react'
import { message } from 'antd'
import clsx from 'clsx'
import { minigameService } from '../../services/minigameService'
import GameRulesModal from '../../components/GameRulesModal'

interface ChatMessage {
    role: 'user' | 'assistant' | 'system'
    content: string
    highlightedWords?: string[]
    incorrectWords?: string[]
}

const PAIR_LABELS: Record<string, string> = {
    N_L: 'N / L', S_X: 'S / X', D_GI_R: 'D / GI / R', TR_CH: 'TR / CH'
}

const TARGET_SOUNDS: Record<string, string[]> = {
    N_L: ['n', 'l'],
    S_X: ['s', 'x'],
    D_GI_R: ['d', 'gi', 'r'],
    TR_CH: ['tr', 'ch'],
}

const SCENARIOS: Record<string, string[]> = {
    N_L: ['Bạn đang mua nước mắm ở chợ', 'Bạn hỏi đường đến nhà sách', 'Bạn gọi món ăn có nhiều từ N/L'],
    S_X: ['Bạn đang hỏi mua xe đạp', 'Bạn xin phép thầy giáo', 'Bạn mô tả buổi sáng của mình'],
    D_GI_R: ['Bạn giới thiệu gia dịch', 'Bạn hỏi đường đến rừng', 'Bạn kể về giáo viên yêu thích'],
    TR_CH: ['Bạn kể về trường học', 'Bạn mua trái cây ở chợ', 'Bạn mô tả trẻ em chơi đùa'],
}

// Fallback used only when API returns empty
const SCENARIOS_FALLBACK = SCENARIOS

const GAME_RULES_CONFIG = {
    title: 'Mô phỏng hội thoại',
    icon: MessageCircle,
    iconColor: 'bg-emerald-500',
    description: 'Trò chuyện với AI để luyện phát âm trong ngữ cảnh thực',
    rules: [
        'Chọn 1 kịch bản hội thoại để bắt đầu',
        'Trò chuyện tự nhiên với AI trong 10 lượt',
        'Cố gắng dùng nhiều từ có âm đang luyện',
        'Từ đúng âm sẽ được highlight xanh, từ ngọng/sai âm sẽ bị highlight đỏ',
    ],
    scoring: [
        'Mỗi từ đúng âm bạn dùng: +2 điểm',
        'Dùng 3+ từ trong 1 tin nhắn: +5 bonus',
        'Hoàn thành 10 lượt: +10 bonus',
    ],
    tips: [
        'Nghĩ trước những từ có âm target trước khi viết',
        'Đặt câu dài hơn để có cơ hội dùng nhiều từ hơn',
    ],
}

function isValidTargetWord(word: string, pairType: string): boolean {
    const sounds = TARGET_SOUNDS[pairType] || []
    const clean = word.toLowerCase().replace(/[.,!?;:]/g, '')
    return sounds.some(s => clean.startsWith(s))
}

function findTargetWords(text: string, pairType: string): string[] {
    const words = text.toLowerCase().split(/\s+/)
    return words.filter(word => isValidTargetWord(word, pairType))
}

function highlightText(text: string, targetWords: string[], incorrectWords: string[] = []): React.ReactNode {
    if (targetWords.length === 0 && incorrectWords.length === 0) return text
    const words = text.split(/(\s+)/)
    return words.map((word, idx) => {
        const cleanWord = word.toLowerCase().replace(/[.,!?;:]/g, '')
        const isCorrect = targetWords.some(tw => cleanWord === tw.toLowerCase().replace(/[.,!?;:]/g, ''))
        const isIncorrect = incorrectWords.some(iw => cleanWord === iw.toLowerCase().replace(/[.,!?;:]/g, ''))
        
        if (isIncorrect) {
            return (
                <span key={idx} className="bg-rose-200 text-rose-800 px-1 rounded font-black border border-rose-300">
                    {word}
                </span>
            )
        }
        if (isCorrect) {
            return (
                <span key={idx} className="bg-emerald-200 text-emerald-800 px-1 rounded font-black">
                    {word}
                </span>
            )
        }
        return word
    })
}

const ConversationSimPage: React.FC = () => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const pairType = searchParams.get('pair') || 'N_L'

    const [showRules, setShowRules] = useState(true)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [inputValue, setInputValue] = useState('')
    const [loading, setLoading] = useState(false)
    const [started, setStarted] = useState(false)
    const [turnCount, setTurnCount] = useState(0)
    const [targetWordCount, setTargetWordCount] = useState(0)
    const [score, setScore] = useState(0)
    const [scoreEffect, setScoreEffect] = useState<{ text: string; id: number; isNegative?: boolean } | null>(null)
    const [apiScenarios, setApiScenarios] = useState<string[]>([])
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        minigameService.getScenarios(pairType).then(data => {
            const mapped = data.map((item: any) => item.questionData?.scenario || '').filter(Boolean)
            setApiScenarios(mapped.length > 0 ? mapped : SCENARIOS_FALLBACK[pairType] || [])
        })
    }, [pairType])

    const scenarios = apiScenarios.length > 0 ? apiScenarios : (SCENARIOS[pairType] || SCENARIOS.N_L)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const startGame = () => {
        setShowRules(false)
    }

    const handleStartConversation = async (scenario: string) => {
        setStarted(true)
        setMessages([])
        setTurnCount(0)
        setTargetWordCount(0)
        setScore(0)

        setLoading(true)
        try {
            const res: any = await minigameService.conversationReply(pairType, `Xin chào! ${scenario}`, [])
            const reply = res?.data?.reply || res?.reply || 'Xin chào! Tôi có thể giúp gì cho bạn?'
            setMessages([
                { role: 'user', content: scenario, highlightedWords: [] },
                { role: 'assistant', content: reply }
            ])
            setTurnCount(1)
        } catch {
            message.error('Không thể kết nối AI')
        } finally {
            setLoading(false)
        }
    }

    const handleSend = async () => {
        const trimmed = inputValue.trim()
        if (!trimmed || loading) return

        // Push the user message with empty highlights first while waiting for AI validation
        const newMessages = [...messages, { role: 'user' as const, content: trimmed, highlightedWords: [] }]
        setMessages(newMessages)
        setInputValue('')
        setLoading(true)

        try {
            const history = newMessages.map(m => ({ role: m.role, content: m.content }))
            const res: any = await minigameService.conversationReply(pairType, trimmed, history.slice(0, -1))
            const reply = res?.data?.reply || res?.reply || 'Tôi không hiểu lắm, bạn nói lại được không?'
            
            // Extract AI-validated correctWords and incorrectWords, falling back to local heuristic if needed
            const incorrectWords = res?.data?.incorrectWords || res?.incorrectWords || []

            // Find all words in the user's message that start with the target sounds
            const userTargetWords = findTargetWords(trimmed, pairType)

            // Exclude any incorrect/swapped words flagged by AI to get the exact correct words
            const finalCorrectWords = userTargetWords.filter(
                (w: string) => !incorrectWords.some((iw: string) => iw.toLowerCase().replace(/[.,!?;:]/g, '') === w.toLowerCase().replace(/[.,!?;:]/g, ''))
            )

            // Update user message highlights with the AI-validated words
            setMessages(prev => {
                const updated = [...prev]
                const userMsgIndex = updated.length - 1
                if (userMsgIndex >= 0 && updated[userMsgIndex].role === 'user') {
                    updated[userMsgIndex] = {
                        ...updated[userMsgIndex],
                        highlightedWords: finalCorrectWords,
                        incorrectWords: incorrectWords
                    }
                }
                return [...updated, { role: 'assistant', content: reply }]
            })

            // Calculate points and word counts based on AI-validated words
            const wordsCount = finalCorrectWords.length
            setTargetWordCount(prev => prev + wordsCount)

            // Calculate score change (+2 per correct word, -2 per incorrect word penalty!)
            const incorrectCount = incorrectWords.length
            let pointsEarned = (wordsCount * 2) - (incorrectCount * 2)
            if (wordsCount >= 3) pointsEarned += 5
            
            if (pointsEarned > 0) {
                setScoreEffect({
                    text: `+${pointsEarned} điểm!${wordsCount >= 3 ? ' (Bonus +5)' : ''}`,
                    id: Date.now(),
                    isNegative: false
                })
            } else if (pointsEarned < 0) {
                setScoreEffect({
                    text: `${pointsEarned} điểm! (Sai âm)`,
                    id: Date.now(),
                    isNegative: true
                })
            }

            setScore(prev => Math.max(0, prev + pointsEarned))

            setTurnCount(prev => {
                const newTurn = prev + 1
                if (newTurn >= 10) {
                    setScore(s => s + 10)
                    setScoreEffect({
                        text: `+${(pointsEarned > 0 ? pointsEarned : 0) + 10} điểm! (Bonus hoàn thành +10)`,
                        id: Date.now(),
                        isNegative: false
                    })
                }
                return newTurn
            })
        } catch {
            message.error('Lỗi kết nối AI')
        } finally {
            setLoading(false)
        }
    }

    const handleRestart = () => {
        setStarted(false)
        setMessages([])
        setInputValue('')
        setTurnCount(0)
        setTargetWordCount(0)
        setScore(0)
    }

    if (showRules) {
        return (
            <div className="min-h-screen bg-[#fbf6ef] font-nunito p-6 lg:p-10">
                <GameRulesModal open={showRules} config={GAME_RULES_CONFIG} onStart={startGame} onClose={() => navigate('/learner/minigames')} />
            </div>
        )
    }

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
                        <div className="px-4 py-2 rounded-xl border-[2px] border-slate-900 bg-white shadow-[2px_2px_0_#1f2937]">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lượt</span>
                            <p className="font-black text-[#263D5B] text-sm">{turnCount}/10</p>
                        </div>
                        <div className="px-4 py-2 rounded-xl border-[2px] border-slate-900 bg-emerald-50 shadow-[2px_2px_0_#1f2937]">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Từ đúng</span>
                            <p className="font-black text-emerald-600 text-sm flex items-center gap-1">
                                <Star size={10} fill="currentColor" /> {targetWordCount}
                            </p>
                        </div>
                        {started && (
                            <button onClick={handleRestart} className="w-10 h-10 rounded-xl border-[2px] border-slate-900 bg-white shadow-[2px_2px_0_#1f2937] flex items-center justify-center hover:-translate-y-0.5 transition-transform">
                                <RotateCcw size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Score bar */}
                {started && (
                    <div className="relative flex items-center justify-between px-4 py-2 bg-white rounded-xl border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937]">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Điểm</span>
                        <span className="font-black text-[#49B6E5] text-base">{score}</span>
                        
                        {scoreEffect && (
                            <motion.div
                                key={scoreEffect.id}
                                initial={{ opacity: 0, y: 15, scale: 0.8 }}
                                animate={{ opacity: 1, y: -25, scale: 1.2 }}
                                exit={{ opacity: 0, y: -45 }}
                                transition={{ duration: 1.0, ease: "easeOut" }}
                                onAnimationComplete={() => setScoreEffect(null)}
                                className={clsx(
                                    "absolute right-4 top-0 font-black text-xs px-2 py-0.5 rounded-full z-20 pointer-events-none border-[2px]",
                                    scoreEffect.isNegative
                                        ? "text-rose-600 bg-rose-50 border-rose-500 shadow-[2px_2px_0_#f43f5e]"
                                        : "text-emerald-600 bg-emerald-50 border-emerald-500 shadow-[2px_2px_0_#10b981]"
                                )}
                            >
                                {scoreEffect.text}
                            </motion.div>
                        )}
                    </div>
                )}

                {!started ? (
                    /* Scenario Selection */
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[2rem] border-[2.5px] border-slate-900 shadow-[6px_6px_0_#1f2937] p-8"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500 border-[2px] border-slate-900 shadow-[3px_3px_0_#1f2937] flex items-center justify-center">
                                <MessageCircle size={22} className="text-white" />
                            </div>
                            <div>
                                <h2 className="font-black text-xl text-[#263D5B] uppercase tracking-tight">Chọn kịch bản</h2>
                                <p className="text-xs font-bold text-slate-400">AI sẽ dùng nhiều từ có âm {PAIR_LABELS[pairType]} trong hội thoại</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {scenarios.map((scenario, idx) => (
                                <motion.button
                                    key={idx}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleStartConversation(scenario)}
                                    className="w-full p-4 rounded-xl border-[2.5px] border-slate-900 bg-white shadow-[3px_3px_0_#1f2937] hover:bg-emerald-50 hover:border-emerald-500 transition-all text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-lg bg-emerald-100 border-[2px] border-slate-900 flex items-center justify-center font-black text-emerald-700 text-sm">
                                            {idx + 1}
                                        </span>
                                        <span className="font-black text-[#263D5B]">{scenario}</span>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    /* Chat Area */
                    <div className="bg-white rounded-[2rem] border-[2.5px] border-slate-900 shadow-[6px_6px_0_#1f2937] overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 280px)' }}>
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#fbf6ef]">
                            {messages.filter(m => m.role !== 'system').map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={clsx("flex", msg.role === 'user' ? "justify-end" : "justify-start")}
                                >
                                    <div className={clsx(
                                        "max-w-[80%] px-4 py-3 text-sm font-medium leading-relaxed",
                                        msg.role === 'user'
                                            ? "bg-[#49B6E5] text-white rounded-2xl rounded-tr-sm border-[1.5px] border-slate-900 shadow-[2px_2px_0_#1f2937]"
                                            : "bg-white text-[#263D5B] rounded-2xl rounded-tl-sm border-[1.5px] border-slate-900 shadow-[2px_2px_0_#1f293710]"
                                    )}>
                                        {msg.role === 'user' && ((msg.highlightedWords && msg.highlightedWords.length > 0) || (msg.incorrectWords && msg.incorrectWords.length > 0))
                                            ? highlightText(msg.content, msg.highlightedWords || [], msg.incorrectWords || [])
                                            : msg.content
                                        }
                                    </div>
                                </motion.div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white rounded-2xl rounded-tl-sm border-[1.5px] border-slate-900 shadow-[2px_2px_0_#1f293710] px-4 py-3">
                                        <Loader2 size={16} className="animate-spin text-[#49B6E5]" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t-[2px] border-slate-900 bg-white">
                            {turnCount >= 10 ? (
                                <div className="text-center py-2">
                                    <p className="font-black text-[#263D5B] text-sm mb-1">Hội thoại đã kết thúc!</p>
                                    <p className="text-xs font-bold text-slate-400 mb-3">
                                        Bạn đã dùng {targetWordCount} từ đúng âm — Tổng điểm: <span className="text-[#49B6E5] font-black">{score}</span>
                                    </p>
                                    <div className="flex gap-3 justify-center">
                                        <motion.button
                                            whileHover={{ y: -2 }}
                                            onClick={handleRestart}
                                            className="px-5 py-2.5 rounded-xl border-[2.5px] border-slate-900 bg-[#49B6E5] text-white font-black text-xs uppercase shadow-[3px_3px_0_#1f2937] flex items-center gap-2"
                                        >
                                            <RotateCcw size={14} /> Chơi lại
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ y: -2 }}
                                            onClick={() => navigate('/learner/minigames')}
                                            className="px-5 py-2.5 rounded-xl border-[2.5px] border-slate-900 bg-white text-[#263D5B] font-black text-xs uppercase shadow-[3px_3px_0_#1f2937] flex items-center gap-2"
                                        >
                                            <ArrowLeft size={14} /> Lobby
                                        </motion.button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-2 items-center">
                                    <input
                                        value={inputValue}
                                        onChange={e => setInputValue(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                        disabled={loading}
                                        placeholder={`Dùng từ có âm ${PAIR_LABELS[pairType]} để ghi điểm...`}
                                        className="flex-1 h-11 px-4 rounded-xl border-[2px] border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:outline-none focus:border-[#49B6E5] disabled:opacity-50 transition-all font-medium text-sm"
                                    />
                                    <motion.button
                                        whileHover={{ y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleSend}
                                        disabled={loading || !inputValue.trim()}
                                        className="h-11 w-11 rounded-xl bg-[#49B6E5] border-[2px] border-slate-900 shadow-[3px_3px_0_#1f2937] text-white flex items-center justify-center disabled:opacity-50 transition-all"
                                    >
                                        <Send size={16} />
                                    </motion.button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ConversationSimPage
