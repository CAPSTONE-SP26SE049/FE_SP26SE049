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
import { useNavigate, useLocation } from 'react-router-dom'
import { learnerService, type Level, type Dialect, type Quiz } from '../services/learnerService'

// ─────────────────────────────────────────────
const DIALECT_ORDER = ['NORTH', 'CENTRAL', 'SOUTH']

const DIALECT_META: Record<string, { viName: string; abbr: string; color: string; darkColor: string }> = {
  NORTH: { viName: 'Miền Bắc', abbr: 'Bắc', color: '#2563eb', darkColor: '#1d4ed8' },
  CENTRAL: { viName: 'Miền Trung', abbr: 'Trung', color: '#d97706', darkColor: '#b45309' },
  SOUTH: { viName: 'Miền Nam', abbr: 'Nam', color: '#059669', darkColor: '#047857' },
}

const getDialectMeta = (dialect: Dialect) => {
  const key = dialect.name?.toUpperCase()
  if (DIALECT_META[key]) return { key, ...DIALECT_META[key] }
  if (dialect.description?.includes('Bắc')) return { key: 'NORTH', ...DIALECT_META['NORTH'] }
  if (dialect.description?.includes('Trung')) return { key: 'CENTRAL', ...DIALECT_META['CENTRAL'] }
  if (dialect.description?.includes('Nam')) return { key: 'SOUTH', ...DIALECT_META['SOUTH'] }
  return { key, viName: dialect.description || dialect.name, abbr: '?', color: '#6366f1', darkColor: '#4f46e5' }
}

