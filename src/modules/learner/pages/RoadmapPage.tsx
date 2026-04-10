import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  StarFilled,
  LockFilled,
  PlayCircleFilled,
  CheckCircleFilled,
  ArrowLeftOutlined,
  ReadOutlined,
  CompassOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import { Spin, Empty, Button, Tooltip } from 'antd'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'
import { learnerService, type Level, type Dialect, type Quiz } from '../services/learnerService'
import { Headphones, Mic, PenTool, BookOpen } from 'lucide-react'

// ─────────────────────────────────────────────
const DIALECT_META: Record<string, {
  viName: string;
  color: string;
  image: string;
  desc: string;
  tagline: string;
}> = {
  NORTH: {
    viName: 'Miền Bắc',
    color: '#00897B',
    image: '/assets/regions/north.png',
    desc: 'Học giọng chuẩn Hà Nội thanh lịch, quy chuẩn với hệ thống âm tiết chuẩn xác.',
    tagline: 'THANH LỊCH & QUY CHUẨN'
  },
  CENTRAL: {
    viName: 'Miền Trung',
    color: '#FB8C00',
    image: '/assets/regions/central.png',
    desc: 'Khám phá giọng Huế mộng mơ và các tỉnh miền Trung với ngữ điệu nồng hậu.',
    tagline: 'NỒNG HẬU & DI SẢN'
  },
  SOUTH: {
    viName: 'Miền Nam',
    color: '#1967D2',
    image: '/assets/regions/south.png',
    desc: 'Bắt nhịp giọng Sài Gòn sôi động, cởi mở và dễ gần trong giao tiếp hằng ngày.',
    tagline: 'SÔI ĐỘNG & CỞI MỞ'
  },
}

const getDialectKey = (name: string = '') => {
  const n = name.toUpperCase()
  if (n.includes('BẮC') || n.includes('NORTH')) return 'NORTH'
  if (n.includes('TRUNG') || n.includes('CENTRAL')) return 'CENTRAL'
  if (n.includes('NAM') || n.includes('SOUTH')) return 'SOUTH'
  return 'NORTH'
}

