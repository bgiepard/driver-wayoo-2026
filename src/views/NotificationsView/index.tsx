import { useSession } from "next-auth/react";
import { useNotifications } from "@/context/NotificationsContext";
import { useRouter } from "next/router";
import type { Notification } from "@/context/NotificationsContext";
import { formatNotificationTime } from "@/utils/formatTime";

function pluralNotifications(count: number): string {
  if (count === 1) return "nieprzeczytane powiadomienie";
  if (count < 5) return "nieprzeczytane powiadomienia";
  return "nieprzeczytanych powiadomień";
}

const TYPE_CONFIG: Record<string, {
  label: string;
  iconBg: string;
  iconColor: string;
  dot: string;
  badge: string;
}> = {
  offer_paid: {
    label: "Przejazd opłacony",
    iconBg: "bg-brand-50",
    iconColor: "text-brand-600",
    dot: "bg-brand-500",
    badge: "bg-brand-50 text-brand-700",
  },
  offer_rejected: {
    label: "Oferta odrzucona",
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    dot: "bg-red-400",
    badge: "bg-red-50 text-red-600",
  },
  new_request: {
    label: "Nowe zlecenie",
    iconBg: "bg-sky-50",
    iconColor: "text-sky-500",
    dot: "bg-sky-400",
    badge: "bg-sky-50 text-sky-600",
  },
  info: {
    label: "Informacja",
    iconBg: "bg-gray-100",
    iconColor: "text-gray-500",
    dot: "bg-gray-400",
    badge: "bg-gray-100 text-gray-600",
  },
};

function getConfig(type: string) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG.info;
}

function NotificationIcon({ type }: { type: string }) {
  if (type === "offer_paid" || type === "info") {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    );
  }
  if (type === "offer_rejected") {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (type === "new_request") {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  );
}

function NotificationRow({
  n,
  onClick,
  onDelete,
}: {
  n: Notification;
  onClick: () => void;
  onDelete: () => void;
}) {
  const cfg = getConfig(n.type);
  const isClickable = !!n.link;

  return (
    <div
      className={`flex items-start gap-4 px-5 py-4 transition-colors group ${isClickable ? "cursor-pointer hover:bg-gray-50" : ""} ${!n.read ? "bg-brand-50/30" : "bg-white"}`}
      onClick={isClickable ? onClick : undefined}
    >
      {/* Kolorowa ikona */}
      <div className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 ${cfg.iconBg} ${cfg.iconColor}`}>
        <NotificationIcon type={n.type} />
      </div>

      {/* Treść */}
      <div className="flex-1 min-w-0">
        {!n.read && (
          <div className="mb-0.5">
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${cfg.dot}`} />
          </div>
        )}

        <p className={`text-sm leading-snug ${!n.read ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
          {n.title}
        </p>

        <p className="text-sm text-gray-500 mt-0.5 leading-snug">{n.message}</p>

        <p className="text-xs text-gray-400 mt-1.5">{formatNotificationTime(n.createdAt)}</p>
      </div>

      {/* Przycisk usunięcia */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="shrink-0 p-1.5 rounded-md text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
        title="Usuń powiadomienie"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      </button>
    </div>
  );
}

export default function NotificationsView() {
  const { data: session, status } = useSession();
  const {
    notifications,
    unreadCount,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const router = useRouter();

  const handleClick = (n: Notification) => {
    markAsRead(n.id);
    if (n.link) router.push(n.link);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-gray-500">Zaloguj się, aby zobaczyć powiadomienia.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[720px] mx-auto space-y-6">

      {/* Nagłówek */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Centrum powiadomień</p>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Powiadomienia</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Masz {unreadCount} {pluralNotifications(unreadCount)}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors mt-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Oznacz wszystkie
          </button>
        )}
      </div>

      {/* Lista */}
      {notifications.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm px-6 py-16 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">Brak powiadomień</p>
          <p className="text-xs text-gray-400">Tu pojawią się informacje o nowych zleceniach i ofertach</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden divide-y divide-gray-100">
          {notifications.map((n) => (
            <NotificationRow
              key={n.id}
              n={n}
              onClick={() => handleClick(n)}
              onDelete={() => deleteNotification(n.id)}
            />
          ))}

          {hasMore && (
            <div className="px-5 py-4 bg-white">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                )}
                {isLoadingMore ? "Ładowanie..." : "Pokaż więcej"}
              </button>
            </div>
          )}
        </div>
      )}

      {notifications.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          Wyświetlono {notifications.length} {notifications.length === 1 ? "powiadomienie" : "powiadomień"}
          {hasMore ? " — przewiń, aby załadować więcej" : ""}
        </p>
      )}

    </div>
  );
}
