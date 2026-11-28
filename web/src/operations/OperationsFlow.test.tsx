import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { AuthProvider } from "../auth/AuthContext";
import type { OperationsSnapshot } from "./operationsApi";

const admin = { id: "1", email: "admin@example.test", displayName: "Admin", role: "ADMIN" };
const customer = { id: "2", email: "ana@example.test", displayName: "Ana", role: "CUSTOMER" };

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const snapshot = (over: Partial<OperationsSnapshot> = {}): OperationsSnapshot => ({
  generatedAt: "2026-11-27T10:43:00Z",
  ordersLastHour: 4,
  ordersLast24Hours: 31,
  checkoutP95Millis: 182.4,
  checkoutSamples: 40,
  requests: 500,
  serverErrors: 5,
  errorRate: 0.01,
  services: [
    { name: "Application", healthy: true, latencyMillis: 0 },
    { name: "Database", healthy: false, latencyMillis: 0 }
  ],
  ...over
});

function open(account: unknown, operations: () => Response, demo = false) {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const path = String(input);
      if (path === "/api/auth/me") return Promise.resolve(json(200, account));
      if (path === "/api/admin/operations") return Promise.resolve(operations());
      if (path === "/api/config") return Promise.resolve(json(200, { demo }));
      return Promise.resolve(json(200, []));
    })
  );
  window.history.replaceState({}, "", "/admin/operations");
  return render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

describe("Operations screen", () => {
  it("shows each figure with what it measures and the service table", async () => {
    open(admin, () => json(200, snapshot()));

    expect(await screen.findByRole("heading", { name: "Store health", level: 1 })).toBeInTheDocument();
    expect(await screen.findByText("31 in the last 24 hours")).toBeInTheDocument();
    expect(screen.getByText("182 ms")).toBeInTheDocument();
    expect(screen.getByText("1.0%")).toBeInTheDocument();
    expect(screen.getByText("5 of 500 requests ended in a 5xx status")).toBeInTheDocument();
    const rows = within(screen.getByRole("table", { name: "Service health" })).getAllByRole("row");
    expect(within(rows[1]).getByText("Healthy")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Down")).toBeInTheDocument();
  });

  it("says there is no data yet instead of showing zeros for rates", async () => {
    open(admin, () =>
      json(200, snapshot({ checkoutP95Millis: null, checkoutSamples: 0, errorRate: null, requests: 0 }))
    );

    expect(await screen.findByText("No checkout requests since start")).toBeInTheDocument();
    expect(screen.getByText("No requests since start")).toBeInTheDocument();
    expect(screen.getAllByText("No data yet")).toHaveLength(2);
  });

  it("reloads the figures on Refresh", async () => {
    let calls = 0;
    open(admin, () => {
      calls += 1;
      return json(200, snapshot({ ordersLastHour: calls }));
    });

    expect(await screen.findByText("Orders, last hour")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(await screen.findByText("2")).toBeInTheDocument();
  });

  it("reports a failed load and a refused role", async () => {
    const view = open(admin, () => json(500, {}));
    expect(await screen.findByText(/could not be loaded/)).toBeInTheDocument();
    view.unmount();

    open(admin, () => json(403, {}));
    expect(await screen.findByText("Your account cannot read Operations.")).toBeInTheDocument();
  });

  it("does not offer Operations to a customer", async () => {
    open(customer, () => json(200, snapshot()));

    expect(await screen.findByRole("heading", { name: "Not allowed" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Operations" })).not.toBeInTheDocument();
  });

  it("shows administrators the Admin navigation without storefront links", async () => {
    open(admin, () => json(200, snapshot()));

    const navigation = await screen.findByRole("navigation", { name: "Admin" });
    expect(within(navigation).getByRole("link", { name: "Operations" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Market" })).not.toBeInTheDocument();
  });

  it("has no reset control, even in demo mode", async () => {
    open(admin, () => json(200, snapshot()), true);

    await screen.findByText("Orders, last hour");
    expect(screen.queryByRole("button", { name: /reset/i })).not.toBeInTheDocument();
  });
});
