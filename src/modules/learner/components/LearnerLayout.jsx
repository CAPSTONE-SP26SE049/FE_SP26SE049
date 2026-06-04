import React, { useEffect, useState } from "react";
import { Dropdown, Avatar, message } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  UserOutlined,
  LogoutOutlined,
  FireFilled,
} from "@ant-design/icons";
import { useAuth } from "../../../core/auth/AuthContext";
import {
  getLearnerOnboardingPath,
  isLearnerOnboardingPath,
} from "../../../utils/onboarding";
import clsx from "clsx";
import { apiClient } from "../../../services/apiClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Map,
  Users,
  Mic,
  Trophy,
  Sparkles,
  UserCircle2,
  MapPin,
  Loader2,
  Menu,
  X,
  Mail,
  Award,
  Flame,
  Star,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";
import logoImg from "../../../assets/logoSpeakVN.png";



export default function LearnerLayout() {
  const { session, logout, updateSessionItem } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarErr, setAvatarErr] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const user = session?.user || { fullName: "Learner", avatar: null };

  useEffect(() => {
    if (!session || session.user.role !== "USER") return;

    const target = getLearnerOnboardingPath(session.user);

    if (session.user.hasDoneEntryTest && isLearnerOnboardingPath(location.pathname)) {
      navigate("/learner/roadmap", { replace: true });
      return;
    }

    if (!session.user.hasDoneEntryTest && !isLearnerOnboardingPath(location.pathname)) {
      navigate(target, { replace: true });
    }
  }, [session, location.pathname, navigate]);
  // Generate initials for avatar fallback to keep style clean without icons
  const initials = React.useMemo(() => {
    if (!user?.fullName) return "HV";
    return user.fullName.split(" ")
      .map(n => n.charAt(0))
      .filter(char => char.match(/[\p{L}\p{N}]/u))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  }, [user?.fullName]);

  // Reset error when avatar changes
  React.useEffect(() => {
    setAvatarErr(false);
  }, [user?.avatar]);



  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userMenu = {
    items: [
      {
        key: "profile",
        label: <Link to="/learner/profile" className="font-black text-xs text-slate-800 uppercase tracking-tight">Hồ sơ cá nhân</Link>,
      },
      { type: "divider" },
      {
        key: "logout",
        label: <span className="text-red-500 font-black text-xs uppercase tracking-tight">Đăng xuất</span>,
        onClick: handleLogout,
      },
    ],
  };

  const coreItems = React.useMemo(() => [
    { key: "/learner/dashboard", label: "Trang chủ" },
    { key: "/learner/roadmap", label: "Hành trình" },
    { key: "/learner/pronunciation", label: "Phát âm" },
    { key: "/learner/minigames", label: "Minigames" },
  ], []);

  const dropdownItems = React.useMemo(() => [
    { key: "/learner/mailbox", label: "Hộp thư" },
    { key: "/learner/custom-journey", label: "Gợi ý học" },
    { key: "/learner/tournament", label: "Giải đấu" },
    { key: "/learner/leaderboard", label: "Xếp hạng" },
    { key: "/learner/achievements", label: "Thành tựu" },
    { key: "/learner/friends", label: "Bạn bè" },
    { key: "/learner/feedback", label: "Phản hồi" },
  ], []);

  const menuItems = React.useMemo(() => [
    ...coreItems,
    ...dropdownItems
  ], [coreItems, dropdownItems]);

  const selectedKey = React.useMemo(() => {
    return menuItems.find(
      (item) =>
        location.pathname === item.key ||
        location.pathname.startsWith(`${item.key}/`)
    )?.key || "/learner/dashboard";
  }, [location.pathname, menuItems]);

  const isDropdownActive = React.useMemo(() => {
    return dropdownItems.some((item) => selectedKey === item.key);
  }, [selectedKey, dropdownItems]);

  return (
    <div className="flex flex-col h-screen bg-[#fbfaff] font-nunito overflow-hidden">



      {/* ══════════════════════════════════════════════════════
          TOP NAVIGATION BAR (Doodle Minimalist Style)
          ══════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-[100] bg-[#fbf6ef]/95 backdrop-blur-md px-6 lg:px-8 py-4">
        <div className="mx-auto max-w-none">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/learner/dashboard" className="group flex items-center text-left">
              <img
                src={logoImg}
                alt="SpeakVN Logo"
                className="h-14 w-auto drop-shadow-[2px_2px_0_rgba(0,0,0,0.1)] transition-transform duration-200 group-hover:-translate-y-0.5"
              />
            </Link>

            {/* Navigation - Arranged in a beautiful unified brutalist capsule without icons */}
            <nav className="hidden xl:flex items-center gap-1 rounded-full border-[2px] border-slate-900 bg-white p-1 shadow-[2px_2px_0_#1f2937]">
              {coreItems.map((item) => {
                const isActive = selectedKey === item.key;
                return (
                  <Link
                    key={item.key}
                    to={item.key}
                    className={`relative flex items-center justify-center px-4 py-1.5 rounded-full transition-all duration-100 ${isActive
                        ? 'bg-[#7dd3fc] text-slate-900 border border-slate-900 font-black shadow-[1px_1px_0_#1f2937]'
                        : 'text-slate-600 hover:text-slate-900 font-bold hover:bg-slate-50'
                      }`}
                  >
                    <span className="text-[12px] tracking-tight whitespace-nowrap">
                      {item.label}
                    </span>
                  </Link>
                );
              })}

              <Dropdown
                dropdownRender={() => (
                  <div className="border-2 border-slate-900 rounded-2xl bg-white p-2 shadow-[4px_4px_0_#1f2937] flex flex-col gap-1 min-w-[160px] z-[200]">
                    {dropdownItems.map((item) => {
                      const isSubActive = selectedKey === item.key;
                      return (
                        <Link
                          key={item.key}
                          to={item.key}
                          onClick={() => setDropdownOpen(false)}
                          className={`flex items-center px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all duration-100 ${isSubActive
                              ? "bg-[#7dd3fc] text-slate-900 border border-slate-900 shadow-[1px_1px_0_#1f2937]"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
                placement="bottomRight"
                trigger={["hover", "click"]}
                open={dropdownOpen}
                onOpenChange={setDropdownOpen}
              >
                <button
                  type="button"
                  className={`relative flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full transition-all duration-100 ${isDropdownActive
                      ? "bg-[#7dd3fc] text-slate-900 border border-slate-900 font-black shadow-[1px_1px_0_#1f2937]"
                      : "text-slate-600 hover:text-slate-900 font-bold hover:bg-slate-50"
                    }`}
                >
                  <span className="text-[12px] tracking-tight whitespace-nowrap">
                    Xem thêm
                  </span>
                  <ChevronDown size={14} className={`transform transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </Dropdown>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Stats - Brutalist styling without icons */}
              <div className="hidden sm:flex items-center gap-3 rounded-full border-[2px] border-slate-900 bg-white px-3.5 py-1.5 shadow-[3px_3px_0_#1f2937] text-[10px] font-black tracking-wider uppercase">
                <div className="flex items-center gap-1 border-r border-slate-200 pr-2.5 text-orange-600">
                  <span>Streak:</span>
                  <span className="text-slate-900 text-xs font-black">{user?.currentStreakDays || user?.streak || "0"}</span>
                </div>
                <div className="flex items-center gap-1 text-yellow-600">
                  <span>Sao:</span>
                  <span className="text-slate-900 text-xs font-black">{user?.totalStars || 0}</span>
                </div>
              </div>

              {/* User Dropdown */}
              <Dropdown menu={userMenu} placement="bottomRight" trigger={["click"]}>
                <button type="button" className="flex items-center gap-2 rounded-full border-[2px] border-slate-900 bg-white p-0.5 pr-2.5 shadow-[3px_3px_0_#1f2937] transition-transform hover:-translate-y-0.5">
                  <Avatar
                    src={avatarErr ? null : (user.avatar_url || user.avatar)}
                    onError={() => { setAvatarErr(true); return true; }}
                    size={32}
                    className="bg-[#49B6E5] text-white border-2 border-white flex items-center justify-center font-black text-xs"
                  >
                    {initials}
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <div className="text-[11px] font-black leading-none text-slate-800 mb-0.5 truncate max-w-[100px]">{user.fullName || "User"}</div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-[#49B6E5]">Học viên</div>
                  </div>
                </button>
              </Dropdown>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="flex items-center justify-center h-10 px-4 rounded-full border-[2px] border-slate-900 bg-white text-slate-800 font-black text-xs shadow-[3px_3px_0_#1f2937] xl:hidden"
                aria-label="Open menu"
              >
                Menu
              </button>
            </div>
          </div>
        </div>

        {/* Hand-drawn style bottom line */}
        <div className="absolute left-0 right-0 bottom-0 px-6">
          <svg className="w-full h-1 text-slate-900/20" viewBox="0 0 1200 4" preserveAspectRatio="none">
            <path
              d="M0,2 Q300,0 600,2 T1200,2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </header>

      {/* ── MOBILE MENU OVERLAY ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[1000]"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-white z-[1001] flex flex-col shadow-2xl"
            >
              <div className="p-6 flex items-center justify-between border-b border-gray-50 bg-[#fbfaff]">
                <div className="flex items-center gap-3">
                  <span className="font-black text-xl tracking-tight text-slate-800">SpeakVN</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 font-bold text-xs hover:bg-gray-200 transition-colors"
                >
                  Đóng
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-2 custom-scrollbar">
                <h3 className="px-3 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Hệ thống menu</h3>
                {menuItems.map((item) => {
                  const isActive = selectedKey === item.key;
                  return (
                    <Link key={item.key} to={item.key} onClick={() => setMobileMenuOpen(false)}>
                      <div className={`flex items-center px-5 py-4 rounded-2xl font-black text-[15px] transition-all
                        ${isActive ? "bg-[#49B6E5] text-white shadow-xl shadow-[#49B6E5]/20" : "text-gray-600 hover:bg-slate-50 active:scale-95"}`}>
                        {item.label}
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="p-6 border-t border-gray-50 bg-gray-50/50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl font-black text-base text-red-500 bg-white border border-red-100 hover:bg-red-50 transition-all shadow-sm"
                >
                  Đăng xuất
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── CONTENT AREA ── */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="h-full">
          <Outlet />
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e9e4f5; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ddd6fe; }
      `}</style>
    </div>
  );
}
