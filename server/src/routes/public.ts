import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import {
  bookingAvailabilityRules,
  bookingBlockedSlots,
  bookings,
  customers,
  devices,
  leads,
  orderItems,
  orderReferenzFotos,
  orders,
  properties,
  quoteItems,
  quotes,
} from "../db/schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { LeadQuelle } from "@klimainstall/shared";
import { getOrCreateSettings } from "../services/settings.js";
import { sendMail } from "../services/mailer.js";
import { getPageTextOverrides } from "../services/pageTexts.js";
import { computeAvailableSlots, zurichNow } from "../services/booking.js";
import { buildIcsEvent } from "../services/ics.js";
import { renderQuotePdf } from "../pdf/quotePdf.js";

export const publicRouter = Router();

publicRouter.get(
  "/page-texts",
  asyncHandler(async (_req, res) => {
    res.json(await getPageTextOverrides());
  })
);

publicRouter.get(
  "/branding",
  asyncHandler(async (_req, res) => {
    const settings = await getOrCreateSettings();
    res.json({ firmenname: settings.firmenname, hatLogo: Boolean(settings.logoPfad) });
  })
);

publicRouter.get(
  "/logo",
  asyncHandler(async (_req, res) => {
    const settings = await getOrCreateSettings();
    if (!settings.logoPfad) {
      res.status(404).end();
      return;
    }
    const filePath = path.resolve(process.cwd(), settings.logoPfad.replace(/^\//, ""));
    if (!fs.existsSync(filePath)) {
      res.status(404).end();
      return;
    }
    res.sendFile(filePath);
  })
);

publicRouter.get(
  "/referenzen",
  asyncHandler(async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;

    const rows = await db
      .select({ order: orders, property: properties })
      .from(orders)
      .innerJoin(properties, eq(orders.propertyId, properties.id))
      .where(and(eq(orders.status, "abgeschlossen"), eq(orders.referenzFreigegeben, true)))
      .orderBy(sql`${orders.createdAt} desc`);

    const orderIds = rows.map((r) => r.order.id);
    const [fotos, items] = orderIds.length
      ? await Promise.all([
          db.select().from(orderReferenzFotos).where(inArray(orderReferenzFotos.orderId, orderIds)),
          db
            .select({ orderId: orderItems.orderId, deviceId: orderItems.deviceId })
            .from(orderItems)
            .where(inArray(orderItems.orderId, orderIds)),
        ])
      : [[], []];

    const result = rows.map(({ order, property }) => ({
      id: order.id,
      ort: property.ort,
      anzahlGeraete: items.filter((i) => i.orderId === order.id && i.deviceId).length,
      beschreibung: order.referenzBeschreibung,
      fotos: fotos
        .filter((f) => f.orderId === order.id)
        .map((f) => ({ id: f.id, typ: f.typ, url: `/api/public/referenz-foto/${f.id}` })),
    }));

    res.json(limit ? result.slice(0, limit) : result);
  })
);

publicRouter.get(
  "/referenz-foto/:id",
  asyncHandler(async (req, res) => {
    const [foto] = await db.select().from(orderReferenzFotos).where(eq(orderReferenzFotos.id, Number(req.params.id)));
    if (!foto) {
      res.status(404).end();
      return;
    }
    const [order] = await db.select().from(orders).where(eq(orders.id, foto.orderId));
    if (!order || !order.referenzFreigegeben) {
      res.status(404).end();
      return;
    }
    const filePath = path.resolve(process.cwd(), foto.dateipfad.replace(/^\//, ""));
    if (!fs.existsSync(filePath)) {
      res.status(404).end();
      return;
    }
    res.sendFile(filePath);
  })
);

const leadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: "Zu viele Anfragen. Bitte später erneut versuchen." });
  },
});

function isValidChPhone(raw: string): boolean {
  const digits = raw.replace(/[\s\-()]/g, "");
  return /^(\+41|0041|0)\d{9}$/.test(digits);
}

function normalizeQuelle(input: string | undefined): LeadQuelle {
  const value = (input || "").trim().toLowerCase();
  if (!value) return "website";
  if (value === "google" || value === "facebook" || value === "flyer" || value === "website") return value;
  return "sonstige";
}

