import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the Catalog page and its accessible form labels", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Samska Sandbox" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Create Product" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Find Product" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Price")).toBeInTheDocument();
    expect(screen.getByLabelText("Product ID")).toBeInTheDocument();
  });
});
