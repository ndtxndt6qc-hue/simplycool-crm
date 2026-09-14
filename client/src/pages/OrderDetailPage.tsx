import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CHECKLIST_PUNKT_LABELS, ORDER_DOCUMENT_TYP_LABELS, ORDER_STATUS_LABELS } from "../lib/labels";
import { formatChf } from "../lib/format";
import { useDeleteOrderDocument, useOrder, useToggleChecklistItem, useUpdateOrder, useUploadOrderDocument } from "../lib/orders";
import { usePartners } from "../lib/partners";
import { useSettings } from "../lib/settings";
import { useCreateInvoiceFromOrder, useInvoiceByOrder } from "../lib/invoices";
import { ApiError } from "../lib/api";

function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function OrderDetailPage() {
  const { id } = useParams();
  const orderId = Number(id);
  const navigate = useNavigate();
  const { data: order, isLoading } = useOrder(orderId);
  const toggleChecklist = useToggleChecklistItem(orderId);
  const updateOrder = useUpdateOrder(orderId);
  const { data: bohrpartner } = usePartners("bohrpartner");
  const { data: settings } = useSettings();
  const { data: existingInvoice } = useInvoiceByOrder(orderId);
  const createInvoice = useCreateInvoiceFromOrder();
  const uploadDocument = useUploadOrderDocument(orderId);
  const deleteDocument = useDeleteOrderDocument(orderId);

  const [installationTermin, setInstallationTermin] = useState("");
  const [bohrTermin, setBohrTermin] = useState("");
  const [bohrGleichInstallation, setBohrGleichInstallation] = useState(false);
  const [bohrpartnerId, setBohrpartnerId] = useState("");
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  async function handleCreateInvoice() {
    setInvoiceError(null);
    try {
      const invoice = await createInvoice.mutateAsync(orderId);
      navigate(`/app/rechnungen/${invoice.id}`);
    } catch (err) {
      setInvoiceError(err instanceof ApiError ? err.message : "Rechnung konnte nicht erstellt werden.");
    }
  }

  useEffect(() => {
    if (!order) return;
    setInstallationTermin(toLocalInputValue(order.installationTermin));
    setBohrTermin(toLocalInputValue(order.bohrTermin));
    setBohrGleichInstallation(
      !!order.installationTermin && !!order.bohrTermin && order.installationTermin === order.bohrTermin
    );
    setBohrpartnerId(order.bohrpartnerId ? String(order.bohrpartnerId) : "");
  }, [order]);

  if (isLoading || !order) {
    return <p style={{ color: "var(--color-text-muted)" }}>Lädt…</p>;
  }

  return (
    <div>
      <Link to="/app/auftraege" className="back-link">
        ← Zurück zu Aufträgen
      </Link>

      {order.status === "abgeschlossen" && (
        <div className="card" style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {existingInvoice ? (
            <>
              <span>
                Rechnung <strong>{existingInvoice.rechnungsnummer}</strong> wurde bereits erstellt.
              </span>
              <Link className="btn btn-secondary" to={`/app/rechnungen/${existingInvoice.id}`}>
                Zur Rechnung
              </Link>
            </>
          ) : (
            <>
              <span>Auftrag abgeschlossen — jetzt Rechnung erstellen?</span>
              <div>
                {invoiceError && <span className="error-text" style={{ marginRight: 12 }}>{invoiceError}</span>}
                <button className="btn btn-primary" onClick={handleCreateInvoice} disabled={createInvoice.isPending}>
                  {createInvoice.isPending ? "Erstellen…" : "Rechnung erstellen"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1>{order.auftragsnummer}</h1>
          <p style={{ color: "var(--color-text-muted)", margin: "4px 0 0" }}>
            {order.customer.firma ? `${order.customer.firma} — ` : ""}
            {order.customer.vorname ? `${order.customer.vorname} ` : ""}
            {order.customer.nachname} · {order.property.strasse}, {order.property.plz} {order.property.ort}
          </p>
        </div>
        <span className="badge badge-neutral">{ORDER_STATUS_LABELS[order.status]}</span>
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div className="card" style={{ flex: 1, minWidth: 280 }}>
          <h3 style={{ marginBottom: 16 }}>Terminplanung</h3>
          <div className="field">
            <label htmlFor="order-install-termin">Installationstermin</label>
            <input
              id="order-install-termin"
              type="datetime-local"
              value={installationTermin}
              onChange={(e) => {
                setInstallationTermin(e.target.value);
                const iso = e.target.value ? new Date(e.target.value).toISOString() : null;
                if (bohrGleichInstallation) {
                  setBohrTermin(e.target.value);
                  updateOrder.mutate({ installationTermin: iso, bohrTermin: iso });
                } else {
                  updateOrder.mutate({ installationTermin: iso });
                }
              }}
            />
          </div>
          <div className="field" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              id="order-bohr-gleich"
              type="checkbox"
              checked={bohrGleichInstallation}
              onChange={(e) => {
                const checked = e.target.checked;
                setBohrGleichInstallation(checked);
                if (checked) {
                  setBohrTermin(installationTermin);
                  const iso = installationTermin ? new Date(installationTermin).toISOString() : null;
                  updateOrder.mutate({ bohrTermin: iso });
                }
              }}
            />
            <label htmlFor="order-bohr-gleich" style={{ margin: 0 }}>
              Bohrtermin = Installationstermin
            </label>
          </div>
          <div className="field">
            <label htmlFor="order-bohr-termin">Bohrtermin {bohrGleichInstallation ? "" : "(separat, optional)"}</label>
            <input
              id="order-bohr-termin"
              type="datetime-local"
              value={bohrTermin}
              disabled={bohrGleichInstallation}
              onChange={(e) => {
                setBohrTermin(e.target.value);
                updateOrder.mutate({ bohrTermin: e.target.value ? new Date(e.target.value).toISOString() : null });
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="order-bohrpartner">Bohrpartner</label>
            <select
              id="order-bohrpartner"
              value={bohrpartnerId}
              onChange={(e) => {
                setBohrpartnerId(e.target.value);
                updateOrder.mutate({ bohrpartnerId: e.target.value ? Number(e.target.value) : null });
              }}
            >
              <option value="">— keiner —</option>
              {bohrpartner?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="card" style={{ flex: 1, minWidth: 280 }}>
          <h3 style={{ marginBottom: 16 }}>Checkliste</h3>
          {order.checklist.map((item) => (
            <label
              key={item.id}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--color-border)", cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={item.erledigt}
                onChange={(e) => toggleChecklist.mutate({ itemId: item.id, erledigt: e.target.checked })}
              />
              <span style={{ textDecoration: item.erledigt ? "line-through" : "none", color: item.erledigt ? "var(--color-text-muted)" : "inherit" }}>
                {CHECKLIST_PUNKT_LABELS[item.bezeichnung]}
              </span>
            </label>
          ))}
        </div>

        <div className="card" style={{ flex: 1, minWidth: 280 }}>
          <h3 style={{ marginBottom: 16 }}>Vorlagen & Protokolle</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            {settings?.abnahmeprotokollVorlagePfad ? (
              <a href={settings.abnahmeprotokollVorlagePfad} target="_blank" rel="noreferrer">
                Vorlage Abnahmeprotokoll öffnen
              </a>
            ) : (
              <span style={{ color: "var(--color-text-muted)" }}>Keine Vorlage Abnahmeprotokoll hinterlegt.</span>
            )}
            {settings?.installationsanweisungVorlagePfad ? (
              <a href={settings.installationsanweisungVorlagePfad} target="_blank" rel="noreferrer">
                Vorlage Installationsanweisung öffnen
              </a>
            ) : (
              <span style={{ color: "var(--color-text-muted)" }}>Keine Vorlage Installationsanweisung hinterlegt.</span>
            )}
          </div>

          {order.documents.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              {order.documents.map((doc) => (
                <div key={doc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <a href={doc.dateipfad} target="_blank" rel="noreferrer">
                    {ORDER_DOCUMENT_TYP_LABELS[doc.typ]}
                  </a>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: "2px 8px" }}
                    onClick={() => deleteDocument.mutate(doc.id)}
                  >
                    Löschen
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="field">
            <label htmlFor="order-abnahme-upload">Unterschriebenes Abnahmeprotokoll hochladen</label>
            <input
              id="order-abnahme-upload"
              type="file"
              accept=".pdf,image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) await uploadDocument.mutateAsync({ file, typ: "abnahmeprotokoll_signiert" });
                e.target.value = "";
              }}
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20, padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Beschreibung</th>
              <th>Menge</th>
              <th>Preis</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>{item.beschreibung}</td>
                <td>{item.menge}</td>
                <td>{formatChf(item.einzelpreis)}</td>
                <td>
                  <span className="badge badge-neutral">{item.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
