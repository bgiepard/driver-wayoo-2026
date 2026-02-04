import { useSession } from "next-auth/react";
import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import type { RequestData, Vehicle, Route } from "@/models";
import { optionLabels, getRouteDisplay, vehicleTypeLabels, parseRoute } from "@/models";
import AllRoutesMap from "@/components/AllRoutesMap";

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

  const routesForMap = useMemo(() => {
    const allRoutes = requests
      .map((request) => {
        const route = parseRoute(request.route);
        if (!route) return null;
        return { id: request.id, route };
      })
      .filter((r): r is { id: string; route: Route } => r !== null);

    // If a request is selected, show only that route
    if (selectedRequest) {
      return allRoutes.filter((r) => r.id === selectedRequest);
    }

    return allRoutes;
  }, [requests, selectedRequest]);

  const handleRouteClick = (requestId: string) => {
    const element = document.getElementById(`request-${requestId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      setSelectedRequest(requestId);
    }
  };

  if (status === "loading" || loading) {
    return <p className="text-gray-500">Ladowanie...</p>;
  }

  if (!session) {
    return (
      <div className="bg-white rounded-lg p-12 text-center">
        <h1 className="text-2xl font-semibold mb-4">Zlecenia</h1>
        <p className="text-gray-500">Zaloguj sie, aby zobaczyc dostepne zlecenia.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Dostepne zlecenia</h1>
        <p className="text-gray-500">
          Ponizej znajdziesz zlecenia na ktore mozesz zlozyc oferte.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center text-gray-500">
          Brak dostepnych zlecen. Zlozyles juz oferty na wszystkie aktywne zlecenia lub nie ma nowych.
        </div>
      ) : (
        <div className="flex gap-4">
          {/* Left column - list of requests */}
          <div className="w-[40%] flex-shrink-0 flex flex-col gap-3 max-h-[calc(100vh-150px)] overflow-y-auto">
            {requests.map((request) => (
              <div
                key={request.id}
                id={`request-${request.id}`}
                onClick={() => {
                  if (selectedRequest === request.id) {
                    setSelectedRequest(null);
                    setPrice("");
                    setMessage("");
                    setSelectedVehicle("");
                    setError("");
                  } else {
                    setSelectedRequest(request.id);
                  }
                }}
                className={`bg-white rounded-lg p-5 cursor-pointer transition-all ${
                  selectedRequest === request.id
                    ? "border-2 border-green-500 shadow-md"
                    : "border-2 border-transparent hover:border-gray-200"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {getRouteDisplay(request.route)}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      {request.date} o {request.time}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {request.adults} doroslych{request.children > 0 && `, ${request.children} dzieci`}
                    </p>
                    <p className="text-gray-500 text-sm">
                      Opcje: {parseOptions(request.options)}
                    </p>
                  </div>
                  {selectedRequest === request.id && (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                      Wybrane
                    </span>
                  )}
                </div>

                {selectedRequest === request.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg" onClick={(e) => e.stopPropagation()}>
                    <h3 className="font-medium mb-3">Zloz oferte</h3>
                    {error && (
                      <p className="text-red-600 text-sm mb-3">{error}</p>
                    )}
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Wybierz pojazd</label>
                        {vehicles.length > 0 ? (
                          <select
                            value={selectedVehicle}
                            onChange={(e) => setSelectedVehicle(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-green-500 bg-white"
                          >
                            <option value="">-- Bez przypisanego pojazdu --</option>
                            {vehicles.map((vehicle) => (
                              <option key={vehicle.id} value={vehicle.id}>
                                {vehicle.name} ({vehicleTypeLabels[vehicle.type]}, {vehicle.seats} miejsc)
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-800">
                              Nie masz zadnych pojazdow w flocie.{" "}
                              <Link href="/my-fleet" className="underline font-medium">
                                Dodaj pojazd
                              </Link>
                              , aby moc go dolaczac do ofert.
                            </p>
                          </div>
                        )}
                      </div>

                      {selectedVehicle && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
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
                                  <div className="w-16 h-16 rounded-lg bg-emerald-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                  </div>
                                )}
                                <div className="flex-1">
                                  <p className="font-medium text-emerald-900">{vehicle.name}</p>
                                  <p className="text-sm text-emerald-700">
                                    {vehicle.brand} {vehicle.model} | {vehicle.seats} miejsc
                                  </p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {vehicle.hasWifi && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">WiFi</span>}
                                    {vehicle.hasWC && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">WC</span>}
                                    {vehicle.hasTV && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">TV</span>}
                                    {vehicle.hasAirConditioning && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Klima</span>}
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
                        className="border border-gray-200 rounded-lg p-3 text-sm focus:border-green-500"
                        min="0"
                        step="0.01"
                      />
                      <textarea
                        placeholder="Wiadomosc (opcjonalnie)"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="border border-gray-200 rounded-lg p-3 text-sm focus:border-green-500 resize-none"
                        rows={3}
                      />
                      <button
                        onClick={() => handleSubmitOffer(request.id)}
                        disabled={submitting}
                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                      >
                        {submitting ? "Wysylanie..." : "Wyslij oferte"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right column - map */}
          <div className="w-[60%]">
            <div className="bg-white rounded-lg p-4 sticky top-4">
              <AllRoutesMap
                key={selectedRequest || "all"}
                routes={routesForMap}
                height="calc(100vh - 200px)"
                onRouteClick={handleRouteClick}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
