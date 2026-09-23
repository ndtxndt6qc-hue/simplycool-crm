import { Seo } from "../components/Seo";
import { BookingCalendar } from "../components/BookingCalendar";
import { usePageTextMap, getText } from "../../lib/pageTexts";

export function TerminPage() {
  const texts = usePageTextMap();
  return (
    <>
      <Seo
        title="Termin buchen"
        description="Vereinbaren Sie direkt online einen Beratungstermin für Ihre Klimaanlage ohne Aussengerät — SimplyCool aus Rüfenach AG."
      />
      <section className="public-section">
        <h2>{getText(texts, "termin.intro.titel")}</h2>
        <p className="public-section-intro">{getText(texts, "termin.intro.text")}</p>
        <BookingCalendar />
      </section>
    </>
  );
}
