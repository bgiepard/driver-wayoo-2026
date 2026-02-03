import { useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import LoginModal from "./LoginModal";
import { useNotifications } from "@/context/NotificationsContext";

export default function Header() {
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="flex justify-between items-center py-4 px-4 max-w-[1250px] mx-auto">
        <Link href="/" className="text-xl font-semibold text-green-600">
          wayoo kierowca
        </Link>

        <nav className="flex gap-6 items-center text-sm">
          {session ? (
            <>
              <Link href="/" className="text-gray-600 hover:text-green-600">
                Zlecenia
              </Link>
              <Link href="/my-offers" className="text-gray-600 hover:text-green-600">
                Moje oferty
              </Link>
              <Link href="/my-fleet" className="text-gray-600 hover:text-green-600">
                Moja flota
              </Link>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => {
                    const wasOpen = isNotificationsOpen;
                    setIsNotificationsOpen(!isNotificationsOpen);
                    if (!wasOpen && unreadCount > 0) {
                      markAllAsRead();
                    }
                  }}
                  className="relative p-2 text-gray-500 hover:text-green-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-green-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="flex justify-between items-center p-3 border-b border-gray-100">
                      <span className="font-medium text-sm">Powiadomienia</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-gray-500 hover:text-gray-800"
                        >
                          Oznacz jako przeczytane
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 text-sm">
                          Brak powiadomien
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${
                              !notification.read ? "bg-green-50" : ""
                            }`}
                            onClick={() => {
                              markAsRead(notification.id);
                              if (notification.link) {
                                window.location.href = notification.link;
                              }
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className={`text-sm ${!notification.read ? "font-medium" : ""}`}>
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {notification.message}
                                </p>
                              </div>
                              <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                                {formatTime(notification.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Link href="/account" className="text-gray-600 hover:text-green-600">
                Konto
              </Link>
            </>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-gray-600 hover:text-green-600"
            >
              Zaloguj sie
            </button>
          )}
        </nav>
      </div>
      <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </header>
  );
}
