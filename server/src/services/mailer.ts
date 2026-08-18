import nodemailer from "nodemailer";
import type { InferSelectModel } from "drizzle-orm";
import type { settings } from "../db/schema.js";

type Settings = InferSelectModel<typeof settings>;

export async function sendMail(
  cfg: Settings,
  message: { to: string; subject: string; text: string; attachments: { filename: string; content: Buffer }[] }
) {
  const transporter = nodemailer.createTransport({
    host: cfg.smtpHost!,
    port: cfg.smtpPort ?? 587,
    secure: cfg.smtpPort === 465,
    auth: cfg.smtpUser ? { user: cfg.smtpUser, pass: cfg.smtpPassEncrypted ?? "" } : undefined,
  });

  await transporter.sendMail({
    from: `"${cfg.firmenname || "SimplyCool"}" <${cfg.smtpUser}>`,
    to: message.to,
    subject: message.subject,
    text: message.text,
    attachments: message.attachments,
  });
}
