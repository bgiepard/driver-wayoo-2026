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

---

## Pozostałe problemy

### Priorytet: WYSOKI

#### 1. `services/offers.ts` — filtrowanie całej tabeli w pamięci
```ts
// Pobiera WSZYSTKIE rekordy Airtable, filtruje w JS
const allRecords = await offersTable.select().all();
for (const record of allRecords) {
  if (recordDriverId === driverId) { ... }
}
```
Powinno: `offersTable.select({ filterByFormula: `{driverId} = "${driverId}"` }).all()`

#### 2. `services/drivers.ts` — injection w filterByFormula
```ts
// Niebezpieczne — email z zewnątrz wstrzykiwany do formuły
filterByFormula: `{email} = '${email}'`
```
Airtable nie ma prepared statements, ale przynajmniej należy uciec cudzysłowy w emailu przed wstrzyknięciem.

---

### Priorytet: ŚREDNI

#### 3. `Header.tsx` — niekompatybilny styl
`Header.tsx` ma biało-zielony motyw (`bg-white`, `text-green-600`) niezgodny z ciemnym motywem całej aplikacji. `Sidebar.tsx` jest już w ciemnym motywie. Header wymaga przeprojektowania.

#### 4. `Header.tsx` — `window.location.href` zamiast Next.js routera
```ts
// src/components/Header.tsx:118
window.location.href = notification.link;
```
Powinno używać `useRouter()` z next/router.

#### 5. `NotificationsContext.tsx` — console.logi w produkcji
Trzy `console.log` do usunięcia lub zastąpienia warunkowym logowaniem.

---

### Priorytet: NISKI

#### 6. `components/Footer.tsx` — nieużywany komponent
Nie jest importowany na żadnej stronie. Można usunąć.

#### 7. `views/TripHistoryView/` — mock data
Historia przejazdów opiera się na hardkodowanej tablicy `MOCK_TRIPS`. Brak integracji z backendem.

#### 8. `tailadmin/` — nieużywany folder szablonu
Katalog `src/tailadmin/` zawiera pusty szablon TailAdmin bez plików `.ts/.tsx`. Można usunąć.

#### 9. `services/requests.ts` — brak paginacji
`getAvailableRequests()` pobiera wszystkie published requests bez limitu.

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
