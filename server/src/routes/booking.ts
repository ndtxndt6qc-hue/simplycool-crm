import { Router } from "express";
import { z } from "zod";
import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "../db/client.js";
import { bookingAvailabilityRules, bookingBlockedSlots, bookings } from "../db/schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { BOOKING_STATUS } from "@klimainstall/shared";

export const bookingRouter = Router();

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const ruleSchema = z.object({
  wochentag: z.number().int().min(0).max(6),
  startzeit: z.string().regex(timeRegex),
  endzeit: z.string().regex(timeRegex),
  aktiv: z.boolean().optional(),
});

bookingRouter.get(
  "/availability-rules",
  asyncHandler(async (_req, res) => {
    const rows = await db.select().from(bookingAvailabilityRules).orderBy(bookingAvailabilityRules.wochentag);
    res.json(rows);
  })
);

bookingRouter.post(
  "/availability-rules",
  asyncHandler(async (req, res) => {
    const parsed = ruleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    if (parsed.data.endzeit <= parsed.data.startzeit) {
      res.status(400).json({ error: "Endzeit muss nach der Startzeit liegen." });
      return;
    }
    const [rule] = await db.insert(bookingAvailabilityRules).values(parsed.data).returning();
    res.status(201).json(rule);
  })
);

bookingRouter.patch(
  "/availability-rules/:id",
  asyncHandler(async (req, res) => {
    const parsed = ruleSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const [rule] = await db
      .update(bookingAvailabilityRules)
      .set(parsed.data)
      .where(eq(bookingAvailabilityRules.id, Number(req.params.id)))
      .returning();
    if (!rule) {
      res.status(404).json({ error: "Regel nicht gefunden." });
      return;
    }
    res.json(rule);
  })
);

bookingRouter.delete(
  "/availability-rules/:id",
  asyncHandler(async (req, res) => {
    await db.delete(bookingAvailabilityRules).where(eq(bookingAvailabilityRules.id, Number(req.params.id)));
    res.status(204).send();
  })
);

const blockedSlotSchema = z.object({
  datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startzeit: z.string().regex(timeRegex).optional().or(z.literal("")),
  endzeit: z.string().regex(timeRegex).optional().or(z.literal("")),
  grund: z.string().optional(),
});

bookingRouter.get(
  "/blocked-slots",
  asyncHandler(async (req, res) => {
    const { von, bis } = req.query as { von?: string; bis?: string };
    const conditions = [];
    if (von) conditions.push(gte(bookingBlockedSlots.datum, von));
    if (bis) conditions.push(lte(bookingBlockedSlots.datum, bis));
    const rows = await db
      .select()
      .from(bookingBlockedSlots)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(bookingBlockedSlots.datum);
    res.json(rows);
  })
);

bookingRouter.post(
  "/blocked-slots",
  asyncHandler(async (req, res) => {
    const parsed = blockedSlotSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const [slot] = await db
      .insert(bookingBlockedSlots)
      .values({
        datum: parsed.data.datum,
        startzeit: parsed.data.startzeit || undefined,
        endzeit: parsed.data.endzeit || undefined,
        grund: parsed.data.grund,
      })
      .returning();
    res.status(201).json(slot);
  })
);

bookingRouter.delete(
  "/blocked-slots/:id",
  asyncHandler(async (req, res) => {
    await db.delete(bookingBlockedSlots).where(eq(bookingBlockedSlots.id, Number(req.params.id)));
    res.status(204).send();
  })
);

bookingRouter.get(
  "/bookings",
  asyncHandler(async (req, res) => {
    const { von, bis } = req.query as { von?: string; bis?: string };
    const conditions = [];
    if (von) conditions.push(gte(bookings.datum, von));
    if (bis) conditions.push(lte(bookings.datum, bis));
    const rows = await db
      .select()
      .from(bookings)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(bookings.datum, bookings.startzeit);
    res.json(rows);
  })
);

bookingRouter.patch(
  "/bookings/:id",
  asyncHandler(async (req, res) => {
    const parsed = z.object({ status: z.enum(BOOKING_STATUS) }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const [booking] = await db
      .update(bookings)
      .set({ status: parsed.data.status })
      .where(eq(bookings.id, Number(req.params.id)))
      .returning();
    if (!booking) {
      res.status(404).json({ error: "Buchung nicht gefunden." });
      return;
    }
    res.json(booking);
  })
);