const publicLeadSchema = z
  .object({
    name: z.string().trim().min(1, "Name ist erforderlich.").max(255),
    telefon: z
      .string()
      .trim()
      .max(50)
      .optional()
      .or(z.literal(""))
      .refine((v) => !v || isValidChPhone(v), "Ungültige Telefonnummer."),
    email: z.string().trim().max(255).email("Ungültige E-Mail-Adresse.").optional().or(z.literal("")),
    plz: z.string().trim().regex(/^\d{4}$/, "PLZ muss 4-stellig sein."),
    ort: z.string().trim().min(1, "Ort ist erforderlich.").max(255),
    nachricht: z.string().trim().max(2000).optional().or(z.literal("")),
    quelle: z.string().trim().max(50).optional(),
    firma: z.string().optional(), // Honeypot — für Menschen unsichtbares Feld
  })
  .refine((data) => Boolean(data.telefon) || Boolean(data.email), {
    message: "Telefon oder E-Mail ist erforderlich.",
    path: ["telefon"],
  });

publicRouter.post(
  "/lead",
  leadRateLimiter,
  asyncHandler(async (req, res) => {
    const parsed = publicLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." });
      return;
    }

    if (parsed.data.firma) {
      // Honeypot ausgefüllt -> stillschweigend verwerfen, Bot bekommt trotzdem "Erfolg" zurück
      res.status(201).json({ ok: true });
      return;
    }

    const [lead] = await db
      .insert(leads)
      .values({
        name: parsed.data.name,
        plz: parsed.data.plz,
        ort: parsed.data.ort,
        telefon: parsed.data.telefon || undefined,
        email: parsed.data.email || undefined,
        notiz: parsed.data.nachricht || undefined,
        quelle: normalizeQuelle(parsed.data.quelle),
        status: "neu",
      })
      .returning();

    try {
      const settings = await getOrCreateSettings();
      if (settings.smtpHost && settings.smtpUser && settings.adminBenachrichtigungEmail) {
        await sendMail(settings, {
          to: settings.adminBenachrichtigungEmail,
          subject: `Neuer Lead: ${lead.name} aus ${lead.ort}`,
          text: [
            "Neue Anfrage über die Webseite simply-cool.ch:",
            "",
            `Name: ${lead.name}`,
            `Telefon: ${lead.telefon ?? "—"}`,
            `E-Mail: ${lead.email ?? "—"}`,
            `PLZ/Ort: ${lead.plz} ${lead.ort}`,
            `Nachricht: ${lead.notiz ?? "—"}`,
            `Quelle: ${lead.quelle}`,
          ].join("\n"),
          attachments: [],
        });
      }
    } catch (err) {
      console.error("Lead-Benachrichtigung konnte nicht gesendet werden:", err);
    }

    res.status(201).json({ ok: true });
  })
);

const bookingRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: "Zu viele Anfragen. Bitte später erneut versuchen." });
  },
});

const MAX_SLOT_RANGE_TAGE = 60;

