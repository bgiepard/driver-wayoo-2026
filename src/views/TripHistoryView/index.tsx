import { useSession } from "next-auth/react";
import { useState } from "react";

type TripStatus = "completed" | "cancelled";
type TabKey = "all" | TripStatus;

interface Trip {
  id: string;
  date: string;
  time: string;
  origin: string;
  destination: string;
  waypoints: number;
  vehicle: string;
  distanceKm: number;
  durationMin: number;
  passengers: number;
  status: TripStatus;
}

const MOCK_TRIPS: Trip[] = [
  { id: "TRIP-001", date: "2026-02-20", time: "08:30", origin: "Warszawa", destination: "Kraków", waypoints: 0, vehicle: "Mercedes-Benz Sprinter · WA 12345", distanceKm: 295, durationMin: 210, passengers: 4, status: "completed" },
  { id: "TRIP-002", date: "2026-02-18", time: "14:00", origin: "Gdańsk", destination: "Sopot", waypoints: 1, vehicle: "Volkswagen Crafter · GD 55678", distanceKm: 22, durationMin: 35, passengers: 2, status: "completed" },
  { id: "TRIP-003", date: "2026-02-15", time: "06:00", origin: "Wrocław", destination: "Poznań", waypoints: 0, vehicle: "Mercedes-Benz Sprinter · WA 12345", distanceKm: 176, durationMin: 140, passengers: 6, status: "completed" },
  { id: "TRIP-004", date: "2026-02-12", time: "10:15", origin: "Łódź", destination: "Warszawa", waypoints: 0, vehicle: "Ford Transit · LD 98012", distanceKm: 135, durationMin: 100, passengers: 3, status: "cancelled" },
  { id: "TRIP-005", date: "2026-02-10", time: "16:45", origin: "Katowice", destination: "Kraków", waypoints: 2, vehicle: "Volkswagen Crafter · GD 55678", distanceKm: 78, durationMin: 65, passengers: 5, status: "completed" },
  { id: "TRIP-006", date: "2026-02-07", time: "09:00", origin: "Poznań", destination: "Bydgoszcz", waypoints: 0, vehicle: "Mercedes-Benz Sprinter · WA 12345", distanceKm: 98, durationMin: 80, passengers: 4, status: "completed" },
  { id: "TRIP-007", date: "2026-02-04", time: "20:30", origin: "Rzeszów", destination: "Kraków", waypoints: 1, vehicle: "Ford Transit · LD 98012", distanceKm: 160, durationMin: 125, passengers: 3, status: "completed" },
  { id: "TRIP-008", date: "2026-01-30", time: "07:00", origin: "Szczecin", destination: "Poznań", waypoints: 0, vehicle: "Volkswagen Crafter · GD 55678", distanceKm: 245, durationMin: 190, passengers: 7, status: "completed" },
  { id: "TRIP-009", date: "2026-01-25", time: "11:30", origin: "Toruń", destination: "Gdańsk", waypoints: 0, vehicle: "Mercedes-Benz Sprinter · WA 12345", distanceKm: 147, durationMin: 115, passengers: 2, status: "cancelled" },
  { id: "TRIP-010", date: "2026-01-20", time: "13:00", origin: "Lublin", destination: "Warszawa", waypoints: 3, vehicle: "Ford Transit · LD 98012", distanceKm: 170, durationMin: 135, passengers: 5, status: "completed" },
];

const TABS: { key: TabKey; label: string }[] = [
  { key: "all",       label: "Wszystkie" },
  { key: "completed", label: "Ukończone" },
  { key: "cancelled", label: "Anulowane" },
];

const STATUS_CONFIG: Record<TripStatus, { label: string; bg: string; text: string; dot: string }> = {
  completed: { label: "Ukończony", bg: "bg-[#e6f6ec]", text: "text-[#01a83d]", dot: "bg-[#01a83d]" },
  cancelled: { label: "Anulowany", bg: "bg-[#f1f5f9]", text: "text-[#475569]", dot: "bg-[#94a3b8]" },
};

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  const monthNames = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
  return `${parseInt(d, 10)} ${monthNames[parseInt(m, 10) - 1]} ${y}`;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

function getWaypointsLabel(count: number): string {
  if (count === 0) return "Bez przystanków";
  if (count === 1) return "1 przystanek";
  if (count < 5) return `${count} przystanki`;
  return `${count} przystanków`;
}

