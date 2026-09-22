import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import CartDrawer from "./CartDrawer";
import type { CartResponse } from "./cartApi";

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

function renderDrawer(overrides: Partial<Parameters<typeof CartDrawer>[0]> = {}) {
  const onClose = vi.fn();
  const result = render(
    <CartDrawer
      isOpen={true}
      onClose={onClose}
      cart={cart}
      isPending={false}
      error={null}
      onRetry={vi.fn()}
      onUpdateQuantity={vi.fn().mockResolvedValue(undefined)}
      onRemoveItem={vi.fn().mockResolvedValue(undefined)}
      {...overrides}
    />
  );

  return { ...result, onClose };
}

describe("CartDrawer", () => {
  it("does not render a dialog when closed", () => {
    renderDrawer({ isOpen: false });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("exposes dialog semantics, focuses the heading, and counts units", () => {
    renderDrawer();

    const dialog = screen.getByRole("dialog", { name: "Your Cart" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("heading", { name: "Your Cart" })).toHaveFocus();
    expect(screen.getByText("3 items")).toBeInTheDocument();
    expect(screen.getByText("Total").parentElement).toHaveTextContent("93.50");
  });

  it("closes on Escape", () => {
    const { onClose } = renderDrawer();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on the close button and on the backdrop", () => {
    const { onClose, container } = renderDrawer();
    const backdrop = container.querySelector('[aria-hidden="true"]') as HTMLElement;

    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Close Cart" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("contains focus within the dialog", () => {
    renderDrawer();
    const dialog = screen.getByRole("dialog", { name: "Your Cart" });
    const focusable = screen.getAllByRole("button");
    const first = screen.getByRole("button", { name: "Close Cart" });
    const last = focusable[focusable.length - 1];

    last.focus();
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(first).toHaveFocus();

    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();
  });

  it("wraps Shift+Tab from the initially focused heading to the last enabled control", () => {
    renderDrawer();

    const dialog = screen.getByRole("dialog", { name: "Your Cart" });
    expect(screen.getByRole("heading", { name: "Your Cart" })).toHaveFocus();

    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });

    const enabledButtons = screen.getAllByRole("button").filter((button) => !button.hasAttribute("disabled"));
    expect(enabledButtons[enabledButtons.length - 1]).toHaveFocus();
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("keeps focus inside the dialog when the focused control becomes disabled while pending", () => {
    function PendingDrawer() {
      const [isPending, setIsPending] = useState(false);

      return (
        <CartDrawer
          isOpen={true}
          onClose={vi.fn()}
          cart={cart}
          isPending={isPending}
          error={null}
          onRetry={vi.fn()}
          onUpdateQuantity={async () => {
            setIsPending(true);
          }}
          onRemoveItem={async () => {}}
        />
      );
    }

    render(<PendingDrawer />);

    const increase = screen.getByRole("button", { name: "Increase quantity for Canvas Tote" });
    increase.focus();
    fireEvent.click(increase);

    const dialog = screen.getByRole("dialog", { name: "Your Cart" });
    expect(increase).toBeDisabled();
    expect(screen.getByRole("button", { name: "Close Cart" })).toHaveFocus();
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("renders Cart pending and error states inside the dialog", () => {
    renderDrawer({ isPending: true, error: "The Cart service failed. Try again." });

    expect(screen.getByRole("alert")).toHaveTextContent("The Cart service failed. Try again.");
    expect(screen.getByRole("button", { name: "Reload Cart" })).toBeDisabled();
    expect(screen.getByLabelText("Quantity for Canvas Tote")).toBeDisabled();
  });
});
