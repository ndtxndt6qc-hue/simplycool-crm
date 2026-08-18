import { useState, type FormEvent } from "react";
import { Modal } from "./Modal";
import { usePartners } from "../lib/partners";
import { KAELTEMITTEL_OPTIONEN } from "../lib/labels";
import { useCreateDevice, useUpdateDevice, useUploadDeviceImage, type Device } from "../lib/devices";

export function DeviceFormModal({ device, onClose }: { device: Device | null; onClose: () => void }) {
  const { data: lieferanten } = usePartners("lieferant");
  const [hersteller, setHersteller] = useState(device?.hersteller ?? "");
  const [modell, setModell] = useState(device?.modell ?? "");
  const [kuehlleistungKw, setKuehlleistungKw] = useState(device?.kuehlleistungKw ?? "");
  const [heizleistungKw, setHeizleistungKw] = useState(device?.heizleistungKw ?? "");
  const [kaeltemittel, setKaeltemittel] = useState(device?.kaeltemittel ?? "");
  const [einkaufspreis, setEinkaufspreis] = useState(device?.einkaufspreis ?? "");
  const [empfVerkaufspreis, setEmpfVerkaufspreis] = useState(device?.empfVerkaufspreis ?? "");
  const [lieferantId, setLieferantId] = useState(device?.lieferantId ? String(device.lieferantId) : "");
  const [mindestbestand, setMindestbestand] = useState(String(device?.mindestbestand ?? 0));
  const [notiz, setNotiz] = useState(device?.notiz ?? "");
  const [error, setError] = useState<string | null>(null);

  const createDevice = useCreateDevice();
  const updateDevice = useUpdateDevice();
  const uploadImage = useUploadDeviceImage(device?.id ?? 0);
  const saving = createDevice.isPending || updateDevice.isPending;

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await uploadImage.mutateAsync(file);
    e.target.value = "";
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const input = {
      hersteller,
      modell,
      kuehlleistungKw: kuehlleistungKw ? Number(kuehlleistungKw) : undefined,
      heizleistungKw: heizleistungKw ? Number(heizleistungKw) : undefined,
      kaeltemittel,
      einkaufspreis: Number(einkaufspreis),
      empfVerkaufspreis: Number(empfVerkaufspreis),
      lieferantId: lieferantId ? Number(lieferantId) : undefined,
      mindestbestand: Number(mindestbestand),
      notiz,
    };
    try {
      if (device) {
        await updateDevice.mutateAsync({ id: device.id, ...input });
      } else {
        await createDevice.mutateAsync(input);
      }
      onClose();
    } catch {
      setError("Speichern fehlgeschlagen.");
    }
  }

  async function handleToggleAktiv() {
    if (!device) return;
    await updateDevice.mutateAsync({ id: device.id, aktiv: !device.aktiv });
    onClose();
  }

  return (
    <Modal title={device ? "Gerät bearbeiten" : "Neues Gerät"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="device-hersteller">Hersteller</label>
          <input id="device-hersteller" value={hersteller} onChange={(e) => setHersteller(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="device-modell">Modell</label>
          <input id="device-modell" value={modell} onChange={(e) => setModell(e.target.value)} required />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="device-kuehl">Kühlleistung (kW)</label>
            <input
              id="device-kuehl"
              type="number"
              step="0.1"
              value={kuehlleistungKw}
              onChange={(e) => setKuehlleistungKw(e.target.value)}
            />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="device-heiz">Heizleistung (kW)</label>
            <input
              id="device-heiz"
              type="number"
              step="0.1"
              value={heizleistungKw}
              onChange={(e) => setHeizleistungKw(e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="device-kaeltemittel">Kältemittel</label>
          <select id="device-kaeltemittel" value={kaeltemittel} onChange={(e) => setKaeltemittel(e.target.value)}>
            <option value="">— auswählen —</option>
            {KAELTEMITTEL_OPTIONEN.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
            {kaeltemittel && !KAELTEMITTEL_OPTIONEN.includes(kaeltemittel as (typeof KAELTEMITTEL_OPTIONEN)[number]) && (
              <option value={kaeltemittel}>{kaeltemittel}</option>
            )}
          </select>
        </div>
        {device && (
          <div className="field">
            <label htmlFor="device-bild">Gerätebild</label>
            {device.bildPfad && (
              <img src={device.bildPfad} alt={`${device.hersteller} ${device.modell}`} style={{ maxHeight: 100, marginBottom: 8, borderRadius: 8 }} />
            )}
            <input id="device-bild" type="file" accept="image/*" onChange={handleImageChange} />
          </div>
        )}
        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="device-einkauf">Einkaufspreis (CHF)</label>
            <input
              id="device-einkauf"
              type="number"
              step="0.01"
              value={einkaufspreis}
              onChange={(e) => setEinkaufspreis(e.target.value)}
              required
            />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="device-verkauf">Verkaufspreis (CHF)</label>
            <input
              id="device-verkauf"
              type="number"
              step="0.01"
              value={empfVerkaufspreis}
              onChange={(e) => setEmpfVerkaufspreis(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="device-lieferant">Lieferant</label>
          <select id="device-lieferant" value={lieferantId} onChange={(e) => setLieferantId(e.target.value)}>
            <option value="">— keiner —</option>
            {lieferanten?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="device-mindestbestand">Mindestbestand</label>
          <input
            id="device-mindestbestand"
            type="number"
            min="0"
            value={mindestbestand}
            onChange={(e) => setMindestbestand(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="device-notiz">Notiz</label>
          <textarea id="device-notiz" rows={2} value={notiz} onChange={(e) => setNotiz(e.target.value)} />
        </div>

        {error && <p className="error-text">{error}</p>}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 8 }}>
          <div>
            {device && (
              <button type="button" className="btn btn-secondary" onClick={handleToggleAktiv}>
                {device.aktiv ? "Deaktivieren" : "Aktivieren"}
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Speichern…" : "Speichern"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
