import type { ProductResponse } from "./catalogApi";

export const lowStockThreshold = 5;

export function isSoldOut(product: ProductResponse): boolean {
  return product.stock === 0;
}

/** In stock, "N left" at five or fewer, or Sold out. Nothing is shown when the server sends no stock. */
export default function StockBadge({ product }: { product: ProductResponse }) {
  const stock = product.stock;

  if (stock === undefined) {
    return null;
  }

  const [label, className] =
    stock === 0
      ? ["Sold out", "bg-ink text-canvas"]
      : stock <= lowStockThreshold
        ? [`${stock} left`, "bg-pending-surface text-ink"]
        : ["In stock", "bg-surface text-ink"];

  return (
    <span
      className={`inline-block rounded-[3px] border-[1.5px] border-ink px-1.5 py-0.5 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.06em] ${className}`}
    >
      {label}
    </span>
  );
}
