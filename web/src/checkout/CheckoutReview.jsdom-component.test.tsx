import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CheckoutReview from "./CheckoutReview";
import type { CartResponse } from "../cart/cartApi";

const cart: CartResponse = {
  items: [
    {
      productId: "f84c1a1d-6d7a-4c07-b40f-3c5ca66ab612",
      name: "Canvas Tote",
      quantity: 2,
      unitPrice: 12.5,
      lineSubtotal: 25
    },
    {
      productId: "6d1c6f5e-2f6e-4f5a-9c2f-0d4c8a7b1e33",
      name: "Pour-Over Set",
      quantity: 1,
      unitPrice: 68.5,
      lineSubtotal: 68.5
    }
  ],
  total: 93.5
};

function renderReview(overrides: Partial<Parameters<typeof CheckoutReview>[0]> = {}) {
  const onBack = vi.fn();
  const onUpdateQuantity = vi.fn().mockResolvedValue(undefined);
  const onRemoveItem = vi.fn().mockResolvedValue(undefined);
  const onRetry = vi.fn();
  const result = render(
    <CheckoutReview
      cart={cart}
      onBack={onBack}
      onUpdateQuantity={onUpdateQuantity}
      onRemoveItem={onRemoveItem}
      isPending={false}
      error={null}
      onRetry={onRetry}
      {...overrides}
    />
  );

  return { ...result, onBack, onUpdateQuantity, onRemoveItem, onRetry };
}

describe("CheckoutReview", () => {
  it("renders editable Cart items with server values", () => {
    renderReview();

    expect(screen.getByRole("heading", { name: "Checkout", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Items", level: 2 })).toBeInTheDocument();
    expect(screen.getByLabelText("Quantity for Canvas Tote")).toHaveValue(2);
    expect(screen.getByRole("button", { name: "Decrease quantity for Canvas Tote" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Increase quantity for Canvas Tote" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Canvas Tote" })).toBeInTheDocument();
    expect(screen.getByText("12.50 each")).toBeInTheDocument();
    expect(screen.getByText("25.00")).toBeInTheDocument();
    expect(screen.getByText("68.50 each")).toBeInTheDocument();
    expect(screen.getByText("68.50")).toBeInTheDocument();
    expect(screen.getByText("Total").parentElement).toHaveTextContent("93.50");
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
  });

  it("calls the existing Cart handlers for direct edits", () => {
    const { onUpdateQuantity, onRemoveItem } = renderReview();

    fireEvent.click(screen.getByRole("button", { name: "Increase quantity for Canvas Tote" }));
    expect(onUpdateQuantity).toHaveBeenCalledWith(cart.items[0].productId, 3);

    fireEvent.click(screen.getByRole("button", { name: "Remove Pour-Over Set" }));
    expect(onRemoveItem).toHaveBeenCalledWith(cart.items[1].productId);
  });

  it("renders the empty state without item controls", () => {
    renderReview({ cart: { items: [], total: 0 } });

    const emptyHeading = screen.getByRole("heading", { name: "Your Cart is empty.", level: 2 });
    expect(emptyHeading).toHaveAttribute("tabindex", "-1");
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Remove/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to Market" })).toBeInTheDocument();
  });

  it("shows pending state and disables conflicting controls", () => {
    renderReview({ isPending: true });

    expect(screen.getByRole("status")).toHaveTextContent("Updating Cart...");
    expect(screen.getByLabelText("Quantity for Canvas Tote")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Increase quantity for Canvas Tote" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Remove Canvas Tote" })).toBeDisabled();
  });

  it("shows Cart errors with a Reload Cart action", () => {
    const { onRetry } = renderReview({ error: "The Cart service failed. Try again." });

    expect(screen.getByRole("alert")).toHaveTextContent("The Cart service failed. Try again.");

    fireEvent.click(screen.getByRole("button", { name: "Reload Cart" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("focuses the heading on mount and supports Back to Market", () => {
    const { onBack } = renderReview();

    expect(screen.getByRole("heading", { name: "Checkout", level: 1 })).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: "Back to Market" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
