# WAYOO 2026 — Panel kierowcy

Dashboard Next.js dla kierowców platformy WAYOO. Umożliwia przeglądanie dostępnych zleceń, składanie ofert cenowych, zarządzanie flotą pojazdów i śledzenie statusów.

## Uruchamianie

```bash
yarn install
yarn dev        # http://localhost:3001
```

## Skrypty

| Komenda | Opis |
|---------|------|
| `yarn dev` | Serwer developerski (port 3001) |
| `yarn build` | Build produkcyjny |
| `yarn start` | Start produkcyjny |
| `yarn lint` | ESLint |

## Główne strony

| Ścieżka | Plik | Opis |
|----------|------|------|
| `/` | `pages/index.tsx` | Dashboard — statystyki, kalendarz ofert |
| `/zlecenia` | `pages/zlecenia.tsx` | Lista dostępnych zleceń |
| `/my-offers` | `pages/my-offers.tsx` | Złożone oferty kierowcy |
| `/my-fleet` | `pages/my-fleet.tsx` | Zarządzanie flotą pojazdów |
| `/notifications` | `pages/notifications.tsx` | Powiadomienia |
| `/account` | `pages/account.tsx` | Ustawienia konta |

## API Routes

| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/requests` | Pobierz dostępne zlecenia |
| POST | `/api/offers` | Złóż ofertę na zlecenie |
| GET | `/api/offers?driverId=X` | Pobierz oferty kierowcy |
| GET/POST | `/api/vehicles` | Zarządzanie flotą |
| POST | `/api/upload` | Upload zdjęć pojazdów (Cloudinary) |
| GET/POST | `/api/notifications` | Powiadomienia |
| POST | `/api/auth/register` | Rejestracja kierowcy |

## Kluczowe komponenty

- **DashboardLayout** — layout z bocznym menu (Sidebar + Header)
- **AllRoutesMap** — mapa z wszystkimi dostępnymi trasami
- **RouteMap** — wizualizacja pojedynczej trasy
- **OfferDetailsModal** — szczegóły oferty / formularz składania
- **Sidebar** — nawigacja panelu kierowcy
