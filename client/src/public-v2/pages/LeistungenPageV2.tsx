import { Link } from "react-router-dom";
import { Seo } from "../../public/components/Seo";
import { Faq } from "../../public/components/Faq";

const PHASEN = [
  {
    titel: "Anfrage & Vorabklärung",
    text: "Sie schildern uns Ihr Vorhaben. Wir prüfen anhand der Gemeinde, ob eine Melde- oder Bewilligungspflicht besteht, und melden uns mit einem Terminvorschlag.",
  },
  {
    titel: "Vor-Ort-Termin & Angebot",
    text: "Wir besichtigen die Räumlichkeiten, beraten zur passenden Geräteleistung und Platzierung und erstellen ein transparentes Festpreis-Angebot.",
  },
  {
    titel: "Installation",
    text: "Am Installationstag montieren wir das Gerät und erstellen die zwei nötigen Kernbohrungen durch die Aussenwand — meist innerhalb weniger Stunden.",
  },
  {
    titel: "Abnahme & Einweisung",
    text: "Wir zeigen Ihnen die Bedienung, halten die Abnahme fest und stehen danach für Fragen zur Verfügung.",
  },
];

const RAUMGROESSEN = [
  { titel: "Kleine Räume", text: "Bis ca. 20 m² — ideal für Schlaf- oder Arbeitszimmer." },
  { titel: "Mittlere Räume", text: "Ca. 20–35 m² — für Wohnzimmer oder grössere Büros." },
  { titel: "Grosse Räume", text: "Ab ca. 35 m² — für offene Wohnbereiche und Studios." },
];

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

export function LeistungenPageV2() {
  return (
    <>
      <Seo
        title="Leistungen & Installation"
        description="So läuft die Installation eines Monoblock-Klimageräts ab: Ablauf, Gerätegrössen und häufige Fragen zu Bewilligung, Lautstärke und Kosten."
      />

      <section className="pv2-hero" style={{ paddingBottom: 8 }}>
        <div className="pv2-hero-inner" style={{ paddingBottom: 40 }}>
          <div className="pv2-kicker">Leistungen</div>
          <h1>
            Von der Anfrage bis zur <span className="pv2-accent">betriebsbereiten Anlage.</span>
          </h1>
          <p>SimplyCool übernimmt die Installation Ihres Monoblock-Klimageräts aus einer Hand — unkompliziert und transparent.</p>
        </div>
      </section>

      <section className="pv2-section pv2-section--light">
        <div className="pv2-section-inner">
          <div className="pv2-kicker">Ablauf</div>
          <h2>Vier Schritte zu Ihrem neuen Klima.</h2>
          <div className="pv2-steps" style={{ marginTop: 32 }}>
            {PHASEN.map((p, idx) => (
              <div className="pv2-step" key={p.titel}>
                <div className="pv2-step-number">{String(idx + 1).padStart(2, "0")}</div>
                <div>
                  <h3>{p.titel}</h3>
                  <p>{p.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pv2-section pv2-section--tint">
        <div className="pv2-section-inner">
          <div className="pv2-kicker">Richtig dimensioniert</div>
          <h2>Das passende Gerät für Ihre Raumgrösse.</h2>
          <div className="pv2-feature-grid" style={{ marginTop: 32 }}>
            {RAUMGROESSEN.map((r) => (
              <div className="pv2-feature-card" key={r.titel}>
                <h3>{r.titel}</h3>
                <p>{r.text}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 24, fontSize: 13, color: "var(--color-text-muted)" }}>
            Welches Modell für Sie passt, klären wir gerne im kostenlosen Vor-Ort-Termin ab.
          </p>
        </div>
      </section>

      <section className="pv2-section pv2-section--light">
        <div className="pv2-section-inner--narrow">
          <div className="pv2-kicker">Häufige Fragen</div>
          <h2>Antworten in einem Satz.</h2>
          <div style={{ marginTop: 24 }}>
            <Faq eintraege={FAQ_EINTRAEGE} />
          </div>
        </div>
      </section>

      <section className="pv2-cta-banner">
        <h2>Bereit für angenehme Temperaturen?</h2>
        <Link to="/v2/kontakt" className="public-cta-btn">
          Jetzt Anfrage stellen →
        </Link>
      </section>
    </>
  );
}
