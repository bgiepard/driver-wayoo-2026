import { useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import Sidebar from "./Sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Zamknij sidebar mobile przy zmianie strony
  useEffect(() => {
    setMobileOpen(false);
  }, [router.pathname]);

  return (
    <div className="flex min-h-screen bg-gray-50">

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

        {/* Hamburger — tylko mobile */}
        <div className="md:hidden flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-white">
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
            <Image src={require("@/assets/logo.png")} alt="wayoo kierowca" width={140} height={36} className="h-9 w-auto invert" />
            <span className="text-theme-xs font-medium text-gray-500 uppercase tracking-widest">driver</span>
          </Link>
        </div>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
