import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getChatHistory } from "../../../services/apiClient";
import { API_BASE_URL } from "../../../config";


export type ChatMessage = {
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: string;
  status?: string;
  type?: string;
};

export type UseChatParams = {
  currentUserId: string | undefined;
  friendId: string | undefined;
  /** Từ session; kết hợp với token trong storage cho STOMP. */
  accessToken?: string | null;
};

function getCurrentUserIdFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      window.sessionStorage.getItem("speakvn_session") ||
      window.localStorage.getItem("speakvn_session");
    if (!raw) return null;
    const s = JSON.parse(raw) as { user?: { id?: string } };
    return s?.user?.id != null ? String(s.user.id) : null;
  } catch {
    return null;
  }
}

function getChatCacheKey(currentUserId: string, friendId: string) {
  return `chat_history_${currentUserId}_${friendId}`;
}

function parseCachedChatMessages(raw: string): ChatMessage[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(Boolean)
      .map((m: Record<string, unknown>) => ({
        senderId: String(m.senderId ?? ""),
        recipientId: String(m.recipientId ?? ""),
        content: String(m.content ?? ""),
        timestamp: String(m.timestamp ?? ""),
        status: m.status != null ? String(m.status) : undefined,
        type: m.type != null ? String(m.type) : undefined,
      }))
      .filter((m: ChatMessage) => m.senderId && m.recipientId && m.content);
  } catch {
    return [];
  }
}

function readChatCache(cacheKey: string | null): ChatMessage[] {
  if (!cacheKey || typeof window === "undefined") return [];
  try {
    const cached = localStorage.getItem(cacheKey);
    return cached ? parseCachedChatMessages(cached) : [];
  } catch {
    return [];
  }
}

