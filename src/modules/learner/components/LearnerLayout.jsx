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
const RegionSelectionOverlay = ({ onSelected }) => {
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
          <p className="text-center text-[11px] text-gray-300 mt-3 font-medium">
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

  const user = session?.user || { fullName: "Learner", avatar: null };

  // Check if region is missing (null, undefined, empty)
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
    { key: "/learner/roadmap", icon: Map, label: "Hành trình" },
    { key: "/learner/friends", icon: Users, label: "Bạn bè" },
    { key: "/learner/pronunciation", icon: Mic, label: "Phát âm" },
    { key: "/learner/leaderboard", icon: Trophy, label: "Xếp hạng" },
    { key: "/learner/profile", icon: UserCircle2, label: "Hồ sơ" },
  ];

  const selectedKey = menuItems.find(
    (item) =>
      location.pathname === item.key ||
      location.pathname.startsWith(`${item.key}/`)
  )?.key || "/learner/dashboard";

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f5ff] font-nunito">

      {/* ── MANDATORY REGION SELECTION OVERLAY ── */}
      {!hasRegion && user?.role !== 'ADMIN' && user?.role !== 'EDUCATOR' && (
        <RegionSelectionOverlay onSelected={handleRegionSelected} />
      )}

      {/* ══════════════════════════════════════════════════════
          TOP NAVBAR — Premium Glassmorphism
          ══════════════════════════════════════════════════════ */}
      <header className="flex-shrink-0 sticky top-0 z-50 w-full">
        {/* Gradient accent strip */}
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #7c3aed, #9333ea, #a855f7, #f97316, #fb923c)' }} />

        <div className="bg-white/95 backdrop-blur-xl border-b border-purple-100/50"
          style={{ boxShadow: '0 4px 30px rgba(147,51,234,0.08)' }}>
          <div className="flex items-center justify-between h-14 px-5 lg:px-8">

            {/* ── Left: Logo ── */}
            <Link to="/learner/dashboard" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 via-purple-500 to-orange-500 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-shadow">
                  <Sparkles size={15} className="text-white" />
                </div>
                <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-purple-400 to-orange-400 opacity-0 group-hover:opacity-20 blur-md transition-opacity" />
              </div>
              <span className="font-black text-lg tracking-tight hidden sm:inline">
                Speak<span className="bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">VN</span>
              </span>
            </Link>

            {/* ── Center: Nav Pill Bar (desktop) ── */}
            <nav className="hidden md:flex items-center gap-1 bg-gradient-to-r from-gray-50/90 to-purple-50/40 rounded-3xl p-1.5 border border-purple-100/60 backdrop-blur-md"
              style={{ boxShadow: 'inset 0 1px 3px rgba(147,51,234,0.06)' }}>
              {menuItems.map((item) => {
                const isActive = selectedKey === item.key;
                const Icon = item.icon;
                return (
                  <Link key={item.key} to={item.key}>
                    <div
                      className={`relative flex items-center gap-1.5 px-4 lg:px-5 py-2 rounded-[14px] cursor-pointer transition-all duration-200 text-[13px] font-bold
                        ${isActive
                          ? "text-white"
                          : "text-gray-500 hover:text-purple-700 hover:bg-white/80"
                        }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="topNavActive"
                          className="absolute inset-0 rounded-[14px]"
                          style={{
                            background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 60%, #a855f7 100%)',
                            boxShadow: '0 4px 12px rgba(147,51,234,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
                          }}
                          transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                        />
                      )}
                      <Icon size={14} className="relative z-10 flex-shrink-0" />
                      <span className="relative z-10 whitespace-nowrap">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* ── Right: Streak + Stars + User ── */}
            <div className="flex items-center gap-2">
              {/* Streak */}
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 rounded-full border border-orange-100">
                <FireFilled className="text-orange-500 text-sm" />
                <span className="text-orange-600 font-black text-xs">
                  {user?.currentStreakDays || user?.streak || "0"} ngày
                </span>
              </div>

              {/* Stars */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 rounded-full border border-yellow-100">
                <span className="text-yellow-500 text-sm">⭐</span>
                <span className="text-yellow-600 font-black text-xs">
                  {user?.totalStars || 0}
                </span>
              </div>

              {/* User Dropdown */}
              <Dropdown menu={userMenu} placement="bottomRight" trigger={["click"]}>
                <div className="flex items-center gap-2 cursor-pointer px-2.5 py-1.5 rounded-xl hover:bg-purple-50/80 transition-all border border-transparent hover:border-purple-100">
                  <Avatar
                    src={user.avatar}
                    icon={!user.avatar && <UserOutlined />}
                    size={32}
                    className="bg-gradient-to-br from-purple-100 to-orange-50 text-purple-600 border-2 border-purple-200 flex-shrink-0"
                  />
                  <div className="hidden md:block">
                    <div className="text-[13px] font-bold text-gray-800 leading-tight">{user.fullName?.split(" ").pop() || "User"}</div>
                    <div className="text-[9px] text-purple-500 font-black uppercase tracking-wider">Học viên</div>
                  </div>
                </div>
              </Dropdown>

              {/* Mobile Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 hover:bg-purple-100 transition-all"
              >
                {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Dropdown Menu ── */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden border-t border-purple-100/50 bg-white/95 backdrop-blur-xl"
            >
              <nav className="p-3 space-y-1">
                {menuItems.map((item) => {
                  const isActive = selectedKey === item.key;
                  const Icon = item.icon;
                  return (
                    <Link key={item.key} to={item.key} onClick={() => setMobileMenuOpen(false)}>
                      <div
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all
                          ${isActive
                            ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md"
                            : "text-gray-600 hover:bg-purple-50 hover:text-purple-700"
                          }`}
                      >
                        <Icon size={18} />
                        {item.label}
                      </div>
                    </Link>
                  );
                })}
              </nav>
              {/* Mobile streak/stars */}
              <div className="flex items-center gap-3 px-4 pb-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 rounded-full border border-orange-100">
                  <FireFilled className="text-orange-500 text-sm" />
                  <span className="text-orange-600 font-black text-xs">
                    {user?.currentStreakDays || user?.streak || "0"} ngày
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 rounded-full border border-yellow-100">
                  <span className="text-yellow-500 text-sm">⭐</span>
                  <span className="text-yellow-600 font-black text-xs">
                    {user?.totalStars || 0}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ══════════════════════════════════════════════════════
          MAIN CONTENT (grows naturally)
          ══════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="min-h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
