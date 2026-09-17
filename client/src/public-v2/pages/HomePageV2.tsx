import { Link } from "react-router-dom";
import { Seo } from "../../public/components/Seo";
import { ContactForm } from "../../public/components/ContactForm";
import { ReferenzCard, PLATZHALTER_REFERENZEN } from "../../public/components/ReferenzCard";
import { Faq } from "../../public/components/Faq";
import { usePublicReferenzen } from "../../lib/publicApi";
import { usePageTextMap, getText, useKontaktInfo } from "../../lib/pageTexts";

const STATS = [
  { value: "1 Tag", label: "Von der Anfrage bis zur Installation" },
  { value: "0", label: "Sichtbare Aussengeräte an der Fassade" },
  { value: "2-in-1", label: "Kühlen im Sommer, Heizen in der Übergangszeit" },
];

// Argument 4-6 sind V2-exklusiv (nicht im Text-Editor, da V1 nur 3 Kernargumente zeigt).
const FEATURES_ZUSATZ = [
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
const FEATURE_ICONS = ["🧱", "✅", "🌡️"];

export function HomePageV2() {
  const { data: referenzen } = usePublicReferenzen(3);
  const anzeigeReferenzen = referenzen && referenzen.length >= 3 ? referenzen : PLATZHALTER_REFERENZEN;
  const texts = usePageTextMap();
  const { telefon, telefonHref, email, einsatzgebiet } = useKontaktInfo();
  const features = [
    ...[1, 2, 3].map((n, idx) => ({
      icon: FEATURE_ICONS[idx],
      titel: getText(texts, `argument.${n}.titel`),
      text: getText(texts, `argument.${n}.text`),
    })),
    ...FEATURES_ZUSATZ,
  ];
  const ablauf = [1, 2, 3].map((n) => ({
    titel: getText(texts, `ablauf.${n}.titel`),
    text: getText(texts, `ablauf.${n}.text`),
  }));
  const faqEintraege = [1, 2, 3].map((n) => ({
    frage: getText(texts, `faq.${n}.frage`),
    antwort: getText(texts, `faq.${n}.antwort`),
  }));

  return (
    <>
      <Seo
        title="Klimaanlage ohne Aussengerät im Aargau"
        description="Monoblock-Klimageräte kühlen und heizen ohne Aussengerät und ohne Baugesuch — installiert in 1 Tag. SimplyCool aus Rüfenach AG."
      />

      <section className="pv2-hero">
        <div className="pv2-hero-inner">
          <div className="pv2-kicker">SimplyCool · Rüfenach AG</div>
          <h1>{getText(texts, "home.hero.headline")}</h1>
          <p>{getText(texts, "home.hero.text")}</p>
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
            {features.map((f) => (
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
            {ablauf.map((schritt, idx) => (
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
            <Faq eintraege={faqEintraege} />
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
                <a href={telefonHref}>{telefon}</a>
              </div>
              <div className="pv2-info-row">
                <div className="pv2-info-row-label">E-Mail</div>
                <a href={`mailto:${email}`}>{email}</a>
              </div>
              <div className="pv2-info-row">
                <div className="pv2-info-row-label">Einsatzgebiet</div>
                <span>{einsatzgebiet}</span>
              </div>
            </div>
            <ContactForm title="" />
          </div>
        </div>
      </section>
    </>
  );
}
