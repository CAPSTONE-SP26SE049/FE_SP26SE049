import React, { useState } from "react";
import { Layout, Menu, Typography, Dropdown, Avatar, Badge, Input } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppstoreOutlined,
  CompassOutlined,
  UserOutlined,
  LogoutOutlined,
  TrophyOutlined,
  BellOutlined,
  SearchOutlined,
  SoundOutlined,
  TeamOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../../core/auth/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

const { Content, Header } = Layout;
const { Text } = Typography;

export default function LearnerLayout() {
  const { session, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const user = session?.user || { fullName: "Học viên", avatar: null };

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
        key: "settings",
        icon: <SettingOutlined />,
        label: "Cài đặt",
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

  const navItems = [
    { key: "/learner/dashboard", label: "Bảng điều khiển", icon: <AppstoreOutlined /> },
    { key: "/learner/roadmap", label: "Hành trình", icon: <CompassOutlined /> },
    { key: "/learner/friends", label: "Bạn bè", icon: <TeamOutlined /> },
    { key: "/learner/pronunciation", label: "Phát âm", icon: <SoundOutlined /> },
    { key: "/learner/leaderboard", label: "Bảng xếp hạng", icon: <TrophyOutlined /> },
  ];

  return (
    <Layout className="min-h-screen bg-[#F8F9FA] font-sans selection:bg-[#00897B] selection:text-white">
      {/* Top Professional Navbar */}
      <Header className="sticky top-0 z-50 w-full !bg-white border-b border-[#E0E3E7] h-16 px-6 md:px-10 flex items-center justify-between shadow-sm">
        {/* Logo Section */}
        <div 
          className="flex items-center gap-3 cursor-pointer shrink-0" 
          onClick={() => navigate("/learner/dashboard")}
        >
          <div className="w-9 h-9 rounded-lg bg-[#00897B] flex items-center justify-center shadow-md">
            <TrophyOutlined className="text-white text-lg" />
          </div>
          <span className="font-bold text-xl text-[#202124] tracking-tight">
            MONA<span className="text-[#00897B]">.LMS</span>
          </span>
        </div>

        {/* Center Navigation Tabs */}
        <div className="hidden lg:flex items-center gap-1 mx-4">
          {navItems.map((item) => (
            <Link
              key={item.key}
              to={item.key}
              className={clsx(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
                location.pathname === item.key || location.pathname.startsWith(`${item.key}/`)
                  ? "bg-[#E0F2F1] text-[#00897B]"
                  : "text-[#5F6368] hover:bg-gray-100 hover:text-[#202124]"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right Section: Search, Notifications, Profile */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center bg-[#F1F3F4] px-3 py-1.5 rounded-full border border-transparent focus-within:bg-white focus-within:border-[#00897B] transition-all w-48 lg:w-64">
            <SearchOutlined className="text-[#5F6368] mr-2" />
            <input 
              type="text" 
              placeholder="Tìm kiếm..." 
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-[#5F6368]"
            />
          </div>

          <Badge dot color="#FB8C00" offset={[-2, 6]}>
            <div className="p-2 cursor-pointer hover:bg-gray-100 rounded-full transition-colors">
              <BellOutlined className="text-lg text-[#5F6368]" />
            </div>
          </Badge>

          <Dropdown menu={userMenu} placement="bottomRight" trigger={["click"]}>
            <div className="flex items-center gap-3 cursor-pointer p-1.5 pr-4 pl-1.5 rounded-full border border-[#E0E3E7] hover:bg-gray-50 hover:border-[#00897B]/30 transition-all bg-white shadow-sm">
              <Avatar
                src={user.avatar}
                size={34}
                icon={!user.avatar && <UserOutlined />}
                className="bg-[#00897B] border-none shadow-sm shrink-0"
              />
              <div className="hidden sm:flex flex-col items-start leading-none">
                <span className="text-[11px] font-extrabold text-[#202124] mb-0.5 truncate max-w-[100px]">
                  {user.fullName || "Học viên"}
                </span>
                <span className="text-[9px] text-[#5F6368] font-bold uppercase tracking-wider">Học viên</span>
              </div>
            </div>
          </Dropdown>
        </div>
      </Header>

      {/* Main Content Area */}
      <Content className="p-6 md:p-10 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </Content>

      <style>{`
        body {
          margin: 0;
          background-color: #F8F9FA;
        }
        input::placeholder {
          color: #5F6368;
        }
        .ant-layout {
          background-color: #F8F9FA !important;
        }
      `}</style>
    </Layout>
  );
}
