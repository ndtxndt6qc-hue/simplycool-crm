import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { partners } from "../db/schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { PARTNER_TYPEN } from "@klimainstall/shared";

export const partnersRouter = Router();

const partnerSchema = z.object({
  typ: z.enum(PARTNER_TYPEN),
  name: z.string().min(1),
  kontaktName: z.string().optional(),
  telefon: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  preisProBohrung: z.number().nonnegative().optional(),
  lieferzeitTage: z.number().int().nonnegative().optional(),
  notiz: z.string().optional(),
});

partnersRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const typ = req.query.typ as string | undefined;
    const all = await db.select().from(partners).orderBy(partners.name);
    res.json(typ ? all.filter((p) => p.typ === typ) : all);
  })
);

partnersRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = partnerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { preisProBohrung, email, ...rest } = parsed.data;
    const [partner] = await db
      .insert(partners)
      .values({ ...rest, email: email || undefined, preisProBohrung: preisProBohrung?.toString() })
      .returning();
    res.status(201).json(partner);
  })
);

partnersRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const parsed = partnerSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { preisProBohrung, email, ...rest } = parsed.data;
    const [partner] = await db
      .update(partners)
      .set({ ...rest, email: email || undefined, preisProBohrung: preisProBohrung?.toString() })
      .where(eq(partners.id, Number(req.params.id)))
      .returning();
    if (!partner) {
      res.status(404).json({ error: "Partner nicht gefunden." });
      return;
    }
    res.json(partner);
  })
);

partnersRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await db.delete(partners).where(eq(partners.id, Number(req.params.id)));
    res.status(204).send();
  })
);
