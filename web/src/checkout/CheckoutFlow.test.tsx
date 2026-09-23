import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Catalog from "../catalog/Catalog";

const product = {
  id: "f84c1a1d-6d7a-4c07-b40f-3c5ca66ab612",
  name: "Canvas Tote",
  description: "A sturdy everyday tote for groceries and market runs.",
  price: 12.5,
  mediaKey: null
};

const emptyCart = { items: [], total: 0 };

const toteItem = {
  productId: product.id,
  name: product.name,
  quantity: 2,
  unitPrice: 12.5,
  lineSubtotal: 25
};

const pourOverItem = {
  productId: "6d1c6f5e-2f6e-4f5a-9c2f-0d4c8a7b1e33",
  name: "Pour-Over Set",
  quantity: 1,
  unitPrice: 68.5,
  lineSubtotal: 68.5
};

const cartWithTote = { items: [toteItem], total: 25 };
const cartWithTwoItems = { items: [toteItem, pourOverItem], total: 93.5 };
const increasedCart = { items: [{ ...toteItem, quantity: 3, lineSubtotal: 37.5 }], total: 37.5 };
const decreasedCart = { items: [{ ...toteItem, quantity: 1, lineSubtotal: 12.5 }], total: 12.5 };
const quadrupledCart = { items: [{ ...toteItem, quantity: 4, lineSubtotal: 50 }], total: 50 };
const oneItemCart = { items: [pourOverItem], total: 68.5 };

afterEach(() => {
  vi.unstubAllGlobals();
});

function response(status: number, body?: unknown): Response {
  return {
    status,
    json: async () => body
  } as Response;
}

function createFetchMock(overrides: {
  cart?: () => Promise<Response>;
  cartMutation?: () => Promise<Response>;
} = {}) {
  return vi.fn((input: RequestInfo | URL, options?: RequestInit) => {
    const path = String(input);

    if (path === "/api/products" && options === undefined) {
      return Promise.resolve(response(200, [product]));
    }

    if (path === "/api/cart" && options === undefined) {
      return Promise.resolve(overrides.cart ? overrides.cart() : response(200, cartWithTwoItems));
    }

    if (path.startsWith("/api/cart/items")) {
      return Promise.resolve(
        overrides.cartMutation ? overrides.cartMutation() : response(200, cartWithTwoItems)
      );
    }

    return Promise.resolve(response(200, emptyCart));
  });
}

async function enterCheckout() {
  fireEvent.click(await screen.findByRole("button", { expanded: false }));
  fireEvent.click(await screen.findByRole("button", { name: "Checkout" }));

  return screen.findByRole("heading", { name: "Checkout", level: 1 });
}

