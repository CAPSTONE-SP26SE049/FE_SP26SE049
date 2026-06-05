import React, { useEffect, useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Dropdown, Badge, message } from "antd";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {
  Bell,
  CheckCheck,
  MessageCircle,
  UserPlus,
  Award,
  BellOff,
  Sparkles
} from "lucide-react";
import { apiClient } from "../../../services/apiClient";
import { API_BASE_URL } from "../../../config";

export interface NotificationItem {
  id: string;
  type: string; // MESSAGE, FRIEND_REQUEST, FRIEND_ACCEPTED, EDUCATOR_FEEDBACK
  title: string;
  message: string;
  referenceId: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationDropdownProps {
  currentUserId: string;
  token: string | null;
}

export default function NotificationDropdown({ currentUserId, token }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [open, setOpen] = useState<boolean>(false);
  const stompClientRef = useRef<Client | null>(null);

  const sockJsUrl = useMemo(() => {
    return API_BASE_URL.replace("/api/v1", "/ws");
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get("/notifications");
      // apiClient unwarps response.data, which is { success: true, data: [...] }
      const list = res?.data || res || [];
      if (Array.isArray(list)) {
        setNotifications(list);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await apiClient.get("/notifications/unread-count");
      // unreadCount is inside data { unreadCount: X }
      const countObj = res?.data || res || {};
      const count = countObj.unreadCount != null ? Number(countObj.unreadCount) : 0;
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  };

  // Initial load
  useEffect(() => {
    if (currentUserId) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [currentUserId]);

  // Connect to STOMP WebSocket for real-time notifications
  useEffect(() => {
    if (!token || !currentUserId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(sockJsUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      connectionTimeout: 10000,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        // Subscribe to user notifications channel
        client.subscribe(`/topic/notifications/${currentUserId}`, (frame) => {
          try {
            const newNotif = JSON.parse(frame.body) as NotificationItem;
            if (newNotif && newNotif.id) {
              setNotifications((prev) => [newNotif, ...prev]);
              setUnreadCount((prev) => prev + 1);
              
              // Nice subtle message toast
              message.info({
                content: `🔔 ${newNotif.title}: ${newNotif.message}`,
                duration: 4,
              });
            }
          } catch (e) {
            console.error("Failed to parse websocket notification", e);
          }
        });
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      try {
        client.deactivate();
      } catch (err) {
        // ignore
      }
    };
  }, [token, currentUserId, sockJsUrl]);

  const handleMarkAsRead = async (notifId: string) => {
    try {
      await apiClient.put(`/notifications/${notifId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleReadAll = async () => {
    try {
      await apiClient.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      message.success("Đã đánh dấu đọc tất cả thông báo!");
    } catch (err) {
      console.error("Failed to mark all as read", err);
      message.error("Lỗi khi xử lý.");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "MESSAGE":
        return <MessageCircle size={16} className="text-[#49B6E5]" />;
      case "FRIEND_REQUEST":
        return <UserPlus size={16} className="text-orange-500" />;
      case "FRIEND_ACCEPTED":
        return <CheckCheck size={16} className="text-emerald-500" />;
      case "EDUCATOR_FEEDBACK":
        return <Award size={16} className="text-purple-500" />;
      default:
        return <Bell size={16} className="text-slate-500" />;
    }
  };

  // Format relative time (e.g. "5 phút trước", "Vừa xong")
  const formatRelativeTime = (isoString: string) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  const notificationContent = (
    <div className="w-80 md:w-96 bg-[#fbf6ef] border-[3px] border-slate-900 rounded-[2rem] shadow-[6px_6px_0_#1f2937] p-4 flex flex-col font-nunito max-h-[480px] overflow-hidden">
      {/* Dropdown Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900/10 mb-2">
        <h4 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
          <Bell size={16} className="text-[#49B6E5]" /> Thông báo
        </h4>
        {unreadCount > 0 && (
          <button
            onClick={handleReadAll}
            className="flex items-center gap-1 px-3 py-1 bg-white border-2 border-slate-900 shadow-[2px_2px_0_#1f2937] rounded-xl text-[10px] font-black text-slate-800 uppercase tracking-wider hover:bg-slate-50 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <CheckCheck size={12} /> Đọc tất cả
          </button>
        )}
      </div>

      {/* Dropdown Items List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar min-h-[100px]">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <BellOff size={32} className="text-slate-300 mb-2" />
            <p className="text-slate-400 text-xs font-bold">Bạn không có thông báo nào</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                if (!notif.isRead) handleMarkAsRead(notif.id);
              }}
              className={`p-3 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex gap-3 ${
                notif.isRead
                  ? "bg-white border-slate-200 opacity-70"
                  : "bg-white border-slate-900 shadow-[3px_3px_0_#1f2937]"
              }`}
            >
              {/* Badge for Unread */}
              {!notif.isRead && (
                <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
              )}

              {/* Icon Container */}
              <div className="w-9 h-9 rounded-xl bg-slate-50 border-2 border-slate-200 flex items-center justify-center flex-shrink-0">
                {getIcon(notif.type)}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <div className="font-black text-slate-900 text-xs truncate pr-3">{notif.title}</div>
                <p className="text-slate-600 text-[11px] font-bold leading-normal mt-0.5 break-words">
                  {notif.message}
                </p>
                <span className="text-slate-400 text-[9px] font-black uppercase tracking-wider mt-1 block">
                  {formatRelativeTime(notif.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
      `}</style>
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => notificationContent}
      trigger={["click"]}
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
    >
      <button
        type="button"
        className="relative flex items-center justify-center w-10 h-10 bg-white border-2 border-slate-900 rounded-full shadow-[2.5px_2.5px_0_#1f2937] hover:-translate-y-0.5 transition-transform"
      >
        <Bell size={18} className="text-slate-800" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-slate-900 shadow-[1px_1px_0_#1f2937] animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </Dropdown>
  );
}
