# BACKEND AUDIT — Driver Wayoo 2026

> Analiza API / backend pod kątem bezpieczeństwa, wydajności i jakości kodu.  
> Data: 2026-04-12 | Zasada Pareto: góra = 20% nakładu → 80% efektu.

---

## 🔴 KRYTYCZNE

### K2. N+1 — pobieranie całych tabel do pamięci

**Plik:** `src/services/offers.ts` — linie 89, 110, 120, 125

Wszystkie główne funkcje serwisu ściągają **całą tabelę Offers** do RAM, potem filtrują w JS:

```ts
// linia 89 — pobiera WSZYSTKIE oferty platformy
const allRecords = await offersTable.select().all();
return allRecords.filter(r => getDriverIdFromRecord(r) === driverId);
```

**Naprawa:**
```ts
export async function getOffersByDriver(driverId: string) {
  const records = await offersTable
    .select({ filterByFormula: `{Driver} = '${safe(driverId)}'` })
    .all();
  return records.map(mapRecordToOffer);
}

export async function hasDriverOfferedOnRequest(driverId: string, requestId: string) {
  const records = await offersTable
    .select({
      filterByFormula: `AND({Driver} = '${safe(driverId)}', {Request} = '${safe(requestId)}')`,
      maxRecords: 1,
    })
    .firstPage();
  return records.length > 0;
}
```

---

### K3. GET `/api/offers` — paginacja po filtrowaniu w JS

**Plik:** `src/pages/api/offers.ts` — linie 37–40

```ts
const all = await getOffersByDriverWithRequests(driverId); // ściąga WSZYSTKO
const filtered = status ? all.filter(o => o.status === status) : all;
const hasMore = filtered.length > limit;
const offers = filtered.slice(0, limit);
```

**Naprawa:**
```ts
const formula = status
  ? `AND({Driver} = '${safe(driverId)}', {status} = '${safe(status)}')`
  : `{Driver} = '${safe(driverId)}'`;

const records = await offersTable
  .select({ filterByFormula: formula, maxRecords: limit + 1 })
  .all();

const hasMore = records.length > limit;
const offers = records.slice(0, limit).map(mapRecordToOffer);
```

---

## 🟠 WYSOKIE

### H1. Race condition przy rejestracji

**Plik:** `src/pages/api/auth/register.ts` — linie 19–25

```ts
const existingDriver = await findDriverByEmail(email); // sprawdź
if (existingDriver) return res.status(400)...
const driver = await createDriver(...);                 // utwórz
```

Dwa równoległe requesty przejdą oba check → dwa konta z tym samym emailem.

**Naprawa:** Ustaw UNIQUE constraint na polu `email` w Airtable i łap błąd duplikatu zamiast robić pre-check.

---

### H3. `req.query.id` — brak `.trim()` i odpowiedzi 400

**Plik:** `src/pages/api/requests.ts` — linia 27

Typ jest sprawdzany, ale brak `.trim()` i explicit 400 gdy brak ID.

**Naprawa:**
```ts
const id = typeof req.query.id === "string" ? req.query.id.trim() : null;
if (!id) return res.status(400).json({ error: "Nieprawidłowe ID" });
```

---

### H6. Duplikacja: pobieranie `driverId` z emaila w `vehicles.ts`

**Plik:** `src/pages/api/vehicles.ts`

Lookup `driversTable` po email wykonywany na początku każdego requestu. Warto wyciągnąć do helpera.

**Naprawa:**
```ts
export async function getDriverIdByEmail(email: string): Promise<string | null> {
  const records = await driversTable
    .select({ filterByFormula: `{email} = '${safe(email)}'`, maxRecords: 1 })
    .firstPage();
  return records[0]?.id ?? null;
}
```

---

## 🟡 ŚREDNIE

### S1. Niespójne struktury błędów HTTP

Endpointy zwracają różne formaty (`{ error }` vs `{ error, details }`). Warto ujednolicić jednym helperem:

```ts
// src/lib/apiError.ts
export const apiError = (res: NextApiResponse, status: number, message: string) =>
  res.status(status).json({ error: message });
```

---

### S2. `console.error` w kodzie produkcyjnym

**Pliki:** `register.ts:44`, `notifications.ts:59`, `vehicles.ts:66,110,162,193`, `offers.ts:64`

Warto rozważyć centralny logger z poziomami.

---

### S3. Batch update powiadomień — brak obsługi częściowego błędu

**Plik:** `src/pages/api/notifications.ts` — linia 104

```ts
for (let i = 0; i < updates.length; i += 10) {
  await notificationsTable.update(updates.slice(i, i + 10));
}
```

Jeśli jeden batch rzuci wyjątek, pętla się przerywa — część powiadomień oznaczona, reszta nie.

**Naprawa:** Dodać `try/catch` wewnątrz pętli lub użyć `Promise.allSettled`.

---

### S4. `as any` / niebezpieczne castowanie typów

**Pliki:** `vehicles.ts:106` (`as any`), `PusherContext.tsx:24` (`session?.user as any`)

Warto zdefiniować właściwe interfejsy dla Airtable FieldSet.

---

## MAPA ZALEŻNOŚCI API

```
GET  /api/requests          → getAvailableRequests()
                            → getDriverOfferedRequestIds() → ⚠️ cała tabela Offers

GET  /api/offers            → getOffersByDriverWithRequests() → ⚠️ cała tabela Offers
POST /api/offers            → hasDriverOfferedOnRequest()    → ⚠️ cała tabela Offers
                            → getRequestById()
                            → notifyNewOffer() (Pusher)
                            → notificationsTable.create()

GET/POST/PUT/DELETE
     /api/vehicles          → driversTable (lookup email przy każdym req)

POST /api/auth/register     → findDriverByEmail() ← race condition
                            → createDriver()

PATCH /api/notifications    → batch update ← partial failure risk
```
