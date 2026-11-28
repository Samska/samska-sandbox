import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { listProducts, type ProductResponse } from "./catalogApi";
import {
  addCartItem,
  getCart,
  removeCartItem,
  updateCartItem,
  type CartResponse
} from "../cart/cartApi";
import CartDrawer from "../cart/CartDrawer";
import CartTrigger from "../cart/CartTrigger";
import CheckoutReview from "../checkout/CheckoutReview";
import { createOrder, type OrderResponse } from "../order/orderApi";
import { isUnconfirmedOrderError, orderErrorMessage } from "../order/messages";
import OrderResult from "../order/OrderResult";
import ProductBrowse from "./ProductBrowse";
import ProductDetail from "./ProductDetail";
import StatusMessage from "../ui/StatusMessage";
import Button from "../ui/Button";
import { catalogBrowseErrorMessage, cartErrorMessage } from "./messages";
import { checkoutPath, marketPath, navigateTo, usePath } from "../journey/routes";

export default function Catalog() {
  const auth = useAuth();
  const anonymous = auth.state.status === "anonymous";
  const path = usePath();
  const isCheckoutPath = path === checkoutPath;

  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [productsPending, setProductsPending] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [cartPending, setCartPending] = useState(true);
  const [cartError, setCartError] = useState<string | null>(null);
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderPending, setOrderPending] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<OrderResponse | null>(null);
  const pendingFocusProductId = useRef<string | null>(null);
  const pendingCartTriggerFocus = useRef(false);
  const viewDetailsButtons = useRef(new Map<string, HTMLButtonElement>());
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const cartTriggerRef = useRef<HTMLButtonElement>(null);
  const orderRequestRef = useRef<{ requestId: string; cartRevision: number } | null>(null);
  const orderInFlightRef = useRef(false);
  const cartSeqRef = useRef(0);
  const previousPathRef = useRef(path);

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
    const sequence = ++cartSeqRef.current;

    if (anonymous) {
      // A visitor has no Cart until signing in; the Market stays browsable.
      setCart({ items: [], total: 0, revision: 0 });
      setCartError(null);
      setCartPending(false);
      return;
    }

    setCartPending(true);
    setCartError(null);

    try {
      const nextCart = await getCart();

      if (cartSeqRef.current === sequence) {
        setCart(nextCart);
      }
    } catch (caughtError) {
      if (cartSeqRef.current === sequence) {
        setCartError(cartErrorMessage(caughtError));
      }
    } finally {
      if (cartSeqRef.current === sequence) {
        setCartPending(false);
      }
    }
  }

  useEffect(() => {
    void refreshProducts();
  }, []);

  useEffect(() => {
    if (auth.state.status !== "loading") {
      void refreshCart();
    }
  }, [auth.state.status]);

  useEffect(() => {
    const previousPath = previousPathRef.current;
    previousPathRef.current = path;

    if (path === checkoutPath && previousPath !== checkoutPath) {
      void refreshCart();
    }
  }, [path]);

  useEffect(() => {
    if (path === marketPath && pendingCartTriggerFocus.current) {
      pendingCartTriggerFocus.current = false;
      cartTriggerRef.current?.focus();
    }
  }, [path]);

  useEffect(() => {
    if (path !== marketPath) {
      setSelectedProduct(null);
    }
  }, [path]);

  useEffect(() => {
    if (selectedProduct === null && pendingFocusProductId.current !== null) {
      const productId = pendingFocusProductId.current;
      pendingFocusProductId.current = null;
      const viewDetailsButton = viewDetailsButtons.current.get(productId);
      if (viewDetailsButton !== undefined) {
        viewDetailsButton.focus();
      } else {
        searchInputRef.current?.focus();
      }
    }
  }, [selectedProduct]);

  function handleSelectProduct(product: ProductResponse) {
    setSelectedProduct(product);
  }

  function handleBackToProducts() {
    pendingFocusProductId.current = selectedProduct?.id ?? null;
    setSelectedProduct(null);
  }

  function registerViewDetailsButton(productId: string, node: HTMLButtonElement | null) {
    if (node === null) {
      viewDetailsButtons.current.delete(productId);
      return;
    }

    viewDetailsButtons.current.set(productId, node);
  }

  function registerSearchInput(node: HTMLInputElement | null) {
    searchInputRef.current = node;
  }

  function openCart() {
    if (anonymous) {
      navigateTo("/account");
      return;
    }

    setIsCartOpen(true);
  }

  function closeCart() {
    setIsCartOpen(false);
    cartTriggerRef.current?.focus();
  }

  function handleOpenCheckout() {
    setSelectedProduct(null);
    setCartNotice(null);
    setOrderError(null);
    setIsCartOpen(false);
    navigateTo(checkoutPath);
  }

  function handleBackToMarket() {
    pendingCartTriggerFocus.current = true;
    setPlacedOrder(null);
    navigateTo(marketPath);
  }

  function handleBackToCheckout() {
    setPlacedOrder(null);
    navigateTo(checkoutPath);
  }

  async function handleAddToCart(product: ProductResponse) {
    if (anonymous) {
      navigateTo("/account");
      return;
    }

    cartSeqRef.current += 1;
    setCartPending(true);
    setCartError(null);
    setCartNotice(null);
    setOrderError(null);

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
    cartSeqRef.current += 1;
    setCartPending(true);
    setCartError(null);
    setCartNotice(null);
    setOrderError(null);

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
    cartSeqRef.current += 1;
    setCartPending(true);
    setCartError(null);
    setCartNotice(null);
    setOrderError(null);

    try {
      setCart(await removeCartItem(productId));
      setCartNotice("Item removed from your Cart.");
    } catch (caughtError) {
      setCartError(cartErrorMessage(caughtError));
    } finally {
      setCartPending(false);
    }
  }

  async function handlePlaceOrder() {
    if (
      cart === null ||
      cart.items.length === 0 ||
      cartPending ||
      orderPending ||
      cartError !== null ||
      orderInFlightRef.current
    ) {
      return;
    }

    // A retry after an unconfirmed result reuses the request ID, so the server never places two Orders.
    const previous = orderRequestRef.current;
    const request =
      previous !== null && previous.cartRevision === cart.revision
        ? previous
        : { requestId: crypto.randomUUID(), cartRevision: cart.revision };
    orderRequestRef.current = request;
    orderInFlightRef.current = true;
    setOrderPending(true);
    setOrderError(null);
    setCartNotice(null);

    try {
      const created = await createOrder(request.requestId, request.cartRevision);

      orderRequestRef.current = null;
      setPlacedOrder(created);
      // The backend emptied the Cart when it stored the Order.
      void refreshCart();
    } catch (caughtError) {
      if (!isUnconfirmedOrderError(caughtError)) {
        orderRequestRef.current = null;
        void refreshCart();
      }

      setOrderError(orderErrorMessage(caughtError));
    } finally {
      orderInFlightRef.current = false;
      setOrderPending(false);
    }
  }

  const cartItemCount = cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;

  const cartTrigger = (
    <CartTrigger
      buttonRef={cartTriggerRef}
      isOpen={isCartOpen}
      itemCount={cartItemCount}
      total={cart === null ? null : cart.total}
      onClick={openCart}
    />
  );

  if (isCheckoutPath) {
    return (
      <div className="grid gap-6">
        {placedOrder !== null ? (
          <OrderResult
            order={placedOrder}
            onBackToMarket={handleBackToMarket}
            onBackToCheckout={handleBackToCheckout}
          />
        ) : cart !== null ? (
          <CheckoutReview
            cart={cart}
            onBack={handleBackToMarket}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            isPending={cartPending}
            error={cartError}
            onRetry={() => void refreshCart()}
            orderPending={orderPending}
            orderError={orderError}
            onPlaceOrder={handlePlaceOrder}
          />
        ) : (
          <CheckoutLoadingCard
            isPending={cartPending}
            error={cartError}
            onRetry={() => void refreshCart()}
            onBackToMarket={handleBackToMarket}
          />
        )}
        {cartNotice !== null ? <StatusMessage tone="success">{cartNotice}</StatusMessage> : null}
        <CartDrawer
          isOpen={isCartOpen}
          onClose={closeCart}
          cart={cart}
          isPending={cartPending}
          error={cartError}
          onRetry={() => void refreshCart()}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onCheckout={handleOpenCheckout}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {selectedProduct !== null ? (
        <ProductDetail
          product={selectedProduct}
          isCartPending={cartPending}
          onBack={handleBackToProducts}
          onAdd={handleAddToCart}
          cartTrigger={cartTrigger}
        />
      ) : (
        <ProductBrowse
          products={products}
          isPending={productsPending}
          error={productsError}
          isCartPending={cartPending}
          onRetry={() => void refreshProducts()}
          onAdd={handleAddToCart}
          onSelect={handleSelectProduct}
          onViewDetailsRef={registerViewDetailsButton}
          cartTrigger={cartTrigger}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onSearchInputRef={registerSearchInput}
        />
      )}
      {cartNotice !== null ? <StatusMessage tone="success">{cartNotice}</StatusMessage> : null}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={closeCart}
        cart={cart}
        isPending={cartPending}
        error={cartError}
        onRetry={() => void refreshCart()}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleOpenCheckout}
      />
    </div>
  );
}

function CheckoutLoadingCard({
  isPending,
  error,
  onRetry,
  onBackToMarket
}: {
  isPending: boolean;
  error: string | null;
  onRetry: () => void;
  onBackToMarket: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section
      className="grid min-w-0 gap-4 rounded-sm border-[1.5px] border-ink bg-surface px-5 py-6 shadow-card"
      aria-labelledby="checkout-loading-heading"
      aria-busy={isPending}
    >
      <h1
        id="checkout-loading-heading"
        ref={headingRef}
        tabIndex={-1}
        className="text-[clamp(1.5rem,3vw,2.125rem)] leading-[1.15] tracking-[-0.025em] text-ink"
      >
        Checkout
      </h1>
      {error !== null ? (
        <div className="grid gap-3">
          <StatusMessage tone="error">{error}</StatusMessage>
          <Button onClick={onRetry} disabled={isPending}>
            Reload Cart
          </Button>
        </div>
      ) : (
        <StatusMessage tone="pending">Loading your Cart...</StatusMessage>
      )}
      <Button variant="quiet" onClick={onBackToMarket}>
        Back to Market
      </Button>
    </section>
  );
}
