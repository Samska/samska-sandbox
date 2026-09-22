import { useState, type FormEvent } from "react";
import { createProduct, getProduct, type ProductResponse } from "./catalogApi";
import Button from "../ui/Button";
import FormField from "../ui/FormField";
import StatusMessage from "../ui/StatusMessage";
import { formatAmount } from "../formatAmount";
import { curatedMediaKeys } from "./mediaCatalog";
import { createErrorMessage, lookupErrorMessage } from "./messages";

const NAME_ERROR = "Enter a Product name.";
const DESCRIPTION_ERROR = "Enter a Product description.";
const PRICE_ERROR = "Enter a price that is zero or greater.";
const ID_ERROR = "Enter a Product ID.";

export default function ProductSetupTools({
  onProductCreated
}: {
  onProductCreated: () => void;
}) {
  return (
    <details id="catalog-tools" className="rounded-lg border border-border bg-surface-muted/60">
      <summary className="flex cursor-pointer list-inside items-baseline justify-between gap-4 p-5 max-[44rem]:flex-col max-[44rem]:items-start max-[44rem]:gap-1.5">
        <span className="text-base font-extrabold text-ink" role="heading" aria-level={2}>
          Product setup tools
        </span>
        <span className="text-sm text-muted">
          Local setup and testing utility for creating and retrieving Products. Not part of
          customer browsing.
        </span>
      </summary>
      <div className="grid gap-4 border-t border-border px-5 py-5 min-[44rem]:grid-cols-2">
        <CreateProductForm onProductCreated={onProductCreated} />
        <ProductLookupForm />
      </div>
    </details>
  );
}

function CreateProductForm({ onProductCreated }: { onProductCreated: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [mediaKey, setMediaKey] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending) {
      return;
    }

    const numericPrice = Number(price);

    if (name.trim().length === 0) {
      setProduct(null);
      setError(NAME_ERROR);
      return;
    }

    if (description.trim().length === 0) {
      setProduct(null);
      setError(DESCRIPTION_ERROR);
      return;
    }

    if (price.length === 0 || !Number.isFinite(numericPrice) || numericPrice < 0) {
      setProduct(null);
      setError(PRICE_ERROR);
      return;
    }

    setProduct(null);
    setError(null);
    setIsPending(true);

    try {
      setProduct(await createProduct({
        name,
        description,
        price: numericPrice,
        mediaKey: mediaKey.length === 0 ? null : mediaKey
      }));
      onProductCreated();
    } catch (caughtError) {
      setError(createErrorMessage(caughtError));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section
      className="grid gap-5 rounded-lg border border-border bg-surface p-5"
      aria-labelledby="create-product-heading"
    >
      <h3 id="create-product-heading" className="text-lg leading-[1.15] text-ink">
        Create Product
      </h3>
      <form className="grid gap-4" onSubmit={handleSubmit} aria-busy={isPending} noValidate>
        <FormField id="product-name" label="Name" error={error === NAME_ERROR ? error : null}>
          {(control) => (
            <input
              {...control}
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isPending}
              required
            />
          )}
        </FormField>
        <FormField
          id="product-description"
          label="Description"
          error={error === DESCRIPTION_ERROR ? error : null}
        >
          {(control) => (
            <textarea
              {...control}
              name="description"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={isPending}
              required
            />
          )}
        </FormField>
        <FormField id="product-price" label="Price" error={error === PRICE_ERROR ? error : null}>
          {(control) => (
            <input
              {...control}
              name="price"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              disabled={isPending}
              required
            />
          )}
        </FormField>
        <FormField id="product-media" label="Media" error={null}>
          {(control) => (
            <select
              {...control}
              name="mediaKey"
              value={mediaKey}
              onChange={(event) => setMediaKey(event.target.value)}
              disabled={isPending}
            >
              <option value="">No media</option>
              {curatedMediaKeys.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          )}
        </FormField>
        <Button type="submit" className="justify-self-start" disabled={isPending}>
          {isPending ? "Creating Product..." : "Create Product"}
        </Button>
      </form>
      <OperationFeedback isPending={isPending} product={product} error={error} operation="created" />
    </section>
  );
}

function ProductLookupForm() {
  const [id, setId] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending) {
      return;
    }

    const productId = id.trim();

    if (productId.length === 0) {
      setProduct(null);
      setError(ID_ERROR);
      return;
    }

    setProduct(null);
    setError(null);
    setIsPending(true);

    try {
      setProduct(await getProduct(productId));
    } catch (caughtError) {
      setError(lookupErrorMessage(caughtError));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section
      className="grid gap-5 rounded-lg border border-border bg-surface p-5"
      aria-labelledby="find-product-heading"
    >
      <h3 id="find-product-heading" className="text-lg leading-[1.15] text-ink">
        Find Product
      </h3>
      <form className="grid gap-4" onSubmit={handleSubmit} aria-busy={isPending} noValidate>
        <FormField id="product-id" label="Product ID" error={error === ID_ERROR ? error : null}>
          {(control) => (
            <input
              {...control}
              name="id"
              value={id}
              onChange={(event) => setId(event.target.value)}
              disabled={isPending}
              required
            />
          )}
        </FormField>
        <Button type="submit" variant="secondary" className="justify-self-start" disabled={isPending}>
          {isPending ? "Finding Product..." : "Find Product"}
        </Button>
      </form>
      <OperationFeedback isPending={isPending} product={product} error={error} operation="found" />
    </section>
  );
}

function OperationFeedback({
  isPending,
  product,
  error,
  operation
}: {
  isPending: boolean;
  product: ProductResponse | null;
  error: string | null;
  operation: "created" | "found";
}) {
  if (isPending) {
    return <StatusMessage tone="neutral">Loading Product...</StatusMessage>;
  }

  if (error !== null) {
    return <StatusMessage tone="error">{error}</StatusMessage>;
  }

  if (product !== null) {
    return (
      <div className="grid gap-3 border-t border-border pt-4" role="status" aria-live="polite">
        <p className="font-bold text-success">Product {operation} successfully.</p>
        <ProductDetails product={product} />
      </div>
    );
  }

  return null;
}

function ProductDetails({ product }: { product: ProductResponse }) {
  return (
    <dl className="grid gap-y-1 gap-x-4 [grid-template-columns:minmax(5rem,auto)_minmax(0,1fr)]">
      <dt className="text-sm text-muted">Product ID</dt>
      <dd className="m-0 font-bold [overflow-wrap:anywhere]">{product.id}</dd>
      <dt className="text-sm text-muted">Name</dt>
      <dd className="m-0 font-bold">{product.name}</dd>
      <dt className="text-sm text-muted">Description</dt>
      <dd className="m-0 font-bold [overflow-wrap:anywhere]">{product.description}</dd>
      <dt className="text-sm text-muted">Price</dt>
      <dd className="m-0 font-bold">{formatAmount(product.price)}</dd>
    </dl>
  );
}
