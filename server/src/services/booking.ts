// Berechnet freie Terminslots aus wiederkehrenden Wochenregeln, Tages-Ausnahmen und bereits
// bestehenden Buchungen. Reine Funktion (keine DB-Zugriffe), damit sie unabhängig testbar ist —
// die aufrufende Route lädt Regeln/Ausnahmen/Buchungen und übergibt sie hier rein.

export type TimeRange = { start: string; end: string }; // "HH:MM"

type AvailabilityRule = { wochentag: number; startzeit: string; endzeit: string; aktiv: boolean };
type BlockedSlot = { datum: string; startzeit: string | null; endzeit: string | null };
type ExistingBooking = { datum: string; startzeit: string; endzeit: string };

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(min: number): string {
  const h = Math.floor(min / 60)
    .toString()
    .padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function subtractRange(windows: TimeRange[], blocked: TimeRange): TimeRange[] {
  const bs = timeToMinutes(blocked.start);
  const be = timeToMinutes(blocked.end);
  const result: TimeRange[] = [];
  for (const w of windows) {
    const ws = timeToMinutes(w.start);
    const we = timeToMinutes(w.end);
    if (be <= ws || bs >= we) {
      result.push(w);
      continue;
    }
    if (bs > ws) result.push({ start: w.start, end: minutesToTime(bs) });
    if (be < we) result.push({ start: minutesToTime(be), end: w.end });
  }
  return result.filter((r) => timeToMinutes(r.end) > timeToMinutes(r.start));
}

// Aktuelles Datum/Uhrzeit in Europe/Zurich — unabhängig davon, in welcher Zeitzone der
// Node-Prozess selbst läuft (z.B. UTC in Docker).
export function zurichNow(): { datum: string; minuten: number } {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zurich",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  return { datum: `${parts.year}-${parts.month}-${parts.day}`, minuten: Number(parts.hour) * 60 + Number(parts.minute) };
}

function eachDate(von: string, bis: string): string[] {
  const [vy, vm, vd] = von.split("-").map(Number);
  const [by, bm, bd] = bis.split("-").map(Number);
  const start = Date.UTC(vy, vm - 1, vd);
  const end = Date.UTC(by, bm - 1, bd);
  const dates: string[] = [];
  for (let t = start; t <= end; t += 24 * 60 * 60 * 1000) {
    const d = new Date(t);
    dates.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`);
  }
  return dates;
}

function weekdayOf(datum: string): number {
  const [y, m, d] = datum.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

const BUFFER_MINUTEN = 120; // Termine erst ab X Minuten in der Zukunft buchbar (Vorlaufzeit)

export function computeAvailableSlots(params: {
  rules: AvailabilityRule[];
  blocked: BlockedSlot[];
  booked: ExistingBooking[];
  von: string;
  bis: string;
  durationMinutes: number;
}): Record<string, TimeRange[]> {
  const { rules, blocked, booked, von, bis, durationMinutes } = params;
  const now = zurichNow();
  const result: Record<string, TimeRange[]> = {};

  for (const datum of eachDate(von, bis)) {
    if (datum < now.datum) continue;

    const wochentag = weekdayOf(datum);
    let windows: TimeRange[] = rules
      .filter((r) => r.aktiv && r.wochentag === wochentag)
      .map((r) => ({ start: r.startzeit, end: r.endzeit }));

    for (const b of blocked.filter((b) => b.datum === datum)) {
      if (!b.startzeit || !b.endzeit) {
        windows = [];
        break;
      }
      windows = subtractRange(windows, { start: b.startzeit, end: b.endzeit });
    }

    for (const bk of booked.filter((bk) => bk.datum === datum)) {
      windows = subtractRange(windows, { start: bk.startzeit, end: bk.endzeit });
    }

    const slots: TimeRange[] = [];
    for (const w of windows) {
      let cursor = timeToMinutes(w.start);
      const wEnd = timeToMinutes(w.end);
      while (cursor + durationMinutes <= wEnd) {
        if (datum > now.datum || cursor >= now.minuten + BUFFER_MINUTEN) {
          slots.push({ start: minutesToTime(cursor), end: minutesToTime(cursor + durationMinutes) });
        }
        cursor += durationMinutes;
      }
    }
    if (slots.length) result[datum] = slots;
  }

  return result;
}
