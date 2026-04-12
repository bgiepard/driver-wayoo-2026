# BACKLOG — Driver Wayoo 2026

> Zasada Pareto: góra listy = 20% nakładu → 80% efektu.
> Data analizy: 2026-04-12

---

## PRIORYTET 1 — Krytyczne (blokują produkcję)

~~1.1 Historia przejazdów — zastąpiona realnym API (fetch ofert paid/canceled/rejected + pojazdy)~~  
~~1.2 Race condition w formularzu ofert — try/finally już działał; dodano setError("") przy otwieraniu nowego zlecenia~~  
~~1.3 Krok cenowy i reset formularza — step="0.01", min="1", reset pól po sukcesie~~  
~~1.4 markAllAsRead odpala się automatycznie — usunięto z onClick dzwonka, działa tylko przez przycisk w dropdownie~~  
~~1.5 Upload bez walidacji — dodano sprawdzanie typu (JPG/PNG/WebP) i limitu rozmiaru (10 MB)~~

---

## PRIORYTET 2 — Wysokie (psują kluczowe UX)

### 2.1 API `/api/offers` — pobiera wszystko, filtruje w JS
**Plik:** `src/services/offers.ts` linia 89  
Przy dużej liczbie ofert każde zapytanie ściąga cały dataset do pamięci serwera.  
**Do zrobienia:** użyć `filterByFormula` w Airtable po `Driver` field.

### 2.2 Brak edycji profilu kierowcy
**Plik:** `src/views/AccountView/index.tsx`  
Kierowca nie może zmienić imienia, telefonu, hasła.  
**Do zrobienia:** formularz edycji + endpoint `PATCH /api/drivers/[id]`.

### 2.3 Niespójny design system — Header vs reszta
**Plik:** `src/components/Header.tsx`  
Header używa klas `gray-*`, reszta aplikacji `[#0f172a]`, `[#0b298f]`, `[#FFC428]`.  
**Do zrobienia:** przerobić Header na kolory zgodne z resztą UI.

---

## PRIORYTET 3 — Średnie (dług techniczny)

### 3.1 N+1 queries w `getOffersByDriverWithRequests`
**Plik:** `src/services/offers.ts`  
Dla każdej oferty osobne zapytanie po zlecenie — przy 50 ofertach = 51 requestów do Airtable.  
**Do zrobienia:** zebrać wszystkie `requestId` i pobrać jednym `filterByFormula: OR(...)`.

### 3.2 Injection risk w `filterByFormula`
**Plik:** `src/services/drivers.ts` linia 18  
`` {email} = '${email}' `` — jeśli email zawiera `'`, zapytanie może się zepsuć.  
**Do zrobienia:** escapować `'` → `\'`.

### 3.3 `AccountView` — niespójny styl
**Plik:** `src/views/AccountView/index.tsx`  
Używa klas Tailwind `gray-*` zamiast ciemnego motywu.  
**Do zrobienia:** ujednolicić z dark color palette reszty panelu.

### 3.4 Brak globalnego error boundary
Każde nieobsłużone wyjście w renderze crashuje całą stronę bez komunikatu dla użytkownika.  
**Do zrobienia:** dodać `ErrorBoundary` komponent owijający `_app.tsx`.

### 3.5 Brak walidacji ceny > 0 w POST `/api/offers`
**Plik:** `src/pages/api/offers.ts`  
Można złożyć ofertę z ceną 0 lub ujemną.  
**Do zrobienia:** sprawdzić `price > 0` przed zapisem.

### 3.6 Header — brak `aria-label` na ikonie dzwonka
**Plik:** `src/components/Header.tsx`  
Przycisk powiadomień bez opisu dla screen readerów.  
**Do zrobienia:** dodać `aria-label="Powiadomienia"` na przycisku.

---

## PRIORYTET 4 — Niskie (nice-to-have)

### 4.1 Brak rate limiting na rejestracji i upload
Można automatycznie tworzyć konta lub zapychać Cloudinary.

~~4.2 Walidacja email przy rejestracji — dodano trim, toLowerCase, regex + min. 8 znaków hasła~~

### 4.3 Brak walidacji roku i miejsc siedzących pojazdu
`src/pages/api/vehicles.ts` — `year: 1800`, `seats: -3` zapisują się bez błędu.

### 4.4 Lightbox zdjęć — brak alt text
**Plik:** `src/views/MyFleetView/index.tsx`  
`<img src={...} />` bez `alt`.

~~4.5 next/image zamiast img — zamieniono w VehicleCard, VehicleFormModal, ZleceniaView; dodano remotePatterns dla Cloudinary w next.config.ts~~

---

## Brakujące funkcjonalności (roadmap)

| Funkcjonalność | Priorytet | Uwagi |
|---|---|---|
| Zmiana hasła | Wysoki | Brak w AccountView |
| Dokumenty kierowcy (prawo jazdy, ubezpieczenie) | Wysoki | Potrzebne do onboardingu |
| Rating pasażera po przejeździe | Średni | — |
| Chat z pasażerem | Średni | Pusher już w projekcie |
| Faktura / potwierdzenie płatności | Średni | PDF download |
| PWA / tryb offline | Niski | — |
| Push notifications (przeglądarka) | Niski | Service Worker |
