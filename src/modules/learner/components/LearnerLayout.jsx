import React, { useState } from "react";
import { Layout, Menu, Typography, Dropdown, Avatar, Badge, Input, Tooltip } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppstoreOutlined,
  CompassOutlined,
  UserOutlined,
  LogoutOutlined,
  TrophyOutlined,
  BellOutlined,
  SearchOutlined,
  GlobalOutlined,
  FireOutlined,
  ThunderboltFilled,
  HomeOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../../core/auth/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

const { Content, Header, Sider } = Layout;
const { Text } = Typography;

export default function LearnerLayout() {
  const { session, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const user = session?.user || { fullName: "Học viên", avatar: null };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    {
      key: "personal",
      label: "LUYỆN TẬP CÁ NHÂN",
      type: "group",
      children: [
        { key: "/learner/dashboard", label: "Bảng điều khiển", icon: <HomeOutlined /> },
        { key: "/learner/roadmap", label: "Lộ trình học tập", icon: <CompassOutlined /> },
      ]
    },
    {
      key: "regions",
      label: "CHƯƠNG TRÌNH VÙNG MIỀN",
      type: "group",
      children: [
        { key: "/learner/roadmap?region=north", label: "Luyện giọng miền Bắc", icon: <GlobalOutlined /> },
        { key: "/learner/roadmap?region=central", label: "Luyện giọng miền Trung", icon: <GlobalOutlined /> },
        { key: "/learner/roadmap?region=south", label: "Luyện giọng miền Nam", icon: <GlobalOutlined /> },
      ]
    },
    {
      key: "community",
      label: "CỘNG ĐỒNG",
      type: "group",
      children: [
        { key: "/learner/leaderboard", label: "Bảng xếp hạng", icon: <TrophyOutlined /> },
      ]
    }
  ];

  const userMenu = {
    items: [
      {
        key: "profile",
        icon: <UserOutlined />,
        label: <Link to="/learner/profile">Hồ sơ cá nhân</Link>,
      },
      {
        key: "logout",
        icon: <LogoutOutlined className="text-red-500" />,
        label: <span className="text-red-500">Đăng xuất</span>,
        onClick: handleLogout,
      },
    ],
  };

  return (
    <Layout className="min-h-screen bg-[#F7F9FC]">
      {/* LEFT SIDEBAR */}
      <Sider
        width={280}
        theme="light"
        className="hidden lg:block border-r border-[#E0E3E7] fixed h-screen left-0 z-50 overflow-y-auto"
        style={{ background: "#fff" }}
      >
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00897B] flex items-center justify-center shadow-lg shadow-[#00897B]/20">
            <ThunderboltFilled className="text-white text-xl" />
          </div>
          <span className="font-black text-xl text-[#202124] tracking-tighter uppercase italic">
            Accent<span className="text-[#00897B]">VN</span>
          </span>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="px-4 border-none !bg-transparent"
          onClick={({ key }) => navigate(key)}
          style={{ fontFamily: "Inter, sans-serif" }}
        />

        <div className="absolute bottom-6 left-0 w-full px-6">
           <Dropdown menu={userMenu} placement="top" trigger={["click"]}>
             <div className="flex items-center gap-3 cursor-pointer p-3 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-[#E0E3E7] transition-all">
               <Avatar src={user.avatar} size={40} icon={<UserOutlined />} className="bg-[#00897B]" />
               <div className="flex flex-col overflow-hidden">
                 <span className="text-sm font-bold text-[#202124] truncate">{user.fullName}</span>
                 <span className="text-[10px] text-[#5F6368] font-bold uppercase tracking-wider">Học tập trung</span>
               </div>
             </div>
           </Dropdown>
        </div>
      </Sider>

      <Layout className="lg:ml-[280px]">
        {/* HEADER */}
        <Header className="h-20 bg-transparent px-8 flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-[#202124] leading-tight">
              Xin chào, <span className="text-[#00897B]">{user.fullName.split(' ')[0]}!</span>
            </h2>
            <p className="text-xs text-[#5F6368] font-bold uppercase tracking-widest">Hôm nay bạn muốn luyện tập gì?</p>
          </div>

          <div className="flex items-center gap-6">
            {/* Search */}
            <div className="hidden md:flex items-center bg-white px-4 py-2 rounded-2xl border border-[#E0E3E7] shadow-sm w-64 focus-within:border-[#00897B] transition-all">
              <SearchOutlined className="text-[#5F6368] mr-2" />
              <input type="text" placeholder="Tìm kiếm bài học..." className="bg-transparent border-none outline-none text-sm w-full font-medium" />
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4">
              <Tooltip title="Số điểm kinh nghiệm">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-[#E0E3E7] shadow-sm">
                  <ThunderboltFilled className="text-[#FB8C00]" />
                  <span className="text-sm font-black text-[#202124]">350 <span className="text-[10px] text-[#5F6368]">XP</span></span>
                </div>
              </Tooltip>

              <Tooltip title="Chuỗi ngày học liên tiếp">
                <div className="flex items-center gap-2 bg-[#FFF3E0] px-4 py-2 rounded-2xl border border-[#FFE0B2]">
                  <FireOutlined className="text-[#E65100]" />
                  <span className="text-sm font-black text-[#E65100]">12 <span className="text-[10px] opacity-70">NGÀY</span></span>
                </div>
              </Tooltip>

              <Badge dot color="#00897B">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E0E3E7] flex items-center justify-center cursor-pointer hover:bg-gray-50 shadow-sm transition-all">
                   <BellOutlined className="text-lg text-[#5F6368]" />
                </div>
              </Badge>
            </div>
          </div>
        </Header>

        {/* CONTENT */}
        <Content className="px-8 pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </Content>
      </Layout>

      <style>{`
        .ant-menu-item-selected {
          background-color: #E0F2F1 !important;
          color: #00897B !important;
          border-radius: 12px !important;
        }
        .ant-menu-item {
          height: 48px !important;
          line-height: 48px !important;
          border-radius: 12px !important;
          margin-bottom: 4px !important;
          font-weight: 600 !important;
        }
        .ant-menu-item:hover {
          color: #00897B !important;
        }
        .ant-menu-item-group-title {
          font-weight: 800 !important;
          font-size: 10px !important;
          color: #9AA0A6 !important;
          letter-spacing: 0.1em !important;
          padding-top: 24px !important;
        }
      `}</style>
    </Layout>
  );
}
