import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { gemeindeAnforderungen } from "./schema.js";

const AARGAU_STARTPUNKT = ["Rüfenach", "Baden", "Brugg", "Aarau", "Wettingen"];

async function run() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL ?? "postgres://localhost:5432/klimainstall",
  });
  const db = drizzle(pool);

  await db
    .insert(gemeindeAnforderungen)
    .values(
      AARGAU_STARTPUNKT.map((gemeindeName) => ({
        kanton: "AG",
        gemeindeName,
        anforderungstyp: "unklar_abklaeren" as const,
        beschreibung: "Noch nicht verifiziert — bitte bei der Gemeinde abklären und Eintrag ergänzen.",
      }))
    )
    .onConflictDoNothing();

  await pool.end();
  console.log("Seed-Daten für Gemeinde-Anforderungen eingefügt (bereits vorhandene Einträge übersprungen).");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
