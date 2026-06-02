import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../../core/auth/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LockFilled,
  CheckCircleFilled,
  ArrowLeftOutlined,
} from '@ant-design/icons'
import { Empty, Pagination } from 'antd'
import clsx from 'clsx'
import { useNavigate, useLocation } from 'react-router-dom'
import { learnerService, type Level, type Dialect, type Quiz } from '../services/learnerService'
import { Headphones, Mic, PenTool, BookOpen, Play, ChevronRight, Globe, Landmark, Castle, Building2, Star } from 'lucide-react'
import { DoodleLoading } from '../../../components/ui/DoodleLoading'
import mienbacImg from '../../../assets/mienbac.png'
import mientrungImg from '../../../assets/mientrung.png'
import miennamImg from '../../../assets/miennam.png'
import vietnamMapImg from '../../../assets/bandovietnam-Photoroom.png'

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
    emoji: '',
    icon: Landmark,
    description: 'Chinh phục phát âm chuẩn — nền tảng của tiếng Việt quy chuẩn.',
    photo: mienbacImg,
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
    photo: mientrungImg,
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
    photo: miennamImg,
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
      className="relative group cursor-pointer w-full h-full"
      onClick={() => onSelect(dialect)}
    >
      <div
        className={`absolute -inset-0.5 rounded-3xl blur-lg transition-all duration-500 ${isMyRegion ? 'opacity-70' : 'opacity-0 group-hover:opacity-60'}`}
        style={{ backgroundColor: meta.color }}
      />

      <div className="relative bg-white rounded-3xl overflow-hidden border-[2.5px] border-slate-900 shadow-[6px_6px_0_#1f2937] transition-all duration-500 w-full h-full min-h-[440px] flex flex-col">
        <div className="relative h-[200px] overflow-hidden">
          <img
            src={meta.photo}
            alt={meta.viName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            onError={(e: any) => { e.target.src = `https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80` }}
          />

          <div className="absolute top-4 left-4 flex items-center gap-2 max-w-[calc(100%-2rem)] flex-wrap">
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

          <div className="absolute bottom-5 left-6 right-6">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-4xl font-black text-white drop-shadow-lg leading-none break-keep">{meta.viName}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg border border-white/20 backdrop-blur-sm bg-white/10 flex-shrink-0">
                <meta.icon size={26} strokeWidth={2} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 flex-1 flex flex-col">
          <p className="text-slate-500 text-sm font-bold leading-relaxed mb-5 flex-1">
            {dialect.description && dialect.description !== meta.viName ? dialect.description : meta.description}
          </p>

          <button className="w-full h-12 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2 transition-all duration-300 border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f2937] active:translate-y-1 active:shadow-none bg-[#49B6E5]">
            <Play size={16} className="fill-white" />
            {isMyRegion ? 'Khám phá ngay ✦' : 'Khám phá ngay'}
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

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
    <div className="w-full max-w-[2400px] mx-auto px-6 pt-6 pb-4 lg:pt-8 lg:pb-6 overflow-hidden h-[calc(100vh-120px)]">
      <div className="grid h-full grid-cols-1 lg:grid-cols-[minmax(0,1.55fr)_minmax(460px,0.9fr)] gap-8 xl:gap-12 items-center">
        <div className="min-w-0">
          <div className="mb-6 text-center lg:text-center">
            <div className="space-y-1 max-w-3xl mx-auto lg:translate-x-[18%]">
              <h1 className="text-3xl lg:text-[2.4rem] font-black text-slate-900 leading-tight font-nunito uppercase tracking-tight">
                Chinh Phục <span className="text-[#49B6E5]">Tiếng Việt</span>
              </h1>
              <p className="text-slate-400 font-black text-xs lg:text-sm uppercase tracking-widest">
                Chọn giọng địa phương để bắt đầu hành trình của bạn
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch justify-items-stretch">
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

        <div className="hidden lg:flex items-center justify-center h-full min-h-0 overflow-hidden">
          <div className="relative w-[500px] h-[620px] flex items-center justify-center overflow-hidden">
            <img
              src={vietnamMapImg}
              alt="Bản đồ Việt Nam"
              className="max-w-full max-h-full w-auto h-auto object-contain object-center scale-95 drop-shadow-[30px_30px_0_rgba(73,182,229,0.08)]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

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

  useEffect(() => { setCurrentPage(1) }, [dialect.id])

  const paginatedChapters = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return approvedChapters.slice(start, start + pageSize)
  }, [approvedChapters, currentPage, pageSize])

  return (
    <div className="w-full max-w-3xl mx-auto p-6 lg:p-8 pb-20">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8 rounded-[2rem] overflow-hidden border-[2.5px] border-slate-900 shadow-[6px_6px_0_#1f2937] bg-white"
      >
        <div className="absolute inset-0">
          <img src={meta.photo} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="relative px-8 py-6 flex items-center gap-6">
          <button
            onClick={onBack}
            className="w-12 h-12 rounded-2xl bg-white border-[2px] border-slate-900 shadow-[3px_3px_0_#1f2937] flex items-center justify-center hover:-translate-y-0.5 transition-all active:translate-y-0.5 active:shadow-none"
          >
            <ArrowLeftOutlined className="text-slate-900 font-black" />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-[#49B6E5] border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f2937] flex items-center justify-center text-white flex-shrink-0">
            <meta.icon size={28} strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] leading-tight font-nunito">{meta.viName}</h2>
            <p className="text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] text-sm font-bold uppercase tracking-wider">{meta.tagline}</p>
          </div>
          <div className="text-right hidden md:block">
            <div className="bg-white border-[2px] border-slate-900 rounded-xl px-4 py-2 shadow-[2px_2px_0_#1f2937]">
              <p className="text-slate-900 text-sm font-black">{approvedChapters.length} Chương</p>
            </div>
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
                className={clsx(
                  'relative bg-white rounded-2xl border-[2.5px] border-slate-900 transition-all duration-400 overflow-hidden',
                  ch.isLocked
                    ? 'opacity-60 cursor-not-allowed bg-slate-50'
                    : 'cursor-pointer group hover:-translate-y-1 hover:shadow-[6px_6px_0_#1f2937] shadow-[4px_4px_0_#1f2937]'
                )}
                onClick={() => !ch.isLocked && onSelect(ch)}
              >
                <div className="flex items-center gap-5 p-5 pl-6">
                  <div className="relative flex-shrink-0">
                    <div
                      className={clsx(
                        'w-14 h-14 rounded-2xl border-[2.5px] border-slate-900 flex items-center justify-center text-white font-black text-xl transition-all duration-300 shadow-[3px_3px_0_#1f2937]',
                        ch.isLocked ? 'bg-slate-300' : 'bg-[#49B6E5] group-hover:rotate-3'
                      )}
                    >
                      {ch.isLocked ? <LockFilled className="text-white/80 text-lg" /> : seqNum}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-lg border-[1.5px] border-slate-900 bg-white">
                        Chương {seqNum}
                      </span>
                      {isCompleted && !ch.isLocked && (
                        <span className="text-[10px] font-black tracking-wider uppercase text-green-600 bg-green-50 px-2 py-0.5 rounded-lg border-[1.5px] border-green-600">
                          ✓ Hoàn thành
                        </span>
                      )}
                    </div>
                    <h4 className={clsx(
                      'font-black text-lg truncate transition-colors font-nunito',
                      ch.isLocked ? 'text-slate-400' : 'text-slate-900 group-hover:text-[#49B6E5]'
                    )}>
                      {ch.name}
                    </h4>
                    <p className="text-sm text-slate-500 mt-0.5 truncate font-bold">
                      {ch.isLocked ? 'Hoàn thành bài học trước để mở khóa' : desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    {isCompleted && stars > 0 && !ch.isLocked && (
                      <div className="flex gap-1">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className={clsx('w-6 h-6 rounded-lg border-[1.5px] border-slate-900 flex items-center justify-center shadow-[1px_1px_0_#1f2937]', i < stars ? 'bg-yellow-400' : 'bg-white')}>
                            <Star size={12} className="fill-slate-900 text-slate-900" />
                          </div>
                        ))}
                      </div>
                    )}
                    <div
                      className={clsx(
                        'w-10 h-10 rounded-xl border-[2px] border-slate-900 flex items-center justify-center shadow-[2px_2px_0_#1f2937] transition-all duration-300',
                        ch.isLocked ? 'bg-slate-100 text-slate-400' : 'bg-[#7dd3fc] text-slate-900 group-hover:translate-x-1'
                      )}
                    >
                      {ch.isLocked ? <LockFilled size={16} /> : <ChevronRight size={18} strokeWidth={3} />}
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
        whileHover={{ scale: isClickable ? 1.1 : 1.05, rotate: isClickable ? 3 : 0 }}
        whileTap={{ scale: isClickable ? 0.95 : 1 }}
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: index * 0.08, type: 'spring', bounce: 0.4 }}
        onClick={isClickable ? onClick : undefined}
        className={clsx(
          'relative w-20 h-20 rounded-[2.2rem] flex items-center justify-center border-[2.5px] border-slate-900 transition-all duration-300',
          node.type === 'completed' && 'bg-white shadow-[4px_4px_0_#1f2937]',
          node.type === 'active' && 'bg-[#49B6E5] shadow-[6px_6px_0_#1f2937] ring-4 ring-[#49B6E5]/20',
          node.type === 'locked' && 'bg-slate-100 border-slate-400 shadow-none grayscale opacity-60',
          isClickable ? 'cursor-pointer' : 'cursor-not-allowed',
        )}
      >
        {node.type === 'locked'
          ? (
            <LockFilled size={20} className="text-slate-400" />
          )
          : (
            <div className={clsx('w-12 h-12 rounded-2xl flex items-center justify-center', node.type === 'active' ? 'bg-white/20' : skill.bg)}>
              <SkillIcon
                size={22}
                strokeWidth={3}
                className={node.type === 'active' ? 'text-white' : ''}
                style={node.type !== 'active' ? { color: skill.color } : {}}
              />
            </div>
          )
        }

        {node.type === 'completed' && (
          <div className="absolute -top-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937] z-20">
            <CheckCircleFilled className="text-white text-[10px]" />
          </div>
        )}

        {isHovered && isClickable && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute -top-14 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-[4px_4px_0_rgba(0,0,0,0.1)] whitespace-nowrap z-50 font-black text-[11px] border-[1.5px] border-white/20"
          >
            {node.type === 'completed' ? 'Ôn tập lại' : 'Bắt đầu học'}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
          </motion.div>
        )}
      </motion.div>

      {node.type === 'completed' && node.stars > 0 ? (
        <div className="flex gap-1 mt-3 justify-center">
          {[...Array(3)].map((_, i) => (
            <Star
              key={i}
              size={13}
              strokeWidth={2.5}
              className={clsx(
                i < node.stars ? "fill-yellow-400 text-slate-900" : "fill-slate-100 text-slate-300"
              )}
            />
          ))}
        </div>
      ) : (
        <div className="h-[13px] mt-3" />
      )}

      <h3 className={clsx('mt-1.5 font-black text-[13px] text-center leading-tight max-w-[130px] font-nunito',
        node.type === 'locked' ? 'text-slate-300' : 'text-slate-900'
      )}>
        {node.title}
      </h3>
      {node.type !== 'locked' && (
        <div className={clsx('text-[10px] font-black uppercase tracking-widest mt-1 bg-white px-2 py-0.5 rounded-lg border-[1.5px] border-slate-900 shadow-[1px_1px_0_#1f2937]', node.type === 'active' ? 'text-[#49B6E5]' : 'text-slate-400')}>
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
          y: index % 2 === 0 ? 50 : (index % 4 === 1 ? 35 : 65),
        },
      }
    })
  }, [quizzes])

  if (loading) return <DoodleLoading message="Đang tải các bài học..." />

  if (quizzes.length === 0) return (
    <div className="flex justify-center items-center h-40 bg-white rounded-2xl border border-gray-100 mx-6 lg:mx-8 mb-10">
      <Empty description={<span className="text-gray-400 font-medium">Chưa có bài kiểm tra</span>} />
    </div>
  )

  return (
    <div className="w-full mx-auto pb-10 fade-in">
      {dialectMeta && (
        <div className="max-w-4xl mx-auto px-6 mb-4 mt-2">
          <div className="relative bg-white rounded-3xl border-[2.5px] border-slate-900 shadow-[6px_6px_0_#1f2937] overflow-hidden flex flex-col md:flex-row items-center p-4 md:p-5 gap-4 md:gap-8">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-[2.5px] border-slate-900 shadow-[3px_3px_0_#1f2937] overflow-hidden relative flex-shrink-0">
              <img src={dialectMeta.photo} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1.5">
                <span className="inline-block px-2 py-0.5 bg-white border-[2px] border-slate-900 text-slate-900 rounded-lg text-[10px] font-black tracking-widest uppercase shadow-[1px_1px_0_#1f2937]">
                  Lộ trình học tập
                </span>
                <span className="text-[#49B6E5] hidden md:block">
                  <dialectMeta.icon size={24} strokeWidth={3} />
                </span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-1 font-nunito">
                Hành Trình {dialectMeta.viName}
              </h3>
              <p className="text-slate-500 font-bold text-xs md:text-sm leading-relaxed max-w-2xl">
                {chapter.description || 'Chinh phục từng thử thách để làm chủ giọng nói địa phương đặc trưng. Mỗi vì sao đạt được là một bước tiến gần hơn đến sự hoàn hảo.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
         .roadmap-scroll { overflow-x: auto; overflow-y: hidden; }
         .roadmap-scroll::-webkit-scrollbar { height: 10px; }
         .roadmap-scroll::-webkit-scrollbar-track { background: #f1e9db; border-radius: 8px; margin: 0 24px; }
         .roadmap-scroll::-webkit-scrollbar-thumb { background: #49B6E5; border-radius: 8px; border: 2px solid #f1e9db; }
         .roadmap-scroll::-webkit-scrollbar-thumb:hover { background: #38bdf8; }
      `}} />
      <div className="roadmap-scroll w-full pt-8 pb-10 px-6 mt-2">
        <div className="relative h-[300px] inline-flex items-center" style={{ width: `${roadmapNodes.length * 200 + 200}px`, minWidth: '100%' }}>
          <svg
            className="absolute top-0 left-0 pointer-events-none z-0"
            style={{ width: `${roadmapNodes.length * 200 + 200}px`, height: '300px' }}
            viewBox={`0 0 ${roadmapNodes.length * 200 + 200} 300`}
            preserveAspectRatio="xMidYMid meet"
          >
            {roadmapNodes.map((node, i) => {
              if (i === 0) return null
              const prev = roadmapNodes[i - 1]

              const prevX = prev.position.x * 200 + 100
              const prevY = prev.position.y * 3
              const nextX = node.position.x * 200 + 100
              const nextY = node.position.y * 3

              return (
                <g key={`path-group-${i}`}>
                  <path
                    d={`M ${prevX} ${prevY} C ${prevX + 80} ${prevY}, ${nextX - 80} ${nextY}, ${nextX} ${nextY}`}
                    fill="none"
                    stroke="#1f2937"
                    strokeWidth="6"
                    strokeLinecap="round"
                    className="opacity-10 translate-y-1 translate-x-1"
                  />
                  <path
                    d={`M ${prevX} ${prevY} C ${prevX + 80} ${prevY}, ${nextX - 80} ${nextY}, ${nextX} ${nextY}`}
                    fill="none"
                    stroke={prev.type === 'completed' ? '#49B6E5' : '#cbd5e1'}
                    strokeWidth="4"
                    strokeDasharray="1 8"
                    strokeLinecap="round"
                  />
                  <circle cx={prevX + (nextX - prevX) * 0.3} cy={prevY + (nextY - prevY) * 0.3} r="3" fill="#cbd5e1" className="opacity-40" />
                  <circle cx={prevX + (nextX - prevX) * 0.7} cy={prevY + (nextY - prevY) * 0.7} r="4" fill="#cbd5e1" className="opacity-40" />
                </g>
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

type Step = 'dialect' | 'chapters' | 'quizzes'

const RoadmapPage: React.FC = () => {
  const { session } = useAuth()
  const location = useLocation()
  const userRegion = (session?.user as any)?.region?.toUpperCase?.() || ''
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

  useEffect(() => {
    if (isReturning) {
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

  const renderHeader = () => {
    if (step === 'dialect' || step === 'chapters') return null

    return (
      <div className="sticky top-0 z-20 bg-[#fbf6ef]/90 backdrop-blur-md border-b-[1.5px] border-slate-900/10">
        <div className="flex items-center gap-6 px-6 lg:px-12 py-3">
          <button
            onClick={goBack}
            className="w-10 h-10 rounded-xl bg-white border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937] flex items-center justify-center hover:-translate-y-0.5 transition-all active:translate-y-0 active:shadow-none"
          >
            <ArrowLeftOutlined className="text-slate-900 font-black" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest mb-0.5">
              <span className="hover:text-[#49B6E5] cursor-pointer" onClick={() => { setStep('dialect'); setSelectedDialect(null); setChapters([]) }}>Vùng miền</span>
              <ChevronRight size={10} strokeWidth={3} />
              <span className="hover:text-[#49B6E5] cursor-pointer" onClick={goBack}>
                {dialectMeta?.viName}
              </span>
              {selectedChapter && (
                <>
                  <ChevronRight size={10} strokeWidth={3} />
                  <span className="text-slate-900 truncate">Hành trình học</span>
                </>
              )}
            </div>
            <h2 className="text-lg font-black text-slate-900 truncate">
              {selectedChapter?.name}
            </h2>
          </div>


        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#fbf6ef] overflow-x-hidden">
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
              <DoodleLoading message="Đang tải các vùng miền..." />
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
              <DoodleLoading message="Đang chuẩn bị các chương..." />
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
            className="mt-1"
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
