import { useEffect, useRef } from "react";
import type { PaymentAttemptResponse } from "./paymentApi";
import { formatAmount } from "../formatAmount";
import Button from "../ui/Button";

export default function PaymentResult({
  attempt,
  onBackToCheckout
}: {
  attempt: PaymentAttemptResponse;
  onBackToCheckout: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const isApproved = attempt.status === "approved";
  const heading =
    attempt.status === "approved"
      ? "Simulated payment approved"
      : attempt.status === "declined"
        ? "Simulated payment declined"
        : "Simulated payment could not complete";

  return (
    <section
      id="payment-result"
      className="grid min-w-0 gap-5 overflow-hidden rounded-lg border border-border bg-surface shadow-card"
      aria-labelledby="payment-result-heading"
    >
      <div className="grid gap-5 px-5 py-6">
        <div className="grid gap-1.5">
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.14em] text-muted">
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
              A simulated decision was recorded for the captured Cart revision below. No real
              payment was made. No Order has been created.
            </p>
          ) : (
            <p className="max-w-prose text-muted">
              No payment was made for this attempt. You can try again with the current Cart.
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
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface-muted px-4 py-3"
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
        <dl className="flex items-baseline justify-between gap-4 rounded-lg bg-surface-muted px-4 py-3.5">
          <dt className="text-sm font-bold uppercase tracking-[0.12em] text-muted">Captured total</dt>
          <dd className="m-0 text-2xl font-extrabold tracking-[-0.02em] text-ink">
            {formatAmount(attempt.total)}
          </dd>
        </dl>
        <div className="flex flex-wrap items-center gap-3">
          {isApproved ? null : (
            <Button onClick={onBackToCheckout}>Try again with the current Cart</Button>
          )}
          <Button variant={isApproved ? "primary" : "quiet"} onClick={onBackToCheckout}>
            Back to Checkout
          </Button>
        </div>
      </div>
    </section>
  );
}
