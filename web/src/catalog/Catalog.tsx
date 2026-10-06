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
import {
  getPaymentAttempt,
  initiatePaymentAttempt,
  PaymentApiError,
  type PaymentAttemptResponse,
  type PaymentScenario
} from "../payment/paymentApi";
import { isUnconfirmedPaymentError, paymentErrorMessage } from "../payment/messages";
import { createOrder, getOrderByPaymentAttempt, OrderApiError, type OrderResponse } from "../order/orderApi";
import { missingApprovalMessage, orderErrorMessage, unconfirmedOrderMessage } from "../order/messages";
import ProductBrowse from "./ProductBrowse";
import ProductDetail from "./ProductDetail";
import StatusMessage from "../ui/StatusMessage";
import Button from "../ui/Button";
import { catalogBrowseErrorMessage, cartErrorMessage } from "./messages";
import AttemptSurface, { type RecoveryStatus } from "../journey/AttemptSurface";
import LatestJourneyLink from "../journey/LatestJourneyLink";
import {
  attemptIdForPath,
  attemptPath,
  checkoutPath,
  marketPath,
  navigateTo,
  usePath
} from "../journey/routes";
import { clearLatestReference, readLatestReference, writeLatestReference } from "../journey/referenceStorage";
import {
  awaitingOrderMessage,
  referenceForgottenMessage,
  unconfirmedPaymentPrimary,
  unresolvedReferenceMessage
} from "../journey/messages";

type OrderAttemptOp = {
  error: string | null;
  uncertain: boolean;
  retryReady: boolean;
  blocked: boolean;
};

