import { useState } from "react";
import { Link } from "react-router-dom";
import { QUOTE_STATUS_LABELS } from "../lib/labels";
import { formatChf } from "../lib/format";
import { useQuotes } from "../lib/quotes";
import { QuoteCreateModal } from "../components/QuoteCreateModal";

const STATUS_BADGE: Record<string, string> = {
  entwurf: "badge-neutral",
  versendet: "badge-warning",
  angenommen: "badge-success",
  abgelehnt: "badge-danger",
  abgelaufen: "badge-danger",
};

export function QuotesPage() {
  const { data: quotes, isLoading } = useQuotes();
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <div className="page-header">
        <h1>Angebote</h1>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          + Neues Angebot
        </button>
      </div>

      {isLoading ? (
        <p style={{ color: "var(--color-text-muted)" }}>Lädt…</p>
      ) : !quotes?.length ? (
        <div className="card">
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Noch keine Angebote erfasst.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nr.</th>
                <th>Kunde</th>
                <th>Status</th>
                <th>Datum</th>
                <th>Total</th>
                <th>Rechnungsnr.</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id}>
                  <td>
                    <Link to={`/angebote/${q.id}`} className="table-link">
                      {q.angebotsnummer}
                    </Link>
                  </td>
                  <td>
                    {q.customer.firma ? `${q.customer.firma} — ` : ""}
                    {q.customer.vorname ? `${q.customer.vorname} ` : ""}
                    {q.customer.nachname}
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[q.status]}`}>{QUOTE_STATUS_LABELS[q.status]}</span>
                  </td>
                  <td>{new Date(q.datum).toLocaleDateString("de-CH")}</td>
                  <td>{formatChf(q.summe)}</td>
                  <td>
                    {q.rechnungsnummer ? (
                      <span className="table-link">{q.rechnungsnummer}</span>
                    ) : (
                      <span style={{ color: "var(--color-text-muted)" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && <QuoteCreateModal onClose={() => setCreating(false)} />}
    </div>
  );
}
