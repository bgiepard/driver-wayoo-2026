import type { FieldSet, Record as AirtableRecord } from "airtable";
import { offersTable } from "@/lib/airtable";
import { getRequestsByIds } from "./requests";
import type { OfferData, OfferWithRequest, OfferStatus } from "@/models";

export async function createOffer(
  requestId: string,
  driverId: string,
  price: number,
  message: string,
  vehicleId?: string
): Promise<OfferData> {
  const createData = {
    Request: [requestId],
    Driver: [driverId],
    price,
    message,
    status: "new",
    ...(vehicleId && { vehicleId }),
  };

  const record = await offersTable.create(createData as Partial<FieldSet>);

  const requestLinks = record.get("Request") as string[] | undefined;
  const driverLinks = record.get("Driver") as string[] | undefined;

  return {
    id: record.id,
    requestId: requestLinks?.[0] || "",
    driverId: driverLinks?.[0] || "",
    vehicleId: (record.get("vehicleId") as string) || undefined,
    price: record.get("price") as number,
    message: (record.get("message") as string) || "",
    status: (record.get("status") as OfferStatus) || "new",
  };
}

function getDriverIdFromRecord(record: AirtableRecord<FieldSet>): string {
  const driverLinks = record.get("Driver");

  if (Array.isArray(driverLinks)) {
    return driverLinks[0] || "";
  }

  const driverIdText = record.get("driverId") as string | undefined;
  if (driverIdText) {
    return driverIdText;
  }

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

function mapRecordToOffer(record: AirtableRecord<FieldSet>): OfferData {
  return {
    id: record.id,
    requestId: getRequestIdFromRecord(record),
    driverId: getDriverIdFromRecord(record),
    vehicleId: (record.get("vehicleId") as string) || undefined,
    price: record.get("price") as number,
    message: (record.get("message") as string) || "",
    status: (record.get("status") as OfferStatus) || "new",
  };
}

export async function getOffersByDriver(driverId: string): Promise<OfferData[]> {
  const allRecords = await offersTable.select().all();
  return allRecords
    .filter((record) => getDriverIdFromRecord(record) === driverId)
    .map(mapRecordToOffer);
}

export async function getOffersByDriverWithRequests(driverId: string): Promise<OfferWithRequest[]> {
  const offers = await getOffersByDriver(driverId);
  if (offers.length === 0) return [];

  const requestIds = [...new Set(offers.map((o) => o.requestId).filter(Boolean))];
  const requests = await getRequestsByIds(requestIds);
  const requestMap = new Map(requests.map((r) => [r.id, r]));

  return offers.map((offer) => ({
    ...offer,
    request: requestMap.get(offer.requestId),
  }));
}

export async function getOffersByRequest(requestId: string): Promise<OfferData[]> {
  const allRecords = await offersTable.select().all();
  return allRecords
    .filter((record) => getRequestIdFromRecord(record) === requestId)
    .map(mapRecordToOffer);
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
