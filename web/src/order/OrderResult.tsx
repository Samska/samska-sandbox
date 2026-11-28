import { useEffect, useRef, useState } from "react";
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
    <section
      aria-labelledby="order-result-heading"
      className="mx-auto w-full max-w-[40rem] overflow-hidden rounded-sm border-[1.5px] border-ink bg-surface shadow-card"
    >
      <div className="grid gap-2 px-5 pb-4 pt-5">
        <span className="-rotate-2 justify-self-start rounded-[4px] border-[2.5px] border-success px-2.5 py-0.5 font-black uppercase tracking-[0.08em] text-success [font-stretch:90%]">
          Order placed
        </span>
        <h1 id="order-result-heading" ref={headingRef} tabIndex={-1} className="w-fit font-mono text-[0.75rem] font-medium uppercase tracking-[0.12em] text-muted">
          Order created
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-[clamp(1.7rem,7vw,2.4rem)] font-semibold" aria-label={`Order number ${order.orderNumber}`}>
            {order.orderNumber}
          </p>
          <CopyButton value={order.orderNumber} />
        </div>
      </div>
      <hr className="m-0 border-0 border-t-2 border-dashed border-ink" />
      <div className="grid gap-3 px-5 pb-5 pt-4">
        <h2 className="sr-only">Ordered items</h2>
        <ul className="m-0 grid list-none gap-2 p-0">
          {order.items.map((item) => (
            <li key={item.productId} className="flex min-w-0 flex-wrap justify-between gap-x-4">
              <span>
                {item.name} <span className="font-mono text-sm text-muted">× {item.quantity} · {formatAmount(item.unitPrice)} each</span>
              </span>
              <strong>{formatAmount(item.lineSubtotal)}</strong>
            </li>
          ))}
        </ul>
        <p className="flex justify-between gap-4 border-t-[1.5px] border-ink pt-2.5 text-lg font-bold">
          Order total: {formatAmount(order.total)}
        </p>
        <p className="text-sm text-muted">This is a demo: no real payment was made. Your Cart was emptied.</p>
        <div className="flex flex-wrap items-center gap-3">
          <a
            className="inline-flex min-h-11 items-center justify-center rounded-sm border-[1.5px] border-ink bg-brand px-4 font-mono text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-on-brand no-underline shadow-[0_3px_0_var(--color-ink)]"
            href={`/orders/${encodeURIComponent(order.orderId)}`}
          >
            Track this order
          </a>
          <Button variant="secondary" onClick={onBackToMarket}>Back to Market</Button>
          <Button variant="quiet" onClick={onBackToCheckout}>Back to Checkout</Button>
        </div>
      </div>
    </section>
  );
}

function CopyButton({ value }: { value: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => {
        navigator.clipboard.writeText(value).then(
          () => setState("copied"),
          () => setState("failed")
        );
      }}
    >
      {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : "Copy"}
    </Button>
  );
}
