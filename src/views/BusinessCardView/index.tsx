import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import type { Vehicle, OfferWithRequest } from "@/models";
import { vehicleTypeLabels } from "@/models";

interface CardData {
  companyName: string;
  phone: string;
  email: string;
  city: string;
  tagline: string;
  website: string;
  region: string;
  experience: string;
  languages: string;
  facebook: string;
  instagram: string;
  bio: string;
}

const EMPTY_CARD: CardData = {
  companyName: "", phone: "", email: "", city: "", tagline: "",
  website: "", region: "", experience: "", languages: "Polski",
  facebook: "", instagram: "", bio: "",
};

const STORAGE_KEY = "wayoo_business_card";

// ── Ikony wyposażenia ──────────────────────────────────────────────────────────

const IconWifi = () => (
  <svg className="w-3.5 h-3.5 text-[#475569]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
  </svg>
);
const IconWC = () => (
  <svg className="w-3.5 h-3.5 text-[#475569]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
  </svg>
);
const IconTV = () => (
  <svg className="w-3.5 h-3.5 text-[#475569]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z" />
  </svg>
);
const IconAC = () => (
  <svg className="w-3.5 h-3.5 text-[#475569]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);
const IconPower = () => (
  <svg className="w-3.5 h-3.5 text-[#475569]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);
const IconLuggage = () => (
  <svg className="w-3.5 h-3.5 text-[#475569]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
  </svg>
);

function VehicleAmenityTag({ icon }: { icon: React.ReactNode }) {
  return (
    <div className="bg-[#f1f5f9] border border-[#e2e8f0] w-[26px] h-[26px] flex items-center justify-center rounded">
      {icon}
    </div>
  );
}

const INPUT_CLASS = "w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-[14px] text-[#0f172a] placeholder-[#94a3b8] outline-none focus:border-[#0b298f] transition-colors";

export default function BusinessCardView() {
  const { data: session, status } = useSession();
  const [editing, setEditing] = useState(false);
  const [card, setCard] = useState<CardData>(EMPTY_CARD);
  const [draft, setDraft] = useState<CardData>(EMPTY_CARD);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [completedTrips, setCompletedTrips] = useState(0);

  // Wczytaj wizytówkę z localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CardData;
        setCard(parsed);
        setDraft(parsed);
      }
    } catch { /* ignore */ }
  }, []);

  // Uzupełnij email z sesji jeśli brak
  useEffect(() => {
    if (session?.user?.email && !card.email) {
      setCard((prev) => ({ ...prev, email: session.user!.email! }));
      setDraft((prev) => ({ ...prev, email: session.user!.email! }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Pobierz pojazdy i ukończone przejazdy
  useEffect(() => {
    if (!session) return;
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then((data) => setVehicles(Array.isArray(data) ? data : []))
      .catch(() => {});
    fetch("/api/offers?limit=200")
      .then((r) => r.json())
      .then((data) => {
        const paid = (data.offers as OfferWithRequest[] || []).filter((o) => o.status === "paid");
        setCompletedTrips(paid.length);
      })
      .catch(() => {});
  }, [session]);

  const handleSave = () => {
    setCard(draft);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(card);
    setEditing(false);
  };

  const set = (key: keyof CardData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft((prev) => ({ ...prev, [key]: e.target.value }));

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0b298f] border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="rounded-2xl border border-[#e2e8f0] bg-white p-12 text-center">
        <p className="text-sm text-[#475569]">Zaloguj się, aby zobaczyć wizytówkę.</p>
      </div>
    );
  }

  const displayName = card.companyName || session.user?.name || "Twoja firma";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const activeVehicles = vehicles.filter((v) => v.isActive);

  return (
    <div className="flex flex-col gap-4 max-w-[700px] mx-auto w-full">

      {/* Tytuł + przycisk */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[#0f172a] text-[18px] font-semibold leading-snug">Moja wizytówka</h1>
        {!editing && (
          <button
            onClick={() => { setDraft(card); setEditing(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#0b298f] text-[14px] font-semibold text-[#0b298f] hover:bg-[#e0e7ff] transition-colors"
          >
            Edytuj wizytówkę
          </button>
        )}
      </div>

      {/* Formularz edycji */}
      {editing && (
        <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e2e8f0]">
            <h2 className="text-[13px] font-semibold text-[#475569] uppercase tracking-wider">Edytuj wizytówkę</h2>
          </div>
          <div className="p-6 flex flex-col gap-4">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-[#475569] mb-1.5">Nazwa firmy</label>
                <input type="text" value={draft.companyName} onChange={set("companyName")} placeholder={session.user?.name ?? "np. GTV Bus"} className={INPUT_CLASS} />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#475569] mb-1.5">Miasto</label>
                <input type="text" value={draft.city} onChange={set("city")} placeholder="np. Warszawa" className={INPUT_CLASS} />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#475569] mb-1.5">Telefon</label>
                <input type="tel" value={draft.phone} onChange={set("phone")} placeholder="+48 000 000 000" className={INPUT_CLASS} />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#475569] mb-1.5">E-mail kontaktowy</label>
                <input type="email" value={draft.email} onChange={set("email")} placeholder={session.user?.email ?? "kontakt@firma.pl"} className={INPUT_CLASS} />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#475569] mb-1.5">Strona www</label>
                <input type="text" value={draft.website} onChange={set("website")} placeholder="www.firma.pl" className={INPUT_CLASS} />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#475569] mb-1.5">Obszar działania</label>
                <input type="text" value={draft.region} onChange={set("region")} placeholder="np. Polska, Europa" className={INPUT_CLASS} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[12px] font-medium text-[#475569] mb-1.5">O firmie</label>
                <textarea value={draft.bio} onChange={set("bio")} placeholder="Krótki opis działalności..." rows={3} className={`${INPUT_CLASS} resize-none`} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-lg bg-[#0b298f] hover:bg-[#0a2070] text-white text-[14px] font-semibold transition-colors">
                Zapisz
              </button>
              <button onClick={handleCancel} className="px-5 py-2.5 rounded-lg border border-[#e2e8f0] text-[14px] font-medium text-[#475569] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition-colors">
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Karta wizytówki */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden">

        {/* Cover photo */}
        <div className="h-[160px] bg-gradient-to-br from-[#0b298f] via-[#1D3FD1] to-[#4f6ef7] relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #ffc428 0%, transparent 60%)" }} />
        </div>

        {/* Avatar + nazwa */}
        <div className="px-6 pb-6">
          <div className="flex items-end gap-5 -mt-[52px] mb-5">
            <div className="w-[104px] h-[104px] rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center shrink-0 overflow-hidden relative z-10">
              <span className="text-[32px] font-bold text-[#0b298f] select-none">{initials}</span>
            </div>
            <div className="pb-1 min-w-0">
              <p className="text-[18px] font-semibold text-[#0f172a] leading-snug truncate">{displayName}</p>
              {card.city && (
                <p className="text-[15px] font-medium text-[#475569] mt-0.5">{card.city}</p>
              )}
              {card.bio && (
                <p className="text-[13px] text-[#475569] mt-1 leading-relaxed">{card.bio}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">

            {/* Kontakt */}
            {(card.phone || card.email) && (
              <div className="border border-[#e2e8f0] rounded-lg overflow-hidden">
                {card.phone && (
                  <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
                    <span className="text-[12px] font-medium text-[#475569]">Numer telefonu</span>
                    <a href={`tel:${card.phone}`} className="text-[14px] font-semibold text-[#0b298f] underline underline-offset-2">
                      {card.phone}
                    </a>
                  </div>
                )}
                {card.email && (
                  <div className="flex items-center justify-between px-6 py-4">
                    <span className="text-[12px] font-medium text-[#475569]">Adres e-mail</span>
                    <a href={`mailto:${card.email}`} className="text-[14px] font-semibold text-[#0b298f] underline underline-offset-2">
                      {card.email}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Statystyki */}
            <div className="flex gap-4">
              <div className="flex-1 bg-white border border-[#e2e8f0] rounded-lg overflow-hidden">
                <div className="bg-[#f1f5f9] border-b border-[#e2e8f0] px-6 py-3 flex items-center justify-between">
                  <span className="text-[14px] font-medium text-[#475569]">Dostępne pojazdy</span>
                  <span className="text-[18px] font-medium text-[#0f172a]">{activeVehicles.length}</span>
                </div>
              </div>
              <div className="flex-1 bg-white border border-[#e2e8f0] rounded-lg overflow-hidden">
                <div className="bg-[#f1f5f9] border-b border-[#e2e8f0] px-6 py-3 flex items-center justify-between">
                  <span className="text-[14px] font-medium text-[#475569]">Zrealizowane przejazdy</span>
                  <span className="text-[18px] font-medium text-[#0f172a]">{completedTrips}</span>
                </div>
              </div>
            </div>

            {/* Flota pojazdów */}
            {activeVehicles.length > 0 && (
              <div className="border border-[#e2e8f0] rounded-lg overflow-hidden">
                <div className="bg-[#f1f5f9] border-b border-[#e2e8f0] px-6 py-4">
                  <span className="text-[14px] font-medium text-[#475569]">Flota pojazdów</span>
                </div>
                {activeVehicles.map((v, idx) => (
                  <div
                    key={v.id}
                    className={`flex items-center justify-between px-6 py-3 ${idx < activeVehicles.length - 1 ? "border-b border-[#e2e8f0]" : ""} bg-white`}
                  >
                    <div className="flex flex-col gap-[2px]">
                      <p className="text-[14px] font-medium text-[#0f172a]">{v.brand} {v.model}</p>
                      <p className="text-[12px] font-medium text-[#475569]">
                        {vehicleTypeLabels[v.type]} · {v.seats} miejsc · {v.year}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {v.hasWifi && <VehicleAmenityTag icon={<IconWifi />} />}
                      {v.hasWC && <VehicleAmenityTag icon={<IconWC />} />}
                      {v.hasTV && <VehicleAmenityTag icon={<IconTV />} />}
                      {v.hasAirConditioning && <VehicleAmenityTag icon={<IconAC />} />}
                      {v.hasPowerOutlets && <VehicleAmenityTag icon={<IconPower />} />}
                      {v.hasLuggage && <VehicleAmenityTag icon={<IconLuggage />} />}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pusty stan */}
            {!card.phone && !card.email && activeVehicles.length === 0 && !editing && (
              <div className="border border-dashed border-[#e2e8f0] rounded-xl px-6 py-10 text-center">
                <p className="text-[14px] font-medium text-[#0f172a] mb-1">Uzupełnij swoją wizytówkę</p>
                <p className="text-[13px] text-[#475569] mb-4">Klienci zobaczą Twój profil przy przeglądaniu ofert</p>
                <button
                  onClick={() => { setDraft(card); setEditing(true); }}
                  className="px-4 py-2 rounded-lg border border-[#0b298f] text-[14px] font-semibold text-[#0b298f] hover:bg-[#e0e7ff] transition-colors"
                >
                  Uzupełnij teraz
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
