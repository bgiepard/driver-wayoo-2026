import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { vehiclesTable, driversTable } from "@/lib/airtable";
import type { Vehicle, CreateVehicleData } from "@/models";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ error: "Nie jestes zalogowany" });
  }

  // Pobierz ID kierowcy
  const driverRecords = await driversTable
    .select({
      filterByFormula: `{email} = '${session.user.email}'`,
      maxRecords: 1,
    })
    .firstPage();

  if (driverRecords.length === 0) {
    return res.status(404).json({ error: "Kierowca nie znaleziony" });
  }

  const driverId = driverRecords[0].id;

  // GET - Pobierz pojazdy kierowcy
  if (req.method === "GET") {
    try {
      const records = await vehiclesTable
        .select({
          filterByFormula: `{driverId} = '${driverId}'`,
          sort: [{ field: "createdAt", direction: "desc" }],
        })
        .all();

      const vehicles: Vehicle[] = records.map((record) => ({
        id: record.id,
        driverId: record.get("driverId") as string,
        name: record.get("name") as string,
        type: record.get("type") as Vehicle["type"],
        brand: record.get("brand") as string,
        model: record.get("model") as string,
        year: record.get("year") as number,
        seats: record.get("seats") as number,
        licensePlate: record.get("licensePlate") as string,
        color: record.get("color") as string,
        description: record.get("description") as string | undefined,
        photos: JSON.parse((record.get("photos") as string) || "[]"),
        hasWifi: record.get("hasWifi") as boolean,
        hasWC: record.get("hasWC") as boolean,
        hasTV: record.get("hasTV") as boolean,
        hasAirConditioning: record.get("hasAirConditioning") as boolean,
        hasPowerOutlets: record.get("hasPowerOutlets") as boolean,
        hasLuggage: record.get("hasLuggage") as boolean,
        isActive: record.get("isActive") as boolean,
        createdAt: record.get("createdAt") as string,
      }));

      return res.status(200).json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      return res.status(500).json({ error: "Blad pobierania pojazdow" });
    }
  }

  // POST - Dodaj nowy pojazd
  if (req.method === "POST") {
    try {
      const data: CreateVehicleData = req.body;

      if (!data.brand || !data.model || !data.seats || !data.licensePlate) {
        return res.status(400).json({ error: "Brakuje wymaganych pol" });
      }

      const record = await vehiclesTable.create({
        driverId,
        name: data.name,
        type: data.type,
        brand: data.brand,
        model: data.model,
        year: data.year || new Date().getFullYear(),
        seats: data.seats,
        licensePlate: data.licensePlate,
        color: data.color || "",
        description: data.description || "",
        photos: JSON.stringify(data.photos || []),
        hasWifi: data.hasWifi || false,
        hasWC: data.hasWC || false,
        hasTV: data.hasTV || false,
        hasAirConditioning: data.hasAirConditioning || false,
        hasPowerOutlets: data.hasPowerOutlets || false,
        hasLuggage: data.hasLuggage || false,
        isActive: true,
        createdAt: new Date().toISOString(),
      });

      return res.status(201).json({ id: record.id, message: "Pojazd dodany" });
    } catch (error) {
      console.error("Error creating vehicle:", error);
      return res.status(500).json({ error: "Blad dodawania pojazdu" });
    }
  }

  // PUT - Aktualizuj pojazd
  if (req.method === "PUT") {
    try {
      const { id, ...data } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Brak ID pojazdu" });
      }

      // Sprawdz czy pojazd nalezy do kierowcy
      const existingRecords = await vehiclesTable
        .select({
          filterByFormula: `AND({driverId} = '${driverId}', RECORD_ID() = '${id}')`,
          maxRecords: 1,
        })
        .firstPage();

      if (existingRecords.length === 0) {
        return res.status(404).json({ error: "Pojazd nie znaleziony" });
      }

      const updateData: Record<string, unknown> = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.brand !== undefined) updateData.brand = data.brand;
      if (data.model !== undefined) updateData.model = data.model;
      if (data.year !== undefined) updateData.year = data.year;
      if (data.seats !== undefined) updateData.seats = data.seats;
      if (data.licensePlate !== undefined) updateData.licensePlate = data.licensePlate;
      if (data.color !== undefined) updateData.color = data.color;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.photos !== undefined) updateData.photos = JSON.stringify(data.photos);
      if (data.hasWifi !== undefined) updateData.hasWifi = data.hasWifi;
      if (data.hasWC !== undefined) updateData.hasWC = data.hasWC;
      if (data.hasTV !== undefined) updateData.hasTV = data.hasTV;
      if (data.hasAirConditioning !== undefined) updateData.hasAirConditioning = data.hasAirConditioning;
      if (data.hasPowerOutlets !== undefined) updateData.hasPowerOutlets = data.hasPowerOutlets;
      if (data.hasLuggage !== undefined) updateData.hasLuggage = data.hasLuggage;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      await vehiclesTable.update(id, updateData);

      return res.status(200).json({ message: "Pojazd zaktualizowany" });
    } catch (error) {
      console.error("Error updating vehicle:", error);
      return res.status(500).json({ error: "Blad aktualizacji pojazdu" });
    }
  }

  // DELETE - Usun pojazd
  if (req.method === "DELETE") {
    try {
      const { id } = req.query;

      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Brak ID pojazdu" });
      }

      // Sprawdz czy pojazd nalezy do kierowcy
      const existingRecords = await vehiclesTable
        .select({
          filterByFormula: `AND({driverId} = '${driverId}', RECORD_ID() = '${id}')`,
          maxRecords: 1,
        })
        .firstPage();

      if (existingRecords.length === 0) {
        return res.status(404).json({ error: "Pojazd nie znaleziony" });
      }

      await vehiclesTable.destroy(id);

      return res.status(200).json({ message: "Pojazd usuniety" });
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      return res.status(500).json({ error: "Blad usuwania pojazdu" });
    }
  }

  return res.status(405).json({ error: "Metoda nie dozwolona" });
}
