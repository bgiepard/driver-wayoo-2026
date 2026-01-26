import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { createOffer, getOffersByDriver, hasDriverOfferedOnRequest } from "@/lib/airtable";

interface SessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = session.user as SessionUser;
  const driverId = user.id || "";

  if (req.method === "GET") {
    try {
      const offers = await getOffersByDriver(driverId);
      return res.status(200).json(offers);
    } catch (error) {
      console.error("Error fetching offers:", error);
      return res.status(500).json({ error: "Failed to fetch offers" });
    }
  }

  if (req.method === "POST") {
    const { requestId, price, message } = req.body;

    if (!requestId || !price) {
      return res.status(400).json({ error: "Request ID and price are required" });
    }

    try {
      // Check if driver already made an offer on this request
      const alreadyOffered = await hasDriverOfferedOnRequest(driverId, requestId);
      if (alreadyOffered) {
        return res.status(400).json({ error: "Juz zlozyles oferte na to zlecenie" });
      }

      const offer = await createOffer(requestId, driverId, price, message || "");
      return res.status(201).json(offer);
    } catch (error) {
      console.error("Error creating offer:", error);
      return res.status(500).json({ error: "Failed to create offer" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