// ─────────────────────────────────────────────
// Step 1: Professional Dialect Selection
// ─────────────────────────────────────────────
const DialectStep = ({ dialects, onSelect }: { dialects: Dialect[]; onSelect: (d: Dialect) => void }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto py-10">
      {dialects.map((d, i) => {
        const key = getDialectKey(d.name)
        const meta = DIALECT_META[key]
        return (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => onSelect(d)}
            className="group cursor-pointer bg-white rounded-[2rem] border border-[#E0E3E7] p-10 hover:shadow-xl hover:-translate-y-2 transition-all flex flex-col items-center text-center relative overflow-hidden"
          >
             <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: meta.color }} />
             <div className="text-6xl mb-8 group-hover:scale-110 transition-transform">{meta.icon}</div>
             <h3 className="text-2xl font-black text-[#202124] mb-3">{meta.viName}</h3>
             <p className="text-sm text-[#5F6368] font-medium leading-relaxed">{meta.desc}</p>
             <div className="mt-10">
                 <Button type="link" className="font-bold text-sm tracking-widest uppercase flex items-center gap-2" style={{ color: meta.color }}>
                     Khám phá ngay <PlayCircleFilled />
                 </Button>
             </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────
// Step 2: Clean Chapter List
// ─────────────────────────────────────────────
const ChapterStep = ({ chapters, onSelect }: { chapters: Level[]; onSelect: (ch: Level) => void }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-10">
      {chapters.map((ch, i) => (
        <motion.div
          key={ch.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onSelect(ch)}
          className="bg-white rounded-2xl border border-[#E0E3E7] p-6 flex items-center justify-between hover:shadow-md cursor-pointer group transition-all"
        >
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-xl bg-[#F8F9FA] border border-[#E0E3E7] flex items-center justify-center font-black text-[#202124] group-hover:bg-[#00897B] group-hover:text-white transition-colors">
               {ch.levelOrder || i + 1}
            </div>
            <div>
               <h4 className="text-lg font-bold text-[#202124] group-hover:text-[#00897B] transition-colors">{ch.name}</h4>
               <p className="text-xs text-[#5F6368] font-medium">{ch.description || 'Hoàn thành bài học để mở khóa cấp độ này.'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             {ch.isCompleted && <CheckCircleFilled className="text-[#00897B] text-xl" />}
             <div className="flex gap-1">
                {[...Array(3)].map((_, si) => (
                  <StarFilled key={si} className={clsx("text-xs", si < (ch.starsEarned || 0) ? "text-[#FB8C00]" : "text-[#E0E3E7]")} />
                ))}
             </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// Step 3: Stitch-Style Quiz Roadmap
// ─────────────────────────────────────────────
const QuizRoadmapStep = ({ quizzes }: { quizzes: Quiz[] }) => {
  const navigate = useNavigate()
  
  const getIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'LISTENING': return <Headphones size={28} />
      case 'SPEAKING': return <Mic size={28} />
      case 'WRITING': return <PenTool size={28} />
      default: return <BookOpen size={28} />
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-20 relative">
        {/* Simplified Journey Path */}
        <div className="relative flex flex-col items-center gap-32">
            {quizzes.map((q, i) => {
                const isLocked = i > 0 && !quizzes[i-1].isCompleted
                const isActive = !q.isCompleted && !isLocked
                
                return (
                    <div key={q.id} className="relative flex flex-col items-center">
                        {/* Connecting Line (Vertical) */}
                        {i < quizzes.length - 1 && (
                            <div className={clsx(
                                "absolute w-1 h-32 top-full transition-colors",
                                q.isCompleted ? "bg-[#00897B]" : "bg-[#E0E3E7]"
                            )} />
                        )}

                        {/* Quiz Node */}
                        <Tooltip title={q.description || q.name} placement="right">
                          <motion.div
                            whileHover={{ scale: isLocked ? 1 : 1.1 }}
                            className={clsx(
                                "w-24 h-24 rounded-full flex items-center justify-center relative z-10 border-4 transition-all shadow-lg cursor-pointer",
                                q.isCompleted ? "bg-[#00897B] border-[#00897B] text-white" : 
                                isActive ? "bg-white border-[#00897B] text-[#00897B] shadow-stitch-teal/20" : 
                                "bg-[#F1F3F4] border-[#E0E3E7] text-[#9AA0A6] cursor-not-allowed"
                            )}
                            onClick={() => !isLocked && navigate(`/learner/quiz/${q.id}`)}
                          >
                             {isLocked ? <LockFilled /> : getIcon(q.skillType || '')}
                             
                             {/* Rating dots */}
                             {q.isCompleted && (
                                <div className="absolute -bottom-2 flex gap-0.5">
                                   {[...Array(3)].map((_, stars) => (
                                       <div key={stars} className={clsx("w-2 h-2 rounded-full", stars < (q.starsEarned || 0) ? "bg-[#FB8C00]" : "bg-white/30")} />
                                   ))}
                                </div>
                             )}
                          </motion.div>
                        </Tooltip>
                        
                        <div className={clsx(
                            "mt-6 text-sm font-black uppercase tracking-widest text-center max-w-[120px]",
                            isLocked ? "text-gray-300" : "text-[#202124]"
                        )}>
                            {q.name || `CHẶNG ${i+1}`}
                        </div>
                    </div>
                )
            })}
        </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
const RoadmapPage: React.FC = () => {
    const navigate = useNavigate()
    const [step, setStep] = useState<'dialect' | 'chapters' | 'quizzes'>('dialect')
    const [dialects, setDialects] = useState<Dialect[]>([])
    const [selectedDialect, setSelectedDialect] = useState<Dialect | null>(null)
    const [chapters, setChapters] = useState<Level[]>([])
    const [selectedChapter, setSelectedChapter] = useState<Level | null>(null)
    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        learnerService.getDialects().then(setDialects).finally(() => setLoading(false))
    }, [])

    const handleSelectDialect = async (d: Dialect) => {
        setSelectedDialect(d)
        setStep('chapters')
        setLoading(true)
        try {
            const data = await learnerService.getLevels(d.id)
            setChapters([...data].sort((a,b) => (a.levelOrder || 0) - (b.levelOrder || 0)))
        } finally { setLoading(false) }
    }

    const handleSelectChapter = async (ch: Level) => {
        setSelectedChapter(ch)
        setStep('quizzes')
        setLoading(true)
        try {
            const data = await learnerService.getQuizzesByLevel(ch.id)
            setQuizzes(data)
        } finally { setLoading(false) }
    }

    const goBack = () => {
        if (step === 'quizzes') { setStep('chapters'); setSelectedChapter(null); }
        else if (step === 'chapters') { setStep('dialect'); setSelectedDialect(null); }
        else navigate('/learner/dashboard')
    }

    return (
        <div className="min-h-screen bg-[#F8F9FA] relative pb-20 font-inter">
            {/* Background Decorations */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#00897B 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

            {/* Header Area */}
            <div className="relative z-10 pt-10 px-8 max-w-6xl mx-auto flex items-center justify-between mb-12">
                <div className="flex items-center gap-6">
                    <button onClick={goBack} className="w-12 h-12 rounded-xl bg-white border border-[#E0E3E7] shadow-sm flex items-center justify-center hover:bg-gray-50 transition-all active:scale-95">
                        <ArrowLeftOutlined className="text-[#202124]" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-[#202124] tracking-tight uppercase italic flex items-center gap-3">
                            {step === 'dialect' ? 'Hành trình chinh phục' : selectedDialect?.name}
                            <CompassOutlined className="text-[#00897B]" />
                        </h1>
                        <p className="text-sm text-[#5F6368] font-bold uppercase tracking-widest mt-1">
                            {step === 'dialect' ? 'Chọn vùng miền để bắt đầu' : selectedChapter?.name || 'Vui lòng chọn chương học'}
                        </p>
                    </div>
                </div>
                
                {step === 'quizzes' && (
                    <div className="hidden lg:flex items-center gap-3 bg-[#E0F2F1] px-5 py-2.5 rounded-2xl border border-[#B2DFDB]">
                         <TrophyOutlined className="text-[#00897B] text-xl" />
                         <span className="text-[#00897B] font-black text-sm italic uppercase tracking-wider">Cố gắng đạt 3 sao mỗi chặng!</span>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="relative z-10 px-8">
                {loading ? (
                    <div className="flex justify-center items-center py-40"><Spin size="large" /></div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            transition={{ duration: 0.4 }}
                        >
                            {step === 'dialect' && <DialectStep dialects={dialects} onSelect={handleSelectDialect} />}
                            {step === 'chapters' && <ChapterStep chapters={chapters} onSelect={handleSelectChapter} />}
                            {step === 'quizzes' && <QuizRoadmapStep quizzes={quizzes} />}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    )
}

export default RoadmapPage;
