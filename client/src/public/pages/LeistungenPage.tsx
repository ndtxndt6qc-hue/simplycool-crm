import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";
import { Faq } from "../components/Faq";

const FAQ_EINTRAEGE = [
  {
    frage: "Brauche ich eine Bewilligung?",
    antwort:
      "In den meisten Gemeinden ist für ein Monoblock-Klimagerät ohne Aussengerät keine Baubewilligung nötig, da keine Fassade sichtbar verändert wird. Manche Gemeinden verlangen jedoch eine einfache Meldung. Wir klären das für Ihre Gemeinde vorab ab und weisen es transparent im Angebot aus.",
  },
  {
    frage: "Wie laut ist das Gerät?",
    antwort:
      "Da kein Aussengerät nötig ist, entfällt die typische Kompressor-Lautstärke draussen. Das Innengerät läuft im Normalbetrieb auf einem für Wohnräume unauffälligen, leisen Niveau.",
  },
  {
    frage: "Wie lange dauert die Installation?",
    antwort:
      "In der Regel ist ein Gerät innerhalb weniger Stunden an einem Tag installiert — inklusive der zwei Kernbohrungen durch die Aussenwand.",
  },
  {
    frage: "Was kostet es ungefähr?",
    antwort:
      "Die Kosten hängen von Raumgrösse, Wandbeschaffenheit und Anzahl Geräte ab. Nach einem kurzen Vor-Ort-Termin erhalten Sie ein transparentes Festpreis-Angebot ohne versteckte Kosten.",
  },
];

export function LeistungenPage() {
  return (
    <>
      <Seo
        title="Leistungen & Installation"
        description="So läuft die Installation eines Monoblock-Klimageräts ab: Ablauf, Gerätemarken und häufige Fragen zu Bewilligung, Lautstärke und Kosten."
      />

      <section className="public-section">
        <h2>Unsere Leistung</h2>
        <p className="public-section-intro">
          SimplyCool übernimmt die Installation Ihres Monoblock-Klimageräts von der ersten Beratung bis zur
          betriebsbereiten Anlage — unkompliziert und aus einer Hand.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <h3 style={{ marginBottom: 6 }}>1. Anfrage & Vorabklärung</h3>
            <p style={{ color: "var(--color-text-muted)" }}>
              Sie schildern uns Ihr Vorhaben. Wir prüfen anhand der Gemeinde, ob eine Melde- oder Bewilligungspflicht
              besteht, und melden uns mit einem Terminvorschlag.
            </p>
          </div>
          <div>
            <h3 style={{ marginBottom: 6 }}>2. Vor-Ort-Termin & Angebot</h3>
            <p style={{ color: "var(--color-text-muted)" }}>
              Wir besichtigen die Räumlichkeiten, beraten zur passenden Geräteleistung und Platzierung und erstellen
              ein transparentes Festpreis-Angebot.
            </p>
          </div>
          <div>
            <h3 style={{ marginBottom: 6 }}>3. Installation</h3>
            <p style={{ color: "var(--color-text-muted)" }}>
              Am Installationstag montieren wir das Gerät und erstellen die zwei nötigen Kernbohrungen durch die
              Aussenwand — meist innerhalb weniger Stunden.
            </p>
          </div>
          <div>
            <h3 style={{ marginBottom: 6 }}>4. Abnahme & Einweisung</h3>
            <p style={{ color: "var(--color-text-muted)" }}>
              Wir zeigen Ihnen die Bedienung, halten die Abnahme fest und stehen danach für Fragen zur Verfügung.
            </p>
          </div>
        </div>
      </section>

      <section className="public-section" style={{ background: "var(--color-surface)" }}>
        <h2>Geräte</h2>
        <p className="public-section-intro">
          Wir installieren bewährte Monoblock-Klimageräte namhafter Hersteller — passend zur Raumgrösse und Nutzung
          ausgewählt.
        </p>
        <div className="public-grid">
          <div className="public-card">
            <h3>Kleine Räume</h3>
            <p>Bis ca. 20 m² — ideal für Schlaf- oder Arbeitszimmer.</p>
          </div>
          <div className="public-card">
            <h3>Mittlere Räume</h3>
            <p>Ca. 20–35 m² — für Wohnzimmer oder grössere Büros.</p>
          </div>
          <div className="public-card">
            <h3>Grosse Räume</h3>
            <p>Ab ca. 35 m² — für offene Wohnbereiche und Studios.</p>
          </div>
        </div>
        <p style={{ marginTop: 20, fontSize: 13, color: "var(--color-text-muted)" }}>
          Welches Modell für Sie passt, klären wir gerne im kostenlosen Vor-Ort-Termin ab.
        </p>
      </section>

      <section className="public-section-narrow">
        <h2>Häufige Fragen</h2>
        <Faq eintraege={FAQ_EINTRAEGE} />
      </section>

      <section className="public-section" style={{ textAlign: "center" }}>
        <Link to="/kontakt" className="public-cta-btn">
          Jetzt Anfrage stellen
        </Link>
      </section>
    </>
  );
}
