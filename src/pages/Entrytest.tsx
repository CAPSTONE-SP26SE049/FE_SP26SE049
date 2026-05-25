import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, Square, Volume2, Sparkles, AlertTriangle, ChevronRight } from 'lucide-react'
import { Button } from '../components/ui/Button'
import entryTestService, { type PlacementQuestion } from '../services/entryTestService'
import { useAuth } from '../core/auth/AuthContext'
import {
  getLearnerOnboardingPath,
  hasRegionValue,
} from '../utils/onboarding'

type StepStatus = 'loading' | 'ready' | 'listening' | 'processing' | 'error'

const Entrytest = () => {
  const navigate = useNavigate()
  const { session, updateSessionItem, refreshUserProfile } = useAuth()

  const [pageStatus, setPageStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [questions, setQuestions] = useState<PlacementQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [stepStatus, setStepStatus] = useState<StepStatus>('ready')
  const [stepResults, setStepResults] = useState<Record<string, unknown>[]>([])
  const [feedback, setFeedback] = useState<string | null>(null)
  const [finishing, setFinishing] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const currentQuestion = questions[currentIndex]

  useEffect(() => {
    const user = session?.user
    if (!user) return
    const target = getLearnerOnboardingPath(user)
    if (target !== '/learner/entrytest') {
      navigate(target, { replace: true })
    }
  }, [session, navigate])

  const loadPlacementSet = useCallback(async () => {
    if (!hasRegionValue(session?.user.region)) {
      navigate('/learner/select-region', { replace: true })
      return
    }
    setPageStatus('loading')
    setLoadError(null)
    try {
      const res = await entryTestService.getPlacementSet()
      const list = (res.data?.data ?? res.data) as PlacementQuestion[]
      if (!Array.isArray(list) || list.length === 0) {
        throw new Error('Không có câu hỏi kiểm tra đầu vào')
      }
      setQuestions(list)
      setPageStatus('ready')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err as Error)?.message ??
        'Không tải được bộ đề'
      setLoadError(msg)
      setPageStatus('error')
    }
  }, [session?.user.region, navigate])

  useEffect(() => {
    loadPlacementSet()
  }, [loadPlacementSet])

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  const startRecording = async () => {
    if (!currentQuestion) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : undefined
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, {
          type: mimeType ?? 'audio/webm',
        })
        stopStream()
        await submitStep(blob)
      }

      mediaRecorder.start()
      setStepStatus('listening')
      setFeedback(null)
    } catch {
      setStepStatus('error')
      setFeedback('Vui lòng cấp quyền Microphone để tiếp tục.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  const submitStep = async (blob: Blob) => {
    if (!currentQuestion) return
    setStepStatus('processing')
    try {
      const file = new File([blob], 'recording.webm', { type: blob.type || 'audio/webm' })
      const res = await entryTestService.analyzeStep(currentQuestion.id, file)
      const diagnosis = (res.data?.data ?? res.data) as Record<string, unknown>

      const stepPayload = {
        questionId: currentQuestion.id,
        targetText: diagnosis.targetText ?? currentQuestion.targetText,
        regionCategory: diagnosis.regionCategory ?? currentQuestion.regionCategory,
        accuracy: diagnosis.accuracy ?? 0,
        isRegional: diagnosis.isRegional ?? false,
        rawText: diagnosis.rawText ?? diagnosis.azureTranscript ?? '',
        feedback: diagnosis.feedback ?? '',
      }
      const nextResults = [...stepResults, stepPayload]
      setStepResults(nextResults)

      if (currentIndex + 1 >= questions.length) {
        await finishTest(nextResults)
      } else {
        setCurrentIndex((i) => i + 1)
        setStepStatus('ready')
      }
    } catch (err: unknown) {
      console.error('analyze-step error:', err)
      setStepStatus('error')
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Có lỗi khi chấm điểm. Vui lòng thử lại.'
      setFeedback(msg)
    }
  }

  const finishTest = async (results: Record<string, unknown>[]) => {
    setFinishing(true)
    try {
      await entryTestService.finishTest(results)
      updateSessionItem({ hasDoneEntryTest: true })
      await refreshUserProfile()
      navigate('/learner/roadmap', { replace: true })
    } catch (err: unknown) {
      console.error('finish error:', err)
      setStepStatus('error')
      setFeedback(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Không thể hoàn tất bài kiểm tra. Vui lòng thử lại.',
      )
      setFinishing(false)
    }
  }

  if (pageStatus === 'loading') {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <p className="text-gray-600 font-medium">Đang tải bộ đề theo miền của bạn...</p>
      </div>
    )
  }

  if (pageStatus === 'error') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 p-4">
        <AlertTriangle className="text-red-500" size={40} />
        <p className="text-red-700 font-medium text-center">{loadError}</p>
        <Button onClick={loadPlacementSet}>Thử lại</Button>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-green-50 via-teal-50/50 to-blue-50 flex flex-col items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-2xl bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-lg border border-white/60 p-6 md:p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-green to-teal-500 text-white mb-3">
            <Sparkles size={24} />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-2">
            Kiểm Tra Đầu Vào
          </h1>
          <p className="text-gray-500 text-sm">
            Câu {currentIndex + 1} / {questions.length} — Miền:{' '}
            <span className="font-bold text-brand-green">{session?.user.region}</span>
          </p>
        </div>

        {currentQuestion && (
          <div className="bg-gradient-to-r from-brand-green/[0.03] to-teal-500/[0.05] p-5 rounded-3xl border border-brand-green/10 mb-6">
            <div className="flex items-center justify-center gap-2 mb-3 text-brand-green font-bold uppercase text-xs">
              <Volume2 size={16} />
              <span>Đọc to rõ câu sau</span>
            </div>
            <p className="text-xl md:text-2xl font-extrabold text-gray-800 text-center leading-relaxed">
              &ldquo;{currentQuestion.targetText}&rdquo;
            </p>
          </div>
        )}

        <div className="flex flex-col items-center min-h-[140px] justify-center mb-4">
          {stepStatus === 'ready' && !finishing && (
            <p className="text-gray-500 flex items-center gap-2">
              <Mic size={20} /> Nhấn micro để ghi âm (.webm)
            </p>
          )}
          {stepStatus === 'listening' && (
            <p className="text-brand-green font-bold animate-pulse">Đang ghi âm...</p>
          )}
          {(stepStatus === 'processing' || finishing) && (
            <p className="text-gray-700 font-bold">
              {finishing ? 'Đang tạo lộ trình học...' : 'Đang chấm điểm AI...'}
            </p>
          )}
          {stepStatus === 'error' && feedback && (
            <div className="text-center text-red-600 text-sm font-medium">{feedback}</div>
          )}
        </div>

        {stepStatus !== 'processing' && !finishing && (
          <div className="flex justify-center">
            <button
              type="button"
              className={`w-20 h-20 md:w-24 md:h-24 rounded-full shadow-xl flex items-center justify-center text-white ${
                stepStatus === 'listening'
                  ? 'bg-red-500'
                  : 'bg-gradient-to-tr from-brand-green to-teal-400'
              }`}
              onClick={stepStatus === 'listening' ? stopRecording : startRecording}
              disabled={stepStatus === 'error' && !feedback}
            >
              {stepStatus === 'listening' ? <Square size={28} /> : <Mic size={36} />}
            </button>
          </div>
        )}

        {stepResults.length > 0 && stepStatus === 'ready' && (
          <p className="text-center text-xs text-gray-400 mt-4">
            Đã hoàn thành {stepResults.length} câu
            <ChevronRight className="inline" size={14} />
          </p>
        )}
      </div>
    </div>
  )
}

export default Entrytest
