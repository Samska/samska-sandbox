export interface CreateProductRequest {
  name: string;
  price: number;
}

export interface ProductResponse {
  id: string;
  name: string;
  price: number;
}

export type CatalogApiErrorKind =
  | "bad-request"
  | "not-found"
  | "network"
  | "server"
  | "invalid-response";

export class CatalogApiError extends Error {
  readonly kind: CatalogApiErrorKind;

  constructor(kind: CatalogApiErrorKind) {
    super(kind);
    this.kind = kind;
  }
}

export async function createProduct(request: CreateProductRequest): Promise<ProductResponse> {
  return requestProduct("/api/products", 201, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });
}

export async function getProduct(id: string): Promise<ProductResponse> {
  return requestProduct(`/api/products/${encodeURIComponent(id)}`, 200);
}

async function requestProduct(
  path: string,
  expectedStatus: number,
  options?: RequestInit
): Promise<ProductResponse> {
  let response: Response;

  try {
    response = await fetch(path, options);
  } catch {
    throw new CatalogApiError("network");
  }

  if (response.status !== expectedStatus) {
    throw new CatalogApiError(errorKindFor(response.status));
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new CatalogApiError("invalid-response");
  }

  if (!isProductResponse(payload)) {
    throw new CatalogApiError("invalid-response");
  }

  return payload;
}

function errorKindFor(status: number): CatalogApiErrorKind {
  if (status === 400) {
    return "bad-request";
  }

  if (status === 404) {
    return "not-found";
  }

  return "server";
}

function isProductResponse(value: unknown): value is ProductResponse {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const product = value as Record<string, unknown>;
  const keys = Object.keys(product);

  return (
    keys.length === 3 &&
    keys.includes("id") &&
    keys.includes("name") &&
    keys.includes("price") &&
    typeof product.id === "string" &&
    typeof product.name === "string" &&
    typeof product.price === "number" &&
    Number.isFinite(product.price)
  );
}
