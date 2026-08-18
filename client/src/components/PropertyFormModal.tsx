import { useState, type FormEvent } from "react";
import { Modal } from "./Modal";
import { useCreateProperty, useDeleteProperty, useUpdateProperty, type Property } from "../lib/properties";

export function PropertyFormModal({
  customerId,
  property,
  onClose,
}: {
  customerId: number;
  property: Property | null;
  onClose: () => void;
}) {
  const [strasse, setStrasse] = useState(property?.strasse ?? "");
  const [plz, setPlz] = useState(property?.plz ?? "");
  const [ort, setOrt] = useState(property?.ort ?? "");
  const [notiz, setNotiz] = useState(property?.notiz ?? "");
  const [error, setError] = useState<string | null>(null);

  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty();
  const deleteProperty = useDeleteProperty(customerId);
  const saving = createProperty.isPending || updateProperty.isPending;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (property) {
        await updateProperty.mutateAsync({ id: property.id, strasse, plz, ort, notiz });
      } else {
        await createProperty.mutateAsync({ customerId, strasse, plz, ort, notiz });
      }
      onClose();
    } catch {
      setError("Speichern fehlgeschlagen.");
    }
  }

  async function handleDelete() {
    if (!property) return;
    if (!confirm("Liegenschaft wirklich löschen?")) return;
    await deleteProperty.mutateAsync(property.id);
    onClose();
  }

  return (
    <Modal title={property ? "Liegenschaft bearbeiten" : "Neue Liegenschaft"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="property-strasse">Strasse</label>
          <input id="property-strasse" value={strasse} onChange={(e) => setStrasse(e.target.value)} required />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="property-plz">PLZ</label>
            <input id="property-plz" value={plz} onChange={(e) => setPlz(e.target.value)} required />
          </div>
          <div className="field" style={{ flex: 2 }}>
            <label htmlFor="property-ort">Ort</label>
            <input id="property-ort" value={ort} onChange={(e) => setOrt(e.target.value)} required />
          </div>
        </div>
        <div className="field">
          <label htmlFor="property-notiz">Notiz</label>
          <textarea id="property-notiz" rows={3} value={notiz} onChange={(e) => setNotiz(e.target.value)} />
        </div>

        {error && <p className="error-text">{error}</p>}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 8 }}>
          <div>
            {property && (
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
