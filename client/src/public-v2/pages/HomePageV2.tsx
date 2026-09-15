import { Link } from "react-router-dom";
import { Seo } from "../../public/components/Seo";
import { ContactForm } from "../../public/components/ContactForm";
import { ReferenzCard, PLATZHALTER_REFERENZEN } from "../../public/components/ReferenzCard";
import { Faq } from "../../public/components/Faq";
import { usePublicReferenzen } from "../../lib/publicApi";

const STATS = [
  { value: "1 Tag", label: "Von der Anfrage bis zur Installation" },
  { value: "0", label: "Sichtbare Aussengeräte an der Fassade" },
  { value: "2-in-1", label: "Kühlen im Sommer, Heizen in der Übergangszeit" },
];

const FEATURES = [
  {
    icon: "🧱",
    titel: "Kein Aussengerät",
    text: "Keine Fassadenveränderung, kein sichtbares Aussengerät — nur zwei dezente Kernbohrungen.",
  },
  {
    icon: "✅",
    titel: "Meist keine Baubewilligung",
    text: "Dank fehlendem Aussengerät ist in der Regel kein Baugesuch nötig — wir klären das für Ihre Gemeinde ab.",
  },
  {
    icon: "🌡️",
    titel: "Kühlen und Heizen",
    text: "Perfekt für heisse Sommernächte und die kühle Übergangszeit — ein Gerät für beides.",
  },
  {
    icon: "⚡",
    titel: "Schnelle Installation",
    text: "Montage und Kernbohrung erledigen wir in der Regel an einem Tag, meist innerhalb weniger Stunden.",
  },
  {
    icon: "🔧",
    titel: "Handwerkserfahrung",
    text: "Fundiertes Know-how bei Montage, Kernbohrung und Elektroanschluss — sauber und zuverlässig ausgeführt.",
  },
  {
    icon: "💬",
    titel: "Transparente Fixpreise",
    text: "Nach dem Vor-Ort-Termin erhalten Sie ein klares Festpreis-Angebot ohne versteckte Kosten.",
  },
];

const ABLAUF = [
  { titel: "Anfrage", text: "Sie senden uns Ihre Anfrage über das Formular oder per Telefon." },
  { titel: "Vor-Ort-Termin", text: "Wir besichtigen die Räumlichkeiten und erstellen ein passendes Angebot." },
  { titel: "Installation in wenigen Stunden", text: "Montage und Kernbohrung erledigen wir in der Regel an einem Tag." },
];

const FAQ_EINTRAEGE = [
  {
    frage: "Brauche ich eine Bewilligung?",
    antwort:
      "In den meisten Gemeinden ist für ein Monoblock-Klimagerät ohne Aussengerät keine Baubewilligung nötig, da keine Fassade sichtbar verändert wird. Wir klären das für Ihre Gemeinde vorab ab.",
  },
  {
    frage: "Wie laut ist das Gerät?",
    antwort:
      "Da kein Aussengerät nötig ist, entfällt die typische Kompressor-Lautstärke draussen. Das Innengerät läuft im Normalbetrieb auf einem für Wohnräume unauffälligen, leisen Niveau.",
  },
  {
    frage: "Wie lange dauert die Installation?",
    antwort: "In der Regel ist ein Gerät innerhalb weniger Stunden an einem Tag installiert.",
  },
];

