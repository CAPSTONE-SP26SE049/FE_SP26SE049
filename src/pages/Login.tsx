import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const Login = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            {/* Container */}
            <div className="bg-white max-w-md w-full rounded-3xl shadow-xl overflow-hidden border-2 border-gray-100">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Đăng Nhập</h1>
                        <p className="text-gray-500">Chào mừng trở lại với hành trình!</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <input
                                type="email"
                                placeholder="Email hoặc Tên đăng nhập"
                                className="w-full bg-gray-100 border-2 border-gray-200 rounded-2xl px-4 py-3 font-bold text-gray-700 focus:outline-none focus:border-brand-blue focus:bg-white transition-colors"
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                placeholder="Mật khẩu"
                                className="w-full bg-gray-100 border-2 border-gray-200 rounded-2xl px-4 py-3 font-bold text-gray-700 focus:outline-none focus:border-brand-blue focus:bg-white transition-colors"
                            />
                        </div>

                        <Button className="w-full" onClick={() => navigate('/learn')}>
                            ĐĂNG NHẬP
                        </Button>

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
                        Chưa có tài khoản? <span onClick={() => navigate('/register')} className="text-brand-blue cursor-pointer hover:underline uppercase">Đăng ký</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
