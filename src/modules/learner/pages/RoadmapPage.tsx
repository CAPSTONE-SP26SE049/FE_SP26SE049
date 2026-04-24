import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../../core/auth/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  StarFilled,
  LockFilled,
  CheckCircleFilled,
  ArrowLeftOutlined,
} from '@ant-design/icons'
import { Spin, Empty, Pagination } from 'antd'
import clsx from 'clsx'
import { useNavigate, useLocation } from 'react-router-dom'
import { learnerService, type Level, type Dialect, type Quiz } from '../services/learnerService'
import { Headphones, Mic, PenTool, BookOpen, Play, ChevronRight, Globe, Landmark, Castle, Building2 } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────
// Region metadata with Unsplash photo backgrounds
// ─────────────────────────────────────────────────────────────────────
const DIALECT_ORDER = ['NORTH', 'CENTRAL', 'SOUTH']

const DIALECT_META: Record<string, {
  viName: string;
  abbr: string;
  color: string;
  accent: string;
  bgColor: string;
  tagline: string;
  keyword: string;
  emoji: string;
  icon: any;
  description: string;
  photo: string;
  gradient: string;
}> = {
  NORTH: {
    viName: 'Miền Bắc',
    abbr: 'Bắc',
    color: '#6366f1',
    accent: '#818cf8',
    bgColor: 'from-indigo-600 to-blue-700',
    tagline: 'Thanh lịch & Chuẩn mực',
    keyword: '',
    emoji: '🏛️',
    icon: Landmark,
    description: 'Chinh phục phát âm chuẩn — nền tảng của tiếng Việt quy chuẩn.',
    photo: '/region_mien_bac.png',
    gradient: 'from-indigo-500/90 to-blue-600/90',
  },
  CENTRAL: {
    viName: 'Miền Trung',
    abbr: 'Trung',
    color: '#f59e0b',
    accent: '#fbbf24',
    bgColor: 'from-amber-500 to-orange-600',
    tagline: 'Nồng hậu & Di sản',
    keyword: '',
    emoji: '🏯',
    icon: Castle,
    description: 'Khám phá giọng nói đặc trưng vùng đất cố đô và di sản văn hoá.',
    photo: '/region_mien_trung.png',
    gradient: 'from-amber-500/90 to-orange-600/90',
  },
  SOUTH: {
    viName: 'Miền Nam',
    abbr: 'Nam',
    color: '#10b981',
    accent: '#34d399',
    bgColor: 'from-emerald-500 to-teal-600',
    tagline: 'Sôi động & Cởi mở',
    keyword: '',
    emoji: '🌆',
    icon: Building2,
    description: 'Làm quen với giọng Nam năng động, cởi mở và thân thiện.',
    photo: '/region_mien_nam.png',
    gradient: 'from-emerald-500/90 to-teal-600/90',
  },
}

const UNKNOWN_META = {
  key: 'UNKNOWN',
  viName: 'Khám phá',
  abbr: '?',
  color: '#9333ea',
  accent: '#a855f7',
  bgColor: 'from-purple-600 to-violet-700',
  tagline: 'Mở rộng kiến thức',
  keyword: 'VIỆT NAM',
  emoji: '🇻🇳',
  icon: Globe,
  description: 'Khám phá thêm về ngôn ngữ và văn hóa Việt Nam đa dạng.',
  photo: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80',
  gradient: 'from-purple-600/90 to-violet-700/90',
}

const getDialectMeta = (dialect: Dialect) => {
  const name = dialect.name || ''
  const desc = dialect.description || ''
  const combined = (name + desc).toUpperCase()

  if (combined.includes('BẮC') || combined.includes('NORTH')) return { key: 'NORTH', ...DIALECT_META['NORTH'] }
  if (combined.includes('TRUNG') || combined.includes('CENTRAL') || combined.includes('HUẾ') || combined.includes('ĐÀ NẴNG') || combined.includes('HỘI AN')) return { key: 'CENTRAL', ...DIALECT_META['CENTRAL'] }
  if (combined.includes('NAM') || combined.includes('SOUTH')) return { key: 'SOUTH', ...DIALECT_META['SOUTH'] }
  return UNKNOWN_META
}

