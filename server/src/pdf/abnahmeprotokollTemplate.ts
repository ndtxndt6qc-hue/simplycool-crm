import type { InferSelectModel } from "drizzle-orm";
import type { customers, orders, properties, settings } from "../db/schema.js";

type AbnahmeprotokollData = {
  order: InferSelectModel<typeof orders>;
  customer: InferSelectModel<typeof customers>;
  property: InferSelectModel<typeof properties>;
  settings: InferSelectModel<typeof settings>;
  unterzeichnerName: string;
  bemerkungen: string;
  unterschriftDataUrl: string;
  abgeschlossenAm: Date;
};

const BRAND = "#0f766e";

export const DEFAULT_ABNAHMEPROTOKOLL_TEXT = [
  "Das Klimagerät wurde fachgerecht installiert und in Betrieb genommen.",
  "Der Kunde wurde in die Bedienung des Geräts eingewiesen.",
  "Die Funktion wurde gemeinsam mit dem Kunden geprüft.",
  "Es bestehen keine offensichtlichen Mängel.",
].join("\n");

function escapeHtml(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function dateCh(value: Date) {
  return new Intl.DateTimeFormat("de-CH", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

export function renderAbnahmeprotokollHtml(data: AbnahmeprotokollData): string {
  const { order, customer, property, settings: cfg, unterzeichnerName, bemerkungen, unterschriftDataUrl, abgeschlossenAm } = data;
  const kundenName = [customer.firma, [customer.vorname, customer.nachname].filter(Boolean).join(" ")].filter(Boolean).join(" — ");
  const klauseln = (cfg.abnahmeprotokollText || DEFAULT_ABNAHMEPROTOKOLL_TEXT).split("\n").filter((l) => l.trim());

  return `
  <!doctype html>
  <html lang="de-CH">
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      body { font-family: "Helvetica Neue", Arial, sans-serif; color: #0f172a; font-size: 13px; margin: 0; padding: 40px; }
      .accent-bar { height: 8px; background: ${BRAND}; margin: -40px -40px 32px -40px; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
      .logo { max-height: 60px; max-width: 220px; }
      .company { text-align: right; font-size: 12px; color: #475569; line-height: 1.5; }
      h1 { font-size: 22px; margin: 0 0 4px; }
      .meta { font-size: 12px; color: #475569; margin-bottom: 24px; }
      .addresses { display: flex; justify-content: space-between; margin-bottom: 28px; }
      .addr-block { font-size: 12px; line-height: 1.6; }
      .addr-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: ${BRAND}; margin-bottom: 4px; font-weight: 600; }
      .klauseln { list-style: none; margin: 0 0 24px; padding: 0; }
      .klauseln li { display: flex; gap: 10px; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 12.5px; line-height: 1.5; }
      .check { flex: none; width: 18px; height: 18px; border-radius: 50%; background: ${BRAND}; color: #fff; font-size: 11px; display: flex; align-items: center; justify-content: center; margin-top: 1px; }
      .bemerkungen-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: ${BRAND}; margin-bottom: 6px; font-weight: 600; }
      .bemerkungen-box { min-height: 50px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 12.5px; color: #334155; margin-bottom: 28px; white-space: pre-wrap; }
      .signature-block { margin-top: 8px; }
      .signature-img { max-height: 90px; max-width: 320px; display: block; border-bottom: 1.5px solid #0f172a; padding-bottom: 4px; margin-bottom: 6px; }
      .signature-meta { font-size: 11px; color: #64748b; }
      .footer { margin-top: 40px; font-size: 10px; color: #94a3b8; }
    </style>
  </head>
  <body>
    <div class="accent-bar"></div>
    <div class="header">
      <div><strong style="font-size:16px;">${escapeHtml(cfg.firmenname || "")}</strong></div>
      <div class="company">
        ${escapeHtml(cfg.strasse || "")}<br/>
        ${escapeHtml(cfg.plz || "")} ${escapeHtml(cfg.ort || "")}
      </div>
    </div>

    <h1>Abnahmeprotokoll ${escapeHtml(order.auftragsnummer)}</h1>
    <div class="meta">Abgeschlossen am ${dateCh(abgeschlossenAm)} Uhr</div>

    <div class="addresses">
      <div class="addr-block">
        <div class="addr-label">Kunde</div>
        ${escapeHtml(kundenName)}<br/>
        ${escapeHtml(customer.strasse)}<br/>
        ${escapeHtml(customer.plz)} ${escapeHtml(customer.ort)}
      </div>
      <div class="addr-block">
        <div class="addr-label">Installationsort</div>
        ${escapeHtml(property.strasse)}<br/>
        ${escapeHtml(property.plz)} ${escapeHtml(property.ort)}
      </div>
    </div>

    <ul class="klauseln">
      ${klauseln.map((k) => `<li><span class="check">✓</span><span>${escapeHtml(k)}</span></li>`).join("")}
    </ul>

    <div class="bemerkungen-label">Bemerkungen</div>
    <div class="bemerkungen-box">${bemerkungen ? escapeHtml(bemerkungen) : "Keine."}</div>

    <div class="signature-block">
      <div class="bemerkungen-label">Unterschrift</div>
      <img class="signature-img" src="${unterschriftDataUrl}" />
      <div class="signature-meta">${escapeHtml(unterzeichnerName)}</div>
    </div>

    <div class="footer">
      Dieses Protokoll wurde digital erstellt und mit einer elektronischen Unterschrift bestätigt.
    </div>
  </body>
  </html>`;
}
