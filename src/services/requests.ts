import type { FieldSet, Record as AirtableRecord } from "airtable";
import { requestsTable } from "@/lib/airtable";
import type { RequestData, RequestStatus } from "@/models";

function mapRecordToRequest(record: AirtableRecord<FieldSet>): RequestData {
  const userLinks = record.get("User") as string[] | undefined;

  return {
    id: record.id,
    userId: userLinks?.[0] || (record.get("userId") as string),
    userEmail: record.get("userEmail") as string,
    route: (record.get("route") as string) || "{}",
    date: record.get("date") as string,
    time: record.get("time") as string,
    adults: record.get("adults") as number,
    children: record.get("children") as number,
    options: record.get("options") as string,
    status: (record.get("status") as RequestStatus) || "published",
    createdAt: (record.get("Created") as string) || new Date().toISOString(),
  };
}

const PAGE_SIZE = 100;

export async function getAvailableRequests(): Promise<RequestData[]> {
  const records = await requestsTable
    .select({
      filterByFormula: `{status} = 'published'`,
      sort: [{ field: "Created", direction: "desc" }],
      maxRecords: PAGE_SIZE,
    })
    .all();

  return records.map(mapRecordToRequest);
}

export async function getRequestById(id: string): Promise<RequestData | null> {
  try {
    const record = await requestsTable.find(id);
    return mapRecordToRequest(record);
  } catch {
    return null;
  }
}

const BATCH_SIZE = 50;

export async function getRequestsByIds(ids: string[]): Promise<RequestData[]> {
  if (ids.length === 0) return [];

  const results: RequestData[] = [];

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const chunk = ids.slice(i, i + BATCH_SIZE);
    const formula = `OR(${chunk.map((id) => `RECORD_ID() = '${id}'`).join(",")})`;
    const records = await requestsTable.select({ filterByFormula: formula }).all();
    results.push(...records.map(mapRecordToRequest));
  }

  return results;
}
