import { useEffect, useState, type FormEvent } from "react";
import { QUOTE_ITEM_TYPEN, type QuoteItemTyp } from "@klimainstall/shared";
import { QUOTE_ITEM_TYP_LABELS } from "../lib/labels";
import { useDevices } from "../lib/devices";
import { usePartners } from "../lib/partners";
import { useSettings } from "../lib/settings";
import { useAddQuoteItem, type QuoteItemInput } from "../lib/quotes";

export function QuoteItemForm({ quoteId }: { quoteId: number }) {
  const [typ, setTyp] = useState<QuoteItemTyp>("geraet");
  const [deviceId, setDeviceId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [menge, setMenge] = useState("1");
  const [einzelpreis, setEinzelpreis] = useState("");
  const [einkaufspreisIntern, setEinkaufspreisIntern] = useState("0");

  const { data: devices } = useDevices();
  const { data: bohrpartner } = usePartners("bohrpartner");
  const { data: settings } = useSettings();
  const addItem = useAddQuoteItem(quoteId);

  const aktiveDevices = devices?.filter((d) => d.aktiv);

  useEffect(() => {
    if (typ === "geraet") {
      setBeschreibung("");
    } else if (typ === "kernbohrung") {
      setBeschreibung("Kernbohrung");
    } else if (typ === "montage") {
      setBeschreibung("Montage/Arbeitszeit");
    } else if (typ === "fahrt_material") {
      setBeschreibung("Fahrt/Kleinmaterial");
    } else {
      setBeschreibung("");
    }
    setDeviceId("");
    setPartnerId("");
    setEinzelpreis("");
    setEinkaufspreisIntern(typ === "montage" && settings ? Number(settings.stundensatz).toFixed(2) : "0");
    setMenge("1");
  }, [typ]);

  function handleDeviceChange(id: string) {
    setDeviceId(id);
    const device = aktiveDevices?.find((d) => String(d.id) === id);
    if (device) {
      setBeschreibung(`${device.hersteller} ${device.modell}`);
      setEinzelpreis(device.empfVerkaufspreis);
      setEinkaufspreisIntern(Number(device.einkaufspreis).toFixed(2));
    }
  }

  function handlePartnerChange(id: string) {
    setPartnerId(id);
    const partner = bohrpartner?.find((p) => String(p.id) === id);
    if (partner?.preisProBohrung) {
      setEinkaufspreisIntern(Number(partner.preisProBohrung).toFixed(2));
    }
  }

  function handleMengeChange(value: string) {
    setMenge(value);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const input: QuoteItemInput = {
      typ,
      deviceId: typ === "geraet" && deviceId ? Number(deviceId) : undefined,
      beschreibung,
      menge: Number(menge),
      einzelpreis: Number(einzelpreis || 0),
      einkaufspreisIntern: Number(einkaufspreisIntern || 0),
    };
    await addItem.mutateAsync(input);
    setBeschreibung(typ === "sonderposition" ? "" : beschreibung);
    setMenge("1");
    setEinzelpreis("");
    setEinkaufspreisIntern("0");
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ marginTop: 12 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div className="field" style={{ minWidth: 160 }}>
          <label htmlFor="item-typ">Art</label>
          <select id="item-typ" value={typ} onChange={(e) => setTyp(e.target.value as QuoteItemTyp)}>
            {QUOTE_ITEM_TYPEN.map((t) => (
              <option key={t} value={t}>
                {QUOTE_ITEM_TYP_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        {typ === "geraet" && (
          <div className="field" style={{ minWidth: 220 }}>
            <label htmlFor="item-device">Gerät</label>
            <select id="item-device" value={deviceId} onChange={(e) => handleDeviceChange(e.target.value)} required>
              <option value="">— auswählen —</option>
              {aktiveDevices?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.hersteller} {d.modell} (verfügbar: {d.verfuegbar})
                </option>
              ))}
            </select>
          </div>
        )}

        {typ === "kernbohrung" && (
          <div className="field" style={{ minWidth: 200 }}>
            <label htmlFor="item-partner">Bohrpartner (optional)</label>
            <select id="item-partner" value={partnerId} onChange={(e) => handlePartnerChange(e.target.value)}>
              <option value="">— keiner —</option>
              {bohrpartner?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {(typ === "fahrt_material" || typ === "sonderposition") && (
          <div className="field" style={{ flex: 1, minWidth: 200 }}>
            <label htmlFor="item-beschreibung">Beschreibung</label>
            <input
              id="item-beschreibung"
              value={beschreibung}
              onChange={(e) => setBeschreibung(e.target.value)}
              required
            />
          </div>
        )}

        <div className="field" style={{ width: 100 }}>
          <label htmlFor="item-menge">{typ === "montage" ? "Stunden" : "Menge"}</label>
          <input
            id="item-menge"
            type="number"
            step={typ === "montage" ? "0.25" : "1"}
            min="0"
            value={menge}
            onChange={(e) => handleMengeChange(e.target.value)}
            required
          />
        </div>

        <div className="field" style={{ width: 140 }}>
          <label htmlFor="item-einzelpreis">Verkaufspreis (CHF/Einheit)</label>
          <input
            id="item-einzelpreis"
            type="number"
            step="0.01"
            value={einzelpreis}
            onChange={(e) => setEinzelpreis(e.target.value)}
            required
          />
        </div>

        <div className="field" style={{ width: 140 }}>
          <label htmlFor="item-kosten">Kosten intern (CHF/Einheit)</label>
          <input
            id="item-kosten"
            type="number"
            step="0.01"
            value={einkaufspreisIntern}
            onChange={(e) => setEinkaufspreisIntern(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button type="submit" className="btn btn-primary" disabled={addItem.isPending}>
            {addItem.isPending ? "Hinzufügen…" : "+ Position"}
          </button>
        </div>
      </div>
    </form>
  );
}
