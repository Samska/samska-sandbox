import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PaymentResult from "./PaymentResult";
import type { PaymentAttemptResponse } from "./paymentApi";

const attempt: PaymentAttemptResponse = {
  attemptId: "aaaaaaaa-1111-1111-1111-111111111111",
  status: "approved",
  cartRevision: 1,
  items: [
    {
      productId: "f84c1a1d-6d7a-4c07-b40f-3c5ca66ab612",
      name: "Canvas Tote",
      unitPrice: 12.5,
      quantity: 2,
      lineSubtotal: 25
    },
    {
      productId: "6d1c6f5e-2f6e-4f5a-9c2f-0d4c8a7b1e33",
      name: "Pour-Over Set",
      unitPrice: 68.5,
      quantity: 1,
      lineSubtotal: 68.5
    }
  ],
  total: 93.5
};

function renderResult(overrides: Partial<Parameters<typeof PaymentResult>[0]> = {}) {
  const onBackToCheckout = vi.fn();
  const result = render(
    <PaymentResult attempt={attempt} onBackToCheckout={onBackToCheckout} {...overrides} />
  );

  return { ...result, onBackToCheckout };
}

describe("PaymentResult", () => {
  it("presents the frozen captured items, total, and no-Order disclaimer for approval", () => {
    const { onBackToCheckout } = renderResult();

    const heading = screen.getByRole("heading", { name: "Simulated payment approved", level: 1 });
    expect(heading).toHaveFocus();
    expect(screen.getByRole("heading", { name: "Captured items", level: 2 })).toBeInTheDocument();
    expect(screen.getByText("Canvas Tote × 2")).toBeInTheDocument();
    expect(screen.getByText("25.00")).toBeInTheDocument();
    expect(screen.getByText("Pour-Over Set × 1")).toBeInTheDocument();
    expect(screen.getByText("Captured total").parentElement).toHaveTextContent("93.50");
    expect(screen.getByText(/No real payment was made/i)).toBeInTheDocument();
    expect(screen.getByText(/No Order has been created/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again with the current Cart" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back to Checkout" }));
    expect(onBackToCheckout).toHaveBeenCalledTimes(1);
  });

  it("offers a new attempt after a decline", () => {
    const { onBackToCheckout } = renderResult({
      attempt: { ...attempt, status: "declined" }
    });

    expect(screen.getByRole("heading", { name: "Simulated payment declined", level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/No payment was made for this attempt/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to Checkout" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try again with the current Cart" }));
    expect(onBackToCheckout).toHaveBeenCalledTimes(1);
  });

  it("presents a simulated failure without claiming a decision", () => {
    renderResult({ attempt: { ...attempt, status: "failed" } });

    expect(
      screen.getByRole("heading", { name: "Simulated payment could not complete", level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again with the current Cart" })).toBeInTheDocument();
    expect(screen.queryByText(/approved/i)).not.toBeInTheDocument();
  });
});
