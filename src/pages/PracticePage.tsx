import { useState } from 'react'; // Re-saved
import { useNavigate } from 'react-router-dom';
import { X, Mic, Volume2, CheckCircle, Heart } from 'lucide-react';
import { Button } from '../components/ui/Button';

const PracticePage = () => {
    // const { id } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'success' | 'error'>('idle');
    const [feedback, setFeedback] = useState<string | null>(null);

    const handleMicClick = () => {
        if (status === 'idle' || status === 'error' || status === 'success') {
            setStatus('listening');
            // Simulate listening duration
            setTimeout(() => {
                setStatus('processing');
                // Simulate processing duration
                setTimeout(() => {
                    // Random success/fail for demo
                    const isSuccess = Math.random() > 0.3;
                    if (isSuccess) {
                        setStatus('success');
                        setFeedback('Tuyệt vời! Bạn phát âm từ này rất chuẩn.');
                    } else {
                        setStatus('error');
                        setFeedback('Chưa chính xác. Hãy nhớ cong lưỡi lên một chút.');
                    }
                }, 1500);
            }, 2000);
        }
    };

    return (
        <div className="flex flex-col h-full max-w-2xl mx-auto pt-10 px-6">
            {/* Header / Progress */}
            <div className="flex items-center gap-4 mb-10">
                <div className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors" onClick={() => navigate('/learn')}>
                    <X className="text-gray-400" />
                </div>
                <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-green w-1/3 rounded-full"></div>
                </div>
                <div className="flex items-center gap-2 text-brand-red font-bold text-lg">
                    <Heart className="fill-brand-red" /> 5
                </div>
            </div>

            {/* Challenge Area */}
            <div className="flex-1 flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold text-gray-700 mb-8">Đọc to từ này:</h2>

                <div className="flex items-center gap-4 mb-12">
                    <div className="p-4 border-2 border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <Volume2 className="text-brand-blue" size={32} />
                    </div>
                    <div className="text-5xl font-extrabold text-gray-800 tracking-wider">
                        Hà Nội
                    </div>
                </div>

                {/* Visual Feedback Area */}
                <div className="h-32 flex items-center justify-center text-center">
                    {status === 'listening' && <div className="text-brand-blue font-bold animate-pulse">Đang nghe...</div>}
                    {status === 'processing' && <div className="text-gray-500 font-bold">Đang phân tích...</div>}
                    {status === 'success' && (
                        <div className="text-brand-green font-bold text-xl flex flex-col items-center animate-fade-in-up">
                            <div className="mb-2 text-4xl">🎉</div>
                            {feedback}
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="text-brand-red font-bold text-xl flex flex-col items-center animate-shake">
                            <div className="mb-2 text-4xl">😕</div>
                            {feedback}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / Controls */}
            <div className={`pb-10 pt-6 border-t border-gray-100 transition-colors duration-300 ${status === 'success' ? 'bg-green-50 -mx-6 px-6' : status === 'error' ? 'bg-red-50 -mx-6 px-6' : ''}`}>
                <div className="flex justify-between items-center">
                    {status === 'idle' || status === 'listening' || status === 'processing' ? (
                        <div className="w-full flex justify-center">
                            <button
                                className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all transform hover:scale-105 active:scale-95 ${status === 'listening' ? 'bg-red-500 animate-pulse ring-4 ring-red-200' : 'bg-brand-blue'}`}
                                onClick={handleMicClick}
                            >
                                <Mic size={40} className="text-white" />
                            </button>
                        </div>
                    ) : (
                        <div className="w-full flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${status === 'success' ? 'bg-white text-brand-green' : 'bg-white text-brand-red'}`}>
                                    {status === 'success' ? <CheckCircle size={32} /> : <X size={32} />}
                                </div>
                                <div className="font-extrabold text-xl text-gray-800">
                                    {status === 'success' ? 'Chính xác!' : 'Sai rồi'}
                                </div>
                            </div>
                            <Button
                                variant={status === 'success' ? 'primary' : 'danger'}
                                className="px-10"
                                onClick={() => setStatus('idle')}
                            >
                                TIẾP TỤC
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PracticePage;
