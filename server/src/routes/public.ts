import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import path from "node:path";
import fs from "node:fs";
import { db } from "../db/client.js";
import { leads } from "../db/schema.js";
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
