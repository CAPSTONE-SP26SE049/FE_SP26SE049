import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  SoundFilled,
  EditOutlined,
  AudioOutlined,
  ReadOutlined,
  ThunderboltFilled,
  LoadingOutlined,
  ReloadOutlined,
  StarFilled,
} from '@ant-design/icons'
import { Spin, Button, Tag, Empty, Input } from 'antd'

import apiClient from '../../../services/apiClient'
import { useAuth } from '../../../core/auth/AuthContext'
import { useAudioRecorder } from '../../../hooks/useAudioRecorder'





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
  // Common
  audioUrl: string | null
  ipaText: string | null
  imageUrl: string | null
  hint: string | null
  timeLimit: number | null     // time for THIS question
}

interface QuizDetail {
  id: string
  name: string
  passingScore: number
  timeLimitSeconds: number     // TOTAL time for quiz
  challenges: ParsedChallenge[]
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
  } else if (skillType === 'WRITING' || hasWriting) {
    mode = 'WRITING_FILL'
  } else if (hasOptions) {
    mode = 'MULTIPLE_CHOICE'
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
    // Common
    audioUrl: meta.audioUrl ?? meta.audio_url ?? meta.referenceAudioUrl ?? meta.reference_audio_url ?? null,
    ipaText: meta.ipaText ?? meta.ipa_text ?? meta.phoneticTranscriptionIpa ?? meta.phonetic_transcription_ipa ?? null,
    imageUrl: meta.imageUrl ?? null,
    hint: meta.hint || null,
    timeLimit: meta.timeLimit ?? meta.time_limit ?? meta.timeLimitSeconds ?? null,
  }
}



// ─── Skill type badge info ───────────────────────────────────────────────────