describe("Checkout review flow", () => {
  it("hides the Checkout action for an empty Cart", async () => {
    vi.stubGlobal("fetch", createFetchMock({ cart: () => Promise.resolve(response(200, emptyCart)) }));
    render(<Catalog />);

    fireEvent.click(await screen.findByRole("button", { expanded: false }));

    const dialog = await screen.findByRole("dialog", { name: "Your Cart" });
    expect(within(dialog).getByText("Your Cart is empty.")).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Checkout" })).not.toBeInTheDocument();
  });

  it("enters Checkout from Product Browse and renders the current editable Cart", async () => {
    const fetchMock = createFetchMock({ cart: () => Promise.resolve(response(200, cartWithTwoItems)) });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    const heading = await enterCheckout();
    await waitFor(() => expect(heading).toHaveFocus());

    expect(screen.queryByRole("dialog", { name: "Your Cart" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { expanded: false })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Quantity for Canvas Tote")).toHaveValue(2);
    expect(screen.getByText("12.50 each")).toBeInTheDocument();
    expect(screen.getByText("Total").parentElement).toHaveTextContent("93.50");
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes("checkout"))).toBe(false);
  });

  it("returns to Product Browse with Cart trigger focus from Back to Market", async () => {
    vi.stubGlobal("fetch", createFetchMock({ cart: () => Promise.resolve(response(200, cartWithTote)) }));
    render(<Catalog />);

    await enterCheckout();
    fireEvent.click(screen.getByRole("button", { name: "Back to Market" }));

    expect(await screen.findByRole("heading", { name: "Products" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Checkout", level: 1 })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { expanded: false })).toHaveFocus());
  });

  it("enters Checkout from Product Detail and clears the detail context", async () => {
    vi.stubGlobal("fetch", createFetchMock({ cart: () => Promise.resolve(response(200, cartWithTote)) }));
    render(<Catalog />);

    fireEvent.click(await screen.findByRole("button", { name: "View details for Canvas Tote" }));
    expect(screen.getByRole("heading", { name: "Canvas Tote", level: 1 })).toBeInTheDocument();

    await enterCheckout();
    expect(screen.queryByRole("heading", { name: "Canvas Tote", level: 1 })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Quantity for Canvas Tote")).toHaveValue(2);

    fireEvent.click(screen.getByRole("button", { name: "Back to Market" }));
    expect(await screen.findByRole("heading", { name: "Products" })).toBeInTheDocument();
  });

  it("increases quantity directly in Checkout and restores the same control", async () => {
    let resolveMutation: (value: Response) => void = () => {};
    const pendingMutation = new Promise<Response>((resolve) => {
      resolveMutation = resolve;
    });
    const fetchMock = createFetchMock({
      cart: () => Promise.resolve(response(200, cartWithTote)),
      cartMutation: () => pendingMutation
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    await enterCheckout();
    const increase = screen.getByRole("button", { name: "Increase quantity for Canvas Tote" });
    increase.focus();
    fireEvent.click(increase);

    const pendingButton = await screen.findByRole("button", {
      name: "Increase quantity for Canvas Tote"
    });
    expect(pendingButton).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Updating Cart...");
    expect(screen.getByLabelText("Quantity for Canvas Tote")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Remove Canvas Tote" })).toBeDisabled();

    (pendingButton as HTMLButtonElement).blur();
    resolveMutation(response(200, increasedCart));

    await waitFor(() => expect(screen.getByLabelText("Quantity for Canvas Tote")).toHaveValue(3));
    expect(screen.getByText("Total").parentElement).toHaveTextContent("37.50");
    expect(fetchMock).toHaveBeenCalledWith(`/api/cart/items/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: 3 })
    });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Increase quantity for Canvas Tote" })).toHaveFocus()
    );
  });

  it("decreases quantity directly in Checkout and falls back to the quantity control", async () => {
    const fetchMock = createFetchMock({
      cart: () => Promise.resolve(response(200, cartWithTote)),
      cartMutation: () => Promise.resolve(response(200, decreasedCart))
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    await enterCheckout();
    const decrease = screen.getByRole("button", { name: "Decrease quantity for Canvas Tote" });
    decrease.focus();
    fireEvent.click(decrease);

    await waitFor(() => expect(screen.getByLabelText("Quantity for Canvas Tote")).toHaveValue(1));
    expect(screen.getByText("Total").parentElement).toHaveTextContent("12.50");
    expect(fetchMock).toHaveBeenCalledWith(`/api/cart/items/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: 1 })
    });
    await waitFor(() => expect(screen.getByLabelText("Quantity for Canvas Tote")).toHaveFocus());
  });

  it("updates quantity through the input directly in Checkout", async () => {
    const fetchMock = createFetchMock({
      cart: () => Promise.resolve(response(200, cartWithTote)),
      cartMutation: () => Promise.resolve(response(200, quadrupledCart))
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    await enterCheckout();
    const input = screen.getByLabelText("Quantity for Canvas Tote");
    input.focus();
    fireEvent.change(input, { target: { value: "4" } });
    fireEvent.blur(input);

    await waitFor(() => expect(screen.getByLabelText("Quantity for Canvas Tote")).toHaveValue(4));
    expect(screen.getByText("Total").parentElement).toHaveTextContent("50.00");
    expect(fetchMock).toHaveBeenCalledWith(`/api/cart/items/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: 4 })
    });
    await waitFor(() => expect(screen.getByLabelText("Quantity for Canvas Tote")).toHaveFocus());
  });

  it("moves focus to the following item after a non-final removal in Checkout", async () => {
    vi.stubGlobal(
      "fetch",
      createFetchMock({
        cart: () => Promise.resolve(response(200, cartWithTwoItems)),
        cartMutation: () => Promise.resolve(response(200, oneItemCart))
      })
    );
    render(<Catalog />);

    await enterCheckout();
    const remove = screen.getByRole("button", { name: "Remove Canvas Tote" });
    remove.focus();
    fireEvent.click(remove);

    await waitFor(() => expect(screen.queryByText("Canvas Tote")).not.toBeInTheDocument());
    expect(screen.getByText("Pour-Over Set")).toBeInTheDocument();
    expect(screen.getByText("Total").parentElement).toHaveTextContent("68.50");
    await waitFor(() => expect(screen.getByLabelText("Quantity for Pour-Over Set")).toHaveFocus());
  });

  it("moves focus to the preceding item after removing the last positioned item", async () => {
    vi.stubGlobal(
      "fetch",
      createFetchMock({
        cart: () => Promise.resolve(response(200, cartWithTwoItems)),
        cartMutation: () => Promise.resolve(response(200, cartWithTote))
      })
    );
    render(<Catalog />);

    await enterCheckout();
    const remove = screen.getByRole("button", { name: "Remove Pour-Over Set" });
    remove.focus();
    fireEvent.click(remove);

    await waitFor(() => expect(screen.queryByText("Pour-Over Set")).not.toBeInTheDocument());
    expect(screen.getByText("Canvas Tote")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("Quantity for Canvas Tote")).toHaveFocus());
  });

  it("keeps Checkout open with the empty state after the final item is removed", async () => {
    vi.stubGlobal(
      "fetch",
      createFetchMock({
        cart: () => Promise.resolve(response(200, cartWithTote)),
        cartMutation: () => Promise.resolve(response(200, emptyCart))
      })
    );
    render(<Catalog />);

    await enterCheckout();
    const remove = screen.getByRole("button", { name: "Remove Canvas Tote" });
    remove.focus();
    fireEvent.click(remove);

    const emptyHeading = await screen.findByRole("heading", { name: "Your Cart is empty.", level: 2 });
    await waitFor(() => expect(emptyHeading).toHaveFocus());
    expect(screen.getByRole("heading", { name: "Checkout", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to Market" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Products" })).not.toBeInTheDocument();
  });

  it("shows Cart errors directly in Checkout and supports Reload Cart", async () => {
    const fetchMock = createFetchMock({
      cart: () => Promise.resolve(response(200, cartWithTote)),
      cartMutation: () => Promise.resolve(response(500))
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    await enterCheckout();
    const increase = screen.getByRole("button", { name: "Increase quantity for Canvas Tote" });
    increase.focus();
    fireEvent.click(increase);

    expect(await screen.findByRole("alert")).toHaveTextContent("The Cart service failed. Try again.");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Increase quantity for Canvas Tote" })).toHaveFocus()
    );

    fireEvent.click(screen.getByRole("button", { name: "Reload Cart" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/cart", undefined));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(screen.getByLabelText("Quantity for Canvas Tote")).toHaveValue(2);
  });
});
