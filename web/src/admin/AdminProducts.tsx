import { useEffect, useRef, useState } from "react";
import {
  CatalogApiError,
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
  type ProductResponse
} from "../catalog/catalogApi";
import ProductForm, { type ProductFormValues } from "./ProductForm";
import { formatAmount } from "../formatAmount";
import Button from "../ui/Button";
import FormField from "../ui/FormField";
import StatusMessage from "../ui/StatusMessage";
import { adminDeleteErrorMessage, adminLoadErrorMessage, adminRefreshErrorMessage, adminSaveErrorMessage } from "./messages";

type FocusTarget =
  | { kind: "edit-button"; productId: string }
  | { kind: "delete-button"; productId: string }
  | { kind: "edit-submit"; productId: string }
  | { kind: "confirm-cancel"; productId: string }
  | { kind: "create-submit" }
  | { kind: "products-heading" };

const PRODUCTS_HEADING_ID = "admin-products-heading";

export default function AdminProducts() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createFormKey, setCreateFormKey] = useState(0);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteIsConflict, setDeleteIsConflict] = useState(false);
  const pendingFocusRef = useRef<FocusTarget | null>(null);
  const isBusy = isLoading || isCreating || isSavingEdit || isDeleting;

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
    await loadProducts(adminLoadErrorMessage);
  }

  async function refreshProductsAfterMutation() {
    await loadProducts(() => adminRefreshErrorMessage());
  }

  async function loadProducts(failureMessage: (error: unknown) => string) {
    setIsLoading(true);
    setLoadError(null);

    try {
      setProducts(await listProducts());
    } catch (caughtError) {
      setLoadError(failureMessage(caughtError));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate(values: ProductFormValues) {
    setIsCreating(true);
    setCreateError(null);
    setNotice(null);

    try {
      const created = await createProduct(values);
      setNotice(`${created.name} was created.`);
      setCreateFormKey((key) => key + 1);
      pendingFocusRef.current = { kind: "edit-button", productId: created.id };
      await refreshProductsAfterMutation();
    } catch (caughtError) {
      setCreateError(adminSaveErrorMessage(caughtError));
      pendingFocusRef.current = { kind: "create-submit" };
    } finally {
      setIsCreating(false);
    }
  }

  function startEditing(productId: string) {
    setEditingProductId(productId);
    setEditError(null);
    setConfirmingDeleteId(null);
    setDeleteError(null);
    setDeleteIsConflict(false);
    setNotice(null);
  }

  function cancelEditing(productId: string) {
    setEditingProductId(null);
    setEditError(null);
    pendingFocusRef.current = { kind: "edit-button", productId };
  }

  async function handleEdit(values: ProductFormValues) {
    const productId = editingProductId;

    if (productId === null) {
      return;
    }

    setIsSavingEdit(true);
    setEditError(null);
    setNotice(null);

    try {
      const updated = await updateProduct(productId, values);
      setNotice(`${updated.name} was updated.`);
      setEditingProductId(null);
      pendingFocusRef.current = { kind: "edit-button", productId };
      await refreshProductsAfterMutation();
    } catch (caughtError) {
      setEditError(adminSaveErrorMessage(caughtError));
      pendingFocusRef.current = { kind: "edit-submit", productId };
    } finally {
      setIsSavingEdit(false);
    }
  }

  function requestDeletion(productId: string) {
    setConfirmingDeleteId(productId);
    setDeleteError(null);
    setDeleteIsConflict(false);
    setEditingProductId(null);
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
      <div className="grid gap-1.5">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.14em] text-muted">Admin</p>
        <h1
          id="admin-heading"
          className="text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.1] tracking-[-0.03em] text-ink"
        >
          Product management
        </h1>
        <p className="max-w-prose text-muted">
          Create, edit, and delete Products. This local surface is navigation only and has no
          access control; the Market and Admin share the same Catalog.
        </p>
      </div>
      <section
        className="grid gap-5 rounded-lg border border-border bg-surface p-5"
        aria-labelledby="admin-create-heading"
      >
        <h2 id="admin-create-heading" className="text-lg leading-[1.15] text-ink">
          Create Product
        </h2>
        <ProductForm
          key={createFormKey}
          idPrefix="admin-create"
          headingId="admin-create-heading"
          submitLabel="Create Product"
          pendingLabel="Creating Product..."
          isPending={isCreating}
          error={createError}
          onSubmit={(values) => void handleCreate(values)}
        />
      </section>
      <section className="grid gap-4" aria-labelledby={PRODUCTS_HEADING_ID}>
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
            <p className="text-sm text-muted">Create the first Product with the form above.</p>
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
          <ul className="grid list-none gap-4 p-0 m-0">
            {visibleProducts.map((product) => (
              <li
                key={product.id}
                className="grid gap-4 rounded-lg border border-border bg-surface p-4"
              >
                {editingProductId === product.id ? (
                  <section
                    className="grid gap-4"
                    aria-labelledby={`admin-edit-heading-${product.id}`}
                  >
                    <h3
                      id={`admin-edit-heading-${product.id}`}
                      className="text-lg leading-[1.15] text-ink"
                    >
                      Edit {product.name}
                    </h3>
                    <ProductForm
                      idPrefix={`admin-edit-${product.id}`}
                      headingId={`admin-edit-heading-${product.id}`}
                      initialValues={{
                        name: product.name,
                        description: product.description,
                        price: product.price,
                        mediaKey: product.mediaKey
                      }}
                      submitLabel="Save changes"
                      pendingLabel="Saving changes..."
                      isPending={isSavingEdit}
                      error={editError}
                      onSubmit={(values) => void handleEdit(values)}
                      onCancel={() => cancelEditing(product.id)}
                    />
                  </section>
                ) : (
                  <>
                    <div className="grid gap-1.5">
                      <h3 className="text-base font-extrabold leading-snug tracking-[-0.01em] text-ink">
                        {product.name}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted">{product.description}</p>
                      <dl className="grid gap-x-4 gap-y-1 text-sm [grid-template-columns:minmax(5rem,auto)_minmax(0,1fr)]">
                        <dt className="text-muted">Product ID</dt>
                        <dd className="m-0 font-bold [overflow-wrap:anywhere]">{product.id}</dd>
                        <dt className="text-muted">Price</dt>
                        <dd className="m-0 font-bold">{formatAmount(product.price)}</dd>
                        <dt className="text-muted">Media</dt>
                        <dd className="m-0 font-bold">{product.mediaKey ?? "No media"}</dd>
                      </dl>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        id={`admin-edit-${product.id}`}
                        variant="secondary"
                        size="sm"
                        onClick={() => startEditing(product.id)}
                        disabled={isBusy}
                        aria-label={`Edit ${product.name}`}
                      >
                        Edit
                      </Button>
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
                    {confirmingDeleteId === product.id ? (
                      <DeleteConfirmation
                        product={product}
                        isPending={isDeleting}
                        error={deleteError}
                        isConflict={deleteIsConflict}
                        onCancel={() => cancelDeletion(product.id)}
                        onConfirm={() => void confirmDeletion(product.id)}
                      />
                    ) : null}
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
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
    target.kind === "edit-button"
      ? `admin-edit-${target.productId}`
      : target.kind === "delete-button"
        ? `admin-delete-${target.productId}`
        : target.kind === "edit-submit"
          ? `admin-edit-${target.productId}-submit`
          : target.kind === "confirm-cancel"
            ? `admin-confirm-cancel-${target.productId}`
            : target.kind === "create-submit"
              ? "admin-create-submit"
              : PRODUCTS_HEADING_ID;
  const element = document.getElementById(elementId);

  if (element !== null) {
    element.focus();
    return;
  }

  document.getElementById(PRODUCTS_HEADING_ID)?.focus();
}
