import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "./Modal";
import { useCustomers } from "../lib/customers";
import { useProperties } from "../lib/properties";
import { useCreateQuote } from "../lib/quotes";

export function QuoteCreateModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { data: customers } = useCustomers();
  const [customerId, setCustomerId] = useState("");
  const { data: properties } = useProperties(customerId ? Number(customerId) : undefined);
  const [propertyId, setPropertyId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createQuote = useCreateQuote();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!customerId || !propertyId) return;
    try {
      const quote = await createQuote.mutateAsync({ customerId: Number(customerId), propertyId: Number(propertyId) });
      onClose();
      navigate(`/app/angebote/${quote.id}`);
    } catch {
      setError("Erstellen fehlgeschlagen.");
    }
  }

  return (
    <Modal title="Neues Angebot" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="quote-customer">Kunde</label>
          <select
            id="quote-customer"
            value={customerId}
            onChange={(e) => {
              setCustomerId(e.target.value);
              setPropertyId("");
            }}
            required
          >
            <option value="">— auswählen —</option>
            {customers?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firma ? `${c.firma} — ` : ""}
                {c.vorname ? `${c.vorname} ` : ""}
                {c.nachname}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="quote-property">Liegenschaft</label>
          <select id="quote-property" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} required disabled={!customerId}>
            <option value="">— auswählen —</option>
            {properties?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.strasse}, {p.plz} {p.ort}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Abbrechen
          </button>
          <button type="submit" className="btn btn-primary" disabled={createQuote.isPending}>
            {createQuote.isPending ? "Erstellen…" : "Erstellen"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
