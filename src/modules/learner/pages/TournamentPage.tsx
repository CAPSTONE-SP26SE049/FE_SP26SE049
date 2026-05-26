import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy,
  Volume2,
  Mic,
  Star,
  Sparkles,
  Timer,
  Crown,
  Medal,
  Award,
  RefreshCw,
  Play,
  CheckCircle,
  XCircle,
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react'
import { Avatar, message, Modal } from 'antd'
import clsx from 'clsx'
import apiClient from '../../../services/apiClient'
import { useAuth } from '../../../core/auth/AuthContext'
import { useAudioRecorder } from '../../../hooks/useAudioRecorder'
import { uploadToCloudinary } from '../../../services/cloudinaryService'
import { ASR_BASE_URL, ASR_MODEL, ASR_LANGUAGE, ASR_SAMPLING_RATE } from '../../../config'
import { DoodleLoading } from '../../../components/ui/DoodleLoading'

// HSL customized theme colors
const REGION_THEMES: Record<string, { tint: string; bg: string; text: string; icon: string }> = {
  BAC: { tint: '#818CF8', bg: '#EEF2FF', text: '#4338CA', icon: '' },
  TRUNG: { tint: '#F59E0B', bg: '#FEF3C7', text: '#B45309', icon: '' },
  NAM: { tint: '#10B981', bg: '#ECFDF5', text: '#047857', icon: '' }
}

