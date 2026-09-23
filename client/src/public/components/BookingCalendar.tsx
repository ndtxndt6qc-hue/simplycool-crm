import { useEffect, useMemo, useState, type FormEvent } from "react";
import { usePublicBookingSlots, useCreateBooking } from "../../lib/publicApi";
import { ApiError } from "../../lib/api";
import { usePageTextMap, getText } from "../../lib/pageTexts";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getUtmSource(): string | undefined {
  try {
    return new URLSearchParams(window.location.search).get("utm_source") || undefined;
  } catch {
    return undefined;
  }
}

export function BookingCalendar() {
  const texts = usePageTextMap();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthStart = dateKey(new Date(year, month, 1));
  const monthEnd = dateKey(new Date(year, month + 1, 0));

  const { data: slots, isLoading, refetch } = usePublicBookingSlots(monthStart, monthEnd);

  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const todayKey = dateKey(new Date());
  const isPastMonth = monthEnd < todayKey;

  const daySlots = selectedDate ? slots?.[selectedDate] ?? [] : [];

  return (
    <div className="public-booking">
      <div className="public-card public-booking-calendar">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={isPastMonth}
            onClick={() => setCursor(new Date(year, month - 1, 1))}
          >
            ‹
          </button>
          <strong>
            {MONTHS[month]} {year}
          </strong>
          <button type="button" className="btn btn-secondary" onClick={() => setCursor(new Date(year, month + 1, 1))}>
            ›
          </button>
        </div>
        <div className="public-booking-weekdays">
          {WEEKDAYS.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>
        <div className="public-booking-days">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const key = dateKey(d);
            const available = (slots?.[key]?.length ?? 0) > 0;
            const isSelected = key === selectedDate;
            return (
              <button
                key={i}
                type="button"
                disabled={!available}
                className={`public-booking-day${isSelected ? " selected" : ""}${available ? " available" : ""}`}
                onClick={() => {
                  setSelectedDate(key);
                  setSelectedSlot(null);
                }}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
        {isLoading && <p className="public-booking-hint">Lädt verfügbare Termine…</p>}
        {!isLoading && !isPastMonth && Object.keys(slots ?? {}).length === 0 && (
          <p className="public-booking-hint">{getText(texts, "termin.keine_termine_monat")}</p>
        )}
      </div>

      {selectedDate && (
        <div className="public-card public-booking-slots">
          <h3 style={{ marginBottom: 12 }}>Uhrzeit am {selectedDate.split("-").reverse().join(".")}</h3>
          {daySlots.length === 0 ? (
            <p className="public-booking-hint">{getText(texts, "termin.keine_termine_tag")}</p>
          ) : (
            <div className="public-booking-slot-grid">
              {daySlots.map((s) => (
                <button
                  key={s.start}
                  type="button"
                  className={`public-slot-btn${selectedSlot?.start === s.start ? " selected" : ""}`}
                  onClick={() => setSelectedSlot(s)}
                >
                  {s.start}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedDate && selectedSlot && (
        <BookingForm
          datum={selectedDate}
          slot={selectedSlot}
          onBooked={() => {
            refetch();
          }}
          onSlotTaken={() => {
            setSelectedSlot(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function BookingForm({
  datum,
  slot,
  onBooked,
  onSlotTaken,
}: {
  datum: string;
  slot: { start: string; end: string };
  onBooked: () => void;
  onSlotTaken: () => void;
}) {
  const texts = usePageTextMap();
  const [name, setName] = useState("");
  const [telefon, setTelefon] = useState("");
  const [email, setEmail] = useState("");
  const [plz, setPlz] = useState("");
  const [ort, setOrt] = useState("");
  const [nachricht, setNachricht] = useState("");
  const [firma, setFirma] = useState(""); // Honeypot
  const [quelle, setQuelle] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const createBooking = useCreateBooking();

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

    try {
      await createBooking.mutateAsync({
        name: name.trim(),
        telefon: telefon.trim() || undefined,
        email: email.trim() || undefined,
        plz: plz.trim(),
        ort: ort.trim(),
        nachricht: nachricht.trim() || undefined,
        quelle,
        firma,
        datum,
        startzeit: slot.start,
      });
      setDone(true);
      onBooked();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError(err.message);
        onSlotTaken();
        return;
      }
      setError(err instanceof ApiError ? err.message : "Buchung fehlgeschlagen. Bitte später erneut versuchen.");
    }
  }

  if (done) {
    return (
      <div className="public-card public-booking-form">
        <div className="public-form-success">
          <h3>{getText(texts, "termin.bestaetigt.titel")}</h3>
          <p>
            {datum.split("-").reverse().join(".")}, {slot.start}–{slot.end} Uhr. {getText(texts, "termin.bestaetigt.text")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form className="public-card public-booking-form" onSubmit={handleSubmit}>
      <h3 style={{ marginBottom: 4 }}>Termin buchen</h3>
      <p className="public-booking-hint" style={{ marginBottom: 16 }}>
        {datum.split("-").reverse().join(".")}, {slot.start}–{slot.end} Uhr
      </p>

      <div className="field">
        <label htmlFor="bk-name">Name *</label>
        <input id="bk-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="bk-telefon">Telefon</label>
          <input id="bk-telefon" type="tel" value={telefon} onChange={(e) => setTelefon(e.target.value)} placeholder="079 000 00 00" />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="bk-email">E-Mail</label>
          <input id="bk-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div className="field" style={{ width: 100 }}>
          <label htmlFor="bk-plz">PLZ *</label>
          <input id="bk-plz" value={plz} onChange={(e) => setPlz(e.target.value)} maxLength={4} required />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="bk-ort">Ort *</label>
          <input id="bk-ort" value={ort} onChange={(e) => setOrt(e.target.value)} required />
        </div>
      </div>
      <div className="field">
        <label htmlFor="bk-nachricht">Nachricht (optional)</label>
        <textarea id="bk-nachricht" rows={3} value={nachricht} onChange={(e) => setNachricht(e.target.value)} />
      </div>

      {/* Honeypot — für Menschen unsichtbar, Bots füllen es oft aus */}
      <div className="public-honeypot" aria-hidden="true">
        <label htmlFor="bk-firma">Firma</label>
        <input id="bk-firma" name="firma" tabIndex={-1} autoComplete="off" value={firma} onChange={(e) => setFirma(e.target.value)} />
      </div>

      {error && <p className="error-text">{error}</p>}

      <button type="submit" className="btn btn-primary" disabled={createBooking.isPending} style={{ width: "100%" }}>
        {createBooking.isPending ? "Wird gebucht…" : "Termin verbindlich buchen"}
      </button>
    </form>
  );
}
