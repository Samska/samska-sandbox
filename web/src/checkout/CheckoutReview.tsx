import { useEffect, useRef } from "react";
import type { CartResponse } from "../cart/cartApi";
import CartItemRow from "../cart/CartItemRow";
import { formatAmount } from "../formatAmount";
import Button from "../ui/Button";
import StatusMessage from "../ui/StatusMessage";

type MutationIntent = {
  kind: "quantity" | "remove";
  productId: string;
  order: string[];
  control: HTMLElement | null;
};

export default function CheckoutReview({
  cart,
  onBack,
  onUpdateQuantity,
  onRemoveItem,
  isPending,
  error,
  onRetry
}: {
  cart: CartResponse;
  onBack: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => Promise<void>;
  onRemoveItem: (productId: string) => Promise<void>;
  isPending: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const emptyStateRef = useRef<HTMLHeadingElement>(null);
  const mutationIntentRef = useRef<MutationIntent | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    const intent = mutationIntentRef.current;

    if (intent === null) {
      return;
    }

    if (isPending) {
      if (intent.control !== null && !sectionRef.current?.contains(document.activeElement)) {
        focusItemRow(listRef.current, intent.productId);
      }

      return;
    }

    mutationIntentRef.current = null;

    const itemStillExists = cart.items.some((item) => item.productId === intent.productId);

    if (intent.kind === "remove" && !itemStillExists) {
      if (cart.items.length === 0) {
        emptyStateRef.current?.focus();
      } else {
        focusAdjacentItem(listRef.current, intent.order, intent.productId);
      }

      return;
    }

    if (intent.control !== null) {
      if (intent.control.isConnected && !isDisabledControl(intent.control)) {
        intent.control.focus();
      } else {
        focusItemQuantity(listRef.current, intent.productId);
      }
    }
  }, [cart, isPending]);

  function captureIntent(kind: MutationIntent["kind"], productId: string): MutationIntent {
    const activeElement = document.activeElement;

    return {
      kind,
      productId,
      order: cart.items.map((item) => item.productId),
      control:
        activeElement instanceof HTMLElement && sectionRef.current?.contains(activeElement)
          ? activeElement
          : null
    };
  }

  function handleUpdateQuantity(productId: string, quantity: number) {
    mutationIntentRef.current = captureIntent("quantity", productId);

    return onUpdateQuantity(productId, quantity);
  }

  function handleRemoveItem(productId: string) {
    mutationIntentRef.current = captureIntent("remove", productId);

    return onRemoveItem(productId);
  }

  return (
    <section
      id="checkout"
      ref={sectionRef}
      className="grid min-w-0 gap-5 overflow-hidden rounded-lg border border-border bg-surface shadow-card"
      aria-labelledby="checkout-heading"
      aria-busy={isPending}
    >
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
        <Button variant="quiet" size="sm" onClick={onBack}>
          <span aria-hidden="true">&#8592;</span> Back to Market
        </Button>
      </div>
      <div className="grid gap-5 px-5 pb-6">
        <div className="grid gap-1.5">
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.14em] text-muted">
            Checkout
          </p>
          <h1
            id="checkout-heading"
            ref={headingRef}
            tabIndex={-1}
            className="text-[clamp(1.5rem,3vw,2.125rem)] leading-[1.15] tracking-[-0.025em] text-ink"
          >
            Checkout
          </h1>
          <p className="max-w-prose text-muted">
            Review and edit your current Cart here. Quantities, subtotals, and totals come from
            the server and update with every change.
          </p>
        </div>
        {isPending ? <StatusMessage tone="pending">Updating Cart...</StatusMessage> : null}
        {error !== null ? (
          <div className="grid gap-3">
            <StatusMessage tone="error">{error}</StatusMessage>
            <Button onClick={onRetry} disabled={isPending}>
              Reload Cart
            </Button>
          </div>
        ) : null}
        {cart.items.length === 0 ? (
          <div className="grid gap-2 rounded-lg bg-surface-muted px-4 py-5">
            <h2
              id="checkout-empty-heading"
              ref={emptyStateRef}
              tabIndex={-1}
              className="font-bold text-ink"
            >
              Your Cart is empty.
            </h2>
            <p className="text-sm text-muted">
              Add a Product from the Market to continue to Checkout.
            </p>
          </div>
        ) : (
          <>
            <h2 id="checkout-items-heading" className="text-lg leading-[1.15] text-ink">
              Items
            </h2>
            <ul
              ref={listRef}
              className="grid list-none gap-3 p-0 m-0"
              aria-labelledby="checkout-items-heading"
            >
              {cart.items.map((item) => (
                <CartItemRow
                  key={item.productId}
                  item={item}
                  isPending={isPending}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                />
              ))}
            </ul>
            <dl className="flex items-baseline justify-between gap-4 rounded-lg bg-surface-muted px-4 py-3.5">
              <dt className="text-sm font-bold uppercase tracking-[0.12em] text-muted">Total</dt>
              <dd className="m-0 text-2xl font-extrabold tracking-[-0.02em] text-ink">
                {formatAmount(cart.total)}
              </dd>
            </dl>
          </>
        )}
      </div>
    </section>
  );
}

function focusItemRow(list: HTMLUListElement | null, productId: string) {
  list?.querySelector<HTMLElement>(`[data-cart-item="${productId}"]`)?.focus();
}

function focusItemQuantity(list: HTMLUListElement | null, productId: string) {
  list
    ?.querySelector<HTMLElement>(`[data-cart-item="${productId}"]`)
    ?.querySelector<HTMLInputElement>('input[type="number"]')
    ?.focus();
}

function focusAdjacentItem(list: HTMLUListElement | null, order: string[], removedProductId: string) {
  const index = order.indexOf(removedProductId);
  const adjacentProductId = order[index + 1] ?? order[index - 1];

  if (adjacentProductId !== undefined) {
    focusItemQuantity(list, adjacentProductId);
  }
}

function isDisabledControl(element: HTMLElement): boolean {
  return (
    (element instanceof HTMLButtonElement ||
      element instanceof HTMLInputElement ||
      element instanceof HTMLSelectElement ||
      element instanceof HTMLTextAreaElement) &&
    element.disabled
  );
}
