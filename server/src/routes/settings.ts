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

export const settingsRouter = Router();

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
  smtpHost: z.string().optional(),
  smtpPort: z.number().int().optional(),
  smtpUser: z.string().optional(),
  smtpPassEncrypted: z.string().optional(),
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
