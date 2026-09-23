import { useEffect, useState, type KeyboardEvent } from "react";
import type { CartItemResponse } from "./cartApi";
import { formatAmount } from "../formatAmount";
import Button from "../ui/Button";

export default function CartItemRow({
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
    <li
      data-cart-item={item.productId}
      tabIndex={-1}
      className="grid gap-3 rounded-lg border border-border bg-surface p-3.5"
    >
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
