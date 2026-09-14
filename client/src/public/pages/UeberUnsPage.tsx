import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";

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

export function UeberUnsPage() {
  return (
    <>
      <Seo
        title="Über uns"
        description="SimplyCool aus Rüfenach AG installiert Monoblock-Klimageräte im Aargau und der Deutschschweiz — unkompliziert und mit Handwerkserfahrung."
      />

      <section className="public-section">
        <h2>Über SimplyCool</h2>
        <p className="public-section-intro" style={{ maxWidth: 720 }}>
          SimplyCool hat sich auf die Installation von Monoblock-Klimageräten spezialisiert — Geräte, die ganz ohne
          Aussengerät auskommen und damit ohne aufwändiges Bewilligungsverfahren installiert werden können. Unser
          Ziel: Ihnen unkompliziert zu angenehmen Temperaturen verhelfen, im Sommer wie in der Übergangszeit.
        </p>
        <p className="public-section-intro" style={{ maxWidth: 720 }}>
          Wir sind in Rüfenach AG zuhause und betreuen Kundinnen und Kunden im Aargau und der Deutschschweiz — von
          der ersten Beratung über die Installation bis zum Support danach.
        </p>
      </section>

      <section className="public-section" style={{ background: "var(--color-surface)" }}>
        <h2>Warum SimplyCool</h2>
        <div className="public-grid">
          {VERTRAUEN.map((v) => (
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
