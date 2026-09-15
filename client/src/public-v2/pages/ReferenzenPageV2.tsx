import { Link } from "react-router-dom";
import { Seo } from "../../public/components/Seo";
import { ReferenzCard, PLATZHALTER_REFERENZEN } from "../../public/components/ReferenzCard";
import { usePublicReferenzen } from "../../lib/publicApi";

export function ReferenzenPageV2() {
  const { data: referenzen, isLoading } = usePublicReferenzen();
  const echte = referenzen ?? [];
  const anzeigeListe = echte.length >= 3 ? echte : [...echte, ...PLATZHALTER_REFERENZEN.slice(0, 3 - echte.length)];

  return (
    <>
      <Seo
        title="Referenzen"
        description="Abgeschlossene Klimaanlagen-Installationen von SimplyCool im Aargau — Beispiele aus unseren Projekten."
      />

      <section className="pv2-hero" style={{ paddingBottom: 8 }}>
        <div className="pv2-hero-inner" style={{ paddingBottom: 40 }}>
          <div className="pv2-kicker">Referenzobjekte</div>
          <h1>
            Eigenheime, Büros und Praxen <span className="pv2-accent">im Aargau.</span>
          </h1>
          <p>
            Ein Einblick in unsere abgeschlossenen Installationen — aus Datenschutzgründen zeigen wir nur den Ort,
            keine vollständige Adresse.
          </p>
        </div>
      </section>

      <section className="pv2-section pv2-section--light">
        <div className="pv2-section-inner">
          {isLoading ? (
            <p style={{ color: "var(--color-text-muted)" }}>Lädt…</p>
          ) : (
            <div className="public-grid public-referenz-grid">
              {anzeigeListe.map((r) => (
                <ReferenzCard key={r.id} referenz={r} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="pv2-cta-banner">
        <h2>Ihr Projekt könnte das nächste sein.</h2>
        <Link to="/v2/kontakt" className="public-cta-btn">
          Jetzt Anfrage stellen →
        </Link>
      </section>
    </>
  );
}
