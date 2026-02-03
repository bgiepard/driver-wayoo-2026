import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

export interface Notification {
  id: string;
  type: "offer_accepted" | "offer_rejected" | "new_request" | "info";
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, "id" | "read" | "createdAt">) => void;
  addLocalNotification: (notification: Omit<Notification, "id" | "read" | "createdAt">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  refreshNotifications: () => Promise<void>;
  isLoading: boolean;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasFetched = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (!session?.user) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(
          data.map((n: { id: string; type: string; title: string; message: string; link?: string; read: boolean; createdAt: string }) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            link: n.link,
            read: n.read,
            createdAt: new Date(n.createdAt),
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    if (status === "authenticated" && session?.user && !hasFetched.current) {
      hasFetched.current = true;
      fetchNotifications();
    }

    if (status === "unauthenticated") {
      hasFetched.current = false;
      setNotifications([]);
    }
  }, [status, session?.user, fetchNotifications]);

  // Dodaje powiadomienie lokalnie i zapisuje do bazy
  const addNotification = useCallback(
    async (notification: Omit<Notification, "id" | "read" | "createdAt">) => {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newNotification: Notification = {
        ...notification,
        id: tempId,
        read: false,
        createdAt: new Date(),
      };
      setNotifications((prev) => [newNotification, ...prev].slice(0, 50));

      if (session?.user) {
        try {
          const res = await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(notification),
          });

          if (res.ok) {
            const saved = await res.json();
            setNotifications((prev) =>
              prev.map((n) =>
                n.id === tempId
                  ? { ...n, id: saved.id, createdAt: new Date(saved.createdAt) }
                  : n
              )
            );
          }
        } catch (error) {
          console.error("Error saving notification:", error);
        }
      }
    },
    [session?.user]
  );

  // Dodaje powiadomienie TYLKO lokalnie (bez zapisu do bazy)
  // Uzywane przez Pusher - powiadomienie jest juz zapisane przez nadawce
  const addLocalNotification = useCallback(
    (notification: Omit<Notification, "id" | "read" | "createdAt">) => {
      const tempId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newNotification: Notification = {
        ...notification,
        id: tempId,
        read: false,
        createdAt: new Date(),
      };
      setNotifications((prev) => [newNotification, ...prev].slice(0, 50));
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

    if (session?.user) {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
        });
      } catch (error) {
        console.error("Error marking notifications as read:", error);
      }
    }
  }, [session?.user]);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const refreshNotifications = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        addLocalNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        refreshNotifications,
        isLoading,
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
