import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, Empty, Button, Typography } from 'antd';
import {
    ArrowLeftOutlined, StarFilled, LockFilled,
    CheckCircleFilled, RocketFilled, FlagFilled
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Headphones, Mic, PenTool, BookOpen, Sparkles } from '../../../lib/icons';
import { customPathService, type CustomPath, type PathQuiz } from '../../educator/services/customPathService';

const { Title, Text, Paragraph } = Typography;

/* ─── Skill meta matches RoadmapPage exactly ─────────────────────────── */
const SKILL_META: Record<string, { icon: any; color: string; bg: string; label: string }> = {
    LISTENING: { icon: Headphones, color: '#6366f1', bg: 'bg-indigo-100', label: 'Luyện nghe' },
    SPEAKING: { icon: Mic, color: '#f59e0b', bg: 'bg-amber-100', label: 'Luyện nói' },
    WRITING: { icon: PenTool, color: '#10b981', bg: 'bg-emerald-100', label: 'Luyện viết' },
    READING: { icon: BookOpen, color: '#ec4899', bg: 'bg-pink-100', label: 'Luyện đọc' },
    MIXED: { icon: Sparkles, color: '#f59e0b', bg: 'bg-yellow-100', label: 'Ôn tập' },
};

/* ─── RoadmapNode — same look as RoadmapPage's QuizRoadmapStep ─────────── */
const RoadmapNode = ({ node, index, onClick }: { node: any; index: number; onClick: () => void }) => {
    const [hovered, setHovered] = useState(false);
    const rawSkill = (node.skillType || node.quiz?.skillType || 'MIXED').toString().toUpperCase();
    const skill = SKILL_META[rawSkill] ?? SKILL_META['MIXED'];
    const SkillIcon = skill.icon;
    const isClickable = node.type !== 'locked';

    return (
        <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 w-44 flex flex-col items-center z-10"
            style={{ left: `${node.position.x * 200 + 100}px`, top: `${node.position.y}%` }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <motion.div
                whileHover={{ scale: isClickable ? 1.12 : 1.05 }}
                whileTap={{ scale: isClickable ? 0.92 : 1 }}
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: index * 0.07, type: 'spring', bounce: 0.4 }}
                onClick={isClickable ? onClick : undefined}
                className={clsx(
                    'relative w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-lg border-b-4 transition-all duration-300 backdrop-blur-md',
                    node.type === 'completed' && 'bg-white/90 border-b-gray-200 border border-gray-100',
                    node.type === 'active' && 'bg-white border-b-purple-400 ring-4 ring-purple-100 scale-110 shadow-purple-200',
                    node.type === 'locked' && 'bg-white/40 border-b-gray-300/30 border border-white/50 grayscale opacity-80 shadow-none',
                    isClickable ? 'cursor-pointer hover:rotate-3' : 'cursor-not-allowed',
                )}
            >
                {node.type === 'locked' ? (
                    <div className="w-12 h-12 rounded-2xl bg-gray-200/50 flex items-center justify-center">
                        <LockFilled className="text-gray-400/60 text-xl" />
                    </div>
                ) : (
                    <div className={clsx('w-13 h-13 rounded-2xl flex items-center justify-center shadow-inner', skill.bg)}>
                        <SkillIcon
                            size={24}
                            strokeWidth={2.5}
                            style={{ color: skill.color }}
                            className={node.type === 'active' ? 'animate-pulse' : ''}
                        />
                    </div>
                )}

                {node.type === 'completed' && (
                    <>
                        <div className="absolute -top-2 -right-2 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-md z-20">
                            <CheckCircleFilled className="text-white text-xs" />
                        </div>
                        <div className="absolute -bottom-5 flex gap-0.5 bg-white px-2 py-0.5 rounded-full border border-gray-100 shadow-sm">
                            {[...Array(3)].map((_, i) => (
                                <StarFilled key={i} className={clsx('text-[9px]', i < node.stars ? 'text-yellow-400' : 'text-gray-200')} />
                            ))}
                        </div>
                    </>
                )}

                {node.type === 'active' && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full border-2 border-white shadow-md animate-bounce" />
                )}

                {/* Hover tooltip */}
                {hovered && isClickable && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="absolute -top-14 bg-gray-800 text-white px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap z-50 font-bold text-xs"
                    >
                        {node.type === 'completed' ? 'Thử thách lại' : 'Bắt đầu ngay'}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45" />
                    </motion.div>
                )}
            </motion.div>

            <h3 className={clsx('mt-6 font-bold text-sm text-center leading-tight max-w-[130px]',
                node.type === 'locked' ? 'text-gray-300' : 'text-gray-700'
            )}>
                {node.title}
            </h3>
            {node.type !== 'locked' && (
                <div className={clsx('text-[10px] font-bold mt-0.5', node.type === 'active' ? 'text-purple-500' : 'text-gray-400')}>
                    {skill.label}
                </div>
            )}
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
                stars = 0; // Hides stars if it's locked, matching Godot behavior
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

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-[#f8f7ff]">
            <Spin size="large" />
        </div>
    );

    if (!path) return (
        <div className="p-8 min-h-screen bg-[#f8f7ff] flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-purple-100 rounded-3xl flex items-center justify-center mb-6">
                <RocketFilled className="text-purple-500 text-4xl" />
            </div>
            <Title level={3} className="!font-black text-slate-800">Chưa có lộ trình riêng</Title>
            <Paragraph className="max-w-md text-slate-500 font-medium h-12">
                Giáo viên của bạn chưa thiết lập lộ trình học tập cá nhân hóa cho bạn.
            </Paragraph>
            <Button type="primary" onClick={() => navigate('/learner/roadmap')}
                className="h-11 px-8 rounded-xl font-bold border-none shadow-lg shadow-purple-200 mt-4"
                style={{ background: '#9333ea' }}>
                Quay lại Hành trình chính
            </Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8f7ff]">

            {/* ── Breadcrumb header ── */}
            <div className="sticky top-0 z-20 bg-[#f8f7ff]/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 px-6 lg:px-8 py-4">
                    <button
                        onClick={() => navigate('/learner/roadmap')}
                        className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-purple-50 hover:border-purple-200 transition-all"
                    >
                        <ArrowLeftOutlined className="text-gray-600" />
                    </button>
                    <div>
                        <h2 className="font-black text-gray-800 text-base leading-tight">{path.title}</h2>
                        <p className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                            <FlagFilled className="text-orange-400" /> Lộ trình cá nhân từ Giảng viên
                        </p>
                    </div>
                </div>
            </div>

            <div className="w-full mx-auto">

                {/* ── Path banner ── */}
                <div className="max-w-4xl mx-auto px-6 mb-4 mt-6">
                    <div className="relative bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm p-4 md:p-6 flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 transform -rotate-3">
                            <Sparkles size={24} className="text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-purple-600 text-[10px] font-black tracking-widest uppercase mb-0.5">Lộ Trình Cá Nhân</p>
                            <p className="text-gray-500 text-xs font-medium italic line-clamp-2">
                                "{path.description}"
                            </p>
                        </div>
                        <div className="hidden sm:block text-right flex-shrink-0">
                            <p className="text-gray-300 text-xs font-bold">{roadmapNodes.length} bài học</p>
                        </div>
                    </div>
                </div>

                {/* ── Roadmap ── same structure as RoadmapPage QuizRoadmapStep ── */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .roadmap-scroll { overflow-x: auto; overflow-y: hidden; }
                    .roadmap-scroll::-webkit-scrollbar { height: 10px; }
                    .roadmap-scroll::-webkit-scrollbar-track { background: #f3e8ff; border-radius: 8px; margin: 0 24px; }
                    .roadmap-scroll::-webkit-scrollbar-thumb { background: #c084fc; border-radius: 8px; border: 2px solid #f3e8ff; }
                    .roadmap-scroll::-webkit-scrollbar-thumb:hover { background: #a855f7; }
                `}} />

                {roadmapNodes.length === 0 ? (
                    <div className="flex justify-center items-center h-40 bg-white rounded-2xl border border-gray-100 mx-6 mb-10">
                        <Empty description={<span className="text-gray-400 font-medium">Lộ trình chưa có bài học</span>} />
                    </div>
                ) : (
                    <div className="roadmap-scroll w-full pt-10 pb-14 px-6 mt-4">
                        <div
                            className="relative h-[260px] inline-flex"
                            style={{ width: `${roadmapNodes.length * 200 + 200}px`, minWidth: '100%' }}
                        >
                            {/* SVG dashed path */}
                            <svg
                                className="absolute top-0 left-0 pointer-events-none z-0"
                                style={{ width: `${roadmapNodes.length * 200 + 200}px`, height: '260px' }}
                                viewBox={`0 0 ${roadmapNodes.length * 200 + 200} 260`}
                                preserveAspectRatio="xMidYMid meet"
                            >
                                {roadmapNodes.map((node, i) => {
                                    if (i === 0) return null;
                                    const prev = roadmapNodes[i - 1];
                                    const prevX = prev.position.x * 200 + 100;
                                    const prevY = prev.position.y * 2.5;
                                    const nextX = node.position.x * 200 + 100;
                                    const nextY = node.position.y * 2.5;
                                    return (
                                        <path
                                            key={`path-${i}`}
                                            d={`M ${prevX} ${prevY} C ${prevX + 70} ${prevY}, ${nextX - 70} ${nextY}, ${nextX} ${nextY}`}
                                            fill="none"
                                            stroke={prev.type === 'completed' ? '#a855f7' : '#e5e7eb'}
                                            strokeWidth="5"
                                            strokeDasharray="14 10"
                                            strokeLinecap="round"
                                        />
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
