import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPageTextOverrides, setPageTextOverride } from "../services/pageTexts.js";

export const pageTextsRouter = Router();

pageTextsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await getPageTextOverrides());
  })
);

const saveSchema = z.object({
  entries: z.record(z.string().max(100), z.string().max(5000)),
});

pageTextsRouter.patch(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = saveSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    for (const [key, value] of Object.entries(parsed.data.entries)) {
      await setPageTextOverride(key, value);
    }
    res.json(await getPageTextOverrides());
  })
);
