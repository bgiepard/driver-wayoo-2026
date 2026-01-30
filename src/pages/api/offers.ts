import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import {
  createOffer,
  getOffersByDriverWithRequests,
  hasDriverOfferedOnRequest,
} from "@/services";
import { notifyNewOffer } from "@/lib/pusher";

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

  console.log("[API/offers] Session user:", { id: driverId, email: user.email, name: user.name });

  if (req.method === "GET") {
    try {
      const offers = await getOffersByDriverWithRequests(driverId);
      console.log("[API/offers] Found offers for driver:", offers.length);
      return res.status(200).json(offers);
    } catch (error) {
      console.error("[API/offers] Error fetching offers:", error);
      return res.status(500).json({ error: "Failed to fetch offers" });
    }
  }

  if (req.method === "POST") {
    const { requestId, price, message } = req.body;

    if (!requestId || !price) {
      return res.status(400).json({ error: "Request ID and price are required" });
    }

    try {
      const alreadyOffered = await hasDriverOfferedOnRequest(driverId, requestId);
      console.log("[API/offers] Already offered:", alreadyOffered);

      if (alreadyOffered) {
        return res.status(400).json({ error: "Juz zlozyles oferte na to zlecenie" });
      }

      const offer = await createOffer(requestId, driverId, price, message || "");
      console.log("[API/offers] Created offer:", offer);

      // Wyślij powiadomienie przez Pusher
      try {
        await notifyNewOffer(requestId, {
          offerId: offer.id,
          requestId: offer.requestId,
          driverId: offer.driverId,
          driverName: user.name || undefined,
          price: offer.price,
          message: offer.message,
        });
        console.log("[API/offers] Pusher notification sent");
      } catch (pusherError) {
        console.error("[API/offers] Pusher error:", pusherError);
        // Nie przerywamy - oferta została utworzona
      }

      return res.status(201).json(offer);
    } catch (error) {
      console.error("[API/offers] Error creating offer:", error);
      return res.status(500).json({ error: "Failed to create offer" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
