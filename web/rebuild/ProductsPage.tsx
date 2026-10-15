import type { FormValues } from "./state";
import type { CreateProductInput } from "./transport/types";
import type { ProductsState } from "./state";
import { BrandStrip } from "./sections/BrandStrip";
import { PageHead } from "./sections/PageHead";
import { Catalog } from "./sections/Catalog";
import { ProductDetail } from "./sections/ProductDetail";
import { Workshop } from "./sections/Workshop";

interface ProductsPageProps {
  state: ProductsState;
  onSubmit(input: CreateProductInput): void;
  onCreateChange(values: FormValues): void;
  onCreateReset(): void;
  onRefreshList(): void;
  onOpenDetail(productId: string, returnFocus: HTMLElement | null): void;
  onCloseDetail(): void;
  onRetryRuntime(): void;
}

/**
 * Document order matches the visual reading order and yields this heading
 * outline (sibling h2s at the same level — no level skip):
 *   h1 (Products)
 *     h2 (Catalog · N items)
 *       h3 (product cards)
 *     h2 (product detail, when open)  ← directly under the catalog, so
 *                                     "View details" reveals the result of
 *                                     the click without scrolling
 *     h2 (Create Product)
 * Keeping the detail adjacent to the catalog is a usability requirement
 * (visible result of the action), not only an a11y one.
 */
export function ProductsPage(props: ProductsPageProps) {
  const { state } = props;
  return (
    <main className="app-shell" data-testid="page-root">
      <BrandStrip runtime={state.runtime} />
      <PageHead runtime={state.runtime} onRetryRuntime={props.onRetryRuntime} />
      <Catalog
        list={state.list}
        runtime={state.runtime}
        onOpenDetail={props.onOpenDetail}
        onRefresh={props.onRefreshList}
      />
      <ProductDetail slice={state.detail} onClose={props.onCloseDetail} />
      <Workshop
        slice={state.create}
        disabled={state.runtime.kind !== "ready"}
        onSubmit={props.onSubmit}
        onChange={props.onCreateChange}
        onReset={props.onCreateReset}
      />
    </main>
  );
}