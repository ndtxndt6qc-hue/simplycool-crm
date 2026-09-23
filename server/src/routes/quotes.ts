import { Router } from "express";
import { z } from "zod";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import {
  customers,
  devices,
  gemeindeAnforderungen,
  invoices,
  leads,
  orders,
  properties,
  quoteItems,
  quotes,
} from "../db/schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ABKLAERUNG_DURCH_OPTIONEN, QUOTE_ITEM_TYPEN, QUOTE_STATUS } from "@klimainstall/shared";
import { getOrCreateSettings } from "../services/settings.js";
import { renderQuotePdf } from "../pdf/quotePdf.js";
import { sendMail } from "../services/mailer.js";
import { findGemeindeMatch } from "../services/gemeindeMatch.js";

export const quotesRouter = Router();

const quoteCreateSchema = z.object({
  customerId: z.number().int(),
  propertyId: z.number().int(),
  leadId: z.number().int().optional(),
  gueltigBis: z.string().optional(),
});

const quoteUpdateSchema = z.object({
  status: z.enum(QUOTE_STATUS).optional(),
  gueltigBis: z.string().optional(),
  mwstSatz: z.number().nonnegative().optional(),
  abklaerungDurch: z.enum(ABKLAERUNG_DURCH_OPTIONEN).nullable().optional(),
});

const quoteItemSchema = z.object({
  typ: z.enum(QUOTE_ITEM_TYPEN),
  deviceId: z.number().int().optional(),
  beschreibung: z.string().min(1),
  menge: z.number().positive(),
  einheit: z.string().optional(),
  einzelpreis: z.number(),
  einkaufspreisIntern: z.number().default(0),
  optional: z.boolean().default(false),
});

async function isQuoteLocked(quote: { status: string }) {
  if (quote.status === "angenommen") return true;
  const settings = await getOrCreateSettings();
  return settings.angebotSperreNachVersand && quote.status !== "entwurf";
}

async function requireEditableQuote(quoteId: number) {
  const [quote] = await db.select().from(quotes).where(eq(quotes.id, quoteId));
  if (!quote) return { quote: null, locked: false };
  const locked = await isQuoteLocked(quote);
  return { quote, locked };
}

async function getQuoteTotals(quoteId: number) {
  const items = await db
    .select()
    .from(quoteItems)
    .where(eq(quoteItems.quoteId, quoteId))
    .orderBy(quoteItems.sortOrder);
  const verbindlich = items.filter((i) => !i.optional);
  const summe = verbindlich.reduce((acc, i) => acc + Number(i.einzelpreis) * Number(i.menge), 0);
  const deckungsbeitrag = verbindlich.reduce(
    (acc, i) => acc + (Number(i.einzelpreis) - Number(i.einkaufspreisIntern)) * Number(i.menge),
    0
  );
  const summeOptional = items
    .filter((i) => i.optional)
    .reduce((acc, i) => acc + Number(i.einzelpreis) * Number(i.menge), 0);
  return { items, summe, deckungsbeitrag, summeOptional };
}

quotesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rows = await db
      .select({
        quote: quotes,
        customer: customers,
        property: properties,
      })
      .from(quotes)
      .innerJoin(customers, eq(quotes.customerId, customers.id))
      .innerJoin(properties, eq(quotes.propertyId, properties.id))
      .orderBy(sql`${quotes.createdAt} desc`);

    const orderRows = await db
      .select({ id: orders.id, quoteId: orders.quoteId })
      .from(orders)
      .where(inArray(orders.quoteId, rows.map((r) => r.quote.id)));
    const orderIdByQuoteId = new Map(orderRows.map((o) => [o.quoteId, o.id]));
    const orderIds = orderRows.map((o) => o.id);
    const invoiceRows = orderIds.length
      ? await db
          .select({ orderId: invoices.orderId, rechnungsnummer: invoices.rechnungsnummer })
          .from(invoices)
          .where(inArray(invoices.orderId, orderIds))
      : [];
    const rechnungsnummerByOrderId = new Map(invoiceRows.map((i) => [i.orderId, i.rechnungsnummer]));

    const withTotals = await Promise.all(
      rows.map(async ({ quote, customer, property }) => {
        const { summe } = await getQuoteTotals(quote.id);
        const orderId = orderIdByQuoteId.get(quote.id);
        const rechnungsnummer = orderId !== undefined ? rechnungsnummerByOrderId.get(orderId) ?? null : null;
        return { ...quote, customer, property, summe, rechnungsnummer };
      })
    );

    res.json(withTotals);
  })
);

quotesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const quoteId = Number(req.params.id);
    const [row] = await db
      .select({ quote: quotes, customer: customers, property: properties })
      .from(quotes)
      .innerJoin(customers, eq(quotes.customerId, customers.id))
      .innerJoin(properties, eq(quotes.propertyId, properties.id))
      .where(eq(quotes.id, quoteId));

    if (!row) {
      res.status(404).json({ error: "Angebot nicht gefunden." });
      return;
    }

    const { items, summe, deckungsbeitrag, summeOptional } = await getQuoteTotals(quoteId);
    const locked = await isQuoteLocked(row.quote);
    res.json({
      ...row.quote,
      customer: row.customer,
      property: row.property,
      items,
      summe,
      deckungsbeitrag,
      summeOptional,
      locked,
    });
  })
);

quotesRouter.get(
  "/:id/gemeinde",
  asyncHandler(async (req, res) => {
    const quoteId = Number(req.params.id);
    const [row] = await db
      .select({ quote: quotes, property: properties })
      .from(quotes)
      .innerJoin(properties, eq(quotes.propertyId, properties.id))
      .where(eq(quotes.id, quoteId));
    if (!row) {
      res.status(404).json({ error: "Angebot nicht gefunden." });
      return;
    }

    let gemeindeId = row.quote.gemeindeAnforderungId;
    if (!gemeindeId) {
      const candidates = await db
        .select({ id: gemeindeAnforderungen.id, gemeindeName: gemeindeAnforderungen.gemeindeName })
        .from(gemeindeAnforderungen);
      const match = findGemeindeMatch(row.property.ort, candidates);
      if (match) {
        gemeindeId = match.id;
        await db.update(quotes).set({ gemeindeAnforderungId: gemeindeId }).where(eq(quotes.id, quoteId));
      }
    }

    const gemeinde = gemeindeId
      ? (await db.select().from(gemeindeAnforderungen).where(eq(gemeindeAnforderungen.id, gemeindeId)))[0] ?? null
      : null;

    res.json({ ort: row.property.ort, gemeinde, vorgeschlagen: row.quote.gemeindeAbklaerungVorgeschlagen });
  })
);

const quoteGemeindeSchema = z.object({ gemeindeAnforderungId: z.number().int().nullable() });

quotesRouter.patch(
  "/:id/gemeinde",
  asyncHandler(async (req, res) => {
    const parsed = quoteGemeindeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const quoteId = Number(req.params.id);
    const [quote] = await db
      .update(quotes)
      .set({
        gemeindeAnforderungId: parsed.data.gemeindeAnforderungId,
        gemeindeAbklaerungVorgeschlagen: false,
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, quoteId))
      .returning();
    if (!quote) {
      res.status(404).json({ error: "Angebot nicht gefunden." });
      return;
    }
    res.json(quote);
  })
);

