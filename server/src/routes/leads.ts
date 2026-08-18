import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { leads } from "../db/schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { LEAD_QUELLEN, LEAD_STATUS } from "@klimainstall/shared";

export const leadsRouter = Router();

const leadCreateSchema = z.object({
  name: z.string().min(1),
  adresse: z.string().optional(),
  plz: z.string().optional(),
  ort: z.string().optional(),
  telefon: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  notiz: z.string().optional(),
  quelle: z.enum(LEAD_QUELLEN).default("sonstige"),
});

const leadUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  adresse: z.string().optional(),
  plz: z.string().optional(),
  ort: z.string().optional(),
  telefon: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  notiz: z.string().optional(),
  quelle: z.enum(LEAD_QUELLEN).optional(),
  status: z.enum(LEAD_STATUS).optional(),
});

leadsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const all = await db.select().from(leads).orderBy(leads.createdAt);
    res.json(all);
  })
);

leadsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const [lead] = await db.select().from(leads).where(eq(leads.id, Number(req.params.id)));
    if (!lead) {
      res.status(404).json({ error: "Lead nicht gefunden." });
      return;
    }
    res.json(lead);
  })
);

leadsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = leadCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const [lead] = await db
      .insert(leads)
      .values({ ...parsed.data, email: parsed.data.email || undefined })
      .returning();
    res.status(201).json(lead);
  })
);

leadsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const parsed = leadUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const [lead] = await db
      .update(leads)
      .set({ ...parsed.data, email: parsed.data.email || undefined, updatedAt: new Date() })
      .where(eq(leads.id, Number(req.params.id)))
      .returning();
    if (!lead) {
      res.status(404).json({ error: "Lead nicht gefunden." });
      return;
    }
    res.json(lead);
  })
);

leadsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await db.delete(leads).where(eq(leads.id, Number(req.params.id)));
    res.status(204).send();
  })
);
