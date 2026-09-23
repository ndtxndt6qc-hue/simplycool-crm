import { Router } from "express";
import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { db } from "../db/client.js";
import {
  customers,
  devices,
  orderChecklistItems,
  orderDocuments,
  orderItems,
  orderReferenzFotos,
  orders,
  properties,
  quoteItems,
  quotes,
  stockMovements,
} from "../db/schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { CHECKLIST_PUNKTE, ORDER_DOCUMENT_TYPEN, ORDER_REFERENZ_FOTO_TYPEN, ORDER_STATUS } from "@klimainstall/shared";
import { getOrCreateSettings } from "../services/settings.js";
import { renderAbnahmeprotokollPdf } from "../pdf/abnahmeprotokollPdf.js";

export const ordersRouter = Router();

const ORDER_DOCUMENT_DIR = path.resolve(process.cwd(), "uploads", "order-documents");
fs.mkdirSync(ORDER_DOCUMENT_DIR, { recursive: true });

const orderDocumentUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, ORDER_DOCUMENT_DIR),
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (
      !["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(file.mimetype)
    ) {
      cb(new Error("Nur PDF, PNG oder JPEG erlaubt."));
      return;
    }
    cb(null, true);
  },
});

const ORDER_REFERENZ_FOTO_DIR = path.resolve(process.cwd(), "uploads", "order-referenz-fotos");
fs.mkdirSync(ORDER_REFERENZ_FOTO_DIR, { recursive: true });

const orderReferenzFotoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, ORDER_REFERENZ_FOTO_DIR),
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.mimetype)) {
      cb(new Error("Nur PNG, JPEG oder WEBP erlaubt."));
      return;
    }
    cb(null, true);
  },
});

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
    const documents = await db
      .select()
      .from(orderDocuments)
      .where(eq(orderDocuments.orderId, orderId));
    const referenzFotos = await db
      .select()
      .from(orderReferenzFotos)
      .where(eq(orderReferenzFotos.orderId, orderId));

    res.json({
      ...row.order,
      customer: row.customer,
      property: row.property,
      items,
      checklist,
      documents,
      referenzFotos,
    });
  })
);

ordersRouter.post(
  "/:id/referenz-fotos",
  orderReferenzFotoUpload.single("datei"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "Keine Datei erhalten." });
      return;
    }
    const orderId = Number(req.params.id);
    const typRaw = typeof req.body?.typ === "string" ? req.body.typ : "";
    if (!ORDER_REFERENZ_FOTO_TYPEN.includes(typRaw as (typeof ORDER_REFERENZ_FOTO_TYPEN)[number])) {
      res.status(400).json({ error: "typ muss 'vorher' oder 'nachher' sein." });
      return;
    }
    const dateipfad = `/uploads/order-referenz-fotos/${req.file.filename}`;
    const [foto] = await db
      .insert(orderReferenzFotos)
      .values({ orderId, typ: typRaw as (typeof ORDER_REFERENZ_FOTO_TYPEN)[number], dateipfad })
      .returning();
    res.status(201).json(foto);
  })
);

ordersRouter.delete(
  "/:id/referenz-fotos/:fotoId",
  asyncHandler(async (req, res) => {
    await db.delete(orderReferenzFotos).where(eq(orderReferenzFotos.id, Number(req.params.fotoId)));
    res.status(204).send();
  })
);

ordersRouter.post(
  "/:id/documents",
  orderDocumentUpload.single("datei"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "Keine Datei erhalten." });
      return;
    }
    const orderId = Number(req.params.id);
    const typRaw = typeof req.body?.typ === "string" ? req.body.typ : "abnahmeprotokoll_signiert";
    const typ = ORDER_DOCUMENT_TYPEN.includes(typRaw as (typeof ORDER_DOCUMENT_TYPEN)[number])
      ? (typRaw as (typeof ORDER_DOCUMENT_TYPEN)[number])
      : "abnahmeprotokoll_signiert";
    const dateipfad = `/uploads/order-documents/${req.file.filename}`;
    const [document] = await db
      .insert(orderDocuments)
      .values({ orderId, typ, dateipfad })
      .returning();
    res.status(201).json(document);
  })
);

