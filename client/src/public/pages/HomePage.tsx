import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";
import { ContactForm } from "../components/ContactForm";
import { ReferenzCard, PLATZHALTER_REFERENZEN } from "../components/ReferenzCard";
import { usePublicReferenzen } from "../../lib/publicApi";
import { usePageTextMap, getText } from "../../lib/pageTexts";

const ARGUMENT_ICONS = ["🧱", "✅", "🌡️"];
const ABLAUF_IDS = ["ablauf.1", "ablauf.2", "ablauf.3"];

export function HomePage() {
  const { data: referenzen } = usePublicReferenzen(3);
  const anzeigeReferenzen = referenzen && referenzen.length >= 3 ? referenzen : PLATZHALTER_REFERENZEN;
  const texts = usePageTextMap();
  const argumente = [1, 2, 3].map((n, idx) => ({
    icon: ARGUMENT_ICONS[idx],
    titel: getText(texts, `argument.${n}.titel`),
    text: getText(texts, `argument.${n}.text`),
  }));
  const ablauf = ABLAUF_IDS.map((id) => ({ titel: getText(texts, `${id}.titel`), text: getText(texts, `${id}.text`) }));

  return (
    <>
      <Seo
        title="Klimaanlage ohne Aussengerät im Aargau"
        description="Monoblock-Klimageräte kühlen und heizen ohne Aussengerät und ohne Baugesuch — installiert in 1 Tag. SimplyCool aus Rüfenach AG."
      />

      <section className="public-hero">
        <div className="public-hero-inner">
          <div>
            <h1>{getText(texts, "home.hero.headline")}</h1>
            <p>{getText(texts, "home.hero.text")}</p>
            <a href="#kontakt" className="public-cta-btn">
              Kostenlose Anfrage stellen
            </a>
          </div>
          <div className="public-hero-image">Bild: Monoblock-Klimagerät an der Wand</div>
        </div>
      </section>

      <section className="public-section">
        <div className="public-grid">
          {argumente.map((a) => (
            <div className="public-card" key={a.titel}>
              <div className="public-card-icon">{a.icon}</div>
              <h3>{a.titel}</h3>
              <p>{a.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="public-section" style={{ background: "var(--color-surface)" }}>
        <h2>So einfach geht's</h2>
        <div className="public-steps" style={{ marginTop: 24 }}>
          {ablauf.map((schritt) => (
            <div className="public-step" key={schritt.titel}>
              <h3>{schritt.titel}</h3>
              <p>{schritt.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="public-section">
        <h2>Referenzen</h2>
        <p className="public-section-intro">Einblick in einige unserer Installationen.</p>
        <div className="public-grid public-referenz-grid">
          {anzeigeReferenzen.map((r) => (
            <ReferenzCard key={r.id} referenz={r} />
          ))}
        </div>
        <Link to="/referenzen" className="table-link" style={{ display: "inline-block", marginTop: 20 }}>
          Alle Referenzen ansehen →
        </Link>
      </section>

      <section className="public-section-narrow" id="kontakt">
        <h2>Kostenlose Anfrage</h2>
        <p className="public-section-intro">
          Erzählen Sie uns kurz von Ihrem Vorhaben — wir melden uns innerhalb von 24 Stunden.
        </p>
        <ContactForm title="" />
      </section>
    </>
  );
}
