export type PaymentScenario = "approve" | "decline" | "temporary-failure";

export type PaymentStatus = "approved" | "declined" | "failed";

export interface PaymentAttemptItemResponse {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineSubtotal: number;
}

export interface PaymentAttemptResponse {
  attemptId: string;
  status: PaymentStatus;
  cartRevision: number;
  items: PaymentAttemptItemResponse[];
  total: number;
}

export type PaymentApiErrorKind =
  | "bad-request"
  | "not-found"
  | "cart-changed"
  | "already-approved"
  | "attempt-id-conflict"
  | "capacity"
  | "network"
  | "server"
  | "invalid-response";

export class PaymentApiError extends Error {
  readonly kind: PaymentApiErrorKind;
  readonly existingAttemptId: string | null;

  constructor(kind: PaymentApiErrorKind, existingAttemptId: string | null = null) {
    super(kind);
    this.kind = kind;
    this.existingAttemptId = existingAttemptId;
  }
}

export async function initiatePaymentAttempt(
  attemptId: string,
  cartRevision: number,
  scenario: PaymentScenario
): Promise<PaymentAttemptResponse> {
  return requestPaymentAttempt("/api/payment-attempts", [200, 201], {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attemptId, cartRevision, scenario })
  });
}

export async function getPaymentAttempt(attemptId: string): Promise<PaymentAttemptResponse> {
  return requestPaymentAttempt(`/api/payment-attempts/${encodeURIComponent(attemptId)}`, [200]);
}

async function requestPaymentAttempt(
  path: string,
  expectedStatuses: number[],
  options?: RequestInit
): Promise<PaymentAttemptResponse> {
  let response: Response;

  try {
    response = await fetch(path, options);
  } catch {
    throw new PaymentApiError("network");
  }

  if (!expectedStatuses.includes(response.status)) {
    throw await errorForResponse(response);
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new PaymentApiError("invalid-response");
  }

  if (!isPaymentAttemptResponse(payload)) {
    throw new PaymentApiError("invalid-response");
  }

  return payload;
}

async function errorForResponse(response: Response): Promise<PaymentApiError> {
  const body = await errorBody(response);
  const code = body === null ? null : body.code;

  if (response.status === 409) {
    if (code === "cart-changed") {
      return new PaymentApiError("cart-changed");
    }

    if (code === "attempt-id-conflict") {
      return new PaymentApiError("attempt-id-conflict");
    }

    if (code === "already-approved") {
      return new PaymentApiError("already-approved", body?.attemptId ?? null);
    }

    return new PaymentApiError("server");
  }

  if (response.status === 503 && code === "attempt-capacity-exceeded") {
    return new PaymentApiError("capacity");
  }

  if (response.status === 400) {
    return new PaymentApiError("bad-request");
  }

  if (response.status === 404) {
    return new PaymentApiError("not-found");
  }

  return new PaymentApiError("server");
}

async function errorBody(response: Response): Promise<{ code: string | null; attemptId: string | null } | null> {
  try {
    const payload: unknown = await response.json();

    if (typeof payload === "object" && payload !== null && !Array.isArray(payload)) {
      const record = payload as Record<string, unknown>;

      return {
        code: typeof record.code === "string" ? record.code : null,
        attemptId: typeof record.attemptId === "string" ? record.attemptId : null
      };
    }
  } catch {
    return null;
  }

  return null;
}

function isPaymentAttemptResponse(value: unknown): value is PaymentAttemptResponse {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const attempt = value as Record<string, unknown>;
  const keys = Object.keys(attempt);

  return (
    keys.length === 5 &&
    keys.includes("attemptId") &&
    keys.includes("status") &&
    keys.includes("cartRevision") &&
    keys.includes("items") &&
    keys.includes("total") &&
    typeof attempt.attemptId === "string" &&
    isPaymentStatus(attempt.status) &&
    isInteger(attempt.cartRevision) &&
    attempt.cartRevision >= 0 &&
    Array.isArray(attempt.items) &&
    attempt.items.every(isPaymentAttemptItem) &&
    isFiniteNumber(attempt.total) &&
    attempt.total >= 0
  );
}

function isPaymentStatus(value: unknown): value is PaymentStatus {
  return value === "approved" || value === "declined" || value === "failed";
}

function isPaymentAttemptItem(value: unknown): value is PaymentAttemptItemResponse {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const item = value as Record<string, unknown>;
  const keys = Object.keys(item);

  return (
    keys.length === 5 &&
    keys.includes("productId") &&
    keys.includes("name") &&
    keys.includes("unitPrice") &&
    keys.includes("quantity") &&
    keys.includes("lineSubtotal") &&
    typeof item.productId === "string" &&
    typeof item.name === "string" &&
    isFiniteNumber(item.unitPrice) &&
    item.unitPrice >= 0 &&
    isInteger(item.quantity) &&
    item.quantity >= 1 &&
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
