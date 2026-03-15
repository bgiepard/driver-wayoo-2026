import type { Vehicle, CreateVehicleData } from "@/models";
import { brandNames, getModelsForBrand } from "@/data/vehicleBrands";

const EQUIPMENT_ITEMS = [
  { key: "hasWifi", label: "WiFi" },
  { key: "hasWC", label: "WC" },
  { key: "hasTV", label: "TV" },
  { key: "hasAirConditioning", label: "Klimatyzacja" },
  { key: "hasPowerOutlets", label: "Gniazdka" },
  { key: "hasLuggage", label: "Bagaznik" },
] as const;

const COLORS = ["Biały", "Biały perłowy", "Kremowy", "Kość słoniowa", "Czarny", "Czarny metalik", "Srebrny", "Srebrny metalik", "Szary", "Szary metalik", "Grafitowy", "Antracytowy", "Czerwony", "Czerwony metalik", "Bordowy", "Karminowy", "Niebieski", "Niebieski metalik", "Granatowy", "Błękitny", "Zielony", "Zielony metalik", "Ciemnozielony", "Oliwkowy", "Żółty", "Pomarańczowy", "Brązowy", "Brązowy metalik", "Beżowy", "Piaskowy", "Złoty", "Złoty metalik", "Miedziany", "Titanowy", "Fioletowy", "Purpurowy", "Różowy", "Chameleon"];

const INPUT_CLASS = "w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-colors";
const DROPDOWN_CLASS = "absolute z-50 w-full mt-1 rounded-xl border border-white/[0.08] bg-gray-900 shadow-2xl max-h-48 overflow-y-auto custom-scrollbar";
const DROPDOWN_ITEM_CLASS = "px-4 py-2.5 text-sm cursor-pointer text-gray-300 hover:bg-white/[0.06] hover:text-white transition-colors";

