import { useNavigate } from 'react-router-dom';
import { Star, Lock, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';

// Mock Data for Levels
const LEVELS = [
    { id: 1, type: 'lesson', title: 'Basics 1', position: 'center', status: 'completed', stars: 3 },
    { id: 2, type: 'lesson', title: 'N/L Distinction', position: 'left', status: 'active', stars: 0 },
    { id: 3, type: 'chest', title: 'Bonus', position: 'right', status: 'locked', stars: 0 },
    { id: 4, type: 'lesson', title: 'Tones 1', position: 'center', status: 'locked', stars: 0 },
    { id: 5, type: 'lesson', title: 'Consonants', position: 'left', status: 'locked', stars: 0 },
    { id: 6, type: 'checkpoint', title: 'Checkpoint 1', position: 'center', status: 'locked', stars: 0 },
];

const LevelNode = ({ level, onClick }: { level: any, onClick: () => void }) => {
    const isLocked = level.status === 'locked';
    const isCompleted = level.status === 'completed';
    const isActive = level.status === 'active';

    const getPositionClass = (pos: string) => {
        if (pos === 'left') return '-ml-16';
        if (pos === 'right') return '-mr-16';
        return '';
    };

    return (
        <div className={cn("relative flex flex-col items-center mb-8", getPositionClass(level.position))}>

            {/* Level Circle */}
            <div className="relative group">
                <button
                    onClick={onClick}
                    disabled={isLocked}
                    className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center border-b-4 transition-all transform",
                        isLocked
                            ? "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed"
                            : isCompleted
                                ? "bg-brand-yellow border-yellow-600 text-white active:translate-y-1 active:border-b-0"
                                : "bg-brand-green border-green-600 text-white active:translate-y-1 active:border-b-0 animate-pulse-slow"
                    )}
                >
                    {isLocked ? <Lock size={24} /> : isCompleted ? <Check size={32} strokeWidth={4} /> : <Star size={32} fill="currentColor" />}
                </button>

                {/* Floating Start Tooltip for Active Level */}
                {isActive && (
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white text-gray-700 font-bold py-2 px-4 rounded-xl shadow-lg border border-gray-200 whitespace-nowrap z-10 animate-bounce">
                        BẮT ĐẦU
                        <div className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-gray-200 rotate-45"></div>
                    </div>
                )}
            </div>

            {/* Level Title */}
            <div className="mt-2 font-bold text-gray-400 text-sm tracking-wide uppercase">
                {level.title}
            </div>

            {/* Stars for completed */}
            {isCompleted && (
                <div className="flex gap-1 mt-1">
                    {[...Array(level.stars)].map((_, i) => (
                        <div key={i} className="w-3 h-3 bg-brand-yellow rounded-full border border-yellow-600"></div>
                    ))}
                </div>
            )}
        </div>
    );
};

const Learn = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center pb-20 pt-10">

            {/* Unit Header */}
            <div className="w-full bg-brand-green rounded-2xl p-6 text-white mb-10 flex justify-between items-center shadow-lg border-b-4 border-green-600">
                <div>
                    <h2 className="text-2xl font-extrabold uppercase tracking-wide">Bài 1</h2>
                    <p className="text-green-100 font-medium">Cơ bản về giọng miền Bắc</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => navigate('/guide')}>
                    CẨM NANG
                </Button>
            </div>

            {/* Path */}
            <div className="flex flex-col items-center w-full max-w-sm relative">
                {/* SVG Path Background could go here, but using flex gap for simplicity now */}

                {LEVELS.map((level) => (
                    <LevelNode
                        key={level.id}
                        level={level}
                        onClick={() => {
                            if (level.status !== 'locked') {
                                navigate(`/practice/${level.id}`);
                            }
                        }}
                    />
                ))}
            </div>

            <div className="mt-10 text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center text-3xl opacity-50">
                    🏰
                </div>
                <p className="text-gray-400 font-bold uppercase">Locked Region</p>
                <p className="text-gray-500 font-bold">Central Vietnam</p>
            </div>

        </div>
    );
};

export default Learn;
