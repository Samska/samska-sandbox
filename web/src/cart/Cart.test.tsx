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
    expect(screen.getByText("0 items")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close Cart" })).not.toBeInTheDocument();
    expect(screen.queryByText("Total:")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back to Products" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Browse Products" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Browse Products" })).not.toBeInTheDocument();
  });

  it("updates quantity from the input and with the stepper controls", async () => {
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

    const quantityInput = screen.getByLabelText("Quantity for Canvas Tote");
    fireEvent.change(quantityInput, { target: { value: "4" } });
    fireEvent.blur(quantityInput);

    await waitFor(() => {
      expect(onUpdateQuantity).toHaveBeenCalledWith(cart.items[0].productId, 4);
    });

    fireEvent.click(screen.getByRole("button", { name: "Increase quantity for Canvas Tote" }));

    await waitFor(() => {
      expect(onUpdateQuantity).toHaveBeenLastCalledWith(cart.items[0].productId, 3);
    });

    expect(screen.getByText("2 items")).toBeInTheDocument();
  });

  it("renders a close control when a close handler is provided", () => {
    const onClose = vi.fn();
    render(
      <CartPanel
        cart={cart}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onUpdateQuantity={vi.fn()}
        onRemoveItem={vi.fn()}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Close Cart" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("removes an item with an accessible control", async () => {
    const onRemoveItem = vi.fn().mockResolvedValue(undefined);
    render(
      <CartPanel
        cart={cart}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onUpdateQuantity={vi.fn()}
        onRemoveItem={onRemoveItem}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove Canvas Tote" }));

    await waitFor(() => {
      expect(onRemoveItem).toHaveBeenCalledWith(cart.items[0].productId);
    });
  });

  it("rejects an invalid quantity locally without calling the update API", () => {
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

    const quantityInput = screen.getByLabelText("Quantity for Canvas Tote");
    fireEvent.change(quantityInput, { target: { value: "0" } });
    fireEvent.blur(quantityInput);

    expect(screen.getByText("Enter a quantity of one or greater.")).toBeInTheDocument();
    expect(onUpdateQuantity).not.toHaveBeenCalled();
  });

  it("disables decreasing the quantity below one", () => {
    const singleItemCart: CartResponse = {
      items: [{ ...cart.items[0], quantity: 1, lineSubtotal: 12.5 }],
      total: 12.5
    };
    render(
      <CartPanel
        cart={singleItemCart}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onUpdateQuantity={vi.fn()}
        onRemoveItem={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Decrease quantity for Canvas Tote" })).toBeDisabled();
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
    expect(screen.getByLabelText("Quantity for Canvas Tote")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Increase quantity for Canvas Tote" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Remove Canvas Tote" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reload Cart" })).toBeDisabled();

    expect(onRetry).not.toHaveBeenCalled();
  });

  it("exposes the Checkout action only for a non-empty Cart", () => {
    const onCheckout = vi.fn();
    const { rerender } = render(
      <CartPanel
        cart={cart}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onUpdateQuantity={vi.fn()}
        onRemoveItem={vi.fn()}
        onCheckout={onCheckout}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Checkout" }));
    expect(onCheckout).toHaveBeenCalledTimes(1);

    rerender(
      <CartPanel
        cart={{ items: [], total: 0 }}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onUpdateQuantity={vi.fn()}
        onRemoveItem={vi.fn()}
        onCheckout={onCheckout}
      />
    );

    expect(screen.queryByRole("button", { name: "Checkout" })).not.toBeInTheDocument();
  });
});