publicRouter.get(
  "/booking/slots",
  asyncHandler(async (req, res) => {
    const now = zurichNow();
    const von = typeof req.query.von === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.von) ? req.query.von : now.datum;
    let bis = typeof req.query.bis === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.bis) ? req.query.bis : null;
    if (!bis) {
      const d = new Date(`${von}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + 30);
      bis = d.toISOString().slice(0, 10);
    }
    // Anfragebereich hart begrenzen, damit niemand über den Query-Parameter beliebig grosse Zeiträume berechnen lässt.
    const vonDate = new Date(`${von}T00:00:00Z`);
    const maxBis = new Date(vonDate);
    maxBis.setUTCDate(maxBis.getUTCDate() + MAX_SLOT_RANGE_TAGE);
    if (new Date(`${bis}T00:00:00Z`) > maxBis) bis = maxBis.toISOString().slice(0, 10);

    const settings = await getOrCreateSettings();
    const rules = await db.select().from(bookingAvailabilityRules).where(eq(bookingAvailabilityRules.aktiv, true));
    const blocked = await db
      .select()
      .from(bookingBlockedSlots)
      .where(and(gte(bookingBlockedSlots.datum, von), lte(bookingBlockedSlots.datum, bis)));
    const booked = await db
      .select({ datum: bookings.datum, startzeit: bookings.startzeit, endzeit: bookings.endzeit })
      .from(bookings)
      .where(and(eq(bookings.status, "bestaetigt"), gte(bookings.datum, von), lte(bookings.datum, bis)));

    const slots = computeAvailableSlots({ rules, blocked, booked, von, bis, durationMinutes: settings.terminDauerMinuten });
    res.json(slots);
  })
);

const publicBookingSchema = z
  .object({
    name: z.string().trim().min(1, "Name ist erforderlich.").max(255),
    telefon: z
      .string()
      .trim()
      .max(50)
      .optional()
      .or(z.literal(""))
      .refine((v) => !v || isValidChPhone(v), "Ungültige Telefonnummer."),
    email: z.string().trim().max(255).email("Ungültige E-Mail-Adresse.").optional().or(z.literal("")),
    plz: z.string().trim().regex(/^\d{4}$/, "PLZ muss 4-stellig sein."),
    ort: z.string().trim().min(1, "Ort ist erforderlich.").max(255),
    nachricht: z.string().trim().max(2000).optional().or(z.literal("")),
    quelle: z.string().trim().max(50).optional(),
    datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datum."),
    startzeit: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Ungültige Uhrzeit."),
    firma: z.string().optional(), // Honeypot
  })
  .refine((data) => Boolean(data.telefon) || Boolean(data.email), {
    message: "Telefon oder E-Mail ist erforderlich.",
    path: ["telefon"],
  });

function addMinutes(zeit: string, minuten: number): string {
  const [h, m] = zeit.split(":").map(Number);
  const total = h * 60 + m + minuten;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

publicRouter.post(
  "/booking",
  bookingRateLimiter,
  asyncHandler(async (req, res) => {
    const parsed = publicBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." });
      return;
    }

    if (parsed.data.firma) {
      // Honeypot ausgefüllt -> stillschweigend verwerfen, Bot bekommt trotzdem "Erfolg" zurück
      res.status(201).json({ ok: true });
      return;
    }

    const { datum, startzeit } = parsed.data;
    const settings = await getOrCreateSettings();
    const endzeit = addMinutes(startzeit, settings.terminDauerMinuten);

    // Verfügbarkeit unmittelbar vor dem Speichern nochmals prüfen (Race Condition: zwei
    // Personen buchen gleichzeitig denselben Slot).
    const rules = await db.select().from(bookingAvailabilityRules).where(eq(bookingAvailabilityRules.aktiv, true));
    const blocked = await db.select().from(bookingBlockedSlots).where(eq(bookingBlockedSlots.datum, datum));
    const booked = await db
      .select({ datum: bookings.datum, startzeit: bookings.startzeit, endzeit: bookings.endzeit })
      .from(bookings)
      .where(and(eq(bookings.status, "bestaetigt"), eq(bookings.datum, datum)));
    const freieSlots = computeAvailableSlots({
      rules,
      blocked,
      booked,
      von: datum,
      bis: datum,
      durationMinutes: settings.terminDauerMinuten,
    });
    const nochFrei = (freieSlots[datum] ?? []).some((s) => s.start === startzeit);
    if (!nochFrei) {
      res.status(409).json({ error: "Dieser Termin ist leider nicht mehr verfügbar. Bitte wählen Sie einen anderen Termin." });
      return;
    }

    const [lead] = await db
      .insert(leads)
      .values({
        name: parsed.data.name,
        plz: parsed.data.plz,
        ort: parsed.data.ort,
        telefon: parsed.data.telefon || undefined,
        email: parsed.data.email || undefined,
        notiz: [`Termin gebucht: ${datum} ${startzeit}–${endzeit} Uhr.`, parsed.data.nachricht || null]
          .filter(Boolean)
          .join("\n"),
        quelle: normalizeQuelle(parsed.data.quelle),
        status: "termin_vereinbart",
      })
      .returning();

    const icsUid = `${crypto.randomUUID()}@simply-cool.ch`;
    const [booking] = await db
      .insert(bookings)
      .values({
        datum,
        startzeit,
        endzeit,
        name: parsed.data.name,
        telefon: parsed.data.telefon || undefined,
        email: parsed.data.email || undefined,
        plz: parsed.data.plz,
        ort: parsed.data.ort,
        nachricht: parsed.data.nachricht || undefined,
        quelle: normalizeQuelle(parsed.data.quelle),
        leadId: lead.id,
        icsUid,
      })
      .returning();

    try {
      if (settings.smtpHost && settings.smtpUser) {
        const ics = buildIcsEvent({
          uid: icsUid,
          summary: `Beratungstermin ${settings.firmenname || "SimplyCool"}`,
          description: `Beratungstermin mit ${booking.name} (${booking.plz} ${booking.ort}).`,
          location: [settings.strasse, `${settings.plz} ${settings.ort}`].filter(Boolean).join(", "),
          datum,
          startzeit,
          endzeit,
          organizerEmail: settings.smtpUser,
          organizerName: settings.firmenname || "SimplyCool",
        });
        const attachments = [{ filename: "termin.ics", content: Buffer.from(ics, "utf-8") }];

        if (booking.email) {
          await sendMail(settings, {
            to: booking.email,
            subject: `Terminbestätigung — ${datum} um ${startzeit} Uhr`,
            text: [
              `Guten Tag ${booking.name}`,
              "",
              `Ihr Termin bei ${settings.firmenname || "SimplyCool"} ist bestätigt:`,
              `${datum}, ${startzeit}–${endzeit} Uhr`,
              "",
              "Die Termindaten liegen als Kalenderdatei (ICS) diesem E-Mail bei.",
              "",
              "Bei Fragen oder falls der Termin nicht passt, melden Sie sich gerne bei uns.",
            ].join("\n"),
            attachments,
          });
        }
        if (settings.adminBenachrichtigungEmail) {
          await sendMail(settings, {
            to: settings.adminBenachrichtigungEmail,
            subject: `Neue Terminbuchung: ${booking.name} am ${datum} ${startzeit}`,
            text: [
              "Neue Terminbuchung über die Webseite:",
              "",
              `Name: ${booking.name}`,
              `Telefon: ${booking.telefon ?? "—"}`,
              `E-Mail: ${booking.email ?? "—"}`,
              `PLZ/Ort: ${booking.plz} ${booking.ort}`,
              `Termin: ${datum}, ${startzeit}–${endzeit} Uhr`,
              `Nachricht: ${booking.nachricht ?? "—"}`,
            ].join("\n"),
            attachments,
          });
        }
      }
    } catch (err) {
      console.error("Terminbestätigung konnte nicht gesendet werden:", err);
    }

    res.status(201).json({ ok: true, datum, startzeit, endzeit });
  })
);

async function loadPublicQuote(token: string) {
  const [row] = await db
    .select({ quote: quotes, customer: customers, property: properties })
    .from(quotes)
    .innerJoin(customers, eq(quotes.customerId, customers.id))
    .innerJoin(properties, eq(quotes.propertyId, properties.id))
    .where(eq(quotes.publicToken, token));
  if (!row) return null;

  const rawItems = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, row.quote.id)).orderBy(quoteItems.sortOrder);
  const deviceIds = [...new Set(rawItems.filter((i) => i.deviceId).map((i) => i.deviceId!))];
  const deviceRows = deviceIds.length
    ? await db
        .select({ id: devices.id, bildPfad: devices.bildPfad, spezifikationen: devices.spezifikationen })
        .from(devices)
        .where(inArray(devices.id, deviceIds))
    : [];
  const bildById = new Map(deviceRows.map((d) => [d.id, d.bildPfad]));
  const specsById = new Map(deviceRows.map((d) => [d.id, d.spezifikationen]));
  const items = rawItems.map((i) => ({
    ...i,
    deviceBildPfad: i.deviceId ? bildById.get(i.deviceId) ?? null : null,
    deviceSpezifikationen: i.deviceId ? specsById.get(i.deviceId) ?? null : null,
  }));
  const settings = await getOrCreateSettings();

  return { quote: row.quote, customer: row.customer, property: row.property, items, settings };
}

publicRouter.get(
  "/quote/:token",
  asyncHandler(async (req, res) => {
    const data = await loadPublicQuote(req.params.token);
    if (!data) {
      res.status(404).json({ error: "Angebot nicht gefunden." });
      return;
    }
    const { quote, customer, property, items, settings } = data;
    const mwstSatz = Number(quote.mwstSatz);
    const verbindliche = items.filter((i) => !i.optional);
    const optionale = items.filter((i) => i.optional);
    const netto = verbindliche.reduce((acc, i) => acc + Number(i.einzelpreis) * Number(i.menge), 0);
    const nettoOptional = optionale.reduce((acc, i) => acc + Number(i.einzelpreis) * Number(i.menge), 0);
    const mwstBetrag = netto * (mwstSatz / 100);

    res.json({
      angebotsnummer: quote.angebotsnummer,
      datum: quote.datum,
      gueltigBis: quote.gueltigBis,
      status: quote.status,
      angenommenAm: quote.angenommenAm,
      firmenname: settings.firmenname,
      kunde: {
        name: [customer.firma, [customer.vorname, customer.nachname].filter(Boolean).join(" ")].filter(Boolean).join(" — "),
        strasse: customer.strasse,
        plz: customer.plz,
        ort: customer.ort,
      },
      installationsort: { strasse: property.strasse, plz: property.plz, ort: property.ort },
      items: items.map((i) => ({
        id: i.id,
        typ: i.typ,
        beschreibung: i.beschreibung,
        menge: i.menge,
        einheit: i.einheit,
        einzelpreis: i.einzelpreis,
        total: (Number(i.einzelpreis) * Number(i.menge)).toFixed(2),
        optional: i.optional,
        spezifikationen: i.deviceSpezifikationen,
      })),
      mwstSatz,
      summeNetto: netto.toFixed(2),
      mwstBetrag: mwstBetrag.toFixed(2),
      summeTotal: (netto + mwstBetrag).toFixed(2),
      summeOptional: nettoOptional.toFixed(2),
    });
  })
);

const acceptSchema = z.object({ agbAkzeptiert: z.literal(true) });

publicRouter.post(
  "/quote/:token/accept",
  leadRateLimiter,
  asyncHandler(async (req, res) => {
    const parsed = acceptSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Bitte AGB akzeptieren." });
      return;
    }

    const data = await loadPublicQuote(req.params.token);
    if (!data) {
      res.status(404).json({ error: "Angebot nicht gefunden." });
      return;
    }
    const { quote } = data;

    if (quote.status === "angenommen") {
      res.json({ ok: true, alreadyAccepted: true, angenommenAm: quote.angenommenAm });
      return;
    }
    if (quote.status === "abgelehnt") {
      res.status(400).json({ error: "Dieses Angebot wurde bereits abgelehnt." });
      return;
    }

    const angenommenAm = new Date();
    const [updated] = await db
      .update(quotes)
      .set({
        status: "angenommen",
        angenommenAm,
        angenommenIp: req.ip ?? null,
        angenommenUserAgent: req.get("user-agent") ?? null,
        updatedAt: angenommenAm,
      })
      .where(eq(quotes.id, quote.id))
      .returning();

    if (updated.leadId) {
      await db.update(leads).set({ status: "gewonnen", updatedAt: new Date() }).where(eq(leads.id, updated.leadId));
    }

    try {
      const settings = await getOrCreateSettings();
      if (settings.smtpHost && settings.smtpUser) {
        const pdfBuffer = await renderQuotePdf({
          quote: updated,
          customer: data.customer,
          property: data.property,
          items: data.items,
          settings,
        });
        const attachments = [{ filename: `${updated.angebotsnummer}.pdf`, content: pdfBuffer }];
        const zeitpunkt = new Intl.DateTimeFormat("de-CH", { dateStyle: "medium", timeStyle: "short" }).format(angenommenAm);

        if (data.customer.email) {
          await sendMail(settings, {
            to: data.customer.email,
            subject: `Bestätigung: Angebot ${updated.angebotsnummer} angenommen`,
            text: [
              `Guten Tag ${data.customer.vorname ?? ""} ${data.customer.nachname}`,
              "",
              `Vielen Dank — Sie haben das Angebot ${updated.angebotsnummer} am ${zeitpunkt} Uhr online bestätigt.`,
              "Das angenommene Angebot finden Sie im Anhang. Wir melden uns in Kürze für die Terminvereinbarung.",
              "",
              `Freundliche Grüsse\n${settings.firmenname}`,
            ].join("\n"),
            attachments,
          });
        }
        if (settings.adminBenachrichtigungEmail) {
          await sendMail(settings, {
            to: settings.adminBenachrichtigungEmail,
            subject: `Angebot online angenommen: ${updated.angebotsnummer}`,
            text: [
              `Das Angebot ${updated.angebotsnummer} wurde online bestätigt.`,
              "",
              `Zeitpunkt: ${zeitpunkt} Uhr`,
              `IP-Adresse: ${updated.angenommenIp ?? "—"}`,
              `Kunde: ${data.customer.vorname ?? ""} ${data.customer.nachname}`.trim(),
            ].join("\n"),
            attachments,
          });
        }
      }
    } catch (err) {
      console.error("Bestätigungsmail für Online-Annahme konnte nicht gesendet werden:", err);
    }

    res.json({ ok: true, alreadyAccepted: false, angenommenAm });
  })
);
