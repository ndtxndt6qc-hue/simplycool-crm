import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import path from "node:path";
import fs from "node:fs";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { leads, orderItems, orderReferenzFotos, orders, properties } from "../db/schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { LeadQuelle } from "@klimainstall/shared";
import { getOrCreateSettings } from "../services/settings.js";

export const publicRouter = Router();

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

    await db.insert(leads).values({
      name: parsed.data.name,
      plz: parsed.data.plz,
      ort: parsed.data.ort,
      telefon: parsed.data.telefon || undefined,
      email: parsed.data.email || undefined,
      notiz: parsed.data.nachricht || undefined,
      quelle: normalizeQuelle(parsed.data.quelle),
      status: "neu",
    });

    // TODO (Schritt 8): Admin-E-Mail-Benachrichtigung bei neuem Lead.

    res.status(201).json({ ok: true });
  })
);
