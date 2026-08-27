import { Router } from "express";
import { z } from "zod";
import { eq, inArray } from "drizzle-orm";
import { db } from "../db/client.js";
import { customers, invoices, leads, orders, quotes } from "../db/schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { KUNDEN_TYPEN } from "@klimainstall/shared";

export const customersRouter = Router();

const customerSchema = z.object({
  typ: z.enum(KUNDEN_TYPEN).default("privat"),
  firma: z.string().optional(),
  vorname: z.string().optional(),
  nachname: z.string().min(1),
  strasse: z.string().min(1),
  plz: z.string().min(1),
  ort: z.string().min(1),
  telefon: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  notiz: z.string().optional(),
  leadId: z.number().int().optional(),
});

customersRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const all = await db.select().from(customers).orderBy(customers.nachname);
    res.json(all);
  })
);

customersRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const [customer] = await db.select().from(customers).where(eq(customers.id, Number(req.params.id)));
    if (!customer) {
      res.status(404).json({ error: "Kunde nicht gefunden." });
      return;
    }
    res.json(customer);
  })
);

customersRouter.get(
  "/:id/history",
  asyncHandler(async (req, res) => {
    const customerId = Number(req.params.id);
    const customerQuotes = await db
      .select()
      .from(quotes)
      .where(eq(quotes.customerId, customerId))
      .orderBy(quotes.datum);
    const customerOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(orders.createdAt);
    const orderIds = customerOrders.map((o) => o.id);
    const customerInvoices = orderIds.length
      ? await db.select().from(invoices).where(inArray(invoices.orderId, orderIds)).orderBy(invoices.datum)
      : [];
    res.json({ quotes: customerQuotes, orders: customerOrders, invoices: customerInvoices });
  })
);

customersRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = customerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { leadId, ...values } = parsed.data;
    const [customer] = await db
      .insert(customers)
      .values({ ...values, email: values.email || undefined })
      .returning();

    if (leadId) {
      await db.update(leads).set({ customerId: customer.id, updatedAt: new Date() }).where(eq(leads.id, leadId));
    }

    res.status(201).json(customer);
  })
);

customersRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const parsed = customerSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { leadId, ...values } = parsed.data;
    const [customer] = await db
      .update(customers)
      .set({ ...values, email: values.email || undefined })
      .where(eq(customers.id, Number(req.params.id)))
      .returning();
    if (!customer) {
      res.status(404).json({ error: "Kunde nicht gefunden." });
      return;
    }
    res.json(customer);
  })
);

customersRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await db.delete(customers).where(eq(customers.id, Number(req.params.id)));
    res.status(204).send();
  })
);
