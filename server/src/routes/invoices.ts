import { Router } from "express";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import fs from "node:fs";
import path from "node:path";
import { db } from "../db/client.js";
import { customers, invoiceItems, invoices, orderItems, orders, payments, properties, reminders } from "../db/schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { INVOICE_STATUS } from "@klimainstall/shared";
import { getOrCreateSettings } from "../services/settings.js";
import { generateReference } from "../services/reference.js";
import { renderInvoicePdf } from "../pdf/invoicePdf.js";
import { renderReminderPdf } from "../pdf/reminderPdf.js";

export const invoicesRouter = Router();

async function getInvoiceTotals(invoiceId: number) {
  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  const netto = items.reduce((acc, i) => acc + Number(i.einzelpreis) * i.menge, 0);
  const paymentRows = await db.select().from(payments).where(eq(payments.invoiceId, invoiceId));
  const bezahlt = paymentRows.reduce((acc, p) => acc + Number(p.betrag), 0);
  return { items, netto, payments: paymentRows, bezahlt };
}

function computeDisplayStatus(status: string, faelligkeitsdatum: string, bezahlt: number, total: number) {
  if (status === "bezahlt") return "bezahlt";
  if (bezahlt >= total && total > 0) return "bezahlt";
  const overdue = new Date(faelligkeitsdatum) < new Date();
  if (overdue && status !== "bezahlt") return bezahlt > 0 ? "teilzahlung" : "ueberfaellig";
  return bezahlt > 0 ? "teilzahlung" : status;
}

invoicesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rows = await db
      .select({ invoice: invoices, customer: customers, order: orders })
      .from(invoices)
      .innerJoin(orders, eq(invoices.orderId, orders.id))
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .orderBy(sql`${invoices.createdAt} desc`);

    const withTotals = await Promise.all(
      rows.map(async ({ invoice, customer, order }) => {
        const { netto, bezahlt } = await getInvoiceTotals(invoice.id);
        const mwstBetrag = netto * (Number(invoice.mwstSatz) / 100);
        const total = netto + mwstBetrag;
        const displayStatus = computeDisplayStatus(invoice.status, invoice.faelligkeitsdatum, bezahlt, total);
        return { ...invoice, customer, order, total, bezahlt, displayStatus };
      })
    );

    res.json(withTotals);
  })
);

async function loadInvoiceDetail(invoiceId: number) {
  const [row] = await db
    .select({ invoice: invoices, customer: customers, order: orders })
    .from(invoices)
    .innerJoin(orders, eq(invoices.orderId, orders.id))
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(invoices.id, invoiceId));
  if (!row) return null;

  const [property] = await db.select().from(properties).where(eq(properties.id, row.order.propertyId));
  const { items, netto, payments: paymentRows, bezahlt } = await getInvoiceTotals(invoiceId);
  const reminderRows = await db.select().from(reminders).where(eq(reminders.invoiceId, invoiceId));
  const mwstBetrag = netto * (Number(row.invoice.mwstSatz) / 100);
  const total = netto + mwstBetrag;
  const displayStatus = computeDisplayStatus(row.invoice.status, row.invoice.faelligkeitsdatum, bezahlt, total);

  return {
    ...row.invoice,
    customer: row.customer,
    order: row.order,
    property,
    items,
    payments: paymentRows,
    reminders: reminderRows,
    netto,
    mwstBetrag,
    total,
    bezahlt,
    displayStatus,
  };
}

invoicesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const detail = await loadInvoiceDetail(Number(req.params.id));
    if (!detail) {
      res.status(404).json({ error: "Rechnung nicht gefunden." });
      return;
    }
    res.json(detail);
  })
);

invoicesRouter.post(
  "/from-order/:orderId",
  asyncHandler(async (req, res) => {
    const orderId = Number(req.params.orderId);
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) {
      res.status(404).json({ error: "Auftrag nicht gefunden." });
      return;
    }
    if (order.status !== "abgeschlossen") {
      res.status(400).json({ error: "Nur aus einem abgeschlossenen Auftrag kann eine Rechnung erstellt werden." });
      return;
    }
    const [existing] = await db.select().from(invoices).where(eq(invoices.orderId, orderId));
    if (existing) {
      res.status(409).json({ error: "Für diesen Auftrag besteht bereits eine Rechnung." });
      return;
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    const settings = await getOrCreateSettings();

    const faelligkeitsdatum = new Date();
    faelligkeitsdatum.setDate(faelligkeitsdatum.getDate() + 30);

    const [invoice] = await db
      .insert(invoices)
      .values({
        rechnungsnummer: "TEMP",
        orderId,
        faelligkeitsdatum: faelligkeitsdatum.toISOString().slice(0, 10),
        betragTotal: "0",
        mwstSatz: settings.defaultMwstSatz,
      })
      .returning();

    const rechnungsnummer = `RE-${String(invoice.id).padStart(5, "0")}`;
    const qrReferenznummer = generateReference(invoice.id, settings.iban, settings.qrIban);

    const [finalInvoice] = await db
      .update(invoices)
      .set({ rechnungsnummer, qrReferenznummer })
      .where(eq(invoices.id, invoice.id))
      .returning();

    if (items.length) {
      await db.insert(invoiceItems).values(
        items.map((i) => ({
          invoiceId: invoice.id,
          beschreibung: i.beschreibung,
          menge: i.menge,
          einzelpreis: i.einzelpreis,
          mwstSatz: settings.defaultMwstSatz,
        }))
      );
    }

    res.status(201).json(finalInvoice);
  })
);

