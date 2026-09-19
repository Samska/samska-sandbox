export interface CartItemResponse {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineSubtotal: number;
}

export interface CartResponse {
  items: CartItemResponse[];
  total: number;
}

export type CartApiErrorKind = "bad-request" | "not-found" | "network" | "server" | "invalid-response";

export class CartApiError extends Error {
  readonly kind: CartApiErrorKind;

  constructor(kind: CartApiErrorKind) {
    super(kind);
    this.kind = kind;
  }
}

export async function getCart(): Promise<CartResponse> {
  return requestCart("/api/cart", 200);
}

export async function addCartItem(productId: string, quantity: number): Promise<CartResponse> {
  return requestCart("/api/cart/items", 200, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, quantity })
  });
}

export async function updateCartItem(productId: string, quantity: number): Promise<CartResponse> {
  return requestCart(`/api/cart/items/${encodeURIComponent(productId)}`, 200, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity })
  });
}

export async function removeCartItem(productId: string): Promise<CartResponse> {
  return requestCart(`/api/cart/items/${encodeURIComponent(productId)}`, 200, {
    method: "DELETE"
  });
}

async function requestCart(path: string, expectedStatus: number, options?: RequestInit): Promise<CartResponse> {
  let response: Response;

  try {
    response = await fetch(path, options);
  } catch {
    throw new CartApiError("network");
  }

  if (response.status !== expectedStatus) {
    throw new CartApiError(errorKindFor(response.status));
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new CartApiError("invalid-response");
  }

  if (!isCartResponse(payload)) {
    throw new CartApiError("invalid-response");
  }

  return payload;
}

function errorKindFor(status: number): CartApiErrorKind {
  if (status === 400) {
    return "bad-request";
  }

  if (status === 404) {
    return "not-found";
  }

  return "server";
}

function isCartResponse(value: unknown): value is CartResponse {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const cart = value as Record<string, unknown>;
  const keys = Object.keys(cart);

  return (
    keys.length === 2 &&
    keys.includes("items") &&
    keys.includes("total") &&
    Array.isArray(cart.items) &&
    cart.items.every(isCartItemResponse) &&
    isFiniteNumber(cart.total)
  );
}

function isCartItemResponse(value: unknown): value is CartItemResponse {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const item = value as Record<string, unknown>;
  const keys = Object.keys(item);

  return (
    keys.length === 5 &&
    keys.includes("productId") &&
    keys.includes("name") &&
    keys.includes("quantity") &&
    keys.includes("unitPrice") &&
    keys.includes("lineSubtotal") &&
    typeof item.productId === "string" &&
    typeof item.name === "string" &&
    isInteger(item.quantity) &&
    item.quantity >= 1 &&
    isFiniteNumber(item.unitPrice) &&
    item.unitPrice >= 0 &&
    isFiniteNumber(item.lineSubtotal) &&
    item.lineSubtotal >= 0
  );
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}
