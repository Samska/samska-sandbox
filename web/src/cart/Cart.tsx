import { useEffect, useState } from "react";
import type { CartItemResponse, CartResponse } from "./cartApi";
import { formatAmount } from "../formatAmount";

export default function CartPanel({
  cart,
  isPending,
  error,
  onRetry,
  onUpdateQuantity,
  onRemoveItem
}: {
  cart: CartResponse | null;
  isPending: boolean;
  error: string | null;
  onRetry: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => Promise<void>;
  onRemoveItem: (productId: string) => Promise<void>;
}) {
  return (
    <section
      id="cart"
      className="grid gap-5 self-start rounded-lg border border-border-strong bg-cart-surface p-5 shadow-card sticky top-5 max-[58rem]:static"
      aria-labelledby="cart-heading"
      aria-busy={isPending}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-2">
          <h2 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.15] text-ink">Your Cart</h2>
        </div>
        {cart !== null ? (
          <span className="rounded-full bg-count-surface px-2.5 py-1.5 text-[0.8125rem] font-extrabold text-brand-dark">
            {cart.items.length} items
          </span>
        ) : null}
      </div>
      {isPending && cart === null ? <p role="status">Loading Cart...</p> : null}
      {isPending && cart !== null ? (
        <p className="rounded-sm bg-pending-surface px-3 py-2.5" role="status">
          Updating Cart...
        </p>
      ) : null}
      {error !== null ? (
        <div className="grid gap-3">
          <p role="alert">{error}</p>
          <button
            type="button"
            className="min-h-11 w-fit rounded-sm border border-brand bg-brand px-4 py-2.5 font-bold text-white hover:bg-brand-dark hover:border-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onRetry}
            disabled={isPending}
          >
            Reload Cart
          </button>
        </div>
      ) : null}
      {cart !== null && cart.items.length === 0 ? (
        <div className="grid gap-3">
          <p>Your Cart is empty.</p>
        </div>
      ) : null}
      {cart !== null && cart.items.length > 0 ? (
        <>
          <ul className="grid list-none gap-4 p-0 m-0" aria-label="Cart items">
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
          <dl className="flex items-baseline justify-between gap-4 border-t-2 border-ink pt-4">
            <dt className="text-xl font-extrabold text-ink">Total</dt>
            <dd className="m-0 text-xl font-extrabold text-ink">{formatAmount(cart.total)}</dd>
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
  const quantityErrorId = `cart-quantity-error-${item.productId}`;

  useEffect(() => {
    setQuantity(String(item.quantity));
  }, [item.quantity]);

  function handleUpdate() {
    const numericQuantity = Number(quantity);

    if (quantity.trim().length === 0 || !Number.isInteger(numericQuantity) || numericQuantity < 1) {
      setValidationError("Enter a quantity of one or greater.");
      return;
    }

    setValidationError(null);
    void onUpdateQuantity(item.productId, numericQuantity);
  }

  return (
    <li className="grid gap-4 border-b border-border pb-4 last:border-b-0 last:pb-0">
      <h3 className="text-lg leading-[1.15] text-ink">{item.name}</h3>
      <dl className="grid gap-2">
        <div className="flex justify-between gap-4">
          <dt className="text-sm text-muted">Unit price</dt>
          <dd className="m-0 font-bold">{formatAmount(item.unitPrice)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-sm text-muted">Subtotal</dt>
          <dd className="m-0 font-bold">{formatAmount(item.lineSubtotal)}</dd>
        </div>
      </dl>
      <div className="grid gap-2.5">
        <div className="grid gap-2.5">
          <label className="text-[0.9375rem] font-bold text-ink" htmlFor={`cart-quantity-${item.productId}`}>
            Quantity for {item.name}
          </label>
          <input
            id={`cart-quantity-${item.productId}`}
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            className="min-h-11 w-full max-w-32 rounded-sm border border-border-strong bg-surface px-3 py-2.5"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            disabled={isPending}
            aria-invalid={validationError !== null}
            aria-describedby={validationError !== null ? quantityErrorId : undefined}
          />
        </div>
        <button
          type="button"
          className="min-h-11 w-fit rounded-sm border border-brand bg-brand px-4 py-2.5 font-bold text-white hover:bg-brand-dark hover:border-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleUpdate}
          disabled={isPending}
        >
          Update quantity
        </button>
        <button
          type="button"
          className="min-h-11 w-fit rounded-sm border border-border-strong bg-transparent px-4 py-2.5 font-bold text-danger hover:bg-danger hover:border-danger hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => void onRemoveItem(item.productId)}
          disabled={isPending}
        >
          Remove {item.name}
        </button>
      </div>
      {validationError !== null ? (
        <p id={quantityErrorId} className="font-bold">
          {validationError}
        </p>
      ) : null}
    </li>
  );
}
