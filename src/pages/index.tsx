import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { OfferWithRequest } from "@/models";
import { getRouteDisplay } from "@/models";
import OfferDetailsModal from "@/components/OfferDetailsModal";
import { PageTitle, PageSubtitle } from "@/components/ui/Typography";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [offers, setOffers] = useState<OfferWithRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<OfferWithRequest | null>(null);

  useEffect(() => {
    if (session) {
      fetchOffers();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchOffers = async () => {
    try {
      const res = await fetch("/api/offers");
      const data = await res.json();
      setOffers(data);
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
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
        <h1 className="text-title-lg font-bold text-white/90 mb-4">Panel Kierowcy Wayoo</h1>
        <p className="text-gray-400">Zaloguj sie, aby uzyskac dostep do panelu.</p>
      </Card>
    );
  }

  const pendingOffers = offers.filter((o) => o.status === "new");
  const paidOffers = offers.filter((o) => o.status === "paid");
  const totalRevenue = paidOffers.reduce((sum, o) => sum + o.price, 0);

  return (
    <div>
      {/* Naglowek */}
      <div className="mb-8">
        <PageTitle>Dashboard</PageTitle>
        <PageSubtitle>Witaj, {session.user?.name}!</PageSubtitle>
      </div>

      {/* Metryki */}
      <div className="max-w-[1100px] mx-auto grid grid-cols-3 gap-4 mb-8">
        <MetricCard label="Zlozonych ofert" value={offers.length} />
        <MetricCard label="Oczekujacych" value={pendingOffers.length} color="warning" />
        <MetricCard label="Przychod" value={`${totalRevenue} PLN`} color="brand" />
      </div>

      {/* Boxy z ofertami */}
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        <DashboardBox
          title="Oczekujace"
          offers={pendingOffers}
          emptyText="Brak ofert oczekujacych"
          badgeColor="warning"
        />
        <DashboardBox
          title="Oplacone"
          offers={paidOffers}
          emptyText="Brak oplaconych ofert"
          badgeColor="info"
        />
      </div>

      {/* Kalendarz */}
      <Card className="max-w-[1100px] mx-auto">
        <CardHeader title="Kalendarz zlecen" />
        <CalendarView offers={paidOffers} onOfferClick={setSelectedOffer} />
      </Card>

      {selectedOffer && (
        <OfferDetailsModal
          offer={selectedOffer}
          onClose={() => setSelectedOffer(null)}
        />
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color?: "warning" | "success" | "brand" | "info";
}) {
  const accents: Record<string, string> = {
    warning: "text-warning-400",
    success: "text-success-400",
    brand: "text-brand-400",
    info: "text-info-400",
  };

  return (
    <Card className="!py-4">
      <p className="text-theme-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-title-lg font-bold mt-1 ${color ? accents[color] : "text-white/90"}`}>
        {value}
      </p>
    </Card>
  );
}

function DashboardBox({
  title,
  offers,
  emptyText,
  badgeColor,
}: {
  title: string;
  offers: OfferWithRequest[];
  emptyText: string;
  badgeColor: "warning" | "success" | "info";
}) {
  const headerAccent: Record<string, string> = {
    warning: "border-l-warning-500",
    success: "border-l-success-500",
    info: "border-l-info-500",
  };

  return (
    <div className={`overflow-hidden rounded-2xl border border-gray-700/60 bg-gray-800/50 border-l-[3px] ${headerAccent[badgeColor]}`}>
      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <Badge color={badgeColor} size="md">{offers.length}</Badge>
      </div>

      <div className="divide-y divide-gray-700/50 max-h-[240px] overflow-y-auto custom-scrollbar">
        {offers.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-500 text-theme-sm">
            {emptyText}
          </div>
        ) : (
          offers.map((offer) => (
            <Link
              key={offer.id}
              href="/my-offers"
              className="block px-5 py-3.5 hover:bg-white/[0.04] transition-colors"
            >
              <p className="text-theme-sm font-medium text-white truncate">
                {offer.request ? getRouteDisplay(offer.request.route) : "Brak trasy"}
              </p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-theme-xs text-gray-400">
                  {offer.request?.date} o {offer.request?.time}
                </span>
                <span className="text-theme-sm font-bold text-white">
                  {offer.price} PLN
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

      {offers.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-700/50">
          <Link
            href="/my-offers"
            className="text-theme-sm text-brand-400 hover:text-brand-300 font-medium"
          >
            Zobacz wszystkie →
          </Link>
        </div>
      )}
    </div>
  );
}

const MONTH_NAMES = [
  "Styczen", "Luty", "Marzec", "Kwiecien", "Maj", "Czerwiec",
  "Lipiec", "Sierpien", "Wrzesien", "Pazdziernik", "Listopad", "Grudzien"
];

const DAY_NAMES = ["Pn", "Wt", "Sr", "Cz", "Pt", "So", "Nd"];

function CalendarView({
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
      if (!offerDates.has(key)) {
        offerDates.set(key, []);
      }
      offerDates.get(key)!.push(offer);
    }
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {months.map(({ month, year }) => (
        <div key={`${year}-${month}`} className="rounded-xl border border-gray-800 bg-white/[0.02] p-4">
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
  month,
  year,
  offerDates,
  today,
  activeDay,
  setActiveDay,
  onOfferClick,
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
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

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
      <h3 className="text-theme-sm font-semibold text-white/90 mb-3 text-center">
        {MONTH_NAMES[month]} {year}
      </h3>

      <div className="grid grid-cols-7 gap-1 text-center">
        {DAY_NAMES.map((name) => (
          <div key={name} className="text-theme-xs text-gray-500 font-medium py-1">
            {name}
          </div>
        ))}

        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="py-1" />;
          }

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
                  relative py-1 text-theme-sm rounded-md transition-colors
                  ${isTodayDate ? "bg-brand-500 text-white font-bold" : ""}
                  ${hasOffers && !isTodayDate ? "bg-brand-500/15 text-brand-400 font-medium cursor-pointer hover:bg-brand-500/25" : ""}
                  ${!hasOffers && !isTodayDate ? "text-gray-400" : ""}
                  ${isActive ? "ring-2 ring-brand-400" : ""}
                `}
              >
                {day}
                {hasOffers && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 text-white text-[10px] rounded-full flex items-center justify-center">
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
  offers,
  dateStr,
  onClose,
  onOfferClick,
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

  const handleOfferClick = (offer: OfferWithRequest) => {
    onClose();
    onOfferClick(offer);
  };

  return (
    <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-64 rounded-xl border border-gray-800 bg-gray-900 shadow-theme-lg">
      <div className="flex justify-between items-center px-3 py-2 border-b border-gray-800">
        <span className="text-theme-xs font-semibold text-gray-300">
          {formatDate(dateStr)} - {offers.length} {offers.length === 1 ? "przejazd" : "przejazdy"}
        </span>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="max-h-48 overflow-y-auto divide-y divide-gray-800 custom-scrollbar">
        {offers.map((offer) => (
          <button
            key={offer.id}
            onClick={() => handleOfferClick(offer)}
            className="block w-full text-left px-3 py-2 hover:bg-white/[0.03] transition-colors"
          >
            <p className="text-theme-sm font-medium text-white/90 truncate">
              {offer.request ? getRouteDisplay(offer.request.route) : "Brak trasy"}
            </p>
            <div className="flex justify-between items-center mt-1">
              <span className="text-theme-xs text-gray-400">
                {offer.request?.time}
              </span>
              <span className="text-theme-xs font-semibold text-brand-400">
                {offer.price} PLN
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
