import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CartPanel from "./Cart";
import type { CartResponse } from "./cartApi";

const cart: CartResponse = {
  items: [{
    productId: "f84c1a1d-6d7a-4c07-b40f-3c5ca66ab612",
    name: "Canvas Tote",
    quantity: 2,
    unitPrice: 12.5,
    lineSubtotal: 25
  }],
  total: 25
};

describe("CartPanel", () => {
  it("renders an empty Cart", () => {
    render(
      <CartPanel
        cart={{ items: [], total: 0 }}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onUpdateQuantity={vi.fn()}
        onRemoveItem={vi.fn()}
      />
    );

    expect(screen.getByText("Your Cart is empty.")).toBeInTheDocument();
    expect(screen.queryByText("Total:")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back to Products" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Browse Products" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Browse Products" })).not.toBeInTheDocument();
  });

  it("updates quantity and removes an item with accessible controls", async () => {
    const onUpdateQuantity = vi.fn().mockResolvedValue(undefined);
    const onRemoveItem = vi.fn().mockResolvedValue(undefined);
    render(
      <CartPanel
        cart={cart}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onUpdateQuantity={onUpdateQuantity}
        onRemoveItem={onRemoveItem}
      />
    );

    fireEvent.change(screen.getByLabelText("Quantity for Canvas Tote"), { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: "Update quantity" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove Canvas Tote" }));

    await waitFor(() => {
      expect(onUpdateQuantity).toHaveBeenCalledWith(cart.items[0].productId, 4);
      expect(onRemoveItem).toHaveBeenCalledWith(cart.items[0].productId);
    });
  });

  it("rejects zero quantity locally", () => {
    const onUpdateQuantity = vi.fn().mockResolvedValue(undefined);
    render(
      <CartPanel
        cart={cart}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onUpdateQuantity={onUpdateQuantity}
        onRemoveItem={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("Quantity for Canvas Tote"), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "Update quantity" }));

    expect(screen.getByText("Enter a quantity of one or greater.")).toBeInTheDocument();
    expect(onUpdateQuantity).not.toHaveBeenCalled();
  });

  it("renders server failures and pending state", () => {
    const onRetry = vi.fn();
    render(
      <CartPanel
        cart={cart}
        isPending={true}
        error="The Cart service failed. Try again."
        onRetry={onRetry}
        onUpdateQuantity={vi.fn()}
        onRemoveItem={vi.fn()}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent("The Cart service failed. Try again.");
    expect(screen.getByRole("button", { name: "Update quantity" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reload Cart" })).toBeDisabled();

    expect(onRetry).not.toHaveBeenCalled();
  });
});
