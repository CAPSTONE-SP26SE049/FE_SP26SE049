import React, { useState } from "react";
import { Dropdown, Avatar, message } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  UserOutlined,
  LogoutOutlined,
  FireFilled,
} from "@ant-design/icons";
import { useAuth } from "../../../core/auth/AuthContext";
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
  Landmark,
  Castle,
  Building2,
} from "lucide-react";
import mienbacImg from "../../../assets/mienbac.png";
import mientrungImg from "../../../assets/mientrung.png";
import miennamImg from "../../../assets/miennam.png";
import logoImg from "../../../assets/logoSpeakVN.png";

const REGION_CHOICES = [
  {
    value: "north",
    label: "Giọng miền Bắc",
    emoji: "🏛️",
    icon: Landmark,
    tagline: "Thanh lịch & Chuẩn mực",
    description: "Chinh phục phát âm chuẩn — nền tảng tiếng Việt quy chuẩn.",
    photo: mienbacImg,
    gradient: "from-indigo-600 to-blue-700",
  },
  {
    value: "central",
    label: "Giọng miền Trung",
    emoji: "🏯",
    icon: Castle,
    tagline: "Nồng hậu & Di sản",
    description: "Khám phá giọng nói đặc trưng vùng đất cố đô và di sản văn hoá.",
    photo: mientrungImg,
    gradient: "from-amber-500 to-orange-600",
  },
  {
    value: "south",
    label: "Giọng miền Nam",
    emoji: "🌆",
    icon: Building2,
    tagline: "Sôi động & Cởi mở",
    description: "Làm quen với giọng Nam năng động, cởi mở và thân thiện.",
    photo: miennamImg,
    gradient: "from-emerald-500 to-teal-600",
  },
];

