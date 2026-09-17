import { Link } from "react-router-dom";
import { Seo } from "../../public/components/Seo";
import { usePageTextMap, getText } from "../../lib/pageTexts";

const VERTRAUEN_ICONS = ["🔧", "🤝", "📍"];

export function UeberUnsPageV2() {
  const texts = usePageTextMap();
  const vertrauen = [1, 2, 3].map((n, idx) => ({
    icon: VERTRAUEN_ICONS[idx],
    titel: getText(texts, `vertrauen.${n}.titel`),
    text: getText(texts, `vertrauen.${n}.text`),
  }));

  return (
    <>
      <Seo
        title="Über uns"
        description="SimplyCool aus Rüfenach AG installiert Monoblock-Klimageräte im Aargau und der Deutschschweiz — unkompliziert und mit Handwerkserfahrung."
      />

      <section className="pv2-hero" style={{ paddingBottom: 8 }}>
        <div className="pv2-hero-inner" style={{ paddingBottom: 40 }}>
          <div className="pv2-kicker">Wer wir sind</div>
          <h1>
            SimplyCool <span className="pv2-accent">aus Rüfenach AG.</span>
          </h1>
          <p>{getText(texts, "ueberuns.intro1")}</p>
        </div>
      </section>

      <section className="pv2-section pv2-section--light">
        <div className="pv2-section-inner--narrow">
          <p style={{ color: "var(--color-text-muted)", fontSize: 16, lineHeight: 1.7 }}>
            {getText(texts, "ueberuns.intro2")}
          </p>
        </div>
      </section>

      <section className="pv2-section pv2-section--tint">
        <div className="pv2-section-inner">
          <div className="pv2-kicker">Warum SimplyCool</div>
          <h2>Drei Gründe, uns zu vertrauen.</h2>
          <div className="pv2-feature-grid" style={{ marginTop: 32 }}>
            {vertrauen.map((v) => (
              <div className="pv2-feature-card" key={v.titel}>
                <div className="pv2-feature-icon">{v.icon}</div>
                <h3>{v.titel}</h3>
                <p>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pv2-cta-banner">
        <h2>Lernen wir uns kennen.</h2>
        <Link to="/v2/kontakt" className="public-cta-btn">
          Jetzt Anfrage stellen →
        </Link>
      </section>
    </>
  );
}
