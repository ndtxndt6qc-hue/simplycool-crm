import { Router } from "express";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { db } from "../db/client.js";
import { devices, orderItems, stockMovements } from "../db/schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { STOCK_MOVEMENT_TYPEN } from "@klimainstall/shared";

export const devicesRouter = Router();

const deviceSchema = z.object({
  hersteller: z.string().min(1),
  modell: z.string().min(1),
  kuehlleistungKw: z.number().nonnegative().optional(),
  heizleistungKw: z.number().nonnegative().optional(),
  kaeltemittel: z.string().optional(),
  einkaufspreis: z.number().nonnegative(),
  empfVerkaufspreis: z.number().nonnegative(),
  lieferantId: z.number().int().optional(),
  mindestbestand: z.number().int().nonnegative().optional(),
  notiz: z.string().optional(),
  spezifikationen: z.string().optional(),
  aktiv: z.boolean().optional(),
});

function toDbValues(input: z.infer<typeof deviceSchema>) {
  return {
    ...input,
    kuehlleistungKw: input.kuehlleistungKw?.toString(),
    heizleistungKw: input.heizleistungKw?.toString(),
    einkaufspreis: input.einkaufspreis?.toString(),
    empfVerkaufspreis: input.empfVerkaufspreis?.toString(),
  };
}

async function getReservedQuantities(): Promise<Map<number, number>> {
  const rows = await db
    .select({ deviceId: orderItems.deviceId, reserved: sql<string>`sum(${orderItems.menge})` })
    .from(orderItems)
    .where(eq(orderItems.status, "reserviert"))
    .groupBy(orderItems.deviceId);

  const map = new Map<number, number>();
  for (const row of rows) {
    if (row.deviceId !== null) map.set(row.deviceId, Number(row.reserved));
  }
  return map;
}

devicesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const all = await db.select().from(devices).orderBy(devices.hersteller, devices.modell);
    const reserved = await getReservedQuantities();
    res.json(
      all.map((d) => {
        const verplant = reserved.get(d.id) ?? 0;
        return { ...d, verplant, verfuegbar: d.lagerbestand - verplant };
      })
    );
  })
);

devicesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const [device] = await db.select().from(devices).where(eq(devices.id, Number(req.params.id)));
    if (!device) {
      res.status(404).json({ error: "Gerät nicht gefunden." });
      return;
    }
    res.json(device);
  })
);

devicesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = deviceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const [device] = await db.insert(devices).values(toDbValues(parsed.data)).returning();
    res.status(201).json(device);
  })
);

devicesRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const parsed = deviceSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const [device] = await db
      .update(devices)
      .set(toDbValues(parsed.data as z.infer<typeof deviceSchema>))
      .where(eq(devices.id, Number(req.params.id)))
      .returning();
    if (!device) {
      res.status(404).json({ error: "Gerät nicht gefunden." });
      return;
    }
    res.json(device);
  })
);

devicesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await db.delete(devices).where(eq(devices.id, Number(req.params.id)));
    res.status(204).send();
  })
);

const DEVICE_IMAGE_DIR = path.resolve(process.cwd(), "uploads", "devices");
fs.mkdirSync(DEVICE_IMAGE_DIR, { recursive: true });

const deviceImageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, DEVICE_IMAGE_DIR),
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

devicesRouter.post(
  "/:id/bild",
  deviceImageUpload.single("bild"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "Keine Datei erhalten." });
      return;
    }
    const bildPfad = `/uploads/devices/${req.file.filename}`;
    const [device] = await db
      .update(devices)
      .set({ bildPfad })
      .where(eq(devices.id, Number(req.params.id)))
      .returning();
    if (!device) {
      res.status(404).json({ error: "Gerät nicht gefunden." });
      return;
    }
    res.status(201).json(device);
  })
);

const stockMovementSchema = z.object({
  typ: z.enum(STOCK_MOVEMENT_TYPEN),
  menge: z.number().int(),
  notiz: z.string().optional(),
});

devicesRouter.get(
  "/:id/stock-movements",
  asyncHandler(async (req, res) => {
    const rows = await db
      .select()
      .from(stockMovements)
      .where(eq(stockMovements.deviceId, Number(req.params.id)))
      .orderBy(sql`${stockMovements.createdAt} desc`);
    res.json(rows);
  })
);

devicesRouter.post(
  "/:id/stock-movements",
  asyncHandler(async (req, res) => {
    const parsed = stockMovementSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const deviceId = Number(req.params.id);
    const { typ, menge, notiz } = parsed.data;
    // Wareneingang/Rücksendung erhöhen den Bestand, Korrektur kann +/- sein, Verbrauch (nur automatisch bei Installation) verringert ihn.
    const delta = typ === "korrektur" ? menge : typ === "wareneingang" || typ === "ruecksendung" ? Math.abs(menge) : -Math.abs(menge);

    const [device] = await db.select().from(devices).where(eq(devices.id, deviceId));
    if (!device) {
      res.status(404).json({ error: "Gerät nicht gefunden." });
      return;
    }

    const [movement] = await db
      .insert(stockMovements)
      .values({ deviceId, typ, menge: delta, notiz })
      .returning();
    const [updatedDevice] = await db
      .update(devices)
      .set({ lagerbestand: device.lagerbestand + delta })
      .where(eq(devices.id, deviceId))
      .returning();

    res.status(201).json({ movement, device: updatedDevice });
  })
);
