import { useSession } from "next-auth/react";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import LoginModal from "./LoginModal";
import { useNotifications } from "@/context/NotificationsContext";

const mainNavItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 20 20">
        <path d="M14.1667 14.9998C14.1667 15.4601 14.5398 15.8332 15 15.8332C15.4603 15.8332 15.8334 15.4601 15.8334 14.9998C15.8334 14.5396 15.4603 14.1665 15 14.1665C14.5398 14.1665 14.1667 14.5396 14.1667 14.9998Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9.16669 14.9998C9.16669 15.4601 9.53978 15.8332 10 15.8332C10.4603 15.8332 10.8334 15.4601 10.8334 14.9998C10.8334 14.5396 10.4603 14.1665 10 14.1665C9.53978 14.1665 9.16669 14.5396 9.16669 14.9998Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4.16669 14.9998C4.16669 15.4601 4.53978 15.8332 5.00002 15.8332C5.46026 15.8332 5.83335 15.4601 5.83335 14.9998C5.83335 14.5396 5.46026 14.1665 5.00002 14.1665C4.53978 14.1665 4.16669 14.5396 4.16669 14.9998Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14.1667 9.99984C14.1667 10.4601 14.5398 10.8332 15 10.8332C15.4603 10.8332 15.8334 10.4601 15.8334 9.99984C15.8334 9.5396 15.4603 9.1665 15 9.1665C14.5398 9.1665 14.1667 9.5396 14.1667 9.99984Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9.16669 9.99984C9.16669 10.4601 9.53978 10.8332 10 10.8332C10.4603 10.8332 10.8334 10.4601 10.8334 9.99984C10.8334 9.5396 10.4603 9.1665 10 9.1665C9.53978 9.1665 9.16669 9.5396 9.16669 9.99984Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4.16669 9.99984C4.16669 10.4601 4.53978 10.8332 5.00002 10.8332C5.46026 10.8332 5.83335 10.4601 5.83335 9.99984C5.83335 9.5396 5.46026 9.1665 5.00002 9.1665C4.53978 9.1665 4.16669 9.5396 4.16669 9.99984Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14.1667 4.99984C14.1667 5.46007 14.5398 5.83317 15 5.83317C15.4603 5.83317 15.8334 5.46007 15.8334 4.99984C15.8334 4.5396 15.4603 4.1665 15 4.1665C14.5398 4.1665 14.1667 4.5396 14.1667 4.99984Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9.16669 4.99984C9.16669 5.46007 9.53978 5.83317 10 5.83317C10.4603 5.83317 10.8334 5.46007 10.8334 4.99984C10.8334 4.5396 10.4603 4.1665 10 4.1665C9.53978 4.1665 9.16669 4.5396 9.16669 4.99984Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4.16669 4.99984C4.16669 5.46007 4.53978 5.83317 5.00002 5.83317C5.46026 5.83317 5.83335 5.46007 5.83335 4.99984C5.83335 4.5396 5.46026 4.1665 5.00002 4.1665C4.53978 4.1665 4.16669 4.5396 4.16669 4.99984Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: "/zlecenia",
    label: "Dostępne zlecenia",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 20 20">
        <path d="M3.95661 6.37077L3.68059 9.40698C3.63971 9.85664 3.6191 10.0834 3.65652 10.2986C3.68996 10.4909 3.75674 10.6759 3.85415 10.8451C3.9636 11.0351 4.12538 11.1968 4.44708 11.5185L8.75999 15.8315C9.41586 16.4873 9.74397 16.8154 10.1233 16.9387C10.4581 17.0475 10.8192 17.0477 11.154 16.9389C11.5345 16.8153 11.8652 16.485 12.5252 15.825L15.825 12.5251C16.4851 11.8651 16.8145 11.5353 16.9382 11.1547C17.047 10.82 17.0463 10.4592 16.9375 10.1245C16.8139 9.74392 16.4849 9.41412 15.8249 8.7541L11.5226 4.45183C11.198 4.12719 11.0356 3.96485 10.8447 3.8549C10.6756 3.75748 10.4905 3.69042 10.2982 3.65699C10.0812 3.61925 9.8525 3.64 9.39528 3.68156L6.37043 3.95655C5.58313 4.02812 5.18923 4.06407 4.88117 4.23537C4.60957 4.38641 4.38566 4.61031 4.23462 4.88192C4.06417 5.18844 4.02862 5.57955 3.95776 6.35902L3.95661 6.37077Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8.09384 8.09406C8.41928 7.76862 8.41928 7.24099 8.09384 6.91555C7.76841 6.59011 7.24039 6.59011 6.91496 6.91555C6.58952 7.24099 6.58921 7.7685 6.91464 8.09393C7.24008 8.41937 7.76841 8.4195 8.09384 8.09406Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: "/my-offers",
    label: "Moje oferty",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 20 20">
        <path d="M9.16665 14.1665H16.6666M6.66665 12.4998L4.58331 14.9998L3.33331 14.1665M9.16665 9.99984H16.6666M6.66665 8.33317L4.58331 10.8332L3.33331 9.99984M9.16665 5.83317H16.6666M6.66665 4.1665L4.58331 6.6665L3.33331 5.83317" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: "/trip-history",
    label: "Historia przejazdów",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 20 20">
        <path d="M10 5.83333V10H14.1667M10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 5.85786 5.85786 2.5 10 2.5C14.1421 2.5 17.5 5.85786 17.5 10C17.5 14.1421 14.1421 17.5 10 17.5Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: "/notifications",
    label: "Powiadomienia",
    badge: true,
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="18 10 16 18">
        <path d="M28.5 23.6667V24.5C28.5 25.8807 27.3807 27 26 27C24.6193 27 23.5 25.8807 23.5 24.5V23.6667M28.5 23.6667H23.5M28.5 23.6667H31.4921C31.8108 23.6667 31.971 23.6667 32.1001 23.6231C32.3466 23.54 32.5395 23.3464 32.6227 23.0998C32.6664 22.9702 32.6664 22.8096 32.6664 22.4883C32.6664 22.3477 32.6663 22.2774 32.6553 22.2104C32.6345 22.0837 32.5853 21.9636 32.5104 21.8593C32.4709 21.8043 32.4206 21.754 32.3215 21.6549L31.9969 21.3302C31.8922 21.2255 31.8333 21.0834 31.8333 20.9353V17.8333C31.8333 14.6117 29.2216 12 26 12C22.7783 12 20.1666 14.6117 20.1666 17.8333V20.9354C20.1666 21.0835 20.1077 21.2255 20.003 21.3302L19.6784 21.6548C19.5789 21.7542 19.5292 21.8042 19.4896 21.8594C19.4147 21.9636 19.3651 22.0837 19.3443 22.2104C19.3333 22.2774 19.3333 22.3477 19.3333 22.4883C19.3333 22.8096 19.3333 22.9702 19.377 23.0998C19.4602 23.3463 19.654 23.54 19.9005 23.6231C20.0296 23.6667 20.1892 23.6667 20.5079 23.6667H23.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

