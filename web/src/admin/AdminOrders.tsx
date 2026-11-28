import { useCallback, useEffect, useRef, useState } from "react";
import { formatAmount } from "../formatAmount";
import { AdminOrdersError, changeOrderStatus, listAdminOrders, type AdminOrder } from "../orders/adminOrdersApi";
import { shipmentStatuses, type ShipmentStatus } from "../orders/ordersApi";
import { formatWhen, statusLabel } from "../orders/shipmentText";
import StatusPill from "../orders/StatusPill";
import Button from "../ui/Button";
import StatusMessage from "../ui/StatusMessage";

export const adminOrdersPath = "/admin/orders";

type Load = { state: "loading" } | { state: "error"; forbidden: boolean } | { state: "ready"; orders: AdminOrder[] };
type Filter = ShipmentStatus | "ALL";
type Notice = { tone: "success" | "error"; text: string } | null;

export default function AdminOrders() {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [filter, setFilter] = useState<Filter>("ALL");
  const [notice, setNotice] = useState<Notice>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const refresh = useCallback(async () => {
    try {
      setLoad({ state: "ready", orders: await listAdminOrders() });
    } catch (error) {
      setLoad({ state: "error", forbidden: error instanceof AdminOrdersError && error.kind === "forbidden" });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const replace = (updated: AdminOrder) =>
    setLoad((current) =>
      current.state === "ready"
        ? { state: "ready", orders: current.orders.map((order) => (order.orderId === updated.orderId ? updated : order)) }
        : current
    );

  const orders = load.state === "ready" ? load.orders : [];
  const shown = filter === "ALL" ? orders : orders.filter((order) => order.status === filter);

  return (
    <section className="grid gap-5">
      <div>
        <p className="font-mono text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-muted">Admin</p>
        <h1 ref={headingRef} tabIndex={-1} className="text-[clamp(2rem,5vw,3.25rem)] font-black uppercase leading-none">
          Orders
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Every order in the store. Change the status when you pack, ship or deliver; the customer sees it on their
          tracking page.
        </p>
      </div>
      {load.state === "loading" ? <StatusMessage tone="pending">Loading orders...</StatusMessage> : null}
      {load.state === "error" ? (
        <StatusMessage tone="error">
          {load.forbidden ? "Your account cannot manage orders." : "Orders could not be loaded. Reload the page to try again."}
        </StatusMessage>
      ) : null}
      {notice !== null ? <StatusMessage tone={notice.tone}>{notice.text}</StatusMessage> : null}
      {load.state === "ready" ? (
        <>
          <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
            {(["ALL", ...shipmentStatuses] as Filter[]).map((value) => {
              const count = value === "ALL" ? orders.length : orders.filter((order) => order.status === value).length;

              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                  className="min-h-10 rounded-full border-[1.5px] border-ink px-3 font-mono text-[0.72rem] uppercase tracking-[0.06em] aria-pressed:bg-ink aria-pressed:text-canvas"
                >
                  {value === "ALL" ? "All" : statusLabel[value]} · {count}
                </button>
              );
            })}
          </div>
          {shown.length === 0 ? (
            <div className="rounded-sm border-[1.5px] border-dashed border-ink px-5 py-8">
              <h2 className="text-2xl font-black uppercase">{orders.length === 0 ? "No orders yet" : "No orders in this status"}</h2>
            </div>
          ) : (
            <ul aria-label="Orders, newest first" className="m-0 grid list-none gap-2.5 p-0">
              {shown.map((order) => (
                <OrderRow key={order.orderId} order={order} onChanged={replace} onNotice={setNotice} />
              ))}
            </ul>
          )}
        </>
      ) : null}
    </section>
  );
}

function OrderRow({
  order,
  onChanged,
  onNotice
}: {
  order: AdminOrder;
  onChanged: (order: AdminOrder) => void;
  onNotice: (notice: Notice) => void;
}) {
  const [selected, setSelected] = useState<ShipmentStatus>(order.status);
  const [working, setWorking] = useState(false);
  const final = order.status === "CANCELLED";
  const selectId = `status-${order.orderId}`;

  useEffect(() => {
    setSelected(order.status);
  }, [order.status]);

  const update = async () => {
    setWorking(true);
    onNotice(null);

    try {
      const updated = await changeOrderStatus(order.orderId, selected);
      onChanged(updated);
      onNotice({ tone: "success", text: `Order ${order.orderNumber} is now ${statusLabel[updated.status]}.` });
    } catch (error) {
      setSelected(order.status);
      onNotice({
        tone: "error",
        text:
          error instanceof AdminOrdersError && error.kind === "final"
            ? `Order ${order.orderNumber} cannot change status any more.`
            : `Order ${order.orderNumber} could not be updated. Try again.`
      });
    } finally {
      setWorking(false);
    }
  };

  return (
    <li className="grid gap-3 rounded-sm border-[1.5px] border-ink bg-surface p-3.5 min-[48rem]:grid-cols-[9rem_1fr_6rem_7rem_16rem] min-[48rem]:items-center">
      <div>
        <p className="m-0 font-mono text-[1.05rem] font-semibold">{order.orderNumber}</p>
        <p className="m-0 font-mono text-[0.75rem] text-muted">{formatWhen(order.createdAt)}</p>
      </div>
      <p className="m-0 text-sm">
        {order.lines.map((line) => `${line.name} × ${line.quantity}`).join(", ")}
        <br />
        <span className="font-mono text-[0.75rem] text-muted">{order.customerEmail}</span>
      </p>
      <span className="font-mono text-[1.05rem] font-semibold min-[48rem]:text-right">{formatAmount(order.total)}</span>
      <span>
        <StatusPill status={order.status} />
      </span>
      <div className="grid gap-1">
        <label htmlFor={selectId} className="font-mono text-[0.7rem] uppercase tracking-[0.08em] text-muted">
          Status
        </label>
        <div className="flex gap-2">
          <select
            id={selectId}
            value={selected}
            disabled={final || working}
            onChange={(event) => setSelected(event.target.value as ShipmentStatus)}
            className="min-h-10 min-w-0 flex-1 rounded-sm border-[1.5px] border-ink bg-surface px-2"
          >
            {shipmentStatuses.map((value) => (
              <option key={value} value={value}>
                {statusLabel[value]}
              </option>
            ))}
          </select>
          <Button
            variant="primary"
            size="sm"
            aria-label={`Update order ${order.orderNumber}`}
            disabled={final || working || selected === order.status}
            onClick={() => void update()}
          >
            {working ? "Saving..." : "Update"}
          </Button>
        </div>
        {selected === "CANCELLED" && !final ? (
          <p className="m-0 text-[0.75rem] text-danger">Cancelling is final and returns the stock.</p>
        ) : null}
      </div>
    </li>
  );
}
