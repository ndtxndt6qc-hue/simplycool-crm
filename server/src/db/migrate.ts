import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

async function run() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL ?? "postgres://localhost:5432/klimainstall",
  });
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: "./drizzle" });
  await pool.end();
  console.log("Migrations abgeschlossen.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