export default function TournamentPage() {
  const { session } = useAuth()
  const user = session?.user

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tournament, setTournament] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  
  // Tab Switcher and History states
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'history'>('leaderboard')
  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  
  // Timer countdown state
  const [timeLeftStr, setTimeLeftStr] = useState<string>('')
  
  // Active challenge state for practice modal
  const [activeChallenge, setActiveChallenge] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Speaking state
  const recorder = useAudioRecorder()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [playingTTS, setPlayingTTS] = useState(false)
  const [aiResult, setAiResult] = useState<{
    score: number
    isCorrect: boolean
    transcription: string
    feedback: string
    wordDetails?: any[]
  } | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(false)
    try {
      // 1. Fetch active tournament details (challenges + user progress)
      const resT = await apiClient.get('/tournaments/active')
      setTournament(resT?.data?.data ?? resT?.data ?? null)

      // 2. Fetch active tournament leaderboard
      const resL = await apiClient.get('/tournaments/active/leaderboard')
      setLeaderboard(resL?.data?.data ?? resL?.data ?? [])

      // 3. Fetch tournament history as well for closed announcement checks
      const resH = await apiClient.get('/tournaments/history')
      setHistory(resH?.data?.data ?? resH?.data ?? [])
    } catch (err) {
      console.error('[TournamentPage] Failed to fetch active tournament:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true)
    try {
      const res = await apiClient.get('/tournaments/history')
      setHistory(res?.data?.data ?? res?.data ?? [])
    } catch (err) {
      console.error('[TournamentPage] Failed to fetch tournament history:', err)
      message.error('Không thể tải lịch sử giải đấu.')
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Timer countdown logic
  useEffect(() => {
    if (!tournament?.endsAt) return

    const calculateTime = () => {
      const difference = +new Date(tournament.endsAt) - +new Date()
      if (difference <= 0) {
        setTimeLeftStr('Đã kết thúc')
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((difference / 1000 / 60) % 60)
      const seconds = Math.floor((difference / 1000) % 60)

      let res = ''
      if (days > 0) res += `${days} ngày `
      res += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      setTimeLeftStr(res)
    }

    calculateTime()
    const timerId = setInterval(calculateTime, 1000)
    return () => clearInterval(timerId)
  }, [tournament?.endsAt])

  const playTTS = async (text: string, region: string) => {
    setPlayingTTS(true)
    // Auto-select standard regional voice
    const voice = region === 'BAC' ? 'Northern' : region === 'NAM' ? 'Southern' : 'Central'
    try {
      const res = await apiClient.post('/ai/tts', { text, voice })
      const data = res?.data || res
      if (data.async) {
        const audio = new Audio(data.async)
        audio.play()
      } else {
        message.error('Không tìm thấy tệp phát âm mẫu.')
      }
    } catch (err) {
      console.error('[TournamentPage] TTS failed:', err)
    } finally {
      setPlayingTTS(false)
    }
  }

  // ASR + AI Feedback implementation
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

  const handleRecordStop = async (recordedBlob: Blob) => {
    if (!recordedBlob || recordedBlob.size < 100) return
    setIsAnalyzing(true)
    setAiResult(null)

    try {
      // 1. Convert to WAV
      let wavBlob = recordedBlob
      try {
        wavBlob = await convertWebmToWav(recordedBlob)
      } catch (err) {
        console.warn('WAV conversion failed, using fallback:', err)
      }

      // 2. Call ASR
      const asrFormData = new FormData()
      asrFormData.append('audio', wavBlob, 'recording.wav')
      asrFormData.append('target', activeChallenge.contentText)

      const asrStartTime = performance.now()
      const asrResponse = await fetch(ASR_BASE_URL, { method: 'POST', body: asrFormData })
      const asrEndTime = performance.now()
      const asrProcessingTimeMs = Math.round(asrEndTime - asrStartTime)

      const asrData = await asrResponse.json()
      const apiResult = asrData.success ? asrData.data : null
      if (!apiResult) throw new Error("Không thể giải mã giọng nói")

      const transcribedText = apiResult.transcribed || ""
      const asrScore = apiResult.score || 0
      const wordDetails = apiResult.word_details || []

      // 3. Upload to Cloudinary for saving history
      let audioUrl = null
      try {
        const file = new File([wavBlob], `tournament_${Date.now()}.wav`, { type: 'audio/wav' })
        audioUrl = await uploadToCloudinary(file, 'video')
      } catch (cloudinaryErr) {
        console.warn('Cloudinary upload failed:', cloudinaryErr)
      }

      // 4. Call AI Feedback endpoint
      const feedbackResponse = await apiClient.post('/ai/feedback', {
        transcribedText,
        targetText: activeChallenge.contentText,
        challengeId: activeChallenge.id,
        dialect: activeChallenge.region ?? '',
        audioUrl: audioUrl,
        consentGiven: true,
        asrProcessingTimeMs,
        asrScore: asrScore,
        wordDetails: wordDetails,
        recordId: apiResult.record_id || null
      })

      const feedbackData = feedbackResponse.data || feedbackResponse
      const finalScore = asrScore || Number(feedbackData.score ?? feedbackData.overallScore ?? feedbackData.accuracy ?? 0)
      const isCorrect = finalScore >= 60

      setAiResult({
        score: finalScore,
        isCorrect,
        transcription: transcribedText || '(Không nhận dạng được âm thanh)',
        feedback: feedbackData.feedback ?? feedbackData.suggestion ?? 'Phát âm tương đối tốt!',
        wordDetails
      })

      // 5. Submit score to Tournament
      const submitRes = await apiClient.post('/tournaments/submit', {
        challengeId: activeChallenge.id,
        score: finalScore
      })

      if (submitRes.data?.data?.updated) {
        message.success(`Kỷ lục mới! Ghi nhận ${finalScore} điểm giải đấu!`)
      } else {
        message.info(`Hoàn thành thử thách. Kỷ lục hiện tại của bạn là: ${submitRes.data?.data?.previousHighScore ?? finalScore} điểm.`)
      }

      // Refresh data to update scoreboard and leaderboard
      setTimeout(() => {
        loadData()
      }, 1000)

    } catch (err: any) {
      console.error('[TournamentPage] Evaluation failed:', err)
      message.error(err?.message ?? 'Đã xảy ra lỗi khi chấm điểm.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const startPractice = (challenge: any) => {
    setActiveChallenge(challenge)
    setAiResult(null)
    recorder.resetRecording()
    setIsModalOpen(true)
  }

  // compact config for top 3
  const podConfig = (rank: number) => {
    if (rank === 1) return {
      badge: <Crown size={28} className="text-yellow-400 fill-yellow-400 drop-shadow-[2px_2px_0_rgba(0,0,0,0.2)]" />,
      ring: 'border-[3px] border-yellow-400 shadow-[3px_3px_0_#1f2937]',
      podBg: 'bg-yellow-100',
      podH: 'h-36', size: 80, label: 'text-yellow-700'
    }
    if (rank === 2) return {
      badge: <Medal size={24} className="text-slate-400 fill-slate-400" />,
      ring: 'border-[3px] border-slate-300 shadow-[3px_3px_0_#1f2937]',
      podBg: 'bg-slate-100',
      podH: 'h-28', size: 68, label: 'text-slate-600'
    }
    return {
      badge: <Award size={24} className="text-orange-400 fill-orange-400" />,
      ring: 'border-[3px] border-orange-300 shadow-[3px_3px_0_#1f2937]',
      podBg: 'bg-orange-50',
      podH: 'h-20', size: 64, label: 'text-orange-600'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40 bg-[#fbf6ef] min-h-screen">
        <DoodleLoading message="Đang kết nối cổng thi đấu..." />
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-[#fbf6ef] min-h-screen font-nunito px-6">
        <div className="text-6xl mb-6">🏜️</div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">Ối! Có lỗi rồi</h3>
        <p className="text-slate-500 font-bold mb-8 text-center max-w-sm">Không thể kết nối tới máy chủ giải đấu lúc này. Vui lòng thử lại sau.</p>
        <button onClick={loadData} className="px-8 py-3 bg-[#49B6E5] text-white font-black rounded-2xl border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f2937] active:translate-y-1 active:shadow-none transition-all">Thử lại ngay</button>
      </div>
    )
  }

  const top3 = leaderboard.slice(0, 3)
  const orderedTop3 = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3
  const rest = leaderboard.slice(3)

  return (
    <div className="flex flex-col min-h-screen bg-[#fbf6ef] font-nunito pb-20 px-6 lg:px-8">
      {/* TOURNAMENT FINALIZED ANNOUNCEMENT BANNER */}
      {history && history.length > 0 && (
        <div className="max-w-7xl mx-auto w-full pt-8">
          <div className="bg-[#FEF3C7] border-[3px] border-slate-900 rounded-[2rem] p-5 shadow-[4px_4px_0_#1f2937] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs font-black uppercase text-amber-700 tracking-wider">Thông báo giải đấu</p>
                <p className="text-sm font-black text-slate-800 mt-0.5">
                  Hệ thống đã chốt giải cho kỳ đấu tuần trước ({history[0]?.name || 'kỳ vừa qua'})! Bảng xếp hạng vinh danh và phần thưởng XP đã được trao cho các học viên đạt giải.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveTab('history')
                const el = document.getElementById('tournament-columns')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
              className="px-4 py-2 rounded-xl border-2 border-slate-900 bg-white text-xs font-black text-slate-700 shadow-[2px_2px_0_#1f2937] hover:bg-slate-50 transition-colors active:translate-y-0.5 active:shadow-none shrink-0"
            >
              Xem kết quả mùa trước
            </button>
          </div>
        </div>
      )}

      {/* ── HEADER BANNER (Brutal Neo) ── */}
      <div id="tournament-columns" className="max-w-7xl mx-auto w-full pt-8 pb-4">
        <div className="bg-white border-[3px] border-slate-900 rounded-[2.5rem] p-6 lg:p-8 shadow-[8px_8px_0_#1f2937] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-400 border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f2937] flex items-center justify-center rotate-3 shrink-0">
              <Trophy size={36} className="text-white fill-white stroke-[2.5px]" />
            </div>
            <div>
              <span className="text-xs font-black bg-purple-100 text-purple-700 px-3 py-1 rounded-full border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937] uppercase tracking-wider">Giải Đấu Tuần Mới</span>
              <h1 className="text-3xl lg:text-4xl font-black text-slate-900 mt-2 mb-1">{tournament.name}</h1>
              <p className="text-sm font-bold text-slate-500">{tournament.description || 'Tham gia luyện tập bộ 5 câu hỏi để vinh danh và nhận thưởng XP cực khủng.'}</p>
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="bg-rose-100 border-[2.5px] border-slate-900 rounded-[2rem] px-6 py-4 shadow-[4px_4px_0_#1f2937] flex items-center gap-4 shrink-0 -rotate-1 self-stretch md:self-auto justify-center">
            <Timer size={32} className="text-rose-600 animate-pulse" />
            <div>
              <p className="text-[10px] font-black uppercase text-rose-500 tracking-wider">Thời gian còn lại</p>
              <p className="text-xl font-black text-slate-900 tabular-nums">{timeLeftStr || '00:00:00'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── TWO COLUMN LAYOUT ── */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        {/* LEFT COLUMN: Challenges set (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border-[3px] border-slate-900 rounded-[2.5rem] p-6 lg:p-8 shadow-[6px_6px_0_#1f2937]">
            <div className="flex items-center justify-between border-b-[2px] border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937] flex items-center justify-center font-black text-blue-700 text-sm">5</div>
                <h3 className="text-xl font-black text-slate-900">Bộ Câu Hỏi Phát Âm Tuần Này</h3>
              </div>
              <span className="text-xs font-black bg-slate-100 border-[1.5px] border-slate-900 px-3 py-1 rounded-full shadow-[2px_2px_0_#1f2937] text-slate-700">
                {tournament.userProgress?.challengesCompleted ?? 0}/5 Hoàn thành
              </span>
            </div>

            {/* Challenges list */}
            <div className="space-y-4">
              {tournament.challenges?.map((c: any, index: number) => {
                const theme = REGION_THEMES[c.region] ?? REGION_THEMES.BAC
                const score = c.userHighScore ?? 0
                const isCompleted = score > 0

                return (
                  <div
                    key={c.id}
                    className="border-[2.5px] border-slate-900 rounded-[2rem] p-5 bg-white transition-all shadow-[4px_4px_0_#1f2937] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1f2937] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl border-[2px] border-slate-900 flex items-center justify-center font-black text-slate-800 bg-slate-50 shadow-[2px_2px_0_#1f2937] shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span
                            className="text-[10px] font-black px-2.5 py-0.5 rounded-full border-[1.5px] border-slate-900 uppercase"
                            style={{ backgroundColor: theme.bg, color: theme.text }}
                          >
                            {theme.icon} {c.region === 'BAC' ? 'Giọng Bắc' : c.region === 'NAM' ? 'Giọng Nam' : 'Giọng Trung'}
                          </span>
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full border-[1.5px] border-slate-900 bg-indigo-50 text-indigo-700 uppercase">Speaking</span>
                        </div>
                        <p className="font-black text-slate-800 text-lg leading-tight truncate">
                          {c.contentText}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-stretch md:self-auto justify-between md:justify-end border-t-[1.5px] md:border-none border-slate-100 pt-3 md:pt-0">
                      {/* Score indicator */}
                      <div className="text-right">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Kỷ lục của bạn</p>
                        <p className={clsx("font-black text-base italic", isCompleted ? "text-emerald-600" : "text-slate-400")}>
                          {isCompleted ? `${score} Điểm` : 'Chưa thử'}
                        </p>
                      </div>

                      {/* CTA Button */}
                      <button
                        onClick={() => startPractice(c)}
                        className={clsx(
                          "px-5 py-2.5 rounded-xl border-[2px] border-slate-900 font-black text-xs shadow-[2px_2px_0_#1f2937] active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5",
                          isCompleted
                            ? "bg-slate-50 text-slate-800 hover:bg-slate-100"
                            : "bg-[#49B6E5] text-white hover:bg-[#3FA1CD]"
                        )}
                      >
                        {isCompleted ? 'Luyện lại' : 'Luyện ngay'} <Play size={12} fill="currentColor" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* User Score Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 border-[3px] border-slate-900 rounded-[2.5rem] p-6 lg:p-8 text-white shadow-[6px_6px_0_#1f2937] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 text-white/5 rotate-12">
              <Trophy size={160} />
            </div>
            <div className="space-y-2 z-10 text-center md:text-left">
              <h4 className="text-2xl font-black italic">Điểm Thi Đấu Của Bạn</h4>
              <p className="text-indigo-100 text-xs font-bold">Hãy tối đa điểm số của cả 5 câu để vươn lên đứng đầu bảng xếp hạng tuần!</p>
            </div>
            <div className="flex gap-4 z-10 w-full md:w-auto">
              <div className="flex-1 bg-white/10 backdrop-blur-sm border-[2px] border-white/20 rounded-2xl p-4 text-center">
                <p className="text-[9px] font-black uppercase text-indigo-200 tracking-wider">Tổng điểm tuần</p>
                <p className="text-3xl font-black italic text-amber-300">{tournament.userProgress?.totalXp ?? 0} XP</p>
              </div>
              <div className="flex-1 bg-white/10 backdrop-blur-sm border-[2px] border-white/20 rounded-2xl p-4 text-center">
                <p className="text-[9px] font-black uppercase text-indigo-200 tracking-wider">Độ chính xác TB</p>
                <p className="text-3xl font-black italic text-sky-200">{tournament.userProgress?.averageScore ? Math.round(Number(tournament.userProgress.averageScore)) : 0}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Tournament Leaderboard & History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border-[3px] border-slate-900 rounded-[2.5rem] p-6 lg:p-8 shadow-[6px_6px_0_#1f2937]">
            {/* Neo-Brutalism Tab Switcher */}
            <div className="flex border-[2.5px] border-slate-900 rounded-2xl overflow-hidden p-1 bg-slate-50 shadow-[3px_3px_0_#1f2937] mb-6">
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={clsx(
                  "flex-1 py-3 text-center text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2",
                  activeTab === 'leaderboard'
                    ? "bg-[#49B6E5] text-white border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937]"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <Trophy size={16} className={clsx(activeTab === 'leaderboard' && "fill-white")} />
                Bảng xếp hạng
              </button>
              <button
                onClick={() => {
                  setActiveTab('history')
                  loadHistory()
                }}
                className={clsx(
                  "flex-1 py-3 text-center text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2",
                  activeTab === 'history'
                    ? "bg-[#49B6E5] text-white border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937]"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <Clock size={16} />
                Mùa giải trước
              </button>
            </div>

            {activeTab === 'leaderboard' ? (
              leaderboard.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="text-5xl">👻</div>
                  <h4 className="text-lg font-black text-slate-800">Cổng đấu đang mở!</h4>
                  <p className="text-xs text-slate-400 font-bold">Hãy là người đầu tiên luyện tập và ghi danh lên bảng vàng tuần này!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Podium for top 3 */}
                  {top3.length > 0 && (
                    <div className="flex items-end justify-center gap-2 pt-6 pb-2 border-b-[2px] border-slate-50">
                      {orderedTop3.map((e: any, index: number) => {
                        const cfg = podConfig(e.rankPosition)
                        const isMe = user?.id === e.accountId
                        return (
                          <div key={e.accountId} className="flex flex-col items-center flex-1 max-w-[110px]">
                            <div className="mb-2 relative">
                              <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-10 scale-100">
                                {cfg.badge}
                              </div>
                              <Avatar
                                src={e.avatarUrl}
                                size={cfg.size}
                                className={clsx("bg-white", cfg.ring)}
                              />
                              {isMe && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-600 rounded-full border-[1.5px] border-slate-900 flex items-center justify-center z-10">
                                  <span className="text-white text-[9px] font-black">✓</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="text-center mb-2">
                              <p className="font-black text-slate-800 text-[10px] md:text-xs truncate max-w-[90px] leading-tight">
                                {e.fullName || 'Học viên'}
                              </p>
                            </div>

                            <div className={clsx(
                              "w-full rounded-t-2xl border-t-[2.5px] border-x-[2.5px] border-slate-900 flex flex-col items-center justify-center shadow-[3px_0_0_#1f2937,-3px_0_0_#1f2937] relative",
                              cfg.podBg,
                              cfg.podH
                            )}>
                              <span className="font-black text-slate-900 text-xl md:text-2xl leading-none">#{e.rankPosition}</span>
                              <span className="text-[10px] font-black text-slate-500 mt-1 tabular-nums">{e.totalXp} XP</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Rest of the table */}
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {rest.map((e: any, index: number) => {
                      const isMe = user?.id === e.accountId
                      return (
                        <div
                          key={e.accountId}
                          className={clsx(
                            "flex items-center gap-3 px-4 py-3 rounded-2xl border-[2px] border-slate-900 transition-all bg-white",
                            isMe ? "shadow-[3px_3px_0_#9333ea] border-purple-600 bg-purple-50/10" : "shadow-[3px_3px_0_#1f2937]"
                          )}
                        >
                          <div className={clsx(
                            "w-7 h-7 rounded-lg border-[1.5px] border-slate-900 flex items-center justify-center font-black text-xs shrink-0 shadow-[1px_1px_0_#1f2937]",
                            isMe ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-800"
                          )}>
                            {e.rankPosition}
                          </div>
                          <Avatar src={e.avatarUrl} size={32} className="border-[1.5px] border-slate-900 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-slate-800 text-xs truncate">{e.fullName || 'Học viên'}</p>
                            <p className="text-[9px] text-slate-400 font-bold">Hoàn thành: {e.challengesCompleted}/5 câu</p>
                          </div>
                          <div className="flex items-center gap-1 bg-amber-50 border-[1.5px] border-slate-900 px-2 py-1 rounded-xl shadow-[1.5px_1.5px_0_#1f2937] shrink-0">
                            <Star size={10} className="text-yellow-600 fill-yellow-600" />
                            <span className="font-black text-slate-800 text-xs tabular-nums">{e.totalXp} XP</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            ) : (
              // HISTORY TAB
              historyLoading ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-[#49B6E5] animate-spin mx-auto" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Đang nạp lịch sử giải đấu...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="text-5xl">🏝️</div>
                  <h4 className="text-lg font-black text-slate-800">Chưa có mùa giải trước!</h4>
                  <p className="text-xs text-slate-400 font-bold">Hãy thi đấu hết mình để ghi tên vào biên niên sử giải đấu nhé!</p>
                </div>
              ) : (
                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1">
                  {history.map((season: any) => {
                    const formattedDate = season.endsAt 
                      ? new Date(season.endsAt).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'N/A'

                    return (
                      <div 
                        key={season.id} 
                        className="border-[2.5px] border-slate-900 rounded-[2rem] p-5 bg-[#FFFDF9] shadow-[4px_4px_0_#1f2937] space-y-3"
                      >
                        <div className="border-b-[1.5px] border-slate-100 pb-2">
                          <h4 className="font-black text-slate-800 text-sm truncate leading-tight">
                            {season.name}
                          </h4>
                          <span className="inline-block text-[10px] font-bold text-slate-500 mt-1">
                            📅 Kết thúc: {formattedDate}
                          </span>
                        </div>

                        {/* Top 3 list on a mini podium */}
                        <div className="space-y-2.5 bg-slate-50 border-[1.5px] border-slate-900 rounded-2xl p-4 shadow-[2px_2px_0_#1f2937]">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200/50 pb-1.5 mb-2">
                            🏆 BẢNG VÀNG VINH DANH
                          </p>
                          {season.winners && season.winners.length > 0 ? (
                            season.winners.map((winner: any) => {
                              const isGold = winner.rankPosition === 1
                              const isSilver = winner.rankPosition === 2
                              const isBronze = winner.rankPosition === 3
                              return (
                                <div key={winner.email} className="flex items-center justify-between py-0.5">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-base shrink-0">
                                      {isGold ? '🥇' : isSilver ? '🥈' : '🥉'}
                                    </span>
                                    <Avatar src={winner.avatarUrl} size={22} className="border border-slate-900 shrink-0" />
                                    <span className="font-black text-slate-800 text-xs truncate max-w-[140px]">
                                      {winner.fullName || 'Học viên'}
                                    </span>
                                  </div>
                                  <span className={clsx(
                                    "font-black text-[10px] px-2.5 py-0.5 rounded-full border border-slate-900 shadow-[1px_1px_0_#1f2937] tabular-nums shrink-0",
                                    isGold ? "bg-yellow-100 text-yellow-800" : isSilver ? "bg-slate-100 text-slate-700" : "bg-orange-100 text-orange-800"
                                  )}>
                                    {winner.totalXp} XP
                                  </span>
                                </div>
                              )
                            })
                          ) : (
                            <p className="text-[11px] text-slate-400 font-bold italic">Không có dữ liệu thi đấu</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* ── ACTIVE PRACTICE MODAL ── */}
      <Modal
        open={isModalOpen}
        onCancel={() => {
          if (!isAnalyzing) {
            setIsModalOpen(false)
            recorder.resetRecording()
          }
        }}
        footer={null}
        width={600}
        centered
        className="brutal-modal"
        styles={{ body: { padding: 0 } }}
      >
        {activeChallenge && (
          <div className="bg-white rounded-[2.5rem] border-[3px] border-slate-900 overflow-hidden font-nunito">
            {/* Modal Header */}
            <div className="bg-[#BAE6FD] px-8 py-5 border-b-[3px] border-slate-900 flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-900 tracking-wider">Luyện Nói Giải Đấu Tuần</span>
              <span className="text-xs font-black bg-white border-[1.5px] border-slate-900 px-3 py-1 rounded-full shadow-[2px_2px_0_#1f2937] text-sky-700">
                Kỷ lục: {activeChallenge.userHighScore ?? 0} Điểm
              </span>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">
              {/* Target phrase card */}
              <div className="bg-[#FFFDF9] border-[2.5px] border-slate-900 rounded-[2rem] p-8 text-center shadow-[4px_4px_0_#1f2937]">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Mẫu câu phát âm</p>
                <h2 className="text-3xl font-black text-slate-900 leading-normal mb-4">
                  "{activeChallenge.contentText}"
                </h2>
              </div>

              {/* Recorder & mic button */}
              <div className="flex flex-col items-center justify-center space-y-3 py-4">
                <motion.button
                  whileHover={isAnalyzing ? {} : { scale: 1.05 }}
                  whileTap={isAnalyzing ? {} : { scale: 0.95 }}
                  disabled={isAnalyzing}
                  onClick={async () => {
                    if (recorder.isRecording) {
                      const audioBlob = await recorder.stopRecording()
                      if (audioBlob) {
                        handleRecordStop(audioBlob)
                      }
                    } else {
                      recorder.startRecording()
                    }
                  }}
                  className={clsx(
                    "w-24 h-24 rounded-full border-[3px] border-slate-900 shadow-[4px_4px_0_#1f2937] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center z-10 shrink-0",
                    recorder.isRecording
                      ? "bg-rose-500 text-white animate-pulse"
                      : "bg-[#49B6E5] text-white hover:bg-[#3FA1CD]"
                  )}
                >
                  <Mic size={40} className={clsx(recorder.isRecording && "scale-110")} />
                </motion.button>
                
                <p className="text-xs font-black uppercase text-slate-500 tracking-wider">
                  {recorder.isRecording 
                    ? `Đang thu âm (${recorder.durationSeconds} giây) - Click để dừng` 
                    : isAnalyzing 
                      ? 'AI Đang phân tích phát âm...' 
                      : 'Bấm micro để bắt đầu phát âm'}
                </p>

                {recorder.error && (
                  <p className="text-xs text-rose-500 font-bold text-center bg-rose-50 border border-rose-200 px-4 py-2 rounded-xl mt-2">{recorder.error}</p>
                )}
              </div>

              {/* AI evaluation result area */}
              {isAnalyzing && (
                <div className="bg-slate-50 border-[2px] border-slate-900 rounded-[2rem] p-6 text-center shadow-[3px_3px_0_#1f2937] animate-pulse">
                  <RefreshCw size={24} className="animate-spin text-slate-400 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-500">Giọng nói đang được phân tích bởi NVIDIA Parakeet & Groq AI...</p>
                </div>
              )}

              {aiResult && !isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-slate-50 border-[2.5px] border-slate-900 rounded-[2rem] p-6 shadow-[4px_4px_0_#1f2937]">
                    <div className="flex items-center justify-between border-b-[2px] border-slate-200/50 pb-3 mb-4">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Kết quả phân tích từ AI</span>
                      
                      <span className={clsx(
                        "text-xs font-black px-3.5 py-1 rounded-full border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937] uppercase",
                        aiResult.isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      )}>
                        {aiResult.isCorrect ? 'Đạt' : 'Chưa Đạt'}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 mb-4">
                      {/* Big accuracy score badge */}
                      <div className="w-20 h-20 rounded-2xl bg-white border-[2.5px] border-slate-900 shadow-[3px_3px_0_#1f2937] flex flex-col items-center justify-center shrink-0">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-tight leading-none">Chính xác</span>
                        <span className="text-2xl font-black italic text-slate-900 mt-1 tabular-nums">{aiResult.score}%</span>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Từ nghe được</p>
                        <p className="font-black text-slate-800 text-lg leading-snug italic truncate">
                          "{aiResult.transcription}"
                        </p>
                      </div>
                    </div>

                    {/* Feedback details */}
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Góp ý sửa đổi</p>
                      <p className="text-xs text-slate-600 font-bold leading-relaxed whitespace-pre-line bg-white/60 border border-slate-100 rounded-xl p-3.5 italic">
                        {aiResult.feedback}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-8 py-5 border-t-[3px] border-slate-900 flex justify-end gap-3">
              <button
                disabled={isAnalyzing}
                onClick={() => {
                  setIsModalOpen(false)
                  recorder.resetRecording()
                }}
                className="px-6 py-2.5 rounded-xl border-[2px] border-slate-900 bg-white hover:bg-slate-100 font-black text-xs shadow-[2px_2px_0_#1f2937] active:translate-y-0.5 active:shadow-none transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Global CSS custom settings for brutalist modals */}
      <style>{`
        .brutal-modal .ant-modal-content {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .brutal-modal .ant-modal-close {
          display: none !important;
        }
      `}</style>
    </div>
  )
}
