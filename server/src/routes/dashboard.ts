import { Router } from "express";
import { db } from "../db/client.js";
import { invoiceItems, invoices, orders, payments, quoteItems, quotes } from "../db/schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const dashboardRouter = Router();

function monthKey(date: string | Date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

dashboardRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const allQuotes = await db.select().from(quotes);
    const allQuoteItems = await db.select().from(quoteItems);
    const allOrders = await db.select().from(orders);
    const allInvoices = await db.select().from(invoices);
    const allInvoiceItems = await db.select().from(invoiceItems);
    const allPayments = await db.select().from(payments);

    const itemsByQuote = new Map<number, typeof allQuoteItems>();
    for (const item of allQuoteItems) {
      if (!itemsByQuote.has(item.quoteId)) itemsByQuote.set(item.quoteId, []);
      itemsByQuote.get(item.quoteId)!.push(item);
    }

    function quoteTotal(quoteId: number, mwstSatz: string) {
      const items = itemsByQuote.get(quoteId) ?? [];
      const netto = items.reduce((acc, i) => acc + Number(i.einzelpreis) * Number(i.menge), 0);
      return netto * (1 + Number(mwstSatz) / 100);
    }

    function quoteDeckungsbeitrag(quoteId: number) {
      const items = itemsByQuote.get(quoteId) ?? [];
      return items.reduce((acc, i) => acc + (Number(i.einzelpreis) - Number(i.einkaufspreisIntern)) * Number(i.menge), 0);
    }

    const offeneAngebote = allQuotes.filter((q) => q.status === "entwurf" || q.status === "versendet");
    const offeneAngeboteVolumen = offeneAngebote.reduce((acc, q) => acc + quoteTotal(q.id, q.mwstSatz), 0);

    const laufendeAuftraege = allOrders.filter((o) => o.status !== "abgeschlossen" && o.status !== "storniert").length;

    const itemsByInvoice = new Map<number, typeof allInvoiceItems>();
    for (const item of allInvoiceItems) {
      if (!itemsByInvoice.has(item.invoiceId)) itemsByInvoice.set(item.invoiceId, []);
      itemsByInvoice.get(item.invoiceId)!.push(item);
    }
    const paymentsByInvoice = new Map<number, number>();
    for (const p of allPayments) {
      paymentsByInvoice.set(p.invoiceId, (paymentsByInvoice.get(p.invoiceId) ?? 0) + Number(p.betrag));
    }
    const orderById = new Map(allOrders.map((o) => [o.id, o]));

    function invoiceNetto(invoiceId: number) {
      const items = itemsByInvoice.get(invoiceId) ?? [];
      return items.reduce((acc, i) => acc + Number(i.einzelpreis) * Number(i.menge), 0);
    }
    function invoiceTotal(invoice: (typeof allInvoices)[number]) {
      return invoiceNetto(invoice.id) * (1 + Number(invoice.mwstSatz) / 100);
    }

    let offeneRechnungenAnzahl = 0;
    let offeneRechnungenVolumen = 0;
    const monthly = new Map<string, { umsatz: number; deckungsbeitrag: number }>();
    let margeSumme = 0;
    let margeCount = 0;

    for (const invoice of allInvoices) {
      const total = invoiceTotal(invoice);
      const bezahlt = paymentsByInvoice.get(invoice.id) ?? 0;
      if (bezahlt < total) {
        offeneRechnungenAnzahl += 1;
        offeneRechnungenVolumen += total - bezahlt;
      }

      const key = monthKey(invoice.datum);
      const entry = monthly.get(key) ?? { umsatz: 0, deckungsbeitrag: 0 };
      const netto = invoiceNetto(invoice.id);
      entry.umsatz += netto;

      const order = orderById.get(invoice.orderId);
      if (order) {
        const db_ = quoteDeckungsbeitrag(order.quoteId);
        entry.deckungsbeitrag += db_;
        margeSumme += db_;
        margeCount += 1;
      }
      monthly.set(key, entry);
    }

    const now = new Date();
    const months: { monat: string; umsatz: number; deckungsbeitrag: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const entry = monthly.get(key) ?? { umsatz: 0, deckungsbeitrag: 0 };
      months.push({ monat: key, ...entry });
    }

    res.json({
      offeneAngebote: { anzahl: offeneAngebote.length, volumen: offeneAngeboteVolumen },
      laufendeAuftraege,
      offeneRechnungen: { anzahl: offeneRechnungenAnzahl, volumen: offeneRechnungenVolumen },
      durchschnittlicheMargeProAuftrag: margeCount > 0 ? margeSumme / margeCount : 0,
      umsatzProMonat: months,
    });
  })
);
