import { useState } from "react";

export type FaqEintrag = { frage: string; antwort: string };

export function Faq({ eintraege }: { eintraege: FaqEintrag[] }) {
  const [offenIndex, setOffenIndex] = useState<number | null>(0);

  return (
    <div>
      {eintraege.map((eintrag, idx) => {
        const offen = offenIndex === idx;
        return (
          <div className="public-faq-item" key={eintrag.frage}>
            <button
              type="button"
              className="public-faq-question"
              onClick={() => setOffenIndex(offen ? null : idx)}
              aria-expanded={offen}
            >
              <span>{eintrag.frage}</span>
              <span aria-hidden="true">{offen ? "−" : "+"}</span>
            </button>
            {offen && <div className="public-faq-answer">{eintrag.antwort}</div>}
          </div>
        );
      })}
    </div>
  );
}
