import { useRef, type ReactNode } from "react";
import StockBadge, { isSoldOut } from "./StockBadge";
import type { ProductResponse } from "./catalogApi";
import ProductMedia from "./ProductMedia";
import Button from "../ui/Button";
import StatusMessage from "../ui/StatusMessage";
import FormField from "../ui/FormField";
import { formatAmount } from "../formatAmount";
import { filterProductsByName } from "./productSearch";

export default function ProductBrowse({
  products,
  isPending,
  error,
  isCartPending,
  onRetry,
  onAdd,
  onSelect,
  onViewDetailsRef,
  cartTrigger,
  searchTerm,
  onSearchTermChange,
  onSearchInputRef
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
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onSearchInputRef: (node: HTMLInputElement | null) => void;
}) {
  const productCount = products.length;
  const visibleProducts = filterProductsByName(products, searchTerm);
  const trimmedTerm = searchTerm.trim();
  const showSearch = !isPending && error === null && productCount > 0;
  const searchInputNodeRef = useRef<HTMLInputElement | null>(null);
  const registerSearchInput = (node: HTMLInputElement | null) => {
    searchInputNodeRef.current = node;
    onSearchInputRef(node);
  };

  function handleClearSearch() {
    onSearchTermChange("");
    searchInputNodeRef.current?.focus();
  }

  const countBadge =
    !isPending && error === null && productCount > 0 ? (
      <p
        aria-live="polite"
        className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-muted"
      >
        {trimmedTerm.length === 0
          ? `${productCount} ${productCount === 1 ? "product" : "products"}`
          : `${visibleProducts.length} of ${productCount} ${productCount === 1 ? "product" : "products"}`}
      </p>
    ) : (
      <span aria-hidden="true" />
    );

  return (
    <section
      id="products"
      className="grid min-w-0 gap-6"
      aria-labelledby="product-browse-heading"
      aria-busy={isPending}
    >
      <div className="grid gap-1.5">
        <p className="font-mono text-[0.75rem] font-medium uppercase tracking-[0.14em] text-muted">
          Catalog
        </p>
        <h1
          id="product-browse-heading"
          className="text-[clamp(2.5rem,7vw,5rem)] text-ink"
        >
          Products
        </h1>
        <p className="text-muted">Browse available products for your next order.</p>
      </div>
      {showSearch ? (
        <div className="grid gap-3 min-[36rem]:grid-cols-[minmax(0,24rem)_auto] min-[36rem]:items-end">
          <FormField id="market-search" label="Search Products by name" error={null}>
            {(control) => (
              <input
                {...control}
                type="search"
                value={searchTerm}
                onChange={(event) => onSearchTermChange(event.target.value)}
                ref={registerSearchInput}
              />
            )}
          </FormField>
          {searchTerm.length > 0 ? (
            <Button
              variant="secondary"
              className="justify-self-start"
              onClick={handleClearSearch}
            >
              Clear search
            </Button>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {countBadge}
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
        <div className="grid gap-2 rounded-sm border-[1.5px] border-dashed border-ink bg-surface p-6">
          <p className="font-bold text-ink">No Products are available yet.</p>
          <p className="text-muted">
            Create a synthetic Product in Admin to start a First Order journey. New Products will
            appear here once they exist.
          </p>
          <a className="w-fit font-bold text-brand-dark underline decoration-brand decoration-2 underline-offset-4" href="/admin/products/new">
            Create a synthetic Product
          </a>
        </div>
      ) : null}
      {!isPending && error === null && productCount > 0 && visibleProducts.length === 0 ? (
        <div className="grid gap-2 rounded-sm border-[1.5px] border-dashed border-ink bg-surface p-6">
          <p className="font-bold text-ink">No Products match &quot;{trimmedTerm}&quot;.</p>
          <p className="text-muted">Clear the search to see the full Product list.</p>
        </div>
      ) : null}
      {!isPending && error === null && visibleProducts.length > 0 ? (
        <ul className="m-0 grid list-none gap-2.5 p-0 min-[48rem]:grid-cols-2 min-[68rem]:grid-cols-3">
          {visibleProducts.map((product) => (
            <li
              key={product.id}
              className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-start gap-x-3 gap-y-1 rounded-sm border-[1.5px] border-ink bg-surface p-2.5"
            >
              <div className="row-span-3">
                <ProductMedia product={product} variant="row" />
              </div>
              <h3 className="min-w-0 text-base uppercase leading-tight text-ink">{product.name}</h3>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <p className="font-mono text-[0.95rem] font-semibold text-ink">{formatAmount(product.price)}</p>
                <StockBadge product={product} />
              </div>
              <p className="line-clamp-1 text-[0.82rem] text-muted">{product.description}</p>
              <div className="col-start-2 flex items-center gap-2">
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
                  disabled={isCartPending || isSoldOut(product)}
                  aria-label={`Add ${product.name} to Cart`}
                >
                  {isSoldOut(product) ? "Sold out" : "Add to Cart"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
