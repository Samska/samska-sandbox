import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Button from "./Button";

describe("Button", () => {
  it("defaults to a primary, 44px-tall, non-submitting control", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });

    expect(button).toHaveAttribute("type", "button");
    expect(button.className).toContain("bg-brand");
    expect(button.className).toContain("min-h-11");
  });

  it.each([
    ["primary", "bg-brand"],
    ["secondary", "bg-surface"],
    ["danger", "text-danger"],
    ["quiet", "text-muted"]
  ] as const)("renders the %s variant with the Bench shape language", (variant, token) => {
    render(<Button variant={variant}>Action</Button>);
    const button = screen.getByRole("button", { name: "Action" });

    expect(button.className).toContain(token);
    expect(button.className).toContain("font-mono");
    expect(button.className).toContain("uppercase");
    expect(button.className).toContain("border-[1.5px]");
  });

  it("gives the primary variant the hard offset shadow", () => {
    render(<Button>Primary</Button>);

    expect(screen.getByRole("button", { name: "Primary" }).className).toContain(
      "shadow-[0_3px_0_var(--color-ink)]"
    );
  });

  it("uses a compact size and keeps a 40px target", () => {
    render(<Button size="sm">Small</Button>);

    expect(screen.getByRole("button", { name: "Small" }).className).toContain("min-h-10");
  });

  it("does not fire while disabled and still fires when enabled", () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <Button onClick={onClick} disabled>
        Go
      </Button>
    );
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).not.toHaveBeenCalled();

    rerender(<Button onClick={onClick}>Go</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
