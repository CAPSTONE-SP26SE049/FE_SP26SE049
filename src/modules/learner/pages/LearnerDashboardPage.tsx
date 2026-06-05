import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { LockOutlined, PlayCircleFilled, RightOutlined, TrophyOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight, Gamepad2, Leaf, Map, Target, Trophy, Zap } from 'lucide-react'

import { useAuth } from '../../../core/auth/AuthContext'
import apiClient from '../../../services/apiClient'
import { learnerService } from '../services/learnerService'
import { useAudioRecorder } from '../../../hooks/useAudioRecorder'
import '@google/model-viewer'

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
                src?: string
                alt?: string
                'camera-controls'?: boolean | string
                'auto-rotate'?: boolean | string
                'shadow-intensity'?: string
                exposure?: string
                'camera-orbit'?: string
                'field-of-view'?: string
                'interaction-prompt'?: string
                'animation-name'?: string
                autoplay?: boolean | string
                'animation-crossfade-duration'?: string
                loading?: string
                style?: React.CSSProperties
            }, HTMLElement>
        }
    }
}

export default function Dashboard() {
    const { session, updateSessionItem } = useAuth()
    const navigate = useNavigate()
    const user = session?.user

    const [currentLesson, setCurrentLesson] = useState<any>({
        title: 'Lộ trình của bạn',
        description: 'Bài học • Màn 1',
        progress: 0,
        id: null,
        dialectId: null,
        locked: false,
    })
    const [allBadges, setAllBadges] = useState<any[]>([])
    const [badgePage, setBadgePage] = useState(0)
    const [lessonLoading, setLessonLoading] = useState(true)
    const [badgesLoading, setBadgesLoading] = useState(true)

    // Daily Challenges States
    const [dailyChallenges, setDailyChallenges] = useState<any[]>([])
    const [dailyLoading, setDailyLoading] = useState(true)
    const [selectedChallenge, setSelectedChallenge] = useState<any | null>(null)
    const [dailyCompletedIds, setDailyCompletedIds] = useState<string[]>([])
    
    // Recording & Speaking Evaluation States
    const recorder = useAudioRecorder()
    const [isEvaluating, setIsEvaluating] = useState(false)
    const [evaluationFeedback, setEvaluationFeedback] = useState<any | null>(null)
    const [celebrationVisible, setCelebrationVisible] = useState(false)

    const badgesFetched = useRef(false)
    const lessonFetched = useRef(false)
    const BADGES_PER_PAGE = 16

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

    const handleSubmitChallenge = async (challengeId: string) => {
        if (!recorder.audioBlob) return;
        setIsEvaluating(true);
        setEvaluationFeedback(null);
        
        try {
            const formData = new FormData();
            formData.append('audio', new File([recorder.audioBlob], 'recording.webm', { type: 'audio/webm' }));
            
            const region = (user?.region || 'SOUTH').toUpperCase();
            let dialectStr = 'NAM';
            if (region === 'NORTH') dialectStr = 'BAC';
            else if (region === 'CENTRAL') dialectStr = 'TRUNG';
            
            formData.append('dialect', dialectStr);
            
            const res = await apiClient.post(`/daily-challenges/${challengeId}/submit`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            const result = res?.data ?? res;
            if (result) {
                setEvaluationFeedback(result);
                
                const evaluation = result.evaluation || {};
                const isCorrect = evaluation.isCorrect || (evaluation.accuracy && evaluation.accuracy >= 80);
                
                if (isCorrect) {
                    const newCompleted = [...new Set([...dailyCompletedIds, challengeId])];
                    setDailyCompletedIds(newCompleted);
                    
                    const todayStr = new Date().toISOString().split('T')[0];
                    localStorage.setItem('speakvn_daily_completed', JSON.stringify({
                        date: todayStr,
                        ids: newCompleted
                    }));
                    
                    if (result.completedAllToday) {
                        setCelebrationVisible(true);
                    }
                }
            }
        } catch (err) {
            console.error('Failed to submit daily challenge:', err);
            setEvaluationFeedback({
                evaluation: {
                    accuracy: 0,
                    feedback: 'Không thể kết nối đến máy chủ AI chấm điểm. Vui lòng thử lại!',
                    detectedError: 'Lỗi kết nối'
                }
            });
        } finally {
            setIsEvaluating(false);
        }
    };

    useEffect(() => {
        const loadDailyChallenges = async () => {
            try {
                const todayStr = new Date().toISOString().split('T')[0];
                
                // Fetch completed challenges and list in parallel
                const [completedRes, res] = await Promise.all([
                    apiClient.get('/daily-challenges/completed').catch(err => {
                        console.warn('Failed to load completed challenges from database, falling back to localStorage:', err);
                        return null;
                    }),
                    apiClient.get('/daily-challenges').catch(err => {
                        console.error('Failed to load daily challenges:', err);
                        return null;
                    })
                ]);

                let completedIds: string[] = [];
                let fetchedFromDb = false;
                
                if (completedRes) {
                    const dbIds = completedRes?.data?.data ?? completedRes?.data ?? completedRes ?? [];
                    if (Array.isArray(dbIds)) {
                        completedIds = dbIds.map(String);
                        fetchedFromDb = true;
                    }
                }

                if (fetchedFromDb) {
                    setDailyCompletedIds(completedIds);
                    localStorage.setItem('speakvn_daily_completed', JSON.stringify({
                        date: todayStr,
                        ids: completedIds
                    }));
                } else {
                    // LocalStorage fallback
                    const storedData = localStorage.getItem('speakvn_daily_completed');
                    if (storedData) {
                        try {
                            const parsed = JSON.parse(storedData);
                            if (parsed.date === todayStr) {
                                setDailyCompletedIds(parsed.ids || []);
                            } else {
                                localStorage.removeItem('speakvn_daily_completed');
                            }
                        } catch (e) {
                            localStorage.removeItem('speakvn_daily_completed');
                        }
                    }
                }
                
                if (res) {
                    const list = res?.data ?? res?.data?.data ?? res ?? [];
                    setDailyChallenges(Array.isArray(list) ? list : []);
                }
            } catch (err) {
                console.error('Failed to load daily challenges:', err);
            } finally {
                setDailyLoading(false);
            }
        };
        
        loadDailyChallenges();
    }, []);

    useEffect(() => {
        if (badgesFetched.current) return
        badgesFetched.current = true

        apiClient.get('/learner/my-badges')
            .then((res: any) => {
                const list = res?.data?.data ?? res?.data ?? res ?? []
                setAllBadges(Array.isArray(list) ? list : [])
            })
            .catch(() => { })
            .finally(() => setBadgesLoading(false))
    }, [])

    useEffect(() => {
        if (lessonFetched.current) return
        lessonFetched.current = true

        const loadLesson = async () => {
            try {
                apiClient.get('/users/me')
                    .then((res: any) => {
                        const data = res?.data?.data ?? res?.data
                        if (data && updateSessionItem) {
                            updateSessionItem({
                                totalStars: data.totalStars ?? data.totalStar ?? 0,
                                streak: data.streak ?? data.currentStreakDays ?? 0,
                            })
                        }
                    })
                    .catch(() => { })

                // ─── PRIORITIZE CUSTOM LEARNING PATH ───
                let customPathLoaded = false;
                try {
                    const customPathRes = await apiClient.get('/learner/custom-path');
                    const customPath = customPathRes?.data ?? customPathRes;
                    
                    if (customPath && customPath.isActive && customPath.levels && customPath.levels.length > 0) {
                        let activeQuiz: any = null;
                        let activeLevelName = '';
                        
                        const hasQuizzes = customPath.levels.some((l: any) => l.quizzes && l.quizzes.length > 0);
                        
                        if (hasQuizzes) {
                            for (const level of customPath.levels) {
                                const incomplete = level.quizzes.find((q: any) => !q.isCompleted);
                                if (incomplete) {
                                    activeQuiz = incomplete;
                                    activeLevelName = level.levelName;
                                    break;
                                }
                            }
                        } else {
                            activeQuiz = {
                                quizId: customPath.levels[0].levelId,
                                title: customPath.levels[0].levelName,
                                score: 0,
                                isCompleted: false
                            };
                            activeLevelName = customPath.levels[0].levelName;
                        }
                        
                        if (activeQuiz) {
                            let totalQuizzes = 0;
                            let completedQuizzes = 0;
                            
                            customPath.levels.forEach((l: any) => {
                                if (l.quizzes && l.quizzes.length > 0) {
                                    l.quizzes.forEach((q: any) => {
                                        totalQuizzes++;
                                        if (q.isCompleted) completedQuizzes++;
                                    });
                                } else {
                                    totalQuizzes++;
                                    if (l.isCompleted) completedQuizzes++;
                                }
                            });
                            
                            const progressPercent = totalQuizzes > 0 ? Math.round((completedQuizzes / totalQuizzes) * 100) : 0;
                            
                            setCurrentLesson({
                                title: activeQuiz.title,
                                description: `Lộ trình cá nhân hóa • ${activeLevelName}`,
                                progress: progressPercent,
                                id: activeQuiz.quizId,
                                dialectId: null,
                                locked: false,
                                isCustom: true,
                                customPathId: customPath.id
                            });
                            customPathLoaded = true;
                        }
                    }
                } catch (e) {
                    console.log('No active custom learning path found, falling back to standard regional roadmap.', e);
                }

                if (!customPathLoaded) {
                    const dialects = await learnerService.getDialects().catch(() => [])
                    if (!dialects.length) return

                    const userRegion = (user?.region || 'SOUTH').toUpperCase()
                    const dialect = dialects.find((d: any) => {
                        const n = d.name?.toUpperCase() ?? ''
                        if (userRegion === 'NORTH') return n.includes('BẮC') || n === 'NORTH'
                        if (userRegion === 'CENTRAL') return n.includes('TRUNG') || n === 'CENTRAL'
                        return n.includes('NAM') || n === 'SOUTH'
                    }) ?? dialects[0]

                    if (!dialect) return

                    const levels = await learnerService.getLevels(dialect.id).catch(() => [])
                    const active = levels.find((l: any) => !l.isCompleted && !l.isLocked)

                    if (active) {
                        setCurrentLesson({
                            title: active.name,
                            description: `Bài học • Màn ${active.levelOrder || 1}`,
                            progress: active.starsEarned ? Math.round((active.starsEarned / 3) * 100) : 0,
                            id: active.id,
                            dialectId: dialect.id,
                            locked: false,
                            isCustom: false
                        })
                    } else if (levels.length > 0) {
                        setCurrentLesson({
                            title: 'Đã hoàn thành lộ trình!',
                            description: 'Tuyệt vời, bạn đã vượt qua tất cả!',
                            progress: 100,
                            id: levels[levels.length - 1].id,
                            dialectId: dialect.id,
                            locked: false,
                            isCustom: false
                        })
                    }
                }
            } catch {
            } finally {
                setLessonLoading(false)
            }
        }

        if (user) loadLesson()
        else setLessonLoading(false)
    }, [user?.id, updateSessionItem])

    const firstName = user?.fullName?.split(' ').slice(-1)[0] || 'Học viên'
    const totalBadgePages = Math.ceil(allBadges.length / BADGES_PER_PAGE)
    const currentBadges = allBadges.slice(badgePage * BADGES_PER_PAGE, (badgePage + 1) * BADGES_PER_PAGE)

    const quickActions = useMemo(() => ([
        { icon: Map, label: 'Lộ trình', desc: 'Bản đồ học', path: '/learner/roadmap', tint: '#263D5B', bg: '#f7f4ee' },
        { icon: Trophy, label: 'Xếp hạng', desc: 'Bảng điểm', path: '/learner/leaderboard', tint: '#D97706', bg: '#fff8ee' },
        { icon: Zap, label: 'Phát âm', desc: 'Luyện ngay', path: '/learner/pronunciation', tint: '#49B6E5', bg: '#eef9fe' },
        { icon: Gamepad2, label: 'Trò chơi', desc: 'Minigames', path: '/learner/minigames', tint: '#EC4899', bg: '#fdf2f8' },
        { icon: Target, label: 'Bạn bè', desc: 'Kết nối', path: '/learner/friends', tint: '#16A34A', bg: '#effaf3' },
    ]), [])

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#f8f3ea] text-slate-900">
            <div className="pointer-events-none absolute inset-0 z-0">
                <div className="absolute inset-0 opacity-55" style={{ backgroundImage: 'radial-gradient(#e6dccb 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                <div className="absolute inset-0 opacity-35" style={{ backgroundImage: 'linear-gradient(to right, rgba(38,61,91,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(38,61,91,0.05) 1px, transparent 1px)', backgroundSize: '96px 96px' }} />
                <div className="absolute -top-24 right-[-8%] h-80 w-80 rounded-full bg-[#49B6E5]/10 blur-3xl" />
                <div className="absolute bottom-[-10%] left-[-6%] h-96 w-96 rounded-full bg-[#f1c46f]/20 blur-3xl" />
            </div>

            <div className="relative z-10 mx-auto flex w-full max-w-none flex-col gap-6 px-6 lg:px-12 py-5">
                <section className="relative overflow-hidden rounded-[2.5rem] border-[3px] border-slate-900 bg-[#fbf6ef] shadow-[10px_10px_0_#1f2937]">
                    <div className="absolute inset-0 opacity-35" style={{ backgroundImage: 'linear-gradient(rgba(38,61,91,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(38,61,91,0.05) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
                    <div className="absolute left-6 top-6 h-5 w-5 rounded-full border-[3px] border-slate-900 bg-[#49B6E5]" />
                    <div className="absolute right-8 top-8 h-4 w-14 rotate-[-8deg] rounded-full bg-[#f1c46f]" />
                    <div className="relative grid gap-8 p-6 lg:grid-cols-[1.35fr_0.8fr] lg:p-8">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-3 rounded-full border-[3px] border-slate-900 bg-white px-4 py-2 shadow-[5px_5px_0_#1f2937]">
                                <Leaf size={16} className="text-[#49B6E5]" />
                                <span className="text-xs font-black uppercase tracking-[0.22em] text-slate-700">Learner dashboard</span>
                            </div>

                            <div className="max-w-3xl">
                                <p className="mb-3 text-sm font-semibold text-slate-600">Xin chào {firstName},</p>
                                <h1 className="font-serif text-4xl leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
                                    Học vui hơn với một giao diện <span className="relative ml-3 inline-block"><span className="relative z-10">phác thảo</span><span className="absolute inset-x-0 bottom-2 h-4 rotate-[-2deg] rounded-full bg-[#7dd3fc]" /></span>.
                                </h1>
                                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">Tiếp tục lộ trình, mở khóa huy hiệu và luyện tập theo phong cách doodle: nhẹ nhàng, rõ ràng, dễ dùng và có điểm nhấn.</p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button onClick={() => navigate(currentLesson.isCustom ? '/learner/custom-journey' : '/learner/roadmap')} className="group inline-flex items-center gap-3 rounded-2xl border-[3px] border-slate-900 bg-[#49B6E5] px-6 py-4 text-base font-black text-slate-900 shadow-[6px_6px_0_#1f2937] transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#49B6E5]/30">
                                    Đi tiếp lộ trình
                                    <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                                </button>
                                <button onClick={() => navigate('/learner/profile')} className="inline-flex items-center gap-3 rounded-2xl border-[3px] border-slate-900 bg-white px-6 py-4 text-base font-black text-slate-900 shadow-[6px_6px_0_#1f2937] transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-300">
                                    Xem hồ sơ
                                </button>
                            </div>
                        </div>

                        <div className="relative flex items-end justify-center lg:justify-end">
                            <div className="w-full max-w-sm rounded-[2rem] border-[3px] border-slate-900 bg-white p-5 shadow-[8px_8px_0_#1f2937]">
                                <div className="mb-4 flex items-center justify-between">
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Tiến độ hôm nay</span>
                                    <span className="rounded-full border-[2px] border-slate-900 bg-[#f1c46f] px-3 py-1 text-xs font-black">{currentLesson.progress}%</span>
                                </div>

                                <div className="rounded-[1.5rem] border-[3px] border-slate-900 bg-[#fffaf2] p-4">
                                    {lessonLoading ? (
                                        <div className="h-36 animate-pulse rounded-[1rem] bg-slate-100" />
                                    ) : (
                                        <div
                                            className={`${currentLesson.locked ? 'opacity-60 grayscale' : ''} cursor-pointer`}
                                            onClick={() => {
                                                if (currentLesson.locked) return;
                                                if (currentLesson.isCustom) {
                                                    navigate('/learner/custom-journey');
                                                } else {
                                                    navigate('/learner/roadmap', {
                                                        state: {
                                                            fromRoadmap: true,
                                                            dialectId: currentLesson.dialectId,
                                                            chapterId: currentLesson.id
                                                        }
                                                    });
                                                }
                                            }}
                                        >
                                            <div className="mb-3 flex items-center gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border-[3px] border-slate-900 bg-[#49B6E5]/20">
                                                    {currentLesson.locked ? <LockOutlined className="text-lg text-slate-500" /> : <PlayCircleFilled className="text-xl text-slate-900" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{currentLesson.description}</p>
                                                    <h2 className="text-lg font-black text-slate-900">{currentLesson.title}</h2>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="h-3 flex-1 overflow-hidden rounded-full border-[2px] border-slate-900 bg-white">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${currentLesson.progress}%` }}
                                                        transition={{ duration: 1, ease: 'easeOut' }}
                                                        className="h-full rounded-full bg-[#49B6E5]"
                                                    />
                                                </div>
                                                <span className="text-sm font-black">{currentLesson.progress}%</span>
                                            </div>

                                            <div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-slate-700">
                                                Tiếp tục học
                                                <RightOutlined style={{ fontSize: 11 }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 🌟 THỬ THÁCH PHÁT ÂM HÀNG NGÀY (DAILY CHALLENGES) */}
                <section className="relative overflow-hidden rounded-[2rem] border-[3px] border-slate-900 bg-[#fffdfa] p-6 lg:p-8 shadow-[8px_8px_0_#1f2937]">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border-[2px] border-slate-900 bg-[#fef9c3] px-3 py-1 text-xs font-black uppercase text-slate-800">
                                Nhiệm vụ hàng ngày
                            </div>
                            <h2 className="mt-2 text-2xl font-black text-slate-900 uppercase">Thử thách phát âm hôm nay</h2>
                            <p className="text-sm text-slate-600">Đọc to các mẫu câu dưới đây. Đạt độ chính xác từ 80% trở lên để vượt qua.</p>
                        </div>
                        <div className="rounded-2xl border-[2px] border-slate-900 bg-[#7dd3fc] px-4 py-2 text-center shadow-[3px_3px_0_#1f2937]">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">Tiến độ thử thách</p>
                            <p className="text-xl font-black text-slate-900">{dailyCompletedIds.length} / 3 ĐẠT SAO</p>
                        </div>
                    </div>

                    {dailyLoading ? (
                        <div className="grid gap-4 md:grid-cols-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-32 animate-pulse rounded-[1.5rem] border-2 border-slate-900 bg-slate-100" />
                            ))}
                        </div>
                    ) : dailyChallenges.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-3">
                            {dailyChallenges.map((challenge, idx) => {
                                const isCompleted = dailyCompletedIds.includes(challenge.id);
                                return (
                                    <div
                                        key={challenge.id || idx}
                                        className={`flex flex-col justify-between rounded-[1.5rem] border-[3px] border-slate-900 p-5 shadow-[4px_4px_0_#1f2937] transition-all ${
                                            isCompleted ? 'bg-[#f0fdf4]' : 'bg-[#fffaf2]'
                                        }`}
                                    >
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                                                CÂU HỎI {idx + 1}
                                            </span>
                                            <p className="mt-2 font-serif text-lg font-bold leading-snug text-slate-900 line-clamp-3">
                                                "{challenge.contentText}"
                                            </p>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            {isCompleted ? (
                                                <span className="rounded-full border-2 border-slate-900 bg-emerald-500 px-3 py-1 text-xs font-black text-white">
                                                    ĐÃ HOÀN THÀNH
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setSelectedChallenge(challenge);
                                                        setEvaluationFeedback(null);
                                                        recorder.resetRecording();
                                                    }}
                                                    className="rounded-full border-2 border-slate-900 bg-[#49B6E5] px-4 py-1.5 text-xs font-black text-slate-900 hover:bg-[#7dd3fc]"
                                                >
                                                    LUYỆN PHÁT ÂM
                                                </button>
                                            )}
                                            <span className="text-xs font-bold text-slate-500 uppercase">
                                                Độ khó phát âm: {challenge.difficultyTag || 'DỄ'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-[1.5rem] border-2 border-dashed border-slate-300 p-6 text-center text-slate-500">
                            Không có thử thách nào khả dụng hôm nay. Vui lòng quay lại sau!
                        </div>
                    )}
                </section>

                <section className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
                    <div className="rounded-[2rem] border-[3px] border-slate-900 bg-[#fffaf2] p-5 shadow-[8px_8px_0_#1f2937]">
                        <div className="mb-4 flex items-center justify-between gap-4">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900">Huy hiệu đã mở khóa</h3>
                                <p className="text-sm text-slate-600">Bộ sưu tập nhỏ để ghi nhận tiến bộ của bạn.</p>
                            </div>

                            <div className="flex items-center gap-2">
                                {totalBadgePages > 1 && (
                                    <div className="flex items-center gap-1 rounded-full border-2 border-slate-900 bg-white px-2 py-1 shadow-[3px_3px_0_#1f2937]">
                                        <button onClick={() => setBadgePage((p) => Math.max(0, p - 1))} disabled={badgePage === 0} className="grid h-8 w-8 place-items-center rounded-full border-[2px] border-slate-900 bg-[#f7f2ea] text-slate-900 disabled:opacity-30">
                                            <ChevronLeft size={14} />
                                        </button>
                                        <span className="px-2 text-xs font-black text-slate-600">{badgePage + 1}/{totalBadgePages}</span>
                                        <button onClick={() => setBadgePage((p) => Math.min(totalBadgePages - 1, p + 1))} disabled={badgePage === totalBadgePages - 1} className="grid h-8 w-8 place-items-center rounded-full border-[2px] border-slate-900 bg-[#f7f2ea] text-slate-900 disabled:opacity-30">
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                )}

                                <button onClick={() => navigate('/learner/profile')} className="inline-flex items-center gap-2 rounded-full border-[2px] border-slate-900 bg-[#f1c46f] px-4 py-2 text-sm font-black text-slate-900 shadow-[4px_4px_0_#1f2937]">
                                    Xem tất cả
                                    <RightOutlined style={{ fontSize: 10 }} />
                                </button>
                            </div>
                        </div>

                        {badgesLoading ? (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {[...Array(8)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-[1.25rem] border-2 border-slate-900 bg-slate-100" />)}
                            </div>
                        ) : allBadges.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {currentBadges.map((b, i) => {
                                    const bData = b?.badge ?? b
                                    const imgUrl = bData?.iconUrl || bData?.imageUrl || bData?.icon_url

                                    return (
                                        <motion.div key={b.id || i} whileHover={{ y: -3, rotate: -1 }} className="rounded-[1.25rem] border-2 border-slate-900 bg-white p-3 text-center shadow-[4px_4px_0_#1f2937]">
                                            <div className="mx-auto mb-2 grid h-14 w-14 place-items-center rounded-2xl border-2 border-slate-900 bg-[#f1c46f]/30">
                                                {imgUrl ? <img src={imgUrl} alt={bData?.name} className="h-10 w-10 object-contain" /> : <TrophyOutlined className="text-2xl text-[#D97706]" />}
                                            </div>
                                            <div className="text-sm font-black leading-snug text-slate-800 line-clamp-2">{bData?.name || 'Huy hiệu'}</div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="rounded-[1.25rem] border-2 border-dashed border-slate-300 bg-white p-5">
                                <div className="flex items-center gap-3">
                                    <div className="grid h-12 w-12 place-items-center rounded-2xl border-2 border-slate-900 bg-[#f1c46f]/30">
                                        <TrophyOutlined className="text-xl text-[#D97706]" />
                                    </div>
                                    <div>
                                        <div className="text-base font-black text-slate-900">Chưa có huy hiệu</div>
                                        <p className="text-sm text-slate-600">Hoàn thành các bài học để mở khóa danh hiệu đầu tiên.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="overflow-hidden rounded-[2rem] border-[3px] border-slate-900 bg-[#263D5B] p-5 text-white shadow-[8px_8px_0_#1f2937]">
                            <div className="mb-3 inline-flex rounded-full border-2 border-white/30 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-white/80">Mục tiêu hôm nay</div>
                            <h3 className="text-2xl font-black leading-tight">Hoàn thành bài học mới để giữ nhịp học tập.</h3>
                            <p className="mt-3 text-sm leading-7 text-white/80">Một bước nhỏ mỗi ngày sẽ giúp lộ trình của bạn luôn trôi chảy và rõ ràng.</p>
                            <button onClick={() => navigate(currentLesson.isCustom ? '/learner/custom-journey' : '/learner/roadmap')} className="mt-5 inline-flex items-center gap-2 rounded-2xl border-2 border-slate-900 bg-[#7dd3fc] px-5 py-3 text-sm font-black text-slate-900 shadow-[5px_5px_0_#111827] transition-transform hover:-translate-y-0.5">
                                Bắt đầu ngay
                                <ArrowRight size={18} />
                            </button>
                        </div>

                        <div className="rounded-[2rem] border-[3px] border-slate-900 bg-[#fffaf2] p-5 shadow-[8px_8px_0_#1f2937]">
                            <div className="mb-4">
                                <h3 className="text-2xl font-black text-slate-900">Truy cập nhanh</h3>
                                <p className="text-sm text-slate-600">Đi thẳng tới phần bạn cần mà không phải tìm lại.</p>
                            </div>
                             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                {quickActions.map(({ icon: Icon, label, desc, path, tint, bg }) => (
                                    <motion.button key={label} whileHover={{ y: -2 }} onClick={() => navigate(path)} className="rounded-[1.25rem] border-2 border-slate-900 p-4 text-left shadow-[4px_4px_0_#1f2937] transition-transform" style={{ background: bg }}>
                                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-slate-900 bg-white">
                                            <Icon size={18} style={{ color: tint }} />
                                        </div>
                                        <div className="text-sm font-black" style={{ color: tint }}>{label}</div>
                                        <div className="mt-1 text-xs font-medium text-slate-500">{desc}</div>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* 🎤 OVERLAY MODAL LUYỆN PHÁT ÂM */}
            {selectedChallenge && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                    <div className="relative w-full max-w-xl rounded-[2.5rem] border-[3px] border-slate-900 bg-[#fbf6ef] p-6 lg:p-8 shadow-[10px_10px_0_#1f2937] animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => {
                                setSelectedChallenge(null);
                                setEvaluationFeedback(null);
                                recorder.resetRecording();
                            }}
                            className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full border-2 border-slate-900 bg-white font-black text-slate-900 shadow-[3px_3px_0_#1f2937] active:translate-y-0.5"
                        >
                            X
                        </button>

                        <div className="mb-4">
                            <span className="inline-block rounded-full border-2 border-slate-900 bg-[#fef9c3] px-3 py-1 text-[10px] font-black uppercase text-slate-700">
                                Thử thách hàng ngày
                            </span>
                            <h3 className="mt-2 text-xl font-black text-slate-900 uppercase">Luyện Tập Phát Âm</h3>
                        </div>

                        {/* Mẫu câu để đọc */}
                        <div className="my-6 rounded-2xl border-[3px] border-slate-900 bg-white p-5 text-center shadow-[4px_4px_0_#1f2937]">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">ĐỌC TO MẪU CÂU NÀY</p>
                            <p className="mt-3 font-serif text-2xl font-bold leading-relaxed text-slate-900">
                                "{selectedChallenge.contentText}"
                            </p>
                            {selectedChallenge.phoneticTranscriptionIpa && (
                                <p className="mt-2 text-sm font-semibold tracking-wide text-[#49B6E5]">
                                    /{selectedChallenge.phoneticTranscriptionIpa}/
                                </p>
                            )}
                        </div>

                        {/* Recording Panel */}
                        <div className="flex flex-col items-center justify-center py-4">
                            {recorder.isRecording ? (
                                <div className="text-center">
                                    <div className="mb-4 flex items-center justify-center gap-1.5">
                                        {[...Array(6)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-1.5 rounded-full bg-rose-500 animate-bounce"
                                                style={{
                                                    height: `${Math.random() * 24 + 10}px`,
                                                    animationDelay: `${i * 0.15}s`,
                                                    animationDuration: '0.6s'
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs font-black uppercase text-rose-500 animate-pulse">
                                        Đang ghi âm... ({recorder.durationSeconds}s)
                                    </p>
                                    <button
                                        onClick={async () => {
                                            const blob = await recorder.stopRecording();
                                            if (blob) {
                                                // Handle stopped
                                            }
                                        }}
                                        className="mt-4 rounded-2xl border-[3px] border-slate-900 bg-rose-500 px-6 py-3 text-sm font-black text-white shadow-[4px_4px_0_#1f2937]"
                                    >
                                        DỪNG & CHẤM ĐIỂM
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    {recorder.audioUrl ? (
                                        <div className="space-y-4">
                                            <audio src={recorder.audioUrl} controls className="mx-auto border-2 border-slate-900 rounded-xl" />
                                            <div className="flex justify-center gap-3">
                                                <button
                                                    onClick={() => recorder.startRecording()}
                                                    className="rounded-2xl border-[3px] border-slate-900 bg-white px-5 py-3 text-xs font-black text-slate-900 shadow-[3px_3px_0_#1f2937]"
                                                >
                                                    GHI ÂM LẠI
                                                </button>
                                                <button
                                                    disabled={isEvaluating}
                                                    onClick={() => handleSubmitChallenge(selectedChallenge.id)}
                                                    className="rounded-2xl border-[3px] border-slate-900 bg-[#10b981] px-5 py-3 text-xs font-black text-white shadow-[3px_3px_0_#1f2937] disabled:opacity-50"
                                                >
                                                    {isEvaluating ? 'ĐANG CHẤM ĐIỂM...' : 'NỘP BÀI NÓI'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => recorder.startRecording()}
                                            className="rounded-2xl border-[3px] border-slate-900 bg-[#f1c46f] px-8 py-4 text-base font-black text-slate-900 shadow-[5px_5px_0_#1f2937] transition-all hover:-translate-y-0.5"
                                        >
                                            BẮT ĐẦU GHI ÂM
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* AI Evaluation Results */}
                        {isEvaluating && (
                            <div className="mt-4 text-center">
                                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                                <p className="mt-2 text-xs font-black uppercase text-slate-500">AI đang phân tích giọng nói...</p>
                            </div>
                        )}

                        {evaluationFeedback && (
                            <div className="mt-6 rounded-2xl border-[3px] border-slate-900 bg-white p-5 shadow-[4px_4px_0_#1f2937] max-h-60 overflow-y-auto">
                                <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
                                    <span className="text-[10px] font-black uppercase text-slate-400">Kết quả đánh giá AI</span>
                                    <span className={`rounded-full border-[2.5px] border-slate-900 px-3 py-1 text-sm font-black ${
                                        (evaluationFeedback.evaluation?.accuracy || 0) >= 80 ? 'bg-[#d1fae5] text-emerald-700' : 'bg-[#fee2e2] text-rose-600'
                                    }`}>
                                        ĐỘ CHÍNH XÁC: {evaluationFeedback.evaluation?.accuracy || 0}%
                                    </span>
                                </div>
                                <div className="mt-3 space-y-2">
                                    {evaluationFeedback.evaluation?.azureTranscript && (
                                        <p className="text-sm font-bold text-slate-700">
                                            <span className="text-slate-400 font-bold">Từ nhận diện được: </span>
                                            "{evaluationFeedback.evaluation.azureTranscript}"
                                        </p>
                                    )}
                                    <p className="text-sm font-bold text-slate-800">
                                        <span className="text-slate-400 font-bold">Nhận xét: </span>
                                        {evaluationFeedback.evaluation?.feedback || 'Phát âm của bạn rất tốt! Hãy tiếp tục phát huy.'}
                                    </p>
                                    {evaluationFeedback.evaluation?.detectedError && (
                                        <p className="text-sm font-bold text-rose-500 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                                            <span className="font-black">Lỗi phát âm: </span>
                                            {evaluationFeedback.evaluation.detectedError}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {selectedChallenge && dailyCompletedIds.includes(selectedChallenge.id) && (
                            <div className="mt-6 flex flex-col items-center">
                                <p className="text-sm font-black text-emerald-600 mb-3">🎉 Tuyệt vời! Bạn đã vượt qua câu hỏi này!</p>
                                {dailyChallenges.find(c => c.id !== selectedChallenge.id && !dailyCompletedIds.includes(c.id)) ? (
                                    <button
                                        onClick={() => {
                                            const nextChallenge = dailyChallenges.find(
                                                c => c.id !== selectedChallenge.id && !dailyCompletedIds.includes(c.id)
                                            );
                                            if (nextChallenge) {
                                                setSelectedChallenge(nextChallenge);
                                                setEvaluationFeedback(null);
                                                recorder.resetRecording();
                                            }
                                        }}
                                        className="group w-full inline-flex items-center justify-center gap-3 rounded-2xl border-[3px] border-slate-900 bg-[#10b981] px-6 py-4 text-base font-black text-white shadow-[5px_5px_0_#1f2937] active:translate-y-0.5 active:shadow-none hover:-translate-y-0.5 transition-transform"
                                    >
                                        CHUYỂN SANG CÂU TIẾP THEO
                                        <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setSelectedChallenge(null);
                                            setEvaluationFeedback(null);
                                            recorder.resetRecording();
                                        }}
                                        className="w-full rounded-2xl border-[3px] border-slate-900 bg-[#49B6E5] py-4 text-base font-black text-slate-900 shadow-[5px_5px_0_#1f2937] hover:bg-[#7dd3fc] active:translate-y-0.5"
                                    >
                                        HOÀN THÀNH VÀ ĐÓNG THỬ THÁCH
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 🎉 CHÚC MỪNG HOÀN THÀNH TẤT CẢ THỬ THÁCH */}
            {celebrationVisible && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/75 p-4 backdrop-blur-sm">
                    <div className="relative w-full max-w-md rounded-[2.5rem] border-[3px] border-slate-900 bg-[#fbf6ef] p-8 text-center shadow-[12px_12px_0_#1f2937] animate-in fade-in zoom-in-95 duration-200">
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border-[3px] border-slate-900 bg-[#fef9c3] shadow-[4px_4px_0_#1f2937]">
                            <span className="text-3xl font-black">🌟</span>
                        </div>
                        <h3 className="text-2xl font-serif font-black leading-tight text-slate-900 uppercase">
                            Hoàn Thành Thử Thách!
                        </h3>
                        <p className="mt-4 text-base font-bold text-slate-700">
                            Tuyệt vời! Bạn đã xuất sắc hoàn thành trọn bộ 3 thử thách phát âm của ngày hôm nay.
                        </p>

                        <button
                            onClick={() => {
                                setCelebrationVisible(false);
                                setSelectedChallenge(null);
                                setEvaluationFeedback(null);
                            }}
                            className="w-full rounded-2xl border-[3px] border-slate-900 bg-[#10b981] py-4 text-base font-black text-white shadow-[4px_4px_0_#1f2937] hover:bg-[#059669] active:translate-y-0.5 active:shadow-none"
                        >
                            TIẾP TỤC HỌC TẬP
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