// ─────────────────────────────────────────────
// Step 1: Dialect Cards
// ─────────────────────────────────────────────
const DialectStep = ({ dialects, onSelect }: { dialects: Dialect[]; onSelect: (d: Dialect) => void }) => {
  const nodes = useMemo(() => {
    const sorted = [...dialects].sort((a, b) => {
      const ai = DIALECT_ORDER.indexOf(a.name?.toUpperCase())
      const bi = DIALECT_ORDER.indexOf(b.name?.toUpperCase())
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })
    return sorted.map((dialect) => ({ dialect, meta: getDialectMeta(dialect) }))
  }, [dialects])

  return (
    <div className="w-full max-w-4xl mx-auto py-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {nodes.map(({ dialect, meta }, index) => (
          <motion.div
            key={meta.key}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.15, type: 'spring', stiffness: 100 }}
            whileHover={{ y: -12, scale: 1.02 }}
            className="relative group cursor-pointer"
            onClick={() => onSelect(dialect)}
          >
            <div className="absolute inset-0 rounded-[2.5rem] opacity-20 blur-2xl group-hover:opacity-50 transition-all duration-500" style={{ backgroundColor: meta.color }} />
            <div className="relative bg-white/80 backdrop-blur-md border border-white/40 rounded-[2.5rem] p-8 shadow-xl group-hover:shadow-2xl transition-all duration-500 h-full flex flex-col items-center text-center overflow-hidden">
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-700" style={{ backgroundColor: meta.color }} />
              <h3 className="text-2xl font-black text-gray-800 mb-3 tracking-tight">{meta.viName}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-1">
                {dialect.description && dialect.description !== meta.viName
                  ? dialect.description
                  : `Cải thiện phát âm và khắc phục các lỗi đặc trưng của giọng miền ${meta.abbr}.`}
              </p>
              <div className="w-full py-4 rounded-2xl font-extrabold text-white shadow-lg flex items-center justify-center gap-2 overflow-hidden relative" style={{ backgroundColor: meta.color }}>
                <span>Vào học</span>
                <PlayCircleFilled className="text-xl" />
                <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:left-[100%] transition-all duration-1000 ease-in-out" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Step 2: Chapter List (no lock mechanic)
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

  // Filter: only show APPROVED chapters (hide test/garbage data)
  const approvedChapters = useMemo(() => {
    // Accept if status contains "APPROVED", or if no status at all (backwards compat)
    const filtered = chapters.filter(ch => {
      const status = ch.status?.toUpperCase?.() ?? ''
      return !status || status === 'APPROVED'
    })
    return filtered.sort((a, b) => (a.levelOrder ?? 0) - (b.levelOrder ?? 0))
  }, [chapters])

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {approvedChapters.length === 0 ? (
        <Empty description="Chưa có học phần nào cho vùng miền này" />
      ) : (
        <div className="grid gap-4">
          {approvedChapters.map((ch, index) => {
            const desc = ch.description && ch.description.trim() && ch.description !== ch.name
              ? ch.description
              : `Học phần ${index + 1} — ${meta.viName}`

            return (
              <motion.div
                key={ch.id}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.07, type: 'spring', stiffness: 120 }}
                className={clsx(
                  "bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 p-5 flex items-center gap-5 cursor-pointer group",
                  ch.isLocked && "opacity-60 cursor-not-allowed grayscale-[40%]"
                )}
                onClick={() => !ch.isLocked && onSelect(ch)}
              >
                {/* Chapter number badge */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-black text-lg shadow-md group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: meta.color }}
                >
                  {ch.levelOrder ?? index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800 text-base break-words whitespace-normal">{ch.name}</h4>
                  <p className="text-xs text-gray-400 mt-0.5 break-words whitespace-normal leading-relaxed">{desc}</p>
                  {/* Progress */}
                  {ch.isCompleted ? (
                    <div className="flex items-center gap-1 mt-1.5">
                      {[...Array(3)].map((_, i) => (
                        <StarFilled key={i} className={clsx('text-xs', i < (ch.starsEarned || 0) ? 'text-yellow-400' : 'text-gray-200')} />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">Đã hoàn thành</span>
                    </div>
                  ) : (
                    <span className="text-xs text-green-600 font-semibold mt-1.5 inline-flex items-center gap-1">
                      <PlayCircleFilled /> Bắt đầu học
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {ch.isCompleted && (
                    <CheckCircleFilled className="text-green-500 text-xl" />
                  )}
                  {ch.isLocked && (
                    <LockFilled className="text-gray-400 text-xl" />
                  )}
                  {!ch.isLocked && (
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow group-hover:scale-110 transition-transform duration-200"
                      style={{ backgroundColor: meta.color }}
                    >
                      <ReadOutlined />
                    </div>
                  )}
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
// Step 3: Quiz Roadmap (with lock/unlock)
// ─────────────────────────────────────────────
const RoadmapNode = ({ node, index, onClick }: { node: any; index: number; onClick: () => void }) => {
  const [isHovered, setIsHovered] = useState(false)

  const getStyles = () => {
    switch (node.type) {
      case 'completed': return 'bg-brand-yellow shadow-yellow-200/50 border-b-yellow-600'
      case 'active': return 'bg-brand-green shadow-green-200/50 border-b-green-700 ring-4 ring-green-100'
      case 'locked':
      default: return 'bg-gray-200 shadow-gray-100 border-b-gray-300 text-gray-400'
    }
  }

  const getIcon = () => {
    switch (node.type) {
      case 'completed': return <CheckCircleFilled className="text-3xl text-white" />
      case 'active': return <PlayCircleFilled className="text-3xl text-white" />
      case 'locked': return <LockFilled className="text-2xl text-gray-400" />
    }
  }

  const isClickable = node.type !== 'locked'

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 w-48 flex flex-col items-center z-10"
      style={{ left: `${node.position.x}%`, top: `${node.position.y * 180 + 80}px` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        whileHover={{ scale: isClickable ? 1.1 : 1 }}
        whileTap={{ scale: isClickable ? 0.95 : 1 }}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: index * 0.08, type: 'spring', bounce: 0.5 }}
        onClick={isClickable ? onClick : undefined}
        className={clsx(
          'relative w-20 h-20 rounded-full flex items-center justify-center shadow-xl border-b-[6px] transition-colors',
          getStyles(),
          isClickable ? 'cursor-pointer' : 'cursor-not-allowed',
        )}
      >
        {getIcon()}

        {node.type === 'completed' && (
          <div className="absolute -top-4 flex gap-1">
            {[...Array(3)].map((_, i) => (
              <StarFilled key={i} className={clsx('text-xs', i < node.stars ? 'text-brand-yellow drop-shadow-md' : 'text-yellow-200/50')} />
            ))}
          </div>
        )}

        {isHovered && isClickable && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-12 bg-white px-3 py-2 rounded-xl shadow-lg border border-gray-100 whitespace-nowrap z-50 font-bold text-gray-700 text-sm"
          >
            {node.type === 'completed' ? 'Xem lại bài' : 'Bắt đầu làm'}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-t-[8px] border-t-white border-r-[6px] border-r-transparent" />
          </motion.div>
        )}
      </motion.div>

      <h3 className={clsx('mt-3 font-bold text-base text-center drop-shadow-sm', node.type === 'locked' ? 'text-gray-400' : 'text-gray-700')}>
        {node.title}
      </h3>
      {node.type !== 'locked' && (
        <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full mt-1',
          node.type === 'completed' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
        )}>
          {node.type === 'completed' ? `${node.stars}⭐` : 'Đang học'}
        </span>
      )}
    </div>
  )
}

const QuizRoadmapStep = ({
  chapter: _chapter,
  quizzes,
  loading,
  dialect: _dialect,
}: {
  chapter: Level
  quizzes: Quiz[]
  loading: boolean
  dialect?: Dialect | null
}) => {
  const navigate = useNavigate()

  const roadmapNodes = useMemo(() => {
    let firstLockedFound = false;
    return quizzes.map((quiz, index) => {
      let type: 'completed' | 'active' | 'locked' = 'locked';

      if (quiz.isCompleted) {
        type = 'completed';
      } else if (!firstLockedFound) {
        type = 'active';
        firstLockedFound = true;
      }

      return {
        id: quiz.id,
        title: quiz.title ?? quiz.name ?? `Bài ${index + 1}`,
        type,
        stars: quiz.starsEarned ?? 0,
        quiz,
        position: {
          x: index % 4 === 0 ? 50 : index % 4 === 1 ? 25 : index % 4 === 2 ? 50 : 75,
          y: index,
        },
      };
    });
  }, [quizzes])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Spin size="large"><div style={{ padding: 32, textAlign: 'center', color: '#888' }}>Đang tải bài kiểm tra...</div></Spin>
      </div>
    )
  }

  if (quizzes.length === 0) {
    return (
      <div className="flex justify-center items-center h-40">
        <Empty description="Chưa có bài kiểm tra nào cho học phần này" />
      </div>
    )
  }

  return (
    <div className="w-full relative pb-32 pt-4 flex justify-center">
      <div
        className="relative w-full max-w-md"
        style={{ height: `${Math.max(600, roadmapNodes.length * 180 + 100)}px` }}
      >
        {/* SVG Connector Path */}
        <svg
          className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
          viewBox={`0 0 100 ${Math.max(600, roadmapNodes.length * 180 + 100)}`}
          preserveAspectRatio="none"
        >
          {roadmapNodes.map((node, i) => {
            if (i === 0) return null
            const prev = roadmapNodes[i - 1]
            return (
              <path
                key={`path-${i}`}
                d={`M ${prev.position.x} ${prev.position.y * 180 + 80} C ${prev.position.x} ${prev.position.y * 180 + 150}, ${node.position.x} ${node.position.y * 180 + 10}, ${node.position.x} ${node.position.y * 180 + 80}`}
                fill="none"
                stroke={prev.type === 'completed' ? '#a7f3d0' : '#e5e7eb'}
                strokeWidth="8"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            )
          })}
        </svg>

        {/* Quiz Nodes */}
        {roadmapNodes.map((node, i) => (
          <RoadmapNode
            key={node.id}
            node={node}
            index={i}
            onClick={() => navigate(`/learner/quiz/${node.id}`, {
              state: {
                levelId: _chapter.id,
                roadmapState: {
                  step: 'quizzes' as const,
                  selectedDialect: _dialect ?? undefined,
                  selectedChapter: _chapter,
                  quizzes,
                }
              }
            })}
          />
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main RoadmapPage
// ─────────────────────────────────────────────
type Step = 'dialect' | 'chapters' | 'quizzes'

const RoadmapPage: React.FC = () => {
  const location = useLocation()

  const [step, setStep] = useState<Step>('dialect')
  const [dialects, setDialects] = useState<Dialect[]>([])
  const [selectedDialect, setSelectedDialect] = useState<Dialect | null>(null)
  const [chapters, setChapters] = useState<Level[]>([])
  const [selectedChapter, setSelectedChapter] = useState<Level | null>(null)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])

  const [dialectsLoading, setDialectsLoading] = useState(true)
  const [chaptersLoading, setChaptersLoading] = useState(false)
  const [quizzesLoading, setQuizzesLoading] = useState(false)

  // Load dialects on mount
  useEffect(() => {
    learnerService.getDialects().then(dialects => {
      setDialects(dialects)

      // Restore state from navigation (e.g. coming back from QuizPage)
      const saved = location.state?.roadmapState
      if (saved?.selectedDialect && saved?.step) {
        setSelectedDialect(saved.selectedDialect)
        setStep(saved.step)
        if (saved.chapters) setChapters(saved.chapters)
        if (saved.selectedChapter) setSelectedChapter(saved.selectedChapter)
        if (saved.quizzes) setQuizzes(saved.quizzes)
      }
    }).finally(() => setDialectsLoading(false))
  }, [])

  // Step 1 → 2: select dialect, load chapters
  const handleSelectDialect = async (dialect: Dialect) => {
    setSelectedDialect(dialect)
    setStep('chapters')
    setChaptersLoading(true)
    try {
      const data = await learnerService.getLevels(dialect.id)
      // Sort by levelOrder ascending
      setChapters([...data].sort((a, b) => (a.levelOrder ?? 0) - (b.levelOrder ?? 0)))
    } catch (err) {
      console.error('Không thể tải học phần:', err)
    } finally {
      setChaptersLoading(false)
    }
  }

  // Step 2 → 3: select chapter, load quizzes
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
    if (step === 'dialect') return 'Lộ Trình Học Tiếng Việt'
    if (step === 'chapters') return `${dialectMeta?.viName ?? ''} · Chọn học phần`
    return `${dialectMeta?.viName ?? ''} › ${selectedChapter?.name}`
  }

  const subtitle = () => {
    if (step === 'dialect') return 'Chọn giọng địa phương bạn muốn học'
    if (step === 'chapters') return 'Chọn học phần để xem danh sách bài kiểm tra'
    return 'Hoàn thành từng bài kiểm tra để mở khóa bài tiếp theo'
  }

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-gray-50/50 pb-12 flex flex-col">
      {/* ── Header ── */}
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-12 w-full flex flex-col items-center">
        <div className="relative w-full flex items-center justify-center">
          {step !== 'dialect' && (
            <button
              onClick={goBack}
              className="absolute left-0 w-11 h-11 rounded-2xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <ArrowLeftOutlined className="text-gray-600 text-lg" />
            </button>
          )}
          <div className="text-center">
            <h1 className="text-4xl font-black text-gray-900 leading-tight tracking-tight">
              {breadcrumb()}
            </h1>
            <p className="text-lg text-gray-500 mt-3 font-medium">{subtitle()}</p>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className={clsx('flex-1 flex flex-col', step === 'dialect' && 'justify-center pt-4 pb-12')}>
        <AnimatePresence mode="wait">

          {/* Step 1: Dialect */}
          {step === 'dialect' && (
            <motion.div
              key="dialect"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="max-w-5xl mx-auto px-6 w-full"
            >
              {dialectsLoading ? (
                <div className="flex justify-center items-center h-48">
                  <Spin size="large"><div style={{ padding: 32, textAlign: 'center', color: '#888' }}>Đang tải vùng miền...</div></Spin>
                </div>
              ) : (
                <DialectStep dialects={dialects} onSelect={handleSelectDialect} />
              )}
            </motion.div>
          )}

          {/* Step 2: Chapters */}
          {step === 'chapters' && (
            <motion.div
              key="chapters"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35 }}
              className="w-full"
            >
              {chaptersLoading ? (
                <div className="flex justify-center items-center h-[400px]">
                  <Spin size="large"><div style={{ padding: 32, textAlign: 'center', color: '#888' }}>Đang tải danh sách học phần...</div></Spin>
                </div>
              ) : chapters.length === 0 ? (
                <div className="flex justify-center items-center h-40">
                  <Empty description="Chưa có học phần nào cho vùng miền này" />
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

          {/* Step 3: Quiz Roadmap */}
          {step === 'quizzes' && (
            <motion.div
              key="quizzes"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35 }}
              className="w-full"
            >
              <QuizRoadmapStep
                chapter={selectedChapter!}
                quizzes={quizzes}
                loading={quizzesLoading}
                dialect={selectedDialect}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}

export default RoadmapPage
