import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, Empty, Button, Typography, message } from 'antd';
import {
    ArrowLeftOutlined, StarFilled, LockFilled,
    CheckCircleFilled, RocketFilled, FlagFilled
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Headphones, Mic, PenTool, BookOpen, Sparkles } from 'lucide-react';
import { customPathService, type CustomPath, type PathQuiz } from '../../educator/services/customPathService';

const { Title, Text, Paragraph } = Typography;

const SKILL_META: Record<string, { icon: any; color: string; bg: string; label: string }> = {
    LISTENING: { icon: Headphones, color: '#6366f1', bg: 'bg-indigo-100', label: 'Luyện nghe' },
    SPEAKING: { icon: Mic, color: '#f59e0b', bg: 'bg-amber-100', label: 'Luyện nói' },
    WRITING: { icon: PenTool, color: '#10b981', bg: 'bg-emerald-100', label: 'Luyện viết' },
    READING: { icon: BookOpen, color: '#ec4899', bg: 'bg-pink-100', label: 'Luyện đọc' },
};

const RoadmapNode = ({ node, index, onClick }: { node: any; index: number; onClick: () => void }) => {
    const skill = SKILL_META[node.quiz?.skillType] || SKILL_META.READING;
    const SkillIcon = skill.icon;
    const isClickable = node.type !== 'locked';

    return (
        <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 w-44 flex flex-col items-center z-10"
            style={{ left: `${node.position.x * 200 + 100}px`, top: `${node.position.y}%` }}
        >
            <motion.div
                whileHover={{ scale: isClickable ? 1.12 : 1 }}
                whileTap={{ scale: isClickable ? 0.92 : 1 }}
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: index * 0.08, type: 'spring', bounce: 0.4 }}
                onClick={isClickable ? onClick : undefined}
                className={clsx(
                    'relative w-20 h-20 rounded-[1.5rem] flex items-center justify-center shadow-lg border-b-4 transition-all duration-300',
                    node.type === 'completed' && 'bg-white border-b-gray-200',
                    node.type === 'active' && 'bg-white border-b-purple-300 ring-4 ring-purple-100 scale-110',
                    node.type === 'locked' && 'bg-gray-100 border-b-gray-200',
                    isClickable ? 'cursor-pointer hover:rotate-3' : 'cursor-not-allowed',
                )}
            >
                {node.type === 'locked' ? (
                    <LockFilled className="text-gray-300 text-2xl" />
                ) : (
                    <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center", skill.bg)}>
                        <SkillIcon
                            size={22}
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
            </motion.div>

            <h3 className={clsx('mt-6 font-bold text-sm text-center leading-tight max-w-[130px]',
                node.type === 'locked' ? 'text-gray-300' : 'text-gray-700'
            )}>
                {node.title}
            </h3>
        </div>
    );
};

const CustomJourneyPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [path, setPath] = useState<CustomPath | null>(null);

    useEffect(() => {
        const fetchPath = async () => {
            try {
                const res = await customPathService.getMyCustomPath();
                setPath(res.data);
            } catch (err) {
                // message.error('Bạn chưa có lộ trình riêng từ giáo viên');
            } finally {
                setLoading(false);
            }
        };
        fetchPath();
    }, []);

    const roadmapNodes = useMemo(() => {
        if (!path) return [];

        // Flatten all quizzes from all levels into a single sequential list
        const allQuizzes: (PathQuiz & { levelName: string; region: string })[] = [];
        path.levels.forEach(level => {
            level.quizzes.forEach(quiz => {
                allQuizzes.push({ ...quiz, levelName: level.levelName, region: level.region });
            });
        });

        return allQuizzes.map((quiz, index) => {
            let type: 'completed' | 'active' | 'locked' = 'locked';
            // Star calculation: 80% = 1 star, 90% = 2 stars, 100% = 3 stars
            let stars = 0;
            if (quiz.score >= 100) stars = 3;
            else if (quiz.score >= 90) stars = 2;
            else if (quiz.score >= 80) stars = 1;

            if (quiz.isCompleted) {
                type = 'completed';
            } else {
                // Standard Duolingo-style lock logic
                if (index === 0) {
                    type = 'active';
                } else {
                    const prev = allQuizzes[index - 1];
                    if (prev.isCompleted) {
                        type = 'active';
                    }
                }
            }

            return {
                id: quiz.quizId,
                title: quiz.title,
                type,
                stars,
                quiz,
                position: {
                    x: index,
                    y: index % 2 === 0 ? 50 : (index % 4 === 1 ? 25 : 75),
                },
            };
        });
    }, [path]);

    if (loading) return <div className="h-screen flex items-center justify-center bg-[#f8f7ff]"><Spin size="large" /></div>;

    if (!path) return (
        <div className="p-8 min-h-screen bg-[#f8f7ff] flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-purple-100 rounded-3xl flex items-center justify-center mb-6">
                <RocketFilled className="text-purple-500 text-4xl" />
            </div>
            <Title level={3} className="!font-black text-slate-800">Chưa có lộ trình riêng</Title>
            <Paragraph className="max-w-md text-slate-500 font-medium h-12">
                Giáo viên của bạn chưa thiết lập lộ trình học tập cá nhân hóa cho bạn.
                Hãy tiếp tục học theo hành trình mặc định nhé!
            </Paragraph>
            <Button type="primary" onClick={() => navigate('/learner/roadmap')} className="h-11 px-8 rounded-xl font-bold border-none shadow-lg shadow-purple-200 mt-4" style={{ background: '#9333ea' }}>
                Quay lại Hành trình chính
            </Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8f7ff] pb-20 overflow-hidden">
            {/* Header */}
            <div className="p-6 lg:p-8 max-w-5xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
                        <Sparkles size={24} className="text-white" />
                    </div>
                    <div>
                        <Title level={2} className="!m-0 !font-black !text-slate-800 tracking-tight">{path.title}</Title>
                        <Text type="secondary" className="font-bold flex items-center gap-2">
                            <FlagFilled className="text-orange-500" /> Được thiết kế riêng cho bạn bởi Giảng viên
                        </Text>
                    </div>
                </div>

                <Paragraph className="bg-white p-5 rounded-2xl border border-purple-100/50 shadow-sm text-slate-600 font-medium italic border-l-4 border-l-purple-500 mb-10">
                    "{path.description}"
                </Paragraph>

                {/* Roadmap Area */}
                <div className="relative">
                    <style dangerouslySetInnerHTML={{
                        __html: `
            .roadmap-scroll { overflow-x: auto; overflow-y: hidden; padding-top: 40px; padding-bottom: 60px; }
            .roadmap-scroll::-webkit-scrollbar { height: 10px; }
            .roadmap-scroll::-webkit-scrollbar-track { background: #f3e8ff; border-radius: 8px; }
            .roadmap-scroll::-webkit-scrollbar-thumb { background: #c084fc; border-radius: 8px; border: 2px solid #f3e8ff; }
            `
                    }} />
                    <div className="roadmap-scroll w-full">
                        <div className="relative h-[300px] inline-flex" style={{ width: `${roadmapNodes.length * 200 + 200}px`, minWidth: '100%' }}>
                            {/* SVG Path */}
                            <svg
                                className="absolute top-0 left-0 pointer-events-none z-0"
                                style={{ width: `${roadmapNodes.length * 200 + 200}px`, height: '300px' }}
                                viewBox={`0 0 ${roadmapNodes.length * 200 + 200} 300`}
                            >
                                {roadmapNodes.map((node, i) => {
                                    if (i === 0) return null;
                                    const prev = roadmapNodes[i - 1];
                                    const prevX = prev.position.x * 200 + 100;
                                    const prevY = prev.position.y * 3;
                                    const nextX = node.position.x * 200 + 100;
                                    const nextY = node.position.y * 3;

                                    return (
                                        <path
                                            key={`path-${i}`}
                                            d={`M ${prevX} ${prevY} C ${prevX + 70} ${prevY}, ${nextX - 70} ${nextY}, ${nextX} ${nextY}`}
                                            fill="none"
                                            stroke={prev.type === 'completed' ? '#a855f7' : '#e5e7eb'}
                                            strokeWidth="6"
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
                </div>
            </div>
        </div>
    );
};

export default CustomJourneyPage;