export default function TripHistoryView() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  if (status === "loading") {
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

  const filtered = MOCK_TRIPS.filter((trip) =>
    activeTab === "all" ? true : trip.status === activeTab
  );

  const completedCount = MOCK_TRIPS.filter((t) => t.status === "completed").length;
  const cancelledCount = MOCK_TRIPS.filter((t) => t.status === "cancelled").length;
  const tabCounts: Partial<Record<TabKey, number>> = {
    all: MOCK_TRIPS.length,
    completed: completedCount,
    cancelled: cancelledCount,
  };

  return (
    <div className="flex flex-col gap-4 max-w-[1150px] mx-auto w-full">

      {/* Tytuł + taby */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-[#0f172a] text-[18px] font-semibold leading-snug shrink-0">Historia przejazdów</h1>

        <div className="flex items-center gap-5 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = tabCounts[tab.key];
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
                {count != null && (
                  <span className={`text-[14px] font-semibold ${isActive ? "text-[#0f172a]" : "text-[#94a3b8]"}`}>
                    {count}
                  </span>
                )}
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
          {filtered.map((trip) => {
            const s = STATUS_CONFIG[trip.status];
            return (
              <div
                key={trip.id}
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
                    <p className="text-[#0f172a] text-[14px] font-medium leading-snug truncate">{trip.origin}</p>
                    <p className="text-[#0f172a] text-[14px] font-medium leading-snug truncate">{trip.destination}</p>
                  </div>
                </div>

                {/* Środek: data + tagi */}
                <div className="flex-1 flex items-center gap-2 flex-wrap min-w-0">
                  {/* Data */}
                  <span className="flex items-center gap-1 text-[12px] font-medium text-[#475569] shrink-0">
                    <svg className="w-[13px] h-[13px] shrink-0" viewBox="0 0 14 14" fill="none">
                      <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="#475569" strokeWidth="1.2"/>
                      <path d="M1.5 5.5h11M4.5 1v3M9.5 1v3" stroke="#475569" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    {formatDate(trip.date)}, {trip.time}
                  </span>

                  {/* Przystanki */}
                  <span className="flex items-center gap-1 bg-[#f1f5f9] px-2 py-0.5 rounded text-[12px] font-medium text-[#475569] shrink-0">
                    <svg className="w-3 h-3 text-[#475569]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 14 14">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 4.5c0-.828.672-1.5 1.5-1.5s1.5.672 1.5 1.5S4.328 6 3.5 6 2 5.328 2 4.5zm0 0h1M5 4.5h7M9 9.5c0 .828.672 1.5 1.5 1.5S12 10.328 12 9.5 11.328 8 10.5 8 9 8.672 9 9.5zm0 0h-7" />
                    </svg>
                    {getWaypointsLabel(trip.waypoints)}
                  </span>

                  {/* Dystans */}
                  <span className="flex items-center gap-1 bg-[#f1f5f9] px-2 py-0.5 rounded text-[12px] font-medium text-[#475569] shrink-0">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 12 12">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M1 6h10M7.5 3l3 3-3 3"/>
                    </svg>
                    {trip.distanceKm} km
                  </span>

                  {/* Czas trwania */}
                  <span className="flex items-center gap-1 bg-[#f1f5f9] px-2 py-0.5 rounded text-[12px] font-medium text-[#475569] shrink-0">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 12 12">
                      <circle cx="6" cy="6" r="4.5"/>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 3.5V6l1.5 1.5"/>
                    </svg>
                    {formatDuration(trip.durationMin)}
                  </span>

                  {/* Pasażerowie */}
                  <span className="flex items-center gap-1 bg-[#f1f5f9] px-2 py-0.5 rounded text-[12px] font-medium text-[#475569] shrink-0">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 12 12">
                      <circle cx="6" cy="3.5" r="2"/>
                      <path strokeLinecap="round" d="M1.5 11c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5"/>
                    </svg>
                    {trip.passengers} os.
                  </span>

                  {/* Pojazd */}
                  <span className="text-[12px] font-medium text-[#94a3b8] truncate shrink-0 max-w-[180px]">
                    {trip.vehicle}
                  </span>
                </div>

                {/* Prawa: status */}
                <div className="shrink-0">
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-medium ${s.bg} ${s.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot} shrink-0`} />
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}

          <p className="text-[12px] text-[#94a3b8] text-center py-2">
            Wyświetlono wszystkie {filtered.length} {filtered.length === 1 ? "przejazd" : filtered.length < 5 ? "przejazdy" : "przejazdów"}
          </p>
        </div>
      )}
    </div>
  );
}
