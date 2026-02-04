import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { OfferWithRequest } from "@/models";
import { getRouteDisplay } from "@/models";
import OfferDetailsModal from "@/components/OfferDetailsModal";

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
    return <p className="text-gray-500">Ladowanie...</p>;
  }

  if (!session) {
    return (
      <div className="bg-white rounded-lg p-12 text-center">
        <h1 className="text-2xl font-semibold mb-4">Panel Kierowcy Wayoo</h1>
        <p className="text-gray-500">Zaloguj sie, aby uzyskac dostep do panelu.</p>
      </div>
    );
  }

  const pendingOffers = offers.filter((o) => o.status === "new");
  const acceptedOffers = offers.filter((o) => o.status === "accepted");
  const paidOffers = offers.filter((o) => o.status === "paid");
  const allPaidOffers = offers.filter((o) => o.status === "paid");

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Dashboard</h1>
        <p className="text-gray-500">
          Witaj, {session.user?.name}!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Oczekujące na akceptację */}
        <DashboardBox
          title="Oczekujace na akceptacje"
          offers={pendingOffers}
          emptyText="Brak ofert oczekujacych"
          color="yellow"
        />

        {/* Zaakceptowane */}
        <DashboardBox
          title="Zaakceptowane"
          offers={acceptedOffers}
          emptyText="Brak zaakceptowanych ofert"
          color="green"
        />

        {/* Opłacone */}
        <DashboardBox
          title="Oplacone"
          offers={paidOffers}
          emptyText="Brak oplaconych ofert"
          color="blue"
        />
      </div>

      {/* Kalendarz */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">Kalendarz zlecen</h2>
        <CalendarView offers={allPaidOffers} onOfferClick={setSelectedOffer} />
      </div>

      {/* Modal szczegółów oferty */}
      {selectedOffer && (
        <OfferDetailsModal
          offer={selectedOffer}
          onClose={() => setSelectedOffer(null)}
        />
      )}
    </>
  );
}

function DashboardBox({
  title,
  offers,
  emptyText,
  color,
}: {
  title: string;
  offers: OfferWithRequest[];
  emptyText: string;
  color: "yellow" | "green" | "blue";
}) {
  const colorStyles = {
    yellow: {
      header: "bg-yellow-50 text-yellow-800 border-yellow-200",
      badge: "bg-yellow-100 text-yellow-700",
    },
    green: {
      header: "bg-green-50 text-green-800 border-green-200",
      badge: "bg-green-100 text-green-700",
    },
    blue: {
      header: "bg-blue-50 text-blue-800 border-blue-200",
      badge: "bg-blue-100 text-blue-700",
    },
  };

  const styles = colorStyles[color];

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className={`px-4 py-3 border-b ${styles.header}`}>
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-sm">{title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${styles.badge}`}>
            {offers.length}
          </span>
        </div>
      </div>

      <div className="divide-y divide-gray-100 max-h-[198px] overflow-y-auto">
        {offers.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            {emptyText}
          </div>
        ) : (
          offers.map((offer) => (
            <Link
              key={offer.id}
              href="/my-offers"
              className="block p-3 hover:bg-gray-50 transition-colors"
            >
              <p className="text-sm font-medium text-gray-900 truncate">
                {offer.request ? getRouteDisplay(offer.request.route) : "Brak trasy"}
              </p>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                  {offer.request?.date} o {offer.request?.time}
                </span>
                <span className="text-sm font-semibold text-gray-700">
                  {offer.price} PLN
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

      {offers.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <Link
            href="/my-offers"
            className="text-xs text-green-600 hover:text-green-700 font-medium"
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

  // Zbierz daty zleceń
  const offerDates = new Map<string, OfferWithRequest[]>();
  offers.forEach((offer) => {
    if (offer.request?.date) {
      const key = offer.request.date; // format: YYYY-MM-DD
      if (!offerDates.has(key)) {
        offerDates.set(key, []);
      }
      offerDates.get(key)!.push(offer);
    }
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {months.map(({ month, year }) => (
          <MonthCalendar
            key={`${year}-${month}`}
            month={month}
            year={year}
            offerDates={offerDates}
            today={today}
            activeDay={activeDay}
            setActiveDay={setActiveDay}
            onOfferClick={onOfferClick}
          />
        ))}
      </div>
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

  // Poniedziałek = 0, Niedziela = 6
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;

  const days: (number | null)[] = [];

  // Puste dni na początku
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }

  // Dni miesiąca
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const getDateStr = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const getOffersForDay = (day: number) => {
    return offerDates.get(getDateStr(day)) || [];
  };

  const handleDayClick = (day: number, hasOffers: boolean) => {
    if (!hasOffers) return;
    const dateStr = getDateStr(day);
    setActiveDay(activeDay === dateStr ? null : dateStr);
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-3 text-center">
        {MONTH_NAMES[month]} {year}
      </h3>

      <div className="grid grid-cols-7 gap-1 text-center">
        {/* Nagłówki dni */}
        {DAY_NAMES.map((name) => (
          <div key={name} className="text-xs text-gray-400 font-medium py-1">
            {name}
          </div>
        ))}

        {/* Dni */}
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
                  relative py-1 text-sm rounded-md
                  ${isTodayDate ? "bg-green-600 text-white font-bold" : ""}
                  ${hasOffers && !isTodayDate ? "bg-blue-100 text-blue-800 font-medium cursor-pointer hover:bg-blue-200" : ""}
                  ${!hasOffers && !isTodayDate ? "text-gray-600" : ""}
                  ${isActive ? "ring-2 ring-blue-500" : ""}
                `}
              >
                {day}
                {hasOffers && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[10px] rounded-full flex items-center justify-center">
                    {dayOffers.length}
                  </span>
                )}
              </div>

              {/* Tooltip */}
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
    <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg">
      <div className="flex justify-between items-center px-3 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
        <span className="text-xs font-semibold text-gray-700">
          {formatDate(dateStr)} - {offers.length} {offers.length === 1 ? "przejazd" : "przejazdy"}
        </span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
        {offers.map((offer) => (
          <button
            key={offer.id}
            onClick={() => handleOfferClick(offer)}
            className="block w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
          >
            <p className="text-sm font-medium text-gray-900 truncate">
              {offer.request ? getRouteDisplay(offer.request.route) : "Brak trasy"}
            </p>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">
                {offer.request?.time}
              </span>
              <span className="text-xs font-semibold text-green-600">
                {offer.price} PLN
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
