import { apiFetch } from "../http";

export type ShipmentStatus = "PROCESSING" | "PACKED" | "IN_TRANSIT" | "DELAYED" | "DELIVERED";

export interface OrderHistoryEntry {
  orderId: string;
  orderNumber: string;
  createdAt: string;
  itemCount: number;
  total: number;
  status: ShipmentStatus;
}

export interface ShipmentStep {
  code: "ORDER_CREATED" | "PACKED" | "LEFT_WAREHOUSE" | "OUT_FOR_DELIVERY" | "DELIVERED";
  at: string;
  done: boolean;
}

export interface Shipment {
  orderId: string;
  orderNumber: string;
  trackingCode: string;
  courier: string;
  status: ShipmentStatus;
  delayed: boolean;
  estimatedDelivery: string;
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

const statuses: readonly string[] = ["PROCESSING", "PACKED", "IN_TRANSIT", "DELAYED", "DELIVERED"];

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
    typeof value.trackingCode === "string" &&
    typeof value.courier === "string" &&
    typeof value.status === "string" &&
    statuses.includes(value.status) &&
    typeof value.delayed === "boolean" &&
    typeof value.estimatedDelivery === "string" &&
    Array.isArray(value.steps) &&
    value.steps.every(
      (step) => isRecord(step) && typeof step.code === "string" && typeof step.at === "string" && typeof step.done === "boolean"
    )
  );
}
