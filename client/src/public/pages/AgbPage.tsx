import { Seo } from "../components/Seo";
import { useKontaktInfo } from "../../lib/pageTexts";

export function AgbPage() {
  const { email } = useKontaktInfo();
  return (
    <>
      <Seo title="Allgemeine Geschäftsbedingungen" description="Allgemeine Geschäftsbedingungen (AGB) von SimplyCool." />
      <div className="public-section-narrow">
        <h2>Allgemeine Geschäftsbedingungen</h2>
        <div style={{ color: "var(--color-text-muted)", lineHeight: 1.7 }}>
          <p>
            <strong>1. Geltungsbereich</strong>
            <br />
            Diese Allgemeinen Geschäftsbedingungen gelten für sämtliche Angebote, Aufträge und Installationen von
            Monoblock-Klimageräten durch SimplyCool.
          </p>
          <p>
            <strong>2. Angebot &amp; Vertragsschluss</strong>
            <br />
            Angebote sind bis zum angegebenen Datum gültig. Der Vertrag kommt mit der schriftlichen
            Auftragsbestätigung durch den Auftraggeber zustande.
          </p>
          <p>
            <strong>3. Zahlungsbedingungen</strong>
            <br />
            Rechnungen sind, sofern nicht anders vereinbart, innert 30 Tagen ab Rechnungsdatum netto zahlbar.
          </p>
          <p>
            <strong>4. Eigentumsvorbehalt</strong>
            <br />
            Gelieferte Geräte bleiben bis zur vollständigen Bezahlung Eigentum von SimplyCool.
          </p>
          <p>
            <strong>5. Gewährleistung</strong>
            <br />
            Es gilt die gesetzliche Gewährleistung sowie die Herstellergarantie auf die verbauten Geräte.
          </p>
          <p>
            <strong>6. Bewilligungen</strong>
            <br />
            Die Abklärung allfälliger Melde- oder Bewilligungspflichten bei der zuständigen Gemeinde erfolgt gemäss
            den Angaben in der jeweiligen Auftragsbestätigung durch SimplyCool oder den Auftraggeber.
          </p>
          <p>
            Für Fragen zu diesen Bedingungen wenden Sie sich an {email}.
          </p>
          <p>
            <em>
              Dieser Text ist ein Platzhalter und muss vor dem Live-Schalten juristisch geprüft und vervollständigt
              werden.
            </em>
          </p>
        </div>
      </div>
    </>
  );
}
