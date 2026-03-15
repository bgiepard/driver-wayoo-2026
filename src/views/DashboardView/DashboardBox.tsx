import Link from "next/link";
import type { OfferWithRequest } from "@/models";
import { getRouteDisplay } from "@/models";
import { Badge } from "@/components/ui/Badge";

const ACCENT_COLORS: Record<string, string> = {
  warning: "border-t-warning-500/60",
  success: "border-t-success-500/60",
  info: "border-t-info-500/60",
};

export function DashboardBox({
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
  return (
    <div className={`rounded-2xl border border-white/[0.06] bg-white/[0.02] border-t-2 ${ACCENT_COLORS[badgeColor]} overflow-hidden`}>
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
