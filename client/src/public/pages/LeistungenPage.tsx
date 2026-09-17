import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";
import { Faq } from "../components/Faq";
import { usePageTextMap, getText } from "../../lib/pageTexts";

export function LeistungenPage() {
  const texts = usePageTextMap();
  const faqEintraege = [1, 2, 3, 4].map((n) => ({
    frage: getText(texts, `faq.${n}.frage`),
    antwort: getText(texts, `faq.${n}.antwort`),
  }));
  const phasen = [1, 2, 3, 4].map((n) => ({
    titel: getText(texts, `leistungen.phase${n}.titel`),
    text: getText(texts, `leistungen.phase${n}.text`),
  }));

  return (
    <>
      <Seo
        title="Leistungen & Installation"
        description="So läuft die Installation eines Monoblock-Klimageräts ab: Ablauf, Gerätemarken und häufige Fragen zu Bewilligung, Lautstärke und Kosten."
      />

      <section className="public-section">
        <h2>Unsere Leistung</h2>
        <p className="public-section-intro">{getText(texts, "leistungen.intro")}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {phasen.map((phase, idx) => (
            <div key={phase.titel}>
              <h3 style={{ marginBottom: 6 }}>
                {idx + 1}. {phase.titel}
              </h3>
              <p style={{ color: "var(--color-text-muted)" }}>{phase.text}</p>
            </div>
          ))}
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
        <Faq eintraege={faqEintraege} />
      </section>

      <section className="public-section" style={{ textAlign: "center" }}>
        <Link to="/kontakt" className="public-cta-btn">
          Jetzt Anfrage stellen
        </Link>
      </section>
    </>
  );
}