export function VehicleFormModal({
  editingVehicle, formData, setFormData, error, submitting,
  showBrandDropdown, setShowBrandDropdown,
  showModelDropdown, setShowModelDropdown,
  showColorDropdown, setShowColorDropdown,
  dragIndex, fileInputRef,
  onSubmit, onClose, onPhotoUpload, onRemovePhoto, onMovePhoto,
  onDragStart, onDragOver, onDragEnd,
}: {
  editingVehicle: Vehicle | null;
  formData: CreateVehicleData;
  setFormData: React.Dispatch<React.SetStateAction<CreateVehicleData>>;
  error: string;
  submitting: boolean;
  showBrandDropdown: boolean;
  setShowBrandDropdown: (v: boolean) => void;
  showModelDropdown: boolean;
  setShowModelDropdown: (v: boolean) => void;
  showColorDropdown: boolean;
  setShowColorDropdown: (v: boolean) => void;
  dragIndex: number | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: (index: number) => void;
  onMovePhoto: (from: number, to: number) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-4 rounded-2xl border border-white/[0.08] bg-gray-900 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-500/10">
              <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {editingVehicle ? "Edytuj pojazd" : "Dodaj nowy pojazd"}
            </h2>
          </div>
          <button onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="overflow-y-auto flex-1 custom-scrollbar">
          <div className="px-6 py-5 space-y-6">
            {error && (
              <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-error-500/10 border border-error-500/20">
                <svg className="w-4 h-4 text-error-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span className="text-sm text-error-400">{error}</span>
              </div>
            )}

            {/* Podstawowe info */}
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Podstawowe informacje</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {/* Marka */}
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Marka *</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value, model: "" })}
                    onFocus={() => setShowBrandDropdown(true)}
                    onBlur={() => setTimeout(() => setShowBrandDropdown(false), 150)}
                    placeholder="np. Mercedes-Benz"
                    className={INPUT_CLASS}
                    required
                  />
                  {showBrandDropdown && (() => {
                    const filtered = brandNames.filter(b => b.toLowerCase().includes(formData.brand.toLowerCase()));
                    return filtered.length > 0 ? (
                      <ul className={DROPDOWN_CLASS}>
                        {filtered.map((b) => (
                          <li key={b} onMouseDown={() => { setFormData({ ...formData, brand: b, model: "" }); setShowBrandDropdown(false); }} className={DROPDOWN_ITEM_CLASS}>{b}</li>
                        ))}
                      </ul>
                    ) : null;
                  })()}
                </div>
                {/* Model */}
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Model *</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    onFocus={() => setShowModelDropdown(true)}
                    onBlur={() => setTimeout(() => setShowModelDropdown(false), 150)}
                    placeholder={formData.brand ? `np. model ${formData.brand}` : "Najpierw wybierz marke"}
                    className={INPUT_CLASS}
                    required
                  />
                  {showModelDropdown && (() => {
                    const models = getModelsForBrand(formData.brand);
                    const filtered = models.filter(m => m.toLowerCase().includes(formData.model.toLowerCase()));
                    return filtered.length > 0 ? (
                      <ul className={DROPDOWN_CLASS}>
                        {filtered.map((m) => (
                          <li key={m} onMouseDown={() => { setFormData({ ...formData, model: m }); setShowModelDropdown(false); }} className={DROPDOWN_ITEM_CLASS}>{m}</li>
                        ))}
                      </ul>
                    ) : null;
                  })()}
                </div>
                {/* Rok */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Rok produkcji</label>
                  <input type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })} min="1990" max={new Date().getFullYear() + 1} className={INPUT_CLASS} />
                </div>
                {/* Miejsca */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Liczba miejsc *</label>
                  <input type="number" value={formData.seats} onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })} min="1" max="100" className={INPUT_CLASS} required />
                </div>
                {/* Rejestracja */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Numer rejestracyjny *</label>
                  <input type="text" value={formData.licensePlate} onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })} placeholder="np. WA 12345" className={INPUT_CLASS} required />
                </div>
                {/* Kolor */}
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Kolor</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    onFocus={() => setShowColorDropdown(true)}
                    onBlur={() => setTimeout(() => setShowColorDropdown(false), 150)}
                    placeholder="np. Bialy"
                    className={INPUT_CLASS}
                  />
                  {showColorDropdown && (() => {
                    const filtered = COLORS.filter(c => c.toLowerCase().includes(formData.color.toLowerCase()));
                    return filtered.length > 0 ? (
                      <ul className={DROPDOWN_CLASS}>
                        {filtered.map((c) => (
                          <li key={c} onMouseDown={() => { setFormData({ ...formData, color: c }); setShowColorDropdown(false); }} className={DROPDOWN_ITEM_CLASS}>{c}</li>
                        ))}
                      </ul>
                    ) : null;
                  })()}
                </div>
              </div>
            </div>

            {/* Opis */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Opis (opcjonalnie)</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Dodatkowe informacje o pojezdzie..." rows={3} className={`${INPUT_CLASS} resize-none`} />
            </div>

            {/* Srednie spalanie */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Średnie spalanie (opcjonalnie)</label>
              <div className="relative">
                <input type="number" value={formData.fuelConsumption ?? ""} onChange={(e) => setFormData({ ...formData, fuelConsumption: e.target.value ? parseFloat(e.target.value) : undefined })} placeholder="np. 8.5" min="0" max="100" step="0.1" className={INPUT_CLASS} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">l/100km</span>
              </div>
            </div>

            {/* Wyposazenie */}
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Wyposazenie</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {EQUIPMENT_ITEMS.map((item) => {
                  const checked = formData[item.key as keyof CreateVehicleData] as boolean;
                  return (
                    <label key={item.key} className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${checked ? "border-brand-500/30 bg-brand-500/10" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"}`}>
                      <input type="checkbox" checked={checked} onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })} className="sr-only" />
                      <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${checked ? "bg-brand-500 border-brand-500" : "border-white/[0.15]"}`}>
                        {checked && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </span>
                      <span className={`text-sm ${checked ? "text-white" : "text-gray-400"}`}>{item.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Zdjecia */}
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Zdjecia (max 5)</h3>
              <p className="text-xs text-gray-600 mb-3">Przeciagnij aby zmienic kolejnosc. Pierwsze zdjecie bedzie glowne.</p>
              <div className="grid grid-cols-5 gap-3">
                {formData.photos?.map((photo, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={() => onDragStart(index)}
                    onDragOver={(e) => onDragOver(e, index)}
                    onDragEnd={onDragEnd}
                    className={`relative aspect-square rounded-xl overflow-hidden bg-white/[0.04] cursor-move group ring-1 ${dragIndex === index ? "opacity-50 ring-brand-500" : index === 0 ? "ring-brand-500" : "ring-white/[0.06]"}`}
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                    {index === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-brand-500 text-white text-[10px] font-medium text-center py-0.5">Glowne</div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                    <button type="button" onClick={() => onRemovePhoto(index)} className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {index > 0 && (
                        <button type="button" onClick={() => onMovePhoto(index, index - 1)} className="p-1 bg-black/50 hover:bg-black/70 rounded text-white">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                      )}
                      {index < (formData.photos?.length || 0) - 1 && (
                        <button type="button" onClick={() => onMovePhoto(index, index + 1)} className="p-1 bg-black/50 hover:bg-black/70 rounded text-white">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {(!formData.photos || formData.photos.length < 5) && (
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-white/[0.08] hover:border-white/[0.15] flex flex-col items-center justify-center text-gray-600 hover:text-gray-400 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    <span className="text-xs mt-1">Dodaj</span>
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={onPhotoUpload} className="hidden" />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3 shrink-0">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-sm font-medium text-gray-300 transition-colors">Anuluj</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-sm font-semibold text-white transition-colors disabled:opacity-40">
              {submitting ? "Zapisywanie..." : editingVehicle ? "Zapisz zmiany" : "Dodaj pojazd"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
