/**
 * Format a price for display in the R1 candidate UI.
 *
 * The wire format preserves the full scale (no rounding, no currency). For
 * display we group with en-US thousands and show two decimal places without
 * a currency symbol — the same reference used by SS031/formatAmount.
 */
export function formatAmount(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true
  }).format(value);
}