import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Catalog from "./Catalog";

const createdProduct = {
  id: "f84c1a1d-6d7a-4c07-b40f-3c5ca66ab612",
  name: "Canvas Tote",
  description: "A sturdy everyday tote for groceries and market runs.",
  price: 12.5,
  mediaKey: null
};

const emptyCart = { items: [], total: 0 };

afterEach(() => {
  vi.unstubAllGlobals();
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
      total: createdProduct.price
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
      total: createdProduct.price
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

  it("creates a Product with a description and refreshes the browse list", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => Promise.resolve(response(200, [])))
      .mockImplementationOnce(() => Promise.resolve(response(200, emptyCart)))
      .mockImplementationOnce(() => Promise.resolve(response(201, createdProduct)))
      .mockImplementationOnce(() => Promise.resolve(response(200, [createdProduct])));
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    fireEvent.click(screen.getByText("Product setup tools"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Canvas Tote" } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: createdProduct.description } });
    fireEvent.change(screen.getByLabelText("Price"), { target: { value: "12.50" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Product" }));

    expect(await screen.findByText("Product created successfully.")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Add Canvas Tote to Cart" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Canvas Tote",
        description: createdProduct.description,
        price: 12.5,
        mediaKey: null
      })
    });
  });

  it("assigns a curated media key when creating a Product", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => Promise.resolve(response(200, [])))
      .mockImplementationOnce(() => Promise.resolve(response(200, emptyCart)))
      .mockImplementationOnce(() => Promise.resolve(response(201, { ...createdProduct, mediaKey: "canvas-market-tote" })))
      .mockImplementationOnce(() => Promise.resolve(response(200, [{ ...createdProduct, mediaKey: "canvas-market-tote" }])));
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    fireEvent.click(screen.getByText("Product setup tools"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Canvas Tote" } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: createdProduct.description } });
    fireEvent.change(screen.getByLabelText("Price"), { target: { value: "12.50" } });
    fireEvent.change(screen.getByLabelText("Media"), { target: { value: "canvas-market-tote" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Product" }));

    expect(await screen.findByText("Product created successfully.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Canvas Tote",
        description: createdProduct.description,
        price: 12.5,
        mediaKey: "canvas-market-tote"
      })
    });
  });

  it("prevents invalid creation input from calling the create API", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      if (String(input) === "/api/products") {
        return Promise.resolve(response(200, []));
      }

      return Promise.resolve(response(200, emptyCart));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    fireEvent.click(screen.getByText("Product setup tools"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "   " } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "A sample product" } });
    fireEvent.change(screen.getByLabelText("Price"), { target: { value: "-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Product" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a Product name.");
    expect(fetchMock).not.toHaveBeenCalledWith("/api/products", expect.objectContaining({ method: "POST" }));
  });

  it("rejects a blank description without calling the create API", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      if (String(input) === "/api/products") {
        return Promise.resolve(response(200, []));
      }

      return Promise.resolve(response(200, emptyCart));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    fireEvent.click(screen.getByText("Product setup tools"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Canvas Tote" } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "   " } });
    fireEvent.change(screen.getByLabelText("Price"), { target: { value: "12.50" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Product" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a Product description.");
    expect(fetchMock).not.toHaveBeenCalledWith("/api/products", expect.objectContaining({ method: "POST" }));
  });

  it("retrieves a Product by its trimmed and encoded ID", async () => {
    const productId = "product/id";
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const path = String(input);
      if (path === "/api/products") {
        return Promise.resolve(response(200, []));
      }
      if (path === "/api/cart") {
        return Promise.resolve(response(200, emptyCart));
      }
      return Promise.resolve(response(200, { ...createdProduct, id: productId }));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    fireEvent.click(screen.getByText("Product setup tools"));
    fireEvent.change(screen.getByLabelText("Product ID"), { target: { value: ` ${productId} ` } });
    fireEvent.click(screen.getByRole("button", { name: "Find Product" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/products/product%2Fid", undefined));
    expect(await screen.findByText("Product found successfully.")).toBeInTheDocument();
    expect(screen.getByText(productId)).toBeInTheDocument();
  });

  it("reports browse and lookup failures without exposing response bodies", async () => {
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

    fireEvent.click(screen.getByText("Product setup tools"));
    expect(await screen.findByText("The Product service failed. Try again.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Product ID"), { target: { value: "product-id" } });
    fireEvent.click(screen.getByRole("button", { name: "Find Product" }));
    expect(await screen.findByText("No Product was found with that ID.")).toBeInTheDocument();
  });
});

function response(status: number, body?: unknown): Response {
  return {
    status,
    json: async () => body
  } as Response;
}
