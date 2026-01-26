import Airtable from "airtable";
import bcrypt from "bcryptjs";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID!
);

const driversTable = base(process.env.AIRTABLE_DRIVERS_TABLE || "Drivers");
const requestsTable = base("Requests");
const offersTable = base("Offers");

export interface Driver {
  id: string;
  email: string;
  name: string;
  password: string;
  phone?: string;
}

export async function findDriverByEmail(email: string): Promise<Driver | null> {
  const records = await driversTable
    .select({
      filterByFormula: `{email} = '${email}'`,
      maxRecords: 1,
    })
    .firstPage();

  if (records.length === 0) return null;

  const record = records[0];
  return {
    id: record.id,
    email: record.get("email") as string,
    name: record.get("name") as string,
    password: record.get("password") as string,
    phone: record.get("phone") as string | undefined,
  };
}

export async function createDriver(
  email: string,
  password: string,
  name: string,
  phone?: string
): Promise<Driver> {
  const hashedPassword = await bcrypt.hash(password, 10);

  const record = await driversTable.create({
    email,
    password: hashedPassword,
    name,
    phone: phone || "",
  });

  return {
    id: record.id,
    email: record.get("email") as string,
    name: record.get("name") as string,
    password: record.get("password") as string,
    phone: record.get("phone") as string | undefined,
  };
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// Request types
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
  status: number;
}

// Offer types
export interface OfferData {
  id: string;
  requestId: string;
  driverId: string;
  price: number;
  message: string;
  status: number; // 1 = pending, 2 = accepted, 3 = rejected
}

// Status dla Request: 2 = pending (new), 3 = has offers, 4 = accepted, 5 = completed, 6 = cancelled
// Status dla Offer: 1 = pending, 2 = accepted, 3 = rejected

export async function getAvailableRequests(): Promise<RequestData[]> {
  const records = await requestsTable
    .select({
      filterByFormula: `OR({status} = 2, {status} = 3)`,
    })
    .all();

  return records.map((record) => {
    const userLinks = record.get("User") as string[] | undefined;

    return {
      id: record.id,
      userId: userLinks?.[0] || (record.get("userId") as string),
      userEmail: record.get("userEmail") as string,
      from: record.get("from") as string,
      to: record.get("to") as string,
      date: record.get("date") as string,
      time: record.get("time") as string,
      adults: record.get("adults") as number,
      children: record.get("children") as number,
      options: record.get("options") as string,
      status: record.get("status") as number,
    };
  });
}

export async function getRequestById(id: string): Promise<RequestData | null> {
  try {
    const record = await requestsTable.find(id);
    const userLinks = record.get("User") as string[] | undefined;

    return {
      id: record.id,
      userId: userLinks?.[0] || (record.get("userId") as string),
      userEmail: record.get("userEmail") as string,
      from: record.get("from") as string,
      to: record.get("to") as string,
      date: record.get("date") as string,
      time: record.get("time") as string,
      adults: record.get("adults") as number,
      children: record.get("children") as number,
      options: record.get("options") as string,
      status: (record.get("status") as number) || 2,
    };
  } catch {
    return null;
  }
}

// Offer functions
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
    status: 1, // pending
  });

  // Update request status to "has offers" (3)
  await requestsTable.update(requestId, { status: 3 });

  const requestLinks = record.get("Request") as string[] | undefined;
  const driverLinks = record.get("Driver") as string[] | undefined;

  return {
    id: record.id,
    requestId: requestLinks?.[0] || "",
    driverId: driverLinks?.[0] || "",
    price: record.get("price") as number,
    message: record.get("message") as string,
    status: record.get("status") as number,
  };
}

export async function getOffersByDriver(driverId: string): Promise<OfferData[]> {
  const records = await offersTable
    .select({
      filterByFormula: `FIND("${driverId}", ARRAYJOIN({Driver}))`,
    })
    .all();

  return records.map((record) => {
    const requestLinks = record.get("Request") as string[] | undefined;
    const driverLinks = record.get("Driver") as string[] | undefined;

    return {
      id: record.id,
      requestId: requestLinks?.[0] || "",
      driverId: driverLinks?.[0] || "",
      price: record.get("price") as number,
      message: record.get("message") as string,
      status: (record.get("status") as number) || 1,
    };
  });
}

export async function getOffersByRequest(requestId: string): Promise<OfferData[]> {
  const records = await offersTable
    .select({
      filterByFormula: `FIND("${requestId}", ARRAYJOIN({Request}))`,
    })
    .all();

  return records.map((record) => {
    const requestLinks = record.get("Request") as string[] | undefined;
    const driverLinks = record.get("Driver") as string[] | undefined;

    return {
      id: record.id,
      requestId: requestLinks?.[0] || "",
      driverId: driverLinks?.[0] || "",
      price: record.get("price") as number,
      message: record.get("message") as string,
      status: (record.get("status") as number) || 1,
    };
  });
}

export async function hasDriverOfferedOnRequest(
  driverId: string,
  requestId: string
): Promise<boolean> {
  const records = await offersTable
    .select({
      filterByFormula: `AND(FIND("${driverId}", ARRAYJOIN({Driver})), FIND("${requestId}", ARRAYJOIN({Request})))`,
      maxRecords: 1,
    })
    .firstPage();

  return records.length > 0;
}
