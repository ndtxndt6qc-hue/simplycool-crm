import { useState, type FormEvent } from "react";
import { Modal } from "./Modal";
import { STOCK_MOVEMENT_TYP_LABELS } from "../lib/labels";
import type { StockMovementTyp } from "@klimainstall/shared";
import { useCreateStockMovement, useStockMovements, type Device } from "../lib/devices";

export function StockMovementModal({ device, onClose }: { device: Device; onClose: () => void }) {
  const [typ, setTyp] = useState<StockMovementTyp>("wareneingang");
  const [menge, setMenge] = useState("1");
  const [notiz, setNotiz] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: movements } = useStockMovements(device.id);
  const createMovement = useCreateStockMovement(device.id);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createMovement.mutateAsync({ typ, menge: Number(menge), notiz: notiz || undefined });
      setMenge("1");
      setNotiz("");
    } catch {
      setError("Buchung fehlgeschlagen.");
    }
  }

  return (
    <Modal title={`Lagerbewegung: ${device.hersteller} ${device.modell}`} onClose={onClose}>
      <p style={{ color: "var(--color-text-muted)", marginTop: 0 }}>
        Aktueller Lagerbestand: <strong>{device.lagerbestand}</strong>
      </p>
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 2 }}>
            <label htmlFor="movement-typ">Typ</label>
            <select id="movement-typ" value={typ} onChange={(e) => setTyp(e.target.value as StockMovementTyp)}>
              <option value="wareneingang">Wareneingang</option>
              <option value="ruecksendung">Rücksendung</option>
              <option value="korrektur">Korrektur (+/-)</option>
            </select>
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="movement-menge">Menge</label>
            <input
              id="movement-menge"
              type="number"
              value={menge}
              onChange={(e) => setMenge(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="movement-notiz">Notiz</label>
          <input id="movement-notiz" value={notiz} onChange={(e) => setNotiz(e.target.value)} />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={createMovement.isPending}>
          {createMovement.isPending ? "Buchen…" : "Buchen"}
        </button>
      </form>

      <h4 style={{ marginTop: 24, marginBottom: 8 }}>Verlauf</h4>
      {!movements?.length ? (
        <p style={{ color: "var(--color-text-muted)" }}>Noch keine Bewegungen.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {movements.map((m) => (
            <div key={m.id} style={{ fontSize: 13, borderBottom: "1px solid var(--color-border)", paddingBottom: 6 }}>
              <strong>{STOCK_MOVEMENT_TYP_LABELS[m.typ]}</strong> {m.menge > 0 ? "+" : ""}
              {m.menge} — {new Date(m.datum).toLocaleDateString("de-CH")}
              {m.notiz && <div style={{ color: "var(--color-text-muted)" }}>{m.notiz}</div>}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
