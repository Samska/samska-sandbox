import { apiFetch } from "../http";
export interface OrderItemResponse {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineSubtotal: number;
}

export interface OrderResponse {
  orderId: string;
  orderNumber: string;
  cartRevision: number;
  items: OrderItemResponse[];
  total: number;
}

export type OrderApiErrorKind =
  | "bad-request"
  | "cart-changed"
  | "out-of-stock"
  | "network"
  | "server"
  | "invalid-response";

export class OrderApiError extends Error {
  readonly kind: OrderApiErrorKind;

  constructor(kind: OrderApiErrorKind) {
    super(kind);
    this.kind = kind;
  }
}

/** The request ID makes a retry safe: the server returns the same Order for the same ID. */
export function createOrder(requestId: string, cartRevision: number): Promise<OrderResponse> {
  return request("/api/orders", [200, 201], {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestId, cartRevision })
  });
}

async function request(path: string, expected: number[], options?: RequestInit): Promise<OrderResponse> {
  let response: Response;
  try {
    response = await apiFetch(path, options);
  } catch {
    throw new OrderApiError("network");
  }

  if (!expected.includes(response.status)) {
    if (response.status === 400) throw new OrderApiError("bad-request");
    if (response.status === 409) {
      const code = await errorCode(response);
      if (code === "cart-changed") throw new OrderApiError("cart-changed");
      if (code === "out-of-stock") throw new OrderApiError("out-of-stock");
    }
    throw new OrderApiError("server");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new OrderApiError("invalid-response");
  }
  if (!isOrder(payload)) throw new OrderApiError("invalid-response");
  return payload;
}

async function errorCode(response: Response): Promise<string | null> {
  try {
    const payload: unknown = await response.json();
    if (typeof payload === "object" && payload !== null && "code" in payload) {
      return typeof payload.code === "string" ? payload.code : null;
    }
  } catch {
    return null;
  }
  return null;
}

function isOrder(value: unknown): value is OrderResponse {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  return (
    Object.keys(data).length === 5 &&
    typeof data.orderId === "string" &&
    typeof data.orderNumber === "string" &&
    Number.isInteger(data.cartRevision) &&
    (data.cartRevision as number) >= 0 &&
    Array.isArray(data.items) && data.items.length > 0 && data.items.every(isItem) &&
    typeof data.total === "number" && Number.isFinite(data.total) && data.total >= 0
  );
}

function isItem(value: unknown): value is OrderItemResponse {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return (
    Object.keys(item).length === 5 &&
    typeof item.productId === "string" &&
    typeof item.name === "string" && item.name.length > 0 &&
    typeof item.unitPrice === "number" && Number.isFinite(item.unitPrice) && item.unitPrice >= 0 &&
    Number.isInteger(item.quantity) && (item.quantity as number) >= 1 &&
    typeof item.lineSubtotal === "number" && Number.isFinite(item.lineSubtotal) && item.lineSubtotal >= 0
  );
}
