import { useState, type FormEvent } from "react";
import { Modal } from "./Modal";
import { useAddPayment } from "../lib/invoices";

export function AddPaymentModal({ invoiceId, offen, onClose }: { invoiceId: number; offen: number; onClose: () => void }) {
  const [betrag, setBetrag] = useState(offen.toFixed(2));
  const [notiz, setNotiz] = useState("");
  const addPayment = useAddPayment(invoiceId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await addPayment.mutateAsync({ betrag: Number(betrag), notiz: notiz || undefined });
    onClose();
  }

  return (
    <Modal title="Zahlung erfassen" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="payment-betrag">Betrag (CHF)</label>
          <input id="payment-betrag" type="number" step="0.01" value={betrag} onChange={(e) => setBetrag(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="payment-notiz">Notiz</label>
          <input id="payment-notiz" value={notiz} onChange={(e) => setNotiz(e.target.value)} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Abbrechen
          </button>
          <button type="submit" className="btn btn-primary" disabled={addPayment.isPending}>
            {addPayment.isPending ? "Speichern…" : "Speichern"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
