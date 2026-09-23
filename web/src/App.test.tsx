import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});

function stubFetch() {
  vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
    if (String(input) === "/api/products") {
      return Promise.resolve(response(200, []));
    }

    return Promise.resolve(response(200, { items: [], total: 0 }));
  }));
}

describe("App", () => {
  it("renders the Market at / with primary navigation and current-page context", async () => {
    stubFetch();
    render(<App />);

    expect(screen.getByRole("link", { name: "Samska Sandbox home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Skip to main content" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Products", level: 1 })).toBeInTheDocument();

    const navigation = screen.getByRole("navigation", { name: "Primary" });
    const marketLink = within(navigation).getByRole("link", { name: "Market" });
    const adminLink = within(navigation).getByRole("link", { name: "Admin" });

    expect(marketLink).toHaveAttribute("href", "/");
    expect(marketLink).toHaveAttribute("aria-current", "page");
    expect(adminLink).toHaveAttribute("href", "/admin/products");
    expect(adminLink).not.toHaveAttribute("aria-current");
  });

  it("renders the Admin Product surface at /admin/products", async () => {
    window.history.replaceState({}, "", "/admin/products");
    stubFetch();
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Product management", level: 1 })
    ).toBeInTheDocument();

    const navigation = screen.getByRole("navigation", { name: "Primary" });
    expect(within(navigation).getByRole("link", { name: "Admin" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(within(navigation).getByRole("link", { name: "Market" })).not.toHaveAttribute(
      "aria-current"
    );
  });

  it("renders a distinct not-found surface for unknown paths", () => {
    window.history.replaceState({}, "", "/unknown/path");
    stubFetch();
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "This page does not exist", level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to Market" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("heading", { name: "Products", level: 1 })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Product management" })
    ).not.toBeInTheDocument();
  });

  it("treats a trailing slash on the Admin path as the Admin surface", async () => {
    window.history.replaceState({}, "", "/admin/products/");
    stubFetch();
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Product management", level: 1 })
    ).toBeInTheDocument();
  });
});

function response(status: number, body?: unknown): Response {
  return {
    status,
    json: async () => body
  } as Response;
}
