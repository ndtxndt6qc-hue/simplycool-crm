import { Router } from "express";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { customers, leads, properties, quoteItems, quotes } from "../db/schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { QUOTE_ITEM_TYPEN, QUOTE_STATUS } from "@klimainstall/shared";
import { getOrCreateSettings } from "../services/settings.js";
import { renderQuotePdf } from "../pdf/quotePdf.js";
import { sendMail } from "../services/mailer.js";

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
});

const quoteItemSchema = z.object({
  typ: z.enum(QUOTE_ITEM_TYPEN),
  deviceId: z.number().int().optional(),
  beschreibung: z.string().min(1),
  menge: z.number().positive(),
  einzelpreis: z.number(),
  einkaufspreisIntern: z.number().default(0),
});

async function getQuoteTotals(quoteId: number) {
  const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId));
  const summe = items.reduce((acc, i) => acc + Number(i.einzelpreis) * Number(i.menge), 0);
  const deckungsbeitrag = items.reduce(
    (acc, i) => acc + (Number(i.einzelpreis) - Number(i.einkaufspreisIntern)) * Number(i.menge),
    0
  );
  return { items, summe, deckungsbeitrag };
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

    const withTotals = await Promise.all(
      rows.map(async ({ quote, customer, property }) => {
        const { summe } = await getQuoteTotals(quote.id);
        return { ...quote, customer, property, summe };
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

    const { items, summe, deckungsbeitrag } = await getQuoteTotals(quoteId);
    res.json({ ...row.quote, customer: row.customer, property: row.property, items, summe, deckungsbeitrag });
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
    const { mwstSatz, ...rest } = parsed.data;
    const [quote] = await db
      .update(quotes)
      .set({ ...rest, ...(mwstSatz !== undefined ? { mwstSatz: mwstSatz.toString() } : {}), updatedAt: new Date() })
      .where(eq(quotes.id, Number(req.params.id)))
      .returning();
    if (!quote) {
      res.status(404).json({ error: "Angebot nicht gefunden." });
      return;
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
    const [item] = await db
      .insert(quoteItems)
      .values({
        quoteId: Number(req.params.id),
        typ: parsed.data.typ,
        deviceId: parsed.data.deviceId,
        beschreibung: parsed.data.beschreibung,
        menge: parsed.data.menge,
        einzelpreis: parsed.data.einzelpreis.toString(),
        einkaufspreisIntern: parsed.data.einkaufspreisIntern.toString(),
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
    const { einzelpreis, einkaufspreisIntern, ...rest } = parsed.data;
    const [item] = await db
      .update(quoteItems)
      .set({
        ...rest,
        ...(einzelpreis !== undefined ? { einzelpreis: einzelpreis.toString() } : {}),
        ...(einkaufspreisIntern !== undefined ? { einkaufspreisIntern: einkaufspreisIntern.toString() } : {}),
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

quotesRouter.delete(
  "/:id/items/:itemId",
  asyncHandler(async (req, res) => {
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
  const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId));
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
