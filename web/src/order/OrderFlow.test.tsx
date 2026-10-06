import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Catalog from "../catalog/Catalog";

const product = {
  id: "f84c1a1d-6d7a-4c07-b40f-3c5ca66ab612", name: "Canvas Tote",
  description: "Synthetic tote", price: 12.5, mediaKey: null, uploadedMediaId: null
};
const item = { productId: product.id, name: product.name, quantity: 2, unitPrice: 12.5, lineSubtotal: 25 };
const cart = { revision: 1, items: [item], total: 25 };
const attemptId = "aaaaaaaa-1111-1111-1111-111111111111";
const attempt = { attemptId, status: "approved", cartRevision: 1, items: [item], total: 25 };
const order = { orderId: "bbbbbbbb-2222-2222-2222-222222222222", paymentAttemptId: attemptId,
  cartRevision: 1, items: [item], total: 25 };

function response(status: number, body?: unknown): Response {
  return { status, json: async () => body } as Response;
}

function setup(overrides: {
  post?: (id: string) => Promise<Response>;
  lookup?: () => Promise<Response>;
  paymentLookup?: (id: string) => Promise<Response>;
} = {}) {
  const fetchMock = vi.fn((input: RequestInfo | URL, options?: RequestInit) => {
    const path = String(input);
    if (path === "/api/products") return Promise.resolve(response(200, [product]));
    if (path === "/api/cart") return Promise.resolve(response(200, cart));
    if (path === "/api/payment-attempts" && options?.method === "POST") {
      const body = JSON.parse(String(options.body)) as { attemptId: string };
      return Promise.resolve(response(201, { ...attempt, attemptId: body.attemptId }));
    }
    if (path.startsWith("/api/payment-attempts/")) {
      const id = path.split("/").at(-1) ?? "";
      return overrides.paymentLookup?.(id) ?? Promise.resolve(response(200, { ...attempt, attemptId: id }));
    }
    if (path === "/api/orders" && options?.method === "POST") {
      const id = (JSON.parse(String(options.body)) as { paymentAttemptId: string }).paymentAttemptId;
      return overrides.post?.(id) ?? Promise.resolve(response(201, { ...order, paymentAttemptId: id }));
    }
    if (path.startsWith("/api/orders/payment-attempts/")) {
      return overrides.lookup?.() ?? Promise.resolve(response(200, { ...order, paymentAttemptId: path.split("/").at(-1) }));
    }
    throw new Error(`Unexpected fetch: ${path}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  render(<Catalog />);
  return fetchMock;
}

async function approve() {
  fireEvent.click(await screen.findByRole("button", { expanded: false }));
  fireEvent.click(screen.getByRole("button", { name: "Checkout" }));
  await screen.findByRole("heading", { name: "Checkout", level: 1 });
  fireEvent.click(screen.getByRole("button", { name: "Simulate payment" }));
  await screen.findByRole("heading", { name: "Simulated payment approved", level: 1 });
}

function attemptIdFromPath(): string {
  return window.location.pathname.split("/").at(-1) ?? "";
}

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
  window.sessionStorage.clear();
});

describe("Order creation from a confirmed approved payment", () => {
  it("uses only the payment attempt ID and presents the frozen Order at the attempt URL", async () => {
    const fetchMock = setup();
    await approve();
    const approvedAttemptId = attemptIdFromPath();
    expect(approvedAttemptId).toMatch(/^[0-9a-f-]{36}$/);

    fireEvent.click(screen.getByRole("button", { name: "Create Order" }));
    const heading = await screen.findByRole("heading", { name: "Order created", level: 1 });
    await waitFor(() => expect(heading).toHaveFocus());
    expect(screen.getByText(/No real payment was made/)).toBeInTheDocument();
    expect(screen.getByText(/was not cleared/)).toBeInTheDocument();
    expect(screen.getByText(/Order total: 25.00/)).toBeInTheDocument();
    expect(window.location.pathname).toBe(`/checkout/attempts/${approvedAttemptId}`);

    const posts = fetchMock.mock.calls.filter(([path, options]) => path === "/api/orders" && options?.method === "POST");
    expect(posts).toHaveLength(1);
    expect(JSON.parse(String(posts[0]?.[1]?.body))).toEqual({ paymentAttemptId: approvedAttemptId });

    fireEvent.click(screen.getByRole("button", { name: "Back to Market" }));
    await screen.findByRole("heading", { name: "Products", level: 1 });
    fireEvent.click(screen.getByRole("link", { name: "View latest journey" }));
    expect(await screen.findByRole("heading", { name: "Order created", level: 1 })).toBeInTheDocument();
    expect(window.location.pathname).toBe(`/checkout/attempts/${approvedAttemptId}`);
  });

  it("treats a lost POST as unconfirmed until the original Order is found by attempt", async () => {
    const fetchMock = setup({ post: () => Promise.reject(new Error("lost")) });
    await approve();
    fireEvent.click(screen.getByRole("button", { name: "Create Order" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("could not confirm whether an Order was created");
    expect(screen.getByRole("button", { name: "Create Order" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Back to Market" }));
    await screen.findByRole("heading", { name: "Products", level: 1 });
    fireEvent.click(screen.getByRole("link", { name: "View latest journey" }));
    fireEvent.click(await screen.findByRole("button", { name: "Check Order result" }));

    expect(await screen.findByRole("heading", { name: "Order created", level: 1 })).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([path]) => path === "/api/orders")).toHaveLength(1);
  });

  it("requires the Payment lookup after an Order 404 before offering an explicit same-ID POST", async () => {
    const fetchMock = setup({ post: () => Promise.reject(new Error("lost")), lookup: () => Promise.resolve(response(404)) });
    await approve();
    fireEvent.click(screen.getByRole("button", { name: "Create Order" }));
    await screen.findByRole("button", { name: "Check Order result" });
    fireEvent.click(screen.getByRole("button", { name: "Check Order result" }));
    expect(await screen.findByRole("button", { name: "Create Order with same attempt" })).toBeEnabled();
    expect(fetchMock.mock.calls.some(([path]) => String(path).startsWith("/api/payment-attempts/"))).toBe(true);
    expect(fetchMock.mock.calls.filter(([path]) => path === "/api/orders")).toHaveLength(1);
  });

  it("explicitly retries with the identical source ID after both lookups", async () => {
    let requests = 0;
    const fetchMock = setup({
      post: (id) => ++requests === 1 ? Promise.reject(new Error("lost")) :
        Promise.resolve(response(200, { ...order, paymentAttemptId: id })),
      lookup: () => Promise.resolve(response(404))
    });
    await approve();
    fireEvent.click(screen.getByRole("button", { name: "Create Order" }));
    fireEvent.click(await screen.findByRole("button", { name: "Check Order result" }));
    fireEvent.click(await screen.findByRole("button", { name: "Create Order with same attempt" }));
    expect(await screen.findByRole("heading", { name: "Order created", level: 1 })).toBeInTheDocument();
    const posts = fetchMock.mock.calls.filter(([path]) => path === "/api/orders");
    expect(posts).toHaveLength(2);
    expect(posts[0]?.[1]?.body).toBe(posts[1]?.[1]?.body);
  });

  it("does not offer another POST after two 404 lookups and keeps an explicit way out", async () => {
    const fetchMock = setup({ post: () => Promise.reject(new Error("lost")), lookup: () => Promise.resolve(response(404)),
      paymentLookup: () => Promise.resolve(response(404)) });
    await approve();
    fireEvent.click(screen.getByRole("button", { name: "Create Order" }));
    fireEvent.click(await screen.findByRole("button", { name: "Check Order result" }));
    expect(await screen.findByText(/approved payment attempt cannot be confirmed/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create Order with same attempt" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stop following this reference" })).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([path]) => path === "/api/orders")).toHaveLength(1);
  });

  it("shows the final declined result instead of offering an Order", async () => {
    const fetchMock = setup({
      post: () => Promise.reject(new Error("lost")),
      lookup: () => Promise.resolve(response(404)),
      paymentLookup: (id) => Promise.resolve(response(200, { ...attempt, attemptId: id, status: "declined" }))
    });
    await approve();
    fireEvent.click(screen.getByRole("button", { name: "Create Order" }));
    fireEvent.click(await screen.findByRole("button", { name: "Check Order result" }));

    expect(
      await screen.findByRole("heading", { name: "Simulated payment declined", level: 1 })
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create Order" })).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([path]) => path === "/api/orders")).toHaveLength(1);
  });

  it("retains uncertainty when Payment lookup fails after Order 404", async () => {
    setup({ post: () => Promise.reject(new Error("lost")), lookup: () => Promise.resolve(response(404)),
      paymentLookup: () => Promise.reject(new Error("offline")) });
    await approve();
    fireEvent.click(screen.getByRole("button", { name: "Create Order" }));
    fireEvent.click(await screen.findByRole("button", { name: "Check Order result" }));
    expect(await screen.findByRole("button", { name: "Check Order result" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Create Order" })).toBeDisabled();
  });

  it("shows a definitive capacity refusal without issuing a second POST", async () => {
    const fetchMock = setup({ post: () => Promise.resolve(response(503, { code: "order-capacity-exceeded" })) });
    await approve();
    fireEvent.click(screen.getByRole("button", { name: "Create Order" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("local Order store is full");
    expect(screen.getByRole("button", { name: "Create Order" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Check Order result" })).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([path]) => path === "/api/orders")).toHaveLength(1);
  });

  it("blocks a new payment while an approved attempt awaits its Order and unblocks after the Order", async () => {
    const fetchMock = setup();
    await approve();
    const approvedAttemptId = attemptIdFromPath();

    fireEvent.click(screen.getByRole("button", { name: "Back to Checkout" }));
    await screen.findByRole("heading", { name: "Checkout", level: 1 });
    expect(screen.getByRole("alert")).toHaveTextContent("awaiting its Order");
    const simulate = screen.getByRole("button", { name: "Simulate payment" });
    expect(simulate).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "View attempt" }));
    fireEvent.click(await screen.findByRole("button", { name: "Create Order" }));
    await screen.findByRole("heading", { name: "Order created", level: 1 });

    fireEvent.click(screen.getByRole("button", { name: "Back to Checkout" }));
    await screen.findByRole("heading", { name: "Checkout", level: 1 });
    expect(screen.getByRole("button", { name: "Simulate payment" })).toBeEnabled();
    expect(fetchMock.mock.calls.filter(([path]) => path === "/api/orders")).toHaveLength(1);
    expect(window.sessionStorage.getItem("samska.latest-payment-attempt")).toBe(approvedAttemptId);
  });

  it("requires an explicit choice to leave an approved journey without an Order", async () => {
    const fetchMock = setup();
    await approve();
    fireEvent.click(screen.getByRole("button", { name: "Back to Checkout" }));
    await screen.findByRole("heading", { name: "Checkout", level: 1 });

    fireEvent.click(screen.getByRole("button", { name: "View attempt" }));
    fireEvent.click(await screen.findByRole("button", { name: "Stop following this reference" }));
    expect(screen.getByText(/does not cancel a request or delete a record/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Stop following" }));

    await waitFor(() => expect(window.location.pathname).toBe("/checkout"));
    expect(window.sessionStorage.getItem("samska.latest-payment-attempt")).toBeNull();
    const reloadedSimulate = await screen.findByRole("button", { name: "Simulate payment" });
    await waitFor(() => expect(reloadedSimulate).toBeEnabled());
    expect(fetchMock.mock.calls.filter(([path]) => path === "/api/orders")).toHaveLength(0);
    expect(
      fetchMock.mock.calls.some(([, options]) => options?.method === "DELETE")
    ).toBe(false);
  });

  it("retains a successful Order created while the user navigates away", async () => {
    let resolvePost: (value: Response) => void = () => {};
    const pendingPost = new Promise<Response>((resolve) => {
      resolvePost = resolve;
    });
    const fetchMock = setup({ post: () => pendingPost });
    await approve();
    const approvedAttemptId = attemptIdFromPath();

    fireEvent.click(screen.getByRole("button", { name: "Create Order" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Checking Order...");

    window.history.replaceState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await screen.findByRole("heading", { name: "Products", level: 1 });

    await act(async () => {
      resolvePost(response(201, { ...order, paymentAttemptId: approvedAttemptId }));
      await pendingPost;
    });

    window.history.replaceState({}, "", `/checkout/attempts/${approvedAttemptId}`);
    window.dispatchEvent(new PopStateEvent("popstate"));

    expect(await screen.findByRole("heading", { name: "Order created", level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Order total: 25.00/)).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.filter(([path, options]) => path === "/api/orders" && options?.method === "POST")
    ).toHaveLength(1);
    expect(
      fetchMock.mock.calls.some(([path]) => String(path).startsWith("/api/orders/payment-attempts/"))
    ).toBe(false);
  });

  it("retains an unconfirmed Order outcome across navigation and requires reconciliation", async () => {
    let rejectPost: (reason: Error) => void = () => {};
    const pendingPost = new Promise<Response>((_, reject) => {
      rejectPost = reject;
    });
    const fetchMock = setup({ post: () => pendingPost });
    await approve();
    const approvedAttemptId = attemptIdFromPath();

    fireEvent.click(screen.getByRole("button", { name: "Create Order" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Checking Order...");

    window.history.replaceState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await screen.findByRole("heading", { name: "Products", level: 1 });

    await act(async () => {
      rejectPost(new Error("lost"));
      await pendingPost.catch(() => undefined);
    });

    window.history.replaceState({}, "", `/checkout/attempts/${approvedAttemptId}`);
    window.dispatchEvent(new PopStateEvent("popstate"));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "could not confirm whether an Order was created"
    );
    expect(screen.getByRole("button", { name: "Create Order" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Create Order" }));
    expect(
      fetchMock.mock.calls.filter(([path, options]) => path === "/api/orders" && options?.method === "POST")
    ).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Check Order result" }));

    expect(await screen.findByRole("heading", { name: "Order created", level: 1 })).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.filter(([path, options]) => path === "/api/orders" && options?.method === "POST")
    ).toHaveLength(1);
  });

  it("keeps Order operation state scoped when a saved approved attempt is opened", async () => {
    const attemptB = "cccccccc-3333-3333-3333-333333333333";
    let aOrderPosts = 0;
    const fetchMock = vi.fn((input: RequestInfo | URL, options?: RequestInit) => {
      const path = String(input);

      if (path === "/api/products") return Promise.resolve(response(200, [product]));
      if (path === "/api/cart") return Promise.resolve(response(200, cart));

      if (path === "/api/payment-attempts" && options?.method === "POST") {
        const body = JSON.parse(String(options.body)) as { attemptId: string };
        return Promise.resolve(response(201, { ...attempt, attemptId: body.attemptId }));
      }

      if (path.startsWith("/api/payment-attempts/")) {
        const id = path.split("/").at(-1) ?? "";
        return Promise.resolve(response(200, { ...attempt, attemptId: id }));
      }

      if (path === "/api/orders" && options?.method === "POST") {
        const id = (JSON.parse(String(options.body)) as { paymentAttemptId: string }).paymentAttemptId;
        if (id === attemptB) {
          return Promise.resolve(response(201, { ...order, paymentAttemptId: attemptB }));
        }
        aOrderPosts += 1;
        return Promise.reject(new Error("lost"));
      }

      if (path.startsWith("/api/orders/payment-attempts/")) {
        return Promise.resolve(response(404));
      }

      throw new Error(`Unexpected fetch: ${path}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    fireEvent.click(await screen.findByRole("button", { expanded: false }));
    fireEvent.click(screen.getByRole("button", { name: "Checkout" }));
    await screen.findByRole("heading", { name: "Checkout", level: 1 });
    const simulate = await screen.findByRole("button", { name: "Simulate payment" });
    await waitFor(() => expect(simulate).toBeEnabled());
    fireEvent.click(simulate);
    await screen.findByRole("heading", { name: "Simulated payment approved", level: 1 });
    const attemptA = attemptIdFromPath();

    fireEvent.click(screen.getByRole("button", { name: "Create Order" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "could not confirm whether an Order was created"
    );
    expect(aOrderPosts).toBe(1);

    window.history.replaceState({}, "", `/checkout/attempts/${attemptB}`);
    window.dispatchEvent(new PopStateEvent("popstate"));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Simulated payment approved", level: 1 })
      ).toBeInTheDocument()
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Check Order result" })).not.toBeInTheDocument();
    const createForB = screen.getByRole("button", { name: "Create Order" });
    expect(createForB).toBeEnabled();

    fireEvent.click(createForB);
    expect(await screen.findByRole("heading", { name: "Order created", level: 1 })).toBeInTheDocument();

    window.history.replaceState({}, "", `/checkout/attempts/${attemptA}`);
    window.dispatchEvent(new PopStateEvent("popstate"));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "could not confirm whether an Order was created"
    );
    expect(screen.getByRole("button", { name: "Check Order result" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Create Order" })).toBeDisabled();

    const postBodies = fetchMock.mock.calls
      .filter(([path, options]) => path === "/api/orders" && options?.method === "POST")
      .map(([, options]) => JSON.parse(String(options?.body)) as { paymentAttemptId: string });
    expect(postBodies).toHaveLength(2);
    expect(postBodies[0]?.paymentAttemptId).toBe(attemptA);
    expect(postBodies[1]?.paymentAttemptId).toBe(attemptB);
  });

  it("tracks pending Order operations independently per attempt", async () => {
    const attemptB = "cccccccc-3333-3333-3333-333333333333";
    let resolveA: (value: Response) => void = () => {};
    let resolveB: (value: Response) => void = () => {};
    const pendingA = new Promise<Response>((resolve) => {
      resolveA = resolve;
    });
    const pendingB = new Promise<Response>((resolve) => {
      resolveB = resolve;
    });
    const fetchMock = vi.fn((input: RequestInfo | URL, options?: RequestInit) => {
      const path = String(input);

      if (path === "/api/products") return Promise.resolve(response(200, [product]));
      if (path === "/api/cart") return Promise.resolve(response(200, cart));

      if (path === "/api/payment-attempts" && options?.method === "POST") {
        const body = JSON.parse(String(options.body)) as { attemptId: string };
        return Promise.resolve(response(201, { ...attempt, attemptId: body.attemptId }));
      }

      if (path.startsWith("/api/payment-attempts/")) {
        const id = path.split("/").at(-1) ?? "";
        return Promise.resolve(response(200, { ...attempt, attemptId: id }));
      }

      if (path === "/api/orders" && options?.method === "POST") {
        const id = (JSON.parse(String(options.body)) as { paymentAttemptId: string }).paymentAttemptId;
        return id === attemptB ? pendingB : pendingA;
      }

      if (path.startsWith("/api/orders/payment-attempts/")) {
        return Promise.resolve(response(404));
      }

      throw new Error(`Unexpected fetch: ${path}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    fireEvent.click(await screen.findByRole("button", { expanded: false }));
    fireEvent.click(screen.getByRole("button", { name: "Checkout" }));
    await screen.findByRole("heading", { name: "Checkout", level: 1 });
    const simulate = await screen.findByRole("button", { name: "Simulate payment" });
    await waitFor(() => expect(simulate).toBeEnabled());
    fireEvent.click(simulate);
    await screen.findByRole("heading", { name: "Simulated payment approved", level: 1 });
    const attemptA = attemptIdFromPath();
    fireEvent.click(screen.getByRole("button", { name: "Create Order" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Checking Order...");

    window.history.replaceState({}, "", `/checkout/attempts/${attemptB}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Simulated payment approved", level: 1 })
      ).toBeInTheDocument()
    );
    const createForB = screen.getByRole("button", { name: "Create Order" });
    expect(createForB).toBeEnabled();
    fireEvent.click(createForB);
    expect(await screen.findByRole("status")).toHaveTextContent("Checking Order...");

    window.history.replaceState({}, "", `/checkout/attempts/${attemptA}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Simulated payment approved", level: 1 })
      ).toBeInTheDocument()
    );
    expect(screen.getByRole("status")).toHaveTextContent("Checking Order...");
    const createForA = screen.getByRole("button", { name: "Create Order" });
    expect(createForA).toBeDisabled();
    fireEvent.click(createForA);
    const abandonForA = screen.getByRole("button", { name: "Stop following this reference" });
    expect(abandonForA).toBeDisabled();
    fireEvent.click(abandonForA);
    expect(
      fetchMock.mock.calls.filter(
        ([path, options]) => path === "/api/orders" && options?.method === "POST"
      )
    ).toHaveLength(2);

    await act(async () => {
      resolveB(response(201, { ...order, paymentAttemptId: attemptB }));
      await pendingB;
    });
    expect(screen.getByRole("status")).toHaveTextContent("Checking Order...");
    expect(screen.queryByRole("heading", { name: "Order created", level: 1 })).not.toBeInTheDocument();

    window.history.replaceState({}, "", `/checkout/attempts/${attemptB}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Order created", level: 1 })).toBeInTheDocument()
    );

    window.history.replaceState({}, "", `/checkout/attempts/${attemptA}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(await screen.findByRole("status")).toHaveTextContent("Checking Order...");

    await act(async () => {
      resolveA(response(201, { ...order, paymentAttemptId: attemptA }));
      await pendingA;
    });
    expect(await screen.findByRole("heading", { name: "Order created", level: 1 })).toBeInTheDocument();

    const postBodies = fetchMock.mock.calls
      .filter(([path, options]) => path === "/api/orders" && options?.method === "POST")
      .map(([, options]) => JSON.parse(String(options?.body)) as { paymentAttemptId: string });
    expect(postBodies.map((body) => body.paymentAttemptId)).toEqual([attemptA, attemptB]);
  });

  it("retains A's lost-response outcome while B completes independently", async () => {
    const attemptB = "cccccccc-3333-3333-3333-333333333333";
    let rejectA: (reason: Error) => void = () => {};
    let resolveB: (value: Response) => void = () => {};
    const pendingA = new Promise<Response>((_, reject) => {
      rejectA = reject;
    });
    const pendingB = new Promise<Response>((resolve) => {
      resolveB = resolve;
    });
    const fetchMock = vi.fn((input: RequestInfo | URL, options?: RequestInit) => {
      const path = String(input);

      if (path === "/api/products") return Promise.resolve(response(200, [product]));
      if (path === "/api/cart") return Promise.resolve(response(200, cart));

      if (path === "/api/payment-attempts" && options?.method === "POST") {
        const body = JSON.parse(String(options.body)) as { attemptId: string };
        return Promise.resolve(response(201, { ...attempt, attemptId: body.attemptId }));
      }

      if (path.startsWith("/api/payment-attempts/")) {
        const id = path.split("/").at(-1) ?? "";
        return Promise.resolve(response(200, { ...attempt, attemptId: id }));
      }

      if (path === "/api/orders" && options?.method === "POST") {
        const id = (JSON.parse(String(options.body)) as { paymentAttemptId: string }).paymentAttemptId;
        return id === attemptB ? pendingB : pendingA;
      }

      if (path.startsWith("/api/orders/payment-attempts/")) {
        return Promise.resolve(response(404));
      }

      throw new Error(`Unexpected fetch: ${path}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    fireEvent.click(await screen.findByRole("button", { expanded: false }));
    fireEvent.click(screen.getByRole("button", { name: "Checkout" }));
    await screen.findByRole("heading", { name: "Checkout", level: 1 });
    const simulate = await screen.findByRole("button", { name: "Simulate payment" });
    await waitFor(() => expect(simulate).toBeEnabled());
    fireEvent.click(simulate);
    await screen.findByRole("heading", { name: "Simulated payment approved", level: 1 });
    const attemptA = attemptIdFromPath();
    fireEvent.click(screen.getByRole("button", { name: "Create Order" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Checking Order...");

    window.history.replaceState({}, "", `/checkout/attempts/${attemptB}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Simulated payment approved", level: 1 })
      ).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: "Create Order" }));

    await act(async () => {
      resolveB(response(201, { ...order, paymentAttemptId: attemptB }));
      await pendingB;
    });

    window.history.replaceState({}, "", `/checkout/attempts/${attemptA}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(await screen.findByRole("status")).toHaveTextContent("Checking Order...");

    await act(async () => {
      rejectA(new Error("lost"));
      await pendingA.catch(() => undefined);
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "could not confirm whether an Order was created"
    );
    expect(screen.getByRole("button", { name: "Create Order" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Check Order result" })).toBeEnabled();

    window.history.replaceState({}, "", `/checkout/attempts/${attemptB}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Order created", level: 1 })).toBeInTheDocument()
    );

    expect(
      fetchMock.mock.calls.filter(
        ([path, options]) => path === "/api/orders" && options?.method === "POST"
      )
    ).toHaveLength(2);
  });
});
