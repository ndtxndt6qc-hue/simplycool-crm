export function formatChf(value: number | string) {
  return new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF" }).format(Number(value));
}