ordersRouter.delete(
  "/:id/documents/:docId",
  asyncHandler(async (req, res) => {
    await db.delete(orderDocuments).where(eq(orderDocuments.id, Number(req.params.docId)));
    res.status(204).send();
  })
);

const abnahmeprotokollSchema = z.object({
  unterzeichnerName: z.string().trim().min(1, "Name ist erforderlich."),
  bemerkungen: z.string().trim().optional(),
  unterschriftDataUrl: z.string().startsWith("data:image/png;base64,", "Unterschrift fehlt."),
});

ordersRouter.post(
  "/:id/abnahmeprotokoll",
  asyncHandler(async (req, res) => {
    const parsed = abnahmeprotokollSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." });
      return;
    }
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

    const abgeschlossenAm = new Date();
    const [updatedOrder] = await db
      .update(orders)
      .set({
        abnahmeUnterzeichnerName: parsed.data.unterzeichnerName,
        abnahmeBemerkungen: parsed.data.bemerkungen || null,
        abnahmeUnterschrift: parsed.data.unterschriftDataUrl,
        abnahmeAbgeschlossenAm: abgeschlossenAm,
      })
      .where(eq(orders.id, orderId))
      .returning();

    await db
      .update(orderChecklistItems)
      .set({ erledigt: true, erledigtAm: abgeschlossenAm })
      .where(and(eq(orderChecklistItems.orderId, orderId), eq(orderChecklistItems.bezeichnung, "abnahme_kunde")));

    const settings = await getOrCreateSettings();
    const pdfBuffer = await renderAbnahmeprotokollPdf({
      order: updatedOrder,
      customer: row.customer,
      property: row.property,
      settings,
      unterzeichnerName: parsed.data.unterzeichnerName,
      bemerkungen: parsed.data.bemerkungen || "",
      unterschriftDataUrl: parsed.data.unterschriftDataUrl,
      abgeschlossenAm,
    });
    const filename = `${crypto.randomUUID()}.pdf`;
    fs.writeFileSync(path.join(ORDER_DOCUMENT_DIR, filename), pdfBuffer);
    const [document] = await db
      .insert(orderDocuments)
      .values({ orderId, typ: "abnahmeprotokoll_signiert", dateipfad: `/uploads/order-documents/${filename}` })
      .returning();

    res.status(201).json({ order: updatedOrder, document });
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

    const items = (await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId))).filter(
      (i) => !i.optional
    );

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
          einheit: i.einheit,
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
  referenzFreigegeben: z.boolean().optional(),
  referenzBeschreibung: z.string().optional(),
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
          const menge = Math.round(Number(item.menge));
          await db.insert(stockMovements).values({
            deviceId: item.deviceId,
            typ: "verbrauch_installation",
            menge: -menge,
            orderId,
          });
          await db
            .update(devices)
            .set({ lagerbestand: device.lagerbestand - menge })
            .where(eq(devices.id, item.deviceId));
          await db.update(orderItems).set({ status: "verbaut" }).where(eq(orderItems.id, item.id));
        }
        await db.update(orders).set({ status: "installation_durchgefuehrt" }).where(eq(orders.id, orderId));
      } else {
        for (const item of items) {
          if (!item.deviceId || item.status !== "verbaut") continue;
          const [device] = await db.select().from(devices).where(eq(devices.id, item.deviceId));
          if (!device) continue;
          const menge = Math.round(Number(item.menge));
          await db.insert(stockMovements).values({
            deviceId: item.deviceId,
            typ: "korrektur",
            menge,
            orderId,
            notiz: "Rückbuchung: Installation als nicht durchgeführt markiert",
          });
          await db
            .update(devices)
            .set({ lagerbestand: device.lagerbestand + menge })
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
