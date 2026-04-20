import { useSession } from "next-auth/react";
import { useState, useEffect, useMemo } from "react";
import type { OfferWithRequest, Vehicle } from "@/models";
import { parseRoute } from "@/models";

type TabKey = "all" | "upcoming" | "past";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all",      label: "Wszystkie" },
  { key: "upcoming", label: "Nadchodzące" },
  { key: "past",     label: "Zrealizowane" },
];

function isPastDate(dateStr: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  const monthNames = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
  return `${parseInt(d, 10)} ${monthNames[parseInt(m, 10) - 1]} ${y}`;
}

function getWaypointsLabel(count: number): string {
  if (count === 0) return "Bez przystanków";
  if (count === 1) return "1 przystanek";
  if (count < 5) return `${count} przystanki`;
  return `${count} przystanków`;
}

export default function TripHistoryView() {
  const { data: session, status } = useSession();
  const [offers, setOffers] = useState<OfferWithRequest[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  useEffect(() => {
    if (session) {
      fetchData();
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const fetchData = async () => {
    try {
      const [offersRes, vehiclesRes] = await Promise.all([
        fetch("/api/offers?limit=200"),
        fetch("/api/vehicles"),
      ]);
      const offersJson = await offersRes.json();
      const vehiclesJson = await vehiclesRes.json();

      const historyOffers = (offersJson.offers as OfferWithRequest[] || []).filter(
        (o) => o.status === "paid"
      );
      historyOffers.sort((a, b) => {
        const dateA = a.request?.date ?? "";
        const dateB = b.request?.date ?? "";
        return dateB.localeCompare(dateA);
      });

      setOffers(historyOffers);
      setVehicles(Array.isArray(vehiclesJson) ? vehiclesJson : []);
    } catch {
      // zostaw offers jako []
    } finally {
      setLoading(false);
    }
  };

  const vehicleMap = useMemo(
    () => new Map(vehicles.map((v) => [v.id, v])),
    [vehicles]
  );

  const filtered = useMemo(() => {
    if (activeTab === "upcoming") return offers.filter((o) => !isPastDate(o.request?.date ?? ""));
    if (activeTab === "past") return offers.filter((o) => isPastDate(o.request?.date ?? ""));
    return offers;
  }, [offers, activeTab]);

  const tabCounts: Record<TabKey, number> = useMemo(() => ({
    all: offers.length,
    upcoming: offers.filter((o) => !isPastDate(o.request?.date ?? "")).length,
    past: offers.filter((o) => isPastDate(o.request?.date ?? "")).length,
  }), [offers]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0b298f] border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="rounded-2xl border border-[#e2e8f0] bg-white p-12 text-center">
        <p className="text-sm text-[#475569]">Zaloguj się, aby zobaczyć historię przejazdów.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-[1150px] mx-auto w-full">

      {/* Tytuł + taby */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-[#0f172a] text-[18px] font-semibold leading-snug shrink-0">Historia przejazdów</h1>

        <div className="flex items-center gap-5 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 text-[14px] whitespace-nowrap transition-colors ${
                  isActive
                    ? "font-semibold text-[#0f172a]"
                    : "font-medium text-[#94a3b8] hover:text-[#475569]"
                }`}
              >
                {tab.label}
                <span className={`text-[14px] font-semibold ${isActive ? "text-[#0f172a]" : "text-[#94a3b8]"}`}>
                  {tabCounts[tab.key]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista przejazdów */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-[#e2e8f0] rounded-2xl py-12 text-center">
          <p className="text-[13px] text-[#94a3b8]">Brak przejazdów w tej kategorii</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((offer) => {
            const req = offer.request;
            const route = req ? parseRoute(req.route) : null;
            const origin = route?.origin.address.split(",")[0] ?? "—";
            const destination = route?.destination.address.split(",")[0] ?? "—";
            const wpCount = route?.waypoints?.length ?? 0;
            const distanceKm = route?.distanceKm ?? null;
            const totalPassengers = req ? (req.adults + (req.children ?? 0)) : 0;
            const vehicle = offer.vehicleId ? vehicleMap.get(offer.vehicleId) : undefined;
            const isPast = isPastDate(req?.date ?? "");

            return (
              <div
                key={offer.id}
                className="bg-white border border-[#e2e8f0] rounded-2xl px-4 py-3 flex items-center gap-4 hover:border-[#cbd5e1] transition-colors"
              >
                {/* Lewa: road indicator + miasta */}
                <div className="flex items-center gap-2 shrink-0 w-[130px]">
                  <div className="flex flex-col items-center self-stretch justify-center shrink-0">
                    <div className="w-[7px] h-[7px] rounded-full bg-[#0f172a] border-2 border-[#0f172a]" />
                    <div className="w-px flex-1 bg-[#0f172a] my-[3px]" />
                    <div className="w-[7px] h-[7px] rounded-full border-2 border-[#0f172a]" />
                  </div>
                  <div className="flex flex-col gap-[2px] min-w-0">
                    <p className="text-[#0f172a] text-[14px] font-medium leading-snug truncate">{origin}</p>
                    <p className="text-[#0f172a] text-[14px] font-medium leading-snug truncate">{destination}</p>
                  </div>
                </div>

                {/* Środek: data + tagi */}
                <div className="flex-1 flex items-center gap-2 flex-wrap min-w-0">

                  {/* Data */}
                  {req?.date && (
                    <span className="flex items-center gap-1 text-[12px] font-medium text-[#475569] shrink-0">
                      <svg className="w-[13px] h-[13px] shrink-0" viewBox="0 0 14 14" fill="none">
                        <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="#475569" strokeWidth="1.2"/>
                        <path d="M1.5 5.5h11M4.5 1v3M9.5 1v3" stroke="#475569" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      {formatDate(req.date)}{req.time ? `, ${req.time}` : ""}
                    </span>
                  )}

                  {/* Przystanki */}
                  <span className="flex items-center gap-1 bg-[#f1f5f9] px-2 py-0.5 rounded text-[12px] font-medium text-[#475569] shrink-0">
                    <svg className="w-3 h-3 text-[#475569]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 14 14">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 4.5c0-.828.672-1.5 1.5-1.5s1.5.672 1.5 1.5S4.328 6 3.5 6 2 5.328 2 4.5zm0 0h1M5 4.5h7M9 9.5c0 .828.672 1.5 1.5 1.5S12 10.328 12 9.5 11.328 8 10.5 8 9 8.672 9 9.5zm0 0h-7" />
                    </svg>
                    {getWaypointsLabel(wpCount)}
                  </span>

                  {/* Dystans */}
                  {distanceKm && (
                    <span className="flex items-center gap-1 bg-[#f1f5f9] px-2 py-0.5 rounded text-[12px] font-medium text-[#475569] shrink-0">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 12 12">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M1 6h10M7.5 3l3 3-3 3"/>
                      </svg>
                      {distanceKm} km
                    </span>
                  )}

                  {/* Pasażerowie */}
                  {totalPassengers > 0 && (
                    <span className="flex items-center gap-1 bg-[#f1f5f9] px-2 py-0.5 rounded text-[12px] font-medium text-[#475569] shrink-0">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 12 12">
                        <circle cx="6" cy="3.5" r="2"/>
                        <path strokeLinecap="round" d="M1.5 11c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5"/>
                      </svg>
                      {totalPassengers} os.
                    </span>
                  )}

                  {/* Pojazd */}
                  {vehicle && (
                    <span className="text-[12px] font-medium text-[#94a3b8] truncate shrink-0 max-w-[180px]">
                      {vehicle.name} · {vehicle.licensePlate}
                    </span>
                  )}
                </div>

                {/* Prawa: cena + status */}
                <div className="shrink-0 flex items-center gap-3">
                  {offer.price > 0 && (
                    <span className="text-[14px] font-semibold text-[#0f172a]">
                      {offer.price.toLocaleString("pl-PL")} zł
                    </span>
                  )}
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-medium ${isPast ? "bg-[#f1f5f9] text-[#475569]" : "bg-[#e6f6ec] text-[#01a83d]"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isPast ? "bg-[#94a3b8]" : "bg-[#01a83d]"}`} />
                    {isPast ? "Zrealizowany" : "Opłacony"}
                  </span>
                </div>
              </div>
            );
          })}

          <p className="text-[12px] text-[#94a3b8] text-center py-2">
            Wyświetlono {filtered.length} {filtered.length === 1 ? "przejazd" : filtered.length < 5 ? "przejazdy" : "przejazdów"}
          </p>
        </div>
      )}
    </div>
  );
}
