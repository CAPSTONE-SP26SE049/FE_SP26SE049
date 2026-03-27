import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
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
import { Spin, Button, Tag, Empty, Progress, Input } from 'antd'
import apiClient from '../../../services/apiClient'

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
  sentence: string
  correctWords: string[]
  distractors: string[]
  // SPEAKING
  transcript: string
  // Common
  audioUrl: string | null
  ipaText: string | null
  imageUrl: string | null
  hint: string | null
}

interface QuizDetail {
  id: string
  levelId: string | null
  name: string
  passingScore: number
  challenges: ParsedChallenge[]
}

// ─── metadataJson → ParsedChallenge normalizer ──────────────────────────────

function parseChallenge(raw: any): ParsedChallenge {
  const ch = raw?.challenge ?? raw ?? {}
  const meta: any = ch.metadataJson ?? {}
  const skillType = (ch.skillType ?? meta.skill_type ?? 'READING').toUpperCase()

  // Detect render mode from metadata shape
  let mode: RenderMode = 'GENERIC'

  const hasOptions     = Array.isArray(meta.options) && meta.options.length > 0
  const hasWords       = Array.isArray(meta.words) && meta.words.length > 0
  const hasSentence    = typeof meta.sentence === 'string' && meta.sentence.length > 0
  const hasTranscript  = typeof meta.transcript === 'string' || typeof meta.text === 'string'

  if (hasWords && meta.error_index !== undefined) {
    mode = 'FIND_WRONG_WORD'
  } else if (hasSentence && Array.isArray(meta.correctWords)) {
    mode = 'WRITING_FILL'
  } else if (hasOptions) {
    mode = 'MULTIPLE_CHOICE'
  } else if (skillType === 'SPEAKING' || hasTranscript) {
    mode = 'SPEAKING_READ'
  }

  return {
    id:            ch.id ?? '',
    mode,
    skillType,
    content:       ch.contentText ?? meta.content_text ?? '',
    // MULTIPLE_CHOICE
    options:       hasOptions ? meta.options : [],
    correctAnswer: meta.correctAnswer ?? meta.correct_answer ?? '',
    // FIND_WRONG_WORD
    words:         hasWords ? meta.words : [],
    errorIndex:    typeof meta.error_index === 'number' ? meta.error_index : -1,
    correctWord:   meta.correct_word ?? '',
    // WRITING
    sentence:      meta.sentence ?? '',
    correctWords:  Array.isArray(meta.correctWords) ? meta.correctWords : [],
    distractors:   Array.isArray(meta.distractors) ? meta.distractors : [],
    // SPEAKING
    transcript:    meta.transcript ?? meta.text ?? '',
    // Common
    audioUrl:      meta.audioUrl ?? meta.audio_url ?? meta.referenceAudioUrl ?? meta.reference_audio_url ?? null,
    ipaText:       meta.ipaText ?? meta.ipa_text ?? meta.phoneticTranscriptionIpa ?? meta.phonetic_transcription_ipa ?? null,
    imageUrl:      meta.imageUrl ?? null,
    hint:          meta.hint || null,
  }
}

// ─── Skill type badge info ───────────────────────────────────────────────────

const SKILL_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  LISTENING:   { label: 'Nghe hiểu',        color: 'blue',    icon: <SoundFilled /> },
  SPEAKING:    { label: 'Nói',              color: 'purple',  icon: <AudioOutlined /> },
  READING:     { label: 'Đọc hiểu',         color: 'orange',  icon: <ReadOutlined /> },
  WRITING:     { label: 'Viết',             color: 'cyan',    icon: <EditOutlined /> },
  ENTRY_TEST:  { label: 'Kiểm tra đầu vào', color: 'gold',    icon: <ThunderboltFilled /> },
}

const SOUND_URLS = {
  SUCCESS: 'https://firebasestorage.googleapis.com/v0/b/speak-journey-vn-2026.firebasestorage.app/o/sound_effects%2FAm_thanh_khi_hoan_thanh_com.mp3?alt=media&token=23a68645-bbcb-4b0c-917c-756dc1b41a14',
  WRONG:   'https://firebasestorage.googleapis.com/v0/b/speak-journey-vn-2026.firebasestorage.app/o/sound_effects%2FAm_thanh_tra_loi_sai_com.mp3?alt=media&token=c18b9f8d-0c91-4413-9b80-ea69dc2b4b1e',
  RIGHT:   'https://firebasestorage.googleapis.com/v0/b/speak-journey-vn-2026.firebasestorage.app/o/sound_effects%2Fright_answer_sound_effect_com.mp3?alt=media&token=0edae79f-b910-4f2c-91ec-7bcab9408faa',
  FAILED:  'https://firebasestorage.googleapis.com/v0/b/speak-journey-vn-2026.firebasestorage.app/o/sound_effects%2FAm_thanh_that_bai.mp3?alt=media&token=63167a2d-9b97-44bb-8383-bcd353d262b8',
}

