import { useEffect, useRef, type ReactNode } from "react";
import type { ProductResponse } from "./catalogApi";
import ProductMedia from "./ProductMedia";
import Button from "../ui/Button";
import { formatAmount } from "../formatAmount";

export default function ProductDetail({
  product,
  isCartPending,
  onBack,
  onAdd,
  cartTrigger
}: {
  product: ProductResponse;
  isCartPending: boolean;
  onBack: () => void;
  onAdd: (product: ProductResponse) => Promise<void>;
  cartTrigger: ReactNode;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section
      id="products"
      className="grid min-w-0 gap-5 overflow-hidden rounded-lg border border-border bg-surface shadow-card"
      aria-labelledby="product-detail-heading"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
        <Button variant="quiet" size="sm" onClick={onBack}>
          <span aria-hidden="true">&#8592;</span> Back to Products
        </Button>
        {cartTrigger}
      </div>
      <div className="grid items-start gap-6 px-5 pb-6 min-[52rem]:grid-cols-[minmax(0,1.35fr)_minmax(16rem,1fr)]">
        <div className="grid gap-4">
          <div className="flex items-center gap-3">
            <ProductMedia name={product.name} mediaKey={product.mediaKey} variant="detail" />
            <div className="grid gap-1.5">
              <p className="text-[0.75rem] font-bold uppercase tracking-[0.14em] text-muted">
                Product
              </p>
              <h1
                id="product-detail-heading"
                ref={headingRef}
                tabIndex={-1}
                className="text-[clamp(1.5rem,3vw,2.125rem)] leading-[1.15] tracking-[-0.025em] text-ink"
              >
                {product.name}
              </h1>
            </div>
          </div>
          <p className="max-w-prose leading-relaxed text-muted">{product.description}</p>
        </div>
        <div className="grid gap-4 rounded-lg border border-border bg-surface-muted/50 p-4">
          <div className="grid gap-1">
            <span className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-muted">
              Price
            </span>
            <span className="text-3xl font-extrabold tracking-[-0.02em] text-ink">
              {formatAmount(product.price)}
            </span>
          </div>
          <Button
            className="w-full"
            onClick={() => void onAdd(product)}
            disabled={isCartPending}
            aria-label={`Add ${product.name} to Cart`}
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </section>
  );
}
