import { useSession } from "next-auth/react";
import { useState } from "react";

/* ============================================
   TYPY
   ============================================ */

type TripStatus = "completed" | "cancelled";

interface Trip {
  id: string;
  date: string;         // YYYY-MM-DD
  time: string;         // HH:MM
  origin: string;
  destination: string;
  vehicle: string;
  distanceKm: number;
  durationMin: number;
  fuelConsumption: number; // l/100km
  status: TripStatus;
}

/* ============================================
   DANE TESTOWE
   ============================================ */

const MOCK_TRIPS: Trip[] = [
  {
    id: "TRIP-001",
    date: "2026-02-20",
    time: "08:30",
    origin: "Warszawa, Dworzec Centralny",
    destination: "Kraków, Rynek Główny",
    vehicle: "Mercedes-Benz Sprinter · WA 12345",
    distanceKm: 295,
    durationMin: 210,
    fuelConsumption: 12.5,
    status: "completed",
  },
  {
    id: "TRIP-002",
    date: "2026-02-18",
    time: "14:00",
    origin: "Gdańsk, Port Lotniczy",
    destination: "Sopot, ul. Bohaterów Monte Cassino",
    vehicle: "Volkswagen Crafter · GD 55678",
    distanceKm: 22,
    durationMin: 35,
    fuelConsumption: 10.2,
    status: "completed",
  },
  {
    id: "TRIP-003",
    date: "2026-02-15",
    time: "06:00",
    origin: "Wrocław, Dworzec Główny",
    destination: "Poznań, Stary Rynek",
    vehicle: "Mercedes-Benz Sprinter · WA 12345",
    distanceKm: 176,
    durationMin: 140,
    fuelConsumption: 12.5,
    status: "completed",
  },
  {
    id: "TRIP-004",
    date: "2026-02-12",
    time: "10:15",
    origin: "Łódź, Manufaktura",
    destination: "Warszawa, Lotnisko Chopina",
    vehicle: "Ford Transit · LD 98012",
    distanceKm: 135,
    durationMin: 100,
    fuelConsumption: 9.8,
    status: "cancelled",
  },
  {
    id: "TRIP-005",
    date: "2026-02-10",
    time: "16:45",
    origin: "Katowice, Centrum",
    destination: "Kraków, Port Lotniczy",
    vehicle: "Volkswagen Crafter · GD 55678",
    distanceKm: 78,
    durationMin: 65,
    fuelConsumption: 10.2,
    status: "completed",
  },
  {
    id: "TRIP-006",
    date: "2026-02-07",
    time: "09:00",
    origin: "Poznań, Lotnisko Ławica",
    destination: "Bydgoszcz, Dworzec PKP",
    vehicle: "Mercedes-Benz Sprinter · WA 12345",
    distanceKm: 98,
    durationMin: 80,
    fuelConsumption: 12.5,
    status: "completed",
  },
  {
    id: "TRIP-007",
    date: "2026-02-04",
    time: "20:30",
    origin: "Rzeszów, Rynek",
    destination: "Kraków, Kazimierz",
    vehicle: "Ford Transit · LD 98012",
    distanceKm: 160,
    durationMin: 125,
    fuelConsumption: 9.8,
    status: "completed",
  },
  {
    id: "TRIP-008",
    date: "2026-01-30",
    time: "07:00",
    origin: "Szczecin, Brama Portowa",
    destination: "Poznań, Malta",
    vehicle: "Volkswagen Crafter · GD 55678",
    distanceKm: 245,
    durationMin: 190,
    fuelConsumption: 10.2,
    status: "completed",
  },
  {
    id: "TRIP-009",
    date: "2026-01-25",
    time: "11:30",
    origin: "Toruń, Stare Miasto",
    destination: "Gdańsk, Długi Targ",
    vehicle: "Mercedes-Benz Sprinter · WA 12345",
    distanceKm: 147,
    durationMin: 115,
    fuelConsumption: 12.5,
    status: "cancelled",
  },
  {
    id: "TRIP-010",
    date: "2026-01-20",
    time: "13:00",
    origin: "Lublin, Krakowskie Przedmieście",
    destination: "Warszawa, Wilanów",
    vehicle: "Ford Transit · LD 98012",
    distanceKm: 170,
    durationMin: 135,
    fuelConsumption: 9.8,
    status: "completed",
  },
];

/* ============================================
   HELPERS
   ============================================ */

// Emisja CO2: diesel ~2.64 kg/l, benzyna ~2.31 kg/l — przyjmujemy diesel
const CO2_PER_LITER = 2.64;

