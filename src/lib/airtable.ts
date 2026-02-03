import Airtable from "airtable";

// Konfiguracja połączenia z Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID!
);

// Eksport tabel
export const driversTable = base(process.env.AIRTABLE_DRIVERS_TABLE || "Drivers");
export const requestsTable = base("Requests");
export const offersTable = base("Offers");
export const vehiclesTable = base("Vehicles");
export const notificationsTable = base("Notifications");

// Re-eksport typów z models dla wstecznej kompatybilności
export type {
  Driver,
  RequestData,
  RequestStatus,
  OfferData,
  Vehicle,
  VehicleType,
} from "@/models";
