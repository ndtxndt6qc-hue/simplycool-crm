import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { INVOICE_STATUS_LABELS } from "../lib/labels";
import { formatChf } from "../lib/format";
import {
  useAddInvoiceItem,
  useCreateReminder,
  useDeleteInvoiceItem,
  useInvoice,
} from "../lib/invoices";
import { AddPaymentModal } from "../components/AddPaymentModal";

const STATUS_BADGE: Record<string, string> = {
  offen: "badge-neutral",
  teilzahlung: "badge-warning",
  bezahlt: "badge-success",
  ueberfaellig: "badge-danger",
};

export function InvoiceDetailPage() {
  const { id } = useParams();
  const invoiceId = Number(id);
  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const addItem = useAddInvoiceItem(invoiceId);
  const deleteItem = useDeleteInvoiceItem(invoiceId);
  const createReminder = useCreateReminder(invoiceId);
  const [payingOpen, setPayingOpen] = useState(false);

  const [beschreibung, setBeschreibung] = useState("");
  const [menge, setMenge] = useState("1");
  const [einzelpreis, setEinzelpreis] = useState("");

  if (isLoading || !invoice) {
    return <p style={{ color: "var(--color-text-muted)" }}>Lädt…</p>;
  }

  const offenerBetrag = invoice.total - invoice.bezahlt;

  async function handleAddItem(e: FormEvent) {
    e.preventDefault();
    await addItem.mutateAsync({ beschreibung, menge: Number(menge), einzelpreis: Number(einzelpreis || 0) });
    setBeschreibung("");
    setMenge("1");
    setEinzelpreis("");
  }

  return (
    <div>
      <Link to="/rechnungen" className="back-link">
        ← Zurück zu Rechnungen
      </Link>

      <div className="page-header">
        <div>
          <h1>{invoice.rechnungsnummer}</h1>
          <p style={{ color: "var(--color-text-muted)", margin: "4px 0 0" }}>
            {invoice.customer.firma ? `${invoice.customer.firma} — ` : ""}
            {invoice.customer.vorname ? `${invoice.customer.vorname} ` : ""}
            {invoice.customer.nachname} · {invoice.property.strasse}, {invoice.property.plz} {invoice.property.ort}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className={`badge ${STATUS_BADGE[invoice.displayStatus]}`}>
            {INVOICE_STATUS_LABELS[invoice.displayStatus]}
          </span>
          <a className="btn btn-secondary" href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noreferrer">
            PDF ansehen
          </a>
          {offenerBetrag > 0 && (
            <button className="btn btn-primary" onClick={() => setPayingOpen(true)}>
              Zahlung erfassen
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Beschreibung</th>
              <th>Menge</th>
              <th>Preis</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id}>
                <td>{item.beschreibung}</td>
                <td>{item.menge}</td>
                <td>{formatChf(item.einzelpreis)}</td>
                <td>{formatChf(Number(item.einzelpreis) * item.menge)}</td>
                <td>
                  <button className="btn btn-secondary" onClick={() => deleteItem.mutate(item.id)} aria-label="Position löschen">
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleAddItem} className="card" style={{ marginTop: 12 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div className="field" style={{ flex: 1, minWidth: 200 }}>
            <label htmlFor="inv-item-beschreibung">Beschreibung</label>
            <input id="inv-item-beschreibung" value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} required />
          </div>
          <div className="field" style={{ width: 100 }}>
            <label htmlFor="inv-item-menge">Menge</label>
            <input id="inv-item-menge" type="number" value={menge} onChange={(e) => setMenge(e.target.value)} required />
          </div>
          <div className="field" style={{ width: 140 }}>
            <label htmlFor="inv-item-preis">Preis (CHF)</label>
            <input id="inv-item-preis" type="number" step="0.01" value={einzelpreis} onChange={(e) => setEinzelpreis(e.target.value)} required />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button type="submit" className="btn btn-primary" disabled={addItem.isPending}>
              + Position
            </button>
          </div>
        </div>
      </form>

      <div style={{ display: "flex", gap: 24, marginTop: 24, flexWrap: "wrap" }}>
        <div className="card" style={{ width: 280 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span>Netto</span>
            <span>{formatChf(invoice.netto)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span>MWST {Number(invoice.mwstSatz).toFixed(2)}%</span>
            <span>{formatChf(invoice.mwstBetrag)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, borderTop: "1px solid var(--color-border)", paddingTop: 8 }}>
            <span>Total</span>
            <span>{formatChf(invoice.total)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, color: "var(--color-text-muted)" }}>
            <span>Bezahlt</span>
            <span>{formatChf(invoice.bezahlt)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
            <span>Offen</span>
            <span style={{ color: offenerBetrag > 0 ? "var(--color-danger)" : "var(--color-success)" }}>
              {formatChf(offenerBetrag)}
            </span>
          </div>
          {invoice.qrReferenznummer && (
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 12, wordBreak: "break-all" }}>
              Referenz: {invoice.qrReferenznummer}
            </p>
          )}
        </div>

        <div className="card" style={{ width: 280 }}>
          <h3 style={{ marginBottom: 12 }}>Zahlungen</h3>
          {!invoice.payments.length ? (
            <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Noch keine Zahlungen erfasst.</p>
          ) : (
            invoice.payments.map((p) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span>{new Date(p.datum).toLocaleDateString("de-CH")}</span>
                <span>{formatChf(p.betrag)}</span>
              </div>
            ))
          )}
        </div>

        <div className="card" style={{ width: 280 }}>
          <h3 style={{ marginBottom: 12 }}>Mahnwesen</h3>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button
              className="btn btn-secondary"
              disabled={createReminder.isPending || offenerBetrag <= 0}
              onClick={() => createReminder.mutate(1)}
            >
              1. Mahnung
            </button>
            <button
              className="btn btn-secondary"
              disabled={createReminder.isPending || offenerBetrag <= 0}
              onClick={() => createReminder.mutate(2)}
            >
              2. Mahnung
            </button>
          </div>
          {!invoice.reminders.length ? (
            <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Noch keine Mahnungen versendet.</p>
          ) : (
            invoice.reminders.map((r) => (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span>{r.stufe}. Mahnung — {new Date(r.datum).toLocaleDateString("de-CH")}</span>
                {r.pdfPfad && (
                  <a href={r.pdfPfad} target="_blank" rel="noreferrer" className="table-link">
                    PDF
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {payingOpen && <AddPaymentModal invoiceId={invoice.id} offen={offenerBetrag} onClose={() => setPayingOpen(false)} />}
    </div>
  );
}
