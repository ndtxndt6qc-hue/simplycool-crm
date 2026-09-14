import type { PublicReferenz } from "../../lib/publicApi";

export type PlatzhalterReferenz = {
  id: string;
  ort: string;
  anzahlGeraete: number;
  beschreibung: string;
};

export const PLATZHALTER_REFERENZEN: PlatzhalterReferenz[] = [
  {
    id: "platzhalter-1",
    ort: "Brugg AG",
    anzahlGeraete: 1,
    beschreibung: "Wandklimagerät im Wohnzimmer — kühlt und heizt ohne Aussengerät, installiert an einem Tag.",
  },
  {
    id: "platzhalter-2",
    ort: "Baden AG",
    anzahlGeraete: 2,
    beschreibung: "Zwei Geräte für Wohn- und Schlafzimmer, Kernbohrung ohne Baubewilligung möglich.",
  },
  {
    id: "platzhalter-3",
    ort: "Rüfenach AG",
    anzahlGeraete: 1,
    beschreibung: "Nachrüstung in einer Altbauwohnung — dezente Wandmontage, keine Fassadenveränderung.",
  },
];

export function ReferenzCard({ referenz }: { referenz: PublicReferenz | PlatzhalterReferenz }) {
  const fotos = "fotos" in referenz ? referenz.fotos : [];
  const vorher = fotos.find((f) => f.typ === "vorher");
  const nachher = fotos.find((f) => f.typ === "nachher");

  return (
    <div className="public-card">
      <div className="public-referenz-fotos">
        <div className="public-referenz-foto">{vorher ? <img src={vorher.url} alt="Vorher" /> : "Vorher"}</div>
        <div className="public-referenz-foto">{nachher ? <img src={nachher.url} alt="Nachher" /> : "Nachher"}</div>
      </div>
      <h3>{referenz.ort}</h3>
      <div className="public-referenz-meta">
        {referenz.anzahlGeraete} {referenz.anzahlGeraete === 1 ? "Gerät" : "Geräte"} installiert
      </div>
      <p>{referenz.beschreibung}</p>
    </div>
  );
}
