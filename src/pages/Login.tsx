import { useNavigate } from 'react-router-dom';
import { Button, Input, Divider, Space } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  GoogleOutlined, 
  FacebookOutlined,
  GlobalOutlined 
} from '@ant-design/icons';
import { motion } from 'framer-motion';

const Login = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#F8F9FA] font-inter flex items-center justify-center p-6 selection:bg-stitch-teal selection:text-white">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-[480px] w-full"
            >
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-stitch-teal flex items-center justify-center shadow-xl shadow-stitch-teal/20 mb-6">
                        <GlobalOutlined className="text-white text-3xl" />
                    </div>
                    <h1 className="text-3xl font-black text-stitch-dark tracking-tighter uppercase mb-2 italic">
                        Speak<span className="text-stitch-teal">VN</span>
                    </h1>
                    <p className="text-stitch-grey font-medium">Bắt đầu hành trình chinh phục ngôn ngữ của bạn.</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-[2.5rem] shadow-stitch p-10 md:p-12 border border-stitch-border relative overflow-hidden">
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-stitch-teal/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                    
                    <div className="relative z-10">
                        <h2 className="text-2xl font-extrabold text-stitch-dark mb-8 text-center">Đăng nhập</h2>
                        
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-stitch-grey uppercase tracking-widest ml-1">Email / Tên đăng nhập</label>
                                <Input 
                                    size="large"
                                    placeholder="yourname@email.com"
                                    prefix={<UserOutlined className="text-stitch-teal mr-2" />}
                                    className="h-14 rounded-2xl bg-[#F8F9FA] border-none font-bold text-stitch-dark focus:bg-white transition-all shadow-inner"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-[10px] font-black text-stitch-grey uppercase tracking-widest">Mật khẩu</label>
                                    <span className="text-[10px] font-black text-stitch-teal uppercase tracking-widest cursor-pointer hover:underline">Quên mật khẩu?</span>
                                </div>
                                <Input.Password 
                                    size="large"
                                    placeholder="••••••••"
                                    prefix={<LockOutlined className="text-stitch-teal mr-2" />}
                                    className="h-14 rounded-2xl bg-[#F8F9FA] border-none font-bold text-stitch-dark focus:bg-white transition-all shadow-inner"
                                />
                            </div>

                            <Button 
                                type="primary" 
                                size="large" 
                                block
                                onClick={() => navigate('/learner/dashboard')}
                                className="h-14 bg-stitch-teal hover:bg-stitch-teal-dark border-none rounded-2xl font-black text-sm tracking-widest shadow-lg shadow-stitch-teal/20 mt-4"
                            >
                                TIẾP TỤC ĐẾN DASHBOARD
                            </Button>

                            <Divider className="border-stitch-border my-8">
                                <span className="text-[10px] font-black text-stitch-grey uppercase tracking-[0.2em]">HOẶC ĐĂNG NHẬP VỚI</span>
                            </Divider>

                            <div className="grid grid-cols-2 gap-4">
                                <Button 
                                    size="large"
                                    icon={<GoogleOutlined />}
                                    className="h-14 rounded-2xl border-stitch-border font-bold text-stitch-grey hover:text-stitch-dark hover:border-gray-400 transition-all flex items-center justify-center"
                                >
                                    Google
                                </Button>
                                <Button 
                                    size="large"
                                    icon={<FacebookOutlined />}
                                    className="h-14 rounded-2xl border-stitch-border font-bold text-stitch-grey hover:text-stitch-dark hover:border-gray-400 transition-all flex items-center justify-center"
                                >
                                    Facebook
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Link */}
                <div className="text-center mt-10">
                    <p className="text-stitch-grey font-bold">
                        Chưa có tài khoản?{' '}
                        <span 
                            onClick={() => navigate('/register')} 
                            className="text-stitch-teal cursor-pointer hover:underline uppercase tracking-widest text-xs font-black ml-1"
                        >
                            Tạo tài khoản mới
                        </span>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
