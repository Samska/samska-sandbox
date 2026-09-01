import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the frontend foundation content", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Samska Sandbox" })).toBeInTheDocument();
    expect(screen.getByText("Frontend foundation is running.")).toBeInTheDocument();
  });
});
