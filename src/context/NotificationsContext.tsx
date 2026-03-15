import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

const PAGE_SIZE = 7;

export interface Notification {
  id: string;
  type: "offer_rejected" | "new_request" | "offer_paid" | "info";
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  loadMore: () => Promise<void>;
  addLocalNotification: (notification: Omit<Notification, "id" | "read" | "createdAt">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

function mapRaw(n: { id: string; type: string; title: string; message: string; link?: string; read: boolean; createdAt: string }): Notification {
  return {
    id: n.id,
    type: n.type as Notification["type"],
    title: n.title,
    message: n.message,
    link: n.link,
    read: n.read,
    createdAt: new Date(n.createdAt),
  };
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [fetchLimit, setFetchLimit] = useState(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const hasFetched = useRef(false);

  const fetchNotifications = useCallback(async (limit: number, append = false) => {
    if (!session?.user) return;

    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await fetch(`/api/notifications?limit=${limit}`);
      if (!res.ok) return;

      const data = await res.json();
      const fetched: Notification[] = data.notifications.map(mapRaw);

      if (append) {
        // Dołącz tylko nowe (dedup po id)
        setNotifications((prev) => {
          const existingIds = new Set(prev.map((n) => n.id));
          const newOnes = fetched.filter((n) => !existingIds.has(n.id));
          return [...prev, ...newOnes];
        });
      } else {
        setNotifications(fetched);
      }

      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [session?.user]);

  // Pierwsze załadowanie
  useEffect(() => {
    if (status === "authenticated" && session?.user && !hasFetched.current) {
      hasFetched.current = true;
      fetchNotifications(PAGE_SIZE);
    }
    if (status === "unauthenticated") {
      hasFetched.current = false;
      setNotifications([]);
      setHasMore(false);
      setFetchLimit(PAGE_SIZE);
    }
  }, [status, session?.user, fetchNotifications]);

  const loadMore = useCallback(async () => {
    const nextLimit = fetchLimit + PAGE_SIZE;
    setFetchLimit(nextLimit);
    await fetchNotifications(nextLimit, true);
  }, [fetchLimit, fetchNotifications]);

  const refreshNotifications = useCallback(async () => {
    await fetchNotifications(fetchLimit);
  }, [fetchLimit, fetchNotifications]);

  const addLocalNotification = useCallback(
    (notification: Omit<Notification, "id" | "read" | "createdAt">) => {
      const newNotification: Notification = {
        ...notification,
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        read: false,
        createdAt: new Date(),
      };
      setNotifications((prev) => [newNotification, ...prev]);
    },
    []
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch("/api/notifications", { method: "PATCH" });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    // Lokalnych powiadomień (z Pusher) nie usuwamy z API
    if (id.startsWith("local-")) return;

    try {
      await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        hasMore,
        isLoading,
        isLoadingMore,
        loadMore,
        addLocalNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return context;
}
