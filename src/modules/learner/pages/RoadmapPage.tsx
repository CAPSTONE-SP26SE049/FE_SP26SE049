import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  StarFilled,
  LockFilled,
  PlayCircleFilled,
  CheckCircleFilled,
  ArrowLeftOutlined,
  ThunderboltFilled,
  BookFilled,
} from '@ant-design/icons'
import { Spin, Drawer, Tag, Button, Empty } from 'antd'
import clsx from 'clsx'
import { learnerService, type Level, type Dialect, type Quiz } from '../services/learnerService'

// ─────────────────────────────────────────────
// Dialect metadata — keyed by DB enum value
// ─────────────────────────────────────────────
const DIALECT_ORDER = ['NORTH', 'CENTRAL', 'SOUTH'] // Bắc -> Trung -> Nam

const DIALECT_META: Record<string, { viName: string; abbr: string; color: string; darkColor: string }> = {
  NORTH: {
    viName: 'Miền Bắc',
    abbr: 'Bắc',
    color: '#2563eb',
    darkColor: '#1d4ed8',
  },
  CENTRAL: {
    viName: 'Miền Trung',
    abbr: 'Trung',
    color: '#d97706',
    darkColor: '#b45309',
  },
  SOUTH: {
    viName: 'Miền Nam',
    abbr: 'Nam',
    color: '#059669',
    darkColor: '#047857',
  },
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
// Dialect Selection Cards
// ─────────────────────────────────────────────

const DialectRoadmap = ({
  dialects,
  onSelect,
}: {
  dialects: Dialect[]
  onSelect: (d: Dialect) => void
}) => {
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
            transition={{ 
              duration: 0.5, 
              delay: index * 0.15,
              type: 'spring',
              stiffness: 100
            }}
            whileHover={{ y: -12, scale: 1.02 }}
            className="relative group cursor-pointer"
            onClick={() => onSelect(dialect)}
          >
            {/* Glow effect background */}
            <div 
              className="absolute inset-0 rounded-[2.5rem] opacity-20 blur-2xl group-hover:opacity-50 transition-all duration-500"
              style={{ backgroundColor: meta.color }}
            />
            
            <div className="relative bg-white/80 backdrop-blur-md border border-white/40 rounded-[2.5rem] p-8 shadow-xl group-hover:shadow-2xl transition-all duration-500 h-full flex flex-col items-center text-center overflow-hidden">
              {/* Decorative circle */}
              <div 
                className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-700"
                style={{ backgroundColor: meta.color }}
              />
              
              <h3 className="text-2xl font-black text-gray-800 mb-3 tracking-tight">
                {meta.viName}
              </h3>
              
              <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-1">
                {dialect.description && dialect.description !== meta.viName 
                  ? dialect.description 
                  : `Cải thiện phát âm và khắc phục các lỗi đặc trưng của giọng miền ${meta.abbr}.`}
              </p>

              <div 
                className="w-full py-4 rounded-2xl font-extrabold text-white shadow-lg transition-all transform group-hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 overflow-hidden relative"
                style={{ backgroundColor: meta.color }}
              >
                <span>Học ngay</span>
                <PlayCircleFilled className="text-xl" />
                
                {/* Shine effect */}
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
const RoadmapNode = ({ node, index, onClick }: { node: any; index: number; onClick: () => void }) => {
  const [isHovered, setIsHovered] = useState(false)

  const getStyles = () => {
    switch (node.type) {
      case 'completed': return 'bg-brand-yellow shadow-yellow-200/50 border-b-yellow-600'
      case 'active': return 'bg-brand-green shadow-green-200/50 border-b-green-700 ring-4 ring-green-100'
      case 'locked': default: return 'bg-gray-200 shadow-gray-100 border-b-gray-300 text-gray-400'
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
            {node.type === 'completed' ? 'Xem lại bài học' : 'Bắt đầu học'}
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

// ─────────────────────────────────────────────
// Step 3: Quiz Drawer
// ─────────────────────────────────────────────
const QuizDrawer = ({
  level,
  quizzes,
  loading,
  open,
  onClose,
}: {
  level: Level | null
  quizzes: Quiz[]
  loading: boolean
  open: boolean
  onClose: () => void
}) => {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="bottom"
      height="75vh"
      title={
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
            <BookFilled className="text-green-600" />
          </div>
          <div>
            <div className="font-bold text-gray-800">{level?.name}</div>
            <div className="text-xs text-gray-500 font-normal">Chọn bài kiểm tra để bắt đầu học</div>
          </div>
        </div>
      }
      styles={{ body: { padding: '16px' } }}
    >
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Spin tip="Đang tải bài kiểm tra..." />
        </div>
      ) : quizzes.length === 0 ? (
        <Empty description="Chưa có bài kiểm tra nào cho cấp độ này" />
      ) : (
        <div className="grid gap-3">
          {quizzes.map((quiz, index) => (
            <motion.div
              key={quiz.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.07 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center flex-shrink-0">
                <ThunderboltFilled className="text-white text-xl" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800 text-base truncate">{quiz.name}</h4>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {quiz.difficulty && (
                    <Tag color={quiz.difficulty === 'EASY' ? 'green' : quiz.difficulty === 'MEDIUM' ? 'orange' : 'red'} className="text-xs m-0">
                      {quiz.difficulty}
                    </Tag>
                  )}
                  {quiz.questionCount && (
                    <span className="text-xs text-gray-500">{quiz.questionCount} câu hỏi</span>
                  )}
                  {quiz.timeLimitMinutes && (
                    <span className="text-xs text-gray-500">⏱ {quiz.timeLimitMinutes} phút</span>
                  )}
                </div>
                {quiz.description && (
                  <p className="text-xs text-gray-400 mt-1 truncate">{quiz.description}</p>
                )}
              </div>
              <Button
                type="primary"
                size="small"
                className="flex-shrink-0 bg-green-500 border-green-500 hover:bg-green-600 rounded-xl font-semibold"
              >
                Học ngay
              </Button>
            </motion.div>
          ))}
        </div>
      )}
    </Drawer>
  )
}

// ─────────────────────────────────────────────
// Main RoadmapPage
// ─────────────────────────────────────────────
type Step = 'dialect' | 'levels'

const RoadmapPage: React.FC = () => {
  const [step, setStep] = useState<Step>('dialect')
  const [dialects, setDialects] = useState<Dialect[]>([])
  const [selectedDialect, setSelectedDialect] = useState<Dialect | null>(null)
  const [levels, setLevels] = useState<Level[]>([])
  const [dialectsLoading, setDialectsLoading] = useState(true)
  const [levelsLoading, setLevelsLoading] = useState(false)

  // Quiz drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [quizzesLoading, setQuizzesLoading] = useState(false)

  // Load dialects on mount
  useEffect(() => {
    learnerService.getDialects().then(setDialects).finally(() => setDialectsLoading(false))
  }, [])

  // Load levels when dialect selected
  const handleSelectDialect = async (dialect: Dialect) => {
    setSelectedDialect(dialect)
    setStep('levels')
    setLevelsLoading(true)
    try {
      const data = await learnerService.getLevels(dialect.id)
      setLevels(data)
    } catch (err) {
      console.error('Không thể tải cấp độ:', err)
    } finally {
      setLevelsLoading(false)
    }
  }

  // Open quiz drawer for a level
  const handleSelectLevel = async (level: Level) => {
    setSelectedLevel(level)
    setDrawerOpen(true)
    setQuizzesLoading(true)
    try {
      const data = await learnerService.getQuizzesByLevel(level.id)
      setQuizzes(data)
    } catch (err) {
      console.error('Không thể tải quiz:', err)
      setQuizzes([])
    } finally {
      setQuizzesLoading(false)
    }
  }

  const roadmapNodes = useMemo(() => levels.map((lvl, index) => ({
    id: lvl.id,
    title: lvl.name,
    type: lvl.isLocked ? 'locked' : lvl.isCompleted ? 'completed' : 'active',
    stars: lvl.starsEarned || 0,
    level: lvl,
    position: {
      x: index % 4 === 0 ? 50 : index % 4 === 1 ? 25 : index % 4 === 2 ? 50 : 75,
      y: index,
    },
  })), [levels])

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-gray-50/50 pb-12 flex flex-col">
      {/* ── Header ── */}
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-12 w-full flex flex-col items-center">
        <div className="relative w-full flex items-center justify-center">
          {step === 'levels' && (
            <button
              onClick={() => { setStep('dialect'); setSelectedDialect(null); setLevels([]) }}
              className="absolute left-0 w-11 h-11 rounded-2xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <ArrowLeftOutlined className="text-gray-600 text-lg" />
            </button>
          )}
          <div className="text-center">
            <h1 className="text-4xl font-black text-gray-900 leading-tight tracking-tight">
              {step === 'dialect' ? 'Lộ Trình Học Tiếng Việt' : `Lộ Trình · ${selectedDialect ? getDialectMeta(selectedDialect).viName : ''}`}
            </h1>
            <p className="text-lg text-gray-500 mt-3 font-medium">
              {step === 'dialect' ? 'Chọn giọng địa phương bạn muốn học' : 'Nhấn vào một cấp độ để bắt đầu học'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Steps Container ── */}
      <div className={clsx("flex-1 flex flex-col", step === 'dialect' && "justify-center pt-4 pb-12")}>
        <AnimatePresence mode="wait">
          {step === 'dialect' && (
            <motion.div
              key="dialect"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="max-w-5xl mx-auto px-6 w-full"
            >
              {dialectsLoading ? (
                <div className="flex justify-center items-center h-48">
                  <Spin size="large" tip="Đang tải vùng miền..." />
                </div>
              ) : (
                <DialectRoadmap dialects={dialects} onSelect={handleSelectDialect} />
              )}
            </motion.div>
          )}

          {step === 'levels' && (
            <motion.div
              key="levels"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              className="w-full"
            >
              {levelsLoading ? (
                <div className="flex justify-center items-center h-[400px]">
                  <Spin size="large" tip="Đang tải lộ trình..." />
                </div>
              ) : levels.length === 0 ? (
                <div className="flex justify-center items-center h-40">
                  <Empty description="Chưa có cấp độ nào cho vùng miền này" />
                </div>
              ) : (
                <div className="w-full relative pb-32 pt-4 flex justify-center">
                  <div
                    className="relative w-full max-w-md"
                    style={{ height: `${Math.max(600, roadmapNodes.length * 180 + 100)}px` }}
                  >
                    {/* SVG Path */}
                    <svg
                      className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
                      viewBox={`0 0 100 ${Math.max(600, roadmapNodes.length * 180 + 100)}`}
                      preserveAspectRatio="none"
                    >
                      {roadmapNodes.map((node, i) => {
                        if (i === 0) return null
                        const prev = roadmapNodes[i - 1]
                        const x1 = prev.position.x
                        const y1 = prev.position.y * 180 + 80
                        const x2 = node.position.x
                        const y2 = node.position.y * 180 + 80
                        return (
                          <path
                            key={`path-${i}`}
                            d={`M ${x1} ${y1} C ${x1} ${y1 + 70}, ${x2} ${y2 - 70}, ${x2} ${y2}`}
                            fill="none"
                            stroke={prev.type === 'completed' ? '#a7f3d0' : '#e5e7eb'}
                            strokeWidth="8"
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                          />
                        )
                      })}
                    </svg>

                    {/* Nodes */}
                    {roadmapNodes.map((node, i) => (
                      <RoadmapNode
                        key={node.id}
                        node={node}
                        index={i}
                        onClick={() => handleSelectLevel(node.level)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Step 3: Quiz Drawer ── */}
      <QuizDrawer
        level={selectedLevel}
        quizzes={quizzes}
        loading={quizzesLoading}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}

export default RoadmapPage
