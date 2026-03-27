import { type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Library,
  ClipboardList,
  Layers,
  Users,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-left border-0 bg-transparent cursor-pointer ${
    isActive ? 'text-brand-blue bg-blue-50 font-bold' : 'text-gray-600 hover:bg-gray-50'
  }`;

const EducatorLayout = ({ children }: { children: ReactNode }) => {
  const { logout } = useAuth();

  const navItems: { to: string; label: string; icon: ReactNode; end?: boolean }[] = [
    { to: '/educator', label: 'Tổng quan', icon: <LayoutDashboard size={20} />, end: true },
    { to: '/educator/chapters', label: 'Học phần', icon: <Library size={20} /> },
    { to: '/educator/quizzes', label: 'Bài kiểm tra', icon: <ClipboardList size={20} /> },
    { to: '/educator/challenges', label: 'Kho thử thách', icon: <Layers size={20} /> },
    { to: '/educator/classrooms', label: 'Lớp & học viên', icon: <Users size={20} /> },
    { to: '/educator/analytics', label: 'Hiệu suất', icon: <BarChart3 size={20} /> },
    { to: '/educator/settings', label: 'Cài đặt', icon: <Settings size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-gray-100">
          <div className="text-2xl font-bold text-gray-800">Cổng Giáo Viên</div>
          <div className="text-xs text-brand-blue font-bold uppercase tracking-wider mt-1">Hành Trình SpeakVN</div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => void logout()}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-medium transition-colors"
          >
            <LogOut size={20} />
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8 overflow-y-auto">{children}</main>
    </div>
  );
};

export default EducatorLayout;
