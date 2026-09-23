import { Seo } from "../../public/components/Seo";
import { BookingCalendar } from "../../public/components/BookingCalendar";
import { usePageTextMap, getText } from "../../lib/pageTexts";

export function TerminPageV2() {
  const texts = usePageTextMap();
  return (
    <>
      <Seo
        title="Termin buchen"
        description="Vereinbaren Sie direkt online einen Beratungstermin für Ihre Klimaanlage ohne Aussengerät — SimplyCool aus Rüfenach AG."
      />

      <section className="pv2-hero" style={{ paddingBottom: 8 }}>
        <div className="pv2-hero-inner" style={{ paddingBottom: 40 }}>
          <div className="pv2-kicker">Termin buchen</div>
          <h1>{getText(texts, "termin.intro.titel")}</h1>
          <p>{getText(texts, "termin.intro.text")}</p>
        </div>
      </section>

      <section className="pv2-section pv2-section--light">
        <div className="pv2-section-inner--narrow">
          <BookingCalendar />
        </div>
      </section>
    </>
  );
}
