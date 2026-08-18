import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const usersRouter = Router();

usersRouter.use(requireAdmin);

usersRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rows = await db
      .select({ id: users.id, email: users.email, name: users.name, role: users.role, createdAt: users.createdAt })
      .from(users)
      .orderBy(users.createdAt);
    res.json(rows);
  })
);

const userCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["admin", "mitarbeiter"]).default("mitarbeiter"),
});

usersRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = userCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const [existing] = await db.select().from(users).where(eq(users.email, parsed.data.email));
    if (existing) {
      res.status(409).json({ error: "Diese E-Mail-Adresse wird bereits verwendet." });
      return;
    }
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const [user] = await db
      .insert(users)
      .values({ name: parsed.data.name, email: parsed.data.email, passwordHash, role: parsed.data.role })
      .returning({ id: users.id, email: users.email, name: users.name, role: users.role, createdAt: users.createdAt });
    res.status(201).json(user);
  })
);

const userUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["admin", "mitarbeiter"]).optional(),
});

usersRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const parsed = userUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const targetId = Number(req.params.id);

    if (parsed.data.role === "mitarbeiter") {
      const admins = await db.select().from(users).where(eq(users.role, "admin"));
      const target = admins.find((u) => u.id === targetId);
      if (target && admins.length <= 1) {
        res.status(400).json({ error: "Der letzte Administrator kann nicht herabgestuft werden." });
        return;
      }
    }

    const [user] = await db
      .update(users)
      .set(parsed.data)
      .where(eq(users.id, targetId))
      .returning({ id: users.id, email: users.email, name: users.name, role: users.role, createdAt: users.createdAt });
    if (!user) {
      res.status(404).json({ error: "Benutzer nicht gefunden." });
      return;
    }
    res.json(user);
  })
);

usersRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const targetId = Number(req.params.id);
    if (targetId === req.session.userId) {
      res.status(400).json({ error: "Du kannst dich nicht selbst löschen." });
      return;
    }
    const admins = await db.select().from(users).where(eq(users.role, "admin"));
    const target = admins.find((u) => u.id === targetId);
    if (target && admins.length <= 1) {
      res.status(400).json({ error: "Der letzte Administrator kann nicht gelöscht werden." });
      return;
    }
    await db.delete(users).where(eq(users.id, targetId));
    res.status(204).send();
  })
);
