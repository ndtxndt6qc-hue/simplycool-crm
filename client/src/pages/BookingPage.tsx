import { useMemo, useState, type FormEvent } from "react";
import { WOCHENTAGE } from "@klimainstall/shared";
import {
  useAvailabilityRules,
  useCreateAvailabilityRule,
  useDeleteAvailabilityRule,
  useBlockedSlots,
  useCreateBlockedSlot,
  useDeleteBlockedSlot,
  useBookings,
  useUpdateBookingStatus,
  type Booking,
} from "../lib/booking";
import { ApiError } from "../lib/api";

const WEEKDAYS_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function BookingPage() {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string>(dateKey(new Date()));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthStart = dateKey(new Date(year, month, 1));
  const monthEnd = dateKey(new Date(year, month + 1, 0));

  const { data: bookings } = useBookings(monthStart, monthEnd);
  const updateStatus = useUpdateBookingStatus();

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings ?? []) {
      if (!map.has(b.datum)) map.set(b.datum, []);
      map.get(b.datum)!.push(b);
    }
    return map;
  }, [bookings]);

  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const today = dateKey(new Date());
  const selectedBookings = bookingsByDay.get(selectedDate) ?? [];

  return (
    <div>
      <h1>Terminkalender</h1>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start", marginTop: 16 }}>
        <div className="card" style={{ flex: "1 1 420px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <button className="btn btn-secondary" onClick={() => setCursor(new Date(year, month - 1, 1))}>
              ‹
            </button>
            <strong>
              {MONTHS[month]} {year}
            </strong>
            <button className="btn btn-secondary" onClick={() => setCursor(new Date(year, month + 1, 1))}>
              ›
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, fontSize: 11, color: "var(--color-text-muted)", marginBottom: 4 }}>
            {WEEKDAYS_SHORT.map((w) => (
              <div key={w} style={{ textAlign: "center" }}>
                {w}
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const key = dateKey(d);
              const dayBookings = (bookingsByDay.get(key) ?? []).filter((b) => b.status === "bestaetigt");
              const isToday = key === today;
              const isSelected = key === selectedDate;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedDate(key)}
                  style={{
                    minHeight: 56,
                    borderRadius: 8,
                    border: isSelected ? "2px solid var(--color-primary)" : isToday ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                    padding: 4,
                    fontSize: 11,
                    textAlign: "left",
                    background: "var(--color-surface)",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ color: "var(--color-text-muted)" }}>{d.getDate()}</div>
                  {dayBookings.slice(0, 3).map((b) => (
                    <div
                      key={b.id}
                      style={{
                        marginTop: 2,
                        padding: "2px 4px",
                        borderRadius: 4,
                        background: "#ecfdf5",
                        color: "var(--color-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {b.startzeit} {b.name}
                    </div>
                  ))}
                  {dayBookings.length > 3 && (
                    <div style={{ color: "var(--color-text-muted)" }}>+{dayBookings.length - 3} weitere</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ flex: "1 1 280px" }}>
          <h3 style={{ marginBottom: 12 }}>Termine am {selectedDate.split("-").reverse().join(".")}</h3>
          {selectedBookings.length === 0 && <p style={{ color: "var(--color-text-muted)" }}>Keine Buchungen.</p>}
          {selectedBookings.map((b) => (
            <div key={b.id} className="card" style={{ marginBottom: 8, opacity: b.status === "storniert" ? 0.5 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>
                  {b.startzeit}–{b.endzeit} {b.name}
                </strong>
                {b.status === "storniert" && <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Storniert</span>}
              </div>
              <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                {b.plz} {b.ort}
                {b.telefon && <> · {b.telefon}</>}
                {b.email && <> · {b.email}</>}
              </div>
              {b.nachricht && <p style={{ fontSize: 12, marginTop: 4 }}>{b.nachricht}</p>}
              {b.status === "bestaetigt" ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ marginTop: 8, padding: "2px 8px" }}
                  onClick={() => updateStatus.mutate({ id: b.id, status: "storniert" })}
                >
                  Stornieren
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ marginTop: 8, padding: "2px 8px" }}
                  onClick={() => updateStatus.mutate({ id: b.id, status: "bestaetigt" })}
                >
                  Wiederherstellen
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start", marginTop: 24 }}>
        <AvailabilityRulesCard />
        <BlockedSlotsCard />
      </div>
    </div>
  );
}

function AvailabilityRulesCard() {
  const { data: rules } = useAvailabilityRules();
  const createRule = useCreateAvailabilityRule();
  const deleteRule = useDeleteAvailabilityRule();
  const [wochentag, setWochentag] = useState("1");
  const [startzeit, setStartzeit] = useState("08:00");
  const [endzeit, setEndzeit] = useState("17:00");
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createRule.mutateAsync({ wochentag: Number(wochentag), startzeit, endzeit });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Speichern fehlgeschlagen.");
    }
  }

  const sorted = [...(rules ?? [])].sort((a, b) => (a.wochentag || 7) - (b.wochentag || 7) || a.startzeit.localeCompare(b.startzeit));

  return (
    <div className="card" style={{ flex: "1 1 320px" }}>
      <h3 style={{ marginBottom: 12 }}>Wöchentliche Verfügbarkeit</h3>
      <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 12 }}>
        Wiederkehrende Zeitfenster, in denen grundsätzlich Termine gebucht werden können.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
        {sorted.length === 0 && <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}>Noch keine Zeitfenster hinterlegt.</p>}
        {sorted.map((r) => (
          <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
            <span>
              {WOCHENTAGE.find((w) => w.value === r.wochentag)?.label ?? r.wochentag} {r.startzeit}–{r.endzeit}
            </span>
            <button type="button" className="btn btn-secondary" style={{ padding: "2px 8px" }} onClick={() => deleteRule.mutate(r.id)}>
              Löschen
            </button>
          </div>
        ))}
      </div>
      <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="rule-wochentag">Wochentag</label>
          <select id="rule-wochentag" value={wochentag} onChange={(e) => setWochentag(e.target.value)}>
            {WOCHENTAGE.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="rule-start">Von</label>
          <input id="rule-start" type="time" value={startzeit} onChange={(e) => setStartzeit(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="rule-end">Bis</label>
          <input id="rule-end" type="time" value={endzeit} onChange={(e) => setEndzeit(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={createRule.isPending}>
          Hinzufügen
        </button>
      </form>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

function BlockedSlotsCard() {
  const today = dateKey(new Date());
  const { data: blocked } = useBlockedSlots(today);
  const createBlocked = useCreateBlockedSlot();
  const deleteBlocked = useDeleteBlockedSlot();
  const [datum, setDatum] = useState(today);
  const [startzeit, setStartzeit] = useState("");
  const [endzeit, setEndzeit] = useState("");
  const [grund, setGrund] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createBlocked.mutateAsync({ datum, startzeit: startzeit || undefined, endzeit: endzeit || undefined, grund: grund || undefined });
      setGrund("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Speichern fehlgeschlagen.");
    }
  }

  const sorted = [...(blocked ?? [])].sort((a, b) => a.datum.localeCompare(b.datum));

  return (
    <div className="card" style={{ flex: "1 1 320px" }}>
      <h3 style={{ marginBottom: 12 }}>Blockierte Termine/Tage</h3>
      <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 12 }}>
        Ausnahmen zur wöchentlichen Verfügbarkeit — z.B. Ferien oder bereits anderweitig verplante Zeit. Ohne
        Uhrzeit wird der ganze Tag blockiert.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
        {sorted.length === 0 && <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}>Keine anstehenden Blockierungen.</p>}
        {sorted.map((b) => (
          <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
            <span>
              {b.datum.split("-").reverse().join(".")}
              {b.startzeit && b.endzeit ? ` ${b.startzeit}–${b.endzeit}` : " (ganzer Tag)"}
              {b.grund ? ` — ${b.grund}` : ""}
            </span>
            <button type="button" className="btn btn-secondary" style={{ padding: "2px 8px" }} onClick={() => deleteBlocked.mutate(b.id)}>
              Löschen
            </button>
          </div>
        ))}
      </div>
      <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="blocked-datum">Datum</label>
          <input id="blocked-datum" type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="blocked-start">Von (optional)</label>
          <input id="blocked-start" type="time" value={startzeit} onChange={(e) => setStartzeit(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="blocked-end">Bis (optional)</label>
          <input id="blocked-end" type="time" value={endzeit} onChange={(e) => setEndzeit(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: 140 }}>
          <label htmlFor="blocked-grund">Grund (optional)</label>
          <input id="blocked-grund" value={grund} onChange={(e) => setGrund(e.target.value)} placeholder="z.B. Ferien" />
        </div>
        <button type="submit" className="btn btn-primary" disabled={createBlocked.isPending}>
          Hinzufügen
        </button>
      </form>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
