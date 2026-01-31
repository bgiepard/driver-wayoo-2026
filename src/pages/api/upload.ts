import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { v2 as cloudinary } from "cloudinary";

// Konfiguracja Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ error: "Nie jestes zalogowany" });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Brak zdjecia" });
    }

    // Sprawdź konfigurację
    console.log("Cloudinary config:", {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? "SET" : "NOT SET",
      api_secret: process.env.CLOUDINARY_API_SECRET ? "SET" : "NOT SET",
    });

    // Upload do Cloudinary
    const result = await cloudinary.uploader.upload(image, {
      folder: "wayoo-fleet",
      resource_type: "image",
    });

    console.log("Upload success:", result.secure_url);

    return res.status(200).json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error: unknown) {
    console.error("Upload error full:", JSON.stringify(error, null, 2));
    console.error("Upload error:", error);

    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null) {
      errorMessage = JSON.stringify(error);
    }

    return res.status(500).json({
      error: "Blad podczas uploadu zdjecia",
      details: errorMessage
    });
  }
}
