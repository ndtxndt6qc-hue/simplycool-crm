import { useState } from "react";
import { formatChf } from "../lib/format";

const MONTH_LABELS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

const COLOR_UMSATZ = "#2a78d6";
const COLOR_DB = "#eb6834";

type MonthDatum = { monat: string; umsatz: number; deckungsbeitrag: number };

export function RevenueChart({ data }: { data: MonthDatum[] }) {
  const [hover, setHover] = useState<{ index: number; series: "umsatz" | "db" } | null>(null);

  const width = 720;
  const height = 260;
  const marginLeft = 56;
  const marginBottom = 28;
  const marginTop = 12;
  const plotWidth = width - marginLeft - 16;
  const plotHeight = height - marginTop - marginBottom;

  const maxValue = Math.max(1, ...data.map((d) => Math.max(d.umsatz, d.deckungsbeitrag)));
  const niceMax = Math.ceil(maxValue / 1000) * 1000 || 1000;

  const groupWidth = plotWidth / data.length;
  const barWidth = Math.min(18, groupWidth / 3);
  const gap = 3;

  function y(value: number) {
    return marginTop + plotHeight - (value / niceMax) * plotHeight;
  }

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => niceMax * f);

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Umsatz &amp; Deckungsbeitrag pro Monat</h3>
        <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--color-text-muted)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: COLOR_UMSATZ, display: "inline-block" }} />
            Umsatz
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: COLOR_DB, display: "inline-block" }} />
            Deckungsbeitrag
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={marginLeft} x2={width} y1={y(g)} y2={y(g)} stroke="#e2e8f0" strokeWidth={1} />
            <text x={marginLeft - 8} y={y(g)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="#94a3b8">
              {g >= 1000 ? `${g / 1000}k` : g}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const groupX = marginLeft + i * groupWidth + (groupWidth - barWidth * 2 - gap) / 2;
          const [year, month] = d.monat.split("-");
          const label = `${MONTH_LABELS[Number(month) - 1]} ${year.slice(2)}`;
          return (
            <g key={d.monat}>
              <rect
                x={groupX}
                y={y(d.umsatz)}
                width={barWidth}
                height={Math.max(0, y(0) - y(d.umsatz))}
                rx={2}
                fill={COLOR_UMSATZ}
                opacity={hover && hover.index === i && hover.series !== "umsatz" ? 0.5 : 1}
                onMouseEnter={() => setHover({ index: i, series: "umsatz" })}
                onMouseLeave={() => setHover(null)}
              />
              <rect
                x={groupX + barWidth + gap}
                y={y(d.deckungsbeitrag)}
                width={barWidth}
                height={Math.max(0, y(0) - y(d.deckungsbeitrag))}
                rx={2}
                fill={COLOR_DB}
                opacity={hover && hover.index === i && hover.series !== "db" ? 0.5 : 1}
                onMouseEnter={() => setHover({ index: i, series: "db" })}
                onMouseLeave={() => setHover(null)}
              />
              <text
                x={groupX + barWidth + gap / 2}
                y={height - marginBottom + 16}
                textAnchor="middle"
                fontSize={10}
                fill="#94a3b8"
              >
                {label}
              </text>
            </g>
          );
        })}

        <line x1={marginLeft} x2={width} y1={y(0)} y2={y(0)} stroke="#cbd5e1" strokeWidth={1} />

        {hover && (
          <g>
            <rect
              x={marginLeft + hover.index * groupWidth + groupWidth / 2 - 55}
              y={y(hover.series === "umsatz" ? data[hover.index].umsatz : data[hover.index].deckungsbeitrag) - 30}
              width={110}
              height={22}
              rx={4}
              fill="#0f172a"
            />
            <text
              x={marginLeft + hover.index * groupWidth + groupWidth / 2}
              y={y(hover.series === "umsatz" ? data[hover.index].umsatz : data[hover.index].deckungsbeitrag) - 15}
              textAnchor="middle"
              fontSize={11}
              fill="white"
            >
              {formatChf(hover.series === "umsatz" ? data[hover.index].umsatz : data[hover.index].deckungsbeitrag)}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
