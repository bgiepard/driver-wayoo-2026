import { ReactNode } from "react";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-900">
      <div className="sticky top-0 h-screen shrink-0 overflow-y-auto">
        <Sidebar />
      </div>
      <main className="flex-1 p-4 md:p-6 lg:p-8 min-w-0">
        {children}
      </main>
    </div>
  );
}
