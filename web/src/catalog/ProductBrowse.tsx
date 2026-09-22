import type { ReactNode } from "react";
import type { ProductResponse } from "./catalogApi";
import ProductMedia from "./ProductMedia";
import Button from "../ui/Button";
import StatusMessage from "../ui/StatusMessage";
import { formatAmount } from "../formatAmount";

export default function ProductBrowse({
  products,
  isPending,
  error,
  isCartPending,
  onRetry,
  onAdd,
  onSelect,
  onViewDetailsRef,
  cartTrigger
}: {
  products: ProductResponse[];
  isPending: boolean;
  error: string | null;
  isCartPending: boolean;
  onRetry: () => void;
  onAdd: (product: ProductResponse) => Promise<void>;
  onSelect: (product: ProductResponse) => void;
  onViewDetailsRef: (productId: string, node: HTMLButtonElement | null) => void;
  cartTrigger: ReactNode;
}) {
  const productCount = products.length;

  return (
    <section
      id="products"
      className="grid min-w-0 gap-6"
      aria-labelledby="product-browse-heading"
      aria-busy={isPending}
    >
      <div className="grid gap-1.5">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.14em] text-muted">
          Catalog
        </p>
        <h1
          id="product-browse-heading"
          className="text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.1] tracking-[-0.03em] text-ink"
        >
          Products
        </h1>
        <p className="text-muted">Browse available products for your next order.</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {!isPending && error === null && productCount > 0 ? (
          <p className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm font-bold text-muted">
            {productCount} {productCount === 1 ? "product" : "products"}
          </p>
        ) : (
          <span aria-hidden="true" />
        )}
        {cartTrigger}
      </div>
      {isPending ? <StatusMessage tone="neutral">Loading Products...</StatusMessage> : null}
      {error !== null ? (
        <div className="grid gap-3">
          <StatusMessage tone="error">{error}</StatusMessage>
          <Button onClick={onRetry} disabled={isPending}>
            Retry Products
          </Button>
        </div>
      ) : null}
      {!isPending && error === null && productCount === 0 ? (
        <div className="grid gap-3 rounded-lg border border-border bg-surface p-6">
          <p className="font-bold text-ink">No Products are available yet.</p>
          <a className="w-fit font-bold text-brand-dark" href="#catalog-tools">
            Create the first Product
          </a>
        </div>
      ) : null}
      {!isPending && error === null && productCount > 0 ? (
        <ul className="grid list-none gap-4 p-0 m-0 min-[44rem]:grid-cols-[repeat(auto-fill,minmax(14rem,17.5rem))] min-[44rem]:justify-start">
          {products.map((product) => (
            <li
              key={product.id}
              className="grid grid-rows-[auto_minmax(0,1fr)_auto_auto] gap-4 rounded-lg border border-border bg-surface p-4 hover:border-border-strong hover:shadow-product focus-within:border-border-strong focus-within:shadow-product"
            >
              <ProductMedia name={product.name} mediaKey={product.mediaKey} variant="card" />
              <div className="grid min-w-0 content-start gap-1">
                <h3 className="text-base font-extrabold leading-snug tracking-[-0.01em] text-ink">
                  {product.name}
                </h3>
                <p className="line-clamp-2 text-sm leading-relaxed text-muted">
                  {product.description}
                </p>
              </div>
              <p className="text-xl font-extrabold tracking-[-0.01em] text-ink">
                {formatAmount(product.price)}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onSelect(product)}
                  aria-label={`View details for ${product.name}`}
                  ref={(node) => onViewDetailsRef(product.id, node)}
                >
                  Details
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => void onAdd(product)}
                  disabled={isCartPending}
                  aria-label={`Add ${product.name} to Cart`}
                >
                  Add to Cart
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
