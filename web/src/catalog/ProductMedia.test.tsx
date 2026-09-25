import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProductMedia from "./ProductMedia";

const product = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Canvas Market Tote",
  mediaKey: null as string | null,
  uploadedMediaId: null as string | null
};

describe("ProductMedia", () => {
  it("prefers uploaded media over the curated key", () => {
    const { container } = render(
      <ProductMedia
        product={{
          ...product,
          mediaKey: "canvas-market-tote",
          uploadedMediaId: "22222222-2222-2222-2222-222222222222"
        }}
        variant="card"
      />
    );

    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      `/api/products/${product.id}/media/22222222-2222-2222-2222-222222222222`
    );
  });

  it("renders the curated local image when only a media key is set", () => {
    const { container } = render(
      <ProductMedia product={{ ...product, mediaKey: "canvas-market-tote" }} variant="card" />
    );

    expect(container.querySelector("img")).toHaveAttribute("src", "/media/canvas-market-tote.jpg");
  });

  it("renders the monogram fallback when no media is set", () => {
    const { container } = render(<ProductMedia product={product} variant="card" />);

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toBe("C");
  });

  it("renders the fallback for a well-formed key without a local asset", () => {
    const { container } = render(
      <ProductMedia product={{ ...product, mediaKey: "well-formed-but-unmapped" }} variant="detail" />
    );

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toBe("C");
  });

  it("switches to the fallback when the image fails to load", () => {
    const { container } = render(
      <ProductMedia product={{ ...product, mediaKey: "canvas-market-tote" }} variant="detail" />
    );

    fireEvent.error(container.querySelector("img") as HTMLImageElement);

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toBe("C");
  });

  it("shows a replacement image after an earlier source failed", () => {
    const { container, rerender } = render(
      <ProductMedia
        product={{ ...product, uploadedMediaId: "22222222-2222-2222-2222-222222222222" }}
        variant="card"
      />
    );

    fireEvent.error(container.querySelector("img") as HTMLImageElement);
    expect(container.querySelector("img")).toBeNull();

    rerender(
      <ProductMedia
        product={{ ...product, uploadedMediaId: "33333333-3333-3333-3333-333333333333" }}
        variant="card"
      />
    );

    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      `/api/products/${product.id}/media/33333333-3333-3333-3333-333333333333`
    );
  });

  it("renders a thumbnail with the monogram when no media exists", () => {
    const { container } = render(<ProductMedia product={product} variant="thumbnail" />);

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toBe("C");
  });

  it("uses a source override for a locally selected image", () => {
    const { container } = render(
      <ProductMedia
        product={{ ...product, mediaKey: "canvas-market-tote" }}
        variant="square"
        sourceOverride="data:image/jpeg;base64,c2VsZWN0ZWQ="
      />
    );

    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "data:image/jpeg;base64,c2VsZWN0ZWQ="
    );
  });

  it("forces the fallback when the source override is null", () => {
    const { container } = render(
      <ProductMedia
        product={{ ...product, mediaKey: "canvas-market-tote" }}
        variant="square"
        sourceOverride={null}
      />
    );

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toBe("C");
  });
});
