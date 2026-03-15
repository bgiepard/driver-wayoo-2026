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
    href: "/trip-history",
    label: "Historia przejazdów",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
    href: "/business-card",
    label: "Moja wizytówka",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
      </svg>
    ),
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tooltip">
      {children}
      <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 hidden group-hover/tooltip:block">
        <div className="bg-gray-900 text-white text-theme-xs px-2 py-1 rounded whitespace-nowrap border border-gray-800 shadow-lg">
          {label}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { unreadCount } = useNotifications();

  const activeItems = navItems.filter((i) => !i.comingSoon);
  const comingSoonItems = navItems.filter((i) => i.comingSoon);

  if (!session) {
    return (
      <>
        <aside
          className={`${collapsed ? "w-16" : "w-72"} bg-white border-r border-gray-200 h-full flex flex-col transition-all duration-200`}
        >
          <div className="border-b border-gray-200 flex items-center px-4 py-3 gap-2">
            {!collapsed && (
              <>
                <Image src={require("@/assets/logo.png")} alt="wayoo kierowca" width={140} height={36} className="h-9 w-auto invert" />
                <span className="text-theme-xs font-medium text-gray-500 uppercase tracking-widest">driver</span>
              </>
            )}
            <button
              onClick={onToggle}
              className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
              title={collapsed ? "Rozwin sidebar" : "Zwij sidebar"}
            >
              <svg className={`w-4 h-4 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-6">
            {!collapsed && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Zaloguj sie
              </button>
            )}
          </div>
        </aside>
        <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  return (
    <aside
      className={`${collapsed ? "w-16" : "w-72"} bg-white border-r border-gray-200 h-full flex flex-col transition-all duration-200`}
    >
      {/* Logo + toggle */}
      <div className="border-b border-gray-200 flex items-center px-4 py-3 gap-2 min-h-[61px]">
        {!collapsed && (
          <>
            <Link href="/">
              <Image src={require("@/assets/logo.png")} alt="wayoo kierowca" width={140} height={36} className="h-9 w-auto invert" />
            </Link>
            <span className="text-theme-xs font-medium text-gray-500 uppercase tracking-widest -mb-1">driver</span>
          </>
        )}
        <button
          onClick={onToggle}
          className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
          title={collapsed ? "Rozwin sidebar" : "Zwij sidebar"}
        >
          <svg className={`w-4 h-4 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Nawigacja */}
      <nav className="flex-1 p-2 flex flex-col overflow-y-auto">
        <ul className="flex flex-col gap-1">
          {activeItems.map((item) => {
            const isActive = router.pathname === item.href;
            const linkContent = (
              <Link
                href={item.href}
                className={`flex items-center rounded-md font-medium transition-colors ${
                  collapsed
                    ? "justify-center p-3"
                    : "gap-3.5 px-4 py-3.5 text-[1.05rem] leading-snug"
                } ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className={isActive ? "text-brand-600" : "text-gray-400"}>
                  {item.icon}
                </span>
                {!collapsed && item.label}
                {!collapsed && item.badge && unreadCount > 0 && (
                  <span className="ml-auto bg-brand-500 text-white text-theme-xs px-2 py-0.5 rounded-full">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                {collapsed && item.badge && unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-brand-500 rounded-full" />
                )}
              </Link>
            );

            return (
              <li key={item.href} className={collapsed ? "relative" : ""}>
                {collapsed ? (
                  <Tooltip label={item.label}>
                    <div className="relative">{linkContent}</div>
                  </Tooltip>
                ) : (
                  linkContent
                )}
              </li>
            );
          })}
        </ul>

        {/* Wkrotce */}
        <ul className="flex flex-col gap-1 mt-auto pt-4 border-t border-gray-200">
          {comingSoonItems.map((item) => (
            <li key={item.label}>
              {collapsed ? (
                <Tooltip label={`${item.label} — wkrótce`}>
                  <div className="flex justify-center p-3 rounded-md cursor-not-allowed">
                    <span className="text-gray-300">{item.icon}</span>
                  </div>
                </Tooltip>
              ) : (
                <div className="flex items-center gap-3 px-4 py-2 rounded-md text-theme-sm cursor-not-allowed">
                  <span className="text-gray-300">{item.icon}</span>
                  <span className="text-gray-400">{item.label}</span>
                  <span className="ml-auto text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">
                    wkrótce
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>

    </aside>
  );
}
