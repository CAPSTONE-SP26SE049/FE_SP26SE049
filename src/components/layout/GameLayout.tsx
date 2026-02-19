import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const GameLayout = ({ children }: { children: ReactNode }) => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
            {/* Sidebar Placeholder */}
            <aside className="hidden md:flex flex-col w-64 border-r border-gray-200 bg-white p-4 sticky top-0 h-screen overflow-y-auto">
                <div className="text-2xl font-bold text-brand-green mb-8 px-4">SpeakVN</div>
                <nav className="space-y-2">
                    <div onClick={() => navigate('/learn')} className={`p-3 rounded-xl hover:bg-gray-50 font-bold uppercase tracking-widest text-sm cursor-pointer transition-colors ${location.pathname === '/learn' ? 'bg-green-50 text-brand-green border border-green-200' : 'text-gray-500'}`}>
                        HỌC
                    </div>
                    <div onClick={() => navigate('/practice/1')} className="p-3 rounded-xl hover:bg-gray-50 text-gray-500 font-bold uppercase tracking-widest text-sm cursor-pointer transition-colors">
                        LUYỆN TẬP
                    </div>
                    <div onClick={() => navigate('/leaderboard')} className={`p-3 rounded-xl hover:bg-gray-50 font-bold uppercase tracking-widest text-sm cursor-pointer transition-colors ${location.pathname === '/leaderboard' ? 'bg-blue-50 text-brand-blue border border-blue-200' : 'text-gray-500'}`}>
                        BẢNG XẾP HẠNG
                    </div>
                    <div onClick={() => navigate('/guide')} className={`p-3 rounded-xl hover:bg-gray-50 font-bold uppercase tracking-widest text-sm cursor-pointer transition-colors ${location.pathname === '/guide' ? 'bg-purple-50 text-brand-purple border border-purple-200' : 'text-gray-500'}`}>
                        CẨM NANG
                    </div>
                    <div onClick={() => navigate('/profile')} className={`p-3 rounded-xl hover:bg-gray-50 font-bold uppercase tracking-widest text-sm cursor-pointer transition-colors ${location.pathname === '/profile' ? 'bg-yellow-50 text-yellow-600 border border-yellow-200' : 'text-gray-500'}`}>
                        HỒ SƠ
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Nav Placeholder */}
            <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 p-4 flex justify-around z-50">
                <div className="font-bold text-brand-green">LEARN</div>
                <div className="font-bold text-gray-400">PRACTICE</div>
                <div className="font-bold text-gray-400">PROFILE</div>
            </div>
        </div>
    );
};

export default GameLayout;
