import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";
import { usePageTextMap, getText } from "../../lib/pageTexts";

const VERTRAUEN_ICONS = ["🔧", "🤝", "📍"];

export function UeberUnsPage() {
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

      <section className="public-section">
        <h2>Über SimplyCool</h2>
        <p className="public-section-intro" style={{ maxWidth: 720 }}>
          {getText(texts, "ueberuns.intro1")}
        </p>
        <p className="public-section-intro" style={{ maxWidth: 720 }}>
          {getText(texts, "ueberuns.intro2")}
        </p>
      </section>

      <section className="public-section" style={{ background: "var(--color-surface)" }}>
        <h2>Warum SimplyCool</h2>
        <div className="public-grid">
          {vertrauen.map((v) => (
            <div className="public-card" key={v.titel}>
              <div className="public-card-icon">{v.icon}</div>
              <h3>{v.titel}</h3>
              <p>{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="public-section" style={{ textAlign: "center" }}>
        <Link to="/kontakt" className="public-cta-btn">
          Jetzt Anfrage stellen
        </Link>
      </section>
    </>
  );
}
