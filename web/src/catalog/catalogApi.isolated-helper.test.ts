import { afterEach, describe, expect, it, vi } from "vitest";
import {
  deleteProduct,
  getProduct,
  removeProductMedia,
  updateProduct,
  uploadProductMedia,
  type CatalogApiErrorKind,
  type CreateProductRequest
} from "./catalogApi";

const product = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Canvas Tote",
  description: "A sturdy everyday tote.",
  price: 12.5,
  mediaKey: null,
  uploadedMediaId: null
};

const uploaded = {
  ...product,
  uploadedMediaId: "22222222-2222-2222-2222-222222222222"
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
      [413, "too-large"],
      [415, "unsupported-media"],
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

describe("catalogApi media", () => {
  it("retrieves a single Product by identity", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(response(200, uploaded)));
    vi.stubGlobal("fetch", fetchMock);

    const found = await getProduct(product.id);

    expect(found.uploadedMediaId).toBe(uploaded.uploadedMediaId);
    expect(fetchMock).toHaveBeenCalledWith(`/api/products/${product.id}`, undefined);
  });

  it("maps a missing Product to a not-found error", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(response(404))));

    await expect(getProduct(product.id)).rejects.toMatchObject({ kind: "not-found" });
  });

  it("uploads media as multipart form data with PUT", async () => {
    const fetchMock = vi.fn((_input: RequestInfo | URL, _options?: RequestInit) =>
      Promise.resolve(response(200, uploaded))
    );
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["jpeg-bytes"], "photo.jpg", { type: "image/jpeg" });

    const updated = await uploadProductMedia(product.id, file);

    expect(updated.uploadedMediaId).toBe(uploaded.uploadedMediaId);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [path, options] = fetchMock.mock.calls[0];
    expect(path).toBe(`/api/products/${product.id}/media`);
    expect(options?.method).toBe("PUT");
    expect(options?.body).toBeInstanceOf(FormData);
    expect((options?.body as FormData).get("file")).toBe(file);
  });

  it("removes uploaded media with DELETE and accepts 204", async () => {
    const fetchMock = vi.fn((_input: RequestInfo | URL, _options?: RequestInit) =>
      Promise.resolve(response(204))
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(removeProductMedia(product.id)).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(`/api/products/${product.id}/media`, {
      method: "DELETE"
    });
  });

  it("maps media failures to error kinds", async () => {
    const cases: Array<[number, CatalogApiErrorKind]> = [
      [400, "bad-request"],
      [404, "not-found"],
      [413, "too-large"],
      [415, "unsupported-media"],
      [500, "server"]
    ];

    for (const [status, kind] of cases) {
      vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(response(status))));

      await expect(
        uploadProductMedia(product.id, new File(["x"], "x.jpg", { type: "image/jpeg" }))
      ).rejects.toMatchObject({ kind });
      await expect(removeProductMedia(product.id)).rejects.toMatchObject({ kind });
    }
  });

  it("distinguishes exhausted storage capacity from other media limits", async () => {
    const file = new File(["x"], "x.jpg", { type: "image/jpeg" });

    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(response(413, { code: "storage-capacity-exceeded" })))
    );
    await expect(uploadProductMedia(product.id, file)).rejects.toMatchObject({
      kind: "storage-full"
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(response(413, { code: "media-limit-exceeded" })))
    );
    await expect(uploadProductMedia(product.id, file)).rejects.toMatchObject({ kind: "too-large" });

    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(response(413, "not-json"))));
    await expect(uploadProductMedia(product.id, file)).rejects.toMatchObject({ kind: "too-large" });
  });

  it("rejects an invalid upload response shape", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(response(200, { ...product, extra: true }))));

    await expect(
      uploadProductMedia(product.id, new File(["x"], "x.jpg", { type: "image/jpeg" }))
    ).rejects.toMatchObject({ kind: "invalid-response" });
  });

  it("reports network failures for media operations", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));

    await expect(
      uploadProductMedia(product.id, new File(["x"], "x.jpg", { type: "image/jpeg" }))
    ).rejects.toMatchObject({ kind: "network" });
    await expect(removeProductMedia(product.id)).rejects.toMatchObject({ kind: "network" });
  });
});
