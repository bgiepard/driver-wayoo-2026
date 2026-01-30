import type { NextApiRequest, NextApiResponse } from "next";
import { findDriverByEmail, createDriver } from "@/services";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password, name, phone } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "Wszystkie pola sa wymagane" });
  }

  try {
    const existingDriver = await findDriverByEmail(email);

    if (existingDriver) {
      return res.status(400).json({ error: "Kierowca juz istnieje" });
    }

    const driver = await createDriver({ email, password, name, phone });

    return res.status(201).json({
      message: "Konto utworzone pomyslnie",
      driver: { id: driver.id, email: driver.email, name: driver.name },
    });
  } catch (error: unknown) {
    console.error("Registration error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: "Blad serwera", details: message });
  }
}
