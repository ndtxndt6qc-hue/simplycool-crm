import { useEffect, useState, type FormEvent } from "react";
import { PAGE_TEXT_FIELDS } from "../lib/pageTextRegistry";
import { useAdminPageTexts, useSavePageTexts } from "../lib/pageTexts";
import { ApiError } from "../lib/api";

const GROUPS = Array.from(new Set(PAGE_TEXT_FIELDS.map((f) => f.group)));

export function PageTextsPage() {
  const { data: overrides, isLoading } = useAdminPageTexts();
  const saveTexts = useSavePageTexts();

  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const f of PAGE_TEXT_FIELDS) initial[f.id] = overrides?.[f.id] ?? f.default;
    setValues(initial);
  }, [overrides]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaved(false);
    setError(null);
    try {
      const entries: Record<string, string> = {};
      for (const f of PAGE_TEXT_FIELDS) {
        const current = values[f.id] ?? f.default;
        const wasOverridden = overrides?.[f.id] !== undefined;
        if (wasOverridden || current !== f.default) {
          entries[f.id] = current;
        }
      }
      await saveTexts.mutateAsync(entries);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Speichern fehlgeschlagen.");
    }
  }

  if (isLoading) return <p>Lädt…</p>;

  return (
    <div>
      <h1>Webseiten-Texte</h1>
      <p style={{ color: "var(--color-text-muted)", maxWidth: 640, marginBottom: 24 }}>
        Diese Texte erscheinen auf der öffentlichen Webseite — in beiden Design-Varianten (V1 unter{" "}
        <code>/</code> und V2 unter <code>/v2</code>) gleichzeitig. Ein leeres Feld übernimmt wieder den
        Standardtext.
      </p>

      <form onSubmit={handleSubmit}>
        {GROUPS.map((group) => (
          <div key={group} className="card" style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, marginBottom: 16 }}>{group}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {PAGE_TEXT_FIELDS.filter((f) => f.group === group).map((field) => (
                <div className="field" key={field.id}>
                  <label htmlFor={`pt-${field.id}`}>{field.label}</label>
                  {field.multiline ? (
                    <textarea
                      id={`pt-${field.id}`}
                      rows={3}
                      value={values[field.id] ?? ""}
                      placeholder={field.default}
                      onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                    />
                  ) : (
                    <input
                      id={`pt-${field.id}`}
                      value={values[field.id] ?? ""}
                      placeholder={field.default}
                      onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {error && <p className="error-text">{error}</p>}
        {saved && <p style={{ color: "var(--color-primary)", marginBottom: 12 }}>Gespeichert.</p>}

        <button type="submit" className="btn btn-primary" disabled={saveTexts.isPending}>
          {saveTexts.isPending ? "Speichert…" : "Speichern"}
        </button>
      </form>
    </div>
  );
}
