import { useEffect, useState } from "react";
import { Avatar, Tooltip } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { Send, X } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../../../core/auth/AuthContext";
import { formatMessageTime, useChat } from "../hooks/useChat";

export interface Friend {
  friendshipId?: string;
  userId?: string;
  id?: string;
  fullName?: string;
  name?: string;
  avatarUrl?: string;
  avatar?: string;
}

export default function ChatBox({
  friend,
  onClose,
  integrated = false,
}: {
  friend: Friend;
  onClose: () => void;
  integrated?: boolean;
}) {
  const { session } = useAuth();
  const friendId = friend?.userId || friend?.id;
  const {
    messages,
    isConnected,
    isLoadingHistory,
    connectionState,
    sendMessage,
    messagesEndRef,
    lastMyMessageIndex,
  } = useChat({
    currentUserId: session?.user?.id,
    friendId,
    accessToken: session?.accessToken,
  });

  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    setInputValue("");
  }, [friendId]);

  const currentUserId = session?.user?.id;
  const friendName = friend?.fullName || friend?.name || "Bạn bè";
  const friendAvatar = friend?.avatarUrl || friend?.avatar;

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setInputValue("");
  };

  return (
    <div className={clsx(
      "bg-white flex flex-col overflow-hidden",
      integrated
        ? "w-full h-full"
        : "fixed bottom-4 right-4 w-80 h-[450px] shadow-2xl rounded-2xl border border-purple-100 z-50 transition-all hover:shadow-purple-500/10"
    )}>
      <div className={clsx(
        "flex items-center justify-between px-4 z-10 transition-colors",
        integrated
          ? "h-16 bg-white border-b border-gray-100 text-gray-800"
          : "h-14 bg-gradient-to-r from-purple-600 to-purple-500 text-white"
      )}>
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            src={friendAvatar}
            icon={!friendAvatar && <UserOutlined />}
            size={integrated ? 42 : 32}
            className={integrated ? "bg-purple-100 text-purple-600 border-2 border-purple-100" : "bg-white/15 text-white border border-white/20 shadow-sm"}
          />
          <div className="flex flex-col min-w-0">
            <div className={clsx("font-extrabold truncate", integrated ? "text-base" : "text-sm")}>{friendName}</div>
            <div className={clsx("text-[11px] font-medium flex items-center gap-1", integrated ? "text-green-500" : "text-purple-100")}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Đang hoạt động
            </div>
          </div>
        </div>
        <Tooltip title="Đóng">
          <button
            onClick={onClose}
            className={clsx(
              "w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-95",
              integrated
                ? "text-gray-400 hover:bg-gray-100 hover:text-red-500"
                : "hover:bg-white/15 text-white"
            )}
          >
            <X size={18} />
          </button>
        </Tooltip>
      </div>

      <div className={clsx("flex-1 overflow-y-auto px-4 py-4 space-y-3", integrated ? "bg-gray-50/50" : "bg-white")}>
        {isLoadingHistory ? (
          <div className="text-center text-xs text-gray-400 mt-8 font-medium">
            Đang tải tin nhắn cũ...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center mt-[-20px] opacity-70">
            <div className={clsx("w-16 h-16 rounded-3xl flex items-center justify-center mb-3", integrated ? "bg-white border border-gray-100" : "bg-purple-50")}>
              <Send size={24} className="text-purple-400" />
            </div>
            <div className="text-sm font-bold text-gray-500">Bắt đầu trò chuyện</div>
            <div className="text-xs text-gray-400 mt-1 max-w-[200px]">Hãy gửi lời chào đến {friendName}</div>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isMine = m.senderId === currentUserId;
            const timeLabel = formatMessageTime(m.timestamp);
            const showRead =
              isMine && idx === lastMyMessageIndex && m.status === "READ";
            return (
              <div
                key={`${m.timestamp}-${idx}`}
                className={clsx(
                  "flex",
                  isMine ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={clsx(
                    "max-w-[75%] flex flex-col",
                    isMine ? "items-end" : "items-start",
                  )}
                >
                  <div
                    className={clsx(
                      "px-3.5 py-2.5 text-sm leading-relaxed break-words shadow-sm",
                      isMine
                        ? "bg-purple-600 text-white rounded-2xl rounded-tr-sm"
                        : "bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-100",
                    )}
                  >
                    {m.content}
                  </div>
                  {timeLabel && (
                    <div className="mt-1 text-[11px] text-gray-400 font-medium">
                      {timeLabel}
                    </div>
                  )}
                  {showRead && (
                    <div className="text-[10px] text-purple-600 font-bold text-right mt-0.5 flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-purple-100 flex items-center justify-center">✓</span> Đã xem
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 lg:p-4 border-t border-gray-100 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <div className="flex gap-2 items-center">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={!isConnected}
            placeholder={
              isConnected
                ? "Nhập tin nhắn..."
                : connectionState === "error"
                  ? "Kết nối thất bại"
                  : "Đang kết nối..."
            }
            className="flex-1 h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:bg-gray-50 disabled:text-gray-400 transition-all font-medium text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!isConnected || inputValue.trim().length === 0}
            className="h-12 w-12 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white flex items-center justify-center hover:opacity-90 disabled:opacity-50 disabled:grayscale shadow-md shadow-purple-500/20 active:scale-95 transition-all"
          >
            <Send size={18} className={clsx(inputValue.trim().length > 0 && "translate-x-0.5 -translate-y-0.5 transition-transform")} />
          </button>
        </div>
        {!isConnected && (
          <div className="mt-2 text-[11px] text-gray-400 flex items-center gap-1.5 font-medium px-1">
            <span className={clsx("inline-block w-1.5 h-1.5 rounded-full animate-pulse", connectionState === "error" ? "bg-red-400" : "bg-purple-400")} />
            {connectionState === "error"
              ? "Kết nối thất bại. Đang thử lại..."
              : "Đang kết nối theo thời gian thực..."}
          </div>
        )}
      </div>
    </div>
  );
}
