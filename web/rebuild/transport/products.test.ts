import { afterEach, describe, expect, it, vi } from "vitest";
import { createProduct, getProduct, listProducts } from "./products";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders }
  });
}

const sampleProduct = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Canvas Tote",
  description: "Synthetic canvas tote",
  price: 12.5,
  mediaKey: null,
  uploadedMediaId: null
};

describe("createProduct", () => {
  it("posts the raw payload without trimming and parses the 201 body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(sampleProduct, 201, { Location: "/api/products/" + sampleProduct.id })
    );
    globalThis.fetch = fetchMock;

    const result = await createProduct({
      name: "  Canvas Tote  ",
      description: "Synthetic canvas tote",
      price: 12.5
    });

    expect(result).toEqual(sampleProduct);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/products");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      name: "  Canvas Tote  ",
      description: "Synthetic canvas tote",
      price: 12.5
    });
  });

  it("rejects empty 400 bodies without parsing", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response("", { status: 400 }));
    await expect(
      createProduct({ name: "x", description: "y", price: 0 })
    ).rejects.toMatchObject({ kind: "invalid", status: 400 });
  });

  it("surfaces 5xx as server error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response("", { status: 503 }));
    await expect(
      createProduct({ name: "x", description: "y", price: 0 })
    ).rejects.toMatchObject({ kind: "server", status: 503 });
  });

  it("treats fetch failures as network errors without leaking the cause", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("TypeError: secret detail"));
    const err = await createProduct({ name: "x", description: "y", price: 0 }).catch((e) => e);
    expect(err).toMatchObject({ kind: "network" });
    expect(JSON.stringify(err)).not.toContain("secret detail");
  });

  it("rejects payloads missing required keys", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse({ id: "x" }, 201));
    await expect(
      createProduct({ name: "x", description: "y", price: 0 })
    ).rejects.toMatchObject({ kind: "parse" });
  });

  it("rejects payloads with extra keys", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      jsonResponse({ ...sampleProduct, currency: "USD" }, 201)
    );
    await expect(
      createProduct({ name: "x", description: "y", price: 0 })
    ).rejects.toMatchObject({ kind: "parse" });
  });

  it("rejects invalid UUIDs in the response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      jsonResponse({ ...sampleProduct, id: "not-a-uuid" }, 201)
    );
    await expect(
      createProduct({ name: "x", description: "y", price: 0 })
    ).rejects.toMatchObject({ kind: "parse" });
  });

  it("rejects negative or infinite price in the response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      jsonResponse({ ...sampleProduct, price: -1 }, 201)
    );
    await expect(
      createProduct({ name: "x", description: "y", price: 0 })
    ).rejects.toMatchObject({ kind: "parse" });

    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      jsonResponse({ ...sampleProduct, price: Number.POSITIVE_INFINITY }, 201)
    );
    await expect(
      createProduct({ name: "x", description: "y", price: 0 })
    ).rejects.toMatchObject({ kind: "parse" });
  });

  it("rejects blank name or description in the response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      jsonResponse({ ...sampleProduct, name: "   " }, 201)
    );
    await expect(
      createProduct({ name: "x", description: "y", price: 0 })
    ).rejects.toMatchObject({ kind: "parse" });
  });

  it("rejects non-null uploadedMediaId", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      jsonResponse({ ...sampleProduct, uploadedMediaId: "not-null" }, 201)
    );
    await expect(
      createProduct({ name: "x", description: "y", price: 0 })
    ).rejects.toMatchObject({ kind: "parse" });
  });

  it("rejects invalid mediaKey in the response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      jsonResponse({ ...sampleProduct, mediaKey: "INVALID-SLUG" }, 201)
    );
    await expect(
      createProduct({ name: "x", description: "y", price: 0 })
    ).rejects.toMatchObject({ kind: "parse" });
  });

  it("rejects mediaKey longer than 40 characters", async () => {
    const longSlug = "a".repeat(41);
    globalThis.fetch = vi.fn().mockResolvedValue(
      jsonResponse({ ...sampleProduct, mediaKey: longSlug }, 201)
    );
    await expect(
      createProduct({ name: "x", description: "y", price: 0 })
    ).rejects.toMatchObject({ kind: "parse" });
  });

  it("accepts mediaKey at the 40-character boundary", async () => {
    const slug = "a".repeat(40);
    globalThis.fetch = vi.fn().mockResolvedValue(
      jsonResponse({ ...sampleProduct, mediaKey: slug }, 201)
    );
    const result = await createProduct({ name: "x", description: "y", price: 0 });
    expect(result.mediaKey).toBe(slug);
  });
});

describe("listProducts", () => {
  it("returns an empty array when the backend has nothing", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse([]));
    const result = await listProducts();
    expect(result).toEqual([]);
  });

  it("returns parsed products when valid", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse([sampleProduct]));
    const result = await listProducts();
    expect(result).toEqual([sampleProduct]);
  });

  it("rejects when the body is not an array", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse({ items: [] }));
    await expect(listProducts()).rejects.toMatchObject({ kind: "parse" });
  });

  it("rejects when a product entry is malformed", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse([{ id: "x" }]));
    await expect(listProducts()).rejects.toMatchObject({ kind: "parse" });
  });

  it("rejects when an entry carries extra keys", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      jsonResponse([{ ...sampleProduct, version: 2 }])
    );
    await expect(listProducts()).rejects.toMatchObject({ kind: "parse" });
  });
});

describe("getProduct", () => {
  it("returns the parsed product", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse(sampleProduct));
    const result = await getProduct(sampleProduct.id);
    expect(result).toEqual(sampleProduct);
  });

  it("encodes the id", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(sampleProduct));
    globalThis.fetch = fetchMock;
    await getProduct("id/with/slashes");
    expect(fetchMock.mock.calls[0]![0]).toBe("/api/products/id%2Fwith%2Fslashes");
  });

  it("surfaces 404 as notFound without parsing", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response("", { status: 404 }));
    await expect(getProduct(sampleProduct.id)).rejects.toMatchObject({
      kind: "notFound",
      status: 404
    });
  });

  it("surfaces 400 as invalid without parsing", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response("", { status: 400 }));
    await expect(getProduct("not-a-uuid")).rejects.toMatchObject({
      kind: "invalid",
      status: 400
    });
  });
});