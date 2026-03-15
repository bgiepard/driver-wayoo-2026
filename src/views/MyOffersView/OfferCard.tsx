import type { OfferWithRequest } from "@/models";
import { getRouteDisplay } from "@/models";
import { STATUS_CONFIG } from "@/constants/offerStatus";

export function OfferCard({
  offer,
  onClick,
}: {
  offer: OfferWithRequest;
  onClick: (offer: OfferWithRequest) => void;
}) {
  const cfg = STATUS_CONFIG[offer.status] || STATUS_CONFIG.new;

  return (
    <div
      className="rounded-lg border border-gray-200 bg-white shadow-sm p-5 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => onClick(offer)}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          {offer.request ? (
            <>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {getRouteDisplay(offer.request.route)}
              </p>
              <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  {offer.request.date}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {offer.request.time}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  {offer.request.adults}{offer.request.children > 0 ? ` + ${offer.request.children} dzieci` : ""}
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm font-semibold text-gray-900">
              Zlecenie #{offer.requestId.slice(-6)}
            </p>
          )}

          {offer.message && (
            <p className="text-xs text-gray-500 mt-2 truncate italic">„{offer.message}"</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md border ${cfg.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
          <p className="text-base font-bold text-gray-900">{offer.price} PLN</p>
        </div>
      </div>
    </div>
  );
}
