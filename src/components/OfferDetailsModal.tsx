import type { OfferWithRequest } from "@/models";
import { parseRoute, optionLabels } from "@/models";
import RouteMap from "./RouteMap";

interface OfferDetailsModalProps {
  offer: OfferWithRequest;
  onClose: () => void;
}

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

  const getStatusText = (status: string) => {
    switch (status) {
      case "new": return "Oczekuje na akceptacje";
      case "accepted": return "Zaakceptowana";
      case "paid": return "Oplacona";
      case "canceled": return "Anulowana";
      case "rejected": return "Odrzucona";
      default: return status;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "new": return "bg-yellow-100 text-yellow-700";
      case "accepted": return "bg-green-100 text-green-700";
      case "paid": return "bg-blue-100 text-blue-700";
      case "canceled": return "bg-orange-100 text-orange-700";
      case "rejected": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Szczegoly zlecenia</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Status i cena */}
          <div className="flex justify-between items-center">
            <span className={`text-sm px-3 py-1 rounded-full font-medium ${getStatusStyle(offer.status)}`}>
              {getStatusText(offer.status)}
            </span>
            <span className="text-2xl font-bold text-green-600">{offer.price} PLN</span>
          </div>

          {/* Mapa */}
          {route && (
            <div className="rounded-lg overflow-hidden">
              <RouteMap route={route} height="180px" />
            </div>
          )}

          {/* Trasa */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Trasa</h3>
            {route ? (
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 mt-1 rounded-full bg-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{route.origin.address}</p>
                    <p className="text-xs text-gray-500">Punkt startowy</p>
                  </div>
                </div>

                {route.waypoints.map((wp, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-3 h-3 mt-1 rounded-full bg-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{wp.address}</p>
                      <p className="text-xs text-gray-500">Przystanek {i + 1}</p>
                    </div>
                  </div>
                ))}

                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 mt-1 rounded-full bg-red-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{route.destination.address}</p>
                    <p className="text-xs text-gray-500">Punkt docelowy</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Brak danych trasy</p>
            )}
          </div>

          {/* Data i czas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Data</h3>
              <p className="text-sm font-medium text-gray-900">{request?.date || "-"}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Godzina</h3>
              <p className="text-sm font-medium text-gray-900">{request?.time || "-"}</p>
            </div>
          </div>

          {/* Pasażerowie */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Pasazerowie</h3>
            <p className="text-sm font-medium text-gray-900">
              {request?.adults || 0} doroslych
              {request?.children ? `, ${request.children} dzieci` : ""}
            </p>
          </div>

          {/* Opcje */}
          {options.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Wymagane opcje</h3>
              <div className="flex flex-wrap gap-2">
                {options.map((opt) => (
                  <span
                    key={opt}
                    className="text-xs bg-white border border-gray-200 text-gray-700 px-2 py-1 rounded"
                  >
                    {opt}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Wiadomość do oferty */}
          {offer.message && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Twoja wiadomosc</h3>
              <p className="text-sm text-gray-700">{offer.message}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}
