import nodemailer from "nodemailer";
import type { InferSelectModel } from "drizzle-orm";
import type { settings } from "../db/schema.js";

type Settings = InferSelectModel<typeof settings>;

function createTransporter(cfg: Settings) {
  // trim() als letzte Absicherung gegen kopierte Werte mit Leerzeichen (z.B. Host mit
  // führendem Space führt sonst zu einem schwer verständlichen DNS-Fehler).
  return nodemailer.createTransport({
    host: cfg.smtpHost!.trim(),
    port: cfg.smtpPort ?? 587,
    secure: cfg.smtpPort === 465,
    auth: cfg.smtpUser ? { user: cfg.smtpUser.trim(), pass: cfg.smtpPassEncrypted ?? "" } : undefined,
  });
}

export async function sendMail(
  cfg: Settings,
  message: { to: string; subject: string; text: string; attachments: { filename: string; content: Buffer }[] }
) {
  const transporter = createTransporter(cfg);

  await transporter.sendMail({
    from: `"${cfg.firmenname || "SimplyCool"}" <${cfg.smtpUser}>`,
    to: message.to,
    subject: message.subject,
    text: message.text,
    attachments: message.attachments,
  });
}

// Prüft nur Verbindung + Login (EHLO/STARTTLS/AUTH) — sendet keine E-Mail. Wirft bei Fehler.
export async function verifySmtpConnection(cfg: Settings): Promise<void> {
  const transporter = createTransporter(cfg);
  await transporter.verify();
}
