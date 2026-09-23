import { useState } from "react";
import { useParams } from "react-router-dom";
import { useBranding, PUBLIC_LOGO_URL, usePublicQuote, useAcceptPublicQuote } from "../../lib/publicApi";
import { QUOTE_ITEM_TYP_LABELS } from "../../lib/labels";
import { formatChf } from "../../lib/format";
import { ApiError } from "../../lib/api";
import type { QuoteItemTyp } from "@klimainstall/shared";

function dateCh(value: string | null): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("de-CH").format(new Date(value));
}

function datumUhrzeitCh(value: string | null): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("de-CH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function AngebotAnsichtPage() {
  const { token } = useParams<{ token: string }>();
  const { data: branding } = useBranding();
  const { data: quote, isLoading, error } = usePublicQuote(token || "");

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        {branding?.hatLogo ? (
          <img src={PUBLIC_LOGO_URL} alt={branding.firmenname} style={{ height: 40, display: "block" }} />
        ) : (
          <strong style={{ fontSize: 18 }}>{branding?.firmenname || "SimplyCool"}</strong>
        )}
      </div>

      {isLoading && <p style={{ color: "var(--color-text-muted)" }}>Lädt…</p>}
      {error && <p className="error-text">Dieses Angebot wurde nicht gefunden. Bitte prüfen Sie den Link.</p>}
      {quote && <QuoteContent token={token!} quote={quote} />}
    </div>
  );
}

function QuoteContent({ token, quote }: { token: string; quote: NonNullable<ReturnType<typeof usePublicQuote>["data"]> }) {
  const [agbAkzeptiert, setAgbAkzeptiert] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const acceptQuote = useAcceptPublicQuote(token);

  const verbindlicheItems = quote.items.filter((i) => !i.optional);
  const optionaleItems = quote.items.filter((i) => i.optional);

  async function handleAccept() {
    setError(null);
    try {
      await acceptQuote.mutateAsync();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Bestätigung fehlgeschlagen. Bitte später erneut versuchen.");
    }
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, margin: "0 0 4px" }}>Angebot {quote.angebotsnummer}</h1>
            <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
              Datum: {dateCh(quote.datum)}
              {quote.gueltigBis && (
                <span
                  style={{
                    marginLeft: 10,
                    display: "inline-block",
                    background: "#f0fdfa",
                    color: "var(--color-primary)",
                    borderRadius: 999,
                    padding: "2px 10px",
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  Gültig bis {dateCh(quote.gueltigBis)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 32, flexWrap: "wrap", marginBottom: 24, fontSize: 13 }}>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--color-primary)", fontWeight: 600, marginBottom: 4 }}>
              Kunde
            </div>
            {quote.kunde.name}
            <br />
            {quote.kunde.strasse}
            <br />
            {quote.kunde.plz} {quote.kunde.ort}
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--color-primary)", fontWeight: 600, marginBottom: 4 }}>
              Installationsort
            </div>
            {quote.installationsort.strasse}
            <br />
            {quote.installationsort.plz} {quote.installationsort.ort}
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Art</th>
                <th>Beschreibung</th>
                <th>Menge</th>
                <th>Preis</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((i) => (
                <tr key={i.id}>
                  <td>{QUOTE_ITEM_TYP_LABELS[i.typ as QuoteItemTyp] ?? i.typ}</td>
                  <td>
                    {i.beschreibung}
                    {i.optional && (
                      <span style={{ marginLeft: 6, fontSize: 10, textTransform: "uppercase", background: "#fef3c7", color: "#92400e", borderRadius: 3, padding: "1px 5px" }}>
                        optional
                      </span>
                    )}
                    {i.spezifikationen && (
                      <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
                        {i.spezifikationen.split("\n").map((line, idx) => (
                          <div key={idx}>{line}</div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>{i.menge}{i.einheit ? ` ${i.einheit}` : ""}</td>
                  <td>{formatChf(i.einzelpreis)}</td>
                  <td>{formatChf(i.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ width: 280, marginLeft: "auto", marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 4px", fontSize: 13 }}>
            <span>Netto</span>
            <span>{formatChf(quote.summeNetto)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 4px", fontSize: 13 }}>
            <span>MWST {quote.mwstSatz.toFixed(2)}%</span>
            <span>{formatChf(quote.mwstBetrag)}</span>
          </div>
          {optionaleItems.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 4px", fontSize: 12, color: "#92400e" }}>
              <span>Optionale Positionen (nicht enthalten)</span>
              <span>{formatChf(quote.summeOptional)}</span>
            </div>
          )}
          <div
            style={{
              marginTop: 8,
              background: "var(--color-primary)",
              color: "#fff",
              borderRadius: 10,
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            <span>Total</span>
            <span>{formatChf(quote.summeTotal)}</span>
          </div>
        </div>
      </div>

      <div className="card">
        {quote.status === "angenommen" ? (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <h3 style={{ marginBottom: 6 }}>Angebot bestätigt</h3>
            <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
              Sie haben dieses Angebot am {datumUhrzeitCh(quote.angenommenAm)} Uhr online bestätigt. Wir melden uns in
              Kürze für die Terminvereinbarung.
            </p>
          </div>
        ) : quote.status === "abgelehnt" ? (
          <p style={{ color: "var(--color-text-muted)", margin: 0, textAlign: "center" }}>Dieses Angebot wurde abgelehnt.</p>
        ) : (
          <>
            <h3 style={{ marginBottom: 12 }}>Angebot annehmen</h3>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, marginBottom: 16, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={agbAkzeptiert}
                onChange={(e) => setAgbAkzeptiert(e.target.checked)}
                style={{ marginTop: 2 }}
              />
              <span>
                Ich nehme das Angebot {quote.angebotsnummer} zu den genannten Konditionen an und akzeptiere die{" "}
                <a href="/agb" target="_blank" rel="noreferrer">
                  Allgemeinen Geschäftsbedingungen (AGB)
                </a>
                .
              </span>
            </label>
            {error && <p className="error-text">{error}</p>}
            <button
              type="button"
              className="btn btn-primary"
              disabled={!agbAkzeptiert || acceptQuote.isPending}
              onClick={handleAccept}
              style={{ width: "100%" }}
            >
              {acceptQuote.isPending ? "Wird bestätigt…" : "Angebot verbindlich annehmen"}
            </button>
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 10, marginBottom: 0 }}>
              Mit der Bestätigung wird Zeitpunkt und IP-Adresse als Nachweis der Annahme gespeichert. Sie erhalten
              eine Bestätigung per E-Mail.
            </p>
          </>
        )}
      </div>
    </>
  );
}
