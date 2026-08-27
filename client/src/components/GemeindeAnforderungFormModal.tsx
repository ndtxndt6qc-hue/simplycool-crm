import { useState, type FormEvent } from "react";
import { Modal } from "./Modal";
import { GEMEINDE_ANFORDERUNGSTYP_LABELS } from "../lib/labels";
import { GEMEINDE_ANFORDERUNGSTYPEN, type GemeindeAnforderungstyp } from "@klimainstall/shared";
import {
  useCreateGemeindeAnforderung,
  useDeleteGemeindeAnforderung,
  useUpdateGemeindeAnforderung,
  type GemeindeAnforderung,
} from "../lib/gemeindeAnforderungen";

export function GemeindeAnforderungFormModal({
  eintrag,
  defaultGemeindeName,
  onClose,
  onSaved,
}: {
  eintrag: GemeindeAnforderung | null;
  defaultGemeindeName?: string;
  onClose: () => void;
  onSaved?: (eintrag: GemeindeAnforderung) => void;
}) {
  const [kanton, setKanton] = useState(eintrag?.kanton ?? "AG");
  const [gemeindeName, setGemeindeName] = useState(eintrag?.gemeindeName ?? defaultGemeindeName ?? "");
  const [bfsNummer, setBfsNummer] = useState(eintrag?.bfsNummer ? String(eintrag.bfsNummer) : "");
  const [anforderungstyp, setAnforderungstyp] = useState<GemeindeAnforderungstyp>(
    eintrag?.anforderungstyp ?? "unklar_abklaeren"
  );
  const [beschreibung, setBeschreibung] = useState(eintrag?.beschreibung ?? "");
  const [kostenPauschale, setKostenPauschale] = useState(eintrag?.kostenPauschale ?? "");
  const [bearbeitungsdauerTage, setBearbeitungsdauerTage] = useState(
    eintrag?.bearbeitungsdauerTage ? String(eintrag.bearbeitungsdauerTage) : ""
  );
  const [quelle, setQuelle] = useState(eintrag?.quelle ?? "");
  const [zuletztGeprueftAm, setZuletztGeprueftAm] = useState(eintrag?.zuletztGeprueftAm ?? "");
  const [error, setError] = useState<string | null>(null);

  const createEintrag = useCreateGemeindeAnforderung();
  const updateEintrag = useUpdateGemeindeAnforderung();
  const deleteEintrag = useDeleteGemeindeAnforderung();
  const saving = createEintrag.isPending || updateEintrag.isPending;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const input = {
      kanton,
      gemeindeName,
      bfsNummer: bfsNummer ? Number(bfsNummer) : undefined,
      anforderungstyp,
      beschreibung: beschreibung || undefined,
      kostenPauschale: kostenPauschale ? Number(kostenPauschale) : undefined,
      bearbeitungsdauerTage: bearbeitungsdauerTage ? Number(bearbeitungsdauerTage) : undefined,
      quelle: quelle || undefined,
      zuletztGeprueftAm: zuletztGeprueftAm || undefined,
    };
    try {
      const saved = eintrag
        ? await updateEintrag.mutateAsync({ id: eintrag.id, ...input })
        : await createEintrag.mutateAsync(input);
      onSaved?.(saved);
      onClose();
    } catch {
      setError("Speichern fehlgeschlagen. Existiert dieser Kanton/Gemeinde-Eintrag evtl. bereits?");
    }
  }

  async function handleDelete() {
    if (!eintrag) return;
    if (!confirm(`Eintrag "${eintrag.gemeindeName}" wirklich löschen?`)) return;
    await deleteEintrag.mutateAsync(eintrag.id);
    onClose();
  }

  return (
    <Modal title={eintrag ? "Gemeinde-Eintrag bearbeiten" : "Neuer Gemeinde-Eintrag"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ width: 90 }}>
            <label htmlFor="ga-kanton">Kanton</label>
            <input
              id="ga-kanton"
              value={kanton}
              maxLength={2}
              onChange={(e) => setKanton(e.target.value.toUpperCase())}
              required
            />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="ga-gemeinde">Gemeinde</label>
            <input id="ga-gemeinde" value={gemeindeName} onChange={(e) => setGemeindeName(e.target.value)} required />
          </div>
        </div>
        <div className="field">
          <label htmlFor="ga-bfs">BFS-Nummer (optional)</label>
          <input id="ga-bfs" type="number" value={bfsNummer} onChange={(e) => setBfsNummer(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="ga-typ">Anforderungstyp</label>
          <select
            id="ga-typ"
            value={anforderungstyp}
            onChange={(e) => setAnforderungstyp(e.target.value as GemeindeAnforderungstyp)}
          >
            {GEMEINDE_ANFORDERUNGSTYPEN.map((t) => (
              <option key={t} value={t}>
                {GEMEINDE_ANFORDERUNGSTYP_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="ga-beschreibung">Beschreibung / Bedingungen</label>
          <textarea
            id="ga-beschreibung"
            rows={3}
            value={beschreibung}
            onChange={(e) => setBeschreibung(e.target.value)}
            placeholder='z.B. "nur in Kernzone bewilligungspflichtig"'
          />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="ga-kosten">Kosten-Pauschale (CHF)</label>
            <input
              id="ga-kosten"
              type="number"
              step="0.01"
              value={kostenPauschale}
              onChange={(e) => setKostenPauschale(e.target.value)}
            />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="ga-dauer">Bearbeitungsdauer (Tage)</label>
            <input
              id="ga-dauer"
              type="number"
              value={bearbeitungsdauerTage}
              onChange={(e) => setBearbeitungsdauerTage(e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="ga-quelle">Quelle</label>
          <input
            id="ga-quelle"
            value={quelle}
            onChange={(e) => setQuelle(e.target.value)}
            placeholder='z.B. "Telefonat Bauverwaltung 12.09.2026"'
          />
        </div>
        <div className="field">
          <label htmlFor="ga-geprueft">Zuletzt geprüft am</label>
          <input
            id="ga-geprueft"
            type="date"
            value={zuletztGeprueftAm}
            onChange={(e) => setZuletztGeprueftAm(e.target.value)}
          />
        </div>

        {error && <p className="error-text">{error}</p>}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 8 }}>
          <div>
            {eintrag && (
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
