import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Volume2,
  Mic,
  RotateCcw,
  Lightbulb,
  MousePointer2,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Trophy,
  ArrowRight,
  Info,
  Sparkles
} from 'lucide-react'
import { Input, message } from 'antd'
import clsx from 'clsx'

import apiClient from '../../../services/apiClient'
import { useAuth } from '../../../core/auth/AuthContext'
import { useAudioRecorder } from '../../../hooks/useAudioRecorder'
import { uploadToCloudinary } from '../../../services/cloudinaryService'
import characterImg from '../../../assets/4df21173-ac6f-458e-b5b2-2d31d39b0d39-Photoroom.png'
import { ASR_BASE_URL } from '../../../config'
import { DoodleLoading } from '../../../components/ui/DoodleLoading'

const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800;900&display=swap');
  
  .font-doodle {
    font-family: 'Nunito', sans-serif;
  }
  
  @keyframes doodle-shake {
    0%, 100% { transform: rotate(-0.5deg); }
    50% { transform: rotate(0.5deg); }
  }
  .animate-doodle-shake {
    animation: doodle-shake 0.3s infinite ease-in-out;
  }
  @keyframes pulse-intense {
    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
    50% { transform: scale(1.05); box-shadow: 0 0 20px 10px rgba(239, 68, 68, 0); }
  }
  .animate-timer-danger {
    animation: pulse-intense 0.6s infinite ease-in-out;
  }

  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`

const TypedText: React.FC<{ text: string; speed?: number; onComplete?: () => void }> = ({ text, speed = 25, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('')
  const [index, setIndex] = useState(0)
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    setDisplayedText('')
    setIndex(0)
    setIsDone(false)
  }, [text])

  useEffect(() => {
    if (index < text.length && !isDone) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[index])
        setIndex(prev => prev + 1)
      }, speed)
      return () => clearTimeout(timeout)
    } else if (index >= text.length && !isDone) {
      setIsDone(true)
      if (onComplete) onComplete()
    }
  }, [index, text, speed, onComplete, isDone])

  const handleSkip = () => {
    setDisplayedText(text)
    setIndex(text.length)
    setIsDone(true)
    if (onComplete) onComplete()
  }

  return (
    <div className="cursor-pointer select-none h-full w-full" onClick={handleSkip}>
      <p className="leading-relaxed whitespace-pre-wrap">{displayedText}</p>
      {!isDone && <span className="inline-block w-2 h-5 bg-slate-900 animate-pulse ml-1 align-middle" />}
    </div>
  )
}






/*
 * ══════════════════════════════════════════════════════════════════════════════
 *  ACTUAL metadataJson formats (from /api/v1/public/debug/challenge-bank):
 *
 *  LISTENING:
 *    { options, correctAnswer, audioUrl, transcript }
 *
 *  SPEAKING v1:
 *    { text, audio_url }
 *  SPEAKING v2:
 *    { transcript, audioUrl, hint }
 *
 *  WRITING:
 *    { sentence, correctWords[], distractors[], hint }
 *
 *  READING v1 (multiple choice):
 *    { options[], correctAnswer, hint, imageUrl }
 *  READING v2 (find wrong word):
 *    { words[], error_index, correct_word, hint }
 *
 *  Response shape from GET /users/quizzes/{id}/challenges:
 *    [{ orderIndex, challenge: ChallengeBank entity }]
 *  ChallengeBank entity (Jackson camelCase):
 *    { id, contentText, skillType, difficultyTag, region, metadataJson }
 * ══════════════════════════════════════════════════════════════════════════════
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** Rendering mode determines which UI to show */
type RenderMode =
  | 'MULTIPLE_CHOICE'   // options + correctAnswer
  | 'FIND_WRONG_WORD'   // words[] + error_index + correct_word
  | 'WRITING_FILL'      // sentence + correctWords + distractors
  | 'SPEAKING_READ'     // text / transcript to read aloud
  | 'GENERIC'           // fallback

interface ParsedChallenge {
  id: string
  mode: RenderMode
  skillType: string
  content: string                // main question / prompt
  // MULTIPLE_CHOICE
  options: string[]
  correctAnswer: string
  // FIND_WRONG_WORD
  words: string[]
  errorIndex: number
  correctWord: string
  // WRITING
  sentence: string               // full original sentence
  blankSentence: string          // sentence with '_' for gaps
  correctWords: string[]         // list of valid answers
  distractors: string[]          // wrong options to show as chips
  // SPEAKING
  transcript: string
  correctSentence?: string
  // Common
  audioUrl: string | null
  ipaText: string | null
  imageUrl: string | null
  hint: string | null
  timeLimit: number | null     // time for THIS question
  region?: string              // dialect/region of the challenge
}


interface QuizDetail {
  id: string
  name: string
  passingScore: number
  timeLimitSeconds: number     // TOTAL time for quiz
  challenges: ParsedChallenge[]
  dialect?: string             // region/dialect of the quiz (optional)
}



// ─── metadataJson → ParsedChallenge normalizer ──────────────────────────────

function parseChallenge(raw: any): ParsedChallenge {
  const ch = raw?.challenge ?? raw ?? {}
  const meta: any = ch.metadataJson ?? {}
  const skillType = (ch.skillType ?? meta.skill_type ?? 'READING').toUpperCase()

  // Detect render mode from metadata shape
  let mode: RenderMode = 'GENERIC'

  const hasOptions = Array.isArray(meta.options) && meta.options.length > 0
  const hasWords = Array.isArray(meta.words) && meta.words.length > 0
  const hasWriting = meta.blankSentence || meta.sentence || meta.correctAnswer || Array.isArray(meta.correctWords)
  const hasTranscript = typeof meta.transcript === 'string' || typeof meta.text === 'string'

  if (hasWords && meta.error_index !== undefined) {
    mode = 'FIND_WRONG_WORD'
  } else if (hasOptions) {
    mode = 'MULTIPLE_CHOICE'
  } else if (skillType === 'WRITING' || hasWriting) {
    mode = 'WRITING_FILL'
  } else if (skillType === 'SPEAKING' || hasTranscript) {
    mode = 'SPEAKING_READ'
  }

  // Normalize Writing fields
  let cWords: string[] = []
  if (meta.correctAnswer) cWords = [meta.correctAnswer]
  else if (Array.isArray(meta.correctWords)) cWords = meta.correctWords

  let dtrs: string[] = []
  if (Array.isArray(meta.alternatives)) dtrs = meta.alternatives
  else if (Array.isArray(meta.distractors)) dtrs = meta.distractors

  return {
    id: ch.id ?? '',
    mode,
    skillType,
    content: ch.contentText ?? meta.content_text ?? '',
    // MULTIPLE_CHOICE
    options: hasOptions ? meta.options : [],
    correctAnswer: meta.correctAnswer ?? meta.correct_answer ?? '',
    // FIND_WRONG_WORD
    words: hasWords ? meta.words : [],
    errorIndex: typeof meta.error_index === 'number' ? meta.error_index : -1,
    correctWord: meta.correct_word ?? '',
    // WRITING
    sentence: meta.sentence ?? meta.fullSentence ?? '',
    blankSentence: meta.blankSentence ?? '',
    correctWords: cWords,
    distractors: dtrs,
    // SPEAKING
    transcript: meta.transcript ?? meta.text ?? '',
    correctSentence: meta.correctSentence ?? meta.fullCorrectText ?? '',
    // Common
    audioUrl: meta.audioUrl ?? meta.audio_url ?? meta.referenceAudioUrl ?? meta.reference_audio_url ?? null,
    ipaText: meta.ipaText ?? meta.ipa_text ?? meta.phoneticTranscriptionIpa ?? meta.phonetic_transcription_ipa ?? null,
    imageUrl: meta.imageUrl ?? null,
    hint: meta.hint || null,
    timeLimit: meta.timeLimit ?? meta.time_limit ?? meta.timeLimitSeconds ?? null,
    region: ch.region ?? meta.region ?? null,
  }
}



// ─── Skill type badge info ───────────────────────────────────────────────────


// ─── Sub-components ──────────────────────────────────────────────────────────

/** Multiple choice (READING v1, LISTENING, ENTRY_TEST) */
function MCOptions({ options, correct, answered, selected, onSelect }: {
  options: string[]; correct: string; answered: boolean; selected: string | null; onSelect: (o: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {options.map((opt, i) => {
        const isRight = answered && opt === correct
        const isWrong = answered && opt === selected && opt !== correct
        const isSelected = selected === opt && !answered

        return (
          <motion.button
            key={i}
            whileHover={answered ? {} : { y: -2 }}
            whileTap={{ scale: answered ? 1 : 0.98 }}
            onClick={() => onSelect(opt)}
            className={clsx(
              'w-full text-left px-6 py-4 rounded-3xl border-[3.5px] font-black text-lg transition-all duration-200 min-h-[100px] flex items-center',
              isRight ? 'border-emerald-500 bg-[#E8F5E9] text-emerald-700 shadow-[4px_4px_0_#10B981]'
                : isWrong ? 'border-rose-500 bg-[#FCE8E8] text-rose-600 shadow-[4px_4px_0_#F43F5E]'
                  : isSelected ? 'border-[#49B6E5] bg-[#E1F5FE] text-slate-800 shadow-[6px_6px_0_#1f2937] -translate-y-1'
                    : 'border-slate-900 bg-white text-slate-700 hover:border-[#49B6E5] hover:bg-slate-50 shadow-[4px_4px_0_#1f2937]'
            )}
          >
            <div className="flex items-center gap-4 w-full">
              <div className={clsx(
                "w-10 h-10 rounded-full border-[2.5px] flex items-center justify-center shrink-0 font-doodle text-xl",
                isRight ? "bg-emerald-500 border-emerald-600 text-white"
                  : isWrong ? "bg-rose-500 border-rose-600 text-white"
                    : isSelected ? "bg-[#49B6E5] border-slate-900 text-white"
                      : "bg-white border-slate-900 text-slate-900"
              )}>
                {isRight ? <CheckCircle size={18} strokeWidth={3} />
                  : isWrong ? <XCircle size={18} strokeWidth={3} />
                    : <span>{String.fromCharCode(65 + i)}</span>}
              </div>
              <span className="flex-1 leading-tight">{opt}</span>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}


const DoodleFireworks: React.FC = () => {
  useEffect(() => {
    const canvas = document.getElementById('fireworksCanvas') as HTMLCanvasElement
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    class Particle {
      x: number
      y: number
      vx: number
      vy: number
      alpha: number
      color: string
      decay: number
      gravity: number

      constructor(x: number, y: number, color: string) {
        this.x = x
        this.y = y
        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * 5 + 2
        this.vx = Math.cos(angle) * speed
        this.vy = Math.sin(angle) * speed
        this.alpha = 1
        this.color = color
        this.decay = Math.random() * 0.015 + 0.01
        this.gravity = 0.06
      }

      update() {
        this.vx *= 0.98
        this.vy *= 0.98
        this.vy += this.gravity
        this.x += this.vx
        this.y += this.vy
        this.alpha -= this.decay
      }

      draw(c: CanvasRenderingContext2D) {
        c.save()
        c.globalAlpha = this.alpha
        c.fillStyle = this.color
        c.beginPath()
        c.arc(this.x, this.y, Math.random() * 3 + 2, 0, Math.PI * 2)
        c.fill()
        c.restore()
      }
    }

    class Firework {
      x: number
      y: number
      tx: number
      ty: number
      vx: number
      vy: number
      color: string
      exploded: boolean
      particles: Particle[]

      constructor() {
        this.x = Math.random() * width
        this.y = height
        this.tx = Math.random() * width
        this.ty = Math.random() * (height * 0.5) + height * 0.1
        const angle = Math.atan2(this.ty - this.y, this.tx - this.x)
        const speed = Math.random() * 10 + 10
        this.vx = Math.cos(angle) * speed
        this.vy = Math.sin(angle) * speed
        const colors = ['#49B6E5', '#263D5B', '#16A34A', '#D97706', '#DC2626', '#FFC107', '#E040FB']
        this.color = colors[Math.floor(Math.random() * colors.length)]
        this.exploded = false
        this.particles = []
      }

      update() {
        if (!this.exploded) {
          this.x += this.vx
          this.y += this.vy
          if (this.vy >= 0 || this.y <= this.ty) {
            this.exploded = true
            for (let i = 0; i < 60; i++) {
              this.particles.push(new Particle(this.x, this.y, this.color))
            }
          }
        } else {
          this.particles.forEach(p => p.update())
          this.particles = this.particles.filter(p => p.alpha > 0)
        }
      }

      draw(c: CanvasRenderingContext2D) {
        if (!this.exploded) {
          c.save()
          c.fillStyle = this.color
          c.beginPath()
          c.arc(this.x, this.y, 4, 0, Math.PI * 2)
          c.fill()
          c.restore()
        } else {
          this.particles.forEach(p => p.draw(c))
        }
      }
    }

    let fireworks: Firework[] = []

    const loop = () => {
      ctx.fillStyle = 'rgba(251, 246, 239, 0.2)'
      ctx.fillRect(0, 0, width, height)

      if (Math.random() < 0.05 && fireworks.length < 15) {
        fireworks.push(new Firework())
      }

      fireworks.forEach(fw => {
        fw.update()
        fw.draw(ctx)
      })

      fireworks = fireworks.filter(fw => !fw.exploded || fw.particles.length > 0)
      animationFrameId = requestAnimationFrame(loop)
    }

    loop()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      id="fireworksCanvas"
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  )
}


// ─── Main Component ──────────────────────────────────────────────────────────

const QuizPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>()
  const [searchParams] = useSearchParams()
  const customPathId = searchParams.get('customPathId')
  const navigate = useNavigate()
  const location = useLocation()
  const { updateSessionItem } = useAuth()

  // ── Context from RoadmapPage (via navigation state) ──────────────────────
  const navState = (location.state as any) || {}
  const fromState = {
    fromRoadmap: navState.fromRoadmap ?? false,
    dialectId: navState.dialectId ?? null,
    chapterId: navState.chapterId ?? null,
  }

  const [nextQuizId, setNextQuizId] = useState<string | null>(null)

  const [quiz, setQuiz] = useState<QuizDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [idx, setIdx] = useState(0)        // current question index
  const [selected, setSelected] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [result, setResult] = useState<any | null>(null) // QuizCompleteResponse
  const [saving, setSaving] = useState(false)
  const [writingInput, setWritingInput] = useState('')
  const [wordPicked, setWordPicked] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  // ── Speaking Quiz State ─────────────────────────────────────────────────────
  const recorder = useAudioRecorder()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [ollamaResult, setOllamaResult] = useState<{
    score: number
    isCorrect: boolean
    errorDetail: string
    suggestion: string
    transcription?: string
    wordDetails?: any[]
  } | null>(null)
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null) // null = not decided yet
  const [showFullSuggestion, setShowFullSuggestion] = useState(false)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [explaining, setExplaining] = useState(false)
  const [audioPlays, setAudioPlays] = useState<Record<number, number>>({})
  const [playingTTS, setPlayingTTS] = useState<string | null>(null)


  const playRegionalTTS = async (text: string, voice: string) => {
    setPlayingTTS(voice)
    try {
      const res = await apiClient.post('/ai/tts', { text, voice })
      const data = res?.data || res
      if (data.async) {
        const audio = new Audio(data.async)
        audio.play()
      }
    } catch (err) {
      console.error('[QuizPage] TTS failed:', err)
    } finally {
      setPlayingTTS(null)
    }
  }

  const explainAnswer = async (ch: ParsedChallenge, selected: string) => {
    setExplaining(true)
    try {
      const res = await apiClient.post('/ai/explain-quiz-answer', {
        question: ch.content,
        selectedAnswer: selected,
        correctAnswer: ch.correctAnswer || ch.correctWord || ch.correctWords?.[0] || 'Unknown',
        skillType: ch.skillType || 'READING',
        transcript: ch.transcript || '',
        correctSentence: ch.correctSentence || ''
      })
      const data = res?.data || res
      setExplanation(data.explanation || data.reply)
    } catch (err) {
      console.error('[QuizPage] Failed to get explanation:', err)
      setExplanation(null)
    } finally {
      setExplaining(false)
    }
  }


  // ── Handle Finish ─────────────────────────────────────────────────────────
  const handleFinish = async () => {
    if (!quiz || saving) return
    setSaving(true)

    const total = quiz.challenges.length
    const pct = total > 0 ? Math.round((score / total) * 100) : 0
    const payload = {
      score: pct, // Backend now expects percentage
      correctAnswers: score,
      totalQuestions: total,
      timeTakenSeconds: 0 // Could track this if needed
    }



    try {
      if (customPathId) {
        // Submit to custom path progress endpoint
        await apiClient.post(`/learner/custom-path/quizzes/${quiz.id}/complete`, { score: pct })
        setResult({ score: pct, passed: pct >= quiz.passingScore, starsEarned: pct >= 100 ? 3 : (pct >= 90 ? 2 : (pct >= 80 ? 1 : 0)) })
        setFinished(true)
      } else {
        const res = await apiClient.post(`/users/quizzes/${quiz.id}/complete`, payload)
        const responseBody = res?.data || res
        const actualData = responseBody?.data || responseBody
        setResult(actualData)
        setFinished(true)

        if (typeof updateSessionItem === 'function' && actualData) {
          updateSessionItem({
            totalStars: actualData.newTotalStars,
            totalXp: actualData.newTotalXP,
            totalExperience: actualData.newTotalXP
          })
        }
      }
      // ── Find next quiz in the same chapter ──────────────────────────────
      if (fromState.chapterId) {
        try {
          const qRes = await apiClient.get(`/users/levels/${fromState.chapterId}/quizzes`)
          const allQuizzes: any[] = qRes?.data?.data ?? qRes?.data ?? qRes ?? []
          const sorted = [...allQuizzes].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
          const currentIdx = sorted.findIndex(q => q.id === quiz.id)
          if (currentIdx !== -1 && currentIdx + 1 < sorted.length) {
            setNextQuizId(sorted[currentIdx + 1].id)
          }
        } catch { /* no next quiz — silently ignore */ }
      }
    } catch (err) {
      console.error('[QuizPage] Failed to save result:', err)
      setFinished(true)
    } finally {
      setSaving(false)
    }
  }


  // ── Timer Logic ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (finished || loading || !quiz) return
    const currentCh = quiz.challenges[idx]
    const limit = currentCh?.timeLimit ?? quiz.timeLimitSeconds

    if (limit > 0 && timeLeft === null && !answered) {
      setTimeLeft(limit)
    }


    if (timeLeft !== null && timeLeft > 0 && !answered) {
      const timer = setInterval(() => setTimeLeft(t => (t ? t - 1 : 0)), 1000)
      return () => clearInterval(timer)
    } else if (timeLeft === 0 && !answered) {
      setAnswered(true)
      explainAnswer(ch, 'Người dùng chưa chọn đáp án (Hết thời gian)')
    }
  }, [idx, timeLeft, answered, finished, loading, quiz])


  // ── Reset all game state when navigating to a new quiz ───────────────────
  useEffect(() => {
    setIdx(0)
    setScore(0)
    setSelected(null)
    setAnswered(false)
    setFinished(false)
    setResult(null)
    setWritingInput('')
    setWordPicked(null)
    setTimeLeft(null)
    setOllamaResult(null)
    setNextQuizId(null)
    setSaving(false)
    setConsentGiven(null)
    setExplanation(null)
    setExplaining(false)
  }, [quizId])

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!quizId) return
    setLoading(true)
    Promise.allSettled([
      apiClient.get(`/users/quizzes/${quizId}`),
      apiClient.get(`/users/quizzes/${quizId}/challenges`),
    ]).then(([qr, cr]) => {
      // Extract data from ApiResponse wrapper
      const qResp: any = qr.status === 'fulfilled' ? qr.value : {}
      const qData = qResp?.data || qResp || {}

      const cResp: any = cr.status === 'fulfilled' ? cr.value : {}
      const cData = cResp?.data || cResp || []
      const arr = Array.isArray(cData) ? cData : []

      console.log('[QuizPage] quiz meta:', qData)
      console.log('[QuizPage] raw challenges:', arr)

      const parsed = arr.map(parseChallenge)

      setQuiz({
        id: qData.id ?? quizId,
        name: qData.name ?? qData.title ?? 'Bài kiểm tra',
        passingScore: typeof qData.passingScore === 'number' ? qData.passingScore : 70,
        timeLimitSeconds: typeof qData.timeLimitSeconds === 'number' ? qData.timeLimitSeconds : 0,
        challenges: parsed,
        dialect: qData.dialect,
      })


    }).finally(() => setLoading(false))
  }, [quizId])



  // ── Navigation ────────────────────────────────────────────────────────────
  const goNext = () => {
    // Only clear timing/temporary state initially
    setTimeLeft(null)
    setOllamaResult(null)
    setShowFullSuggestion(false)
    recorder.resetRecording()

    if (idx + 1 >= (quiz?.challenges?.length ?? 0)) {
      // Last question: finish immediately, DON'T clear inputs yet so the UI stays "Correct" while saving
      handleFinish()
    } else {
      // Middle of quiz: clear everything and move to next
      setWritingInput('')
      setWordPicked(null)
      setSelected(null)
      setAnswered(false)
      setExplanation(null)
      setExplaining(false)
      setIdx(i => i + 1)
    }
  }

  const handleExitQuiz = () => {
    if (fromState.fromRoadmap && fromState.dialectId && fromState.chapterId) {
      navigate('/learner/roadmap', {
        state: {
          fromRoadmap: true,
          dialectId: fromState.dialectId,
          chapterId: fromState.chapterId,
        }
      })
    } else {
      navigate(-1)
    }
  }





  // ── WebM to WAV Converter (Fixes missing FFmpeg on Windows Backend) ─────────
  const convertWebmToWav = async (webmBlob: Blob): Promise<Blob> => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const arrayBuffer = await webmBlob.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    const numOfChan = audioBuffer.numberOfChannels
    const length = audioBuffer.length * numOfChan * 2 + 44
    const buffer = new ArrayBuffer(length)
    const view = new DataView(buffer)
    let pos = 0

    const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2 }
    const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4 }

    setUint32(0x46464952) // "RIFF"
    setUint32(length - 8) // file length - 8
    setUint32(0x45564157) // "WAVE"
    setUint32(0x20746d66) // "fmt " chunk
    setUint32(16) // length = 16
    setUint16(1) // PCM (uncompressed)
    setUint16(numOfChan)
    setUint32(audioBuffer.sampleRate)
    setUint32(audioBuffer.sampleRate * 2 * numOfChan) // avg. bytes/sec
    setUint16(numOfChan * 2) // block-align
    setUint16(16) // 16-bit
    setUint32(0x61746164) // "data" - chunk
    setUint32(length - pos - 4) // chunk length

    const channels = []
    for (let i = 0; i < numOfChan; i++) channels.push(audioBuffer.getChannelData(i))

    let offset = 0
    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]))
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0
        view.setInt16(pos, sample, true)
        pos += 2
      }
      offset++
    }
    return new Blob([buffer], { type: "audio/wav" })
  }

  // ── Speaking Quiz (NVIDIA Parakeet + Gemma 4) Logic ───────────────────────
  const evaluateSpeaking = async (blob: Blob, targetText: string) => {
    if (!blob || blob.size < 100) return
    setIsAnalyzing(true)

    try {
      // 1. Chuẩn hoá audio: ưu tiên WAV, nếu convert lỗi thì fallback blob gốc
      let audioForAsr = blob
      let uploadFileName = 'recording.webm'

      try {
        const mime = (blob.type || '').toLowerCase()
        if (mime.includes('wav')) {
          audioForAsr = blob
          uploadFileName = 'recording.wav'
        } else {
          audioForAsr = await convertWebmToWav(blob)
          uploadFileName = 'recording.wav'
        }
      } catch (convertErr) {
        console.warn('[Speaking Quiz] Convert audio failed, fallback original blob:', convertErr)
        audioForAsr = blob
        uploadFileName = 'recording.webm'
      }

      // 2. Call Local ASR Server
      const asrFormData = new FormData()
      asrFormData.append('audio', audioForAsr, uploadFileName)
      asrFormData.append('target', targetText)
      const asrStartTime = performance.now()
      const asrResponse = await fetch(ASR_BASE_URL, {
        method: 'POST',
        body: asrFormData,
      })
      const asrEndTime = performance.now()
      const asrProcessingTimeMs = Math.round(asrEndTime - asrStartTime)

      const asrData = await asrResponse.json()
      // Format mới: { success: true, data: { transcribed, score, word_details, record_id } }
      const apiResult = asrData.success ? asrData.data : null
      if (!apiResult) throw new Error("Server ASR trả về lỗi logic")

      const transcribedText = apiResult.transcribed || ""
      const asrScore = apiResult.score || 0
      const wordDetails = apiResult.word_details || []

      // 3. Call Backend Groq Feedback (kèm metadata cho dataset)
      // Upload audio thẳng lên Cloudinary từ Frontend nếu được phép
      let audioUrl = null
      if (consentGiven && audioForAsr) {
        try {
          const fileType = (audioForAsr.type || '').includes('wav') ? 'audio/wav' : (audioForAsr.type || 'audio/webm')
          const fileExt = fileType.includes('wav') ? 'wav' : 'webm'
          const file = new File([audioForAsr], `attempt_${Date.now()}.${fileExt}`, { type: fileType })
          audioUrl = await uploadToCloudinary(file, 'video')
        } catch (error) {
          console.error("Lỗi upload Cloudinary từ frontend:", error)
        }
      }

      const currentChallenge = quiz?.challenges[idx]
      const feedbackResponse = await apiClient.post('/ai/feedback', {
        transcribedText,
        targetText,
        challengeId: currentChallenge?.id || null,
        dialect: quiz?.dialect || currentChallenge?.region || '',
        audioUrl: audioUrl,
        consentGiven: !!consentGiven,
        asrProcessingTimeMs
      })


      const result = feedbackResponse.data || feedbackResponse
      const replyText = typeof result?.reply === 'string' ? result.reply : ''

      const extractScoreFromText = (text: string): number | null => {
        if (!text) return null
        const patterns = [
          /(?:tổng\s*điểm|chấm\s*điểm|điểm\s*tổng)\s*[:：]?\s*(\d{1,3})\s*\/?\s*100/i,
          /"score"\s*[:：]\s*(\d{1,3})/i,
          /\b(\d{1,3})\s*\/?\s*100\b/
        ]
        for (const p of patterns) {
          const m = text.match(p)
          if (m?.[1]) {
            const v = Number(m[1])
            if (!Number.isNaN(v)) return Math.max(0, Math.min(100, v))
          }
        }
        return null
      }

      // Normalize nhiều format response khác nhau từ backend AI
      const scoreFromText = extractScoreFromText(replyText)
      // Ưu tiên điểm từ model ASR custom vì nó chính xác hơn
      const normalizedScore = asrScore || Number(result?.score ?? result?.overallScore ?? scoreFromText ?? 0)
      const normalizedIsCorrect = typeof result?.isCorrect === 'boolean'
        ? result.isCorrect
        : normalizedScore >= 80

      const normalizedErrorDetail =
        result?.errorDetail ??
        result?.error ??
        result?.analysis ??
        ''

      const normalizedSuggestion =
        result?.suggestion ??
        result?.advice ??
        result?.feedback ??
        result?.reply ??
        ''

      // 4. Update UI
      const safeTranscription = typeof transcribedText === 'string' ? transcribedText : ''
      const safeErrorDetail = typeof normalizedErrorDetail === 'string' ? normalizedErrorDetail : String(normalizedErrorDetail ?? '')
      const safeSuggestion = typeof normalizedSuggestion === 'string' ? normalizedSuggestion : String(normalizedSuggestion ?? '')

      setOllamaResult({
        score: normalizedScore,
        isCorrect: normalizedIsCorrect,
        errorDetail: safeErrorDetail,
        suggestion: safeSuggestion,
        transcription: safeTranscription || "(Không nhận diện được giọng nói)",
        wordDetails: wordDetails // Lưu thêm chi tiết từ
      })

      setAnswered(true)
      if (normalizedIsCorrect) setScore(s => s + 1)

    } catch (err: any) {
      console.error('[Speaking Quiz Support] Failed:', err)
      setOllamaResult({
        score: 0,
        isCorrect: false,
        transcription: "Lỗi hệ thống",
        errorDetail: String(err?.response?.data?.message || err?.message || 'Lỗi hệ thống'),
        suggestion: 'Kiểm tra ASR Server (8000) và Groq API Key ở Backend.'
      })
      setAnswered(true)
    } finally {
      setIsAnalyzing(false)
    }
  }





  // Tiện ích: Đổi tên hàm cũ sang hàm mới trong render
  const evaluateWithOllama = evaluateSpeaking

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-[#fbf6ef]">
      <DoodleLoading message="Đang chuẩn bị thử thách..." />
    </div>
  )

  if (!quiz) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-[#fbf6ef] font-nunito px-6 text-center">
      <div className="w-64 h-64 bg-white border-[2.5px] border-slate-900 rounded-[3rem] flex items-center justify-center shadow-[8px_8px_0_#1f2937] mb-4">
        <AlertTriangle size={80} className="text-rose-400" />
      </div>
      <h3 className="text-2xl font-black text-slate-900 italic">Ối! Lỗi mất rồi</h3>
      <p className="text-slate-500 font-bold mb-4">Không tìm thấy bài kiểm tra mà bạn yêu cầu.</p>
      <button
        onClick={() => navigate(-1)}
        className="px-10 py-4 bg-white border-[2.5px] border-slate-900 rounded-2xl font-black text-slate-900 shadow-[4px_4px_0_#1f2937] active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2"
      >
        <ArrowLeft size={20} strokeWidth={3} /> Quay lại
      </button>
    </div>
  )

  const challenges = quiz.challenges
  const total = challenges.length

  // ── Empty State ───────────────────────────────────────────────────────────
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-[#fbf6ef] font-nunito px-6 text-center">
        <div className="w-64 h-64 bg-white border-[2.5px] border-slate-900 rounded-[3rem] flex items-center justify-center shadow-[8px_8px_0_#1f2937] mb-4 overflow-hidden relative">
          <img src={characterImg} alt="Empty" className="w-full h-full object-cover scale-150 rotate-12 opacity-20" />
          <Info size={80} className="text-slate-300 absolute" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 italic">Trang giấy trắng...</h3>
        <p className="text-slate-500 font-bold mb-4">Bài kiểm tra này hiện chưa có nội dung nào.</p>
        <button
          onClick={handleExitQuiz}
          className="px-10 py-4 bg-white border-[2.5px] border-slate-900 rounded-2xl font-black text-slate-900 shadow-[4px_4px_0_#1f2937] active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2"
        >
          <ArrowLeft size={20} strokeWidth={3} /> Quay lại màn hình chính
        </button>
      </div>
    )
  }

  // ── Finished ──────────────────────────────────────────────────────────────
  if (finished) {
    const pct = result?.score ?? (total > 0 ? Math.round((score / total) * 100) : 0)
    const passed = result?.passed ?? (pct >= quiz.passingScore)
    const stars = result?.starsEarned ?? 0
    const reward = result?.earnedReward

    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen overflow-hidden bg-[#fbf6ef] font-nunito relative">
        <DoodleFireworks />

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className="bg-white rounded-[2rem] border-[3px] border-slate-900 shadow-[8px_8px_0_#1f2937] p-6 max-w-sm w-full text-center relative overflow-hidden z-10 mx-4"
        >
          {/* Status Header (Emoji only, no icon) */}
          <div className="text-6xl mb-2 filter drop-shadow-[2px_2px_0_rgba(0,0,0,0.1)]">
            {passed ? '🏆' : '💪'}
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-1 leading-tight italic font-doodle">
            {passed ? 'Tuyệt đỉnh!' : 'Cố gắng lên!'}
          </h2>

          <p className="text-slate-500 font-bold mb-4 text-sm leading-snug">
            Bạn đã hoàn thành <span className="text-[#49B6E5] underline decoration-[2px] decoration-slate-900 underline-offset-2">{quiz.name}</span>
          </p>

          {/* Stars System (Emojis only, no lucide icon) */}
          <div className="flex justify-center gap-3 mb-4">
            {[1, 2, 3].map(s => (
              <motion.div
                key={s}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 + s * 0.1, type: 'spring', bounce: 0.5 }}
                className="text-4xl filter drop-shadow-[2px_2px_0_#1f2937]"
              >
                {s <= stars ? '⭐' : '⚫'}
              </motion.div>
            ))}
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={clsx(
              "rounded-2xl p-3 border-[2px] border-slate-900 shadow-[3px_3px_0_#1f2937]",
              passed ? "bg-emerald-50" : "bg-rose-50"
            )}>
              <p className="text-[10px] uppercase font-black tracking-wider mb-0.5 opacity-50 text-slate-700">Chính xác</p>
              <p className="text-xl font-black text-slate-900 italic">{score}<span className="text-xs opacity-30 not-italic">/{total}</span></p>
            </div>
            <div className="rounded-2xl p-3 border-[2px] border-slate-900 bg-indigo-50 shadow-[3px_3px_0_#1f2937]">
              <p className="text-[10px] uppercase font-black tracking-wider mb-0.5 opacity-50 text-indigo-600">Tỷ lệ</p>
              <p className="text-xl font-black text-slate-900 italic">{pct}<span className="text-sm opacity-40">%</span></p>
            </div>
          </div>

          {/* Achievement Area (Compact, no icon) */}
          {(reward || result?.rewardAlreadyEarned) && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mb-4 text-left"
            >
              <div className="bg-amber-50 border-[2px] border-slate-900 rounded-2xl p-3 shadow-[3px_3px_0_#1f2937] flex items-center gap-3">
                <div className="w-12 h-12 bg-white border-[1.5px] border-slate-900 rounded-xl flex items-center justify-center p-1.5 shadow-[2px_2px_0_#1f2937] shrink-0 text-2xl">
                  🎁
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-wider text-amber-600 leading-none mb-1">
                    {result?.rewardAlreadyEarned ? 'Thành tựu đã nhận' : 'Thành tựu mới!'}
                  </p>
                  <p className="font-black text-slate-900 text-sm leading-tight truncate">{reward?.name || 'Huy chương'}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Result Actions */}
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExitQuiz}
                className="h-12 rounded-xl border-[2px] border-slate-900 bg-white font-black text-slate-900 text-sm transition-all hover:bg-slate-50 active:translate-y-0.5 shadow-[3px_3px_0_#1f2937] flex items-center justify-center"
              >
                Thoát
              </button>
              <button
                onClick={() => {
                  setIdx(0); setScore(0); setSelected(null); setAnswered(false);
                  setFinished(false); setWritingInput(''); setWordPicked(null);
                  setResult(null); setTimeLeft(null); setNextQuizId(null);
                }}
                className="h-12 rounded-xl border-[2px] border-slate-900 bg-slate-100 font-black text-slate-900 text-sm transition-all hover:bg-slate-200 active:translate-y-0.5 shadow-[3px_3px_0_#1f2937] flex items-center justify-center"
              >
                Chơi lại
              </button>
            </div>
            {nextQuizId && (
              <button
                onClick={() => navigate(`/learner/quiz/${nextQuizId}`, {
                  state: {
                    fromRoadmap: fromState.fromRoadmap,
                    dialectId: fromState.dialectId,
                    chapterId: fromState.chapterId,
                  }
                })}
                className="h-12 rounded-xl border-[2px] border-slate-900 bg-[#49B6E5] font-black text-white text-base transition-all hover:translate-y-[-1px] active:translate-y-0.5 shadow-[3px_3px_0_#1f2937] flex items-center justify-center py-2"
              >
                Tiếp tục hành trình
              </button>
            )}
          </div>
        </motion.div>
      </div>
    )
  }


  // ── Current question ──────────────────────────────────────────────────────
  const ch = challenges[idx]
  const isCurrentAnswerCorrect = (() => {
    if (!answered) return false
    if (!ch) return false
    if (ch.mode === 'MULTIPLE_CHOICE') {
      return selected === ch.correctAnswer
    }
    if (ch.mode === 'FIND_WRONG_WORD') {
      return wordPicked === ch.errorIndex
    }
    if (ch.mode === 'WRITING_FILL') {
      return ch.correctWords.some(w => w.toLowerCase().replace(/[.,!?;:]/g, '') === writingInput.trim().toLowerCase().replace(/[.,!?;:]/g, ''))
    }
    if (ch.mode === 'SPEAKING_READ') {
      return ollamaResult?.isCorrect ?? false
    }
    return false
  })()

  // ── Render interaction by mode ────────────────────────────────────────────
  const renderInteraction = () => {
    switch (ch.mode) {

      // ═══════════════ MULTIPLE CHOICE ═══════════════════════════════════════
      case 'MULTIPLE_CHOICE': {
        const handleSelect = (opt: string) => {
          if (answered) return
          if ((ch.audioUrl || ch.transcript) && (audioPlays[idx] || 0) === 0) {
            message.warning('Bạn cần nghe âm thanh trước khi chọn đáp án!')
            return
          }
          setSelected(opt); setAnswered(true)
          if (opt === ch.correctAnswer) setScore(s => s + 1)
          explainAnswer(ch, opt)
        }
        return (
          <>
            <MCOptions options={ch.options} correct={ch.correctAnswer} answered={answered} selected={selected} onSelect={handleSelect} />
          </>
        )
      }

      // ═══════════════ FIND WRONG WORD ═══════════════════════════════════════
      case 'FIND_WRONG_WORD': {
        const handleWordClick = (wordIdx: number) => {
          if (answered) return
          if ((ch.audioUrl || ch.transcript) && (audioPlays[idx] || 0) === 0) {
            message.warning('Bạn cần nghe âm thanh trước khi chọn đáp án!')
            return
          }
          setWordPicked(wordIdx); setAnswered(true)
          if (wordIdx === ch.errorIndex) setScore(s => s + 1)
        }
        return (
          <div className="bg-white border-[3.5px] border-slate-900 rounded-[2rem] p-8 shadow-[6px_6px_0_#1f2937]">
            <p className="text-sm text-slate-400 font-black uppercase tracking-widest mb-6 flex items-center gap-2">
              <MousePointer2 size={16} /> Chạm vào từ viết SAI:
            </p>
            <div className="flex flex-wrap gap-4">
              {ch.words.map((w, i) => {
                const isError = answered && i === ch.errorIndex
                const isPickedWrong = answered && i === wordPicked && i !== ch.errorIndex
                const isPicked = wordPicked === i && !answered

                return (
                  <motion.button
                    key={i}
                    whileHover={answered ? {} : { y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleWordClick(i)}
                    className={clsx(
                      'px-6 py-4 rounded-2xl text-2xl font-black transition-all border-[3.5px]',
                      isError ? 'border-emerald-500 bg-emerald-50 text-emerald-700 line-through decoration-[4px]'
                        : isPickedWrong ? 'border-rose-500 bg-rose-50 text-rose-600'
                          : isPicked ? 'border-[#49B6E5] bg-[#E1F5FE] text-slate-900'
                            : 'border-slate-300 bg-white text-slate-800 hover:border-slate-900'
                    )}>
                    {w}
                  </motion.button>
                )
              })}
            </div>
          </div>
        )
      }

      // ═══════════════ WRITING (fill in blank) ═══════════════════════════════
      case 'WRITING_FILL': {
        const handleWritingSubmit = () => {
          if (!writingInput.trim()) return
          if ((ch.audioUrl || ch.transcript) && (audioPlays[idx] || 0) === 0) {
            message.warning('Bạn cần nghe âm thanh trước khi trả lời!')
            return
          }
          setAnswered(true)
          const isCorrect = ch.correctWords.some(w => w.toLowerCase().replace(/[.,!?;:]/g, '') === writingInput.trim().toLowerCase().replace(/[.,!?;:]/g, ''))
          if (isCorrect) setScore(s => s + 1)
          explainAnswer(ch, writingInput.trim())
        }
        const isCorrect = answered && ch.correctWords.some(w => w.toLowerCase().replace(/[.,!?;:]/g, '') === writingInput.trim().toLowerCase().replace(/[.,!?;:]/g, ''))

        return (
          <div className="space-y-6">
            {(ch.blankSentence || ch.sentence) && (
              <div className="bg-white border-[3.5px] border-slate-900 rounded-[2rem] p-10 text-center shadow-[6px_6px_0_#1f2937]">
                <p className="text-slate-900 font-black text-3xl leading-relaxed font-doodle italic">
                  "
                  {ch.blankSentence ? ch.blankSentence.split('_').map((part, i, arr) => (
                    <React.Fragment key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <span className={clsx(
                          "inline-block border-b-[4px] min-w-[150px] px-3 mx-2 transition-all rounded-t-2xl",
                          answered
                            ? (isCorrect ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 'border-rose-500 text-rose-500 bg-rose-50')
                            : 'border-[#49B6E5] text-[#49B6E5] bg-[#E1F5FE]'
                        )}>
                          {answered ? (isCorrect ? writingInput : `${writingInput} (Đúng: ${ch.correctWords.join(' / ')})`) : (writingInput || '...')}
                        </span>
                      )}
                    </React.Fragment>
                  )) : ch.sentence}
                  "
                </p>
              </div>
            )}

            <div className="relative group flex gap-4">
              <Input
                placeholder="Viết đáp án của bạn vào đây..."
                size="large"
                value={writingInput}
                onChange={e => setWritingInput(e.target.value)}
                disabled={answered}
                className="rounded-[1.5rem] text-2xl h-20 px-8 border-[3.5px] border-slate-900 focus:border-[#49B6E5] shadow-[4px_4px_0_#1f2937] font-black italic bg-white flex-1"
                onPressEnter={handleWritingSubmit}
                autoFocus
              />
              {!answered && (
                <button
                  disabled={!writingInput.trim()}
                  onClick={handleWritingSubmit}
                  className="px-10 h-20 bg-[#49B6E5] border-[3.5px] border-slate-900 rounded-[1.5rem] text-white text-xl font-black shadow-[4px_4px_0_#1f2937] hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 disabled:grayscale"
                >
                  KIỂM TRA
                </button>
              )}
            </div>
          </div>
        )
      }


      // ═══════════════ SPEAKING ══════════════════════════════════════════════
      case 'SPEAKING_READ': {
        const speakText = ch.transcript || ch.content
        const { isRecording, durationSeconds } = recorder

        return (
          <div className="space-y-10 mb-8">
            {/* Target Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-[#49B6E5] border-[2.5px] border-slate-900 rounded-[2.5rem] p-10 text-center shadow-[10px_10px_0_#1f2937] relative overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 opacity-10">
                <Mic size={200} />
              </div>
              <p className="text-white/60 font-black uppercase tracking-[0.2em] text-xs mb-4">Luyện nói mẫu</p>
              <h3 className="text-white font-black text-4xl mb-6 leading-tight italic">"{speakText}"</h3>

              <div className="flex justify-center flex-wrap gap-3">
                {ch.ipaText && (
                  <span className="px-5 py-2 bg-white/20 border-white/30 border rounded-full text-white font-black text-sm backdrop-blur-sm">
                    /{ch.ipaText}/
                  </span>
                )}
                {ch.audioUrl && (
                  <button
                    className="w-12 h-12 flex items-center justify-center bg-white border-[2px] border-slate-900 rounded-[1.2rem] text-slate-900 shadow-[4px_4px_0_#1f2937] hover:-translate-y-0.5 active:translate-y-0 transition-all font-black"
                    onClick={() => { try { new Audio(ch.audioUrl!).play() } catch (_) { } }}
                  >
                    <Volume2 size={24} strokeWidth={3} />
                  </button>
                )}
              </div>
            </motion.div>

            {/* Interaction Area */}
            <div className="flex flex-col items-center gap-8">

              {/* Consent Banner */}
              {consentGiven === null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="w-full bg-white border-[2.5px] border-slate-900 rounded-[2rem] p-6 shadow-[5px_5px_0_#1f2937]"
                >
                  <div className="flex gap-4 items-start mb-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                      <Mic size={24} strokeWidth={3} />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-lg italic tracking-tight">Quyền ghi âm</p>
                      <p className="text-slate-500 text-sm font-bold leading-relaxed">Chúng tôi sử dụng đoạn âm thanh của bạn để cải thiện AI. Dữ liệu hoàn toàn bảo mật.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setConsentGiven(true)} className="bg-slate-900 text-white font-black py-4 rounded-xl border-[2px] border-slate-900 shadow-[3px_3px_0_#49B6E5] active:translate-y-0.5 active:shadow-none transition-all">Đồng ý</button>
                    <button onClick={() => setConsentGiven(false)} className="bg-white text-slate-900 font-black py-4 rounded-xl border-[2px] border-slate-900 shadow-[3px_3px_0_#1f2937] active:translate-y-0.5 active:shadow-none transition-all">Để sau</button>
                  </div>
                </motion.div>
              )}

              {consentGiven !== null && !answered && !isAnalyzing && (
                <div className="flex flex-col items-center gap-6">
                  <p className="text-slate-400 font-black uppercase tracking-[0.1em] text-[10px] italic animate-pulse">
                    {isRecording ? '🔴 Đang lắng nghe...' : 'Giữ nút bên dưới để nói'}
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onMouseDown={recorder.startRecording}
                    onMouseUp={async () => {
                      const blob = await recorder.stopRecording()
                      if (blob) evaluateWithOllama(blob, speakText)
                    }}
                    onMouseLeave={() => { if (isRecording) recorder.stopRecording() }}
                    onTouchStart={recorder.startRecording}
                    onTouchEnd={async () => {
                      const blob = await recorder.stopRecording()
                      if (blob) evaluateWithOllama(blob, speakText)
                    }}
                    className={clsx(
                      "w-32 h-32 rounded-[2.5rem] border-[3px] flex flex-col items-center justify-center shadow-[8px_8px_0_#1f2937] transition-all relative",
                      isRecording ? 'bg-rose-500 border-slate-900 text-white' : 'bg-white border-slate-900 text-[#49B6E5]'
                    )}
                  >
                    {isRecording && (
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="absolute inset-0 bg-rose-400 rounded-[2.5rem] -z-10"
                      />
                    )}
                    <Mic size={40} strokeWidth={3} />
                    <span className="text-[10px] font-black uppercase mt-2 italic">
                      {isRecording ? `${durationSeconds}s` : 'GIỮ ĐỂ NÓI'}
                    </span>
                  </motion.button>
                </div>
              )}

              {isAnalyzing && (
                <div className="py-10">
                  <DoodleLoading message="AI đang chấm điểm..." />
                </div>
              )}

              {answered && ollamaResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="w-full bg-white border-[2.5px] border-slate-900 rounded-[2.5rem] p-8 shadow-[10px_10px_0_#1f2937] overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className={clsx(
                        "w-16 h-16 rounded-2xl border-[2px] border-slate-900 flex items-center justify-center text-white",
                        ollamaResult.isCorrect ? "bg-emerald-500" : "bg-rose-500"
                      )}>
                        {ollamaResult.isCorrect ? <CheckCircle size={32} strokeWidth={3} /> : <XCircle size={32} strokeWidth={3} />}
                      </div>
                      <div>
                        <h4 className="font-black text-2xl text-slate-900 italic tracking-tight">Kết quả AI</h4>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1 italic">Chấm điểm tự động</p>
                      </div>
                    </div>
                    <div className="bg-slate-900 text-white px-5 py-2 rounded-2xl border-[2px] border-slate-900 shadow-[4px_4px_0_#49B6E5]">
                      <span className="text-4xl font-black italic">{ollamaResult.score}</span>
                      <span className="text-xs opacity-50 font-bold ml-1">/100</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {ollamaResult.transcription && (
                      <div className="bg-slate-50 border-[2px] border-slate-200 rounded-2xl p-5">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 italic">Văn bản nhận diện:</p>
                        <p className="text-slate-800 font-black text-2xl italic leading-tight">
                          "{String(ollamaResult.transcription).replace(/[.。！？!?.]+$/g, '')}"
                        </p>
                      </div>
                    )}

                    {ollamaResult.wordDetails && ollamaResult.wordDetails.length > 0 && (
                      <div className="flex flex-wrap gap-x-4 gap-y-3">
                        {ollamaResult.wordDetails.map((item: any, i: number) => {
                          const isWrong = item.status === 'wrong';
                          const textColor = item.status === 'correct' ? 'text-emerald-500' :
                            item.status === 'near' ? 'text-amber-500' :
                              'text-rose-500';
                          return (
                            <span key={i} className={clsx("font-black text-2xl italic", textColor, isWrong && "underline decoration-[3.5px] decoration-slate-900 underline-offset-8")}>
                              {item.word}
                            </span>
                          )
                        })}
                      </div>
                    )}

                    <div className="bg-[#49B6E5]/10 border-[2px] border-[#49B6E5]/20 rounded-2xl p-5 flex gap-4">
                      <Lightbulb className="text-[#49B6E5] shrink-0" size={24} strokeWidth={3} />
                      <div className="min-w-0">
                        <p className="text-[10px] text-[#49B6E5] font-black uppercase tracking-widest mb-1 italic">Lời khuyên từ AI</p>
                        <div className="text-slate-700 font-bold leading-relaxed text-sm whitespace-pre-wrap">
                          {(() => {
                            const sugg = String(ollamaResult.suggestion);
                            const shouldCollapse = sugg.length > 200;
                            return (
                              <>
                                <p>{shouldCollapse && !showFullSuggestion ? `${sugg.slice(0, 200)}...` : sugg}</p>
                                {shouldCollapse && (
                                  <button onClick={() => setShowFullSuggestion(!showFullSuggestion)} className="mt-2 text-[#49B6E5] uppercase text-[10px] font-black hover:underline underline-offset-2 tracking-widest">
                                    {showFullSuggestion ? 'Thu gọn' : 'Xem thêm'}
                                  </button>
                                )}
                              </>
                            )
                          })()}
                        </div>
                      </div>
                    </div>

                    {!ollamaResult.isCorrect && (
                      <button
                        onClick={() => { setAnswered(false); setOllamaResult(null); setShowFullSuggestion(false); }}
                        className="w-full h-14 bg-white border-[2.5px] border-slate-900 rounded-2xl font-black text-slate-900 shadow-[4px_4px_0_#1f2937] hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                      >
                        <RotateCcw size={20} strokeWidth={3} /> Thử lại
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )
      }


      // ═══════════════ GENERIC FALLBACK ══════════════════════════════════════
      default:
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 text-yellow-700 text-sm">
            <p className="font-semibold">Câu hỏi dạng mở</p>
            {ch.hint && <p className="mt-1 text-gray-600">💡 Gợi ý: {ch.hint}</p>}
          </div>
        )
    }
  }

  return (
    <div className="h-screen w-screen bg-[#FDF5E6] font-nunito overflow-hidden flex flex-col p-6 gap-6 relative">
      <style>{PAGE_STYLES}</style>

      {/* ─── Top Header ─── */}
      <div className="flex items-center gap-6 h-20 shrink-0">
        {/* Floating Exit Button moved to top-left */}
        <button
          onClick={handleExitQuiz}
          className="w-14 h-14 rounded-2xl border-[3.5px] border-slate-900 bg-white flex items-center justify-center hover:bg-slate-50 active:translate-y-0.5 shadow-[4px_4px_0_#1f2937] transition-all z-50 shrink-0"
        >
          <ArrowLeft className="text-slate-900" size={24} strokeWidth={3} />
        </button>

        {/* Question Number */}
        <div className="w-20 h-20 bg-[#F43F5E] border-[3.5px] border-slate-900 rounded-[1.5rem] flex items-center justify-center shadow-[6px_6px_0_#1f2937] shrink-0">
          <span className="text-4xl font-black text-white font-doodle italic">{idx + 1}</span>
        </div>

        {/* Progress Bar */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-black text-slate-900 uppercase tracking-widest opacity-50">TIẾN TRÌNH</span>
            <span className="text-xs font-black text-slate-900 uppercase tracking-widest opacity-50">{Math.round(((idx) / total) * 100)}%</span>
          </div>
          <div className="h-4 bg-white border-[3.5px] border-slate-900 rounded-full overflow-hidden p-0.5 shadow-[4px_4px_0_#1f2937]">
            <motion.div
              className="h-full bg-slate-900 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(2, ((idx) / total) * 100)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* ─── Main Content Grid ─── */}
      <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">

        {/* Left Side: Question & Answers */}
        <div className="col-span-8 flex flex-col gap-6 min-h-0">

          {/* Question Card */}
          <div className="bg-white border-[4px] border-slate-900 rounded-[2.5rem] p-10 shadow-[inner_0_4px_12px_rgba(0,0,0,0.05),8px_8px_0_#1f2937] relative flex flex-col justify-center min-h-[300px]">
            <div className="absolute -top-6 -left-4 bg-[#FFC107] border-[3.5px] border-slate-900 px-6 py-2 rounded-2xl shadow-[4px_4px_0_#1f2937] rotate-[-2deg]">
              <span className="text-lg font-black text-slate-900 uppercase tracking-widest font-doodle">CÂU HỎI</span>
            </div>

            <div className="flex flex-col gap-6 items-center text-center">
              <h4 className="text-4xl font-black text-slate-900 leading-snug font-doodle max-w-2xl">
                {ch.content}
              </h4>

              {/* Prominent Audio Button inside the card */}
              {(ch.audioUrl || ch.transcript) && (
                <div className="absolute bottom-4 right-4 flex flex-col items-center gap-2">
                  <button
                    disabled={answered || (audioPlays[idx] || 0) >= 2 || playingTTS === 'banmai'}
                    onClick={async () => {
                      try {
                        const plays = audioPlays[idx] || 0;
                        if (plays < 2) {
                          if (ch.audioUrl) {
                            new Audio(ch.audioUrl).play();
                          } else if (ch.transcript) {
                            await playRegionalTTS(ch.transcript, 'banmai');
                          }
                          setAudioPlays(prev => ({ ...prev, [idx]: plays + 1 }));
                        }
                      } catch (_) { }
                    }}
                    className={clsx(
                      "w-16 h-16 bg-white border-[3px] border-slate-900 rounded-2xl shadow-[4px_4px_0_#1f2937] flex items-center justify-center hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all group relative",
                      (answered || (audioPlays[idx] || 0) >= 2) ? "opacity-50 grayscale cursor-not-allowed shadow-none" : "",
                      playingTTS === 'banmai' ? "animate-pulse" : ""
                    )}
                  >
                    <Volume2 className={clsx("text-slate-900 group-hover:scale-110 transition-transform", playingTTS === 'banmai' ? "animate-spin" : "")} size={28} />
                    {(audioPlays[idx] || 0) > 0 && (
                      <div className="absolute -top-2 -right-2 bg-[#F43F5E] border-[2px] border-slate-900 w-6 h-6 rounded-full flex items-center justify-center text-white font-black text-[10px] shadow-[1px_1px_0_#000]">
                        {audioPlays[idx]}
                      </div>
                    )}
                  </button>
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border-[1.5px] border-slate-200 shadow-sm">
                    {playingTTS === 'banmai' ? "đang phát..." : `nghe âm thanh (${audioPlays[idx] || 0}/2)`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Interaction Area - No scroll as requested */}
          <div className="flex-1 min-h-0 no-scrollbar pb-4">
            {renderInteraction()}
          </div>

          {/* Action Button Area removed from here */}
          <div className="h-6 shrink-0" />

        </div>

        {/* Right Side: Feedback & Character */}
        <div className="col-span-4 flex flex-col gap-6 min-h-0 relative">

          {/* Feedback Speech Bubble */}
          <div className="flex-1 min-h-0 flex flex-col justify-end">
            <AnimatePresence mode="wait">
              <motion.div
                key={idx + (answered ? '_ans' : '')}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white border-[4px] border-slate-900 rounded-[2.5rem] p-8 shadow-[8px_8px_0_#1f2937] relative flex flex-col min-h-[150px] mb-12"
              >
                {/* Tip/Info Icon */}
                <div className="absolute -top-5 -right-5 w-12 h-12 bg-[#F43F5E] border-[3.5px] border-slate-900 rounded-full flex items-center justify-center shadow-[4px_4px_0_#1f2937]">
                  <Lightbulb size={24} className="text-white" />
                </div>

                <div className="overflow-y-auto no-scrollbar font-bold text-lg text-slate-800 leading-relaxed italic pr-2">
                  {explaining ? (
                    <div className="flex flex-col items-center gap-4 py-4">
                      <DoodleLoading message="Đang suy nghĩ..." />
                    </div>
                  ) : answered ? (
                    <div className="flex flex-col gap-6">
                      <TypedText text={explanation || (isCurrentAnswerCorrect ? "Đáp án chính xác! Tiếp tục phát huy nhé." : "Rất tiếc, câu trả lời chưa chính xác. Hãy cố gắng ở các câu sau nhé!")} />

                      {/* Regional TTS moved INSIDE the bubble */}
                      {!explaining && (
                        <div className="mt-2 border-t-[3px] border-slate-100 pt-6 flex flex-col gap-3">
                          <p className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">
                            Bạn muốn nghe giọng vùng miền khác?
                          </p>
                          <div className="flex gap-3">
                            {['banmai', 'myan', 'linhsan'].map((voice, i) => (
                              <button
                                key={voice}
                                onClick={() => playRegionalTTS(ch.correctSentence || ch.content, voice)}
                                className={clsx(
                                  "px-5 py-3 bg-white border-[3.5px] border-slate-900 rounded-xl shadow-[4px_4px_0_#1f2937] text-xs font-black transition-all hover:-translate-y-1 active:translate-y-0",
                                  playingTTS === voice ? "bg-[#FFC107]" : "hover:bg-slate-50"
                                )}
                              >
                                {['BẮC', 'TRUNG', 'NAM'][i]}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p>{ch.hint || "Hãy tập trung nhé! Bạn có thể nghe lại âm thanh nếu cần thiết."}</p>
                  )}
                </div>

                {/* Bubble Tail */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-white border-b-[4px] border-r-[4px] border-slate-900 rotate-45" />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Action Button & Character Area */}
          <div className="h-1/3 flex items-end justify-between gap-6 pb-6 pr-4">
            <div className="flex-1 min-h-0 mb-4">
              <AnimatePresence>
                {answered && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="w-full"
                  >
                    <button
                      onClick={goNext}
                      className="w-full h-20 py-4 rounded-[2rem] bg-emerald-500 border-[4px] border-slate-900 text-white text-xl font-black shadow-[6px_6px_0_#065f46] hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all flex items-center justify-center gap-2 font-doodle"
                    >
                      {idx + 1 >= total ? (
                        <>Hoàn thành <Trophy size={24} strokeWidth={3} /></>
                      ) : (
                        <>Tiếp theo <ArrowRight size={24} strokeWidth={3} /></>
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="relative shrink-0"
            >
              <img src={characterImg} alt="Character" className="h-[28vh] object-contain drop-shadow-xl" />
            </motion.div>
          </div>

        </div>

      </div>




      {/* Timer Overlays */}
      {timeLeft !== null && !answered && (
        <div className="absolute top-1/2 left-6 -translate-y-1/2 flex flex-col items-center gap-2">
          <motion.div
            animate={(timeLeft ?? 0) < 10 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 0.5 }}
            className={clsx(
              "w-20 h-20 rounded-full border-[3.5px] flex items-center justify-center shadow-[6px_6px_0_#1f2937] text-3xl font-black italic",
              (timeLeft ?? 0) < 10 ? "bg-[#F43F5E] text-white border-slate-900" : "bg-[#49B6E5] text-white border-slate-900"
            )}
          >
            {timeLeft}
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default QuizPage
