// ============================================
// MODELE DANYCH - DRIVER WAYOO 2026
// ============================================

// --------------------------------------------
// DRIVER - Tabela Drivers
// --------------------------------------------
export interface Driver {
  id: string;
  email: string;
  name: string;
  password?: string;
  phone?: string;
}

export interface CreateDriverData {
  email: string;
  password: string;
  name: string;
  phone?: string;
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
  from: string;
  to: string;
  date: string;
  time: string;
  adults: number;
  children: number;
  options: string;
  status: RequestStatus;
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
