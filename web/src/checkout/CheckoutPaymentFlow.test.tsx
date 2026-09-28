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
});

function response(status: number, body?: unknown): Response {
  return {
    status,
    json: async () => body
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
      return Promise.resolve(overrides.payment ? overrides.payment() : response(201, approvedAttempt));
    }

    if (path.startsWith("/api/payment-attempts/") && options === undefined) {
      return Promise.resolve(
        overrides.paymentResult ? overrides.paymentResult() : response(200, approvedAttempt)
      );
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

function latestPaymentLookup(fetchMock: ReturnType<typeof createFetchMock>) {
  return fetchMock.mock.calls
    .filter(([input]) => String(input).startsWith("/api/payment-attempts/"))
    .at(-1);
}

describe("Checkout simulated payment flow", () => {
  it("initiates an approved simulated payment against the reviewed revision", async () => {
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

    fireEvent.click(screen.getByRole("button", { name: "Back to Checkout" }));

    const checkoutHeading = await screen.findByRole("heading", { name: "Checkout", level: 1 });
    await waitFor(() => expect(checkoutHeading).toHaveFocus());
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

  it("treats a lost response as unconfirmed and reconciles the original attempt", async () => {
    const fetchMock = createFetchMock({
      payment: () => Promise.reject(new Error("connection lost")),
      paymentResult: () => Promise.resolve(response(200, approvedAttempt))
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    await enterCheckout();
    fireEvent.click(screen.getByRole("button", { name: "Simulate payment" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We could not confirm the payment result."
    );
    expect(
      screen.queryByRole("heading", { name: "Simulated payment approved", level: 1 })
    ).not.toBeInTheDocument();

    const attemptId = paymentRequestBody(fetchMock).attemptId;
    fireEvent.click(screen.getByRole("button", { name: "Check result" }));

    const heading = await screen.findByRole("heading", { name: "Simulated payment approved", level: 1 });
    await waitFor(() => expect(heading).toHaveFocus());

    const lookup = fetchMock.mock.calls.find(([input]) =>
      String(input).startsWith("/api/payment-attempts/")
    );
    expect(String(lookup?.[0])).toBe(`/api/payment-attempts/${attemptId}`);
  });

  it("reloads the Cart and asks for a new attempt when the result is gone after a restart", async () => {
    let cartCalls = 0;
    const fetchMock = createFetchMock({
      cart: () => {
        cartCalls += 1;
        return Promise.resolve(response(200, cartCalls === 1 ? cartWithTote : emptyCart));
      },
      payment: () => Promise.reject(new Error("connection lost")),
      paymentResult: () => Promise.resolve(response(404))
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    await enterCheckout();
    fireEvent.click(screen.getByRole("button", { name: "Simulate payment" }));
    await screen.findByRole("alert");

    fireEvent.click(screen.getByRole("button", { name: "Check result" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("no longer available")
    );
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.filter(
          ([input, options]) => String(input) === "/api/cart" && options === undefined
        ).length
      ).toBeGreaterThanOrEqual(2)
    );
    expect(
      screen.queryByRole("heading", { level: 1, name: /Simulated payment/ })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Your Cart is empty.", level: 2 })).toBeInTheDocument();
  });

  it("reports a stale Cart revision and refreshes the Cart for review", async () => {
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
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.filter(
          ([input, options]) => String(input) === "/api/cart" && options === undefined
        ).length
      ).toBeGreaterThanOrEqual(2)
    );
    expect(
      screen.queryByRole("heading", { level: 1, name: /Simulated payment/ })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Simulate payment" })).toBeEnabled();
  });

  it("shows the existing result for an already-approved revision", async () => {
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
    expect(screen.getByText(/No Order has been created/i)).toBeInTheDocument();
    expect(screen.getByText("Canvas Tote × 2")).toBeInTheDocument();
    expect(screen.getByText("Captured total").parentElement).toHaveTextContent("25.00");

    const lookup = fetchMock.mock.calls.find(([input]) =>
      String(input).startsWith("/api/payment-attempts/")
    );
    expect(String(lookup?.[0])).toBe(`/api/payment-attempts/${approvedAttempt.attemptId}`);
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
    expect(screen.queryByRole("button", { name: "Check result" })).not.toBeInTheDocument();
  });

  it("disables payment and editing while the attempt is in flight and ignores duplicate clicks", async () => {
    let resolvePayment: (value: Response) => void = () => {};
    const pendingPayment = new Promise<Response>((resolve) => {
      resolvePayment = resolve;
    });
    const fetchMock = createFetchMock({ payment: () => pendingPayment });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    await enterCheckout();
    fireEvent.click(screen.getByRole("button", { name: "Simulate payment" }));

    expect(screen.getByRole("status")).toHaveTextContent("Simulating payment...");
    expect(screen.getByRole("button", { name: "Simulate payment" })).toBeDisabled();
    expect(screen.getByLabelText("Demo outcome")).toBeDisabled();
    expect(screen.getByLabelText("Quantity for Canvas Tote")).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Simulate payment" }));

    resolvePayment(response(201, declinedAttempt));

    await screen.findByRole("heading", { name: "Simulated payment declined", level: 1 });
    const posts = fetchMock.mock.calls.filter(
      ([input, options]) => String(input) === "/api/payment-attempts" && options?.method === "POST"
    );
    expect(posts).toHaveLength(1);
  });

  it("blocks a new attempt while a result is unconfirmed and keeps Check result available", async () => {
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

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We could not confirm the payment result."
    );
    const attemptId = paymentRequestBody(fetchMock).attemptId;
    const simulate = screen.getByRole("button", { name: "Simulate payment" });
    expect(simulate).toBeDisabled();
    fireEvent.click(simulate);
    expect(countPaymentPosts(fetchMock)).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: "Check result" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Check result" })).toBeEnabled());
    expect(screen.getByRole("button", { name: "Simulate payment" })).toBeDisabled();
    expect(countPaymentPosts(fetchMock)).toBe(1);
    expect(String(latestPaymentLookup(fetchMock)?.[0])).toBe(`/api/payment-attempts/${attemptId}`);

    fireEvent.click(screen.getByRole("button", { name: "Increase quantity for Canvas Tote" }));

    expect(await screen.findByText("Cart updated.")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "We could not confirm the payment result."
    );
    expect(screen.getByRole("button", { name: "Check result" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Simulate payment" })).toBeDisabled();

    resultUnavailable = false;
    fireEvent.click(screen.getByRole("button", { name: "Check result" }));

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

  it("keeps the user in Checkout while an attempt is in flight", async () => {
    let resolvePayment: (value: Response) => void = () => {};
    const pendingPayment = new Promise<Response>((resolve) => {
      resolvePayment = resolve;
    });
    const fetchMock = createFetchMock({ payment: () => pendingPayment });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    await enterCheckout();
    expect(screen.getByRole("button", { name: "Back to Market" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Simulate payment" }));

    const backToMarket = screen.getByRole("button", { name: "Back to Market" });
    expect(backToMarket).toBeDisabled();
    fireEvent.click(backToMarket);
    expect(screen.getByRole("heading", { name: "Checkout", level: 1 })).toBeInTheDocument();

    resolvePayment(response(201, declinedAttempt));

    await screen.findByRole("heading", { name: "Simulated payment declined", level: 1 });
  });

  it("preserves an unconfirmed attempt across Back to Market and Checkout reopen", async () => {
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

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We could not confirm the payment result."
    );
    const attemptId = paymentRequestBody(fetchMock).attemptId;

    fireEvent.click(screen.getByRole("button", { name: "Back to Market" }));
    expect(await screen.findByRole("heading", { name: "Products" })).toBeInTheDocument();

    await enterCheckout();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "We could not confirm the payment result."
    );
    expect(screen.getByRole("button", { name: "Check result" })).toBeInTheDocument();
    const simulate = screen.getByRole("button", { name: "Simulate payment" });
    expect(simulate).toBeDisabled();
    fireEvent.click(simulate);
    expect(countPaymentPosts(fetchMock)).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: "Check result" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Check result" })).toBeEnabled());
    expect(String(latestPaymentLookup(fetchMock)?.[0])).toBe(`/api/payment-attempts/${attemptId}`);
    expect(screen.getByRole("button", { name: "Simulate payment" })).toBeDisabled();
    expect(countPaymentPosts(fetchMock)).toBe(1);

    resultUnavailable = false;
    fireEvent.click(screen.getByRole("button", { name: "Check result" }));

    await screen.findByRole("heading", { name: "Simulated payment approved", level: 1 });
    expect(countPaymentPosts(fetchMock)).toBe(1);
    expect(String(latestPaymentLookup(fetchMock)?.[0])).toBe(`/api/payment-attempts/${attemptId}`);
  });
});
