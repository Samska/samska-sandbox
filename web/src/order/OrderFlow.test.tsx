import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

afterEach(() => vi.unstubAllGlobals());

describe("Order creation from a confirmed approved payment", () => {
  it("uses only the payment attempt ID and presents the frozen Order with focus and in-app return", async () => {
    const fetchMock = setup();
    await approve();
    fireEvent.click(screen.getByRole("button", { name: "Create Order" }));
    const heading = await screen.findByRole("heading", { name: "Order created", level: 1 });
    await waitFor(() => expect(heading).toHaveFocus());
    expect(screen.getByText(/No real payment was made/)).toBeInTheDocument();
    expect(screen.getByText(/Order total: 25.00/)).toBeInTheDocument();
    const posts = fetchMock.mock.calls.filter(([path, options]) => path === "/api/orders" && options?.method === "POST");
    expect(posts).toHaveLength(1);
    expect(JSON.parse(String(posts[0]?.[1]?.body))).toEqual({ paymentAttemptId: expect.any(String) });

    fireEvent.click(screen.getByRole("button", { name: "Back to Market" }));
    fireEvent.click(await screen.findByRole("button", { expanded: false }));
    fireEvent.click(screen.getByRole("button", { name: "Checkout" }));
    expect(await screen.findByRole("heading", { name: "Order created", level: 1 })).toBeInTheDocument();
  });

  it("treats a lost POST as unconfirmed until the original Order is found by attempt", async () => {
    const fetchMock = setup({ post: () => Promise.reject(new Error("lost")) });
    await approve();
    fireEvent.click(screen.getByRole("button", { name: "Create Order" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("could not confirm whether an Order was created");
    expect(screen.getByRole("button", { name: "Create Order" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Back to Market" }));
    fireEvent.click(await screen.findByRole("button", { expanded: false }));
    fireEvent.click(screen.getByRole("button", { name: "Checkout" }));
    fireEvent.click(screen.getByRole("button", { name: "Check Order result" }));
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

  it("does not offer another POST after two 404 lookups", async () => {
    const fetchMock = setup({ post: () => Promise.reject(new Error("lost")), lookup: () => Promise.resolve(response(404)),
      paymentLookup: () => Promise.resolve(response(404)) });
    await approve();
    fireEvent.click(screen.getByRole("button", { name: "Create Order" }));
    fireEvent.click(await screen.findByRole("button", { name: "Check Order result" }));
    expect(await screen.findByText(/approved payment attempt cannot be confirmed/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create Order with same attempt" })).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([path]) => path === "/api/orders")).toHaveLength(1);
  });

  it("does not reuse an attempt when the Payment lookup is not approved", async () => {
    const fetchMock = setup({ post: () => Promise.reject(new Error("lost")), lookup: () => Promise.resolve(response(404)),
      paymentLookup: (id) => Promise.resolve(response(200, { ...attempt, attemptId: id, status: "declined" })) });
    await approve();
    fireEvent.click(screen.getByRole("button", { name: "Create Order" }));
    fireEvent.click(await screen.findByRole("button", { name: "Check Order result" }));
    expect(await screen.findByRole("heading", { name: "Checkout", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("approved payment attempt cannot be confirmed");
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
});
