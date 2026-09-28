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

  it("renders the dedicated Create Product form at /admin/products/new", async () => {
    window.history.replaceState({}, "", "/admin/products/new");
    stubFetch();
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Create Product", level: 1 })
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Products", level: 1 })).not.toBeInTheDocument();

    const navigation = screen.getByRole("navigation", { name: "Primary" });
    expect(within(navigation).getByRole("link", { name: "Admin" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("renders the dedicated edit form at /admin/products/{id}/edit", async () => {
    const id = "11111111-1111-1111-1111-111111111111";
    window.history.replaceState({}, "", `/admin/products/${id}/edit`);
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          response(200, {
            id,
            name: "Canvas Tote",
            description: "A sturdy everyday tote.",
            price: 12.5,
            mediaKey: null,
            uploadedMediaId: null
          })
        )
      )
    );
    render(<App />);

    expect(await screen.findByLabelText("Name")).toHaveValue("Canvas Tote");
    expect(screen.getByRole("heading", { name: "Edit Product", level: 1 })).toBeInTheDocument();
  });

  it("keeps unknown Admin sub-paths on the not-found surface", () => {
    window.history.replaceState({}, "", "/admin/products/not-a-route");
    stubFetch();
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "This page does not exist", level: 1 })
    ).toBeInTheDocument();
  });

  it("renders the not-found surface for a malformed percent-encoded edit path", () => {
    window.history.replaceState({}, "", "/admin/products/%E0%A4%A/edit");
    stubFetch();
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "This page does not exist", level: 1 })
    ).toBeInTheDocument();
  });
});

function response(status: number, body?: unknown): Response {
  return {
    status,
    json: async () => body
  } as Response;
}