const SKILL_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  LISTENING: { label: 'Nghe hiểu', color: 'blue', icon: <SoundFilled /> },
  SPEAKING: { label: 'Nói', color: 'purple', icon: <AudioOutlined /> },
  READING: { label: 'Đọc hiểu', color: 'orange', icon: <ReadOutlined /> },
  WRITING: { label: 'Viết', color: 'cyan', icon: <EditOutlined /> },
  ENTRY_TEST: { label: 'Kiểm tra đầu vào', color: 'gold', icon: <ThunderboltFilled /> },
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Multiple choice (READING v1, LISTENING, ENTRY_TEST) */
function MCOptions({ options, correct, answered, selected, onSelect }: {
  options: string[]; correct: string; answered: boolean; selected: string | null; onSelect: (o: string) => void
}) {
  return (
    <div className="grid gap-3 mb-6">
      {options.map((opt, i) => {
        const isRight = answered && opt === correct
        const isWrong = answered && opt === selected && opt !== correct
        return (
          <motion.button key={i} whileTap={{ scale: answered ? 1 : 0.97 }} onClick={() => onSelect(opt)}
            className={[
              'w-full text-left px-5 py-4 rounded-2xl border-2 font-semibold text-base transition-all duration-200',
              isRight ? 'border-green-500 bg-green-50 text-green-700'
                : isWrong ? 'border-red-400 bg-red-50 text-red-600'
                  : selected === opt && !answered ? 'border-purple-500 bg-purple-100 text-purple-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50',
            ].join(' ')}
          >
            <span className="inline-flex items-center gap-3">
              {isRight && <CheckCircleFilled className="text-green-500" />}
              {isWrong && <CloseCircleFilled className="text-red-400" />}
              {opt}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

const QuizPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const { updateSessionItem } = useAuth()


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
  const [showHint, setShowHint] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // ── Speaking Quiz (Gemma 4) State ──────────────────────────────────────────
  const recorder = useAudioRecorder()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [ollamaResult, setOllamaResult] = useState<{
    score: number
    isCorrect: boolean
    errorDetail: string
    suggestion: string
    transcription?: string
  } | null>(null)



  // ── Handle Finish ─────────────────────────────────────────────────────────
  const handleFinish = async () => {
    if (!quiz || saving) return
    setSaving(true)

    const pct = total > 0 ? Math.round((score / total) * 100) : 0
    const payload = {
      score: pct, // Backend now expects percentage
      correctAnswers: score,
      totalQuestions: total,
      timeTakenSeconds: 0 // Could track this if needed
    }

    try {
      const res = await apiClient.post(`/users/quizzes/${quiz.id}/complete`, payload)
      // Extract from ApiResponse
      const data = res?.data || res
      setResult(data)
      setFinished(true)

      // UPDATE GLOBAL STAR & XP COUNT
      if (typeof updateSessionItem === 'function') {
        updateSessionItem({
          totalStars: data.newTotalStars,
          totalXp: data.newTotalXP,
          totalExperience: data.newTotalXP
        })
      }
    } catch (err) {

      console.error('[QuizPage] Failed to save result:', err)
      // Fallback show local result
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
    }
  }, [idx, timeLeft, answered, finished, loading, quiz])


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
      })


    }).finally(() => setLoading(false))
  }, [quizId])

  // ── Auto-play audio for LISTENING ─────────────────────────────────────────
  useEffect(() => {
    if (!quiz) return
    const ch = quiz.challenges?.[idx]
    if (ch?.skillType === 'LISTENING' && ch.audioUrl) {
      try { const a = new Audio(ch.audioUrl); audioRef.current = a; a.play().catch(() => { }) } catch (_) { }
    }
    return () => { audioRef.current?.pause() }
  }, [idx, quiz])

  // ── Navigation ────────────────────────────────────────────────────────────
  const goNext = () => {
    // Only clear timing/temporary state initially
    setTimeLeft(null)
    setShowHint(false)
    setOllamaResult(null)
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
      setIdx(i => i + 1)
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
      // Chuyển đổi sang chuẩn WAV ở trình duyệt để Backend không cần cài ffmpeg
      const wavBlob = await convertWebmToWav(blob)

      // BƯỚC 1: Gửi Audio sang NVIDIA Parakeet (Local ASR Server)
      const formData = new FormData()
      formData.append('file', wavBlob, 'recording.wav')

      const asrResponse = await fetch('http://localhost:8000/asr', {
        method: 'POST',
        body: formData,
      })

      const asrData = await asrResponse.json()
      if (!asrResponse.ok || asrData.error) {
        throw new Error(`Lỗi ASR Server: ${asrData.error || 'Connection failed'}`)
      }

      const rawText = asrData.text || ""
      const transcribedText = typeof rawText === 'object' ? (rawText.text || "") : rawText


      console.log('[ASR Result]:', transcribedText)

      // BƯỚC 2: Gửi Text nhận diện được sang Gemma 4 (Ollama) để lấy Feedback
      const gemmaResponse = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma4:e4b',
          system: `Bạn là chuyên gia ngữ âm học Việt Nam. 
NHIỆM VỤ: So sánh văn bản nhận diện được từ audio (ASR) với đáp án mẫu. 
Mẫu: "${targetText}"
Văn bản ASR nhận diện được: "${transcribedText}"

YẾU TỐ QUAN TRỌNG: 
1. Kiểm tra sự khác biệt, đặc biệt là các cặp âm TR/CH, N/L, S/X, D/GI/R.
2. Nếu văn bản ASR khác mẫu ở các phụ âm đầu này (ví dụ ASR: "Núa", mẫu: "Lúa"), báo lỗi phát âm sai.
3. CHẤM ĐIỂM (0-100) và TRẢ VỀ JSON: { "score": number, "isCorrect": boolean, "errorDetail": "mô tả lỗi dựa trên sự khác biệt", "suggestion": "cách sửa lỗi" }`,
          prompt: `Dựa trên văn bản nhận diện được là "${transcribedText}", hãy đánh giá xem người nói có phát âm đúng mẫu "${targetText}" không?`,
          stream: false,
          format: 'json',
          options: { temperature: 0 }
        })
      })

      if (!gemmaResponse.ok) {
        const errorText = await gemmaResponse.text()
        throw new Error(`Ollama API error: ${errorText}`)
      }
      const gemmaData = await gemmaResponse.json()
      const result = JSON.parse(gemmaData.response)

      // Cập nhật kết quả hiển thị
      setOllamaResult({
        ...result,
        transcription: transcribedText || "(Không nhận diện được giọng nói)"
      })
      setAnswered(true)
      if (result.isCorrect) setScore(s => s + 1)

    } catch (err: any) {
      console.error('[Speaking Quiz Support] Failed:', err)
      setOllamaResult({
        score: 0,
        isCorrect: false,
        transcription: "Lỗi hệ thống",
        errorDetail: err.message || 'Lỗi hệ thống',
        suggestion: 'Mô hình Ollama có thể hết dung lượng RAM. Vui lòng tắt các app nặng hoặc đổi model nhỏ hơn.'
      })
      setAnswered(true)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Tiện ích: Đổi tên hàm cũ sang hàm mới trong render
  const evaluateWithOllama = evaluateSpeaking

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-[#f8f5ff]"><Spin size="large" /></div>
  )
  if (!quiz) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[#f8f5ff]">
      <Empty description="Không tìm thấy bài kiểm tra" />
      <Button onClick={() => navigate('/learner/roadmap')}>Quay lại</Button>
    </div>
  )

  const challenges = quiz.challenges
  const total = challenges.length

  // ── Finished ──────────────────────────────────────────────────────────────
  if (finished || total === 0) {
    const pct = result?.score ?? (total > 0 ? Math.round((score / total) * 100) : 0)
    const passed = result?.passed ?? (pct >= quiz.passingScore)
    const stars = result?.starsEarned ?? 0
    const reward = result?.earnedReward

    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-6 bg-[#f8f5ff]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="bg-white rounded-[2.5rem] shadow-xl p-8 sm:p-10 max-w-md w-full text-center border border-purple-100 relative overflow-hidden"
          style={{ boxShadow: '0 8px 40px rgba(147,51,234,0.1)' }}
        >
          {/* Decorative background blur */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-purple-50 to-transparent pointer-events-none" />

          {/* Header Status Phase */}
          <div className="relative mb-6 mx-auto w-32 h-32 flex items-center justify-center">
            <div className={`absolute inset-0 rounded-full blur-2xl opacity-40 ${passed ? 'bg-yellow-400' : 'bg-orange-400'}`} />
            <div className="text-7xl sm:text-8xl relative z-10 transform hover:scale-110 transition-transform cursor-default">
              {passed ? '🏆' : '💪'}
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-gray-800 mb-2 relative z-10 leading-tight">
            {passed ? 'Tuyệt vời!' : 'Hãy cố gắng thêm!'}
          </h2>

          <p className="text-gray-500 font-semibold mb-8 relative z-10 text-sm">
            Bạn đã hoàn thành <span className="text-purple-600 font-bold">{quiz.name}</span>
          </p>

          {/* Stars Section */}
          <div className="flex justify-center gap-3 md:gap-4 mb-8 relative z-10">
            {[1, 2, 3].map(s => (
              <motion.div
                key={s}
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2 + s * 0.1, type: 'spring', bounce: 0.6 }}
              >
                {s <= stars ? (
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-400 blur-lg opacity-60 rounded-full scale-125" />
                    <StarFilled className="text-5xl sm:text-6xl text-yellow-400 drop-shadow-md relative z-10" />
                  </div>
                ) : (
                  <StarFilled className="text-5xl sm:text-6xl text-gray-100" />
                )}
              </motion.div>
            ))}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 mb-8 relative z-10">
            <div className={`rounded-3xl p-4 border ${passed ? 'bg-green-50/50 border-green-100' : 'bg-orange-50/50 border-orange-100'}`}>
              <p className={`text-[9px] uppercase font-black tracking-widest mb-1 ${passed ? 'text-green-600' : 'text-orange-600'}`}>Chính xác</p>
              <p className="text-2xl font-black text-gray-800">{score} <span className="text-sm font-bold text-gray-400">/ {total}</span></p>
            </div>
            <div className="rounded-3xl p-4 border bg-purple-50/50 border-purple-100">
              <p className="text-[9px] uppercase font-black tracking-widest mb-1 text-purple-600">Tỷ lệ đúng</p>
              <p className="text-2xl font-black text-gray-800">{pct}<span className="text-base text-purple-400 font-bold">%</span></p>
            </div>
          </div>

          {/* Achievement Alert */}
          {reward && (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mb-8 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200 flex items-center gap-4 text-left"
            >

              <div className="w-16 h-16 bg-white rounded-xl shadow-inner flex items-center justify-center p-2 flex-shrink-0">
                <img src={reward.iconUrl} alt={reward.name} className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="text-[10px] text-yellow-600 font-black uppercase tracking-tighter">Thành tựu mới!</p>
                <p className="text-sm font-bold text-gray-800 leading-tight">{reward.name}</p>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              block
              size="large"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/learner/roadmap')}
              className="rounded-xl h-14 font-black border-purple-100 text-gray-600 hover:text-purple-500 hover:border-purple-300 transition-all"
            >
              Thoát
            </Button>
            <Button
              type="primary"
              block
              size="large"
              className="bg-gradient-to-r from-green-500 to-emerald-500 border-none hover:from-green-600 hover:to-emerald-600 rounded-xl h-14 font-black text-white shadow-lg shadow-green-200"
              onClick={() => {
                setIdx(0); setScore(0); setSelected(null); setAnswered(false);
                setFinished(false); setWritingInput(''); setWordPicked(null);
                setResult(null); setTimeLeft(null);
              }}
            >
              Chơi lại
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }


  // ── Current question ──────────────────────────────────────────────────────
  const ch = challenges[idx]
  const skillMeta = SKILL_META[ch.skillType] ?? SKILL_META['READING']

  // ── Render interaction by mode ────────────────────────────────────────────
  const renderInteraction = () => {
    switch (ch.mode) {

      // ═══════════════ MULTIPLE CHOICE ═══════════════════════════════════════
      case 'MULTIPLE_CHOICE': {
        const handleSelect = (opt: string) => {
          if (answered) return
          setSelected(opt); setAnswered(true)
          if (opt === ch.correctAnswer) setScore(s => s + 1)
        }
        return (
          <>
            <MCOptions options={ch.options} correct={ch.correctAnswer} answered={answered} selected={selected} onSelect={handleSelect} />
            {answered && ch.correctAnswer && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2 ${selected === ch.correctAnswer ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                {selected === ch.correctAnswer
                  ? <><CheckCircleFilled /> Chính xác!</>
                  : <><CloseCircleFilled /> Đáp án đúng: &ldquo;{ch.correctAnswer}&rdquo;</>}
              </motion.div>
            )}
          </>
        )
      }

      // ═══════════════ FIND WRONG WORD ═══════════════════════════════════════
      case 'FIND_WRONG_WORD': {
        const handleWordClick = (wordIdx: number) => {
          if (answered) return
          setWordPicked(wordIdx); setAnswered(true)
          if (wordIdx === ch.errorIndex) setScore(s => s + 1)
        }
        return (
          <>
            <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-5 mb-4">
              <p className="text-sm text-purple-600 font-semibold mb-3">👆 Chạm vào từ viết SAI trong câu:</p>
              <div className="flex flex-wrap gap-2">
                {ch.words.map((w, i) => {
                  const isError = answered && i === ch.errorIndex
                  const isPickedWrong = answered && i === wordPicked && i !== ch.errorIndex
                  return (
                    <motion.span key={i} whileTap={{ scale: 0.95 }}
                      onClick={() => handleWordClick(i)}
                      className={[
                        'px-3 py-2 rounded-xl text-base font-semibold cursor-pointer border-2 transition-all',
                        isError ? 'border-green-500 bg-green-100 text-green-800 line-through'
                          : isPickedWrong ? 'border-red-400 bg-red-100 text-red-600'
                            : wordPicked === i && !answered ? 'border-purple-400 bg-purple-100 text-purple-700'
                              : 'border-gray-200 bg-white text-gray-800 hover:border-purple-300',
                      ].join(' ')}>
                      {w}
                    </motion.span>
                  )
                })}
              </div>
            </div>
            {answered && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2 ${wordPicked === ch.errorIndex ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                {wordPicked === ch.errorIndex
                  ? <><CheckCircleFilled /> Chính xác! Từ sai là &ldquo;{ch.words[ch.errorIndex]}&rdquo; → đúng: &ldquo;{ch.correctWord}&rdquo;</>
                  : <><CloseCircleFilled /> Từ sai là &ldquo;{ch.words[ch.errorIndex]}&rdquo; → đúng: &ldquo;{ch.correctWord}&rdquo;</>}
              </motion.div>
            )}
          </>
        )
      }

      // ═══════════════ WRITING (fill in blank) ═══════════════════════════════
      case 'WRITING_FILL': {
        const handleWritingSubmit = () => {
          if (!writingInput.trim()) return
          setAnswered(true)
          const isCorrect = ch.correctWords.some(w => w.toLowerCase().replace(/[.,!?;:]/g, '') === writingInput.trim().toLowerCase().replace(/[.,!?;:]/g, ''))
          if (isCorrect) setScore(s => s + 1)
        }
        const isCorrect = answered && ch.correctWords.some(w => w.toLowerCase().replace(/[.,!?;:]/g, '') === writingInput.trim().toLowerCase().replace(/[.,!?;:]/g, ''))

        return (
          <>
            {(ch.blankSentence || ch.sentence) && (
              <div className="bg-purple-50/50 border border-purple-100 rounded-3xl p-8 mb-6 text-center shadow-sm">
                <p className="text-purple-950 font-bold text-xl leading-relaxed">
                  {ch.blankSentence ? ch.blankSentence.split('_').map((part, i, arr) => (
                    <React.Fragment key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <span className={`inline-block border-b-4 min-w-[80px] px-2 mx-1 transition-all ${answered
                          ? (isCorrect ? 'border-green-500 text-green-600 bg-green-50' : 'border-red-400 text-red-500 bg-red-50')
                          : 'border-purple-400 text-purple-600 bg-purple-100/50'
                          } rounded-t-xl`}>
                          {answered ? (isCorrect ? writingInput : ch.correctWords[0]) : (writingInput || '...')}
                        </span>
                      )}
                    </React.Fragment>
                  )) : ch.sentence}
                </p>
              </div>
            )}

            {ch.distractors.length > 0 && !answered && (
              <div className="flex flex-wrap gap-2 mb-6 justify-center">
                {[...ch.correctWords, ...ch.distractors].sort(() => Math.random() - 0.5).map((w, i) => (
                  <motion.button key={i}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setWritingInput(w)}
                    className={`px-5 py-2.5 rounded-2xl border-2 font-bold text-sm shadow-sm transition-all ${writingInput === w
                      ? 'border-purple-500 bg-purple-500 text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                      }`}>
                    {w}
                  </motion.button>
                ))}
              </div>
            )}

            <div className="mb-8">
              <Input
                placeholder="Nhập đáp án của bạn..."
                size="large"
                value={writingInput}
                onChange={e => setWritingInput(e.target.value)}
                disabled={answered}
                className="rounded-2xl text-lg h-16 px-6 border-2 focus:border-purple-400 shadow-sm"
                onPressEnter={handleWritingSubmit}
                autoFocus
              />
              {answered && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 rounded-2xl px-5 py-4 text-base font-bold flex items-center gap-3 shadow-sm ${isCorrect ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
                    }`}>
                  {isCorrect
                    ? <><CheckCircleFilled className="text-xl" /> Chính xác!</>
                    : <><CloseCircleFilled className="text-xl" /> Đáp án đúng: &ldquo;{ch.correctWords[0]}&rdquo;</>}
                </motion.div>
              )}
            </div>

            {!answered && (
              <Button
                type="primary"
                size="large"
                block
                disabled={!writingInput.trim()}
                className="bg-purple-500 border-purple-500 hover:bg-purple-600 rounded-2xl h-16 text-lg font-black shadow-md mb-6"
                onClick={handleWritingSubmit}
              >
                Gửi đáp án
              </Button>
            )}
          </>
        )
      }


      // ═══════════════ SPEAKING ══════════════════════════════════════════════
      case 'SPEAKING_READ': {
        const speakText = ch.transcript || ch.content
        const { isRecording, durationSeconds } = recorder

        return (
          <>
            {/* ── Target Card ── */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-[2rem] p-8 mb-8 text-center shadow-xl shadow-purple-100 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <AudioOutlined style={{ fontSize: '100px', color: 'white' }} />
              </div>

              <h3 className="text-white/70 text-sm font-bold uppercase tracking-widest mb-2">Phát âm mẫu</h3>
              <p className="text-white font-black text-4xl mb-4 leading-tight">{speakText}</p>

              <div className="flex justify-center gap-4">
                {ch.ipaText && (
                  <span className="px-4 py-1.5 bg-white/20 rounded-full text-white/90 font-mono text-sm backdrop-blur-md">
                    /{ch.ipaText}/
                  </span>
                )}
                {ch.audioUrl && (
                  <button
                    className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-purple-600 hover:scale-110 active:scale-95 transition-all shadow-lg"
                    onClick={() => { try { new Audio(ch.audioUrl!).play() } catch (_) { } }}
                  >
                    <SoundFilled />
                  </button>
                )}
              </div>
            </motion.div>

            {/* ── Interaction Area ── */}
            <div className="flex flex-col items-center gap-6">
              {!answered && !isAnalyzing && (
                <div className="flex flex-col items-center gap-4 w-full">
                  <p className="text-gray-400 font-medium animate-pulse">
                    {isRecording ? '🔴 Đang nghe...' : 'Nhấn và giữ nút bên dưới để nói'}
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
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
                    className={`w-28 h-28 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 relative ${isRecording
                      ? 'bg-red-500 shadow-red-200 ring-8 ring-red-50'
                      : 'bg-white border-4 border-purple-500 text-purple-600'
                      }`}
                  >
                    {isRecording && (
                      <motion.div
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="absolute inset-0 bg-red-400 rounded-full -z-10 opacity-30"
                      />
                    )}
                    <AudioOutlined style={{ fontSize: '32px' }} />
                    <span className="text-[10px] font-black uppercase mt-1">
                      {isRecording ? `${durationSeconds}s` : 'Giữ'}
                    </span>
                  </motion.button>
                </div>
              )}

              {/* Analyzing State */}
              {isAnalyzing && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="relative">
                    <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 48, color: '#a855f7' }} spin />} />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="absolute -inset-4 border-2 border-dashed border-purple-200 rounded-full"
                    />
                  </div>
                  <p className="text-purple-600 font-black text-lg animate-bounce">AI Gemma 4 đang chấm điểm...</p>
                </div>
              )}

              {/* Result Modal-like Card */}
              {answered && ollamaResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full bg-white rounded-3xl p-6 border-2 shadow-xl"
                  style={{ borderColor: ollamaResult.isCorrect ? '#22c55e' : '#f97316' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-2xl ${ollamaResult.isCorrect ? 'bg-green-500' : 'bg-orange-500'
                        }`}>
                        {ollamaResult.isCorrect ? <CheckCircleFilled /> : <CloseCircleFilled />}
                      </div>
                      <div>
                        <h4 className="font-black text-gray-800 leading-none">Kết quả</h4>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">AI Evaluation</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black" style={{ color: ollamaResult.isCorrect ? '#22c55e' : '#f97316' }}>
                        {ollamaResult.score}<span className="text-sm text-gray-300">/100</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {ollamaResult.transcription && (
                      <div className="bg-gray-100 rounded-2xl p-4 border-l-4 border-gray-400">
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Văn bản nhận diện (ASR):</p>
                        <p className="text-gray-800 font-black text-lg italic">"{ollamaResult.transcription}"</p>
                      </div>
                    )}

                    <div className="bg-gray-50 rounded-2xl p-4">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-1">Chi tiết lỗi:</p>
                      <p className="text-gray-700 font-semibold italic">"{ollamaResult.errorDetail}"</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
                      <span className="text-xl">💡</span>
                      <div>
                        <p className="text-xs text-blue-400 font-bold uppercase mb-1">Lời khuyên từ AI:</p>
                        <p className="text-blue-800 text-sm font-bold leading-relaxed">{ollamaResult.suggestion}</p>
                      </div>
                    </div>

                    {!ollamaResult.isCorrect && (
                      <Button
                        block
                        icon={<ReloadOutlined />}
                        onClick={() => { setAnswered(false); setOllamaResult(null); }}
                        className="h-12 rounded-xl border-orange-200 text-orange-600 font-bold hover:border-orange-500"
                      >
                        Thử lại ngay
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </>
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
    <div className="min-h-screen bg-[#f8f5ff] pb-16">
      {/* Gradient accent strip */}
      <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-orange-400 to-amber-400" />

      {/* Header */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-purple-100/50 px-6 py-3 flex items-center gap-4 sticky top-0 z-10"
        style={{ boxShadow: '0 2px 12px rgba(147,51,234,0.06)' }}>
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl border border-purple-100 flex items-center justify-center hover:bg-purple-50 active:scale-95 transition-all">
          <ArrowLeftOutlined className="text-purple-500" />
        </button>
        <div className="flex-1">
          <h2 className="font-black text-gray-800 text-sm truncate">{quiz.name}</h2>
          <p className="text-[10px] text-gray-400 font-bold">Câu {idx + 1} / {total}</p>
        </div>
        <div className="flex items-center gap-2">
          {timeLeft !== null && (
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black border ${timeLeft < 10 ? 'bg-red-50 text-red-500 border-red-200 animate-pulse' : 'bg-blue-50 text-blue-500 border-blue-200'}`}>
              <ThunderboltFilled /> {timeLeft}s
            </div>
          )}
          <div className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-green-50 text-green-600 border border-green-200">
            Đạt: {quiz.passingScore}%
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <motion.div className="h-full bg-gradient-to-r from-purple-500 to-orange-400 transition-all duration-500" style={{ width: `${(idx / total) * 100}%` }} />
      </div>

      {/* Question area */}
      <div className="max-w-2xl mx-auto px-6 pt-10">
        <AnimatePresence mode="wait">
          <motion.div key={idx}
            initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 22 }}>

            {/* Question card */}
            <div className="bg-white rounded-2xl shadow-sm border border-purple-50 p-6 mb-6" style={{ boxShadow: '0 4px 20px rgba(147,51,234,0.06)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Tag color={skillMeta.color} icon={skillMeta.icon}>{skillMeta.label}</Tag>
                <Tag>{ch.mode === 'FIND_WRONG_WORD' ? 'Tìm từ sai' : ch.mode === 'WRITING_FILL' ? 'Điền từ' : ch.mode === 'SPEAKING_READ' ? 'Đọc to' : 'Trắc nghiệm'}</Tag>
                <span className="text-xs text-gray-400 ml-auto">#{idx + 1}</span>
              </div>

              {ch.content && ch.mode !== 'SPEAKING_READ' && (
                <p className="text-gray-800 font-semibold text-lg leading-relaxed mb-3">{ch.content}</p>
              )}
              {ch.hint && (
                <div className="mt-4">
                  {!showHint ? (
                    <Button
                      size="small"
                      type="dashed"
                      icon={<ReadOutlined />}
                      onClick={() => setShowHint(true)}
                      className="text-gray-400 hover:text-blue-500 border-gray-200"
                    >
                      Xem gợi ý
                    </Button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-gray-600 bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-start gap-3"
                    >
                      <span className="text-xl">💡</span>
                      <div className="flex-1">
                        <p className="font-bold text-blue-800 mb-1">Gợi ý:</p>
                        <p>{ch.hint}</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {ch.audioUrl && ch.mode !== 'SPEAKING_READ' && (
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 font-semibold text-sm hover:bg-blue-100 transition-colors mb-2"
                  onClick={() => { try { new Audio(ch.audioUrl!).play() } catch (_) { } }}>
                  <SoundFilled /> Nghe âm thanh
                </button>
              )}
              {ch.imageUrl && <img src={ch.imageUrl} alt="" className="rounded-xl max-h-48 object-contain mb-3" />}
              {!ch.content && !ch.audioUrl && ch.mode !== 'SPEAKING_READ' && (
                <p className="text-gray-400 italic">Câu hỏi {idx + 1}</p>
              )}
            </div>

            {renderInteraction()}

            {/* Next button — show after answering, or for GENERIC immediately */}
            {(answered || ch.mode === 'GENERIC') && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Button type="primary" size="large" block
                  loading={saving}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 border-none hover:from-green-600 hover:to-emerald-600 rounded-xl h-12 text-base font-black shadow-md shadow-green-200"
                  onClick={goNext}>
                  {idx + 1 >= total ? 'Hoàn thành 🎉' : 'Tiếp theo →'}
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default QuizPage
