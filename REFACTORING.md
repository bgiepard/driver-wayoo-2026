# Analiza i plan porządkowania projektu driver-wayoo-2026

## Szybkie podsumowanie

43 pliki TypeScript, projekt działa poprawnie, ale narosło kilka problemów:
- martwy kod zajmujący miejsce
- zduplikowana logika w wielu miejscach
- duże pliki (812 linii!) trudne do edycji
- zainstalowana biblioteka ikon (`lucide-react`) której nikt nie używa

---

## 1. Martwy kod — usuń od razu

### `src/tailadmin/` — cały folder do usunięcia
Pusta struktura katalogów po niezainstalowanym szablonie TailAdmin. 13 podfolderów,
zero plików `.ts/.tsx`, zero importów w projekcie. Można usunąć bezpiecznie.

### `src/components/Footer.tsx` — nigdzie nie importowany
Komponent Footer nie jest używany na żadnej stronie. Bezpieczne do usunięcia.

### `src/components/ui/Typography.tsx` — używany tylko w jednym miejscu
Importowany wyłącznie w `zlecenia.tsx`. Wszystkie inne strony używają klas Tailwind inline.
Albo używać go wszędzie, albo usunąć i zastąpić inline klasami.

---

## 2. Zduplikowany kod — wydzielić do osobnych plików

### `STATUS_CONFIG` — dwie identyczne kopie
```
src/pages/my-offers.tsx (linie 12-33)
src/components/OfferDetailsModal.tsx (linie 10-31)
```
Identyczne obiekty z kolorami statusów (`new`, `paid`, `canceled`, `rejected`).
**Rozwiązanie:** wydzielić do `src/lib/constants.ts`

### `formatTime` — dwie identyczne funkcje
```
src/components/Header.tsx (linie 24-35)
src/pages/notifications.tsx (linie 10-22)
```
Obie konwertują milisekundy na czytelny tekst.
**Rozwiązanie:** wydzielić do `src/lib/formatters.ts`

### `INPUT_CLASS` — identyczny string w dwóch plikach
```
src/pages/my-fleet.tsx
src/pages/business-card.tsx
```
Ten sam ciąg klas Tailwind dla inputów.
**Rozwiązanie:** wydzielić do `src/lib/tailwindClasses.ts`

### Spinner ładowania — powtórzony w ~8 plikach
```tsx
<div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
```
Używany na niemal każdej stronie.
**Rozwiązanie:** stworzyć `src/components/ui/LoadingSpinner.tsx`

---

## 3. Ikonki — lucide-react jest zainstalowany, ale nieużywany

`lucide-react` jest w `package.json`, ale **zero importów w całym projekcie**.
Wszystkie ikonki to ręcznie pisane inline SVG (ponad 25 plików!).

Przykładowe SVG do zastąpienia:
| Gdzie | Ikona | lucide-react |
|-------|-------|-------------|
| Sidebar — Dashboard | grid 2x2 | `<LayoutDashboard />` |
| Sidebar — Zlecenia | lista | `<ClipboardList />` |
| Sidebar — Powiadomienia | dzwonek | `<Bell />` |
| Sidebar — Konto | osoba | `<User />` |
| Header — dzwonek | dzwonek | `<Bell />` |
| index.tsx — metrika ofert | dokument | `<FileText />` |
| index.tsx — metrika czekających | zegar | `<Clock />` |
| index.tsx — metrika przychodu | banknot | `<Banknote />` |

**Priorytet:** Sidebar i Header to największa wygrana — 11 ikon w jednym pliku.

---

## 4. Zbyt duże pliki — podzielić na komponenty

### `my-fleet.tsx` — 812 linii ⚠️
Robi za dużo naraz: lista pojazdów + formularz dodawania/edycji + galeria zdjęć + lightbox + edytor wyposażenia.

Proponowany podział:
```
src/
  pages/my-fleet.tsx           (~150 linii — tylko logika strony)
  components/fleet/
    VehicleCard.tsx             (kafelek pojazdu w gridzie)
    VehicleForm.tsx             (modal dodawania/edycji)
    VehiclePhotoGallery.tsx     (galeria + lightbox)
    EquipmentEditor.tsx         (checkboxy wyposażenia)
```

### `index.tsx` — 520 linii
Zawiera: stronę landing + dashboard + MetricCard + DashboardBox + CalendarView + MonthCalendar + DayTooltip.

Proponowany podział:
```
src/
  pages/index.tsx              (~80 linii — tylko logika strony)
  components/dashboard/
    MetricCard.tsx
    OffersBox.tsx
    CalendarView.tsx
```

### `business-card.tsx` — 426 linii
Miks: edycja wizytówki + zarządzanie pojazdami + localStorage + walidacja.

### `zlecenia.tsx` — 377 linii
Miks: lista zleceń + filtr lokalizacji + formularz oferty + mapa trasy.

---

## 5. Brak centralnego klienta API

Każda strona ma swoje własne wywołania `fetch()`:
```typescript
// index.tsx
fetch("/api/offers")

// zlecenia.tsx
fetch("/api/requests")

// my-fleet.tsx
fetch("/api/vehicles")
```

**Rozwiązanie:** stworzyć `src/lib/api.ts`:
```typescript
export const api = {
  offers: {
    getAll: () => fetch("/api/offers").then(r => r.json()),
    create: (data) => fetch("/api/offers", { method: "POST", body: JSON.stringify(data) }),
  },
  vehicles: {
    getAll: () => fetch("/api/vehicles").then(r => r.json()),
  },
  requests: {
    getAll: () => fetch("/api/requests").then(r => r.json()),
  },
};
```

---

## 6. Console.logi do posprzątania

`NotificationsContext.tsx` ma 3 debug logi które powinny zniknąć z produkcji.
Pozostałe `console.error` w blokach `catch` są OK.

---

## 7. Plan działania

### Szybkie wygrane (< 30 min każde)
- [ ] Usuń `src/tailadmin/`
- [ ] Usuń `src/components/Footer.tsx`
- [ ] Wydziel `STATUS_CONFIG` do `src/lib/constants.ts`
- [ ] Wydziel `formatTime` do `src/lib/formatters.ts`
- [ ] Wydziel `INPUT_CLASS` do `src/lib/tailwindClasses.ts`
- [ ] Usuń console.logi z `NotificationsContext.tsx`
- [ ] Stwórz `<LoadingSpinner />` i zastąp spinner we wszystkich stronach

### Średni wysiłek (1-2 godz każde)
- [ ] Zastąp inline SVG w `Sidebar.tsx` lucide-react (11 ikon)
- [ ] Zastąp inline SVG w `index.tsx`, `Header.tsx`
- [ ] Stwórz centralny `src/lib/api.ts`

### Większy refaktoring (kilka godzin)
- [ ] Podziel `my-fleet.tsx` na komponenty
- [ ] Podziel `index.tsx` na komponenty dashboard
- [ ] Podziel `zlecenia.tsx` na mniejsze części

---

## 8. Stan komponentów UI (`src/components/ui/`)

| Komponent | Używany w | Ocena |
|-----------|-----------|-------|
| `Badge.tsx` | `index.tsx`, `zlecenia.tsx` | Używany, warto rozszerzyć |
| `Card.tsx` + `CardHeader.tsx` | tylko `zlecenia.tsx` | Mało używany |
| `Typography.tsx` | tylko `zlecenia.tsx` | Mało używany — do decyzji |

**Rekomendacja:** albo wdrożyć te komponenty konsekwentnie na wszystkich stronach, albo usunąć i trzymać się inline klas Tailwind.