const secondaryNavItems = [
  {
    href: "/my-fleet",
    label: "Moja flota",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="17 12 18 16">
        <path d="M18.5 18.6665H19.3712M19.3712 18.6665H32.6288M19.3712 18.6665C19.3805 18.6236 19.3915 18.5811 19.4041 18.5391C19.4343 18.4389 19.477 18.3425 19.5628 18.1494L20.8514 15.2502C21.1061 14.6769 21.2337 14.3902 21.4351 14.18C21.6131 13.9942 21.8314 13.8523 22.0734 13.7651C22.3472 13.6665 22.6611 13.6665 23.2884 13.6665H28.7113C29.3386 13.6665 29.6528 13.6665 29.9266 13.7651C30.1687 13.8523 30.3866 13.9942 30.5646 14.18C30.7658 14.39 30.8932 14.6766 31.1476 15.249L32.4413 18.1599C32.524 18.346 32.5661 18.4407 32.5958 18.5391C32.6085 18.5811 32.6195 18.6236 32.6288 18.6665M19.3712 18.6665C19.3608 18.7145 19.3526 18.763 19.3464 18.8118C19.3333 18.9156 19.3333 19.0212 19.3333 19.2325V23.6665M32.6288 18.6665H33.5M32.6288 18.6665C32.6392 18.7145 32.6475 18.763 32.6536 18.8118C32.6667 18.915 32.6667 19.02 32.6667 19.2287V23.6666M32.6667 23.6666L29.3333 23.6666M32.6667 23.6666V24.4997C32.6667 25.4202 31.9205 26.1665 31 26.1665C30.0795 26.1665 29.3333 25.4203 29.3333 24.4998V23.6666M29.3333 23.6666L22.6667 23.6665M22.6667 23.6665H19.3333M22.6667 23.6665V24.4998C22.6667 25.4203 21.9205 26.1665 21 26.1665C20.0795 26.1665 19.3333 25.4203 19.3333 24.4998V23.6665" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: "/business-card",
    label: "Moja wizytówka",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="17 13 18 15">
        <path d="M21 24.5C21.053 24.5 21.1077 24.5 21.1641 24.5H26M21 24.5C20.1764 24.4993 19.7444 24.489 19.4098 24.3185C19.0962 24.1587 18.8414 23.9031 18.6817 23.5895C18.5 23.233 18.5 22.7669 18.5 21.8335V17.1668C18.5 16.2334 18.5 15.7664 18.6817 15.4098C18.8414 15.0962 19.0962 14.8414 19.4098 14.6817C19.7664 14.5 20.2334 14.5 21.1668 14.5H30.8335C31.7669 14.5 32.233 14.5 32.5895 14.6817C32.9031 14.8414 33.1587 15.0962 33.3185 15.4098C33.5 15.766 33.5 16.2325 33.5 17.1641V21.8359C33.5 22.7675 33.5 23.2333 33.3185 23.5895C33.1587 23.9031 32.9031 24.1587 32.5895 24.3185C32.2333 24.5 31.7675 24.5 30.8359 24.5H26M21 24.5C21 23.5795 22.1193 22.8333 23.5 22.8333C24.8807 22.8333 26 23.5795 26 24.5M31 21.1667H27.6667M31 18.6667H28.5M23.5 20.3333C22.5795 20.3333 21.8333 19.5871 21.8333 18.6667C21.8333 17.7462 22.5795 17 23.5 17C24.4205 17 25.1667 17.7462 25.1667 18.6667C25.1667 19.5871 24.4205 20.3333 23.5 20.3333Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: "/account",
    label: "Moje konto",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 20 20">
        <path d="M16.6666 17.5C16.6666 15.1988 13.6819 13.3333 9.99998 13.3333C6.31808 13.3333 3.33331 15.1988 3.33331 17.5M9.99998 10.8333C7.69879 10.8333 5.83331 8.96785 5.83331 6.66667C5.83331 4.36548 7.69879 2.5 9.99998 2.5C12.3012 2.5 14.1666 4.36548 14.1666 6.66667C14.1666 8.96785 12.3012 10.8333 9.99998 10.8333Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

function NavLink({ href, label, icon, badge, unreadCount, isActive }: {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: boolean;
  unreadCount?: number;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3.5 px-4 py-3 rounded-md font-medium transition-colors text-[15px] leading-snug ${
        isActive ? "text-[#FFC428]" : "text-[#ffffff] hover:text-[#FFC428]"
      }`}
    >
      {icon}
      {label}
      {badge && unreadCount && unreadCount > 0 ? (
        <span className="ml-auto bg-[#FFC428] text-[#0B298F] text-theme-xs px-2 py-0.5 rounded-full font-semibold">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}

export default function Sidebar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { unreadCount } = useNotifications();

  if (!session) {
    return (
      <>
        <aside className="w-60 bg-[#0B298F] h-full flex flex-col">
          <div className="border-b border-white/10 flex items-center px-4 py-3 gap-2">
            <Image src={require("@/assets/logo.png")} alt="wayoo kierowca" width={140} height={36} className="h-9 w-auto brightness-0 invert" />
            <span className="text-theme-xs font-medium text-white/60 uppercase tracking-widest">driver</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-6">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#FFC428] hover:bg-[#e6b024] text-[#0B298F] px-6 py-3 rounded-lg font-medium transition-colors"
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
    <aside className="w-60 px-4 pt-11 bg-[#0B298F] h-full flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-12">
        <Link href="/">
          <Image src={require("@/assets/logo.png")} alt="wayoo kierowca" width={140} height={36} className="h-9 w-auto brightness-0 invert" />
        </Link>
        <span className="text-theme-xs font-medium text-white/60 uppercase tracking-widest">driver</span>
      </div>

      {/* Nawigacja */}
      <nav className="flex-1 flex flex-col overflow-y-auto">
        {/* Główne linki */}
        <ul className="flex flex-col gap-1">
          {mainNavItems.map((item) => (
            <li key={item.href}>
              <NavLink
                href={item.href}
                label={item.label}
                icon={item.icon}
                badge={item.badge}
                unreadCount={unreadCount}
                isActive={router.pathname === item.href}
              />
            </li>
          ))}
        </ul>

        {/* Drugorzędne linki */}
        <ul className="flex flex-col gap-1 mt-12">
          {secondaryNavItems.map((item) => (
            <li key={item.href}>
              <NavLink
                href={item.href}
                label={item.label}
                icon={item.icon}
                isActive={router.pathname === item.href}
              />
            </li>
          ))}
        </ul>

        {/* Coming soon */}
        <ul className="flex flex-col gap-1 mt-auto pt-4">
          {[
            { label: "Statystyki", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
            { label: "ESG", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
            { label: "Automatyczna wycena", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> },
            { label: "Promowanie", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg> },
          ].map((item) => (
            <li key={item.label}>
              <div className="flex items-center gap-3.5 px-4 py-3 rounded-md text-[12px] cursor-not-allowed">
                <span className="text-white/30 shrink-0">{item.icon}</span>
                <span className="text-white/30">{item.label}</span>
                <span className="ml-auto text-[10px] bg-white/10 text-white/40 px-1.5 py-0.5 rounded shrink-0">wkrótce</span>
              </div>
            </li>
          ))}
        </ul>
      </nav>

      {/* Profil */}
      <div className="border-t border-white/10 p-4 pb-6">
        <Link
          href="/account"
          className="flex items-center gap-3 rounded-md hover:text-[#FFC428] transition-colors"
        >
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            <span className="text-[#ffffff] text-theme-sm font-semibold">
              {session?.user?.name?.charAt(0).toUpperCase() || "K"}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-medium text-[#ffffff] truncate leading-tight">
              {session?.user?.name || "Kierowca"}
            </p>
            <p className="text-theme-xs text-[#ffffff]/50 truncate">
              {session?.user?.email}
            </p>
          </div>
        </Link>
      </div>

    </aside>
  );
}
