import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import type { Vehicle, CreateVehicleData, VehicleType } from "@/models";
import { vehicleTypeLabels } from "@/models";
import { brandNames, getModelsForBrand } from "@/data/vehicleBrands";

/* ============================================
   STALE
   ============================================ */

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

/* ============================================
   STRONA
   ============================================ */

export default function MyFleet() {
  const { data: session, status } = useSession();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [lightbox, setLightbox] = useState<{ photos: string[]; index: number } | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<CreateVehicleData>({
    name: "", type: "bus", brand: "", model: "",
    year: new Date().getFullYear(), seats: 1,
    licensePlate: "", color: "", description: "", photos: [],
    hasWifi: false, hasWC: false, hasTV: false,
    hasAirConditioning: false, hasPowerOutlets: false, hasLuggage: false,
  });

  useEffect(() => {
    if (session) fetchVehicles();
    else setLoading(false);
  }, [session]);

  const fetchVehicles = async () => {
    try {
      const res = await fetch("/api/vehicles");
      const data = await res.json();
      setVehicles(data);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "", type: "bus", brand: "", model: "",
      year: new Date().getFullYear(), seats: 1,
      licensePlate: "", color: "", description: "", photos: [],
      hasWifi: false, hasWC: false, hasTV: false,
      hasAirConditioning: false, hasPowerOutlets: false, hasLuggage: false,
    });
    setEditingVehicle(null);
    setError("");
  };

  const openAddModal = () => { resetForm(); setShowModal(true); };

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      name: vehicle.name, type: vehicle.type, brand: vehicle.brand,
      model: vehicle.model, year: vehicle.year, seats: vehicle.seats,
      licensePlate: vehicle.licensePlate, color: vehicle.color,
      description: vehicle.description || "", photos: vehicle.photos || [],
      hasWifi: vehicle.hasWifi, hasWC: vehicle.hasWC, hasTV: vehicle.hasTV,
      hasAirConditioning: vehicle.hasAirConditioning,
      hasPowerOutlets: vehicle.hasPowerOutlets, hasLuggage: vehicle.hasLuggage,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const uploadedPhotos: string[] = [];
      for (const photo of formData.photos || []) {
        if (photo.startsWith("data:")) {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: photo }),
          });
          if (res.ok) {
            const data = await res.json();
            uploadedPhotos.push(data.url);
          } else {
            throw new Error("Blad uploadu zdjecia");
          }
        } else {
          uploadedPhotos.push(photo);
        }
      }

      const url = "/api/vehicles";
      const method = editingVehicle ? "PUT" : "POST";
      const body = editingVehicle
        ? { id: editingVehicle.id, ...formData, photos: uploadedPhotos }
        : { ...formData, photos: uploadedPhotos };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Blad podczas zapisywania"); return; }

      setShowModal(false);
      resetForm();
      fetchVehicles();
    } catch {
      setError("Blad podczas zapisywania pojazdu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/vehicles?id=${id}`, { method: "DELETE" });
      if (res.ok) { setDeleteConfirm(null); fetchVehicles(); }
    } catch (error) {
      console.error("Error deleting vehicle:", error);
    }
  };

  const toggleActive = async (vehicle: Vehicle) => {
    try {
      await fetch("/api/vehicles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: vehicle.id, isActive: !vehicle.isActive }),
      });
      fetchVehicles();
    } catch (error) {
      console.error("Error toggling vehicle:", error);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).slice(0, 5 - (formData.photos?.length || 0)).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setFormData((prev) => ({ ...prev, photos: [...(prev.photos || []), base64].slice(0, 5) }));
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({ ...prev, photos: prev.photos?.filter((_, i) => i !== index) || [] }));
  };

  const movePhoto = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= (formData.photos?.length || 0)) return;
    setFormData((prev) => {
      const photos = [...(prev.photos || [])];
      const [moved] = photos.splice(fromIndex, 1);
      photos.splice(toIndex, 0, moved);
      return { ...prev, photos };
    });
  };

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) { movePhoto(dragIndex, index); setDragIndex(index); }
  };
  const handleDragEnd = () => setDragIndex(null);

  const openLightbox = (photos: string[], index: number) => setLightbox({ photos, index });
  const closeLightbox = () => setLightbox(null);
  const lightboxPrev = () => { if (lightbox) setLightbox({ ...lightbox, index: (lightbox.index - 1 + lightbox.photos.length) % lightbox.photos.length }); };
  const lightboxNext = () => { if (lightbox) setLightbox({ ...lightbox, index: (lightbox.index + 1) % lightbox.photos.length }); };

  /* ============================================
     RENDER
     ============================================ */

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
        <p className="text-gray-500">Zaloguj sie, aby zarzadzac swoimi pojazdami.</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-[1100px] mx-auto">
        {/* Naglowek */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Flota</p>
            <h1 className="text-2xl font-bold text-white tracking-tight">Moja flota</h1>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Dodaj pojazd
          </button>
        </div>

        {/* Grid pojazdow */}
        {vehicles.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-16 text-center">
            <svg className="w-10 h-10 mx-auto text-gray-700 mb-4" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
            <p className="text-gray-500 mb-4">Dodaj swoj pierwszy pojazd, aby moc go wybierac przy skladaniu ofert.</p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors"
            >
              Dodaj pierwszy pojazd
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onEdit={openEditModal}
                onToggle={toggleActive}
                onDelete={(id) => setDeleteConfirm(id)}
                onPhotoClick={openLightbox}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal dodawania/edycji */}
      {showModal && (
        <VehicleFormModal
          editingVehicle={editingVehicle}
          formData={formData}
          setFormData={setFormData}
          error={error}
          submitting={submitting}
          showBrandDropdown={showBrandDropdown}
          setShowBrandDropdown={setShowBrandDropdown}
          showModelDropdown={showModelDropdown}
          setShowModelDropdown={setShowModelDropdown}
          showColorDropdown={showColorDropdown}
          setShowColorDropdown={setShowColorDropdown}
          dragIndex={dragIndex}
          fileInputRef={fileInputRef}
          onSubmit={handleSubmit}
          onClose={() => { setShowModal(false); resetForm(); }}
          onPhotoUpload={handlePhotoUpload}
          onRemovePhoto={removePhoto}
          onMovePhoto={movePhoto}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        />
      )}

      {/* Modal potwierdzenia usuwania */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative w-full max-w-sm mx-4 rounded-2xl border border-white/[0.08] bg-gray-900 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-error-500/10">
                <svg className="w-5 h-5 text-error-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Usunac pojazd?</h3>
                <p className="text-sm text-gray-500">Tej operacji nie mozna cofnac.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-sm font-medium text-gray-300 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 rounded-xl bg-error-500 hover:bg-error-600 text-sm font-medium text-white transition-colors"
              >
                Usun
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60]" onClick={closeLightbox}>
          <button onClick={closeLightbox} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {lightbox.photos.length > 1 && (
            <button onClick={(e) => { e.stopPropagation(); lightboxPrev(); }} className="absolute left-4 p-2 text-white/50 hover:text-white transition-colors">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <img src={lightbox.photos[lightbox.index]} alt="" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
          {lightbox.photos.length > 1 && (
            <button onClick={(e) => { e.stopPropagation(); lightboxNext(); }} className="absolute right-4 p-2 text-white/50 hover:text-white transition-colors">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          {lightbox.photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-black/50 text-white/70 text-sm">
              {lightbox.index + 1} / {lightbox.photos.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}

/* ============================================
   KARTA POJAZDU
   ============================================ */

function VehicleCard({
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
    <div className={`rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-opacity ${!vehicle.isActive ? "opacity-50" : ""}`}>
      {/* Zdjecia */}
      <div className="p-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/[0.06] text-gray-300 border border-white/[0.08]">
            {vehicleTypeLabels[vehicle.type]}
          </span>
          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
            vehicle.isActive
              ? "bg-brand-500/10 text-brand-400 border-brand-500/20"
              : "bg-white/[0.04] text-gray-500 border-white/[0.08]"
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
                className="w-14 h-14 rounded-lg overflow-hidden bg-white/[0.04] flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer ring-1 ring-white/[0.06]"
              >
                <img src={photo} alt={`${vehicle.name} ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))
          ) : (
            <div className="w-14 h-14 rounded-lg bg-white/[0.04] flex items-center justify-center ring-1 ring-white/[0.06]">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Dane */}
      <div className="p-4">
        <h3 className="font-semibold text-white mb-1">{vehicle.name}</h3>
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
          <span className="text-gray-600">·</span>
          <span>{vehicle.licensePlate}</span>
          {vehicle.color && (
            <>
              <span className="text-gray-600">·</span>
              <span>{vehicle.color}</span>
            </>
          )}
        </div>

        {/* Wyposazenie */}
        {equipment.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {equipment.map((item) => (
              <span key={item.key} className="px-2 py-0.5 rounded-md text-xs font-medium bg-white/[0.04] text-gray-400 border border-white/[0.06]">
                {item.label}
              </span>
            ))}
          </div>
        )}

        {/* Akcje */}
        <div className="flex gap-2 pt-3 border-t border-white/[0.06]">
          <button
            onClick={() => onEdit(vehicle)}
            className="flex-1 px-3 py-2 text-sm font-medium text-gray-300 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl transition-colors"
          >
            Edytuj
          </button>
          <button
            onClick={() => onToggle(vehicle)}
            className={`px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
              vehicle.isActive
                ? "text-warning-400 bg-warning-500/10 hover:bg-warning-500/15"
                : "text-brand-400 bg-brand-500/10 hover:bg-brand-500/15"
            }`}
          >
            {vehicle.isActive ? "Dezaktywuj" : "Aktywuj"}
          </button>
          <button
            onClick={() => onDelete(vehicle.id)}
            className="px-3 py-2 text-sm font-medium text-error-400 bg-error-500/10 hover:bg-error-500/15 rounded-xl transition-colors"
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

/* ============================================
   MODAL FORMULARZA
   ============================================ */

function VehicleFormModal({
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
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Dodatkowe informacje o pojezdzie..."
                rows={3}
                className={`${INPUT_CLASS} resize-none`}
              />
            </div>

            {/* Wyposazenie */}
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Wyposazenie</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {EQUIPMENT_ITEMS.map((item) => {
                  const checked = formData[item.key as keyof CreateVehicleData] as boolean;
                  return (
                    <label
                      key={item.key}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                        checked
                          ? "border-brand-500/30 bg-brand-500/10"
                          : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                      }`}
                    >
                      <input type="checkbox" checked={checked} onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })} className="sr-only" />
                      <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                        checked ? "bg-brand-500 border-brand-500" : "border-white/[0.15]"
                      }`}>
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
                    className={`relative aspect-square rounded-xl overflow-hidden bg-white/[0.04] cursor-move group ring-1 ${
                      dragIndex === index ? "opacity-50 ring-brand-500" : index === 0 ? "ring-brand-500" : "ring-white/[0.06]"
                    }`}
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                    {index === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-brand-500 text-white text-[10px] font-medium text-center py-0.5">
                        Glowne
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                    <button
                      type="button"
                      onClick={() => onRemovePhoto(index)}
                      className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
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
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-white/[0.08] hover:border-white/[0.15] flex flex-col items-center justify-center text-gray-600 hover:text-gray-400 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-xs mt-1">Dodaj</span>
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={onPhotoUpload} className="hidden" />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-sm font-medium text-gray-300 transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-sm font-semibold text-white transition-colors disabled:opacity-40"
            >
              {submitting ? "Zapisywanie..." : editingVehicle ? "Zapisz zmiany" : "Dodaj pojazd"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
