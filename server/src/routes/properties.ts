import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { db } from "../db/client.js";
import { properties, propertyPhotos } from "../db/schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const propertiesRouter = Router();

const propertySchema = z.object({
  customerId: z.number().int(),
  strasse: z.string().min(1),
  plz: z.string().min(1),
  ort: z.string().min(1),
  notiz: z.string().optional(),
});

propertiesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const customerId = req.query.customerId ? Number(req.query.customerId) : undefined;
    const query = db.select().from(properties);
    const all = customerId ? await query.where(eq(properties.customerId, customerId)) : await query;
    res.json(all);
  })
);

propertiesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const [property] = await db.select().from(properties).where(eq(properties.id, Number(req.params.id)));
    if (!property) {
      res.status(404).json({ error: "Liegenschaft nicht gefunden." });
      return;
    }
    res.json(property);
  })
);

propertiesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = propertySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const [property] = await db.insert(properties).values(parsed.data).returning();
    res.status(201).json(property);
  })
);

propertiesRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const parsed = propertySchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const [property] = await db
      .update(properties)
      .set(parsed.data)
      .where(eq(properties.id, Number(req.params.id)))
      .returning();
    if (!property) {
      res.status(404).json({ error: "Liegenschaft nicht gefunden." });
      return;
    }
    res.json(property);
  })
);

propertiesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await db.delete(properties).where(eq(properties.id, Number(req.params.id)));
    res.status(204).send();
  })
);

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads", "property-photos");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error("Nur Bilddateien (JPEG, PNG, WEBP, HEIC) sind erlaubt."));
      return;
    }
    cb(null, true);
  },
});

propertiesRouter.get(
  "/:id/photos",
  asyncHandler(async (req, res) => {
    const photos = await db
      .select()
      .from(propertyPhotos)
      .where(eq(propertyPhotos.propertyId, Number(req.params.id)));
    res.json(photos);
  })
);

propertiesRouter.post(
  "/:id/photos",
  upload.single("foto"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "Keine Datei erhalten." });
      return;
    }
    const [photo] = await db
      .insert(propertyPhotos)
      .values({
        propertyId: Number(req.params.id),
        dateipfad: `/uploads/property-photos/${req.file.filename}`,
        beschriftung: typeof req.body.beschriftung === "string" ? req.body.beschriftung : undefined,
      })
      .returning();
    res.status(201).json(photo);
  })
);

propertiesRouter.delete(
  "/photos/:photoId",
  asyncHandler(async (req, res) => {
    const [photo] = await db
      .select()
      .from(propertyPhotos)
      .where(eq(propertyPhotos.id, Number(req.params.photoId)));
    if (photo) {
      const filePath = path.join(process.cwd(), photo.dateipfad.replace(/^\//, ""));
      fs.unlink(filePath, () => {});
      await db.delete(propertyPhotos).where(eq(propertyPhotos.id, photo.id));
    }
    res.status(204).send();
  })
);
