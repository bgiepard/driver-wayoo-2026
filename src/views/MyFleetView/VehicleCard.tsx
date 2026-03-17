import type { Vehicle } from "@/models";
import { vehicleTypeLabels } from "@/models";

const EQUIPMENT_ITEMS = [
  { key: "hasWifi", label: "WiFi" },
  { key: "hasWC", label: "WC" },
  { key: "hasTV", label: "TV" },
  { key: "hasAirConditioning", label: "Klimatyzacja" },
  { key: "hasPowerOutlets", label: "Gniazdka" },
  { key: "hasLuggage", label: "Bagaznik" },
] as const;

export function VehicleCard({
  vehicle,
  onEdit,
  onToggle,
  onDelete,
  onPhotoClick,
}: {
  vehicle: Vehicle;
  onEdit: (v: Vehicle) => void;
  onToggle: (v: Vehicle) => void;
  onDelete: (id: string) => void;
  onPhotoClick: (photos: string[], index: number) => void;
}) {
  const equipment = EQUIPMENT_ITEMS.filter((item) => vehicle[item.key as keyof Vehicle]);

  return (
    <div className={`rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden transition-opacity ${!vehicle.isActive ? "opacity-50" : ""}`}>
      {/* Zdjecia */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
            {vehicleTypeLabels[vehicle.type]}
          </span>
          <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
            vehicle.isActive
              ? "bg-brand-50 text-brand-700 border-brand-100"
              : "bg-gray-100 text-gray-500 border-gray-200"
          }`}>
            {vehicle.isActive ? "Aktywny" : "Nieaktywny"}
          </span>
        </div>
        <div className="flex gap-2">
          {vehicle.photos && vehicle.photos.length > 0 ? (
            vehicle.photos.map((photo, index) => (
              <button
                key={index}
                onClick={() => onPhotoClick(vehicle.photos, index)}
                className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer ring-1 ring-gray-200"
              >
                <img src={photo} alt={`${vehicle.name} ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))
          ) : (
            <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center ring-1 ring-gray-200">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Dane */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{vehicle.name}</h3>
        <p className="text-sm text-gray-500 mb-3">
          {vehicle.brand} {vehicle.model} ({vehicle.year})
        </p>

        <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            {vehicle.seats} miejsc
          </span>
          <span className="text-gray-300">·</span>
          <span>{vehicle.licensePlate}</span>
          {vehicle.color && (
            <>
              <span className="text-gray-300">·</span>
              <span>{vehicle.color}</span>
            </>
          )}
        </div>

        {equipment.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {equipment.map((item) => (
              <span key={item.key} className="px-2 py-0.5 rounded-md text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100">
                {item.label}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={() => onEdit(vehicle)}
            className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Edytuj
          </button>
          <button
            onClick={() => onToggle(vehicle)}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              vehicle.isActive
                ? "text-amber-700 bg-amber-50 hover:bg-amber-100"
                : "text-brand-700 bg-brand-50 hover:bg-brand-100"
            }`}
          >
            {vehicle.isActive ? "Dezaktywuj" : "Aktywuj"}
          </button>
          <button
            onClick={() => onDelete(vehicle.id)}
            className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
