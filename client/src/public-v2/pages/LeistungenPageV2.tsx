import { Link } from "react-router-dom";
import { Seo } from "../../public/components/Seo";
import { Faq } from "../../public/components/Faq";
import { usePageTextMap, getText } from "../../lib/pageTexts";

const RAUMGROESSEN = [
  { titel: "Kleine Räume", text: "Bis ca. 20 m² — ideal für Schlaf- oder Arbeitszimmer." },
  { titel: "Mittlere Räume", text: "Ca. 20–35 m² — für Wohnzimmer oder grössere Büros." },
  { titel: "Grosse Räume", text: "Ab ca. 35 m² — für offene Wohnbereiche und Studios." },
];

export function LeistungenPageV2() {
  const texts = usePageTextMap();
  const phasen = [1, 2, 3, 4].map((n) => ({
    titel: getText(texts, `leistungen.phase${n}.titel`),
    text: getText(texts, `leistungen.phase${n}.text`),
  }));
  const faqEintraege = [1, 2, 3, 4].map((n) => ({
    frage: getText(texts, `faq.${n}.frage`),
    antwort: getText(texts, `faq.${n}.antwort`),
  }));

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
          <p>{getText(texts, "leistungen.intro")}</p>
        </div>
      </section>

      <section className="pv2-section pv2-section--light">
        <div className="pv2-section-inner">
          <div className="pv2-kicker">Ablauf</div>
          <h2>Vier Schritte zu Ihrem neuen Klima.</h2>
          <div className="pv2-steps" style={{ marginTop: 32 }}>
            {phasen.map((p, idx) => (
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
            <Faq eintraege={faqEintraege} />
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