// Preload globally or within component to avoid creation lag
const preloadedAudio: Record<string, HTMLAudioElement> = {}
Object.entries(SOUND_URLS).forEach(([k, url]) => {
  const a = new Audio(url)
  a.preload = 'auto'
  preloadedAudio[k] = a
})

const playEffect = (key: keyof typeof SOUND_URLS) => {
  const a = preloadedAudio[key]
  if (a) {
    a.currentTime = 0
    a.play().catch(() => {})
  }
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
  const location = useLocation()

  const [quiz,         setQuiz]         = useState<QuizDetail | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [idx,          setIdx]          = useState(0)        // current question index
  const [selected,     setSelected]     = useState<string | null>(null)
  const [answered,     setAnswered]     = useState(false)
  const [score,        setScore]        = useState(0)
  const [finished,     setFinished]     = useState(false)
  const [writingInput, setWritingInput] = useState('')
  const [wordPicked,   setWordPicked]   = useState<number | null>(null)  // for FIND_WRONG_WORD
  const [sessionId,    setSessionId]    = useState<string | null>(null)
  const [nextQuizId,   setNextQuizId]   = useState<string | null>(null)
  const [nextQuizTitle,setNextQuizTitle]= useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // Ref to track the pending markComplete API call so navigation can await it
  const markCompletePromiseRef = useRef<Promise<any> | null>(null)

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!quizId) return
    setLoading(true)
    setQuiz(null); setSessionId(null);
    setIdx(0); setScore(0); setSelected(null); setAnswered(false); setFinished(false); 
    setWritingInput(''); setWordPicked(null); setNextQuizId(null); setNextQuizTitle(null);
    
    // Priority levelId from navigation state
    const stateLevelId = location.state?.levelId
    
    Promise.allSettled([
      apiClient.get(`/users/quizzes/${quizId}`),
      apiClient.get(`/users/quizzes/${quizId}/challenges`),
    ]).then(([qr, cr]) => {
      const qdRaw: any = qr.status === 'fulfilled' ? (qr.value ?? {}) : {}
      const qd: any = qdRaw.data ?? qdRaw
      const raw: any[] = cr.status === 'fulfilled' ? (cr.value?.data ?? cr.value ?? []) : []
      const arr = Array.isArray(raw) ? raw : []

      const parsed = arr.map(parseChallenge)
      const finalLevelId = stateLevelId || qd.levelId || qd.level_id || (arr.length > 0 ? arr[0].challenge?.levelId : null)

      setQuiz({
        id: qd.id ?? quizId,
        levelId: finalLevelId,
        name: qd.title ?? qd.name ?? 'Bài kiểm tra',
        passingScore: typeof qd.passingScore === 'number' ? qd.passingScore : (qd.passing_score ?? 70),
        challenges: parsed,
      })

      // If we have levelId, fetch quizzes of that level to find the next one
      if (finalLevelId) {
        apiClient.get(`/users/levels/${finalLevelId}/quizzes`).then(res => {
          const listRes: any = res?.data ?? res ?? []
          const all: any[] = Array.isArray(listRes) ? listRes : (listRes.data ?? [])
          
          const currentId = (qd.id ?? quizId).toString().toLowerCase()
          const currIdx = all.findIndex(q => (q.id ?? '').toString().toLowerCase() === currentId)
          
          if (currIdx !== -1 && currIdx < all.length - 1) {
            setNextQuizId(all[currIdx + 1].id)
            setNextQuizTitle(all[currIdx + 1].title ?? all[currIdx + 1].name)
          }
        }).catch(err => console.error('[QuizPage] Failed to fetch level quizzes:', err))
      }
    }).finally(() => setLoading(false))

    // Start a gameplay session
    apiClient.post('/gameplay/sessions')
      .then(res => {
        const sid = res.data?.id ?? res.data?.sessionId;
        if (sid) setSessionId(sid);
      })
      .catch(err => console.error('[QuizPage] Failed to start session:', err));

    return () => {
      // End session if it exists
      if (sessionId) {
        apiClient.put(`/gameplay/sessions/${sessionId}/end`).catch(() => {});
      }
    }
  }, [quizId])

  // ── Auto-play audio for LISTENING ─────────────────────────────────────────
  useEffect(() => {
    if (!quiz) return
    const ch = quiz.challenges?.[idx]
    if (ch?.skillType === 'LISTENING' && ch.audioUrl) {
      try { const a = new Audio(ch.audioUrl); audioRef.current = a; a.play().catch(() => {}) } catch (_) {}
    }
    return () => { audioRef.current?.pause() }
  }, [idx, quiz])

  // ── Navigation ────────────────────────────────────────────────────────────
  const goNext = () => {
    setWritingInput(''); setWordPicked(null)
    if (idx + 1 >= (quiz?.challenges?.length ?? 0)) {
       setFinished(true)
       if (sessionId) {
         apiClient.put(`/gameplay/sessions/${sessionId}/end`).catch(() => {});
       }
       // Mark quiz as complete — store the promise so navigation can await it
       if (quiz?.id) {
         markCompletePromiseRef.current = apiClient.put(`/users/quizzes/${quiz.id}/complete`, null, {
           params: { correctCount: score, totalCount: quiz.challenges.length }
         }).catch(err => console.error('[QuizPage] markComplete failed:', err));
       }
    }
    else { setIdx(i => i + 1); setSelected(null); setAnswered(false) }
  }

  // Await pending markComplete before navigating so roadmap re-fetch sees fresh data
  const goToRoadmap = async (state: any) => {
    if (markCompletePromiseRef.current) {
      await markCompletePromiseRef.current.catch(() => {})
    }
    navigate('/learner/roadmap', { state })
  }

  // ── End Game Sounds ───────────────────────────────────────────────────────
  useEffect(() => {
    if (finished && quiz) {
      const pct = total > 0 ? Math.round((score / total) * 100) : 0
      const passed = pct >= quiz.passingScore
      if (passed) playEffect('SUCCESS')
      else playEffect('FAILED')
    }
  }, [finished])

  const submitAttempt = (challengeId: string, isPassed: boolean) => {
    apiClient.post('/gameplay/attempts', {
      sessionId,
      challengeId,
      isPassed,
      audioUrl: '', // Not used for Quiz unless it's a recording
    }).catch(err => console.error('[QuizPage] Failed to submit attempt:', err));
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50"><Spin size="large" /></div>
  )
  if (!quiz) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-50">
      <Empty description="Không tìm thấy bài kiểm tra" />
      <Button onClick={() => goToRoadmap({ roadmapState: location.state?.roadmapState })}>Quay lại</Button>
    </div>
  )

  const challenges = quiz.challenges
  const total = challenges.length

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-50">
        <Empty description="Bài kiểm tra này hiện chưa có câu hỏi" />
        <Button onClick={() => goToRoadmap({ roadmapState: location.state?.roadmapState })}>Quay lại Lộ trình</Button>
      </div>
    )
  }

  // ── Finished ──────────────────────────────────────────────────────────────
  if (finished) {
    const pct = total > 0 ? Math.round((score / total) * 100) : 0
    const passed = pct >= quiz.passingScore
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-6 bg-gray-50">
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">{passed ? '🎉' : '😅'}</div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">{passed ? 'Xuất sắc!' : 'Cố lên!'}</h2>
          <p className="text-gray-500 mb-6">Bạn đúng {score}/{total} câu ({pct}%)</p>
          <Progress percent={pct} status={passed ? 'success' : 'exception'} strokeColor={passed ? '#10b981' : '#ef4444'} className="mb-6" />
          <p className="text-sm text-gray-400 mb-6">Điểm đạt yêu cầu: {quiz.passingScore}%</p>
          <div className="flex flex-col gap-3 w-full">
            {passed && nextQuizId && (
              <Button type="primary" size="large" className="bg-blue-600 border-blue-600 hover:bg-blue-700 h-14 font-bold text-lg rounded-2xl"
                onClick={async () => {
                   if (markCompletePromiseRef.current) {
                     await markCompletePromiseRef.current.catch(() => {})
                   }
                   navigate(`/learner/quiz/${nextQuizId}`, { state: { levelId: quiz.levelId, roadmapState: location.state?.roadmapState } });
                }}>
                Bài tiếp theo: {nextQuizTitle} →
              </Button>
            )}
            <div className="flex gap-3 justify-center">
              <Button icon={<ArrowLeftOutlined />} onClick={() => goToRoadmap({ roadmapState: location.state?.roadmapState })} className="h-12 rounded-xl">Lộ trình</Button>
              <Button className="border-green-500 text-green-600 hover:text-green-700 hover:border-green-600 h-12 rounded-xl"
                onClick={() => { setIdx(0); setScore(0); setSelected(null); setAnswered(false); setFinished(false); setWritingInput(''); setWordPicked(null) }}>
                Làm lại
              </Button>
            </div>
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
          const isCorrect = opt === ch.correctAnswer
          setSelected(opt); setAnswered(true)
          if (isCorrect) {
            setScore(s => s + 1)
            playEffect('RIGHT')
          } else {
            playEffect('WRONG')
          }
          submitAttempt(ch.id, isCorrect)
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
          const isCorrect = wordIdx === ch.errorIndex
          setWordPicked(wordIdx); setAnswered(true)
          if (isCorrect) {
            setScore(s => s + 1)
            playEffect('RIGHT')
          } else {
            playEffect('WRONG')
          }
          submitAttempt(ch.id, isCorrect)
        }
        return (
          <>
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-4">
              <p className="text-sm text-orange-600 font-semibold mb-3">👆 Chạm vào từ viết SAI trong câu:</p>
              <div className="flex flex-wrap gap-2">
                {ch.words.map((w, i) => {
                  const isError    = answered && i === ch.errorIndex
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
          const isCorrect = ch.correctWords.some(w => w.toLowerCase() === writingInput.trim().toLowerCase())
          setAnswered(true)
          if (isCorrect) {
            setScore(s => s + 1)
            playEffect('RIGHT')
          } else {
            playEffect('WRONG')
          }
          submitAttempt(ch.id, isCorrect)
        }
        const isCorrect = answered && ch.correctWords.some(w => w.toLowerCase() === writingInput.trim().toLowerCase())
        return (
          <>
            {ch.sentence && (
              <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-5 mb-4 text-center">
                <p className="text-cyan-800 font-bold text-lg">{ch.sentence}</p>
              </div>
            )}
            {ch.distractors.length > 0 && !answered && (
              <div className="flex flex-wrap gap-2 mb-4 justify-center">
                {[...ch.correctWords, ...ch.distractors].sort(() => Math.random() - 0.5).map((w, i) => (
                  <button key={i}
                    onClick={() => setWritingInput(w)}
                    className={`px-4 py-2 rounded-xl border-2 font-semibold text-sm transition-all ${writingInput === w ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-gray-200 bg-white text-gray-700 hover:border-cyan-300'}`}>
                    {w}
                  </button>
                ))}
              </div>
            )}
            <div className="mb-6">
              <Input
                placeholder="Chọn hoặc gõ đáp án..."
                value={writingInput}
                onChange={e => setWritingInput(e.target.value)}
                disabled={answered}
                className="rounded-2xl text-base h-12"
                onPressEnter={handleWritingSubmit}
              />
              {answered && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className={`mt-3 rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2 ${isCorrect ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                  {isCorrect
                    ? <><CheckCircleFilled /> Chính xác!</>
                    : <><CloseCircleFilled /> Đáp án đúng: &ldquo;{ch.correctWords.join(', ')}&rdquo;</>}
                </motion.div>
              )}
            </div>
            {!answered && (
              <Button type="primary" size="large" block disabled={!writingInput.trim()}
                className="bg-cyan-500 border-cyan-500 hover:bg-cyan-600 rounded-2xl h-14 text-base font-bold mb-6"
                onClick={handleWritingSubmit}>
                Kiểm tra
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
                  onClick={() => { try { new Audio(ch.audioUrl!).play() } catch (_) {} }}>
                  <SoundFilled /> Nghe mẫu
                </button>
              )}
              <p className="text-purple-400 text-sm mt-3">Hãy đọc to câu trên theo đúng giọng miền.</p>
            </div>
            {!answered ? (
              <Button type="primary" size="large" block icon={<AudioOutlined />}
                className="bg-purple-500 border-purple-500 hover:bg-purple-600 rounded-2xl h-14 text-base font-bold mb-6"
                onClick={() => {
                   setAnswered(true); setScore(s => s + 1);
                   playEffect('RIGHT');
                   submitAttempt(ch.id, true);
                }}>
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
        <button onClick={() => goToRoadmap({ roadmapState: location.state?.roadmapState })}
          className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all">
          <ArrowLeftOutlined className="text-gray-600" />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-gray-800 truncate">{quiz.name}</h2>
          <p className="text-xs text-gray-400">Câu {idx + 1} / {total}</p>
        </div>
        <Tag color="green">Đạt: {quiz.passingScore}%</Tag>
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
              {ch.hint && ch.mode !== 'FIND_WRONG_WORD' && (
                <p className="text-sm text-gray-400 mb-2">💡 {ch.hint}</p>
              )}
              {ch.audioUrl && ch.mode !== 'SPEAKING_READ' && (
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 font-semibold text-sm hover:bg-blue-100 transition-colors mb-2"
                  onClick={() => { try { new Audio(ch.audioUrl!).play() } catch (_) {} }}>
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
