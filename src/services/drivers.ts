import type { FieldSet, Record as AirtableRecord } from "airtable";
import bcrypt from "bcryptjs";
import { driversTable } from "@/lib/airtable";
import type { Driver, CreateDriverData, DriverAuthProvider } from "@/models";

function mapRecordToDriver(record: AirtableRecord<FieldSet>): Driver {
  return {
    id: record.id,
    email: record.get("email") as string,
    name: record.get("name") as string,
    password: record.get("password") as string | undefined,
    phone: record.get("phone") as string | undefined,
    provider: (record.get("provider") as DriverAuthProvider) || "email",
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

export async function findOrCreateDriverByOAuth(data: {
  email: string;
  name: string;
  provider: string;
}): Promise<Driver> {
  const existingDriver = await findDriverByEmail(data.email);

  if (existingDriver) {
    return existingDriver;
  }

  const record = await driversTable.create({
    email: data.email,
    name: data.name,
    phone: "",
    provider: data.provider,
  });

  return mapRecordToDriver(record);
}