function readInitialMessagesFromCache(friendId: string | undefined): ChatMessage[] {
  const uid = getCurrentUserIdFromStorage();
  if (!uid || !friendId) return [];
  return readChatCache(getChatCacheKey(uid, friendId));
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Format timestamp hiển thị trong bubble (UTC backend → local). */
export function formatMessageTime(timestamp: string) {
  if (!timestamp) return "";
  const utcString = timestamp.endsWith("Z") ? timestamp : `${timestamp}Z`;
  const d = new Date(utcString);
  if (Number.isNaN(d.getTime())) return "";

  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const hhmm = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  if (isToday) return hhmm;

  const ddmm = `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
  return `${ddmm} ${hhmm}`;
}

export function useChat({
  currentUserId,
  friendId,
  accessToken,
}: UseChatParams) {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    readInitialMessagesFromCache(friendId),
  );
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [connectionState, setConnectionState] = useState<
    "idle" | "connecting" | "connected" | "error"
  >("idle");

  const clientRef = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isHistorySetRef = useRef(false);
  const prevMessageCountRef = useRef(0);
  const historyLoadedRef = useRef(false);
  const shouldSendHistoryReadRef = useRef(false);

  const token = useMemo(() => {
    if (typeof window === "undefined") return null;
    return (
      window.sessionStorage.getItem("ACCESS_TOKEN") ||
      window.localStorage.getItem("ACCESS_TOKEN") ||
      accessToken ||
      null
    );
  }, [accessToken]);

  const cacheKey = useMemo(
    () =>
      currentUserId && friendId
        ? getChatCacheKey(currentUserId, friendId)
        : null,
    [currentUserId, friendId],
  );

  const sockJsUrl = useMemo(() => {
    return API_BASE_URL.replace("/api/v1", "/ws");
  }, []);

  const sendReadReceipt = useCallback(() => {
    const client = clientRef.current;
    if (!client?.active || !currentUserId || !friendId) return;
    try {
      client.publish({
        destination: "/app/chat.read",
        body: JSON.stringify({
          senderId: currentUserId,
          recipientId: String(friendId),
        }),
      });
    } catch {
      // ignore
    }
  }, [currentUserId, friendId]);

  useLayoutEffect(() => {
    if (!friendId) {
      setMessages([]);
      return;
    }
    if (!currentUserId) return;

    const cached = readChatCache(getChatCacheKey(currentUserId, friendId));
    setMessages(cached);
    isHistorySetRef.current = cached.length > 0;
    historyLoadedRef.current = false;
    shouldSendHistoryReadRef.current = false;
  }, [friendId, currentUserId]);

  useEffect(() => {
    if (!cacheKey) return;
    if (messages.length === 0) {
      try {
        localStorage.removeItem(cacheKey);
      } catch {
        // ignore
      }
      return;
    }
    try {
      localStorage.setItem(cacheKey, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages, cacheKey]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!friendId || !currentUserId) return;
      const key = getChatCacheKey(currentUserId, friendId);
      const cachedBefore = readChatCache(key);
      const showLoadingSpinner = cachedBefore.length === 0;

      historyLoadedRef.current = false;
      shouldSendHistoryReadRef.current = false;
      if (showLoadingSpinner) {
        setIsLoadingHistory(true);
      } else {
        setIsLoadingHistory(false);
      }

      try {
        const res = await getChatHistory(friendId);
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];

        const normalized: ChatMessage[] = list
          .filter(Boolean)
          .map((m: Record<string, unknown>) => ({
            senderId: String(m.senderId ?? ""),
            recipientId: String(m.recipientId ?? ""),
            content: String(m.content ?? ""),
            timestamp: String(m.timestamp ?? ""),
            status: m.status != null ? String(m.status) : undefined,
          }))
          .filter((m: ChatMessage) => m.senderId && m.recipientId && m.content);

        if (!cancelled) {
          isHistorySetRef.current = true;
          setMessages(normalized);
          try {
            if (normalized.length === 0) {
              localStorage.removeItem(key);
            } else {
              localStorage.setItem(key, JSON.stringify(normalized));
            }
          } catch {
            // ignore
          }
          historyLoadedRef.current = true;
          const last = normalized[normalized.length - 1];
          shouldSendHistoryReadRef.current = Boolean(
            last && last.senderId !== currentUserId,
          );
        }
      } catch {
        if (!cancelled) {
          isHistorySetRef.current = true;
          if (cachedBefore.length === 0) {
            setMessages([]);
          }
          historyLoadedRef.current = true;
          shouldSendHistoryReadRef.current = false;
        }
      } finally {
        if (!cancelled) {
          setIsLoadingHistory(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [friendId, currentUserId]);

  useEffect(() => {
    if (
      !historyLoadedRef.current ||
      isLoadingHistory ||
      !clientRef.current?.active
    )
      return;
    if (!shouldSendHistoryReadRef.current) return;
    shouldSendHistoryReadRef.current = false;
    sendReadReceipt();
  }, [isLoadingHistory, sendReadReceipt, friendId]);

  useEffect(() => {
    isHistorySetRef.current = true;
    historyLoadedRef.current = false;
    shouldSendHistoryReadRef.current = false;
    setIsConnected(false);
    setConnectionState("idle");

    if (clientRef.current) {
      try {
        clientRef.current.deactivate();
      } catch {
        // ignore
      }
      clientRef.current = null;
    }

    if (!token || !currentUserId || !friendId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(sockJsUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      connectionTimeout: 10000,
      reconnectDelay: 2500,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setIsConnected(true);
        setConnectionState("connected");

        if (historyLoadedRef.current && shouldSendHistoryReadRef.current) {
          shouldSendHistoryReadRef.current = false;
          queueMicrotask(() => sendReadReceipt());
        }

        client.subscribe(`/topic/chat/${currentUserId}`, (frame) => {
          try {
            const body = JSON.parse(frame.body) as Record<string, unknown>;
            const msgType = body.type != null ? String(body.type) : undefined;

            if (msgType === "READ_RECEIPT") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.senderId === currentUserId ? { ...m, status: "READ" } : m,
                ),
              );
              return;
            }

            const msg: ChatMessage = {
              senderId: String(body.senderId ?? ""),
              recipientId: String(body.recipientId ?? ""),
              content: String(body.content ?? ""),
              timestamp: String(
                body.timestamp ?? new Date().toISOString(),
              ),
              status: body.status != null ? String(body.status) : undefined,
              type: msgType,
            };
            if (!msg.senderId || !msg.recipientId || !msg.content) return;
            setMessages((prev) => [...prev, msg]);
            if (msg.senderId === String(friendId)) {
              queueMicrotask(() => sendReadReceipt());
            }
          } catch {
            // ignore malformed message
          }
        });
      },
      onDisconnect: () => {
        setIsConnected(false);
        setConnectionState("idle");
      },
      onStompError: (frame) => {
        console.error("STOMP Error:", frame.headers["message"]);
        console.error("Additional details: " + frame.body);
        setIsConnected(false);
        setConnectionState("error");
      },
      onWebSocketError: (event) => {
        console.error("STOMP WebSocket Error:", event);
        setIsConnected(false);
        setConnectionState("error");
      },
      onWebSocketClose: () => {
        setIsConnected(false);
        setConnectionState("idle");
      },
    });

    clientRef.current = client;
    setConnectionState("connecting");
    client.activate();

    return () => {
      try {
        client.deactivate();
      } catch {
        // ignore
      }
    };
  }, [currentUserId, friendId, sockJsUrl, token, sendReadReceipt]);

  useEffect(() => {
    const nextCount = messages.length;
    const prevCount = prevMessageCountRef.current;
    const didIncrease = nextCount > prevCount;

    if (isHistorySetRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      isHistorySetRef.current = false;
    } else if (didIncrease) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    prevMessageCountRef.current = nextCount;
  }, [messages]);

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      if (!isConnected) return;
      if (!clientRef.current) return;
      if (!currentUserId || !friendId) return;

      const msg: ChatMessage = {
        senderId: currentUserId,
        recipientId: String(friendId),
        content: trimmed,
        timestamp: new Date().toISOString(),
        status: "SENT",
      };

      try {
        clientRef.current.publish({
          destination: "/app/chat",
          body: JSON.stringify(msg),
        });
        setMessages((prev) => [...prev, msg]);
      } catch {
        // ignore
      }
    },
    [currentUserId, friendId, isConnected],
  );

  const lastMyMessageIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].senderId === currentUserId) return i;
    }
    return -1;
  }, [messages, currentUserId]);

  return {
    messages,
    setMessages,
    isConnected,
    isLoadingHistory,
    connectionState,
    sendMessage,
    sendReadReceipt,
    messagesEndRef,
    lastMyMessageIndex,
  };
}
