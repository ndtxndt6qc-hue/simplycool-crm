import { Router } from "express";
import { z } from "zod";
import { eq, ilike, or } from "drizzle-orm";
import { db } from "../db/client.js";
import { gemeindeAnforderungen } from "../db/schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { GEMEINDE_ANFORDERUNGSTYPEN } from "@klimainstall/shared";

export const gemeindeAnforderungenRouter = Router();

const gemeindeAnforderungSchema = z.object({
  kanton: z.string().length(2),
  gemeindeName: z.string().min(1),
  bfsNummer: z.number().int().positive().optional(),
  anforderungstyp: z.enum(GEMEINDE_ANFORDERUNGSTYPEN).default("unklar_abklaeren"),
  beschreibung: z.string().optional(),
  kostenPauschale: z.number().nonnegative().optional(),
  bearbeitungsdauerTage: z.number().int().nonnegative().optional(),
  quelle: z.string().optional(),
  zuletztGeprueftAm: z.string().optional(),
});

gemeindeAnforderungenRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const rows = search
      ? await db
          .select()
          .from(gemeindeAnforderungen)
          .where(or(ilike(gemeindeAnforderungen.gemeindeName, `%${search}%`), ilike(gemeindeAnforderungen.kanton, `%${search}%`)))
          .orderBy(gemeindeAnforderungen.kanton, gemeindeAnforderungen.gemeindeName)
      : await db
          .select()
          .from(gemeindeAnforderungen)
          .orderBy(gemeindeAnforderungen.kanton, gemeindeAnforderungen.gemeindeName);
    res.json(rows);
  })
);

gemeindeAnforderungenRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const [row] = await db.select().from(gemeindeAnforderungen).where(eq(gemeindeAnforderungen.id, Number(req.params.id)));
    if (!row) {
      res.status(404).json({ error: "Gemeinde-Eintrag nicht gefunden." });
      return;
    }
    res.json(row);
  })
);

gemeindeAnforderungenRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = gemeindeAnforderungSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { kostenPauschale, ...rest } = parsed.data;
    const [row] = await db
      .insert(gemeindeAnforderungen)
      .values({
        ...rest,
        kanton: rest.kanton.toUpperCase(),
        kostenPauschale: kostenPauschale?.toString(),
        aktualisiertAm: new Date(),
      })
      .returning();
    res.status(201).json(row);
  })
);

gemeindeAnforderungenRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const parsed = gemeindeAnforderungSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { kostenPauschale, kanton, ...rest } = parsed.data;
    const [row] = await db
      .update(gemeindeAnforderungen)
      .set({
        ...rest,
        ...(kanton !== undefined ? { kanton: kanton.toUpperCase() } : {}),
        ...(kostenPauschale !== undefined ? { kostenPauschale: kostenPauschale.toString() } : {}),
        aktualisiertAm: new Date(),
      })
      .where(eq(gemeindeAnforderungen.id, Number(req.params.id)))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Gemeinde-Eintrag nicht gefunden." });
      return;
    }
    res.json(row);
  })
);

gemeindeAnforderungenRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await db.delete(gemeindeAnforderungen).where(eq(gemeindeAnforderungen.id, Number(req.params.id)));
    res.status(204).send();
  })
);
