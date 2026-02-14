import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { OfferWithRequest, OfferStatus } from "@/models";
import { getRouteDisplay } from "@/models";
import OfferDetailsModal from "@/components/OfferDetailsModal";

/* ============================================
   STATUSY
   ============================================ */

const STATUS_CONFIG: Record<OfferStatus, { label: string; dot: string; badge: string }> = {
  new: {
    label: "Oczekuje",
    dot: "bg-warning-400",
    badge: "bg-warning-500/10 text-warning-400 border-warning-500/20",
  },
  accepted: {
    label: "Zaakceptowana",
    dot: "bg-success-400",
    badge: "bg-success-500/10 text-success-400 border-success-500/20",
  },
  paid: {
    label: "Oplacona",
    dot: "bg-info-400",
    badge: "bg-info-500/10 text-info-400 border-info-500/20",
  },
  canceled: {
    label: "Anulowana",
    dot: "bg-gray-400",
    badge: "bg-white/5 text-gray-400 border-white/10",
  },
  rejected: {
    label: "Odrzucona",
    dot: "bg-error-400",
    badge: "bg-error-500/10 text-error-400 border-error-500/20",
  },
};

/* ============================================
   TABY
   ============================================ */

type TabKey = "all" | "new" | "accepted" | "paid" | "rejected" | "canceled";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "Wszystkie" },
  { key: "new", label: "Oczekujace" },
  { key: "paid", label: "Oplacone" },
  { key: "accepted", label: "Zaakceptowane" },
  { key: "rejected", label: "Odrzucone" },
  { key: "canceled", label: "Anulowane" },
];

/* ============================================
   STRONA
   ============================================ */

export default function MyOffers() {
  const { data: session, status } = useSession();
  const [offers, setOffers] = useState<OfferWithRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<OfferWithRequest | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  useEffect(() => {
    if (session) {
      fetchOffers();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchOffers = async () => {
    try {
      const res = await fetch("/api/offers");
      const data = await res.json();
      setOffers(data);
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

  if (!session) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
        <p className="text-gray-500">Zaloguj sie, aby zobaczyc swoje oferty.</p>
      </div>
    );
  }

  const filteredOffers = activeTab === "all"
    ? offers
    : offers.filter((o) => o.status === activeTab);

  // Liczniki do tabow
  const counts: Record<TabKey, number> = {
    all: offers.length,
    new: offers.filter((o) => o.status === "new").length,
    accepted: offers.filter((o) => o.status === "accepted").length,
    paid: offers.filter((o) => o.status === "paid").length,
    rejected: offers.filter((o) => o.status === "rejected").length,
    canceled: offers.filter((o) => o.status === "canceled").length,
  };

  return (
    <div className="max-w-[1100px] mx-auto h-[calc(100vh-4rem)] flex flex-col">
      {/* Naglowek */}
      <div className="mb-6 shrink-0">
        <p className="text-sm font-medium text-gray-500 mb-1">Oferty</p>
        <h1 className="text-2xl font-bold text-white tracking-tight">Moje oferty</h1>
      </div>

      {offers.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-16 text-center">
          <svg className="w-10 h-10 mx-auto text-gray-700 mb-4" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
          </svg>
          <p className="text-gray-500 mb-4">Nie masz jeszcze zadnych zlozonych ofert.</p>
          <Link
            href="/zlecenia"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors"
          >
            Przejdz do dostepnych zlecen
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      ) : (
        <>
          {/* Taby */}
          <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1 shrink-0 custom-scrollbar">
            {TABS.map((tab) => {
              const count = counts[tab.key];
              if (tab.key !== "all" && count === 0) return null;

              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors
                    ${isActive
                      ? "bg-white/[0.08] text-white"
                      : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]"
                    }
                  `}
                >
                  {tab.label}
                  <span className={`
                    text-xs px-1.5 py-0.5 rounded-md min-w-[20px] text-center
                    ${isActive ? "bg-white/10 text-gray-300" : "bg-white/[0.04] text-gray-600"}
                  `}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Lista ofert */}
          {filteredOffers.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] py-12 text-center">
              <p className="text-sm text-gray-600">Brak ofert w tej kategorii</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto min-h-0 flex-1 pr-1 custom-scrollbar">
              {filteredOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} onClick={setSelectedOffer} />
              ))}
            </div>
          )}
        </>
      )}

      {selectedOffer && (
        <OfferDetailsModal
          offer={selectedOffer}
          onClose={() => setSelectedOffer(null)}
        />
      )}
    </div>
  );
}

/* ============================================
   KARTA OFERTY
   ============================================ */

function OfferCard({
  offer,
  onClick,
}: {
  offer: OfferWithRequest;
  onClick: (offer: OfferWithRequest) => void;
}) {
  const cfg = STATUS_CONFIG[offer.status] || STATUS_CONFIG.new;

  return (
    <div
      className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 cursor-pointer hover:bg-white/[0.04] transition-colors"
      onClick={() => onClick(offer)}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          {offer.request ? (
            <>
              <p className="text-base font-semibold text-white truncate">
                {getRouteDisplay(offer.request.route)}
              </p>
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  {offer.request.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {offer.request.time}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  {offer.request.adults}{offer.request.children > 0 && ` + ${offer.request.children}`}
                </span>
              </div>
            </>
          ) : (
            <p className="text-base font-semibold text-white">
              Zlecenie #{offer.requestId.slice(-6)}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.06]">
            <div>
              <span className="text-xs text-gray-600">Twoja cena</span>
              <p className="text-lg font-bold text-white">{offer.price} PLN</p>
            </div>
            {offer.message && (
              <div className="min-w-0">
                <span className="text-xs text-gray-600">Wiadomosc</span>
                <p className="text-sm text-gray-400 truncate">{offer.message}</p>
              </div>
            )}
          </div>
        </div>

        {/* Badge statusu */}
        <span className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border ${cfg.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>
    </div>
  );
}
