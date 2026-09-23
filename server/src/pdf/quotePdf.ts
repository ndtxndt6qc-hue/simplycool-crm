import puppeteer from "puppeteer";
import type { InferSelectModel } from "drizzle-orm";
import type { customers, properties, quoteItems, quotes, settings } from "../db/schema.js";
import { renderQuoteHtml } from "./quoteTemplate.js";

type QuoteData = {
  quote: InferSelectModel<typeof quotes>;
  customer: InferSelectModel<typeof customers>;
  property: InferSelectModel<typeof properties>;
  items: InferSelectModel<typeof quoteItems>[];
  settings: InferSelectModel<typeof settings>;
};

export async function renderQuotePdf(data: QuoteData): Promise<Buffer> {
  const html = renderQuoteHtml(data);
  const browser = await puppeteer.launch({
    headless: true,
    // Nötig, damit Chromium als root startet (z.B. im Docker-Container ohne eigenen Nutzer);
    // im Codespace/lokal (nicht-root) wirkt sich das nicht aus.
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", bottom: "34px", left: "0", right: "0" },
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: `
        <div style="width:100%; font-family:Helvetica,Arial,sans-serif; font-size:9px; color:#94a3b8; text-align:center;">
          Seite <span class="pageNumber"></span> von <span class="totalPages"></span>
        </div>`,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
