# Code Review — driver-wayoo-2026

Ostatnia aktualizacja: 2026-03-15

---

## Status refaktoringu

### ✅ Zrobione

| Co | Gdzie |
|----|-------|
| Folder `views/` — logika stron wydzielona z `pages/` | `src/views/` |
| Strony `pages/` to teraz 4-liniowe wrappery | `src/pages/*.tsx` |
| `STATUS_CONFIG` scentralizowane (było 4×) | `src/constants/offerStatus.ts` |
| `formatTime` scentralizowane (były 2 warianty × 3 miejsca) | `src/utils/formatTime.ts` |
| `DashboardView` rozbity na pod-komponenty | `MetricCard`, `DashboardBox`, `DashboardCalendar` |
| `MyFleetView` rozbity na pod-komponenty | `VehicleCard`, `VehicleFormModal` |
| `MyOffersView` rozbity na pod-komponenty | `OfferCard` |
| `OfferDetailsModal` importuje `STATUS_CONFIG` z `@/constants/offerStatus` | `src/components/OfferDetailsModal.tsx` |
| `Header` importuje `formatNotificationTime` z `@/utils/formatTime` | `src/components/Header.tsx` |
| `console.log` usunięte z `getOffersByDriver` | `src/services/offers.ts` |
| Email escapowany przed wstrzyknięciem do formuły Airtable | `src/services/drivers.ts` |
| `Footer.tsx` usunięty (nieużywany) | `src/components/Footer.tsx` |
| `tailadmin/` usunięty (pusty szablon) | `src/tailadmin/` |
| `getAvailableRequests` — dodano `maxRecords: 100` | `src/services/requests.ts` |

---

## Pozostałe problemy

### Priorytet: WYSOKI

#### 1. `services/offers.ts` — filtrowanie całej tabeli w pamięci
`getOffersByDriver` i `getOffersByRequest` pobierają WSZYSTKIE rekordy Airtable i filtrują w JS.
Próba użycia `ARRAYJOIN({Driver})` w `filterByFormula` nie zadziałała z linked record fields — wymaga dalszego zbadania struktury danych w Airtable.

---

### Priorytet: ŚREDNI

#### 1. `Header.tsx` — niekompatybilny styl
`Header.tsx` ma biało-zielony motyw (`bg-white`, `text-green-600`) niezgodny z ciemnym motywem całej aplikacji. `Sidebar.tsx` jest już w ciemnym motywie. Header wymaga przeprojektowania.

#### 2. `Header.tsx` — `window.location.href` zamiast Next.js routera
```ts
// src/components/Header.tsx:118
window.location.href = notification.link;
```
Powinno używać `useRouter()` z next/router.

#### 3. `NotificationsContext.tsx` — console.logi w produkcji
Trzy `console.log` do usunięcia lub zastąpienia warunkowym logowaniem.

---

### Priorytet: NISKI

#### 1. `views/TripHistoryView/` — mock data
Historia przejazdów opiera się na hardkodowanej tablicy `MOCK_TRIPS`. Brak integracji z backendem. Wymaga zaprojektowania tabeli "Trips" w Airtable.

---

## Obecna struktura (po refaktoringu)

```
src/
├── pages/          # Wrappery (4 linie każdy)
├── views/          # Cała logika stron ← TU PRACUJ
│   ├── DashboardView/     (MetricCard, DashboardBox, DashboardCalendar)
│   ├── ZleceniaView/
│   ├── MyOffersView/      (OfferCard)
│   ├── MyFleetView/       (VehicleCard, VehicleFormModal)
│   ├── NotificationsView/
│   ├── AccountView/
│   ├── TripHistoryView/
│   └── BusinessCardView/
├── components/     # Współdzielone między widokami
├── constants/      # offerStatus.ts
├── utils/          # formatTime.ts
├── services/       # Logika Airtable
├── context/        # NotificationsContext, PusherContext
├── models/         # Typy TypeScript
└── lib/            # Konfiguracja serwisów
```
