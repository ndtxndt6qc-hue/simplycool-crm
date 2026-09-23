import { useEffect, useRef, useState } from "react";
import type { OrderDetail } from "../lib/orders";
import { useSubmitAbnahmeprotokoll } from "../lib/orders";
import { useSettings, DEFAULT_ABNAHMEPROTOKOLL_TEXT } from "../lib/settings";
import { ApiError } from "../lib/api";
import { SignaturePad, type SignaturePadHandle } from "./SignaturePad";

function datumUhrzeitCh(value: string): string {
  return new Intl.DateTimeFormat("de-CH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function AbnahmeprotokollCard({ order }: { order: OrderDetail }) {
  const { data: settings } = useSettings();
  const submit = useSubmitAbnahmeprotokoll(order.id);
  const sigRef = useRef<SignaturePadHandle>(null);
  const [unterzeichnerName, setUnterzeichnerName] = useState("");
  const [bemerkungen, setBemerkungen] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [neuErfassen, setNeuErfassen] = useState(false);

  useEffect(() => {
    setUnterzeichnerName([order.customer.vorname, order.customer.nachname].filter(Boolean).join(" "));
  }, [order.id, order.customer.vorname, order.customer.nachname]);

  const klauseln = (settings?.abnahmeprotokollText || DEFAULT_ABNAHMEPROTOKOLL_TEXT).split("\n").filter((l) => l.trim());
  const zeigeFormular = !order.abnahmeAbgeschlossenAm || neuErfassen;
  const protokollDokument = [...order.documents].reverse().find((d) => d.typ === "abnahmeprotokoll_signiert");

  async function handleSubmit() {
    setError(null);
    if (!unterzeichnerName.trim()) {
      setError("Bitte Namen der unterzeichnenden Person angeben.");
      return;
    }
    const dataUrl = sigRef.current?.getDataUrl();
    if (!dataUrl) {
      setError("Bitte im Feld unten unterschreiben.");
      return;
    }
    try {
      await submit.mutateAsync({
        unterzeichnerName: unterzeichnerName.trim(),
        bemerkungen: bemerkungen.trim() || undefined,
        unterschriftDataUrl: dataUrl,
      });
      setNeuErfassen(false);
      setBemerkungen("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Protokoll konnte nicht gespeichert werden.");
    }
  }

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <h3 style={{ marginBottom: 16 }}>Digitales Abnahmeprotokoll</h3>

      {!zeigeFormular ? (
        <div>
          <p style={{ margin: "0 0 8px" }}>
            Abgeschlossen am <strong>{datumUhrzeitCh(order.abnahmeAbgeschlossenAm!)} Uhr</strong> von{" "}
            <strong>{order.abnahmeUnterzeichnerName}</strong>.
          </p>
          {order.abnahmeBemerkungen && (
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 8px" }}>
              Bemerkungen: {order.abnahmeBemerkungen}
            </p>
          )}
          {order.abnahmeUnterschrift && (
            <img
              src={order.abnahmeUnterschrift}
              alt="Unterschrift"
              style={{ maxHeight: 80, background: "#fff", border: "1px solid var(--color-border)", borderRadius: 6, display: "block", marginBottom: 12 }}
            />
          )}
          <div style={{ display: "flex", gap: 8 }}>
            {protokollDokument && (
              <a className="btn btn-secondary" href={protokollDokument.dateipfad} target="_blank" rel="noreferrer">
                PDF öffnen
              </a>
            )}
            <button type="button" className="btn btn-secondary" onClick={() => setNeuErfassen(true)}>
              Neu erfassen
            </button>
          </div>
        </div>
      ) : (
        <>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px" }}>
            {klauseln.map((k) => (
              <li
                key={k}
                style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--color-border)", fontSize: 13 }}
              >
                <span
                  style={{
                    flex: "none",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "var(--color-primary)",
                    color: "#fff",
                    fontSize: 11,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✓
                </span>
                {k}
              </li>
            ))}
          </ul>

          <div className="field">
            <label htmlFor="abnahme-name">Unterzeichnet von</label>
            <input id="abnahme-name" value={unterzeichnerName} onChange={(e) => setUnterzeichnerName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="abnahme-bemerkungen">Bemerkungen (optional)</label>
            <textarea
              id="abnahme-bemerkungen"
              rows={2}
              value={bemerkungen}
              onChange={(e) => setBemerkungen(e.target.value)}
              placeholder="z.B. Hinweise, Mängel, Absprachen"
            />
          </div>
          <div className="field">
            <label>Unterschrift</label>
            <SignaturePad ref={sigRef} />
            <button
              type="button"
              className="btn btn-secondary"
              style={{ marginTop: 8, padding: "2px 10px" }}
              onClick={() => sigRef.current?.clear()}
            >
              Unterschrift löschen
            </button>
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={submit.isPending} style={{ width: "100%" }}>
            {submit.isPending ? "Speichert…" : "Protokoll abschliessen"}
          </button>
        </>
      )}
    </div>
  );
}
