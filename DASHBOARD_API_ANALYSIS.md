# Analiza API — Dashboard kierowcy

> Data analizy: 2026-03-15
> Dotyczy: `src/views/DashboardView/` + powiązany backend

---

## 1. Co się dzieje przy każdym wejściu na dashboard

```
Przeglądarka                 Next.js API          Airtable
     │                            │                    │
     ├─ GET /api/offers ──────────►                    │
     │                            ├─ SELECT * Offers ──►  ← CAŁA tabela
     │                            │◄── N rekordów ─────┤
     │                            │                    │
     │                            ├─ find(requestId1) ─►  ← 1 request
     │                            ├─ find(requestId2) ─►  ← 1 request
     │                            ├─ find(requestId3) ─►  ← 1 request
     │                            │      ... N razy ...│
     │                            │◄───────────────────┤
     │◄── OfferWithRequest[] ─────┤                    │
     │                            │                    │
     ├─ GET /api/notifications ───►                    │
     │                            ├─ SELECT WHERE userId──►
     │◄── Notification[] ─────────┤                    │
```

**Suma wywołań Airtable przy wejściu na dashboard:**
- `1` wywołanie (cały skan tabeli Offers)
- `N` wywołań (jedno `find()` per oferta kierowcy)
- `1` wywołanie (notyfikacje)
- **Łącznie: `2 + N` zapytań** — dla kierowcy z 30 ofertami = **32 zapytania do Airtable**

---

## 2. Szczegóły — co jest nie tak

### Problem A — pełny skan tabeli Offers

**Plik:** `src/services/offers.ts` → `getOffersByDriver()`

```typescript
// OBECNY KOD — ŹLE
const allRecords = await offersTable.select().all(); // ← ładuje WSZYSTKIE oferty wszystkich kierowców
return allRecords.filter((r) => getDriverIdFromRecord(r) === driverId);
```

Dla małej bazy (dziesiątki rekordów) to nie problem. Przy setkach/tysiącach ofert od wielu kierowców — każde wejście na dashboard ładuje całą tabelę do pamięci serwera.

**Dlaczego tak jest:** Airtable nie obsługuje filtrowania po polach linked record przez `filterByFormula`. Pole `Driver` w tabeli Offers to linked record — `{Driver} = 'recXXX'` nie działa. Rozwiązanie obejściowe opisane w punkcie 4.

---

### Problem B — N+1 query (najpoważniejszy)

**Plik:** `src/services/offers.ts` → `getOffersByDriverWithRequests()`

```typescript
// OBECNY KOD — N+1
const offersWithRequests = await Promise.all(
  offers.map(async (offer) => {
    const request = await getRequestById(offer.requestId); // ← osobne zapytanie per oferta
    return { ...offer, request: request || undefined };
  })
);
```

Używamy `Promise.all` więc zapytania lecą równolegle — to redukuje *czas* odpowiedzi, ale **nie redukuje liczby zapytań**. Airtable ma limit rate-limit (5 req/s na klucz API). Przy 30 ofertach równoległych `find()` możemy uderzyć w ten limit i dostać błędy 429.

**Rozwiązanie:** Airtable pozwala filtrować tabelę Requests po `RECORD_ID()` przez `OR()`:

```typescript
// DOCELOWY KOD
const ids = offers.map((o) => o.requestId);
const formula = `OR(${ids.map((id) => `RECORD_ID() = '${id}'`).join(",")})`;
const records = await requestsTable.select({ filterByFormula: formula }).all();
// → 1 zapytanie zamiast N
```

---

### Problem C — over-fetching danych

Dashboard używa z modelu `RequestData` tylko kilku pól, a API zwraca wszystko:

