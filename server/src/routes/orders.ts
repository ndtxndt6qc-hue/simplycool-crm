import { Router } from "express";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import {
  customers,
  devices,
  orderChecklistItems,
  orderItems,
  orders,
  properties,
  quoteItems,
  quotes,
  stockMovements,
} from "../db/schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { CHECKLIST_PUNKTE, ORDER_STATUS } from "@klimainstall/shared";

export const ordersRouter = Router();

ordersRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rows = await db
      .select({ order: orders, customer: customers, property: properties })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .innerJoin(properties, eq(orders.propertyId, properties.id))
      .orderBy(sql`${orders.installationTermin} asc nulls last`);

    const withChecklist = await Promise.all(
      rows.map(async ({ order, customer, property }) => {
        const checklist = await db
          .select()
          .from(orderChecklistItems)
          .where(eq(orderChecklistItems.orderId, order.id));
        const erledigt = checklist.filter((c) => c.erledigt).length;
        return { ...order, customer, property, checklistErledigt: erledigt, checklistTotal: checklist.length };
      })
    );

    res.json(withChecklist);
  })
);

ordersRouter.get(
  "/by-quote/:quoteId",
  asyncHandler(async (req, res) => {
    const [order] = await db.select().from(orders).where(eq(orders.quoteId, Number(req.params.quoteId)));
    if (!order) {
      res.status(404).json({ error: "Kein Auftrag für dieses Angebot." });
      return;
    }
    res.json(order);
  })
);

ordersRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const orderId = Number(req.params.id);
    const [row] = await db
      .select({ order: orders, customer: customers, property: properties })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .innerJoin(properties, eq(orders.propertyId, properties.id))
      .where(eq(orders.id, orderId));

    if (!row) {
      res.status(404).json({ error: "Auftrag nicht gefunden." });
      return;
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    const checklist = await db
      .select()
      .from(orderChecklistItems)
      .where(eq(orderChecklistItems.orderId, orderId));

    res.json({ ...row.order, customer: row.customer, property: row.property, items, checklist });
  })
);

ordersRouter.post(
  "/from-quote/:quoteId",
  asyncHandler(async (req, res) => {
    const quoteId = Number(req.params.quoteId);
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, quoteId));
    if (!quote) {
      res.status(404).json({ error: "Angebot nicht gefunden." });
      return;
    }
    if (quote.status !== "angenommen") {
      res.status(400).json({ error: "Nur aus einem angenommenen Angebot kann ein Auftrag erstellt werden." });
      return;
    }
    const [existing] = await db.select().from(orders).where(eq(orders.quoteId, quoteId));
    if (existing) {
      res.status(409).json({ error: "Für dieses Angebot besteht bereits ein Auftrag." });
      return;
    }

    const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId));

    const [order] = await db
      .insert(orders)
      .values({
        auftragsnummer: "TEMP",
        quoteId,
        customerId: quote.customerId,
        propertyId: quote.propertyId,
        status: "offen",
      })
      .returning();

    const auftragsnummer = `AU-${String(order.id).padStart(5, "0")}`;
    const [finalOrder] = await db
      .update(orders)
      .set({ auftragsnummer })
      .where(eq(orders.id, order.id))
      .returning();

    if (items.length) {
      await db.insert(orderItems).values(
        items.map((i) => ({
          orderId: order.id,
          deviceId: i.deviceId,
          beschreibung: i.beschreibung,
          menge: i.menge,
          einzelpreis: i.einzelpreis,
          status: "reserviert" as const,
        }))
      );
    }

    await db.insert(orderChecklistItems).values(
      CHECKLIST_PUNKTE.map((bezeichnung) => ({ orderId: order.id, bezeichnung }))
    );

    res.status(201).json(finalOrder);
  })
);

const orderUpdateSchema = z.object({
  status: z.enum(ORDER_STATUS).optional(),
  installationTermin: z.string().nullable().optional(),
  bohrTermin: z.string().nullable().optional(),
  bohrpartnerId: z.number().int().nullable().optional(),
});

ordersRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const parsed = orderUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { installationTermin, bohrTermin, ...rest } = parsed.data;
    const [order] = await db
      .update(orders)
      .set({
        ...rest,
        ...(installationTermin !== undefined ? { installationTermin: installationTermin ? new Date(installationTermin) : null } : {}),
        ...(bohrTermin !== undefined ? { bohrTermin: bohrTermin ? new Date(bohrTermin) : null } : {}),
      })
      .where(eq(orders.id, Number(req.params.id)))
      .returning();
    if (!order) {
      res.status(404).json({ error: "Auftrag nicht gefunden." });
      return;
    }
    res.json(order);
  })
);

ordersRouter.patch(
  "/:id/checklist/:itemId",
  asyncHandler(async (req, res) => {
    const schema = z.object({ erledigt: z.boolean() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const orderId = Number(req.params.id);
    const itemId = Number(req.params.itemId);

    const [checklistItem] = await db
      .update(orderChecklistItems)
      .set({ erledigt: parsed.data.erledigt, erledigtAm: parsed.data.erledigt ? new Date() : null })
      .where(eq(orderChecklistItems.id, itemId))
      .returning();

    if (!checklistItem) {
      res.status(404).json({ error: "Checklistenpunkt nicht gefunden." });
      return;
    }

    if (checklistItem.bezeichnung === "installation_durchgefuehrt") {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

      if (parsed.data.erledigt) {
        for (const item of items) {
          if (!item.deviceId || item.status !== "reserviert") continue;
          const [device] = await db.select().from(devices).where(eq(devices.id, item.deviceId));
          if (!device) continue;
          await db.insert(stockMovements).values({
            deviceId: item.deviceId,
            typ: "verbrauch_installation",
            menge: -item.menge,
            orderId,
          });
          await db
            .update(devices)
            .set({ lagerbestand: device.lagerbestand - item.menge })
            .where(eq(devices.id, item.deviceId));
          await db.update(orderItems).set({ status: "verbaut" }).where(eq(orderItems.id, item.id));
        }
        await db.update(orders).set({ status: "installation_durchgefuehrt" }).where(eq(orders.id, orderId));
      } else {
        for (const item of items) {
          if (!item.deviceId || item.status !== "verbaut") continue;
          const [device] = await db.select().from(devices).where(eq(devices.id, item.deviceId));
          if (!device) continue;
          await db.insert(stockMovements).values({
            deviceId: item.deviceId,
            typ: "korrektur",
            menge: item.menge,
            orderId,
            notiz: "Rückbuchung: Installation als nicht durchgeführt markiert",
          });
          await db
            .update(devices)
            .set({ lagerbestand: device.lagerbestand + item.menge })
            .where(eq(devices.id, item.deviceId));
          await db.update(orderItems).set({ status: "reserviert" }).where(eq(orderItems.id, item.id));
        }
        await db.update(orders).set({ status: "in_planung" }).where(eq(orders.id, orderId));
      }
    }

    const allChecklist = await db
      .select()
      .from(orderChecklistItems)
      .where(eq(orderChecklistItems.orderId, orderId));
    if (allChecklist.every((c) => c.erledigt)) {
      await db.update(orders).set({ status: "abgeschlossen" }).where(eq(orders.id, orderId));
    }

    res.json(checklistItem);
  })
);
