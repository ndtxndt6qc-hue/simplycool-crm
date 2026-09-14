import { useEffect, useState, type FormEvent } from "react";
import { QUOTE_ITEM_TYPEN, RABATT_TYPEN, type QuoteItemTyp, type RabattTyp } from "@klimainstall/shared";
import { QUOTE_ITEM_TYP_LABELS } from "../lib/labels";
import { useDevices } from "../lib/devices";
import { usePartners } from "../lib/partners";
import { useSettings } from "../lib/settings";
import { useAddQuoteItem, type QuoteItemInput } from "../lib/quotes";

const RABATT_TYP_LABELS: Record<RabattTyp, string> = { prozent: "Prozent (%)", betrag: "Betrag (CHF)" };

export function QuoteItemForm({ quoteId, nettoSumme }: { quoteId: number; nettoSumme: number }) {
  const [typ, setTyp] = useState<QuoteItemTyp>("geraet");
  const [deviceId, setDeviceId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [kernbohrungVariante, setKernbohrungVariante] = useState<"2loch" | "3loch">("2loch");
  const [beschreibung, setBeschreibung] = useState("");
  const [menge, setMenge] = useState("1");
  const [einzelpreis, setEinzelpreis] = useState("");
  const [einkaufspreisIntern, setEinkaufspreisIntern] = useState("0");
  const [optional, setOptional] = useState(false);
  const [rabattTyp, setRabattTyp] = useState<RabattTyp>("prozent");
  const [rabattWert, setRabattWert] = useState("");

  const { data: devices } = useDevices();
  const { data: bohrpartner } = usePartners("bohrpartner");
  const { data: settings } = useSettings();
  const addItem = useAddQuoteItem(quoteId);

  const aktiveDevices = devices?.filter((d) => d.aktiv);

  useEffect(() => {
    if (typ === "geraet") {
      setBeschreibung("");
    } else if (typ === "kernbohrung") {
      setBeschreibung("Kernbohrung (2-Loch)");
      setKernbohrungVariante("2loch");
    } else if (typ === "montage") {
      setBeschreibung("Montage/Arbeitszeit");
    } else if (typ === "fahrt_material") {
      setBeschreibung("Fahrt/Kleinmaterial");
    } else if (typ === "rabatt") {
      setBeschreibung("Rabatt");
    } else {
      setBeschreibung("");
    }
    setDeviceId("");
    setPartnerId("");
    setEinzelpreis("");
    setEinkaufspreisIntern(typ === "montage" && settings ? Number(settings.stundensatz).toFixed(2) : "0");
    setMenge("1");
    setRabattWert("");
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
    applyPartnerPreis(id, kernbohrungVariante);
  }

  function handleVarianteChange(variante: "2loch" | "3loch") {
    setKernbohrungVariante(variante);
    setBeschreibung(variante === "3loch" ? "Kernbohrung (3-Loch)" : "Kernbohrung (2-Loch)");
    applyPartnerPreis(partnerId, variante);
  }

  function applyPartnerPreis(id: string, variante: "2loch" | "3loch") {
    const partner = bohrpartner?.find((p) => String(p.id) === id);
    const preis = variante === "3loch" ? partner?.preisPro3Loch : partner?.preisProBohrung;
    if (preis) {
      setEinkaufspreisIntern(Number(preis).toFixed(2));
    }
  }

  function handleMengeChange(value: string) {
    setMenge(value);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const rabattBetrag =
      rabattTyp === "prozent" ? (nettoSumme * Number(rabattWert || 0)) / 100 : Number(rabattWert || 0);
    const input: QuoteItemInput = {
      typ,
      deviceId: typ === "geraet" && deviceId ? Number(deviceId) : undefined,
      beschreibung,
      menge: typ === "rabatt" ? 1 : Number(menge),
      einzelpreis: typ === "rabatt" ? -Math.abs(rabattBetrag) : Number(einzelpreis || 0),
      einkaufspreisIntern: typ === "rabatt" ? 0 : Number(einkaufspreisIntern || 0),
      optional,
    };
    await addItem.mutateAsync(input);
    setBeschreibung(typ === "sonderposition" ? "" : beschreibung);
    setMenge("1");
    setEinzelpreis("");
    setEinkaufspreisIntern("0");
    setRabattWert("");
    setOptional(false);
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
          <>
            <div className="field" style={{ minWidth: 140 }}>
              <label htmlFor="item-variante">Variante</label>
              <select
                id="item-variante"
                value={kernbohrungVariante}
                onChange={(e) => handleVarianteChange(e.target.value as "2loch" | "3loch")}
              >
                <option value="2loch">2-Loch</option>
                <option value="3loch">3-Loch</option>
              </select>
            </div>
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
          </>
        )}

        {(typ === "fahrt_material" || typ === "sonderposition" || typ === "gemeindeabklaerung" || typ === "rabatt") && (
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

        {typ === "rabatt" ? (
          <>
            <div className="field" style={{ minWidth: 140 }}>
              <label htmlFor="item-rabatt-typ">Rabatt-Typ</label>
              <select id="item-rabatt-typ" value={rabattTyp} onChange={(e) => setRabattTyp(e.target.value as RabattTyp)}>
                {RABATT_TYPEN.map((t) => (
                  <option key={t} value={t}>
                    {RABATT_TYP_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ width: 140 }}>
              <label htmlFor="item-rabatt-wert">Wert</label>
              <input
                id="item-rabatt-wert"
                type="number"
                step="0.01"
                min="0"
                value={rabattWert}
                onChange={(e) => setRabattWert(e.target.value)}
                required
              />
            </div>
            {rabattWert && (
              <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 8, color: "var(--color-text-muted)", fontSize: 12 }}>
                = -CHF{" "}
                {(rabattTyp === "prozent" ? (nettoSumme * Number(rabattWert)) / 100 : Number(rabattWert)).toFixed(2)}
              </div>
            )}
          </>
        ) : (
          <>
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
          </>
        )}

        <div className="field" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 6, width: 90 }}>
          <input id="item-optional" type="checkbox" checked={optional} onChange={(e) => setOptional(e.target.checked)} />
          <label htmlFor="item-optional" style={{ margin: 0 }}>
            Optional
          </label>
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
