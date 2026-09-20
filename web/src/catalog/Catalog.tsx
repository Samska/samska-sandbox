import { useEffect, useState, type FormEvent } from "react";
import {
  CatalogApiError,
  createProduct,
  getProduct,
  listProducts,
  type ProductResponse
} from "./catalogApi";
import CartPanel from "../cart/Cart";
import {
  addCartItem,
  CartApiError,
  getCart,
  removeCartItem,
  updateCartItem,
  type CartResponse
} from "../cart/cartApi";
import { formatAmount } from "../formatAmount";

const productMediaToneClasses = [
  "bg-media-teal",
  "bg-media-olive",
  "bg-media-rose",
  "bg-media-slate"
] as const;

export default function Catalog() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [productsPending, setProductsPending] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [cartPending, setCartPending] = useState(true);
  const [cartError, setCartError] = useState<string | null>(null);
  const [cartNotice, setCartNotice] = useState<string | null>(null);

  async function refreshProducts() {
    setProductsPending(true);
    setProductsError(null);

    try {
      setProducts(await listProducts());
    } catch (caughtError) {
      setProductsError(catalogBrowseErrorMessage(caughtError));
    } finally {
      setProductsPending(false);
    }
  }

  async function refreshCart() {
    setCartPending(true);
    setCartError(null);

    try {
      setCart(await getCart());
    } catch (caughtError) {
      setCartError(cartErrorMessage(caughtError));
    } finally {
      setCartPending(false);
    }
  }

  useEffect(() => {
    void refreshProducts();
    void refreshCart();
  }, []);

  async function handleAddToCart(product: ProductResponse) {
    setCartPending(true);
    setCartError(null);
    setCartNotice(null);

    try {
      setCart(await addCartItem(product.id, 1));
      setCartNotice(`${product.name} added to your Cart.`);
    } catch (caughtError) {
      setCartError(cartErrorMessage(caughtError));
    } finally {
      setCartPending(false);
    }
  }

  async function handleUpdateQuantity(productId: string, quantity: number) {
    setCartPending(true);
    setCartError(null);
    setCartNotice(null);

    try {
      setCart(await updateCartItem(productId, quantity));
      setCartNotice("Cart updated.");
    } catch (caughtError) {
      setCartError(cartErrorMessage(caughtError));
    } finally {
      setCartPending(false);
    }
  }

  async function handleRemoveItem(productId: string) {
    setCartPending(true);
    setCartError(null);
    setCartNotice(null);

    try {
      setCart(await removeCartItem(productId));
      setCartNotice("Item removed from your Cart.");
    } catch (caughtError) {
      setCartError(cartErrorMessage(caughtError));
    } finally {
      setCartPending(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid items-start gap-5 [grid-template-columns:minmax(0,1fr)_minmax(18rem,21rem)] max-[58rem]:grid-cols-1">
        <ProductBrowse
          products={products}
          isPending={productsPending}
          error={productsError}
          isCartPending={cartPending}
          onRetry={() => void refreshProducts()}
          onAdd={handleAddToCart}
        />
        <CartPanel
          cart={cart}
          isPending={cartPending}
          error={cartError}
          onRetry={() => void refreshCart()}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
        />
      </div>
      {cartNotice !== null ? (
        <p
          className="rounded-sm border border-success-border bg-success-surface px-4 py-3.5 font-bold"
          role="status"
          aria-live="polite"
        >
          {cartNotice}
        </p>
      ) : null}
      <details id="catalog-tools" className="rounded-lg border border-border">
        <summary className="flex cursor-pointer list-inside items-baseline justify-between gap-4 max-[44rem]:flex-col max-[44rem]:items-start max-[44rem]:gap-1.5">
          <span className="text-base font-extrabold text-ink" role="heading" aria-level={2}>
            Catalog tools
          </span>
          <span className="text-sm text-muted">
            Create or retrieve Products for local setup and inspection.
          </span>
        </summary>
        <div className="mt-5 grid gap-4 [grid-template-columns:repeat(2,minmax(0,1fr))] max-[44rem]:grid-cols-1">
          <CreateProductForm onProductCreated={() => void refreshProducts()} />
          <ProductLookupForm />
        </div>
      </details>
    </div>
  );
}

function ProductBrowse({
  products,
  isPending,
  error,
  isCartPending,
  onRetry,
  onAdd
}: {
  products: ProductResponse[];
  isPending: boolean;
  error: string | null;
  isCartPending: boolean;
  onRetry: () => void;
  onAdd: (product: ProductResponse) => Promise<void>;
}) {
  return (
    <section
      id="products"
      className="grid min-w-0 gap-5"
      aria-labelledby="product-browse-heading"
      aria-busy={isPending}
    >
      <div className="grid gap-1.5">
        <h1 className="text-[clamp(2rem,4vw,3rem)] leading-[1.15] tracking-[-0.035em] text-ink">
          Products
        </h1>
        <p className="text-muted">Browse available products for your next order.</p>
      </div>
      {isPending ? <p role="status">Loading Products...</p> : null}
      {error !== null ? (
        <div className="grid gap-3">
          <p role="alert">{error}</p>
          <button
            type="button"
            className="min-h-11 w-fit rounded-sm border border-brand bg-brand px-4 py-2.5 font-bold text-white hover:bg-brand-dark hover:border-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onRetry}
            disabled={isPending}
          >
            Retry Products
          </button>
        </div>
      ) : null}
      {!isPending && error === null && products.length === 0 ? (
        <div className="grid gap-3">
          <p>No Products are available yet.</p>
          <a className="w-fit font-bold text-brand-dark" href="#catalog-tools">
            Create the first Product
          </a>
        </div>
      ) : null}
      {!isPending && error === null && products.length > 0 ? (
        <ul className="grid list-none gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(12.5rem,1fr))] p-0 m-0 max-[44rem]:grid-cols-1">
          {products.map((product) => (
            <li
              key={product.id}
              className="grid min-w-0 gap-3.5 overflow-hidden rounded-md border border-border bg-surface p-2.5 shadow-product hover:border-border-strong hover:shadow-product-hover"
            >
              <div
                className={`grid aspect-[4/3] place-items-center overflow-hidden rounded-sm text-white/85 ${productMediaToneClasses[productMediaTone(product.name)]}`}
                aria-hidden="true"
              >
                <span className="text-[clamp(3rem,8vw,5rem)] font-extrabold leading-none tracking-[-0.08em] -translate-y-0.5">
                  {productInitial(product.name)}
                </span>
              </div>
              <article className="grid gap-2.5 px-1.5 pt-0.5">
                <h3 className="text-lg leading-[1.15] text-ink">{product.name}</h3>
                <p className="flex items-baseline justify-between gap-4 text-xl font-extrabold text-ink">
                  <span className="text-[0.8125rem] font-bold text-muted">Price</span>
                  <span>{formatAmount(product.price)}</span>
                </p>
              </article>
              <button
                type="button"
                className="mx-1.5 mb-1.5 min-h-11 rounded-sm border border-brand bg-brand px-4 py-2.5 font-bold text-white hover:bg-brand-dark hover:border-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => void onAdd(product)}
                disabled={isCartPending}
                aria-label={`Add ${product.name} to Cart`}
              >
                Add to Cart
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function productInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "P";
}

function productMediaTone(name: string): number {
  return [...name].reduce((total, character) => total + character.charCodeAt(0), 0) % 4;
}

function CreateProductForm({ onProductCreated }: { onProductCreated: () => void }) {
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
      <h3 className="text-lg leading-[1.15] text-ink">Create Product</h3>
      <form className="grid gap-4" onSubmit={handleSubmit} aria-busy={isPending} noValidate>
        <div className="grid gap-1.5">
          <label className="text-[0.9375rem] font-bold text-ink" htmlFor="product-name">
            Name
          </label>
          <input
            id="product-name"
            name="name"
            className="min-h-11 w-full rounded-sm border border-border-strong bg-surface px-3 py-2.5"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isPending}
            aria-invalid={error === "Enter a Product name."}
            aria-describedby={error === "Enter a Product name." ? "product-name-error" : undefined}
            required
          />
          {error === "Enter a Product name." ? (
            <p id="product-name-error" className="font-bold">
              {error}
            </p>
          ) : null}
        </div>
        <div className="grid gap-1.5">
          <label className="text-[0.9375rem] font-bold text-ink" htmlFor="product-price">
            Price
          </label>
          <input
            id="product-price"
            name="price"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            className="min-h-11 w-full rounded-sm border border-border-strong bg-surface px-3 py-2.5"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            disabled={isPending}
            aria-invalid={error === "Enter a price that is zero or greater."}
            aria-describedby={error === "Enter a price that is zero or greater." ? "product-price-error" : undefined}
            required
          />
          {error === "Enter a price that is zero or greater." ? (
            <p id="product-price-error" className="font-bold">
              {error}
            </p>
          ) : null}
        </div>
        <button
          type="submit"
          className="min-h-11 w-fit rounded-sm border border-brand bg-brand px-4 py-2.5 font-bold text-white hover:bg-brand-dark hover:border-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
        >
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
    <section
      className="grid gap-5 rounded-lg border border-border bg-surface p-5"
      aria-labelledby="find-product-heading"
    >
      <h3 className="text-lg leading-[1.15] text-ink">Find Product</h3>
      <form className="grid gap-4" onSubmit={handleSubmit} aria-busy={isPending} noValidate>
        <div className="grid gap-1.5">
          <label className="text-[0.9375rem] font-bold text-ink" htmlFor="product-id">
            Product ID
          </label>
          <input
            id="product-id"
            name="id"
            className="min-h-11 w-full rounded-sm border border-border-strong bg-surface px-3 py-2.5"
            value={id}
            onChange={(event) => setId(event.target.value)}
            disabled={isPending}
            aria-invalid={error === "Enter a Product ID."}
            aria-describedby={error === "Enter a Product ID." ? "product-id-error" : undefined}
            required
          />
          {error === "Enter a Product ID." ? (
            <p id="product-id-error" className="font-bold">
              {error}
            </p>
          ) : null}
        </div>
        <button
          type="submit"
          className="min-h-11 w-fit rounded-sm border border-brand bg-brand px-4 py-2.5 font-bold text-white hover:bg-brand-dark hover:border-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
        >
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
      <div className="grid gap-3 border-t border-border pt-4" role="status">
        <p>Product {operation} successfully.</p>
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
      <dt className="text-sm text-muted">Price</dt>
      <dd className="m-0 font-bold">{formatAmount(product.price)}</dd>
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

function catalogBrowseErrorMessage(error: unknown): string {
  if (error instanceof CatalogApiError && error.kind === "network") {
    return "The Product service could not be reached. Try again.";
  }

  return generalErrorMessage(error);
}

function cartErrorMessage(error: unknown): string {
  if (error instanceof CartApiError) {
    if (error.kind === "bad-request") {
      return "The Cart request was invalid. Check the quantity and try again.";
    }

    if (error.kind === "not-found") {
      return "The Product or Cart item was not found.";
    }

    if (error.kind === "network") {
      return "The Cart service could not be reached. Try again.";
    }

    if (error.kind === "invalid-response") {
      return "The Cart service returned an unexpected response. Try again.";
    }
  }

  return "The Cart service failed. Try again.";
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
