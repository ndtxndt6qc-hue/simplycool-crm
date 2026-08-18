import { useState, type FormEvent } from "react";
import { Modal } from "./Modal";
import { useSendQuote } from "../lib/quotes";
import { ApiError } from "../lib/api";

export function SendQuoteModal({
  quoteId,
  defaultEmail,
  onClose,
}: {
  quoteId: number;
  defaultEmail: string;
  onClose: () => void;
}) {
  const [to, setTo] = useState(defaultEmail);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const sendQuote = useSendQuote(quoteId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await sendQuote.mutateAsync({ to, message: message || undefined });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Versand fehlgeschlagen.");
    }
  }

  return (
    <Modal title="Angebot per E-Mail senden" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="send-to">Empfänger</label>
          <input id="send-to" type="email" value={to} onChange={(e) => setTo(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="send-message">Nachricht (optional)</label>
          <textarea id="send-message" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>

        {error && <p className="error-text">{error}</p>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Abbrechen
          </button>
          <button type="submit" className="btn btn-primary" disabled={sendQuote.isPending}>
            {sendQuote.isPending ? "Wird gesendet…" : "Senden"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
