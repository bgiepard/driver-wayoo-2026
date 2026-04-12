import type { Vehicle } from "@/models";
import { vehicleTypeLabels } from "@/models";

const MAX_PHOTOS = 3;

const AMENITY_ICONS: { key: keyof Vehicle; icon: React.ReactNode }[] = [
  {
    key: "hasWifi",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
      </svg>
    ),
  },
  {
    key: "hasPowerOutlets",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    key: "hasTV",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
  {
    key: "hasAirConditioning",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
  },
  {
    key: "hasWC",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
      </svg>
    ),
  },
  {
    key: "hasLuggage",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.073c0 .62-.504 1.125-1.125 1.125H4.875A1.125 1.125 0 013.75 18.223V14.15M16.5 6V4.5A1.5 1.5 0 0015 3h-6a1.5 1.5 0 00-1.5 1.5V6m7.5 0H6m13.5 0a2.25 2.25 0 012.25 2.25v2.625a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 10.875V8.25A2.25 2.25 0 014.5 6h15z" />
      </svg>
    ),
  },
];

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
  const photos = vehicle.photos || [];
  const visiblePhotos = photos.slice(0, MAX_PHOTOS);
  const extraCount = photos.length - MAX_PHOTOS;

  const subtitle = [
    vehicleTypeLabels[vehicle.type],
    vehicle.seats ? `${vehicle.seats} miejsc` : null,
    vehicle.color || null,
    vehicle.year ? String(vehicle.year) : null,
  ].filter(Boolean).join(" · ");

  const activeAmenities = AMENITY_ICONS.filter((a) => vehicle[a.key]);

  return (
    <div className={`bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden transition-opacity ${!vehicle.isActive ? "opacity-50" : ""}`}>

      {/* Nagłówek */}
      <div className="px-4 pt-4 pb-3">
        <h3 className="text-[15px] font-semibold text-[#0f172a] leading-snug">{vehicle.name}</h3>
        <p className="text-[13px] text-[#94a3b8] mt-0.5">{subtitle}</p>
      </div>

      {/* Zdjęcia */}
      <div className="px-4 pb-3">
        <div className="flex gap-2">
          {photos.length === 0 ? (
            <div className="w-[72px] h-[72px] rounded-xl bg-[#f1f5f9] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[#94a3b8]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
          ) : (
            <>
              {visiblePhotos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => onPhotoClick(photos, index)}
                  className="w-[72px] h-[72px] rounded-xl overflow-hidden bg-[#f1f5f9] shrink-0 hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <img src={photo} alt={`${vehicle.name} ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
              {extraCount > 0 && (
                <button
                  onClick={() => onPhotoClick(photos, MAX_PHOTOS)}
                  className="w-[72px] h-[72px] rounded-xl bg-[#0f172a] shrink-0 flex items-center justify-center hover:bg-[#1e293b] transition-colors cursor-pointer"
                >
                  <span className="text-white text-[14px] font-semibold">+{extraCount}</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tablica + ikony */}
      <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
        {vehicle.licensePlate && (
          <span className="text-[12px] font-medium text-[#475569] border border-[#e2e8f0] rounded px-2 py-0.5 shrink-0">
            {vehicle.licensePlate}
          </span>
        )}
        {activeAmenities.map((a) => (
          <div key={String(a.key)} className="w-[26px] h-[26px] flex items-center justify-center rounded border border-[#e2e8f0] text-[#94a3b8]">
            {a.icon}
          </div>
        ))}
      </div>

      {/* Akcje */}
      <div className="px-4 pb-4 pt-3 border-t border-[#f1f5f9] flex items-center gap-2">
        {/* Toggle */}
        <button
          onClick={() => onToggle(vehicle)}
          className="flex items-center gap-2 shrink-0"
        >
          <div className={`relative w-9 h-5 rounded-full transition-colors ${vehicle.isActive ? "bg-[#0b298f]" : "bg-[#cbd5e1]"}`}>
            <div className={`absolute top-[3px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform ${vehicle.isActive ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
          </div>
          <span className="text-[13px] font-medium text-[#475569] whitespace-nowrap">
            {vehicle.isActive ? "Dezaktywuj" : "Aktywuj"}
          </span>
        </button>

        <div className="flex-1" />

        {/* Edytuj */}
        <button
          onClick={() => onEdit(vehicle)}
          className="px-4 py-1.5 text-[13px] font-semibold text-[#0b298f] border border-[#0b298f] rounded-xl hover:bg-[#f0f4ff] transition-colors"
        >
          Edytuj
        </button>

        {/* Usuń */}
        <button
          onClick={() => onDelete(vehicle.id)}
          className="w-[34px] h-[34px] flex items-center justify-center border border-[#fca5a5] rounded-xl text-[#ef4444] hover:bg-[#fef2f2] transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
