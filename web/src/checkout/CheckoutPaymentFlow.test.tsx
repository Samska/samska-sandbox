import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Catalog from "../catalog/Catalog";

const product = {
  id: "f84c1a1d-6d7a-4c07-b40f-3c5ca66ab612",
  name: "Canvas Tote",
  description: "A sturdy everyday tote for groceries and market runs.",
  price: 12.5,
  mediaKey: null,
  uploadedMediaId: null
};

const toteItem = {
  productId: product.id,
  name: product.name,
  quantity: 2,
  unitPrice: 12.5,
  lineSubtotal: 25
};

const cartWithTote = { items: [toteItem], total: 25, revision: 1 };
const emptyCart = { items: [], total: 0, revision: 0 };

const approvedAttempt = {
  attemptId: "aaaaaaaa-1111-1111-1111-111111111111",
  status: "approved",
  cartRevision: 1,
  items: [toteItem],
  total: 25
};

const declinedAttempt = { ...approvedAttempt, status: "declined" };

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
  window.sessionStorage.clear();
});

function response(status: number, body?: unknown): Response {
  return {
    status,
    json: async () => body
  } as Response;
}

async function withAttemptId(result: Response, attemptId: string): Promise<Response> {
  if (result.status !== 200 && result.status !== 201) {
    return result;
  }

  let payload: unknown;

  try {
    payload = await result.json();
  } catch {
    return result;
  }

  if (typeof payload !== "object" || payload === null) {
    return result;
  }

  return {
    status: result.status,
    json: async () => ({ ...(payload as Record<string, unknown>), attemptId })
  } as Response;
}

function createFetchMock(overrides: {
  cart?: () => Promise<Response>;
  cartMutation?: () => Promise<Response>;
  payment?: () => Promise<Response>;
  paymentResult?: () => Promise<Response>;
} = {}) {
  return vi.fn((input: RequestInfo | URL, options?: RequestInit) => {
    const path = String(input);

    if (path === "/api/products" && options === undefined) {
      return Promise.resolve(response(200, [product]));
    }

    if (path === "/api/cart" && options === undefined) {
      return Promise.resolve(overrides.cart ? overrides.cart() : response(200, cartWithTote));
    }

    if (path === "/api/payment-attempts" && options?.method === "POST") {
      const body = JSON.parse(String(options.body)) as { attemptId: string };
      return Promise.resolve(overrides.payment ? overrides.payment() : response(201, approvedAttempt)).then(
        (result) => withAttemptId(result, body.attemptId)
      );
    }

    if (path.startsWith("/api/payment-attempts/") && options === undefined) {
      const attemptId = path.split("/").at(-1) ?? "";
      return Promise.resolve(
        overrides.paymentResult ? overrides.paymentResult() : response(200, approvedAttempt)
      ).then((result) => withAttemptId(result, attemptId));
    }

    if (path.startsWith("/api/orders/payment-attempts/") && options === undefined) {
      return Promise.resolve(response(404));
    }

    if (path.startsWith("/api/cart/items")) {
      return Promise.resolve(
        overrides.cartMutation ? overrides.cartMutation() : response(200, cartWithTote)
      );
    }

    return Promise.resolve(response(200, emptyCart));
  });
}

async function enterCheckout() {
  fireEvent.click(await screen.findByRole("button", { expanded: false }));
  fireEvent.click(await screen.findByRole("button", { name: "Checkout" }));

  return screen.findByRole("heading", { name: "Checkout", level: 1 });
}

function paymentRequestBody(fetchMock: ReturnType<typeof createFetchMock>) {
  const call = fetchMock.mock.calls.find(
    ([input, options]) => String(input) === "/api/payment-attempts" && options?.method === "POST"
  );
  const body = call?.[1]?.body;

  return JSON.parse(String(body)) as { attemptId: string; cartRevision: number; scenario: string };
}

function countPaymentPosts(fetchMock: ReturnType<typeof createFetchMock>) {
  return fetchMock.mock.calls.filter(
    ([input, options]) => String(input) === "/api/payment-attempts" && options?.method === "POST"
  ).length;
}

function countPaymentLookups(fetchMock: ReturnType<typeof createFetchMock>) {
  return fetchMock.mock.calls.filter(
    ([input, options]) => String(input).startsWith("/api/payment-attempts/") && options === undefined
  ).length;
}