invoicesRouter.get(
  "/by-order/:orderId",
  asyncHandler(async (req, res) => {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.orderId, Number(req.params.orderId)));
    if (!invoice) {
      res.status(404).json({ error: "Keine Rechnung für diesen Auftrag." });
      return;
    }
    res.json(invoice);
  })
);

const invoiceUpdateSchema = z.object({
  status: z.enum(INVOICE_STATUS).optional(),
  faelligkeitsdatum: z.string().optional(),
});

invoicesRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const parsed = invoiceUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const [invoice] = await db
      .update(invoices)
      .set(parsed.data)
      .where(eq(invoices.id, Number(req.params.id)))
      .returning();
    if (!invoice) {
      res.status(404).json({ error: "Rechnung nicht gefunden." });
      return;
    }
    res.json(invoice);
  })
);

const invoiceItemSchema = z.object({
  beschreibung: z.string().min(1),
  menge: z.number().positive(),
  einzelpreis: z.number(),
});

invoicesRouter.post(
  "/:id/items",
  asyncHandler(async (req, res) => {
    const parsed = invoiceItemSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const settings = await getOrCreateSettings();
    const [item] = await db
      .insert(invoiceItems)
      .values({
        invoiceId: Number(req.params.id),
        beschreibung: parsed.data.beschreibung,
        menge: parsed.data.menge,
        einzelpreis: parsed.data.einzelpreis.toString(),
        mwstSatz: settings.defaultMwstSatz,
      })
      .returning();
    res.status(201).json(item);
  })
);

invoicesRouter.patch(
  "/:id/items/:itemId",
  asyncHandler(async (req, res) => {
    const parsed = invoiceItemSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { einzelpreis, ...rest } = parsed.data;
    const [item] = await db
      .update(invoiceItems)
      .set({ ...rest, ...(einzelpreis !== undefined ? { einzelpreis: einzelpreis.toString() } : {}) })
      .where(eq(invoiceItems.id, Number(req.params.itemId)))
      .returning();
    if (!item) {
      res.status(404).json({ error: "Position nicht gefunden." });
      return;
    }
    res.json(item);
  })
);

invoicesRouter.delete(
  "/:id/items/:itemId",
  asyncHandler(async (req, res) => {
    await db.delete(invoiceItems).where(eq(invoiceItems.id, Number(req.params.itemId)));
    res.status(204).send();
  })
);

const paymentSchema = z.object({
  betrag: z.number().positive(),
  datum: z.string().optional(),
  notiz: z.string().optional(),
});

invoicesRouter.post(
  "/:id/payments",
  asyncHandler(async (req, res) => {
    const parsed = paymentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const invoiceId = Number(req.params.id);
    const [payment] = await db
      .insert(payments)
      .values({ invoiceId, betrag: parsed.data.betrag.toString(), notiz: parsed.data.notiz })
      .returning();

    const { netto, bezahlt } = await getInvoiceTotals(invoiceId);
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
    const mwstBetrag = netto * (Number(invoice!.mwstSatz) / 100);
    const total = netto + mwstBetrag;
    await db
      .update(invoices)
      .set({ status: bezahlt >= total ? "bezahlt" : "teilzahlung" })
      .where(eq(invoices.id, invoiceId));

    res.status(201).json(payment);
  })
);

async function loadDataForPdf(invoiceId: number) {
  const detail = await loadInvoiceDetail(invoiceId);
  if (!detail) return null;
  const settings = await getOrCreateSettings();
  return {
    invoice: detail,
    items: detail.items,
    customer: detail.customer,
    property: detail.property,
    order: detail.order,
    settings,
  };
}

invoicesRouter.get(
  "/:id/pdf",
  asyncHandler(async (req, res) => {
    const data = await loadDataForPdf(Number(req.params.id));
    if (!data) {
      res.status(404).json({ error: "Rechnung nicht gefunden." });
      return;
    }
    const pdfBuffer = await renderInvoicePdf(data);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${data.invoice.rechnungsnummer}.pdf"`);
    res.send(pdfBuffer);
  })
);

const REMINDER_DIR = path.resolve(process.cwd(), "uploads", "reminders");
fs.mkdirSync(REMINDER_DIR, { recursive: true });

const reminderSchema = z.object({ stufe: z.union([z.literal(1), z.literal(2)]) });

invoicesRouter.post(
  "/:id/reminders",
  asyncHandler(async (req, res) => {
    const parsed = reminderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const invoiceId = Number(req.params.id);
    const detail = await loadInvoiceDetail(invoiceId);
    if (!detail) {
      res.status(404).json({ error: "Rechnung nicht gefunden." });
      return;
    }
    const offenerBetrag = detail.total - detail.bezahlt;
    if (offenerBetrag <= 0) {
      res.status(400).json({ error: "Diese Rechnung ist bereits vollständig bezahlt." });
      return;
    }
    const settings = await getOrCreateSettings();
    const pdfBuffer = await renderReminderPdf({
      invoice: detail,
      customer: detail.customer,
      settings,
      stufe: parsed.data.stufe,
      offenerBetrag,
    });

    const filename = `mahnung-${invoiceId}-stufe${parsed.data.stufe}-${Date.now()}.pdf`;
    fs.writeFileSync(path.join(REMINDER_DIR, filename), pdfBuffer);

    const [reminder] = await db
      .insert(reminders)
      .values({ invoiceId, stufe: parsed.data.stufe, pdfPfad: `/uploads/reminders/${filename}` })
      .returning();

    res.status(201).json(reminder);
  })
);

invoicesRouter.get(
  "/:id/reminders",
  asyncHandler(async (req, res) => {
    const rows = await db.select().from(reminders).where(eq(reminders.invoiceId, Number(req.params.id)));
    res.json(rows);
  })
);