// ─────────────────────────────────────────────────────────────────────
// Region Card - Modern Design
// ─────────────────────────────────────────────────────────────────────
const RegionCard = ({ dialect, meta, index, onSelect, isMyRegion }: any) => {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isMyRegion && cardRef.current) {
      setTimeout(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }), 600)
    }
  }, [isMyRegion])

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.15, type: 'spring', bounce: 0.3 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="relative group cursor-pointer"
      onClick={() => onSelect(dialect)}
    >
      {/* Glow Effect — always on for user's region, hover for others */}
      <div
        className={`absolute -inset-0.5 rounded-3xl blur-lg transition-all duration-500 ${isMyRegion ? 'opacity-70' : 'opacity-0 group-hover:opacity-60'
          }`}
        style={{ backgroundColor: meta.color }}
      />

      <div className={`relative bg-white rounded-3xl overflow-hidden shadow-lg transition-all duration-500 ${isMyRegion
        ? 'border-2 shadow-2xl ring-2 ring-offset-2'
        : 'border border-gray-100 group-hover:shadow-2xl'
        }`}
        style={isMyRegion ? { borderColor: meta.color, ringColor: meta.color } as any : {}}
      >
        {/* Photo Section */}
        <div className="relative h-52 overflow-hidden">
          <img
            src={meta.photo}
            alt={meta.viName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            onError={(e: any) => { e.target.src = `https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80` }}
          />
          {/* Gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t ${meta.gradient} opacity-70`} />

          {/* Tagline Chip */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="text-[11px] font-black tracking-[0.15em] text-white bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
              {meta.tagline}
            </span>
            {isMyRegion && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.15 + 0.4, type: 'spring', bounce: 0.5 }}
                className="text-[11px] font-black text-white px-3 py-1.5 rounded-full border border-white/40 backdrop-blur-md flex items-center gap-1"
                style={{ background: `${meta.color}cc` }}
              >
                ✦ Miền của bạn
              </motion.span>
            )}
          </div>

          {/* Region Name */}
          <div className="absolute bottom-5 left-6 right-6">
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-4xl font-black text-white drop-shadow-lg leading-none">{meta.viName}</h3>
              </div>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg border border-white/20 backdrop-blur-sm bg-white/10"
              >
                <meta.icon size={26} strokeWidth={2} />
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          <p className="text-gray-500 text-sm font-medium leading-relaxed mb-5">
            {dialect.description && dialect.description !== meta.viName ? dialect.description : meta.description}
          </p>

          {/* CTA Button */}
          <button
            className="w-full h-12 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2 transition-all duration-300 group-hover:shadow-lg active:scale-95"
            style={{ background: isMyRegion ? `linear-gradient(135deg, ${meta.color}, ${meta.accent})` : `linear-gradient(135deg, ${meta.color}, ${meta.accent})` }}
          >
            <Play size={16} className="fill-white" />
            {isMyRegion ? 'Vào học ngay ✦' : 'Vào học ngay'}
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Step 1: Dialect Selection
// ─────────────────────────────────────────────────────────────────────
const DialectStep = ({ dialects, onSelect, userRegionKey }: { dialects: Dialect[]; onSelect: (d: Dialect) => void; userRegionKey?: string }) => {
  const nodes = useMemo(() => {
    const sorted = [...dialects].sort((a, b) => {
      const ai = DIALECT_ORDER.indexOf(a.name?.toUpperCase() || '')
      const bi = DIALECT_ORDER.indexOf(b.name?.toUpperCase() || '')
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })
    return sorted.map((dialect) => ({ dialect, meta: getDialectMeta(dialect) }))
  }, [dialects])

  return (
    <div className="w-full max-w-5xl mx-auto p-6 lg:p-8">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full border border-purple-100 mb-4">
          <Globe size={14} className="text-purple-600" />
          <span className="text-purple-700 text-xs font-black uppercase tracking-widest">Chọn vùng miền</span>
        </div>
        <h1 className="text-4xl lg:text-5xl font-black text-gray-800 leading-tight mb-3">
          Chinh Phục <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-orange-500">Tiếng Việt</span>
        </h1>
        <p className="text-gray-400 font-medium text-base max-w-md mx-auto">
          Chọn giọng địa phương để bắt đầu hành trình học tiếng Việt của bạn
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {nodes.map(({ dialect, meta }, index) => (
          <RegionCard
            key={meta.key}
            dialect={dialect}
            meta={meta}
            index={index}
            onSelect={onSelect}
            isMyRegion={userRegionKey ? meta.key === userRegionKey : false}
          />
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Step 2: Chapter List
// ─────────────────────────────────────────────────────────────────────
const ChapterStep = ({
  dialect,
  chapters,
  onSelect,
  onBack,
}: {
  dialect: Dialect
  chapters: Level[]
  onSelect: (ch: Level) => void
  onBack: () => void
}) => {
  const meta = getDialectMeta(dialect)

  const approvedChapters = useMemo(() => {
    const filtered = chapters.filter(ch => {
      const status = ch.status?.toUpperCase?.() ?? ''
      return !status || status === 'APPROVED'
    })
    return filtered.sort((a, b) => (a.levelOrder ?? 0) - (b.levelOrder ?? 0))
  }, [chapters])

  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Reset pagination if dialect changes
  useEffect(() => { setCurrentPage(1) }, [dialect.id])

  const paginatedChapters = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return approvedChapters.slice(start, start + pageSize)
  }, [approvedChapters, currentPage, pageSize])

  return (
    <div className="w-full max-w-3xl mx-auto p-6 lg:p-8 pb-20">

      {/* ── Region Banner (replaces breadcrumb header) ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-6 rounded-3xl overflow-hidden shadow-lg"
      >
        <div className="absolute inset-0">
          <img src={meta.photo} className="w-full h-full object-cover" />
          <div className={`absolute inset-0 bg-gradient-to-r ${meta.gradient}`}></div>
        </div>
        <div className="relative px-6 py-5 flex items-center gap-4">
          {/* Back button integrated into banner */}
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/25 hover:bg-white/30 transition-all flex-shrink-0"
          >
            <ArrowLeftOutlined className="text-white" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white border border-white/20 flex-shrink-0">
            <meta.icon size={24} strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black text-white leading-tight">{meta.viName}</h2>
            <p className="text-white/70 text-xs font-bold">{meta.tagline}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-white/60 text-xs font-bold">{approvedChapters.length} chương</p>
          </div>
        </div>
      </motion.div>

      {approvedChapters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-gray-100">
          <Empty description={<span className="text-gray-400 font-medium">Chưa có chương nào cho vùng miền này</span>} />
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedChapters.map((ch, index) => {
            const seqNum = (currentPage - 1) * pageSize + index + 1
            const desc = ch.description && ch.description.trim() && ch.description !== ch.name
              ? ch.description
              : `Khám phá giọng ${meta.viName}`
            const isCompleted = !!ch.isCompleted
            const stars = ch.starsEarned || 0

            return (
              <motion.div
                key={ch.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, type: 'spring', stiffness: 100, damping: 15 }}
                whileHover={!ch.isLocked ? { y: -4, scale: 1.01 } : {}}
                className={clsx(
                  "relative bg-white rounded-2xl border transition-all duration-400 overflow-hidden",
                  ch.isLocked
                    ? "opacity-75 cursor-not-allowed border-gray-100 bg-gray-50/30"
                    : "cursor-pointer group hover:shadow-lg hover:border-purple-200 border-gray-100"
                )}
                onClick={() => !ch.isLocked && onSelect(ch)}
              >
                {/* Left accent stripe */}
                <div
                  className={clsx(
                    "absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl transition-all duration-300",
                    !ch.isLocked && "group-hover:w-2"
                  )}
                  style={{
                    background: ch.isLocked
                      ? '#d1d5db'
                      : `linear-gradient(to bottom, ${meta.color}, ${meta.accent})`
                  }}
                />

                <div className="flex items-center gap-5 p-5 pl-6">
                  {/* Number badge */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={clsx(
                        "w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg transition-all duration-300",
                        !ch.isLocked && "group-hover:scale-110 group-hover:rotate-3"
                      )}
                      style={{
                        background: ch.isLocked
                          ? '#9ca3af'
                          : `linear-gradient(135deg, ${meta.color}, ${meta.accent})`
                      }}
                    >
                      {ch.isLocked ? <LockFilled className="text-white/80 text-lg" /> : seqNum}
                    </div>
                    {isCompleted && !ch.isLocked && (
                      <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                        <CheckCircleFilled className="text-white text-[10px]" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md"
                        style={{
                          color: ch.isLocked ? '#6b7280' : meta.color,
                          backgroundColor: ch.isLocked ? '#f3f4f6' : `${meta.color}15`
                        }}
                      >
                        Chương {seqNum}
                      </span>
                      {isCompleted && !ch.isLocked && (
                        <span className="text-[10px] font-black tracking-wider uppercase text-green-600 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">
                          ✓ Hoàn thành
                        </span>
                      )}
                      {ch.isLocked && (
                        <span className="text-[10px] font-black tracking-wider uppercase text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                          🔒 Đang khóa
                        </span>
                      )}
                    </div>
                    <h4 className={clsx(
                      "font-black text-base truncate transition-colors",
                      ch.isLocked ? "text-gray-400" : "text-gray-800 group-hover:text-purple-700"
                    )}>
                      {ch.name}
                    </h4>
                    <p className="text-sm text-gray-400 mt-0.5 truncate font-medium">
                      {ch.isLocked ? "Hoàn thành chương trước để mở khóa" : desc}
                    </p>
                  </div>

                  {/* Right side: Stars + Arrow */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {isCompleted && stars > 0 && !ch.isLocked && (
                      <div className="flex gap-0.5">
                        {[...Array(3)].map((_, i) => (
                          <StarFilled key={i} className={clsx('text-sm', i < stars ? 'text-yellow-400' : 'text-gray-200')} />
                        ))}
                      </div>
                    )}
                    <div
                      className={clsx(
                        "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-all duration-300",
                        !ch.isLocked && "group-hover:shadow-md group-hover:translate-x-1"
                      )}
                      style={{
                        backgroundColor: ch.isLocked ? '#f3f4f6' : `${meta.color}12`,
                        color: ch.isLocked ? '#9ca3af' : meta.color
                      }}
                    >
                      {ch.isLocked ? <LockFilled size={18} /> : <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}

          {approvedChapters.length > pageSize && (
            <div className="mt-8 flex justify-center pb-4">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={approvedChapters.length}
                onChange={(page) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                showSizeChanger={false}
                hideOnSinglePage
                className="custom-roadmap-pagination"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Step 3: Quiz Roadmap (kept same logic, modernized visuals)
// ─────────────────────────────────────────────────────────────────────
const SKILL_META: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  LISTENING: { icon: Headphones, color: '#6366f1', bg: 'bg-indigo-100', label: 'Luyện nghe' },
  SPEAKING: { icon: Mic, color: '#f59e0b', bg: 'bg-amber-100', label: 'Luyện nói' },
  WRITING: { icon: PenTool, color: '#10b981', bg: 'bg-emerald-100', label: 'Luyện viết' },
  READING: { icon: BookOpen, color: '#ec4899', bg: 'bg-pink-100', label: 'Luyện đọc' },
}

const RoadmapNode = ({ node, index, onClick }: { node: any; index: number; onClick: () => void }) => {
  const [isHovered, setIsHovered] = useState(false)
  const skill = SKILL_META[node.quiz?.skillType] || SKILL_META.READING
  const SkillIcon = skill.icon
  const isClickable = node.type !== 'locked'

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 w-44 flex flex-col items-center z-10"
      style={{ left: `${node.position.x * 200 + 100}px`, top: `${node.position.y}%` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        whileHover={{ scale: isClickable ? 1.12 : 1.05 }}
        whileTap={{ scale: isClickable ? 0.92 : 1 }}
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: index * 0.08, type: 'spring', bounce: 0.4 }}
        onClick={isClickable ? onClick : undefined}
        className={clsx(
          'relative w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-lg border-b-4 transition-all duration-300 backdrop-blur-md',
          node.type === 'completed' && 'bg-white/90 border-b-gray-200 border border-gray-100',
          node.type === 'active' && 'bg-white border-b-purple-400 ring-4 ring-purple-100 scale-110 shadow-purple-200',
          node.type === 'locked' && 'bg-white/40 border-b-gray-300/30 border border-white/50 grayscale opacity-80 shadow-none',
          isClickable ? 'cursor-pointer hover:rotate-3' : 'cursor-not-allowed',
        )}
      >
        {node.type === 'locked'
          ? (
            <div className="w-12 h-12 rounded-2xl bg-gray-200/50 flex items-center justify-center">
              <LockFilled className="text-gray-400/60 text-xl" />
            </div>
          )
          : (
            <div className={clsx("w-13 h-13 rounded-2xl flex items-center justify-center shadow-inner", skill.bg)}>
              <SkillIcon
                size={24}
                strokeWidth={2.5}
                style={{ color: skill.color }}
                className={node.type === 'active' ? 'animate-pulse' : ''}
              />
            </div>
          )
        }

        {node.type === 'completed' && (
          <>
            <div className="absolute -top-2 -right-2 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-md z-20">
              <CheckCircleFilled className="text-white text-xs" />
            </div>
            <div className="absolute -bottom-5 flex gap-0.5 bg-white px-2 py-0.5 rounded-full border border-gray-100 shadow-sm">
              {[...Array(3)].map((_, i) => (
                <StarFilled key={i} className={clsx('text-[9px]', i < node.stars ? 'text-yellow-400' : 'text-gray-200')} />
              ))}
            </div>
          </>
        )}

        {node.type === 'active' && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full border-2 border-white shadow-md animate-bounce" />
        )}

        {isHovered && isClickable && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute -top-14 bg-gray-800 text-white px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap z-50 font-bold text-xs"
          >
            {node.type === 'completed' ? 'Thử thách lại' : 'Bắt đầu ngay'}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45" />
          </motion.div>
        )}
      </motion.div>

      <h3 className={clsx('mt-6 font-bold text-sm text-center leading-tight max-w-[130px]',
        node.type === 'locked' ? 'text-gray-300' : 'text-gray-700'
      )}>
        {node.title}
      </h3>
      {node.type !== 'locked' && (
        <div className={clsx('text-[10px] font-bold mt-0.5', node.type === 'active' ? 'text-purple-500' : 'text-gray-400')}>
          {skill.label}
        </div>
      )}
    </div>
  )
}

const QuizRoadmapStep = ({
  chapter,
  quizzes,
  loading,
  dialectMeta,
  dialectId,
}: {
  chapter: Level
  quizzes: Quiz[]
  loading: boolean
  dialectMeta: any
  dialectId: string
}) => {
  const navigate = useNavigate()

  const roadmapNodes = useMemo(() => {
    // SORT QUIZZES BY ORDERINDEX TO FIX SEQUENTIAL LOAD BUGS
    const sortedQuizzes = [...quizzes].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))

    return sortedQuizzes.map((quiz, index) => {
      let type: 'completed' | 'active' | 'locked' = 'locked'
      const stars = quiz.starsEarned ?? 0

      if (quiz.isCompleted) {
        type = 'completed'
      } else {
        if (index === 0) {
          type = 'active'
        } else {
          const prev = sortedQuizzes[index - 1]
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
          x: index,
          y: index % 2 === 0 ? 50 : (index % 4 === 1 ? 25 : 75),
        },
      }
    })
  }, [quizzes])

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Spin size="large" />
    </div>
  )

  if (quizzes.length === 0) return (
    <div className="flex justify-center items-center h-40 bg-white rounded-2xl border border-gray-100 mx-6 lg:mx-8 mb-10">
      <Empty description={<span className="text-gray-400 font-medium">Chưa có bài kiểm tra</span>} />
    </div>
  )

  return (
    <div className="w-full mx-auto pb-20 fade-in">

      {/* ── Bắt mắt: Hiện thông tin Vùng Miền thật mượt nhưng nhỏ gọn hơn ── */}
      {dialectMeta && (
        <div className="max-w-4xl mx-auto px-6 mb-4 mt-2">
          <div className="relative bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex items-center p-3 md:p-5 gap-4 md:gap-6">
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl overflow-hidden relative flex-shrink-0 shadow-inner">
              <img src={dialectMeta.photo} className="w-full h-full object-cover" />
              <div className={`absolute inset-0 bg-gradient-to-t ${dialectMeta.gradient} opacity-60`}></div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-black tracking-widest uppercase border border-purple-100">
                  Vùng Đất Khám Phá
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-gray-800 mb-0.5 flex items-center gap-2">
                {dialectMeta.viName}
                <span className="text-purple-500"><dialectMeta.icon size={24} strokeWidth={2.5} /></span>
              </h3>
              <p className="text-gray-500 font-medium text-xs md:text-sm line-clamp-2 max-w-xl">
                {chapter.description || 'Hoàn thành các thử thách phát âm, đọc và nói để tích luỹ sao và mở khoá hành trình mới.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Roadmap Ngang ── */}
      <style dangerouslySetInnerHTML={{
        __html: `
         .roadmap-scroll { overflow-x: auto; overflow-y: hidden; }
         .roadmap-scroll::-webkit-scrollbar { height: 10px; }
         .roadmap-scroll::-webkit-scrollbar-track { background: #f3e8ff; border-radius: 8px; margin: 0 24px; }
         .roadmap-scroll::-webkit-scrollbar-thumb { background: #c084fc; border-radius: 8px; border: 2px solid #f3e8ff; }
         .roadmap-scroll::-webkit-scrollbar-thumb:hover { background: #a855f7; }
      `}} />
      <div className="roadmap-scroll w-full pt-10 pb-14 px-6 mt-4">
        <div className="relative h-[260px] inline-flex" style={{ width: `${roadmapNodes.length * 200 + 200}px`, minWidth: '100%' }}>
          {/* SVG Path */}
          <svg
            className="absolute top-0 left-0 pointer-events-none z-0"
            style={{ width: `${roadmapNodes.length * 200 + 200}px`, height: '260px' }}
            viewBox={`0 0 ${roadmapNodes.length * 200 + 200} 260`}
            preserveAspectRatio="xMidYMid meet"
          >
            {roadmapNodes.map((node, i) => {
              if (i === 0) return null
              const prev = roadmapNodes[i - 1]

              const prevX = prev.position.x * 200 + 100
              const prevY = prev.position.y * 2.5
              const nextX = node.position.x * 200 + 100
              const nextY = node.position.y * 2.5

              return (
                <path
                  key={`path-${i}`}
                  d={`M ${prevX} ${prevY} C ${prevX + 70} ${prevY}, ${nextX - 70} ${nextY}, ${nextX} ${nextY}`}
                  fill="none"
                  stroke={prev.type === 'completed' ? '#a855f7' : '#e5e7eb'}
                  strokeWidth="5"
                  strokeDasharray="14 10"
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
              onClick={() => navigate(`/learner/quiz/${node.id}`, {
                state: {
                  fromRoadmap: true,
                  dialectId,
                  chapterId: chapter.id,
                }
              })}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Main RoadmapPage
// ─────────────────────────────────────────────────────────────────────
type Step = 'dialect' | 'chapters' | 'quizzes'

const RoadmapPage: React.FC = () => {
  const { session } = useAuth()
  const location = useLocation()
  const userRegion = (session?.user as any)?.region?.toUpperCase?.() || ''
  // Map user's region string → NORTH / CENTRAL / SOUTH
  const userRegionKey = useMemo(() => {
    if (!userRegion) return ''
    if (userRegion.includes('NORTH') || userRegion.includes('BẮC')) return 'NORTH'
    if (userRegion.includes('CENTRAL') || userRegion.includes('TRUNG')) return 'CENTRAL'
    if (userRegion.includes('SOUTH') || userRegion.includes('NAM')) return 'SOUTH'
    if (userRegion === 'NORTH') return 'NORTH'
    if (userRegion === 'CENTRAL') return 'CENTRAL'
    if (userRegion === 'SOUTH') return 'SOUTH'
    return ''
  }, [userRegion])

  // ─── Detect if returning from quiz (read state BEFORE first render) ───────
  const navState = (location.state as any) || {}
  const isReturning = !!(navState.fromRoadmap && navState.dialectId && navState.chapterId)

  const [step, setStep] = useState<Step>(isReturning ? 'quizzes' : 'dialect')
  const [dialects, setDialects] = useState<Dialect[]>([])
  const [selectedDialect, setSelectedDialect] = useState<Dialect | null>(null)
  const [chapters, setChapters] = useState<Level[]>([])
  const [selectedChapter, setSelectedChapter] = useState<Level | null>(null)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])

  const [dialectsLoading, setDialectsLoading] = useState(true)
  const [chaptersLoading, setChaptersLoading] = useState(isReturning)
  const [quizzesLoading, setQuizzesLoading] = useState(isReturning)

  // ─── Single unified data-fetch effect ────────────────────────────────────
  useEffect(() => {
    if (isReturning) {
      // Returning from quiz: load everything and restore state without flash
      learnerService.getDialects().then(async (allDialects) => {
        setDialects(allDialects)
        setDialectsLoading(false)

        const dialect = allDialects.find(d => d.id === navState.dialectId)
        if (!dialect) { setStep('dialect'); return }
        setSelectedDialect(dialect)

        try {
          const levels = await learnerService.getLevels(dialect.id)
          const sorted = [...levels].sort((a, b) => (a.levelOrder ?? 0) - (b.levelOrder ?? 0))
          setChapters(sorted)

          const chapter = sorted.find(ch => ch.id === navState.chapterId)
          if (!chapter) { setStep('chapters'); setChaptersLoading(false); return }
          setSelectedChapter(chapter)
          setChaptersLoading(false)

          try {
            const qData = await learnerService.getQuizzesByLevel(chapter.id)
            setQuizzes(qData)
            setStep('quizzes')
          } catch { setStep('chapters') }
          finally { setQuizzesLoading(false) }
        } catch { setStep('dialect'); setChaptersLoading(false) }
      }).catch(() => { setDialectsLoading(false); setStep('dialect') })
    } else {
      // Normal entry: just load dialects
      learnerService.getDialects().then(setDialects).finally(() => setDialectsLoading(false))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  // Breadcrumb header — only shows for quizzes step (chapters step uses the integrated banner)
  const renderHeader = () => {
    if (step === 'dialect' || step === 'chapters') return null

    return (
      <div className="sticky top-0 z-20 bg-[#f8f7ff]/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 px-6 lg:px-8 py-4">
          <button
            onClick={goBack}
            className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-purple-50 hover:border-purple-200 transition-all flex-shrink-0"
          >
            <ArrowLeftOutlined className="text-gray-600" />
          </button>

          <div className="flex-1 min-w-0">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold mb-0.5">
              <span className="hover:text-purple-600 cursor-pointer" onClick={() => { setStep('dialect'); setSelectedDialect(null); setChapters([]) }}>Vùng miền</span>
              <ChevronRight size={12} />
              <span className="hover:text-purple-600 cursor-pointer" onClick={goBack}>
                {dialectMeta?.viName}
              </span>
              {selectedChapter && (
                <>
                  <ChevronRight size={12} />
                  <span className="text-gray-700 font-bold truncate">{selectedChapter.name}</span>
                </>
              )}
            </div>
            {/* Title */}
            <h2 className="text-lg font-black text-gray-800 truncate">
              {selectedChapter?.name}
            </h2>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#f8f7ff]">
      {/* Sticky Breadcrumb Header */}
      {renderHeader()}

      <AnimatePresence mode="wait">
        {step === 'dialect' && (
          <motion.div
            key="dialect"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
          >
            {dialectsLoading ? (
              <div className="flex justify-center items-center h-64">
                <Spin size="large" />
              </div>
            ) : (
              <DialectStep dialects={dialects} onSelect={handleSelectDialect} userRegionKey={userRegionKey} />
            )}
          </motion.div>
        )}

        {step === 'chapters' && (
          <motion.div
            key="chapters"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35 }}
          >
            {chaptersLoading ? (
              <div className="flex justify-center items-center h-64">
                <Spin size="large" />
              </div>
            ) : (
              <ChapterStep
                dialect={selectedDialect!}
                chapters={chapters}
                onSelect={handleSelectChapter}
                onBack={goBack}
              />
            )}
          </motion.div>
        )}

        {step === 'quizzes' && (
          <motion.div
            key="quizzes"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35 }}
            className="mt-4"
          >
            <QuizRoadmapStep
              chapter={selectedChapter!}
              quizzes={quizzes}
              loading={quizzesLoading}
              dialectMeta={dialectMeta}
              dialectId={selectedDialect?.id ?? ''}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default RoadmapPage
