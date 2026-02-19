
import { cn } from '../../lib/utils';

interface ProgressBarProps {
    value: number; // 0 to 100
    max?: number;
    color?: 'green' | 'yellow' | 'red' | 'blue';
    className?: string;
}

export const ProgressBar = ({ value, max = 100, color = 'green', className }: ProgressBarProps) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    const colors = {
        green: 'bg-brand-green',
        yellow: 'bg-brand-yellow',
        red: 'bg-brand-red',
        blue: 'bg-brand-blue',
    };

    return (
        <div className={cn("w-full bg-gray-200 rounded-full h-4 relative overflow-hidden", className)}>
            {/* Highlight/shine effect */}
            <div className="absolute top-1 left-2 right-2 h-[4px] bg-white/20 rounded-full z-10 pointer-events-none" />

            <div
                className={cn("h-full transition-all duration-500 ease-out rounded-full", colors[color])}
                style={{ width: `${percentage}%` }}
            />
        </div>
    );
};
