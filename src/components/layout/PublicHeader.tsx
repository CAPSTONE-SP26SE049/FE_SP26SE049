import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import logoImg from '../../assets/logoSpeakVN.png';

const PublicHeader = () => {
    const navigate = useNavigate();
    const { scrollY } = useScroll();

    const backgroundColor = useTransform(
        scrollY,
        [0, 40],
        ['rgba(251, 246, 239, 0.82)', 'rgba(251, 246, 239, 0.96)']
    );

    const backdropBlur = useTransform(
        scrollY,
        [0, 40],
        ['blur(8px)', 'blur(12px)']
    );

    return (
        <motion.header
            style={{ backgroundColor, backdropFilter: backdropBlur }}
            className="fixed left-0 right-0 top-0 z-50 px-6 py-4"
        >
            <div className="mx-auto max-w-[1400px]">
                <div className="flex items-center justify-between gap-4">
                    {/* Logo */}
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="group flex items-center text-left focus:outline-none"
                    >
                        <img
                            src={logoImg}
                            alt="SpeakVN Logo"
                            className="h-14 w-auto drop-shadow-[2px_2px_0_rgba(0,0,0,0.1)] transition-transform duration-200 group-hover:-translate-y-0.5"
                        />
                    </button>

                    {/* Navigation - Hidden for now as requested */}
                    <nav className="hidden xl:flex items-center gap-8">
                        {/* Nav items removed as per user request */}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="hidden md:block px-4 py-2 text-sm font-black text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-widest"
                        >
                            Đăng nhập
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/register')}
                            className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-black text-white shadow-[4px_4px_0_#49B6E5] transition-transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none uppercase tracking-widest"
                        >
                            Đăng ký
                        </button>

                        <button
                            type="button"
                            className="grid h-10 w-10 place-items-center rounded-full border-[2px] border-slate-900 bg-white text-slate-700 shadow-[3px_3px_0_#1f2937] xl:hidden"
                            aria-label="Open menu"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="7" x2="20" y2="7"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="17" x2="20" y2="17"></line></svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Hand-drawn style bottom line */}
            <div className="absolute left-0 right-0 bottom-0 px-6">
                <svg className="w-full h-1 text-slate-900/10" viewBox="0 0 1200 4" preserveAspectRatio="none">
                    <path
                        d="M0,2 Q300,3 600,2 T1200,2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />
                </svg>
            </div>
        </motion.header>
    );
};

export default PublicHeader;
