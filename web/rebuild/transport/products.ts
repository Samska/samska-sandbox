import type { CreateProductInput, Product, RequestError } from "./types";

const COLLECTION_PATH = "/api/products";
const REQUIRED_KEYS = [
  "id",
  "name",
  "description",
  "price",
  "mediaKey",
  "uploadedMediaId"
] as const;
const MEDIA_KEY_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/products
 *
 * Empty 400 bodies are not parsed: the contract is silent, so we surface
 * them as typed errors instead of pretending the server spoke JSON.
 */
export async function createProduct(
  input: CreateProductInput,
  signal?: AbortSignal
): Promise<Product> {
  let response: Response;
  try {
    response = await fetch(COLLECTION_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        name: input.name,
        description: input.description,
        price: input.price,
        ...(input.mediaKey !== undefined ? { mediaKey: input.mediaKey } : {})
      }),
      signal
    });
  } catch {
    throw networkError();
  }

  if (response.status === 201) {
    return parseProduct(response, "create response missing product body");
  }
  if (response.status === 400) {
    throw requestError("invalid", 400, "server rejected the product");
  }
  if (response.status >= 500) {
    throw requestError("server", response.status, `server returned ${response.status}`);
  }
  throw requestError("server", response.status, `unexpected status ${response.status}`);
}

/** GET /api/products — returns an empty array when the collection is fresh. */
export async function listProducts(signal?: AbortSignal): Promise<Product[]> {
  let response: Response;
  try {
    response = await fetch(COLLECTION_PATH, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal
    });
  } catch {
    throw networkError();
  }

  if (!response.ok) {
    throw requestError("server", response.status, `list returned ${response.status}`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw requestError("parse", 200, "list response not JSON");
  }

  if (!Array.isArray(payload)) {
    throw requestError("parse", 200, "list response not an array");
  }
  return payload.map((entry, index) => ensureProduct(entry, `list[${index}]`));
}

/** GET /api/products/{id} — empty 400/404 bodies remain silent. */
export async function getProduct(id: string, signal?: AbortSignal): Promise<Product> {
  let response: Response;
  try {
    response = await fetch(`${COLLECTION_PATH}/${encodeURIComponent(id)}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal
    });
  } catch {
    throw networkError();
  }

  if (response.ok) {
    return parseProduct(response, "detail response missing product body");
  }
  if (response.status === 400) {
    throw requestError("invalid", 400, "server rejected the id");
  }
  if (response.status === 404) {
    throw requestError("notFound", 404, "product not found");
  }
  throw requestError("server", response.status, `detail returned ${response.status}`);
}

async function parseProduct(response: Response, message: string): Promise<Product> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw requestError("parse", 200, message);
  }
  return ensureProduct(payload, "product");
}

function ensureProduct(value: unknown, label: string): Product {
  if (!isProduct(value)) {
    throw requestError("parse", 200, `${label} does not match product contract`);
  }
  return value;
}

/**
 * Strict six-key validator. Extra keys, missing keys, wrong types or values
 * out of range all reject; a wire-contract violation is a parse error so the
 * UI can show a generic message without exposing the raw payload.
 */
function isProduct(value: unknown): value is Product {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  for (const key of REQUIRED_KEYS) {
    if (!(key in candidate)) {
      return false;
    }
  }
  for (const key of Object.keys(candidate)) {
    if (!REQUIRED_KEYS.includes(key as (typeof REQUIRED_KEYS)[number])) {
      return false;
    }
  }
  if (typeof candidate.id !== "string" || !UUID_PATTERN.test(candidate.id)) {
    return false;
  }
  if (typeof candidate.name !== "string" || candidate.name.trim().length === 0) {
    return false;
  }
  if (typeof candidate.description !== "string" || candidate.description.trim().length === 0) {
    return false;
  }
  if (typeof candidate.price !== "number" || !Number.isFinite(candidate.price) || candidate.price < 0) {
    return false;
  }
  if (candidate.mediaKey !== null) {
    if (
      typeof candidate.mediaKey !== "string" ||
      !MEDIA_KEY_PATTERN.test(candidate.mediaKey) ||
      candidate.mediaKey.length > 40
    ) {
      return false;
    }
  }
  if (candidate.uploadedMediaId !== null) {
    return false;
  }
  return true;
}

function requestError(
  kind: RequestError["kind"],
  status: number,
  message: string
): RequestError {
  if (kind === "invalid") {
    return { kind: "invalid", status: 400, message };
  }
  if (kind === "notFound") {
    return { kind: "notFound", status: 404, message };
  }
  if (kind === "server") {
    return { kind: "server", status, message };
  }
  return { kind: "parse", message };
}

function networkError(): RequestError {
  return { kind: "network", message: "Could not reach the candidate backend." };
}