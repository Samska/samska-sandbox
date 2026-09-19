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

export default function Catalog() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [productsPending, setProductsPending] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [cartPending, setCartPending] = useState(true);
  const [cartError, setCartError] = useState<string | null>(null);

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

    try {
      setCart(await addCartItem(product.id, 1));
    } catch (caughtError) {
      setCartError(cartErrorMessage(caughtError));
    } finally {
      setCartPending(false);
    }
  }

  async function handleUpdateQuantity(productId: string, quantity: number) {
    setCartPending(true);
    setCartError(null);

    try {
      setCart(await updateCartItem(productId, quantity));
    } catch (caughtError) {
      setCartError(cartErrorMessage(caughtError));
    } finally {
      setCartPending(false);
    }
  }

  async function handleRemoveItem(productId: string) {
    setCartPending(true);
    setCartError(null);

    try {
      setCart(await removeCartItem(productId));
    } catch (caughtError) {
      setCartError(cartErrorMessage(caughtError));
    } finally {
      setCartPending(false);
    }
  }

  return (
    <div className="catalog">
      <p className="catalog-introduction">
        Browse available Products, add them to a Cart, and manage the Cart while Product data remains temporary
        and is lost when the backend restarts.
      </p>
      <ProductBrowse
        products={products}
        isPending={productsPending}
        error={productsError}
        isCartPending={cartPending}
        onRetry={() => void refreshProducts()}
        onAdd={handleAddToCart}
      />
      <div className="catalog-panels">
        <CreateProductForm onProductCreated={() => void refreshProducts()} />
        <ProductLookupForm />
      </div>
      <CartPanel
        cart={cart}
        isPending={cartPending}
        error={cartError}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />
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
    <section className="catalog-panel" aria-labelledby="product-browse-heading" aria-busy={isPending}>
      <h2 id="product-browse-heading">Products</h2>
      {isPending ? <p role="status">Loading Products...</p> : null}
      {error !== null ? (
        <div>
          <p role="alert">{error}</p>
          <button type="button" onClick={onRetry} disabled={isPending}>
            Retry Products
          </button>
        </div>
      ) : null}
      {!isPending && error === null && products.length === 0 ? <p>No Products are available.</p> : null}
      {!isPending && error === null && products.length > 0 ? (
        <ul className="product-list">
          {products.map((product) => (
            <li key={product.id} className="product-card">
              <div>
                <h3>{product.name}</h3>
                <p>Price: {product.price}</p>
              </div>
              <button type="button" onClick={() => void onAdd(product)} disabled={isCartPending}>
                Add to Cart
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
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
