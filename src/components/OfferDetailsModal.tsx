import type { OfferWithRequest } from "@/models";
import { parseRoute, optionLabels } from "@/models";
import RouteMap from "./RouteMap";

interface OfferDetailsModalProps {
  offer: OfferWithRequest;
  onClose: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  new: {
    label: "Oczekuje na akceptacje",
    dot: "bg-warning-400",
    badge: "bg-warning-500/10 text-warning-400 border-warning-500/20",
  },
  accepted: {
    label: "Zaakceptowana",
    dot: "bg-success-400",
    badge: "bg-success-500/10 text-success-400 border-success-500/20",
  },
  paid: {
    label: "Oplacona",
    dot: "bg-info-400",
    badge: "bg-info-500/10 text-info-400 border-info-500/20",
  },
  canceled: {
    label: "Anulowana",
    dot: "bg-gray-400",
    badge: "bg-white/5 text-gray-400 border-white/10",
  },
  rejected: {
    label: "Odrzucona",
    dot: "bg-error-400",
    badge: "bg-error-500/10 text-error-400 border-error-500/20",
  },
};

export default function OfferDetailsModal({ offer, onClose }: OfferDetailsModalProps) {
  const request = offer.request;
  const route = request ? parseRoute(request.route) : null;

  const parseOptions = (optionsStr: string) => {
    try {
      const opts = JSON.parse(optionsStr);
      return Object.entries(opts)
        .filter(([, v]) => v)
        .map(([k]) => optionLabels[k as keyof typeof optionLabels] || k);
    } catch {
      return [];
    }
  };

  const options = request ? parseOptions(request.options) : [];
  const cfg = STATUS_CONFIG[offer.status] || STATUS_CONFIG.new;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 rounded-2xl border border-white/[0.08] bg-gray-900 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-500/10">
              <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Szczegoly zlecenia</h2>
              <p className="text-xs text-gray-500 mt-0.5">ID: {offer.requestId.slice(-8)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <div className="px-6 py-5 space-y-5">

            {/* Status + cena */}
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border ${cfg.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
              <div className="text-right">
                <p className="text-xs text-gray-500">Twoja oferta</p>
                <p className="text-2xl font-bold text-white">{offer.price} <span className="text-sm font-medium text-gray-400">PLN</span></p>
              </div>
            </div>

            {/* Mapa */}
            {route && (
              <div className="rounded-xl overflow-hidden border border-white/[0.06]">
                <RouteMap route={route} height="200px" />
              </div>
            )}

            {/* Trasa */}
            {route && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Trasa</h3>
                <div className="relative pl-6">
                  {/* Linia pionowa */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/[0.08]" />

                  {/* Start */}
                  <div className="relative mb-4">
                    <div className="absolute -left-6 top-0.5 w-3.5 h-3.5 rounded-full bg-brand-500 ring-4 ring-gray-900" />
                    <p className="text-sm font-medium text-white">{route.origin.address}</p>
                    <p className="text-xs text-gray-600 mt-0.5">Start</p>
                  </div>

                  {/* Przystanki */}
                  {route.waypoints.map((wp, i) => (
                    <div key={i} className="relative mb-4">
                      <div className="absolute -left-6 top-0.5 w-3.5 h-3.5 rounded-full bg-info-400 ring-4 ring-gray-900" />
                      <p className="text-sm font-medium text-white">{wp.address}</p>
                      <p className="text-xs text-gray-600 mt-0.5">Przystanek {i + 1}</p>
                    </div>
                  ))}

                  {/* Cel */}
                  <div className="relative">
                    <div className="absolute -left-6 top-0.5 w-3.5 h-3.5 rounded-full bg-error-400 ring-4 ring-gray-900" />
                    <p className="text-sm font-medium text-white">{route.destination.address}</p>
                    <p className="text-xs text-gray-600 mt-0.5">Cel</p>
                  </div>
                </div>
              </div>
            )}

            {/* Grid: data, czas, pasazerowie */}
            <div className="grid grid-cols-3 gap-3">
              <InfoTile
                label="Data"
                value={request?.date || "-"}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                }
              />
              <InfoTile
                label="Godzina"
                value={request?.time || "-"}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <InfoTile
                label="Pasazerowie"
                value={`${request?.adults || 0} dos.${request?.children ? ` + ${request.children} dz.` : ""}`}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                }
              />
            </div>

            {/* Opcje */}
            {options.length > 0 && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Wymagane opcje</h3>
                <div className="flex flex-wrap gap-2">
                  {options.map((opt) => (
                    <span
                      key={opt}
                      className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/[0.04] border border-white/[0.08] text-gray-300 px-3 py-1.5 rounded-lg"
                    >
                      <svg className="w-3 h-3 text-brand-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {opt}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Wiadomosc */}
            {offer.message && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Twoja wiadomosc</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{offer.message}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-sm font-medium text-gray-300 transition-colors"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   INFO TILE
   ============================================ */

function InfoTile({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-gray-500">{icon}</span>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
