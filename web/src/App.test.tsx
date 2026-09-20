import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the commerce shell and accessible Catalog tool labels", () => {
    render(<App />);

    expect(screen.getByRole("link", { name: /Samska market/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Skip to main content" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cart" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Products" })).toBeInTheDocument();
    fireEvent.click(screen.getByText("Catalog tools"));
    expect(screen.getByRole("heading", { name: "Create Product" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Find Product" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Price")).toBeInTheDocument();
    expect(screen.getByLabelText("Product ID")).toBeInTheDocument();
  });
});
