import { useSession } from "next-auth/react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import type { RequestData, Vehicle, Route } from "@/models";
import { optionLabels, getRouteDisplay, vehicleTypeLabels, parseRoute } from "@/models";
import AllRoutesMap from "@/components/AllRoutesMap";
import LocationFilter, { calculateDistance } from "@/components/LocationFilter";
import { PageTitle, PageSubtitle } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function ZleceniaPage() {
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

    if (!price) {
      setError("Podaj cene");
      return;
    }

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
        setError(data.error || "Blad podczas skladania oferty");
        return;
      }

      setSelectedRequest(null);
      setPrice("");
      setMessage("");
      setSelectedVehicle("");
      fetchRequests();
    } catch {
      setError("Blad podczas skladania oferty");
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  const parseOptions = (optionsStr: string) => {
    try {
      const opts = JSON.parse(optionsStr);
      const active = Object.entries(opts)
        .filter(([, v]) => v)
        .map(([k]) => optionLabels[k as keyof typeof optionLabels] || k);
      return active.length > 0 ? active.join(", ") : "Brak";
    } catch {
      return "Brak";
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "przed chwila";
    if (diffMin < 60) return `${diffMin} min temu`;
    if (diffHours < 24) return `${diffHours} godz. temu`;
    if (diffDays === 1) return "wczoraj";
    if (diffDays < 7) return `${diffDays} dni temu`;
    return date.toLocaleDateString("pl-PL");
  };

  const handleLocationFilterChange = useCallback((filter: { lat: number; lng: number; radius: number } | null) => {
    setLocationFilter(filter);
  }, []);

  const filteredRequests = useMemo(() => {
    if (!locationFilter) return requests;

    return requests.filter((request) => {
      const route = parseRoute(request.route);
      if (!route?.origin?.lat || !route?.origin?.lng) return true;

      const distance = calculateDistance(
        locationFilter.lat,
        locationFilter.lng,
        route.origin.lat,
        route.origin.lng
      );

      return distance <= locationFilter.radius;
    });
  }, [requests, locationFilter]);

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
      <Card className="p-12 text-center">
        <h1 className="text-title-lg font-bold text-white/90 mb-4">Zlecenia</h1>
        <p className="text-gray-400">Zaloguj sie, aby zobaczyc dostepne zlecenia.</p>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <PageTitle>Dostepne zlecenia</PageTitle>
          <Badge color="brand" size="md">{filteredRequests.length}</Badge>
        </div>
        <PageSubtitle>Ponizej znajdziesz zlecenia na ktore mozesz zlozyc oferte.</PageSubtitle>
      </div>

      <LocationFilter onFilterChange={handleLocationFilterChange} />

      {filteredRequests.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-400">
            {requests.length === 0
              ? "Brak dostepnych zlecen. Zlozyles juz oferty na wszystkie aktywne zlecenia lub nie ma nowych."
              : "Brak zlecen w wybranym obszarze. Zwieksz promien lub wyczysc filtr, aby zobaczyc wszystkie zlecenia."}
          </p>
        </Card>
      ) : (
        <div className="flex gap-5">
          {/* Lewa kolumna - lista zlecen */}
          <div className="w-[40%] flex-shrink-0 flex flex-col gap-3 max-h-[calc(100vh-150px)] overflow-y-auto custom-scrollbar pr-1">
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
                  className={`rounded-xl p-5 cursor-pointer transition-all border ${
                    isSelected
                      ? "border-brand-500 bg-brand-500/5 shadow-theme-md"
                      : "border-gray-700/60 bg-gray-800/50 hover:border-gray-600"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-base font-semibold text-white">
                        {getRouteDisplay(request.route)}
                      </p>
                      <p className="text-theme-sm text-gray-400 mt-1.5">
                        {request.date} o {request.time}
                      </p>
                      <p className="text-theme-sm text-gray-400">
                        {request.adults} doroslych{request.children > 0 && `, ${request.children} dzieci`}
                      </p>
                      <p className="text-theme-sm text-gray-400">
                        Opcje: {parseOptions(request.options)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-theme-xs text-gray-500">
                        {formatTimeAgo(request.createdAt)}
                      </span>
                      {isSelected && (
                        <Badge color="brand">Wybrane</Badge>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-4 p-4 bg-gray-900/60 rounded-lg border border-gray-700/50" onClick={(e) => e.stopPropagation()}>
                      <h3 className="font-semibold text-white mb-3">Zloz oferte</h3>
                      {error && (
                        <p className="text-error-400 text-theme-sm mb-3">{error}</p>
                      )}
                      <div className="flex flex-col gap-3">
                        <div>
                          <label className="block text-theme-xs text-gray-400 mb-1.5">Wybierz pojazd</label>
                          {vehicles.length > 0 ? (
                            <select
                              value={selectedVehicle}
                              onChange={(e) => setSelectedVehicle(e.target.value)}
                              className="w-full border border-gray-700 rounded-lg p-3 text-theme-sm bg-gray-800 text-white focus:border-brand-500"
                            >
                              <option value="">-- Bez przypisanego pojazdu --</option>
                              {vehicles.map((vehicle) => (
                                <option key={vehicle.id} value={vehicle.id}>
                                  {vehicle.name} ({vehicleTypeLabels[vehicle.type]}, {vehicle.seats} miejsc)
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="p-3 bg-warning-500/10 border border-warning-500/20 rounded-lg">
                              <p className="text-theme-sm text-warning-400">
                                Nie masz zadnych pojazdow w flocie.{" "}
                                <Link href="/my-fleet" className="underline font-medium text-warning-300">
                                  Dodaj pojazd
                                </Link>
                                , aby moc go dolaczac do ofert.
                              </p>
                            </div>
                          )}
                        </div>

                        {selectedVehicle && (
                          <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-lg">
                            {(() => {
                              const vehicle = vehicles.find(v => v.id === selectedVehicle);
                              if (!vehicle) return null;
                              return (
                                <div className="flex gap-3">
                                  {vehicle.photos && vehicle.photos.length > 0 ? (
                                    <img
                                      src={vehicle.photos[0]}
                                      alt={vehicle.name}
                                      className="w-16 h-16 rounded-lg object-cover"
                                    />
                                  ) : (
                                    <div className="w-16 h-16 rounded-lg bg-brand-500/15 flex items-center justify-center">
                                      <svg className="w-6 h-6 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                      </svg>
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <p className="font-medium text-white">{vehicle.name}</p>
                                    <p className="text-theme-sm text-gray-400">
                                      {vehicle.brand} {vehicle.model} | {vehicle.seats} miejsc
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {vehicle.hasWifi && <span className="text-theme-xs bg-brand-500/15 text-brand-400 px-1.5 py-0.5 rounded">WiFi</span>}
                                      {vehicle.hasWC && <span className="text-theme-xs bg-brand-500/15 text-brand-400 px-1.5 py-0.5 rounded">WC</span>}
                                      {vehicle.hasTV && <span className="text-theme-xs bg-brand-500/15 text-brand-400 px-1.5 py-0.5 rounded">TV</span>}
                                      {vehicle.hasAirConditioning && <span className="text-theme-xs bg-brand-500/15 text-brand-400 px-1.5 py-0.5 rounded">Klima</span>}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        <input
                          type="number"
                          placeholder="Cena (PLN)"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="border border-gray-700 rounded-lg p-3 text-theme-sm bg-gray-800 text-white placeholder-gray-500 focus:border-brand-500"
                          min="0"
                          step="0.01"
                        />
                        <textarea
                          placeholder="Wiadomosc (opcjonalnie)"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="border border-gray-700 rounded-lg p-3 text-theme-sm bg-gray-800 text-white placeholder-gray-500 focus:border-brand-500 resize-none"
                          rows={3}
                        />
                        <button
                          onClick={() => handleSubmitOffer(request.id)}
                          disabled={submitting}
                          className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-3 rounded-lg text-theme-sm font-medium disabled:opacity-50 transition-colors"
                        >
                          {submitting ? "Wysylanie..." : "Wyslij oferte"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Prawa kolumna - mapa */}
          <div className="w-[60%]">
            <div className="rounded-xl border border-gray-700/60 bg-gray-800/50 p-4 sticky top-4 overflow-hidden">
              <AllRoutesMap
                routes={routesForMap}
                height="calc(100vh - 200px)"
                selectedRouteId={selectedRequest}
                onRouteClick={handleRouteClick}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
