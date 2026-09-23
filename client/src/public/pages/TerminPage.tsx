import { Seo } from "../components/Seo";
import { BookingCalendar } from "../components/BookingCalendar";

export function TerminPage() {
  return (
    <>
      <Seo
        title="Termin buchen"
        description="Vereinbaren Sie direkt online einen Beratungstermin für Ihre Klimaanlage ohne Aussengerät — SimplyCool aus Rüfenach AG."
      />
      <section className="public-section">
        <h2>Termin buchen</h2>
        <p className="public-section-intro">
          Wählen Sie einen freien Termin für ein unverbindliches Beratungsgespräch — direkt online, ohne Rückfrage.
        </p>
        <BookingCalendar />
      </section>
    </>
  );
}
