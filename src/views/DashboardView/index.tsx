import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Image from "next/image";
import type { OfferWithRequest } from "@/models";
import OfferDetailsModal from "@/components/OfferDetailsModal";
import LoginModal from "@/components/LoginModal";
import logo from "@/assets/logo.png";
import { MetricCard } from "./MetricCard";
import { DashboardBox } from "./DashboardBox";
import { DashboardCalendar } from "./DashboardCalendar";
import { DashboardCharts } from "./DashboardCharts";

export default function DashboardView() {
  const { data: session, status } = useSession();
  const [offers, setOffers] = useState<OfferWithRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<OfferWithRequest | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (session) {
      fetchOffers();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchOffers = async () => {
    try {
      const res = await fetch("/api/offers?limit=100");
      const data = await res.json();
      setOffers(data.offers ?? data);
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  // Landing page - niezalogowany
  if (!session) {
    return (
      <div className="relative min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-500/[0.07] blur-[120px]" />
          <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-brand-400/[0.04] blur-[80px]" />
        </div>

        <div className="relative z-10 text-center max-w-lg">
          <Image src={logo} alt="Wayoo" className="h-10 w-auto mx-auto mb-12 opacity-80" />

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-xs font-medium text-brand-400 tracking-wide">Panel Kierowcy</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-5">
            Twoje zlecenia,{" "}
            <span className="text-brand-400">jedna platforma</span>
          </h1>

          <p className="text-lg text-gray-400 leading-relaxed mb-12 max-w-md mx-auto">
            Zarzadzaj flota, skladaj oferty i sledz przychody — wszystko w jednym miejscu.
          </p>

          <button
            onClick={() => setShowLogin(true)}
            className="group relative inline-flex items-center justify-center px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl text-base transition-all duration-200"
          >
            Zaloguj sie
            <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>

        <div className="absolute bottom-8 text-xs text-gray-600">wayoo.pl</div>
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      </div>
    );
  }

  // Dashboard - zalogowany
  const pendingOffers = offers.filter((o) => o.status === "new");
  const paidOffers = offers.filter((o) => o.status === "paid");
  const totalRevenue = paidOffers.reduce((sum, o) => sum + o.price, 0);

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">

      {/* Nagłówek */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Dashboard</p>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Witaj, {session.user?.name}
        </h1>
      </div>

      {/* Rząd 1 — Oferty */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <DashboardBox
          label="Oferty oczekujące"
          offers={pendingOffers}
          emptyText="Brak ofert oczekujących na akceptację"
        />
        <DashboardBox
          label="Oferty opłacone"
          offers={paidOffers}
          emptyText="Brak opłaconych ofert"
        />
      </div>

      {/* Rząd 2 — Wykresy */}
      <DashboardCharts offers={offers} />

      {/* Rząd 3 — Statystyki + Kalendarz */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-stretch">

        {/* Lewa kolumna — podsumowanie (1/3) */}
        <div className="flex flex-col gap-3 h-full">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Podsumowanie</p>
          <div className="flex-1 rounded-lg border border-gray-200 bg-white shadow-sm divide-y divide-gray-100">
            {[
              {
                label: "Złożonych ofert",
                value: offers.length,
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                ),
              },
              {
                label: "Oczekujących",
                value: pendingOffers.length,
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                label: "Przychód",
                value: `${totalRevenue.toLocaleString("pl-PL")} PLN`,
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                ),
              },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex items-center justify-between px-5 py-5">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
                </div>
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-500 shrink-0">
                  {icon}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prawa kolumna — Kalendarz (2/3) */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Harmonogram</p>
          <div className="flex-1 rounded-lg border border-gray-200 bg-white shadow-sm p-5">
            <DashboardCalendar offers={offers} onOfferClick={setSelectedOffer} />
          </div>
        </div>

      </div>

      {selectedOffer && (
        <OfferDetailsModal
          offer={selectedOffer}
          onClose={() => setSelectedOffer(null)}
        />
      )}
    </div>
  );
}
