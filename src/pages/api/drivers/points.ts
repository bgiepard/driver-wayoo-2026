import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { driversTable } from "@/lib/airtable";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const driverId = (session.user as { id?: string }).id || "";

  try {
    const record = await driversTable.find(driverId);
    const points = (record.get("points") as number) ?? 0;
    return res.status(200).json({ points });
  } catch {
    return res.status(500).json({ error: "Nie udało się pobrać punktów" });
  }
}
