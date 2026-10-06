import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Catalog from "../catalog/Catalog";

const attemptId = "aaaaaaaa-1111-1111-1111-111111111111";
const otherAttemptId = "cccccccc-3333-3333-3333-333333333333";
const productId = "f84c1a1d-6d7a-4c07-b40f-3c5ca66ab612";

const product = {
  id: productId,
  name: "Canvas Tote",
  description: "Synthetic tote",
  price: 12.5,
  mediaKey: null,
  uploadedMediaId: null
};

const item = { productId, name: "Canvas Tote", quantity: 2, unitPrice: 12.5, lineSubtotal: 25 };
const cartWithTote = { items: [item], total: 25, revision: 1 };
const emptyCart = { items: [], total: 0, revision: 0 };
const attempt = { attemptId, status: "approved", cartRevision: 1, items: [item], total: 25 };
const declinedAttempt = { ...attempt, status: "declined" };
const order = {
  orderId: "bbbbbbbb-2222-2222-2222-222222222222",
  paymentAttemptId: attemptId,
  cartRevision: 1,
  items: [item],
  total: 25
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.history.replaceState({}, "", "/");
  window.sessionStorage.clear();
});

function response(status: number, body?: unknown): Response {
  return { status, json: async () => body } as Response;
}

type FetchHandler = (path: string, options?: RequestInit) => Promise<Response>;

function mountAttempt(handler: FetchHandler) {
  window.history.replaceState({}, "", `/checkout/attempts/${attemptId}`);
  vi.stubGlobal("fetch", vi.fn(handler));
  render(<Catalog />);
}

function offlineLiveData(path: string): Promise<Response> | null {
  if (path === "/api/products" || path === "/api/cart") {
    return Promise.resolve(response(500));
  }

  return null;
}

function recordedFetch() {
  return fetch as unknown as ReturnType<typeof vi.fn>;
}

