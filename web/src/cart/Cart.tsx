import { useEffect, useState, type KeyboardEvent, type Ref } from "react";
import type { CartItemResponse, CartResponse } from "./cartApi";
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
  onClose
}: {
  cart: CartResponse | null;
  isPending: boolean;
  error: string | null;
  onRetry: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => Promise<void>;
  onRemoveItem: (productId: string) => Promise<void>;
  headingRef?: Ref<HTMLHeadingElement>;
  onClose?: () => void;
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
        </>
      ) : null}
    </section>
  );
}

function CartItemRow({
  item,
  isPending,
  onUpdateQuantity,
  onRemoveItem
}: {
  item: CartItemResponse;
  isPending: boolean;
  onUpdateQuantity: (productId: string, quantity: number) => Promise<void>;
  onRemoveItem: (productId: string) => Promise<void>;
}) {
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [validationError, setValidationError] = useState<string | null>(null);
  const quantityInputId = `cart-quantity-${item.productId}`;
  const quantityErrorId = `${quantityInputId}-error`;

  useEffect(() => {
    setQuantity(String(item.quantity));
  }, [item.quantity]);

  function commitQuantity(nextQuantity: number) {
    if (!Number.isInteger(nextQuantity) || nextQuantity < 1) {
      setValidationError("Enter a quantity of one or greater.");
      return;
    }

    setValidationError(null);

    if (nextQuantity === item.quantity) {
      setQuantity(String(item.quantity));
      return;
    }

    void onUpdateQuantity(item.productId, nextQuantity);
  }

  function handleQuantityKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitQuantity(Number(quantity));
    }

    if (event.key === "Escape") {
      setValidationError(null);
      setQuantity(String(item.quantity));
    }
  }

  return (
    <li className="grid gap-3 rounded-lg border border-border bg-surface p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-0.5">
          <h3 className="font-bold leading-snug text-ink">{item.name}</h3>
          <p className="text-sm text-muted">{formatAmount(item.unitPrice)} each</p>
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={() => void onRemoveItem(item.productId)}
          disabled={isPending}
          aria-label={`Remove ${item.name}`}
        >
          Remove
        </Button>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="grid gap-1">
          <label className="sr-only" htmlFor={quantityInputId}>
            Quantity for {item.name}
          </label>
          <div className="inline-flex items-center overflow-hidden rounded-md border border-border-strong">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center text-lg font-bold text-brand-dark hover:bg-count-surface"
              onClick={() => commitQuantity(item.quantity - 1)}
              disabled={isPending || item.quantity <= 1}
              aria-label={`Decrease quantity for ${item.name}`}
            >
              &#8722;
            </button>
            <input
              id={quantityInputId}
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              className="h-10 w-12 border-x border-border-strong bg-surface text-center font-bold"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              onBlur={() => commitQuantity(Number(quantity))}
              onKeyDown={handleQuantityKeyDown}
              disabled={isPending}
              aria-invalid={validationError !== null}
              aria-describedby={validationError !== null ? quantityErrorId : undefined}
            />
            <button
              type="button"
              className="grid h-10 w-10 place-items-center text-lg font-bold text-brand-dark hover:bg-count-surface"
              onClick={() => commitQuantity(item.quantity + 1)}
              disabled={isPending}
              aria-label={`Increase quantity for ${item.name}`}
            >
              +
            </button>
          </div>
        </div>
        <div className="grid justify-items-end gap-0.5">
          <span className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-muted">
            Subtotal
          </span>
          <span className="text-base font-extrabold text-ink">
            {formatAmount(item.lineSubtotal)}
          </span>
        </div>
      </div>
      {validationError !== null ? (
        <p id={quantityErrorId} className="font-bold">
          {validationError}
        </p>
      ) : null}
    </li>
  );
}
