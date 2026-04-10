import { useNavigate } from 'react-router-dom';
import { Mic, Map, Award, Globe, Brain, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';

const Landing = () => {
    const navigate = useNavigate();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5 }
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col font-nunito overflow-hidden">
            {/* Background Decoration */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-30"></div>
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl opacity-50 animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-3xl opacity-50 animate-pulse delay-700"></div>
            </div>

            {/* Header */}
            <header className="w-full border-b border-gray-100 py-4 px-6 fixed top-0 bg-white/80 backdrop-blur-md z-50">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white">
                            <Sparkles size={18} fill="currentColor" />
                        </div>
                        <div className="text-2xl font-extrabold text-purple-600 tracking-wide">SpeakVN</div>
                    </div>
                    <div className="hidden sm:flex items-center gap-4">
                        <Button variant="ghost" onClick={() => navigate('/login')} className="hover:bg-gray-100/50 font-bold">Đăng nhập</Button>
                        <Button variant="primary" onClick={() => navigate('/register')} className="shadow-lg shadow-purple-300/50 hover:shadow-purple-300 hover:-translate-y-0.5 transition-all font-bold">Bắt đầu</Button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1 pt-48 pb-20 flex justify-center px-6 relative z-10">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    {/* Left Content */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                        className="space-y-8 mt-12 md:mt-0"
                    >
                        <motion.div variants={itemVariants} className="inline-block px-4 py-1.5 rounded-full bg-purple-50 text-purple-600 font-bold text-sm tracking-wide border border-purple-100">
                            ✨ CÁCH MỚI ĐỂ HỌC TIẾNG VIỆT
                        </motion.div>

                        <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-extrabold text-gray-800 leading-[1.15]">
                            Học phát âm <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-orange-500">Chuẩn & Vui</span>
                        </motion.h1>

                        <motion.p variants={itemVariants} className="text-xl text-gray-500 font-medium leading-relaxed max-w-lg">
                            Không còn nỗi lo nói ngọng hay sai dấu. Cải thiện giọng nói mỗi ngày với các bài học ngắn gọn, thú vị và hiệu quả.
                        </motion.p>

                        <motion.div variants={itemVariants} className="flex flex-row gap-3 w-full sm:w-auto">
                            <Button
                                className="flex-1 sm:flex-none text-base sm:text-lg px-4 sm:px-8 py-4 shadow-xl shadow-purple-300/40 hover:shadow-purple-300/60 transition-all hover:scale-105 active:scale-95 font-extrabold whitespace-nowrap"
                                onClick={() => navigate('/register')}
                            >
                                Bắt đầu miễn phí
                            </Button>
                            <Button
                                variant="secondary"
                                className="flex-1 sm:flex-none text-base sm:text-lg px-4 sm:px-8 py-4 hover:bg-gray-50 border-2 font-bold text-gray-600 whitespace-nowrap"
                                onClick={() => navigate('/login')}
                            >
                                Đăng nhập
                            </Button>
                        </motion.div>

                        <motion.div variants={itemVariants} className="flex items-center gap-6 pt-4 text-gray-400 text-sm font-semibold">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center overflow-hidden">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="user" />
                                    </div>
                                ))}
                            </div>
                            <span>Được tin dùng bởi 10,000+ người học</span>
                        </motion.div>
                    </motion.div>

                    {/* Right Interactive Visual */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative hidden md:block"
                    >
                        <div className="relative w-full aspect-square max-w-[500px] mx-auto">
                            {/* Main Floating Card - Microphone */}
                            <motion.div
                                animate={{ y: [-10, 10, -10] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white rounded-[3rem] shadow-2xl border-4 border-gray-50 flex flex-col items-center justify-center z-20"
                            >
                                <div className="w-24 h-24 bg-purple-600/10 rounded-full flex items-center justify-center text-purple-600 mb-4">
                                    <Mic size={48} strokeWidth={2.5} />
                                </div>
                                <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden mb-2">
                                    <div className="h-full bg-purple-600 w-[85%] animate-pulse"></div>
                                </div>
                                <p className="font-bold text-gray-400 text-sm">Đang nghe...</p>
                            </motion.div>

                            {/* Floating Card - Map */}
                            <motion.div
                                animate={{ y: [10, -10, 10] }}
                                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                                className="absolute top-0 right-0 w-48 p-4 bg-white rounded-3xl shadow-xl border-2 border-gray-50 z-10 rotate-6 hover:rotate-0 transition-transform cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                                        <Map size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800">Hành Trình</h4>
                                        <p className="text-xs text-gray-500">Du lịch 3 miền</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Floating Card - Trophy */}
                            <motion.div
                                animate={{ y: [5, -15, 5] }}
                                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 0.5 }}
                                className="absolute bottom-10 left-0 w-48 p-4 bg-white rounded-3xl shadow-xl border-2 border-gray-50 z-30 -rotate-3 hover:rotate-0 transition-transform cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
                                        <Award size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800">Thành Tích</h4>
                                        <p className="text-xs text-gray-500">Mở khóa huy hiệu</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Decorative Elements */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-gray-200 rounded-full opacity-30 animate-[spin_10s_linear_infinite]"></div>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border border-gray-200 rounded-full opacity-30 animate-[spin_15s_linear_infinite_reverse]"></div>
                        </div>
                    </motion.div>
                </div>
            </main>

            {/* Features Section */}
            <section className="py-24 bg-gray-50 border-t border-gray-100 relative overflow-hidden">
                <div className="max-w-6xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-4">Tại sao chọn SpeakVN?</h2>
                        <p className="text-gray-500 text-lg max-w-2xl mx-auto">Chúng tôi kết hợp công nghệ AI tiên tiến với phương pháp học tập thú vị để giúp bạn tự tự tin giao tiếp.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Globe size={32} />,
                                color: "bg-blue-50 text-blue-500",
                                title: "Chuẩn Hóa Vùng Miền",
                                desc: "Sửa lỗi ngọng N/L, D/R đặc trưng của từng địa phương."
                            },
                            {
                                icon: <Brain size={32} />,
                                color: "bg-purple-50 text-purple-600",
                                title: "AI Phân Tích Giọng",
                                desc: "Công nghệ nhận diện giọng nói chỉ ra lỗi sai chính xác từng âm tiết."
                            },
                            {
                                icon: <Award size={32} />,
                                color: "bg-orange-50 text-orange-500",
                                title: "Học Qua Trò Chơi",
                                desc: "Hệ thống điểm thưởng, bảng xếp hạng giúp bạn luôn có động lực."
                            }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                            >
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${feature.color} group-hover:scale-110 transition-transform`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-extrabold text-gray-800 mb-3">{feature.title}</h3>
                                <p className="text-gray-500 leading-relaxed font-medium">
                                    {feature.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white pt-24 pb-12 border-t border-gray-100">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="bg-gradient-to-r from-purple-600 to-orange-500 rounded-[2.5rem] p-12 text-center text-white relative overflow-hidden shadow-2xl shadow-purple-200">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <div className="relative z-10 space-y-8">
                            <h2 className="text-3xl md:text-5xl font-extrabold">Sẵn sàng hoàn thiện giọng nói?</h2>
                            <p className="text-lg text-purple-50 max-w-xl mx-auto font-medium">Tham gia cùng hàng ngàn người học khác và bắt đầu hành trình chinh phục Tiếng Việt ngay hôm nay.</p>
                            <Button
                                size="lg"
                                className="text-xl px-12 py-6 bg-white text-purple-600 hover:bg-gray-50 border-none shadow-xl transform transition hover:scale-105"
                                onClick={() => navigate('/register')}
                            >
                                BẮT ĐẦU NGAY
                                <ArrowRight className="ml-2" />
                            </Button>
                        </div>
                    </div>

                    <div className="mt-16 text-center text-gray-400 font-semibold text-sm">
                        &copy; 2024 SpeakVN Journey. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
