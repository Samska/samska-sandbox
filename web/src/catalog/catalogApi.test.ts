import { afterEach, describe, expect, it, vi } from "vitest";
import {
  deleteProduct,
  updateProduct,
  type CatalogApiErrorKind,
  type CreateProductRequest
} from "./catalogApi";

const product = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Canvas Tote",
  description: "A sturdy everyday tote.",
  price: 12.5,
  mediaKey: null
};

const replacement: CreateProductRequest = {
  name: "Canvas Market Tote",
  description: "A roomier everyday tote.",
  price: 15.25,
  mediaKey: "canvas-market-tote"
};

afterEach(() => {
  vi.unstubAllGlobals();
});

function response(status: number, body?: unknown): Response {
  return {
    status,
    json: async () => body
  } as Response;
}

describe("catalogApi update and delete", () => {
  it("sends a full replacement with PUT and validates the response", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(response(200, { ...product, name: replacement.name }))
    );
    vi.stubGlobal("fetch", fetchMock);

    const updated = await updateProduct(product.id, replacement);

    expect(updated.name).toBe(replacement.name);
    expect(fetchMock).toHaveBeenCalledWith(`/api/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(replacement)
    });
  });

  it("encodes the Product ID in update and delete paths", async () => {
    const fetchMock = vi.fn((_input: RequestInfo | URL, options?: RequestInit) =>
      Promise.resolve(options?.method === "DELETE" ? response(204) : response(200, product))
    );
    vi.stubGlobal("fetch", fetchMock);

    await updateProduct("product/id", replacement);
    await deleteProduct("product/id");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/products/product%2Fid",
      expect.objectContaining({ method: "PUT" })
    );
    expect(fetchMock).toHaveBeenCalledWith("/api/products/product%2Fid", { method: "DELETE" });
  });

  it("accepts a 204 delete response without a body", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(response(204))));

    await expect(deleteProduct(product.id)).resolves.toBeUndefined();
  });

  it("maps update and delete failures to error kinds", async () => {
    const cases: Array<[number, CatalogApiErrorKind]> = [
      [400, "bad-request"],
      [404, "not-found"],
      [409, "conflict"],
      [500, "server"]
    ];

    for (const [status, kind] of cases) {
      vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(response(status))));

      await expect(updateProduct(product.id, replacement)).rejects.toMatchObject({ kind });
      await expect(deleteProduct(product.id)).rejects.toMatchObject({ kind });
    }
  });

  it("rejects an invalid update response shape", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(response(200, { ...product, extra: true }))));

    await expect(updateProduct(product.id, replacement)).rejects.toMatchObject({
      kind: "invalid-response"
    });
  });

  it("reports network failures for update and delete", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));

    await expect(updateProduct(product.id, replacement)).rejects.toMatchObject({ kind: "network" });
    await expect(deleteProduct(product.id)).rejects.toMatchObject({ kind: "network" });
  });
});
