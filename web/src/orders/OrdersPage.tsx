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
        <div className="overflow-x-auto rounded-sm border-[1.5px] border-ink bg-surface">
          <table className="w-full min-w-[34rem] border-collapse text-left">
            <caption className="sr-only">Your orders, newest first</caption>
            <thead>
              <tr className="border-b-[1.5px] border-ink font-mono text-[0.75rem] uppercase tracking-[0.08em]">
                <th scope="col" className="px-4 py-3">Order</th>
                <th scope="col" className="px-4 py-3">Date</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3 text-right">Total</th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Tracking</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {load.orders.map((order) => (
                <tr key={order.orderId} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3 font-mono font-semibold">{order.reference}</td>
                  <td className="px-4 py-3">{formatWhen(order.createdAt)}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{formatAmount(order.total)}</td>
                  <td className="px-4 py-3 text-right">
                    <a
                      className="inline-flex min-h-10 items-center rounded-sm border-[1.5px] border-ink px-3 font-mono text-[0.75rem] font-semibold uppercase tracking-[0.06em] no-underline hover:bg-ink hover:text-canvas"
                      href={`${ordersPath}/${encodeURIComponent(order.orderId)}`}
                      aria-label={`Track order ${order.reference}`}
                    >
                      Track
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