export function HomePageV2() {
  const { data: referenzen } = usePublicReferenzen(3);
  const anzeigeReferenzen = referenzen && referenzen.length >= 3 ? referenzen : PLATZHALTER_REFERENZEN;

  return (
    <>
      <Seo
        title="Klimaanlage ohne Aussengerät im Aargau"
        description="Monoblock-Klimageräte kühlen und heizen ohne Aussengerät und ohne Baugesuch — installiert in 1 Tag. SimplyCool aus Rüfenach AG."
      />

      <section className="pv2-hero">
        <div className="pv2-hero-inner">
          <div className="pv2-kicker">SimplyCool · Rüfenach AG</div>
          <h1>
            Kühle Nächte, warme Übergangszeit<span className="pv2-accent">, ohne Aussengerät.</span>
          </h1>
          <p>
            Monoblock-Klimageräte von SimplyCool kühlen im Sommer und heizen in der Übergangszeit — ganz ohne
            Aussengerät und meist ohne Bewilligungsverfahren. In 1 Tag installiert.
          </p>
          <div className="pv2-hero-actions">
            <a href="#kontakt" className="public-cta-btn">
              Kostenlose Anfrage →
            </a>
            <Link to="/v2/leistungen" className="pv2-btn-outline">
              So läuft's ab
            </Link>
          </div>
        </div>
        <div className="pv2-stats">
          <div className="pv2-stats-inner">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="pv2-stat-value">{s.value}</div>
                <div className="pv2-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pv2-section pv2-section--light">
        <div className="pv2-section-inner">
          <div className="pv2-kicker">Das dürfen Sie erwarten</div>
          <h2>
            Sechs Gründe, warum sich Kund:innen im Aargau <span className="pv2-accent">für SimplyCool</span>{" "}
            entscheiden.
          </h2>
          <div className="pv2-feature-grid" style={{ marginTop: 32 }}>
            {FEATURES.map((f) => (
              <div className="pv2-feature-card" key={f.titel}>
                <div className="pv2-feature-icon">{f.icon}</div>
                <h3>{f.titel}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pv2-section pv2-section--tint">
        <div className="pv2-section-inner">
          <div className="pv2-kicker">Installation</div>
          <h2>So einfach geht's.</h2>
          <div className="pv2-steps" style={{ marginTop: 32 }}>
            {ABLAUF.map((schritt, idx) => (
              <div className="pv2-step" key={schritt.titel}>
                <div className="pv2-step-number">{String(idx + 1).padStart(2, "0")}</div>
                <div>
                  <h3>{schritt.titel}</h3>
                  <p>{schritt.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pv2-section pv2-section--light">
        <div className="pv2-section-inner">
          <div className="pv2-kicker">Referenzobjekte</div>
          <h2>Einblick in unsere Installationen.</h2>
          <div className="public-grid public-referenz-grid" style={{ marginTop: 32 }}>
            {anzeigeReferenzen.map((r) => (
              <ReferenzCard key={r.id} referenz={r} />
            ))}
          </div>
          <Link to="/v2/referenzen" className="pv2-btn-outline" style={{ display: "inline-block", marginTop: 24, borderColor: "var(--color-border)", color: "var(--color-text)" }}>
            Alle Referenzen ansehen →
          </Link>
        </div>
      </section>

      <section className="pv2-section pv2-section--tint">
        <div className="pv2-section-inner--narrow">
          <div className="pv2-kicker">Häufige Fragen</div>
          <h2>Antworten in einem Satz.</h2>
          <div style={{ marginTop: 24 }}>
            <Faq eintraege={FAQ_EINTRAEGE} />
          </div>
        </div>
      </section>

      <section className="pv2-section pv2-section--dark" id="kontakt">
        <div className="pv2-section-inner">
          <div className="pv2-kicker">Kontakt</div>
          <h2>Angenehme Temperaturen trotz Hitze.</h2>
          <p style={{ marginBottom: 32, maxWidth: 560 }}>
            Vereinbaren Sie jetzt ein unverbindliches Beratungsgespräch — wir melden uns innerhalb von 24 Stunden.
          </p>
          <div className="pv2-split">
            <div className="pv2-info-card">
              <h3>Direkt erreichbar</h3>
              <div className="pv2-info-row">
                <div className="pv2-info-row-label">Telefon</div>
                <a href="tel:+41790000000">079 000 00 00</a>
              </div>
              <div className="pv2-info-row">
                <div className="pv2-info-row-label">E-Mail</div>
                <a href="mailto:info@simply-cool.ch">info@simply-cool.ch</a>
              </div>
              <div className="pv2-info-row">
                <div className="pv2-info-row-label">Einsatzgebiet</div>
                <span>Rüfenach AG und Umgebung</span>
              </div>
            </div>
            <ContactForm title="" />
          </div>
        </div>
      </section>
    </>
  );
}
