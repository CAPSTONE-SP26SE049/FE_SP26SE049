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
} from "lucide-react";

const REGION_CHOICES = [
  {
    value: "north",
    label: "Giọng miền Bắc",
    emoji: "🏛️",
    tagline: "Thanh lịch & Chuẩn mực",
    description: "Chinh phục phát âm chuẩn — nền tảng tiếng Việt quy chuẩn.",
    photo: "/region_mien_bac.png",
    gradient: "from-indigo-600 to-blue-700",
  },
  {
    value: "central",
    label: "Giọng miền Trung",
    emoji: "🏯",
    tagline: "Nồng hậu & Di sản",
    description: "Khám phá giọng nói đặc trưng vùng đất cố đô và di sản văn hoá.",
    photo: "/region_mien_trung.png",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    value: "south",
    label: "Giọng miền Nam",
    emoji: "🌆",
    tagline: "Sôi động & Cởi mở",
    description: "Làm quen với giọng Nam năng động, cởi mở và thân thiện.",
    photo: "/region_mien_nam.png",
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
                  <div className={`absolute inset-0 bg-gradient-to-t ${r.gradient} opacity-70`} />
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <h3 className="text-lg font-black text-white drop-shadow leading-none">{r.label}</h3>
                    <span className="text-xl">{r.emoji}</span>
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
            <LogoutOutlined />
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
        icon: <UserOutlined />,
        label: <Link to="/learner/profile">Hồ sơ cá nhân</Link>,
      },
      { type: "divider" },
      {
        key: "logout",
        icon: <LogoutOutlined className="text-red-500" />,
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
          TOP NAVIGATION BAR (Optimized)
          ══════════════════════════════════════════════════════ */}
      <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-purple-100/50 flex items-center px-6 sticky top-0 z-[100] shadow-[0_4px_24px_rgba(147,51,234,0.02)]">

        {/* Logo Section */}
        <div className="flex-shrink-0 mr-10">
          <Link to="/learner/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-orange-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="hidden xl:block font-black text-xl tracking-tight">
              Speak<span className="text-purple-600">VN</span>
            </span>
          </Link>
        </div>

        {/* Navigation Links - Centered & Optimized */}
        <nav className="hidden lg:flex items-center justify-center flex-1 gap-1 max-w-4xl mx-auto">
          {menuItems.map((item) => {
            const isActive = selectedKey === item.key;
            const Icon = item.icon;
            return (
              <Link key={item.key} to={item.key} className="relative px-3 py-2 flex items-center gap-2 rounded-xl group transition-all duration-300">
                {isActive && (
                  <motion.div
                    layoutId="topNavLinkActive"
                    className="absolute inset-0 bg-purple-50 rounded-xl border border-purple-100/50"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <div className={`relative z-10 flex items-center gap-2 transition-colors duration-300 ${isActive ? "text-purple-700" : "text-gray-500 group-hover:text-purple-600"}`}>
                  <Icon size={17} className={isActive ? "text-purple-600" : "text-gray-400 group-hover:text-purple-400"} />
                  <span className="text-[13px] font-black tracking-tight whitespace-nowrap">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* Right Side (Stats + Profile) */}
        <div className="flex items-center gap-2.5 ml-auto pl-4">
          {/* Quick Stats - Combined Pill */}
          <div className="hidden sm:flex items-center gap-3 px-3.5 py-1.5 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
            <div className="flex items-center gap-1.5 border-r border-gray-200 pr-3">
              <FireFilled className="text-orange-500 text-sm" />
              <span className="text-gray-700 font-black text-xs">
                {user?.currentStreakDays || user?.streak || "0"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-yellow-500 text-sm leading-none mt-[-2px]">⭐</span>
              <span className="text-gray-700 font-black text-xs">
                {user?.totalStars || 0}
              </span>
            </div>
          </div>

          <div className="w-px h-8 bg-gray-100 mx-1 hidden md:block"></div>

          {/* Profile Dropdown */}
          <Dropdown menu={userMenu} placement="bottomRight" trigger={["click"]}>
            <div className="flex items-center gap-2.5 cursor-pointer group hover:bg-gray-50/50 p-1 pr-3 rounded-2xl transition-all">
              <div className="relative">
                <Avatar
                  src={avatarErr ? null : (user.avatar_url || user.avatar)}
                  onError={() => { setAvatarErr(true); return true; }}
                  icon={<UserCircle2 />}
                  size={38}
                  className="bg-purple-100 text-purple-600 border-2 border-white shadow-md transition-transform group-hover:scale-105"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="hidden xl:block">
                <div className="text-[13px] font-black text-gray-800 leading-none mb-0.5">
                  {user.fullName || "User"}
                </div>
                <div className="text-[10px] text-purple-500 font-bold uppercase tracking-wider opacity-60">Học viên</div>
              </div>
            </div>
          </Dropdown>
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
                  <LogoutOutlined /> Đăng xuất
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
