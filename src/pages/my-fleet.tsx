import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import type { Vehicle, CreateVehicleData, VehicleType } from "@/models";
import { vehicleTypeLabels } from "@/models";

export default function MyFleet() {
  const { data: session, status } = useSession();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<CreateVehicleData>({
    name: "",
    type: "bus",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    seats: 1,
    licensePlate: "",
    color: "",
    description: "",
    photos: [],
    hasWifi: false,
    hasWC: false,
    hasTV: false,
    hasAirConditioning: false,
    hasPowerOutlets: false,
    hasLuggage: false,
  });

  useEffect(() => {
    if (session) {
      fetchVehicles();
    } else {
      setLoading(false);
    }
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
      name: "",
      type: "bus",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      seats: 1,
      licensePlate: "",
      color: "",
      description: "",
      photos: [],
      hasWifi: false,
      hasWC: false,
      hasTV: false,
      hasAirConditioning: false,
      hasPowerOutlets: false,
      hasLuggage: false,
    });
    setEditingVehicle(null);
    setError("");
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      name: vehicle.name,
      type: vehicle.type,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      seats: vehicle.seats,
      licensePlate: vehicle.licensePlate,
      color: vehicle.color,
      description: vehicle.description || "",
      photos: vehicle.photos || [],
      hasWifi: vehicle.hasWifi,
      hasWC: vehicle.hasWC,
      hasTV: vehicle.hasTV,
      hasAirConditioning: vehicle.hasAirConditioning,
      hasPowerOutlets: vehicle.hasPowerOutlets,
      hasLuggage: vehicle.hasLuggage,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const url = "/api/vehicles";
      const method = editingVehicle ? "PUT" : "POST";
      const body = editingVehicle
        ? { id: editingVehicle.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Blad podczas zapisywania");
        return;
      }

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
      const res = await fetch(`/api/vehicles?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDeleteConfirm(null);
        fetchVehicles();
      }
    } catch (error) {
      console.error("Error deleting vehicle:", error);
    }
  };

  const toggleActive = async (vehicle: Vehicle) => {
    try {
      await fetch("/api/vehicles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: vehicle.id,
          isActive: !vehicle.isActive,
        }),
      });
      fetchVehicles();
    } catch (error) {
      console.error("Error toggling vehicle:", error);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Konwertuj zdjecia do base64 (w produkcji lepiej uzywac cloud storage)
    Array.from(files).forEach((file) => {
      if (formData.photos && formData.photos.length >= 5) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setFormData((prev) => ({
          ...prev,
          photos: [...(prev.photos || []), base64].slice(0, 5),
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos?.filter((_, i) => i !== index) || [],
    }));
  };

  if (status === "loading" || loading) {
    return (
      <main className="py-8 px-4 max-w-[1250px] mx-auto">
        <p className="text-gray-500">Ladowanie...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="py-8 px-4 max-w-[1250px] mx-auto">
        <div className="bg-white rounded-lg p-12 text-center">
          <h1 className="text-2xl font-semibold mb-4">Moja flota</h1>
          <p className="text-gray-500">Zaloguj sie, aby zarzadzac swoimi pojazdami.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="py-8 px-4 max-w-[1250px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Moja flota</h1>
          <p className="text-gray-500">
            Zarzadzaj swoimi pojazdami. Dodaj samochody, autobusy i inne pojazdy, ktorymi realizujesz zlecenia.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Dodaj pojazd
        </button>
      </div>

      {/* Vehicles grid */}
      {vehicles.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Brak pojazdow</h3>
          <p className="text-gray-500 mb-6">Dodaj swoj pierwszy pojazd, aby moc go wybierac przy skladaniu ofert.</p>
          <button
            onClick={openAddModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Dodaj pierwszy pojazd
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className={`bg-white rounded-lg overflow-hidden border ${
                vehicle.isActive ? "border-slate-200" : "border-slate-200 opacity-60"
              }`}
            >
              {/* Photo */}
              <div className="h-40 bg-slate-100 relative">
                {vehicle.photos && vehicle.photos.length > 0 ? (
                  <img
                    src={vehicle.photos[0]}
                    alt={vehicle.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                {/* Status badge */}
                <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${
                  vehicle.isActive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}>
                  {vehicle.isActive ? "Aktywny" : "Nieaktywny"}
                </div>
                {/* Type badge */}
                <div className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium bg-white/90 text-slate-700">
                  {vehicleTypeLabels[vehicle.type]}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">{vehicle.name}</h3>
                <p className="text-sm text-gray-500 mb-2">
                  {vehicle.brand} {vehicle.model} ({vehicle.year})
                </p>
                <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {vehicle.seats} miejsc
                  </span>
                  <span>{vehicle.licensePlate}</span>
                </div>

                {/* Equipment */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {vehicle.hasWifi && (
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">WiFi</span>
                  )}
                  {vehicle.hasWC && (
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">WC</span>
                  )}
                  {vehicle.hasTV && (
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">TV</span>
                  )}
                  {vehicle.hasAirConditioning && (
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">Klimatyzacja</span>
                  )}
                  {vehicle.hasPowerOutlets && (
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">Gniazdka</span>
                  )}
                  {vehicle.hasLuggage && (
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">Bagaznik</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(vehicle)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Edytuj
                  </button>
                  <button
                    onClick={() => toggleActive(vehicle)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      vehicle.isActive
                        ? "text-amber-700 bg-amber-50 hover:bg-amber-100"
                        : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                    }`}
                  >
                    {vehicle.isActive ? "Dezaktywuj" : "Aktywuj"}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(vehicle.id)}
                    className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {editingVehicle ? "Edytuj pojazd" : "Dodaj nowy pojazd"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
              )}

              {/* Basic info */}
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-3">Podstawowe informacje</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Nazwa pojazdu *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="np. Mercedes Sprinter Premium"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Typ pojazdu *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as VehicleType })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    >
                      {Object.entries(vehicleTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Marka *</label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="np. Mercedes"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Model *</label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="np. Sprinter"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Rok produkcji</label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      min="1990"
                      max={new Date().getFullYear() + 1}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Liczba miejsc *</label>
                    <input
                      type="number"
                      value={formData.seats}
                      onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })}
                      min="1"
                      max="100"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Numer rejestracyjny *</label>
                    <input
                      type="text"
                      value={formData.licensePlate}
                      onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                      placeholder="np. WA 12345"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Kolor</label>
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="np. Bialy"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-slate-600 mb-1">Opis (opcjonalnie)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Dodatkowe informacje o pojezdzie..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Equipment */}
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-3">Wyposazenie</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: "hasWifi", label: "WiFi" },
                    { key: "hasWC", label: "WC" },
                    { key: "hasTV", label: "TV" },
                    { key: "hasAirConditioning", label: "Klimatyzacja" },
                    { key: "hasPowerOutlets", label: "Gniazdka elektryczne" },
                    { key: "hasLuggage", label: "Bagaznik" },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData[item.key as keyof CreateVehicleData]
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData[item.key as keyof CreateVehicleData] as boolean}
                        onChange={(e) =>
                          setFormData({ ...formData, [item.key]: e.target.checked })
                        }
                        className="sr-only"
                      />
                      <span
                        className={`w-5 h-5 rounded border flex items-center justify-center ${
                          formData[item.key as keyof CreateVehicleData]
                            ? "bg-emerald-500 border-emerald-500"
                            : "border-slate-300"
                        }`}
                      >
                        {formData[item.key as keyof CreateVehicleData] && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </span>
                      <span className="text-sm text-slate-700">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Photos */}
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-3">
                  Zdjecia (max 5)
                </h3>
                <div className="grid grid-cols-5 gap-3">
                  {formData.photos?.map((photo, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100">
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {(!formData.photos || formData.photos.length < 5) && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-slate-200 hover:border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-slate-500 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-xs mt-1">Dodaj</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? "Zapisywanie..." : editingVehicle ? "Zapisz zmiany" : "Dodaj pojazd"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Usunac pojazd?</h3>
            <p className="text-sm text-slate-600 mb-6">
              Czy na pewno chcesz usunac ten pojazd? Tej operacji nie mozna cofnac.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Usun
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
