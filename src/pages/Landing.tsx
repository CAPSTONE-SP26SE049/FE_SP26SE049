import { useNavigate, Link } from 'react-router-dom';
import {
    Mic,
    Award,
    Globe,
    Brain,
    ArrowRight,
    CheckCircle2,
    Sparkles,
    Zap,
    Volume2,
    Users,
    Compass
} from 'lucide-react';
import { motion } from 'framer-motion';
import PublicHeader from '../components/layout/PublicHeader';

const Landing = () => {
    const navigate = useNavigate();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
        }
    };

    return (
        <div className="min-h-screen bg-[#fbf6ef] flex flex-col font-nunito overflow-x-hidden selection:bg-[#49B6E5]/30">

            {/* Background Doodles */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <svg className="absolute top-[15%] left-[-5%] text-slate-900/5 rotate-12" width="300" height="300" viewBox="0 0 200 200">
                    <path d="M40,100 Q60,40 100,100 T160,100" fill="none" stroke="currentColor" strokeWidth="4" />
                    <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="10 10" />
                </svg>
                <svg className="absolute bottom-[10%] right-[-5%] text-slate-900/5 -rotate-12" width="400" height="400" viewBox="0 0 200 200">
                    <rect x="50" y="50" width="100" height="100" rx="20" fill="none" stroke="currentColor" strokeWidth="4" />
                    <path d="M20,20 L40,40 M160,160 L180,180" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
                <div className="absolute top-[20%] right-[10%] w-64 h-64 bg-[#49B6E5]/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[20%] left-[10%] w-80 h-80 bg-orange-400/10 rounded-full blur-[120px]" />
            </div>

            <PublicHeader />

            <main className="flex-1 pt-32 pb-20 relative z-10">
                {/* Hero Section */}
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                        className="space-y-8 text-center lg:text-left"
                    >
                        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-white border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f2937] text-slate-900 font-black text-xs uppercase tracking-widest">
                            <Sparkles size={16} className="text-orange-500" strokeWidth={3} />
                            <span>Học Tiếng Việt Theo Cách Mới</span>
                        </motion.div>

                        <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl xl:text-8xl font-black text-slate-900 leading-[1.05] tracking-tight uppercase">
                            Nói Chuẩn <br />
                            <span className="relative inline-block">
                                <span className="relative z-10 text-[#49B6E5]">Bản Xứ</span>
                                <svg className="absolute -bottom-2 left-0 w-full h-4 text-orange-400/40 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                                    <path d="M0,5 Q25,0 50,5 T100,5" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                                </svg>
                            </span>
                            <br /> Vui Nhộn
                        </motion.h1>

                        <motion.p variants={itemVariants} className="text-lg md:text-xl text-slate-600 font-bold leading-relaxed max-w-xl mx-auto lg:mx-0">
                            Không còn nỗi lo nói ngọng hay sai dấu. Chinh phục mọi phương ngữ Bắc - Trung - Nam với công nghệ AI nhận diện giọng nói chính xác.
                        </motion.p>

                        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                            <button
                                onClick={() => navigate('/register')}
                                className="group relative w-full sm:w-auto h-16 px-10 bg-[#49B6E5] text-white rounded-2xl border-[3px] border-slate-900 shadow-[6px_6px_0_#1f2937] font-black text-lg uppercase tracking-widest transition-all hover:-translate-y-1 hover:shadow-[10px_10px_0_#1f2937] active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-3"
                            >
                                Bắt đầu ngay
                                <ArrowRight size={22} strokeWidth={3} className="transition-transform group-hover:translate-x-1" />
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full sm:w-auto h-16 px-10 bg-white text-slate-900 rounded-2xl border-[3px] border-slate-900 shadow-[6px_6px_0_#1f2937] font-black text-lg uppercase tracking-widest transition-all hover:-translate-y-1 hover:shadow-[10px_10px_0_#1f2937] active:translate-y-0.5 active:shadow-none flex items-center justify-center"
                            >
                                Đăng nhập
                            </button>
                        </motion.div>

                        <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-xl bg-white border-[2.5px] border-slate-900 shadow-[2px_2px_0_#1f2937] flex items-center justify-center overflow-hidden">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="user" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col items-start">
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(i => <Zap key={i} size={14} className="fill-orange-400 text-orange-400" />)}
                                </div>
                                <span className="text-slate-500 text-xs font-black uppercase tracking-widest mt-1">
                                    <span className="text-slate-900">10,000+</span> người dùng tin tưởng
                                </span>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Interactive Graphics */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="relative hidden lg:block"
                    >
                        <div className="relative w-full aspect-square max-w-[550px] mx-auto">
                            {/* Main Display Card */}
                            <motion.div
                                animate={{ y: [-15, 15, -15] }}
                                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-80 bg-white rounded-[3rem] border-[4px] border-slate-900 shadow-[15px_15px_0_#1f2937] flex flex-col items-center justify-between p-8 z-20 overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-2 bg-[#49B6E5]" />

                                <div className="w-28 h-28 rounded-3xl bg-slate-50 border-[3px] border-slate-900 shadow-[6px_6px_0_#00000010] flex items-center justify-center relative group">
                                    <Mic size={48} className="text-[#49B6E5]" strokeWidth={2.5} />
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-orange-400 border-[2.5px] border-slate-900 flex items-center justify-center text-white"
                                    >
                                        <Volume2 size={16} strokeWidth={3} />
                                    </motion.div>
                                </div>

                                <div className="space-y-4 w-full">
                                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border-[2px] border-slate-900">
                                        <motion.div
                                            initial={{ width: "0%" }}
                                            animate={{ width: "85%" }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="h-full bg-[#49B6E5]"
                                        />
                                    </div>
                                    <div className="text-center font-black text-slate-900 uppercase tracking-widest text-sm">
                                        Độ chính xác: 85%
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-slate-900" />
                                    <div className="w-3 h-3 rounded-full bg-slate-200" />
                                    <div className="w-3 h-3 rounded-full bg-slate-200" />
                                </div>
                            </motion.div>

                            {/* Floating Stats */}
                            <motion.div
                                animate={{ y: [10, -10, 10], rotate: [5, 2, 5] }}
                                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                                className="absolute top-4 -right-4 w-52 p-5 bg-white rounded-3xl border-[3px] border-slate-900 shadow-[8px_8px_0_#1f2937] z-30"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-500 border-[2.5px] border-slate-900">
                                        <Compass size={24} strokeWidth={3} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 text-sm uppercase leading-none mb-1">Lộ trình</h4>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">3 Miền Việt Nam</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                animate={{ y: [-5, 15, -5], rotate: [-4, -1, -4] }}
                                transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 0.5 }}
                                className="absolute bottom-10 -left-10 w-52 p-5 bg-white rounded-3xl border-[3px] border-slate-900 shadow-[8px_8px_0_#1f2937] z-30"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-500 border-[2.5px] border-slate-900">
                                        <Award size={24} strokeWidth={3} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 text-sm uppercase leading-none mb-1">Thành tích</h4>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">15 Huy hiệu mới</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Decorative Circles */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] border-[2px] border-slate-900/10 rounded-full border-dashed animate-[spin_30s_linear_infinite]" />
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[85%] h-[85%] border-[2px] border-slate-900/10 rounded-full border-dashed animate-[spin_20s_linear_infinite_reverse]" />
                        </div>
                    </motion.div>
                </div>

                {/* Features Section */}
                <section className="py-32 px-6 overflow-hidden">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-20 space-y-4">
                            <h2 className="text-sm font-black text-[#49B6E5] uppercase tracking-[0.3em]">Ưu điểm vượt trội</h2>
                            <h3 className="text-4xl md:text-5xl font-black text-slate-900 uppercase">Tại sao chọn SpeakVN?</h3>
                            <div className="w-24 h-2 bg-orange-400 mx-auto rounded-full" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                            {[
                                {
                                    icon: <Globe size={40} />,
                                    color: "bg-blue-50 text-[#49B6E5]",
                                    title: "Chuẩn Hóa Vùng Miền",
                                    desc: "Hệ thống bài tập chuyên sâu hỗ trợ sửa lỗi phát âm đặc trưng Bắc - Trung - Nam, giúp bạn tự tin giao tiếp ở bất kỳ đâu."
                                },
                                {
                                    icon: <Brain size={40} />,
                                    color: "bg-purple-50 text-purple-500",
                                    title: "AI Phân Tích Thông Minh",
                                    desc: "Công nghệ nhận diện giọng nói tiên tiến giúp phân tích từng âm tiết, chỉ ra lỗi sai và hướng dẫn cách đặt lưỡi, khẩu hình chuẩn."
                                },
                                {
                                    icon: <Zap size={40} />,
                                    color: "bg-orange-50 text-orange-500",
                                    title: "Học Qua Trò Chơi",
                                    desc: "Tích lũy kinh nghiệm, mở khóa huy hiệu và leo bảng xếp hạng. Biến việc học Tiếng Việt trở thành một cuộc phiêu lưu thú vị."
                                }
                            ].map((feature, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="group relative bg-white p-10 rounded-[2.5rem] border-[3px] border-slate-900 shadow-[10px_10px_0_#1f2937] hover:-translate-y-2 transition-all duration-300"
                                >
                                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-8 border-[3px] border-slate-900 shadow-[4px_4px_0_#1f2937] ${feature.color} group-hover:scale-110 transition-transform`}>
                                        {feature.icon}
                                    </div>
                                    <h4 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tight leading-none">{feature.title}</h4>
                                    <p className="text-slate-500 font-bold leading-relaxed text-sm">
                                        {feature.desc}
                                    </p>

                                    {/* Doodle decoration on card hover */}
                                    <div className="absolute -top-4 -right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" className="text-orange-400">
                                            <path d="M10,20 Q20,10 30,20 T40,20" strokeWidth="3" />
                                        </svg>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Integration / How it works Section (Simplified) */}
                <section className="py-20 px-6 bg-slate-900 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                        <Users size={300} strokeWidth={1} />
                    </div>

                    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
                        <div className="w-full lg:w-1/2 space-y-8">
                            <h2 className="text-4xl md:text-5xl font-black uppercase leading-tight">
                                Giải pháp <br />
                                <span className="text-[#49B6E5]">Học tập Toàn Diện</span>
                            </h2>
                            <div className="space-y-6">
                                {[
                                    "Hệ thống lộ trình cá nhân hóa theo trình độ",
                                    "Kho từ vựng và mẫu câu đa dạng, thực tế",
                                    "Theo dõi tiến độ học tập chi tiết từng âm tiết",
                                    "Cộng đồng người học năng động, hỗ trợ lẫn nhau"
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#49B6E5] flex items-center justify-center border-[2px] border-white">
                                            <CheckCircle2 size={18} strokeWidth={3} />
                                        </div>
                                        <span className="font-bold text-lg text-slate-300">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="w-full lg:w-1/2 grid grid-cols-2 gap-6">
                            <div className="space-y-6 pt-12">
                                <div className="aspect-[4/5] bg-white rounded-[2rem] border-[3px] border-white shadow-[10px_10px_0_#49B6E530] overflow-hidden group">
                                    <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt="community" />
                                </div>
                                <div className="p-6 bg-[#49B6E5] rounded-[2rem] border-[3px] border-white text-white">
                                    <h5 className="font-black text-2xl uppercase mb-2">3000+</h5>
                                    <p className="font-bold text-xs uppercase tracking-widest opacity-80">Bài học mới mỗi tháng</p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="p-6 bg-orange-400 rounded-[2rem] border-[3px] border-white text-white">
                                    <h5 className="font-black text-2xl uppercase mb-2">98%</h5>
                                    <p className="font-bold text-xs uppercase tracking-widest opacity-80">Hài lòng về kết quả</p>
                                </div>
                                <div className="aspect-[4/5] bg-white rounded-[2rem] border-[3px] border-white shadow-[10px_10px_0_#orange-400/30] overflow-hidden group">
                                    <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt="learning" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-32 px-6">
                    <div className="max-w-5xl mx-auto group">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            viewport={{ once: true }}
                            className="bg-white rounded-[3rem] border-[4px] border-slate-900 shadow-[15px_15px_0_#1f2937] p-12 md:p-20 text-center relative overflow-hidden"
                        >
                            {/* Decorative background stripes */}
                            <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-[#49B6E5] via-orange-400 to-purple-500" />

                            <div className="relative z-10 space-y-10">
                                <div className="mx-auto w-20 h-20 rounded-3xl bg-green-50 border-[3px] border-slate-900 shadow-[6px_6px_0_#16a34a] flex items-center justify-center text-green-600 mb-8">
                                    <Zap size={40} strokeWidth={3} />
                                </div>

                                <div className="space-y-4">
                                    <h2 className="text-4xl md:text-6xl font-black text-slate-900 uppercase leading-[1.1]">
                                        Sẵn sàng để <br />
                                        <span className="text-[#49B6E5]">Làm Chủ</span> Tiếng Việt?
                                    </h2>
                                    <p className="text-slate-500 font-bold text-lg md:text-xl max-w-2xl mx-auto">
                                        Tham gia cùng hơn 10,000 học viên khác và thay đổi giọng nói của bạn ngay từ hôm nay.
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                                    <button
                                        onClick={() => navigate('/register')}
                                        className="h-16 px-12 bg-slate-900 text-white rounded-2xl border-[3px] border-slate-900 shadow-[8px_8px_0_#49B6E5] font-black text-xl uppercase tracking-widest transition-all hover:-translate-y-1 hover:shadow-[10px_10px_0_#49B6E5] active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-3"
                                    >
                                        Bắt đầu học ngay
                                        <ArrowRight size={24} strokeWidth={3} />
                                    </button>
                                </div>

                                <div className="pt-8 flex items-center justify-center gap-10 grayscale opacity-40">
                                    <div className="font-black text-2xl text-slate-900">Apple</div>
                                    <div className="font-black text-2xl text-slate-900">Google</div>
                                    <div className="font-black text-2xl text-slate-900">Microsoft</div>
                                </div>
                            </div>

                            {/* Doodle corners */}
                            <div className="absolute bottom-6 left-6 opacity-20">
                                <svg width="100" height="100" viewBox="0 0 100 100">
                                    <path d="M10,90 Q50,0 90,90" fill="none" stroke="currentColor" strokeWidth="4" />
                                </svg>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>

            {/* Simple Footer */}
            <footer className="py-12 px-6 border-t-[3px] border-slate-100">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black">S</div>
                        <span className="font-black text-2xl uppercase tracking-tighter text-slate-900">SpeakVN</span>
                    </div>

                    <div className="flex gap-8">
                        {['Điều khoản', 'Bảo mật', 'Liên hệ'].map(link => (
                            <Link key={link} to="#" className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
                                {link}
                            </Link>
                        ))}
                    </div>

                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                        &copy; 2024 SpeakVN Journey. Cùng bạn vươn xa.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