quotesRouter.post(
  "/:id/gemeinde/apply-position",
  asyncHandler(async (req, res) => {
    const quoteId = Number(req.params.id);
    const { quote, locked } = await requireEditableQuote(quoteId);
    if (!quote) {
      res.status(404).json({ error: "Angebot nicht gefunden." });
      return;
    }
    if (locked) {
      res.status(423).json({ error: "Angebot ist gesperrt und kann nicht mehr bearbeitet werden." });
      return;
    }
    if (quote.gemeindeAbklaerungVorgeschlagen) {
      res.status(200).json({ skipped: true });
      return;
    }
    if (!quote.gemeindeAnforderungId) {
      res.status(400).json({ error: "Keine Gemeinde zugeordnet." });
      return;
    }
    const [gemeinde] = await db
      .select()
      .from(gemeindeAnforderungen)
      .where(eq(gemeindeAnforderungen.id, quote.gemeindeAnforderungId));
    if (!gemeinde || (gemeinde.anforderungstyp !== "meldepflicht" && gemeinde.anforderungstyp !== "baubewilligungspflicht")) {
      res.status(400).json({ error: "Für diese Gemeinde ist keine Kostenposition vorgesehen." });
      return;
    }
    const [maxRow] = await db
      .select({ maxSort: sql<number>`coalesce(max(${quoteItems.sortOrder}), -1)` })
      .from(quoteItems)
      .where(eq(quoteItems.quoteId, quoteId));
    const [item] = await db
      .insert(quoteItems)
      .values({
        quoteId,
        typ: "gemeindeabklaerung",
        beschreibung: `Meldung/Baugesuch Gemeinde ${gemeinde.gemeindeName}`,
        menge: "1",
        einzelpreis: gemeinde.kostenPauschale ?? "0",
        einkaufspreisIntern: "0",
        sortOrder: Number(maxRow.maxSort) + 1,
      })
      .returning();
    await db.update(quotes).set({ gemeindeAbklaerungVorgeschlagen: true, updatedAt: new Date() }).where(eq(quotes.id, quoteId));
    res.status(201).json({ item });
  })
);

quotesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = quoteCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const settings = await getOrCreateSettings();
    const [quote] = await db
      .insert(quotes)
      .values({
        ...parsed.data,
        angebotsnummer: "TEMP",
        mwstSatz: settings.defaultMwstSatz,
      })
      .returning();

    const angebotsnummer = `AN-${String(quote.id).padStart(5, "0")}`;
    const [final] = await db
      .update(quotes)
      .set({ angebotsnummer })
      .where(eq(quotes.id, quote.id))
      .returning();

    if (parsed.data.leadId) {
      await db
        .update(leads)
        .set({ status: "offeriert", updatedAt: new Date() })
        .where(eq(leads.id, parsed.data.leadId));
    }

    res.status(201).json(final);
  })
);

quotesRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const parsed = quoteUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { mwstSatz, gueltigBis, ...rest } = parsed.data;
    const quoteId = Number(req.params.id);
    if (mwstSatz !== undefined || gueltigBis !== undefined) {
      const { quote: existing, locked } = await requireEditableQuote(quoteId);
      if (!existing) {
        res.status(404).json({ error: "Angebot nicht gefunden." });
        return;
      }
      if (locked) {
        res.status(423).json({ error: "Angebot ist gesperrt und kann nicht mehr bearbeitet werden." });
        return;
      }
    }
    const [quote] = await db
      .update(quotes)
      .set({
        ...rest,
        ...(gueltigBis !== undefined ? { gueltigBis } : {}),
        ...(mwstSatz !== undefined ? { mwstSatz: mwstSatz.toString() } : {}),
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, quoteId))
      .returning();
    if (!quote) {
      res.status(404).json({ error: "Angebot nicht gefunden." });
      return;
    }

    if (parsed.data.status === "angenommen" && quote.leadId) {
      await db.update(leads).set({ status: "gewonnen", updatedAt: new Date() }).where(eq(leads.id, quote.leadId));
    } else if (parsed.data.status === "abgelehnt" && quote.leadId) {
      await db.update(leads).set({ status: "verloren", updatedAt: new Date() }).where(eq(leads.id, quote.leadId));
    }

    res.json(quote);
  })
);

quotesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await db.delete(quoteItems).where(eq(quoteItems.quoteId, Number(req.params.id)));
    await db.delete(quotes).where(eq(quotes.id, Number(req.params.id)));
    res.status(204).send();
  })
);

