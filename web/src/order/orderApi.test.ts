import { afterEach, describe, expect, it, vi } from "vitest";
import { createOrder, OrderApiError } from "./orderApi";

const requestId = "aaaaaaaa-1111-1111-1111-111111111111";
const order = {
  orderId: "bbbbbbbb-2222-2222-2222-222222222222", orderNumber: "SK-000128", cartRevision: 1,
  items: [{ productId: "cccccccc-3333-3333-3333-333333333333", name: "Canvas Tote",
    unitPrice: 12.5, quantity: 2, lineSubtotal: 25 }], total: 25
};

function response(status: number, body: unknown): Response {
  return { status, json: async () => body } as Response;
}

afterEach(() => vi.unstubAllGlobals());

describe("Order API adapter", () => {
  it("submits the request ID and the reviewed Cart revision", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(201, order));
    vi.stubGlobal("fetch", fetchMock);
    expect(await createOrder(requestId, 1)).toEqual(order);
    expect(fetchMock).toHaveBeenCalledWith("/api/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, cartRevision: 1 })
    });
    fetchMock.mockResolvedValue(response(200, order));
    expect(await createOrder(requestId, 1)).toEqual(order);
  });

  it("distinguishes refusals from uncertain responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(503, { code: "order-store-unavailable" }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(createOrder(requestId, 1)).rejects.toMatchObject({ kind: "server" });
    fetchMock.mockResolvedValue(response(409, { code: "cart-changed" }));
    await expect(createOrder(requestId, 1)).rejects.toMatchObject({ kind: "cart-changed" });
    fetchMock.mockResolvedValue(response(409, { code: "out-of-stock" }));
    await expect(createOrder(requestId, 1)).rejects.toMatchObject({ kind: "out-of-stock" });
    fetchMock.mockResolvedValue(response(400, {}));
    await expect(createOrder(requestId, 1)).rejects.toMatchObject({ kind: "bad-request" });
    fetchMock.mockResolvedValue(response(201, { ...order, items: "not-lines" }));
    await expect(createOrder(requestId, 1)).rejects.toMatchObject({ kind: "invalid-response" });
    fetchMock.mockRejectedValue(new Error("lost response"));
    await expect(createOrder(requestId, 1)).rejects.toEqual(new OrderApiError("network"));
  });
});
