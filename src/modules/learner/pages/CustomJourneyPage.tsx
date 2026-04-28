import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Star, Lock,
    CheckCircle2, Rocket, Flag,
    ArrowLeft, Sparkles, Compass,
    Play
} from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Headphones, Mic, PenTool, BookOpen } from '../../../lib/icons';
import { customPathService, type CustomPath, type PathQuiz } from '../../educator/services/customPathService';
import { DoodleLoading } from '../../../components/ui/DoodleLoading';

/* ─── Skill meta matches RoadmapPage ────────────────────────────────── */
const SKILL_META: Record<string, { icon: any; color: string; bg: string; label: string }> = {
    LISTENING: { icon: Headphones, color: '#6366f1', bg: 'bg-indigo-100', label: 'Luyện nghe' },
    SPEAKING: { icon: Mic, color: '#f59e0b', bg: 'bg-amber-100', label: 'Luyện nói' },
    WRITING: { icon: PenTool, color: '#10b981', bg: 'bg-emerald-100', label: 'Luyện viết' },
    READING: { icon: BookOpen, color: '#ec4899', bg: 'bg-pink-100', label: 'Luyện đọc' },
    MIXED: { icon: Sparkles, color: '#f59e0b', bg: 'bg-yellow-100', label: 'Ôn tập' },
};

/* ─── RoadmapNode — Doodle Style ───────────────────────────────────────── */
const RoadmapNode = ({ node, index, onClick }: { node: any; index: number; onClick: () => void }) => {
    const rawSkill = (node.skillType || node.quiz?.skillType || 'MIXED').toString().toUpperCase();
    const skill = SKILL_META[rawSkill] ?? SKILL_META['MIXED'];
    const SkillIcon = skill.icon;
    const isClickable = node.type !== 'locked';

    return (
        <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 w-48 flex flex-col items-center z-10"
            style={{ left: `${node.position.x * 220 + 110}px`, top: `${node.position.y}%` }}
        >
            <motion.div
                whileHover={isClickable ? { y: -8, scale: 1.05 } : {}}
                whileTap={isClickable ? { scale: 0.95 } : {}}
                initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: index * 0.05, type: 'spring', bounce: 0.4 }}
                onClick={isClickable ? onClick : undefined}
                className={clsx(
                    'group relative w-24 h-24 rounded-[2.5rem] border-[3px] flex items-center justify-center transition-all duration-300',
                    node.type === 'completed' && 'bg-white border-slate-900 shadow-[6px_6px_0_#1f2937]',
                    node.type === 'active' && 'bg-white border-slate-900 shadow-[8px_8px_0_#49B6E5] ring-8 ring-[#49B6E5]/10',
                    node.type === 'locked' && 'bg-slate-100 border-slate-300 opacity-60 grayscale',
                    isClickable ? 'cursor-pointer' : 'cursor-not-allowed',
                )}
            >
                {node.type === 'locked' ? (
                    <div className="w-14 h-14 rounded-2xl bg-slate-200/50 flex items-center justify-center">
                        <Lock size={28} className="text-slate-400" strokeWidth={3} />
                    </div>
                ) : (
                    <div className={clsx('w-16 h-16 rounded-2xl flex items-center justify-center border-[2px] border-slate-900 shadow-[3px_3px_0_#00000010]', skill.bg)}>
                        <SkillIcon
                            size={32}
                            strokeWidth={3}
                            style={{ color: skill.color }}
                            className={node.type === 'active' ? 'animate-pulse' : ''}
                        />
                    </div>
                )}

                {node.type === 'completed' && (
                    <>
                        <div className="absolute -top-3 -right-3 w-10 h-10 bg-green-500 rounded-2xl border-[2.5px] border-slate-900 shadow-[3px_3px_0_#1f2937] flex items-center justify-center z-20">
                            <CheckCircle2 size={20} className="text-white" strokeWidth={3} />
                        </div>
                        <div className="absolute -bottom-8 flex gap-1 bg-white px-3 py-1.5 rounded-xl border-[2px] border-slate-900 shadow-[2px_2px_0_#1f2937]">
                            {[...Array(3)].map((_, i) => (
                                <Star
                                    key={i}
                                    size={12}
                                    className={clsx(i < node.stars ? 'fill-yellow-400 text-slate-800' : 'text-slate-200')}
                                    strokeWidth={3}
                                />
                            ))}
                        </div>
                    </>
                )}

                {node.type === 'active' && (
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-orange-400 rounded-2xl border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f2937] flex items-center justify-center animate-bounce">
                        <Play size={24} className="text-white fill-white" />
                    </div>
                )}
            </motion.div>

            <div className="mt-10 px-2 text-center space-y-1">
                <h3 className={clsx('font-black text-sm uppercase tracking-tight leading-tight max-w-[150px] font-nunito',
                    node.type === 'locked' ? 'text-slate-400' : 'text-slate-900'
                )}>
                    {node.title}
                </h3>
                {node.type !== 'locked' && (
                    <div className={clsx('text-[10px] font-black uppercase tracking-widest', node.type === 'active' ? 'text-[#49B6E5]' : 'text-slate-400')}>
                        {skill.label}
                    </div>
                )}
            </div>
        </div>
    );
};

