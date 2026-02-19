import { Flame, Target, Zap, Lock, Shield, Settings } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';

const Badge = ({ icon: Icon, title, level, locked }: any) => (
    <div className={`flex flex-col items-center p-4 rounded-2xl border-2 ${locked ? 'bg-gray-50 border-gray-200 opacity-50' : 'bg-white border-yellow-400 shadow-sm'}`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${locked ? 'bg-gray-200 text-gray-400' : 'bg-brand-yellow text-yellow-700'}`}>
            {locked ? <Lock size={24} /> : <Icon size={32} />}
        </div>
        <div className="font-bold text-gray-700 text-sm text-center">{title}</div>
        <div className="text-xs text-gray-400 font-bold uppercase mt-1">Cấp độ {level}</div>
    </div>
);

const Profile = () => {
    return (
        <div className="max-w-4xl mx-auto pt-10 pb-20 px-6">
            <div className="flex flex-col md:flex-row gap-8 pb-8 border-b border-gray-200 mb-8">
                <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center text-5xl border-4 border-white shadow-lg">
                    😎
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-800 mb-2">PenPen123</h1>
                            <p className="text-gray-500 font-medium">Tham gia từ tháng 2 năm 2026</p>
                        </div>
                        <Button variant="secondary" size="sm"><Settings size={18} className="mr-2" /> Cài đặt</Button>
                    </div>

                    <div className="flex gap-12 mt-6">
                        <div>
                            <div className="flex items-center gap-2 text-gray-800 font-bold mb-1">
                                <Flame className="text-brand-orange" /> 12
                            </div>
                            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Chuỗi ngày</div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 text-gray-800 font-bold mb-1">
                                <Zap className="text-brand-yellow" /> 1432
                            </div>
                            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tổng XP</div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 text-gray-800 font-bold mb-1">
                                <Shield className="text-brand-blue" /> Kim cương
                            </div>
                            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Hạng đấu</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Section 1: Progress */}
                <div className="space-y-6">
                    <h2 className="text-xl font-extrabold text-gray-800">Tiến độ ngôn ngữ</h2>
                    <div className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-sm">
                        <div className="mb-4">
                            <div className="flex justify-between mb-2">
                                <span className="font-bold text-brand-green">Giọng Miền Bắc</span>
                                <span className="font-bold text-gray-400">Cấp độ 3</span>
                            </div>
                            <ProgressBar value={75} className="h-3 bg-gray-100 rounded-full overflow-hidden" color="green" />
                        </div>
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="font-bold text-brand-blue">Giọng Miền Nam</span>
                                <span className="font-bold text-gray-400">Cấp độ 1</span>
                            </div>
                            <ProgressBar value={25} className="h-3 bg-gray-100 rounded-full overflow-hidden" color="blue" />
                        </div>
                    </div>
                </div>

                {/* Section 2: Achievements */}
                <div className="space-y-6">
                    <h2 className="text-xl font-extrabold text-gray-800">Thành tích</h2>
                    <div className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-sm">
                        <div className="grid grid-cols-3 gap-4">
                            <Badge icon={Flame} title="Lửa địa ngục" level={1} locked={false} />
                            <Badge icon={Target} title="Xạ thủ" level={2} locked={false} />
                            <Badge icon={Zap} title="Học giả" level={0} locked={true} />
                        </div>
                        <div className="mt-6 text-center">
                            <Button variant="ghost" className="text-gray-400 uppercase text-sm">Xem tất cả</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
