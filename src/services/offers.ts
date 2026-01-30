import type { FieldSet, Record as AirtableRecord } from "airtable";
import { offersTable } from "@/lib/airtable";
import { getRequestById } from "./requests";
import type { OfferData, OfferWithRequest, OfferStatus } from "@/models";

export async function createOffer(
  requestId: string,
  driverId: string,
  price: number,
  message: string
): Promise<OfferData> {
  const record = await offersTable.create({
    Request: [requestId],
    Driver: [driverId],
    price,
    message,
    status: "new",
  });

  const requestLinks = record.get("Request") as string[] | undefined;
  const driverLinks = record.get("Driver") as string[] | undefined;

  return {
    id: record.id,
    requestId: requestLinks?.[0] || "",
    driverId: driverLinks?.[0] || "",
    price: record.get("price") as number,
    message: (record.get("message") as string) || "",
    status: (record.get("status") as OfferStatus) || "new",
  };
}

function getDriverIdFromRecord(record: AirtableRecord<FieldSet>): string {
  // Może być linked record (tablica) lub tekst
  const driverLinks = record.get("Driver");

  if (Array.isArray(driverLinks)) {
    return driverLinks[0] || "";
  }

  // Może być polem tekstowym "driverId"
  const driverIdText = record.get("driverId") as string | undefined;
  if (driverIdText) {
    return driverIdText;
  }

  // Lub Driver jako tekst
  if (typeof driverLinks === "string") {
    return driverLinks;
  }

  return "";
}

function getRequestIdFromRecord(record: AirtableRecord<FieldSet>): string {
  const requestLinks = record.get("Request");

  if (Array.isArray(requestLinks)) {
    return requestLinks[0] || "";
  }

  const requestIdText = record.get("requestId") as string | undefined;
  if (requestIdText) {
    return requestIdText;
  }

  if (typeof requestLinks === "string") {
    return requestLinks;
  }

  return "";
}

export async function getOffersByDriver(driverId: string): Promise<OfferData[]> {
  console.log("[getOffersByDriver] Looking for offers by driver:", driverId);

  const allRecords = await offersTable.select().all();
  console.log("[getOffersByDriver] Total offers in table:", allRecords.length);

  const offers: OfferData[] = [];

  for (const record of allRecords) {
    const recordDriverId = getDriverIdFromRecord(record);
    const recordRequestId = getRequestIdFromRecord(record);

    console.log("[getOffersByDriver] Record:", record.id, "Driver:", recordDriverId, "Request:", recordRequestId);

    // Sprawdź czy ta oferta należy do tego kierowcy
    if (recordDriverId === driverId) {
      console.log("[getOffersByDriver] Match found!");
      offers.push({
        id: record.id,
        requestId: recordRequestId,
        driverId: recordDriverId,
        price: record.get("price") as number,
        message: (record.get("message") as string) || "",
        status: (record.get("status") as OfferStatus) || "new",
      });
    }
  }

  console.log("[getOffersByDriver] Found offers:", offers.length);
  return offers;
}

export async function getOffersByDriverWithRequests(driverId: string): Promise<OfferWithRequest[]> {
  const offers = await getOffersByDriver(driverId);

  const offersWithRequests = await Promise.all(
    offers.map(async (offer) => {
      const request = await getRequestById(offer.requestId);
      return { ...offer, request: request || undefined };
    })
  );

  return offersWithRequests;
}

export async function getOffersByRequest(requestId: string): Promise<OfferData[]> {
  const allRecords = await offersTable.select().all();

  const offers: OfferData[] = [];

  for (const record of allRecords) {
    const recordRequestId = getRequestIdFromRecord(record);
    const recordDriverId = getDriverIdFromRecord(record);

    if (recordRequestId === requestId) {
      offers.push({
        id: record.id,
        requestId: recordRequestId,
        driverId: recordDriverId,
        price: record.get("price") as number,
        message: (record.get("message") as string) || "",
        status: (record.get("status") as OfferStatus) || "new",
      });
    }
  }

  return offers;
}

export async function hasDriverOfferedOnRequest(
  driverId: string,
  requestId: string
): Promise<boolean> {
  const offers = await getOffersByDriver(driverId);
  return offers.some((o) => o.requestId === requestId);
}

export async function getDriverOfferedRequestIds(driverId: string): Promise<string[]> {
  const offers = await getOffersByDriver(driverId);
  return offers.map((o) => o.requestId);
}