export default function Catalog() {
  const path = usePath();
  const routeAttemptId = attemptIdForPath(path);
  const isMarketPath = path === marketPath;
  const isCheckoutPath = path === checkoutPath;

  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [productsPending, setProductsPending] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [cartPending, setCartPending] = useState(true);
  const [cartError, setCartError] = useState<string | null>(null);
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);
  const [paymentPendingAttemptId, setPaymentPendingAttemptId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentUncertainAttemptId, setPaymentUncertainAttemptId] = useState<string | null>(null);
  const [paymentAttempts, setPaymentAttempts] = useState<Record<string, PaymentAttemptResponse>>({});
  const [orders, setOrders] = useState<Record<string, OrderResponse>>({});
  const [orderOps, setOrderOps] = useState<Record<string, OrderAttemptOp>>({});
  const [orderPendingAttemptIds, setOrderPendingAttemptIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const [latestReference, setLatestReferenceState] = useState<string | null>(() => readLatestReference());
  const [referenceNotice, setReferenceNotice] = useState<string | null>(null);
  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatus>("idle");
  const [recoveryAttemptId, setRecoveryAttemptId] = useState<string | null>(null);
  const pendingFocusProductId = useRef<string | null>(null);
  const pendingCartTriggerFocus = useRef(false);
  const viewDetailsButtons = useRef(new Map<string, HTMLButtonElement>());
  const cartTriggerRef = useRef<HTMLButtonElement>(null);
  const paymentInFlightRef = useRef<string | null>(null);
  const orderInFlightRef = useRef(new Set<string>());
  const latestReferenceRef = useRef<string | null>(latestReference);
  const recoverySeqRef = useRef(0);
  const recoveryActiveRef = useRef<{ attemptId: string; sequence: number } | null>(null);
  const lookupTokensRef = useRef(new Map<string, number>());
  const lookupActiveRef = useRef(new Set<string>());
  const routeAttemptRef = useRef<string | null>(null);
  const cartSeqRef = useRef(0);
  const previousPathRef = useRef(path);

  routeAttemptRef.current = routeAttemptId;

  const recoveryFailedAttemptId =
    recoveryAttemptId !== null &&
    (recoveryStatus === "unavailable" || recoveryStatus === "error")
      ? recoveryAttemptId
      : null;
  const selectedAttempt = routeAttemptId === null ? null : paymentAttempts[routeAttemptId] ?? null;
  const selectedOrder = routeAttemptId === null ? null : orders[routeAttemptId] ?? null;
  const selectedOrderOp = routeAttemptId === null ? undefined : orderOps[routeAttemptId];
  const approvedAwaitingOrderAttemptId =
    Object.keys(paymentAttempts).find(
      (attemptId) =>
        paymentAttempts[attemptId].status === "approved" && orders[attemptId] === undefined
    ) ?? null;
  const orderUncertainAttemptId =
    Object.keys(orderOps).find((attemptId) => orderOps[attemptId]?.uncertain === true) ?? null;
  const unresolvedJourneyAttemptId = paymentPending
    ? paymentPendingAttemptId
    : (paymentUncertainAttemptId ??
      orderUncertainAttemptId ??
      recoveryFailedAttemptId ??
      approvedAwaitingOrderAttemptId ??
      (latestReference !== null && !isReferenceFinished(latestReference)
        ? latestReference
        : null));
  const checkoutBlockedMessage =
    paymentUncertainAttemptId !== null
      ? unconfirmedPaymentPrimary
      : approvedAwaitingOrderAttemptId !== null
        ? awaitingOrderMessage
        : unresolvedReferenceMessage;

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
    void refreshCart();
  }, []);

  useEffect(() => {
    const previousPath = previousPathRef.current;
    previousPathRef.current = path;

    if (path === checkoutPath && previousPath !== checkoutPath) {
      void refreshCart();
    }
  }, [path]);

  useEffect(() => {
    return () => {
      cancelRecoveryRead();
    };
  }, [routeAttemptId]);

  useEffect(() => {
    if (routeAttemptId === null) {
      return;
    }

    if (paymentInFlightRef.current === routeAttemptId || orderInFlightRef.current.has(routeAttemptId)) {
      return;
    }

    if (lookupActiveRef.current.has(routeAttemptId)) {
      return;
    }

    if (paymentAttempts[routeAttemptId] !== undefined || orders[routeAttemptId] !== undefined) {
      return;
    }

    if (paymentUncertainAttemptId === routeAttemptId || orderOps[routeAttemptId]?.uncertain === true) {
      return;
    }

    if (
      recoveryAttemptId === routeAttemptId &&
      (recoveryStatus === "unavailable" || recoveryStatus === "error")
    ) {
      return;
    }

    void runRecovery(routeAttemptId);
  }, [
    routeAttemptId,
    paymentAttempts,
    orders,
    orderOps,
    paymentUncertainAttemptId,
    recoveryAttemptId,
    recoveryStatus,
    paymentPending,
    orderPendingAttemptIds
  ]);

  useEffect(() => {
    if (path === marketPath && pendingCartTriggerFocus.current) {
      pendingCartTriggerFocus.current = false;
      cartTriggerRef.current?.focus();
    }
  }, [path]);

  useEffect(() => {
    if (routeAttemptId !== null || path !== marketPath) {
      setSelectedProduct(null);
    }
  }, [path, routeAttemptId]);

  useEffect(() => {
    if (selectedProduct === null && pendingFocusProductId.current !== null) {
      const productId = pendingFocusProductId.current;
      pendingFocusProductId.current = null;
      viewDetailsButtons.current.get(productId)?.focus();
    }
  }, [selectedProduct]);

  function cancelRecoveryRead() {
    recoverySeqRef.current += 1;
    recoveryActiveRef.current = null;
  }

  function invalidateLookupsFor(attemptId: string) {
    lookupTokensRef.current.set(attemptId, (lookupTokensRef.current.get(attemptId) ?? 0) + 1);
    lookupActiveRef.current.delete(attemptId);
  }

  function beginLookup(attemptId: string): number {
    cancelRecoveryRead();
    const token = (lookupTokensRef.current.get(attemptId) ?? 0) + 1;
    lookupTokensRef.current.set(attemptId, token);
    lookupActiveRef.current.add(attemptId);
    return token;
  }

  function isCurrentLookup(token: number, attemptId: string): boolean {
    return lookupTokensRef.current.get(attemptId) === token;
  }

  function endLookup(token: number, attemptId: string) {
    if (lookupTokensRef.current.get(attemptId) === token) {
      lookupActiveRef.current.delete(attemptId);
    }
  }

  function setPaymentAttemptRecord(attempt: PaymentAttemptResponse) {
    setPaymentAttempts((current) => ({ ...current, [attempt.attemptId]: attempt }));
  }

  function setOrderRecord(found: OrderResponse) {
    setOrders((current) => ({ ...current, [found.paymentAttemptId]: found }));
  }

  function patchOrderOp(attemptId: string, patch: Partial<OrderAttemptOp>) {
    setOrderOps((current) => {
      const existing = current[attemptId] ?? {
        error: null,
        uncertain: false,
        retryReady: false,
        blocked: false
      };

      return {
        ...current,
        [attemptId]: {
          error: "error" in patch ? (patch.error ?? null) : existing.error,
          uncertain: patch.uncertain ?? existing.uncertain,
          retryReady: patch.retryReady ?? existing.retryReady,
          blocked: patch.blocked ?? existing.blocked
        }
      };
    });
  }

  function clearOrderOp(attemptId: string) {
    setOrderOps((current) => {
      if (current[attemptId] === undefined) {
        return current;
      }

      const next = { ...current };
      delete next[attemptId];
      return next;
    });
  }

  function beginOrderOperation(attemptId: string) {
    orderInFlightRef.current.add(attemptId);
    setOrderPendingAttemptIds((current) => {
      if (current.has(attemptId)) {
        return current;
      }

      const next = new Set(current);
      next.add(attemptId);
      return next;
    });
  }

  function endOrderOperation(attemptId: string) {
    orderInFlightRef.current.delete(attemptId);
    setOrderPendingAttemptIds((current) => {
      if (!current.has(attemptId)) {
        return current;
      }

      const next = new Set(current);
      next.delete(attemptId);
      return next;
    });
  }

  function isCurrentRecovery(sequence: number, attemptId: string): boolean {
    const active = recoveryActiveRef.current;
    return (
      recoverySeqRef.current === sequence &&
      active !== null &&
      active.attemptId === attemptId &&
      active.sequence === sequence
    );
  }

  async function runRecovery(attemptId: string) {
    if (recoveryActiveRef.current?.attemptId === attemptId) {
      return;
    }

    const sequence = ++recoverySeqRef.current;
    recoveryActiveRef.current = { attemptId, sequence };
    setRecoveryAttemptId(attemptId);
    setRecoveryStatus("checking");

    try {
      let recoveredOrder: OrderResponse;

      try {
        recoveredOrder = await getOrderByPaymentAttempt(attemptId);
      } catch (orderError) {
        if (!isCurrentRecovery(sequence, attemptId)) {
          return;
        }

        if (!(orderError instanceof OrderApiError) || orderError.kind !== "not-found") {
          setRecoveryStatus("error");
          return;
        }

        try {
          const attempt = await getPaymentAttempt(attemptId);

          if (!isCurrentRecovery(sequence, attemptId)) {
            return;
          }

          if (attempt.attemptId !== attemptId) {
            setRecoveryStatus("error");
            return;
          }

          setPaymentAttemptRecord(attempt);
          setRecoveryStatus("idle");
        } catch (paymentError) {
          if (!isCurrentRecovery(sequence, attemptId)) {
            return;
          }

          setRecoveryStatus(
            paymentError instanceof PaymentApiError && paymentError.kind === "not-found"
              ? "unavailable"
              : "error"
          );
        }

        return;
      }

      if (!isCurrentRecovery(sequence, attemptId)) {
        return;
      }

      if (recoveredOrder.paymentAttemptId !== attemptId) {
        setRecoveryStatus("error");
        return;
      }

      setOrderRecord(recoveredOrder);
      setRecoveryStatus("idle");
    } finally {
      const active = recoveryActiveRef.current;

      if (active !== null && active.attemptId === attemptId && active.sequence === sequence) {
        recoveryActiveRef.current = null;
      }
    }
  }

  function setLatestReference(attemptId: string) {
    latestReferenceRef.current = attemptId;
    writeLatestReference(attemptId);
    setLatestReferenceState(attemptId);
  }

  function forgetLatestReferenceIf(attemptId: string) {
    if (latestReferenceRef.current !== attemptId) {
      return;
    }

    latestReferenceRef.current = null;
    clearLatestReference();
    setLatestReferenceState(null);
  }

  function isReferenceFinished(attemptId: string): boolean {
    if (orders[attemptId] !== undefined) {
      return true;
    }

    const attempt = paymentAttempts[attemptId];

    return (
      attempt !== undefined &&
      (attempt.status === "declined" || attempt.status === "failed")
    );
  }

  function navigateJourney(path: string, options: { replace?: boolean } = {}): boolean {
    const result = navigateTo(path, options);
    routeAttemptRef.current = attemptIdForPath(path);
    return result;
  }

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
    setIsCartOpen(false);
    navigateJourney(checkoutPath);
  }

  function handleBackToMarket() {
    pendingCartTriggerFocus.current = true;
    navigateJourney(marketPath);
  }

  function handleBackToCheckout() {
    navigateJourney(checkoutPath);
  }

  function handleAbandonReference(attemptId: string) {
    if (paymentInFlightRef.current === attemptId || orderInFlightRef.current.has(attemptId)) {
      return;
    }

    cancelRecoveryRead();
    invalidateLookupsFor(attemptId);
    setPaymentUncertainAttemptId((current) => (current === attemptId ? null : current));
    setPaymentAttempts((current) => {
      if (current[attemptId] === undefined) {
        return current;
      }

      const next = { ...current };
      delete next[attemptId];
      return next;
    });
    setOrders((current) => {
      if (current[attemptId] === undefined) {
        return current;
      }

      const next = { ...current };
      delete next[attemptId];
      return next;
    });
    clearOrderOp(attemptId);
    setRecoveryAttemptId(null);
    setRecoveryStatus("idle");
    forgetLatestReferenceIf(attemptId);
    setReferenceNotice(referenceForgottenMessage);
    navigateJourney(checkoutPath, { replace: true });
    void refreshCart();
  }

  function handleForgetLatestReference() {
    if (latestReference === null) {
      return;
    }

    forgetLatestReferenceIf(latestReference);
    setReferenceNotice(referenceForgottenMessage);
  }

  async function handleAddToCart(product: ProductResponse) {
    cartSeqRef.current += 1;
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
    cartSeqRef.current += 1;
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
    cartSeqRef.current += 1;
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
      unresolvedJourneyAttemptId !== null ||
      paymentInFlightRef.current !== null
    ) {
      return;
    }

    const attemptId = crypto.randomUUID();
    paymentInFlightRef.current = attemptId;

    if (!navigateJourney(attemptPath(attemptId))) {
      paymentInFlightRef.current = null;
      return;
    }

    cancelRecoveryRead();
    setPaymentPendingAttemptId(attemptId);
    setPaymentPending(true);
    setPaymentError(null);
    setCartNotice(null);
    setPaymentUncertainAttemptId(null);
    setRecoveryAttemptId(null);
    setRecoveryStatus("idle");
    setLatestReference(attemptId);

    try {
      const attempt = await initiatePaymentAttempt(attemptId, cart.revision, scenario);

      if (attempt.attemptId !== attemptId) {
        throw new PaymentApiError("invalid-response");
      }

      setPaymentAttemptRecord(attempt);
    } catch (caughtError) {
      if (caughtError instanceof PaymentApiError && caughtError.kind === "cart-changed") {
        forgetLatestReferenceIf(attemptId);
        setPaymentError(paymentErrorMessage(caughtError));
        navigateJourney(checkoutPath, { replace: true });
        await refreshCart();
      } else if (
        caughtError instanceof PaymentApiError &&
        caughtError.kind === "already-approved" &&
        caughtError.existingAttemptId !== null
      ) {
        const existingAttemptId = caughtError.existingAttemptId;
        setLatestReference(existingAttemptId);
        navigateJourney(attemptPath(existingAttemptId), { replace: true });
        await loadPaymentAttempt(existingAttemptId);
      } else if (caughtError instanceof PaymentApiError && isUnconfirmedPaymentError(caughtError.kind)) {
        setPaymentUncertainAttemptId(attemptId);
      } else {
        forgetLatestReferenceIf(attemptId);
        setPaymentError(paymentErrorMessage(caughtError));
        navigateJourney(checkoutPath, { replace: true });
      }
    } finally {
      paymentInFlightRef.current = null;
      setPaymentPending(false);
      setPaymentPendingAttemptId(null);
    }
  }

  async function loadPaymentAttempt(attemptId: string) {
    const token = beginLookup(attemptId);

    try {
      const attempt = await getPaymentAttempt(attemptId);

      if (!isCurrentLookup(token, attemptId) || routeAttemptRef.current !== attemptId) {
        return;
      }

      if (attempt.attemptId !== attemptId) {
        throw new PaymentApiError("invalid-response");
      }

      setPaymentAttemptRecord(attempt);
      setPaymentUncertainAttemptId(null);
    } catch {
      if (!isCurrentLookup(token, attemptId) || routeAttemptRef.current !== attemptId) {
        return;
      }

      setPaymentUncertainAttemptId(attemptId);
    } finally {
      endLookup(token, attemptId);
    }
  }

  async function handleCheckPaymentResult(attemptId: string) {
    if (paymentUncertainAttemptId !== attemptId || paymentPending) {
      return;
    }

    const token = beginLookup(attemptId);
    setPaymentPending(true);
    setPaymentError(null);

    try {
      const attempt = await getPaymentAttempt(attemptId);

      if (!isCurrentLookup(token, attemptId) || routeAttemptRef.current !== attemptId) {
        return;
      }

      if (attempt.attemptId !== attemptId) {
        throw new PaymentApiError("invalid-response");
      }

      setPaymentAttemptRecord(attempt);
      setPaymentUncertainAttemptId(null);
      setRecoveryAttemptId(null);
      setRecoveryStatus("idle");
    } catch (caughtError) {
      if (!isCurrentLookup(token, attemptId) || routeAttemptRef.current !== attemptId) {
        return;
      }

      setPaymentUncertainAttemptId(attemptId);
      setRecoveryAttemptId(attemptId);
      setRecoveryStatus(
        caughtError instanceof PaymentApiError && caughtError.kind === "not-found"
          ? "unavailable"
          : "error"
      );
    } finally {
      endLookup(token, attemptId);
      setPaymentPending(false);
    }
  }

  async function handleCreateOrder(attemptId: string) {
    const attempt = paymentAttempts[attemptId];
    const op = orderOps[attemptId];

    if (
      attempt?.status !== "approved" ||
      orderInFlightRef.current.has(attemptId) ||
      op?.blocked === true ||
      (op?.uncertain === true && op?.retryReady !== true)
    ) {
      return;
    }

    const token = beginLookup(attemptId);
    beginOrderOperation(attemptId);
    patchOrderOp(attemptId, { error: null, retryReady: false });

    try {
      const created = await createOrder(attemptId);

      if (!isCurrentLookup(token, attemptId)) {
        return;
      }

      if (created.paymentAttemptId !== attemptId || created.cartRevision !== attempt.cartRevision) {
        throw new OrderApiError("invalid-response");
      }

      setOrderRecord(created);
      clearOrderOp(attemptId);
    } catch (caught) {
      if (!isCurrentLookup(token, attemptId)) {
        return;
      }

      if (
        caught instanceof OrderApiError &&
        ["bad-request", "not-found", "not-approved", "capacity"].includes(caught.kind)
      ) {
        patchOrderOp(attemptId, {
          error: orderErrorMessage(caught),
          blocked: true,
          uncertain: false,
          retryReady: false
        });
      } else {
        patchOrderOp(attemptId, {
          error: orderErrorMessage(caught),
          uncertain: true,
          blocked: false,
          retryReady: false
        });
      }
    } finally {
      endLookup(token, attemptId);
      endOrderOperation(attemptId);
    }
  }

  async function handleCheckOrder(attemptId: string) {
    const attempt = paymentAttempts[attemptId];
    const op = orderOps[attemptId];

    if (
      attempt === undefined ||
      op?.uncertain !== true ||
      orderInFlightRef.current.has(attemptId)
    ) {
      return;
    }

    const token = beginLookup(attemptId);
    beginOrderOperation(attemptId);
    patchOrderOp(attemptId, { error: null });

    try {
      const found = await getOrderByPaymentAttempt(attemptId);

      if (!isCurrentLookup(token, attemptId) || routeAttemptRef.current !== attemptId) {
        return;
      }

      if (found.paymentAttemptId !== attemptId || found.cartRevision !== attempt.cartRevision) {
        throw new OrderApiError("invalid-response");
      }

      setOrderRecord(found);
      clearOrderOp(attemptId);
    } catch (caught) {
      if (!isCurrentLookup(token, attemptId) || routeAttemptRef.current !== attemptId) {
        return;
      }

      if (caught instanceof OrderApiError && caught.kind === "not-found") {
        try {
          const payment = await getPaymentAttempt(attemptId);

          if (!isCurrentLookup(token, attemptId) || routeAttemptRef.current !== attemptId) {
            return;
          }

          if (payment.attemptId === attemptId && payment.status === "approved" &&
              payment.cartRevision === attempt.cartRevision) {
            patchOrderOp(attemptId, {
              error: "No Order was found. The approved attempt is confirmed. You may explicitly create an Order with the same attempt ID.",
              retryReady: true,
              uncertain: true
            });
          } else if (payment.attemptId === attemptId &&
              (payment.status === "declined" || payment.status === "failed")) {
            setPaymentAttemptRecord(payment);
            clearOrderOp(attemptId);
          } else {
            patchOrderOp(attemptId, { error: unconfirmedOrderMessage });
          }
        } catch (paymentError) {
          if (!isCurrentLookup(token, attemptId) || routeAttemptRef.current !== attemptId) {
            return;
          }

          if (paymentError instanceof PaymentApiError && paymentError.kind === "not-found") {
            patchOrderOp(attemptId, {
              error: missingApprovalMessage,
              blocked: true,
              uncertain: false,
              retryReady: false
            });
          } else {
            patchOrderOp(attemptId, { error: unconfirmedOrderMessage });
          }
        }
      } else {
        patchOrderOp(attemptId, { error: unconfirmedOrderMessage });
      }
    } finally {
      endLookup(token, attemptId);
      endOrderOperation(attemptId);
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

  const latestJourneyLink =
    latestReference !== null && (isMarketPath || isCheckoutPath) ? (
      <LatestJourneyLink
        reference={latestReference}
        unresolved={!isReferenceFinished(latestReference)}
        busy={
          (paymentPending && paymentPendingAttemptId === latestReference) ||
          orderPendingAttemptIds.has(latestReference)
        }
        onOpen={() => navigateJourney(attemptPath(latestReference))}
        onAbandon={() => handleAbandonReference(latestReference)}
        onForget={handleForgetLatestReference}
      />
    ) : null;

  if (routeAttemptId !== null) {
    return (
      <div className="grid gap-6">
        <AttemptSurface
          attemptId={routeAttemptId}
          order={selectedOrder}
          paymentAttempt={selectedAttempt}
          paymentPending={paymentPending && paymentPendingAttemptId === routeAttemptId}
          recoveryStatus={recoveryAttemptId === routeAttemptId ? recoveryStatus : "idle"}
          paymentUncertain={paymentUncertainAttemptId === routeAttemptId}
          orderPending={orderPendingAttemptIds.has(routeAttemptId)}
          orderError={selectedOrderOp?.error ?? null}
          orderUncertain={selectedOrderOp?.uncertain === true}
          orderRetryReady={selectedOrderOp?.retryReady === true}
          orderBlocked={selectedOrderOp?.blocked === true}
          onCreateOrder={() => void handleCreateOrder(routeAttemptId)}
          onCheckOrder={() => void handleCheckOrder(routeAttemptId)}
          onCheckPayment={() => void handleCheckPaymentResult(routeAttemptId)}
          onRetryRecovery={() => {
            cancelRecoveryRead();
            setRecoveryAttemptId(null);
            setRecoveryStatus("idle");
            void runRecovery(routeAttemptId);
          }}
          onAbandon={() => handleAbandonReference(routeAttemptId)}
          onBackToMarket={handleBackToMarket}
          onBackToCheckout={handleBackToCheckout}
        />
        {referenceNotice !== null ? <StatusMessage tone="neutral">{referenceNotice}</StatusMessage> : null}
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

  if (isCheckoutPath) {
    return (
      <div className="grid gap-6">
        {latestJourneyLink}
        {cart !== null ? (
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
            paymentBlocked={unresolvedJourneyAttemptId !== null && !paymentPending}
            blockedPaymentMessage={checkoutBlockedMessage}
            onViewAttempt={
              unresolvedJourneyAttemptId === null
                ? undefined
                : () => navigateJourney(attemptPath(unresolvedJourneyAttemptId))
            }
            onSimulatePayment={handleSimulatePayment}
          />
        ) : (
          <CheckoutLoadingCard
            isPending={cartPending}
            error={cartError}
            onRetry={() => void refreshCart()}
            onBackToMarket={handleBackToMarket}
          />
        )}
        {referenceNotice !== null ? <StatusMessage tone="neutral">{referenceNotice}</StatusMessage> : null}
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
      {latestJourneyLink}
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
        />
      )}
      {referenceNotice !== null ? <StatusMessage tone="neutral">{referenceNotice}</StatusMessage> : null}
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
      className="grid min-w-0 gap-4 rounded-lg border border-border bg-surface px-5 py-6 shadow-card"
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
