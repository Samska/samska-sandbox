import { useState, type FormEvent } from "react";
import {
  CatalogApiError,
  createProduct,
  getProduct,
  type ProductResponse
} from "./catalogApi";

export default function Catalog() {
  return (
    <div className="catalog">
      <p className="catalog-introduction">
        Create a Product or retrieve one by its generated ID. Product data is temporary and is lost when
        the backend restarts.
      </p>
      <div className="catalog-panels">
        <CreateProductForm />
        <ProductLookupForm />
      </div>
    </div>
  );
}

function CreateProductForm() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
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
      setError("Enter a Product name.");
      return;
    }

    if (price.length === 0 || !Number.isFinite(numericPrice) || numericPrice < 0) {
      setProduct(null);
      setError("Enter a price that is zero or greater.");
      return;
    }

    setProduct(null);
    setError(null);
    setIsPending(true);

    try {
      setProduct(await createProduct({ name, price: numericPrice }));
    } catch (caughtError) {
      setError(createErrorMessage(caughtError));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="catalog-panel" aria-labelledby="create-product-heading">
      <h2 id="create-product-heading">Create Product</h2>
      <form onSubmit={handleSubmit} aria-busy={isPending} noValidate>
        <div className="form-field">
          <label htmlFor="product-name">Name</label>
          <input
            id="product-name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isPending}
            aria-invalid={error === "Enter a Product name."}
            aria-describedby={error === "Enter a Product name." ? "product-name-error" : undefined}
            required
          />
          {error === "Enter a Product name." ? (
            <p id="product-name-error" className="field-error">
              {error}
            </p>
          ) : null}
        </div>
        <div className="form-field">
          <label htmlFor="product-price">Price</label>
          <input
            id="product-price"
            name="price"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            disabled={isPending}
            aria-invalid={error === "Enter a price that is zero or greater."}
            aria-describedby={error === "Enter a price that is zero or greater." ? "product-price-error" : undefined}
            required
          />
          {error === "Enter a price that is zero or greater." ? (
            <p id="product-price-error" className="field-error">
              {error}
            </p>
          ) : null}
        </div>
        <button type="submit" disabled={isPending}>
          {isPending ? "Creating Product..." : "Create Product"}
        </button>
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
      setError("Enter a Product ID.");
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
    <section className="catalog-panel" aria-labelledby="find-product-heading">
      <h2 id="find-product-heading">Find Product</h2>
      <form onSubmit={handleSubmit} aria-busy={isPending} noValidate>
        <div className="form-field">
          <label htmlFor="product-id">Product ID</label>
          <input
            id="product-id"
            name="id"
            value={id}
            onChange={(event) => setId(event.target.value)}
            disabled={isPending}
            aria-invalid={error === "Enter a Product ID."}
            aria-describedby={error === "Enter a Product ID." ? "product-id-error" : undefined}
            required
          />
          {error === "Enter a Product ID." ? (
            <p id="product-id-error" className="field-error">
              {error}
            </p>
          ) : null}
        </div>
        <button type="submit" disabled={isPending}>
          {isPending ? "Finding Product..." : "Find Product"}
        </button>
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
    return <p role="status">Loading Product...</p>;
  }

  if (error !== null) {
    return <p role="alert">{error}</p>;
  }

  if (product !== null) {
    return (
      <div className="product-result" role="status">
        <p>Product {operation} successfully.</p>
        <ProductDetails product={product} />
      </div>
    );
  }

  return null;
}

function ProductDetails({ product }: { product: ProductResponse }) {
  return (
    <dl>
      <dt>Product ID</dt>
      <dd className="product-id">{product.id}</dd>
      <dt>Name</dt>
      <dd>{product.name}</dd>
      <dt>Price</dt>
      <dd>{product.price}</dd>
    </dl>
  );
}

function createErrorMessage(error: unknown): string {
  if (error instanceof CatalogApiError && error.kind === "bad-request") {
    return "Check the Product name and price, then try again.";
  }

  return generalErrorMessage(error);
}

function lookupErrorMessage(error: unknown): string {
  if (error instanceof CatalogApiError) {
    if (error.kind === "bad-request") {
      return "Enter a valid Product ID.";
    }

    if (error.kind === "not-found") {
      return "No Product was found with that ID.";
    }
  }

  return generalErrorMessage(error);
}

function generalErrorMessage(error: unknown): string {
  if (error instanceof CatalogApiError && error.kind === "network") {
    return "The Product service could not be reached. Try again.";
  }

  if (error instanceof CatalogApiError && error.kind === "invalid-response") {
    return "The Product service returned an unexpected response. Try again.";
  }

  return "The Product service failed. Try again.";
}
