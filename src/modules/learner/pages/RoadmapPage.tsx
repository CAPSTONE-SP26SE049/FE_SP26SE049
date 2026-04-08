import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  StarFilled,
  LockFilled,
  PlayCircleFilled,
  CheckCircleFilled,
  ArrowLeftOutlined,
  ReadOutlined,
} from '@ant-design/icons'
import { Spin, Empty } from 'antd'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'
import { learnerService, type Level, type Dialect, type Quiz } from '../services/learnerService'

// ─────────────────────────────────────────────
import { Mountain, Castle, Zap, Globe, Headphones, Mic, PenTool, BookOpen } from 'lucide-react'

// ─────────────────────────────────────────────
const DIALECT_ORDER = ['NORTH', 'CENTRAL', 'SOUTH']

const DIALECT_META: Record<string, {
  viName: string;
  abbr: string;
  color: string;
  gradient: string;
  keyword: string;
  icon: React.ReactNode;
  tagline: string;
  bgImages: string[];
}> = {
  NORTH: {
    viName: 'Miền Bắc',
    abbr: 'Bắc',
    color: '#3b82f6',
    gradient: 'from-blue-600/20 to-indigo-900/40',
    keyword: 'HÀ NỘI',
    tagline: 'THANH LỊCH & QUY CHUẨN',
    icon: <Mountain className="text-4xl" />,
    bgImages: [
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=1920',
      'https://images.unsplash.com/photo-1504457047772-27fad17438ef?w=1920',
      'https://images.unsplash.com/photo-1555938363-2f2284c8a29a?w=1920',
      'https://images.unsplash.com/photo-1493934558415-9d19f0b2b4d2?w=1920',
    ]
  },
  CENTRAL: {
    viName: 'Miền Trung',
    abbr: 'Trung',
    color: '#f59e0b',
    gradient: 'from-amber-500/20 to-orange-900/40',
    keyword: 'CỐ ĐÔ',
    tagline: 'NỒNG HẬU & DI SẢN',
    icon: <Castle className="text-4xl" />,
    bgImages: [
      'https://images.unsplash.com/photo-1621345155913-c35905d41926?auto=format&fit=crop&w=1920&q=80', // Hue
      'https://images.unsplash.com/photo-1599708153386-62e200ec8135?auto=format&fit=crop&w=1920&q=80', // Hoi An
      'https://images.unsplash.com/photo-1563124570-36655c65aead?auto=format&fit=crop&w=1920&q=80', // Hoi An Bridge
      'https://images.unsplash.com/photo-1559592442-7efef0684f04?auto=format&fit=crop&w=1920&q=80', // Da Nang
    ]
  },
  SOUTH: {
    viName: 'Miền Nam',
    abbr: 'Nam',
    color: '#10b981',
    gradient: 'from-emerald-500/20 to-teal-900/40',
    keyword: 'SÀI GÒN',
    tagline: 'SÔI ĐỘNG & CỞI MỞ',
    icon: <Zap className="text-4xl" />,
    bgImages: [
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1920&q=80', // Saigon Night
      'https://images.unsplash.com/photo-1555940280-66bf87aa823d?auto=format&fit=crop&w=1920&q=80', // Saigon Day
      'https://images.unsplash.com/photo-1621843110255-081977799276?auto=format&fit=crop&w=1920&q=80', // Mekong
      'https://images.unsplash.com/photo-1571407921319-33e3f886f76c?auto=format&fit=crop&w=1920&q=80', // Saigon Skyline
    ]
  },
}

