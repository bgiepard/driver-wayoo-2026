import { useState } from "react";
import type { OfferWithRequest } from "@/models";
import { getRouteDisplay } from "@/models";

const MONTH_NAMES = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

const DAY_NAMES = ["pon.", "wt.", "śr", "czw.", "pt.", "sob.", "niedz."];

export function DashboardCalendar({
  offers,
  onOfferClick,
}: {
  offers: OfferWithRequest[];
  onOfferClick: (offer: OfferWithRequest) => void;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [activeDay, setActiveDay] = useState<string | null>(null);

  const offerDates = new Map<string, OfferWithRequest[]>();
  offers.forEach((offer) => {
    if (offer.request?.date) {
      const key = offer.request.date;
      if (!offerDates.has(key)) offerDates.set(key, []);
      offerDates.get(key)!.push(offer);
    }
  });

  const goToPrev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const goToNext = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Poniedzialek = 0
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const getDateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  // Wszystkie komórki siatki (null = puste, number = dzień)
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ...Array(totalCells - startOffset - daysInMonth).fill(null),
  ];

  return (
    <div className="border border-[#e2e8f0] rounded-2xl flex flex-col">
      {/* Nagłówek panelu */}
      <div className="bg-[#f1f5f9] border-b border-[#e2e8f0] px-6 py-4 shrink-0 rounded-t-2xl">
        <p className="text-[#0f172a] text-[16px] font-bold leading-snug">Zaplanowane przejazdy</p>
      </div>

      <div className="bg-white flex flex-col gap-6 p-6">
        {/* Nawigacja miesiąca */}
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrev}
            className="bg-white border border-[#e2e8f0] rounded-lg p-2 hover:bg-[#f8fafc] transition-colors"
          >
            <svg className="w-5 h-5 text-[#0f172a]" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15l-5-5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <p className="text-[#0f172a] text-[16px] font-bold">{MONTH_NAMES[month]} {year}</p>
          <button
            onClick={goToNext}
            className="bg-white border border-[#e2e8f0] rounded-lg p-2 hover:bg-[#f8fafc] transition-colors"
          >
            <svg className="w-5 h-5 text-[#0f172a]" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Siatka kalendarza */}
        <div className="border border-[#e2e8f0] rounded-lg overflow-visible">

          {/* Nagłówki dni tygodnia */}
          <div className="grid grid-cols-7 border-b border-[#e2e8f0]">
            {DAY_NAMES.map((name, idx) => (
              <div
                key={name}
                className={`p-2 text-right text-[12px] font-medium text-[#0f172a] border-r border-[#e2e8f0] last:border-r-0 ${idx >= 5 ? "bg-[#f8fafc]" : "bg-white"}`}
              >
                {name}
              </div>
            ))}
          </div>

          {/* Komórki dni — grid z aspect-square */}
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              const col = idx % 7; // 0=pon … 6=niedz
              const isWeekend = col >= 5;
              const isLastRow = idx >= cells.length - 7;
              const isLastCol = col === 6;

              const dayOffers = day ? (offerDates.get(getDateStr(day)) ?? []) : [];
              const hasOffers = dayOffers.length > 0;
              const todayCell = day ? isToday(day) : false;
              const dateStr = day ? getDateStr(day) : "";
              const isActive = activeDay === dateStr && day !== null;

              let bg = isWeekend ? "bg-[#f8fafc]" : "bg-white";
              if (todayCell) bg = "bg-[#eef2ff]";

              const borderR = todayCell
                ? "border-r-2 border-r-[#0b298f]"
                : "border-r border-r-[#e2e8f0]";

              return (
                <div
                  key={idx}
                  className={`
                    aspect-square relative flex flex-col items-end justify-between p-1.5
                    ${bg}
                    ${isLastCol ? "" : borderR}
                    ${isLastRow ? "" : "border-b border-b-[#e2e8f0]"}
                    ${hasOffers && day ? "cursor-pointer" : ""}
                  `}
                  onClick={() => {
                    if (!day || !hasOffers) return;
                    setActiveDay(isActive ? null : dateStr);
                  }}
                >
                  {day && (
                    <>
                      <span className={`text-[13px] leading-none ${todayCell ? "text-[#0b298f] font-semibold" : "text-[#0f172a] font-medium"}`}>
                        {day}
                      </span>
                      {hasOffers && (
                        <div className="flex flex-col gap-0.5 w-full mt-0.5">
                          {(() => {
                            const paid = dayOffers.filter(o => o.status === "paid").length;
                            const pending = dayOffers.filter(o => o.status === "new").length;
                            return (
                              <>
                                <div className="bg-[#0b298f] rounded text-white text-[10px] font-semibold text-center w-full h-4 flex items-center justify-center">
                                    {dayOffers.length}
                                  </div>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </>
                  )}

                  {/* Tooltip */}
                  {isActive && hasOffers && (
                    <div className="absolute z-50 top-full left-0 mt-1 w-64 rounded-lg border border-[#e2e8f0] bg-white shadow-lg">
                      <div className="flex justify-between items-center px-3 py-2 border-b border-[#e2e8f0]">
                        <span className="text-[12px] font-semibold text-[#0f172a]">
                          {dayOffers.length} {dayOffers.length === 1 ? "przejazd" : "przejazdy"}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveDay(null); }}
                          className="text-[#475569] hover:text-[#0f172a]"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="max-h-48 overflow-y-auto divide-y divide-[#e2e8f0]">
                        {dayOffers.map((offer) => (
                          <button
                            key={offer.id}
                            onClick={(e) => { e.stopPropagation(); setActiveDay(null); onOfferClick(offer); }}
                            className="block w-full text-left px-3 py-2 hover:bg-[#f8fafc] transition-colors"
                          >
                            <p className="text-[14px] font-medium text-[#0f172a] truncate">
                              {offer.request ? getRouteDisplay(offer.request.route) : "Brak trasy"}
                            </p>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-[12px] text-[#475569]">{offer.request?.time}</span>
                              <span className="text-[12px] font-semibold text-[#0b298f]">{offer.price} zł</span>
                            </div>
                            <div className="mt-1">
                              {offer.status === "paid" && (
                                <span className="text-[11px] font-medium text-[#01a83d] bg-[#e6f6ec] px-1.5 py-0.5 rounded">Opłacona</span>
                              )}
                              {offer.status === "new" && (
                                <span className="text-[11px] font-medium text-[#b24900] bg-[#fff9ea] px-1.5 py-0.5 rounded">Oczekuje</span>
                              )}
                              {offer.status === "rejected" && (
                                <span className="text-[11px] font-medium text-[#de2b3b] bg-[#fceaeb] px-1.5 py-0.5 rounded">Odrzucona</span>
                              )}
                              {offer.status === "canceled" && (
                                <span className="text-[11px] font-medium text-[#475569] bg-[#f1f5f9] px-1.5 py-0.5 rounded">Anulowana</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
