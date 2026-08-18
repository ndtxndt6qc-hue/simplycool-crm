import { formatChf } from "../lib/format";
import { useDashboard } from "../lib/dashboard";
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

export function DashboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return <p style={{ color: "var(--color-text-muted)" }}>Lädt…</p>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
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
