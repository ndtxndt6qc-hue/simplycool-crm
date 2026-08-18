import { useState } from "react";
import { Link } from "react-router-dom";
import type { OrderListEntry } from "../lib/orders";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

function dateKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function OrderCalendar({ orders }: { orders: OrderListEntry[] }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const ordersByDay = new Map<string, OrderListEntry[]>();
  for (const o of orders) {
    if (!o.installationTermin) continue;
    const key = dateKey(new Date(o.installationTermin));
    if (!ordersByDay.has(key)) ordersByDay.set(key, []);
    ordersByDay.get(key)!.push(o);
  }

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const today = dateKey(new Date());

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <button className="btn btn-secondary" onClick={() => setCursor(new Date(year, month - 1, 1))}>
          ‹
        </button>
        <strong>
          {MONTHS[month]} {year}
        </strong>
        <button className="btn btn-secondary" onClick={() => setCursor(new Date(year, month + 1, 1))}>
          ›
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, fontSize: 11, color: "var(--color-text-muted)", marginBottom: 4 }}>
        {WEEKDAYS.map((w) => (
          <div key={w} style={{ textAlign: "center" }}>
            {w}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const key = dateKey(d);
          const dayOrders = ordersByDay.get(key) ?? [];
          const isToday = key === today;
          return (
            <div
              key={i}
              style={{
                minHeight: 56,
                borderRadius: 8,
                border: isToday ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                padding: 4,
                fontSize: 11,
              }}
            >
              <div style={{ color: "var(--color-text-muted)" }}>{d.getDate()}</div>
              {dayOrders.map((o) => (
                <Link
                  key={o.id}
                  to={`/auftraege/${o.id}`}
                  style={{
                    display: "block",
                    marginTop: 2,
                    padding: "2px 4px",
                    borderRadius: 4,
                    background: "#ecfdf5",
                    color: "var(--color-primary)",
                    textDecoration: "none",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {o.customer.nachname}
                </Link>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
