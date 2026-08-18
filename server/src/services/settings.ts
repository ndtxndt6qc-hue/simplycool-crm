import { db } from "../db/client.js";
import { settings } from "../db/schema.js";

export async function getOrCreateSettings() {
  const [existing] = await db.select().from(settings).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(settings).values({}).returning();
  return created;
}
