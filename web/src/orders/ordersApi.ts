import { apiFetch } from "../http";

export type ShipmentStatus = "PLACED" | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export const shipmentStatuses: readonly ShipmentStatus[] = ["PLACED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"];

export interface OrderHistoryEntry {
  orderId: string;
  orderNumber: string;
  createdAt: string;
  itemCount: number;
  total: number;
  status: ShipmentStatus;
}

export interface ShipmentStep {
  code: ShipmentStatus;
  /** When the step happened; null while it is still to come. */
  at: string | null;
  done: boolean;
}

export interface Shipment {
  orderId: string;
  orderNumber: string;
  status: ShipmentStatus;
  steps: ShipmentStep[];
}

export type OrdersApiErrorKind = "not-found" | "network" | "server";

export class OrdersApiError extends Error {
  readonly kind: OrdersApiErrorKind;

  constructor(kind: OrdersApiErrorKind) {
    super(kind);
    this.kind = kind;
  }
}

const statuses: readonly string[] = shipmentStatuses;

export async function listOrders(): Promise<OrderHistoryEntry[]> {
  const payload = await read("/api/orders");

  if (!Array.isArray(payload) || !payload.every(isHistoryEntry)) {
    throw new OrdersApiError("server");
  }

  return payload;
}

export async function getShipment(orderId: string): Promise<Shipment> {
  const payload = await read(`/api/orders/${encodeURIComponent(orderId)}/shipment`);

  if (!isShipment(payload)) {
    throw new OrdersApiError("server");
  }

  return payload;
}

async function read(path: string): Promise<unknown> {
  let response: Response;

  try {
    response = await apiFetch(path);
  } catch {
    throw new OrdersApiError("network");
  }

  if (response.status === 404) {
    throw new OrdersApiError("not-found");
  }

  if (response.status !== 200) {
    throw new OrdersApiError("server");
  }

  try {
    return await response.json();
  } catch {
    throw new OrdersApiError("server");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isHistoryEntry(value: unknown): value is OrderHistoryEntry {
  return (
    isRecord(value) &&
    typeof value.orderId === "string" &&
    typeof value.orderNumber === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.itemCount === "number" &&
    typeof value.total === "number" &&
    typeof value.status === "string" &&
    statuses.includes(value.status)
  );
}

function isShipment(value: unknown): value is Shipment {
  return (
    isRecord(value) &&
    typeof value.orderId === "string" &&
    typeof value.orderNumber === "string" &&
    typeof value.status === "string" &&
    statuses.includes(value.status) &&
    Array.isArray(value.steps) &&
    value.steps.every(
      (step) =>
        isRecord(step) &&
        typeof step.code === "string" &&
        statuses.includes(step.code) &&
        (typeof step.at === "string" || step.at === null) &&
        typeof step.done === "boolean"
    )
  );
}
