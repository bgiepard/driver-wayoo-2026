import { useState, useEffect, ReactNode } from "react";
import Sidebar from "./Sidebar";

const STORAGE_KEY = "wayoo_sidebar_collapsed";

export default function DashboardLayout({ children }: { children: ReactNode }) {
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
      <main className="flex-1 p-4 md:p-6 lg:p-8 min-w-0">
        {children}
      </main>
    </div>
  );
}