| Pole | Używane w dashboard | Uwagi |
|------|--------------------|----|
| `id` | ✅ tak | klucz |
| `route` | ✅ tak | DashboardBox, DashboardCalendar |
| `date` | ✅ tak | kalendarz, wykresy |
| `time` | ✅ tak | DashboardCalendar tooltip |
| `userId` | ❌ nie | niepotrzebne dla widoku |
| `userEmail` | ❌ nie | niepotrzebne dla widoku |
| `status` | ❌ nie | nie filtrowany w dashboard |
| `options` | ❌ nie | JSON string, nigdzie nie używany |
| `createdAt` | ❌ nie | niewyświetlany |
| `adults` | ❌ nie | niewyświetlany |
| `children` | ❌ nie | niewyświetlany |

Z modelu `OfferData`:

| Pole | Używane w dashboard |
|------|-------------------|
| `id` | ✅ klucz |
| `price` | ✅ wykresy, karty, metryki |
| `status` | ✅ filtrowanie |
| `requestId` | ✅ wewnętrznie |
| `vehicleId` | ❌ nie |
| `message` | ❌ nie |
| `driverId` | ❌ nie (sesja to ma) |

**Zysk z ograniczenia pól:** Mniejszy payload JSON, krótszy czas serializacji. Przy dużych tabelach Airtable `fields` pozwala ograniczyć co jest zwracane.

---

### Problem D — podwójny fetch notyfikacji

**Plik:** `src/context/PusherContext.tsx`

```typescript
channel.bind("offer-paid", (data) => {
  addLocalNotification({ ... });
  setTimeout(() => refreshNotifications(), 500); // ← dodatkowy GET /api/notifications
});
```

Gdy przychodzi zdarzenie Pusher, kontekst najpierw dodaje powiadomienie lokalnie (poprawnie), a potem i tak refetchuje całą listę z API. Niepotrzebne — stan jest już zaktualizowany lokalnie.

---

### Problem E — brak dedykowanego endpointu dla dashboard

Obecna architektura:

```
DashboardView → GET /api/offers → service (1 + N Airtable calls)
```

Endpoint `/api/offers` jest ogólny — używany też przy `/zlecenia` i `/my-offers`. Dashboard potrzebuje jednak wzbogaconych danych (`OfferWithRequest`), przez co dokłada N zapytań. Inne widoki mogą potrzebować tylko samych ofert.

---

## 3. Podsumowanie problemów (priorytet)

| # | Problem | Priorytet | Koszt naprawy |
|---|---------|-----------|--------------|
| 1 | N+1 query — N osobnych `find()` dla requestów | 🔴 wysoki | średni |
| 2 | Pełny skan tabeli Offers (brak filterByFormula) | 🔴 wysoki | średni (obejście) |
| 3 | Brak pola `fields` w zapytaniach Airtable | 🟡 średni | niski |
| 4 | Podwójny fetch notyfikacji po Pusher event | 🟡 średni | niski |
| 5 | Brak dedykowanego endpointu `/api/dashboard` | 🟢 niski | wysoki |

---

## 4. Propozycje optymalizacji

### Optymalizacja 1 — Batch fetch requestów (eliminuje N+1)

```typescript
// src/services/offers.ts
export async function getOffersByDriverWithRequests(driverId: string) {
  const offers = await getOffersByDriver(driverId);
  if (offers.length === 0) return [];

  // Jeden zbiorczy SELECT zamiast N osobnych find()
  const ids = offers.map((o) => o.requestId);
  const formula = `OR(${ids.map((id) => `RECORD_ID() = '${id}'`).join(",")})`;
  const records = await requestsTable.select({ filterByFormula: formula }).all();

  const requestMap = new Map(records.map((r) => [r.id, mapRecordToRequest(r)]));
  return offers.map((offer) => ({
    ...offer,
    request: requestMap.get(offer.requestId) ?? undefined,
  }));
}
```

**Efekt:** N+1 → 2 zapytania Airtable (niezależnie od liczby ofert).
**Uwaga:** Airtable ma limit długości URL — przy >100 ofertach `OR()` może być za długi. Trzeba chunkowac po 50-100 ID.

