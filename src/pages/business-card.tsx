import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import type { Vehicle } from "@/models";
import { vehicleTypeLabels } from "@/models";

/* ============================================
   TYPY
   ============================================ */

interface CardData {
  companyName: string;
  tagline: string;
  phone: string;
  email: string;
  website: string;
  city: string;
  region: string;
  experience: string;
  languages: string;
  facebook: string;
  instagram: string;
  bio: string;
}

const EMPTY_CARD: CardData = {
  companyName: "",
  tagline: "",
  phone: "",
  email: "",
  website: "",
  city: "",
  region: "",
  experience: "",
  languages: "Polski",
  facebook: "",
  instagram: "",
  bio: "",
};

const STORAGE_KEY = "wayoo_business_card";

const INPUT_CLASS =
  "w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-colors";

/* ============================================
   STRONA
   ============================================ */

export default function BusinessCardPage() {
  const { data: session, status } = useSession();
  const [editing, setEditing] = useState(false);
  const [card, setCard] = useState<CardData>(EMPTY_CARD);
  const [draft, setDraft] = useState<CardData>(EMPTY_CARD);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Ładuj dane z localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CardData;
        setCard(parsed);
        setDraft(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  // Uzupełnij email z sesji jeśli pusty
  useEffect(() => {
    if (session?.user?.email && !card.email) {
      setCard((prev) => ({ ...prev, email: session.user!.email! }));
      setDraft((prev) => ({ ...prev, email: session.user!.email! }));
    }
  }, [session]);

  // Pobierz pojazdy
  useEffect(() => {
    if (!session) return;
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then((data) => setVehicles(Array.isArray(data) ? data : []))
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500 text-sm">Zaloguj się, aby zobaczyć wizytówkę.</p>
      </div>
    );
  }

  const displayName = card.companyName || session.user?.name || "Twoja firma";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const activeVehicles = vehicles.filter((v) => v.isActive);
  const totalSeats = activeVehicles.reduce((s, v) => s + v.seats, 0);
  const equipmentSet = new Set<string>();
  activeVehicles.forEach((v) => {
    if (v.hasWifi) equipmentSet.add("WiFi");
    if (v.hasWC) equipmentSet.add("WC");
    if (v.hasTV) equipmentSet.add("TV");
    if (v.hasAirConditioning) equipmentSet.add("Klimatyzacja");
    if (v.hasPowerOutlets) equipmentSet.add("Gniazdka");
    if (v.hasLuggage) equipmentSet.add("Bagażnik");
  });

  return (
    <div className="max-w-[900px] mx-auto">
      {/* Nagłówek */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Profil</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">Moja wizytówka</h1>
        </div>
        {!editing && (
          <button
            onClick={() => { setDraft(card); setEditing(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] text-sm font-medium text-gray-300 hover:text-white hover:bg-white/[0.04] transition-colors mt-1 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
            </svg>
            Edytuj wizytówkę
          </button>
        )}
      </div>

      <div className={`grid gap-6 ${editing ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>

        {/* FORMULARZ EDYCJI */}
        {editing && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.05]">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Podstawowe informacje</h2>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Nazwa firmy</label>
                  <input type="text" value={draft.companyName} onChange={set("companyName")} placeholder={session.user?.name ?? "np. Transport Jan Kowalski"} className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Hasło / tagline</label>
                  <input type="text" value={draft.tagline} onChange={set("tagline")} placeholder="np. Komfortowe podróże na każdą trasę" className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">O firmie</label>
                  <textarea value={draft.bio} onChange={set("bio")} placeholder="Krótki opis działalności, doświadczenia, specjalizacji..." rows={3} className={`${INPUT_CLASS} resize-none`} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.05]">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kontakt i lokalizacja</h2>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Telefon</label>
                  <input type="tel" value={draft.phone} onChange={set("phone")} placeholder="+48 000 000 000" className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">E-mail</label>
                  <input type="email" value={draft.email} onChange={set("email")} placeholder={session.user?.email ?? "kontakt@firma.pl"} className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Strona www</label>
                  <input type="text" value={draft.website} onChange={set("website")} placeholder="www.firma.pl" className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Miasto</label>
                  <input type="text" value={draft.city} onChange={set("city")} placeholder="np. Warszawa" className={INPUT_CLASS} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Obszar działania</label>
                  <input type="text" value={draft.region} onChange={set("region")} placeholder="np. Polska, Europa Środkowa" className={INPUT_CLASS} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.05]">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dodatkowe informacje</h2>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Lata doświadczenia</label>
                  <input type="text" value={draft.experience} onChange={set("experience")} placeholder="np. 12" className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Języki</label>
                  <input type="text" value={draft.languages} onChange={set("languages")} placeholder="np. Polski, Angielski" className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Facebook</label>
                  <input type="text" value={draft.facebook} onChange={set("facebook")} placeholder="facebook.com/firma" className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Instagram</label>
                  <input type="text" value={draft.instagram} onChange={set("instagram")} placeholder="@firma" className={INPUT_CLASS} />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors">
                Zapisz wizytówkę
              </button>
              <button onClick={handleCancel} className="px-5 py-3 rounded-xl border border-white/[0.08] text-sm font-medium text-gray-300 hover:text-white hover:bg-white/[0.04] transition-colors">
                Anuluj
              </button>
            </div>
          </div>
        )}

        {/* WIZYTÓWKA — PODGLĄD */}
        <div className="space-y-4">
          {editing && (
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Podgląd</p>
          )}

          {/* Karta główna */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            {/* Baner */}
            <div className="h-24 bg-gradient-to-br from-brand-600/30 via-brand-500/10 to-transparent relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(22,163,74,0.2),transparent_60%)]" />
            </div>

            {/* Avatar + podstawowe dane */}
            <div className="px-6 pb-6">
              <div className="flex items-end gap-4 -mt-8 mb-5">
                <div className="w-16 h-16 rounded-2xl bg-brand-500/20 border-4 border-gray-950 flex items-center justify-center shrink-0">
                  <span className="text-xl font-bold text-brand-400">{initials}</span>
                </div>
              </div>

              <h2 className="text-xl font-bold text-white tracking-tight">{displayName}</h2>
              {card.tagline && (
                <p className="text-sm text-brand-400 mt-1 font-medium">{card.tagline}</p>
              )}
              {card.bio && (
                <p className="text-sm text-gray-400 mt-3 leading-relaxed">{card.bio}</p>
              )}

              {/* Statystyki */}
              <div className="grid grid-cols-3 gap-3 mt-5">
                <StatBadge value={activeVehicles.length} label="Pojazdy" />
                <StatBadge value={totalSeats} label="Miejsc" />
                <StatBadge value={card.experience ? `${card.experience} lat` : "—"} label="Doświadczenie" />
              </div>
            </div>
          </div>

          {/* Kontakt */}
          {(card.phone || card.email || card.website || card.city) && (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.05]">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kontakt</h3>
              </div>
              <div className="p-5 space-y-3">
                {card.phone && (
                  <ContactRow
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>}
                    value={card.phone}
                  />
                )}
                {card.email && (
                  <ContactRow
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>}
                    value={card.email}
                  />
                )}
                {card.website && (
                  <ContactRow
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253" /></svg>}
                    value={card.website}
                  />
                )}
                {card.city && (
                  <ContactRow
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>}
                    value={card.region ? `${card.city} · ${card.region}` : card.city}
                  />
                )}
              </div>
            </div>
          )}

          {/* Flota */}
          {activeVehicles.length > 0 && (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.05]">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Flota pojazdów</h3>
              </div>
              <div className="p-5 space-y-3">
                {activeVehicles.map((v) => (
                  <div key={v.id} className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.04] shrink-0">
                      <svg className="w-4.5 h-4.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{v.brand} {v.model}</p>
                      <p className="text-xs text-gray-500">{vehicleTypeLabels[v.type]} · {v.seats} miejsc · {v.year}</p>
                    </div>
                  </div>
                ))}
                {equipmentSet.size > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/[0.05]">
                    {Array.from(equipmentSet).map((eq) => (
                      <span key={eq} className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-gray-400">
                        {eq}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Social / języki */}
          {(card.languages || card.facebook || card.instagram) && (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 flex flex-wrap gap-3">
              {card.languages && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
                  </svg>
                  <span className="text-xs text-gray-400">{card.languages}</span>
                </div>
              )}
              {card.facebook && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="text-xs text-gray-400">{card.facebook}</span>
                </div>
              )}
              {card.instagram && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                  <span className="text-xs text-gray-400">{card.instagram}</span>
                </div>
              )}
            </div>
          )}

          {/* CTA gdy wizytówka pusta */}
          {!editing && !card.companyName && !card.phone && !card.bio && (
            <div className="rounded-2xl border border-dashed border-white/[0.08] px-6 py-10 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/[0.04] mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-400 mb-1">Uzupełnij swoją wizytówkę</p>
              <p className="text-xs text-gray-600 mb-4">Klienci zobaczą Twój profil przy przeglądaniu ofert</p>
              <button
                onClick={() => { setDraft(card); setEditing(true); }}
                className="px-4 py-2 rounded-xl bg-brand-500/15 border border-brand-500/30 text-sm font-medium text-brand-400 hover:bg-brand-500/20 transition-colors"
              >
                Uzupełnij teraz
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================
   KOMPONENTY POMOCNICZE
   ============================================ */

function StatBadge({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-3 text-center">
      <p className="text-lg font-bold text-white">{value || "—"}</p>
      <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function ContactRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-gray-500 shrink-0">{icon}</span>
      <span className="text-sm text-gray-300 truncate">{value}</span>
    </div>
  );
}
