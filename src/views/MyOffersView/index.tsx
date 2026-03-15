import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { OfferWithRequest, OfferStatus } from "@/models";
import OfferDetailsModal from "@/components/OfferDetailsModal";
import { OfferCard } from "./OfferCard";

const PAGE_SIZE = 10;

type TabKey = "all" | OfferStatus;

const TABS: { key: TabKey; label: string }[] = [
  { key: "all",      label: "Wszystkie" },
  { key: "new",      label: "Oczekujące" },
  { key: "paid",     label: "Opłacone" },
  { key: "rejected", label: "Odrzucone" },
  { key: "canceled", label: "Anulowane" },
];

export default function MyOffersView() {
  const { data: session, status } = useSession();
  const [offers, setOffers] = useState<OfferWithRequest[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(true);       // pierwsze wejście
  const [isListLoading, setIsListLoading] = useState(false); // zmiana taba
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<OfferWithRequest | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const fetchOffers = useCallback(async (
    tab: TabKey,
    fetchLimit: number,
    mode: "initial" | "tab" | "more" = "initial"
  ) => {
    if (mode === "more") setIsLoadingMore(true);
    else if (mode === "tab") setIsListLoading(true);
    else setIsLoading(true);

    try {
      const params = new URLSearchParams({ limit: String(fetchLimit) });
      if (tab !== "all") params.set("status", tab);

      const res = await fetch(`/api/offers?${params}`);
      if (!res.ok) return;
      const data = await res.json();

      if (mode === "more") {
        setOffers((prev) => {
          const existingIds = new Set(prev.map((o) => o.id));
          return [...prev, ...data.offers.filter((o: OfferWithRequest) => !existingIds.has(o.id))];
        });
      } else {
        setOffers(data.offers);
      }
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setIsLoading(false);
      setIsListLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Załaduj przy logowaniu
  useEffect(() => {
    if (session) {
      fetchOffers(activeTab, PAGE_SIZE, "initial");
    } else {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Zmiana taba — reset i nowy fetch
  const handleTabChange = (tab: TabKey) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setLimit(PAGE_SIZE);
    fetchOffers(tab, PAGE_SIZE, "tab");
  };

  const handleLoadMore = () => {
    const nextLimit = limit + PAGE_SIZE;
    setLimit(nextLimit);
    fetchOffers(activeTab, nextLimit, "more");
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-12 text-center">
        <p className="text-sm text-gray-500">Zaloguj się, aby zobaczyć swoje oferty.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto space-y-6">

      {/* Nagłówek */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Oferty</p>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Moje oferty</h1>
      </div>

      {/* Taby */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              {tab.label}
              {isActive && offers.length > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded min-w-[20px] text-center ${
                  isActive ? "bg-brand-100 text-brand-600" : "bg-gray-100 text-gray-500"
                }`}>
                  {offers.length}{hasMore ? "+" : ""}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Lista */}
      {isListLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : offers.length === 0 ? (
        activeTab === "all" ? (
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-16 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">Brak złożonych ofert</p>
            <p className="text-xs text-gray-400 mb-5">Przeglądaj dostępne zlecenia i składaj oferty</p>
            <Link
              href="/zlecenia"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              Przejdź do zleceń
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm py-12 text-center">
            <p className="text-sm text-gray-400">Brak ofert w tej kategorii</p>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-3">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} onClick={setSelectedOffer} />
          ))}

          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm"
            >
              {isLoadingMore ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              )}
              {isLoadingMore ? "Ładowanie..." : "Załaduj więcej"}
            </button>
          )}

          {!hasMore && offers.length > 0 && (
            <p className="text-xs text-gray-400 text-center py-2">
              Wyświetlono wszystkie {offers.length} {offers.length === 1 ? "ofertę" : "ofert"}
            </p>
          )}
        </div>
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