const getDialectMeta = (dialect: Dialect) => {
  const name = dialect.name || ''
  const desc = dialect.description || ''
  const combined = (name + desc).toUpperCase()

  if (combined.includes('BẮC') || combined.includes('NORTH')) return { key: 'NORTH', ...DIALECT_META['NORTH'] }
  if (combined.includes('TRUNG') || combined.includes('CENTRAL') || combined.includes('HUẾ') || combined.includes('ĐÀ NẴNG') || combined.includes('HỘI AN')) return { key: 'CENTRAL', ...DIALECT_META['CENTRAL'] }
  if (combined.includes('NAM') || combined.includes('SOUTH')) return { key: 'SOUTH', ...DIALECT_META['SOUTH'] }

  return {
    key: 'UNKNOWN',
    viName: desc || name,
    abbr: '?',
    color: '#6366f1',
    gradient: 'from-indigo-500/20 to-purple-900/40',
    keyword: 'KHÁM PHÁ',
    tagline: 'MỞ RỘNG KIẾN THỨC',
    icon: <Globe className="text-4xl" />,
    bgImages: ['/vietnam_bg.png']
  }
}

// ─────────────────────────────────────────────
// Utility: Dynamic Background Removal & Cropping (White to Transparent)
// ─────────────────────────────────────────────
const useProcessedImage = (url: string) => {
  const [processedUrl, setProcessedUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!url) return

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = url
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 235 && data[i + 1] > 235 && data[i + 2] > 235) data[i + 3] = 0
      }
      ctx.putImageData(imageData, 0, 0)
      setProcessedUrl(canvas.toDataURL())
    }
  }, [url])

  return processedUrl
}

const RegionCard = ({ dialect, meta, index, onSelect }: any) => {
  const imageUrl = `/assets/regions/${meta.key === 'NORTH' ? 'north.png' : meta.key === 'SOUTH' ? 'south.png' : 'central.png'}`
  const processedImage = useProcessedImage(imageUrl)

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.2, type: 'spring', bounce: 0.3 }}
      whileHover={{ y: -20 }}
      className="relative group cursor-pointer h-[520px]"
      onClick={() => onSelect(dialect)}
    >
      <div className="absolute inset-0 rounded-[3rem] opacity-0 group-hover:opacity-30 blur-[80px] transition-all duration-700 -z-10" style={{ backgroundColor: meta.color }} />
      <div className={clsx(
        "h-full relative bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 flex flex-col items-center text-center overflow-hidden transition-all duration-500 group-hover:border-white/30 shadow-2xl shadow-black/40",
        `bg-gradient-to-br ${meta.gradient}`
      )}>
        <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[10%] left-1/2 -translate-x-1/2 w-80 h-80 z-10 pointer-events-none flex items-center justify-center">
          <div className="w-[90%] h-[90%] transition-transform duration-700 group-hover:scale-110 flex items-center justify-center p-4">
            {processedImage ? (
              <img
                src={processedImage}
                alt={meta.viName}
                className={clsx(
                  "w-full h-full object-contain filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.4)]",
                  meta.key === 'SOUTH' ? "scale-[1.4] origin-bottom translate-y-2" : ""
                )}
              />
            ) : (
              <Spin size="large" />
            )}
          </div>
        </motion.div>
        <div className="relative z-20 mb-auto">
          <div className="px-5 py-2 rounded-full bg-white/10 border border-white/20 shadow-xl backdrop-blur-3xl">
            <span className="text-[10px] font-black tracking-[0.3em] uppercase" style={{ color: meta.color }}>{meta.tagline}</span>
          </div>
        </div>
        <div className="relative z-20 w-full mt-auto mb-6 px-4">
          <h3 className="text-6xl font-black text-white italic tracking-tighter uppercase drop-shadow-[0_10px_30px_rgba(0,0,0,1)] leading-none mb-4">{meta.viName}</h3>
          <div className="w-16 h-1.5 mx-auto rounded-full mb-6 shadow-lg shadow-black/40" style={{ backgroundColor: meta.color }} />
          <p className="text-white/80 text-[13px] font-black leading-relaxed uppercase tracking-tight opacity-80 group-hover:opacity-100 transition-opacity">
            {dialect.description && dialect.description !== meta.viName ? dialect.description : `Khám phá tinh hoa ${meta.viName}.`}
          </p>
        </div>
        <div className="relative z-20 w-full mt-4">
          <div className="w-full h-16 rounded-2xl font-black text-white flex items-center justify-center gap-3 overflow-hidden shadow-2xl transition-all group-hover:scale-105 active:scale-95" style={{ backgroundColor: meta.color }}>
            <span className="uppercase italic tracking-widest text-sm">Vào học ngay</span>
            <PlayCircleFilled className="text-xl" />
            <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:left-[100%] transition-all duration-1000 ease-in-out" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// Step 1: Dialect Cards (Unified Heritage Design)
