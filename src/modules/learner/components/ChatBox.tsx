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
      "bg-[#fbf6ef] flex flex-col overflow-hidden font-nunito",
      integrated
        ? "w-full h-full border-[3px] border-[#263D5B] rounded-[2rem] shadow-[6px_6px_0_#263D5B]"
        : "fixed bottom-4 right-4 w-85 h-[460px] shadow-[8px_8px_0_#263D5B] rounded-[2rem] border-[3px] border-[#263D5B] z-50 transition-all"
    )}>
      {/* Header */}
      <div className={clsx(
        "flex items-center justify-between px-5 z-10 border-b-[3px] border-[#263D5B]",
        integrated ? "h-16 bg-white text-[#263D5B]" : "h-14 bg-[#49B6E5] text-white"
      )}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-0.5 bg-white rounded-xl border-[1.5px] border-[#263D5B] shadow-[2px_2px_0_#263D5B] flex-shrink-0">
            <Avatar
              src={friendAvatar}
              icon={!friendAvatar && <UserOutlined />}
              size={integrated ? 36 : 30}
              className="bg-sky-50 rounded-lg"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <div className={clsx("font-black uppercase tracking-wider font-nunito text-[#263D5B] truncate", integrated ? "text-base" : "text-sm")}>
              {friendName}
            </div>
          </div>
        </div>
        <Tooltip title="Đóng">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border-[2px] border-[#263D5B] shadow-[2px_2px_0_#263D5B] text-[#263D5B] flex items-center justify-center transition-all hover:bg-red-50 hover:text-[#DC2626] active:translate-y-0.5 active:shadow-none"
          >
            <X size={16} strokeWidth={3} />
          </button>
        </Tooltip>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#fbf6ef] relative"
           style={{ backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(38,61,91,0.02) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        {isLoadingHistory ? (
          <div className="text-center text-xs text-[#263D5B]/50 mt-8 font-black uppercase tracking-wider">
            Đang tải tin nhắn cũ...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center mt-[-10px] opacity-90">
            <div className="w-16 h-16 rounded-2xl bg-white border-[2px] border-[#263D5B] shadow-[4px_4px_0_#263D5B] flex items-center justify-center mb-4">
              <Send size={24} className="text-[#49B6E5]" />
            </div>
            <div className="text-sm font-black text-[#263D5B] uppercase tracking-wide">Bắt đầu trò chuyện</div>
            <div className="text-xs text-[#263D5B]/50 mt-1 max-w-[200px] font-bold">Hãy gửi lời chào đến {friendName}</div>
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
                    "max-w-[78%] flex flex-col",
                    isMine ? "items-end" : "items-start",
                  )}
                >
                  <div
                    className={clsx(
                      "px-3.5 py-2.5 text-sm font-black leading-relaxed break-words border-[2.5px] border-[#263D5B] shadow-[3px_3px_0_#263D5B] transition-transform duration-200",
                      isMine
                        ? "bg-[#49B6E5] text-white rounded-2xl rounded-tr-sm"
                        : "bg-white text-[#263D5B] rounded-2xl rounded-tl-sm",
                    )}
                  >
                    {m.content}
                  </div>
                  {timeLabel && (
                    <div className="mt-1 text-[9px] text-[#263D5B]/50 font-black uppercase tracking-widest">
                      {timeLabel}
                    </div>
                  )}
                  {showRead && (
                    <div className="text-[9px] text-[#16A34A] font-black text-right mt-1 flex items-center gap-1">
                      <span className="w-3.5 h-3.5 rounded-full bg-green-50 border-[1.5px] border-[#263D5B] flex items-center justify-center text-[#263D5B] font-black text-[8px]">✓</span> Đã xem
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input / Footer */}
      <div className="p-3 lg:p-4 border-t-[3px] border-[#263D5B] bg-white">
        <div className="flex gap-2.5 items-center">
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
            className="flex-1 h-12 px-4 rounded-xl border-[2px] border-[#263D5B] bg-slate-50 focus:bg-white focus:outline-none focus:ring-0 shadow-[2px_2px_0_#263D5B] disabled:bg-slate-100 disabled:text-slate-400 transition-all font-black text-sm text-[#263D5B] placeholder:text-[#263D5B]/30"
          />
          <button
            onClick={handleSend}
            disabled={!isConnected || inputValue.trim().length === 0}
            className="h-12 w-12 rounded-xl bg-[#49B6E5] text-white border-[2px] border-[#263D5B] shadow-[3px_3px_0_#263D5B] flex items-center justify-center hover:opacity-95 disabled:opacity-50 disabled:grayscale transition-all active:translate-y-0.5 active:shadow-none"
          >
            <Send size={18} className={clsx(inputValue.trim().length > 0 && "translate-x-0.5 -translate-y-0.5 transition-transform")} strokeWidth={3} />
          </button>
        </div>
        {!isConnected && (
          <div className="mt-2 text-[9px] text-[#263D5B]/50 flex items-center gap-1.5 font-black uppercase tracking-widest px-1">
            <span className={clsx("inline-block w-2.5 h-2.5 rounded-full border-[1.5px] border-[#263D5B] animate-pulse", connectionState === "error" ? "bg-[#DC2626]" : "bg-[#D97706]")} />
            {connectionState === "error"
              ? "Kết nối thất bại. Đang thử lại..."
              : "Đang kết nối theo thời gian thực..."}
          </div>
        )}
      </div>
    </div>
  );
}