/* ── Region Selection Overlay (blocks UI if no region) ── */
const RegionSelectionOverlay = ({ onSelected, onLogout }) => {
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.put("/users/me", { region: selected });
      message.success("Đã chọn vùng miền thành công!");
      onSelected(selected);
    } catch (err) {
      message.error("Không thể lưu vùng miền. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-purple-900/90 via-purple-800/85 to-orange-900/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
        className="w-full max-w-3xl mx-4 bg-white rounded-[2rem] shadow-2xl shadow-purple-900/40 overflow-hidden"
      >
        {/* Header */}
        <div className="text-center px-8 pt-8 pb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
            <MapPin size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-1">
            Chọn Vùng Miền Của Bạn
          </h2>
          <p className="text-gray-400 text-sm font-medium max-w-md mx-auto">
            Hệ thống cần biết bạn muốn học giọng vùng nào để cá nhân hoá lộ trình phù hợp nhất
          </p>
        </div>

        {/* Region Cards */}
        <div className="px-6 pb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {REGION_CHOICES.map((r, idx) => {
            const isChosen = selected === r.value;
            return (
              <motion.div
                key={r.value}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, type: "spring", stiffness: 120 }}
                whileHover={{ y: -4 }}
                onClick={() => setSelected(r.value)}
                className={`relative cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-300 group ${isChosen
                  ? "border-purple-500 shadow-lg shadow-purple-500/20 ring-2 ring-purple-400/30"
                  : "border-gray-100 hover:border-purple-200 hover:shadow-md"
                  }`}
              >
                {/* Photo */}
                <div className="relative h-28 overflow-hidden">
                  <img
                    src={r.photo}
                    alt={r.label}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <h3 className="text-lg font-black text-white drop-shadow leading-none">{r.label}</h3>
                    <div className="text-white bg-white/20 backdrop-blur-sm p-1.5 rounded-lg border border-white/20">
                      <r.icon size={18} strokeWidth={2.5} />
                    </div>
                  </div>
                  {isChosen && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center shadow-md"
                    >
                      <span className="text-white text-sm font-black">✓</span>
                    </motion.div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3.5">
                  <p className="text-[10px] font-black text-purple-500 tracking-widest mb-1">{r.tagline}</p>
                  <p className="text-xs text-gray-400 font-medium leading-relaxed line-clamp-2">{r.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="px-8 pb-8 pt-2">
          <button
            onClick={handleConfirm}
            disabled={!selected || saving}
            className={`w-full h-13 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all duration-300 ${selected
              ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-0.5"
              : "bg-gray-100 text-gray-300 cursor-not-allowed"
              }`}
            style={{ height: 52 }}
          >
            {saving ? (
              <><Loader2 size={18} className="animate-spin" /> Đang lưu...</>
            ) : (
              <>Xác nhận & Bắt đầu 🚀</>
            )}
          </button>

          <button
            onClick={onLogout}
            disabled={saving}
            className="w-full mt-3 h-11 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 text-red-500 bg-red-50 hover:bg-red-100 transition-all duration-300 border border-red-100"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>

          <p className="text-center text-[11px] text-gray-300 mt-4 font-medium">
            Bạn có thể thay đổi vùng miền sau trong phần Hồ sơ cá nhân
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default function LearnerLayout() {
  const { session, logout, updateSessionItem } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarErr, setAvatarErr] = useState(false);

  const user = session?.user || { fullName: "Learner", avatar: null };

  // Reset error when avatar changes
  React.useEffect(() => {
    setAvatarErr(false);
  }, [user?.avatar]);

  // Check if region is missing
  const hasRegion = Boolean(user?.region && user.region.trim() !== "");

  const handleRegionSelected = (region) => {
    updateSessionItem?.({ region });
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userMenu = {
    items: [
      {
        key: "profile",
        icon: <User size={16} />,
        label: <Link to="/learner/profile">Hồ sơ cá nhân</Link>,
      },
      { type: "divider" },
      {
        key: "logout",
        icon: <LogOut size={16} className="text-red-500" />,
        label: <span className="text-red-500 font-semibold">Đăng xuất</span>,
        onClick: handleLogout,
      },
    ],
  };

  const menuItems = [
    { key: "/learner/dashboard", icon: LayoutDashboard, label: "Trang chủ" },
    { key: "/learner/mailbox", icon: Mail, label: "Hộp thư" },
    { key: "/learner/roadmap", icon: Map, label: "Hành trình" },
    { key: "/learner/pronunciation", icon: Mic, label: "Phát âm" },
    { key: "/learner/custom-journey", icon: Sparkles, label: "Gợi ý học" },
    { key: "/learner/leaderboard", icon: Trophy, label: "Xếp hạng" },
    { key: "/learner/achievements", icon: Award, label: "Thành tựu" },
    { key: "/learner/friends", icon: Users, label: "Bạn bè" },
  ];

  const selectedKey = menuItems.find(
    (item) =>
      location.pathname === item.key ||
      location.pathname.startsWith(`${item.key}/`)
  )?.key || "/learner/dashboard";

  return (
    <div className="flex flex-col h-screen bg-[#fbfaff] font-nunito overflow-hidden">

      {/* ── MANDATORY REGION SELECTION OVERLAY ── */}
      {!hasRegion && user?.role !== 'ADMIN' && user?.role !== 'EDUCATOR' && (
        <RegionSelectionOverlay onSelected={handleRegionSelected} onLogout={handleLogout} />
      )}

      {/* ══════════════════════════════════════════════════════
          TOP NAVIGATION BAR (Doodle Minimalist Style)
          ══════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-[100] bg-[#fbf6ef]/95 backdrop-blur-md px-6 py-4">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/learner/dashboard" className="group flex items-center text-left">
              <img
                src={logoImg}
                alt="SpeakVN Logo"
                className="h-14 w-auto drop-shadow-[2px_2px_0_rgba(0,0,0,0.1)] transition-transform duration-200 group-hover:-translate-y-0.5"
              />
            </Link>

            {/* Navigation - Hidden on small screens, simplified */}
            <nav className="hidden xl:flex items-center gap-6">
              {menuItems.map((item) => {
                const isActive = selectedKey === item.key;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.key}
                    to={item.key}
                    className={`group relative flex items-center gap-2 px-1 py-1 transition-colors ${isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    <Icon size={14} className={isActive ? "text-[#49B6E5]" : "text-slate-400 group-hover:text-[#49B6E5]"} />
                    <span className="text-[13px] font-black tracking-tight whitespace-nowrap">
                      {item.label}
                    </span>
                    {isActive && (
                      <motion.span
                        layoutId="activeNav"
                        className="absolute -bottom-1 left-0 right-0 h-1 rounded-full bg-[#7dd3fc]"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Stats */}
              <div className="hidden sm:flex items-center gap-3 rounded-full border-[2px] border-slate-900 bg-white px-3 py-1.5 shadow-[3px_3px_0_#1f2937]">
                <div className="flex items-center gap-1 border-r border-slate-200 pr-2">
                  <Flame size={12} className="text-orange-500 fill-orange-500" />
                  <span className="text-slate-700 font-black text-[11px]">{user?.currentStreakDays || user?.streak || "0"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-yellow-500 fill-yellow-500" />
                  <span className="text-slate-700 font-black text-[11px]">{user?.totalStars || 0}</span>
                </div>
              </div>

              {/* User Dropdown */}
              <Dropdown menu={userMenu} placement="bottomRight" trigger={["click"]}>
                <button type="button" className="flex items-center gap-2 rounded-full border-[2px] border-slate-900 bg-white p-0.5 pr-2.5 shadow-[3px_3px_0_#1f2937] transition-transform hover:-translate-y-0.5">
                  <Avatar
                    src={avatarErr ? null : (user.avatar_url || user.avatar)}
                    onError={() => { setAvatarErr(true); return true; }}
                    icon={<UserCircle2 />}
                    size={32}
                    className="bg-[#49B6E5] text-white border-2 border-white"
                  />
                  <div className="hidden md:block text-left">
                    <div className="text-[11px] font-black leading-none text-slate-800 mb-0.5 truncate max-w-[100px]">{user.fullName || "User"}</div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-[#49B6E5]">Học viên</div>
                  </div>
                </button>
              </Dropdown>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="grid h-10 w-10 place-items-center rounded-full border-[2px] border-slate-900 bg-white text-slate-700 shadow-[3px_3px_0_#1f2937] xl:hidden"
                aria-label="Open menu"
              >
                <Menu size={18} />
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
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-orange-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <Sparkles size={18} className="text-white" />
                  </div>
                  <span className="font-black text-xl tracking-tight">SpeakVN</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-2 custom-scrollbar">
                <h3 className="px-3 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Hệ thống menu</h3>
                {menuItems.map((item) => {
                  const isActive = selectedKey === item.key;
                  const Icon = item.icon;
                  return (
                    <Link key={item.key} to={item.key} onClick={() => setMobileMenuOpen(false)}>
                      <div className={`flex items-center gap-3.5 px-5 py-4 rounded-2xl font-black text-[15px] transition-all
                        ${isActive ? "bg-purple-600 text-white shadow-xl shadow-purple-600/20" : "text-gray-600 hover:bg-purple-50 active:scale-95"}`}>
                        <Icon size={20} />
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
                  <LogOut size={20} /> Đăng xuất
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── CONTENT AREA ── */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
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
