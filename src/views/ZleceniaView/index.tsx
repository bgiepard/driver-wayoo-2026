import { useSession } from "next-auth/react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import type { RequestData, Vehicle, Route } from "@/models";
import { vehicleTypeLabels, parseRoute } from "@/models";
import AllRoutesMap from "@/components/AllRoutesMap";
import LocationFilter, { calculateDistance } from "@/components/LocationFilter";
import { formatTimeAgo } from "@/utils/formatTime";
import { calculateOfferCost } from "@/utils/offerCost";
import { usePoints } from "@/context/PointsContext";

// Ikony amenities
const IconWifi = () => (
  <svg className="w-3.5 h-3.5 text-[#475569]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
  </svg>
);
const IconWC = () => (
  <svg className="w-3.5 h-3.5 text-[#475569]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
  </svg>
);
const IconTV = () => (
  <svg className="w-3.5 h-3.5 text-[#475569]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z" />
  </svg>
);
const IconKlima = () => (
  <svg className="w-3.5 h-3.5 text-[#475569]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);
const IconGniazdko = () => (
  <svg className="w-3.5 h-3.5 text-[#475569]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);
const IconCalendar = () => (
  <svg className="w-3.5 h-3.5 text-[#475569]" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 14 14">
    <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" strokeWidth="1.2"/>
    <path d="M1.5 5.5h11M4.5 1v3M9.5 1v3" strokeLinecap="round"/>
  </svg>
);
const IconRoute = () => (
  <svg className="w-3.5 h-3.5 text-[#475569]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 14 14">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2 4.5c0-.828.672-1.5 1.5-1.5s1.5.672 1.5 1.5S4.328 6 3.5 6 2 5.328 2 4.5zm0 0h1M5 4.5h7M9 9.5c0 .828.672 1.5 1.5 1.5S12 10.328 12 9.5 11.328 8 10.5 8 9 8.672 9 9.5zm0 0h-7" />
  </svg>
);
const IconDistance = () => (
  <svg className="w-3 h-3 text-[#475569]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 12 12">
    <path strokeLinecap="round" strokeLinejoin="round" d="M1 6h10M7.5 3l3 3-3 3"/>
  </svg>
);
const IconPerson = () => (
  <svg className="w-3 h-3 text-[#475569]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 12 12">
    <circle cx="6" cy="3.5" r="2"/>
    <path strokeLinecap="round" d="M1.5 11c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5"/>
  </svg>
);

function formatDate(date: string, time: string): string {
  if (!date) return "";
  const [year, month, day] = date.split("-");
  const monthShort = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
  const m = parseInt(month, 10) - 1;
  return `${parseInt(day, 10)} ${monthShort[m]} ${year}, ${time}`;
}

function getWaypointsLabel(count: number): string {
  if (count === 0) return "Bez przystanków";
  if (count === 1) return "1 przystanek";
  if (count < 5) return `${count} przystanki`;
  return `${count} przystanków`;
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <IconWifi />,
  wc: <IconWC />,
  tv: <IconTV />,
  airConditioning: <IconKlima />,
  powerOutlet: <IconGniazdko />,
};

interface OfferSuccessData {
  request: RequestData;
  price: string;
  message: string;
  vehicleName: string;
  passengerContact: { name: string | null; phone: string | null; email: string | null };
  offerCost: number;
  pointsRemaining: number;
}

export default function ZleceniaView() {
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [offerSuccess, setOfferSuccess] = useState<OfferSuccessData | null>(null);
  const isSubmittingRef = useRef(false);
  const { points, refreshPoints } = usePoints();
  const [locationFilter, setLocationFilter] = useState<{ lat: number; lng: number; radius: number } | null>(null);
  const [minPassengers, setMinPassengers] = useState<number | "">("");
  const [maxPassengers, setMaxPassengers] = useState<number | "">("");
  const [optionFilters, setOptionFilters] = useState({ wifi: true, wc: true, tv: true, airConditioning: true, powerOutlet: true });
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (session) {
      fetchRequests();
      fetchVehicles();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/requests");
      const data = await res.json();
      setRequests(data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await fetch("/api/vehicles");
      const data = await res.json();
      setVehicles(data.filter((v: Vehicle) => v.isActive));
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };

  const handleSubmitOffer = async (requestId: string) => {
    if (isSubmittingRef.current) return;
    if (!price) { setError("Podaj cenę"); return; }

    isSubmittingRef.current = true;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          price: parseFloat(price),
          message,
          vehicleId: selectedVehicle || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === "insufficient_points") {
          setError(`Nie masz wystarczającej liczby punktów. Potrzebujesz więcej punktów, aby złożyć tę ofertę.`);
        } else {
          setError(data.error || "Błąd podczas składania oferty");
        }
        return;
      }

      const request = requests.find((r) => r.id === requestId)!;
      const vehicle = vehicles.find((v) => v.id === selectedVehicle);
      const route = parseRoute(request.route);
      const totalPassengers = request.adults + (request.children ?? 0);
      const distanceKm = route?.distanceKm ?? null;
      const offerCost = calculateOfferCost(totalPassengers, distanceKm);

      setOfferSuccess({
        request,
        price,
        message,
        vehicleName: vehicle ? `${vehicle.name} (${vehicle.brand} ${vehicle.model})` : "",
        passengerContact: data.passengerContact ?? { name: null, phone: null, email: null },
        offerCost,
        pointsRemaining: data.pointsRemaining ?? 0,
      });

      await refreshPoints();
      setSelectedRequest(null);
      setPrice("");
      setMessage("");
      setSelectedVehicle("");
      fetchRequests();
    } catch {
      setError("Błąd podczas składania oferty");
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleLocationFilterChange = useCallback((filter: { lat: number; lng: number; radius: number } | null) => {
    setLocationFilter(filter);
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      if (searchQuery.trim()) {
        const route = parseRoute(request.route);
        const origin = route?.origin.address ?? "";
        const destination = route?.destination.address ?? "";
        const q = searchQuery.toLowerCase();
        if (!origin.toLowerCase().includes(q) && !destination.toLowerCase().includes(q) && !request.id.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (locationFilter) {
        const route = parseRoute(request.route);
        if (route?.origin?.lat && route?.origin?.lng) {
          const distance = calculateDistance(locationFilter.lat, locationFilter.lng, route.origin.lat, route.origin.lng);
          if (distance > locationFilter.radius) return false;
        }
      }
      const total = request.adults + (request.children ?? 0);
      if (minPassengers !== "" && total < minPassengers) return false;
      if (maxPassengers !== "" && total > maxPassengers) return false;
      try {
        const opts = JSON.parse(request.options);
        if (!optionFilters.wifi && opts.wifi) return false;
        if (!optionFilters.wc && opts.wc) return false;
        if (!optionFilters.tv && opts.tv) return false;
        if (!optionFilters.airConditioning && opts.airConditioning) return false;
        if (!optionFilters.powerOutlet && opts.powerOutlet) return false;
      } catch { /* ignoruj błąd parsowania */ }
      return true;
    });
  }, [requests, locationFilter, minPassengers, maxPassengers, optionFilters, searchQuery]);

  const routesForMap = useMemo(() => {
    return filteredRequests
      .map((request) => {
        const route = parseRoute(request.route);
        if (!route) return null;
        return { id: request.id, route };
      })
      .filter((r): r is { id: string; route: Route } => r !== null);
  }, [filteredRequests]);

  const handleRouteClick = (requestId: string) => {
    const element = document.getElementById(`request-${requestId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      setSelectedRequest(requestId);
    }
  };

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
        <p className="text-sm text-[#475569]">Zaloguj się, aby zobaczyć dostępne zlecenia.</p>
      </div>
    );
  }

  return (
    <>
    <div className="flex flex-col gap-4 max-w-[1150px] mx-auto w-full">

      {/* Tytuł */}
      <h1 className="text-[#0f172a] text-[18px] font-semibold leading-snug">Dostępne zlecenia</h1>

      {/* Toggle Lista / Mapa — tylko mobile */}
      <div className="md:hidden flex bg-[#f1f5f9] border border-[#e2e8f0] rounded-lg overflow-hidden shrink-0">
        <button
          onClick={() => setMobileView("list")}
          className={`flex-1 flex items-center justify-center px-4 py-2 text-[14px] font-medium transition-colors ${
            mobileView === "list" ? "bg-white border border-[#e2e8f0] text-[#0f172a]" : "text-[#94a3b8]"
          }`}
        >
          Lista
        </button>
        <button
          onClick={() => setMobileView("map")}
          className={`flex-1 flex items-center justify-center px-4 py-2 text-[14px] font-medium transition-colors ${
            mobileView === "map" ? "bg-white border border-[#e2e8f0] text-[#0f172a]" : "text-[#94a3b8]"
          }`}
        >
          Mapa
        </button>
      </div>

      {/* Główny layout */}
      <div className="flex gap-4 items-start">

        {/* Lewa kolumna — search + lista */}
        <div className={`flex flex-col gap-3 w-full md:w-[46%] shrink-0 ${mobileView === "map" ? "hidden md:flex" : "flex"}`}>

          {/* Wyszukiwanie + Filtry */}
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white border border-[#e2e8f0] rounded-lg px-3 py-2">
              <svg className="w-5 h-5 text-[#94a3b8] shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Szukaj trasy, pojazdu, ID..."
                className="flex-1 text-[14px] text-[#0f172a] placeholder-[#94a3b8] bg-transparent outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-[#94a3b8] hover:text-[#475569]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-2 bg-white border rounded-lg px-3 py-2 text-[14px] font-semibold transition-colors shrink-0 ${showFilters ? "border-[#0b298f] text-[#0b298f]" : "border-[#e2e8f0] text-[#475569]"}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              Filtry
            </button>
          </div>

          {/* Panel filtrów */}
          {showFilters && (
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 flex flex-col gap-4">
              {/* Lokalizacja */}
              <div>
                <p className="text-[12px] font-semibold text-[#475569] mb-2 uppercase tracking-wide">Lokalizacja</p>
                <LocationFilter onFilterChange={handleLocationFilterChange} />
              </div>

              {/* Liczba osób */}
              <div>
                <p className="text-[12px] font-semibold text-[#475569] mb-2 uppercase tracking-wide">Liczba pasażerów</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min={1} placeholder="min"
                    value={minPassengers}
                    onChange={(e) => setMinPassengers(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-20 border border-[#e2e8f0] rounded-lg px-3 py-2 text-[14px] text-[#0f172a] placeholder-[#94a3b8] outline-none focus:border-[#0b298f]"
                  />
                  <span className="text-[#94a3b8]">—</span>
                  <input
                    type="number" min={1} placeholder="max"
                    value={maxPassengers}
                    onChange={(e) => setMaxPassengers(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-20 border border-[#e2e8f0] rounded-lg px-3 py-2 text-[14px] text-[#0f172a] placeholder-[#94a3b8] outline-none focus:border-[#0b298f]"
                  />
                  {(minPassengers !== "" || maxPassengers !== "") && (
                    <button onClick={() => { setMinPassengers(""); setMaxPassengers(""); }} className="text-[#94a3b8] hover:text-[#475569] text-[12px]">
                      Wyczyść
                    </button>
                  )}
                </div>
              </div>

              {/* Opcje dodatkowe */}
              <div>
                <p className="text-[12px] font-semibold text-[#475569] mb-2 uppercase tracking-wide">Wymagania pasażera</p>
                <div className="flex flex-wrap gap-2">
                  {([
                    { key: "wifi", label: "WiFi" },
                    { key: "wc", label: "WC" },
                    { key: "tv", label: "TV" },
                    { key: "airConditioning", label: "Klimatyzacja" },
                    { key: "powerOutlet", label: "Gniazdko" },
                  ] as const).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setOptionFilters(prev => ({ ...prev, [key]: !prev[key] }))}
                      className={`text-[13px] font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                        optionFilters[key]
                          ? "bg-[#e0e7ff] text-[#0b298f] border-[#c7d2fe]"
                          : "bg-[#f1f5f9] text-[#94a3b8] border-[#e2e8f0]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pusta lista */}
          {filteredRequests.length === 0 && (
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-16 text-center">
              <p className="text-[14px] font-medium text-[#0f172a] mb-1">
                {requests.length === 0 ? "Brak dostępnych zleceń" : "Brak zleceń pasujących do filtrów"}
              </p>
              <p className="text-[13px] text-[#475569]">
                {requests.length === 0
                  ? "Złożyłeś już oferty na wszystkie aktywne zlecenia lub nie ma nowych."
                  : "Zmień kryteria wyszukiwania lub wyczyść filtry."}
              </p>
            </div>
          )}

          {/* Lista zleceń */}
          <div className="flex flex-col gap-2 max-h-[calc(100vh-260px)] overflow-y-auto pr-0.5">
            {filteredRequests.map((request) => {
              const isSelected = selectedRequest === request.id;
              const route = parseRoute(request.route);
              const origin = route?.origin.address.split(",")[0] ?? "—";
              const destination = route?.destination.address.split(",")[0] ?? "—";
              const wpCount = route?.waypoints?.length ?? 0;
              const distanceKm = route?.distanceKm ?? null;
              const totalPassengers = request.adults + (request.children ?? 0);
              const offerCost = calculateOfferCost(totalPassengers, distanceKm);
              const canAfford = points === null || points >= offerCost;

              let amenities: string[] = [];
              try {
                const opts = JSON.parse(request.options);
                amenities = Object.entries(opts).filter(([, v]) => v).map(([k]) => k);
              } catch { /* ignoruj */ }

              return (
                <div
                  key={request.id}
                  id={`request-${request.id}`}
                  className={`bg-white border rounded-2xl cursor-pointer transition-all ${
                    isSelected ? "border-[#0b298f]" : "border-[#e2e8f0] hover:border-[#cbd5e1]"
                  }`}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedRequest(null);
                      setPrice("");
                      setMessage("");
                      setSelectedVehicle("");
                      setError("");
                    } else {
                      setSelectedRequest(request.id);
                      setError("");
                    }
                  }}
                >
                  <div className="p-3 flex flex-col gap-2">
                    {/* Wiersz 1: trasa + info o ogłoszeniu */}
                    <div className="flex gap-2 items-start">
                      {/* Lewa: wskaźnik drogi + trasa */}
                      <div className="flex gap-2 items-start flex-1 min-w-0">
                        {/* Road indicator */}
                        <div className="flex flex-col items-center justify-center self-stretch shrink-0 mt-0.5">
                          <div className="w-[7px] h-[7px] rounded-full bg-[#0f172a] border-2 border-[#0f172a] shrink-0" />
                          <div className="w-px flex-1 bg-[#0f172a] my-[3px]" />
                          <div className="w-[7px] h-[7px] rounded-full border-2 border-[#0f172a] shrink-0" />
                        </div>
                        {/* Tekst: origin + destination */}
                        <div className="flex flex-col gap-[2px] min-w-0">
                          <p className="text-[#0f172a] text-[14px] font-medium leading-snug truncate">{origin}</p>
                          <p className="text-[#0f172a] text-[14px] font-medium leading-snug truncate">{destination}</p>
                        </div>
                      </div>

                      {/* Prawa: dodano X temu · ważne do DD.MM.YYYY */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[11px] text-[#94a3b8] whitespace-nowrap">
                          {formatTimeAgo(request.createdAt)}
                        </span>
                        {request.offerExpiresAt && (() => {
                          const d = new Date(request.offerExpiresAt);
                          if (isNaN(d.getTime())) return null;
                          const isPastDate = d < new Date();
                          const formatted = d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" })
                            + ", " + d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
                          return (
                            <span className={`flex items-center gap-1 text-[11px] whitespace-nowrap ${isPastDate ? "text-[#de2b3b]" : "text-[#94a3b8]"}`}>
                              ·
                              <IconCalendar />
                              {formatted}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Wiersz 2: tagi + amenities po prawej */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1 bg-[#f1f5f9] px-2 py-1 rounded text-[12px] font-medium text-[#475569]">
                        <IconRoute />
                        {getWaypointsLabel(wpCount)}
                      </span>
                      {distanceKm && (
                        <span className="flex items-center gap-1 bg-[#f1f5f9] px-2 py-1 rounded text-[12px] font-medium text-[#475569]">
                          <IconDistance />
                          {distanceKm} km
                        </span>
                      )}
                      <span className="flex items-center gap-1 bg-[#f1f5f9] px-2 py-1 rounded text-[12px] font-medium text-[#475569]">
                        <IconPerson />
                        {totalPassengers} os. ({request.adults}+{request.children ?? 0})
                      </span>
                      {/* Koszt oferty w punktach */}
                      <span className={`flex items-center gap-1 px-2 py-1 rounded text-[12px] font-semibold ${canAfford ? "bg-[#FFC428]/15 text-[#92650a]" : "bg-red-50 text-red-500"}`}>
                        <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 1l1.854 3.756L14 5.528l-3 2.924.708 4.131L8 10.5l-3.708 2.083L5 8.452 2 5.528l4.146-.772z"/>
                        </svg>
                        {offerCost} {offerCost === 1 ? "pkt" : "pkt"}
                      </span>
                      {amenities.length > 0 && (
                        <>
                          <div className="flex-1" />
                          {amenities.map((key) => AMENITY_ICONS[key] ? (
                            <div
                              key={key}
                              className="bg-[#f1f5f9] border border-[#e2e8f0] w-[26px] h-[26px] flex items-center justify-center rounded"
                              title={key}
                            >
                              {AMENITY_ICONS[key]}
                            </div>
                          ) : null)}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Formularz oferty */}
                  {isSelected && (
                    <div
                      className="mx-3 mb-3 p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h3 className="text-[14px] font-semibold text-[#0f172a] mb-3">Złóż ofertę</h3>
                      {error && (
                        <p className="text-[13px] text-[#de2b3b] mb-3 bg-[#fceaeb] border border-[#f9c7cb] rounded-lg px-3 py-2">{error}</p>
                      )}

                      <div className="flex flex-col gap-3">
                        {/* Wybór pojazdu */}
                        <div>
                          <label className="block text-[12px] font-medium text-[#475569] mb-1.5">Wybierz pojazd</label>
                          {vehicles.length > 0 ? (
                            <select
                              value={selectedVehicle}
                              onChange={(e) => setSelectedVehicle(e.target.value)}
                              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-[14px] bg-white text-[#0f172a] outline-none focus:border-[#0b298f]"
                            >
                              <option value="">— Bez przypisanego pojazdu —</option>
                              {vehicles.map((vehicle) => (
                                <option key={vehicle.id} value={vehicle.id}>
                                  {vehicle.name} ({vehicleTypeLabels[vehicle.type]}, {vehicle.seats} miejsc)
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="p-3 bg-[#fff9ea] border border-[#fde68a] rounded-lg">
                              <p className="text-[13px] text-[#b24900]">
                                Nie masz żadnych pojazdów w flocie.{" "}
                                <Link href="/moja-flota" className="underline font-medium">Dodaj pojazd</Link>
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Podgląd pojazdu */}
                        {selectedVehicle && (() => {
                          const vehicle = vehicles.find(v => v.id === selectedVehicle);
                          if (!vehicle) return null;
                          return (
                            <div className="p-3 bg-white border border-[#e2e8f0] rounded-lg flex gap-3">
                              {vehicle.photos && vehicle.photos.length > 0 ? (
                                <Image src={vehicle.photos[0]} alt={vehicle.name} width={56} height={56} className="rounded-lg object-cover shrink-0" />
                              ) : (
                                <div className="w-14 h-14 rounded-lg bg-[#e0e7ff] flex items-center justify-center shrink-0">
                                  <svg className="w-5 h-5 text-[#0b298f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                  </svg>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-medium text-[#0f172a]">{vehicle.name}</p>
                                <p className="text-[12px] text-[#475569] mt-0.5">{vehicle.brand} {vehicle.model} · {vehicle.seats} miejsc</p>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Cena */}
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="Cena"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-[14px] bg-white text-[#0f172a] placeholder-[#94a3b8] outline-none focus:border-[#0b298f] pr-14"
                            min="1"
                            step="0.01"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] font-medium text-[#94a3b8] pointer-events-none">PLN</span>
                        </div>

                        {/* Wiadomość */}
                        <textarea
                          placeholder="Wiadomość (opcjonalnie)"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-[14px] bg-white text-[#0f172a] placeholder-[#94a3b8] outline-none focus:border-[#0b298f] resize-none"
                          rows={3}
                        />

                        <button
                          onClick={() => handleSubmitOffer(request.id)}
                          disabled={submitting || !canAfford}
                          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[14px] font-semibold transition-colors disabled:opacity-50 ${
                            canAfford
                              ? "bg-[#0b298f] hover:bg-[#0a2070] text-white"
                              : "bg-red-100 text-red-500 cursor-not-allowed"
                          }`}
                        >
                          {submitting ? (
                            "Wysyłanie..."
                          ) : canAfford ? (
                            <>
                              Wyślij i odblokuj kontakt
                              <span className="flex items-center gap-1 bg-white/20 rounded px-1.5 py-0.5 text-[12px]">
                                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                                  <path d="M8 1l1.854 3.756L14 5.528l-3 2.924.708 4.131L8 10.5l-3.708 2.083L5 8.452 2 5.528l4.146-.772z"/>
                                </svg>
                                {offerCost}
                              </span>
                            </>
                          ) : (
                            "Za mało punktów"
                          )}
                        </button>
                        {!canAfford && (
                          <p className="text-[12px] text-red-500 text-center">
                            Potrzebujesz {offerCost} pkt, masz {points ?? 0}.{" "}
                            <a href="/punkty" className="underline font-medium">Kup punkty →</a>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>{/* koniec lewej kolumny */}

        {/* Prawa kolumna — mapa (desktop zawsze, mobile gdy mobileView==="map") */}
        <div className={`flex-1 min-w-0 ${mobileView === "list" ? "hidden md:block" : "block"}`}>
          <div className="rounded-2xl border border-[#e2e8f0] overflow-hidden sticky top-4">
            <AllRoutesMap
              routes={routesForMap}
              height="calc(100vh - 200px)"
              selectedRouteId={selectedRequest}
              onRouteClick={handleRouteClick}
            />
          </div>
        </div>

      </div>{/* koniec flex gap-4 */}
    </div>

    {/* Modal sukcesu po złożeniu oferty */}
    {offerSuccess && (() => {
      const route = parseRoute(offerSuccess.request.route);
      const origin = route?.origin.address.split(",")[0] ?? "—";
      const destination = route?.destination.address.split(",")[0] ?? "—";
      const { passengerContact } = offerSuccess;

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden">

            {/* Header */}
            <div className="bg-[#0b298f] px-6 py-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-[16px]">Oferta złożona!</p>
                <p className="text-white/70 text-[13px]">Dane kontaktowe pasażera odblokowane</p>
              </div>
            </div>

            <div className="px-6 py-5 flex flex-col gap-5">

              {/* Trasa */}
              <div className="flex flex-col gap-1">
                <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide">Trasa</p>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-medium text-[#0f172a]">{origin}</span>
                  <svg className="w-4 h-4 text-[#94a3b8] shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                  </svg>
                  <span className="text-[14px] font-medium text-[#0f172a]">{destination}</span>
                </div>
              </div>

              {/* Szczegóły oferty */}
              <div className="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-4 flex flex-col gap-2.5">
                <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide">Twoja oferta</p>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[#475569]">Cena</span>
                  <span className="text-[14px] font-semibold text-[#0f172a]">{offerSuccess.price} PLN</span>
                </div>
                {offerSuccess.vehicleName && (
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#475569]">Pojazd</span>
                    <span className="text-[13px] font-medium text-[#0f172a]">{offerSuccess.vehicleName}</span>
                  </div>
                )}
                {offerSuccess.message && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[13px] text-[#475569]">Wiadomość</span>
                    <span className="text-[13px] text-[#0f172a] italic">"{offerSuccess.message}"</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-[#e2e8f0]">
                  <span className="text-[13px] text-[#475569]">Koszt</span>
                  <span className="flex items-center gap-1 text-[13px] font-medium text-[#92650a]">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 1l1.854 3.756L14 5.528l-3 2.924.708 4.131L8 10.5l-3.708 2.083L5 8.452 2 5.528l4.146-.772z"/>
                    </svg>
                    -{offerSuccess.offerCost} pkt · zostało {offerSuccess.pointsRemaining} pkt
                  </span>
                </div>
              </div>

              {/* Dane kontaktowe pasażera */}
              <div className="flex flex-col gap-3">
                <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide">Dane kontaktowe pasażera</p>
                <div className="flex flex-col gap-2">
                  {passengerContact.name && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#e0e7ff] flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-[#0b298f]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                        </svg>
                      </div>
                      <span className="text-[14px] font-medium text-[#0f172a]">{passengerContact.name}</span>
                    </div>
                  )}
                  {passengerContact.phone && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#dcfce7] flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-[#16a34a]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                        </svg>
                      </div>
                      <a href={`tel:${passengerContact.phone}`} className="text-[14px] font-semibold text-[#16a34a] hover:underline">
                        {passengerContact.phone}
                      </a>
                    </div>
                  )}
                  {passengerContact.email && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#fef9c3] flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-[#ca8a04]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                      </div>
                      <a href={`mailto:${passengerContact.email}`} className="text-[14px] text-[#ca8a04] hover:underline break-all">
                        {passengerContact.email}
                      </a>
                    </div>
                  )}
                  {!passengerContact.name && !passengerContact.phone && !passengerContact.email && (
                    <p className="text-[13px] text-[#94a3b8]">Brak danych kontaktowych pasażera.</p>
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={() => setOfferSuccess(null)}
                className="flex-1 border border-[#e2e8f0] text-[#475569] hover:bg-[#f8fafc] text-[14px] font-semibold py-3 rounded-xl transition-colors"
              >
                Zamknij
              </button>
              <Link
                href="/moje-oferty"
                onClick={() => setOfferSuccess(null)}
                className="flex-1 bg-[#0b298f] hover:bg-[#0a2070] text-white text-[14px] font-semibold py-3 rounded-xl transition-colors text-center"
              >
                Moje oferty →
              </Link>
            </div>

          </div>
        </div>
      );
    })()}
    </>
  );
}
