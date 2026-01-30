import type { FieldSet, Record as AirtableRecord } from "airtable";
import bcrypt from "bcryptjs";
import { driversTable } from "@/lib/airtable";
import type { Driver, CreateDriverData } from "@/models";

function mapRecordToDriver(record: AirtableRecord<FieldSet>): Driver {
  return {
    id: record.id,
    email: record.get("email") as string,
    name: record.get("name") as string,
    password: record.get("password") as string,
    phone: record.get("phone") as string | undefined,
  };
}

export async function findDriverByEmail(email: string): Promise<Driver | null> {
  const records = await driversTable
    .select({
      filterByFormula: `{email} = '${email}'`,
      maxRecords: 1,
    })
    .firstPage();

  if (records.length === 0) return null;
  return mapRecordToDriver(records[0]);
}

export async function findDriverById(id: string): Promise<Driver | null> {
  try {
    const record = await driversTable.find(id);
    return mapRecordToDriver(record);
  } catch {
    return null;
  }
}

export async function createDriver(data: CreateDriverData): Promise<Driver> {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const record = await driversTable.create({
    email: data.email,
    password: hashedPassword,
    name: data.name,
    phone: data.phone || "",
  });

  return mapRecordToDriver(record);
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
