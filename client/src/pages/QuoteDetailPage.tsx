import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { QUOTE_ITEM_TYP_LABELS, QUOTE_STATUS_LABELS } from "../lib/labels";
import { formatChf } from "../lib/format";
import { QUOTE_STATUS, type QuoteStatus } from "@klimainstall/shared";
import { useDeleteQuote, useDeleteQuoteItem, useQuote, useUpdateQuote } from "../lib/quotes";
import { useCreateOrderFromQuote, useOrderByQuote } from "../lib/orders";
import { QuoteItemForm } from "../components/QuoteItemForm";
import { SendQuoteModal } from "../components/SendQuoteModal";
import { ApiError } from "../lib/api";

export function QuoteDetailPage() {
  const { id } = useParams();
  const quoteId = Number(id);
  const navigate = useNavigate();
  const { data: quote, isLoading } = useQuote(quoteId);
  const updateQuote = useUpdateQuote(quoteId);
  const deleteQuoteItem = useDeleteQuoteItem(quoteId);
  const deleteQuote = useDeleteQuote();
  const { data: existingOrder } = useOrderByQuote(quoteId);
  const createOrder = useCreateOrderFromQuote();
  const [sending, setSending] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  async function handleCreateOrder() {
    setOrderError(null);
    try {
      const order = await createOrder.mutateAsync(quoteId);
      navigate(`/auftraege/${order.id}`);
    } catch (err) {
      setOrderError(err instanceof ApiError ? err.message : "Auftrag konnte nicht erstellt werden.");
    }
  }

  if (isLoading || !quote) {
    return <p style={{ color: "var(--color-text-muted)" }}>Lädt…</p>;
  }

  const mwstBetrag = quote.summe * (Number(quote.mwstSatz) / 100);
  const total = quote.summe + mwstBetrag;

  async function handleDeleteQuote() {
    if (!confirm(`Angebot ${quote!.angebotsnummer} wirklich löschen?`)) return;
    await deleteQuote.mutateAsync(quote!.id);
    navigate("/angebote");
  }

  return (
    <div>
      <Link to="/angebote" className="back-link">
        ← Zurück zu Angeboten
      </Link>

      {quote.status === "angenommen" && (
        <div className="card" style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {existingOrder ? (
            <>
              <span>
                Auftrag <strong>{existingOrder.auftragsnummer}</strong> wurde bereits erstellt.
              </span>
              <Link className="btn btn-secondary" to={`/auftraege/${existingOrder.id}`}>
                Zum Auftrag
              </Link>
            </>
          ) : (
            <>
              <span>Angebot wurde angenommen — jetzt Auftrag erstellen?</span>
              <div>
                {orderError && <span className="error-text" style={{ marginRight: 12 }}>{orderError}</span>}
                <button className="btn btn-primary" onClick={handleCreateOrder} disabled={createOrder.isPending}>
                  {createOrder.isPending ? "Erstellen…" : "Auftrag erstellen"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1>{quote.angebotsnummer}</h1>
          <p style={{ color: "var(--color-text-muted)", margin: "4px 0 0" }}>
            {quote.customer.firma ? `${quote.customer.firma} — ` : ""}
            {quote.customer.vorname ? `${quote.customer.vorname} ` : ""}
            {quote.customer.nachname} · {quote.property.strasse}, {quote.property.plz} {quote.property.ort}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={quote.status}
            onChange={(e) => updateQuote.mutate({ status: e.target.value as QuoteStatus })}
          >
            {QUOTE_STATUS.map((s) => (
              <option key={s} value={s}>
                {QUOTE_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <a className="btn btn-secondary" href={`/api/quotes/${quote.id}/pdf`} target="_blank" rel="noreferrer">
            PDF ansehen
          </a>
          <button className="btn btn-primary" onClick={() => setSending(true)}>
            Per E-Mail senden
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Art</th>
              <th>Beschreibung</th>
              <th>Menge</th>
              <th>Verkaufspreis</th>
              <th>Total</th>
              <th>DB (intern)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item) => {
              const total = Number(item.einzelpreis) * item.menge;
              const db = (Number(item.einzelpreis) - Number(item.einkaufspreisIntern)) * item.menge;
              return (
                <tr key={item.id}>
                  <td>{QUOTE_ITEM_TYP_LABELS[item.typ]}</td>
                  <td>{item.beschreibung}</td>
                  <td>{item.menge}</td>
                  <td>{formatChf(item.einzelpreis)}</td>
                  <td>{formatChf(total)}</td>
                  <td style={{ color: db >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>{formatChf(db)}</td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      onClick={() => deleteQuoteItem.mutate(item.id)}
                      aria-label="Position löschen"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
            {!quote.items.length && (
              <tr>
                <td colSpan={7} style={{ color: "var(--color-text-muted)" }}>
                  Noch keine Positionen.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <QuoteItemForm quoteId={quote.id} />

      <div style={{ display: "flex", gap: 24, marginTop: 24 }}>
        <div className="card" style={{ width: 280 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span>Netto</span>
            <span>{formatChf(quote.summe)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span>MWST {Number(quote.mwstSatz).toFixed(2)}%</span>
            <span>{formatChf(mwstBetrag)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, borderTop: "1px solid var(--color-border)", paddingTop: 8 }}>
            <span>Total</span>
            <span>{formatChf(total)}</span>
          </div>
        </div>
        <div className="card" style={{ width: 280, background: "#f8fafc" }}>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 8 }}>
            Intern — nicht auf PDF
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
            <span>Deckungsbeitrag</span>
            <span style={{ color: quote.deckungsbeitrag >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
              {formatChf(quote.deckungsbeitrag)}
            </span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <button className="btn btn-secondary" onClick={handleDeleteQuote}>
          Angebot löschen
        </button>
      </div>

      {sending && (
        <SendQuoteModal quoteId={quote.id} defaultEmail={quote.customer.email ?? ""} onClose={() => setSending(false)} />
      )}
    </div>
  );
}
