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
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
