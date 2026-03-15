# WAYOO 2026 (Panel kierowcy) - Kontekst projektu dla Claude

## Czym jest WAYOO

Polska platforma ride-sharingowa (marketplace) łącząca pasażerów z kierowcami. Pasażer składa zapytanie o przejazd, kierowcy składają oferty cenowe, pasażer wybiera najlepszą ofertę i płaci.

## Struktura repozytorium

Projekt składa się z **dwóch niezależnych aplikacji Next.js** w jednym katalogu:

```
way/
├── wayoo2026/              # Aplikacja pasażera (port 3000)
└── driver-wayoo-2026/      # Panel kierowcy (port 3001) ← TO REPO
```

Obie aplikacje współdzielą bazę Airtable i kanały Pusher, ale mają osobne repozytoria git.

## Stack technologiczny

- **Next.js 16** (Pages Router, NIE App Router) + **React 19** + **TypeScript 5**
- **Tailwind CSS 4** — stylowanie
- **Airtable** — baza danych (tabele: Users, Drivers, Requests, Offers, Vehicles, Notifications)
- **NextAuth 4** (JWT strategy) — autentykacja (email/hasło + Google OAuth)
- **Pusher** — real-time WebSocket (powiadomienia o nowych ofertach, płatnościach)
- **Google Maps API** — mapy tras
- **Cloudinary** — upload zdjęć pojazdów
- **bcryptjs** — hashowanie haseł

## Architektura

```
src/
├── pages/           # CIENKIE wrappery — tylko import i export widoku
│   ├── api/         # Endpointy REST (auth, requests, offers, vehicles, upload)
│   ├── index.tsx    # → <DashboardView />
│   ├── zlecenia.tsx # → <ZleceniaView />
│   └── ...          # każda strona = 4 linie
│
├── views/           # CAŁA logika i UI stron — tutaj pracuj przy zmianach stron
│   ├── DashboardView/
│   │   ├── index.tsx          # główny widok dashboardu
│   │   ├── MetricCard.tsx     # karta metryki (oferty, przychód)
│   │   ├── DashboardBox.tsx   # box z listą ofert (oczekujące/opłacone)
│   │   └── DashboardCalendar.tsx  # kalendarz zlecen (3 miesiące)
│   ├── ZleceniaView/
│   │   └── index.tsx          # lista zleceń + mapa + formularz oferty
│   ├── MyOffersView/
│   │   ├── index.tsx          # lista ofert z filtrami po statusie
│   │   └── OfferCard.tsx      # karta jednej oferty
│   ├── MyFleetView/
│   │   ├── index.tsx          # zarządzanie flotą (lista + lightbox)
│   │   ├── VehicleCard.tsx    # karta pojazdu w gridzie
│   │   └── VehicleFormModal.tsx  # modal dodawania/edycji pojazdu
│   ├── NotificationsView/
│   │   └── index.tsx          # lista powiadomień
│   ├── AccountView/
│   │   └── index.tsx          # dane konta + wylogowanie
│   ├── TripHistoryView/
│   │   └── index.tsx          # historia przejazdów (mock data)
│   └── BusinessCardView/
│       └── index.tsx          # wizytówka kierowcy (localStorage)
│
├── components/      # Komponenty współdzielone między widokami
│   ├── DashboardLayout.tsx    # główny layout z sidebarem
│   ├── Sidebar.tsx            # nawigacja boczna
│   ├── Header.tsx             # nagłówek (stary styl — do odświeżenia)
│   ├── LoginModal.tsx         # modal logowania/rejestracji
│   ├── OfferDetailsModal.tsx  # modal szczegółów oferty
│   ├── RouteMap.tsx           # mapa jednej trasy
│   ├── AllRoutesMap.tsx       # mapa wszystkich tras
│   ├── LocationFilter.tsx     # filtr lokalizacji z mapą
│   ├── Footer.tsx             # nieużywany
│   ├── icons/                 # GoogleIcon
│   └── ui/
│       ├── Card.tsx
│       ├── Badge.tsx
│       └── Typography.tsx     # PageTitle, PageSubtitle
│
├── constants/       # Stałe współdzielone — DODAJ TU nowe stałe
│   └── offerStatus.ts  # STATUS_CONFIG dla statusów oferty (new/paid/canceled/rejected)
│
├── utils/           # Funkcje pomocnicze — DODAJ TU nowe utility
│   └── formatTime.ts   # formatTimeAgo() i formatNotificationTime()
│
├── services/        # Warstwa logiki biznesowej (komunikacja z Airtable)
│   ├── index.ts
│   ├── requests.ts  # getAvailableRequests, getRequestById
│   ├── offers.ts    # createOffer, getOffersByDriver — UWAGA: filtruje w pamięci (do poprawki)
│   └── drivers.ts   # findDriverByEmail, createDriver — UWAGA: injection w filterByFormula
│
├── context/         # React Context
│   ├── NotificationsContext.tsx  # stan powiadomień + API /api/notifications
│   └── PusherContext.tsx         # real-time WebSocket
│
├── models/          # Interfejsy TypeScript + helpery
│   └── index.ts    # Driver, RequestData, OfferData, Vehicle, Route + parseRoute(), getRouteDisplay()
│
├── lib/             # Konfiguracja zewnętrznych serwisów
│   ├── airtable.ts
│   ├── pusher.ts
│   ├── pusher-client.ts
│   └── mapStyles.ts
│
└── data/
    └── vehicleBrands.ts  # lista marek i modeli pojazdów
```

