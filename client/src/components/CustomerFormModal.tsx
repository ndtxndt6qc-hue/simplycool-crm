import { useState, type FormEvent } from "react";
import { Modal } from "./Modal";
import { KUNDEN_TYP_LABELS } from "../lib/labels";
import { KUNDEN_TYPEN, type KundenTyp } from "@klimainstall/shared";
import { useCreateCustomer, useDeleteCustomer, useUpdateCustomer, type Customer } from "../lib/customers";

export function CustomerFormModal({
  customer,
  leadId,
  onClose,
  onSaved,
}: {
  customer: Customer | null;
  leadId?: number;
  onClose: () => void;
  onSaved?: (customer: Customer) => void;
}) {
  const [typ, setTyp] = useState<KundenTyp>(customer?.typ ?? "privat");
  const [firma, setFirma] = useState(customer?.firma ?? "");
  const [vorname, setVorname] = useState(customer?.vorname ?? "");
  const [nachname, setNachname] = useState(customer?.nachname ?? "");
  const [strasse, setStrasse] = useState(customer?.strasse ?? "");
  const [plz, setPlz] = useState(customer?.plz ?? "");
  const [ort, setOrt] = useState(customer?.ort ?? "");
  const [telefon, setTelefon] = useState(customer?.telefon ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [notiz, setNotiz] = useState(customer?.notiz ?? "");
  const [error, setError] = useState<string | null>(null);

  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const saving = createCustomer.isPending || updateCustomer.isPending;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const input = { typ, firma, vorname, nachname, strasse, plz, ort, telefon, email, notiz };
    try {
      if (customer) {
        const updated = await updateCustomer.mutateAsync({ id: customer.id, ...input });
        onSaved?.(updated);
      } else {
        const created = await createCustomer.mutateAsync({ ...input, leadId });
        onSaved?.(created);
      }
      onClose();
    } catch {
      setError("Speichern fehlgeschlagen.");
    }
  }

  async function handleDelete() {
    if (!customer) return;
    if (!confirm(`Kunde "${customer.nachname}" wirklich löschen?`)) return;
    await deleteCustomer.mutateAsync(customer.id);
    onClose();
  }

  return (
    <Modal title={customer ? "Kunde bearbeiten" : "Neuer Kunde"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="customer-typ">Typ</label>
          <select id="customer-typ" value={typ} onChange={(e) => setTyp(e.target.value as KundenTyp)}>
            {KUNDEN_TYPEN.map((t) => (
              <option key={t} value={t}>
                {KUNDEN_TYP_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        {typ === "gewerbe" && (
          <div className="field">
            <label htmlFor="customer-firma">Firma</label>
            <input id="customer-firma" value={firma} onChange={(e) => setFirma(e.target.value)} />
          </div>
        )}
        <div className="field">
          <label htmlFor="customer-vorname">Vorname</label>
          <input id="customer-vorname" value={vorname} onChange={(e) => setVorname(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="customer-nachname">Nachname</label>
          <input id="customer-nachname" value={nachname} onChange={(e) => setNachname(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="customer-strasse">Strasse</label>
          <input id="customer-strasse" value={strasse} onChange={(e) => setStrasse(e.target.value)} required />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="customer-plz">PLZ</label>
            <input id="customer-plz" value={plz} onChange={(e) => setPlz(e.target.value)} required />
          </div>
          <div className="field" style={{ flex: 2 }}>
            <label htmlFor="customer-ort">Ort</label>
            <input id="customer-ort" value={ort} onChange={(e) => setOrt(e.target.value)} required />
          </div>
        </div>
        <div className="field">
          <label htmlFor="customer-telefon">Telefon</label>
          <input id="customer-telefon" value={telefon} onChange={(e) => setTelefon(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="customer-email">E-Mail</label>
          <input id="customer-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="customer-notiz">Notiz</label>
          <textarea id="customer-notiz" rows={3} value={notiz} onChange={(e) => setNotiz(e.target.value)} />
        </div>

        {error && <p className="error-text">{error}</p>}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 8 }}>
          <div>
            {customer && (
              <button type="button" className="btn btn-secondary" onClick={handleDelete}>
                Löschen
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Speichern…" : "Speichern"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
