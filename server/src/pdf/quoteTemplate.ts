import fs from "node:fs";
import path from "node:path";
import type { InferSelectModel } from "drizzle-orm";
import type { customers, devices, properties, quoteItems, quotes, settings } from "../db/schema.js";

type QuoteData = {
  quote: InferSelectModel<typeof quotes>;
  customer: InferSelectModel<typeof customers>;
  property: InferSelectModel<typeof properties>;
  items: (InferSelectModel<typeof quoteItems> & { deviceBildPfad?: string | null })[];
  settings: InferSelectModel<typeof settings>;
};

const ITEM_TYP_LABELS: Record<string, string> = {
  geraet: "Gerät",
  kernbohrung: "Kernbohrung",
  montage: "Montage/Arbeitszeit",
  fahrt_material: "Fahrt/Kleinmaterial",
  sonderposition: "Sonderposition",
};

function chf(value: number) {
  return new Intl.NumberFormat("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function dateCh(value: string | Date | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("de-CH").format(new Date(value));
}

function formatMenge(value: string | number, einheit: string | null) {
  const n = Number(value);
  const formatted = Number.isInteger(n) ? String(n) : n.toString().replace(".", ",");
  return einheit ? `${formatted} ${einheit}` : formatted;
}

function logoDataUri(logoPfad: string | null): string | null {
  if (!logoPfad) return null;
  try {
    const filePath = path.resolve(process.cwd(), logoPfad.replace(/^\//, ""));
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).slice(1);
    const mime = ext === "svg" ? "image/svg+xml" : `image/${ext === "jpg" ? "jpeg" : ext}`;
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

const TECHNIKER_ICON_SVG = `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#475569" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="3.2"/><path d="M5 21c0-4 3.1-7 7-7s7 3 7 7"/></svg>`;
const MATERIAL_ICON_SVG = `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#475569" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13"/><rect x="2.5" y="13" width="19" height="5" rx="1"/><circle cx="7" cy="18.5" r="1.5"/><circle cx="17" cy="18.5" r="1.5"/></svg>`;
const KERNBOHRUNG_ICON_SVG = `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#475569" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.2"/></svg>`;

function itemImageHtml(item: InferSelectModel<typeof quoteItems> & { deviceBildPfad?: string | null }): string {
  if (item.typ === "geraet") {
    const img = item.deviceBildPfad ? logoDataUri(item.deviceBildPfad) : null;
    return img ? `<img class="item-img" src="${img}" />` : "";
  }
  if (item.typ === "montage") return TECHNIKER_ICON_SVG;
  if (item.typ === "fahrt_material") return MATERIAL_ICON_SVG;
  if (item.typ === "kernbohrung") return KERNBOHRUNG_ICON_SVG;
  return "";
}

export function renderQuoteHtml({ quote, customer, property, items, settings: cfg }: QuoteData): string {
  const mwstSatz = Number(quote.mwstSatz);
  const netto = items.reduce((acc, i) => acc + Number(i.einzelpreis) * Number(i.menge), 0);
  const mwstBetrag = netto * (mwstSatz / 100);
  const total = netto + mwstBetrag;
  const logo = logoDataUri(cfg.logoPfad);

  const kundenName = [customer.firma, [customer.vorname, customer.nachname].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(" — ");

  const rows = items
    .map(
      (i) => `
      <tr>
        <td class="img-cell">${itemImageHtml(i)}</td>
        <td>${ITEM_TYP_LABELS[i.typ] ?? i.typ}</td>
        <td>${escapeHtml(i.beschreibung)}</td>
        <td class="num">${escapeHtml(formatMenge(i.menge, i.einheit))}</td>
        <td class="num">${chf(Number(i.einzelpreis))}</td>
        <td class="num">${chf(Number(i.einzelpreis) * Number(i.menge))}</td>
      </tr>`
    )
    .join("");

  return `
  <!doctype html>
  <html lang="de-CH">
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      body { font-family: "Helvetica Neue", Arial, sans-serif; color: #0f172a; font-size: 12px; margin: 0; padding: 40px; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
      .logo { max-height: 60px; max-width: 220px; }
      .company { text-align: right; font-size: 11px; color: #475569; line-height: 1.5; }
      .addresses { display: flex; justify-content: space-between; margin-bottom: 32px; }
      .addr-block { font-size: 11px; line-height: 1.6; }
      .addr-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 4px; }
      h1 { font-size: 20px; margin: 0 0 4px; }
      .meta { font-size: 11px; color: #475569; margin-bottom: 24px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
      th { text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.04em; color: #94a3b8; border-bottom: 1px solid #cbd5e1; padding: 6px 8px; }
      td { padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
      .num { text-align: right; }
      .img-cell { width: 34px; padding: 6px 4px; }
      .item-img { width: 28px; height: 28px; object-fit: cover; border-radius: 4px; display: block; }
      .totals { width: 260px; margin-left: auto; margin-top: 16px; }
      .totals div { display: flex; justify-content: space-between; padding: 4px 8px; font-size: 12px; }
      .totals .grand { font-weight: 700; font-size: 14px; border-top: 1px solid #0f172a; margin-top: 4px; padding-top: 8px; }
      .footer { margin-top: 60px; font-size: 10px; color: #94a3b8; }
    </style>
  </head>
  <body>
    <div class="header">
      ${logo ? `<img class="logo" src="${logo}" />` : `<div></div>`}
      <div class="company">
        <strong>${escapeHtml(cfg.firmenname || "")}</strong><br/>
        ${escapeHtml(cfg.strasse || "")}<br/>
        ${escapeHtml(cfg.plz || "")} ${escapeHtml(cfg.ort || "")}
        ${cfg.mwstNummer ? `<br/>MWST: ${escapeHtml(cfg.mwstNummer)}` : ""}
      </div>
    </div>

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

    <h1>Angebot ${escapeHtml(quote.angebotsnummer)}</h1>
    <div class="meta">
      Datum: ${dateCh(quote.datum)}${quote.gueltigBis ? ` · Gültig bis: ${dateCh(quote.gueltigBis)}` : ""}
    </div>

    <table>
      <thead>
        <tr>
          <th></th>
          <th>Art</th>
          <th>Beschreibung</th>
          <th class="num">Menge</th>
          <th class="num">Preis (CHF)</th>
          <th class="num">Total (CHF)</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="totals">
      <div><span>Netto</span><span>CHF ${chf(netto)}</span></div>
      <div><span>MWST ${mwstSatz.toFixed(2)}%</span><span>CHF ${chf(mwstBetrag)}</span></div>
      <div class="grand"><span>Total</span><span>CHF ${chf(total)}</span></div>
    </div>

    <div class="footer">
      Wandmontierte Monoblock-Klimageräte — Kühlen &amp; Heizen ohne Aussengerät. Preise inkl. MWST, exkl. allfälliger Sonderleistungen.
    </div>
  </body>
  </html>`;
}

function escapeHtml(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
