import { Link } from "react-router-dom";
import { Seo } from "../../public/components/Seo";

const VERTRAUEN = [
  {
    icon: "🔧",
    titel: "Handwerkserfahrung",
    text: "Fundiertes handwerkliches Know-how bei Montage, Kernbohrung und Elektroanschluss — sauber und zuverlässig ausgeführt.",
  },
  {
    icon: "🤝",
    titel: "Unkomplizierte Abwicklung",
    text: "Von der Anfrage bis zur betriebsbereiten Anlage aus einer Hand — klare Kommunikation, transparente Fixpreise.",
  },
  {
    icon: "📍",
    titel: "Lokale Verfügbarkeit",
    text: "Als lokaler Anbieter aus Rüfenach AG sind wir rasch vor Ort und auch nach der Installation ansprechbar.",
  },
];

export function UeberUnsPageV2() {
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
          <p>
            SimplyCool hat sich auf die Installation von Monoblock-Klimageräten spezialisiert — Geräte, die ganz ohne
            Aussengerät auskommen und damit ohne aufwändiges Bewilligungsverfahren installiert werden können.
          </p>
        </div>
      </section>

      <section className="pv2-section pv2-section--light">
        <div className="pv2-section-inner--narrow">
          <p style={{ color: "var(--color-text-muted)", fontSize: 16, lineHeight: 1.7 }}>
            Unser Ziel: Ihnen unkompliziert zu angenehmen Temperaturen verhelfen, im Sommer wie in der
            Übergangszeit. Wir sind in Rüfenach AG zuhause und betreuen Kundinnen und Kunden im Aargau und der
            Deutschschweiz — von der ersten Beratung über die Installation bis zum Support danach.
          </p>
        </div>
      </section>

      <section className="pv2-section pv2-section--tint">
        <div className="pv2-section-inner">
          <div className="pv2-kicker">Warum SimplyCool</div>
          <h2>Drei Gründe, uns zu vertrauen.</h2>
          <div className="pv2-feature-grid" style={{ marginTop: 32 }}>
            {VERTRAUEN.map((v) => (
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
