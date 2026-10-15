import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Catalog from "./Catalog";

const createdProduct = {
  id: "f84c1a1d-6d7a-4c07-b40f-3c5ca66ab612",
  name: "Canvas Tote",
  description: "A sturdy everyday tote for groceries and market runs.",
  price: 12.5,
  mediaKey: null,
  uploadedMediaId: null
};

const emptyCart = { items: [], total: 0, revision: 0 };

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
  window.sessionStorage.clear();
});

function cartTrigger() {
  return screen.getByRole("button", { expanded: false });
}

describe("Catalog", () => {
  it("browses Products and opens the empty Cart drawer", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      if (String(input) === "/api/products") {
        return Promise.resolve(response(200, [createdProduct]));
      }

      return Promise.resolve(response(200, emptyCart));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    expect(await screen.findByRole("heading", { name: "Products" })).toBeInTheDocument();
    expect(await screen.findByText(createdProduct.name)).toBeInTheDocument();
    expect(screen.getByText(createdProduct.description)).toBeInTheDocument();
    expect(screen.getByText("1 product")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Canvas Tote to Cart" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View details for Canvas Tote" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cart, 0 items, total 0.00" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Your Cart" })).not.toBeInTheDocument();

    fireEvent.click(cartTrigger());

    const dialog = await screen.findByRole("dialog", { name: "Your Cart" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("heading", { name: "Your Cart" })).toHaveFocus();
    expect(within(dialog).getByText("Your Cart is empty.")).toBeInTheDocument();
    expect(within(dialog).getByText("0 items")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Browse Products" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Browse Products" })).not.toBeInTheDocument();
  });

  it("closes the Cart drawer with Escape and returns focus to the trigger", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      if (String(input) === "/api/products") {
        return Promise.resolve(response(200, [createdProduct]));
      }

      return Promise.resolve(response(200, emptyCart));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    const trigger = await screen.findByRole("button", { expanded: false });
    fireEvent.click(trigger);
    await screen.findByRole("dialog", { name: "Your Cart" });

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Your Cart" })).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });

  it("renders an empty browse state", async () => {
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
      if (String(input) === "/api/products") {
        return Promise.resolve(response(200, []));
      }

      return Promise.resolve(response(200, emptyCart));
    }));
    render(<Catalog />);

    expect(await screen.findByText("No Products are available yet.")).toBeInTheDocument();
  });

  it("opens Product details and returns to browsing", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      if (String(input) === "/api/products") {
        return Promise.resolve(response(200, [createdProduct]));
      }

      return Promise.resolve(response(200, emptyCart));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    fireEvent.click(await screen.findByRole("button", { name: "View details for Canvas Tote" }));

    expect(screen.getByRole("heading", { name: "Canvas Tote", level: 1 })).toBeInTheDocument();
    expect(screen.getByText(createdProduct.description)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Canvas Tote to Cart" })).toBeInTheDocument();
    expect(screen.getByText("12.50")).toBeInTheDocument();
    expect(cartTrigger()).toBeInTheDocument();

    const backActions = screen.getAllByRole("button", { name: "Back to Products" });
    expect(backActions).toHaveLength(1);
    fireEvent.click(backActions[0]);

    expect(await screen.findByRole("heading", { name: "Products" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View details for Canvas Tote" })).toBeInTheDocument();
  });

  it("returns focus to the originating View details control after returning to browsing", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      if (String(input) === "/api/products") {
        return Promise.resolve(response(200, [createdProduct]));
      }

      return Promise.resolve(response(200, emptyCart));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    const viewDetails = await screen.findByRole("button", { name: "View details for Canvas Tote" });
    viewDetails.focus();
    fireEvent.click(viewDetails);

    const detailHeading = await screen.findByRole("heading", { name: "Canvas Tote", level: 1 });
    await waitFor(() => expect(detailHeading).toHaveFocus());

    fireEvent.click(screen.getByRole("button", { name: "Back to Products" }));

    const restoredViewDetails = await screen.findByRole("button", {
      name: "View details for Canvas Tote"
    });
    await waitFor(() => expect(restoredViewDetails).toHaveFocus());
  });

  it("keeps the Cart closed and free of browse navigation while Product details are open", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      if (String(input) === "/api/products") {
        return Promise.resolve(response(200, [createdProduct]));
      }

      return Promise.resolve(response(200, emptyCart));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    fireEvent.click(await screen.findByRole("button", { name: "View details for Canvas Tote" }));
    expect(screen.getByRole("heading", { name: "Canvas Tote", level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Your Cart" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Back to Products" })).toHaveLength(1);

    fireEvent.click(cartTrigger());

    const dialog = await screen.findByRole("dialog", { name: "Your Cart" });
    expect(within(dialog).getByText("Your Cart is empty.")).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Back to Products" })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("link", { name: "Browse Products" })).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Close Cart" }));

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Your Cart" })).not.toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "Canvas Tote", level: 1 })).toBeInTheDocument();
  });

  it("adds a Product from the detail presentation and preserves Cart state", async () => {
    const cartWithProduct = {
      items: [{
        productId: createdProduct.id,
        name: createdProduct.name,
        quantity: 1,
        unitPrice: createdProduct.price,
        lineSubtotal: createdProduct.price
      }],
      total: createdProduct.price,
      revision: 1
    };
    const fetchMock = vi.fn((input: RequestInfo | URL, options?: RequestInit) => {
      const path = String(input);

      if (path === "/api/products") {
        return Promise.resolve(response(200, [createdProduct]));
      }

      if (path === "/api/cart" && options === undefined) {
        return Promise.resolve(response(200, emptyCart));
      }

      return Promise.resolve(response(200, cartWithProduct));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    fireEvent.click(await screen.findByRole("button", { name: "View details for Canvas Tote" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Canvas Tote to Cart" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Canvas Tote added to your Cart.");
    expect(fetchMock).toHaveBeenCalledWith("/api/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: createdProduct.id, quantity: 1 })
    });

    fireEvent.click(cartTrigger());
    const dialog = await screen.findByRole("dialog", { name: "Your Cart" });
    expect(within(dialog).getByText("Total").parentElement).toHaveTextContent("12.50");
    expect(within(dialog).getByText("1 item")).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Close Cart" }));
    fireEvent.click(screen.getByRole("button", { name: "Back to Products" }));

    expect(await screen.findByRole("heading", { name: "Products" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cart, 1 item, total 12.50" })).toBeInTheDocument();
  });

  it("adds a Product and renders the authoritative Cart response", async () => {
    const cartWithProduct = {
      items: [{
        productId: createdProduct.id,
        name: createdProduct.name,
        quantity: 1,
        unitPrice: createdProduct.price,
        lineSubtotal: createdProduct.price
      }],
      total: createdProduct.price,
      revision: 1
    };
    const fetchMock = vi.fn((input: RequestInfo | URL, options?: RequestInit) => {
      const path = String(input);

      if (path === "/api/products") {
        return Promise.resolve(response(200, [createdProduct]));
      }

      if (path === "/api/cart" && options === undefined) {
        return Promise.resolve(response(200, emptyCart));
      }

      return Promise.resolve(response(200, cartWithProduct));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    const addButton = await screen.findByRole("button", { name: "Add Canvas Tote to Cart" });
    await waitFor(() => expect(addButton).not.toBeDisabled());
    fireEvent.click(addButton);

    expect(await screen.findByRole("status")).toHaveTextContent("Canvas Tote added to your Cart.");
    expect(fetchMock).toHaveBeenCalledWith("/api/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: createdProduct.id, quantity: 1 })
    });

    fireEvent.click(cartTrigger());
    const dialog = await screen.findByRole("dialog", { name: "Your Cart" });
    expect(within(dialog).getByText("Total").parentElement).toHaveTextContent("12.50");
    expect(within(dialog).getByText("12.50 each")).toBeInTheDocument();
    expect(within(dialog).getByText("Subtotal")).toBeInTheDocument();
  });

  it("guides toward Admin Product creation when the Market is empty", async () => {
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
      if (String(input) === "/api/products") {
        return Promise.resolve(response(200, []));
      }

      return Promise.resolve(response(200, emptyCart));
    }));
    render(<Catalog />);

    expect(await screen.findByText("No Products are available yet.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Create a synthetic Product" })
    ).toHaveAttribute("href", "/admin/products/new");
    expect(screen.queryByLabelText("Product ID")).not.toBeInTheDocument();
    expect(document.querySelector("#catalog-tools")).toBeNull();
  });

  it("reports browse failures without exposing response bodies", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const path = String(input);
      if (path === "/api/products") {
        return Promise.resolve(response(500));
      }
      if (path === "/api/cart") {
        return Promise.resolve(response(200, emptyCart));
      }
      return Promise.resolve(response(404));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    expect(await screen.findByText("The Product service failed. Try again.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry Products" })).toBeInTheDocument();
  });
});

