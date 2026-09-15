import { Seo } from "../../public/components/Seo";
import { ContactForm } from "../../public/components/ContactForm";

export function KontaktPageV2() {
  return (
    <>
      <Seo
        title="Kontakt"
        description="Kostenlose Anfrage für Ihre Klimaanlage ohne Aussengerät — SimplyCool meldet sich innerhalb von 24 Stunden."
      />

      <section className="pv2-hero" style={{ paddingBottom: 8 }}>
        <div className="pv2-hero-inner" style={{ paddingBottom: 40 }}>
          <div className="pv2-kicker">Kontakt</div>
          <h1>
            Unverbindliches <span className="pv2-accent">Beratungsgespräch.</span>
          </h1>
          <p>Erzählen Sie uns kurz von Ihrem Vorhaben — wir melden uns innerhalb von 24 Stunden.</p>
        </div>
      </section>

      <section className="pv2-section pv2-section--dark">
        <div className="pv2-section-inner">
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
