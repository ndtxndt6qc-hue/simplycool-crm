import { useState } from "react";
import { Link } from "react-router-dom";
import { ORDER_STATUS_LABELS } from "../lib/labels";
import { useOrders } from "../lib/orders";
import { OrderCalendar } from "../components/OrderCalendar";

const STATUS_BADGE: Record<string, string> = {
  offen: "badge-neutral",
  in_planung: "badge-warning",
  installation_durchgefuehrt: "badge-warning",
  abgeschlossen: "badge-success",
  storniert: "badge-danger",
};

export function OrdersPage() {
  const { data: orders, isLoading } = useOrders();
  const [view, setView] = useState<"liste" | "kalender">("liste");

  return (
    <div>
      <div className="page-header">
        <h1>Aufträge</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className={`btn ${view === "liste" ? "btn-primary" : "btn-secondary"}`} onClick={() => setView("liste")}>
            Liste
          </button>
          <button className={`btn ${view === "kalender" ? "btn-primary" : "btn-secondary"}`} onClick={() => setView("kalender")}>
            Kalender
          </button>
        </div>
      </div>

      {isLoading ? (
        <p style={{ color: "var(--color-text-muted)" }}>Lädt…</p>
      ) : !orders?.length ? (
        <div className="card">
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
            Noch keine Aufträge. Aufträge entstehen aus angenommenen Angeboten.
          </p>
        </div>
      ) : view === "kalender" ? (
        <OrderCalendar orders={orders} />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nr.</th>
                <th>Kunde</th>
                <th>Status</th>
                <th>Installationstermin</th>
                <th>Checkliste</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link to={`/auftraege/${o.id}`} className="table-link">
                      {o.auftragsnummer}
                    </Link>
                  </td>
                  <td>
                    {o.customer.firma ? `${o.customer.firma} — ` : ""}
                    {o.customer.vorname ? `${o.customer.vorname} ` : ""}
                    {o.customer.nachname}
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[o.status]}`}>{ORDER_STATUS_LABELS[o.status]}</span>
                  </td>
                  <td>
                    {o.installationTermin
                      ? new Date(o.installationTermin).toLocaleString("de-CH", { dateStyle: "medium", timeStyle: "short" })
                      : "—"}
                  </td>
                  <td>
                    {o.checklistErledigt}/{o.checklistTotal}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
