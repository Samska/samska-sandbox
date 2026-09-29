import { afterEach, describe, expect, it, vi } from "vitest";
import { createOrder, getOrder, getOrderByPaymentAttempt, OrderApiError } from "./orderApi";

const attemptId = "aaaaaaaa-1111-1111-1111-111111111111";
const order = {
  orderId: "bbbbbbbb-2222-2222-2222-222222222222", paymentAttemptId: attemptId, cartRevision: 1,
  items: [{ productId: "cccccccc-3333-3333-3333-333333333333", name: "Canvas Tote",
    unitPrice: 12.5, quantity: 2, lineSubtotal: 25 }], total: 25
};

function response(status: number, body: unknown): Response {
  return { status, json: async () => body } as Response;
}

afterEach(() => vi.unstubAllGlobals());

describe("Order API adapter", () => {
  it("submits only the attempt ID and supports both identity lookups", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(201, order));
    vi.stubGlobal("fetch", fetchMock);
    expect(await createOrder(attemptId)).toEqual(order);
    expect(fetchMock).toHaveBeenCalledWith("/api/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentAttemptId: attemptId })
    });
    fetchMock.mockResolvedValue(response(200, order));
    expect(await getOrder(order.orderId)).toEqual(order);
    expect(await getOrderByPaymentAttempt(attemptId)).toEqual(order);
  });

  it("distinguishes capacity and ineligible attempts from uncertain responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(503, { code: "order-capacity-exceeded" }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(createOrder(attemptId)).rejects.toMatchObject({ kind: "capacity" });
    fetchMock.mockResolvedValue(response(409, { code: "payment-not-approved" }));
    await expect(createOrder(attemptId)).rejects.toMatchObject({ kind: "not-approved" });
    fetchMock.mockResolvedValue(response(200, { ...order, items: "not-lines" }));
    await expect(getOrder(order.orderId)).rejects.toMatchObject({ kind: "invalid-response" });
    fetchMock.mockRejectedValue(new Error("lost response"));
    await expect(createOrder(attemptId)).rejects.toEqual(new OrderApiError("network"));
  });
});