function latestPaymentLookup(fetchMock: ReturnType<typeof createFetchMock>) {
  return fetchMock.mock.calls
    .filter(([input, options]) => String(input).startsWith("/api/payment-attempts/") && options === undefined)
    .at(-1);
}

describe("Checkout simulated payment flow", () => {
  it("initiates an approved simulated payment against the reviewed revision and addresses the attempt URL", async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    await enterCheckout();
    fireEvent.click(screen.getByRole("button", { name: "Simulate payment" }));

    const heading = await screen.findByRole("heading", { name: "Simulated payment approved", level: 1 });
    await waitFor(() => expect(heading).toHaveFocus());
    expect(screen.getByText(/No real payment was made/i)).toBeInTheDocument();
    expect(screen.getByText(/No Order has been created/i)).toBeInTheDocument();
    expect(screen.getByText("Captured total").parentElement).toHaveTextContent("25.00");

    const body = paymentRequestBody(fetchMock);
    expect(body.cartRevision).toBe(1);
    expect(body.scenario).toBe("approve");
    expect(body.attemptId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(window.location.pathname).toBe(`/checkout/attempts/${body.attemptId}`);
    expect(window.sessionStorage.getItem("samska.latest-payment-attempt")).toBe(body.attemptId);
    expect(countPaymentLookups(fetchMock)).toBe(0);

    fireEvent.click(screen.getByRole("button", { name: "Back to Checkout" }));

    const checkoutHeading = await screen.findByRole("heading", { name: "Checkout", level: 1 });
    await waitFor(() => expect(checkoutHeading).toHaveFocus());
    expect(window.location.pathname).toBe("/checkout");
  });

  it("lets the customer select decline and try again with the current Cart", async () => {
    const fetchMock = createFetchMock({
      payment: () => Promise.resolve(response(201, declinedAttempt))
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    await enterCheckout();
    fireEvent.change(screen.getByLabelText("Demo outcome"), { target: { value: "decline" } });
    fireEvent.click(screen.getByRole("button", { name: "Simulate payment" }));

    expect(
      await screen.findByRole("heading", { name: "Simulated payment declined", level: 1 })
    ).toBeInTheDocument();
    expect(paymentRequestBody(fetchMock).scenario).toBe("decline");

    fireEvent.click(screen.getByRole("button", { name: "Try again with the current Cart" }));

    expect(await screen.findByRole("heading", { name: "Checkout", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Simulate payment" })).toBeEnabled();
  });

  it("treats a lost response as unconfirmed and reconciles only on an explicit check", async () => {
    const fetchMock = createFetchMock({
      payment: () => Promise.reject(new Error("connection lost")),
      paymentResult: () => Promise.resolve(response(200, approvedAttempt))
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    await enterCheckout();
    fireEvent.click(screen.getByRole("button", { name: "Simulate payment" }));

    const uncertainHeading = await screen.findByRole("heading", {
      name: "Payment result is unconfirmed. Check this attempt before trying again.",
      level: 1
    });
    expect(uncertainHeading).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Simulated payment approved", level: 1 })
    ).not.toBeInTheDocument();

    const attemptId = paymentRequestBody(fetchMock).attemptId;
    expect(window.location.pathname).toBe(`/checkout/attempts/${attemptId}`);
    expect(countPaymentLookups(fetchMock)).toBe(0);

    fireEvent.click(screen.getByRole("button", { name: "Check this attempt" }));

    const heading = await screen.findByRole("heading", { name: "Simulated payment approved", level: 1 });
    await waitFor(() => expect(heading).toHaveFocus());

    expect(String(latestPaymentLookup(fetchMock)?.[0])).toBe(`/api/payment-attempts/${attemptId}`);
    expect(countPaymentPosts(fetchMock)).toBe(1);
  });

  it("keeps an unavailable reference unresolved and requires explicit abandonment before a new attempt", async () => {
    let cartCalls = 0;
    const fetchMock = createFetchMock({
      cart: () => {
        cartCalls += 1;
        return Promise.resolve(response(200, cartCalls === 1 ? cartWithTote : cartWithTote));
      },
      payment: () => Promise.reject(new Error("connection lost")),
      paymentResult: () => Promise.resolve(response(404))
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    await enterCheckout();
    fireEvent.click(screen.getByRole("button", { name: "Simulate payment" }));
    await screen.findByRole("heading", {
      name: "Payment result is unconfirmed. Check this attempt before trying again.",
      level: 1
    });

    fireEvent.click(screen.getByRole("button", { name: "Check this attempt" }));

    expect(
      await screen.findByRole("heading", {
        name: "We couldn't confirm a result for this reference.",
        level: 1
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/does not tell us why it is unavailable/i)).toBeInTheDocument();

    const attemptId = paymentRequestBody(fetchMock).attemptId;

    fireEvent.click(screen.getByRole("button", { name: "Back to Checkout" }));
    await screen.findByRole("heading", { name: "Checkout", level: 1 });

    const blockedSimulate = screen.getByRole("button", { name: "Simulate payment" });
    expect(blockedSimulate).toBeDisabled();
    fireEvent.click(blockedSimulate);
    expect(countPaymentPosts(fetchMock)).toBe(1);
    expect(screen.getByRole("button", { name: "View attempt" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "View attempt" }));
    await screen.findByRole("heading", {
      name: "We couldn't confirm a result for this reference.",
      level: 1
    });
    expect(window.location.pathname).toBe(`/checkout/attempts/${attemptId}`);

    fireEvent.click(screen.getByRole("button", { name: "Stop following this reference" }));
    expect(screen.getByText(/does not cancel a request or delete a record/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Stop following" }));

    await waitFor(() => expect(window.location.pathname).toBe("/checkout"));
    expect(window.sessionStorage.getItem("samska.latest-payment-attempt")).toBeNull();
    expect(countPaymentPosts(fetchMock)).toBe(1);

    const reloadedSimulate = await screen.findByRole("button", { name: "Simulate payment" });
    await waitFor(() => expect(reloadedSimulate).toBeEnabled());
    expect(screen.queryByRole("button", { name: "View attempt" })).not.toBeInTheDocument();
  });

  it("reports a stale Cart revision on Checkout without leaving a phantom attempt", async () => {
    const fetchMock = createFetchMock({
      payment: () => Promise.resolve(response(409, { code: "cart-changed" }))
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    await enterCheckout();
    fireEvent.click(screen.getByRole("button", { name: "Simulate payment" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The Cart changed since you reviewed it."
    );
    await waitFor(() => expect(window.location.pathname).toBe("/checkout"));
    expect(window.sessionStorage.getItem("samska.latest-payment-attempt")).toBeNull();
    expect(
      screen.queryByRole("heading", { level: 1, name: /Simulated payment/ })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Simulate payment" })).toBeEnabled();
  });

  it("aligns the URL and latest reference with an already-approved existing attempt", async () => {
    const fetchMock = createFetchMock({
      payment: () =>
        Promise.resolve(
          response(409, { code: "already-approved", attemptId: approvedAttempt.attemptId })
        ),
      paymentResult: () => Promise.resolve(response(200, approvedAttempt))
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    await enterCheckout();
    fireEvent.click(screen.getByRole("button", { name: "Simulate payment" }));

    const heading = await screen.findByRole("heading", { name: "Simulated payment approved", level: 1 });
    await waitFor(() => expect(heading).toHaveFocus());
    expect(screen.getByText("Canvas Tote × 2")).toBeInTheDocument();

    const body = paymentRequestBody(fetchMock);
    expect(body.attemptId).not.toBe(approvedAttempt.attemptId);
    expect(window.location.pathname).toBe(`/checkout/attempts/${approvedAttempt.attemptId}`);
    expect(window.sessionStorage.getItem("samska.latest-payment-attempt")).toBe(
      approvedAttempt.attemptId
    );
    expect(String(latestPaymentLookup(fetchMock)?.[0])).toBe(
      `/api/payment-attempts/${approvedAttempt.attemptId}`
    );
    expect(countPaymentPosts(fetchMock)).toBe(1);
  });

  it("explains a full simulator without making a new decision", async () => {
    const fetchMock = createFetchMock({
      payment: () => Promise.resolve(response(503, { code: "attempt-capacity-exceeded" }))
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    await enterCheckout();
    fireEvent.click(screen.getByRole("button", { name: "Simulate payment" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Payment simulator is full");
    expect(screen.getByText(/Restart the local backend/)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 1, name: /Simulated payment/ })
    ).not.toBeInTheDocument();
    expect(window.location.pathname).toBe("/checkout");
    expect(countPaymentLookups(fetchMock)).toBe(0);
    expect(screen.getByRole("button", { name: "Simulate payment" })).toBeEnabled();
  });

  it("keeps a pending attempt pending across navigation and never duplicates the POST", async () => {
    let resolvePayment: (value: Response) => void = () => {};
    const pendingPayment = new Promise<Response>((resolve) => {
      resolvePayment = resolve;
    });
    const fetchMock = createFetchMock({ payment: () => pendingPayment });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    await enterCheckout();
    fireEvent.click(screen.getByRole("button", { name: "Simulate payment" }));

    expect(await screen.findByRole("heading", { name: "Payment in progress", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Simulating payment...");
    expect(countPaymentPosts(fetchMock)).toBe(1);
    expect(countPaymentLookups(fetchMock)).toBe(0);

    fireEvent.click(screen.getByRole("button", { name: "Back to Market" }));

    expect(await screen.findByRole("heading", { name: "Products", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View latest journey" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "View latest journey" }));

    expect(await screen.findByRole("heading", { name: "Payment in progress", level: 1 })).toBeInTheDocument();
    expect(countPaymentPosts(fetchMock)).toBe(1);

    resolvePayment(response(201, declinedAttempt));

    expect(
      await screen.findByRole("heading", { name: "Simulated payment declined", level: 1 })
    ).toBeInTheDocument();
    expect(countPaymentPosts(fetchMock)).toBe(1);
    expect(countPaymentLookups(fetchMock)).toBe(0);
  });

  it("preserves an unconfirmed attempt across navigation and blocks a replacement until resolved", async () => {
    let resultUnavailable = true;
    const fetchMock = createFetchMock({
      payment: () => Promise.reject(new Error("connection lost")),
      paymentResult: () =>
        resultUnavailable
          ? Promise.reject(new Error("still unreachable"))
          : Promise.resolve(response(200, approvedAttempt))
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    await enterCheckout();
    fireEvent.click(screen.getByRole("button", { name: "Simulate payment" }));

    await screen.findByRole("heading", {
      name: "Payment result is unconfirmed. Check this attempt before trying again.",
      level: 1
    });
    const attemptId = paymentRequestBody(fetchMock).attemptId;

    fireEvent.click(screen.getByRole("button", { name: "Back to Market" }));
    expect(await screen.findByRole("heading", { name: "Products", level: 1 })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "View latest journey" }));
    expect(
      await screen.findByRole("heading", {
        name: "Payment result is unconfirmed. Check this attempt before trying again.",
        level: 1
      })
    ).toBeInTheDocument();
    expect(countPaymentPosts(fetchMock)).toBe(1);
    expect(countPaymentLookups(fetchMock)).toBe(0);

    fireEvent.click(screen.getByRole("button", { name: "Check this attempt" }));

    expect(
      await screen.findByRole("heading", { name: "We couldn't check this reference. Try again.", level: 1 })
    ).toBeInTheDocument();
    expect(countPaymentPosts(fetchMock)).toBe(1);

    resultUnavailable = false;
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    await screen.findByRole("heading", { name: "Simulated payment approved", level: 1 });
    expect(countPaymentPosts(fetchMock)).toBe(1);
    expect(String(latestPaymentLookup(fetchMock)?.[0])).toBe(`/api/payment-attempts/${attemptId}`);
  });

  it("blocks a new attempt after a failed Cart mutation until the Cart reloads", async () => {
    const fetchMock = createFetchMock({
      cartMutation: () => Promise.resolve(response(500)),
      payment: () => Promise.resolve(response(201, approvedAttempt))
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    await enterCheckout();
    fireEvent.click(screen.getByRole("button", { name: "Increase quantity for Canvas Tote" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The Cart service failed. Try again."
    );
    const simulate = screen.getByRole("button", { name: "Simulate payment" });
    expect(simulate).toBeDisabled();
    fireEvent.click(simulate);
    expect(countPaymentPosts(fetchMock)).toBe(0);

    fireEvent.click(screen.getByRole("button", { name: "Reload Cart" }));

    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    const reloadedSimulate = screen.getByRole("button", { name: "Simulate payment" });
    expect(reloadedSimulate).toBeEnabled();

    fireEvent.click(reloadedSimulate);

    await screen.findByRole("heading", { name: "Simulated payment approved", level: 1 });
    expect(countPaymentPosts(fetchMock)).toBe(1);
  });
});
