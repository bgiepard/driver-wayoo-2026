import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import type { OfferWithRequest } from "@/models";
import { getRouteDisplay } from "@/models";
import OfferDetailsModal from "@/components/OfferDetailsModal";
import LoginModal from "@/components/LoginModal";
import { Badge } from "@/components/ui/Badge";
import logo from "@/assets/logo.png";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [offers, setOffers] = useState<OfferWithRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<OfferWithRequest | null>(null);
  const [showLogin, setShowLogin] = useState(false);

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

  // Landing page - niezalogowany
  if (!session) {
    return (
      <div className="relative min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 overflow-hidden">
        {/* Subtelne tlo */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-500/[0.07] blur-[120px]" />
          <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-brand-400/[0.04] blur-[80px]" />
        </div>

        <div className="relative z-10 text-center max-w-lg">
          <Image src={logo} alt="Wayoo" className="h-10 w-auto mx-auto mb-12 opacity-80" />

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-xs font-medium text-brand-400 tracking-wide">Panel Kierowcy</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-5">
            Twoje zlecenia,{" "}
            <span className="text-brand-400">jedna platforma</span>
          </h1>

          <p className="text-lg text-gray-400 leading-relaxed mb-12 max-w-md mx-auto">
            Zarzadzaj flota, skladaj oferty i sledz przychody — wszystko w jednym miejscu.
          </p>

          <button
            onClick={() => setShowLogin(true)}
            className="group relative inline-flex items-center justify-center px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-2xl text-base transition-all duration-200 hover:shadow-[0_0_32px_rgba(22,163,74,0.3)]"
          >
            Zaloguj sie
            <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>

        <div className="absolute bottom-8 text-xs text-gray-600">
          wayoo.pl
        </div>

        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      </div>
    );
  }

  // Dashboard - zalogowany
  const pendingOffers = offers.filter((o) => o.status === "new");
  const paidOffers = offers.filter((o) => o.status === "paid");
  const totalRevenue = paidOffers.reduce((sum, o) => sum + o.price, 0);

  return (
    <div className="max-w-[1100px] mx-auto">
      {/* Naglowek */}
      <div className="mb-10">
        <p className="text-sm font-medium text-gray-500 mb-1">Dashboard</p>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Witaj, {session.user?.name}
        </h1>
      </div>

      {/* Metryki */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <MetricCard
          label="Zlozonych ofert"
          value={offers.length}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
        />
        <MetricCard
          label="Oczekujacych"
          value={pendingOffers.length}
          color="warning"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          label="Przychod"
          value={`${totalRevenue.toLocaleString("pl-PL")} PLN`}
          color="brand"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          }
        />
      </div>

      {/* Boxy z ofertami */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
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
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-500/10">
            <svg className="w-4.5 h-4.5 text-brand-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-white">Kalendarz zlecen</h2>
        </div>
        <CalendarView offers={paidOffers} onOfferClick={setSelectedOffer} />
      </div>

      {selectedOffer && (
        <OfferDetailsModal
          offer={selectedOffer}
          onClose={() => setSelectedOffer(null)}
        />
      )}
    </div>
  );
}

/* ============================================
   METRIC CARD
   ============================================ */

function MetricCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number | string;
  color?: "warning" | "success" | "brand" | "info";
  icon?: React.ReactNode;
}) {
  const iconColors: Record<string, string> = {
    warning: "bg-warning-500/10 text-warning-400",
    success: "bg-success-500/10 text-success-400",
    brand: "bg-brand-500/10 text-brand-400",
    info: "bg-info-500/10 text-info-400",
  };

  const valueColors: Record<string, string> = {
    warning: "text-warning-400",
    success: "text-success-400",
    brand: "text-brand-400",
    info: "text-info-400",
  };

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        {icon && (
          <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${color ? iconColors[color] : "bg-white/5 text-gray-400"}`}>
            {icon}
          </div>
        )}
      </div>
      <p className={`text-3xl font-bold tracking-tight ${color ? valueColors[color] : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

/* ============================================
   DASHBOARD BOX (lista ofert)
   ============================================ */

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
  const accentColors: Record<string, string> = {
    warning: "border-t-warning-500/60",
    success: "border-t-success-500/60",
    info: "border-t-info-500/60",
  };

  return (
    <div className={`rounded-2xl border border-white/[0.06] bg-white/[0.02] border-t-2 ${accentColors[badgeColor]} overflow-hidden`}>
      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <Badge color={badgeColor} size="sm">{offers.length}</Badge>
      </div>

      <div className="divide-y divide-white/[0.04] max-h-[260px] overflow-y-auto custom-scrollbar">
        {offers.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <svg className="w-8 h-8 mx-auto text-gray-700 mb-3" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
            </svg>
            <p className="text-sm text-gray-600">{emptyText}</p>
          </div>
        ) : (
          offers.map((offer) => (
            <Link
              key={offer.id}
              href="/my-offers"
              className="block px-5 py-3.5 hover:bg-white/[0.03] transition-colors"
            >
              <p className="text-sm font-medium text-white/90 truncate">
                {offer.request ? getRouteDisplay(offer.request.route) : "Brak trasy"}
              </p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  {offer.request?.date} o {offer.request?.time}
                </span>
                <span className="text-sm font-bold text-white">
                  {offer.price} PLN
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

      {offers.length > 0 && (
        <div className="px-5 py-3 border-t border-white/[0.04]">
          <Link
            href="/my-offers"
            className="text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
          >
            Zobacz wszystkie &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}

/* ============================================
   KALENDARZ
   ============================================ */

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
      <h3 className="text-sm font-semibold text-white/80 mb-3 text-center tracking-wide">
        {MONTH_NAMES[month]} {year}
      </h3>

      <div className="grid grid-cols-7 gap-1 text-center">
        {DAY_NAMES.map((name) => (
          <div key={name} className="text-[11px] text-gray-600 font-medium py-1">
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
    <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-64 rounded-xl border border-white/[0.08] bg-gray-900 shadow-theme-lg backdrop-blur-sm">
      <div className="flex justify-between items-center px-3 py-2.5 border-b border-white/[0.06]">
        <span className="text-xs font-semibold text-gray-300">
          {formatDate(dateStr)} &middot; {offers.length} {offers.length === 1 ? "przejazd" : "przejazdy"}
        </span>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="max-h-48 overflow-y-auto divide-y divide-white/[0.04] custom-scrollbar">
        {offers.map((offer) => (
          <button
            key={offer.id}
            onClick={() => handleOfferClick(offer)}
            className="block w-full text-left px-3 py-2.5 hover:bg-white/[0.04] transition-colors"
          >
            <p className="text-sm font-medium text-white/90 truncate">
              {offer.request ? getRouteDisplay(offer.request.route) : "Brak trasy"}
            </p>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">
                {offer.request?.time}
              </span>
              <span className="text-xs font-semibold text-brand-400">
                {offer.price} PLN
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