quotesRouter.post(
  "/:id/items",
  asyncHandler(async (req, res) => {
    const parsed = quoteItemSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { quote, locked } = await requireEditableQuote(Number(req.params.id));
    if (!quote) {
      res.status(404).json({ error: "Angebot nicht gefunden." });
      return;
    }
    if (locked) {
      res.status(423).json({ error: "Angebot ist gesperrt und kann nicht mehr bearbeitet werden." });
      return;
    }
    const [maxRow] = await db
      .select({ maxSort: sql<number>`coalesce(max(${quoteItems.sortOrder}), -1)` })
      .from(quoteItems)
      .where(eq(quoteItems.quoteId, Number(req.params.id)));
    const [item] = await db
      .insert(quoteItems)
      .values({
        quoteId: Number(req.params.id),
        typ: parsed.data.typ,
        deviceId: parsed.data.deviceId,
        beschreibung: parsed.data.beschreibung,
        menge: parsed.data.menge.toString(),
        einheit: parsed.data.einheit,
        einzelpreis: parsed.data.einzelpreis.toString(),
        einkaufspreisIntern: parsed.data.einkaufspreisIntern.toString(),
        sortOrder: Number(maxRow.maxSort) + 1,
        optional: parsed.data.optional,
      })
      .returning();
    res.status(201).json(item);
  })
);

quotesRouter.patch(
  "/:id/items/:itemId",
  asyncHandler(async (req, res) => {
    const parsed = quoteItemSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { quote, locked } = await requireEditableQuote(Number(req.params.id));
    if (!quote) {
      res.status(404).json({ error: "Angebot nicht gefunden." });
      return;
    }
    if (locked) {
      res.status(423).json({ error: "Angebot ist gesperrt und kann nicht mehr bearbeitet werden." });
      return;
    }
    const { einzelpreis, einkaufspreisIntern, menge, ...rest } = parsed.data;
    const [item] = await db
      .update(quoteItems)
      .set({
        ...rest,
        ...(einzelpreis !== undefined ? { einzelpreis: einzelpreis.toString() } : {}),
        ...(einkaufspreisIntern !== undefined ? { einkaufspreisIntern: einkaufspreisIntern.toString() } : {}),
        ...(menge !== undefined ? { menge: menge.toString() } : {}),
      })
      .where(eq(quoteItems.id, Number(req.params.itemId)))
      .returning();
    if (!item) {
      res.status(404).json({ error: "Position nicht gefunden." });
      return;
    }
    res.json(item);
  })
);

quotesRouter.post(
  "/:id/items/:itemId/move",
  asyncHandler(async (req, res) => {
    const direction = req.body?.direction;
    if (direction !== "up" && direction !== "down") {
      res.status(400).json({ error: "direction muss 'up' oder 'down' sein." });
      return;
    }
    const quoteId = Number(req.params.id);
    const itemId = Number(req.params.itemId);
    const { quote, locked } = await requireEditableQuote(quoteId);
    if (!quote) {
      res.status(404).json({ error: "Angebot nicht gefunden." });
      return;
    }
    if (locked) {
      res.status(423).json({ error: "Angebot ist gesperrt und kann nicht mehr bearbeitet werden." });
      return;
    }
    const items = await db
      .select()
      .from(quoteItems)
      .where(eq(quoteItems.quoteId, quoteId))
      .orderBy(quoteItems.sortOrder);
    const index = items.findIndex((i) => i.id === itemId);
    if (index === -1) {
      res.status(404).json({ error: "Position nicht gefunden." });
      return;
    }
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= items.length) {
      res.status(400).json({ error: "Position kann nicht weiter verschoben werden." });
      return;
    }
    const a = items[index];
    const b = items[swapIndex];
    await db.update(quoteItems).set({ sortOrder: b.sortOrder }).where(eq(quoteItems.id, a.id));
    await db.update(quoteItems).set({ sortOrder: a.sortOrder }).where(eq(quoteItems.id, b.id));
    res.status(204).send();
  })
);

