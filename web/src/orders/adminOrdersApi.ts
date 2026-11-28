import { apiFetch } from "../http";
import { shipmentStatuses, type ShipmentStatus } from "./ordersApi";

export interface AdminOrderLine {
  name: string;
  quantity: number;
}

export interface AdminOrder {
  orderId: string;
  orderNumber: string;
  createdAt: string;
  customerEmail: string;
  total: number;
  status: ShipmentStatus;
  lines: AdminOrderLine[];
}

export type AdminOrdersErrorKind = "forbidden" | "not-found" | "final" | "network" | "server";

export class AdminOrdersError extends Error {
  readonly kind: AdminOrdersErrorKind;

  constructor(kind: AdminOrdersErrorKind) {
    super(kind);
    this.kind = kind;
  }
}

export async function listAdminOrders(): Promise<AdminOrder[]> {
  const payload = await send("/api/admin/orders");

  if (!Array.isArray(payload) || !payload.every(isAdminOrder)) {
    throw new AdminOrdersError("server");
  }

  return payload;
}

export async function changeOrderStatus(orderId: string, status: ShipmentStatus): Promise<AdminOrder> {
  const payload = await send(`/api/admin/orders/${encodeURIComponent(orderId)}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });

  if (!isAdminOrder(payload)) {
    throw new AdminOrdersError("server");
  }

  return payload;
}

async function send(path: string, init?: RequestInit): Promise<unknown> {
  let response: Response;

  try {
    response = await apiFetch(path, init);
  } catch {
    throw new AdminOrdersError("network");
  }

  if (response.status === 403) throw new AdminOrdersError("forbidden");
  if (response.status === 404) throw new AdminOrdersError("not-found");
  if (response.status === 409) throw new AdminOrdersError("final");
  if (response.status !== 200) throw new AdminOrdersError("server");

  try {
    return await response.json();
  } catch {
    throw new AdminOrdersError("server");
  }
}

function isAdminOrder(value: unknown): value is AdminOrder {
  if (typeof value !== "object" || value === null) return false;
  const order = value as Record<string, unknown>;

  return (
    typeof order.orderId === "string" &&
    typeof order.orderNumber === "string" &&
    typeof order.createdAt === "string" &&
    typeof order.customerEmail === "string" &&
    typeof order.total === "number" &&
    typeof order.status === "string" &&
    shipmentStatuses.includes(order.status as ShipmentStatus) &&
    Array.isArray(order.lines) &&
    order.lines.every(
      (line) =>
        typeof line === "object" && line !== null && typeof line.name === "string" && typeof line.quantity === "number"
    )
  );
}
