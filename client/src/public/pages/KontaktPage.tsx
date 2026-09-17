import { Seo } from "../components/Seo";
import { ContactForm } from "../components/ContactForm";
import { useKontaktInfo } from "../../lib/pageTexts";

export function KontaktPage() {
  const { telefon, telefonHref, email, einsatzgebiet } = useKontaktInfo();
  return (
    <>
      <Seo
        title="Kontakt"
        description="Kostenlose Anfrage für Ihre Klimaanlage ohne Aussengerät — SimplyCool meldet sich innerhalb von 24 Stunden."
      />
      <section className="public-section">
        <h2>Kontakt</h2>
        <p className="public-section-intro">
          Erzählen Sie uns kurz von Ihrem Vorhaben — wir melden uns innerhalb von 24 Stunden. Oder rufen Sie uns
          direkt an.
        </p>

        <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 320px", minWidth: 280 }}>
            <ContactForm title="" />
          </div>
          <div style={{ flex: "1 1 240px", minWidth: 240 }}>
            <div className="public-card">
              <h3 style={{ marginBottom: 12 }}>Direkt erreichbar</h3>
              <p style={{ marginBottom: 8 }}>
                Telefon:{" "}
                <a href={telefonHref} style={{ color: "var(--color-primary)" }}>
                  {telefon}
                </a>
              </p>
              <p style={{ marginBottom: 8 }}>
                E-Mail:{" "}
                <a href={`mailto:${email}`} style={{ color: "var(--color-primary)" }}>
                  {email}
                </a>
              </p>
              <p style={{ margin: 0 }}>Einsatzgebiet: {einsatzgebiet}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
