import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useState } from 'react';

const Register = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full rounded-3xl shadow-xl overflow-hidden border-2 border-gray-100">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Tạo Hồ Sơ Của Bạn</h1>
                        <p className="text-gray-500">{step === 1 ? 'Hãy bắt đầu với những điều cơ bản' : 'Cá nhân hóa trải nghiệm'}</p>
                    </div>

                    <div className="space-y-4">
                        {step === 1 && (
                            <>
                                <input type="number" autoComplete="off" placeholder="Tuổi của bạn" className="w-full bg-gray-100 border-2 border-gray-200 rounded-2xl px-4 py-3 font-bold text-gray-700 focus:outline-none focus:border-brand-green focus:bg-white transition-colors" />
                                <input type="text" autoComplete="name" placeholder="Tên của bạn (Tùy chọn)" className="w-full bg-gray-100 border-2 border-gray-200 rounded-2xl px-4 py-3 font-bold text-gray-700 focus:outline-none focus:border-brand-green focus:bg-white transition-colors" />
                                <input type="email" autoComplete="email" placeholder="Email" className="w-full bg-gray-100 border-2 border-gray-200 rounded-2xl px-4 py-3 font-bold text-gray-700 focus:outline-none focus:border-brand-green focus:bg-white transition-colors" />
                                <Button className="w-full" onClick={() => setStep(2)}>TIẾP TỤC</Button>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <div className="space-y-2 mb-4">
                                    <label className="text-gray-700 font-bold">Mục tiêu của bạn là gì?</label>
                                    <div className="flex flex-col gap-2">
                                        <button className="p-4 rounded-xl border-2 border-gray-200 hover:border-brand-green hover:bg-green-50 font-bold text-gray-600 hover:text-brand-green transition-all text-left">
                                            🎯 Sửa giọng ngọng N/L
                                        </button>
                                        <button className="p-4 rounded-xl border-2 border-gray-200 hover:border-brand-green hover:bg-green-50 font-bold text-gray-600 hover:text-brand-green transition-all text-left">
                                            🗣️ Cải thiện giao tiếp
                                        </button>
                                        <button className="p-4 rounded-xl border-2 border-gray-200 hover:border-brand-green hover:bg-green-50 font-bold text-gray-600 hover:text-brand-green transition-all text-left">
                                            🌏 Chuẩn hóa giọng địa phương
                                        </button>
                                    </div>
                                </div>
                                <Button className="w-full" onClick={() => navigate('/learn')}>TẠO TÀI KHOẢN</Button>
                            </>
                        )}

                        <div className="relative h-8 flex items-center justify-center">
                            <div className="absolute w-full h-[1px] bg-gray-200"></div>
                            <div className="relative bg-white px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">HOẶC</div>
                        </div>

                        <div className="flex gap-4 justify-center">
                            <button className="flex-1 py-3 border-2 border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png" alt="Facebook" className="w-6 h-6" />
                                <span>Facebook</span>
                            </button>
                            <button className="flex-1 py-3 border-2 border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
                                <span>Google</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
                    <p className="text-gray-600 font-bold">
                        Đã có tài khoản? <span onClick={() => navigate('/login')} className="text-brand-green cursor-pointer hover:underline uppercase">Đăng nhập</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
