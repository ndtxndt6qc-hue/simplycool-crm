import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "./Modal";
import { splitLeadName, parseLeadAddress } from "../lib/parseLead";
import { useCustomer, useCreateCustomer } from "../lib/customers";
import { useProperties, useCreateProperty } from "../lib/properties";
import { useCreateQuote } from "../lib/quotes";
import type { Lead } from "../lib/leads";
import { KUNDEN_TYPEN, type KundenTyp } from "@klimainstall/shared";
import { KUNDEN_TYP_LABELS } from "../lib/labels";

export function CreateQuoteFromLeadModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const navigate = useNavigate();
  const { data: existingCustomer } = useCustomer(lead.customerId ?? undefined);
  const { data: existingProperties } = useProperties(lead.customerId ?? undefined);
  const createCustomer = useCreateCustomer();
  const createProperty = useCreateProperty();
  const createQuote = useCreateQuote();

  const nameGuess = splitLeadName(lead.name);
  const addressGuess = parseLeadAddress(lead.adresse);

  const [typ, setTyp] = useState<KundenTyp>("privat");
  const [vorname, setVorname] = useState(nameGuess.vorname);
  const [nachname, setNachname] = useState(nameGuess.nachname);
  const [custStrasse, setCustStrasse] = useState(addressGuess.strasse);
  const [custPlz, setCustPlz] = useState(addressGuess.plz);
  const [custOrt, setCustOrt] = useState(addressGuess.ort);

  const [existingPropertyId, setExistingPropertyId] = useState("");
  const [newProperty, setNewProperty] = useState(false);
  const [propStrasse, setPropStrasse] = useState(addressGuess.strasse);
  const [propPlz, setPropPlz] = useState(addressGuess.plz);
  const [propOrt, setPropOrt] = useState(addressGuess.ort);

  const [error, setError] = useState<string | null>(null);
  const saving = createCustomer.isPending || createProperty.isPending || createQuote.isPending;

  const hasExistingCustomer = Boolean(lead.customerId);
  const needsNewProperty = !hasExistingCustomer || newProperty || !existingProperties?.length;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      let customerId = lead.customerId ?? undefined;

      if (!customerId) {
        const customer = await createCustomer.mutateAsync({
          typ,
          vorname,
          nachname,
          strasse: custStrasse,
          plz: custPlz,
          ort: custOrt,
          telefon: lead.telefon ?? undefined,
          email: lead.email ?? undefined,
          notiz: lead.notiz ?? undefined,
          leadId: lead.id,
        });
        customerId = customer.id;
      }

      let propertyId: number;
      if (needsNewProperty) {
        const property = await createProperty.mutateAsync({
          customerId: customerId!,
          strasse: propStrasse,
          plz: propPlz,
          ort: propOrt,
        });
        propertyId = property.id;
      } else {
        propertyId = Number(existingPropertyId);
      }

      const quote = await createQuote.mutateAsync({ customerId: customerId!, propertyId, leadId: lead.id });
      onClose();
      navigate(`/angebote/${quote.id}`);
    } catch {
      setError("Erstellen fehlgeschlagen.");
    }
  }

  return (
    <Modal title={`Angebot aus Lead "${lead.name}"`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {hasExistingCustomer ? (
          <div className="field">
            <label>Kunde</label>
            <p style={{ margin: 0 }}>
              {existingCustomer
                ? `${existingCustomer.firma ? `${existingCustomer.firma} — ` : ""}${existingCustomer.vorname ?? ""} ${existingCustomer.nachname}`
                : "Lädt…"}
            </p>
          </div>
        ) : (
          <>
            <p style={{ color: "var(--color-text-muted)", marginTop: 0 }}>
              Aus den Lead-Daten vorausgefüllt — bitte prüfen und ergänzen.
            </p>
            <div className="field">
              <label htmlFor="cql-typ">Typ</label>
              <select id="cql-typ" value={typ} onChange={(e) => setTyp(e.target.value as KundenTyp)}>
                {KUNDEN_TYPEN.map((t) => (
                  <option key={t} value={t}>
                    {KUNDEN_TYP_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="cql-vorname">Vorname</label>
              <input id="cql-vorname" value={vorname} onChange={(e) => setVorname(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="cql-nachname">Nachname</label>
              <input id="cql-nachname" value={nachname} onChange={(e) => setNachname(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="cql-strasse">Strasse</label>
              <input id="cql-strasse" value={custStrasse} onChange={(e) => setCustStrasse(e.target.value)} required />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="cql-plz">PLZ</label>
                <input id="cql-plz" value={custPlz} onChange={(e) => setCustPlz(e.target.value)} required />
              </div>
              <div className="field" style={{ flex: 2 }}>
                <label htmlFor="cql-ort">Ort</label>
                <input id="cql-ort" value={custOrt} onChange={(e) => setCustOrt(e.target.value)} required />
              </div>
            </div>
          </>
        )}

        {hasExistingCustomer && existingProperties?.length ? (
          <div className="field">
            <label htmlFor="cql-property">Liegenschaft</label>
            <select
              id="cql-property"
              value={newProperty ? "new" : existingPropertyId}
              onChange={(e) => {
                if (e.target.value === "new") {
                  setNewProperty(true);
                } else {
                  setNewProperty(false);
                  setExistingPropertyId(e.target.value);
                }
              }}
            >
              <option value="">— auswählen —</option>
              {existingProperties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.strasse}, {p.plz} {p.ort}
                </option>
              ))}
              <option value="new">+ Neue Liegenschaft</option>
            </select>
          </div>
        ) : null}

        {needsNewProperty && (
          <>
            <div className="field">
              <label htmlFor="cql-prop-strasse">Liegenschaft — Strasse</label>
              <input id="cql-prop-strasse" value={propStrasse} onChange={(e) => setPropStrasse(e.target.value)} required />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="cql-prop-plz">PLZ</label>
                <input id="cql-prop-plz" value={propPlz} onChange={(e) => setPropPlz(e.target.value)} required />
              </div>
              <div className="field" style={{ flex: 2 }}>
                <label htmlFor="cql-prop-ort">Ort</label>
                <input id="cql-prop-ort" value={propOrt} onChange={(e) => setPropOrt(e.target.value)} required />
              </div>
            </div>
          </>
        )}

        {error && <p className="error-text">{error}</p>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Abbrechen
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving || (!needsNewProperty && !existingPropertyId)}
          >
            {saving ? "Erstellen…" : "Angebot erstellen"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