---

### Optymalizacja 2 — Ograniczenie zwracanych pól (fields)

```typescript
// getOffersByDriver
const records = await offersTable.select({
  fields: ["Status", "Driver", "Request", "Price", "Vehicle"],
}).all();

// getRequestsByIds (nowa funkcja batch)
const records = await requestsTable.select({
  filterByFormula: formula,
  fields: ["Route", "Date", "Time"],
}).all();
```

**Efekt:** Mniejszy transfer danych z Airtable, szybsza deserializacja.

---

### Optymalizacja 3 — Naprawienie filtra tabeli Offers

Problem z `filterByFormula` dla linked records można obejść jeśli w tabeli Offers istnieje pole tekstowe `DriverId` (nie linked record, tylko skopiowane ID). Alternatywnie — użyć `{DriverId} = '${driverId}'` jeśli takie pole istnieje.

Warto sprawdzić w Airtable czy tabela Offers ma pole tekstowe z ID kierowcy, bo linked record można też odczytać przez:
```
filterByFormula: `FIND('${driverId}', ARRAYJOIN({Driver})) > 0`
```
*(ta formuła była wcześniej testowana i nie działała — wymaga dodatkowej weryfikacji struktury tabeli)*

---

### Optymalizacja 4 — Usunięcie zbędnego refetch notyfikacji

```typescript
// src/context/PusherContext.tsx
channel.bind("offer-paid", (data) => {
  addLocalNotification({
    id: `local-${Date.now()}`,
    type: "offer_paid",
    message: `Oferta opłacona: ${data.requestTitle}`,
    read: false,
    createdAt: new Date().toISOString(),
  });
  // USUNĄĆ: setTimeout(() => refreshNotifications(), 500);
});
```

**Efekt:** Eliminacja jednego niepotrzebnego GET /api/notifications przy każdym zdarzeniu Pusher.

---

### Optymalizacja 5 (opcjonalna) — Dedykowany endpoint `/api/dashboard`

Zamiast ogólnego `/api/offers`, osobny endpoint który:
1. Zwraca tylko dane potrzebne dashboardowi (mniej pól)
2. Robi batch fetch requestów wewnętrznie
3. Zwraca gotowe agregaty (revenue per month, status counts) zamiast liczyć to na kliencie

```
GET /api/dashboard
→ {
    offers: OfferDashboardItem[],  // tylko potrzebne pola
    metrics: { total, pending, revenue },
    revenueByMonth: { label, value }[],
    statusCounts: { status, count }[]
  }
```

**Efekt:** 1 request z przeglądarki, mniejszy payload, mniej pracy po stronie klienta.
**Koszt:** Nowy endpoint + nowe typy — więcej kodu do utrzymania.

---

## 5. Priorytetyzacja — od czego zacząć

1. **Najpierw** — Optymalizacja 1 (batch fetch requestów): eliminuje główny problem N+1, minimalne ryzyko regresji
2. **Potem** — Optymalizacja 2 (ograniczenie pól): prosta zmiana, mały zysk ale zerowe ryzyko
3. **Opcjonalnie** — Optymalizacja 4 (Pusher refetch): 5 minut roboty, małe ale realne usprawnienie
4. **Rozważyć** — Optymalizacja 3 (filterByFormula): wymaga sprawdzenia struktury tabeli Airtable
5. **Na przyszłość** — Optymalizacja 5 (dedykowany endpoint): sensowne przy wzroście skali

---

## 6. Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `src/services/offers.ts` | Batch fetch requestów (Opt. 1), ograniczenie fields (Opt. 2) |
| `src/context/PusherContext.tsx` | Usunięcie zbędnego refreshNotifications (Opt. 4) |
| `src/pages/api/offers.ts` | Bez zmian (endpoint jest OK) |
| `src/services/requests.ts` | Nowa funkcja `getRequestsByIds(ids[])` do batch fetch |
