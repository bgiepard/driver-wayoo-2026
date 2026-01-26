import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { getAvailableRequests, getRequestById } from "@/lib/airtable";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    const { id } = req.query;

    try {
      if (id && typeof id === "string") {
        const request = await getRequestById(id);
        if (!request) {
          return res.status(404).json({ error: "Request not found" });
        }
        return res.status(200).json(request);
      } else {
        const requests = await getAvailableRequests();
        return res.status(200).json(requests);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      return res.status(500).json({ error: "Failed to fetch requests" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
