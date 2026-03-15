import { useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import Sidebar from "./Sidebar";

const STORAGE_KEY = "wayoo_sidebar_collapsed";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) setCollapsed(stored === "true");
    } catch { /* ignore */ }
  }, []);

  // Zamknij sidebar mobile przy zmianie strony
  useEffect(() => {
    setMobileOpen(false);
  }, [router.pathname]);

  const toggle = () => {
    setCollapsed((prev) => {
      try {
        localStorage.setItem(STORAGE_KEY, String(!prev));
      } catch { /* ignore */ }
      return !prev;
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Sidebar desktop — w flow */}
      <div className="hidden md:block sticky top-0 h-screen shrink-0 overflow-y-auto">
        <Sidebar collapsed={collapsed} onToggle={toggle} />
      </div>

      {/* Sidebar mobile — fixed overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed top-0 left-0 h-full z-50 md:hidden overflow-y-auto shadow-xl">
            <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      {/* Treść */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-200 bg-white">

          {/* Hamburger + logo — tylko mobile */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-1 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              aria-label="Otwórz menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <Link href="/" className="flex items-center gap-1.5">
              <Image src={require("@/assets/logo.png")} alt="wayoo kierowca" width={100} height={26} className="h-7 w-auto invert" />
              <span className="text-theme-xs font-medium text-gray-400 uppercase tracking-widest">driver</span>
            </Link>
          </div>

          {/* Profil kierowcy */}
          {session && (
            <Link href="/account" className="flex items-center gap-3 group ml-auto">
              <div className="text-right hidden sm:block">
                <p className="text-theme-sm font-medium text-gray-900 leading-tight group-hover:text-brand-600 transition-colors">
                  {session.user?.name || "Kierowca"}
                </p>
                <p className="text-theme-xs text-gray-500">
                  {session.user?.email}
                </p>
              </div>
              <div className="w-8 h-8 bg-brand-50 rounded-full flex items-center justify-center shrink-0 group-hover:bg-brand-100 transition-colors">
                <span className="text-brand-600 text-theme-sm font-medium">
                  {session.user?.name?.charAt(0).toUpperCase() || "K"}
                </span>
              </div>
            </Link>
          )}
        </div>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
