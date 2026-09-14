import { Seo } from "../components/Seo";
import { KONTAKT_EMAIL, KONTAKT_TELEFON } from "../components/PublicLayout";

export function ImpressumPage() {
  return (
    <>
      <Seo title="Impressum" description="Impressum von SimplyCool." />
      <div className="public-section-narrow">
        <h2>Impressum</h2>
        <p style={{ color: "var(--color-text-muted)", lineHeight: 1.7 }}>
          SimplyCool
          <br />
          [Strasse Nr.]
          <br />
          [PLZ] Rüfenach AG
          <br />
          <br />
          Telefon: {KONTAKT_TELEFON}
          <br />
          E-Mail: {KONTAKT_EMAIL}
          <br />
          <br />
          [Rechtsform, UID/Handelsregister-Nummer falls vorhanden]
          <br />
          <br />
          <em>Dieser Text ist ein Platzhalter und muss vor dem Live-Schalten mit den vollständigen Angaben ergänzt
          werden.</em>
        </p>
      </div>
    </>
  );
}
