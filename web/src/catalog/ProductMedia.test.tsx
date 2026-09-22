import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProductMedia from "./ProductMedia";

describe("ProductMedia", () => {
  it("renders the curated local image for a mapped media key", () => {
    const { container } = render(
      <ProductMedia name="Canvas Market Tote" mediaKey="canvas-market-tote" variant="card" />
    );

    expect(container.querySelector("img")).toHaveAttribute("src", "/media/canvas-market-tote.jpg");
  });

  it("renders the monogram fallback when no media key is set", () => {
    const { container } = render(
      <ProductMedia name="Linen Throw Blanket" mediaKey={null} variant="card" />
    );

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toBe("L");
  });

  it("renders the fallback for a well-formed key without a local asset", () => {
    const { container } = render(
      <ProductMedia name="Ships Anchor" mediaKey="well-formed-but-unmapped" variant="detail" />
    );

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toBe("S");
  });

  it("switches to the fallback when the image fails to load", () => {
    const { container } = render(
      <ProductMedia name="Canvas Market Tote" mediaKey="canvas-market-tote" variant="detail" />
    );

    fireEvent.error(container.querySelector("img") as HTMLImageElement);

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toBe("C");
  });
});
