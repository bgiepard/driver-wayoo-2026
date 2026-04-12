import { useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import Sidebar from "./Sidebar";
import { useNotifications } from "@/context/NotificationsContext";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { unreadCount } = useNotifications();

  // Zamknij sidebar mobile przy zmianie strony
  useEffect(() => {
    setMobileOpen(false);
  }, [router.pathname]);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">

      {/* Sidebar desktop — w flow */}
      <div className="hidden md:block sticky top-0 h-screen shrink-0 overflow-y-auto">
        <Sidebar />
      </div>

      {/* Sidebar mobile — fixed overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed top-0 left-0 h-full z-50 md:hidden overflow-y-auto shadow-xl">
            <Sidebar />
          </div>
        </>
      )}

      {/* Treść */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header mobile */}
        <div className="md:hidden flex items-center justify-between bg-[#0b298f] px-3 py-1">
          {/* Logo */}
          <Link href="/" className="flex items-end gap-1.5">
            <Image
              src={require("@/assets/logo.png")}
              alt="wayoo kierowca"
              width={97}
              height={32}
              className="h-8 w-auto brightness-0 invert"
            />
            <span className="text-[12px] font-semibold italic text-[#FFC428] uppercase leading-none mb-0.5">
              driver
            </span>
          </Link>

          {/* Akcje po prawej */}
          <div className="flex items-center">
            {/* Dzwonek z badge */}
            <Link href="/powiadomienia" className="relative p-3">
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-5 h-5 bg-[#FFC428] text-[#010101] text-[12px] font-bold rounded-full flex items-center justify-center z-10">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="18 10 16 18">
                <path d="M28.5 23.6667V24.5C28.5 25.8807 27.3807 27 26 27C24.6193 27 23.5 25.8807 23.5 24.5V23.6667M28.5 23.6667H23.5M28.5 23.6667H31.4921C31.8108 23.6667 31.971 23.6667 32.1001 23.6231C32.3466 23.54 32.5395 23.3464 32.6227 23.0998C32.6664 22.9702 32.6664 22.8096 32.6664 22.4883C32.6664 22.3477 32.6663 22.2774 32.6553 22.2104C32.6345 22.0837 32.5853 21.9636 32.5104 21.8593C32.4709 21.8043 32.4206 21.754 32.3215 21.6549L31.9969 21.3302C31.8922 21.2255 31.8333 21.0834 31.8333 20.9353V17.8333C31.8333 14.6117 29.2216 12 26 12C22.7783 12 20.1666 14.6117 20.1666 17.8333V20.9354C20.1666 21.0835 20.1077 21.2255 20.003 21.3302L19.6784 21.6548C19.5789 21.7542 19.5292 21.8042 19.4896 21.8594C19.4147 21.9636 19.3651 22.0837 19.3443 22.2104C19.3333 22.2774 19.3333 22.3477 19.3333 22.4883C19.3333 22.8096 19.3333 22.9702 19.377 23.0998C19.4602 23.3463 19.654 23.54 19.9005 23.6231C20.0296 23.6667 20.1892 23.6667 20.5079 23.6667H23.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>

            {/* Hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="p-3 text-white"
              aria-label="Otwórz menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>
        </div>

        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
