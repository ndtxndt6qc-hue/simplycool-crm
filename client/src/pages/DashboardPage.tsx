import { Link } from "react-router-dom";
import { formatChf } from "../lib/format";
import { useDashboard, type DashboardData } from "../lib/dashboard";
import { RevenueChart } from "../components/RevenueChart";

function KpiTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 200 }}>
      <div style={{ fontSize: 12, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function HeuteCard({ title, count, emptyText, children }: { title: string; count: number; emptyText: string; children?: React.ReactNode }) {
  return (
    <div className="card" style={{ flex: "1 1 270px", minWidth: 260 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>{title}</h3>
        {count > 0 && (
          <span style={{ background: "var(--color-primary)", color: "#fff", borderRadius: 999, padding: "1px 9px", fontSize: 12, fontWeight: 700 }}>
            {count}
          </span>
        )}
      </div>
      {count === 0 ? (
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>{emptyText}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
      )}
    </div>
  );
}

function zeitCh(iso: string): string {
  return new Intl.DateTimeFormat("de-CH", { timeZone: "Europe/Zurich", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function datumCh(value: string): string {
  return new Intl.DateTimeFormat("de-CH").format(new Date(value));
}

type TagesTermin = { zeit: string; label: string; subtitle: string; link: string };

function buildTagesTermine(heute: DashboardData["heute"]): TagesTermin[] {
  const auftragsTermine: TagesTermin[] = heute.termine
    .filter((t) => t.uhrzeit)
    .map((t) => ({
      zeit: zeitCh(t.uhrzeit!),
      label: `${t.art === "installation" ? "Installation" : "Kernbohrung"} — ${t.auftragsnummer}`,
      subtitle: `${t.kunde} · ${t.ort}`,
      link: `/app/auftraege/${t.orderId}`,
    }));
  const beratungsTermine: TagesTermin[] = heute.beratungstermine.map((b) => ({
    zeit: b.startzeit,
    label: "Beratungstermin",
    subtitle: `${b.name} · ${b.ort}`,
    link: "/app/termine",
  }));
  return [...auftragsTermine, ...beratungsTermine].sort((a, b) => a.zeit.localeCompare(b.zeit));
}

export function DashboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return <p style={{ color: "var(--color-text-muted)" }}>Lädt…</p>;
  }

  const tagesTermine = buildTagesTermine(data.heute);

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <h2 style={{ fontSize: 16, marginBottom: 12 }}>Heute</h2>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
        <HeuteCard title="Termine" count={tagesTermine.length} emptyText="Keine Termine heute.">
          {tagesTermine.map((t, idx) => (
            <Link key={idx} to={t.link} style={{ display: "block", fontSize: 13, color: "var(--color-text)", textDecoration: "none" }}>
              <strong>{t.zeit}</strong> — {t.label}
              <div style={{ color: "var(--color-text-muted)", fontSize: 12 }}>{t.subtitle}</div>
            </Link>
          ))}
        </HeuteCard>

        <HeuteCard
          title="Angebote laufen bald ab"
          count={data.heute.angeboteBaldAblaufend.length}
          emptyText="Keine Angebote laufen in den nächsten 3 Tagen ab."
        >
          {data.heute.angeboteBaldAblaufend.map((q) => (
            <Link key={q.quoteId} to={`/app/angebote/${q.quoteId}`} style={{ display: "block", fontSize: 13, color: "var(--color-text)", textDecoration: "none" }}>
              <strong>{q.angebotsnummer}</strong> — {q.kunde}
              <div style={{ color: q.abgelaufen ? "var(--color-danger)" : "var(--color-text-muted)", fontSize: 12 }}>
                {q.abgelaufen ? `Abgelaufen seit ${datumCh(q.gueltigBis)}` : `Gültig bis ${datumCh(q.gueltigBis)}`}
              </div>
            </Link>
          ))}
        </HeuteCard>

        <HeuteCard
          title="Leads ohne Kontakt"
          count={data.heute.leadsOhneKontakt.length}
          emptyText="Alle neuen Leads wurden kontaktiert."
        >
          {data.heute.leadsOhneKontakt.map((l) => (
            <Link key={l.leadId} to="/app/leads" style={{ display: "block", fontSize: 13, color: "var(--color-text)", textDecoration: "none" }}>
              <strong>{l.name}</strong> {l.ort ? `— ${l.ort}` : ""}
              <div style={{ color: "var(--color-text-muted)", fontSize: 12 }}>
                Seit {datumCh(l.seit)} · {l.telefon || l.email || "keine Kontaktangabe"}
              </div>
            </Link>
          ))}
        </HeuteCard>

        <HeuteCard
          title="Überfällige Rechnungen"
          count={data.heute.ueberfaelligeRechnungen.length}
          emptyText="Keine überfälligen Rechnungen."
        >
          {data.heute.ueberfaelligeRechnungen.map((r) => (
            <Link key={r.invoiceId} to={`/app/rechnungen/${r.invoiceId}`} style={{ display: "block", fontSize: 13, color: "var(--color-text)", textDecoration: "none" }}>
              <strong>{r.rechnungsnummer}</strong> — {r.kunde}
              <div style={{ color: "var(--color-danger)", fontSize: 12 }}>
                Fällig seit {datumCh(r.faelligkeitsdatum)} · {formatChf(r.offenerBetrag)}
              </div>
            </Link>
          ))}
        </HeuteCard>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <KpiTile
          label="Offene Angebote"
          value={String(data.offeneAngebote.anzahl)}
          sub={formatChf(data.offeneAngebote.volumen)}
        />
        <KpiTile label="Laufende Aufträge" value={String(data.laufendeAuftraege)} />
        <KpiTile
          label="Offene Rechnungen"
          value={String(data.offeneRechnungen.anzahl)}
          sub={formatChf(data.offeneRechnungen.volumen)}
        />
        <KpiTile label="Ø Marge pro Auftrag" value={formatChf(data.durchschnittlicheMargeProAuftrag)} />
      </div>

      <RevenueChart data={data.umsatzProMonat} />
    </div>
  );
}