quotesRouter.delete(
  "/:id/items/:itemId",
  asyncHandler(async (req, res) => {
    const { quote, locked } = await requireEditableQuote(Number(req.params.id));
    if (!quote) {
      res.status(404).json({ error: "Angebot nicht gefunden." });
      return;
    }
    if (locked) {
      res.status(423).json({ error: "Angebot ist gesperrt und kann nicht mehr bearbeitet werden." });
      return;
    }
    await db.delete(quoteItems).where(eq(quoteItems.id, Number(req.params.itemId)));
    res.status(204).send();
  })
);

async function loadQuoteForDocument(quoteId: number) {
  const [row] = await db
    .select({ quote: quotes, customer: customers, property: properties })
    .from(quotes)
    .innerJoin(customers, eq(quotes.customerId, customers.id))
    .innerJoin(properties, eq(quotes.propertyId, properties.id))
    .where(eq(quotes.id, quoteId));
  if (!row) return null;
  const rawItems = await db
    .select()
    .from(quoteItems)
    .where(eq(quoteItems.quoteId, quoteId))
    .orderBy(quoteItems.sortOrder);
  const deviceIds = [...new Set(rawItems.filter((i) => i.deviceId).map((i) => i.deviceId!))];
  const deviceRows = deviceIds.length
    ? await db
        .select({ id: devices.id, bildPfad: devices.bildPfad, spezifikationen: devices.spezifikationen })
        .from(devices)
        .where(inArray(devices.id, deviceIds))
    : [];
  const deviceBildById = new Map(deviceRows.map((d) => [d.id, d.bildPfad]));
  const deviceSpezifikationenById = new Map(deviceRows.map((d) => [d.id, d.spezifikationen]));
  const items = rawItems.map((i) => ({
    ...i,
    deviceBildPfad: i.deviceId ? deviceBildById.get(i.deviceId) ?? null : null,
    deviceSpezifikationen: i.deviceId ? deviceSpezifikationenById.get(i.deviceId) ?? null : null,
  }));
  const settings = await getOrCreateSettings();
  return { quote: row.quote, customer: row.customer, property: row.property, items, settings };
}

quotesRouter.get(
  "/:id/pdf",
  asyncHandler(async (req, res) => {
    const data = await loadQuoteForDocument(Number(req.params.id));
    if (!data) {
      res.status(404).json({ error: "Angebot nicht gefunden." });
      return;
    }
    const pdfBuffer = await renderQuotePdf(data);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${data.quote.angebotsnummer}.pdf"`);
    res.send(pdfBuffer);
  })
);

const sendSchema = z.object({
  to: z.string().email().optional(),
  message: z.string().optional(),
});

quotesRouter.post(
  "/:id/send",
  asyncHandler(async (req, res) => {
    const parsed = sendSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const data = await loadQuoteForDocument(Number(req.params.id));
    if (!data) {
      res.status(404).json({ error: "Angebot nicht gefunden." });
      return;
    }
    const recipient = parsed.data.to || data.customer.email;
    if (!recipient) {
      res.status(400).json({ error: "Keine E-Mail-Adresse hinterlegt. Bitte Empfänger angeben." });
      return;
    }
    if (!data.settings.smtpHost || !data.settings.smtpUser) {
      res.status(400).json({ error: "SMTP ist nicht konfiguriert. Bitte in den Einstellungen einrichten." });
      return;
    }

    const pdfBuffer = await renderQuotePdf(data);
    await sendMail(data.settings, {
      to: recipient,
      subject: `Ihr Angebot ${data.quote.angebotsnummer}`,
      text:
        parsed.data.message ||
        `Guten Tag ${data.customer.vorname ?? ""} ${data.customer.nachname}\n\nAnbei erhalten Sie unser Angebot ${data.quote.angebotsnummer}.\n\nFreundliche Grüsse\n${data.settings.firmenname}`,
      attachments: [{ filename: `${data.quote.angebotsnummer}.pdf`, content: pdfBuffer }],
    });

    const [updated] = await db
      .update(quotes)
      .set({ status: "versendet", updatedAt: new Date() })
      .where(eq(quotes.id, data.quote.id))
      .returning();

    res.json(updated);
  })
);
