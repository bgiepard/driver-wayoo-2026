import { useState } from "react";
import type { OfferWithRequest } from "@/models";
import { getRouteDisplay } from "@/models";

const MONTH_NAMES = [
  "Styczen", "Luty", "Marzec", "Kwiecien", "Maj", "Czerwiec",
  "Lipiec", "Sierpien", "Wrzesien", "Pazdziernik", "Listopad", "Grudzien",
];

const DAY_NAMES = ["Pn", "Wt", "Sr", "Cz", "Pt", "So", "Nd"];

export function DashboardCalendar({
  offers,
  onOfferClick,
}: {
  offers: OfferWithRequest[];
  onOfferClick: (offer: OfferWithRequest) => void;
}) {
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const today = new Date();
  const months = [0, 1, 2].map((offset) => {
    const date = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    return { month: date.getMonth(), year: date.getFullYear() };
  });

  const offerDates = new Map<string, OfferWithRequest[]>();
  offers.forEach((offer) => {
    if (offer.request?.date) {
      const key = offer.request.date;
      if (!offerDates.has(key)) offerDates.set(key, []);
      offerDates.get(key)!.push(offer);
    }
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {months.map(({ month, year }) => (
        <div key={`${year}-${month}`} className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4">
          <MonthCalendar
            month={month}
            year={year}
            offerDates={offerDates}
            today={today}
            activeDay={activeDay}
            setActiveDay={setActiveDay}
            onOfferClick={onOfferClick}
          />
        </div>
      ))}
    </div>
  );
}

function MonthCalendar({
  month, year, offerDates, today, activeDay, setActiveDay, onOfferClick,
}: {
  month: number;
  year: number;
  offerDates: Map<string, OfferWithRequest[]>;
  today: Date;
  activeDay: string | null;
  setActiveDay: (day: string | null) => void;
  onOfferClick: (offer: OfferWithRequest) => void;
}) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;

  const days: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const getDateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const getOffersForDay = (day: number) => offerDates.get(getDateStr(day)) || [];

  const handleDayClick = (day: number, hasOffers: boolean) => {
    if (!hasOffers) return;
    const dateStr = getDateStr(day);
    setActiveDay(activeDay === dateStr ? null : dateStr);
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-white/80 mb-3 text-center tracking-wide">
        {MONTH_NAMES[month]} {year}
      </h3>

      <div className="grid grid-cols-7 gap-1 text-center">
        {DAY_NAMES.map((name) => (
          <div key={name} className="text-[11px] text-gray-600 font-medium py-1">{name}</div>
        ))}

        {days.map((day, index) => {
          if (day === null) return <div key={`empty-${index}`} className="py-1" />;

          const dayOffers = getOffersForDay(day);
          const hasOffers = dayOffers.length > 0;
          const isTodayDate = isToday(day);
          const dateStr = getDateStr(day);
          const isActive = activeDay === dateStr;

          return (
            <div key={day} className="relative">
              <div
                onClick={() => handleDayClick(day, hasOffers)}
                className={`
                  relative py-1 text-sm rounded-lg transition-all duration-150
                  ${isTodayDate ? "bg-brand-500 text-white font-bold" : ""}
                  ${hasOffers && !isTodayDate ? "bg-brand-500/10 text-brand-400 font-medium cursor-pointer hover:bg-brand-500/20" : ""}
                  ${!hasOffers && !isTodayDate ? "text-gray-500" : ""}
                  ${isActive ? "ring-2 ring-brand-400/60" : ""}
                `}
              >
                {day}
                {hasOffers && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 text-white text-[10px] rounded-full flex items-center justify-center font-semibold">
                    {dayOffers.length}
                  </span>
                )}
              </div>

              {isActive && hasOffers && (
                <DayTooltip
                  offers={dayOffers}
                  dateStr={dateStr}
                  onClose={() => setActiveDay(null)}
                  onOfferClick={onOfferClick}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayTooltip({
  offers, dateStr, onClose, onOfferClick,
}: {
  offers: OfferWithRequest[];
  dateStr: string;
  onClose: () => void;
  onOfferClick: (offer: OfferWithRequest) => void;
}) {
  const formatDate = (date: string) => {
    const [y, m, d] = date.split("-");
    return `${d}.${m}.${y}`;
  };

  return (
    <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-64 rounded-xl border border-white/[0.08] bg-gray-900 shadow-theme-lg backdrop-blur-sm">
      <div className="flex justify-between items-center px-3 py-2.5 border-b border-white/[0.06]">
        <span className="text-xs font-semibold text-gray-300">
          {formatDate(dateStr)} &middot; {offers.length} {offers.length === 1 ? "przejazd" : "przejazdy"}
        </span>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="max-h-48 overflow-y-auto divide-y divide-white/[0.04] custom-scrollbar">
        {offers.map((offer) => (
          <button
            key={offer.id}
            onClick={() => { onClose(); onOfferClick(offer); }}
            className="block w-full text-left px-3 py-2.5 hover:bg-white/[0.04] transition-colors"
          >
            <p className="text-sm font-medium text-white/90 truncate">
              {offer.request ? getRouteDisplay(offer.request.route) : "Brak trasy"}
            </p>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">{offer.request?.time}</span>
              <span className="text-xs font-semibold text-brand-400">{offer.price} PLN</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
