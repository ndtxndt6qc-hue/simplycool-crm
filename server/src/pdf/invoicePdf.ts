import PDFDocument from "pdfkit";
import { SwissQRBill } from "swissqrbill/pdf";
import type { Data as QRBillData } from "swissqrbill/types";
import type { InferSelectModel } from "drizzle-orm";
import type { customers, invoiceItems, invoices, orders, properties, settings } from "../db/schema.js";
import { paymentAccount } from "../services/reference.js";
import { drawLogo } from "./logo.js";

type InvoiceData = {
  invoice: InferSelectModel<typeof invoices>;
  items: InferSelectModel<typeof invoiceItems>[];
  customer: InferSelectModel<typeof customers>;
  property: InferSelectModel<typeof properties>;
  order: InferSelectModel<typeof orders>;
  settings: InferSelectModel<typeof settings>;
};

function chf(value: number) {
  return new Intl.NumberFormat("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function dateCh(value: string | Date | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("de-CH").format(new Date(value));
}

export async function renderInvoicePdf(data: InvoiceData): Promise<Buffer> {
  const { invoice, items, customer, property, settings: cfg } = data;

  const netto = items.reduce((acc, i) => acc + Number(i.einzelpreis) * i.menge, 0);
  const mwstSatz = Number(invoice.mwstSatz);
  const mwstBetrag = netto * (mwstSatz / 100);
  const total = netto + mwstBetrag;

  const doc = new PDFDocument({ size: "A4", margin: 40, autoFirstPage: true });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  doc.font("Helvetica");

  drawLogo(doc, cfg.logoPfad, 505, 40, 50);

  doc.fontSize(9).fillColor("#475569");
  doc.text(cfg.firmenname || "", 400, cfg.logoPfad ? 95 : 40, { width: 155, align: "right" });
  doc.text(cfg.strasse || "", { width: 155, align: "right" });
  doc.text(`${cfg.plz || ""} ${cfg.ort || ""}`, { width: 155, align: "right" });
  if (cfg.mwstNummer) doc.text(`MWST: ${cfg.mwstNummer}`, { width: 155, align: "right" });

  const kundenName = [customer.firma, [customer.vorname, customer.nachname].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(" — ");

  doc.fillColor("#94a3b8").fontSize(8).text("RECHNUNGSEMPFÄNGER", 40, 100, { characterSpacing: 0.5 });
  doc.fillColor("#0f172a").fontSize(11);
  doc.text(kundenName, 40, 112);
  doc.text(customer.strasse, 40);
  doc.text(`${customer.plz} ${customer.ort}`, 40);

  doc.fillColor("#94a3b8").fontSize(8).text("INSTALLATIONSORT", 320, 100, { characterSpacing: 0.5 });
  doc.fillColor("#0f172a").fontSize(11);
  doc.text(property.strasse, 320, 112);
  doc.text(`${property.plz} ${property.ort}`, 320);

  doc.moveDown(2);
  doc.fontSize(20).fillColor("#0f172a").text(`Rechnung ${invoice.rechnungsnummer}`, 40, 190);
  doc.fontSize(10).fillColor("#475569").text(
    `Datum: ${dateCh(invoice.datum)} · Fällig bis: ${dateCh(invoice.faelligkeitsdatum)}`,
    40
  );

  const tableTop = 240;
  const colWidths = [220, 60, 90, 90];
  const rows = [
    { header: true, values: ["Beschreibung", "Menge", "Preis (CHF)", "Total (CHF)"] },
    ...items.map((i) => [
      i.beschreibung,
      String(i.menge),
      chf(Number(i.einzelpreis)),
      chf(Number(i.einzelpreis) * i.menge),
    ]),
  ];

  let y = tableTop;
  doc.fontSize(9);
  for (const row of rows) {
    const isHeader = "header" in row;
    const values = isHeader ? row.values : row;
    let x = 40;
    doc.fillColor(isHeader ? "#94a3b8" : "#0f172a").font(isHeader ? "Helvetica-Bold" : "Helvetica");
    values.forEach((val, idx) => {
      doc.text(val, x, y, { width: colWidths[idx], align: idx === 0 ? "left" : "right" });
      x += colWidths[idx];
    });
    y += 20;
    if (isHeader) {
      doc.moveTo(40, y - 4).lineTo(500, y - 4).strokeColor("#cbd5e1").stroke();
    }
  }

  y += 10;
  doc.moveTo(320, y).lineTo(500, y).strokeColor("#e2e8f0").stroke();
  y += 8;
  doc.font("Helvetica").fillColor("#0f172a").fontSize(10);
  doc.text("Netto", 320, y, { width: 90 });
  doc.text(`CHF ${chf(netto)}`, 410, y, { width: 90, align: "right" });
  y += 16;
  doc.text(`MWST ${mwstSatz.toFixed(2)}%`, 320, y, { width: 90 });
  doc.text(`CHF ${chf(mwstBetrag)}`, 410, y, { width: 90, align: "right" });
  y += 16;
  doc.font("Helvetica-Bold").fontSize(12);
  doc.text("Total", 320, y, { width: 90 });
  doc.text(`CHF ${chf(total)}`, 410, y, { width: 90, align: "right" });

  const account = paymentAccount(cfg.iban, cfg.qrIban);
  if (account) {
    const qrData: QRBillData = {
      currency: "CHF",
      amount: total,
      creditor: {
        account,
        name: cfg.firmenname || "",
        address: cfg.strasse || "",
        zip: cfg.plz || "",
        city: cfg.ort || "",
        country: "CH",
      },
      debtor: {
        name: [customer.firma, [customer.vorname, customer.nachname].filter(Boolean).join(" ")]
          .filter(Boolean)
          .join(" — "),
        address: customer.strasse,
        zip: customer.plz,
        city: customer.ort,
        country: "CH",
      },
      reference: invoice.qrReferenznummer || undefined,
      message: invoice.rechnungsnummer,
    };

    const qrBill = new SwissQRBill(qrData, { language: "DE" });
    qrBill.attachTo(doc);
  }

  doc.end();
  return done;
}
