import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { db } from "../db/client.js";
import { settings } from "../db/schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getOrCreateSettings } from "../services/settings.js";
import { sendMail, verifySmtpConnection } from "../services/mailer.js";

export const settingsRouter = Router();

function isValidSwissIban(value: string): boolean {
  const cleaned = value.replace(/\s/g, "").toUpperCase();
  return /^(CH|LI)\d{19}$/.test(cleaned);
}

const settingsSchema = z.object({
  firmenname: z.string().optional(),
  strasse: z.string().optional(),
  plz: z.string().optional(),
  ort: z.string().optional(),
  iban: z.string().optional(),
  qrIban: z.string().optional(),
  mwstNummer: z.string().optional(),
  defaultMwstSatz: z.number().nonnegative().optional(),
  stundensatz: z.number().nonnegative().optional(),
  smtpHost: z.string().trim().optional(),
  smtpPort: z.number().int().optional(),
  smtpUser: z.string().trim().optional(),
  smtpPassEncrypted: z.string().optional(),
  smtpAbsenderEmail: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal("")),
  garantieZeit: z.string().optional(),
  angebotSperreNachVersand: z.boolean().optional(),
  adminBenachrichtigungEmail: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal("")),
  terminDauerMinuten: z.number().int().min(15).max(480).optional(),
  abnahmeprotokollText: z.string().optional(),
});

settingsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const row = await getOrCreateSettings();
    const { smtpPassEncrypted, ...safe } = row;
    res.json({ ...safe, smtpPassSet: Boolean(smtpPassEncrypted) });
  })
);

settingsRouter.patch(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = settingsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    if (parsed.data.iban && !isValidSwissIban(parsed.data.iban)) {
      res
        .status(400)
        .json({ error: "IBAN ist ungültig. Format: CH oder LI gefolgt von 2 Prüfziffern und 17 Ziffern (21 Zeichen total)." });
      return;
    }
    if (parsed.data.qrIban && !isValidSwissIban(parsed.data.qrIban)) {
      res
        .status(400)
        .json({ error: "QR-IBAN ist ungültig. Format: CH oder LI gefolgt von 2 Prüfziffern und 17 Ziffern (21 Zeichen total)." });
      return;
    }
    const current = await getOrCreateSettings();
    const { defaultMwstSatz, stundensatz, smtpPassEncrypted, ...rest } = parsed.data;
    const [updated] = await db
      .update(settings)
      .set({
        ...rest,
        ...(defaultMwstSatz !== undefined ? { defaultMwstSatz: defaultMwstSatz.toString() } : {}),
        ...(stundensatz !== undefined ? { stundensatz: stundensatz.toString() } : {}),
        ...(smtpPassEncrypted ? { smtpPassEncrypted } : {}),
      })
      .where(eq(settings.id, current.id))
      .returning();
    const { smtpPassEncrypted: _hidden, ...safe } = updated;
    res.json({ ...safe, smtpPassSet: Boolean(updated.smtpPassEncrypted) });
  })
);

const smtpTestSchema = z.object({
  smtpHost: z.string().trim().min(1, "SMTP-Host ist erforderlich."),
  smtpPort: z.number().int(),
  smtpUser: z.string().trim().min(1, "Benutzer ist erforderlich."),
  smtpPassEncrypted: z.string().optional(), // leer = gespeichertes Passwort verwenden
  smtpAbsenderEmail: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal("")),
  adminBenachrichtigungEmail: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal("")),
});

settingsRouter.post(
  "/smtp-test",
  asyncHandler(async (req, res) => {
    const parsed = smtpTestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." });
      return;
    }

    const current = await getOrCreateSettings();
    const smtpPassEncrypted = parsed.data.smtpPassEncrypted || current.smtpPassEncrypted;
    if (!smtpPassEncrypted) {
      res.status(400).json({ error: "Kein Passwort hinterlegt. Bitte eintragen (auch ohne zu speichern) und erneut testen." });
      return;
    }

    const testCfg = {
      ...current,
      smtpHost: parsed.data.smtpHost,
      smtpPort: parsed.data.smtpPort,
      smtpUser: parsed.data.smtpUser,
      smtpPassEncrypted,
      smtpAbsenderEmail: parsed.data.smtpAbsenderEmail || current.smtpAbsenderEmail,
    };

    try {
      await verifySmtpConnection(testCfg);
    } catch (err) {
      res.status(400).json({ error: `Verbindung fehlgeschlagen: ${err instanceof Error ? err.message : "Unbekannter Fehler."}` });
      return;
    }

    const testEmpfaenger = parsed.data.adminBenachrichtigungEmail || current.adminBenachrichtigungEmail;
    if (!testEmpfaenger) {
      res.json({ ok: true, testMailGesendetAn: null });
      return;
    }

    try {
      await sendMail(testCfg, {
        to: testEmpfaenger,
        subject: "Test-E-Mail — SimplyCool SMTP-Konfiguration",
        text: "Diese Test-E-Mail bestätigt, dass der E-Mail-Versand korrekt konfiguriert ist.",
        attachments: [],
      });
    } catch (err) {
      res.status(400).json({
        error: `Verbindung erfolgreich, aber Test-E-Mail konnte nicht gesendet werden: ${
          err instanceof Error ? err.message : "Unbekannter Fehler."
        }`,
      });
      return;
    }

    res.json({ ok: true, testMailGesendetAn: testEmpfaenger });
  })
);

const LOGO_DIR = path.resolve(process.cwd(), "uploads", "logo");
fs.mkdirSync(LOGO_DIR, { recursive: true });

const logoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, LOGO_DIR),
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!["image/png", "image/jpeg", "image/svg+xml", "image/webp"].includes(file.mimetype)) {
      cb(new Error("Nur PNG, JPEG, WEBP oder SVG erlaubt."));
      return;
    }
    cb(null, true);
  },
});

settingsRouter.post(
  "/logo",
  logoUpload.single("logo"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "Keine Datei erhalten." });
      return;
    }
    const current = await getOrCreateSettings();
    const logoPfad = `/uploads/logo/${req.file.filename}`;
    await db.update(settings).set({ logoPfad }).where(eq(settings.id, current.id));
    res.status(201).json({ logoPfad });
  })
);

const VORLAGEN_DIR = path.resolve(process.cwd(), "uploads", "vorlagen");
fs.mkdirSync(VORLAGEN_DIR, { recursive: true });

const vorlageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, VORLAGEN_DIR),
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.mimetype)) {
      cb(new Error("Nur PDF oder Word-Dokumente erlaubt."));
      return;
    }
    cb(null, true);
  },
});

const VORLAGE_TYP_FIELD = {
  abnahmeprotokoll: "abnahmeprotokollVorlagePfad",
  installationsanweisung: "installationsanweisungVorlagePfad",
} as const;

settingsRouter.post(
  "/vorlagen/:typ",
  vorlageUpload.single("datei"),
  asyncHandler(async (req, res) => {
    const typ = req.params.typ as keyof typeof VORLAGE_TYP_FIELD;
    const field = VORLAGE_TYP_FIELD[typ];
    if (!field) {
      res.status(400).json({ error: "Ungültiger Vorlagentyp." });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "Keine Datei erhalten." });
      return;
    }
    const current = await getOrCreateSettings();
    const pfad = `/uploads/vorlagen/${req.file.filename}`;
    await db
      .update(settings)
      .set({ [field]: pfad })
      .where(eq(settings.id, current.id));
    res.status(201).json({ [field]: pfad });
  })
);
