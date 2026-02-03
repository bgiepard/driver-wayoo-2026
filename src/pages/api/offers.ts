import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import {
  createOffer,
  getOffersByDriverWithRequests,
  hasDriverOfferedOnRequest,
  getRequestById,
} from "@/services";
import { notifyNewOffer } from "@/lib/pusher";
import { notificationsTable } from "@/lib/airtable";

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
      const offers = await getOffersByDriverWithRequests(driverId);
      return res.status(200).json(offers);
    } catch {
      return res.status(500).json({ error: "Failed to fetch offers" });
    }
  }

  if (req.method === "POST") {
    const { requestId, price, message, vehicleId } = req.body;

    if (!requestId || !price) {
      return res.status(400).json({ error: "Request ID and price are required" });
    }

    try {
      const alreadyOffered = await hasDriverOfferedOnRequest(driverId, requestId);

      if (alreadyOffered) {
        return res.status(400).json({ error: "Juz zlozyles oferte na to zlecenie" });
      }

      const offer = await createOffer(requestId, driverId, price, message || "", vehicleId);

      // Pobierz request aby uzyskac userId pasazera
      const request = await getRequestById(requestId);
      const passengerId = request?.userId;

      // 1. Zapisz powiadomienie do bazy danych (dla pasazera)
      if (passengerId) {
        try {
          await notificationsTable.create({
            userId: passengerId,
            type: "new_offer",
            title: "Nowa oferta!",
            message: `${user.name || "Kierowca"} zlozyl oferte: ${offer.price} PLN`,
            link: `/request/${requestId}/offers`,
            read: false,
            createdAt: new Date().toISOString(),
          });
        } catch {
          // Ignore notification errors
        }
      }

      // 2. Wyslij powiadomienie przez Pusher (real-time)
      try {
        await notifyNewOffer(requestId, {
          offerId: offer.id,
          requestId: offer.requestId,
          driverId: offer.driverId,
          driverName: user.name || undefined,
          price: offer.price,
          message: offer.message,
        });
      } catch {
        // Ignore Pusher errors
      }

      return res.status(201).json(offer);
    } catch {
      return res.status(500).json({ error: "Failed to create offer" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
