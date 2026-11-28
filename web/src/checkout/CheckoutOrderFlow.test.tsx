import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Catalog from "../catalog/Catalog";

const productId = "f84c1a1d-6d7a-4c07-b40f-3c5ca66ab612";
const cart = {
  items: [{ productId, name: "Canvas Tote", quantity: 2, unitPrice: 12.5, lineSubtotal: 25 }],
  total: 25,
  revision: 3
};
const emptyCart = { items: [], total: 0, revision: 4 };
const order = {
  orderId: "bbbbbbbb-2222-2222-2222-222222222222",
  orderNumber: "SK-000128",
  cartRevision: 3,
  items: [{ productId, name: "Canvas Tote", unitPrice: 12.5, quantity: 2, lineSubtotal: 25 }],
  total: 25
};

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});

function response(status: number, body?: unknown): Response {
  return { status, json: async () => body } as Response;
}

/** Serves the Cart until an Order is placed; `orders` answers each POST /api/orders in turn. */
function stubApi(orders: Array<() => Promise<Response>>) {
  let placed = false;
  const fetchMock = vi.fn((input: RequestInfo | URL, options?: RequestInit) => {
    const path = String(input);

    if (path === "/api/products") {
      return Promise.resolve(response(200, []));
    }

    if (path === "/api/cart") {
      return Promise.resolve(response(200, placed ? emptyCart : cart));
    }

    if (path === "/api/orders" && options?.method === "POST") {
      const next = orders.shift();
      return next === undefined ? Promise.reject(new Error("unexpected")) : next().then((reply) => {
        placed = placed || reply.status === 201;
        return reply;
      });
    }

    return Promise.resolve(response(404));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function orderPosts(fetchMock: ReturnType<typeof stubApi>) {
  return fetchMock.mock.calls
    .filter(([input, options]) => String(input) === "/api/orders" && options?.method === "POST")
    .map(([, options]) => JSON.parse(String(options?.body)) as { requestId: string; cartRevision: number });
}

async function enterCheckout() {
  window.history.replaceState({}, "", "/checkout");
  render(<Catalog />);
  return screen.findByRole("button", { name: "Place order" });
}

describe("Checkout places the Order directly", () => {
  it("places the Order in one step and shows the Order number", async () => {
    const fetchMock = stubApi([() => Promise.resolve(response(201, order))]);
    fireEvent.click(await enterCheckout());

    expect(await screen.findByRole("heading", { name: "Order created", level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText("Order number SK-000128")).toBeInTheDocument();
    expect(screen.getByText("Order total: $25.00")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Track this order" })).toHaveAttribute(
      "href",
      `/orders/${order.orderId}`
    );

    const posts = orderPosts(fetchMock);
    expect(posts).toHaveLength(1);
    expect(posts[0].cartRevision).toBe(3);
    expect(posts[0].requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(screen.queryByText(/payment/i)).not.toBeInTheDocument();
  });

  it("reloads the Cart after the Order so Checkout shows it empty", async () => {
    stubApi([() => Promise.resolve(response(201, order))]);
    fireEvent.click(await enterCheckout());
    await screen.findByRole("heading", { name: "Order created", level: 1 });

    fireEvent.click(screen.getByRole("button", { name: "Back to Checkout" }));

    expect(await screen.findByText("Your Cart is empty.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Place order" })).not.toBeInTheDocument();
  });

  it("retries an unconfirmed result with the same request ID so it is never placed twice", async () => {
    const fetchMock = stubApi([
      () => Promise.reject(new TypeError("lost response")),
      () => Promise.resolve(response(200, order))
    ]);
    fireEvent.click(await enterCheckout());

    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't confirm whether your Order was placed.");
    fireEvent.click(screen.getByRole("button", { name: "Place order" }));

    expect(await screen.findByRole("heading", { name: "Order created", level: 1 })).toBeInTheDocument();
    const posts = orderPosts(fetchMock);
    expect(posts).toHaveLength(2);
    expect(posts[1].requestId).toBe(posts[0].requestId);
  });

  it("starts a new request after a refusal and shows the latest Cart", async () => {
    const fetchMock = stubApi([
      () => Promise.resolve(response(409, { code: "cart-changed" })),
      () => Promise.resolve(response(201, order))
    ]);
    fireEvent.click(await enterCheckout());

    expect(await screen.findByRole("alert")).toHaveTextContent("Your Cart changed since you reviewed it.");
    await waitFor(() => expect(screen.getByRole("button", { name: "Place order" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Place order" }));

    await screen.findByRole("heading", { name: "Order created", level: 1 });
    const posts = orderPosts(fetchMock);
    expect(posts[1].requestId).not.toBe(posts[0].requestId);
  });

  it("explains an item that is no longer in stock and places nothing", async () => {
    stubApi([() => Promise.resolve(response(409, { code: "out-of-stock" }))]);
    fireEvent.click(await enterCheckout());

    expect(await screen.findByRole("alert")).toHaveTextContent("No Order was placed.");
    expect(screen.queryByRole("heading", { name: "Order created", level: 1 })).not.toBeInTheDocument();
  });

  it("does not place a second Order while one is in flight", async () => {
    let finish: (reply: Response) => void = () => undefined;
    const fetchMock = stubApi([() => new Promise<Response>((resolve) => { finish = resolve; })]);
    const button = await enterCheckout();

    fireEvent.click(button);
    fireEvent.click(button);

    expect(await screen.findByText("Placing your order...")).toBeInTheDocument();
    expect(orderPosts(fetchMock)).toHaveLength(1);
    finish(response(201, order));
    await screen.findByRole("heading", { name: "Order created", level: 1 });
  });
});