const searchProducts = [
  {
    id: "b3f9c2a4-58d6-4f1b-8a2e-7c9d0e1f2a3b",
    name: "Canvas Tote",
    description: "A sturdy everyday tote for groceries and market runs.",
    price: 12.5,
    mediaKey: null,
    uploadedMediaId: null
  },
  {
    id: "c4a0d3b5-69e7-402c-9b3f-8d0e1f2a3b4c",
    name: "Everyday Tote",
    description: "A lighter tote for daily errands.",
    price: 9,
    mediaKey: null,
    uploadedMediaId: null
  },
  {
    id: "d5b1e4c6-7af8-413d-ac40-9e1f2a3b4c5d",
    name: "Enamel Pin",
    description: "A small pin badge for your tote or jacket.",
    price: 3.5,
    mediaKey: null,
    uploadedMediaId: null
  },
  {
    id: "e6c2f5d7-8b09-424e-bd51-af2a3b4c5d6e",
    name: "Café",
    description: "A coffee-inspired synthetic Product.",
    price: 4.75,
    mediaKey: null,
    uploadedMediaId: null
  }
];

const stockedCart = {
  items: [
    {
      productId: searchProducts[0].id,
      name: "Canvas Tote",
      quantity: 1,
      unitPrice: 12.5,
      lineSubtotal: 12.5
    }
  ],
  total: 12.5,
  revision: 1
};

