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
  };
}

export async function getAvailableRequests(): Promise<RequestData[]> {
  const records = await requestsTable
    .select({
      filterByFormula: `{status} = 'published'`,
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

export async function getRequestsByIds(ids: string[]): Promise<RequestData[]> {
  if (ids.length === 0) return [];

  const requests: RequestData[] = [];

  for (const id of ids) {
    const request = await getRequestById(id);
    if (request) {
      requests.push(request);
    }
  }

  return requests;
}