Przepływ danych: **pages/ (wrapper) → views/ (logika UI) → fetch() → api/ → services/ → lib/ (Airtable/Pusher)**

## Kluczowe modele danych

### Request (Zlecenie przejazdu)
Statusy: `draft` → `published` → `accepted` → `paid` → `completed` | `cancelled`

Pola: userId, route (JSON z origin/destination/waypoints), date, time, adults, children, options

### Offer (Oferta kierowcy)
Statusy: `new` → `accepted` → `paid` | `rejected` | `canceled`

Pola: requestId, driverId, vehicleId, price, message, status

### Vehicle (Pojazd w flocie kierowcy)
Typy: `bus`, `minibus`, `van`, `car`

Wyposażenie: WiFi, WC, TV, klimatyzacja, gniazdka, bagażnik

## API Routes

- `GET /api/requests` — dostępne zlecenia
- `POST /api/offers` — składanie oferty
- `GET /api/offers?driverId=X` — oferty kierowcy
- `GET/POST /api/vehicles` — zarządzanie flotą
- `POST /api/upload` — upload zdjęć (Cloudinary)
- `POST /api/auth/register` — rejestracja kierowcy

## Real-time (Pusher)

- Kanał: `driver-{driverId}` — subskrypcja na zdarzenia kierowcy
- Eventy: `new-offer`, `offer-accepted`, `offer-paid`
- Konteksty React: `PusherContext` (połączenie WS), `NotificationsContext` (stan powiadomień)

## Zmienne środowiskowe (.env)

```
AIRTABLE_API_KEY, AIRTABLE_BASE_ID
PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER
NEXT_PUBLIC_PUSHER_KEY, NEXT_PUBLIC_PUSHER_CLUSTER
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
NEXTAUTH_SECRET, NEXTAUTH_URL
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
```

## Ważne konwencje

- Język UI: **polski**
- Komentarze w kodzie: **polski**
- Dane w Airtable przechowują route i options jako **JSON stringi** — wymagają JSON.parse
- Package manager: **yarn**
- Aplikacja używa **Pages Router** (katalog `src/pages/`), NIE App Router
- Strony w `pages/` to **cieniutkie wrappery** — cała logika jest w `views/`
- Statusy oferty i ich style → `src/constants/offerStatus.ts`
- Formatowanie czasu → `src/utils/formatTime.ts`

## Znane problemy techniczne (do poprawki)

- `services/offers.ts` — filtruje wszystkie rekordy w pamięci zamiast używać `filterByFormula` po stronie Airtable
- `services/drivers.ts` — injection w `filterByFormula: \`{email} = '${email}'\``
- `components/OfferDetailsModal.tsx` — ma własną kopię `STATUS_CONFIG` (nie używa `constants/offerStatus.ts`)
- `components/Header.tsx` — ma własną kopię `formatTime` (nie używa `utils/formatTime.ts`) + stary biały styl niekompatybilny z ciemnym motywem UI
- `views/TripHistoryView/` — oparta na mock data, brak integracji z backendem
- `components/Footer.tsx` — nieużywany komponent
