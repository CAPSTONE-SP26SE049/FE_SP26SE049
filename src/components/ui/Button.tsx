import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', fullWidth, ...props }, ref) => {
        const variants = {
            primary: 'bg-purple-600 hover:bg-purple-500 text-white border-purple-700',
            secondary: 'bg-white hover:bg-gray-50 text-orange-500 border-gray-200 border-b-4 active:border-b-2',
            danger: 'bg-red-500 hover:bg-red-400 text-white border-red-600',
            ghost: 'bg-transparent hover:bg-gray-100 text-gray-500 border-transparent shadow-none border-0 active:translate-y-0',
        };

        const sizes = {
            sm: 'py-2 px-4 text-sm',
            md: 'py-3 px-6 text-base',
            lg: 'py-4 px-8 text-lg',
        };

        return (
            <button
                ref={ref}
                className={cn(
                    'font-bold rounded-2xl border-b-4 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2',
                    variants[variant],
                    sizes[size],
                    fullWidth && 'w-full',
                    className
                )}
                {...props}
            />
        );
    }
);

Button.displayName = 'Button';
