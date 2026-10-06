import { useEffect, useRef } from "react";
import { formatAmount } from "../formatAmount";
import Button from "../ui/Button";
import type { OrderResponse } from "./orderApi";

export default function OrderResult({ order, onBackToMarket, onBackToCheckout }: {
  order: OrderResponse;
  onBackToMarket: () => void;
  onBackToCheckout: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, []);

  return (
    <section aria-labelledby="order-result-heading" className="grid gap-5 rounded-lg border border-border bg-surface px-5 py-6 shadow-card">
      <h1 id="order-result-heading" ref={headingRef} tabIndex={-1} className="text-2xl font-bold text-ink">
        Order created
      </h1>
      <p className="text-muted">Order ID: <span className="break-all font-bold text-ink">{order.orderId}</span></p>
      <p className="text-muted">This Order records the approved simulated payment snapshot. No real payment was made. Your live Cart was not cleared and may have changed.</p>
      <h2 className="text-lg text-ink">Ordered items</h2>
      <ul className="grid gap-3">
        {order.items.map((item) => (
          <li key={item.productId} className="flex min-w-0 flex-wrap justify-between gap-4 rounded-lg bg-surface-muted px-4 py-3">
            <span>{item.name} × {item.quantity} · {formatAmount(item.unitPrice)} each</span>
            <strong>{formatAmount(item.lineSubtotal)}</strong>
          </li>
        ))}
      </ul>
      <p className="text-lg font-bold">Order total: {formatAmount(order.total)}</p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={onBackToMarket}>Back to Market</Button>
        <Button variant="quiet" onClick={onBackToCheckout}>Back to Checkout</Button>
      </div>
    </section>
  );
}
