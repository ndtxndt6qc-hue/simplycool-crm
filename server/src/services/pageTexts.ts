import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { pageTexts } from "../db/schema.js";

export async function getPageTextOverrides(): Promise<Record<string, string>> {
  const rows = await db.select().from(pageTexts);
  const map: Record<string, string> = {};
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export async function setPageTextOverride(key: string, value: string): Promise<void> {
  if (value.trim() === "") {
    await db.delete(pageTexts).where(eq(pageTexts.key, key));
    return;
  }
  await db
    .insert(pageTexts)
    .values({ key, value })
    .onConflictDoUpdate({ target: pageTexts.key, set: { value, updatedAt: new Date() } });
}
