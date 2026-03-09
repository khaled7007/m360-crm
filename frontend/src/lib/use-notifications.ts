"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./auth-context";
import { api } from "./api";

type Notification = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
};

type WSMessage = {
  type: "notification";
  notification: Notification;
};

const POLL_INTERVAL = 30_000; // 30 seconds fallback
const MAX_RECONNECT_DELAY = 30_000;
const INITIAL_RECONNECT_DELAY = 1_000;

export function useNotifications() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const usingWebSocket = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api<Notification[]>("/notifications?unread=true&limit=50", { token });
      setNotifications(data ?? []);
      setUnreadCount((data ?? []).length);
    } catch {
      // Silently fail — will retry on next poll or WS message
    }
  }, [token]);

  const markAsRead = useCallback(
    async (id: string) => {
      if (!token) return;
      try {
        await api(`/notifications/${id}/read`, { method: "PUT", token });
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Silently fail
      }
    },
    [token]
  );

  const markAllRead = useCallback(async () => {
    if (!token) return;
    try {
      await api("/notifications/read-all", { method: "PUT", token });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
  }, [token]);

  // Start polling fallback
  const startPolling = useCallback(() => {
    if (pollTimerRef.current) return;
    pollTimerRef.current = setInterval(fetchNotifications, POLL_INTERVAL);
  }, [fetchNotifications]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!token) return;

    // Build WebSocket URL from current location
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/notifications?token=${encodeURIComponent(token)}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        usingWebSocket.current = true;
        reconnectAttemptRef.current = 0;
        stopPolling();
      };

      ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          if (msg.type === "notification") {
            setNotifications((prev) => [msg.notification, ...prev]);
            if (!msg.notification.is_read) {
              setUnreadCount((prev) => prev + 1);
            }
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        usingWebSocket.current = false;
        wsRef.current = null;

        // Fall back to polling immediately
        startPolling();

        // Attempt reconnect with exponential backoff
        const delay = Math.min(
          INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptRef.current),
          MAX_RECONNECT_DELAY
        );
        reconnectAttemptRef.current += 1;
        reconnectTimerRef.current = setTimeout(connectWebSocket, delay);
      };

      ws.onerror = () => {
        // onclose will fire after onerror, so reconnect logic is handled there
        ws.close();
      };
    } catch {
      // WebSocket construction failed — fall back to polling
      startPolling();
    }
  }, [token, startPolling, stopPolling]);

  useEffect(() => {
    if (!token) {
      // Clean up everything on logout
      wsRef.current?.close();
      wsRef.current = null;
      stopPolling();
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Fetch initial notifications
    fetchNotifications();

    // Try WebSocket first, fall back to polling
    connectWebSocket();

    // If WebSocket hasn't connected after 3s, start polling as safety net
    const fallbackTimer = setTimeout(() => {
      if (!usingWebSocket.current) {
        startPolling();
      }
    }, 3000);

    return () => {
      clearTimeout(fallbackTimer);
      wsRef.current?.close();
      wsRef.current = null;
      stopPolling();
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [token, fetchNotifications, connectWebSocket, startPolling, stopPolling]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllRead,
  };
}
