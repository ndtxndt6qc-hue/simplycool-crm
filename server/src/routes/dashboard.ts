import { Router } from "express";
import { db } from "../db/client.js";
import { bookings, customers, invoiceItems, invoices, leads, orders, payments, properties, quoteItems, quotes } from "../db/schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { zurichNow } from "../services/booking.js";

export const dashboardRouter = Router();

// Datum (YYYY-MM-DD) in Europe/Zurich, unabhängig von der Server-Zeitzone — für den
// Tagesvergleich in der "Heute"-Übersicht (installationTermin/bohrTermin sind Timestamps).
function zurichDateKey(value: Date | string | null): string | null {
  if (!value) return null;
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zurich", year: "numeric", month: "2-digit", day: "2-digit" });
  const parts = Object.fromEntries(fmt.formatToParts(new Date(value)).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

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
    const allCustomers = await db.select().from(customers);
    const allProperties = await db.select().from(properties);
    const allLeads = await db.select().from(leads);
    const allBookings = await db.select().from(bookings);

    const customerById = new Map(allCustomers.map((c) => [c.id, c]));
    const propertyById = new Map(allProperties.map((p) => [p.id, p]));

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

    // "Heute" — Tagesübersicht, rein lesend, kein automatischer Mailversand.
    const heuteDatum = zurichNow().datum;
    const in3Tagen = new Date(`${heuteDatum}T00:00:00Z`);
    in3Tagen.setUTCDate(in3Tagen.getUTCDate() + 3);
    const in3TagenDatum = in3Tagen.toISOString().slice(0, 10);
    const vor48h = new Date(Date.now() - 48 * 60 * 60 * 1000);

    function kundenName(customerId: number): string {
      const c = customerById.get(customerId);
      if (!c) return "";
      return [c.firma, [c.vorname, c.nachname].filter(Boolean).join(" ")].filter(Boolean).join(" — ");
    }

    const installationenHeute = allOrders
      .filter((o) => zurichDateKey(o.installationTermin) === heuteDatum)
      .map((o) => ({
        orderId: o.id,
        auftragsnummer: o.auftragsnummer,
        art: "installation" as const,
        uhrzeit: o.installationTermin,
        kunde: kundenName(o.customerId),
        ort: propertyById.get(o.propertyId)?.ort ?? "",
      }));
    const bohrterminHeute = allOrders
      .filter((o) => zurichDateKey(o.bohrTermin) === heuteDatum && zurichDateKey(o.bohrTermin) !== zurichDateKey(o.installationTermin))
      .map((o) => ({
        orderId: o.id,
        auftragsnummer: o.auftragsnummer,
        art: "kernbohrung" as const,
        uhrzeit: o.bohrTermin,
        kunde: kundenName(o.customerId),
        ort: propertyById.get(o.propertyId)?.ort ?? "",
      }));

    const beratungsTermineHeute = allBookings
      .filter((b) => b.datum === heuteDatum && b.status === "bestaetigt")
      .map((b) => ({ bookingId: b.id, startzeit: b.startzeit, endzeit: b.endzeit, name: b.name, ort: b.ort }))
      .sort((a, b) => a.startzeit.localeCompare(b.startzeit));

    const angeboteBaldAblaufend = allQuotes
      .filter((q) => (q.status === "entwurf" || q.status === "versendet") && q.gueltigBis && q.gueltigBis <= in3TagenDatum)
      .map((q) => ({
        quoteId: q.id,
        angebotsnummer: q.angebotsnummer,
        gueltigBis: q.gueltigBis,
        abgelaufen: q.gueltigBis! < heuteDatum,
        kunde: kundenName(q.customerId),
      }));

    const leadsOhneKontakt = allLeads
      .filter((l) => l.status === "neu" && new Date(l.createdAt) < vor48h)
      .map((l) => ({ leadId: l.id, name: l.name, ort: l.ort, telefon: l.telefon, email: l.email, seit: l.createdAt }));

    const ueberfaelligeRechnungen = allInvoices
      .filter((inv) => inv.status !== "storniert" && inv.status !== "bezahlt" && inv.faelligkeitsdatum < heuteDatum)
      .map((inv) => {
        const total = invoiceTotal(inv);
        const bezahlt = paymentsByInvoice.get(inv.id) ?? 0;
        const order = orderById.get(inv.orderId);
        return {
          invoiceId: inv.id,
          rechnungsnummer: inv.rechnungsnummer,
          faelligkeitsdatum: inv.faelligkeitsdatum,
          offenerBetrag: total - bezahlt,
          kunde: order ? kundenName(order.customerId) : "",
        };
      })
      .filter((r) => r.offenerBetrag > 0.01)
      .sort((a, b) => a.faelligkeitsdatum.localeCompare(b.faelligkeitsdatum));

    res.json({
      offeneAngebote: { anzahl: offeneAngebote.length, volumen: offeneAngeboteVolumen },
      laufendeAuftraege,
      offeneRechnungen: { anzahl: offeneRechnungenAnzahl, volumen: offeneRechnungenVolumen },
      durchschnittlicheMargeProAuftrag: margeCount > 0 ? margeSumme / margeCount : 0,
      umsatzProMonat: months,
      heute: {
        termine: [...installationenHeute, ...bohrterminHeute].sort((a, b) => (a.uhrzeit && b.uhrzeit ? +new Date(a.uhrzeit) - +new Date(b.uhrzeit) : 0)),
        beratungstermine: beratungsTermineHeute,
        angeboteBaldAblaufend,
        leadsOhneKontakt,
        ueberfaelligeRechnungen,
      },
    });
  })
);
