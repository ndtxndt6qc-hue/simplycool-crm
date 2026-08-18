import { useState } from "react";
import { PARTNER_TYP_LABELS } from "../lib/labels";
import { useDevices, type Device } from "../lib/devices";
import { usePartners, type Partner } from "../lib/partners";
import { DeviceFormModal } from "../components/DeviceFormModal";
import { StockMovementModal } from "../components/StockMovementModal";
import { PartnerFormModal } from "../components/PartnerFormModal";

function formatChf(value: string | number) {
  return new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF" }).format(Number(value));
}

export function DevicesPage() {
  const [tab, setTab] = useState<"geraete" | "partner">("geraete");

  return (
    <div>
      <div className="page-header">
        <h1>Geräte & Lager</h1>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button
          className={`btn ${tab === "geraete" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setTab("geraete")}
        >
          Gerätekatalog & Lager
        </button>
        <button
          className={`btn ${tab === "partner" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setTab("partner")}
        >
          Partner
        </button>
      </div>

      {tab === "geraete" ? <DevicesTab /> : <PartnersTab />}
    </div>
  );
}

function DevicesTab() {
  const { data: devices, isLoading } = useDevices();
  const [editingDevice, setEditingDevice] = useState<Device | null | undefined>(undefined);
  const [stockDeviceId, setStockDeviceId] = useState<number | null>(null);
  const stockDevice = devices?.find((d) => d.id === stockDeviceId) ?? null;

  return (
    <div>
      <div className="section-header" style={{ marginTop: 0 }}>
        <h2>Gerätekatalog</h2>
        <button className="btn btn-secondary" onClick={() => setEditingDevice(null)}>
          + Neues Gerät
        </button>
      </div>

      {isLoading ? (
        <p style={{ color: "var(--color-text-muted)" }}>Lädt…</p>
      ) : !devices?.length ? (
        <div className="card">
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Noch keine Geräte im Katalog.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Gerät</th>
                <th>Leistung</th>
                <th>Einkauf</th>
                <th>Verkauf</th>
                <th>Bestand</th>
                <th>Verplant</th>
                <th>Verfügbar</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => {
                const belowMin = d.verfuegbar < d.mindestbestand;
                return (
                  <tr key={d.id} style={{ opacity: d.aktiv ? 1 : 0.5 }}>
                    <td>
                      <strong>
                        {d.hersteller} {d.modell}
                      </strong>
                      {!d.aktiv && (
                        <span className="badge badge-neutral" style={{ marginLeft: 8 }}>
                          Inaktiv
                        </span>
                      )}
                    </td>
                    <td>
                      {d.kuehlleistungKw ? `${d.kuehlleistungKw} kW kühlen` : ""}
                      {d.kuehlleistungKw && d.heizleistungKw ? " / " : ""}
                      {d.heizleistungKw ? `${d.heizleistungKw} kW heizen` : ""}
                    </td>
                    <td>{formatChf(d.einkaufspreis)}</td>
                    <td>{formatChf(d.empfVerkaufspreis)}</td>
                    <td>{d.lagerbestand}</td>
                    <td>{d.verplant}</td>
                    <td>
                      <span className={`badge ${belowMin ? "badge-danger" : "badge-success"}`}>{d.verfuegbar}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-secondary" onClick={() => setStockDeviceId(d.id)}>
                          Lager
                        </button>
                        <button className="btn btn-secondary" onClick={() => setEditingDevice(d)}>
                          Bearbeiten
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editingDevice !== undefined && (
        <DeviceFormModal device={editingDevice} onClose={() => setEditingDevice(undefined)} />
      )}
      {stockDevice && <StockMovementModal device={stockDevice} onClose={() => setStockDeviceId(null)} />}
    </div>
  );
}

function PartnersTab() {
  const { data: partners, isLoading } = usePartners();
  const [editingPartner, setEditingPartner] = useState<Partner | null | undefined>(undefined);

  return (
    <div>
      <div className="section-header" style={{ marginTop: 0 }}>
        <h2>Subunternehmer & Lieferanten</h2>
        <button className="btn btn-secondary" onClick={() => setEditingPartner(null)}>
          + Neuer Partner
        </button>
      </div>

      {isLoading ? (
        <p style={{ color: "var(--color-text-muted)" }}>Lädt…</p>
      ) : !partners?.length ? (
        <div className="card">
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Noch keine Partner erfasst.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Typ</th>
                <th>Kontakt</th>
                <th>Konditionen</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setEditingPartner(p)}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <strong>{p.name}</strong>
                    {p.kontaktName && <div style={{ color: "var(--color-text-muted)" }}>{p.kontaktName}</div>}
                  </td>
                  <td>
                    <span className="badge badge-neutral">{PARTNER_TYP_LABELS[p.typ]}</span>
                  </td>
                  <td>
                    {p.telefon && <div>{p.telefon}</div>}
                    {p.email && <div>{p.email}</div>}
                  </td>
                  <td>
                    {p.typ === "bohrpartner" && p.preisProBohrung ? `${formatChf(p.preisProBohrung)} / Bohrung` : ""}
                    {p.typ === "lieferant" && p.lieferzeitTage ? `${p.lieferzeitTage} Tage Lieferzeit` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingPartner !== undefined && (
        <PartnerFormModal partner={editingPartner} onClose={() => setEditingPartner(undefined)} />
      )}
    </div>
  );
}
