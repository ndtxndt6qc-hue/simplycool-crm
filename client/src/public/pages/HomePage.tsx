import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";
import { ContactForm } from "../components/ContactForm";
import { ReferenzCard, PLATZHALTER_REFERENZEN } from "../components/ReferenzCard";
import { usePublicReferenzen } from "../../lib/publicApi";

const ARGUMENTE = [
  {
    icon: "🧱",
    titel: "Kein Aussengerät",
    text: "Keine Fassadenveränderung, kein sichtbares Aussengerät — nur zwei dezente Kernbohrungen.",
  },
  {
    icon: "✅",
    titel: "In der Regel keine Baubewilligung nötig",
    text: "Dank fehlendem Aussengerät ist meist kein Baugesuch erforderlich — wir klären das für Sie ab.",
  },
  {
    icon: "🌡️",
    titel: "Kühlen UND Heizen",
    text: "Perfekt für heisse Sommernächte und die kühle Übergangszeit — ein Gerät für beides.",
  },
];

const ABLAUF = [
  { titel: "Anfrage", text: "Sie senden uns Ihre Anfrage über das Formular oder per Telefon." },
  { titel: "Vor-Ort-Termin", text: "Wir besichtigen die Räumlichkeiten und erstellen ein passendes Angebot." },
  { titel: "Installation in wenigen Stunden", text: "Montage und Kernbohrung erledigen wir in der Regel an einem Tag." },
];

export function HomePage() {
  const { data: referenzen } = usePublicReferenzen(3);
  const anzeigeReferenzen = referenzen && referenzen.length >= 3 ? referenzen : PLATZHALTER_REFERENZEN;

  return (
    <>
      <Seo
        title="Klimaanlage ohne Aussengerät im Aargau"
        description="Monoblock-Klimageräte kühlen und heizen ohne Aussengerät und ohne Baugesuch — installiert in 1 Tag. SimplyCool aus Rüfenach AG."
      />

      <section className="public-hero">
        <div className="public-hero-inner">
          <div>
            <h1>Kühle Nächte, warme Übergangszeit — in 1 Tag installiert, ohne Baugesuch</h1>
            <p>
              Monoblock-Klimageräte von SimplyCool kühlen im Sommer und heizen in der Übergangszeit — ganz ohne
              Aussengerät und meist ohne Bewilligungsverfahren.
            </p>
            <a href="#kontakt" className="public-cta-btn">
              Kostenlose Anfrage stellen
            </a>
          </div>
          <div className="public-hero-image">Bild: Monoblock-Klimagerät an der Wand</div>
        </div>
      </section>

      <section className="public-section">
        <div className="public-grid">
          {ARGUMENTE.map((a) => (
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
          {ABLAUF.map((schritt) => (
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
