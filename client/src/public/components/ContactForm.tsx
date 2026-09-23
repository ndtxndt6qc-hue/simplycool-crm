import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "../../lib/api";
import { usePageTextMap, getText } from "../../lib/pageTexts";

function getUtmSource(): string | undefined {
  try {
    return new URLSearchParams(window.location.search).get("utm_source") || undefined;
  } catch {
    return undefined;
  }
}

export function ContactForm({ title = "Kostenlose Anfrage" }: { title?: string }) {
  const texts = usePageTextMap();
  const [name, setName] = useState("");
  const [telefon, setTelefon] = useState("");
  const [email, setEmail] = useState("");
  const [plz, setPlz] = useState("");
  const [ort, setOrt] = useState("");
  const [nachricht, setNachricht] = useState("");
  const [firma, setFirma] = useState(""); // Honeypot
  const [quelle, setQuelle] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setQuelle(getUtmSource());
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Bitte Namen angeben.");
      return;
    }
    if (!telefon.trim() && !email.trim()) {
      setError("Bitte Telefon oder E-Mail angeben.");
      return;
    }
    if (!/^\d{4}$/.test(plz.trim())) {
      setError("Bitte eine 4-stellige PLZ angeben.");
      return;
    }
    if (!ort.trim()) {
      setError("Bitte Ort angeben.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/public/lead", {
        name: name.trim(),
        telefon: telefon.trim() || undefined,
        email: email.trim() || undefined,
        plz: plz.trim(),
        ort: ort.trim(),
        nachricht: nachricht.trim() || undefined,
        quelle,
        firma,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Senden fehlgeschlagen. Bitte später erneut versuchen.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="public-form">
        <div className="public-form-success">
          <h3>{getText(texts, "kontakt.danke.titel")}</h3>
          <p>{getText(texts, "kontakt.danke.text")}</p>
        </div>
      </div>
    );
  }

  return (
    <form className="public-form" onSubmit={handleSubmit}>
      {title && <h3 style={{ marginBottom: 16 }}>{title}</h3>}

      <div className="field">
        <label htmlFor="cf-name">Name *</label>
        <input id="cf-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="cf-telefon">Telefon</label>
          <input id="cf-telefon" type="tel" value={telefon} onChange={(e) => setTelefon(e.target.value)} placeholder="079 000 00 00" />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="cf-email">E-Mail</label>
          <input id="cf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div className="field" style={{ width: 100 }}>
          <label htmlFor="cf-plz">PLZ *</label>
          <input id="cf-plz" value={plz} onChange={(e) => setPlz(e.target.value)} maxLength={4} required />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="cf-ort">Ort *</label>
          <input id="cf-ort" value={ort} onChange={(e) => setOrt(e.target.value)} required />
        </div>
      </div>
      <div className="field">
        <label htmlFor="cf-nachricht">Nachricht (optional)</label>
        <textarea
          id="cf-nachricht"
          rows={3}
          value={nachricht}
          onChange={(e) => setNachricht(e.target.value)}
          placeholder="z.B. Anzahl Räume, gewünschter Zeitpunkt"
        />
      </div>

      {/* Honeypot — für Menschen unsichtbar, Bots füllen es oft aus */}
      <div className="public-honeypot" aria-hidden="true">
        <label htmlFor="cf-firma">Firma</label>
        <input
          id="cf-firma"
          name="firma"
          tabIndex={-1}
          autoComplete="off"
          value={firma}
          onChange={(e) => setFirma(e.target.value)}
        />
      </div>

      {error && <p className="error-text">{error}</p>}

      <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: "100%" }}>
        {submitting ? "Wird gesendet…" : "Anfrage senden"}
      </button>
    </form>
  );
}
