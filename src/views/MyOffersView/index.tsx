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
  const [isLoading, setIsLoading] = useState(true);
  const [isListLoading, setIsListLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<OfferWithRequest | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [tabCounts, setTabCounts] = useState<Partial<Record<TabKey, number>>>({});

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
        // Zapisz liczbę dla aktywnego taba
        setTabCounts(prev => ({
          ...prev,
          [tab]: data.hasMore ? undefined : data.offers.length,
        }));
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

  useEffect(() => {
    if (session) {
      fetchOffers(activeTab, PAGE_SIZE, "initial");
    } else {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0b298f] border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="rounded-2xl border border-[#e2e8f0] bg-white p-12 text-center">
        <p className="text-sm text-[#475569]">Zaloguj się, aby zobaczyć swoje oferty.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-[1150px] mx-auto w-full">

      {/* Tytuł + taby w jednym rzędzie */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-[#0f172a] text-[18px] font-semibold leading-snug shrink-0">Moje oferty</h1>

        {/* Taby po prawej */}
        <div className="flex items-center gap-5 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = tab.key === activeTab
              ? (hasMore ? `${offers.length}+` : offers.length > 0 ? String(offers.length) : null)
              : tabCounts[tab.key] != null ? String(tabCounts[tab.key]) : null;

            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-1.5 text-[14px] whitespace-nowrap transition-colors ${
                  isActive
                    ? "font-semibold text-[#0f172a]"
                    : "font-medium text-[#94a3b8] hover:text-[#475569]"
                }`}
              >
                {tab.label}
                {count && (
                  <span className={`text-[14px] font-semibold ${isActive ? "text-[#0f172a]" : "text-[#94a3b8]"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista ofert */}
      {isListLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-[#0b298f] border-t-transparent" />
        </div>
      ) : offers.length === 0 ? (
        activeTab === "all" ? (
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-16 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#f1f5f9] mx-auto mb-4">
              <svg className="w-6 h-6 text-[#94a3b8]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
              </svg>
            </div>
            <p className="text-[14px] font-medium text-[#0f172a] mb-1">Brak złożonych ofert</p>
            <p className="text-[13px] text-[#475569] mb-5">Przeglądaj dostępne zlecenia i składaj oferty</p>
            <Link
              href="/zlecenia"
              className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#0b298f] hover:text-[#0a2070] transition-colors"
            >
              Przejdź do zleceń
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-[#e2e8f0] rounded-2xl py-12 text-center">
            <p className="text-[13px] text-[#94a3b8]">Brak ofert w tej kategorii</p>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-2">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} onClick={setSelectedOffer} />
          ))}

          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-[#e2e8f0] bg-white text-[14px] font-medium text-[#475569] hover:text-[#0f172a] hover:border-[#cbd5e1] transition-colors disabled:opacity-50"
            >
              {isLoadingMore ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#94a3b8] border-t-transparent" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              )}
              {isLoadingMore ? "Ładowanie..." : "Załaduj więcej"}
            </button>
          )}

          {!hasMore && offers.length > 0 && (
            <p className="text-[12px] text-[#94a3b8] text-center py-2">
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
