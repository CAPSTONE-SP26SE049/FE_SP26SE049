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
} from '@ant-design/icons'
import { Spin, Button, Tag, Empty, Input } from 'antd'

import apiClient from '../../../services/apiClient'
import { useAuth } from '../../../core/auth/AuthContext'


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
                  : selected === opt && !answered ? 'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50',
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
  const { session, updateSessionItem } = useAuth()
  const user = session?.user


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
    setWritingInput(''); setWordPicked(null); setTimeLeft(null); setShowHint(false)
    if (idx + 1 >= (quiz?.challenges?.length ?? 0)) {
      handleFinish()
    }
    else { setIdx(i => i + 1); setSelected(null); setAnswered(false) }
  }



  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50"><Spin size="large" /></div>
  )
  if (!quiz) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-50">
      <Empty description="Không tìm thấy bài kiểm tra" />
      <Button onClick={() => navigate(-1)}>Quay lại</Button>
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
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-6 bg-gray-50">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="bg-white rounded-[2.5rem] shadow-2xl p-10 max-w-md w-full text-center border border-gray-100"
        >
          {/* Header Status */}
          <div className="text-7xl mb-6 transform hover:scale-110 transition-transform cursor-default">
            {passed ? '🏆' : '💪'}
          </div>

          <h2 className="text-3xl font-black text-gray-800 mb-2">
            {passed ? 'Tuyệt vời!' : 'Hãy cố gắng thêm!'}
          </h2>

          <p className="text-gray-400 font-medium mb-6">
            Bạn đã hoàn thành {quiz.name}
          </p>

          {/* Stars Section */}
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <motion.span
                key={s}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 + s * 0.1 }}
                className={`text-4xl ${s <= stars ? 'text-yellow-400 drop-shadow-sm' : 'text-gray-200'}`}
              >
                {s <= stars ? '★' : '★'}
              </motion.span>
            ))}
          </div>

          {/* Stats Card */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8 flex justify-around">
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Đúng</p>
              <p className="text-xl font-black text-gray-800">{score}/{total}</p>
            </div>
            <div className="w-px bg-gray-200" />
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Tỷ lệ</p>
              <p className="text-xl font-black text-gray-800">{pct}%</p>
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
              onClick={() => navigate(-1)}
              className="rounded-xl h-14 font-bold border-gray-200 text-gray-600 hover:text-blue-500"
            >
              Thoát
            </Button>
            <Button
              type="primary"
              block
              size="large"
              className="bg-green-500 border-none hover:bg-green-600 rounded-xl h-14 font-bold text-white shadow-lg shadow-green-200"
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
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-4">
              <p className="text-sm text-orange-600 font-semibold mb-3">👆 Chạm vào từ viết SAI trong câu:</p>
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
                            : wordPicked === i && !answered ? 'border-blue-400 bg-blue-100 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-800 hover:border-orange-300',
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
              <div className="bg-cyan-50 border border-cyan-200 rounded-3xl p-8 mb-6 text-center shadow-sm">
                <p className="text-cyan-900 font-bold text-xl leading-relaxed">
                  {ch.blankSentence ? ch.blankSentence.split('_').map((part, i, arr) => (
                    <React.Fragment key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <span className={`inline-block border-b-4 min-w-[80px] px-2 mx-1 transition-all ${answered
                          ? (isCorrect ? 'border-green-500 text-green-600 bg-green-50' : 'border-red-400 text-red-500 bg-red-50')
                          : 'border-cyan-400 text-cyan-600 bg-cyan-100/50'
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
                      ? 'border-cyan-500 bg-cyan-500 text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-cyan-300 hover:bg-cyan-50'
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
                className="rounded-2xl text-lg h-16 px-6 border-2 focus:border-cyan-400 shadow-sm"
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
                className="bg-cyan-500 border-cyan-500 hover:bg-cyan-600 rounded-2xl h-16 text-lg font-black shadow-md mb-6"
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
        return (
          <>
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 mb-6 text-center">
              <p className="text-purple-800 font-bold text-xl">{speakText}</p>
              {ch.ipaText && <p className="text-purple-500 font-mono text-base mt-2">/{ch.ipaText}/</p>}
              {ch.audioUrl && (
                <button className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-100 text-purple-700 font-semibold text-sm hover:bg-purple-200 transition-colors mx-auto"
                  onClick={() => { try { new Audio(ch.audioUrl!).play() } catch (_) { } }}>
                  <SoundFilled /> Nghe mẫu
                </button>
              )}
              <p className="text-purple-400 text-sm mt-3">Hãy đọc to câu trên theo đúng giọng miền.</p>
            </div>
            {!answered ? (
              <Button type="primary" size="large" block icon={<AudioOutlined />}
                className="bg-purple-500 border-purple-500 hover:bg-purple-600 rounded-2xl h-14 text-base font-bold mb-6"
                onClick={() => { setAnswered(true); setScore(s => s + 1) }}>
                Đã đọc xong ✓
              </Button>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 text-green-700 flex items-center gap-2">
                <CheckCircleFilled /> Tốt lắm! Tiếp tục nhé.
              </div>
            )}
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
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all">
          <ArrowLeftOutlined className="text-gray-600" />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-gray-800 truncate">{quiz.name}</h2>
          <p className="text-xs text-gray-400">Câu {idx + 1} / {total}</p>
        </div>
        <div className="flex items-center gap-2">
          {timeLeft !== null && (
            <Tag
              color={timeLeft < 10 ? 'red' : 'blue'}
              className="font-bold rounded-lg px-3 py-1 flex items-center gap-1 animate-pulse"
            >
              <ThunderboltFilled /> {timeLeft}s
            </Tag>
          )}
          <Tag color="green" className="rounded-lg px-3 py-1">Đạt: {quiz.passingScore}%</Tag>
        </div>

      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100">
        <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${(idx / total) * 100}%` }} />
      </div>

      {/* Question area */}
      <div className="max-w-2xl mx-auto px-6 pt-10">
        <AnimatePresence mode="wait">
          <motion.div key={idx}
            initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 22 }}>

            {/* Question card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
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
                  className="bg-green-500 border-green-500 hover:bg-green-600 rounded-2xl h-14 text-base font-bold"
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
