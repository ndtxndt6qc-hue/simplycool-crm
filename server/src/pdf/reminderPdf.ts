import PDFDocument from "pdfkit";
import type { InferSelectModel } from "drizzle-orm";
import type { customers, invoices, settings } from "../db/schema.js";
import { drawLogo } from "./logo.js";

type ReminderData = {
  invoice: InferSelectModel<typeof invoices>;
  customer: InferSelectModel<typeof customers>;
  settings: InferSelectModel<typeof settings>;
  stufe: 1 | 2;
  offenerBetrag: number;
};

function chf(value: number) {
  return new Intl.NumberFormat("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function dateCh(value: string | Date | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("de-CH").format(new Date(value));
}

const STUFE_TEXT: Record<1 | 2, { titel: string; text: string }> = {
  1: {
    titel: "1. Zahlungserinnerung",
    text: "Leider konnten wir bis heute keinen Zahlungseingang für untenstehende Rechnung feststellen. Wir bitten Sie, den offenen Betrag innert 10 Tagen zu begleichen. Sollten Sie die Zahlung bereits ausgelöst haben, betrachten Sie dieses Schreiben als gegenstandslos.",
  },
  2: {
    titel: "2. Mahnung",
    text: "Trotz unserer Zahlungserinnerung ist der untenstehende Betrag noch immer offen. Wir bitten Sie, die Zahlung innert 10 Tagen vorzunehmen. Bei weiterem Ausbleiben der Zahlung müssen wir uns weitere Schritte vorbehalten.",
  },
};

export async function renderReminderPdf(data: ReminderData): Promise<Buffer> {
  const { invoice, customer, settings: cfg, stufe, offenerBetrag } = data;
  const { titel, text } = STUFE_TEXT[stufe];

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  doc.font("Helvetica");
  drawLogo(doc, cfg.logoPfad, 505, 40, 50);
  doc.fontSize(9).fillColor("#475569");
  doc.text(cfg.firmenname || "", 400, 40, { width: 155, align: "right" });
  doc.text(cfg.strasse || "", { width: 155, align: "right" });
  doc.text(`${cfg.plz || ""} ${cfg.ort || ""}`, { width: 155, align: "right" });

  const kundenName = [customer.firma, [customer.vorname, customer.nachname].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(" — ");
  doc.fillColor("#0f172a").fontSize(11);
  doc.text(kundenName, 40, 100);
  doc.text(customer.strasse, 40);
  doc.text(`${customer.plz} ${customer.ort}`, 40);

  doc.fontSize(9).fillColor("#475569").text(`Aarau, ${dateCh(new Date())}`, 40, 190);

  doc.fontSize(18).fillColor("#0f172a").text(titel, 40, 220);
  doc.moveDown(1);
  doc.fontSize(10).fillColor("#0f172a").text(text, 40, doc.y, { width: 460 });

  doc.moveDown(2);
  const y = doc.y;
  doc.fontSize(10);
  doc.text("Rechnung", 40, y);
  doc.text(invoice.rechnungsnummer, 200, y);
  doc.text("Rechnungsdatum", 40, y + 18);
  doc.text(dateCh(invoice.datum), 200, y + 18);
  doc.text("Fällig seit", 40, y + 36);
  doc.text(dateCh(invoice.faelligkeitsdatum), 200, y + 36);
  doc.font("Helvetica-Bold").text("Offener Betrag", 40, y + 60);
  doc.text(`CHF ${chf(offenerBetrag)}`, 200, y + 60);

  doc.end();
  return done;
}
