import { useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Sidebar from "./Sidebar";

const STORAGE_KEY = "wayoo_sidebar_collapsed";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  // Wczytaj stan z localStorage po stronie klienta
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) setCollapsed(stored === "true");
    } catch { /* ignore */ }
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      try {
        localStorage.setItem(STORAGE_KEY, String(!prev));
      } catch { /* ignore */ }
      return !prev;
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-900">
      <div className="sticky top-0 h-screen shrink-0 overflow-y-auto">
        <Sidebar collapsed={collapsed} onToggle={toggle} />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        {session && (
          <div className="flex justify-end items-center px-6 py-3 border-b border-gray-800">
            <Link href="/account" className="flex items-center gap-3 group">
              <div className="text-right">
                <p className="text-theme-sm font-medium text-white/90 leading-tight group-hover:text-brand-400 transition-colors">
                  {session.user?.name || "Kierowca"}
                </p>
                <p className="text-theme-xs text-gray-500">
                  {session.user?.email}
                </p>
              </div>
              <div className="w-8 h-8 bg-brand-500/10 rounded-full flex items-center justify-center shrink-0 group-hover:bg-brand-500/20 transition-colors">
                <span className="text-brand-400 text-theme-sm font-medium">
                  {session.user?.name?.charAt(0).toUpperCase() || "K"}
                </span>
              </div>
            </Link>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
