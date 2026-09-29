import { useEffect, useRef, useState } from "react";
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
import PaymentResult from "../payment/PaymentResult";
import {
  getPaymentAttempt,
  initiatePaymentAttempt,
  PaymentApiError,
  type PaymentAttemptResponse,
  type PaymentScenario
} from "../payment/paymentApi";
import { isUnconfirmedPaymentError, paymentErrorMessage } from "../payment/messages";
import OrderResult from "../order/OrderResult";
import { createOrder, getOrderByPaymentAttempt, OrderApiError, type OrderResponse } from "../order/orderApi";
import { missingApprovalMessage, orderErrorMessage, unconfirmedOrderMessage } from "../order/messages";
import ProductBrowse from "./ProductBrowse";
import ProductDetail from "./ProductDetail";
import StatusMessage from "../ui/StatusMessage";
import { catalogBrowseErrorMessage, cartErrorMessage } from "./messages";

export default function Catalog() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [productsPending, setProductsPending] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [cartPending, setCartPending] = useState(true);
  const [cartError, setCartError] = useState<string | null>(null);
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentUncertainAttemptId, setPaymentUncertainAttemptId] = useState<string | null>(null);
  const [paymentAttempt, setPaymentAttempt] = useState<PaymentAttemptResponse | null>(null);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [orderVisible, setOrderVisible] = useState(false);
  const [orderPending, setOrderPending] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderUncertainAttemptId, setOrderUncertainAttemptId] = useState<string | null>(null);
  const [orderRetryReady, setOrderRetryReady] = useState(false);
  const [orderBlocked, setOrderBlocked] = useState(false);
  const pendingFocusProductId = useRef<string | null>(null);
  const pendingCartTriggerFocus = useRef(false);
  const viewDetailsButtons = useRef(new Map<string, HTMLButtonElement>());
  const cartTriggerRef = useRef<HTMLButtonElement>(null);
  const orderInFlightRef = useRef(false);

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

  useEffect(() => {
    if (selectedProduct === null && pendingFocusProductId.current !== null) {
      const productId = pendingFocusProductId.current;
      pendingFocusProductId.current = null;
      viewDetailsButtons.current.get(productId)?.focus();
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (!isCheckoutOpen && pendingCartTriggerFocus.current) {
      pendingCartTriggerFocus.current = false;
      cartTriggerRef.current?.focus();
    }
  }, [isCheckoutOpen]);

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

  function openCart() {
    setIsCartOpen(true);
  }

  function closeCart() {
    setIsCartOpen(false);
    cartTriggerRef.current?.focus();
  }

  function handleOpenCheckout() {
    setSelectedProduct(null);
    setCartNotice(null);
    setPaymentError(null);
    // A confirmed approval and any unresolved Order identity survive in-app navigation.
    if (paymentAttempt?.status !== "approved" && orderUncertainAttemptId === null) {
      setPaymentAttempt(null);
    }
    setIsCheckoutOpen(true);
    setIsCartOpen(false);
  }

  function handleBackToMarket() {
    pendingCartTriggerFocus.current = true;
    setIsCheckoutOpen(false);
  }

  async function handleAddToCart(product: ProductResponse) {
    setCartPending(true);
    setCartError(null);
    setCartNotice(null);
    setPaymentError(null);

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
    setPaymentError(null);

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
    setPaymentError(null);

    try {
      setCart(await removeCartItem(productId));
      setCartNotice("Item removed from your Cart.");
    } catch (caughtError) {
      setCartError(cartErrorMessage(caughtError));
    } finally {
      setCartPending(false);
    }
  }

  async function handleSimulatePayment(scenario: PaymentScenario) {
    if (
      cart === null ||
      cart.items.length === 0 ||
      cartPending ||
      paymentPending ||
      cartError !== null ||
      paymentUncertainAttemptId !== null
    ) {
      return;
    }

    const attemptId = crypto.randomUUID();
    setOrderVisible(false);
    setOrderError(null);
    setOrderUncertainAttemptId(null);
    setOrderRetryReady(false);
    setOrderBlocked(false);
    setPaymentPending(true);
    setPaymentError(null);
    setCartNotice(null);

    try {
      setPaymentAttempt(await initiatePaymentAttempt(attemptId, cart.revision, scenario));
    } catch (caughtError) {
      if (caughtError instanceof PaymentApiError && caughtError.kind === "cart-changed") {
        setPaymentError(paymentErrorMessage(caughtError));
        await refreshCart();
      } else if (
        caughtError instanceof PaymentApiError &&
        caughtError.kind === "already-approved" &&
        caughtError.existingAttemptId !== null
      ) {
        setPaymentError(paymentErrorMessage(caughtError));
        await loadPaymentAttempt(caughtError.existingAttemptId);
      } else if (caughtError instanceof PaymentApiError && isUnconfirmedPaymentError(caughtError.kind)) {
        setPaymentError(paymentErrorMessage(caughtError));
        setPaymentUncertainAttemptId(attemptId);
      } else {
        setPaymentError(paymentErrorMessage(caughtError));
      }
    } finally {
      setPaymentPending(false);
    }
  }

  async function handleCheckPaymentResult() {
    if (paymentUncertainAttemptId === null || paymentPending) {
      return;
    }

    setPaymentPending(true);
    setPaymentError(null);

    try {
      await loadPaymentAttempt(paymentUncertainAttemptId);
    } finally {
      setPaymentPending(false);
    }
  }

  async function loadPaymentAttempt(attemptId: string) {
    try {
      setPaymentAttempt(await getPaymentAttempt(attemptId));
      setPaymentUncertainAttemptId(null);
    } catch (caughtError) {
      setPaymentError(paymentErrorMessage(caughtError));

      if (caughtError instanceof PaymentApiError && caughtError.kind === "not-found") {
        setPaymentUncertainAttemptId(null);
        await refreshCart();
      } else {
        setPaymentUncertainAttemptId(attemptId);
      }
    }
  }

  function handleReturnToCheckout() {
    if (orderUncertainAttemptId !== null) return;
    setPaymentAttempt(null);
    setPaymentError(null);
    setPaymentUncertainAttemptId(null);
    setCartNotice(null);
    setOrderVisible(false);
  }

  async function handleCreateOrder() {
    const attempt = paymentAttempt;
    if (attempt?.status !== "approved" || orderInFlightRef.current || orderBlocked ||
        (orderUncertainAttemptId !== null && !orderRetryReady)) return;
    orderInFlightRef.current = true;
    setOrderPending(true);
    setOrderError(null);
    setOrderRetryReady(false);
    try {
      const created = await createOrder(attempt.attemptId);
      if (created.paymentAttemptId !== attempt.attemptId || created.cartRevision !== attempt.cartRevision) {
        throw new OrderApiError("invalid-response");
      }
      setOrder(created);
      setOrderVisible(true);
      setOrderUncertainAttemptId(null);
    } catch (caught) {
      setOrderError(orderErrorMessage(caught));
      if (caught instanceof OrderApiError && ["bad-request", "not-found", "not-approved", "capacity"].includes(caught.kind)) {
        setOrderBlocked(true);
        setOrderUncertainAttemptId(null);
      } else {
        setOrderUncertainAttemptId(attempt.attemptId);
      }
    } finally {
      orderInFlightRef.current = false;
      setOrderPending(false);
    }
  }

  async function handleCheckOrder() {
    const id = orderUncertainAttemptId;
    if (id === null || orderInFlightRef.current || paymentAttempt?.attemptId !== id) return;
    orderInFlightRef.current = true;
    setOrderPending(true);
    setOrderError(null);
    try {
      const found = await getOrderByPaymentAttempt(id);
      if (found.paymentAttemptId !== id || found.cartRevision !== paymentAttempt.cartRevision) {
        throw new OrderApiError("invalid-response");
      }
      setOrder(found);
      setOrderVisible(true);
      setOrderUncertainAttemptId(null);
      setOrderRetryReady(false);
    } catch (caught) {
      if (caught instanceof OrderApiError && caught.kind === "not-found") {
        try {
          const attempt = await getPaymentAttempt(id);
          if (attempt.attemptId === id && attempt.status === "approved" &&
              attempt.cartRevision === paymentAttempt.cartRevision) {
            setOrderRetryReady(true);
            setOrderError("No Order was found. The approved attempt is confirmed. You may explicitly create an Order with the same attempt ID.");
          } else {
            setOrderBlocked(true);
            setOrderUncertainAttemptId(null);
            setPaymentAttempt(null);
            setPaymentError(missingApprovalMessage);
            await refreshCart();
          }
        } catch (paymentError) {
          if (paymentError instanceof PaymentApiError && paymentError.kind === "not-found") {
            setOrderBlocked(true);
            setOrderUncertainAttemptId(null);
            setPaymentAttempt(null);
            setPaymentError(missingApprovalMessage);
            await refreshCart();
          } else {
            setOrderError(unconfirmedOrderMessage);
          }
        }
      } else {
        setOrderError(unconfirmedOrderMessage);
      }
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

  return (
    <div className="grid gap-6">
      {isCheckoutOpen && cart !== null ? (
        order !== null && orderVisible ? (
          <OrderResult order={order} onBackToMarket={handleBackToMarket} onBackToCheckout={handleReturnToCheckout} />
        ) : paymentAttempt !== null ? (
          <PaymentResult attempt={paymentAttempt} onBackToCheckout={handleReturnToCheckout}
            onBackToMarket={handleBackToMarket} onCreateOrder={() => void handleCreateOrder()}
            onViewOrder={order?.paymentAttemptId === paymentAttempt.attemptId ? () => setOrderVisible(true) : undefined}
            onCheckOrder={() => void handleCheckOrder()} orderPending={orderPending}
            orderError={orderError} orderUnconfirmed={orderUncertainAttemptId !== null}
            orderRetryReady={orderRetryReady} orderBlocked={orderBlocked} />
        ) : (
          <CheckoutReview
            cart={cart}
            onBack={handleBackToMarket}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            isPending={cartPending}
            error={cartError}
            onRetry={() => void refreshCart()}
            paymentPending={paymentPending}
            paymentError={paymentError}
            paymentCanCheckResult={paymentUncertainAttemptId !== null}
            onSimulatePayment={handleSimulatePayment}
            onCheckPaymentResult={() => void handleCheckPaymentResult()}
            onViewOrder={order === null ? undefined : () => setOrderVisible(true)}
          />
        )
      ) : selectedProduct !== null ? (
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
