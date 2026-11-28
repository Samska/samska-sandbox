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
            Order {ready.orderNumber}
          </p>
          <h1 ref={headingRef} tabIndex={-1} className="text-[clamp(2rem,5vw,3.25rem)] font-black uppercase leading-none">
            {statusHeadline[ready.status]}
          </h1>
        </div>
        <StatusPill status={ready.status} />
      </div>
      <section className="grid max-w-xl content-start gap-4 rounded-sm border-[1.5px] border-ink bg-surface p-5">
        <h2 className="text-2xl font-black uppercase">Progress</h2>
        <ol aria-label="Order history" className="m-0 grid list-none gap-3 p-0">
          {ready.steps.map((step, index) => (
            <li key={`${step.code}-${index}`} className="grid grid-cols-[1.5rem_1fr] items-start gap-2">
              <span
                aria-hidden="true"
                className={`mt-1 h-4 w-4 rounded-full border-2 border-ink ${
                  step.done ? (step.code === "CANCELLED" ? "bg-danger" : "bg-ink") : index === firstOpen ? "bg-brand" : "bg-surface"
                }`}
              />
              <span>
                <strong>{stepLabel[step.code]}</strong>
                {step.at !== null ? (
                  <>
                    <br />
                    <small className="font-mono text-muted">{formatWhen(step.at)}</small>
                  </>
                ) : null}
                <span className="sr-only">{step.done ? " (done)" : " (not yet)"}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="text-sm text-muted">The store updates this when each step happens.</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="sm" onClick={refresh} disabled={checking}>
            {checking ? "Checking..." : "Check again"}
          </Button>
          <a className="inline-flex min-h-10 items-center font-bold underline" href="/orders">
            All orders
          </a>
        </div>
      </section>
    </section>
  );
}
