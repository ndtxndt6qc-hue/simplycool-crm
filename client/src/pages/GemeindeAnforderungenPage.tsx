import { useMemo, useState } from "react";
import { GEMEINDE_ANFORDERUNGSTYP_LABELS } from "../lib/labels";
import { GEMEINDE_ANFORDERUNGSTYPEN, type GemeindeAnforderungstyp } from "@klimainstall/shared";
import {
  istVeraltet,
  useGemeindeAnforderungen,
  type GemeindeAnforderung,
} from "../lib/gemeindeAnforderungen";
import { GemeindeAnforderungFormModal } from "../components/GemeindeAnforderungFormModal";

const TYP_BADGE: Record<GemeindeAnforderungstyp, string> = {
  keine: "badge-success",
  meldepflicht: "badge-warning",
  baubewilligungspflicht: "badge-danger",
  unklar_abklaeren: "badge-neutral",
};

type SortKey = "kanton" | "gemeindeName" | "anforderungstyp";

export function GemeindeAnforderungenPage() {
  const [search, setSearch] = useState("");
  const { data: eintraege, isLoading } = useGemeindeAnforderungen(search);
  const [kantonFilter, setKantonFilter] = useState("");
  const [typFilter, setTypFilter] = useState<GemeindeAnforderungstyp | "">("");
  const [sortKey, setSortKey] = useState<SortKey>("kanton");
  const [editing, setEditing] = useState<GemeindeAnforderung | null | undefined>(undefined);

  const kantone = useMemo(
    () => [...new Set((eintraege ?? []).map((e) => e.kanton))].sort(),
    [eintraege]
  );

  const gefiltert = useMemo(() => {
    let rows = eintraege ?? [];
    if (kantonFilter) rows = rows.filter((e) => e.kanton === kantonFilter);
    if (typFilter) rows = rows.filter((e) => e.anforderungstyp === typFilter);
    return [...rows].sort((a, b) => {
      if (sortKey === "kanton") return a.kanton.localeCompare(b.kanton) || a.gemeindeName.localeCompare(b.gemeindeName);
      if (sortKey === "gemeindeName") return a.gemeindeName.localeCompare(b.gemeindeName);
      return a.anforderungstyp.localeCompare(b.anforderungstyp) || a.gemeindeName.localeCompare(b.gemeindeName);
    });
  }, [eintraege, kantonFilter, typFilter, sortKey]);

  function sortButton(key: SortKey, label: string) {
    return (
      <button
        type="button"
        onClick={() => setSortKey(key)}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          font: "inherit",
          color: sortKey === key ? "var(--color-text)" : "inherit",
          fontWeight: sortKey === key ? 700 : "inherit",
          cursor: "pointer",
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Gemeinde-Anforderungen</h1>
        <button className="btn btn-primary" onClick={() => setEditing(null)}>
          + Neuer Eintrag
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <input
          placeholder="Gemeinde oder Kanton suchen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <select value={kantonFilter} onChange={(e) => setKantonFilter(e.target.value)}>
          <option value="">Alle Kantone</option>
          {kantone.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <select value={typFilter} onChange={(e) => setTypFilter(e.target.value as GemeindeAnforderungstyp | "")}>
          <option value="">Alle Anforderungstypen</option>
          {GEMEINDE_ANFORDERUNGSTYPEN.map((t) => (
            <option key={t} value={t}>
              {GEMEINDE_ANFORDERUNGSTYP_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p style={{ color: "var(--color-text-muted)" }}>Lädt…</p>
      ) : !gefiltert.length ? (
        <div className="card">
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Keine Einträge gefunden.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>{sortButton("kanton", "Kanton")}</th>
                <th>{sortButton("gemeindeName", "Gemeinde")}</th>
                <th>{sortButton("anforderungstyp", "Anforderung")}</th>
                <th>Kosten-Pauschale</th>
                <th>Zuletzt geprüft</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {gefiltert.map((e) => {
                const veraltet = istVeraltet(e.zuletztGeprueftAm);
                return (
                  <tr key={e.id} onClick={() => setEditing(e)} style={{ cursor: "pointer" }}>
                    <td>{e.kanton}</td>
                    <td>
                      <strong>{e.gemeindeName}</strong>
                      {e.beschreibung && (
                        <div style={{ color: "var(--color-text-muted)", fontSize: 12 }}>{e.beschreibung}</div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${TYP_BADGE[e.anforderungstyp]}`}>
                        {GEMEINDE_ANFORDERUNGSTYP_LABELS[e.anforderungstyp]}
                      </span>
                    </td>
                    <td>{e.kostenPauschale ? `CHF ${Number(e.kostenPauschale).toFixed(2)}` : "—"}</td>
                    <td>
                      {e.zuletztGeprueftAm ? new Date(e.zuletztGeprueftAm).toLocaleDateString("de-CH") : "—"}
                    </td>
                    <td>
                      {veraltet && (
                        <span className="badge badge-warning" title="Bitte erneut abklären">
                          Bitte erneut abklären
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing !== undefined && <GemeindeAnforderungFormModal eintrag={editing} onClose={() => setEditing(undefined)} />}
    </div>
  );
}
