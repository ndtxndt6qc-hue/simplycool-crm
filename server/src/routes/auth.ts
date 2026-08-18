import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { eq, count } from "drizzle-orm";
import fs from "node:fs";
import path from "node:path";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { getOrCreateSettings } from "../services/settings.js";

export const authRouter = Router();

// Öffentliche Branding-Infos (Logo, Firmenname) für die Login-Seite, die noch keine Session hat.
authRouter.get("/branding", async (_req, res) => {
  const settings = await getOrCreateSettings();
  let logoDataUri: string | null = null;
  if (settings.logoPfad) {
    try {
      const filePath = path.resolve(process.cwd(), settings.logoPfad.replace(/^\//, ""));
      const buffer = fs.readFileSync(filePath);
      const ext = path.extname(filePath).slice(1).toLowerCase();
      const mime = ext === "svg" ? "image/svg+xml" : `image/${ext === "jpg" ? "jpeg" : ext}`;
      logoDataUri = `data:${mime};base64,${buffer.toString("base64")}`;
    } catch {
      logoDataUri = null;
    }
  }
  res.json({ firmenname: settings.firmenname, logoDataUri });
});

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const setupSchema = credentialsSchema.extend({
  name: z.string().min(1),
});

// Einmaliges Setup: legt den ersten Benutzer an, solange noch keiner existiert.
authRouter.post("/setup", async (req, res) => {
  const [{ value: userCount }] = await db.select({ value: count() }).from(users);
  if (userCount > 0) {
    res.status(403).json({ error: "Setup bereits abgeschlossen." });
    return;
  }

  const parsed = setupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const [user] = await db
    .insert(users)
    .values({
      email: parsed.data.email,
      passwordHash,
      name: parsed.data.name,
      role: "admin",
    })
    .returning();

  req.session.userId = user.id;
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
});

authRouter.get("/setup-required", async (_req, res) => {
  const [{ value: userCount }] = await db.select({ value: count() }).from(users);
  res.json({ setupRequired: userCount === 0 });
});

authRouter.post("/login", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "E-Mail und Passwort erforderlich." });
    return;
  }

  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email));
  if (!user) {
    res.status(401).json({ error: "E-Mail oder Passwort falsch." });
    return;
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "E-Mail oder Passwort falsch." });
    return;
  }

  req.session.userId = user.id;
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

authRouter.get("/me", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Nicht angemeldet." });
    return;
  }
  const [user] = await db.select().from(users).where(eq(users.id, req.session.userId));
  if (!user) {
    res.status(401).json({ error: "Nicht angemeldet." });
    return;
  }
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
});
