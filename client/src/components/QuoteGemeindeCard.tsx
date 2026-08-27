import { useEffect, useRef, useState } from "react";
import { GEMEINDE_ANFORDERUNGSTYP_LABELS } from "../lib/labels";
import {
  istVeraltet,
  useGemeindeAnforderungen,
  type GemeindeAnforderung,
} from "../lib/gemeindeAnforderungen";
import { useApplyGemeindePosition, useQuoteGemeinde, useSetQuoteGemeinde } from "../lib/quotes";
import { GemeindeAnforderungFormModal } from "./GemeindeAnforderungFormModal";

function formatDatum(value: string | null) {
  return value ? new Date(value).toLocaleDateString("de-CH") : null;
}

export function QuoteGemeindeCard({ quoteId, ort, locked }: { quoteId: number; ort: string; locked: boolean }) {
  const { data: info, isLoading } = useQuoteGemeinde(quoteId);
  const { data: alleGemeinden } = useGemeindeAnforderungen();
  const setGemeinde = useSetQuoteGemeinde(quoteId);
  const applyPosition = useApplyGemeindePosition(quoteId);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const appliedForRef = useRef<number | null>(null);

  const gemeinde = info?.gemeinde ?? null;
  const requiresPayment = gemeinde?.anforderungstyp === "meldepflicht" || gemeinde?.anforderungstyp === "baubewilligungspflicht";

  useEffect(() => {
    if (
      !locked &&
      gemeinde &&
      requiresPayment &&
      info &&
      !info.vorgeschlagen &&
      appliedForRef.current !== gemeinde.id &&
      !applyPosition.isPending
    ) {
      appliedForRef.current = gemeinde.id;
      applyPosition.mutate();
    }
  }, [gemeinde, requiresPayment, info, locked, applyPosition]);

  if (isLoading || !info) {
    return null;
  }

  const veraltet = gemeinde ? istVeraltet(gemeinde.zuletztGeprueftAm) : false;

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <h3 style={{ marginBottom: 12 }}>Gemeinde-Anforderungen</h3>

      {!gemeinde && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <strong>Für "{ort}" liegen keine Angaben zu Bewilligungs-/Meldepflichten vor.</strong>
          <p style={{ margin: "6px 0 10px" }}>Bitte vor Angebotsversand bei der Gemeinde abklären.</p>
          <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(true)}>
            Neuen Gemeinde-Eintrag erfassen
          </button>
        </div>
      )}

      {gemeinde && gemeinde.anforderungstyp === "unklar_abklaeren" && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <strong>Anforderung für "{gemeinde.gemeindeName}" ist noch nicht abschliessend geklärt.</strong>
          <p style={{ margin: "6px 0 10px" }}>Bitte vor Angebotsversand bei der Gemeinde abklären.</p>
          <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(true)}>
            Eintrag bearbeiten
          </button>
        </div>
      )}

      {gemeinde && gemeinde.anforderungstyp === "keine" && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 12, marginBottom: 12 }}>
          Keine Bewilligung erforderlich laut Erfassung vom {formatDatum(gemeinde.zuletztGeprueftAm) ?? "unbekannt"}.
        </div>
      )}

      {gemeinde && requiresPayment && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <span className="badge badge-warning">{GEMEINDE_ANFORDERUNGSTYP_LABELS[gemeinde.anforderungstyp]}</span>
          <p style={{ margin: "8px 0 0" }}>
            {info.vorgeschlagen
              ? "Eine entsprechende Position wurde ins Angebot eingefügt und kann bei Bedarf angepasst oder entfernt werden."
              : "Eine entsprechende Position wird ins Angebot eingefügt."}
          </p>
        </div>
      )}

      {gemeinde && veraltet && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: 12, marginBottom: 12 }}>
          Diese Angabe wurde zuletzt am {formatDatum(gemeinde.zuletztGeprueftAm) ?? "nie"} geprüft — evtl. veraltet, ggf. erneut
          abklären.
        </div>
      )}

      {gemeinde && (
        <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 12 }}>
          {gemeinde.beschreibung && <div>{gemeinde.beschreibung}</div>}
          {gemeinde.quelle && <div>Quelle: {gemeinde.quelle}</div>}
          <div>Zuletzt geprüft: {formatDatum(gemeinde.zuletztGeprueftAm) ?? "nie erfasst"}</div>
        </div>
      )}

      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor="quote-gemeinde-select">Gemeinde manuell zuordnen (falls automatische Zuordnung falsch liegt)</label>
        <select
          id="quote-gemeinde-select"
          value={gemeinde?.id ?? ""}
          onChange={(e) => setGemeinde.mutate(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">— keine Zuordnung —</option>
          {alleGemeinden?.map((g: GemeindeAnforderung) => (
            <option key={g.id} value={g.id}>
              {g.kanton} · {g.gemeindeName} ({GEMEINDE_ANFORDERUNGSTYP_LABELS[g.anforderungstyp]})
            </option>
          ))}
        </select>
      </div>

      {showCreateModal && (
        <GemeindeAnforderungFormModal
          eintrag={null}
          defaultGemeindeName={ort}
          onClose={() => setShowCreateModal(false)}
          onSaved={(saved) => setGemeinde.mutate(saved.id)}
        />
      )}
      {showEditModal && gemeinde && (
        <GemeindeAnforderungFormModal eintrag={gemeinde} onClose={() => setShowEditModal(false)} />
      )}
    </div>
  );
}
