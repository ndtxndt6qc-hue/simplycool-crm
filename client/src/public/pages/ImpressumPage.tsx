import { Seo } from "../components/Seo";
import { useKontaktInfo } from "../../lib/pageTexts";

export function ImpressumPage() {
  const { telefon, email } = useKontaktInfo();
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
          Telefon: {telefon}
          <br />
          E-Mail: {email}
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