// ─────────────────────────────────────────────
const DialectStep = ({ dialects, onSelect }: { dialects: Dialect[]; onSelect: (d: Dialect) => void }) => {
  const nodes = useMemo(() => {
    const sorted = [...dialects].sort((a, b) => {
      const ai = DIALECT_ORDER.indexOf(a.name?.toUpperCase() || '')
      const bi = DIALECT_ORDER.indexOf(b.name?.toUpperCase() || '')
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })
    return sorted.map((dialect) => ({ dialect, meta: getDialectMeta(dialect) }))
  }, [dialects])

  return (
    <div className="w-full max-w-6xl mx-auto py-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {nodes.map(({ dialect, meta }, index) => (
          <RegionCard key={meta.key} dialect={dialect} meta={meta} index={index} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Step 2: Chapter List
// ─────────────────────────────────────────────
const ChapterStep = ({
  dialect,
  chapters,
  onSelect,
}: {
  dialect: Dialect
  chapters: Level[]
  onSelect: (ch: Level) => void
}) => {
  const meta = getDialectMeta(dialect)

  const approvedChapters = useMemo(() => {
    const filtered = chapters.filter(ch => {
      const status = ch.status?.toUpperCase?.() ?? ''
      return !status || status === 'APPROVED'
    })
    return filtered.sort((a, b) => (a.levelOrder ?? 0) - (b.levelOrder ?? 0))
  }, [chapters])

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-20">
      {approvedChapters.length === 0 ? (
        <Empty description="Chưa có chương nào cho vùng miền này" />
      ) : (
        <div className="grid gap-6">
          {approvedChapters.map((ch, index) => {
            const desc = ch.description && ch.description.trim() && ch.description !== ch.name
              ? ch.description
              : `Chương ${index + 1} — Khám phá giọng ${meta.viName}`

            return (
              <motion.div
                key={ch.id}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.07, type: 'spring', stiffness: 120 }}
                className="bg-white/5 backdrop-blur-lg border border-white/10 hover:border-white/30 rounded-3xl p-6 flex items-center gap-6 cursor-pointer group transition-all duration-500 shadow-xl hover:shadow-2xl"
                onClick={() => onSelect(ch)}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-black text-xl shadow-lg group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: meta.color }}
                >
                  {ch.levelOrder ?? index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-white text-lg tracking-tight truncate uppercase italic">{ch.name}</h4>
                  <p className="text-sm text-white/40 mt-1 truncate font-medium">{desc}</p>
                </div>

                <div className="flex items-center gap-4">
                  {ch.isCompleted && (
                    <div className="flex flex-col items-center">
                      <CheckCircleFilled className="text-green-500 text-2xl" />
                      <div className="flex gap-0.5 mt-1">
                        {[...Array(3)].map((_, i) => (
                          <StarFilled key={i} className={clsx('text-[10px]', i < (ch.starsEarned || 0) ? 'text-yellow-400' : 'text-white/10')} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-all duration-300"
                    style={{ backgroundColor: meta.color }}
                  >
                    <ReadOutlined className="text-xl" />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
const SKILL_META: Record<string, { icon: any; color: string; glow: string; label: string }> = {
  LISTENING: { icon: Headphones, color: '#60a5fa', glow: 'shadow-blue-500/50', label: 'LUYỆN NGHE' },
  SPEAKING: { icon: Mic, color: '#f59e0b', glow: 'shadow-amber-500/50', label: 'LUYỆN NÓI' },
  WRITING: { icon: PenTool, color: '#10b981', glow: 'shadow-emerald-500/50', label: 'LUYỆN VIẾT' },
  READING: { icon: BookOpen, color: '#ec4899', glow: 'shadow-pink-500/50', label: 'LUYỆN ĐỌC' },
}

// ─────────────────────────────────────────────
// Step 3: Quiz Roadmap
// ─────────────────────────────────────────────
const RoadmapNode = ({ node, index, onClick }: { node: any; index: number; onClick: () => void }) => {
  const [isHovered, setIsHovered] = useState(false)

  const skill = SKILL_META[node.quiz?.skillType] || SKILL_META.READING
  const SkillIcon = skill.icon

  const getStyles = () => {
    switch (node.type) {
      case 'completed':
        return clsx(
          'bg-white/20 border-white/20 backdrop-blur-xl transition-all duration-500',
          skill.glow
        )
      case 'active':
        return 'bg-white shadow-[0_0_40px_rgba(255,255,255,0.4)] border-b-gray-400 ring-8 ring-white/5 scale-110 !border-b-[8px]'
      case 'locked':
      default: return 'bg-white/[0.03] border-white/10 text-white/5'
    }
  }

  const getIcon = () => {
    if (node.type === 'locked') return <LockFilled className="text-2xl text-white/5" />

    return <SkillIcon
      strokeWidth={3}
      style={{ color: node.type === 'active' ? '#4f46e5' : skill.color }}
      className={clsx(
        "text-4xl transition-all duration-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]",
        node.type === 'active' ? "scale-110 animate-pulse" : "opacity-90"
      )}
    />
  }

  const isClickable = node.type !== 'locked'

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 w-48 flex flex-col items-center z-10"
      style={{ left: `${node.position.x}%`, top: `${node.position.y * 200 + 85}px` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        whileHover={{ scale: isClickable ? 1.15 : 1 }}
        whileTap={{ scale: isClickable ? 0.9 : 1 }}
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: index * 0.1, type: 'spring', bounce: 0.4 }}
        onClick={isClickable ? onClick : undefined}
        className={clsx(
          'relative w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl border-b-[6px] transition-all duration-300',
          getStyles(),
          isClickable ? 'cursor-pointer hover:rotate-6' : 'cursor-not-allowed',
        )}
      >
        {getIcon()}

        {node.type === 'completed' && (
          <>
            <div className="absolute -top-3 -right-3 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center border-4 border-[#0F172A] shadow-lg z-20">
              <CheckCircleFilled className="text-white text-xl" />
            </div>
            <div className="absolute -bottom-6 flex gap-1 bg-black/40 px-2 py-1 rounded-full border border-white/10 backdrop-blur-md">
              {[...Array(3)].map((_, i) => (
                <StarFilled key={i} className={clsx('text-xs', i < node.stars ? 'text-yellow-400 drop-shadow-lg' : 'text-white/10')} />
              ))}
            </div>
          </>
        )}

        {isHovered && isClickable && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute -top-16 bg-green-500 text-white px-4 py-2 rounded-2xl shadow-2xl whitespace-nowrap z-50 font-black text-xs uppercase tracking-widest italic"
          >
            {node.type === 'completed' ? 'Thử thách lại' : 'Bắt đầu ngay'}
            <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-green-500 rotate-45" />
          </motion.div>
        )}
      </motion.div>

      <h3 className={clsx('mt-6 font-black text-sm text-center uppercase italic tracking-tight drop-shadow-lg',
        node.type === 'locked' ? 'text-white/20' : 'text-white'
      )}>
        {node.title}
      </h3>
    </div>
  )
}

const QuizRoadmapStep = ({
  quizzes,
  loading,
}: {
  chapter: Level
  quizzes: Quiz[]
  loading: boolean
}) => {
  const navigate = useNavigate()

  const roadmapNodes = useMemo(() => {
    return quizzes.map((quiz, index) => {
      let type: 'completed' | 'active' | 'locked' = 'locked'
      const stars = quiz.starsEarned ?? 0

      if (quiz.isCompleted) {
        type = 'completed'
      } else {
        if (index === 0) {
          type = 'active'
        } else {
          const prev = quizzes[index - 1]
          if (prev.isCompleted && (prev.starsEarned ?? 0) >= 2) {
            type = 'active'
          }
        }
      }

      return {
        id: quiz.id,
        title: quiz.title ?? quiz.name ?? `Bài ${index + 1}`,
        type,
        stars,
        quiz,
        position: {
          x: index % 2 === 0 ? 50 : (index % 4 === 1 ? 30 : 70),
          y: index,
        },
      }
    })
  }, [quizzes])

  if (loading) return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>

  if (quizzes.length === 0) return <div className="flex justify-center items-center h-40"><Empty description="Chưa có bài kiểm tra" /></div>

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-20">
      <div className="relative group min-h-[600px]">
        <div
          className="w-full overflow-y-auto custom-scrollbar relative px-4"
          style={{ height: 'calc(100vh - 300px)' }}
        >
          <div className="w-full flex justify-center py-20 relative">
            <div
              className="relative w-full max-w-md"
              style={{ height: `${roadmapNodes.length * 200}px` }}
            >
              <svg
                className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
                viewBox={`0 0 100 ${roadmapNodes.length * 200}`}
                preserveAspectRatio="none"
              >
                {roadmapNodes.map((node, i) => {
                  if (i === 0) return null
                  const prev = roadmapNodes[i - 1]
                  return (
                    <path
                      key={`path-${i}`}
                      d={`M ${prev.position.x} ${prev.position.y * 200 + 85} C ${prev.position.x} ${prev.position.y * 200 + 160}, ${node.position.x} ${node.position.y * 200 + 40}, ${node.position.x} ${node.position.y * 200 + 85}`}
                      fill="none"
                      stroke={prev.type === 'completed' ? '#58cc02' : 'rgba(255,255,255,0.1)'}
                      strokeWidth="6"
                      strokeDasharray="12 8"
                      strokeLinecap="round"
                    />
                  )
                })}
              </svg>

              {roadmapNodes.map((node, i) => (
                <RoadmapNode
                  key={node.id}
                  node={node}
                  index={i}
                  onClick={() => navigate(`/learner/quiz/${node.id}`)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main RoadmapPage
// ─────────────────────────────────────────────
type Step = 'dialect' | 'chapters' | 'quizzes'

const RoadmapPage: React.FC = () => {
  const [step, setStep] = useState<Step>('dialect')
  const [dialects, setDialects] = useState<Dialect[]>([])
  const [selectedDialect, setSelectedDialect] = useState<Dialect | null>(null)
  const [chapters, setChapters] = useState<Level[]>([])
  const [selectedChapter, setSelectedChapter] = useState<Level | null>(null)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])

  const [dialectsLoading, setDialectsLoading] = useState(true)
  const [chaptersLoading, setChaptersLoading] = useState(false)
  const [quizzesLoading, setQuizzesLoading] = useState(false)

  const [currentBg, setCurrentBg] = useState('/vietnam_bg.png')

  useEffect(() => {
    learnerService.getDialects().then(setDialects).finally(() => setDialectsLoading(false))
  }, [])

  useEffect(() => {
    if (dialectMeta) {
      const bgs = dialectMeta.bgImages
      const randomBg = bgs[Math.floor(Math.random() * bgs.length)]
      setCurrentBg(randomBg)
    }
  }, [selectedDialect])

  const handleSelectDialect = async (dialect: Dialect) => {
    setSelectedDialect(dialect)
    setStep('chapters')
    setChaptersLoading(true)
    try {
      const data = await learnerService.getLevels(dialect.id)
      setChapters([...data].sort((a, b) => (a.levelOrder ?? 0) - (b.levelOrder ?? 0)))
    } catch (err) {
      console.error('Không thể tải chương:', err)
    } finally {
      setChaptersLoading(false)
    }
  }

  const handleSelectChapter = async (chapter: Level) => {
    setSelectedChapter(chapter)
    setStep('quizzes')
    setQuizzesLoading(true)
    try {
      const data = await learnerService.getQuizzesByLevel(chapter.id)
      setQuizzes(data)
    } catch (err) {
      console.error('Không thể tải quiz:', err)
      setQuizzes([])
    } finally {
      setQuizzesLoading(false)
    }
  }

  const dialectMeta = selectedDialect ? getDialectMeta(selectedDialect) : null

  const goBack = () => {
    if (step === 'quizzes') {
      setStep('chapters')
      setSelectedChapter(null)
      setQuizzes([])
    } else if (step === 'chapters') {
      setStep('dialect')
      setSelectedDialect(null)
      setChapters([])
    }
  }

  const breadcrumb = () => {
    if (step === 'dialect') return 'CHINH PHỤC TIẾNG VIỆT'
    if (step === 'chapters') return dialectMeta?.viName ?? ''
    return selectedChapter?.name
  }

  const subtitle = () => {
    if (step === 'dialect') return 'Chọn giọng địa phương để bắt đầu hành trình của bạn'
    if (step === 'chapters') return 'Khám phá các chương học dành riêng cho bạn'
    return 'Hoàn thành các bài thử thách để nâng cấp kỹ năng'
  }

  return (
    <div className="w-full min-h-screen flex flex-col font-nunito relative overflow-hidden">
      {/* Dynamic Background Layer */}
      <AnimatePresence>
        <motion.div
          key={selectedDialect?.id || 'default'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-black/40 z-10" />
          <img
            src={currentBg}
            className="w-full h-full object-cover"
            alt="background"
            onError={(e: any) => {
              e.target.onerror = null;
              e.target.src = '/vietnam_bg.png';
            }}
          />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 flex-1 flex flex-col">
        <div className="max-w-5xl mx-auto px-6 pt-8 pb-12 w-full flex flex-col items-center">
          <div className="relative w-full flex items-center justify-center">
            {step !== 'dialect' && (
              <button
                onClick={goBack}
                className="absolute left-0 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all shadow-lg active:scale-95"
              >
                <ArrowLeftOutlined className="text-white text-lg" />
              </button>
            )}
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className="text-5xl font-black text-white italic tracking-tighter drop-shadow-2xl mb-2 leading-none uppercase">
                  {breadcrumb()}
                </h1>
                <p className="text-green-500 tracking-[0.2em] uppercase text-[10px] font-black opacity-80">{subtitle()}</p>
              </motion.div>
            </div>
          </div>
        </div>

        <div className={clsx('flex-1 flex flex-col', step === 'dialect' && 'justify-center')}>
          <AnimatePresence mode="wait">
            {step === 'dialect' && (
              <motion.div
                key="dialect"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.4 }}
                className="max-w-6xl mx-auto px-6 w-full"
              >
                {dialectsLoading ? (
                  <div className="flex justify-center items-center h-48">
                    <Spin size="large" />
                  </div>
                ) : (
                  <DialectStep dialects={dialects} onSelect={handleSelectDialect} />
                )}
              </motion.div>
            )}

            {step === 'chapters' && (
              <motion.div
                key="chapters"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
                className="w-full flex-1"
              >
                {chaptersLoading ? (
                  <div className="flex justify-center items-center h-[400px]">
                    <Spin size="large" />
                  </div>
                ) : (
                  <ChapterStep
                    dialect={selectedDialect!}
                    chapters={chapters}
                    onSelect={handleSelectChapter}
                  />
                )}
              </motion.div>
            )}

            {step === 'quizzes' && (
              <motion.div
                key="quizzes"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
                className="w-full flex-1"
              >
                <QuizRoadmapStep
                  chapter={selectedChapter!}
                  quizzes={quizzes}
                  loading={quizzesLoading}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <style>{`
        .ant-empty-description {
          color: rgba(255, 255, 255, 0.4) !important;
        }
      `}</style>
      </div>
    </div>
  )
}

export default RoadmapPage;
