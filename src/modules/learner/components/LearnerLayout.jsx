import React, { useState } from "react";
import { Layout, Menu, Typography, Dropdown, Avatar } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppstoreOutlined,
  CompassOutlined,
  CalendarOutlined,
  UserOutlined,
  LogoutOutlined,
  TrophyOutlined,
  FireFilled,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
  SoundOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../../core/auth/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import bgImage from "../../../../public/vietnam_bg.png";

const { Sider, Content } = Layout;
const { Text } = Typography;

export default function LearnerLayout() {
  const { session, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  // Fallbacks if session is missing
  const user = session?.user || { fullName: "Learner", avatar: null };

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
      {
        type: "divider",
      },
      {
        key: "logout",
        icon: <LogoutOutlined className="text-red-500" />,
        label: <span className="text-red-500 font-medium">Đăng xuất</span>,
        onClick: handleLogout,
      },
    ],
  };

  const menuItems = [
    {
      key: "/learner/dashboard",
      icon: <AppstoreOutlined className="text-lg" />,
      label: (
        <Link to="/learner/dashboard" className="font-bold text-sm tracking-wide">
          Bảng điều khiển
        </Link>
      ),
    },
    {
      key: "/learner/roadmap",
      icon: <CompassOutlined className="text-lg" />,
      label: (
        <Link to="/learner/roadmap" className="font-bold text-sm tracking-wide">
          Bản đồ hành trình
        </Link>
      ),
    },
    {
      key: "/learner/friends",
      icon: <TeamOutlined className="text-lg" />,
      label: (
        <Link to="/learner/friends" className="font-bold text-sm tracking-wide">
          Bạn bè
        </Link>
      ),
    },
    {
      key: "/learner/pronunciation",
      icon: <SoundOutlined className="text-lg" />,
      label: (
        <Link to="/learner/pronunciation" className="font-bold text-sm tracking-wide">
          Mô hình phát âm
        </Link>
      ),
    },
    {
      key: "/learner/leaderboard",
      icon: <TrophyOutlined className="text-lg" />,
      label: (
        <Link to="/learner/leaderboard" className="font-bold text-sm tracking-wide">
          Bảng xếp hạng
        </Link>
      ),
    },
  ];

  const selectedKey = menuItems.find(
    (item) => location.pathname === item.key || location.pathname.startsWith(`${item.key}/`)
  )?.key || "/learner/dashboard";

  return (
    <Layout className="min-h-screen bg-black overflow-hidden selection:bg-brand-green selection:text-white relative">
      {/* Immersive Background */}
      {location.pathname !== "/learner/roadmap" && (
        <div className="fixed inset-0 z-0">
          <img
            src={bgImage}
            alt="Vietnam Landscape"
            className="w-full h-full object-cover opacity-60 brightness-[0.7] contrast-[1.1] animate-slow-zoom"
            style={{ imageRendering: '-webkit-optimize-contrast' }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-black/80"></div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={260}
        theme="dark"
        className="z-50 !bg-black/20 backdrop-blur-2xl border-r border-white/10"
        style={{ position: "sticky", top: 0, height: "100vh" }}
      >
        <div className="flex flex-col h-full">
          {/* Top Section: Logo */}
          <div
            className="h-20 flex items-center px-6 border-b border-white/5 shrink-0 cursor-pointer overflow-hidden"
            onClick={() => setCollapsed(!collapsed)}
          >
            <motion.div
              layout
              className={clsx(
                "flex items-center gap-3 transition-all duration-300",
                collapsed ? "w-10 justify-center" : "w-full justify-start"
              )}
            >
              <div className="w-10 h-10 min-w-[40px] rounded-xl bg-brand-green flex items-center justify-center shadow-lg shadow-brand-green/20">
                <TrophyOutlined className="text-white text-xl" />
              </div>
              {!collapsed && (
                <span className="font-black text-2xl text-white italic tracking-tighter">
                  Speak<span className="text-brand-green">VN</span>
                </span>
              )}
            </motion.div>
          </div>

          {/* Middle Section: Menu */}
          <div className="flex-1 overflow-y-auto py-6 custom-scrollbar-sidebar">
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              items={menuItems}
              className="!bg-transparent border-none px-3 sidebar-menu"
            />
          </div>

          {/* Bottom Section: Profile */}
          <div className="shrink-0 border-t border-white/5 p-4 space-y-4 bg-black/40">
            <div className={clsx("transition-opacity duration-300", collapsed ? "hidden" : "block")}>
              <div className="flex items-center gap-3 bg-white/5 px-3 py-2.5 rounded-2xl border border-white/10">
                <FireFilled className="text-orange-500 text-lg" />
                <span className="font-black text-white text-xs uppercase tracking-widest">
                  {user?.streak || "0"} NGÀY HỌC
                </span>
              </div>
            </div>

            {collapsed && (
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500 border border-orange-500/20">
                  <FireFilled />
                </div>
              </div>
            )}

            <Dropdown menu={userMenu} placement="topRight" trigger={["click"]}>
              <div
                className={clsx(
                  "flex items-center cursor-pointer p-2 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10",
                  collapsed ? "justify-center" : "gap-3"
                )}
              >
                <Avatar
                  src={user.avatar}
                  icon={!user.avatar && <UserOutlined />}
                  size={42}
                  className="bg-brand-green/20 text-brand-green border border-brand-green/30 shrink-0"
                />
                {!collapsed && (
                  <div className="flex-1 min-w-0 flex flex-col leading-tight">
                    <Text className="text-sm font-bold text-white truncate">
                      {user.fullName || "Người dùng"}
                    </Text>
                    <Text className="text-[10px] text-white/40 uppercase tracking-widest font-black">
                      Học viên
                    </Text>
                  </div>
                )}
              </div>
            </Dropdown>
          </div>
        </div>
      </Sider>

      {/* Main Content Area */}
      <Layout className="!bg-transparent flex-1 relative z-10 transition-all duration-300">
        {/* Header Decoration */}
        <div className="absolute top-0 right-0 p-8 flex items-center gap-6 text-white/50 z-20">
          <SearchOutlined className="text-lg cursor-pointer hover:text-white transition-colors" />
          <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
            <div className="w-1 h-1 bg-white rounded-full mx-0.5"></div>
            <div className="w-1 h-1 bg-white rounded-full mx-0.5"></div>
            <div className="w-1 h-1 bg-white rounded-full mx-0.5"></div>
          </div>
        </div>

        <Content className="p-4 sm:px-12 sm:pt-8 sm:pb-12 w-full min-h-screen relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </Content>
      </Layout>

      <style>{`
        .sidebar-menu .ant-menu-item {
          border-radius: 1rem !important;
          margin-bottom: 8px !important;
          color: rgba(255, 255, 255, 0.6) !important;
          height: 48px !important;
          display: flex !important;
          align-items: center !important;
        }
        .sidebar-menu .ant-menu-item-selected {
          background-color: rgba(88, 204, 2, 0.1) !important;
          color: #58cc02 !important;
        }
        .sidebar-menu .ant-menu-item:hover {
          color: white !important;
          background-color: rgba(255, 255, 255, 0.05) !important;
        }
        .sidebar-menu .ant-menu-item-selected .ant-menu-item-icon {
          color: #58cc02 !important;
        }
        .sidebar-menu .ant-menu-item .ant-menu-item-icon {
          transition: transform 0.3s ease;
        }
        .sidebar-menu .ant-menu-item:hover .ant-menu-item-icon {
          transform: scale(1.1);
        }
        .custom-scrollbar-sidebar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar-sidebar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar-sidebar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        @keyframes slow-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }
        .animate-slow-zoom {
          animation: slow-zoom 60s infinite alternate ease-in-out;
        }
      `}</style>
    </Layout>
  );
}
