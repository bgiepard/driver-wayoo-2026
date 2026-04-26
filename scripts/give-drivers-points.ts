/**
 * Skrypt migracji: daje 20 punktów wszystkim kierowcom którzy mają points = 0 lub null.
 * Uruchom: npx tsx scripts/give-drivers-points.ts
 */
import Airtable from "airtable";
import { config } from "dotenv";
config({ path: ".env" });

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID!
);
const driversTable = base(process.env.AIRTABLE_DRIVERS_TABLE || "Drivers");

const DEFAULT_POINTS = 20;

async function main() {
  console.log("Pobieranie kierowców z Airtable...");

  const records = await driversTable.select().all();
  console.log(`Znaleziono ${records.length} kierowców.`);

  let updated = 0;
  let skipped = 0;

  for (const record of records) {
    const currentPoints = record.get("points") as number | undefined | null;

    if (!currentPoints || currentPoints === 0) {
      await driversTable.update(record.id, { points: DEFAULT_POINTS });
      console.log(`  ✓ ${record.get("name") || record.id} → ${DEFAULT_POINTS} pkt`);
      updated++;
    } else {
      console.log(`  - ${record.get("name") || record.id} → już ma ${currentPoints} pkt, pomijam`);
      skipped++;
    }
  }

  console.log(`\nGotowe! Zaktualizowano: ${updated}, pominięto: ${skipped}`);
}

main().catch((err) => {
  console.error("Błąd:", err);
  process.exit(1);
});
