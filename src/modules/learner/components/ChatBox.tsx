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
}: {
  friend: Friend;
  onClose: () => void;
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
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-white shadow-lg rounded-lg border border-gray-100 flex flex-col overflow-hidden z-50">
      <div className="h-12 bg-gradient-to-r from-purple-600 to-purple-500 text-white flex items-center justify-between px-3">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar
            src={friendAvatar}
            icon={!friendAvatar && <UserOutlined />}
            size={28}
            className="bg-white/15 text-white border border-white/20"
          />
          <div className="font-extrabold text-sm truncate">{friendName}</div>
        </div>
        <Tooltip title="Đóng">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-white/15 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </Tooltip>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-white">
        {isLoadingHistory ? (
          <div className="text-center text-xs text-gray-400 mt-8">
            Đang tải tin nhắn cũ...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-xs text-gray-400 mt-8">
            Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện.
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
                      "px-3 py-2 text-sm leading-snug break-words",
                      isMine
                        ? "bg-purple-600 text-white rounded-tr-lg rounded-tl-lg rounded-bl-lg"
                        : "bg-gray-200 text-gray-800 rounded-tr-lg rounded-tl-lg rounded-br-lg",
                    )}
                  >
                    {m.content}
                  </div>
                  {timeLabel && (
                    <div className="mt-0.5 text-xs text-gray-500">
                      {timeLabel}
                    </div>
                  )}
                  {showRead && (
                    <div className="text-[10px] text-gray-500 text-right mt-1">
                      Đã xem
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-2 border-t border-gray-100 bg-white">
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
            className="flex-1 h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:bg-gray-50 disabled:text-gray-400"
          />
          <button
            onClick={handleSend}
            disabled={!isConnected || inputValue.trim().length === 0}
            className="h-10 w-10 rounded-lg bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
        {!isConnected && (
          <div className="mt-1 text-[11px] text-gray-400 flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-300" />
            {connectionState === "error"
              ? "Kết nối thất bại. Vui lòng thử lại."
              : "Đang kết nối real-time..."}
          </div>
        )}
      </div>
    </div>
  );
}
