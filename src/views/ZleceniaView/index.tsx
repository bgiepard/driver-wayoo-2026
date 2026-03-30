import { useSession } from "next-auth/react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import type { RequestData, Vehicle, Route } from "@/models";
import { vehicleTypeLabels, parseRoute } from "@/models";
import AllRoutesMap from "@/components/AllRoutesMap";
import LocationFilter, { calculateDistance } from "@/components/LocationFilter";
import { formatTimeAgo } from "@/utils/formatTime";

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
  const isSubmittingRef = useRef(false);
  const [locationFilter, setLocationFilter] = useState<{ lat: number; lng: number; radius: number } | null>(null);
  const [minPassengers, setMinPassengers] = useState<number | "">("");
  const [maxPassengers, setMaxPassengers] = useState<number | "">("");
  const [optionFilters, setOptionFilters] = useState({ wifi: true, wc: true, tv: true, airConditioning: true, powerOutlet: true });
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

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
      if (!res.ok) { setError(data.error || "Błąd podczas składania oferty"); return; }

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
  }, [requests, locationFilter, minPassengers, maxPassengers, optionFilters]);

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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-12 text-center">
        <p className="text-sm text-gray-500">Zaloguj się, aby zobaczyć dostępne zlecenia.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Nagłówek */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Marketplace</p>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Dostępne zlecenia
            {filteredRequests.length > 0 && (
              <span className="ml-2.5 text-sm font-medium text-brand-600 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-md align-middle">
                {filteredRequests.length}
              </span>
            )}
          </h1>
        </div>
        {/* Przełącznik lista/mapa — tylko mobile */}
        <div className="flex md:hidden items-center rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <button
            onClick={() => setMobileView("list")}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${mobileView === "list" ? "bg-brand-500 text-white" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            Lista
          </button>
          <button
            onClick={() => setMobileView("map")}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${mobileView === "map" ? "bg-brand-500 text-white" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
            Mapa
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-0.5 shrink-0">
        <LocationFilter onFilterChange={handleLocationFilterChange} />

        {/* Filtr: liczba osób */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white shadow-sm shrink-0">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <span className="hidden md:inline text-sm text-gray-600 shrink-0">Osoby</span>
          <input
            type="number"
            min={1}
            placeholder="min"
            value={minPassengers}
            onChange={(e) => setMinPassengers(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-10 text-sm text-gray-900 text-center bg-transparent outline-none placeholder-gray-300"
          />
          <span className="text-gray-300">—</span>
          <input
            type="number"
            min={1}
            placeholder="max"
            value={maxPassengers}
            onChange={(e) => setMaxPassengers(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-10 text-sm text-gray-900 text-center bg-transparent outline-none placeholder-gray-300"
          />
          {(minPassengers !== "" || maxPassengers !== "") && (
            <button onClick={() => { setMinPassengers(""); setMaxPassengers(""); }} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filtr: opcje dodatkowe */}
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white shadow-sm shrink-0">
          <svg className="w-4 h-4 text-gray-400 shrink-0 md:hidden" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          <span className="hidden md:inline text-sm text-gray-600 shrink-0 mr-1">Opcje</span>
          {([
            { key: "wifi", label: "WiFi" },
            { key: "wc", label: "WC" },
            { key: "tv", label: "TV" },
            { key: "airConditioning", label: "Klima" },
            { key: "powerOutlet", label: "Gniazdko" },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setOptionFilters(prev => ({ ...prev, [key]: !prev[key] }))}
              className={`text-xs font-medium px-2 py-0.5 rounded-md border transition-colors ${
                optionFilters[key]
                  ? "bg-brand-50 text-brand-700 border-brand-100"
                  : "bg-gray-100 text-gray-400 border-gray-200 line-through"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-16 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">
            {requests.length === 0 ? "Brak dostępnych zleceń" : "Brak zleceń w wybranym obszarze"}
          </p>
          <p className="text-xs text-gray-400">
            {requests.length === 0
              ? "Złożyłeś już oferty na wszystkie aktywne zlecenia lub nie ma nowych."
              : "Zwiększ promień lub wyczyść filtr, aby zobaczyć wszystkie zlecenia."}
          </p>
        </div>
      ) : (
        <div className="flex gap-5">

          {/* Lewa kolumna — lista zleceń */}
          <div className={`flex-shrink-0 flex flex-col gap-3 max-h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar pr-1 w-full md:w-[42%] ${mobileView === "map" ? "hidden md:flex" : "flex"}`}>
            {filteredRequests.map((request) => {
              const isSelected = selectedRequest === request.id;
              return (
                <div
                  key={request.id}
                  id={`request-${request.id}`}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedRequest(null);
                      setPrice("");
                      setMessage("");
                      setSelectedVehicle("");
                      setError("");
                    } else {
                      setSelectedRequest(request.id);
                    }
                  }}
                  className={`rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? "border-brand-300 bg-brand-50 shadow-sm"
                      : "border-gray-200 bg-white shadow-sm hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="p-4">
                    {/* Nagłówek: trasa (lewo) + data/godzina (prawo) */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        {(() => {
                          const route = parseRoute(request.route);
                          const origin = route?.origin.address.split(",")[0] ?? "—";
                          const dest = route?.destination.address.split(",")[0] ?? "—";
                          const wpCount = route?.waypoints.length ?? 0;
                          return (
                            <>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-semibold text-gray-900 truncate max-w-[110px]">{origin}</span>
                                <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                                <span className="text-sm font-semibold text-gray-900 truncate max-w-[110px]">{dest}</span>
                                {wpCount > 0 && (
                                  <span className="text-xs font-medium bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded shrink-0">
                                    +{wpCount} {wpCount === 1 ? "przystanek" : "przystanki"}
                                  </span>
                                )}
                                {route?.distanceKm && (
                                  <span className="text-xs font-medium bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded shrink-0">
                                    {route.distanceKm} km
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5 truncate">
                                {route?.origin.address} → {route?.destination.address}
                              </p>
                            </>
                          );
                        })()}
                      </div>

                      {/* Data + godzina */}
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-semibold text-gray-700">{request.date} · {request.time}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{(() => {
                          try {
                            const trip = new Date(request.date);
                            if (isNaN(trip.getTime())) return "";
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            trip.setHours(0, 0, 0, 0);
                            const diff = Math.round((trip.getTime() - today.getTime()) / 86400000);
                            if (diff < 0) return "minęło";
                            if (diff === 0) return "dzisiaj";
                            if (diff === 1) return "jutro";
                            if (diff < 7) return `za ${diff} dni`;
                            if (diff < 14) return "za tydzień";
                            return `za ${Math.round(diff / 7)} tyg.`;
                          } catch { return ""; }
                        })()}</p>
                      </div>
                    </div>

                    {/* Drugi rząd: pasażerowie + opcje + czas dodania */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        {request.adults + (request.children ?? 0)} os.
                        {request.children > 0 && <span className="text-gray-400 ml-0.5">({request.adults}+{request.children})</span>}
                      </span>
                      {(() => {
                        try {
                          const opts = JSON.parse(request.options);
                          const active = Object.entries(opts).filter(([, v]) => v).map(([k]) => k);
                          if (active.length === 0) return null;
                          const icons: Record<string, React.ReactNode> = {
                            wifi: <><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" /></>,
                            wc: <><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" /></>,
                            tv: <><path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z" /></>,
                            airConditioning: <><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></>,
                            powerOutlet: <><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></>,
                          };
                          const labels: Record<string, string> = { wifi: "WiFi", wc: "WC", tv: "TV", airConditioning: "Klima", powerOutlet: "Gniazdko" };
                          return active.map((k) => (
                            <span key={k} className="inline-flex items-center gap-1 text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100 px-2 py-0.5 rounded-md">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                {icons[k]}
                              </svg>
                              {labels[k] ?? k}
                            </span>
                          ));
                        } catch { return null; }
                      })()}
                      <span className="ml-auto flex items-center gap-2 shrink-0">
                        {request.offerExpiresAt && (() => {
                          const expiresAt = new Date(request.offerExpiresAt!);
                          const now = new Date();
                          const msLeft = expiresAt.getTime() - now.getTime();
                          const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
                          const dateLabel = expiresAt.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
                          if (daysLeft <= 0) {
                            return <span className="text-xs font-medium bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-md">Wygasło {dateLabel}</span>;
                          }
                          if (daysLeft <= 1) {
                            return <span className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-md">Ważne do {dateLabel}</span>;
                          }
                          return <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">Ważne do {dateLabel}</span>;
                        })()}
                        <span className="text-xs text-gray-400">dodano: {formatTimeAgo(request.createdAt)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Formularz oferty */}
                  {isSelected && (
                    <div
                      className="mx-4 mb-4 p-4 bg-white rounded-lg border border-gray-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Złóż ofertę</h3>
                      {error && <p className="text-xs text-red-600 mb-3 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>}

                      <div className="flex flex-col gap-3">

                        {/* Wybór pojazdu */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1.5">Wybierz pojazd</label>
                          {vehicles.length > 0 ? (
                            <select
                              value={selectedVehicle}
                              onChange={(e) => setSelectedVehicle(e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100"
                            >
                              <option value="">— Bez przypisanego pojazdu —</option>
                              {vehicles.map((vehicle) => (
                                <option key={vehicle.id} value={vehicle.id}>
                                  {vehicle.name} ({vehicleTypeLabels[vehicle.type]}, {vehicle.seats} miejsc)
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                              <p className="text-xs text-amber-700">
                                Nie masz żadnych pojazdów w flocie.{" "}
                                <Link href="/my-fleet" className="underline font-medium">Dodaj pojazd</Link>
                                , aby móc go dołączać do ofert.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Podgląd pojazdu */}
                        {selectedVehicle && (() => {
                          const vehicle = vehicles.find(v => v.id === selectedVehicle);
                          if (!vehicle) return null;
                          return (
                            <div className="p-3 bg-brand-50 border border-brand-100 rounded-lg flex gap-3">
                              {vehicle.photos && vehicle.photos.length > 0 ? (
                                <img src={vehicle.photos[0]} alt={vehicle.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                              ) : (
                                <div className="w-14 h-14 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
                                  <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                  </svg>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{vehicle.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{vehicle.brand} {vehicle.model} · {vehicle.seats} miejsc</p>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {vehicle.hasWifi && <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded">WiFi</span>}
                                  {vehicle.hasWC && <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded">WC</span>}
                                  {vehicle.hasTV && <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded">TV</span>}
                                  {vehicle.hasAirConditioning && <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded">Klima</span>}
                                </div>
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
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 pr-14"
                            min="0"
                            step="1"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 pointer-events-none">PLN</span>
                        </div>

                        {/* Wiadomość */}
                        <textarea
                          placeholder="Wiadomość (opcjonalnie)"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 resize-none"
                          rows={3}
                        />

                        <button
                          onClick={() => handleSubmitOffer(request.id)}
                          disabled={submitting}
                          className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                        >
                          {submitting ? "Wysyłanie..." : "Wyślij ofertę"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Prawa kolumna — mapa */}
          <div className={`flex-1 ${mobileView === "list" ? "hidden md:block" : "block"}`}>
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden sticky top-4">
              <AllRoutesMap
                routes={routesForMap}
                height="calc(100vh - 220px)"
                selectedRouteId={selectedRequest}
                onRouteClick={handleRouteClick}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