/* ─── Page ──────────────────────────────────────────────────────────────── */
const CustomJourneyPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [path, setPath] = useState<CustomPath | null>(null);

    useEffect(() => {
        const fetchPath = async () => {
            try {
                const res = await customPathService.getMyCustomPath();
                setPath(res.data);
            } catch {
                // no path assigned
            } finally {
                setLoading(false);
            }
        };
        fetchPath();
    }, []);

    const roadmapNodes = useMemo(() => {
        if (!path) return [];
        const allQuizzes: (PathQuiz & { levelName: string; region: string })[] = [];
        path.levels.forEach(level => {
            level.quizzes.forEach(quiz => {
                allQuizzes.push({ ...quiz, levelName: level.levelName, region: level.region });
            });
        });

        return allQuizzes.map((quiz, index) => {
            let type: 'completed' | 'active' | 'locked' = 'locked';
            let stars = 0;
            if (quiz.score >= 80) stars = 3;
            else if (quiz.score >= 60) stars = 2;
            else if (quiz.score >= 40) stars = 1;

            let allPreviousCompleted = true;
            for (let j = 0; j < index; j++) {
                if (!allQuizzes[j].isCompleted) {
                    allPreviousCompleted = false;
                    break;
                }
            }

            if (allPreviousCompleted && quiz.isCompleted) {
                type = 'completed';
            } else if (allPreviousCompleted && !quiz.isCompleted) {
                type = 'active';
            } else {
                type = 'locked';
                stars = 0;
            }

            return {
                id: quiz.quizId,
                title: quiz.title,
                type,
                stars,
                skillType: (quiz.skillType || 'MIXED').toString().toUpperCase(),
                quiz,
                position: {
                    x: index,
                    y: index % 2 === 0 ? 50 : (index % 4 === 1 ? 25 : 75),
                },
            };
        });
    }, [path]);

    if (loading) return <DoodleLoading message="Đang tải lộ trình riêng của bạn..." />;

    if (!path) return (
        <div className="p-8 min-h-screen bg-[#fbf6ef] flex flex-col items-center justify-center text-center font-nunito">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-32 h-32 bg-white rounded-[2.5rem] border-[3px] border-slate-900 shadow-[10px_10px_0_#1f2937] flex items-center justify-center mb-8 relative"
            >
                <Rocket size={56} className="text-[#49B6E5]" strokeWidth={2.5} />
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-orange-400 rounded-2xl border-[2.5px] border-slate-900 shadow-[3px_3px_0_#1f2937] flex items-center justify-center text-white">
                    <Sparkles size={20} strokeWidth={3} />
                </div>
            </motion.div>

            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">Chưa có lộ trình riêng</h1>
            <p className="max-w-md text-slate-500 font-bold mb-10 leading-relaxed uppercase text-xs tracking-widest">
                Giảng viên chưa thiết lập lộ trình học tập cá nhân hóa dành riêng cho bạn. Hãy quay lại sau nhé!
            </p>

            <button
                onClick={() => navigate('/learner/roadmap')}
                className="h-14 px-8 bg-[#49B6E5] text-white rounded-2xl border-[3px] border-slate-900 shadow-[6px_6px_0_#1f2937] font-black uppercase tracking-widest transition-all hover:-translate-y-1 hover:shadow-[10px_10px_0_#1f2937] active:translate-y-0.5 active:shadow-none flex items-center gap-3"
            >
                <ArrowLeft size={20} strokeWidth={3} />
                Hành trình chính
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#fbf6ef] font-nunito pb-20">

            {/* ── Breadcrumb header ── */}
            <div className="sticky top-0 z-20 bg-[#fbf6ef]/90 backdrop-blur-md border-b-[3px] border-slate-900/5 px-6 lg:px-8 py-5">
                <div className="max-w-7xl mx-auto flex items-center gap-5">
                    <button
                        onClick={() => navigate('/learner/roadmap')}
                        className="w-12 h-12 rounded-2xl bg-white border-[2.5px] border-slate-900 shadow-[3px_3px_0_#1f2937] flex items-center justify-center hover:-translate-y-0.5 transition-all active:translate-y-0.5 active:shadow-none"
                    >
                        <ArrowLeft size={24} className="text-slate-900" strokeWidth={3} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-1">
                                <Flag size={12} strokeWidth={3} className="fill-orange-400" />
                                Lộ trình từ Giảng viên
                            </span>
                        </div>
                        <h2 className="font-black text-slate-900 text-xl uppercase tracking-tight leading-none">{path.title}</h2>
                    </div>
                </div>
            </div>

            <div className="w-full mx-auto max-w-7xl">

                {/* ── Path banner ── */}
                <div className="px-6 mb-8 mt-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative bg-white rounded-[2.5rem] border-[3px] border-slate-900 shadow-[10px_10px_0_#1f2937] overflow-hidden p-8 md:p-10 flex flex-col md:flex-row items-center gap-8"
                    >
                        <div className="w-24 h-24 bg-gradient-to-br from-[#49B6E5] to-indigo-500 rounded-[2rem] border-[3px] border-slate-900 shadow-[6px_6px_0_#1f2937] flex items-center justify-center flex-shrink-0 transform -rotate-3 overflow-hidden transition-transform hover:rotate-0">
                            <Sparkles size={40} className="text-white" strokeWidth={2.5} />
                            <div className="absolute inset-0 bg-white/10 opacity-50" />
                        </div>

                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div>
                                <p className="text-[#49B6E5] text-xs font-black tracking-[0.3em] uppercase mb-1">Cá Nhân Hóa</p>
                                <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase leading-none tracking-tight">Hành Trình Chinh Phục Của Bạn</h3>
                            </div>
                            <p className="text-slate-500 font-bold italic leading-relaxed text-sm md:text-base border-l-[4px] border-[#49B6E5]/20 pl-4 py-1">
                                "{path.description}"
                            </p>
                        </div>

                        <div className="flex-shrink-0 flex flex-col items-center gap-2">
                            <div className="px-6 py-3 rounded-2xl bg-slate-50 border-[2.5px] border-slate-900 shadow-[4px_4px_0_#00000010] flex flex-col items-center">
                                <span className="text-3xl font-black text-slate-900 leading-none">{roadmapNodes.length}</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Bài Học</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ── Roadmap — Sketchy Path ── */}
                {roadmapNodes.length === 0 ? (
                    <div className="px-6">
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border-[3px] border-slate-900 border-dashed opacity-50">
                            <Compass size={48} className="text-slate-300 mb-4" />
                            <span className="text-slate-400 font-black uppercase tracking-widest text-sm">Lộ trình chưa có bài học</span>
                        </div>
                    </div>
                ) : (
                    <div className="relative pt-16 pb-24 mt-6 overflow-x-auto roadmap-scroll">
                        <style dangerouslySetInnerHTML={{
                            __html: `
                            .roadmap-scroll::-webkit-scrollbar { height: 12px; }
                            .roadmap-scroll::-webkit-scrollbar-track { background: #fbf6ef; margin: 0 40px; }
                            .roadmap-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; border: 3px solid #fbf6ef; }
                            .roadmap-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                        `}} />

                        <div
                            className="relative h-[320px] inline-flex items-center"
                            style={{ width: `${roadmapNodes.length * 220 + 220}px`, minWidth: '1000px' }}
                        >
                            {/* Sketchy path SVG */}
                            <svg
                                className="absolute top-0 left-0 pointer-events-none z-0"
                                style={{ width: `${roadmapNodes.length * 220 + 220}px`, height: '320px' }}
                            >
                                {roadmapNodes.map((node, i) => {
                                    if (i === 0) return null;
                                    const prev = roadmapNodes[i - 1];
                                    const prevX = prev.position.x * 220 + 110;
                                    const prevY = prev.position.y * 3.2;
                                    const nextX = node.position.x * 220 + 110;
                                    const nextY = node.position.y * 3.2;

                                    const color = prev.type === 'completed' ? '#49B6E5' : '#e2e8f0';

                                    return (
                                        <g key={`path-group-${i}`}>
                                            {/* Shadow path */}
                                            <path
                                                d={`M ${prevX} ${prevY} C ${prevX + 80} ${prevY}, ${nextX - 80} ${nextY}, ${nextX} ${nextY}`}
                                                fill="none"
                                                stroke={color}
                                                strokeWidth="6"
                                                strokeLinecap="round"
                                                className="opacity-10 translate-y-1 translate-x-1"
                                            />
                                            {/* Main dashed path */}
                                            <path
                                                key={`path-${i}`}
                                                d={`M ${prevX} ${prevY} C ${prevX + 80} ${prevY}, ${nextX - 80} ${nextY}, ${nextX} ${nextY}`}
                                                fill="none"
                                                stroke={color}
                                                strokeWidth="4"
                                                strokeDasharray="1 10"
                                                strokeLinecap="round"
                                            />
                                            <circle cx={prevX + (nextX - prevX) * 0.4} cy={prevY + (nextY - prevY) * 0.4} r="3" fill={color} className="opacity-30" />
                                            <circle cx={prevX + (nextX - prevX) * 0.7} cy={prevY + (nextY - prevY) * 0.7} r="4" fill={color} className="opacity-30" />
                                        </g>
                                    );
                                })}
                            </svg>

                            {roadmapNodes.map((node, i) => (
                                <RoadmapNode
                                    key={node.id}
                                    node={node}
                                    index={i}
                                    onClick={() => navigate(`/learner/quiz/${node.id}?customPathId=${path.id}`)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomJourneyPage;
