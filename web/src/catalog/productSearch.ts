import type { ProductResponse } from "./catalogApi";

/**
 * Normalize a string for accent- and case-insensitive comparison.
 *
 * Decomposes the string with NFD so combining marks (e.g. the acute accent on
 * `é`) are separated from their base letter, strips those combining marks via
 * the Unicode `Mn` (Mark, Nonspacing) category, and lowercases the result.
 * This reuses `String.prototype.normalize` and avoids any new dependency.
 *
 * Note: AdminProducts (`web/src/admin/AdminProducts.tsx`) keeps its
 * accent-sensitive filter by decision — it uses
 * `String.prototype.toLowerCase` only. The Market product-name search here
 * is the documented difference.
 */
export function normalizeForSearch(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/**
 * Filter Products by a case- and accent-insensitive substring of `term`
 * against `product.name` only.
 *
 * Leading and trailing whitespace on `term` are trimmed; an empty or
 * whitespace-only `term` returns every Product. Internal whitespace inside
 * `term` is significant (it is not collapsed). The Product `description` is
 * never searched. The input array and Product objects are not mutated, and
 * Product names are never re-displayed — only compared.
 */
export function filterProductsByName(
  products: ProductResponse[],
  term: string
): ProductResponse[] {
  const trimmed = term.trim();
  if (trimmed.length === 0) {
    return [...products];
  }
  const normalizedTerm = normalizeForSearch(trimmed);
  return products.filter((product) =>
    normalizeForSearch(product.name).includes(normalizedTerm)
  );
}
