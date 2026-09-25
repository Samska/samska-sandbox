import { useEffect, useRef, useState } from "react";
import {
  CatalogApiError,
  deleteProduct,
  listProducts,
  type ProductResponse
} from "../catalog/catalogApi";
import ProductMedia from "../catalog/ProductMedia";
import { curatedMediaSource } from "../catalog/mediaCatalog";
import { formatAmount } from "../formatAmount";
import Button from "../ui/Button";
import FormField from "../ui/FormField";
import StatusMessage from "../ui/StatusMessage";
import { adminDeleteErrorMessage, adminLoadErrorMessage, adminRefreshErrorMessage } from "./messages";

type FocusTarget =
  | { kind: "delete-button"; productId: string }
  | { kind: "confirm-cancel"; productId: string }
  | { kind: "products-heading" };

const PRODUCTS_HEADING_ID = "admin-products-heading";

export default function AdminProducts() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteIsConflict, setDeleteIsConflict] = useState(false);
  const pendingFocusRef = useRef<FocusTarget | null>(null);
  const isBusy = isLoading || isDeleting;

  useEffect(() => {
    void refreshProducts();
  }, []);

  useEffect(() => {
    if (isBusy) {
      return;
    }

    const target = pendingFocusRef.current;

    if (target === null) {
      return;
    }

    pendingFocusRef.current = null;
    focusTarget(target);
  });

  async function refreshProducts() {
    setIsLoading(true);
    setLoadError(null);

    try {
      setProducts(await listProducts());
    } catch (caughtError) {
      setLoadError(adminLoadErrorMessage(caughtError));
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshProductsAfterMutation() {
    try {
      setProducts(await listProducts());
    } catch {
      setLoadError(adminRefreshErrorMessage());
    }
  }

  function requestDeletion(productId: string) {
    setConfirmingDeleteId(productId);
    setDeleteError(null);
    setDeleteIsConflict(false);
    setNotice(null);
  }

  function cancelDeletion(productId: string) {
    setConfirmingDeleteId(null);
    setDeleteError(null);
    setDeleteIsConflict(false);
    pendingFocusRef.current = { kind: "delete-button", productId };
  }

  async function confirmDeletion(productId: string) {
    const displayOrder = visibleProducts.map((product) => product.id);
    const removedName = products.find((product) => product.id === productId)?.name ?? "Product";

    setIsDeleting(true);
    setDeleteError(null);
    setDeleteIsConflict(false);
    setNotice(null);

    try {
      await deleteProduct(productId);
      setNotice(`${removedName} was deleted.`);
      setConfirmingDeleteId(null);
      pendingFocusRef.current = adjacentDeleteTarget(displayOrder, productId);
      await refreshProductsAfterMutation();
    } catch (caughtError) {
      setDeleteError(adminDeleteErrorMessage(caughtError));
      setDeleteIsConflict(caughtError instanceof CatalogApiError && caughtError.kind === "conflict");
      pendingFocusRef.current = { kind: "confirm-cancel", productId };
    } finally {
      setIsDeleting(false);
    }
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleProducts =
    normalizedSearch.length === 0
      ? products
      : products.filter((product) => product.name.toLowerCase().includes(normalizedSearch));

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1.5">
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.14em] text-muted">Admin</p>
          <h1
            id="admin-heading"
            className="text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.1] tracking-[-0.03em] text-ink"
          >
            Product management
          </h1>
          <p className="max-w-prose text-muted">
            Find, edit, and delete Products. This local surface is navigation only and has no access
            control; the Market and Admin share the same Catalog.
          </p>
        </div>
        <a
          className="inline-flex min-h-11 items-center justify-center rounded-sm border border-brand bg-brand px-4 py-2.5 font-bold text-white no-underline hover:border-brand-dark hover:bg-brand-dark"
          href="/admin/products/new"
        >
          Create Product
        </a>
      </div>
      <section className="grid gap-4" aria-labelledby={PRODUCTS_HEADING_ID} aria-busy={isBusy}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id={PRODUCTS_HEADING_ID}
            tabIndex={-1}
            className="text-lg leading-[1.15] text-ink"
          >
            Products
          </h2>
          {!isLoading && loadError === null && products.length > 0 ? (
            <p className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm font-bold text-muted">
              {normalizedSearch.length === 0
                ? `${products.length} ${products.length === 1 ? "product" : "products"}`
                : `${visibleProducts.length} of ${products.length} products match`}
            </p>
          ) : null}
        </div>
        <div className="grid gap-3 min-[36rem]:grid-cols-[minmax(0,24rem)_auto] min-[36rem]:items-end">
          <FormField id="admin-search" label="Search Products by name" error={null}>
            {(control) => (
              <input
                {...control}
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                disabled={isBusy}
              />
            )}
          </FormField>
          {searchTerm.length > 0 ? (
            <Button
              variant="secondary"
              className="justify-self-start"
              onClick={() => setSearchTerm("")}
              disabled={isBusy}
            >
              Clear search
            </Button>
          ) : null}
        </div>
        {notice !== null ? <StatusMessage tone="success">{notice}</StatusMessage> : null}
        {isLoading ? <StatusMessage tone="neutral">Loading Products...</StatusMessage> : null}
        {loadError !== null ? (
          <div className="grid gap-3">
            <StatusMessage tone="error">{loadError}</StatusMessage>
            <Button onClick={() => void refreshProducts()} disabled={isLoading}>
              Retry Products
            </Button>
          </div>
        ) : null}
        {!isLoading && loadError === null && products.length === 0 ? (
          <div className="grid gap-2 rounded-lg bg-surface-muted px-4 py-5">
            <p className="font-bold text-ink">No Products exist yet.</p>
            <p className="text-sm text-muted">
              Use Create Product to add the first Product to the Catalog.
            </p>
          </div>
        ) : null}
        {!isLoading && loadError === null && products.length > 0 && visibleProducts.length === 0 ? (
          <div className="grid gap-2 rounded-lg bg-surface-muted px-4 py-5">
            <p className="font-bold text-ink">
              No Products match &ldquo;{searchTerm.trim()}&rdquo;.
            </p>
            <p className="text-sm text-muted">Clear the search to see the full Product list.</p>
          </div>
        ) : null}
        {!isLoading && loadError === null && visibleProducts.length > 0 ? (
          <ul className="grid list-none gap-2 p-0 m-0">
            {visibleProducts.map((product) => (
              <li key={product.id} className="rounded-md border border-border bg-surface">
                <div className="grid gap-3 p-3 min-[40rem]:min-h-16 min-[40rem]:grid-cols-[auto_minmax(0,1fr)_auto_auto] min-[40rem]:items-center min-[40rem]:gap-4">
                  <ProductMedia product={product} variant="thumbnail" />
                  <div className="grid min-w-0 gap-0.5">
                    <h3 className="truncate text-base font-extrabold leading-snug tracking-[-0.01em] text-ink">
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted">{imageStateLabel(product)}</p>
                  </div>
                  <p className="text-base font-extrabold tracking-[-0.01em] text-ink">
                    {formatAmount(product.price)}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      id={`admin-edit-${product.id}`}
                      className="inline-flex min-h-10 items-center justify-center rounded-sm border border-border-strong bg-surface px-3 text-sm font-bold text-brand-dark no-underline hover:border-brand hover:bg-brand hover:text-white"
                      href={`/admin/products/${encodeURIComponent(product.id)}/edit`}
                      aria-label={`Edit ${product.name}`}
                    >
                      Edit
                    </a>
                    <Button
                      id={`admin-delete-${product.id}`}
                      variant="danger"
                      size="sm"
                      onClick={() => requestDeletion(product.id)}
                      disabled={isBusy}
                      aria-label={`Delete ${product.name}`}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                {confirmingDeleteId === product.id ? (
                  <div className="border-t border-border p-3">
                    <DeleteConfirmation
                      product={product}
                      isPending={isDeleting}
                      error={deleteError}
                      isConflict={deleteIsConflict}
                      onCancel={() => cancelDeletion(product.id)}
                      onConfirm={() => void confirmDeletion(product.id)}
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}

function imageStateLabel(product: ProductResponse): string {
  if (product.uploadedMediaId !== null) {
    return "Uploaded image";
  }

  if (product.mediaKey === null) {
    return "No image";
  }

  return curatedMediaSource(product.mediaKey) !== undefined
    ? "Curated image"
    : "Monogram (media key has no local asset)";
}

function DeleteConfirmation({
  product,
  isPending,
  error,
  isConflict,
  onCancel,
  onConfirm
}: {
  product: ProductResponse;
  isPending: boolean;
  error: string | null;
  isConflict: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const headingId = `admin-confirm-heading-${product.id}`;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div
      className="grid gap-3 rounded-md border border-danger bg-surface-muted p-3"
      role="group"
      aria-labelledby={headingId}
    >
      <h4 id={headingId} ref={headingRef} tabIndex={-1} className="font-bold text-ink">
        Delete this Product?
      </h4>
      <p className="text-sm text-muted">
        {product.name} will be removed from the Catalog and later Market browsing. This cannot be
        undone.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          id={`admin-confirm-cancel-${product.id}`}
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          id={`admin-confirm-delete-${product.id}`}
          variant="danger"
          size="sm"
          onClick={onConfirm}
          disabled={isPending}
        >
          {isPending ? "Deleting Product..." : "Delete Product"}
        </Button>
      </div>
      {error !== null ? (
        <StatusMessage tone="error">
          {error}
          {isConflict ? (
            <>
              {" "}
              <a className="text-brand-dark" href="/">
                Go to Market
              </a>
            </>
          ) : null}
        </StatusMessage>
      ) : null}
    </div>
  );
}

function adjacentDeleteTarget(displayOrder: string[], removedProductId: string): FocusTarget {
  const index = displayOrder.indexOf(removedProductId);
  const adjacentProductId = displayOrder[index + 1] ?? displayOrder[index - 1];

  return adjacentProductId === undefined
    ? { kind: "products-heading" }
    : { kind: "delete-button", productId: adjacentProductId };
}

function focusTarget(target: FocusTarget) {
  const elementId =
    target.kind === "delete-button"
      ? `admin-delete-${target.productId}`
      : target.kind === "confirm-cancel"
        ? `admin-confirm-cancel-${target.productId}`
        : PRODUCTS_HEADING_ID;
  const element = document.getElementById(elementId);

  if (element !== null) {
    element.focus();
    return;
  }

  document.getElementById(PRODUCTS_HEADING_ID)?.focus();
}
