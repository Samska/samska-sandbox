import type { Ref } from "react";
import type { CartResponse } from "./cartApi";
import CartItemRow from "./CartItemRow";
import { formatAmount } from "../formatAmount";
import Button from "../ui/Button";
import StatusMessage from "../ui/StatusMessage";

export default function CartPanel({
  cart,
  isPending,
  error,
  onRetry,
  onUpdateQuantity,
  onRemoveItem,
  headingRef,
  onClose,
  onCheckout
}: {
  cart: CartResponse | null;
  isPending: boolean;
  error: string | null;
  onRetry: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => Promise<void>;
  onRemoveItem: (productId: string) => Promise<void>;
  headingRef?: Ref<HTMLHeadingElement>;
  onClose?: () => void;
  onCheckout?: () => void;
}) {
  const itemCount = cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;

  return (
    <section
      id="cart"
      className="grid gap-4"
      aria-labelledby="cart-heading"
      aria-busy={isPending}
    >
      <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <h2
          id="cart-heading"
          ref={headingRef}
          tabIndex={-1}
          className="text-xl font-extrabold tracking-[-0.02em] text-ink"
        >
          Your Cart
        </h2>
        <div className="flex items-center gap-2">
          {cart !== null ? (
            <span className="rounded-full bg-count-surface px-3 py-1 text-sm font-extrabold text-brand-dark">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          ) : null}
          {onClose === undefined ? null : (
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full border border-border-strong bg-surface text-lg font-extrabold text-ink hover:bg-surface-muted"
              onClick={onClose}
              aria-label="Close Cart"
            >
              &times;
            </button>
          )}
        </div>
      </div>
      {isPending && cart === null ? (
        <StatusMessage tone="neutral">Loading Cart...</StatusMessage>
      ) : null}
      {isPending && cart !== null ? (
        <StatusMessage tone="pending">Updating Cart...</StatusMessage>
      ) : null}
      {error !== null ? (
        <div className="grid gap-3">
          <StatusMessage tone="error">{error}</StatusMessage>
          <Button onClick={onRetry} disabled={isPending}>
            Reload Cart
          </Button>
        </div>
      ) : null}
      {cart !== null && cart.items.length === 0 ? (
        <div className="grid gap-2 rounded-lg bg-surface-muted px-4 py-5">
          <p className="font-bold text-ink">Your Cart is empty.</p>
          <p className="text-sm text-muted">Products you add from the storefront appear here.</p>
        </div>
      ) : null}
      {cart !== null && cart.items.length > 0 ? (
        <>
          <ul className="grid list-none gap-3 p-0 m-0" aria-label="Cart items">
            {cart.items.map((item) => (
              <CartItemRow
                key={item.productId}
                item={item}
                isPending={isPending}
                onUpdateQuantity={onUpdateQuantity}
                onRemoveItem={onRemoveItem}
              />
            ))}
          </ul>
          <dl className="flex items-baseline justify-between gap-4 rounded-lg bg-surface-muted px-4 py-3.5">
            <dt className="text-sm font-bold uppercase tracking-[0.12em] text-muted">Total</dt>
            <dd className="m-0 text-2xl font-extrabold tracking-[-0.02em] text-ink">
              {formatAmount(cart.total)}
            </dd>
          </dl>
          {onCheckout === undefined ? null : (
            <Button className="w-full" onClick={onCheckout} disabled={isPending}>
              Checkout
            </Button>
          )}
        </>
      ) : null}
    </section>
  );
}
