import { useState } from "react";
import { Link } from "react-router-dom";
import { KUNDEN_TYP_LABELS } from "../lib/labels";
import { useCustomers, type Customer } from "../lib/customers";
import { CustomerFormModal } from "../components/CustomerFormModal";

export function CustomersPage() {
  const { data: customers, isLoading } = useCustomers();
  const [editingCustomer, setEditingCustomer] = useState<Customer | null | undefined>(undefined);

  return (
    <div>
      <div className="page-header">
        <h1>Kunden</h1>
        <button className="btn btn-primary" onClick={() => setEditingCustomer(null)}>
          + Neuer Kunde
        </button>
      </div>

      {isLoading ? (
        <p style={{ color: "var(--color-text-muted)" }}>Lädt…</p>
      ) : !customers?.length ? (
        <div className="card">
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Noch keine Kunden erfasst.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Typ</th>
                <th>Adresse</th>
                <th>Kontakt</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/app/kunden/${c.id}`} className="table-link">
                      {c.firma ? `${c.firma} — ` : ""}
                      {c.vorname ? `${c.vorname} ` : ""}
                      {c.nachname}
                    </Link>
                  </td>
                  <td>
                    <span className="badge badge-neutral">{KUNDEN_TYP_LABELS[c.typ]}</span>
                  </td>
                  <td>
                    {c.strasse}, {c.plz} {c.ort}
                  </td>
                  <td>
                    {c.telefon && <div>{c.telefon}</div>}
                    {c.email && <div>{c.email}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingCustomer !== undefined && (
        <CustomerFormModal customer={editingCustomer} onClose={() => setEditingCustomer(undefined)} />
      )}
    </div>
  );
}
