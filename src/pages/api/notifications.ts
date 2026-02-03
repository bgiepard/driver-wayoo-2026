import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { notificationsTable } from "@/lib/airtable";

interface SessionUser {
  id?: string;
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

  if (!driverId) {
    return res.status(401).json({ error: "Driver ID not found" });
  }

  // GET - pobierz powiadomienia kierowcy
  if (req.method === "GET") {
    try {
      const records = await notificationsTable
        .select({
          filterByFormula: `{userId} = '${driverId}'`,
          sort: [{ field: "createdAt", direction: "desc" }],
          maxRecords: 50,
        })
        .all();

      const notifications = records.map((record) => ({
        id: record.id,
        userId: record.get("userId") as string,
        type: record.get("type") as string,
        title: record.get("title") as string,
        message: record.get("message") as string,
        link: (record.get("link") as string) || undefined,
        read: (record.get("read") as boolean) || false,
        createdAt: record.get("createdAt") as string,
      }));

      return res.status(200).json(notifications);
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

      const notification = {
        id: record.id,
        userId: record.get("userId") as string,
        type: record.get("type") as string,
        title: record.get("title") as string,
        message: record.get("message") as string,
        link: (record.get("link") as string) || undefined,
        read: false,
        createdAt: record.get("createdAt") as string,
      };

      return res.status(201).json(notification);
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
          filterByFormula: `AND({userId} = '${driverId}', {read} = FALSE())`,
        })
        .all();

      const updates = unreadRecords.map((record) => ({
        id: record.id,
        fields: { read: true },
      }));

      // Airtable pozwala max 10 rekordów na update
      for (let i = 0; i < updates.length; i += 10) {
        const batch = updates.slice(i, i + 10);
        await notificationsTable.update(batch);
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      return res.status(500).json({ error: "Failed to mark notifications as read" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
