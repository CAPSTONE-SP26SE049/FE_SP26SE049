import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, CheckCircle, ArrowRight, Square, Volume2, Sparkles, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import entrytestService from '../services/entrytestService';
import { useAuth } from '../core/auth/AuthContext';

const Entrytest = () => {
    const navigate = useNavigate();
    const { updateSessionItem } = useAuth();
    const [status, setStatus] = useState<'countdown' | 'idle' | 'listening' | 'processing' | 'result' | 'error'>('countdown');
    const [countdownValue, setCountdownValue] = useState<number>(3);
    const [suggestedRegion, setSuggestedRegion] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (status === 'countdown') {
            if (countdownValue > 0) {
                timer = setTimeout(() => {
                    setCountdownValue(prev => prev - 1);
                }, 1000);
            } else {
                startRecording();
            }
        }
        return () => clearTimeout(timer);
    }, [status, countdownValue]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());
                submitAudio(audioBlob);
            };

            mediaRecorder.start();
            setStatus('listening');
        } catch (err) {
            console.error("Microphone access error:", err);
            setStatus('error');
            setFeedback('Vui lòng cấp quyền truy cập Microphone để tiếp tục.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    const submitAudio = async (_blob: Blob) => {
        setStatus('processing');
        try {
            const dummyAudioUrl = `https://dummy-bucket.com/audio/entrytest-${Date.now()}.mp3`;
            const res = await entrytestService.submitEntrytest(dummyAudioUrl);
            
            if (res?.data) {
                setSuggestedRegion(res.data.suggestedRegion);
                setFeedback(res.data.feedback);
                setSelectedRegion(res.data.suggestedRegion); // Default to suggested
                setStatus('result');
            } else {
                throw new Error("Không nhận được dữ liệu");
            }
        } catch (err) {
            console.error("Entrytest error:", err);
            setStatus('error');
            setFeedback('Có lỗi xảy ra khi phân tích giọng. Vui lòng thử lại.');
        }
    };

    const handleMicClick = () => {
        if (status === 'idle' || status === 'error') {
            startRecording();
        } else if (status === 'listening') {
            stopRecording();
        }
    };

    const handleConfirmRegion = async () => {
        if (!selectedRegion) return;
        try {
            await entrytestService.selectRegion(selectedRegion);
            updateSessionItem({ region: selectedRegion });
            navigate('/learner/roadmap', { replace: true });
        } catch (err) {
            console.error("Select region error:", err);
            setStatus('error');
            setFeedback("Lỗi khi cập nhật vùng miền. Vui lòng thử lại!");
        }
    };

    return (
        <div className="min-h-[100dvh] bg-gradient-to-br from-green-50 via-teal-50/50 to-blue-50 flex flex-col items-center justify-center p-3 sm:p-4 relative overflow-hidden">
            {/* Soft decorative blur blobs in the background */}
            <div className="absolute top-[-10%] left-[-10%] w-[25rem] h-[25rem] bg-brand-green/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob"></div>
            <div className="absolute top-[-10%] right-[-10%] w-[25rem] h-[25rem] bg-teal-400/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob" style={{animationDelay: '2s'}}></div>
            <div className="absolute bottom-[-10%] left-[20%] w-[25rem] h-[25rem] bg-blue-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob" style={{animationDelay: '4s'}}></div>

            <style>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background-color: rgba(20, 184, 166, 0.2);
              border-radius: 20px;
            }
            `}</style>

            <div className="w-full max-w-2xl bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/60 p-6 md:p-8 relative z-10 flex flex-col transition-all duration-500 max-h-[96dvh] overflow-y-auto custom-scrollbar">
                
                {/* Header section */}
                <div className="text-center mb-6 shrink-0">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-green to-teal-500 text-white shadow-lg shadow-teal-500/30 mb-3 transform transition-transform hover:scale-110 hover:rotate-3 duration-300">
                        <Sparkles size={24} />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-teal-700 tracking-tight mb-2">
                        Kiểm Tra Âm Sắc
                    </h1>
                    <p className="text-gray-500 text-sm md:text-base font-medium max-w-lg mx-auto leading-relaxed">
                        Hãy đọc to đoạn văn bên dưới để SpeakVN thiết kế lộ trình luyện phát âm chuẩn xác nhất dành cho bạn.
                    </p>
                </div>

                {/* Sentence Card area */}
                {status !== 'result' && (
                    <div className="bg-gradient-to-r from-brand-green/[0.03] to-teal-500/[0.05] p-5 md:p-6 rounded-3xl border border-brand-green/10 relative group mb-6 transition-all duration-500 hover:shadow-lg hover:shadow-brand-green/5 hover:border-brand-green/30 shrink-0">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-brand-green to-teal-500 rounded-l-full"></div>
                        <div className="flex items-center justify-center gap-2 mb-3 text-brand-green font-bold uppercase tracking-wider text-xs md:text-sm">
                            <Volume2 size={16} />
                            <span>Câu Mẫu Cần Đọc</span>
                        </div>
                        <div className="text-xl md:text-2xl font-extrabold text-gray-800 tracking-wide leading-relaxed text-center italic drop-shadow-sm">
                            "Hà Nội vừa đổ cơn mưa, tôi đi làm sớm kẻo bị trễ giờ."
                        </div>
                    </div>
                )}

                {/* Interactive Status Area */}
                <div className="flex-1 flex flex-col items-center justify-center min-h-[120px] shrink-0">
                    {status === 'countdown' && (
                        <div className="flex flex-col items-center justify-center animate-fadeIn">
                            <div className="text-brand-green text-6xl md:text-7xl font-extrabold mb-2 drop-shadow-sm animate-pulse" key={countdownValue}>
                                {countdownValue > 0 ? countdownValue : 'Bắt đầu!'}
                            </div>
                            <p className="text-gray-500 font-medium text-sm md:text-base">Chuẩn bị đọc câu mẫu trên...</p>
                        </div>
                    )}

                    {status === 'idle' && (
                        <div className="text-center animate-fadeIn">
                            <p className="text-gray-400 flex items-center justify-center gap-2 text-base md:text-lg font-medium">
                                <Mic size={20} /> Nhấn micro để bắt đầu thu âm
                            </p>
                        </div>
                    )}

                    {status === 'listening' && (
                        <div className="flex flex-col items-center animate-fadeIn">
                            <div className="flex items-end gap-1.5 mb-4 h-10">
                                {[30, 60, 45, 80, 50, 90, 40].map((height, i) => (
                                    <div 
                                        key={i} 
                                        className="w-1.5 md:w-2 bg-gradient-to-t from-teal-400 to-brand-green rounded-full animate-bounce" 
                                        style={{ height: `${height}%`, animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
                                    ></div>
                                ))}
                            </div>
                            <div className="text-brand-green font-extrabold text-lg md:text-xl animate-pulse tracking-wide">Đang ghi âm...</div>
                            <p className="text-gray-400 text-xs md:text-sm mt-1 font-medium">Nhấn nút vuông để kết thúc</p>
                        </div>
                    )}

                    {status === 'processing' && (
                        <div className="flex flex-col items-center animate-fadeIn">
                            <div className="relative w-12 h-12 md:w-14 md:h-14 mb-4">
                                <div className="absolute inset-0 border-[3px] border-gray-100 rounded-full"></div>
                                <div className="absolute inset-0 border-[3px] border-teal-500 rounded-full animate-spin border-t-transparent"></div>
                                <div className="absolute inset-0 flex items-center justify-center text-teal-500">
                                    <Sparkles size={18} className="animate-pulse" />
                                </div>
                            </div>
                            <div className="text-gray-700 font-bold text-lg md:text-xl">Đang phân tích âm sắc AI...</div>
                            <p className="text-gray-400 text-xs md:text-sm mt-1 font-medium">Vui lòng đợi trong giây lát</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col items-center w-full max-w-sm bg-red-50/80 p-5 rounded-3xl border border-red-100 text-center animate-fadeIn">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-3 shadow-sm">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-red-800 font-bold text-lg md:text-xl mb-1">Đã có lỗi xảy ra</h3>
                            <p className="text-red-600/80 font-medium text-sm md:text-base mb-4">{feedback}</p>
                            <button onClick={() => setStatus('idle')} className="px-5 py-2 md:px-6 md:py-2.5 bg-white text-red-600 rounded-xl font-bold border border-red-200 hover:bg-red-50 hover:border-red-300 transition-all shadow-sm active:scale-95 text-sm md:text-base">
                                Thử Lại
                            </button>
                        </div>
                    )}

                    {/* Result Interface */}
                    {status === 'result' && suggestedRegion && (
                        <div className="w-full animate-fadeIn transition-all duration-500 pt-2 shrink-0">
                            <div className="bg-gradient-to-b from-green-50 to-white pt-6 pb-8 px-4 md:px-6 rounded-[2rem] border border-green-100 shadow-xl shadow-brand-green/5 text-center mb-2 relative overflow-hidden">
                                <div className="absolute top-[-20%] right-[-10%] text-green-500/5 rotate-12 pointer-events-none">
                                    <CheckCircle size={150} />
                                </div>
                                <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-green-100 text-brand-green mb-3">
                                    <CheckCircle size={28} />
                                </div>
                                <h3 className="text-xl md:text-2xl font-extrabold text-gray-800 mb-2">Hoàn Tất Đánh Giá</h3>
                                <p className="text-gray-600 text-base md:text-lg font-medium leading-relaxed max-w-md mx-auto mb-6 relative z-10">
                                    {feedback}
                                </p>

                                <div className="flex items-center justify-center gap-2 font-bold text-gray-500 mb-4 uppercase tracking-wider text-xs md:text-sm">
                                    <span>Chọn vùng miền để bắt đầu</span>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10 w-full max-w-lg mx-auto">
                                    {[
                                        { id: 'BAC', label: 'Miền Bắc', theme: 'sky' },
                                        { id: 'TRUNG', label: 'Miền Trung', theme: 'purple' },
                                        { id: 'NAM', label: 'Miền Nam', theme: 'green' }
                                    ].map((item) => {
                                        const isSelected = selectedRegion === item.id;
                                        
                                        // Colors mapping to mimic dynamic tailwind classes safely 
                                        const colors = {
                                            sky: { active: 'bg-sky-50 border-sky-400 text-sky-700 ring-4 ring-sky-400/20', hover: 'hover:border-sky-300 hover:shadow-sky-100', icon: 'text-sky-500' },
                                            purple: { active: 'bg-purple-50 border-purple-400 text-purple-700 ring-4 ring-purple-400/20', hover: 'hover:border-purple-300 hover:shadow-purple-100', icon: 'text-purple-500' },
                                            green: { active: 'bg-green-50 border-brand-green text-green-700 ring-4 ring-green-500/30', hover: 'hover:border-green-400 hover:shadow-green-100', icon: 'text-brand-green' }
                                        }[item.theme];

                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => setSelectedRegion(item.id)}
                                                className={`relative flex flex-col items-center justify-center py-4 px-2 rounded-2xl border-2 transition-all duration-300 w-full cursor-pointer ${
                                                    isSelected
                                                        ? colors!.active + ' scale-105 shadow-md z-10'
                                                        : 'border-slate-100 bg-white text-gray-500 hover:-translate-y-1 hover:shadow-md hover:text-gray-800 ' + colors!.hover
                                                }`}
                                            >
                                                {isSelected && (
                                                    <div className="absolute -top-2.5 -right-2.5 w-6 h-6 md:w-8 md:h-8 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100 animate-bounce">
                                                        <CheckCircle size={16} className={colors!.icon} />
                                                    </div>
                                                )}
                                                <span className="font-extrabold text-base md:text-lg">{item.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-4 flex justify-center">
                                <Button 
                                    className="w-full max-w-md h-14 rounded-2xl text-lg font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-brand-green to-teal-500 hover:from-green-600 hover:to-teal-600 border-none shadow-[0_10px_20px_rgb(20,184,166,0.2)] text-white transform hover:-translate-y-1 hover:shadow-[0_15px_25px_rgb(20,184,166,0.3)] transition-all duration-300"
                                    onClick={handleConfirmRegion}
                                >
                                    BẮT ĐẦU NGAY VỚI LỘ TRÌNH <ArrowRight size={22} />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Microphone Button */}
                {status !== 'result' && status !== 'countdown' && (
                    <div className="mt-4 mb-2 flex justify-center shrink-0">
                        <button
                            className={`group relative flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full shadow-xl transition-all duration-500 ${
                                status === 'listening' 
                                    ? 'bg-red-500 hover:bg-red-600 transform scale-110' 
                                    : status === 'processing'
                                        ? 'bg-gray-200 shadow-none cursor-not-allowed scale-95'
                                        : 'bg-gradient-to-tr from-brand-green to-teal-400 hover:from-teal-400 hover:to-brand-green transform hover:scale-110 hover:-translate-y-1'
                            }`}
                            onClick={handleMicClick}
                            disabled={status === 'processing'}
                        >
                            {/* Listening Ripple effect */}
                            {status === 'listening' && (
                                <>
                                    <div className="absolute inset-0 rounded-full border-[5px] border-red-400 opacity-60 animate-ping" style={{ animationDuration: '1.5s' }}></div>
                                    <div className="absolute inset-[-15px] rounded-full border-[2px] border-red-300 opacity-30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.4s' }}></div>
                                    <div className="absolute inset-[-30px] rounded-full border border-red-200 opacity-10 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.8s' }}></div>
                                </>
                            )}
                            
                            {/* Idle subtle hover glow */}
                            {status === 'idle' && (
                                <div className="absolute inset-[-10px] rounded-full border-2 border-teal-300 opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300" style={{animationDuration: '2s'}}></div>
                            )}

                            {status === 'listening' ? (
                                <Square size={28} className="text-white fill-current animate-pulse" />
                            ) : (
                                <Mic size={36} className="text-white drop-shadow-md group-hover:drop-shadow-xl transition-transform duration-300 group-hover:scale-110" />
                            )}
                        </button>
                    </div>
                )}
            </div>
            
            {/* Minimal footer inside the layout to balance spacing */}
            <div className="mt-4 text-center text-gray-400/80 text-xs md:text-sm font-medium z-10 shrink-0">
                Công nghệ phân tích âm thanh bằng Trí Tuệ Nhân Tạo
            </div>
        </div>
    );
};

export default Entrytest;
