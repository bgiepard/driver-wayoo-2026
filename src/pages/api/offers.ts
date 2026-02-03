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
    const { requestId, price, message, vehicleId } = req.body;

    if (!requestId || !price) {
      return res.status(400).json({ error: "Request ID and price are required" });
    }

    try {
      const alreadyOffered = await hasDriverOfferedOnRequest(driverId, requestId);
      console.log("[API/offers] Already offered:", alreadyOffered);

      if (alreadyOffered) {
        return res.status(400).json({ error: "Juz zlozyles oferte na to zlecenie" });
      }

      const offer = await createOffer(requestId, driverId, price, message || "", vehicleId);
      console.log("[API/offers] Created offer:", offer);

      // Pobierz request aby uzyskać userId pasażera
      const request = await getRequestById(requestId);
      console.log("[API/offers] Request found:", request);
      const passengerId = request?.userId;
      console.log("[API/offers] Passenger ID:", passengerId);

      // 1. Najpierw zapisz powiadomienie do bazy danych (dla pasażera)
      if (passengerId) {
        try {
          const notification = await notificationsTable.create({
            userId: passengerId,
            type: "new_offer",
            title: "Nowa oferta!",
            message: `${user.name || "Kierowca"} złożył ofertę: ${offer.price} PLN`,
            link: `/request/${requestId}/offers`,
            read: false,
            createdAt: new Date().toISOString(),
          });
          console.log("[API/offers] Notification saved to database:", notification.id);
        } catch (dbError) {
          console.error("[API/offers] Error saving notification to database:", dbError);
        }
      } else {
        console.error("[API/offers] BRAK passengerId! request:", JSON.stringify(request), "requestId:", requestId);
      }

      // 2. Potem wyślij powiadomienie przez Pusher (real-time)
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
      }

      return res.status(201).json(offer);
    } catch (error) {
      console.error("[API/offers] Error creating offer:", error);
      return res.status(500).json({ error: "Failed to create offer" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
