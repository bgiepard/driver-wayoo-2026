import { useSession } from "next-auth/react";
import { useNotifications } from "@/context/NotificationsContext";
import { useRouter } from "next/router";
import type { Notification } from "@/context/NotificationsContext";

/* ============================================
   HELPERS
   ============================================ */

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Teraz";
  if (minutes < 60) return `${minutes} min temu`;
  if (hours < 24) return `${hours} godz. temu`;
  if (days === 1) return "Wczoraj";
  return `${days} dni temu`;
}

function pluralNotifications(count: number): string {
  if (count === 1) return "nieprzeczytane powiadomienie";
  if (count < 5) return "nieprzeczytane powiadomienia";
  return "nieprzeczytanych powiadomień";
}

/* ============================================
   IKONA PER TYP
   ============================================ */

function NotificationIcon({ type }: { type: Notification["type"] }) {
  if (type === "offer_accepted") {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
  // info
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  );
}

const TYPE_STYLE: Record<Notification["type"], { icon: string; dot: string }> = {
  offer_accepted: {
    icon: "bg-brand-500/10 text-brand-400",
    dot: "bg-brand-500",
  },
  offer_rejected: {
    icon: "bg-error-500/10 text-error-400",
    dot: "bg-error-500",
  },
  new_request: {
    icon: "bg-info-500/10 text-info-400",
    dot: "bg-info-500",
  },
  info: {
    icon: "bg-white/[0.06] text-gray-400",
    dot: "bg-gray-500",
  },
};

/* ============================================
   STRONA
   ============================================ */

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
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
        <p className="text-gray-500 text-sm">Zaloguj się, aby zobaczyć powiadomienia.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[720px] mx-auto">
      {/* Nagłówek */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Centrum powiadomień</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">Powiadomienia</h1>
          <p className="text-sm text-gray-500 mt-1.5">
            {unreadCount > 0
              ? `Masz ${unreadCount} ${pluralNotifications(unreadCount)}`
              : "Wszystkie powiadomienia przeczytane"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] text-sm font-medium text-gray-300 hover:text-white hover:bg-white/[0.04] transition-colors mt-1"
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
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-16 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/[0.04] mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-400 mb-1">Brak powiadomień</p>
          <p className="text-xs text-gray-600">Tu pojawią się informacje o nowych zleceniach i ofertach</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.04]">
          {notifications.map((n) => {
            const style = TYPE_STYLE[n.type];
            return (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex items-start gap-4 px-5 py-4 transition-colors cursor-pointer ${
                  n.link ? "hover:bg-white/[0.03]" : "cursor-default"
                } ${!n.read ? "bg-white/[0.015]" : ""}`}
              >
                {/* Ikona */}
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 mt-0.5 ${style.icon}`}>
                  <NotificationIcon type={n.type} />
                </div>

                {/* Treść */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.read ? "font-semibold text-white" : "font-medium text-white/70"}`}>
                    {n.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5 leading-snug">{n.message}</p>
                  <p className="text-xs text-gray-600 mt-1.5">{formatTime(n.createdAt)}</p>
                </div>

                {/* Wskaźnik nieprzeczytanego */}
                <div className="shrink-0 flex items-center gap-2 mt-1.5">
                  {!n.read && (
                    <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                  )}
                  {n.link && (
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {notifications.length > 0 && (
        <p className="text-xs text-gray-600 mt-4 text-center">
          {notifications.length} {notifications.length === 1 ? "powiadomienie" : "powiadomień"} łącznie
        </p>
      )}
    </div>
  );
}
