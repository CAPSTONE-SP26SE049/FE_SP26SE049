import { Plus, BookOpen, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/Button';

const Educator = () => {
    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Cổng Thông Tin Giáo Viên</h1>
                    <p className="text-gray-500">Quản lý lớp học và nội dung bài học</p>
                </div>
                <Button variant="primary"><Plus size={20} className="mr-2" /> TẠO BÀI HỌC MỚI</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Classes List */}
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Các Lớp Của Tôi</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {['Tiếng Việt Sơ Cấp A1', 'Luyện Giọng Cấp Tốc', 'Tiếng Việt Du Lịch', 'Văn Hóa & Ngôn Ngữ'].map((cls, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl border-2 border-gray-200 hover:border-brand-green transition-all cursor-pointer group shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-green-100 text-brand-green flex items-center justify-center">
                                        <BookOpen size={24} />
                                    </div>
                                    <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                                        {24 + i * 5} Học viên
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-brand-green">{cls}</h3>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-2">
                                    <div className="bg-brand-green h-full" style={{ width: `${60 - i * 10}%` }}></div>
                                </div>
                                <p className="text-xs text-gray-400 font-bold">Hoàn thành {60 - i * 10}% giáo trình</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions / Notifications */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Bài Nộp Gần Đây</h2>
                        <div className="space-y-4">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className="flex gap-4 items-center p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                        👤
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-800 text-sm">Nguyễn Văn A</div>
                                        <div className="text-xs text-gray-500">Đã nộp bài tập phát âm</div>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-brand-red"></div>
                                </div>
                            ))}
                        </div>
                        <Button variant="ghost" className="w-full mt-4 text-brand-blue text-sm uppercase">Xem tất cả</Button>
                    </div>

                    <div className="bg-brand-blue/5 p-6 rounded-2xl border border-brand-blue/20">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-brand-blue text-white rounded-lg">
                                <MessageSquare size={18} />
                            </div>
                            <h3 className="font-bold text-brand-blue">Phản hồi học viên</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            Bạn có 5 tin nhắn mới từ học viên cần giải đáp.
                        </p>
                        <Button variant="secondary" size="sm" className="w-full">TRẢ LỜI</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Educator;
