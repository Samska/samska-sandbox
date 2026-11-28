import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HeaderMenu from "./HeaderMenu";

function setup() {
  render(
    <HeaderMenu label="Primary">
      <a href="/">Market</a>
      <button type="button">Sign out</button>
    </HeaderMenu>
  );
  return screen.getByRole("button", { name: "Menu" });
}

describe("HeaderMenu", () => {
  it("starts closed and toggles with the Menu button", () => {
    const button = setup();
    expect(button).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(button);
    const close = screen.getByRole("button", { name: "Close" });
    expect(close).toHaveAttribute("aria-expanded", "true");
    expect(close).toHaveAttribute("aria-controls", screen.getByRole("navigation", { name: "Primary" }).id);

    fireEvent.click(close);
    expect(screen.getByRole("button", { name: "Menu" })).toHaveAttribute("aria-expanded", "false");
  });

  it("closes with Escape and returns focus to the button", () => {
    fireEvent.click(setup());
    fireEvent.keyDown(document, { key: "Escape" });

    const button = screen.getByRole("button", { name: "Menu" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
  });

  it("keeps a single navigation with the links in it", () => {
    setup();
    expect(screen.getAllByRole("navigation", { hidden: true })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Market", hidden: true })).toBeInTheDocument();
  });
});
