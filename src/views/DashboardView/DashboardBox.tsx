import Link from "next/link";
import type { OfferWithRequest } from "@/models";
import { getRouteDisplay } from "@/models";

export function DashboardBox({
  label,
  offers,
  emptyText,
}: {
  label: string;
  offers: OfferWithRequest[];
  emptyText: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
        <span className="text-sm font-semibold text-gray-900">{offers.length}</span>
      </div>

      <div className="divide-y divide-gray-100 max-h-[280px] overflow-y-auto custom-scrollbar">
        {offers.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-gray-400">{emptyText}</p>
          </div>
        ) : (
          offers.map((offer) => (
            <Link
              key={offer.id}
              href="/my-offers"
              className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors gap-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {offer.request ? getRouteDisplay(offer.request.route) : "Brak trasy"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {offer.request?.date} o {offer.request?.time}
                </p>
              </div>
              <span className="text-sm font-semibold text-gray-900 shrink-0">
                {offer.price} PLN
              </span>
            </Link>
          ))
        )}
      </div>

      {offers.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-100">
          <Link href="/my-offers" className="text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors">
            Zobacz wszystkie &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
