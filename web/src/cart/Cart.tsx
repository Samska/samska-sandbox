import { useState } from "react";
import type { CartItemResponse, CartResponse } from "./cartApi";

export default function CartPanel({
  cart,
  isPending,
  error,
  onUpdateQuantity,
  onRemoveItem
}: {
  cart: CartResponse | null;
  isPending: boolean;
  error: string | null;
  onUpdateQuantity: (productId: string, quantity: number) => Promise<void>;
  onRemoveItem: (productId: string) => Promise<void>;
}) {
  return (
    <section className="cart-panel" aria-labelledby="cart-heading" aria-busy={isPending}>
      <h2 id="cart-heading">Cart</h2>
      {isPending && cart === null ? <p role="status">Loading Cart...</p> : null}
      {error !== null ? <p role="alert">{error}</p> : null}
      {cart !== null && cart.items.length === 0 ? <p>Your Cart is empty.</p> : null}
      {cart !== null && cart.items.length > 0 ? (
        <>
          <div className="cart-items" role="list" aria-label="Cart items">
            {cart.items.map((item) => (
              <CartItemRow
                key={item.productId}
                item={item}
                isPending={isPending}
                onUpdateQuantity={onUpdateQuantity}
                onRemoveItem={onRemoveItem}
              />
            ))}
          </div>
          <p className="cart-total">
            <strong>Total:</strong> {cart.total}
          </p>
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
    <article className="cart-item" role="listitem">
      <h3>{item.name}</h3>
      <dl>
        <dt>Unit price</dt>
        <dd>{item.unitPrice}</dd>
        <dt>Subtotal</dt>
        <dd>{item.lineSubtotal}</dd>
      </dl>
      <div className="cart-item-actions">
        <label htmlFor={`cart-quantity-${item.productId}`}>Quantity for {item.name}</label>
        <input
          id={`cart-quantity-${item.productId}`}
          type="number"
          min="1"
          step="1"
          inputMode="numeric"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          disabled={isPending}
          aria-invalid={validationError !== null}
          aria-describedby={validationError !== null ? quantityErrorId : undefined}
        />
        <button type="button" onClick={handleUpdate} disabled={isPending}>
          Update quantity
        </button>
        <button type="button" onClick={() => void onRemoveItem(item.productId)} disabled={isPending}>
          Remove {item.name}
        </button>
      </div>
      {validationError !== null ? (
        <p id={quantityErrorId} className="field-error">
          {validationError}
        </p>
      ) : null}
    </article>
  );
}
