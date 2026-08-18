import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { KUNDEN_TYP_LABELS } from "../lib/labels";
import { useCustomer } from "../lib/customers";
import { useProperties, type Property } from "../lib/properties";
import { CustomerFormModal } from "../components/CustomerFormModal";
import { PropertyFormModal } from "../components/PropertyFormModal";
import { PropertyPhotos } from "../components/PropertyPhotos";

export function CustomerDetailPage() {
  const { id } = useParams();
  const customerId = Number(id);
  const { data: customer, isLoading } = useCustomer(customerId);
  const { data: properties } = useProperties(customerId);
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null | undefined>(undefined);

  if (isLoading || !customer) {
    return <p style={{ color: "var(--color-text-muted)" }}>Lädt…</p>;
  }

  return (
    <div>
      <Link to="/kunden" className="back-link">
        ← Zurück zu Kunden
      </Link>

      <div className="page-header">
        <h1>
          {customer.firma ? `${customer.firma} — ` : ""}
          {customer.vorname ? `${customer.vorname} ` : ""}
          {customer.nachname}
        </h1>
        <button className="btn btn-secondary" onClick={() => setEditingCustomer(true)}>
          Bearbeiten
        </button>
      </div>

      <div className="card">
        <span className="badge badge-neutral" style={{ marginBottom: 12 }}>
          {KUNDEN_TYP_LABELS[customer.typ]}
        </span>
        <p style={{ margin: "8px 0 0" }}>
          {customer.strasse}
          <br />
          {customer.plz} {customer.ort}
        </p>
        {(customer.telefon || customer.email) && (
          <p style={{ margin: "8px 0 0", color: "var(--color-text-muted)" }}>
            {customer.telefon}
            {customer.telefon && customer.email ? " · " : ""}
            {customer.email}
          </p>
        )}
        {customer.notiz && <p style={{ margin: "8px 0 0", color: "var(--color-text-muted)" }}>{customer.notiz}</p>}
      </div>

      <div className="section-header">
        <h2>Liegenschaften</h2>
        <button className="btn btn-secondary" onClick={() => setEditingProperty(null)}>
          + Liegenschaft
        </button>
      </div>

      {!properties?.length ? (
        <div className="card">
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Noch keine Liegenschaft erfasst.</p>
        </div>
      ) : (
        properties.map((property) => (
          <div className="card property-card" key={property.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <strong>{property.strasse}</strong>
                <div style={{ color: "var(--color-text-muted)" }}>
                  {property.plz} {property.ort}
                </div>
                {property.notiz && (
                  <div style={{ color: "var(--color-text-muted)", marginTop: 4 }}>{property.notiz}</div>
                )}
              </div>
              <button className="btn btn-secondary" onClick={() => setEditingProperty(property)}>
                Bearbeiten
              </button>
            </div>
            <PropertyPhotos propertyId={property.id} />
          </div>
        ))
      )}

      {editingCustomer && <CustomerFormModal customer={customer} onClose={() => setEditingCustomer(false)} />}
      {editingProperty !== undefined && (
        <PropertyFormModal customerId={customerId} property={editingProperty} onClose={() => setEditingProperty(undefined)} />
      )}
    </div>
  );
}
