import { Seo } from "../components/Seo";
import { KONTAKT_EMAIL } from "../components/PublicLayout";

export function DatenschutzPage() {
  return (
    <>
      <Seo title="Datenschutzerklärung" description="Datenschutzerklärung von SimplyCool." />
      <div className="public-section-narrow">
        <h2>Datenschutzerklärung</h2>
        <div style={{ color: "var(--color-text-muted)", lineHeight: 1.7 }}>
          <p>
            Wenn Sie über das Kontaktformular auf dieser Webseite eine Anfrage senden, speichern wir die von Ihnen
            angegebenen Daten (Name, Kontaktangaben, PLZ/Ort, Nachricht) ausschliesslich zur Bearbeitung Ihrer Anfrage.
            Eine Weitergabe an Dritte erfolgt nicht.
          </p>
          <p>
            Für Fragen zu Ihren gespeicherten Daten oder zur Löschung wenden Sie sich an {KONTAKT_EMAIL}.
          </p>
          <p>
            <em>
              Dieser Text ist ein Platzhalter und sollte vor dem Live-Schalten juristisch geprüft und vervollständigt
              werden (z.B. Angaben zu Cookies/Analyse-Tools, sofern eingesetzt).
            </em>
          </p>
        </div>
      </div>
    </>
  );
}
