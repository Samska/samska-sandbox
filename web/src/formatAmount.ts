const amountFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

/** Formats a synthetic amount as US dollars, for example `$12.50`. */
export function formatAmount(amount: number): string {
  return amountFormatter.format(amount);
}
