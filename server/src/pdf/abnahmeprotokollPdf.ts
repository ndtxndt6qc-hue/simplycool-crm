import puppeteer from "puppeteer";
import { renderAbnahmeprotokollHtml } from "./abnahmeprotokollTemplate.js";

type AbnahmeprotokollData = Parameters<typeof renderAbnahmeprotokollHtml>[0];

export async function renderAbnahmeprotokollPdf(data: AbnahmeprotokollData): Promise<Buffer> {
  const html = renderAbnahmeprotokollHtml(data);
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
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
