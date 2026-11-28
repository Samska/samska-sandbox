import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { AuthProvider } from "../auth/AuthContext";
import type { AdminOrder } from "../orders/adminOrdersApi";

const admin = { id: "1", email: "admin@example.test", displayName: "Admin", role: "ADMIN" };
const customer = { id: "2", email: "ana@example.test", displayName: "Ana", role: "CUSTOMER" };

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const order = (over: Partial<AdminOrder> = {}): AdminOrder => ({
  orderId: "o1",
  orderNumber: "SK-000129",
  createdAt: "2026-11-27T20:11:00Z",
  customerEmail: "ana@example.test",
  total: 59.8,
  status: "PLACED",
  lines: [{ name: "Canvas Market Tote", quantity: 2 }],
  ...over
});

function open(account: unknown, orders: () => Response, change?: (body: { status: string }) => Response) {
  const calls: { path: string; body?: string }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input);
      calls.push({ path, body: init?.body as string | undefined });
      if (path === "/api/auth/me") return Promise.resolve(json(200, account));
      if (path === "/api/admin/orders") return Promise.resolve(orders());
      if (path.startsWith("/api/admin/orders/") && init?.method === "PUT") {
        return Promise.resolve(change ? change(JSON.parse(String(init.body))) : json(200, order()));
      }
      return Promise.resolve(json(200, []));
    })
  );
  window.history.replaceState({}, "", "/admin/orders");
  render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
  return calls;
}

describe("Admin orders", () => {
  it("lists every order with customer, items, total and status, and counts per status", async () => {
    open(admin, () => json(200, [order(), order({ orderId: "o2", orderNumber: "SK-000128", status: "SHIPPED" })]));

    expect(await screen.findByRole("heading", { name: "Orders", level: 1 })).toBeInTheDocument();
    expect(document.title).toBe("Admin orders \u00b7 Samska Store");
    const list = await screen.findByRole("list", { name: "Orders, newest first" });
    const rows = within(list).getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText("SK-000129")).toBeInTheDocument();
    expect(within(rows[0]).getByText("Canvas Market Tote × 2")).toBeInTheDocument();
    expect(within(rows[0]).getByText("ana@example.test")).toBeInTheDocument();
    expect(within(rows[0]).getByText("$59.80")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All · 2" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Shipped · 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delivered · 0" })).toBeInTheDocument();
    const navigation = screen.getByRole("navigation", { name: "Admin" });
    expect(within(navigation).getByRole("link", { name: "Orders" })).toHaveAttribute("aria-current", "page");
  });

  it("filters by status", async () => {
    open(admin, () => json(200, [order(), order({ orderId: "o2", orderNumber: "SK-000128", status: "SHIPPED" })]));

    fireEvent.click(await screen.findByRole("button", { name: "Shipped · 1" }));

    const rows = within(screen.getByRole("list", { name: "Orders, newest first" })).getAllByRole("listitem");
    expect(rows).toHaveLength(1);
    expect(within(rows[0]).getByText("SK-000128")).toBeInTheDocument();
  });

  it("changes a status and says so", async () => {
    const calls = open(
      admin,
      () => json(200, [order()]),
      (body) => json(200, order({ status: body.status as AdminOrder["status"] }))
    );

    const update = await screen.findByRole("button", { name: "Update order SK-000129" });
    expect(update).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "PACKED" } });
    fireEvent.click(update);

    expect(await screen.findByText("Order SK-000129 is now Packed.")).toBeInTheDocument();
    expect(calls.find((call) => call.path === "/api/admin/orders/o1/status")?.body).toBe(JSON.stringify({ status: "PACKED" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Update order SK-000129" })).toBeDisabled());
  });

  it("warns before cancelling and locks a cancelled order", async () => {
    open(admin, () => json(200, [order(), order({ orderId: "o2", orderNumber: "SK-000128", status: "CANCELLED" })]));

    const selects = await screen.findAllByLabelText("Status");
    fireEvent.change(selects[0], { target: { value: "CANCELLED" } });
    expect(screen.getByText("Cancelling is final and returns the stock.")).toBeInTheDocument();
    expect(selects[1]).toBeDisabled();
    expect(screen.getByRole("button", { name: "Update order SK-000128" })).toBeDisabled();
  });

  it("reports a failed update and keeps the old status", async () => {
    open(admin, () => json(200, [order()]), () => json(500, {}));

    fireEvent.change(await screen.findByLabelText("Status"), { target: { value: "SHIPPED" } });
    fireEvent.click(screen.getByRole("button", { name: "Update order SK-000129" }));

    expect(await screen.findByText("Order SK-000129 could not be updated. Try again.")).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toHaveValue("PLACED");
  });

  it("reports a conflict as a final order", async () => {
    open(admin, () => json(200, [order()]), () => json(409, {}));

    fireEvent.change(await screen.findByLabelText("Status"), { target: { value: "SHIPPED" } });
    fireEvent.click(screen.getByRole("button", { name: "Update order SK-000129" }));

    expect(await screen.findByText("Order SK-000129 cannot change status any more.")).toBeInTheDocument();
  });

  it("shows an empty state", async () => {
    open(admin, () => json(200, []));
    expect(await screen.findByRole("heading", { name: "No orders yet" })).toBeInTheDocument();
  });

  it("reports a failed load", async () => {
    open(admin, () => json(500, {}));
    expect(await screen.findByText(/could not be loaded/)).toBeInTheDocument();
  });

  it("does not offer Orders administration to a customer", async () => {
    open(customer, () => json(200, [order()]));
    expect(await screen.findByRole("heading", { name: "Not allowed" })).toBeInTheDocument();
  });
});
