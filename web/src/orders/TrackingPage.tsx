import { useCallback, useEffect, useRef, useState } from "react";
import Button from "../ui/Button";
import StatusMessage from "../ui/StatusMessage";
import { getShipment, OrdersApiError, type Shipment } from "./ordersApi";
import { formatWhen, statusHeadline, stepLabel } from "./shipmentText";
import StatusPill from "./StatusPill";

type Load =
  | { state: "loading" }
  | { state: "missing" }
  | { state: "error" }
  | { state: "ready"; shipment: Shipment };

export default function TrackingPage({ orderId }: { orderId: string }) {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [checking, setChecking] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const refresh = useCallback(() => {
    let active = true;
    setChecking(true);
    getShipment(orderId)
      .then(
        (shipment) => active && setLoad({ state: "ready", shipment }),
        (error: unknown) =>
          active && setLoad({ state: error instanceof OrdersApiError && error.kind === "not-found" ? "missing" : "error" })
      )
      .finally(() => active && setChecking(false));
    return () => {
      active = false;
    };
  }, [orderId]);

  useEffect(() => refresh(), [refresh]);

  const ready = load.state === "ready" ? load.shipment : null;

  useEffect(() => {
    if (load.state !== "loading") {
      headingRef.current?.focus();
    }
  }, [load.state]);

  if (load.state === "loading") {
    return <StatusMessage tone="pending">Loading tracking...</StatusMessage>;
  }

  if (load.state === "missing") {
    return (
      <section className="grid gap-3">
        <h1 ref={headingRef} tabIndex={-1} className="text-4xl font-black uppercase">
          Order not found
        </h1>
        <p>This order does not exist for your account.</p>
        <a className="font-bold underline" href="/orders">
          Back to your orders
        </a>
      </section>
    );
  }

  if (ready === null) {
    return (
      <section className="grid gap-3">
        <h1 ref={headingRef} tabIndex={-1} className="text-4xl font-black uppercase">
          Tracking unavailable
        </h1>
        <StatusMessage tone="error">Tracking could not be loaded.</StatusMessage>
        <div>
          <Button onClick={refresh}>Try again</Button>
        </div>
      </section>
    );
  }

  const firstOpen = ready.steps.findIndex((step) => !step.done);

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-muted">
            Order {ready.reference}
          </p>
          <h1 ref={headingRef} tabIndex={-1} className="text-[clamp(2rem,5vw,3.25rem)] font-black uppercase leading-none">
            {statusHeadline[ready.status]}
          </h1>
        </div>
        <StatusPill status={ready.status} />
      </div>
      <p className="font-mono text-[0.75rem] uppercase tracking-[0.08em] text-muted">
        Couriers and notifications are simulated. No real parcel exists.
      </p>
      <div className="grid gap-5 md:grid-cols-[1.25fr_1fr]">
        <div className="grid content-start gap-4 rounded-sm border-[1.5px] border-ink bg-surface p-5">
          <h2 className="text-2xl font-black uppercase">Route</h2>
          <RouteMap done={ready.steps.filter((step) => step.done).length} total={ready.steps.length} />
          {ready.status === "DELAYED" ? (
            <p role="status" className="rounded-sm border-[1.5px] border-danger px-4 py-3 font-bold text-danger">
              The courier reports a delay. New estimate: {formatWhen(ready.estimatedDelivery)}.
            </p>
          ) : (
            <p className="rounded-sm border-[1.5px] border-ink px-4 py-3">
              Courier: {ready.courier} · Tracking {ready.trackingCode}
              {ready.status !== "DELIVERED" ? ` · Estimate ${formatWhen(ready.estimatedDelivery)}` : ""}
            </p>
          )}
        </div>
        <aside className="grid content-start gap-4 rounded-sm border-[1.5px] border-ink bg-surface p-5">
          <h2 className="text-2xl font-black uppercase">Progress</h2>
          <ol className="grid gap-3">
            {ready.steps.map((step, index) => (
              <li key={step.code} className="grid grid-cols-[1.5rem_1fr] items-start gap-2">
                <span
                  aria-hidden="true"
                  className={`mt-1 h-4 w-4 rounded-full border-2 border-ink ${
                    step.done ? "bg-ink" : index === firstOpen ? "bg-brand" : "bg-surface"
                  }`}
                />
                <span>
                  <strong>{stepLabel[step.code]}</strong>
                  <br />
                  <small className="font-mono text-muted">
                    {step.done ? formatWhen(step.at) : `est. ${formatWhen(step.at)}`}
                    <span className="sr-only">{step.done ? " (done)" : " (not yet)"}</span>
                  </small>
                </span>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" onClick={refresh} disabled={checking}>
              {checking ? "Checking..." : "Check again"}
            </Button>
            <a className="inline-flex min-h-10 items-center font-bold underline" href="/orders">
              All orders
            </a>
          </div>
        </aside>
      </div>
    </section>
  );
}

function RouteMap({ done, total }: { done: number; total: number }) {
  // A simple curve from the warehouse to the customer; the marker moves with the completed steps.
  const progress = Math.min(1, Math.max(0, (done - 1) / (total - 1)));
  const x = 30 + progress * 342;
  const y = 100 - progress * 40;

  return (
    <svg viewBox="0 0 400 140" role="img" aria-label="Delivery route from warehouse to destination" className="w-full">
      <path d="M30 100C100 20 160 120 220 70S340 40 372 60" fill="none" stroke="var(--color-border)" strokeWidth="4" strokeDasharray="2 8" strokeLinecap="round" />
      <circle cx="30" cy="100" r="9" fill="var(--color-ink)" />
      <circle cx="372" cy="60" r="9" fill="var(--color-surface)" stroke="var(--color-ink)" strokeWidth="3" />
      <circle cx={x} cy={y} r="11" fill="var(--color-brand)" stroke="var(--color-ink)" strokeWidth="3" />
      <text x="30" y="125" fontFamily="IBM Plex Mono, monospace" fontSize="11" fill="var(--color-ink)">WAREHOUSE</text>
      <text x="320" y="42" fontFamily="IBM Plex Mono, monospace" fontSize="11" fill="var(--color-ink)">YOU</text>
    </svg>
  );
}