function stubCatalogFetch({
  products,
  cart = emptyCart,
  cartAfterMutation = cart
}: {
  products: unknown;
  cart?: unknown;
  cartAfterMutation?: unknown;
}) {
  const fetchMock = vi.fn((input: RequestInfo | URL, options?: RequestInit) => {
    const path = String(input);

    if (path === "/api/products") {
      return Promise.resolve(response(200, products));
    }

    if (path === "/api/cart" && options === undefined) {
      return Promise.resolve(response(200, cart));
    }

    return Promise.resolve(response(200, cartAfterMutation));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("Catalog product search", () => {
  it("filters the visible cards and shows the matched-of-total badge", async () => {
    stubCatalogFetch({ products: searchProducts });
    render(<Catalog />);

    expect(await screen.findByText("4 products")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);

    fireEvent.change(screen.getByLabelText("Search Products by name"), {
      target: { value: "tote" }
    });

    expect(screen.getByText("2 of 4 products")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Canvas Tote" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Everyday Tote" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Enamel Pin" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Café" })).not.toBeInTheDocument();
  });

  it("treats a whitespace-only term as no filter", async () => {
    stubCatalogFetch({ products: searchProducts });
    render(<Catalog />);

    const input = await screen.findByLabelText("Search Products by name");
    fireEvent.change(input, { target: { value: "   " } });

    expect(input).toHaveValue("   ");
    expect(screen.getByText("4 products")).toBeInTheDocument();
    expect(screen.queryByText(/\d+ of 4 products/)).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByRole("heading", { name: "Canvas Tote" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Café" })).toBeInTheDocument();
  });

  it("shows the zero-match message and Clear search restores the list without refetching", async () => {
    const fetchMock = stubCatalogFetch({ products: searchProducts });
    render(<Catalog />);

    const input = await screen.findByLabelText("Search Products by name");
    const productCalls = () =>
      fetchMock.mock.calls.filter(([request]) => String(request) === "/api/products").length;
    await waitFor(() => expect(productCalls()).toBeGreaterThan(0));
    const callsBeforeClear = productCalls();

    fireEvent.change(input, { target: { value: "zzz" } });

    expect(screen.getByText('No Products match "zzz".')).toBeInTheDocument();
    expect(screen.getByText("Clear the search to see the full Product list.")).toBeInTheDocument();
    expect(screen.queryByText("No Products are available yet.")).not.toBeInTheDocument();
    expect(screen.queryByText("The Product service failed. Try again.")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry Products" })).not.toBeInTheDocument();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    expect(input).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));

    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
    expect(screen.getByText("4 products")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(productCalls()).toBe(callsBeforeClear);
  });

  it("matches Café by cafe and CAFÉ while rendering the accented name", async () => {
    stubCatalogFetch({ products: searchProducts });
    render(<Catalog />);

    const input = await screen.findByLabelText("Search Products by name");

    fireEvent.change(input, { target: { value: "cafe" } });

    expect(screen.getByText("1 of 4 products")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Café" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Canvas Tote" })).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: "CAFÉ" } });

    expect(screen.getByText("1 of 4 products")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Café" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "View details for Café" }));

    expect(screen.getByRole("heading", { name: "Café", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Café to Cart" })).toBeInTheDocument();
  });

  it("hides the search field while loading, on a browse error, and on an empty Catalog", async () => {
    let resolveProducts!: (value: Response) => void;
    const pendingProducts = new Promise<Response>((resolve) => {
      resolveProducts = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        if (String(input) === "/api/products") {
          return pendingProducts;
        }

        return Promise.resolve(response(200, emptyCart));
      })
    );
    const loading = render(<Catalog />);

    expect(screen.getByText("Loading Products...")).toBeInTheDocument();
    expect(screen.queryByLabelText("Search Products by name")).not.toBeInTheDocument();

    resolveProducts(response(200, [createdProduct]));
    expect(await screen.findByLabelText("Search Products by name")).toBeInTheDocument();
    loading.unmount();

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        if (String(input) === "/api/products") {
          return Promise.resolve(response(500));
        }

        return Promise.resolve(response(200, emptyCart));
      })
    );
    const errored = render(<Catalog />);

    expect(await screen.findByText("The Product service failed. Try again.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry Products" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Search Products by name")).not.toBeInTheDocument();
    errored.unmount();

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        if (String(input) === "/api/products") {
          return Promise.resolve(response(200, []));
        }

        return Promise.resolve(response(200, emptyCart));
      })
    );
    render(<Catalog />);

    expect(await screen.findByText("No Products are available yet.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Search Products by name")).not.toBeInTheDocument();
  });

  it("keeps the term and filtered list when returning from Product details and focuses the card button", async () => {
    stubCatalogFetch({ products: searchProducts });
    render(<Catalog />);

    const input = await screen.findByLabelText("Search Products by name");
    fireEvent.change(input, { target: { value: "enamel" } });

    fireEvent.click(screen.getByRole("button", { name: "View details for Enamel Pin" }));
    expect(screen.getByRole("heading", { name: "Enamel Pin", level: 1 })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back to Products" }));

    expect(await screen.findByRole("heading", { name: "Products" })).toBeInTheDocument();
    expect(screen.getByLabelText("Search Products by name")).toHaveValue("enamel");
    expect(screen.getByText("1 of 4 products")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Enamel Pin" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Canvas Tote" })).not.toBeInTheDocument();

    const restoredViewDetails = screen.getByRole("button", {
      name: "View details for Enamel Pin"
    });
    await waitFor(() => expect(restoredViewDetails).toHaveFocus());
  });

  it("keeps the term across Cart, Checkout, and Back to Market", async () => {
    stubCatalogFetch({ products: searchProducts, cart: stockedCart });
    render(<Catalog />);

    const input = await screen.findByLabelText("Search Products by name");
    fireEvent.change(input, { target: { value: "enamel" } });
    expect(screen.getByText("1 of 4 products")).toBeInTheDocument();

    fireEvent.click(cartTrigger());
    const dialog = await screen.findByRole("dialog", { name: "Your Cart" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Checkout" }));

    expect(await screen.findByRole("heading", { name: "Checkout", level: 1 })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back to Market" }));

    expect(await screen.findByRole("heading", { name: "Products" })).toBeInTheDocument();
    expect(screen.getByLabelText("Search Products by name")).toHaveValue("enamel");
    expect(screen.getByText("1 of 4 products")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Enamel Pin" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Canvas Tote" })).not.toBeInTheDocument();

    await waitFor(() => expect(cartTrigger()).toHaveFocus());
  });

  it("adds a Product from a filtered card and keeps the term and list unchanged", async () => {
    const fetchMock = stubCatalogFetch({
      products: searchProducts,
      cart: emptyCart,
      cartAfterMutation: stockedCart
    });
    render(<Catalog />);

    const input = await screen.findByLabelText("Search Products by name");
    fireEvent.change(input, { target: { value: "tote" } });

    expect(screen.getByText("2 of 4 products")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add Canvas Tote to Cart" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Canvas Tote added to your Cart.");
    expect(fetchMock).toHaveBeenCalledWith("/api/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: searchProducts[0].id, quantity: 1 })
    });

    expect(screen.getByLabelText("Search Products by name")).toHaveValue("tote");
    expect(screen.getByText("2 of 4 products")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Canvas Tote" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Everyday Tote" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Enamel Pin" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cart, 1 item, total 12.50" })).toBeInTheDocument();
  });

  it("keeps the search field keyboard reachable with a single polite live region", async () => {
    stubCatalogFetch({ products: searchProducts });
    render(<Catalog />);

    const input = await screen.findByLabelText("Search Products by name");
    expect(input.tabIndex).toBeGreaterThanOrEqual(0);
    expect(input).not.toHaveAttribute("aria-live");

    const badge = screen.getByText("4 products");
    expect(badge).toHaveAttribute("aria-live", "polite");
    expect(badge).not.toHaveAttribute("role");
    const badgeRowLiveRegions = badge.parentElement?.querySelectorAll('[aria-live="polite"]');
    expect(badgeRowLiveRegions).toHaveLength(1);
    expect(badgeRowLiveRegions?.[0]).toBe(badge);

    input.focus();
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: "pin" } });

    const filteredBadge = screen.getByText("1 of 4 products");
    expect(filteredBadge).toHaveAttribute("aria-live", "polite");
    expect(filteredBadge).not.toHaveAttribute("role");
    expect(screen.getByRole("heading", { name: "Enamel Pin" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear search" })).not.toHaveAttribute("aria-live");
  });
});

function response(status: number, body?: unknown): Response {
  return {
    status,
    json: async () => body
  } as Response;
}
