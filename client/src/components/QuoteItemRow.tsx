import { useState } from "react";
import { QUOTE_ITEM_TYP_LABELS } from "../lib/labels";
import { formatChf } from "../lib/format";
import { useDeleteQuoteItem, useMoveQuoteItem, useUpdateQuoteItem, type QuoteItem } from "../lib/quotes";

export function QuoteItemRow({
  quoteId,
  item,
  isFirst,
  isLast,
  locked,
}: {
  quoteId: number;
  item: QuoteItem;
  isFirst: boolean;
  isLast: boolean;
  locked: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [beschreibung, setBeschreibung] = useState(item.beschreibung);
  const [menge, setMenge] = useState(item.menge);
  const [einheit, setEinheit] = useState(item.einheit ?? "");
  const [einzelpreis, setEinzelpreis] = useState(item.einzelpreis);
  const [einkaufspreisIntern, setEinkaufspreisIntern] = useState(item.einkaufspreisIntern);

  const updateItem = useUpdateQuoteItem(quoteId);
  const deleteItem = useDeleteQuoteItem(quoteId);
  const moveItem = useMoveQuoteItem(quoteId);

  const total = Number(item.einzelpreis) * Number(item.menge);
  const db = (Number(item.einzelpreis) - Number(item.einkaufspreisIntern)) * Number(item.menge);

  async function handleSave() {
    await updateItem.mutateAsync({
      id: item.id,
      beschreibung,
      menge: Number(menge),
      einheit: einheit || undefined,
      einzelpreis: Number(einzelpreis),
      einkaufspreisIntern: Number(einkaufspreisIntern),
    });
    setEditing(false);
  }

  if (editing) {
    return (
      <tr>
        <td>{QUOTE_ITEM_TYP_LABELS[item.typ]}</td>
        <td>
          <input value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} style={{ width: "100%" }} />
        </td>
        <td style={{ display: "flex", gap: 4 }}>
          <input
            type="number"
            step="0.01"
            value={menge}
            onChange={(e) => setMenge(e.target.value)}
            style={{ width: 60 }}
          />
          <input
            placeholder="Einh."
            value={einheit}
            onChange={(e) => setEinheit(e.target.value)}
            style={{ width: 60 }}
          />
        </td>
        <td>
          <input
            type="number"
            step="0.01"
            value={einzelpreis}
            onChange={(e) => setEinzelpreis(e.target.value)}
            style={{ width: 80 }}
          />
        </td>
        <td>{formatChf(Number(einzelpreis || 0) * Number(menge || 0))}</td>
        <td>
          <input
            type="number"
            step="0.01"
            value={einkaufspreisIntern}
            onChange={(e) => setEinkaufspreisIntern(e.target.value)}
            style={{ width: 80 }}
          />
        </td>
        <td style={{ display: "flex", gap: 4 }}>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={updateItem.isPending}>
            OK
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>
            Abbrechen
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>{QUOTE_ITEM_TYP_LABELS[item.typ]}</td>
      <td>{item.beschreibung}</td>
      <td>
        {item.menge}
        {item.einheit ? ` ${item.einheit}` : ""}
      </td>
      <td>{formatChf(item.einzelpreis)}</td>
      <td>{formatChf(total)}</td>
      <td style={{ color: db >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>{formatChf(db)}</td>
      <td>
        {locked ? (
          <span style={{ color: "var(--color-text-muted)", fontSize: 12 }}>gesperrt</span>
        ) : (
          <div style={{ display: "flex", gap: 4 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => moveItem.mutate({ itemId: item.id, direction: "up" })}
              disabled={isFirst || moveItem.isPending}
              aria-label="Nach oben"
            >
              ↑
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => moveItem.mutate({ itemId: item.id, direction: "down" })}
              disabled={isLast || moveItem.isPending}
              aria-label="Nach unten"
            >
              ↓
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)} aria-label="Bearbeiten">
              ✎
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => deleteQuoteItemWithConfirm(item.beschreibung, () => deleteItem.mutate(item.id))}
              aria-label="Position löschen"
            >
              ×
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

function deleteQuoteItemWithConfirm(beschreibung: string, onConfirm: () => void) {
  if (confirm(`Position "${beschreibung}" wirklich löschen?`)) onConfirm();
}
