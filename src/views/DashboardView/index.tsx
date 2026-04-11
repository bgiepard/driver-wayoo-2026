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

// Ikona trend (strzałka w górę)
const TrendIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
  </svg>
);

export default function DashboardView() {
  const { data: session, status } = useSession();
  const [offers, setOffers] = useState<OfferWithRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<OfferWithRequest | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (session) {
      void fetchOffers();
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0b298f] border-t-transparent" />
      </div>
    );
  }

  // Landing page — niezalogowany
  if (!session) {
    return (
      <div className="relative min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#0b298f]/[0.07] blur-[120px]" />
        </div>
        <div className="relative z-10 text-center max-w-lg">
          <Image src={logo} alt="Wayoo" className="h-10 w-auto mx-auto mb-12 opacity-80" />
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0b298f]/10 border border-[#0b298f]/20 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFC428] animate-pulse" />
            <span className="text-xs font-medium text-[#FFC428] tracking-wide">Panel Kierowcy</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-5">
            Twoje zlecenia,{" "}
            <span className="text-[#FFC428]">jedna platforma</span>
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed mb-12 max-w-md mx-auto">
            Zarządzaj flotą, składaj oferty i śledź przychody — wszystko w jednym miejscu.
          </p>
          <button
            onClick={() => setShowLogin(true)}
            className="inline-flex items-center justify-center px-8 py-4 bg-[#0b298f] hover:bg-[#0a2070] text-white font-semibold rounded-xl text-base transition-colors"
          >
            Zaloguj się
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
        <div className="absolute bottom-8 text-xs text-gray-600">wayoo.pl</div>
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      </div>
    );
  }

  // Statystyki
  const pendingOffers = offers.filter((o) => o.status === "new");
  const paidOffers = offers.filter((o) => o.status === "paid");
  const totalRevenue = paidOffers.reduce((sum, o) => sum + o.price, 0);

  return (
    <div className="flex flex-col gap-4 max-w-[1150px] mx-auto w-full">

      {/* Tytuł */}
      <h1 className="text-[#0f172a] text-[18px] font-semibold leading-snug">Dashboard</h1>

      {/* Rząd 1 — Karty metryk */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4">
        <MetricCard
          label="Złożone oferty"
          value={offers.length}
          icon={<TrendIcon />}
        />
        <MetricCard
          label="Oczekujące na odpowiedź"
          value={pendingOffers.length}
          icon={<TrendIcon />}
        />
        <MetricCard
          label="Przychód"
          value={`${totalRevenue.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`}
          icon={<TrendIcon />}
        />
      </div>

      {/* Rząd 2 — Lista ofert + Kalendarz */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-stretch">
        <div className="flex-[3] min-w-0">
          <DashboardBox
            label="Ostatnio złożone oferty"
            offers={offers}
            emptyText="Brak złożonych ofert"
          />
        </div>
        <div className="flex-[2] min-w-0">
          <DashboardCalendar offers={offers} onOfferClick={setSelectedOffer} />
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
