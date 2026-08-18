import { useState, type FormEvent } from "react";
import { Modal } from "./Modal";
import { PARTNER_TYP_LABELS } from "../lib/labels";
import { PARTNER_TYPEN, type PartnerTyp } from "@klimainstall/shared";
import { useCreatePartner, useDeletePartner, useUpdatePartner, type Partner } from "../lib/partners";

export function PartnerFormModal({ partner, onClose }: { partner: Partner | null; onClose: () => void }) {
  const [typ, setTyp] = useState<PartnerTyp>(partner?.typ ?? "bohrpartner");
  const [name, setName] = useState(partner?.name ?? "");
  const [kontaktName, setKontaktName] = useState(partner?.kontaktName ?? "");
  const [telefon, setTelefon] = useState(partner?.telefon ?? "");
  const [email, setEmail] = useState(partner?.email ?? "");
  const [preisProBohrung, setPreisProBohrung] = useState(partner?.preisProBohrung ?? "");
  const [lieferzeitTage, setLieferzeitTage] = useState(
    partner?.lieferzeitTage !== null && partner?.lieferzeitTage !== undefined ? String(partner.lieferzeitTage) : ""
  );
  const [notiz, setNotiz] = useState(partner?.notiz ?? "");
  const [error, setError] = useState<string | null>(null);

  const createPartner = useCreatePartner();
  const updatePartner = useUpdatePartner();
  const deletePartner = useDeletePartner();
  const saving = createPartner.isPending || updatePartner.isPending;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const input = {
      typ,
      name,
      kontaktName,
      telefon,
      email,
      preisProBohrung: preisProBohrung ? Number(preisProBohrung) : undefined,
      lieferzeitTage: lieferzeitTage ? Number(lieferzeitTage) : undefined,
      notiz,
    };
    try {
      if (partner) {
        await updatePartner.mutateAsync({ id: partner.id, ...input });
      } else {
        await createPartner.mutateAsync(input);
      }
      onClose();
    } catch {
      setError("Speichern fehlgeschlagen.");
    }
  }

  async function handleDelete() {
    if (!partner) return;
    if (!confirm(`Partner "${partner.name}" wirklich löschen?`)) return;
    await deletePartner.mutateAsync(partner.id);
    onClose();
  }

  return (
    <Modal title={partner ? "Partner bearbeiten" : "Neuer Partner"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="partner-typ">Typ</label>
          <select id="partner-typ" value={typ} onChange={(e) => setTyp(e.target.value as PartnerTyp)}>
            {PARTNER_TYPEN.map((t) => (
              <option key={t} value={t}>
                {PARTNER_TYP_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="partner-name">Name</label>
          <input id="partner-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="partner-kontakt">Kontaktperson</label>
          <input id="partner-kontakt" value={kontaktName} onChange={(e) => setKontaktName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="partner-telefon">Telefon</label>
          <input id="partner-telefon" value={telefon} onChange={(e) => setTelefon(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="partner-email">E-Mail</label>
          <input id="partner-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {typ === "bohrpartner" ? (
          <div className="field">
            <label htmlFor="partner-preis">Preis pro Bohrung (CHF)</label>
            <input
              id="partner-preis"
              type="number"
              step="0.01"
              value={preisProBohrung}
              onChange={(e) => setPreisProBohrung(e.target.value)}
            />
          </div>
        ) : (
          <div className="field">
            <label htmlFor="partner-lieferzeit">Lieferzeit (Tage)</label>
            <input
              id="partner-lieferzeit"
              type="number"
              value={lieferzeitTage}
              onChange={(e) => setLieferzeitTage(e.target.value)}
            />
          </div>
        )}
        <div className="field">
          <label htmlFor="partner-notiz">Notiz</label>
          <textarea id="partner-notiz" rows={2} value={notiz} onChange={(e) => setNotiz(e.target.value)} />
        </div>

        {error && <p className="error-text">{error}</p>}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 8 }}>
          <div>
            {partner && (
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
