const amountFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export function formatAmount(amount: number): string {
  return amountFormatter.format(amount);
}
