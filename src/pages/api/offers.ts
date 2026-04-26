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
import { notificationsTable, driversTable, usersTable } from "@/lib/airtable";

const OFFER_POINT_COST = 1;

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
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 500);
      const status = req.query.status as string | undefined;

      const all = await getOffersByDriverWithRequests(driverId);
      const filtered = status ? all.filter((o) => o.status === status) : all;
      const hasMore = filtered.length > limit;
      const offers = filtered.slice(0, limit);

      return res.status(200).json({ offers, hasMore });
    } catch {
      return res.status(500).json({ error: "Failed to fetch offers" });
    }
  }

  if (req.method === "POST") {
    const { requestId, message, vehicleId } = req.body;
    const price = parseFloat(req.body.price);

    if (!requestId) {
      return res.status(400).json({ error: "Request ID is required" });
    }

    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ error: "Cena musi być liczbą większą od zera" });
    }

    try {
      // Sprawdź saldo punktów kierowcy
      const driverRecord = await driversTable.find(driverId);
      const currentPoints = (driverRecord.get("points") as number) || 0;

      if (currentPoints < OFFER_POINT_COST) {
        return res.status(403).json({ error: "insufficient_points", message: "Nie masz wystarczającej liczby punktów, aby złożyć ofertę." });
      }

      const alreadyOffered = await hasDriverOfferedOnRequest(driverId, requestId);
      if (alreadyOffered) {
        return res.status(400).json({ error: "Juz zlozyles oferte na to zlecenie" });
      }

      const offer = await createOffer(requestId, driverId, price, message || "", vehicleId);

      // Odejmij punkt po udanym stworzeniu oferty
      try {
        await driversTable.update(driverId, { points: currentPoints - OFFER_POINT_COST });
      } catch (pointsError) {
        console.error("[api/offers] Błąd odejmowania punktów:", pointsError);
      }

      // Pobierz request i dane pasażera
      const request = await getRequestById(requestId);
      const passengerId = request?.userId;

      let passengerContact: { name: string | null; phone: string | null; email: string | null } = {
        name: null,
        phone: null,
        email: request?.userEmail || null,
      };

      if (passengerId) {
        try {
          const userRecord = await usersTable.find(passengerId);
          passengerContact = {
            name: `${userRecord.get("firstName") || ""} ${userRecord.get("lastName") || ""}`.trim() || null,
            phone: (userRecord.get("phone") as string) || null,
            email: (userRecord.get("email") as string) || request?.userEmail || null,
          };
        } catch {
          // Fallback — używamy danych z requestu
        }
      }

      // Parsuj trasę dla powiadomienia
      let routeOrigin = "";
      let routeDestination = "";
      try {
        const route = JSON.parse(request?.route || "{}");
        routeOrigin = route.origin?.address?.split(",")[0] || "";
        routeDestination = route.destination?.address?.split(",")[0] || "";
      } catch {
        // Ignore parse errors
      }

      const routeLabel = routeOrigin && routeDestination ? `${routeOrigin} → ${routeDestination}` : "";

      // Zapisz powiadomienie dla pasażera
      if (passengerId) {
        try {
          await notificationsTable.create({
            userId: passengerId,
            type: "new_offer",
            title: routeLabel || "Nowa oferta!",
            message: `${user.name || "Kierowca"} zlozyl oferte: ${offer.price} PLN`,
            link: `/request/${requestId}/offers`,
            read: false,
            createdAt: new Date().toISOString(),
          });
        } catch {
          // Ignore notification errors
        }
      }

      // Wyślij Pusher do pasażera
      try {
        await notifyNewOffer(requestId, {
          offerId: offer.id,
          requestId: offer.requestId,
          driverId: offer.driverId,
          driverName: user.name || undefined,
          price: offer.price,
          message: offer.message,
          routeOrigin,
          routeDestination,
        });
      } catch {
        // Ignore Pusher errors
      }

      return res.status(201).json({
        ...offer,
        passengerContact,
        pointsRemaining: currentPoints - OFFER_POINT_COST,
      });
    } catch {
      return res.status(500).json({ error: "Failed to create offer" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
