import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getPaymentAttempt,
  initiatePaymentAttempt,
  PaymentApiError
} from "./paymentApi";

const attempt = {
  attemptId: "aaaaaaaa-1111-1111-1111-111111111111",
  status: "approved",
  cartRevision: 3,
  items: [
    {
      productId: "f84c1a1d-6d7a-4c07-b40f-3c5ca66ab612",
      name: "Canvas Tote",
      unitPrice: 12.5,
      quantity: 2,
      lineSubtotal: 25
    }
  ],
  total: 25
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

describe("paymentApi", () => {
  it("posts the attempt initiation and accepts creation or replay", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(response(201, attempt)));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      initiatePaymentAttempt(attempt.attemptId, 3, "approve")
    ).resolves.toEqual(attempt);

    expect(fetchMock).toHaveBeenCalledWith("/api/payment-attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId: attempt.attemptId, cartRevision: 3, scenario: "approve" })
    });

    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(response(200, attempt))));

    await expect(
      initiatePaymentAttempt(attempt.attemptId, 3, "approve")
    ).resolves.toEqual(attempt);
  });

  it("retrieves an attempt by encoded identity", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(response(200, attempt)));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getPaymentAttempt(attempt.attemptId)).resolves.toEqual(attempt);

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/payment-attempts/${encodeURIComponent(attempt.attemptId)}`,
      undefined
    );
  });

  it("maps API error responses to payment error kinds", async () => {
    const cases: Array<{ status: number; body?: unknown; kind: string; existingAttemptId?: string }> = [
      { status: 400, kind: "bad-request" },
      { status: 404, kind: "not-found" },
      { status: 409, body: { code: "cart-changed" }, kind: "cart-changed" },
      { status: 409, body: { code: "attempt-id-conflict" }, kind: "attempt-id-conflict" },
      {
        status: 409,
        body: { code: "already-approved", attemptId: attempt.attemptId },
        kind: "already-approved",
        existingAttemptId: attempt.attemptId
      },
      {
        status: 503,
        body: { code: "attempt-capacity-exceeded" },
        kind: "capacity"
      },
      { status: 503, body: { code: "other" }, kind: "server" },
      { status: 500, kind: "server" }
    ];

    for (const testCase of cases) {
      vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(response(testCase.status, testCase.body))));

      const error = await initiatePaymentAttempt(attempt.attemptId, 3, "approve").catch(
        (caught: unknown) => caught
      );

      expect(error).toBeInstanceOf(PaymentApiError);
      expect((error as PaymentApiError).kind).toBe(testCase.kind);
      expect((error as PaymentApiError).existingAttemptId).toBe(
        testCase.existingAttemptId ?? null
      );
    }
  });

  it("reports unconfirmed outcomes without inventing a decision", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("network down"))));

    const networkError = await initiatePaymentAttempt(attempt.attemptId, 3, "approve").catch(
      (caught: unknown) => caught
    );
    expect((networkError as PaymentApiError).kind).toBe("network");

    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(response(201, { attemptId: "x" }))));

    const invalidError = await initiatePaymentAttempt(attempt.attemptId, 3, "approve").catch(
      (caught: unknown) => caught
    );
    expect((invalidError as PaymentApiError).kind).toBe("invalid-response");
  });

  it("rejects a success payload that does not match the contract", async () => {
    const invalidPayloads = [
      { ...attempt, status: "settled" },
      { ...attempt, cartRevision: 1.5 },
      { ...attempt, extra: true },
      { ...attempt, items: [{ ...attempt.items[0], quantity: 0 }] },
      { ...attempt, total: "25.00" }
    ];

    for (const payload of invalidPayloads) {
      vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(response(201, payload))));

      const error = await initiatePaymentAttempt(attempt.attemptId, 3, "approve").catch(
        (caught: unknown) => caught
      );

      expect((error as PaymentApiError).kind).toBe("invalid-response");
    }
  });
});
