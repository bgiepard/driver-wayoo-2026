import { useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import LoginModal from "./LoginModal";
import { useNotifications } from "@/context/NotificationsContext";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: boolean;
  disabled?: boolean;
  comingSoon?: boolean;
  isSubItem?: boolean;
}

const navItems: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    href: "/zlecenia",
    label: "Zlecenia",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    href: "#",
    label: "Automatyczna wycena",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    disabled: true,
    comingSoon: true,
    isSubItem: true,
  },
  {
    href: "#",
    label: "Promowanie",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
    disabled: true,
    comingSoon: true,
    isSubItem: true,
  },
  {
    href: "/my-offers",
    label: "Moje oferty",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: "/my-fleet",
    label: "Moja flota",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    href: "#",
    label: "Statystyki",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    disabled: true,
    comingSoon: true,
  },
  {
    href: "#",
    label: "ESG",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    disabled: true,
    comingSoon: true,
  },
  {
    href: "/notifications",
    label: "Powiadomienia",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    badge: true,
  },
  {
    href: "/account",
    label: "Konto",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { unreadCount } = useNotifications();

  if (!session) {
    return (
      <>
        <aside className="w-96 bg-gray-900 border-r border-gray-800 min-h-screen flex flex-col">
          <div className="p-6 border-b border-gray-800 flex items-center gap-3">
            <Image src={require("@/assets/logo.png")} alt="wayoo kierowca" width={140} height={36} className="h-9 w-auto" />
            <span className="text-theme-xs font-medium text-gray-500 uppercase tracking-widest">driver</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-6">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Zaloguj sie
            </button>
          </div>
        </aside>
        <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  return (
    <aside className="w-96 bg-gray-900 border-r border-gray-800 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-800 flex items-center gap-3">
        <Link href="/">
          <Image src={require("@/assets/logo.png")} alt="wayoo kierowca" width={140} height={36} className="h-9 w-auto" />
        </Link>
        <span className="text-theme-xs font-medium text-gray-500 uppercase tracking-widest">driver</span>
      </div>

      <nav className="flex-1 p-4 flex flex-col">
        <ul className="flex flex-col gap-1">
          {navItems.filter((i) => !i.comingSoon).map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-lg text-[1.05rem] leading-snug font-medium transition-colors ${
                    isActive
                      ? "bg-brand-500/10 text-brand-400"
                      : "text-gray-300 hover:bg-white/[0.03] hover:text-white"
                  }`}
                >
                  <span className={isActive ? "text-brand-400" : "text-gray-500"}>
                    {item.icon}
                  </span>
                  {item.label}
                  {item.badge && unreadCount > 0 && (
                    <span className="ml-auto bg-brand-500 text-white text-theme-xs px-2 py-0.5 rounded-full">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <ul className="flex flex-col gap-1 mt-auto pt-4 border-t border-gray-800">
          {navItems.filter((i) => i.comingSoon).map((item) => (
            <li key={item.label}>
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg text-theme-sm cursor-not-allowed">
                <span className="text-gray-600">{item.icon}</span>
                <span className="text-gray-500">{item.label}</span>
                <span className="ml-auto text-[10px] bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">
                  wkrotce
                </span>
              </div>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-8 h-8 bg-brand-500/10 rounded-full flex items-center justify-center">
            <span className="text-brand-400 text-theme-sm font-medium">
              {session.user?.name?.charAt(0).toUpperCase() || "K"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-theme-sm font-medium text-white/90 truncate">
              {session.user?.name || "Kierowca"}
            </p>
            <p className="text-theme-xs text-gray-400 truncate">
              {session.user?.email}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
