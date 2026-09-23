// Minimaler ICS-Generator (RFC 5545) für Terminbuchungen. Nutzt TZID=Europe/Zurich mit
// eingebettetem VTIMEZONE-Block statt UTC-Zeiten zu berechnen — so ist die Uhrzeit im
// Kalender des Empfängers immer korrekt, unabhängig davon, in welcher Zeitzone der
// Server selbst läuft (z.B. UTC in einem Docker-Container).

const VTIMEZONE_EUROPE_ZURICH = `BEGIN:VTIMEZONE
TZID:Europe/Zurich
BEGIN:DAYLIGHT
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
TZNAME:CEST
DTSTART:19700329T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
TZNAME:CET
DTSTART:19701025T030000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
END:VTIMEZONE`;

function foldLine(line: string): string {
  // RFC 5545 verlangt einen Zeilenumbruch nach spätestens 75 Oktetten, Fortsetzung mit einem Leerzeichen eingerückt.
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    parts.push(rest.slice(0, 75));
    rest = " " + rest.slice(75);
  }
  parts.push(rest);
  return parts.join("\r\n");
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function localDateTimeIcs(datum: string, zeit: string): string {
  // datum: "YYYY-MM-DD", zeit: "HH:MM" -> "YYYYMMDDTHHMMSS" (floating, an TZID gebunden)
  const [y, m, d] = datum.split("-");
  const [h, min] = zeit.split(":");
  return `${y}${m}${d}T${h}${min}00`;
}

export function buildIcsEvent(params: {
  uid: string;
  summary: string;
  description: string;
  location?: string;
  datum: string;
  startzeit: string;
  endzeit: string;
  organizerEmail?: string;
  organizerName?: string;
}): string {
  const now = new Date();
  const dtstamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}T${String(
    now.getUTCHours()
  ).padStart(2, "0")}${String(now.getUTCMinutes()).padStart(2, "0")}${String(now.getUTCSeconds()).padStart(2, "0")}Z`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SimplyCool//Terminbuchung//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...VTIMEZONE_EUROPE_ZURICH.split("\n"),
    "BEGIN:VEVENT",
    `UID:${params.uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;TZID=Europe/Zurich:${localDateTimeIcs(params.datum, params.startzeit)}`,
    `DTEND;TZID=Europe/Zurich:${localDateTimeIcs(params.datum, params.endzeit)}`,
    `SUMMARY:${escapeIcsText(params.summary)}`,
    `DESCRIPTION:${escapeIcsText(params.description)}`,
    ...(params.location ? [`LOCATION:${escapeIcsText(params.location)}`] : []),
    ...(params.organizerEmail
      ? [`ORGANIZER;CN=${escapeIcsText(params.organizerName ?? params.organizerEmail)}:mailto:${params.organizerEmail}`]
      : []),
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.map(foldLine).join("\r\n") + "\r\n";
}
