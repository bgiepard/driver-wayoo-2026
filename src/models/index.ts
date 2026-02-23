// ============================================
// MODELE DANYCH - DRIVER WAYOO 2026
// ============================================

// --------------------------------------------
// DRIVER - Tabela Drivers
// --------------------------------------------
export type DriverAuthProvider = 'email' | 'google';

export interface Driver {
  id: string;
  email: string;
  name: string;
  password?: string;
  phone?: string;
  provider?: DriverAuthProvider;
}

export interface CreateDriverData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

// --------------------------------------------
// ROUTE - Struktura trasy z koordynatami
// --------------------------------------------
export interface Place {
  address: string;
  placeId: string;
  lat: number;
  lng: number;
}

export interface Route {
  origin: Place;
  destination: Place;
  waypoints: Place[];
}

// --------------------------------------------
// REQUEST - Tabela Requests
// --------------------------------------------
export type RequestStatus =
  | 'draft'
  | 'published'
  | 'accepted'
  | 'paid'
  | 'completed'
  | 'cancelled';

export interface RequestData {
  id: string;
  userId: string;
  userEmail: string;
  route: string; // JSON string (Route)
  date: string;
  time: string;
  adults: number;
  children: number;
  options: string;
  status: RequestStatus;
  createdAt: string;
}

// Helper do parsowania trasy
export function parseRoute(routeJson: string): Route | null {
  try {
    const route = JSON.parse(routeJson || "{}");
    if (route.origin && route.destination) {
      return route as Route;
    }
    return null;
  } catch {
    return null;
  }
}

// Helper do wyświetlania trasy
export function getRouteDisplay(routeJson: string): string {
  const route = parseRoute(routeJson);
  if (!route) return "Brak trasy";

  const parts: string[] = [];
  if (route.origin?.address) {
    parts.push(route.origin.address.split(",")[0]);
  }
  route.waypoints?.forEach((wp) => {
    if (wp.address) parts.push(wp.address.split(",")[0]);
  });
  if (route.destination?.address) {
    parts.push(route.destination.address.split(",")[0]);
  }

  return parts.length > 0 ? parts.join(" → ") : "Brak trasy";
}

// --------------------------------------------
// OFFER - Tabela Offers
// --------------------------------------------
export type OfferStatus =
  | 'new'       // Nowa oferta, oczekuje na decyzję
  | 'accepted'  // Zaakceptowana przez klienta
  | 'paid'      // Opłacona
  | 'canceled'  // Anulowana przez kierowcę
  | 'rejected'; // Odrzucona (gdy inna oferta została zaakceptowana)

export interface OfferData {
  id: string;
  requestId: string;
  driverId: string;
  vehicleId?: string;  // ID pojazdu z floty kierowcy
  price: number;
  message: string;
  status: OfferStatus;
}

export interface OfferWithRequest extends OfferData {
  request?: RequestData;
}

// --------------------------------------------
// OPTIONS - Opcje dodatkowe w zapytaniu
// --------------------------------------------
export interface Options {
  wifi: boolean;
  wc: boolean;
  tv: boolean;
  airConditioning: boolean;
  powerOutlet: boolean;
}

export const optionLabels: Record<keyof Options, string> = {
  wifi: "WiFi",
  wc: "WC",
  tv: "TV",
  airConditioning: "Klimatyzacja",
  powerOutlet: "Gniazdko",
};

// --------------------------------------------
// VEHICLE - Tabela Vehicles (Flota kierowcy)
// --------------------------------------------
export type VehicleType =
  | 'bus'        // Autobus
  | 'minibus'    // Minibus
  | 'van'        // Van
  | 'car';       // Samochód osobowy

export interface Vehicle {
  id: string;
  driverId: string;
  name: string;           // Nazwa własna pojazdu np. "Mercedes Sprinter"
  type: VehicleType;
  brand: string;          // Marka
  model: string;          // Model
  year: number;           // Rok produkcji
  seats: number;          // Liczba miejsc
  licensePlate: string;   // Numer rejestracyjny
  color: string;          // Kolor
  description?: string;   // Opis dodatkowy
  fuelConsumption?: number; // Średnie spalanie [l/100km]
  photos: string[];       // URL zdjęć (max 5)
  // Wyposażenie
  hasWifi: boolean;
  hasWC: boolean;
  hasTV: boolean;
  hasAirConditioning: boolean;
  hasPowerOutlets: boolean;
  hasLuggage: boolean;    // Bagażnik
  isActive: boolean;      // Czy pojazd jest aktywny
  createdAt: string;
}

export interface CreateVehicleData {
  name: string;
  type: VehicleType;
  brand: string;
  model: string;
  year: number;
  seats: number;
  licensePlate: string;
  color: string;
  description?: string;
  fuelConsumption?: number;
  photos?: string[];
  hasWifi?: boolean;
  hasWC?: boolean;
  hasTV?: boolean;
  hasAirConditioning?: boolean;
  hasPowerOutlets?: boolean;
  hasLuggage?: boolean;
}

export const vehicleTypeLabels: Record<VehicleType, string> = {
  bus: "Autobus",
  minibus: "Minibus",
  van: "Van",
  car: "Samochód osobowy",
};
