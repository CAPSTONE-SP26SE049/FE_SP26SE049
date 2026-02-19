// import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, Activity, AlertCircle, Calendar } from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import { Button } from '../components/ui/Button';

const StatCard = ({ icon: Icon, title, value, change, color }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
        <div className={`p-3 rounded-xl bg-${color}-100 text-${color}-600`}>
            <Icon size={20} />
        </div>
        <div>
            <p className="text-gray-400 text-sm">{title}</p>
            <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
            <p className={`text-xs font-semibold ${change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{change}</p>
        </div>
    </div>
);

const Admin = () => {
    return (
        <AdminLayout>
            <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Tổng quan</h1>
                        <p className="text-gray-500">Chào mừng trở lại, Quản trị viên</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                            <Calendar size={18} className="text-gray-400" />
                            <span className="font-bold text-gray-700">Hôm nay, 24 Th10</span>
                        </div>
                        <Button variant="primary" size="sm">Tải xuống báo cáo</Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard icon={Users} title="Tổng người dùng" value="12,450" change="+12%" color="blue" />
                    <StatCard icon={BookOpen} title="Bài học đã hoàn thành" value="45,200" change="+8.5%" color="green" />
                    <StatCard icon={Activity} title="Người dùng đang hoạt động" value="1,203" change="+3.2%" color="purple" />
                    <StatCard icon={AlertCircle} title="Báo cáo lỗi" value="24" change="-5%" color="red" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Chart Section */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Hoạt động người dùng</h2>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 rounded-lg bg-gray-100 text-gray-600 font-bold text-xs hover:bg-gray-200">TUẦN</button>
                                <button className="px-3 py-1 rounded-lg bg-brand-blue text-white font-bold text-xs">THÁNG</button>
                                <button className="px-3 py-1 rounded-lg bg-gray-100 text-gray-600 font-bold text-xs hover:bg-gray-200">NĂM</button>
                            </div>
                        </div>

                        <div className="h-64 flex items-end justify-between px-4 gap-2">
                            {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((h, i) => (
                                <div key={i} className="w-full bg-blue-100 rounded-t-lg relative group transition-all hover:bg-brand-blue">
                                    <div className="absolute bottom-0 w-full bg-brand-blue rounded-t-lg transition-all" style={{ height: `${h}%` }}></div>
                                    {/* Tooltip */}
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded pointer-events-none transition-opacity">
                                        {h * 10} người dùng
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-4 text-xs font-bold text-gray-400 uppercase">
                            <span>Th1</span><span>Th2</span><span>Th3</span><span>Th4</span><span>Th5</span><span>Th6</span>
                            <span>Th7</span><span>Th8</span><span>Th9</span><span>Th10</span><span>Th11</span><span>Th12</span>
                        </div>
                    </div>

                    {/* Recent Activity / Tasks */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">Cần chú ý</h2>
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl border border-red-100 bg-red-50 flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-red-500 shadow-sm">
                                    <AlertCircle size={20} />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-800">5 Báo cáo nội dung mới</div>
                                    <div className="text-sm text-gray-500">Kiểm tra các từ có vấn đề do người dùng báo cáo</div>
                                    <button className="text-red-600 text-xs font-black uppercase mt-2 hover:underline">XEM LẠI</button>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50 flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-brand-blue shadow-sm">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-800">Yêu cầu giáo viên</div>
                                    <div className="text-sm text-gray-500">3 người dùng đăng ký tài khoản giáo viên</div>
                                    <button className="text-brand-blue text-xs font-black uppercase mt-2 hover:underline">PHÊ DUYỆT</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default Admin;
