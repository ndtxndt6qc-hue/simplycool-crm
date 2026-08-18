import { useState, type FormEvent } from "react";
import { Modal } from "./Modal";
import { LEAD_QUELLE_LABELS, LEAD_STATUS_LABELS, LEAD_STATUS_ORDER } from "../lib/labels";
import { LEAD_QUELLEN, type LeadQuelle, type LeadStatus } from "@klimainstall/shared";
import { useCreateLead, useDeleteLead, useUpdateLead, type Lead } from "../lib/leads";

export function LeadFormModal({
  lead,
  onClose,
  onCreateQuote,
}: {
  lead: Lead | null;
  onClose: () => void;
  onCreateQuote?: (lead: Lead) => void;
}) {
  const [name, setName] = useState(lead?.name ?? "");
  const [adresse, setAdresse] = useState(lead?.adresse ?? "");
  const [plz, setPlz] = useState(lead?.plz ?? "");
  const [ort, setOrt] = useState(lead?.ort ?? "");
  const [telefon, setTelefon] = useState(lead?.telefon ?? "");
  const [email, setEmail] = useState(lead?.email ?? "");
  const [notiz, setNotiz] = useState(lead?.notiz ?? "");
  const [quelle, setQuelle] = useState<LeadQuelle>(lead?.quelle ?? "sonstige");
  const [status, setStatus] = useState<LeadStatus>(lead?.status ?? "neu");
  const [error, setError] = useState<string | null>(null);

  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const saving = createLead.isPending || updateLead.isPending;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const input = { name, adresse, plz, ort, telefon, email, notiz, quelle };
    try {
      if (lead) {
        await updateLead.mutateAsync({ id: lead.id, ...input, status });
      } else {
        await createLead.mutateAsync(input);
      }
      onClose();
    } catch {
      setError("Speichern fehlgeschlagen.");
    }
  }

  async function handleDelete() {
    if (!lead) return;
    if (!confirm(`Lead "${lead.name}" wirklich löschen?`)) return;
    await deleteLead.mutateAsync(lead.id);
    onClose();
  }

  return (
    <Modal title={lead ? "Lead bearbeiten" : "Neuer Lead"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="lead-name">Name</label>
          <input id="lead-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="lead-adresse">Strasse</label>
          <input id="lead-adresse" value={adresse} onChange={(e) => setAdresse(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="lead-plz">PLZ</label>
            <input id="lead-plz" value={plz} onChange={(e) => setPlz(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 2 }}>
            <label htmlFor="lead-ort">Ort</label>
            <input id="lead-ort" value={ort} onChange={(e) => setOrt(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="lead-telefon">Telefon</label>
          <input id="lead-telefon" value={telefon} onChange={(e) => setTelefon(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="lead-email">E-Mail</label>
          <input id="lead-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="lead-quelle">Quelle</label>
          <select id="lead-quelle" value={quelle} onChange={(e) => setQuelle(e.target.value as LeadQuelle)}>
            {LEAD_QUELLEN.map((q) => (
              <option key={q} value={q}>
                {LEAD_QUELLE_LABELS[q]}
              </option>
            ))}
          </select>
        </div>
        {lead && (
          <div className="field">
            <label htmlFor="lead-status">Status</label>
            <select id="lead-status" value={status} onChange={(e) => setStatus(e.target.value as LeadStatus)}>
              {LEAD_STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {LEAD_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="field">
          <label htmlFor="lead-notiz">Notiz</label>
          <textarea id="lead-notiz" rows={3} value={notiz} onChange={(e) => setNotiz(e.target.value)} />
        </div>

        {error && <p className="error-text">{error}</p>}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {lead && (
              <button type="button" className="btn btn-secondary" onClick={handleDelete}>
                Löschen
              </button>
            )}
            {lead && onCreateQuote && (
              <button type="button" className="btn btn-secondary" onClick={() => onCreateQuote(lead)}>
                Angebot erstellen
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
