import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EmptyState, { EmptyNote, EmptyTitle, emptyActionClassName } from "./EmptyState";

describe("EmptyState", () => {
  it("renders the title, note and action inside one dashed block", () => {
    render(
      <EmptyState>
        <EmptyTitle>Nothing here.</EmptyTitle>
        <EmptyNote>Add something to start.</EmptyNote>
        <a className={emptyActionClassName} href="/add">
          Add something
        </a>
      </EmptyState>
    );

    const block = screen.getByText("Nothing here.").parentElement;
    expect(block).toHaveClass("border-dashed");
    expect(block).toContainElement(screen.getByText("Add something to start."));
    expect(screen.getByRole("link", { name: "Add something" })).toHaveAttribute("href", "/add");
  });

  it("can render the title as a heading and decorates with a hidden icon", () => {
    const { container } = render(
      <EmptyState>
        <EmptyTitle as="h2">Empty slip</EmptyTitle>
      </EmptyState>
    );

    expect(screen.getByRole("heading", { level: 2, name: "Empty slip" })).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
