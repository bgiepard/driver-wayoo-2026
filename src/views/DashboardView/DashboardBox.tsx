import Link from "next/link";
import type { OfferWithRequest } from "@/models";
import { parseRoute } from "@/models";

type OfferStatus = "new" | "accepted" | "rejected" | "canceled";

const STATUS_CONFIG: Record<OfferStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  accepted: {
    label: "Wybrana",
    bg: "bg-[#e6f6ec]",
    text: "text-[#01a83d]",
    icon: (
      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5.5" stroke="currentColor" strokeWidth="1"/>
        <path d="M3.5 6l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  rejected: {
    label: "Odrzucona",
    bg: "bg-[#fceaeb]",
    text: "text-[#de2b3b]",
    icon: (
      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5.5" stroke="currentColor" strokeWidth="1"/>
        <path d="M4 4l4 4M8 4l-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  new: {
    label: "Oczekuje",
    bg: "bg-[#fff9ea]",
    text: "text-[#b24900]",
    icon: (
      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5.5" stroke="currentColor" strokeWidth="1"/>
        <path d="M6 3.5V6l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  canceled: {
    label: "Anulowana",
    bg: "bg-[#f1f5f9]",
    text: "text-[#475569]",
    icon: (
      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5.5" stroke="currentColor" strokeWidth="1"/>
        <path d="M4 4l4 4M8 4l-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
};

// Ikona kalendarza
const CalendarIcon = () => (
  <svg className="w-[14px] h-[14px]" viewBox="0 0 14 14" fill="none">
    <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="#475569" strokeWidth="1.2"/>
    <path d="M1.5 5.5h11M4.5 1v3M9.5 1v3" stroke="#475569" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

function formatDate(date: string, time: string): string {
  if (!date) return "";
  const [year, month, day] = date.split("-");
  const monthNames = [
    "stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
    "lipca", "sierpnia", "września", "października", "listopada", "grudnia",
  ];
  const m = parseInt(month, 10) - 1;
  return `${parseInt(day, 10)} ${monthNames[m]} ${year}, ${time}`;
}

export function DashboardBox({
  offers,
}: {
  offers: OfferWithRequest[];
}) {
  const recent = offers.slice(0, 5);

  return (
    <div className="border border-[#e2e8f0] rounded-2xl overflow-hidden flex flex-col">
      {/* Nagłówek */}
      <div className="bg-[#f1f5f9] border-b border-[#e2e8f0] px-6 py-4">
        <p className="text-[#0f172a] text-[16px] font-bold leading-snug">Ostatnio złożone oferty</p>
      </div>

      {/* Lista */}
      <div className="divide-y divide-[#e2e8f0] bg-white">
        {recent.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-[#475569]">Brak złożonych ofert</p>
          </div>
        ) : (
          recent.map((offer) => {
            const route = offer.request ? parseRoute(offer.request.route) : null;
            const origin = route?.origin?.address?.split(",")[0] ?? "—";
            const destination = route?.destination?.address?.split(",")[0] ?? "—";
            const status = STATUS_CONFIG[offer.status as OfferStatus] ?? STATUS_CONFIG.canceled;

            return (
              <Link
                key={offer.id}
                href="/moje-oferty"
                className="flex items-center justify-between px-6 py-3 hover:bg-[#f8fafc] transition-colors"
              >
                {/* Trasa */}
                <div className="flex gap-2 items-start flex-1 min-w-0">
                  {/* Wskaźnik drogi */}
                  <div className="flex flex-col items-center justify-center self-stretch shrink-0 mt-0.5">
                    {/* Punkt startowy */}
                    <div className="w-[7px] h-[7px] rounded-full bg-[#0f172a] border-2 border-[#0f172a] shrink-0" />
                    <div className="w-px flex-1 bg-[#0f172a] my-[2px]" />
                    {/* Punkt końcowy */}
                    <div className="w-[7px] h-[7px] rounded-full border-2 border-[#0f172a] shrink-0" />
                  </div>

                  {/* Tekst */}
                  <div className="flex flex-col gap-[2px] min-w-0">
                    <p className="text-[#0f172a] text-[14px] font-medium leading-snug truncate">{origin}</p>
                    <div className="flex items-center gap-2">
                      <CalendarIcon />
                      <p className="text-[#475569] text-[12px] font-medium whitespace-nowrap">
                        {offer.request ? formatDate(offer.request.date, offer.request.time) : "—"}
                      </p>
                    </div>
                    <p className="text-[#0f172a] text-[14px] font-medium leading-snug truncate">{destination}</p>
                  </div>
                </div>

                {/* Status + cena */}
                <div className="flex items-center gap-4 shrink-0 ml-4">
                  <span className={`flex items-center gap-1 px-2 py-1 rounded text-[12px] font-medium ${status.bg} ${status.text}`}>
                    {status.icon}
                    {status.label}
                  </span>
                  <p className="text-[#0f172a] text-[14px] font-medium w-[60px] text-right">
                    {offer.price.toLocaleString("pl-PL")} zł
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
