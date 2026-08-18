import { Link } from "react-router-dom";
import { INVOICE_STATUS_LABELS } from "../lib/labels";
import { formatChf } from "../lib/format";
import { useInvoices } from "../lib/invoices";

const STATUS_BADGE: Record<string, string> = {
  offen: "badge-neutral",
  teilzahlung: "badge-warning",
  bezahlt: "badge-success",
  ueberfaellig: "badge-danger",
  storniert: "badge-neutral",
};

export function InvoicesPage() {
  const { data: invoices, isLoading } = useInvoices();

  return (
    <div>
      <div className="page-header">
        <h1>Rechnungen</h1>
      </div>

      {isLoading ? (
        <p style={{ color: "var(--color-text-muted)" }}>Lädt…</p>
      ) : !invoices?.length ? (
        <div className="card">
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
            Noch keine Rechnungen. Rechnungen entstehen aus abgeschlossenen Aufträgen.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nr.</th>
                <th>Kunde</th>
                <th>Status</th>
                <th>Fällig bis</th>
                <th>Total</th>
                <th>Bezahlt</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <Link to={`/rechnungen/${inv.id}`} className="table-link">
                      {inv.rechnungsnummer}
                    </Link>
                  </td>
                  <td>
                    {inv.customer.firma ? `${inv.customer.firma} — ` : ""}
                    {inv.customer.vorname ? `${inv.customer.vorname} ` : ""}
                    {inv.customer.nachname}
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[inv.displayStatus]}`}>
                      {INVOICE_STATUS_LABELS[inv.displayStatus]}
                    </span>
                  </td>
                  <td>{new Date(inv.faelligkeitsdatum).toLocaleDateString("de-CH")}</td>
                  <td>{formatChf(inv.total)}</td>
                  <td>{formatChf(inv.bezahlt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
