import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { AuthProvider } from "../auth/AuthContext";
import { formatWhen, statusTone } from "./shipmentText";
import type { OrderHistoryEntry, Shipment } from "./ordersApi";

const customer = { id: "1", email: "ana@example.test", displayName: "Ana", role: "CUSTOMER" };
const orderId = "2afa6574-1b2c-4d3e-8f90-a1b2c3d4e5f6";

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function stub(routes: Record<string, () => Response>) {
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const path = String(input);
      calls.push(path);
      if (path === "/api/auth/me") return Promise.resolve(json(200, customer));
      if (path === "/api/products") return Promise.resolve(json(200, []));
      const route = routes[path];
      return Promise.resolve(route ? route() : json(200, { items: [], total: 0, revision: 0 }));
    })
  );
  return calls;
}

function open(path: string) {
  window.history.replaceState({}, "", path);
  return render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

const entry = (over: Partial<OrderHistoryEntry> = {}): OrderHistoryEntry => ({
  orderId,
  orderNumber: "SK-000128",
  createdAt: "2026-11-27T10:43:00Z",
  itemCount: 2,
  total: 312.5,
  status: "PACKED",
  ...over
});

const shipment = (over: Partial<Shipment> = {}): Shipment => ({
  orderId,
  orderNumber: "SK-000128",
  status: "SHIPPED",
  steps: [
    { code: "PLACED", at: "2026-11-27T10:43:00Z", done: true },
    { code: "PACKED", at: "2026-11-27T10:45:00Z", done: true },
    { code: "SHIPPED", at: "2026-11-27T10:53:00Z", done: true },
    { code: "DELIVERED", at: null, done: false }
  ],
  ...over
});

describe("Order history", () => {
  it("lists the orders with status, total and a Track link", async () => {
    stub({ "/api/orders": () => json(200, [entry(), entry({ orderId: "b", orderNumber: "SK-000127", status: "DELIVERED", total: 68 })]) });
    open("/orders");

    expect(await screen.findByRole("heading", { name: "Your orders", level: 1 })).toBeInTheDocument();
    const list = await screen.findByRole("list", { name: "Your orders, newest first" });
    const rows = within(list).getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText("SK-000128")).toBeInTheDocument();
    expect(within(rows[0]).getByText("Packed")).toBeInTheDocument();
    expect(within(rows[0]).getByText("$312.50")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Delivered")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Track order SK-000128" })).toHaveAttribute("href", `/orders/${orderId}`);
    expect(within(screen.getByRole("navigation", { name: "Primary" })).getByRole("link", { name: "Orders" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("shows the empty state with a way back to the catalog", async () => {
    stub({ "/api/orders": () => json(200, []) });
    open("/orders");

    expect(await screen.findByRole("heading", { name: "No orders yet" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse catalog" })).toHaveAttribute("href", "/");
  });

  it("reports a failure to load without inventing orders", async () => {
    stub({ "/api/orders": () => json(500, {}) });
    open("/orders");

    expect(await screen.findByRole("alert")).toHaveTextContent("could not be loaded");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("asks a visitor to sign in", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) =>
        Promise.resolve(String(input) === "/api/auth/me" ? new Response(null, { status: 204 }) : json(200, []))
      )
    );
    open("/orders");

    expect(await screen.findByText("Sign in to see your orders.")).toBeInTheDocument();
  });
});

describe("Delivery tracking", () => {
  it("shows the real status with the time of each step and what is still to come", async () => {
    stub({ [`/api/orders/${orderId}/shipment`]: () => json(200, shipment()) });
    open(`/orders/${orderId}`);

    expect(await screen.findByRole("heading", { name: "On its way", level: 1 })).toBeInTheDocument();
    const steps = within(screen.getByRole("list", { name: "Order history" })).getAllByRole("listitem");
    expect(steps).toHaveLength(4);
    expect(within(steps[2]).getByText("Shipped")).toBeInTheDocument();
    expect(within(steps[2]).getByText("(done)")).toBeInTheDocument();
    expect(within(steps[3]).getByText("(not yet)")).toBeInTheDocument();
    expect(within(steps[3]).queryByText(/Nov/)).not.toBeInTheDocument();
    expect(screen.queryByText(/simulated/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/courier|Tracking SK/i)).not.toBeInTheDocument();
  });

  it("shows a cancelled order with its history and nothing to come", async () => {
    stub({
      [`/api/orders/${orderId}/shipment`]: () =>
        json(200, shipment({ status: "CANCELLED", steps: [
          { code: "PLACED", at: "2026-11-27T10:43:00Z", done: true },
          { code: "CANCELLED", at: "2026-11-27T12:00:00Z", done: true }
        ] }))
    });
    open(`/orders/${orderId}`);

    expect(await screen.findByRole("heading", { name: "Cancelled", level: 1 })).toBeInTheDocument();
    expect(screen.queryByText("(not yet)")).not.toBeInTheDocument();
  });

  it("shows a delivered order", async () => {
    const done = shipment().steps.map((step) => ({ ...step, at: step.at ?? "2026-11-28T09:00:00Z", done: true }));
    stub({ [`/api/orders/${orderId}/shipment`]: () => json(200, shipment({ status: "DELIVERED", steps: done })) });
    open(`/orders/${orderId}`);

    expect(await screen.findByRole("heading", { name: "Delivered", level: 1 })).toBeInTheDocument();
    expect(screen.queryByText("(not yet)")).not.toBeInTheDocument();
  });

  it("checks again on request", async () => {
    const calls = stub({ [`/api/orders/${orderId}/shipment`]: () => json(200, shipment()) });
    open(`/orders/${orderId}`);

    fireEvent.click(await screen.findByRole("button", { name: "Check again" }));
    await screen.findByRole("button", { name: "Check again" });
    expect(calls.filter((path) => path.endsWith("/shipment")).length).toBeGreaterThanOrEqual(2);
  });

  it("says when the order is not the account's", async () => {
    stub({ [`/api/orders/${orderId}/shipment`]: () => json(404, {}) });
    open(`/orders/${orderId}`);

    expect(await screen.findByRole("heading", { name: "Order not found" })).toBeInTheDocument();
  });

  it("offers a retry when tracking fails", async () => {
    stub({ [`/api/orders/${orderId}/shipment`]: () => json(503, {}) });
    open(`/orders/${orderId}`);

    expect(await screen.findByRole("heading", { name: "Tracking unavailable" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});

describe("shipment text", () => {
  it("maps statuses to tones and formats times", () => {
    expect(statusTone("DELIVERED")).toBe("success");
    expect(statusTone("CANCELLED")).toBe("error");
    expect(statusTone("PACKED")).toBe("pending");
    expect(formatWhen("not a date")).toBe("not a date");
    expect(formatWhen("2026-11-27T10:43:00Z")).toMatch(/27 Nov/);
  });
});
