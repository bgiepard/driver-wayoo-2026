import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { notificationsTable, safe } from "@/lib/airtable";

const PAGE_SIZE = 7;

interface SessionUser {
  id?: string;
  email?: string | null;
}

function mapRecord(record: { id: string; get: (field: string) => unknown }) {
  return {
    id: record.id,
    userId: record.get("userId") as string,
    type: record.get("type") as string,
    title: record.get("title") as string,
    message: record.get("message") as string,
    link: (record.get("link") as string) || undefined,
    read: (record.get("read") as boolean) || false,
    createdAt: record.get("createdAt") as string,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = session.user as SessionUser;
  const driverId = user.id || "";

  if (!driverId) {
    return res.status(401).json({ error: "Driver ID not found" });
  }

  // GET - pobierz powiadomienia z paginacją
  if (req.method === "GET") {
    const limit = Math.min(parseInt(req.query.limit as string) || PAGE_SIZE, 100);

    try {
      // Pobieramy o 1 więcej niż limit — żeby sprawdzić czy są kolejne
      const records = await notificationsTable
        .select({
          filterByFormula: `{userId} = '${safe(driverId)}'`,
          sort: [{ field: "createdAt", direction: "desc" }],
          maxRecords: limit + 1,
        })
        .all();

      const hasMore = records.length > limit;
      const notifications = records.slice(0, limit).map(mapRecord);

      return res.status(200).json({ notifications, hasMore });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return res.status(500).json({ error: "Failed to fetch notifications" });
    }
  }

  // POST - utwórz nowe powiadomienie
  if (req.method === "POST") {
    const { type, title, message, link } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const record = await notificationsTable.create({
        userId: driverId,
        type,
        title,
        message,
        link: link || "",
        read: false,
        createdAt: new Date().toISOString(),
      });

      return res.status(201).json(mapRecord(record));
    } catch (error) {
      console.error("Error creating notification:", error);
      return res.status(500).json({ error: "Failed to create notification" });
    }
  }

  // PATCH - oznacz wszystkie jako przeczytane
  if (req.method === "PATCH") {
    try {
      const unreadRecords = await notificationsTable
        .select({
          filterByFormula: `AND({userId} = '${safe(driverId)}', {read} = FALSE())`,
        })
        .all();

      const updates = unreadRecords.map((record) => ({
        id: record.id,
        fields: { read: true },
      }));

      for (let i = 0; i < updates.length; i += 10) {
        await notificationsTable.update(updates.slice(i, i + 10));
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      return res.status(500).json({ error: "Failed to mark notifications as read" });
    }
  }

  // DELETE - usuń powiadomienie
  if (req.method === "DELETE") {
    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Missing notification id" });
    }

    try {
      // Sprawdź czy powiadomienie należy do tego kierowcy
      const record = await notificationsTable.find(id);
      const recordUserId = record.get("userId") as string;

      if (recordUserId !== driverId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await notificationsTable.destroy(id);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting notification:", error);
      return res.status(500).json({ error: "Failed to delete notification" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
