export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  mediaKey: string | null;
}

export interface ProductResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  mediaKey: string | null;
  uploadedMediaId: string | null;
}

export type CatalogApiErrorKind =
  | "bad-request"
  | "not-found"
  | "conflict"
  | "too-large"
  | "storage-full"
  | "unsupported-media"
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

export async function updateProduct(
  id: string,
  request: CreateProductRequest
): Promise<ProductResponse> {
  return requestProduct(`/api/products/${encodeURIComponent(id)}`, 200, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });
}

export async function deleteProduct(id: string): Promise<void> {
  return requestWithoutBody(`/api/products/${encodeURIComponent(id)}`, "DELETE");
}

export async function getProduct(id: string): Promise<ProductResponse> {
  return requestProduct(`/api/products/${encodeURIComponent(id)}`, 200);
}

export async function uploadProductMedia(id: string, file: File): Promise<ProductResponse> {
  const body = new FormData();
  body.append("file", file);

  return requestProduct(`/api/products/${encodeURIComponent(id)}/media`, 200, {
    method: "PUT",
    body
  });
}

export async function removeProductMedia(id: string): Promise<void> {
  return requestWithoutBody(`/api/products/${encodeURIComponent(id)}/media`, "DELETE");
}

export async function listProducts(): Promise<ProductResponse[]> {
  let response: Response;

  try {
    response = await fetch("/api/products");
  } catch {
    throw new CatalogApiError("network");
  }

  if (response.status !== 200) {
    throw new CatalogApiError(errorKindFor(response.status));
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new CatalogApiError("invalid-response");
  }

  if (!Array.isArray(payload) || !payload.every(isProductResponse)) {
    throw new CatalogApiError("invalid-response");
  }

  return payload;
}

async function requestWithoutBody(path: string, method: string): Promise<void> {
  let response: Response;

  try {
    response = await fetch(path, { method });
  } catch {
    throw new CatalogApiError("network");
  }

  if (response.status !== 204) {
    throw new CatalogApiError(errorKindFor(response.status));
  }
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
    throw new CatalogApiError(await errorKindForResponse(response));
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

async function errorKindForResponse(response: Response): Promise<CatalogApiErrorKind> {
  if (response.status === 413 && (await errorCodeFor(response)) === "storage-capacity-exceeded") {
    return "storage-full";
  }

  return errorKindFor(response.status);
}

async function errorCodeFor(response: Response): Promise<string | null> {
  try {
    const payload: unknown = await response.json();

    if (typeof payload === "object" && payload !== null && !Array.isArray(payload)) {
      const code = (payload as Record<string, unknown>).code;
      return typeof code === "string" ? code : null;
    }
  } catch {
    return null;
  }

  return null;
}

function errorKindFor(status: number): CatalogApiErrorKind {
  if (status === 400) {
    return "bad-request";
  }

  if (status === 404) {
    return "not-found";
  }

  if (status === 409) {
    return "conflict";
  }

  if (status === 413) {
    return "too-large";
  }

  if (status === 415) {
    return "unsupported-media";
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
    keys.length === 6 &&
    keys.includes("id") &&
    keys.includes("name") &&
    keys.includes("description") &&
    keys.includes("price") &&
    keys.includes("mediaKey") &&
    keys.includes("uploadedMediaId") &&
    typeof product.id === "string" &&
    typeof product.name === "string" &&
    typeof product.description === "string" &&
    typeof product.price === "number" &&
    Number.isFinite(product.price) &&
    (product.mediaKey === null || typeof product.mediaKey === "string") &&
    (product.uploadedMediaId === null || typeof product.uploadedMediaId === "string")
  );
}
