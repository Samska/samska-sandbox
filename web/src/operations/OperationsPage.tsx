import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Button from "../ui/Button";
import StatusMessage from "../ui/StatusMessage";
import { formatWhen } from "../orders/shipmentText";
import { getOperations, OperationsApiError, type OperationsSnapshot } from "./operationsApi";

export const operationsPath = "/admin/operations";

type Load =
  | { state: "loading" }
  | { state: "error"; forbidden: boolean }
  | { state: "ready"; snapshot: OperationsSnapshot };

const percent = (rate: number | null) => (rate === null ? "No data yet" : `${(rate * 100).toFixed(1)}%`);

export default function OperationsPage() {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [refreshing, setRefreshing] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);

    try {
      setLoad({ state: "ready", snapshot: await getOperations() });
    } catch (error) {
      setLoad({ state: "error", forbidden: error instanceof OperationsApiError && error.forbidden });
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-muted">Operations</p>
          <h1 ref={headingRef} tabIndex={-1} className="text-[clamp(2rem,5vw,3.25rem)] font-black uppercase leading-none">
            Store health
          </h1>
        </div>
        <Button variant="secondary" size="sm" disabled={refreshing} onClick={() => void refresh()}>
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>
      {load.state === "loading" ? <StatusMessage tone="pending">Loading store figures...</StatusMessage> : null}
      {load.state === "error" ? (
        <StatusMessage tone="error">
          {load.forbidden
            ? "Your account cannot read Operations."
            : "Store figures could not be loaded. Try Refresh in a moment."}
        </StatusMessage>
      ) : null}
      {load.state === "ready" ? <Figures snapshot={load.snapshot} /> : null}
    </section>
  );
}

function Figures({ snapshot }: { snapshot: OperationsSnapshot }) {
  const attempts = snapshot.approvedAttempts + snapshot.declinedAttempts + snapshot.failedAttempts;

  return (
    <>
      <p className="text-sm text-muted">
        Figures were read {formatWhen(snapshot.generatedAt)}. Orders and payments come from the database; latency and
        errors are measured by this server process since it started.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Figure label="Orders, last hour" value={String(snapshot.ordersLastHour)}>
          {snapshot.ordersLast24Hours} in the last 24 hours
        </Figure>
        <Figure label="Approval rate, 24 hours" value={percent(snapshot.approvalRate)}>
          {attempts === 0
            ? "No payment attempts in the last 24 hours"
            : `${snapshot.approvedAttempts} approved, ${snapshot.declinedAttempts} declined, ${snapshot.failedAttempts} failed`}
        </Figure>
        <Figure
          label="Checkout latency p95"
          value={snapshot.checkoutP95Millis === null ? "No data yet" : `${Math.round(snapshot.checkoutP95Millis)} ms`}
        >
          {snapshot.checkoutSamples === 0
            ? "No checkout requests since start"
            : `${snapshot.checkoutSamples} Payment attempt requests, about the last 15 minutes`}
        </Figure>
        <Figure label="Server error rate" value={percent(snapshot.errorRate)}>
          {snapshot.requests === 0
            ? "No requests since start"
            : `${snapshot.serverErrors} of ${snapshot.requests} requests ended in a 5xx status`}
        </Figure>
      </div>
      <div className="overflow-x-auto rounded-sm border-[1.5px] border-ink bg-surface">
        <table className="w-full min-w-[22rem] border-collapse text-left">
          <caption className="sr-only">Service health</caption>
          <thead>
            <tr className="border-b-[1.5px] border-ink font-mono text-[0.75rem] uppercase tracking-[0.08em]">
              <th scope="col" className="px-4 py-3">Service</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3 text-right">Latency</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.services.map((service) => (
              <tr key={service.name} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3 font-bold">{service.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full border-[1.5px] px-2.5 py-0.5 font-mono text-[0.75rem] font-semibold uppercase tracking-[0.06em] ${
                      service.healthy ? "border-success-border bg-success-surface text-success" : "border-danger bg-surface text-danger"
                    }`}
                  >
                    {service.healthy ? "Healthy" : "Down"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono">{service.latencyMillis} ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Figure({ label, value, children }: { label: string; value: string; children: ReactNode }) {
  return (
    <div className="grid content-start gap-1 rounded-sm border-[1.5px] border-ink bg-surface p-4">
      <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted">{label}</p>
      <p className="text-3xl font-black">{value}</p>
      <p className="text-sm text-muted">{children}</p>
    </div>
  );
}
