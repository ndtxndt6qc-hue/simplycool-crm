export function splitLeadName(name: string): { vorname: string; nachname: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return { vorname: "", nachname: name.trim() };
  return { vorname: parts.slice(0, -1).join(" "), nachname: parts[parts.length - 1] };
}

export function parseLeadAddress(adresse: string | null): { strasse: string; plz: string; ort: string } {
  if (!adresse) return { strasse: "", plz: "", ort: "" };
  const parts = adresse.split(",").map((p) => p.trim());
  const strasse = parts[0] ?? "";
  const rest = parts[1] ?? "";
  const match = rest.match(/^(\d{4})\s+(.+)$/);
  if (match) return { strasse, plz: match[1], ort: match[2] };
  return { strasse, plz: "", ort: rest };
}
