import { useEffect, useRef } from "react";
import type { PaymentAttemptResponse } from "./paymentApi";
import { formatAmount } from "../formatAmount";
import Button from "../ui/Button";
import StatusMessage from "../ui/StatusMessage";

export default function PaymentResult({
  attempt,
  onBackToCheckout,
  onBackToMarket,
  onCreateOrder,
  onViewOrder,
  onCheckOrder,
  orderPending = false,
  orderError = null,
  orderUnconfirmed = false,
  orderRetryReady = false,
  orderBlocked = false
}: {
  attempt: PaymentAttemptResponse;
  onBackToCheckout: () => void;
  onBackToMarket?: () => void;
  onCreateOrder?: () => void;
  onViewOrder?: () => void;
  onCheckOrder?: () => void;
  orderPending?: boolean;
  orderError?: string | null;
  orderUnconfirmed?: boolean;
  orderRetryReady?: boolean;
  orderBlocked?: boolean;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const isApproved = attempt.status === "approved";
  const heading =
    attempt.status === "approved"
      ? "Payment approved"
      : attempt.status === "declined"
        ? "Payment declined"
        : "Payment could not complete";

  return (
    <section
      id="payment-result"
      className="grid min-w-0 gap-5 overflow-hidden rounded-sm border-[1.5px] border-ink bg-surface shadow-card"
      aria-labelledby="payment-result-heading"
    >
      <div className="grid gap-5 px-5 py-6">
        <div className="grid gap-1.5">
          <p className="font-mono text-[0.75rem] font-medium uppercase tracking-[0.14em] text-muted">
            Payment result
          </p>
          <h1
            id="payment-result-heading"
            ref={headingRef}
            tabIndex={-1}
            className="text-[clamp(1.5rem,3vw,2.125rem)] leading-[1.15] tracking-[-0.025em] text-ink"
          >
            {heading}
          </h1>
          {isApproved ? (
            <p className="max-w-prose text-muted">
              This is a demo: no real payment was made. {onViewOrder ? "You already have an Order for this payment." :
                orderRetryReady ? "No Order was found for this payment. You can try creating it again." :
                  orderUnconfirmed ? "We couldn't confirm the Order. Check the result before trying again." : "Create your Order to finish."}
            </p>
          ) : (
            <p className="max-w-prose text-muted">
              No payment was made. You can try again with your current Cart.
            </p>
          )}
        </div>
        <h2 id="payment-result-items-heading" className="text-lg leading-[1.15] text-ink">
          Captured items
        </h2>
        <ul
          className="grid list-none gap-3 p-0 m-0"
          aria-labelledby="payment-result-items-heading"
        >
          {attempt.items.map((item) => (
            <li
              key={item.productId}
              className="flex items-center justify-between gap-4 rounded-sm border-[1.5px] border-ink bg-surface-muted px-4 py-3"
            >
              <div className="grid gap-0.5">
                <span className="font-bold text-ink">
                  {item.name} &times; {item.quantity}
                </span>
                <span className="text-sm text-muted">{formatAmount(item.unitPrice)} each</span>
              </div>
              <span className="text-base font-extrabold text-ink">
                {formatAmount(item.lineSubtotal)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="flex items-baseline justify-between gap-4 rounded-sm bg-surface-muted px-4 py-3.5">
          <dt className="text-sm font-bold uppercase tracking-[0.12em] text-muted">Total</dt>
          <dd className="m-0 text-2xl font-extrabold tracking-[-0.02em] text-ink">
            {formatAmount(attempt.total)}
          </dd>
        </dl>
        {isApproved && onViewOrder ? <Button onClick={onViewOrder}>View saved Order</Button> : null}
        {isApproved && onCreateOrder && !onViewOrder ? (
          <div className="grid gap-3 rounded-sm border-[1.5px] border-ink px-4 py-4" aria-busy={orderPending}>
            <h2 className="text-lg text-ink">Create an Order</h2>
            <p className="text-sm text-muted">Creating the Order saves these items and the total. Your Cart is emptied once the Order is created.</p>
            {orderPending ? <StatusMessage tone="pending">Checking Order...</StatusMessage> : null}
            {orderError ? <StatusMessage tone="error">{orderError}</StatusMessage> : null}
            {orderUnconfirmed && !orderRetryReady && onCheckOrder ? (
              <Button disabled={orderPending} onClick={onCheckOrder}>Check Order result</Button>
            ) : null}
            <Button disabled={orderPending || orderBlocked || (orderUnconfirmed && !orderRetryReady)} onClick={onCreateOrder}>
              {orderRetryReady ? "Try creating the Order again" : "Create Order"}
            </Button>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          {isApproved ? null : (
            <Button onClick={onBackToCheckout}>Try again with the current Cart</Button>
          )}
          <Button variant={isApproved ? "primary" : "quiet"} onClick={onBackToCheckout} disabled={orderPending || orderUnconfirmed}>
            Back to Checkout
          </Button>
          {onBackToMarket ? <Button variant="quiet" onClick={onBackToMarket} disabled={orderPending}>Back to Market</Button> : null}
        </div>
      </div>
    </section>
  );
}
