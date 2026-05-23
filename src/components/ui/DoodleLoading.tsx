import { motion } from 'framer-motion';
import { PenTool } from 'lucide-react';

export const DoodleLoading = ({ message = "Đang tải bài học..." }: { message?: string }) => {
    return (
        <div className="flex flex-col items-center justify-center py-20 w-full min-h-[300px]">
            <div className="relative w-24 h-24 mb-8">
                {/* Sketchy Circle background */}
                <svg className="absolute inset-0 w-full h-full text-[#49B6E5]/10" viewBox="0 0 100 100">
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray="20 10 5 15"
                    />
                </svg>

                {/* Spinning Pencil/Pen icon */}
                <motion.div
                    animate={{
                        rotate: 360,
                        x: [0, 8, -4, 4, 0],
                        y: [0, -4, 8, -2, 0]
                    }}
                    transition={{
                        rotate: { repeat: Infinity, duration: 4, ease: "linear" },
                        x: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                        y: { repeat: Infinity, duration: 1.7, ease: "easeInOut" }
                    }}
                    className="absolute inset-0 flex items-center justify-center text-[#49B6E5]"
                >
                    <div className="relative">
                        <div className="absolute -inset-4 bg-[#49B6E5]/10 rounded-full blur-xl animate-pulse" />
                        <PenTool size={48} strokeWidth={2.5} className="relative shadow-sm" />
                    </div>
                </motion.div>

                {/* Playful scribbles */}
                <motion.svg
                    animate={{ opacity: [0, 1, 0], pathLength: [0, 1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-10 -left-10 w-20 h-20 text-[#49B6E5]/30"
                    viewBox="0 0 100 100"
                >
                    <path
                        d="M10,90 Q50,10 90,90 T170,90"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                </motion.svg>
            </div>

            <div className="flex flex-col items-center gap-2">
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-slate-900 font-nunito font-black text-lg text-center"
                >
                    {message}
                </motion.p>
                <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.3, 1, 0.3]
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 1,
                                delay: i * 0.2
                            }}
                            className="w-2 h-2 bg-[#49B6E5] rounded-full"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
