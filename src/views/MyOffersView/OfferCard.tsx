import type { OfferWithRequest } from "@/models";
import { parseRoute } from "@/models";

type OfferStatus = "new" | "paid" | "rejected" | "canceled";

const STATUS_CONFIG: Record<OfferStatus, { label: string; bg: string; text: string; dot: string }> = {
  paid:     { label: "Opłacona",  bg: "bg-[#e6f6ec]", text: "text-[#01a83d]", dot: "bg-[#01a83d]" },
  new:      { label: "Oczekuje",  bg: "bg-[#fff9ea]", text: "text-[#b24900]", dot: "bg-[#b24900]" },
  rejected: { label: "Odrzucona", bg: "bg-[#fceaeb]", text: "text-[#de2b3b]", dot: "bg-[#de2b3b]" },
  canceled: { label: "Anulowana", bg: "bg-[#f1f5f9]", text: "text-[#475569]", dot: "bg-[#94a3b8]" },
};

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
    </svg>
  ),
  wc: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
    </svg>
  ),
  tv: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  ),
  airConditioning: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  ),
  powerOutlet: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
};

function formatDate(date: string, time: string): string {
  if (!date) return "";
  const [year, month, day] = date.split("-");
  const monthNames = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
  return `${parseInt(day, 10)} ${monthNames[parseInt(month, 10) - 1]} ${year}, ${time}`;
}

function getWaypointsLabel(count: number): string {
  if (count === 0) return "Bez przystanków";
  if (count === 1) return "1 przystanek";
  if (count < 5) return `${count} przystanki`;
  return `${count} przystanków`;
}

export function OfferCard({
  offer,
  onClick,
}: {
  offer: OfferWithRequest;
  onClick: (offer: OfferWithRequest) => void;
}) {
  const status = STATUS_CONFIG[offer.status as OfferStatus] ?? STATUS_CONFIG.canceled;
  const route = offer.request ? parseRoute(offer.request.route) : null;
  const origin = route?.origin?.address?.split(",")[0] ?? "—";
  const destination = route?.destination?.address?.split(",")[0] ?? "—";
  const wpCount = route?.waypoints?.length ?? 0;
  const distanceKm = route?.distanceKm ?? null;
  const totalPassengers = offer.request ? offer.request.adults + (offer.request.children ?? 0) : 0;

  let amenities: string[] = [];
  if (offer.request?.options) {
    try {
      const opts = JSON.parse(offer.request.options);
      amenities = Object.entries(opts).filter(([, v]) => v).map(([k]) => k);
    } catch { /* ignoruj */ }
  }

  return (
    <div
      className="bg-white border border-[#e2e8f0] rounded-2xl px-4 py-3 flex items-center gap-4 cursor-pointer hover:border-[#cbd5e1] transition-colors"
      onClick={() => onClick(offer)}
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

      {/* Środek: data + tagi + amenities */}
      <div className="flex-1 flex items-center gap-2 flex-wrap min-w-0">
        {offer.request && (
          <span className="flex items-center gap-1 text-[12px] font-medium text-[#475569] shrink-0">
            <svg className="w-[13px] h-[13px] shrink-0" viewBox="0 0 14 14" fill="none">
              <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="#475569" strokeWidth="1.2"/>
              <path d="M1.5 5.5h11M4.5 1v3M9.5 1v3" stroke="#475569" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            {formatDate(offer.request.date, offer.request.time)}
          </span>
        )}
        <span className="flex items-center gap-1 bg-[#f1f5f9] px-2 py-0.5 rounded text-[12px] font-medium text-[#475569] shrink-0">
          <svg className="w-3 h-3 text-[#475569]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 14 14">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2 4.5c0-.828.672-1.5 1.5-1.5s1.5.672 1.5 1.5S4.328 6 3.5 6 2 5.328 2 4.5zm0 0h1M5 4.5h7M9 9.5c0 .828.672 1.5 1.5 1.5S12 10.328 12 9.5 11.328 8 10.5 8 9 8.672 9 9.5zm0 0h-7" />
          </svg>
          {getWaypointsLabel(wpCount)}
        </span>
        {distanceKm && (
          <span className="flex items-center gap-1 bg-[#f1f5f9] px-2 py-0.5 rounded text-[12px] font-medium text-[#475569] shrink-0">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 12 12">
              <path strokeLinecap="round" strokeLinejoin="round" d="M1 6h10M7.5 3l3 3-3 3"/>
            </svg>
            {distanceKm} km
          </span>
        )}
        {offer.request && (
          <span className="flex items-center gap-1 bg-[#f1f5f9] px-2 py-0.5 rounded text-[12px] font-medium text-[#475569] shrink-0">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 12 12">
              <circle cx="6" cy="3.5" r="2"/>
              <path strokeLinecap="round" d="M1.5 11c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5"/>
            </svg>
            {totalPassengers} os. ({offer.request.adults}+{offer.request.children ?? 0})
          </span>
        )}
        {amenities.map((key) => AMENITY_ICONS[key] ? (
          <div key={key} className="bg-[#f1f5f9] border border-[#e2e8f0] w-[26px] h-[26px] flex items-center justify-center rounded text-[#475569]">
            {AMENITY_ICONS[key]}
          </div>
        ) : null)}
      </div>

      {/* Prawa: status + cena */}
      <div className="flex items-center gap-4 shrink-0">
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-medium ${status.bg} ${status.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot} shrink-0`} />
          {status.label}
        </span>
        <p className="text-[#0f172a] text-[14px] font-semibold w-[70px] text-right whitespace-nowrap">
          {offer.price.toLocaleString("pl-PL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} zł
        </p>
      </div>
    </div>
  );
}
