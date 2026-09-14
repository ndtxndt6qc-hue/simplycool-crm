import { Seo } from "../components/Seo";
import { ReferenzCard, PLATZHALTER_REFERENZEN } from "../components/ReferenzCard";
import { usePublicReferenzen } from "../../lib/publicApi";

export function ReferenzenPage() {
  const { data: referenzen, isLoading } = usePublicReferenzen();
  const echte = referenzen ?? [];
  const anzeigeListe = echte.length >= 3 ? echte : [...echte, ...PLATZHALTER_REFERENZEN.slice(0, 3 - echte.length)];

  return (
    <>
      <Seo
        title="Referenzen"
        description="Abgeschlossene Klimaanlagen-Installationen von SimplyCool im Aargau — Beispiele aus unseren Projekten."
      />
      <section className="public-section">
        <h2>Referenzen</h2>
        <p className="public-section-intro">
          Ein Einblick in unsere abgeschlossenen Installationen — aus Datenschutzgründen zeigen wir nur den Ort, keine
          vollständige Adresse.
        </p>
        {isLoading ? (
          <p style={{ color: "var(--color-text-muted)" }}>Lädt…</p>
        ) : (
          <div className="public-grid public-referenz-grid">
            {anzeigeListe.map((r) => (
              <ReferenzCard key={r.id} referenz={r} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
