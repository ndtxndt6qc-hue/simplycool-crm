import fs from "node:fs";
import path from "node:path";
import type { InferSelectModel } from "drizzle-orm";
import type { customers, devices, properties, quoteItems, quotes, settings } from "../db/schema.js";

type QuoteData = {
  quote: InferSelectModel<typeof quotes>;
  customer: InferSelectModel<typeof customers>;
  property: InferSelectModel<typeof properties>;
  items: (InferSelectModel<typeof quoteItems> & { deviceBildPfad?: string | null; deviceSpezifikationen?: string | null })[];
  settings: InferSelectModel<typeof settings>;
};

const ITEM_TYP_LABELS: Record<string, string> = {
  geraet: "Gerät",
  kernbohrung: "Kernbohrung",
  montage: "Montage/Arbeitszeit",
  fahrt_material: "Fahrt/Kleinmaterial",
  sonderposition: "Sonderposition",
  gemeindeabklaerung: "Gemeinde-Abklärung",
  rabatt: "Rabatt",
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

// Akzentfarbe passend zur internen App (--color-primary: #0f766e).
const BRAND = "#0f766e";

const TECHNIKER_ICON_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="${BRAND}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="3.2"/><path d="M5 21c0-4 3.1-7 7-7s7 3 7 7"/></svg>`;
const MATERIAL_ICON_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="${BRAND}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13"/><rect x="2.5" y="13" width="19" height="5" rx="1"/><circle cx="7" cy="18.5" r="1.5"/><circle cx="17" cy="18.5" r="1.5"/></svg>`;
const KERNBOHRUNG_ICON_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="${BRAND}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.2"/></svg>`;
const GEMEINDE_ICON_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="${BRAND}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V9l8-5 8 5v12"/><path d="M9 21v-6h6v6"/></svg>`;
const RABATT_ICON_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="${BRAND}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12 12 20 4 12V4h8z"/><circle cx="9" cy="9" r="1.4" fill="${BRAND}" stroke="none"/></svg>`;

// Vertrauens-Kicker am Seitenende
const WRENCH_ICON_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="${BRAND}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 1 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.8 2.8-2-2z"/></svg>`;
const CHECK_ICON_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="${BRAND}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/></svg>`;
const PIN_ICON_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="${BRAND}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.4"/></svg>`;

function itemImageHtml(item: InferSelectModel<typeof quoteItems> & { deviceBildPfad?: string | null }): string {
  if (item.typ === "geraet") {
    const img = item.deviceBildPfad ? logoDataUri(item.deviceBildPfad) : null;
    return img ? `<img class="item-img" src="${img}" />` : "";
  }
  const icon =
    item.typ === "montage"
      ? TECHNIKER_ICON_SVG
      : item.typ === "fahrt_material"
        ? MATERIAL_ICON_SVG
        : item.typ === "kernbohrung"
          ? KERNBOHRUNG_ICON_SVG
          : item.typ === "gemeindeabklaerung"
            ? GEMEINDE_ICON_SVG
            : item.typ === "rabatt"
              ? RABATT_ICON_SVG
              : null;
  return icon ? `<div class="icon-badge">${icon}</div>` : "";
}

export function renderQuoteHtml({ quote, customer, property, items, settings: cfg }: QuoteData): string {
  const mwstSatz = Number(quote.mwstSatz);
  const verbindlicheItems = items.filter((i) => !i.optional);
  const optionaleItems = items.filter((i) => i.optional);
  const netto = verbindlicheItems.reduce((acc, i) => acc + Number(i.einzelpreis) * Number(i.menge), 0);
  const nettoOptional = optionaleItems.reduce((acc, i) => acc + Number(i.einzelpreis) * Number(i.menge), 0);
  const mwstBetrag = netto * (mwstSatz / 100);
  const total = netto + mwstBetrag;
  const logo = logoDataUri(cfg.logoPfad);

  const kundenName = [customer.firma, [customer.vorname, customer.nachname].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(" — ");

  // Persönliche Anrede ohne Anrede-Feld (kein Geschlecht in den Stammdaten) — bei Privatkunden
  // mit Vor-/Nachname, sonst neutral.
  const anredeName = !customer.firma && (customer.vorname || customer.nachname) ? ` ${kundenName}` : "";

  const headerHtml = `
    <div class="accent-bar"></div>
    <div class="header">
      ${logo ? `<img class="logo" src="${logo}" />` : `<div></div>`}
      <div class="company">
        <strong>${escapeHtml(cfg.firmenname || "")}</strong><br/>
        ${escapeHtml(cfg.strasse || "")}<br/>
        ${escapeHtml(cfg.plz || "")} ${escapeHtml(cfg.ort || "")}
        ${cfg.mwstNummer ? `<br/>MWST: ${escapeHtml(cfg.mwstNummer)}` : ""}
      </div>
    </div>`;

  const addressesHtml = `
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
    </div>`;

  const rows = items
    .map(
      (i) => `
      <tr class="${i.optional ? "optional-row" : ""}">
        <td class="img-cell">${itemImageHtml(i)}</td>
        <td>${ITEM_TYP_LABELS[i.typ] ?? i.typ}</td>
        <td>
          ${escapeHtml(i.beschreibung)}${i.optional ? ' <span class="opt-badge">optional</span>' : ""}
          ${i.deviceSpezifikationen ? `<div class="item-specs">${escapeHtml(i.deviceSpezifikationen).replace(/\n/g, "<br/>")}</div>` : ""}
        </td>
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
      body { font-family: "Helvetica Neue", Arial, sans-serif; color: #0f172a; font-size: 13px; margin: 0; padding: 40px; }
      .accent-bar { height: 8px; background: ${BRAND}; margin: -40px -40px 32px -40px; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
      .logo { max-height: 60px; max-width: 220px; }
      .company { text-align: right; font-size: 12px; color: #475569; line-height: 1.5; }
      .addresses { display: flex; justify-content: space-between; margin-bottom: 24px; }
      .addr-block { font-size: 12px; line-height: 1.6; }
      .addr-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: ${BRAND}; margin-bottom: 4px; font-weight: 600; }
      h1 { font-size: 22px; margin: 0 0 4px; }
      .meta { font-size: 12px; color: #475569; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
      .gueltig-badge { display: inline-block; background: #f0fdfa; color: ${BRAND}; border-radius: 999px; padding: 3px 11px; font-weight: 600; font-size: 11px; }
      .greeting { font-size: 12px; line-height: 1.6; color: #334155; max-width: 480px; margin: 0 0 18px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
      th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: ${BRAND}; background: #f0fdfa; border-bottom: 1px solid #cce9e4; padding: 7px 8px; }
      th:first-child { border-top-left-radius: 6px; border-bottom-left-radius: 6px; }
      th:last-child { border-top-right-radius: 6px; border-bottom-right-radius: 6px; }
      td { padding: 9px 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
      tbody tr:nth-child(even) td { background: #f8fafc; }
      .num { text-align: right; }
      .img-cell { width: 42px; padding: 6px 4px; }
      .icon-badge { width: 32px; height: 32px; border-radius: 50%; background: #f0fdfa; display: flex; align-items: center; justify-content: center; }
      .item-specs { font-size: 10.5px; line-height: 1.5; color: #64748b; margin-top: 3px; }
      .item-img { width: 32px; height: 32px; object-fit: cover; border-radius: 50%; display: block; }
      .totals { width: 260px; margin-left: auto; margin-top: 16px; }
      .totals div { display: flex; justify-content: space-between; padding: 4px 8px; font-size: 13px; }
      .totals .optional-line { color: #92400e; }
      .total-box { width: 260px; margin-left: auto; margin-top: 8px; background: ${BRAND}; color: #fff; border-radius: 10px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; font-weight: 700; font-size: 16px; }
      .optional-row td { color: #64748b; font-style: italic; }
      .opt-badge { display: inline-block; font-style: normal; font-size: 9px; text-transform: uppercase; letter-spacing: 0.04em; background: #fef3c7; color: #92400e; border-radius: 3px; padding: 1px 5px; margin-left: 4px; }
      .payment-notes { width: 260px; margin-left: auto; margin-top: 10px; font-size: 10.5px; line-height: 1.6; color: #64748b; text-align: right; }
      .next-steps { margin-top: 20px; padding: 14px 18px; background: #f8fafc; border-radius: 10px; }
      .next-steps-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: ${BRAND}; font-weight: 700; margin-bottom: 10px; }
      .next-steps-grid { display: flex; gap: 20px; }
      .step { flex: 1; display: flex; gap: 8px; font-size: 10.5px; line-height: 1.55; color: #475569; }
      .step-num { flex: none; width: 20px; height: 20px; border-radius: 50%; background: ${BRAND}; color: #fff; font-size: 10.5px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
      .trust-row { display: flex; justify-content: space-between; gap: 16px; margin-top: 16px; padding-top: 12px; border-top: 1px solid #e2e8f0; }
      .trust-item { display: flex; align-items: center; gap: 8px; font-size: 10.5px; color: #475569; }
      .footer { margin-top: 14px; font-size: 11px; color: #94a3b8; }
      .agb-hinweis { margin-top: 6px; font-size: 10px; color: #94a3b8; }
      .auftragsbestaetigung { page-break-before: always; padding-top: 40px; }
      .auftragsbestaetigung h2 { font-size: 22px; margin: 0 0 14px; }
      .auftragsbestaetigung p { font-size: 12px; line-height: 1.6; color: #334155; }
      .frage-block { margin-top: 20px; padding: 14px; border: 1px solid #cbd5e1; border-radius: 8px; }
      .frage-block .frage-titel { font-size: 12px; font-weight: 700; margin-bottom: 10px; }
      .checkbox-zeile { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 12px; }
      .checkbox-box { display: inline-block; width: 12px; height: 12px; border: 1.3px solid #0f172a; flex-shrink: 0; }
      .unterschrift-zeile { display: flex; gap: 40px; margin-top: 50px; }
      .unterschrift-feld { flex: 1; border-top: 1px solid #0f172a; padding-top: 6px; font-size: 11px; color: #64748b; }
    </style>
  </head>
  <body>
    ${headerHtml}

    ${addressesHtml}

    <h1>Angebot ${escapeHtml(quote.angebotsnummer)}</h1>
    <div class="meta">
      <span>Datum: ${dateCh(quote.datum)}</span>
      ${quote.gueltigBis ? `<span class="gueltig-badge">Gültig bis ${dateCh(quote.gueltigBis)}</span>` : ""}
    </div>

    <p class="greeting">
      Guten Tag${anredeName}, vielen Dank für Ihr Interesse an einer Klimaanlage ohne Aussengerät. Gerne
      unterbreiten wir Ihnen folgendes Angebot:
    </p>

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
      ${
        optionaleItems.length
          ? `<div class="optional-line"><span>Optionale Positionen (nicht enthalten)</span><span>CHF ${chf(nettoOptional)}</span></div>`
          : ""
      }
    </div>
    <div class="total-box"><span>Total</span><span>CHF ${chf(total)}</span></div>

    <div class="payment-notes">
      <div>Zahlbar netto 30 Tage nach Rechnungsstellung, sofern nicht anders vereinbart.</div>
      ${
        cfg.iban || cfg.qrIban
          ? `<div>Die Rechnung inkl. QR-Zahlteil folgt nach Abschluss der Installation.</div>`
          : ""
      }
    </div>

    <div class="next-steps">
      <div class="next-steps-title">So geht's weiter</div>
      <div class="next-steps-grid">
        <div class="step"><div class="step-num">1</div><div><strong>Angebot bestätigen</strong><br/>Auftragsbestätigung auf Seite 2 unterschrieben zurücksenden.</div></div>
        <div class="step"><div class="step-num">2</div><div><strong>Termin vereinbaren</strong><br/>Wir kontaktieren Sie für einen Installationstermin.</div></div>
        <div class="step"><div class="step-num">3</div><div><strong>Installation</strong><br/>Meist an einem Tag, in wenigen Stunden.</div></div>
      </div>
    </div>

    <div class="trust-row">
      <div class="trust-item">${WRENCH_ICON_SVG}<span>Handwerkserfahrung</span></div>
      <div class="trust-item">${CHECK_ICON_SVG}<span>Unkomplizierte Abwicklung</span></div>
      <div class="trust-item">${PIN_ICON_SVG}<span>Lokale Verfügbarkeit</span></div>
    </div>

    <div class="footer">
      Wandmontierte Monoblock-Klimageräte — Kühlen &amp; Heizen ohne Aussengerät. Preise inkl. MWST, exkl. allfälliger Sonderleistungen.
      <div class="agb-hinweis">Es gelten unsere Allgemeinen Geschäftsbedingungen (AGB), einsehbar unter www.simply-cool.ch/agb.</div>
    </div>

    <div class="auftragsbestaetigung">
      ${headerHtml}

      ${addressesHtml}

      <h2>Auftragsbestätigung</h2>
      <p>
        Hiermit bestätige ich, die im Angebot ${escapeHtml(quote.angebotsnummer)} aufgeführten Arbeiten zu den genannten
        Konditionen in Auftrag zu geben, und anerkenne die Allgemeinen Geschäftsbedingungen (AGB, einsehbar unter
        www.simply-cool.ch/agb) als Vertragsbestandteil. Bitte dieses Formular unterzeichnet an
        ${escapeHtml(cfg.firmenname || "")} retournieren.
      </p>

      <div class="frage-block">
        <div class="frage-titel">
          Klärung allfälliger Bewilligungs-/Meldepflichten bei der zuständigen Gemeinde erfolgt durch:
        </div>
        <div class="checkbox-zeile"><span class="checkbox-box"></span><span>SimplyCool</span></div>
        <div class="checkbox-zeile"><span class="checkbox-box"></span><span>Bauseits (durch Auftraggeber)</span></div>
      </div>

      <div class="unterschrift-zeile">
        <div class="unterschrift-feld">Ort, Datum</div>
        <div class="unterschrift-feld">Unterschrift Auftraggeber</div>
      </div>
    </div>
  </body>
  </html>`;
}

function escapeHtml(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