describe("Attempt recovery independent of live Cart and Catalog", () => {
  it("renders a recovered Order even when Cart and Catalog loading fail", async () => {
    const calls: string[] = [];
    mountAttempt((path, options) => {
      calls.push(path);
      const offline = offlineLiveData(path);
      if (offline) return offline;
      if (path === `/api/orders/payment-attempts/${attemptId}` && options === undefined) {
        return Promise.resolve(response(200, order));
      }
      throw new Error(`Unexpected fetch: ${path}`);
    });

    expect(await screen.findByRole("heading", { name: "Order created", level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Order total: 25.00/)).toBeInTheDocument();
    expect(calls.some((path) => path.startsWith("/api/payment-attempts/"))).toBe(false);
  });

  it("recovers an approved payment and creates its Order without the live Cart", async () => {
    let orderPosts = 0;
    mountAttempt((path, options) => {
      const offline = offlineLiveData(path);
      if (offline) return offline;
      if (path === `/api/orders/payment-attempts/${attemptId}` && options === undefined) {
        return Promise.resolve(response(404));
      }
      if (path === `/api/payment-attempts/${attemptId}` && options === undefined) {
        return Promise.resolve(response(200, attempt));
      }
      if (path === "/api/orders" && options?.method === "POST") {
        orderPosts += 1;
        return Promise.resolve(response(201, order));
      }
      throw new Error(`Unexpected fetch: ${path}`);
    });

    expect(
      await screen.findByRole("heading", { name: "Simulated payment approved", level: 1 })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Create Order" }));

    expect(await screen.findByRole("heading", { name: "Order created", level: 1 })).toBeInTheDocument();
    expect(orderPosts).toBe(1);
  });

  it("shows a recovered declined result without Order actions", async () => {
    mountAttempt((path, options) => {
      const offline = offlineLiveData(path);
      if (offline) return offline;
      if (path === `/api/orders/payment-attempts/${attemptId}` && options === undefined) {
        return Promise.resolve(response(404));
      }
      if (path === `/api/payment-attempts/${attemptId}` && options === undefined) {
        return Promise.resolve(response(200, declinedAttempt));
      }
      throw new Error(`Unexpected fetch: ${path}`);
    });

    expect(
      await screen.findByRole("heading", { name: "Simulated payment declined", level: 1 })
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create Order" })).not.toBeInTheDocument();
  });

  it("keeps both-404 references unavailable with concise messaging and no transactional requests", async () => {
    mountAttempt((path, options) => {
      const offline = offlineLiveData(path);
      if (offline) return offline;
      if (path.startsWith("/api/orders/payment-attempts/") && options === undefined) {
        return Promise.resolve(response(404));
      }
      if (path.startsWith("/api/payment-attempts/") && options === undefined) {
        return Promise.resolve(response(404));
      }
      throw new Error(`Unexpected fetch: ${path}`);
    });

    expect(
      await screen.findByRole("heading", {
        name: "We couldn't confirm a result for this reference.",
        level: 1
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/does not tell us why it is unavailable/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stop following this reference" })).toBeInTheDocument();

    const posts = recordedFetch().mock.calls.filter(([, options]) => options?.method === "POST");
    expect(posts).toHaveLength(0);
  });

  it("recovers after a transient lookup failure only on explicit retry", async () => {
    let orderCalls = 0;
    mountAttempt((path, options) => {
      const offline = offlineLiveData(path);
      if (offline) return offline;
      if (path === `/api/orders/payment-attempts/${attemptId}` && options === undefined) {
        orderCalls += 1;
        return orderCalls === 1
          ? Promise.reject(new Error("offline"))
          : Promise.resolve(response(404));
      }
      if (path === `/api/payment-attempts/${attemptId}` && options === undefined) {
        return Promise.resolve(response(200, attempt));
      }
      throw new Error(`Unexpected fetch: ${path}`);
    });

    expect(
      await screen.findByRole("heading", { name: "We couldn't check this reference. Try again.", level: 1 })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(
      await screen.findByRole("heading", { name: "Simulated payment approved", level: 1 })
    ).toBeInTheDocument();
    expect(orderCalls).toBe(2);
    expect(recordedFetch().mock.calls.filter(([, options]) => options?.method === "POST")).toHaveLength(0);
  });

  it("rejects a mismatched record instead of presenting it", async () => {
    mountAttempt((path, options) => {
      const offline = offlineLiveData(path);
      if (offline) return offline;
      if (path === `/api/orders/payment-attempts/${attemptId}` && options === undefined) {
        return Promise.resolve(response(200, { ...order, paymentAttemptId: otherAttemptId }));
      }
      throw new Error(`Unexpected fetch: ${path}`);
    });

    expect(
      await screen.findByRole("heading", { name: "We couldn't check this reference. Try again.", level: 1 })
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Order created", level: 1 })).not.toBeInTheDocument();
  });

  it("ignores a tampered latest reference without crashing or offering discovery", async () => {
    window.sessionStorage.setItem("samska.latest-payment-attempt", "not-a-uuid");
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const path = String(input);
        if (path === "/api/products") return Promise.resolve(response(200, [product]));
        return Promise.resolve(response(200, emptyCart));
      })
    );
    render(<Catalog />);

    expect(await screen.findByRole("heading", { name: "Products", level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View latest journey" })).not.toBeInTheDocument();
  });

  it("completes the journey when browser storage is unavailable", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, options?: RequestInit) => {
        const path = String(input);
        if (path === "/api/products") return Promise.resolve(response(200, [product]));
        if (path === "/api/cart") return Promise.resolve(response(200, cartWithTote));
        if (path === "/api/payment-attempts" && options?.method === "POST") {
          const body = JSON.parse(String(options.body)) as { attemptId: string };
          return Promise.resolve(response(201, { ...attempt, attemptId: body.attemptId }));
        }
        throw new Error(`Unexpected fetch: ${path}`);
      })
    );
    render(<Catalog />);

    fireEvent.click(await screen.findByRole("button", { expanded: false }));
    fireEvent.click(await screen.findByRole("button", { name: "Checkout" }));
    fireEvent.click(await screen.findByRole("button", { name: "Simulate payment" }));

    expect(
      await screen.findByRole("heading", { name: "Simulated payment approved", level: 1 })
    ).toBeInTheDocument();
    expect(window.location.pathname.startsWith("/checkout/attempts/")).toBe(true);
  });

  it("does not dispatch transactional requests on history navigation", async () => {
    mountAttempt((path, options) => {
      const offline = offlineLiveData(path);
      if (offline) return offline;
      if (path === `/api/orders/payment-attempts/${attemptId}` && options === undefined) {
        return Promise.resolve(response(404));
      }
      if (path === `/api/payment-attempts/${attemptId}` && options === undefined) {
        return Promise.resolve(response(200, attempt));
      }
      throw new Error(`Unexpected fetch: ${path}`);
    });

    await screen.findByRole("heading", { name: "Simulated payment approved", level: 1 });

    window.history.replaceState({}, "", "/checkout");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await screen.findByRole("heading", { name: "Checkout", level: 1 });

    window.history.replaceState({}, "", `/checkout/attempts/${attemptId}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(
      await screen.findByRole("heading", { name: "Simulated payment approved", level: 1 })
    ).toBeInTheDocument();

    const posts = recordedFetch().mock.calls.filter(([, options]) => options?.method === "POST");
    expect(posts).toHaveLength(0);
  });

  it("ignores a late recovery response after leaving and restarts recovery on return", async () => {
    let resolveOrder: (value: Response) => void = () => {};
    const pendingOrderLookup = new Promise<Response>((resolve) => {
      resolveOrder = resolve;
    });
    let orderCalls = 0;
    const fetchMock = vi.fn((path: string, options?: RequestInit) => {
      if (path === `/api/orders/payment-attempts/${attemptId}` && options === undefined) {
        orderCalls += 1;
        return orderCalls === 1 ? pendingOrderLookup : Promise.resolve(response(404));
      }
      if (path === `/api/payment-attempts/${attemptId}` && options === undefined) {
        return Promise.resolve(response(200, attempt));
      }
      const offline = offlineLiveData(path);
      if (offline) return offline;
      throw new Error(`Unexpected fetch: ${path}`);
    });
    window.history.replaceState({}, "", `/checkout/attempts/${attemptId}`);
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    expect(
      await screen.findByRole("heading", { name: "Checking this journey...", level: 1 })
    ).toBeInTheDocument();

    window.history.replaceState({}, "", "/checkout");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await screen.findByRole("heading", { name: "Checkout", level: 1 });

    await act(async () => {
      resolveOrder(response(200, order));
      await pendingOrderLookup;
    });

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Checkout", level: 1 })).toBeInTheDocument()
    );
    expect(screen.queryByRole("heading", { name: "Order created", level: 1 })).not.toBeInTheDocument();

    window.history.replaceState({}, "", `/checkout/attempts/${attemptId}`);
    window.dispatchEvent(new PopStateEvent("popstate"));

    expect(
      await screen.findByRole("heading", { name: "Simulated payment approved", level: 1 })
    ).toBeInTheDocument();
    expect(orderCalls).toBe(2);
    expect(screen.queryByRole("heading", { name: "Order created", level: 1 })).not.toBeInTheDocument();
    expect(recordedFetch().mock.calls.filter(([, options]) => options?.method === "POST")).toHaveLength(0);
  });

  it("blocks a fresh Checkout entry with an unclassified saved reference until abandonment", async () => {
    window.sessionStorage.setItem("samska.latest-payment-attempt", attemptId);
    window.history.replaceState({}, "", "/checkout");
    const fetchMock = vi.fn((path: string, options?: RequestInit) => {
      if (path === "/api/products") return Promise.resolve(response(200, [product]));
      if (path === "/api/cart" && options === undefined) {
        return Promise.resolve(response(200, cartWithTote));
      }
      throw new Error(`Unexpected fetch: ${path}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    const simulate = await screen.findByRole("button", { name: "Simulate payment" });
    await waitFor(() => expect(simulate).toBeDisabled());
    expect(screen.getByRole("alert")).toHaveTextContent(
      "A previous payment attempt reference is unresolved"
    );

    fireEvent.click(screen.getByRole("button", { name: "Forget latest reference" }));
    expect(screen.getByText(/does not cancel a request or delete a record/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Stop following" }));

    await waitFor(() =>
      expect(window.sessionStorage.getItem("samska.latest-payment-attempt")).toBeNull()
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Simulate payment" })).toBeEnabled()
    );
    expect(screen.queryByRole("link", { name: "View latest journey" })).not.toBeInTheDocument();
    expect(
      fetchMock.mock.calls.filter(([, options]) => options?.method === "POST")
    ).toHaveLength(0);
    expect(
      fetchMock.mock.calls.some(([path]) => String(path).startsWith("/api/payment-attempts"))
    ).toBe(false);
  });

  it("keeps a both-404 recovery unresolved on Checkout until explicit abandonment", async () => {
    const fetchMock = vi.fn((path: string, options?: RequestInit) => {
      if (path === "/api/products") return Promise.resolve(response(200, [product]));
      if (path === "/api/cart" && options === undefined) {
        return Promise.resolve(response(200, cartWithTote));
      }
      if (path.startsWith("/api/orders/payment-attempts/") && options === undefined) {
        return Promise.resolve(response(404));
      }
      if (path.startsWith("/api/payment-attempts/") && options === undefined) {
        return Promise.resolve(response(404));
      }
      throw new Error(`Unexpected fetch: ${path}`);
    });
    window.history.replaceState({}, "", `/checkout/attempts/${attemptId}`);
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    expect(
      await screen.findByRole("heading", {
        name: "We couldn't confirm a result for this reference.",
        level: 1
      })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back to Checkout" }));
    expect(await screen.findByRole("heading", { name: "Checkout", level: 1 })).toBeInTheDocument();

    const simulate = screen.getByRole("button", { name: "Simulate payment" });
    expect(simulate).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "A previous payment attempt reference is unresolved"
    );
    fireEvent.click(simulate);
    expect(
      fetchMock.mock.calls.filter(([, options]) => options?.method === "POST")
    ).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "View attempt" }));
    expect(
      await screen.findByRole("heading", {
        name: "We couldn't confirm a result for this reference.",
        level: 1
      })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Stop following this reference" }));
    fireEvent.click(screen.getByRole("button", { name: "Stop following" }));

    await waitFor(() => expect(window.location.pathname).toBe("/checkout"));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Simulate payment" })).toBeEnabled()
    );
    expect(
      fetchMock.mock.calls.filter(([, options]) => options?.method === "POST")
    ).toHaveLength(0);
  });

  it("ignores a late payment check result after the reference is abandoned", async () => {
    let resolveCheck: (value: Response) => void = () => {};
    const pendingCheck = new Promise<Response>((resolve) => {
      resolveCheck = resolve;
    });
    let paymentId = "";
    const fetchMock = vi.fn((path: string, options?: RequestInit) => {
      if (path === "/api/products") return Promise.resolve(response(200, [product]));
      if (path === "/api/cart" && options === undefined) {
        return Promise.resolve(response(200, cartWithTote));
      }
      if (path === "/api/payment-attempts" && options?.method === "POST") {
        paymentId = (JSON.parse(String(options.body)) as { attemptId: string }).attemptId;
        return Promise.reject(new Error("connection lost"));
      }
      if (path === `/api/payment-attempts/${paymentId}` && options === undefined) {
        return pendingCheck;
      }
      if (path.startsWith("/api/orders/payment-attempts/") && options === undefined) {
        return Promise.resolve(response(404));
      }
      throw new Error(`Unexpected fetch: ${path}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    fireEvent.click(await screen.findByRole("button", { expanded: false }));
    fireEvent.click(await screen.findByRole("button", { name: "Checkout" }));
    fireEvent.click(await screen.findByRole("button", { name: "Simulate payment" }));
    expect(
      await screen.findByRole("heading", {
        name: "Payment result is unconfirmed. Check this attempt before trying again.",
        level: 1
      })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Check this attempt" }));
    fireEvent.click(screen.getByRole("button", { name: "Stop following this reference" }));
    fireEvent.click(screen.getByRole("button", { name: "Stop following" }));

    await waitFor(() => expect(window.location.pathname).toBe("/checkout"));
    expect(window.sessionStorage.getItem("samska.latest-payment-attempt")).toBeNull();

    await act(async () => {
      resolveCheck(response(200, { ...attempt, attemptId: paymentId }));
      await pendingCheck;
    });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Simulate payment" })).toBeEnabled()
    );
    expect(
      screen.queryByRole("heading", { name: "Simulated payment approved", level: 1 })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("ignores a late alignment result after switching attempts and restarts recovery on return", async () => {
    const existingId = "bbbbbbbb-2222-2222-2222-222222222222";
    let resolveAlignment: (value: Response) => void = () => {};
    const pendingAlignment = new Promise<Response>((resolve) => {
      resolveAlignment = resolve;
    });
    let existingLookups = 0;
    const fetchMock = vi.fn((path: string, options?: RequestInit) => {
      if (path === "/api/products") return Promise.resolve(response(200, [product]));
      if (path === "/api/cart" && options === undefined) {
        return Promise.resolve(response(200, cartWithTote));
      }
      if (path === "/api/payment-attempts" && options?.method === "POST") {
        return Promise.resolve(response(409, { code: "already-approved", attemptId: existingId }));
      }
      if (path === `/api/payment-attempts/${existingId}` && options === undefined) {
        existingLookups += 1;
        return existingLookups === 1
          ? pendingAlignment
          : Promise.resolve(response(200, { ...attempt, attemptId: existingId }));
      }
      if (path.startsWith("/api/orders/payment-attempts/") && options === undefined) {
        return Promise.resolve(response(404));
      }
      if (path.startsWith("/api/payment-attempts/") && options === undefined) {
        return Promise.resolve(response(404));
      }
      throw new Error(`Unexpected fetch: ${path}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    fireEvent.click(await screen.findByRole("button", { expanded: false }));
    fireEvent.click(await screen.findByRole("button", { name: "Checkout" }));
    await screen.findByRole("heading", { name: "Checkout", level: 1 });
    const simulate = await screen.findByRole("button", { name: "Simulate payment" });
    await waitFor(() => expect(simulate).toBeEnabled());
    fireEvent.click(simulate);
    await screen.findByRole("heading", { name: "Checking this journey...", level: 1 });

    window.history.replaceState({}, "", `/checkout/attempts/${otherAttemptId}`);
    window.dispatchEvent(new PopStateEvent("popstate"));

    await act(async () => {
      resolveAlignment(response(200, { ...attempt, attemptId: existingId }));
      await pendingAlignment;
    });

    expect(
      await screen.findByRole("heading", {
        name: "We couldn't confirm a result for this reference.",
        level: 1
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Simulated payment approved", level: 1 })
    ).not.toBeInTheDocument();

    window.history.replaceState({}, "", `/checkout/attempts/${existingId}`);
    window.dispatchEvent(new PopStateEvent("popstate"));

    expect(
      await screen.findByRole("heading", { name: "Simulated payment approved", level: 1 })
    ).toBeInTheDocument();
    expect(existingLookups).toBe(2);
  });

  it("settles a newer recovery when an older invalidated request for the same attempt completes first", async () => {
    let resolveFirst: (value: Response) => void = () => {};
    let resolveSecond: (value: Response) => void = () => {};
    const firstLookup = new Promise<Response>((resolve) => {
      resolveFirst = resolve;
    });
    const secondLookup = new Promise<Response>((resolve) => {
      resolveSecond = resolve;
    });
    let orderCalls = 0;
    const fetchMock = vi.fn((path: string, options?: RequestInit) => {
      if (path === `/api/orders/payment-attempts/${attemptId}` && options === undefined) {
        orderCalls += 1;
        return orderCalls === 1 ? firstLookup : secondLookup;
      }
      const offline = offlineLiveData(path);
      if (offline) return offline;
      throw new Error(`Unexpected fetch: ${path}`);
    });
    window.history.replaceState({}, "", `/checkout/attempts/${attemptId}`);
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    expect(
      await screen.findByRole("heading", { name: "Checking this journey...", level: 1 })
    ).toBeInTheDocument();

    window.history.replaceState({}, "", "/checkout");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await screen.findByRole("heading", { name: "Checkout", level: 1 });

    window.history.replaceState({}, "", `/checkout/attempts/${attemptId}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(
      await screen.findByRole("heading", { name: "Checking this journey...", level: 1 })
    ).toBeInTheDocument();
    await waitFor(() => expect(orderCalls).toBe(2));

    await act(async () => {
      resolveFirst(response(200, order));
      await firstLookup;
    });

    expect(
      screen.getByRole("heading", { name: "Checking this journey...", level: 1 })
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Order created", level: 1 })).not.toBeInTheDocument();

    await act(async () => {
      resolveSecond(response(200, order));
      await secondLookup;
    });

    expect(await screen.findByRole("heading", { name: "Order created", level: 1 })).toBeInTheDocument();
    expect(orderCalls).toBe(2);
  });
});
