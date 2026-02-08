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
├── pages/           # Strony i API routes (Next.js Pages Router)
│   ├── api/         # Endpointy REST (auth, requests, offers, vehicles, upload)
│   └── ...          # Strony UI
├── components/      # Komponenty React (DashboardLayout, Sidebar, mapy, modale)
├── services/        # Warstwa logiki biznesowej (komunikacja z Airtable)
├── lib/             # Konfiguracja zewnętrznych serwisów (airtable.ts, pusher.ts)
├── models/          # Interfejsy TypeScript (odpowiadają tabelom Airtable)
├── context/         # React Context (NotificationsContext, PusherContext)
└── styles/          # Tailwind CSS
```

Przepływ danych: **Pages → Services → Lib (Airtable/Pusher) → Baza danych**

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

- Kanał: `request-{requestId}` — subskrypcja na zdarzenia dotyczące zlecenia
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
