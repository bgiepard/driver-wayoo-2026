import { useSession } from "next-auth/react";
import { useNotifications } from "@/context/NotificationsContext";
import { useRouter } from "next/router";

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const router = useRouter();

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Teraz";
    if (minutes < 60) return `${minutes} min temu`;
    if (hours < 24) return `${hours} godz temu`;
    return `${days} dni temu`;
  };

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markAsRead(notification.id);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  if (status === "loading" || isLoading) {
    return <p className="text-gray-500">Ladowanie...</p>;
  }

  if (!session) {
    return (
      <div className="bg-white rounded-lg p-12 text-center">
        <h1 className="text-2xl font-semibold mb-4">Powiadomienia</h1>
        <p className="text-gray-500">Zaloguj sie, aby zobaczyc powiadomienia.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Powiadomienia</h1>
          <p className="text-gray-500">
            {unreadCount > 0
              ? `Masz ${unreadCount} ${unreadCount === 1 ? "nieprzeczytane powiadomienie" : unreadCount < 5 ? "nieprzeczytane powiadomienia" : "nieprzeczytanych powiadomien"}`
              : "Wszystkie powiadomienia przeczytane"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            Oznacz wszystkie jako przeczytane
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center text-gray-500">
          Brak powiadomien.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`bg-white rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                !notification.read ? "border-l-4 border-green-500" : ""
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className={`text-sm ${!notification.read ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {notification.message}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatTime(notification.createdAt)}
                  </span>
                  {!notification.read && (
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
