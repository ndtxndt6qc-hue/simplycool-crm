import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import path from "node:path";
import { pool } from "./db/client.js";
import { authRouter } from "./routes/auth.js";
import { leadsRouter } from "./routes/leads.js";
import { customersRouter } from "./routes/customers.js";
import { propertiesRouter } from "./routes/properties.js";
import { partnersRouter } from "./routes/partners.js";
import { devicesRouter } from "./routes/devices.js";
import { settingsRouter } from "./routes/settings.js";
import { quotesRouter } from "./routes/quotes.js";
import { ordersRouter } from "./routes/orders.js";
import { invoicesRouter } from "./routes/invoices.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { usersRouter } from "./routes/users.js";
import { gemeindeAnforderungenRouter } from "./routes/gemeindeAnforderungen.js";
import { requireAuth } from "./middleware/requireAuth.js";

const app = express();
const PgSession = connectPgSimple(session);

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.use(
  session({
    store: new PgSession({ pool, createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET ?? "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      sameSite: "lax",
    },
  })
);

app.use("/api/auth", authRouter);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/uploads", requireAuth, express.static(path.resolve(process.cwd(), "uploads")));

app.use("/api", requireAuth);

app.use("/api/leads", leadsRouter);
app.use("/api/customers", customersRouter);
app.use("/api/properties", propertiesRouter);
app.use("/api/partners", partnersRouter);
app.use("/api/devices", devicesRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/quotes", quotesRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/invoices", invoicesRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/users", usersRouter);
app.use("/api/gemeinde-anforderungen", gemeindeAnforderungenRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (typeof err === "object" && err !== null && "code" in err && err.code === "23503") {
    res.status(409).json({ error: "Löschen nicht möglich: Es bestehen noch abhängige Datensätze." });
    return;
  }
  if (typeof err === "object" && err !== null && "code" in err && err.code === "23505") {
    res.status(409).json({ error: "Eintrag existiert bereits (Kanton + Gemeinde muss eindeutig sein)." });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Interner Serverfehler." });
});

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
