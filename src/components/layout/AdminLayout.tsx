import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, LogOut } from 'lucide-react';

const AdminLayout = ({ children }: { children: ReactNode }) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
                <div className="p-6 border-b border-gray-100">
                    <div className="text-2xl font-bold text-gray-800">Cổng Quản Trị</div>
                    <div className="text-xs text-brand-green font-bold uppercase tracking-wider mt-1">Hành Trình SpeakVN</div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-brand-green bg-green-50 rounded-xl font-bold transition-colors">
                        <LayoutDashboard size={20} />
                        Tổng quan
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors">
                        <BookOpen size={20} />
                        Nội dung
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors">
                        <Users size={20} />
                        Người dùng
                    </button>
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-medium transition-colors"
                    >
                        <LogOut size={20} />
                        Đăng xuất
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;
