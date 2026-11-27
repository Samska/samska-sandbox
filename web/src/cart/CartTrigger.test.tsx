import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import CartTrigger from "./CartTrigger";

describe("CartTrigger", () => {
  it("keeps the accessible name with count and total", () => {
    render(
      <CartTrigger itemCount={2} total={197} isOpen={false} onClick={() => undefined} buttonRef={createRef()} />
    );

    expect(screen.getByRole("button", { name: "Cart, 2 items, total 197.00" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("uses the singular item label and exposes the open state", () => {
    render(
      <CartTrigger itemCount={1} total={12.5} isOpen onClick={() => undefined} buttonRef={createRef()} />
    );

    const trigger = screen.getByRole("button", { name: "Cart, 1 item, total 12.50" });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("falls back to a plain name before the total is known and shows no summary", () => {
    render(
      <CartTrigger itemCount={0} total={null} isOpen={false} onClick={() => undefined} buttonRef={createRef()} />
    );

    const trigger = screen.getByRole("button", { name: "Cart" });
    expect(trigger.textContent).toBe("Cart");
  });

  it("is the signal-colored primary control and calls onClick", () => {
    const onClick = vi.fn();
    render(<CartTrigger itemCount={0} total={0} isOpen={false} onClick={onClick} buttonRef={createRef()} />);
    const trigger = screen.getByRole("button", { name: /^Cart/ });

    expect(trigger.className).toContain("bg-brand");
    expect(trigger.className).toContain("text-on-brand");
    fireEvent.click(trigger);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
