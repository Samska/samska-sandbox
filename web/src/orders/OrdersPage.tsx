import { useEffect, useRef, useState } from "react";
import { formatAmount } from "../formatAmount";
import StatusMessage from "../ui/StatusMessage";
import { listOrders, type OrderHistoryEntry } from "./ordersApi";
import { formatWhen } from "./shipmentText";
import StatusPill from "./StatusPill";

export const ordersPath = "/orders";

type Load = { state: "loading" } | { state: "error" } | { state: "ready"; orders: OrderHistoryEntry[] };

export default function OrdersPage() {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let active = true;
    listOrders().then(
      (orders) => active && setLoad({ state: "ready", orders }),
      () => active && setLoad({ state: "error" })
    );
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section className="grid gap-5">
      <div>
        <p className="font-mono text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-muted">Account</p>
        <h1 ref={headingRef} tabIndex={-1} className="text-[clamp(2rem,5vw,3.25rem)] font-black uppercase leading-none">
          Your orders
        </h1>
      </div>
      {load.state === "loading" ? <StatusMessage tone="pending">Loading your orders...</StatusMessage> : null}
      {load.state === "error" ? (
        <StatusMessage tone="error">Your orders could not be loaded. Reload the page to try again.</StatusMessage>
      ) : null}
      {load.state === "ready" && load.orders.length === 0 ? (
        <div className="grid justify-items-start gap-3 rounded-sm border-[1.5px] border-dashed border-ink px-5 py-8">
          <h2 className="text-2xl font-black uppercase">No orders yet</h2>
          <p className="text-muted">Orders you place appear here.</p>
          <a className="font-bold underline" href="/">
            Browse catalog
          </a>
        </div>
      ) : null}
      {load.state === "ready" && load.orders.length > 0 ? (
        <>
          <div
            aria-hidden="true"
            className="hidden grid-cols-[minmax(9rem,1.1fr)_1.4fr_11rem_7rem_5.5rem] gap-3 px-4 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-muted min-[48rem]:grid"
          >
            <span>Order</span>
            <span>Placed</span>
            <span>Status</span>
            <span className="text-right">Total</span>
            <span />
          </div>
          <ul aria-label="Your orders, newest first" className="m-0 grid list-none gap-2.5 p-0">
            {load.orders.map((order) => (
              <li
                key={order.orderId}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 rounded-sm border-[1.5px] border-ink bg-surface p-3.5 min-[48rem]:grid-cols-[minmax(9rem,1.1fr)_1.4fr_11rem_7rem_5.5rem] min-[48rem]:gap-3 min-[48rem]:py-2.5"
              >
                <span className="font-mono text-[1.05rem] font-semibold">{order.orderNumber}</span>
                <span className="text-right font-mono text-[1.05rem] font-semibold min-[48rem]:order-4">
                  {formatAmount(order.total)}
                </span>
                <span className="font-mono text-[0.75rem] text-muted min-[48rem]:order-2">
                  {formatWhen(order.createdAt)} · {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                </span>
                <span className="col-span-2 flex items-center justify-between gap-3 border-t-[1.5px] border-dashed border-border pt-2.5 min-[48rem]:contents">
                  <span className="min-[48rem]:order-3">
                    <StatusPill status={order.status} />
                  </span>
                  <a
                    className="inline-flex min-h-10 items-center justify-center rounded-sm border-[1.5px] border-ink bg-surface px-3 font-mono text-[0.75rem] font-semibold uppercase tracking-[0.06em] no-underline hover:bg-ink hover:text-canvas min-[48rem]:order-5"
                    href={`${ordersPath}/${encodeURIComponent(order.orderId)}`}
                    aria-label={`Track order ${order.orderNumber}`}
                  >
                    Track
                  </a>
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