function calcCo2(distanceKm: number, fuelConsumption: number): number {
  return (distanceKm / 100) * fuelConsumption * CO2_PER_LITER;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

const STATUS_CONFIG: Record<TripStatus, { label: string; className: string }> = {
  completed: {
    label: "Ukończony",
    className: "bg-brand-500/10 text-brand-400 border border-brand-500/20",
  },
  cancelled: {
    label: "Anulowany",
    className: "bg-error-500/10 text-error-400 border border-error-500/20",
  },
};

/* ============================================
   STRONA
   ============================================ */

export default function TripHistoryPage() {
  const { data: session, status } = useSession();
  const [statusFilter, setStatusFilter] = useState<TripStatus | "all">("all");
  const [search, setSearch] = useState("");

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500 text-sm">Zaloguj się, aby zobaczyć historię przejazdów.</p>
      </div>
    );
  }

  const filtered = MOCK_TRIPS.filter((trip) => {
    if (statusFilter !== "all" && trip.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        trip.origin.toLowerCase().includes(q) ||
        trip.destination.toLowerCase().includes(q) ||
        trip.vehicle.toLowerCase().includes(q) ||
        trip.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalDistance = filtered.filter(t => t.status === "completed").reduce((s, t) => s + t.distanceKm, 0);
  const totalCo2 = filtered.filter(t => t.status === "completed").reduce((s, t) => s + calcCo2(t.distanceKm, t.fuelConsumption), 0);
  const totalTrips = filtered.filter(t => t.status === "completed").length;

  return (
    <div className="max-w-[1100px] mx-auto">
      {/* Nagłówek */}
      <div className="mb-8">
        <p className="text-sm font-medium text-gray-500 mb-1">Przejazdy</p>
        <h1 className="text-2xl font-bold text-white tracking-tight">Historia przejazdów</h1>
      </div>

      {/* Metryki */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard
          label="Ukończone przejazdy"
          value={totalTrips}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="brand"
        />
        <SummaryCard
          label="Łączny dystans"
          value={`${totalDistance.toLocaleString("pl-PL")} km`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
          }
          color="info"
        />
        <SummaryCard
          label="Emisja CO₂"
          value={`${totalCo2.toFixed(1)} kg`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
          }
          color="warning"
        />
      </div>

      {/* Filtry */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj trasy, pojazdu, ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-white placeholder-gray-600 outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "completed", "cancelled"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                statusFilter === s
                  ? "bg-brand-500/15 text-brand-400 border border-brand-500/30"
                  : "border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              {s === "all" ? "Wszystkie" : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <svg className="w-10 h-10 mx-auto text-gray-700 mb-3" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-sm text-gray-500">Brak przejazdów spełniających kryteria</p>
          </div>
        ) : (
          <>
            {/* Nagłówek tabeli */}
            <div className="hidden md:grid grid-cols-[120px_1fr_160px_80px_80px_80px_110px] gap-4 px-5 py-3 border-b border-white/[0.05]">
              {["ID", "Trasa", "Pojazd", "Dystans", "Czas", "CO₂", "Status"].map((col) => (
                <span key={col} className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{col}</span>
              ))}
            </div>

            {/* Wiersze */}
            <div className="divide-y divide-white/[0.04]">
              {filtered.map((trip) => {
                const co2 = calcCo2(trip.distanceKm, trip.fuelConsumption);
                const cfg = STATUS_CONFIG[trip.status];
                return (
                  <div
                    key={trip.id}
                    className="grid md:grid-cols-[120px_1fr_160px_80px_80px_80px_110px] gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors items-center"
                  >
                    {/* ID + data */}
                    <div>
                      <p className="text-xs font-mono font-semibold text-brand-400">{trip.id}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatDate(trip.date)}</p>
                      <p className="text-xs text-gray-600">{trip.time}</p>
                    </div>

                    {/* Trasa */}
                    <div className="min-w-0">
                      <div className="flex items-start gap-2">
                        <div className="flex flex-col items-center shrink-0 mt-1">
                          <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                          <span className="w-px h-3 bg-white/10 my-0.5" />
                          <span className="w-2 h-2 rounded-full border-2 border-gray-500 shrink-0" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-white/90 truncate">{trip.origin}</p>
                          <p className="text-sm text-gray-400 truncate mt-1">{trip.destination}</p>
                        </div>
                      </div>
                    </div>

                    {/* Pojazd */}
                    <div className="min-w-0">
                      <p className="text-xs text-gray-300 truncate">{trip.vehicle}</p>
                      <p className="text-[11px] text-gray-600 mt-0.5">{trip.fuelConsumption} l/100km</p>
                    </div>

                    {/* Dystans */}
                    <div>
                      <p className="text-sm font-semibold text-white">{trip.distanceKm}</p>
                      <p className="text-[11px] text-gray-500">km</p>
                    </div>

                    {/* Czas */}
                    <div>
                      <p className="text-sm font-semibold text-white">{formatDuration(trip.durationMin)}</p>
                    </div>

                    {/* CO2 */}
                    <div>
                      {trip.status === "completed" ? (
                        <>
                          <p className="text-sm font-semibold text-warning-400">{co2.toFixed(1)}</p>
                          <p className="text-[11px] text-gray-500">kg CO₂</p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-600">—</p>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stopka */}
            <div className="px-5 py-3 border-t border-white/[0.05]">
              <p className="text-xs text-gray-600">
                Wyświetlono {filtered.length} z {MOCK_TRIPS.length} przejazdów
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ============================================
   SUMMARY CARD
   ============================================ */

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: "brand" | "info" | "warning";
}) {
  const iconColors = {
    brand: "bg-brand-500/10 text-brand-400",
    info: "bg-info-500/10 text-info-400",
    warning: "bg-warning-500/10 text-warning-400",
  };
  const valueColors = {
    brand: "text-brand-400",
    info: "text-info-400",
    warning: "text-warning-400",
  };

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${iconColors[color]}`}>
          {icon}
        </div>
      </div>
      <p className={`text-3xl font-bold tracking-tight ${valueColors[color]}`}>{value}</p>
    </div>
  );
}
