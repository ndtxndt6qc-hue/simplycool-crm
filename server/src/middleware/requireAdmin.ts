import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    res.status(401).json({ error: "Nicht angemeldet." });
    return;
  }
  const [user] = await db.select().from(users).where(eq(users.id, req.session.userId));
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Nur Administratoren dürfen Benutzer verwalten." });
    return;
  }
  next();
}
