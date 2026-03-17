import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import type { Vehicle, CreateVehicleData } from "@/models";
import { VehicleCard } from "./VehicleCard";
import { VehicleFormModal } from "./VehicleFormModal";

const INITIAL_FORM: CreateVehicleData = {
  name: "", type: "bus", brand: "", model: "",
  year: new Date().getFullYear(), seats: 1,
  licensePlate: "", color: "", description: "", fuelConsumption: undefined, photos: [],
  hasWifi: false, hasWC: false, hasTV: false,
  hasAirConditioning: false, hasPowerOutlets: false, hasLuggage: false,
};

export default function MyFleetView() {
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
  const [formData, setFormData] = useState<CreateVehicleData>(INITIAL_FORM);

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
    setFormData(INITIAL_FORM);
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
      description: vehicle.description || "", fuelConsumption: vehicle.fuelConsumption, photos: vehicle.photos || [],
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
      const updatedPhotos = [...(formData.photos || [])];
      for (let i = 0; i < updatedPhotos.length; i++) {
        const photo = updatedPhotos[i];
        if (photo.startsWith("data:")) {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: photo }),
          });
          if (res.ok) {
            const data = await res.json();
            updatedPhotos[i] = data.url;
            setFormData((prev) => {
              const photos = [...(prev.photos || [])];
              photos[i] = data.url;
              return { ...prev, photos };
            });
            uploadedPhotos.push(data.url);
          } else {
            throw new Error("Blad uploadu zdjecia");
          }
        } else {
          uploadedPhotos.push(photo);
        }
      }

      const method = editingVehicle ? "PUT" : "POST";
      const autoName = `${formData.brand} ${formData.model}`.trim();
      const body = editingVehicle
        ? { id: editingVehicle.id, ...formData, name: autoName, photos: uploadedPhotos }
        : { ...formData, name: autoName, photos: uploadedPhotos };

      const res = await fetch("/api/vehicles", {
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

  const lightboxPrev = () => { if (lightbox) setLightbox({ ...lightbox, index: (lightbox.index - 1 + lightbox.photos.length) % lightbox.photos.length }); };
  const lightboxNext = () => { if (lightbox) setLightbox({ ...lightbox, index: (lightbox.index + 1) % lightbox.photos.length }); };

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
      <div className="space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Flota</p>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Moja flota</h1>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Dodaj pojazd
          </button>
        </div>

        {vehicles.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-16 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">Brak pojazdów w flocie</p>
            <p className="text-xs text-gray-400 mb-4">Dodaj pierwszy pojazd, aby móc go wybierać przy składaniu ofert.</p>
            <button onClick={openAddModal} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
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
                onPhotoClick={(photos, index) => setLightbox({ photos, index })}
              />
            ))}
          </div>
        )}
      </div>

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

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative w-full max-w-sm mx-4 rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-50">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Usunąć pojazd?</h3>
                <p className="text-sm text-gray-500">Tej operacji nie można cofnąć.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors">Anuluj</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-sm font-medium text-white transition-colors">Usuń</button>
            </div>
          </div>
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60]" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          {lightbox.photos.length > 1 && (
            <button onClick={(e) => { e.stopPropagation(); lightboxPrev(); }} className="absolute left-4 p-2 text-white/50 hover:text-white transition-colors">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}
          <img src={lightbox.photos[lightbox.index]} alt="" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
          {lightbox.photos.length > 1 && (
            <button onClick={(e) => { e.stopPropagation(); lightboxNext(); }} className="absolute right-4 p-2 text-white/50 hover:text-white transition-colors">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
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
