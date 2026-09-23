// Registriert alle Texte der öffentlichen Webseite (V1 + V2), die im internen Bereich
// unter "Webseiten-Texte" bearbeitet werden können. Jeder Key hat hier einen Default —
// dieser Default ist gleichzeitig der aktuell im Code stehende Text, also das Verhalten
// vor Einführung dieses Editors. Fehlt in der DB ein Override, wird der Default gerendert.
export type PageTextField = {
  id: string;
  group: string;
  label: string;
  default: string;
  multiline?: boolean;
};

export const PAGE_TEXT_FIELDS: PageTextField[] = [
  // Kontaktdaten — erscheinen in Header/Footer/Kontaktseite auf V1 und V2
  { id: "kontakt.telefon", group: "Kontaktdaten", label: "Telefonnummer (Anzeige)", default: "079 000 00 00" },
  { id: "kontakt.email", group: "Kontaktdaten", label: "E-Mail-Adresse", default: "info@simply-cool.ch" },
  { id: "kontakt.einsatzgebiet", group: "Kontaktdaten", label: "Einsatzgebiet", default: "Rüfenach AG und Umgebung" },

  // Bestätigung nach Formularversand — Kontaktformular auf V1 und V2
  {
    id: "kontakt.danke.titel",
    group: "Kontaktdaten",
    label: "Bestätigung nach Anfrage — Titel",
    default: "Danke für Ihre Anfrage!",
  },
  {
    id: "kontakt.danke.text",
    group: "Kontaktdaten",
    label: "Bestätigung nach Anfrage — Text",
    multiline: true,
    default: "Wir melden uns innerhalb von 24 Stunden bei Ihnen.",
  },

  // Startseite — Hero
  {
    id: "home.hero.headline",
    group: "Startseite",
    label: "Hero-Überschrift",
    default: "Kühle Nächte, warme Übergangszeit — in 1 Tag installiert, ohne Baugesuch",
  },
  {
    id: "home.hero.text",
    group: "Startseite",
    label: "Hero-Text",
    multiline: true,
    default:
      "Monoblock-Klimageräte von SimplyCool kühlen im Sommer und heizen in der Übergangszeit — ganz ohne Aussengerät und meist ohne Bewilligungsverfahren.",
  },

  // Kernargumente — 3 Karten, genutzt auf Startseite V1 + V2
  { id: "argument.1.titel", group: "Kernargumente", label: "Argument 1 — Titel", default: "Kein Aussengerät" },
  {
    id: "argument.1.text",
    group: "Kernargumente",
    label: "Argument 1 — Text",
    multiline: true,
    default: "Keine Fassadenveränderung, kein sichtbares Aussengerät — nur zwei dezente Kernbohrungen.",
  },
  {
    id: "argument.2.titel",
    group: "Kernargumente",
    label: "Argument 2 — Titel",
    default: "In der Regel keine Baubewilligung nötig",
  },
  {
    id: "argument.2.text",
    group: "Kernargumente",
    label: "Argument 2 — Text",
    multiline: true,
    default: "Dank fehlendem Aussengerät ist meist kein Baugesuch erforderlich — wir klären das für Sie ab.",
  },
  { id: "argument.3.titel", group: "Kernargumente", label: "Argument 3 — Titel", default: "Kühlen UND Heizen" },
  {
    id: "argument.3.text",
    group: "Kernargumente",
    label: "Argument 3 — Text",
    multiline: true,
    default: "Perfekt für heisse Sommernächte und die kühle Übergangszeit — ein Gerät für beides.",
  },

  // Installationsablauf — 3 Schritte
  { id: "ablauf.1.titel", group: "Installationsablauf", label: "Schritt 1 — Titel", default: "Anfrage" },
  {
    id: "ablauf.1.text",
    group: "Installationsablauf",
    label: "Schritt 1 — Text",
    multiline: true,
    default: "Sie senden uns Ihre Anfrage über das Formular oder per Telefon.",
  },
  { id: "ablauf.2.titel", group: "Installationsablauf", label: "Schritt 2 — Titel", default: "Vor-Ort-Termin" },
  {
    id: "ablauf.2.text",
    group: "Installationsablauf",
    label: "Schritt 2 — Text",
    multiline: true,
    default: "Wir besichtigen die Räumlichkeiten und erstellen ein passendes Angebot.",
  },
  {
    id: "ablauf.3.titel",
    group: "Installationsablauf",
    label: "Schritt 3 — Titel",
    default: "Installation in wenigen Stunden",
  },
  {
    id: "ablauf.3.text",
    group: "Installationsablauf",
    label: "Schritt 3 — Text",
    multiline: true,
    default: "Montage und Kernbohrung erledigen wir in der Regel an einem Tag.",
  },

  // Leistungen
  {
    id: "leistungen.intro",
    group: "Leistungen",
    label: "Einleitung",
    multiline: true,
    default:
      "SimplyCool übernimmt die Installation Ihres Monoblock-Klimageräts von der ersten Beratung bis zur betriebsbereiten Anlage — unkompliziert und aus einer Hand.",
  },
  { id: "leistungen.phase1.titel", group: "Leistungen", label: "Phase 1 — Titel", default: "Anfrage & Vorabklärung" },
  {
    id: "leistungen.phase1.text",
    group: "Leistungen",
    label: "Phase 1 — Text",
    multiline: true,
    default:
      "Sie schildern uns Ihr Vorhaben. Wir prüfen anhand der Gemeinde, ob eine Melde- oder Bewilligungspflicht besteht, und melden uns mit einem Terminvorschlag.",
  },
  { id: "leistungen.phase2.titel", group: "Leistungen", label: "Phase 2 — Titel", default: "Vor-Ort-Termin & Angebot" },
  {
    id: "leistungen.phase2.text",
    group: "Leistungen",
    label: "Phase 2 — Text",
    multiline: true,
    default:
      "Wir besichtigen die Räumlichkeiten, beraten zur passenden Geräteleistung und Platzierung und erstellen ein transparentes Festpreis-Angebot.",
  },
  { id: "leistungen.phase3.titel", group: "Leistungen", label: "Phase 3 — Titel", default: "Installation" },
  {
    id: "leistungen.phase3.text",
    group: "Leistungen",
    label: "Phase 3 — Text",
    multiline: true,
    default:
      "Am Installationstag montieren wir das Gerät und erstellen die zwei nötigen Kernbohrungen durch die Aussenwand — meist innerhalb weniger Stunden.",
  },
  { id: "leistungen.phase4.titel", group: "Leistungen", label: "Phase 4 — Titel", default: "Abnahme & Einweisung" },
  {
    id: "leistungen.phase4.text",
    group: "Leistungen",
    label: "Phase 4 — Text",
    multiline: true,
    default: "Wir zeigen Ihnen die Bedienung, halten die Abnahme fest und stehen danach für Fragen zur Verfügung.",
  },

  // FAQ — 4 Einträge, genutzt auf Startseite V2 (Auszug) + Leistungen V1/V2 (vollständig)
  { id: "faq.1.frage", group: "Häufige Fragen", label: "Frage 1", default: "Brauche ich eine Bewilligung?" },
  {
    id: "faq.1.antwort",
    group: "Häufige Fragen",
    label: "Antwort 1",
    multiline: true,
    default:
      "In den meisten Gemeinden ist für ein Monoblock-Klimagerät ohne Aussengerät keine Baubewilligung nötig, da keine Fassade sichtbar verändert wird. Manche Gemeinden verlangen jedoch eine einfache Meldung. Wir klären das für Ihre Gemeinde vorab ab und weisen es transparent im Angebot aus.",
  },
  { id: "faq.2.frage", group: "Häufige Fragen", label: "Frage 2", default: "Wie laut ist das Gerät?" },
  {
    id: "faq.2.antwort",
    group: "Häufige Fragen",
    label: "Antwort 2",
    multiline: true,
    default:
      "Da kein Aussengerät nötig ist, entfällt die typische Kompressor-Lautstärke draussen. Das Innengerät läuft im Normalbetrieb auf einem für Wohnräume unauffälligen, leisen Niveau.",
  },
  { id: "faq.3.frage", group: "Häufige Fragen", label: "Frage 3", default: "Wie lange dauert die Installation?" },
  {
    id: "faq.3.antwort",
    group: "Häufige Fragen",
    label: "Antwort 3",
    multiline: true,
    default: "In der Regel ist ein Gerät innerhalb weniger Stunden an einem Tag installiert — inklusive der zwei Kernbohrungen durch die Aussenwand.",
  },
  { id: "faq.4.frage", group: "Häufige Fragen", label: "Frage 4", default: "Was kostet es ungefähr?" },
  {
    id: "faq.4.antwort",
    group: "Häufige Fragen",
    label: "Antwort 4",
    multiline: true,
    default:
      "Die Kosten hängen von Raumgrösse, Wandbeschaffenheit und Anzahl Geräte ab. Nach einem kurzen Vor-Ort-Termin erhalten Sie ein transparentes Festpreis-Angebot ohne versteckte Kosten.",
  },

  // Über uns
  {
    id: "ueberuns.intro1",
    group: "Über uns",
    label: "Einleitung, Absatz 1",
    multiline: true,
    default:
      "SimplyCool hat sich auf die Installation von Monoblock-Klimageräten spezialisiert — Geräte, die ganz ohne Aussengerät auskommen und damit ohne aufwändiges Bewilligungsverfahren installiert werden können. Unser Ziel: Ihnen unkompliziert zu angenehmen Temperaturen verhelfen, im Sommer wie in der Übergangszeit.",
  },
  {
    id: "ueberuns.intro2",
    group: "Über uns",
    label: "Einleitung, Absatz 2",
    multiline: true,
    default:
      "Wir sind in Rüfenach AG zuhause und betreuen Kundinnen und Kunden im Aargau und der Deutschschweiz — von der ersten Beratung über die Installation bis zum Support danach.",
  },
  { id: "vertrauen.1.titel", group: "Über uns", label: "Vertrauensargument 1 — Titel", default: "Handwerkserfahrung" },
  {
    id: "vertrauen.1.text",
    group: "Über uns",
    label: "Vertrauensargument 1 — Text",
    multiline: true,
    default:
      "Fundiertes handwerkliches Know-how bei Montage, Kernbohrung und Elektroanschluss — sauber und zuverlässig ausgeführt.",
  },
  {
    id: "vertrauen.2.titel",
    group: "Über uns",
    label: "Vertrauensargument 2 — Titel",
    default: "Unkomplizierte Abwicklung",
  },
  {
    id: "vertrauen.2.text",
    group: "Über uns",
    label: "Vertrauensargument 2 — Text",
    multiline: true,
    default: "Von der Anfrage bis zur betriebsbereiten Anlage aus einer Hand — klare Kommunikation, transparente Fixpreise.",
  },
  { id: "vertrauen.3.titel", group: "Über uns", label: "Vertrauensargument 3 — Titel", default: "Lokale Verfügbarkeit" },
  {
    id: "vertrauen.3.text",
    group: "Über uns",
    label: "Vertrauensargument 3 — Text",
    multiline: true,
    default: "Als lokaler Anbieter aus Rüfenach AG sind wir rasch vor Ort und auch nach der Installation ansprechbar.",
  },
];
