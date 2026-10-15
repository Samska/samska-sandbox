import type { ListSlice, ProductsState } from "../state";
import { Monogram } from "../ui/Monogram";
import { formatAmount } from "../formatAmount";
import { humaniseReadError } from "../messages";

interface CatalogProps {
  list: ListSlice;
  runtime: ProductsState["runtime"];
  onOpenDetail(productId: string, returnFocus: HTMLElement | null): void;
  onRefresh(): void;
}

/**
 * Storefront: catalog heading (h2) + refresh action + editorial product grid
 * with monogram fallback, name and price. Distinct from the workshop: serif
 * type, single frame per card, single brand accent, no nested boxes.
 */
export function Catalog({ list, runtime, onOpenDetail, onRefresh }: CatalogProps) {
  const disabled = runtime.kind !== "ready";
  const itemCount = list.status === "success" ? list.products.length : 0;
  const refreshing = list.status === "loading";
  return (
    <section
      className="section"
      aria-labelledby="catalog-heading"
    >
      <div className="page-head__row">
        <h2 id="catalog-heading" className="page-head__eyebrow">
          Catalog · {itemCount} {itemCount === 1 ? "item" : "items"}
        </h2>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={onRefresh}
          disabled={disabled}
          aria-busy={refreshing}
          data-testid="refresh-list"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      <ListBody list={list} disabled={disabled} onOpenDetail={onOpenDetail} onRefresh={onRefresh} />
    </section>
  );
}

function ListBody({
  list,
  disabled,
  onOpenDetail,
  onRefresh
}: {
  list: ListSlice;
  disabled: boolean;
  onOpenDetail(id: string, returnFocus: HTMLElement | null): void;
  onRefresh(): void;
}) {
  if (disabled) {
    return (
      <p className="list-state" data-testid="list-disabled">
        Product list unavailable while candidate backend is not ready.
      </p>
    );
  }
  if (list.status === "idle" || list.status === "loading") {
    return (
      <p
        className="list-state"
        aria-live="polite"
        data-testid="list-loading"
      >
        Loading products…
      </p>
    );
  }
  if (list.status === "error") {
    return (
      <div className="list-state list-state--error" data-testid="list-error">
        <p>{humaniseReadError(list.error)}</p>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={onRefresh}
        >
          Retry loading
        </button>
      </div>
    );
  }
  if (list.products.length === 0) {
    return (
      <div className="list-state" data-testid="list-empty">
        <p className="list-state__title">No products yet</p>
        <p>Create one in the workshop below.</p>
      </div>
    );
  }
  return (
    <ul className="catalog-grid" data-testid="product-list">
      {list.products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onOpenDetail={onOpenDetail}
        />
      ))}
    </ul>
  );
}

function ProductCard({
  product,
  onOpenDetail
}: {
  product: { id: string; name: string; price: number };
  onOpenDetail(id: string, returnFocus: HTMLElement | null): void;
}) {
  const cardId = `product-name-${product.id}`;
  return (
    <li className="product-card" data-testid={`card-${product.id}`}>
      <Monogram name={product.name} labelledBy={cardId} />
      <h3 id={cardId} className="product-card__name">
        {product.name}
      </h3>
      <p className="product-card__price" data-testid={`price-${product.id}`}>
        {formatAmount(product.price)}
      </p>
      <button
        type="button"
        className="btn btn--text product-card__action"
        onClick={(event) => onOpenDetail(product.id, event.currentTarget)}
        data-testid={`view-${product.id}`}
      >
        View details
      </button>
    </li>
  );
}